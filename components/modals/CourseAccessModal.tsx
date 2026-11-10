"use client";
import type { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import type { Course, UserReport } from "../../lib/types";

export interface CourseAccessModalProps {
  managingUserCourses: UserReport | null;
  setManagingUserCourses: (user: UserReport | null) => void;
  adminCourses: Course[];
  selectedCourseIds: string[];
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  busy: boolean;
  saveUserCoursePermissions: () => void | Promise<void>;
}

export default function CourseAccessModal({
  managingUserCourses,
  setManagingUserCourses,
  adminCourses,
  selectedCourseIds,
  setSelectedCourseIds,
  busy,
  saveUserCoursePermissions,
}: CourseAccessModalProps) {
  if (!managingUserCourses) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="certificate-modal"
        style={{ maxWidth: 640, width: "min(640px, 100%)" }}
      >
        <div className="modal-actions">
          <button
            className="icon-button"
            aria-label="ปิด"
            onClick={() => setManagingUserCourses(null)}
          >
            <X />
          </button>
        </div>
        <div style={{ padding: "4px 8px 8px" }}>
          <span className="eyebrow">COURSE ACCESS</span>
          <h2 style={{ margin: "6px 0 4px" }}>กำหนดสิทธิ์เข้าเรียน</h2>
          <p className="muted" style={{ margin: "0 0 14px" }}>
            เลือกคอร์สที่ <b>{managingUserCourses.name}</b>{" "}
            สามารถเข้าเรียนและมองเห็นได้ ผู้ใช้นี้จะเห็นเฉพาะคอร์สที่เลือก (ตาม
            Role ของคอร์สด้วย)
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              className="secondary small-btn"
              onClick={() =>
                setSelectedCourseIds(adminCourses.map((c) => c.id))
              }
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              className="secondary small-btn"
              onClick={() => setSelectedCourseIds([])}
            >
              ไม่เลือกเลย
            </button>
            <span className="muted" style={{ alignSelf: "center" }}>
              เลือก {selectedCourseIds.length}/{adminCourses.length} คอร์ส
            </span>
          </div>
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              border: "1px solid #dbe6d5",
              borderRadius: 10,
              padding: "8px 10px",
              marginBottom: 16,
              background: "#fbfdf9",
            }}
          >
            {adminCourses.length ? (
              adminCourses.map((c) => {
                const checked = selectedCourseIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "8px 4px",
                      borderBottom: "1px solid #eef3eb",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCourseIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id],
                        )
                      }
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <b style={{ display: "block" }}>{c.title}</b>
                      <small className="muted">
                        {c.category}
                        {c.targetRole && c.targetRole !== "all"
                          ? ` · เฉพาะ ${c.targetRole === "admin" ? "ผู้ดูแล" : "ผู้เรียน"}`
                          : ""}
                      </small>
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="muted">ยังไม่มีคอร์สในระบบ</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="text-button"
              onClick={() => setManagingUserCourses(null)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={saveUserCoursePermissions}
            >
              {busy ? "กำลังบันทึก…" : "บันทึกสิทธิ์เข้าเรียน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

