"use client";
import { useState, useEffect, useCallback, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type {
  PublicUser,
  PublicCourse,
  Course,
  CourseDraft,
  Progress,
  UserReport,
  ApiResponses,
  VideoProgress,
} from "../lib/types";
import VideoPlayer from "./video-player";
import { courseProgress } from "../lib/course-progress";
type View = "dashboard" | "catalog" | "my" | "certificates" | "admin";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Settings,
  Search,
  ArrowUpRight,
  ArrowRight,
  Play,
  Check,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  Monitor,
  LogOut,
  ChevronLeft,
  Plus,
  Trash2,
  Menu,
  X,
  Award,
  Leaf,
} from "lucide-react";
const icons = {
  spark: Sparkles,
  digital: Monitor,
  shield: ShieldCheck,
  people: Users,
};
const categories = [
  "ทั้งหมด",
  "องค์กรและวัฒนธรรม",
  "ทักษะดิจิทัล",
  "ความปลอดภัย",
  "พัฒนาตนเอง",
];
async function api<K extends keyof ApiResponses>(
  path: K,
  method?: "GET",
): Promise<ApiResponses[K]>;
async function api(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ ok: boolean; user: PublicUser; passed: boolean; id: string }>;
async function api(path: string, method = "GET", body?: unknown) {
  const r = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}
const emptyCourse = (): CourseDraft => ({
  title: "",
  description: "",
  category: "พัฒนาตนเอง",
  instructor: "AAG+ Academy",
  color: "mint",
  lessons: [
    {
      title: "",
      content: "",
      minutes: 10,
      videoUrl: "",
      videoDurationSeconds: undefined,
    },
  ],
  quiz: { question: "", options: ["", "", ""], answer: 0 },
});
export default function Academy() {
  const [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false),
    [fallback, setFallback] = useState(false),
    [user, setUser] = useState<PublicUser | null>(null),
    [view, setView] = useState<View>("dashboard"),
    [courses, setCourses] = useState<PublicCourse[]>([]),
    [progress, setProgress] = useState<Progress[]>([]),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("ทั้งหมด"),
    [selected, setSelected] = useState<PublicCourse | null>(null),
    [lesson, setLesson] = useState(0),
    [answer, setAnswer] = useState<number | null>(null),
    [quizResult, setQuizResult] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [register, setRegister] = useState(false),
    [mobile, setMobile] = useState(false),
    [editor, setEditor] = useState<CourseDraft | null>(null),
    [adminCourses, setAdminCourses] = useState<Course[]>([]),
    [users, setUsers] = useState<UserReport[]>([]),
    [certificate, setCertificate] = useState<PublicCourse | null>(null);
  const notify = useCallback(
    (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    [],
  );
  async function refresh() {
    const [c, p] = await Promise.all([api("courses"), api("progress")]);
    setCourses(c.courses);
    setProgress(p.progress);
  }
  useEffect(() => {
    api("auth/session")
      .then(async (d) => {
        setUser(d.user);
        setDemo(d.demo);
        setFallback(d.fallback);
        if (d.user) await refresh();
      })
      .catch(notify)
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (view === "admin" && user?.role === "admin")
      Promise.all([api("admin/courses"), api("admin/report")])
        .then(([c, r]) => {
          setAdminCourses(c.courses);
          setUsers(r.users);
        })
        .catch(notify);
  }, [view, user]);
  const pFor = (id: string) => progress.find((p) => p.courseId === id);
  const videoFor = (courseId: string, lessonId: string) =>
    pFor(courseId)?.videoProgress?.find((item) => item.lessonId === lessonId);
  const updateVideoProgress = useCallback((video: VideoProgress) => {
    setProgress((current) => {
      const courseProgress = current.find(
        (item) => item.courseId === video.courseId,
      );
      if (!courseProgress)
        return [
          ...current,
          {
            userId: video.userId,
            courseId: video.courseId,
            completed: video.completed ? [video.lessonId] : [],
            videoProgress: [video],
          },
        ];
      return current.map((item) =>
        item.courseId !== video.courseId
          ? item
          : {
              ...item,
              completed: video.completed
                ? Array.from(new Set([...item.completed, video.lessonId]))
                : item.completed,
              videoProgress: [
                ...(item.videoProgress ?? []).filter(
                  (entry) => entry.lessonId !== video.lessonId,
                ),
                video,
              ],
            },
      );
    });
  }, []);
  const percent = (c: PublicCourse) => courseProgress(c, pFor(c.id)).percent;
  const finished = courses.filter(
    (c) => courseProgress(c, pFor(c.id)).complete,
  );
  const ongoing = courses.filter((c) => percent(c) > 0 && percent(c) < 100);
  const certified = finished.filter((c) => pFor(c.id)?.passed);
  const minutes = courses.reduce(
    (n, c) => n + courseProgress(c, pFor(c.id)).seconds / 60,
    0,
  );
  const searchTerm = query.trim().toLocaleLowerCase();
  const selectedCategory = category.trim() || "ทั้งหมด";
  const filtered = courses.filter(
    (c) =>
      (selectedCategory === "ทั้งหมด" || c.category === selectedCategory) &&
      (!searchTerm ||
        `${c.title} ${c.description}`.toLocaleLowerCase().includes(searchTerm)),
  );
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const d = await api(
        "auth/" + (register ? "register" : "login"),
        "POST",
        b,
      );
      setUser(d.user);
      await refresh();
      window.scrollTo({ top: 0 });
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  function navigate(v: View) {
    window.scrollTo({ top: 0 });
    setView(v);
    setSelected(null);
    setEditor(null);
    setMobile(false);
    setQuery("");
    setError("");
  }
  function openCourse(c: PublicCourse) {
    window.scrollTo({ top: 0 });
    setSelected(c);
    setLesson(
      Math.max(
        0,
        c.lessons.findIndex((l) => !pFor(c.id)?.completed?.includes(l.id)),
      ),
    );
    setAnswer(null);
    setQuizResult("");
    setError("");
  }
  async function complete() {
    if (!selected) return;
    setBusy(true);
    try {
      await api("progress", "POST", {
        courseId: selected.id,
        lessonId: selected.lessons[lesson].id,
      });
      await refresh();
      if (lesson < selected.lessons.length - 1) setLesson(lesson + 1);
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  async function submitQuiz() {
    if (!selected) return;
    setBusy(true);
    try {
      const d = await api("quiz", "POST", { courseId: selected.id, answer });
      setQuizResult(
        d.passed
          ? "ผ่านแบบทดสอบแล้ว! ใบประกาศนียบัตรของคุณพร้อมแล้ว"
          : "ยังไม่ถูกต้อง ลองทบทวนบทเรียนแล้วตอบอีกครั้ง",
      );
      await refresh();
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  async function saveCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      await api("admin/courses", editor.id ? "PUT" : "POST", editor);
      await refresh();
      setAdminCourses((await api("admin/courses")).courses);
      setEditor(null);
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  async function removeCourse(c: Course) {
    if (!window.confirm("ลบคอร์ส “" + c.title + "” หรือไม่?")) return;
    setBusy(true);
    try {
      await api("admin/courses/" + c.id, "DELETE");
      await refresh();
      setAdminCourses((await api("admin/courses")).courses);
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  function exportReport() {
    const rows = [
      ["ชื่อ", "อีเมล", "สิทธิ์", "คอร์สที่ผ่าน"],
      ...users.map((u) => [
        u.name,
        u.email,
        u.role,
        u.progress.filter(
          (p) => p.passed && courses.some((c) => c.id === p.courseId),
        ).length,
      ]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map(
              (x) =>
                '"' +
                String(x)
                  .replace(/^[=+@-]/, "'")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "aag-learning-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function Card({ course: c }: { course: PublicCourse }) {
    const Icon = icons[c.icon] || BookOpen;
    return (
      <article className="course-card">
        <button
          className={"course-art " + c.color}
          onClick={() => openCourse(c)}
          aria-label={"เปิดคอร์ส " + c.title}
        >
          <span className="art-kicker">AAG+ ACADEMY</span>
          <div className="art-orbit">
            <Icon size={55} strokeWidth={1.1} />
          </div>
          <span className="art-caption">{c.subtitle}</span>
          <span className="art-arrow">
            <ArrowUpRight size={18} />
          </span>
        </button>
        <div className="course-body">
          <div className="course-meta">
            <span>{c.category}</span>
            <span>• {c.level}</span>
          </div>
          <button className="title-button" onClick={() => openCourse(c)}>
            {c.title}
          </button>
          <p className="instructor">{c.instructor}</p>
          <div className="course-bottom">
            <span>
              <Clock size={14} />
              {c.duration} นาที
            </span>
            <span>
              <BookOpen size={14} />
              {c.lessons.length} บทเรียน
            </span>
          </div>
          {(percent(c) > 0 || c.lessons.some((l) => l.videoUrl)) && (
            <div className="card-progress">
              <div className="progress">
                <i style={{ width: percent(c) + "%" }} />
              </div>
              <small>
                {percent(c) === 100
                  ? "เรียนสำเร็จ"
                  : "เรียนแล้ว " + percent(c) + "%"}
                {c.lessons.some((l) => l.videoUrl) && " · บทเรียนวิดีโอ"}
              </small>
            </div>
          )}
        </div>
      </article>
    );
  }
  if (!ready)
    return (
      <div className="loading">
        <span className="brand">
          AAG<span>+</span>
        </span>
        <p>กำลังเตรียมพื้นที่เรียนรู้ของคุณ…</p>
      </div>
    );
  if (!user)
    return (
      <main className="login-screen">
        <section className="login-story">
          <div className="brand light">
            AAG<span>+</span>
            <small>LEARNING</small>
          </div>
          <div>
            <span className="eyebrow">
              A LITTLE LEARNING. A BIG DIFFERENCE.
            </span>
            <h1>
              พื้นที่เล็ก ๆ<br />
              เพื่อการเติบโต
              <br />
              <em>ที่ยิ่งใหญ่ของคุณ.</em>
            </h1>
            <p>
              เติมความรู้ สร้างทักษะ และก้าวไปข้างหน้า
              <br />
              ด้วยกันกับ AAG+
            </p>
          </div>
          <span className="story-footer">
            GROW TOGETHER, GO FURTHER. <ArrowUpRight />
          </span>
        </section>
        <section className="login-form">
          <div className="login-box">
            <span className="pill">
              <Leaf size={14} /> YOUR NEXT CHAPTER
            </span>
            <h2>{register ? "เริ่มต้นเส้นทางใหม่" : "ยินดีต้อนรับกลับมา"}</h2>
            <p className="muted">
              {register
                ? "สร้างบัญชีเพื่อเริ่มต้นเรียนรู้กับเรา"
                : "เข้าสู่ระบบเพื่อเรียนรู้และพัฒนาทักษะของคุณ"}
            </p>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={login}>
              {register && (
                <label>
                  ชื่อ-นามสกุล
                  <input
                    name="name"
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                อีเมล
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                รหัสผ่าน
                <input
                  name="password"
                  type="password"
                  required
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                />
              </label>
              <button className="primary wide" disabled={busy}>
                {busy
                  ? "กำลังดำเนินการ…"
                  : register
                    ? "สร้างบัญชี"
                    : "เข้าสู่ระบบ"}
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="switch-auth">
              {register ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
              <button
                onClick={() => {
                  setRegister(!register);
                  setError("");
                }}
              >
                {register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </button>
            </p>
            {demo && (
              <div className="demo-box">
                <b>
                  {fallback
                    ? "ฐานข้อมูลไม่พร้อม · ใช้ข้อมูลสาธิตชั่วคราว"
                    : "โหมดสาธิต · ข้อมูลรีเซ็ตเมื่อรีสตาร์ต"}
                </b>
                <p>
                  ผู้เรียน: learner@aag.demo / Learn@12345
                  <br />
                  ผู้ดูแล: admin@aag.demo / Admin@12345
                  {fallback && (
                    <>
                      <br />
                      ความคืบหน้าชั่วคราวจะไม่บันทึกลงฐานข้อมูลจริง
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          <small className="login-footer">
            © {new Date().getFullYear()} AAG+ Learning. เติบโตไปด้วยกันทุกวัน
          </small>
        </section>
      </main>
    );
  const nav: [View, LucideIcon, string][] = [
    ["dashboard", LayoutDashboard, "ภาพรวมของฉัน"],
    ["catalog", BookOpen, "สำรวจคอร์สเรียน"],
    ["my", GraduationCap, "การเรียนรู้ของฉัน"],
    ["certificates", Award, "ใบประกาศนียบัตร"],
    ...(user.role === "admin"
      ? [["admin", Settings, "จัดการระบบ"] as [View, LucideIcon, string]]
      : []),
  ];
  return (
    <div className="app">
      <aside className={"sidebar " + (mobile ? "opened" : "")}>
        <a className="brand" href="/">
          AAG<span>+</span>
          <small>LEARNING</small>
        </a>
        <div className="workspace-tag">
          <span />
          พื้นที่เรียนรู้สำหรับพนักงาน
        </div>
        <p className="nav-caption">YOUR LEARNING SPACE</p>
        <nav>
          {nav.map(([key, Icon, title]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              {title}
              {key === "catalog" && (
                <span className="nav-count">{courses.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-note">
            <Sparkles size={24} />
            <b>เก่งขึ้นอีกนิด ในทุกวัน</b>
            <p>
              ทุกการเรียนรู้ คืออีกก้าว
              <br />
              ของการเติบโต
            </p>
            <span>LET’S GROW TOGETHER ↗</span>
          </div>
          <button
            className="profile"
            onClick={async () => {
              try {
                await api("auth/logout", "POST");
                setUser(null);
                setCourses([]);
                setProgress([]);
                setFallback(false);
                setView("dashboard");
              } catch (e) {
                notify(e);
              }
            }}
          >
            <span className="avatar">{user.name.charAt(0)}</span>
            <span>
              <b>{user.name}</b>
              <small>
                {user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก AAG+"}
              </small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="ปิดเมนู"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="เปิดเมนู"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            พื้นที่การเรียนรู้ <span>/</span>{" "}
            <b>
              {selected ? "ห้องเรียน" : nav.find((n) => n[0] === view)?.[2]}
            </b>
          </div>
          <div className="top-right">
            {demo && (
              <span className="demo-label">
                {fallback ? "TEMP DEMO" : "DEMO"}
              </span>
            )}
            <span className="today">AAG+ Academy</span>
            <span className="avatar small">{user.name.charAt(0)}</span>
          </div>
        </header>
        <main className="content">
          {fallback && (
            <div className="error" role="status">
              ฐานข้อมูลยังเชื่อมต่อไม่ได้
              กำลังแสดงคอร์สตัวอย่างและข้อมูลในหน่วยความจำชั่วคราว
              ข้อมูลที่เปลี่ยนแปลงจะไม่ถูกบันทึกถาวร
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button aria-label="ปิดข้อความ" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {selected ? (
            <>
              <button className="back" onClick={() => setSelected(null)}>
                <ChevronLeft size={17} />
                กลับไปหน้าคอร์ส
              </button>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR CLASSROOM</span>
                  <h1>{selected.title}</h1>
                  <p>
                    {selected.instructor} · {selected.duration} นาที
                  </p>
                </div>
              </div>
              <div className="classroom">
                <section className="lesson-panel">
                  <div className="lesson-number">
                    บทที่ {lesson + 1} จาก {selected.lessons.length}
                  </div>
                  <h2>{selected.lessons[lesson].title}</h2>
                  {selected.lessons[lesson].videoUrl && (
                    <VideoPlayer
                      key={selected.lessons[lesson].id}
                      courseId={selected.id}
                      lessonId={selected.lessons[lesson].id}
                      src={selected.lessons[lesson].videoUrl || ""}
                      durationSeconds={
                        selected.lessons[lesson].videoDurationSeconds ??
                        selected.lessons[lesson].minutes * 60
                      }
                      initialProgress={videoFor(
                        selected.id,
                        selected.lessons[lesson].id,
                      )}
                      onProgress={updateVideoProgress}
                      onError={notify}
                    />
                  )}
                  <div className="lesson-content">
                    {selected.lessons[lesson].content}
                  </div>
                  <button
                    disabled={
                      busy ||
                      (!!selected.lessons[lesson].videoUrl &&
                        !videoFor(selected.id, selected.lessons[lesson].id)
                          ?.completed)
                    }
                    className="primary"
                    onClick={complete}
                  >
                    <Check size={17} />
                    {pFor(selected.id)?.completed?.includes(
                      selected.lessons[lesson].id,
                    )
                      ? "เรียนบทนี้แล้ว · ไปต่อ"
                      : selected.lessons[lesson].videoUrl &&
                          !videoFor(selected.id, selected.lessons[lesson].id)
                            ?.completed
                        ? "ดูวิดีโอให้ครบก่อนเรียนจบบทนี้"
                        : "ทำเครื่องหมายว่าเรียนจบ"}
                  </button>
                </section>
                <aside className="lesson-list">
                  <h3>เนื้อหาในคอร์ส</h3>
                  <div className="progress">
                    <i style={{ width: percent(selected) + "%" }} />
                  </div>
                  <p className="muted">
                    {percent(selected) === 100
                      ? "เรียนสำเร็จ · 100%"
                      : `เรียนแล้ว ${percent(selected)}%`}
                  </p>
                  {selected.lessons.map((l, i) => (
                    <button
                      key={l.id}
                      className={lesson === i ? "selected" : ""}
                      onClick={() => setLesson(i)}
                    >
                      <span>
                        {pFor(selected.id)?.completed?.includes(l.id) ? (
                          <Check size={16} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        {l.title}
                        <small>
                          {l.minutes} นาที
                          {l.videoUrl
                            ? ` · วิดีโอ ${Math.min(100, Math.floor(((videoFor(selected.id, l.id)?.maxWatchedTime ?? 0) / (l.videoDurationSeconds ?? l.minutes * 60)) * 100))}%`
                            : ""}
                        </small>
                      </div>
                    </button>
                  ))}
                </aside>
              </div>
              <section className="quiz-panel">
                <span className="eyebrow">KNOWLEDGE CHECK</span>
                <h2>ทบทวนสิ่งที่ได้เรียนรู้</h2>
                {percent(selected) < 100 ? (
                  <p className="muted">
                    เรียนให้ครบทุกบทเพื่อปลดล็อกแบบทดสอบและรับใบประกาศนียบัตร
                  </p>
                ) : (
                  <>
                    <h3>{selected.quiz.question}</h3>
                    {selected.quiz.options.map((o, i) => (
                      <label className="quiz-option" key={i}>
                        <input
                          type="radio"
                          name="answer"
                          checked={answer === i}
                          onChange={() => setAnswer(i)}
                        />
                        {o}
                      </label>
                    ))}
                    <button
                      className="primary"
                      onClick={submitQuiz}
                      disabled={answer === null || busy}
                    >
                      ส่งคำตอบ
                      <ArrowRight size={17} />
                    </button>
                    {quizResult && (
                      <p role="status" className="quiz-result">
                        {quizResult}
                      </p>
                    )}
                  </>
                )}
              </section>
            </>
          ) : view === "admin" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">ADMINISTRATION</span>
                  <h1>จัดการการเรียนรู้</h1>
                  <p>ดูแลคอร์สและติดตามการเติบโตของทีม</p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor(emptyCourse())}
                >
                  <Plus size={18} />
                  สร้างคอร์ส
                </button>
              </div>
              {editor ? (
                <section className="admin-panel">
                  <div className="section-heading">
                    <h2>{editor.id ? "แก้ไขคอร์ส" : "สร้างคอร์สใหม่"}</h2>
                    <button
                      className="text-button"
                      onClick={() => setEditor(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <form onSubmit={saveCourse} className="editor">
                    <label>
                      ชื่อคอร์ส
                      <input
                        required
                        minLength={3}
                        maxLength={150}
                        value={editor.title}
                        onChange={(e) =>
                          setEditor({ ...editor, title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      คำอธิบาย
                      <textarea
                        required
                        value={editor.description}
                        onChange={(e) =>
                          setEditor({ ...editor, description: e.target.value })
                        }
                      />
                    </label>
                    <div className="form-row">
                      <label>
                        หมวดหมู่
                        <select
                          value={editor.category}
                          onChange={(e) =>
                            setEditor({ ...editor, category: e.target.value })
                          }
                        >
                          {categories.slice(1).map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        ผู้สอน
                        <input
                          required
                          value={editor.instructor}
                          onChange={(e) =>
                            setEditor({ ...editor, instructor: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        สีปก
                        <select
                          value={editor.color}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              color: e.target.value as CourseDraft["color"],
                            })
                          }
                        >
                          <option value="mint">เขียว</option>
                          <option value="peach">ส้ม</option>
                          <option value="lavender">ม่วง</option>
                          <option value="blue">ฟ้า</option>
                        </select>
                      </label>
                    </div>
                    {editor.lessons.map((l, i) => (
                      <fieldset key={i}>
                        <legend>บทเรียนที่ {i + 1}</legend>
                        <label>
                          ชื่อบทเรียน
                          <input
                            required
                            value={l.title}
                            onChange={(e) =>
                              setEditor({
                                ...editor,
                                lessons: editor.lessons.map((x, j) =>
                                  i === j ? { ...x, title: e.target.value } : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          เนื้อหา
                          <textarea
                            required
                            rows={5}
                            value={l.content}
                            onChange={(e) =>
                              setEditor({
                                ...editor,
                                lessons: editor.lessons.map((x, j) =>
                                  i === j
                                    ? { ...x, content: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <div className="form-row">
                          <label>
                            เวลา (นาที)
                            <input
                              required
                              type="number"
                              min={1}
                              max={600}
                              value={l.minutes}
                              onChange={(e) =>
                                setEditor({
                                  ...editor,
                                  lessons: editor.lessons.map((x, j) =>
                                    i === j
                                      ? {
                                          ...x,
                                          minutes: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            วิดีโอ MP4/WebM (ลิงก์ HTTPS หรือ /videos/)
                            <input
                              type="text"
                              placeholder="https://example.com/lesson.mp4"
                              value={l.videoUrl || ""}
                              onChange={(e) =>
                                setEditor({
                                  ...editor,
                                  lessons: editor.lessons.map((x, j) =>
                                    i === j
                                      ? { ...x, videoUrl: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                        </div>
                        {l.videoUrl && (
                          <label>
                            ความยาววิดีโอ (วินาที)
                            <input
                              required
                              type="number"
                              min={1}
                              max={86400}
                              step={1}
                              value={l.videoDurationSeconds ?? ""}
                              onChange={(e) =>
                                setEditor({
                                  ...editor,
                                  lessons: editor.lessons.map((x, j) =>
                                    i === j
                                      ? {
                                          ...x,
                                          videoDurationSeconds: Number(
                                            e.target.value,
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                        )}
                        {editor.lessons.length > 1 && (
                          <button
                            type="button"
                            className="text-button danger"
                            onClick={() =>
                              setEditor({
                                ...editor,
                                lessons: editor.lessons.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                          >
                            ลบบทเรียน
                          </button>
                        )}
                      </fieldset>
                    ))}
                    <button
                      className="secondary"
                      type="button"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          lessons: [
                            ...editor.lessons,
                            {
                              title: "",
                              content: "",
                              minutes: 10,
                              videoUrl: "",
                            },
                          ],
                        })
                      }
                    >
                      <Plus size={16} />
                      เพิ่มบทเรียน
                    </button>
                    <fieldset>
                      <legend>แบบทดสอบท้ายคอร์ส</legend>
                      <label>
                        คำถาม
                        <input
                          required
                          value={editor.quiz.question}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              quiz: {
                                ...editor.quiz,
                                question: e.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      {editor.quiz.options.map((o, i) => (
                        <label key={i}>
                          ตัวเลือก {i + 1}
                          <input
                            required
                            value={o}
                            onChange={(e) =>
                              setEditor({
                                ...editor,
                                quiz: {
                                  ...editor.quiz,
                                  options: editor.quiz.options.map((x, j) =>
                                    i === j ? e.target.value : x,
                                  ),
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                      <label>
                        คำตอบที่ถูกต้อง
                        <select
                          value={editor.quiz.answer}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              quiz: {
                                ...editor.quiz,
                                answer: Number(e.target.value),
                              },
                            })
                          }
                        >
                          {[0, 1, 2].map((i) => (
                            <option key={i} value={i}>
                              ตัวเลือก {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    </fieldset>
                    <p className="muted">
                      เมื่อเปลี่ยนเนื้อหาเดิม
                      ควรสร้างคอร์สใหม่หากต้องการให้ผู้เรียนเริ่มเก็บผลใหม่
                    </p>
                    <button className="primary" disabled={busy}>
                      {busy ? "กำลังบันทึก…" : "บันทึกคอร์ส"}
                    </button>
                  </form>
                </section>
              ) : (
                <section className="admin-panel">
                  <h2>คอร์สทั้งหมด ({adminCourses.length})</h2>
                  {adminCourses.map((c) => (
                    <div className="admin-row" key={c.id}>
                      <div>
                        <b>{c.title}</b>
                        <small>
                          {c.lessons.length} บทเรียน · {c.category}
                        </small>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => setEditor(structuredClone(c))}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={"ลบ " + c.title}
                        disabled={busy}
                        onClick={() => removeCourse(c)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <section className="admin-panel">
                <div className="section-heading">
                  <h2>รายงานผู้เรียน</h2>
                  <button className="secondary" onClick={exportReport}>
                    ส่งออก CSV
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ชื่อ / อีเมล</th>
                        <th>สิทธิ์</th>
                        <th>คอร์สที่ผ่าน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            {u.name}
                            <small>{u.email}</small>
                          </td>
                          <td>{u.role === "admin" ? "ผู้ดูแล" : "ผู้เรียน"}</td>
                          <td>
                            {
                              u.progress.filter(
                                (p) =>
                                  p.passed &&
                                  courses.some((c) => c.id === p.courseId),
                              ).length
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : view === "certificates" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">CELEBRATE YOUR GROWTH</span>
                  <h1>ทุกความสำเร็จ มีความหมาย</h1>
                  <p>ใบประกาศนียบัตรจากคอร์สที่คุณเรียนจบและผ่านแบบทดสอบ</p>
                </div>
              </div>
              {certified.length ? (
                <div className="course-grid">
                  {certified.map((c) => (
                    <article className="certificate-card" key={c.id}>
                      <Award size={46} />
                      <span>COMPLETED WITH AAG+</span>
                      <h2>{c.title}</h2>
                      <p>{user.name}</p>
                      <button
                        className="secondary"
                        onClick={() => setCertificate(c)}
                      >
                        ดูใบประกาศนียบัตร
                        <ArrowUpRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <Award size={42} />
                  <h2>ความสำเร็จครั้งต่อไป รอคุณอยู่</h2>
                  <p>เรียนให้ครบและผ่านแบบทดสอบเพื่อรับใบประกาศนียบัตร</p>
                  <button
                    className="primary"
                    onClick={() => navigate("catalog")}
                  >
                    เริ่มเรียนรู้
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {view === "dashboard" ? (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">MAKE ROOM FOR GROWTH</div>
                      <h1>
                        สวัสดี, {user.name.split(" ")[0]}{" "}
                        <span className="wave">✦</span>
                      </h1>
                      <p>วันนี้เป็นวันที่ดี ที่จะเรียนรู้สิ่งใหม่ ๆ</p>
                    </div>
                    <span className="welcome-stamp">
                      <span />
                      เติบโตไปด้วยกันทุกวัน
                    </span>
                  </div>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-label">
                        <span /> AAG+ LEARNING EXPERIENCE
                      </span>
                      <h2>
                        เติมทักษะให้วันนี้
                        <br />
                        <em>ต่อยอดโอกาสในวันหน้า.</em>
                      </h2>
                      <p>
                        ค้นพบความรู้ที่ใช่ ในจังหวะการเรียนรู้ของคุณ
                        <br />
                        เพราะการเติบโตของคุณ คือการเติบโตของเรา
                      </p>
                      <button onClick={() => navigate("catalog")}>
                        สำรวจคอร์สเรียน
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <div className="art-leaf leaf-one" />
                      <div className="art-leaf leaf-two" />
                      <div className="art-leaf leaf-three" />
                      <div className="hero-plus">+</div>
                      <span className="hero-float">
                        <Sparkles size={17} /> NEVER STOP GROWING
                      </span>
                      <span className="art-numeral">aag</span>
                    </div>
                  </section>
                  <div className="stats">
                    <div>
                      <span className="stat-icon green">
                        <BookOpen />
                      </span>
                      <div>
                        <p>กำลังเรียน</p>
                        <b>
                          {ongoing.length}
                          <small> คอร์ส</small>
                        </b>
                      </div>
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <span className="stat-icon orange">
                        <Check />
                      </span>
                      <div>
                        <p>เรียนสำเร็จแล้ว</p>
                        <b>
                          {finished.length}
                          <small> คอร์ส</small>
                        </b>
                      </div>
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <span className="stat-icon violet">
                        <Clock />
                      </span>
                      <div>
                        <p>เวลาที่ใช้เรียนรู้</p>
                        <b>
                          {Math.floor(minutes)}
                          <small> นาที</small>
                        </b>
                      </div>
                      <span className="stat-note">KEEP IT UP ↗</span>
                    </div>
                  </div>
                  {ongoing.length > 0 && (
                    <section className="continue">
                      <div>
                        <span className="eyebrow">
                          PICK UP WHERE YOU LEFT OFF
                        </span>
                        <h3>{ongoing[0].title}</h3>
                        <div className="progress">
                          <i style={{ width: percent(ongoing[0]) + "%" }} />
                        </div>
                      </div>
                      <button
                        className="primary"
                        onClick={() => openCourse(ongoing[0])}
                      >
                        <Play size={16} />
                        เรียนต่อ
                      </button>
                    </section>
                  )}
                </>
              ) : (
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">
                      {view === "my"
                        ? "YOUR PERSONAL JOURNEY"
                        : "EXPLORE. LEARN. GROW."}
                    </span>
                    <h1>
                      {view === "my"
                        ? "เส้นทางการเรียนรู้ของฉัน"
                        : "ค้นพบทักษะใหม่ที่ใช่คุณ"}
                    </h1>
                    <p>
                      {view === "my"
                        ? "กลับมาเรียนต่อ และติดตามทุกก้าวของคุณ"
                        : "เลือกเติมความรู้ให้ตรงกับเป้าหมายของคุณ"}
                    </p>
                  </div>
                </div>
              )}
              <section className="catalog-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {view === "dashboard"
                        ? "คอร์สแนะนำสำหรับคุณ"
                        : view === "my"
                          ? "คอร์สของฉัน"
                          : "คอร์สเรียนทั้งหมด"}
                      <span className="count">
                        {view === "my"
                          ? courses.filter((c) => percent(c) > 0).length
                          : courses.length}
                      </span>
                    </h2>
                    {view === "dashboard" && (
                      <p className="muted">
                        เติมความรู้รอบด้าน พร้อมสำหรับทุกโอกาส
                      </p>
                    )}
                  </div>
                  {view === "dashboard" ? (
                    <button
                      className="text-button"
                      onClick={() => navigate("catalog")}
                    >
                      ดูคอร์สทั้งหมด
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="ค้นหาคอร์ส"
                        placeholder="ค้นหาคอร์สเรียน…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  )}
                </div>
                <div className="filters">
                  {categories.map((c) => (
                    <button
                      className={category === c ? "selected" : ""}
                      key={c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="course-grid">
                  {filtered
                    .filter((c) => view !== "my" || percent(c) > 0)
                    .map((c) => (
                      <Card key={c.id} course={c} />
                    ))}
                </div>
                {!filtered.filter((c) => view !== "my" || percent(c) > 0)
                  .length && (
                  <div className="empty">
                    <BookOpen size={35} />
                    <h3>
                      {view === "my"
                        ? "ยังไม่มีคอร์สที่เริ่มเรียน"
                        : "ไม่พบคอร์สที่ตรงกับการค้นหา"}
                    </h3>
                    <button
                      className="secondary"
                      onClick={() => {
                        setCategory("ทั้งหมด");
                        setQuery("");
                        if (view === "my") navigate("catalog");
                      }}
                    >
                      สำรวจคอร์สทั้งหมด
                    </button>
                  </div>
                )}
              </section>
              <div className="bottom-banner">
                <span className="banner-icon">
                  <Leaf />
                </span>
                <div>
                  <b>การเรียนรู้ไม่มีเส้นชัย มีแต่ก้าวต่อไป</b>
                  <p>เลือกเรียนวันละนิด แล้วคุณจะเห็นการเปลี่ยนแปลง</p>
                </div>
                <span>
                  GROW AT YOUR OWN PACE <ArrowUpRight size={18} />
                </span>
              </div>
            </>
          )}
          <footer>
            AAG+ LEARNING <span>สร้างโอกาสใหม่ ด้วยการเรียนรู้ไม่สิ้นสุด</span>
            <small>© {new Date().getFullYear()} AAG+</small>
          </footer>
        </main>
      </div>
      {certificate && (
        <div className="modal-backdrop">
          <div className="certificate-modal">
            <div className="modal-actions">
              <button className="secondary" onClick={() => window.print()}>
                พิมพ์ / บันทึก PDF
              </button>
              <button
                className="icon-button"
                aria-label="ปิด"
                onClick={() => setCertificate(null)}
              >
                <X />
              </button>
            </div>
            <div className="certificate-paper">
              <span className="brand">
                AAG<span>+</span>
              </span>
              <Award size={65} />
              <p className="eyebrow">CERTIFICATE OF COMPLETION</p>
              <h2>ใบประกาศนียบัตร</h2>
              <p>ขอมอบให้แก่</p>
              <h1>{user.name}</h1>
              <p>เพื่อแสดงว่าได้เรียนจบและผ่านแบบทดสอบในหลักสูตร</p>
              <h2>{certificate.title}</h2>
              <p>
                {new Date(
                  pFor(certificate.id)?.completedAt ?? Date.now(),
                ).toLocaleDateString("th-TH", { dateStyle: "long" })}
              </p>
              <span>AAG+ ACADEMY · LEARNING & DEVELOPMENT</span>
              {demo && <small>เอกสารตัวอย่างจากโหมดสาธิต</small>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
