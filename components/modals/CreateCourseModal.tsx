"use client";
import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  type DragEvent,
} from "react";
import {
  Plus,
  Trash2,
  X,
  Upload,
  Video,
  Wand2,
  Copy,
  GripVertical,
  Save,
  BookOpen,
  HelpCircle,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Camera,
} from "lucide-react";
import {
  type CourseDraft,
  type CourseTargetRole,
  type Company,
  COURSE_CATEGORIES,
  ROLE_LABELS,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";
import { getCourseCoverImage, isVideoMedia } from "../CourseCard";

interface CoverPreset {
  id: string;
  name: string;
  company: Company;
  url: string;
  category: string;
}

const PRESET_COVERS: CoverPreset[] = [
  // ABM (Biomass / Agriculture)
  {
    id: "abm-biomass",
    name: "พลังงานชีวมวลและไม้สับ (Biomass)",
    company: "ABM",
    url: "/images/courses/abm-biomass.jpg",
    category: "พลังงานชีวมวล",
  },
  {
    id: "abm-qc",
    name: "การตรวจสอบคุณภาพชีวมวล (QC)",
    company: "ABM",
    url: "/images/courses/abm-qc.jpg",
    category: "การควบคุมคุณภาพ",
  },
  {
    id: "abm-fallback",
    name: "ปกมาตรฐานองค์กร ABM",
    company: "ABM",
    url: "/images/courses/fallback-abm.jpg",
    category: "ทั่วไป",
  },
  // AAG+ (Automotive / EV)
  {
    id: "aag-zeekr",
    name: "ZEEKR 009 & X (ยานยนต์พรีเมียม)",
    company: "AAG+",
    url: "/images/courses/aag-zeekr.jpg",
    category: "ผลิตภัณฑ์ยานยนต์",
  },
  {
    id: "aag-sales",
    name: "การขายและการส่งมอบรถยนต์พรีเมียม",
    company: "AAG+",
    url: "/images/courses/aag-sales.jpg",
    category: "การขายและบริการ",
  },
  {
    id: "aag-ev-battery",
    name: "ระบบไฟฟ้าและแบตเตอรี่รถยนต์ EV",
    company: "AAG+",
    url: "/images/courses/aag-ev-battery.jpg",
    category: "ทักษะช่างเทคนิค",
  },
  {
    id: "aag-fallback",
    name: "ปกมาตรฐานองค์กร AAG+",
    company: "AAG+",
    url: "/images/courses/fallback-aag.jpg",
    category: "ทั่วไป",
  },
  // AGE (Logistics / Energy / Safety)
  {
    id: "age-safety",
    name: "ความปลอดภัยในการปฏิบัติงานและท่าเรือ",
    company: "AGE",
    url: "/images/courses/age-safety.jpg",
    category: "ความปลอดภัย",
  },
  {
    id: "age-logistics",
    name: "การบริหารโลจิสติกส์และการขนส่งถ่านหิน",
    company: "AGE",
    url: "/images/courses/age-logistics.jpg",
    category: "โลจิสติกส์และการขนส่ง",
  },
  {
    id: "age-fallback",
    name: "ปกมาตรฐานองค์กร AGE",
    company: "AGE",
    url: "/images/courses/fallback-age.jpg",
    category: "ทั่วไป",
  },
];

async function captureVideoFrame(
  source: File | string,
  seekTime = 1.0,
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const isFile = typeof source !== "string";
    const objectUrl = isFile ? URL.createObjectURL(source) : source;
    video.src = objectUrl;

    let cleaned = false;
    const cleanUp = () => {
      if (!cleaned) {
        cleaned = true;
        if (isFile) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch { }
        }
      }
    };

    const timeout = setTimeout(() => {
      cleanUp();
      reject(new Error("หมดเวลาการดึงภาพจากวิดีโอ (Timeout 10s)"));
    }, 10000);

    video.onloadedmetadata = () => {
      const targetTime =
        video.duration > 0 && seekTime >= video.duration
          ? Math.max(0, video.duration / 2)
          : seekTime;
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("ไม่สามารถสร้าง Canvas Context ได้");
        }
        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            cleanUp();
            if (!blob) {
              reject(new Error("แปลงภาพไม่สำเร็จ"));
            } else {
              resolve({ blob, dataUrl });
            }
          },
          "image/jpeg",
          0.9,
        );
      } catch (err) {
        clearTimeout(timeout);
        cleanUp();
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanUp();
      reject(new Error("ไม่สามารถเปิดวิดีโอเพื่อดึงภาพได้"));
    };
  });
}

export interface CreateCourseModalProps {
  editor: CourseDraft;
  setEditor: Dispatch<SetStateAction<CourseDraft | null>>;
  isAdmin?: boolean;
  busy: boolean;
  uploadingIndex: number | null;
  uploadStatus: string;
  uploadCoverImage?: (
    file: File,
  ) => Promise<{ ok: boolean; url: string; filename: string }>;
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
  isAdmin = false,
  busy,
  uploadingIndex,
  uploadStatus,
  uploadCoverImage,
  saveCourse,
  autoFillCourseTemplate,
  autoFillQuiz,
  duplicateLesson,
  handleSingleVideoUpload,
  handleBatchVideoUpload,
  detectVideoDuration,
}: CreateCourseModalProps) {
  const { activeCompany } = useCompany();
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [draggedLessonIdx, setDraggedLessonIdx] = useState<number | null>(null);
  const [dragOverLessonIdx, setDragOverLessonIdx] = useState<number | null>(
    null,
  );
  const [coverFilter, setCoverFilter] = useState<"company" | "all">("company");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  const effectiveCompany = editor.company || activeCompany || "ABM";
  const filteredPresets =
    coverFilter === "all"
      ? PRESET_COVERS
      : PRESET_COVERS.filter((p) => p.company === effectiveCompany);

  const currentCoverUrl =
    editor.thumbnail && editor.thumbnail.trim().length > 0
      ? editor.thumbnail.trim()
      : getCourseCoverImage(editor as any);

  const handleDropZoneDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || uploadingIndex !== null) return;
    setIsDraggingFiles(true);
  };

  const handleDropZoneDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleDropZoneDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    if (busy || uploadingIndex !== null) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBatchVideoUpload(e.dataTransfer.files);
    }
  };

  const handleLessonDrop = (targetIndex: number) => {
    if (
      draggedLessonIdx === null ||
      draggedLessonIdx === targetIndex ||
      draggedLessonIdx < 0 ||
      draggedLessonIdx >= editor.lessons.length
    ) {
      setDraggedLessonIdx(null);
      setDragOverLessonIdx(null);
      return;
    }
    const reordered = [...editor.lessons];
    const [moved] = reordered.splice(draggedLessonIdx, 1);
    reordered.splice(targetIndex, 0, moved);
    setEditor({
      ...editor,
      lessons: reordered,
    });
    setDraggedLessonIdx(null);
    setDragOverLessonIdx(null);
  };

  return (
    <form onSubmit={saveCourse} className="course-editor-container">
      {/* Sticky Header & Actions */}
      <div className="course-editor-header">
        <div className="course-editor-header-title">
          <h2>{editor.id ? "แก้ไขคอร์ส" : "สร้างคอร์สใหม่"}</h2>
          <p>
            กรอกข้อมูลหลักสูตร จัดการบทเรียนวิดีโอ และตั้งค่าแบบทดสอบท้ายคอร์ส
          </p>
        </div>
        <div className="course-editor-header-actions">
          {!editor.id && (
            <button
              type="button"
              className="editor-template-btn"
              onClick={autoFillCourseTemplate}
              title="เติมข้อมูลตัวอย่างเพื่อลดขั้นตอนการพิมพ์"
            >
              <Wand2 size={15} />
              เติมข้อมูลตัวอย่าง
            </button>
          )}
          <button
            type="button"
            className="editor-cancel-btn"
            onClick={() => setEditor(null)}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="editor-save-btn"
            disabled={busy || uploadingIndex !== null}
          >
            <Save size={16} />
            {busy
              ? "กำลังบันทึก…"
              : uploadingIndex !== null
                ? uploadStatus || "กำลังประมวลผล…"
                : "บันทึกคอร์ส"}
          </button>
        </div>
      </div>

      {/* Card 1: ข้อมูลทั่วไปของคอร์ส (Course Details) */}
      <section className="editor-card">
        <div className="editor-card-header">
          <div className="editor-card-title-group">
            <span className="editor-card-icon">
              <BookOpen size={18} />
            </span>
            <div>
              <h3>ข้อมูลทั่วไปของคอร์ส</h3>
              <p>กำหนดชื่อหลักสูตร คำอธิบาย หมวดหมู่ และกลุ่มผู้เข้าอบรม</p>
            </div>
          </div>
        </div>

        <div className="editor-grid">
          <label className="col-span-full">
            <span>ชื่อคอร์ส</span>
            <input
              required
              minLength={3}
              maxLength={150}
              placeholder="เช่น วัฒนธรรมองค์กรและมาตรฐานการบริการ AGE Group"
              value={editor.title}
              onChange={(e) => setEditor({ ...editor, title: e.target.value })}
            />
          </label>

          <label className="col-span-full">
            <span>คำอธิบาย</span>
            <textarea
              required
              rows={3}
              placeholder="อธิบายวัตถุประสงค์และสิ่งที่ผู้เรียนจะได้รับจากหลักสูตรนี้..."
              value={editor.description}
              onChange={(e) =>
                setEditor({ ...editor, description: e.target.value })
              }
            />
          </label>

          <label>
            <span>หมวดหมู่</span>
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
            <span>ผู้สอน / แผนกที่รับผิดชอบ</span>
            <input
              required
              placeholder="เช่น ฝ่ายทรัพยากรบุคคล (HRD)"
              value={editor.instructor}
              onChange={(e) =>
                setEditor({ ...editor, instructor: e.target.value })
              }
            />
          </label>

          <label>
            <span>บริษัทเจ้าของคอร์ส</span>
            <select
              value={editor.company || activeCompany}
              onChange={(e) =>
                setEditor({
                  ...editor,
                  company: e.target.value as Company,
                })
              }
            >
              <option value="ABM">ABM (Asia Biomass)</option>
              <option value="AGE">AGE (Asia Green Energy)</option>
              <option value="AAG+">AAG+ (AGE Auto Gallery)</option>
            </select>
          </label>

          <label>
            <span>โทนสีปก</span>
            <select
              value={editor.color}
              onChange={(e) =>
                setEditor({
                  ...editor,
                  color: e.target.value as CourseDraft["color"],
                })
              }
            >
              <option value="mint">เขียว (Emerald)</option>
              <option value="peach">ส้ม (Warm Peach)</option>
              <option value="lavender">ม่วง (Lavender)</option>
              <option value="blue">ฟ้า (Ocean Blue)</option>
            </select>
          </label>

          <label>
            <span>กลุ่มผู้เข้าอบรม</span>
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
              {isAdmin && (
                <option value="admin">
                  เฉพาะ{ROLE_LABELS.admin} (Admin)
                </option>
              )}
            </select>
          </label>

          {/* Section: ภาพหน้าปกหลักสูตร (Course Cover Image Picker) */}
          <div className="col-span-full course-cover-picker-section">
            <div className="cover-picker-header">
              <div>
                <span className="cover-picker-title">
                  <ImageIcon size={18} style={{ color: "#047857" }} />
                  รูปภาพหรือวิดีโอหน้าปกหลักสูตร (Course Cover Media)
                </span>
                <p className="cover-picker-subtitle">
                  เลือกรูปหน้าปกสำเร็จรูปประจำองค์กร ({effectiveCompany}), ดึงภาพจากคลิปวิดีโอบทเรียน หรืออัปโหลดไฟล์รูปภาพ/วิดีโอ (.mp4, .webm) เพื่อใช้เป็นหน้าปก
                </p>
              </div>
            </div>

            <div className="cover-picker-layout">
              {/* Left Column: Live Preview Card */}
              <div className="cover-preview-card">
                <div className="cover-preview-media">
                  {isVideoMedia(currentCoverUrl) ? (
                    <video
                      src={currentCoverUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <img
                      src={currentCoverUrl}
                      alt="Current cover preview"
                      onError={(e) => {
                        const fallback = `/images/courses/fallback-${effectiveCompany.toLowerCase().replace(/[^a-z]/g, "") || "aag"}.jpg`;
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                  )}
                  <div className="cover-preview-company-badge">
                    {effectiveCompany}
                    {isVideoMedia(currentCoverUrl) && " • วิดีโอหน้าปก"}
                  </div>
                </div>
                <div className="cover-preview-meta">
                  <span className="cover-preview-label">
                    {isVideoMedia(currentCoverUrl)
                      ? "วิดีโอหน้าปก (Video Cover)"
                      : "ภาพหน้าปกปัจจุบัน (Live Preview)"}
                  </span>
                  <span
                    className="cover-preview-path"
                    title={editor.thumbnail || "(ใช้ภาพเริ่มต้นตามบริษัท)"}
                  >
                    {editor.thumbnail
                      ? editor.thumbnail.split("/").pop() || editor.thumbnail
                      : "ค่าเริ่มต้นตามบริษัท (Default)"}
                  </span>
                </div>
              </div>

              {/* Right Column: Upload & Presets */}
              <div className="cover-picker-controls">
                {/* Actions: Upload & Reset & Extract Frame */}
                <div className="cover-picker-actions">
                  <label className="cover-upload-btn">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
                      disabled={uploadingCover}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!uploadCoverImage) {
                          setCoverUploadError("ระบบอัปโหลดรูปภาพยังไม่พร้อมใช้งาน");
                          return;
                        }
                        try {
                          setUploadingCover(true);
                          setCoverUploadError(null);
                          const res = await uploadCoverImage(file);
                          if (res.ok && res.url) {
                            setEditor({ ...editor, thumbnail: res.url });
                          }
                        } catch (err) {
                          setCoverUploadError(
                            err instanceof Error
                              ? err.message
                              : "อัปโหลดไฟล์ไม่สำเร็จ",
                          );
                        } finally {
                          setUploadingCover(false);
                          e.target.value = "";
                        }
                      }}
                      style={{ display: "none" }}
                    />
                    <Upload size={14} />
                    {uploadingCover ? "กำลังอัปโหลด..." : "อัปโหลดภาพ/วิดีโอหน้าปก"}
                  </label>

                  {/* Extract snapshot frame from lesson video */}
                  {editor.lessons.some((l) => l.videoUrl && l.videoUrl.trim().length > 0) && (
                    <button
                      type="button"
                      className="cover-extract-video-btn"
                      disabled={uploadingCover}
                      onClick={async () => {
                        const targetLesson = editor.lessons.find(
                          (l) => l.videoUrl && l.videoUrl.trim().length > 0,
                        );
                        if (!targetLesson || !targetLesson.videoUrl || !uploadCoverImage)
                          return;
                        try {
                          setUploadingCover(true);
                          setCoverUploadError(null);
                          const { blob } = await captureVideoFrame(
                            targetLesson.videoUrl,
                            1.0,
                          );
                          const file = new File(
                            [blob],
                            `lesson-frame-${Date.now()}.jpg`,
                            { type: "image/jpeg" },
                          );
                          const res = await uploadCoverImage(file);
                          if (res.ok && res.url) {
                            setEditor({ ...editor, thumbnail: res.url });
                          }
                        } catch (err) {
                          setCoverUploadError(
                            err instanceof Error
                              ? err.message
                              : "ไม่สามารถดึงภาพจากวิดีโอบทเรียนได้",
                          );
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                      title="ดึงภาพ Snapshot จากวิดีโอบทเรียนแรกมาเป็นหน้าปก"
                    >
                      <Camera size={13} />
                      ดึงภาพจากวิดีโอบทเรียน
                    </button>
                  )}

                  {/* If current cover is a video, allow converting frame to static image */}
                  {isVideoMedia(currentCoverUrl) && (
                    <button
                      type="button"
                      className="cover-extract-video-btn"
                      disabled={uploadingCover}
                      onClick={async () => {
                        if (!uploadCoverImage) return;
                        try {
                          setUploadingCover(true);
                          setCoverUploadError(null);
                          const { blob } = await captureVideoFrame(currentCoverUrl, 1.0);
                          const file = new File(
                            [blob],
                            `video-frame-${Date.now()}.jpg`,
                            { type: "image/jpeg" },
                          );
                          const res = await uploadCoverImage(file);
                          if (res.ok && res.url) {
                            setEditor({ ...editor, thumbnail: res.url });
                          }
                        } catch (err) {
                          setCoverUploadError(
                            err instanceof Error
                              ? err.message
                              : "ไม่สามารถดึงภาพจากวิดีโอปกได้",
                          );
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                      title="แปลงเฟรมของวิดีโอนี้เป็นรูปภาพนิ่ง"
                    >
                      <Camera size={13} />
                      แปลงวิดีโอนี้เป็นภาพนิ่ง
                    </button>
                  )}

                  {editor.thumbnail && (
                    <button
                      type="button"
                      className="cover-reset-btn"
                      onClick={() =>
                        setEditor({ ...editor, thumbnail: undefined })
                      }
                      title="ล้างรูปภาพที่เลือกและใช้ภาพเริ่มต้นตามบริษัท"
                    >
                      <RefreshCw size={13} />
                      คืนค่าภาพเริ่มต้น
                    </button>
                  )}
                </div>

                {coverUploadError && (
                  <div className="cover-upload-error">{coverUploadError}</div>
                )}

                {/* Preset Header & Filter Pills */}
                <div className="cover-presets-header">
                  <span>เลือกจากคลังภาพสำเร็จรูป (Presets):</span>
                  <div className="cover-filter-pills">
                    <button
                      type="button"
                      className={`cover-pill ${coverFilter === "company" ? "active" : ""}`}
                      onClick={() => setCoverFilter("company")}
                    >
                      {effectiveCompany}
                    </button>
                    <button
                      type="button"
                      className={`cover-pill ${coverFilter === "all" ? "active" : ""}`}
                      onClick={() => setCoverFilter("all")}
                    >
                      ทั้งหมด ({PRESET_COVERS.length})
                    </button>
                  </div>
                </div>

                {/* Preset Grid */}
                <div className="cover-presets-grid">
                  {filteredPresets.map((preset) => {
                    const isSelected =
                      (editor.thumbnail && editor.thumbnail === preset.url) ||
                      (!editor.thumbnail && currentCoverUrl === preset.url);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`cover-preset-item ${isSelected ? "selected" : ""}`}
                        onClick={() =>
                          setEditor({ ...editor, thumbnail: preset.url })
                        }
                        title={`เลือก: ${preset.name}`}
                      >
                        <div className="cover-preset-thumb-wrap">
                          <img src={preset.url} alt={preset.name} />
                          {isSelected && (
                            <div className="cover-selected-badge">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div className="cover-preset-info">
                          <span className="cover-preset-name">
                            {preset.name}
                          </span>
                          <span className="cover-preset-comp">
                            {preset.company}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct URL / Path input */}
                <div className="cover-url-input-wrap">
                  <span>หรือระบุ URL / Path รูปภาพโดยตรง:</span>
                  <input
                    type="text"
                    placeholder="/images/courses/your-cover.jpg หรือ https://..."
                    value={editor.thumbnail || ""}
                    onChange={(e) =>
                      setEditor({ ...editor, thumbnail: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: จัดการบทเรียน (Lesson Manager) */}
      <section className="editor-card">
        <div className="editor-card-header">
          <div className="editor-card-title-group">
            <span className="editor-card-icon">
              <Video size={18} />
            </span>
            <div>
              <h3>
                จัดการบทเรียน{" "}
                <span className="count">{editor.lessons.length}</span>
              </h3>
              <p>
                อัปโหลดวิดีโอหลายไฟล์พร้อมกัน หรือจัดการเนื้อหาแต่ละบทเรียน
              </p>
            </div>
          </div>
          <button
            className="secondary small-btn"
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
            <Plus size={15} />
            เพิ่มบทเรียน
          </button>
        </div>

        {/* Drag & Drop Multi-Video Upload Zone */}
        <label
          className={`editor-dropzone ${isDraggingFiles ? "dragging" : ""} ${
            uploadingIndex !== null ? "disabled" : ""
          }`}
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
        >
          <div className="editor-dropzone-icon">
            <Upload size={24} />
          </div>
          <strong>
            {uploadingIndex === -1
              ? uploadStatus || "กำลังนำเข้าไฟล์วิดีโอ…"
              : "นำเข้าวิดีโอหลายไฟล์พร้อมกัน (ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์)"}
          </strong>
          <small>
            รองรับไฟล์ MP4 / WebM เพื่อสร้างบทเรียน ดึงชื่อไฟล์ และคำนวณเวลาเรียนให้อัตโนมัติในคลิกเดียว
          </small>
          <span className="editor-dropzone-btn">
            <Upload size={14} />
            {uploadingIndex === -1 ? "กำลังอัปโหลด…" : "เลือกหลายไฟล์วิดีโอ"}
          </span>
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

        {/* Lesson Blocks */}
        <div className="lesson-blocks-list">
          {editor.lessons.map((l, i) => (
            <div
              key={i}
              className={`lesson-block ${
                dragOverLessonIdx === i ? "drag-over" : ""
              }`}
              onDragOver={(e) => {
                if (draggedLessonIdx === null) return;
                e.preventDefault();
                setDragOverLessonIdx(i);
              }}
              onDragLeave={() => {
                if (dragOverLessonIdx === i) setDragOverLessonIdx(null);
              }}
              onDrop={(e) => {
                if (draggedLessonIdx === null) return;
                e.preventDefault();
                handleLessonDrop(i);
              }}
            >
              <div className="lesson-block-header">
                <div className="lesson-block-title">
                  <span
                    className="lesson-drag-handle"
                    draggable
                    onDragStart={() => setDraggedLessonIdx(i)}
                    onDragEnd={() => {
                      setDraggedLessonIdx(null);
                      setDragOverLessonIdx(null);
                    }}
                    title="ลากเพื่อสลับลำดับบทเรียน"
                    aria-label={`ลากเพื่อสลับลำดับบทเรียนที่ ${i + 1}`}
                  >
                    <GripVertical size={16} />
                  </span>
                  <strong>
                    บทเรียนที่ {i + 1}
                    {l.title ? `: ${l.title}` : ""}
                  </strong>
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
                </div>

                <div className="lesson-block-actions">
                  <button
                    type="button"
                    className="lesson-action-btn"
                    onClick={() => duplicateLesson(i)}
                    title="ทำซ้ำบทเรียนนี้"
                  >
                    <Copy size={14} />
                    ทำซ้ำ
                  </button>
                  {editor.lessons.length > 1 && (
                    <button
                      type="button"
                      className="lesson-action-btn delete"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          lessons: editor.lessons.filter((_, j) => j !== i),
                        })
                      }
                      title="ลบบทเรียนนี้"
                    >
                      <Trash2 size={14} />
                      ลบ
                    </button>
                  )}
                </div>
              </div>

              <div className="editor-grid">
                <label className="col-span-full">
                  <span>ชื่อบทเรียน</span>
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

                <label className="col-span-full">
                  <span>เนื้อหาประกอบบทเรียน</span>
                  <textarea
                    required
                    rows={3}
                    value={l.content}
                    placeholder="สรุปประเด็นสำคัญหรือเนื้อหาประกอบบทเรียน..."
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
              </div>

              <div className="video-upload-box">
                <div className="video-upload-header">
                  <span>
                    <Video
                      size={14}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                    วิดีโอประจำบทเรียน (MP4 / WebM)
                  </span>
                  {l.videoUrl && (
                    <button
                      type="button"
                      className="lesson-action-btn delete"
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

              <div className="editor-grid">
                <label>
                  <span>เวลาเรียน (นาที)</span>
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
                    <span>ความยาววิดีโอ (วินาที)</span>
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
            </div>
          ))}
        </div>

        <button
          className="editor-add-lesson-btn"
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
          เพิ่มบทเรียนใหม่
        </button>
      </section>

      {/* Card 3: แบบทดสอบท้ายคอร์ส (Quiz) */}
      <section className="editor-card">
        <div className="editor-card-header">
          <div className="editor-card-title-group">
            <span className="editor-card-icon">
              <HelpCircle size={18} />
            </span>
            <div>
              <h3>แบบทดสอบท้ายคอร์ส</h3>
              <p>ตั้งคำถามเพื่อประเมินความเข้าใจของผู้เรียนก่อนรับใบประกาศนียบัตร</p>
            </div>
          </div>
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

        <div className="editor-grid">
          <label className="col-span-full">
            <span>คำถาม</span>
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
            <label key={i} className="col-span-full">
              <span>ตัวเลือกที่ {i + 1}</span>
              <input
                required
                value={o}
                placeholder={`ระบุตัวเลือกข้อที่ ${i + 1}...`}
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
          <label className="col-span-full">
            <span>คำตอบที่ถูกต้อง</span>
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
                  ตัวเลือกที่ {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="editor-bottom-bar">
          <p className="muted" style={{ margin: 0 }}>
            หมายเหตุ: เมื่อแก้ไขเนื้อหาเดิม ควรสร้างคอร์สใหม่หากต้องการให้ผู้เรียนเริ่มเก็บผลใหม่
          </p>
          <div className="course-editor-header-actions">
            <button
              type="button"
              className="editor-cancel-btn"
              onClick={() => setEditor(null)}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="editor-save-btn"
              disabled={busy || uploadingIndex !== null}
            >
              <Save size={16} />
              {busy
                ? "กำลังบันทึก…"
                : uploadingIndex !== null
                  ? uploadStatus || "กำลังประมวลผลวิดีโอ…"
                  : "บันทึกคอร์ส"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
