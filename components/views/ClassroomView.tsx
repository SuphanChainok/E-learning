"use client";
import {
  ChevronLeft,
  Check,
  CheckCircle2,
  Play,
  ArrowRight,
  Clock,
  User,
  Sparkles,
  Award,
  Lock,
  BookOpen,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import type { PublicCourse, Progress, VideoProgress } from "../../lib/types";
import {
  formatLessonContent,
  formatLessonTitle,
} from "../../lib/lesson-format";
import VideoPlayer from "../../app/video-player";

export interface ClassroomViewProps {
  selected: PublicCourse;
  setSelected: (course: PublicCourse | null) => void;
  lesson: number;
  setLesson: (index: number) => void;
  busy: boolean;
  answer: number | null;
  setAnswer: (ans: number | null) => void;
  quizResult: string;
  pFor: (id: string) => Progress | undefined;
  videoFor: (courseId: string, lessonId: string) => VideoProgress | undefined;
  updateVideoProgress: (video: VideoProgress) => void;
  percent: (c: PublicCourse) => number;
  complete: () => void | Promise<void>;
  submitQuiz: () => void | Promise<void>;
  notify: (e: unknown) => void;
}

export default function ClassroomView({
  selected,
  setSelected,
  lesson,
  setLesson,
  busy,
  answer,
  setAnswer,
  quizResult,
  pFor,
  videoFor,
  updateVideoProgress,
  percent,
  complete,
  submitQuiz,
  notify,
}: ClassroomViewProps) {
  const currentLesson = selected.lessons[lesson] ?? selected.lessons[0];
  const courseProgress = percent(selected);
  const completedIds = pFor(selected.id)?.completed ?? [];
  const isCurrentCompleted = completedIds.includes(currentLesson.id);
  const currentVideoProgress = videoFor(selected.id, currentLesson.id);
  const currentLessonDurationSec =
    currentLesson.videoDurationSeconds ?? currentLesson.minutes * 60;
  const currentWatchedPct = currentLesson.videoUrl
    ? Math.min(
        100,
        Math.floor(
          ((currentVideoProgress?.maxWatchedTime ?? 0) /
            Math.max(1, currentLessonDurationSec)) *
            100,
        ),
      )
    : isCurrentCompleted
      ? 100
      : 0;
  const cleanedLessonTitle = formatLessonTitle(currentLesson.title, lesson);
  const cleanedLessonContent = formatLessonContent(currentLesson.content);
  const remainingLessons = Math.max(0, selected.lessons.length - completedIds.length);

  return (
    <div className="classroom-page bg-slate-50/70 pb-16">
      {/* 1. ส่วนหัวของหน้า (Page Header - Minimal & Executive) */}
      <header className="classroom-header mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <button
            type="button"
            className="classroom-back-btn group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
            onClick={() => setSelected(null)}
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            ย้อนกลับไปหน้ารวมคอร์ส
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-bold text-emerald-800">
              <Sparkles size={13} className="text-emerald-600" />
              {selected.category || "หลักสูตรทั่วไป"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-600">
              {selected.company || "AGE Group"}
            </span>
          </div>
        </div>

        <div className="classroom-header-content bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug m-0">
              {selected.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <User size={15} className="text-emerald-700" />
                {selected.instructor}
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <Clock size={15} className="text-emerald-700" />
                รวม {selected.duration} นาที ({selected.lessons.length} บทเรียน)
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                สำเร็จ {completedIds.length}/{selected.lessons.length} บท
              </span>
            </div>
          </div>

          <div className="classroom-progress-dial flex items-center gap-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-5 py-3 shadow-xs">
            <div className="text-right">
              <span className="block text-[11px] font-semibold text-emerald-900/70">ความคืบหน้ารวม</span>
              <b className="text-xl font-black text-emerald-800">{courseProgress}%</b>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-center font-bold text-xs text-emerald-800 shadow-xs">
              <Award size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. โครงสร้างหลัก (Grid 70-75% ซ้าย / 25-30% ขวา) */}
      <div className="classroom-grid grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ฝั่งซ้าย: วิดีโอ + เนื้อหาบทเรียน */}
        <div className="classroom-main-col lg:col-span-8 xl:col-span-9 min-w-0">
          {/* กล่องวิดีโอ Edge-to-Edge ไร้ขอบขาว มี Ambient Glow */}
          {Boolean(currentLesson.videoUrl?.trim()) && (
            <div className="classroom-video-box rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-900/50">
              <VideoPlayer
                key={currentLesson.id}
                courseId={selected.id}
                lessonId={currentLesson.id}
                src={currentLesson.videoUrl?.trim() || ""}
                durationSeconds={currentLessonDurationSec}
                initialProgress={currentVideoProgress}
                onProgress={updateVideoProgress}
                onError={(err) => console.warn("Video progress sync warning:", err)}
              />
            </div>
          )}

          {/* การ์ดรายละเอียดบทเรียนสไตล์ Executive Studio */}
          <section
            className={
              "classroom-lesson-card bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80" +
              (currentLesson.videoUrl ? " mt-6" : "")
            }
          >
            <div className="classroom-lesson-card-top flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/80 border border-emerald-200/60 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                บทที่ {lesson + 1} จาก {selected.lessons.length} · {currentLesson.minutes} นาที
              </div>

              {currentLesson.videoUrl && (
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold " +
                      (currentVideoProgress?.completed || isCurrentCompleted
                        ? "bg-emerald-100/80 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200")
                    }
                  >
                    {currentVideoProgress?.completed || isCurrentCompleted ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        รับชมวิดีโอครบแล้ว 100%
                      </>
                    ) : (
                      <>
                        <Play size={12} className="text-slate-500" />
                        รับชมแล้ว {currentWatchedPct}%
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            <h2 className="classroom-lesson-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
              {cleanedLessonTitle}
            </h2>

            {cleanedLessonContent && (
              <div className="classroom-lesson-desc text-slate-600 mt-4 text-base leading-relaxed whitespace-pre-line">
                {cleanedLessonContent}
              </div>
            )}

            {/* การ์ดสรุปแนวคิดสำคัญ (Key Concept Tip) */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={18} />
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <b className="text-slate-800 font-semibold block mb-0.5">แนวทางปฏิบัติเพื่อผลลัพธ์ที่ดีที่สุด</b>
                ทำความเข้าใจสาระสำคัญ และนำไปประยุกต์ใช้ในการปฏิบัติงานจริงเพื่อเพิ่มประสิทธิภาพและความแม่นยำในการทำงาน
              </div>
            </div>

            {/* แถบแอ็กชันด้านล่างของการ์ดบทเรียน */}
            <div className="classroom-lesson-footer mt-7 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>
                  {currentLesson.videoUrl
                    ? "ระบบบันทึกความคืบหน้าแบบเรียลไทม์ · สลับหน้าต่างหรือกลับมาดูต่อได้ตลอดเวลา"
                    : "ศึกษาเนื้อหาบทเรียนครบถ้วนแล้ว กดบันทึกเพื่อไปต่อ"}
                </span>
              </div>

              <button
                type="button"
                disabled={
                  busy ||
                  (!!currentLesson.videoUrl && !currentVideoProgress?.completed)
                }
                className={
                  "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer " +
                  (isCurrentCompleted
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15"
                    : currentLesson.videoUrl && !currentVideoProgress?.completed
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#005B36] hover:bg-[#00462A] text-white shadow-emerald-800/20 hover:scale-[1.02]")
                }
                onClick={complete}
              >
                {isCurrentCompleted ? (
                  lesson < selected.lessons.length - 1 ? (
                    <>
                      <span>ไปบทถัดไป</span>
                      <ArrowRight size={17} />
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      <span>เรียนจบคอร์สนี้แล้ว</span>
                    </>
                  )
                ) : currentLesson.videoUrl && !currentVideoProgress?.completed ? (
                  <>
                    <Lock size={15} />
                    <span>กรุณารับชมวิดีโอให้จบก่อน ({currentWatchedPct}%)</span>
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    <span>ทำเครื่องหมายว่าเรียนจบ</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* แบบทดสอบท้ายคอร์ส (Knowledge Check) */}
          <section className="classroom-quiz-card bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/70 px-3 py-1 text-xs font-bold text-amber-800">
                <Sparkles size={13} className="text-amber-600" /> FINAL KNOWLEDGE CHECK
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 m-0">
              แบบทดสอบประเมินผลการเรียนรู้
            </h2>

            {courseProgress < 100 ? (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0">
                      แบบทดสอบถูกล็อกอยู่
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-0">
                      เรียนครบทุกบท ({completedIds.length}/{selected.lessons.length} บทเรียน) เพื่อปลดล็อกแบบทดสอบและรับใบประกาศนียบัตรรับรองผล
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-xs">
                    เหลืออีก {remainingLessons} บทเรียน
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs font-medium text-emerald-800 mb-4">
                  ยินดีด้วย! คุณเรียนจบครบทุกบทแล้ว กรุณาตอบคำถามด้านล่างเพื่อผ่านการอบรมและรับใบประกาศนียบัตร
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-3 mb-4">
                  {selected.quiz.question}
                </h3>
                <div className="space-y-2.5">
                  {selected.quiz.options.map((o, i) => (
                    <label
                      className={
                        "quiz-option flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer " +
                        (answer === i
                          ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-semibold shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300")
                      }
                      key={i}
                    >
                      <input
                        type="radio"
                        name="answer"
                        className="accent-emerald-600 w-4 h-4"
                        checked={answer === i}
                        onChange={() => setAnswer(i)}
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="primary inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#005B36] hover:bg-[#00462A] shadow-md transition-all cursor-pointer"
                  onClick={submitQuiz}
                  disabled={answer === null || busy}
                >
                  <span>ส่งคำตอบเพื่อจบหลักสูตร</span>
                  <ArrowRight size={17} />
                </button>
                {quizResult && (
                  <div
                    role="status"
                    className="mt-4 p-4 rounded-xl bg-emerald-100/70 border border-emerald-300 text-sm font-bold text-emerald-900"
                  >
                    {quizResult}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ฝั่งขวา: สารบัญและแถบความคืบหน้า (Course Content & Curriculum Playlist) */}
        <aside className="classroom-playlist-col lg:col-span-4 xl:col-span-3 min-w-0">
          <div className="classroom-playlist-card bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
            {/* Header ของสารบัญ */}
            <div className="classroom-playlist-header bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50 border-b border-emerald-100 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={17} className="text-emerald-700" />
                  <h3 className="classroom-playlist-title text-base font-bold text-emerald-950 m-0">
                    เนื้อหาในหลักสูตร
                  </h3>
                </div>
                <span className="classroom-playlist-count text-xs font-bold text-emerald-800 bg-white/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {completedIds.length}/{selected.lessons.length} บท
                </span>
              </div>

              {/* Progress Bar ในส่วนหัว */}
              <div className="classroom-playlist-progress-wrap mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-900/80 font-medium">ความคืบหน้าคอร์ส</span>
                  <strong className="text-sm font-black text-emerald-800">{courseProgress}%</strong>
                </div>
                <div
                  className="w-full h-2 rounded-full bg-emerald-200/70 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={courseProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500 shadow-sm"
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* รายการบทเรียน */}
            <div className="classroom-playlist-items divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {selected.lessons.map((l, i) => {
                const isActive = lesson === i;
                const isDone = completedIds.includes(l.id);
                const lessonDur = l.videoDurationSeconds ?? l.minutes * 60;
                const watchedPct = l.videoUrl
                  ? Math.min(
                      100,
                      Math.floor(
                        ((videoFor(selected.id, l.id)?.maxWatchedTime ?? 0) /
                          Math.max(1, lessonDur)) *
                          100,
                      ),
                    )
                  : isDone
                    ? 100
                    : 0;
                const itemTitle = formatLessonTitle(l.title, i);

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLesson(i)}
                    className={
                      "classroom-lesson-item w-full text-left p-4.5 transition-all cursor-pointer flex items-start gap-3.5 " +
                      (isActive
                        ? "bg-emerald-50/70 border-l-4 border-l-emerald-600 shadow-xs"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent")
                    }
                  >
                    <span
                      className={
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all " +
                        (isDone
                          ? "bg-emerald-100 text-emerald-700 shadow-xs"
                          : isActive
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                            : "bg-slate-100 text-slate-500")
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} />
                      ) : isActive ? (
                        <Play size={13} className="ml-0.5" />
                      ) : (
                        i + 1
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          "text-sm leading-snug break-words " +
                          (isActive
                            ? "font-extrabold text-emerald-950"
                            : "font-semibold text-slate-800")
                        }
                      >
                        {itemTitle}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {l.minutes} นาที
                        </span>
                        {l.videoUrl && (
                          <>
                            <span>·</span>
                            <span
                              className={
                                isDone
                                  ? "text-emerald-600 font-semibold"
                                  : "text-slate-500"
                              }
                            >
                              {isDone ? "✓ เรียนจบแล้ว" : `รับชม ${watchedPct}%`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* การ์ดสิทธิประโยชน์และใบประกาศนียบัตร (Certificate Incentive) */}
            <div className="classroom-cert-teaser m-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-100/90 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                  <Award size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-emerald-950 m-0">
                    ใบประกาศนียบัตรรับรองผล
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 mt-1 mb-2.5 leading-relaxed">
                    เรียนครบทุกบทและผ่านแบบทดสอบ รับใบประกาศนียบัตรรับรองจาก AGE Group ทันที
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-200/60 shadow-2xs">
                    <span>สถานะการเรียนรู้</span>
                    <span>{courseProgress === 100 ? "พร้อมสอบรับใบประกาศ 🎉" : `เหลืออีก ${remainingLessons} บท`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
