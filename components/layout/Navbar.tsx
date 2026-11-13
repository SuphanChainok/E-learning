"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Menu, Check, Building2, Lock, Settings } from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type View,
  type Company,
  COMPANIES_INFO,
  getRoleLabel,
  normalizeRole,
  isAdminRole,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";
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
}: NavbarProps) {
  const roleKey = normalizeRole(user.role);
  const { activeCompany, setActiveCompany, companyInfo, companies, allowedCompanies, canSwitch } =
    useCompany();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = isAdminRole(user.role);

  return (
    <header className="topbar fixed top-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="navbar-left flex items-center gap-2 min-w-0">
        <button
          className="mobile-menu icon-button flex-shrink-0"
          aria-label="เปิดเมนู"
          onClick={() => setMobile(!mobile)}
        >
          <Menu />
        </button>

        <div className="breadcrumb flex items-center gap-2">
          <span>{companyInfo.shortName || companyInfo.name}</span> <span>/</span>{" "}
          <b>{selected ? "ห้องเรียน" : nav.find((n) => n[0] === view)?.[2]}</b>
        </div>
      </div>
      <div className="top-right flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {demo && (
          <span className="demo-label hidden sm:inline-block">
            {fallback ? "TEMP DEMO" : "DEMO"}
          </span>
        )}

        {/* Company Switcher Dropdown with Gear Icon (ฟันเฟือง) */}
        <div className="company-switcher-container" ref={dropdownRef}>
          <button
            type="button"
            className={`company-gear-btn flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition-all ${
              dropdownOpen ? "border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-700 bg-emerald-50/50" : ""
            }`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={`ตั้งค่าและเลือกระบบบริษัท (${activeCompany} - ${companyInfo.name})`}
            aria-label="ตั้งค่าและเลือกระบบบริษัท"
            aria-expanded={dropdownOpen}
          >
            <Settings
              size={19}
              className={`transition-transform duration-300 ${
                dropdownOpen ? "rotate-90 text-emerald-700" : "text-slate-600 hover:text-slate-900"
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="company-switcher-dropdown fixed sm:absolute top-[70px] sm:top-[calc(100%+8px)] left-4 right-4 sm:left-auto sm:right-0 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-none mx-auto sm:mx-0 z-[100] bg-white shadow-2xl border border-gray-100 rounded-2xl overflow-hidden"
              role="menu"
            >
              <div className="company-dropdown-header flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                <span className="company-dropdown-title flex items-center gap-1.5 text-xs font-bold text-slate-500 truncate">
                  <Building2 size={13} className="flex-shrink-0" />
                  <span className="truncate">เลือกระบบบริษัท (Multi-Company)</span>
                </span>
                {!isAdmin && (
                  <span className="company-dropdown-hint flex items-center gap-1 text-[10px] font-semibold text-slate-400 truncate ml-2" title="เฉพาะผู้ดูแลระบบที่สลับได้ทุกบริษัท">
                    <Lock size={11} className="flex-shrink-0" />
                    <span className="truncate">สังกัด {user.company || activeCompany}</span>
                  </span>
                )}
              </div>
              <div className="company-dropdown-list p-1.5 space-y-1">
                {companies.map((comp) => {
                  const info = COMPANIES_INFO[comp];
                  const isSelected = activeCompany === comp;
                  const isAllowed = isAdmin || allowedCompanies.includes(comp);

                  return (
                    <button
                      key={comp}
                      type="button"
                      role="menuitem"
                      disabled={!isAllowed}
                      className={`company-dropdown-item w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${isSelected ? "selected bg-emerald-50/60" : "hover:bg-slate-50"
                        } ${!isAllowed ? "disabled opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      onClick={() => {
                        if (isAllowed) {
                          setActiveCompany(comp);
                          setDropdownOpen(false);
                        }
                      }}
                      title={!isAllowed ? "เฉพาะผู้ดูแลระบบหรือพนักงานสังกัดนี้" : info.fullName}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/90 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Image
                          src={info.logoPath}
                          alt={info.name}
                          width={34}
                          height={34}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="company-item-info min-w-0 flex-1">
                        <span className="company-item-name font-bold text-slate-900 text-sm truncate block">
                          {info.shortName || info.name}
                        </span>
                        <small className="company-item-desc text-slate-500 text-xs line-clamp-2 block mt-0.5">
                          {info.description}
                        </small>
                      </div>
                      {isSelected ? (
                        <Check size={16} className="company-item-check text-emerald-600 flex-shrink-0 ml-1" />
                      ) : !isAllowed ? (
                        <Lock size={13} className="company-item-lock text-slate-400 flex-shrink-0 ml-1" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <span className={"topbar-role-badge hidden sm:inline-flex " + roleKey}>
          {getRoleLabel(user.role)}
        </span>
        <span className={"avatar small flex-shrink-0 role-" + roleKey}>
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
