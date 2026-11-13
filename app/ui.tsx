"use client";
import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Settings,
  FolderKanban,
  Award,
  X,
} from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type Course,
  type CourseDraft,
  type Progress,
  type UserReport,
  type ApiResponses,
  type VideoProgress,
  type Role,
  type View,
  type Company,
  getRoleLabel,
  normalizeRole,
  canManageCourses,
  isAdminRole,
  sortCoursesLatestFirst,
} from "../lib/types";
import { CompanyProvider, useCompany } from "../lib/company-context";
import { courseProgress } from "../lib/course-progress";
import { formatLessonTitle } from "../lib/lesson-format";
import Navbar from "../components/layout/Navbar";
import Sidebar, { type NavItem } from "../components/layout/Sidebar";
import DashboardView from "../components/views/DashboardView";
import MyCoursesView from "../components/views/MyCoursesView";
import CatalogView from "../components/views/CatalogView";
import AdminView from "../components/views/AdminView";
import CertificatesView from "../components/views/CertificatesView";
import ClassroomView from "../components/views/ClassroomView";
import LoginView from "../components/views/LoginView";
import CertificateModal from "../components/modals/CertificateModal";
import CourseAccessModal from "../components/modals/CourseAccessModal";

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
  if (r.status === 401 && path !== "auth/session" && path !== "auth/login") {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    throw Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  }
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}

async function uploadVideoFile(
  file: File,
): Promise<{ ok: boolean; url: string; filename: string }> {
  const formData = new FormData();
  formData.append("video", file);
  const r = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "อัปโหลดวิดีโอไม่สำเร็จ");
  return data;
}

async function uploadCoverImage(
  file: File,
): Promise<{ ok: boolean; url: string; filename: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const r = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");
  return data;
}

function detectVideoDuration(fileOrUrl: File | string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url =
      typeof fileOrUrl === "string"
        ? fileOrUrl
        : URL.createObjectURL(fileOrUrl);
    const cleanUp = () => {
      if (typeof fileOrUrl !== "string") {
        try {
          URL.revokeObjectURL(url);
        } catch { }
      }
    };
    video.onloadedmetadata = () => {
      const dur = Math.round(video.duration);
      cleanUp();
      resolve(Number.isFinite(dur) && dur > 0 ? dur : 0);
    };
    video.onerror = () => {
      cleanUp();
      resolve(0);
    };
    setTimeout(() => {
      cleanUp();
      resolve(0);
    }, 6000);
    video.src = url;
  });
}

const emptyCourse = (company: Company = "AGE"): CourseDraft => ({
  title: "",
  description: "",
  category:
    company === "AAG+"
      ? "ผลิตภัณฑ์ยานยนต์"
      : company === "ABM"
        ? "ผลิตภัณฑ์ชีวมวล"
        : "ความปลอดภัย",
  company,
  thumbnail:
    company === "ABM"
      ? "/images/courses/abm-biomass.jpg"
      : company === "AAG+"
        ? "/images/courses/aag-zeekr.jpg"
        : "/images/courses/age-safety.jpg",
  instructor:
    company === "ABM"
      ? "ABM Academy"
      : company === "AAG+"
        ? "AAG+ Academy"
        : "AGE Group Academy",
  color: "mint",
  targetRole: "all",
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
  const [user, setUser] = useState<PublicUser | null>(null);

  return (
    <CompanyProvider user={user}>
      <AcademyContent user={user} setUser={setUser} />
    </CompanyProvider>
  );
}

function AcademyContent({
  user,
  setUser,
}: {
  user: PublicUser | null;
  setUser: (u: PublicUser | null) => void;
}) {
  const { activeCompany, companyInfo } = useCompany();
  const [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false),
    [fallback, setFallback] = useState(false),
    [dbError, setDbError] = useState<string | null>(null),
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
    [mobile, setMobile] = useState(false),
    [editor, setEditor] = useState<CourseDraft | null>(null),
    [uploadingIndex, setUploadingIndex] = useState<number | null>(null),
    [uploadStatus, setUploadStatus] = useState<string>(""),
    [adminCourses, setAdminCourses] = useState<Course[]>([]),
    [users, setUsers] = useState<UserReport[]>([]),
    [showAddUser, setShowAddUser] = useState(false),
    [newUserName, setNewUserName] = useState(""),
    [newUserEmail, setNewUserEmail] = useState(""),
    [newUserPassword, setNewUserPassword] = useState(""),
    [newUserRole, setNewUserRole] = useState<Role>("employee"),
    [managingUserCourses, setManagingUserCourses] =
      useState<UserReport | null>(null),
    [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]),
    [syncingUsers, setSyncingUsers] = useState(false),
    [syncStatus, setSyncStatus] = useState(""),
    [userSearchQuery, setUserSearchQuery] = useState(""),
    [userRoleFilter, setUserRoleFilter] = useState<"all" | Role>("all"),
    [otpStep, setOtpStep] = useState<"email" | "otp">("email"),
    [otpEmail, setOtpEmail] = useState(""),
    [otpCode, setOtpCode] = useState(""),
    [otpResendCountdown, setOtpResendCountdown] = useState(0),
    [otpExpireCountdown, setOtpExpireCountdown] = useState(0),
    [otpInfoMessage, setOtpInfoMessage] = useState(""),
    [adminPasswordMode, setAdminPasswordMode] = useState(false),
    [certificate, setCertificate] = useState<PublicCourse | null>(null);

  const notify = useCallback(
    (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    [],
  );

  const refresh = useCallback(
    async (comp: Company = activeCompany) => {
      const coursesPath = comp ? `courses?company=${comp}` : "courses";
      const [c, p] = await Promise.all([
        api(coursesPath as "courses"),
        api("progress"),
      ]);
      setCourses(c.courses);
      setProgress(p.progress);
    },
    [activeCompany],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, "", window.location.pathname);
    }
    api("auth/session")
      .then(async (d) => {
        setUser(d.user);
        setDemo(d.demo);
        setFallback(d.fallback);
        if (d.dbError) setDbError(d.dbError);
        if (d.user) await refresh(activeCompany);
      })
      .catch(notify)
      .finally(() => setReady(true));
  }, [notify, refresh, activeCompany, setUser]);

  useEffect(() => {
    if (user && ready) {
      setSelected(null);
      setCategory("ทั้งหมด");
      refresh(activeCompany).catch(notify);
    }
  }, [activeCompany, user, ready, refresh, notify]);

  useEffect(() => {
    if (view === "admin" && user && canManageCourses(user.role)) {
      const adminPath = activeCompany
        ? `admin/courses?company=${activeCompany}`
        : "admin/courses";
      Promise.all([api(adminPath as "admin/courses"), api("admin/report")])
        .then(([c, r]) => {
          setAdminCourses(c.courses);
          setUsers(r.users);
        })
        .catch(notify);
    }
  }, [view, user, activeCompany, notify]);

  const pFor = (id: string) => progress.find((p) => p.courseId === id);
  const videoFor = (courseId: string, lessonId: string) =>
    pFor(courseId)?.videoProgress?.find((item) => item.lessonId === lessonId);

  const updateVideoProgress = useCallback((video: VideoProgress) => {
    setProgress((current) => {
      const existing = current.find(
        (item) => item.courseId === video.courseId,
      );
      if (!existing)
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

  // Filter courses by activeCompany on frontend for immediate UI responsiveness and company isolation
  const resolveCourseComp = (c: PublicCourse) => c.company || "AGE";
  const companyCourses = useMemo(() => {
    const list = courses.filter((c) => resolveCourseComp(c) === activeCompany);
    return sortCoursesLatestFirst(list);
  }, [courses, activeCompany]);

  const percent = (c: PublicCourse) => courseProgress(c, pFor(c.id)).percent;
  const finished = companyCourses.filter(
    (c) => courseProgress(c, pFor(c.id)).complete,
  );
  const ongoing = companyCourses.filter((c) => percent(c) > 0 && percent(c) < 100);
  const certified = finished.filter((c) => pFor(c.id)?.passed);
  const minutes = companyCourses.reduce(
    (n, c) => n + courseProgress(c, pFor(c.id)).seconds / 60,
    0,
  );
  const searchTerm = query.trim().toLocaleLowerCase();
  const selectedCategory = category.trim() || "ทั้งหมด";
  const filtered = companyCourses.filter(
    (c) =>
      (selectedCategory === "ทั้งหมด" || c.category === selectedCategory) &&
      (!searchTerm ||
        `${c.title} ${c.description}`.toLocaleLowerCase().includes(searchTerm)),
  );
  const userSearchTerm = userSearchQuery.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesRole =
      userRoleFilter === "all" || normalizeRole(u.role) === userRoleFilter;
    const matchesSearch =
      !userSearchTerm ||
      `${u.name} ${u.email} ${u.department || ""} ${u.jobTitle || ""}`
        .toLocaleLowerCase()
        .includes(userSearchTerm);
    return matchesRole && matchesSearch;
  });

  useEffect(() => {
    if (otpStep !== "otp") return;
    if (otpResendCountdown <= 0 && otpExpireCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setOtpExpireCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpStep, otpResendCountdown, otpExpireCountdown]);

  async function requestOtpForEmail(targetEmail: string) {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("กรุณากรอกอีเมลบริษัทของคุณ");
      return;
    }
    setBusy(true);
    setError("");
    setOtpInfoMessage("");
    try {
      const r = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "ไม่สามารถส่งรหัส OTP ได้");
      setOtpEmail(data.email || cleanEmail);
      setOtpStep("otp");
      setOtpCode("");
      setOtpResendCountdown(60);
      setOtpExpireCountdown(data.expiresInSeconds || 300);
      setOtpInfoMessage(data.message || "ส่งรหัส OTP ไปยังอีเมลเรียบร้อยแล้ว");
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await requestOtpForEmail(otpEmail);
  }

  async function handleAdminPasswordLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const d = await api("auth/login", "POST", b);
      setUser(d.user);
      await refresh();
      window.scrollTo({ top: 0 });
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("กรุณากรอกรหัส OTP ตัวเลข 6 หลัก");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: cleanOtp }),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(data.error || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
      setUser(data.user);
      setOtpStep("email");
      setOtpCode("");
      setOtpInfoMessage("");
      await refresh();
      window.scrollTo({ top: 0 });
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
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
  }

  function openCoursePermModal(u: UserReport) {
    const assignableCourses = isAdminRole(user?.role)
      ? adminCourses
      : adminCourses.filter((c) => c.targetRole !== "admin");
    setManagingUserCourses(u);
    if (!u.assignedCourses || u.assignedCourses.includes("all")) {
      setSelectedCourseIds(assignableCourses.map((c) => c.id));
    } else {
      setSelectedCourseIds(u.assignedCourses);
    }
  }

  async function saveUserCoursePermissions() {
    if (!managingUserCourses) return;
    setBusy(true);
    try {
      const assignableCourses = isAdminRole(user?.role)
        ? adminCourses
        : adminCourses.filter((c) => c.targetRole !== "admin");
      const isAll = selectedCourseIds.length === assignableCourses.length;
      const toSave = isAll ? ["all"] : selectedCourseIds;
      await api("admin/users", "PUT", {
        userId: managingUserCourses.id,
        assignedCourses: toSave,
      });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === managingUserCourses.id
            ? { ...item, assignedCourses: toSave }
            : item,
        ),
      );
      if (user && user.id === managingUserCourses.id) {
        setUser({ ...user, assignedCourses: toSave });
        await refresh();
      }
      setManagingUserCourses(null);
    } catch (err) {
      notify(err);
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

  function openCreateCourseModal() {
    window.scrollTo({ top: 0 });
    setSelected(null);
    setView("admin");
    setEditor(emptyCourse(activeCompany));
    setMobile(false);
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

  async function handleSingleVideoUpload(index: number, file: File) {
    if (!editor) return;
    setUploadingIndex(index);
    setUploadStatus("กำลังประมวลผลและอัปโหลดวิดีโอ…");
    try {
      const [duration, uploadRes] = await Promise.all([
        detectVideoDuration(file),
        uploadVideoFile(file),
      ]);
      const cleanTitle = formatLessonTitle(file.name, index);
      const durSeconds = duration > 0 ? duration : 60;
      const durMinutes = Math.max(1, Math.ceil(durSeconds / 60));
      setEditor((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lessons: prev.lessons.map((l, j) => {
            if (j !== index) return l;
            return {
              ...l,
              title: l.title.trim() ? l.title : cleanTitle,
              content: l.content.trim()
                ? l.content
                : "กรุณารับชมวิดีโอบทเรียนให้จบเพื่อบันทึกความคืบหน้าการเรียนรู้",
              videoUrl: uploadRes.url,
              videoDurationSeconds: durSeconds,
              minutes: durMinutes,
            };
          }),
        };
      });
    } catch (e) {
      notify(e);
    } finally {
      setUploadingIndex(null);
      setUploadStatus("");
    }
  }

  async function handleBatchVideoUpload(files: FileList | File[]) {
    if (!editor || !files.length) return;
    setUploadingIndex(-1);
    try {
      const newLessons: CourseDraft["lessons"] = [];
      const fileList = Array.from(files);
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatus(
          `กำลังนำเข้า (${i + 1}/${fileList.length}): ${file.name}…`,
        );
        const [duration, uploadRes] = await Promise.all([
          detectVideoDuration(file),
          uploadVideoFile(file),
        ]);
        const cleanTitle = formatLessonTitle(file.name, i);
        const durSeconds = duration > 0 ? duration : 60;
        newLessons.push({
          title: cleanTitle,
          content: "กรุณารับชมวิดีโอบทเรียนให้จบเพื่อบันทึกความคืบหน้าการเรียนรู้",
          minutes: Math.max(1, Math.ceil(durSeconds / 60)),
          videoUrl: uploadRes.url,
          videoDurationSeconds: durSeconds,
        });
      }
      setEditor((prev) => {
        if (!prev) return null;
        const isDefaultSingle =
          prev.lessons.length === 1 &&
          !prev.lessons[0].title.trim() &&
          !prev.lessons[0].content.trim() &&
          !prev.lessons[0].videoUrl;
        return {
          ...prev,
          lessons: isDefaultSingle
            ? newLessons
            : [...prev.lessons, ...newLessons],
        };
      });
    } catch (e) {
      notify(e);
    } finally {
      setUploadingIndex(null);
      setUploadStatus("");
    }
  }

  function autoFillQuiz() {
    if (!editor) return;
    const courseTitle = editor.title.trim() || "หลักสูตรนี้";
    setEditor({
      ...editor,
      quiz: {
        question: `ข้อใดคือเป้าหมายสำคัญของการเรียนรู้ในหลักสูตร "${courseTitle}"?`,
        options: [
          "การทำความเข้าใจและนำทักษะไปประยุกต์ใช้จริงในการทำงาน",
          "การท่องจำเนื้อหาเพียงเพื่อผ่านแบบทดสอบเท่านั้น",
          "การทำงานตามความเคยชินเดิมโดยไม่ปรับใช้สิ่งที่เรียนรู้",
        ],
        answer: 0,
      },
    });
  }

  function autoFillCourseTemplate() {
    if (!editor) return;
    setEditor({
      ...editor,
      title:
        editor.title.trim() ||
        "การทำงานร่วมกันและการสื่อสารอย่างมีประสิทธิภาพ",
      description:
        editor.description.trim() ||
        "เรียนรู้แนวทางการสื่อสาร การให้ feedback ที่สร้างสรรค์ และการบริหารเวลาเพื่อเพิ่มประสิทธิผลของทีม",
      category: editor.category || "พัฒนาตนเอง",
      instructor: editor.instructor.trim() || "ทีม People & Culture",
      color: editor.color || "mint",
      targetRole: editor.targetRole || "all",
      lessons: editor.lessons.map((l, i) => ({
        ...l,
        title: l.title.trim() || `บทที่ ${i + 1}: พื้นฐานการทำงานเป็นทีม`,
        content:
          l.content.trim() ||
          "ทำความเข้าใจบทบาทของตนเองในทีม สื่อสารอย่างตรงไปตรงมา และรับฟังความคิดเห็นเพื่อเป้าหมายร่วมกัน",
      })),
      quiz: editor.quiz.question.trim()
        ? editor.quiz
        : {
          question: "การสื่อสารที่มีประสิทธิภาพในทีมควรเริ่มต้นจากสิ่งใด?",
          options: [
            "การรับฟังอย่างตั้งใจและเข้าใจเป้าหมายร่วมกัน",
            "การสั่งการโดยไม่ต้องรอฟังข้อเสนอแนะ",
            "การหลีกเลี่ยงการพูดคุยเมื่อเกิดปัญหา",
          ],
          answer: 0,
        },
    });
  }

  function duplicateLesson(index: number) {
    if (!editor) return;
    const target = editor.lessons[index];
    const clone = {
      ...target,
      title: target.title ? `${target.title} (สำเนา)` : "บทเรียนใหม่",
    };
    const nextLessons = [...editor.lessons];
    nextLessons.splice(index + 1, 0, clone);
    setEditor({ ...editor, lessons: nextLessons });
  }

  async function saveCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      const targetCompany: Company = editor.company || activeCompany || "AGE";
      const coursePayload: CourseDraft = {
        ...editor,
        company: targetCompany,
        thumbnail: editor.thumbnail?.trim() || undefined,
      };
      await api("admin/courses", editor.id ? "PUT" : "POST", coursePayload);
      await refresh(activeCompany);
      const adminPath = activeCompany
        ? `admin/courses?company=${activeCompany}`
        : "admin/courses";
      setAdminCourses((await api(adminPath as "admin/courses")).courses);
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
      await refresh(activeCompany);
      const adminPath = activeCompany
        ? `admin/courses?company=${activeCompany}`
        : "admin/courses";
      setAdminCourses((await api(adminPath as "admin/courses")).courses);
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }

  function exportReport() {
    const isAdmin = isAdminRole(user?.role);
    const targetUsers = isAdmin
      ? users
      : users.filter((u) => normalizeRole(u.role) === "employee");
    const rows = [
      isAdmin
        ? ["ชื่อ", "อีเมล", "สิทธิ์", "คอร์สที่ผ่าน"]
        : ["ชื่อผู้เข้าอบรม", "อีเมล", "แผนก/ตำแหน่ง", "คอร์สที่ผ่าน"],
      ...targetUsers.map((u) => [
        u.name,
        u.email,
        isAdmin
          ? getRoleLabel(u.role)
          : [u.jobTitle, u.department].filter(Boolean).join(" / ") || "-",
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
    a.download = "age-group-learning-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("admin/users", "POST", {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      const r = await api("admin/report");
      setUsers(r.users);
      setShowAddUser(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("employee");
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncUsers() {
    setSyncingUsers(true);
    setSyncStatus("");
    try {
      const res = await fetch("/api/sync-users", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ซิงค์ข้อมูลผู้ใช้ไม่สำเร็จ");
      }
      setSyncStatus(
        `ซิงค์สำเร็จ (ทั้งหมด ${data.totalFetched} คน · เพิ่มใหม่ ${data.inserted} · อัปเดต ${data.updated})`,
      );
      const r = await api("admin/report");
      setUsers(r.users);
    } catch (err) {
      notify(err);
    } finally {
      setSyncingUsers(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    try {
      setBusy(true);
      await api("admin/users", "PUT", {
        userId,
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, role: newRole } : item,
        ),
      );
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteUser(u: UserReport) {
    if (
      !window.confirm(
        `ต้องการลบผู้ใช้งาน "${u.name}" (${u.email}) ออกจากระบบหรือไม่?`,
      )
    )
      return;
    setBusy(true);
    try {
      await api(
        "admin/users/" + encodeURIComponent(u.id || u.email),
        "DELETE",
      );
      setUsers((prev) =>
        prev.filter((item) => item.id !== u.id && item.email !== u.email),
      );
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  }

  if (!ready)
    return (
      <div className="loading">
        <div className="brand flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center flex-shrink-0 shadow-md">
            <Image
              src={companyInfo?.logoPath || "/images/logos/age-logo.png"}
              alt={companyInfo?.name || "AGE Group"}
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="brand-copy text-left">
            <span className="brand-title">
              {companyInfo?.shortName || "AGE Group"}
            </span>
            <small>{companyInfo?.headerSubtitle || "LEARNING ACADEMY"}</small>
          </span>
        </div>
        <p>กำลังเตรียมพื้นที่เรียนรู้ของคุณ…</p>
      </div>
    );

  if (!user)
    return (
      <LoginView
        adminPasswordMode={adminPasswordMode}
        setAdminPasswordMode={setAdminPasswordMode}
        otpStep={otpStep}
        setOtpStep={setOtpStep}
        otpEmail={otpEmail}
        setOtpEmail={setOtpEmail}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpResendCountdown={otpResendCountdown}
        otpExpireCountdown={otpExpireCountdown}
        otpInfoMessage={otpInfoMessage}
        setOtpInfoMessage={setOtpInfoMessage}
        error={error}
        setError={setError}
        busy={busy}
        demo={demo}
        fallback={fallback}
        dbError={dbError}
        handleAdminPasswordLogin={handleAdminPasswordLogin}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        requestOtpForEmail={requestOtpForEmail}
      />
    );

  const nav: NavItem[] = [
    ["dashboard", LayoutDashboard, "ภาพรวมของฉัน"],
    ["catalog", BookOpen, "สำรวจคอร์สเรียน"],
    ["my", GraduationCap, "การเรียนรู้ของฉัน"],
    ["certificates", Award, "ใบประกาศนียบัตร"],
    ...(canManageCourses(user.role)
      ? [
        [
          "admin",
          isAdminRole(user.role) ? Settings : FolderKanban,
          isAdminRole(user.role) ? "จัดการระบบ" : "จัดการหลักสูตร",
        ] as NavItem,
      ]
      : []),
  ];

  return (
    <div className="app">
      <Sidebar
        user={user}
        view={view}
        nav={nav}
        coursesCount={companyCourses.length}
        editor={editor}
        mobile={mobile}
        setMobile={setMobile}
        navigate={navigate}
        openCreateCourseModal={openCreateCourseModal}
        onLogout={handleLogout}
      />
      <div className="main-area">
        <Navbar
          user={user}
          view={view}
          nav={nav}
          selected={selected}
          mobile={mobile}
          setMobile={setMobile}
          demo={demo}
          fallback={fallback}
        />
        <main className="content pt-20 md:pt-24">
          {fallback && (
            <div className="error" role="status">
              <div>
                <b>ฐานข้อมูลยังเชื่อมต่อไม่ได้:</b> กำลังแสดงคอร์สตัวอย่างและข้อมูลในหน่วยความจำชั่วคราว ข้อมูลที่เปลี่ยนแปลงจะไม่ถูกบันทึกถาวร
              </div>
              {dbError && (
                <div className="mt-2 text-xs font-mono bg-red-950/10 p-2 rounded border border-red-400/30 break-all text-red-900">
                  <b>สาเหตุข้อผิดพลาดจากเซิร์ฟเวอร์:</b> {dbError}
                </div>
              )}
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
          <div
            key={selected ? `classroom-${selected.id}` : view}
            className="view-container animate-fade-slide"
          >
            {selected ? (
              <ClassroomView
                selected={selected}
                setSelected={setSelected}
                lesson={lesson}
                setLesson={setLesson}
                busy={busy}
                answer={answer}
                setAnswer={setAnswer}
                quizResult={quizResult}
                pFor={pFor}
                videoFor={videoFor}
                updateVideoProgress={updateVideoProgress}
                percent={percent}
                complete={complete}
                submitQuiz={submitQuiz}
                notify={notify}
              />
            ) : view === "admin" ? (
              <AdminView
                user={user}
                courses={companyCourses}
                adminCourses={adminCourses}
                users={users}
                filteredUsers={filteredUsers}
                editor={editor}
                setEditor={setEditor}
                emptyCourse={emptyCourse}
                busy={busy}
                uploadingIndex={uploadingIndex}
                uploadStatus={uploadStatus}
                uploadCoverImage={uploadCoverImage}
                saveCourse={saveCourse}
                removeCourse={removeCourse}
                autoFillCourseTemplate={autoFillCourseTemplate}
                autoFillQuiz={autoFillQuiz}
                duplicateLesson={duplicateLesson}
                handleSingleVideoUpload={handleSingleVideoUpload}
                handleBatchVideoUpload={handleBatchVideoUpload}
                detectVideoDuration={detectVideoDuration}
                showAddUser={showAddUser}
                setShowAddUser={setShowAddUser}
                newUserName={newUserName}
                setNewUserName={setNewUserName}
                newUserEmail={newUserEmail}
                setNewUserEmail={setNewUserEmail}
                newUserPassword={newUserPassword}
                setNewUserPassword={setNewUserPassword}
                newUserRole={newUserRole}
                setNewUserRole={setNewUserRole}
                handleAddUser={handleAddUser}
                syncingUsers={syncingUsers}
                syncStatus={syncStatus}
                handleSyncUsers={handleSyncUsers}
                exportReport={exportReport}
                userSearchQuery={userSearchQuery}
                setUserSearchQuery={setUserSearchQuery}
                userRoleFilter={userRoleFilter}
                setUserRoleFilter={setUserRoleFilter}
                handleRoleChange={handleRoleChange}
                openCoursePermModal={openCoursePermModal}
                handleDeleteUser={handleDeleteUser}
              />
            ) : view === "certificates" ? (
              <CertificatesView
                user={user}
                certified={certified}
                setCertificate={setCertificate}
                navigate={navigate}
              />
            ) : view === "dashboard" ? (
              <DashboardView
                user={user}
                courses={companyCourses}
                filtered={filtered}
                ongoing={ongoing}
                finished={finished}
                minutes={minutes}
                category={category}
                setCategory={setCategory}
                setQuery={setQuery}
                percent={percent}
                openCourse={openCourse}
                navigate={navigate}
              />
            ) : view === "my" ? (
              <MyCoursesView
                courses={companyCourses}
                filtered={filtered}
                query={query}
                setQuery={setQuery}
                category={category}
                setCategory={setCategory}
                percent={percent}
                openCourse={openCourse}
                navigate={navigate}
              />
            ) : (
              <CatalogView
                courses={companyCourses}
                filtered={filtered}
                query={query}
                setQuery={setQuery}
                category={category}
                setCategory={setCategory}
                percent={percent}
                openCourse={openCourse}
              />
            )}
          </div>
          <footer>
            AGE GROUP LEARNING{" "}
            <span>สร้างโอกาสใหม่ ด้วยการเรียนรู้ไม่สิ้นสุด</span>
            <small>© {new Date().getFullYear()} AGE Group</small>
          </footer>
        </main>
      </div>
      <CourseAccessModal
        managingUserCourses={managingUserCourses}
        setManagingUserCourses={setManagingUserCourses}
        adminCourses={
          isAdminRole(user.role)
            ? adminCourses
            : adminCourses.filter((c) => c.targetRole !== "admin")
        }
        selectedCourseIds={selectedCourseIds}
        setSelectedCourseIds={setSelectedCourseIds}
        busy={busy}
        saveUserCoursePermissions={saveUserCoursePermissions}
      />
      <CertificateModal
        certificate={certificate}
        user={user}
        demo={demo}
        pFor={pFor}
        onClose={() => setCertificate(null)}
      />
    </div>
  );
}
