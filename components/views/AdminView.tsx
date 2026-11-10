"use client";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Plus,
  Trash2,
  Search,
  X,
  UserPlus,
  SlidersHorizontal,
  RefreshCw,
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
} from "../../lib/types";
import CreateCourseModal from "../modals/CreateCourseModal";

export interface AdminViewProps {
  user: PublicUser;
  courses: PublicCourse[];
  adminCourses: Course[];
  users: UserReport[];
  filteredUsers: UserReport[];
  editor: CourseDraft | null;
  setEditor: Dispatch<SetStateAction<CourseDraft | null>>;
  emptyCourse: () => CourseDraft;
  busy: boolean;
  uploadingIndex: number | null;
  uploadStatus: string;
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
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>จัดการการเรียนรู้</h1>
          <p>ดูแลคอร์สและติดตามการเติบโตของทีม</p>
        </div>
        <button className="primary" onClick={() => setEditor(emptyCourse())}>
          <Plus size={18} />
          สร้างคอร์ส
        </button>
      </div>
      {editor ? (
        <CreateCourseModal
          editor={editor}
          setEditor={setEditor}
          busy={busy}
          uploadingIndex={uploadingIndex}
          uploadStatus={uploadStatus}
          saveCourse={saveCourse}
          autoFillCourseTemplate={autoFillCourseTemplate}
          autoFillQuiz={autoFillQuiz}
          duplicateLesson={duplicateLesson}
          handleSingleVideoUpload={handleSingleVideoUpload}
          handleBatchVideoUpload={handleBatchVideoUpload}
          detectVideoDuration={detectVideoDuration}
        />
      ) : (
        <section className="admin-panel">
          <h2>คอร์สทั้งหมด ({adminCourses.length})</h2>
          {adminCourses.map((c) => (
            <div className="admin-row" key={c.id}>
              <div>
                <b>{c.title}</b>
                <small>
                  {c.lessons.length} บทเรียน · {c.category}
                  {c.targetRole && c.targetRole !== "all" && (
                    <span
                      style={{
                        marginLeft: "8px",
                        color: "#27561f",
                        background: "#eef6e9",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {`เฉพาะ${getRoleLabel(c.targetRole)}`}
                    </span>
                  )}
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
          <div>
            <h2>
              {isAdminRole(user.role)
                ? `จัดการผู้ใช้งานและรายงาน (${users.length})`
                : `รายงานความคืบหน้าผู้เข้าอบรม (${users.length})`}
            </h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {isAdminRole(user.role)
                ? "กำหนดสิทธิ์ (Role) สร้างบัญชีผู้ใช้ใหม่ และติดตามผลการเรียนรู้"
                : "ติดตามผลการเรียนรู้และกำหนดสิทธิ์การเข้าถึงคอร์สเรียน"}
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
            {isAdminRole(user.role) && (
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
              ส่งออก CSV
            </button>
          </div>
        </div>
        {syncStatus && (
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

        {isAdminRole(user.role) && showAddUser && (
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
              placeholder="ค้นหารายชื่อ อีเมล หรือแผนก..."
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
              {users.filter((u) => normalizeRole(u.role) === "manager").length})
            </option>
            <option value="employee">
              {ROLE_LABELS.employee} (
              {users.filter((u) => normalizeRole(u.role) === "employee").length}
              )
            </option>
          </select>
          {(userSearchQuery || userRoleFilter !== "all") && (
            <span className="muted" style={{ fontSize: "13px" }}>
              พบ {filteredUsers.length} จาก {users.length} รายการ
            </span>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ชื่อ / อีเมล</th>
                <th>สิทธิ์ (Role)</th>
                <th>คอร์สที่เข้าถึง</th>
                <th>คอร์สที่ผ่าน</th>
                {isAdminRole(user.role) && (
                  <th style={{ width: "60px", textAlign: "center" }}>ลบ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdminRole(user.role) ? 5 : 4}
                    style={{
                      textAlign: "center",
                      padding: "28px 16px",
                      color: "#6b7d65",
                    }}
                  >
                    ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const normRole = normalizeRole(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        {u.name}
                        <small>{u.email}</small>
                        {(u.department || u.jobTitle) && (
                          <small
                            style={{ color: "#5e7556", fontSize: "11px" }}
                          >
                            {[u.jobTitle, u.department]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        )}
                      </td>
                      <td>
                        {isAdminRole(user.role) ? (
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
                            style={{
                              margin: 0,
                              padding: "4px 8px",
                              fontSize: "11px",
                              width: "auto",
                              minWidth: "110px",
                              borderRadius: "5px",
                              border: "1px solid #d1ded0",
                              background:
                                normRole === "admin"
                                  ? "#eef6ea"
                                  : normRole === "manager"
                                    ? "#eef4fc"
                                    : "#fff",
                              fontWeight: normRole !== "employee" ? 600 : 400,
                              color:
                                normRole === "admin"
                                  ? "#1e4c19"
                                  : normRole === "manager"
                                    ? "#1a467a"
                                    : "#44593e",
                            }}
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
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              fontSize: "11px",
                              borderRadius: "5px",
                              background:
                                normRole === "admin"
                                  ? "#eef6ea"
                                  : normRole === "manager"
                                    ? "#eef4fc"
                                    : "#f5f8f4",
                              color:
                                normRole === "admin"
                                  ? "#1e4c19"
                                  : normRole === "manager"
                                    ? "#1a467a"
                                    : "#44593e",
                              fontWeight: normRole !== "employee" ? 600 : 400,
                            }}
                          >
                            {getRoleLabel(normRole)}
                          </span>
                        )}
                      </td>
                      <td>
                        {canManageCourses(normRole) ? (
                          <span className="muted">ทุกคอร์ส</span>
                        ) : (
                          <button
                            type="button"
                            className="secondary small-btn"
                            onClick={() => openCoursePermModal(u)}
                            title="กำหนดว่าผู้ใช้นี้เข้าเรียนคอร์สใดได้บ้าง"
                          >
                            <SlidersHorizontal size={13} />
                            {!u.assignedCourses ||
                            u.assignedCourses.includes("all")
                              ? "ทุกคอร์ส"
                              : `${u.assignedCourses.length} คอร์ส`}
                          </button>
                        )}
                      </td>
                      <td>
                        {
                          u.progress.filter(
                            (p) =>
                              p.passed &&
                              courses.some((c) => c.id === p.courseId),
                          ).length
                        }
                      </td>
                      {isAdminRole(user.role) && (
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
      </section>
    </>
  );
}

