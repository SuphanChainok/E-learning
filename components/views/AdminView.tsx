"use client";
import {
  useState,
  useEffect,
  useMemo,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Search,
  X,
  UserPlus,
  SlidersHorizontal,
  RefreshCw,
  BookOpen,
  Users,
  Award,
  ShieldCheck,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type Course,
  type CourseDraft,
  type UserReport,
  type Role,
  ROLE_LABELS,
  getRoleLabel,
  normalizeRole,
  canManageCourses,
  isAdminRole,
  type Company,
  sortCoursesLatestFirst,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";
import CreateCourseModal from "../modals/CreateCourseModal";
import { getCourseCoverImage, isVideoMedia } from "../CourseCard";

export interface AdminViewProps {
  user: PublicUser;
  courses: PublicCourse[];
  adminCourses: Course[];
  users: UserReport[];
  filteredUsers: UserReport[];
  editor: CourseDraft | null;
  setEditor: Dispatch<SetStateAction<CourseDraft | null>>;
  emptyCourse: (company?: Company) => CourseDraft;
  busy: boolean;
  uploadingIndex: number | null;
  uploadStatus: string;
  uploadCoverImage?: (
    file: File,
  ) => Promise<{ ok: boolean; url: string; filename: string }>;
  saveCourse: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  removeCourse: (c: Course) => void | Promise<void>;
  autoFillCourseTemplate: () => void;
  autoFillQuiz: () => void;
  duplicateLesson: (index: number) => void;
  handleSingleVideoUpload: (index: number, file: File) => void | Promise<void>;
  handleBatchVideoUpload: (files: FileList | File[]) => void | Promise<void>;
  detectVideoDuration: (fileOrUrl: File | string) => Promise<number>;
  showAddUser: boolean;
  setShowAddUser: (show: boolean) => void;
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  newUserRole: Role;
  setNewUserRole: (role: Role) => void;
  handleAddUser: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  syncingUsers: boolean;
  syncStatus: string;
  handleSyncUsers: () => void | Promise<void>;
  exportReport: () => void;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  userRoleFilter: "all" | Role;
  setUserRoleFilter: (role: "all" | Role) => void;
  handleRoleChange: (userId: string, newRole: Role) => void | Promise<void>;
  openCoursePermModal: (u: UserReport) => void;
  handleDeleteUser: (u: UserReport) => void | Promise<void>;
}

export default function AdminView({
  user,
  courses,
  adminCourses,
  users,
  filteredUsers,
  editor,
  setEditor,
  emptyCourse,
  busy,
  uploadingIndex,
  uploadStatus,
  uploadCoverImage,
  saveCourse,
  removeCourse,
  autoFillCourseTemplate,
  autoFillQuiz,
  duplicateLesson,
  handleSingleVideoUpload,
  handleBatchVideoUpload,
  detectVideoDuration,
  showAddUser,
  setShowAddUser,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  handleAddUser,
  syncingUsers,
  syncStatus,
  handleSyncUsers,
  exportReport,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  handleRoleChange,
  openCoursePermModal,
  handleDeleteUser,
}: AdminViewProps) {
  const { activeCompany } = useCompany();
  const isAdmin = isAdminRole(user.role);

  const companyAdminCourses = useMemo(() => {
    const list = adminCourses.filter(
      (c) => (c.company || "AGE") === activeCompany,
    );
    return sortCoursesLatestFirst(list);
  }, [adminCourses, activeCompany]);

  // Manager only sees non-admin courses and only employee learners
  const visibleCourses = isAdmin
    ? companyAdminCourses
    : companyAdminCourses.filter((c) => c.targetRole !== "admin");

  const learnerUsers = users.filter(
    (u) => normalizeRole(u.role) === "employee",
  );
  const visibleUsers = isAdmin
    ? filteredUsers
    : filteredUsers.filter((u) => normalizeRole(u.role) === "employee");

  const totalPassedEnrollments = (isAdmin ? users : learnerUsers).reduce(
    (sum, u) =>
      sum +
      u.progress.filter(
        (p) => p.passed && courses.some((c) => c.id === p.courseId),
      ).length,
    0,
  );

  const adminAndManagerCount = users.filter((u) =>
    canManageCourses(u.role),
  ).length;

  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>(
    {},
  );

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  // Reset to first page when search or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchQuery, userRoleFilter]);

  const totalItems = visibleUsers.length;
  const isAll = itemsPerPage === "all";
  const perPageNum = isAll ? totalItems : itemsPerPage;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / perPageNum));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * perPageNum;
  const endIndex = isAll ? totalItems : Math.min(startIndex + perPageNum, totalItems);
  const paginatedUsers = isAll
    ? visibleUsers
    : visibleUsers.slice(startIndex, endIndex);

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (safePage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {isAdmin
              ? "SYSTEM ADMINISTRATION · AGE GROUP"
              : "COURSE & LEARNING MANAGEMENT · AGE GROUP"}
          </span>
          <h1>
            {isAdmin
              ? "จัดการระบบและผู้ใช้งาน"
              : "จัดการหลักสูตรและติดตามผลการเรียน"}
          </h1>
          <p>
            {isAdmin
              ? "ดูแลหลักสูตรทั้งหมด กำหนดสิทธิ์ผู้ใช้งาน (RBAC) และซิงค์ข้อมูลบุคลากรจาก Azure Entra ID"
              : "สร้างและแก้ไขหลักสูตร อัปโหลดคลิปวิดีโอ/แบบทดสอบ และติดตามความคืบหน้าของผู้เข้าอบรม"}
          </p>
        </div>
        <button className="primary" onClick={() => setEditor(emptyCourse(activeCompany))}>
          <Plus size={18} />
          สร้างคอร์สใหม่
        </button>
      </div>

      <div className="stats admin-stats">
        <div>
          <span className="stat-icon circle">
            <BookOpen />
          </span>
          <div>
            <p>{isAdmin ? "หลักสูตรในระบบ" : "หลักสูตรที่เปิดสอน"}</p>
            <b>
              {visibleCourses.length}
              <small> คอร์ส</small>
            </b>
          </div>
        </div>
        <div>
          <span className="stat-icon circle">
            {isAdmin ? <ShieldCheck /> : <Users />}
          </span>
          <div>
            <p>{isAdmin ? "ผู้ใช้งานทั้งหมด" : "ผู้เข้าอบรมทั้งหมด"}</p>
            <b>
              {isAdmin ? users.length : learnerUsers.length}
              <small> คน</small>
            </b>
          </div>
          {isAdmin && (
            <span className="stat-note">
              ADMIN/MANAGER {adminAndManagerCount} คน
            </span>
          )}
        </div>
        <div>
          <span className="stat-icon circle">
            <Award />
          </span>
          <div>
            <p>ผ่านการอบรมรวม</p>
            <b>
              {totalPassedEnrollments}
              <small> คอร์ส</small>
            </b>
          </div>
        </div>
      </div>

      {editor ? (
        <CreateCourseModal
          editor={editor}
          setEditor={setEditor}
          isAdmin={isAdmin}
          busy={busy}
          uploadingIndex={uploadingIndex}
          uploadStatus={uploadStatus}
          uploadCoverImage={uploadCoverImage}
          saveCourse={saveCourse}
          autoFillCourseTemplate={autoFillCourseTemplate}
          autoFillQuiz={autoFillQuiz}
          duplicateLesson={duplicateLesson}
          handleSingleVideoUpload={handleSingleVideoUpload}
          handleBatchVideoUpload={handleBatchVideoUpload}
          detectVideoDuration={detectVideoDuration}
        />
      ) : (
        <section className="admin-course-section">
          <div className="section-heading">
            <div>
              <h2>
                จัดการหลักสูตร <span className="count">{visibleCourses.length}</span>
              </h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                จัดการเนื้อหาบทเรียน อัปโหลดคลิปวิดีโอ และตั้งค่าแบบทดสอบท้ายคอร์ส
              </p>
            </div>
          </div>
          <div className="admin-course-grid">
            {visibleCourses.map((c, index) => {
              const hasFailed = Boolean(failedThumbIds[c.id]);
              const isPriority = index <= 2;
              return (
                <article className="admin-course-card" key={c.id}>
                  <div className="admin-course-thumb">
                    {hasFailed ? (
                      <div className="admin-thumb-fallback" aria-label={c.title}>
                        <span className="admin-thumb-fallback-badge">{c.company || "AGE"}</span>
                        <small>{c.company === "ABM" ? "ASIA BIOMASS" : c.company === "AAG+" ? "AGE AUTO GALLERY" : "AGE GROUP"}</small>
                      </div>
                    ) : (
                      <>
                        {isVideoMedia(getCourseCoverImage(c)) ? (
                          <video
                            src={getCourseCoverImage(c)}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="admin-thumb-img"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <Image
                            src={getCourseCoverImage(c)}
                            alt={c.title}
                            fill
                            priority={isPriority}
                            loading={isPriority ? undefined : "lazy"}
                            unoptimized={getCourseCoverImage(c).startsWith("http")}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw"
                            className="admin-thumb-img"
                            onError={() =>
                              setFailedThumbIds((prev) => ({
                                ...prev,
                                [c.id]: true,
                              }))
                            }
                          />
                        )}
                        <span className="admin-thumb-badge">{c.company || "AGE GROUP"}</span>
                        {c.targetRole && c.targetRole !== "all" && (
                          <span className="admin-thumb-role-pill">
                            {`เฉพาะ${getRoleLabel(c.targetRole)}`}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="admin-course-body">
                    <h3 className="admin-course-title" title={c.title}>
                      {c.title}
                    </h3>
                    <div className="admin-course-meta">
                      <span className={`course-company-pill company-${(c.company || "AGE").toLowerCase().replace("+", "-plus")}`}>
                        {c.company || "AGE"}
                      </span>
                      <span>{c.lessons.length} บทเรียน</span>
                      <span className="meta-dot">•</span>
                      <span>{c.category}</span>
                      <span className="meta-dot">•</span>
                      <span>{c.duration} นาที</span>
                    </div>
                    <div className="admin-course-actions">
                      <button
                        type="button"
                        className="admin-edit-btn"
                        onClick={() => setEditor(structuredClone(c))}
                      >
                        <Pencil size={15} />
                        แก้ไขหลักสูตร
                      </button>
                      <button
                        type="button"
                        className="admin-delete-btn"
                        aria-label={"ลบ " + c.title}
                        title={"ลบหลักสูตร " + c.title}
                        disabled={busy}
                        onClick={() => removeCourse(c)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>
              {isAdmin
                ? `จัดการผู้ใช้งานและสิทธิ์ระบบ (${users.length})`
                : `ติดตามผลการเรียนของผู้เข้าอบรม (${learnerUsers.length})`}
            </h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {isAdmin
                ? "กำหนดสิทธิ์ (Role) สร้างบัญชีผู้ใช้ใหม่ ซิงค์จาก Azure และติดตามผลการเรียนรู้"
                : "ดูความคืบหน้าการเรียน กำหนดคอร์สเรียนรายบุคคล และส่งออกรายงานผลการอบรม"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {isAdmin && (
              <>
                <button
                  className="primary small-btn"
                  onClick={() => setShowAddUser(!showAddUser)}
                  type="button"
                >
                  <UserPlus size={14} />
                  {showAddUser ? "ปิดฟอร์ม" : "เพิ่มผู้ใช้งาน"}
                </button>
                <button
                  className="secondary small-btn"
                  onClick={handleSyncUsers}
                  disabled={syncingUsers || busy}
                  type="button"
                >
                  <RefreshCw size={14} />
                  {syncingUsers ? "กำลังซิงค์ Azure…" : "ซิงค์ผู้ใช้จาก Azure"}
                </button>
              </>
            )}
            <button className="secondary small-btn" onClick={exportReport}>
              {isAdmin ? "ส่งออก CSV" : "ส่งออกรายงานผลการเรียน (CSV)"}
            </button>
          </div>
        </div>
        {isAdmin && syncStatus && (
          <p
            style={{
              margin: "0 0 16px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#eef6ea",
              color: "#1e4c19",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            ✓ {syncStatus}
          </p>
        )}

        {isAdmin && showAddUser && (
          <form
            onSubmit={handleAddUser}
            style={{
              background: "#f7faf5",
              border: "1px solid #dbe6d5",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                color: "#2d4e24",
              }}
            >
              สร้างผู้ใช้งานใหม่และกำหนดสิทธิ์
            </h3>
            <div className="form-row">
              <label>
                ชื่อ-นามสกุล
                <input
                  required
                  value={newUserName}
                  placeholder="เช่น สมชาย ใจดี"
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </label>
              <label>
                อีเมล
                <input
                  required
                  type="email"
                  value={newUserEmail}
                  placeholder="user@example.com"
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                รหัสผ่านเริ่มต้น (อย่างน้อย 10 ตัวอักษร)
                <input
                  required
                  type="password"
                  minLength={10}
                  value={newUserPassword}
                  placeholder="อย่างน้อย 10 ตัวอักษร"
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </label>
              <label>
                สิทธิ์การใช้งาน (Role)
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                >
                  <option value="employee">
                    {ROLE_LABELS.employee} (Employee)
                  </option>
                  <option value="manager">
                    {ROLE_LABELS.manager} (Manager)
                  </option>
                  <option value="admin">{ROLE_LABELS.admin} (Admin)</option>
                </select>
              </label>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              <button className="primary small-btn" disabled={busy}>
                {busy ? "กำลังสร้าง…" : "บันทึกผู้ใช้งาน"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setShowAddUser(false)}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div
            className="search"
            style={{
              flex: "1 1 280px",
              margin: 0,
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size={16} />
            <input
              type="search"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder={
                isAdmin
                  ? "ค้นหารายชื่อ อีเมล หรือแผนก..."
                  : "ค้นหารายชื่อผู้เข้าอบรม อีเมล หรือแผนก..."
              }
              aria-label="ค้นหารายชื่อหรืออีเมลผู้ใช้งาน"
              style={{ paddingRight: userSearchQuery ? "32px" : undefined }}
            />
            {userSearchQuery && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setUserSearchQuery("")}
                aria-label="ล้างคำค้นหา"
                style={{
                  position: "absolute",
                  right: "8px",
                  padding: "4px",
                  height: "auto",
                  width: "auto",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {isAdmin && (
            <select
              value={userRoleFilter}
              onChange={(e) =>
                setUserRoleFilter(e.target.value as "all" | Role)
              }
              aria-label="กรองตามสิทธิ์ผู้ใช้งาน"
              style={{
                margin: 0,
                width: "auto",
                minWidth: "160px",
                padding: "9px 12px",
                fontSize: "13px",
              }}
            >
              <option value="all">ทุกสิทธิ์ ({users.length})</option>
              <option value="admin">
                {ROLE_LABELS.admin} (
                {users.filter((u) => normalizeRole(u.role) === "admin").length})
              </option>
              <option value="manager">
                {ROLE_LABELS.manager} (
                {
                  users.filter((u) => normalizeRole(u.role) === "manager")
                    .length
                }
                )
              </option>
              <option value="employee">
                {ROLE_LABELS.employee} (
                {
                  users.filter((u) => normalizeRole(u.role) === "employee")
                    .length
                }
                )
              </option>
            </select>
          )}
          {(userSearchQuery || (isAdmin && userRoleFilter !== "all")) && (
            <span className="muted" style={{ fontSize: "13px" }}>
              พบ {visibleUsers.length} จาก{" "}
              {isAdmin ? users.length : learnerUsers.length} รายการ
            </span>
          )}
        </div>

        <div className="user-table-card">
          <div className="overflow-x-auto">
            <table className="user-management-table">
            <thead>
              <tr>
                <th>{isAdmin ? "ชื่อ / อีเมล" : "ผู้เข้าอบรม / อีเมล"}</th>
                {isAdmin && <th>สิทธิ์ (Role)</th>}
                <th>{isAdmin ? "คอร์สที่เข้าถึง" : "คอร์สที่มอบหมาย"}</th>
                {!isAdmin && <th>กำลังเรียน</th>}
                <th>คอร์สที่ผ่าน</th>
                {isAdmin && (
                  <th style={{ width: "60px", textAlign: "center" }}>ลบ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    style={{
                      textAlign: "center",
                      padding: "36px 16px",
                      color: "#64748b",
                    }}
                  >
                    <Users size={32} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#334155" }}>
                      {isAdmin
                        ? "ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา"
                        : "ไม่พบข้อมูลผู้เข้าอบรมที่ตรงกับคำค้นหา"}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสิทธิ์
                    </small>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const normRole = normalizeRole(u.role);
                  const passedCount = u.progress.filter(
                    (p) =>
                      p.passed && courses.some((c) => c.id === p.courseId),
                  ).length;
                  const inProgressCount = u.progress.filter(
                    (p) =>
                      !p.passed &&
                      ((p.completed && p.completed.length > 0) ||
                        (p.videoProgress && p.videoProgress.length > 0)) &&
                      courses.some((c) => c.id === p.courseId),
                  ).length;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-table-user-info">
                          <b>{u.name}</b>
                          <small>{u.email}</small>
                          {(u.department || u.jobTitle) && (
                            <span className="user-department-tag">
                              {[u.jobTitle, u.department]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <select
                            value={normRole}
                            disabled={
                              busy || (user ? u.id === user.id : false)
                            }
                            title={
                              user && u.id === user.id
                                ? "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้"
                                : "เลือกสิทธิ์ผู้ใช้งาน"
                            }
                            className={`user-role-select ${
                              normRole === "admin"
                                ? "role-admin"
                                : normRole === "manager"
                                  ? "role-manager"
                                  : "role-employee"
                            }`}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as Role)
                            }
                          >
                            <option value="employee">
                              {ROLE_LABELS.employee}
                            </option>
                            <option value="manager">
                              {ROLE_LABELS.manager}
                            </option>
                            <option value="admin">{ROLE_LABELS.admin}</option>
                          </select>
                        </td>
                      )}
                      <td>
                        {canManageCourses(normRole) ? (
                          <span className="course-perm-badge-managed">
                            <Sparkles size={11} /> ทุกคอร์ส
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="course-perm-outline-btn"
                            onClick={() => openCoursePermModal(u)}
                            title="กำหนดว่าผู้ใช้นี้เข้าเรียนคอร์สใดได้บ้าง"
                          >
                            <SlidersHorizontal size={12} />
                            <span>
                              {!u.assignedCourses ||
                              u.assignedCourses.includes("all")
                                ? "ทุกคอร์ส"
                                : `${u.assignedCourses.length} คอร์ส`}
                            </span>
                          </button>
                        )}
                      </td>
                      {!isAdmin && (
                        <td>
                          <span className="course-perm-badge specific">
                            {inProgressCount} คอร์ส
                          </span>
                        </td>
                      )}
                      <td>
                        <span
                          className={
                            "course-perm-badge " +
                            (passedCount > 0 ? "all" : "none")
                          }
                          style={
                            passedCount === 0
                              ? {
                                  background: "#f1f5f9",
                                  color: "#64748b",
                                  borderColor: "#e2e8e0",
                                }
                              : undefined
                          }
                        >
                          {passedCount} คอร์ส
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="icon-button danger"
                            disabled={
                              busy || (user ? u.id === user.id : false)
                            }
                            title={
                              user && u.id === user.id
                                ? "ไม่สามารถลบบัญชีของตนเองได้"
                                : `ลบผู้ใช้งาน ${u.name}`
                            }
                            aria-label={`ลบผู้ใช้งาน ${u.name}`}
                            onClick={() => handleDeleteUser(u)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-left">
            <div className="pagination-per-page-box">
              <span>แสดงแถวละ:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val =
                    e.target.value === "all"
                      ? "all"
                      : Number(e.target.value);
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="pagination-select"
              >
                <option value={10}>10 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
                <option value="all">ทั้งหมด ({totalItems})</option>
              </select>
            </div>

            <div className="pagination-summary">
              {totalItems === 0 ? (
                "ไม่พบรายการ"
              ) : (
                <>
                  แสดง <b>{startIndex + 1}–{endIndex}</b> จาก{" "}
                  <b>{totalItems.toLocaleString()}</b> รายการ
                </>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="หน้าก่อนหน้า"
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft size={14} />
                <span>ก่อนหน้า</span>
              </button>

              <div className="pagination-pages">
                {getPageNumbers().map((pageItem, idx) =>
                  typeof pageItem === "number" ? (
                    <button
                      key={pageItem}
                      type="button"
                      className={`pagination-page-number ${
                        pageItem === safePage ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageItem)}
                      aria-current={pageItem === safePage ? "page" : undefined}
                    >
                      {pageItem}
                    </button>
                  ) : (
                    <span key={`dots-${idx}`} className="pagination-dots">
                      …
                    </span>
                  ),
                )}
              </div>

              <button
                type="button"
                className="pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="หน้าถัดไป"
                aria-label="หน้าถัดไป"
              >
                <span>ถัดไป</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      </section>
    </>
  );
}
