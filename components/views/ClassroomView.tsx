"use client";
import { ChevronLeft, Check, ArrowRight } from "lucide-react";
import type { PublicCourse, Progress, VideoProgress } from "../../lib/types";
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
  return (
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
                !videoFor(selected.id, selected.lessons[lesson].id)?.completed)
            }
            className="primary"
            onClick={complete}
          >
            <Check size={17} />
            {pFor(selected.id)?.completed?.includes(selected.lessons[lesson].id)
              ? "เรียนบทนี้แล้ว · ไปต่อ"
              : selected.lessons[lesson].videoUrl &&
                  !videoFor(selected.id, selected.lessons[lesson].id)?.completed
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
  );
}

