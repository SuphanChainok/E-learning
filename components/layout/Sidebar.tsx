"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Plus, Sparkles, LogOut } from "lucide-react";
import {
  type PublicUser,
  type CourseDraft,
  type View,
  canManageCourses,
  getRoleLabel,
  normalizeRole,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";

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
  const roleKey = normalizeRole(user.role);
  const { activeCompany, companyInfo } = useCompany();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [activeCompany]);

  return (
    <>
      <aside className={"sidebar " + (mobile ? "opened" : "")}>
        <div className="sidebar-header">
          <a className="brand flex items-center gap-3" href="/" title={companyInfo.name}>
            {!logoFailed ? (
              <div className="brand-logo-wrap w-11 h-11 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Image
                  key={companyInfo.logoPath}
                  src={companyInfo.logoPath}
                  alt={companyInfo.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  priority
                  onError={() => setLogoFailed(true)}
                />
              </div>
            ) : (
              <span className={`brand-badge badge-${activeCompany.toLowerCase().replace("+", "-plus")}`}>
                {companyInfo.badge}
              </span>
            )}
            <span className="brand-copy">
              <span className="brand-title">
                {companyInfo.shortName}
              </span>
              <small>{companyInfo.headerSubtitle}</small>
            </span>
          </a>
        </div>
        <div className="workspace-tag">
          <span />
          พื้นที่เรียนรู้ {companyInfo.shortName}
        </div>
        <p className="nav-caption">YOUR LEARNING SPACE</p>
        <nav>
          {nav.map(([key, Icon, title]) => (
            <button
              key={key}
              className={view === key && !editor ? "active" : ""}
              onClick={() => {
                navigate(key);
                setMobile(false);
              }}
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
                "create-course-nav-btn " +
                (view === "admin" && editor && !editor.id ? "active" : "")
              }
              onClick={() => {
                openCreateCourseModal();
                setMobile(false);
              }}
            >
              <Plus size={19} />
              เพิ่มคอร์สใหม่
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-note">
            <Sparkles size={22} />
            <b>เก่งขึ้นอีกนิด ในทุกวัน</b>
            <p>
              ทุกการเรียนรู้ คืออีกก้าว
              <br />
              ของการเติบโตไปกับ AGE Group
            </p>
            <span>AGE GROUP ACADEMY ↗</span>
          </div>
          <button
            className="profile"
            onClick={onLogout}
            title="คลิกเพื่อออกจากระบบ"
          >
            <span className={"avatar role-" + roleKey}>
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="profile-info">
              <b>{user.name}</b>
              <small className={"role-pill " + roleKey}>
                {getRoleLabel(user.role)}
              </small>
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
