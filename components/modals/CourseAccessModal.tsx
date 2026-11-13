"use client";
import type { Dispatch, SetStateAction } from "react";
import { X, CheckSquare, Square, Shield, BookOpen, Check } from "lucide-react";
import {
  type Course,
  type UserReport,
  getRoleLabel,
  resolveCourseCompany,
  type Company,
} from "../../lib/types";

export interface CourseAccessModalProps {
  managingUserCourses: UserReport | null;
  setManagingUserCourses: (user: UserReport | null) => void;
  adminCourses: Course[];
  selectedCourseIds: string[];
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  busy: boolean;
  saveUserCoursePermissions: () => void | Promise<void>;
}

const COMPANY_BADGE_STYLE: Record<Company, string> = {
  AGE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ABM: "bg-sky-50 text-sky-700 border-sky-200",
  "AAG+": "bg-red-50 text-red-700 border-red-200",
};

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

  const totalCourses = adminCourses.length;
  const selectedCount = selectedCourseIds.length;
  const isAllSelected = totalCourses > 0 && selectedCount === totalCourses;

  const handleSelectAll = () => {
    setSelectedCourseIds(adminCourses.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCourseIds([]);
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => setManagingUserCourses(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-access-title"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-md mb-2">
                <Shield size={13} className="text-emerald-600" />
                Course Access Control
              </span>
              <h2
                id="course-access-title"
                className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
              >
                กำหนดสิทธิ์เข้าเรียน
              </h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                กำหนดคอร์สที่{" "}
                <strong className="text-gray-800 font-semibold">
                  {managingUserCourses.name}
                </strong>{" "}
                ({managingUserCourses.email}) สามารถเข้าเรียนและมองเห็นได้ในแคตตาล็อก
              </p>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="ปิดหน้าต่าง"
              onClick={() => setManagingUserCourses(null)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100/80">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                เลือกแล้ว{" "}
                <span className="text-emerald-700 font-bold">
                  {selectedCount}
                </span>{" "}
                / {totalCourses} คอร์ส
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <CheckSquare size={14} />
                เลือกทั้งหมด
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Square size={14} />
                ไม่เลือกเลย
              </button>
            </div>
          </div>
        </div>

        {/* Body: Course List */}
        <div className="max-h-[50vh] overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {adminCourses.length > 0 ? (
            adminCourses.map((c) => {
              const checked = selectedCourseIds.includes(c.id);
              const company = resolveCourseCompany(c);
              const badgeClass =
                COMPANY_BADGE_STYLE[company] ||
                COMPANY_BADGE_STYLE.AGE;

              return (
                <div
                  key={c.id}
                  onClick={() => handleToggleCourse(c.id)}
                  className={`flex items-start gap-3.5 p-3.5 border rounded-xl transition-all duration-150 cursor-pointer select-none ${
                    checked
                      ? "bg-emerald-50/50 border-emerald-200/90 shadow-xs"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-slate-50/70"
                  }`}
                >
                  {/* Custom Checkbox (Strict inline dimensions to prevent CSS pollution) */}
                  <div className="pt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      id={`course-${c.id}`}
                      checked={checked}
                      onChange={() => handleToggleCourse(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "20px",
                        height: "20px",
                        minWidth: "20px",
                        margin: "0",
                        padding: "0",
                        cursor: "pointer",
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </div>

                  {/* Course Details (Adjacent to Checkbox) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm sm:text-base font-semibold text-gray-900 leading-snug break-words">
                        {c.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${badgeClass}`}
                      >
                        {company}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                        <BookOpen size={12} className="text-gray-400" />
                        {c.category}
                      </span>
                      {c.targetRole && c.targetRole !== "all" && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                            เฉพาะ{getRoleLabel(c.targetRole)}
                          </span>
                        </>
                      )}
                      <span className="text-gray-300">·</span>
                      <span>{c.lessons.length} บทเรียน</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4">
              <BookOpen size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                ยังไม่มีหลักสูตรในระบบ
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:px-6 flex items-center justify-end gap-3 rounded-b-2xl z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setManagingUserCourses(null)}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={saveUserCoursePermissions}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 active:bg-emerald-900 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            {busy ? "กำลังบันทึก…" : "บันทึกสิทธิ์เข้าเรียน"}
          </button>
        </div>
      </div>
    </div>
  );
}
