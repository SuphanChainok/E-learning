"use client";
import { Menu, Plus } from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type View,
  canManageCourses,
} from "../../lib/types";
import type { NavItem } from "./Sidebar";

export interface NavbarProps {
  user: PublicUser;
  view: View;
  nav: NavItem[];
  selected: PublicCourse | null;
  mobile: boolean;
  setMobile: (open: boolean) => void;
  demo: boolean;
  fallback: boolean;
  openCreateCourseModal: () => void;
}

export default function Navbar({
  user,
  view,
  nav,
  selected,
  mobile,
  setMobile,
  demo,
  fallback,
  openCreateCourseModal,
}: NavbarProps) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        aria-label="เปิดเมนู"
        onClick={() => setMobile(!mobile)}
      >
        <Menu />
      </button>
      <div className="breadcrumb">
        พื้นที่การเรียนรู้ <span>/</span>{" "}
        <b>{selected ? "ห้องเรียน" : nav.find((n) => n[0] === view)?.[2]}</b>
      </div>
      <div className="top-right">
        {canManageCourses(user.role) && (
          <button
            type="button"
            className="primary small-btn"
            onClick={openCreateCourseModal}
          >
            <Plus size={15} />
            สร้างคอร์สใหม่
          </button>
        )}
        {demo && (
          <span className="demo-label">
            {fallback ? "TEMP DEMO" : "DEMO"}
          </span>
        )}
        <span className="today">AAG+ Academy</span>
        <span className="avatar small">{user.name.charAt(0)}</span>
      </div>
    </header>
  );
}

