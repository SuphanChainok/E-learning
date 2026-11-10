"use client";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Plus,
  Trash2,
  X,
  Upload,
  Video,
  FileVideo,
  Wand2,
  Copy,
} from "lucide-react";
import {
  type CourseDraft,
  type CourseTargetRole,
  COURSE_CATEGORIES,
  ROLE_LABELS,
} from "../../lib/types";

export interface CreateCourseModalProps {
  editor: CourseDraft;
  setEditor: Dispatch<SetStateAction<CourseDraft | null>>;
  busy: boolean;
  uploadingIndex: number | null;
  uploadStatus: string;
  saveCourse: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  autoFillCourseTemplate: () => void;
  autoFillQuiz: () => void;
  duplicateLesson: (index: number) => void;
  handleSingleVideoUpload: (index: number, file: File) => void | Promise<void>;
  handleBatchVideoUpload: (files: FileList | File[]) => void | Promise<void>;
  detectVideoDuration: (fileOrUrl: File | string) => Promise<number>;
}

export default function CreateCourseModal({
  editor,
  setEditor,
  busy,
  uploadingIndex,
  uploadStatus,
  saveCourse,
  autoFillCourseTemplate,
  autoFillQuiz,
  duplicateLesson,
  handleSingleVideoUpload,
  handleBatchVideoUpload,
  detectVideoDuration,
}: CreateCourseModalProps) {
  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <h2>{editor.id ? "แก้ไขคอร์ส" : "สร้างคอร์สใหม่"}</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            กรอกข้อมูลคอร์ส หรือนำเข้าวิดีโอเพื่อสร้างบทเรียนและคำนวณเวลาอัตโนมัติ
          </p>
        </div>
        <div className="editor-top-actions">
          {!editor.id && (
            <button
              type="button"
              className="secondary small-btn"
              onClick={autoFillCourseTemplate}
              title="เติมข้อมูลตัวอย่างเพื่อลดขั้นตอนการพิมพ์"
            >
              <Wand2 size={14} />
              เติมข้อมูลตัวอย่าง
            </button>
          )}
          <button
            className="text-button"
            onClick={() => setEditor(null)}
            type="button"
          >
            ยกเลิก
          </button>
        </div>
      </div>
      <form onSubmit={saveCourse} className="editor">
        <label>
          ชื่อคอร์ส
          <input
            required
            minLength={3}
            maxLength={150}
            value={editor.title}
            onChange={(e) => setEditor({ ...editor, title: e.target.value })}
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
              {COURSE_CATEGORIES.slice(1).map((c) => (
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
          <label>
            สิทธิ์ผู้เรียน (Role)
            <select
              value={editor.targetRole || "all"}
              onChange={(e) =>
                setEditor({
                  ...editor,
                  targetRole: e.target.value as CourseTargetRole,
                })
              }
            >
              <option value="all">ทุกคน (ทุกบทบาท)</option>
              <option value="employee">
                เฉพาะ{ROLE_LABELS.employee} (Employee)
              </option>
              <option value="manager">
                เฉพาะ{ROLE_LABELS.manager} (Manager)
              </option>
              <option value="admin">
                เฉพาะ{ROLE_LABELS.admin} (Admin)
              </option>
            </select>
          </label>
        </div>

        <div className="import-toolbar">
          <div className="import-info">
            <FileVideo size={24} />
            <div>
              <strong>นำเข้าวิดีโอหลายไฟล์พร้อมกัน</strong>
              <small>
                เลือกไฟล์ MP4/WebM เพื่อสร้างบทเรียน ดึงชื่อ และคำนวณเวลาให้อัตโนมัติในคลิกเดียว
              </small>
            </div>
          </div>
          <label
            className={`upload-btn ${
              uploadingIndex !== null ? "disabled" : ""
            }`}
          >
            <Upload size={16} />
            {uploadingIndex === -1
              ? uploadStatus || "กำลังนำเข้า…"
              : "เลือกหลายไฟล์วิดีโอ"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              multiple
              disabled={busy || uploadingIndex !== null}
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleBatchVideoUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>

        {editor.lessons.map((l, i) => (
          <fieldset key={i} className="lesson-fieldset">
            <div className="lesson-fieldset-header">
              <legend>
                บทเรียนที่ {i + 1}
                {l.videoUrl && (
                  <span className="lesson-badge">
                    <Video size={12} />
                    {l.videoDurationSeconds
                      ? `${Math.floor(l.videoDurationSeconds / 60)}:${String(
                          l.videoDurationSeconds % 60,
                        ).padStart(2, "0")} นาที`
                      : `${l.minutes} นาที`}
                  </span>
                )}
              </legend>
              <div className="lesson-fieldset-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => duplicateLesson(i)}
                  title="ทำซ้ำบทเรียนนี้เพื่อลดการกรอกใหม่"
                >
                  <Copy size={13} />
                  ทำซ้ำ
                </button>
                {editor.lessons.length > 1 && (
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() =>
                      setEditor({
                        ...editor,
                        lessons: editor.lessons.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash2 size={13} />
                    ลบบทเรียน
                  </button>
                )}
              </div>
            </div>

            <label>
              ชื่อบทเรียน
              <input
                required
                value={l.title}
                placeholder="ระบุชื่อบทเรียน..."
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
                rows={4}
                value={l.content}
                placeholder="เนื้อหาประกอบบทเรียน..."
                onChange={(e) =>
                  setEditor({
                    ...editor,
                    lessons: editor.lessons.map((x, j) =>
                      i === j ? { ...x, content: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>

            <div className="video-upload-box">
              <div className="video-upload-header">
                <span>
                  <Video
                    size={14}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                  />
                  วิดีโอประจำบทเรียน (MP4 / WebM)
                </span>
                {l.videoUrl && (
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() =>
                      setEditor({
                        ...editor,
                        lessons: editor.lessons.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                videoUrl: "",
                                videoDurationSeconds: undefined,
                              }
                            : x,
                        ),
                      })
                    }
                  >
                    <X size={13} />
                    ลบวิดีโอ
                  </button>
                )}
              </div>
              <div className="video-upload-actions">
                <label
                  className={`upload-btn ${
                    uploadingIndex !== null ? "disabled" : ""
                  }`}
                >
                  <Upload size={14} />
                  {uploadingIndex === i
                    ? uploadStatus || "กำลังอัปโหลด…"
                    : "อัปโหลดไฟล์วิดีโอ"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    disabled={busy || uploadingIndex !== null}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSingleVideoUpload(i, e.target.files[0]);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <span className="or-text">หรือใส่ลิงก์</span>
                <input
                  type="text"
                  placeholder="https://... หรือ /videos/..."
                  value={l.videoUrl || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditor({
                      ...editor,
                      lessons: editor.lessons.map((x, j) =>
                        i === j ? { ...x, videoUrl: val } : x,
                      ),
                    });
                  }}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (val && !l.videoDurationSeconds) {
                      const dur = await detectVideoDuration(val);
                      if (dur > 0) {
                        setEditor((prev) =>
                          prev
                            ? {
                                ...prev,
                                lessons: prev.lessons.map((x, j) =>
                                  i === j
                                    ? {
                                        ...x,
                                        videoDurationSeconds: dur,
                                        minutes: Math.max(
                                          1,
                                          Math.ceil(dur / 60),
                                        ),
                                      }
                                    : x,
                                ),
                              }
                            : prev,
                        );
                      }
                    }
                  }}
                />
              </div>
              {l.videoUrl && (
                <div className="video-detected-info">
                  <span>
                    บันทึกวิดีโอแล้ว: <code>{l.videoUrl}</code>
                  </span>
                  {l.videoDurationSeconds ? (
                    <small>
                      ความยาว: {l.videoDurationSeconds} วินาที (คำนวณเป็น{" "}
                      {l.minutes} นาทีให้อัตโนมัติ)
                    </small>
                  ) : null}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>
                เวลาเรียน (นาที)
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
                    onChange={(e) => {
                      const sec = Number(e.target.value);
                      setEditor({
                        ...editor,
                        lessons: editor.lessons.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                videoDurationSeconds: sec,
                                minutes:
                                  sec > 0
                                    ? Math.max(1, Math.ceil(sec / 60))
                                    : x.minutes,
                              }
                            : x,
                        ),
                      });
                    }}
                  />
                </label>
              )}
            </div>
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
          <div className="lesson-fieldset-header">
            <legend>แบบทดสอบท้ายคอร์ส</legend>
            <button
              type="button"
              className="secondary small-btn"
              onClick={autoFillQuiz}
              title="กรอกคำถามและตัวเลือกมาตรฐานให้อัตโนมัติ"
            >
              <Wand2 size={13} />
              ใส่แบบทดสอบอัตโนมัติ
            </button>
          </div>
          <label>
            คำถาม
            <input
              required
              value={editor.quiz.question}
              placeholder="คำถามสำหรับประเมินผลการเรียนรู้..."
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
                placeholder={`ตัวเลือกข้อที่ ${i + 1}...`}
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
        <button
          className="primary"
          disabled={busy || uploadingIndex !== null}
        >
          {busy
            ? "กำลังบันทึก…"
            : uploadingIndex !== null
              ? uploadStatus || "กำลังประมวลผลวิดีโอ…"
              : "บันทึกคอร์ส"}
        </button>
      </form>
    </section>
  );
}

