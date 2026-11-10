"use client";
import type { LucideIcon } from "lucide-react";
import { Plus, Sparkles, LogOut } from "lucide-react";
import {
  type PublicUser,
  type CourseDraft,
  type View,
  canManageCourses,
  getRoleLabel,
} from "../../lib/types";

export type NavItem = [View, LucideIcon, string];

export interface SidebarProps {
  user: PublicUser;
  view: View;
  nav: NavItem[];
  coursesCount: number;
  editor: CourseDraft | null;
  mobile: boolean;
  setMobile: (open: boolean) => void;
  navigate: (v: View) => void;
  openCreateCourseModal: () => void;
  onLogout: () => void | Promise<void>;
}

export default function Sidebar({
  user,
  view,
  nav,
  coursesCount,
  editor,
  mobile,
  setMobile,
  navigate,
  openCreateCourseModal,
  onLogout,
}: SidebarProps) {
  return (
    <>
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
              className={view === key && !editor ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              {title}
              {key === "catalog" && (
                <span className="nav-count">{coursesCount}</span>
              )}
            </button>
          ))}
          {canManageCourses(user.role) && (
            <button
              type="button"
              className={
                view === "admin" && editor && !editor.id ? "active" : ""
              }
              onClick={openCreateCourseModal}
              style={{
                marginTop: "6px",
                background:
                  view === "admin" && editor && !editor.id
                    ? undefined
                    : "rgba(45, 78, 36, 0.14)",
                color: "#d9f0d0",
                fontWeight: 600,
              }}
            >
              <Plus size={19} />
              เพิ่มคอร์ส
            </button>
          )}
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
          <button className="profile" onClick={onLogout}>
            <span className="avatar">{user.name.charAt(0)}</span>
            <span>
              <b>{user.name}</b>
              <small>{getRoleLabel(user.role)}</small>
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
    </>
  );
}

