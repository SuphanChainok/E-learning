"use client";
import Image from "next/image";
import { Award, X, Printer, ShieldCheck } from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type Progress,
  type Company,
  COMPANIES_INFO,
} from "../../lib/types";

export interface CertificateModalProps {
  certificate: PublicCourse | null;
  user: PublicUser;
  demo: boolean;
  pFor: (id: string) => Progress | undefined;
  onClose: () => void;
}

interface CertificateTheme {
  primary: string;
  primaryDark: string;
  borderOuter: string;
  borderInner: string;
  cornerAccent: string;
  ribbonColor: string;
  headingColor: string;
  badgeBg: string;
  certTitleTh: string;
}

const THEMES: Record<Company, CertificateTheme> = {
  AGE: {
    primary: "#005B36",
    primaryDark: "#064E3B",
    borderOuter: "rgba(0, 91, 54, 0.35)",
    borderInner: "rgba(0, 91, 54, 0.75)",
    cornerAccent: "#D4AF37",
    ribbonColor: "#005B36",
    headingColor: "#005B36",
    badgeBg: "#ECFDF5",
    certTitleTh: "ใบประกาศนียบัตรรับรองการสำเร็จหลักสูตร",
  },
  ABM: {
    primary: "#0284C7",
    primaryDark: "#0369A1",
    borderOuter: "rgba(2, 132, 199, 0.35)",
    borderInner: "rgba(2, 132, 199, 0.75)",
    cornerAccent: "#D97706",
    ribbonColor: "#0284C7",
    headingColor: "#0284C7",
    badgeBg: "#F0F9FF",
    certTitleTh: "ใบประกาศนียบัตรรับรองการสำเร็จหลักสูตร",
  },
  "AAG+": {
    primary: "#991B1B",
    primaryDark: "#004b2b",
    borderOuter: "rgba(212, 175, 55, 0.45)",
    borderInner: "rgba(153, 27, 27, 0.75)",
    cornerAccent: "#D4AF37",
    ribbonColor: "#991B1B",
    headingColor: "#991B1B",
    badgeBg: "#FEF3C7",
    certTitleTh: "ใบประกาศนียบัตรรับรองการสำเร็จหลักสูตร",
  },
};

function CornerOrnaments({ color = "#D4AF37" }: { color?: string }) {
  return (
    <>
      {/* Top Left */}
      <svg
        className="absolute top-2.5 left-2.5 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none select-none opacity-85"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 18V5C3 3.89543 3.89543 3 5 3H18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="2.5" fill={color} />
        <path d="M7 14V7H14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {/* Top Right */}
      <svg
        className="absolute top-2.5 right-2.5 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none select-none opacity-85 rotate-90"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 18V5C3 3.89543 3.89543 3 5 3H18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="2.5" fill={color} />
        <path d="M7 14V7H14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {/* Bottom Right */}
      <svg
        className="absolute bottom-2.5 right-2.5 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none select-none opacity-85 rotate-180"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 18V5C3 3.89543 3.89543 3 5 3H18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="2.5" fill={color} />
        <path d="M7 14V7H14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {/* Bottom Left */}
      <svg
        className="absolute bottom-2.5 left-2.5 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none select-none opacity-85 -rotate-90"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 18V5C3 3.89543 3.89543 3 5 3H18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="2.5" fill={color} />
        <path d="M7 14V7H14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </>
  );
}

function GoldSeal({ ribbonColor = "#005B36" }: { ribbonColor?: string }) {
  return (
    <div className="certificate-seal relative flex flex-col items-center select-none" aria-hidden="true">
      {/* Dual Ribbons */}
      <div className="absolute top-10 sm:top-11 flex gap-1 -z-10">
        <div
          className="w-3.5 sm:w-4 h-10 sm:h-12 shadow-sm"
          style={{
            backgroundColor: ribbonColor,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
            transform: "rotate(-12deg)",
          }}
        />
        <div
          className="w-3.5 sm:w-4 h-10 sm:h-12 shadow-sm"
          style={{
            backgroundColor: ribbonColor,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
            transform: "rotate(12deg)",
          }}
        />
      </div>

      {/* Outer Metallic Medallion */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-1 shadow-lg"
        style={{
          background: "radial-gradient(circle at 35% 30%, #FFF3B0 0%, #D4AF37 55%, #996515 100%)",
          boxShadow: "0 6px 16px rgba(153, 101, 21, 0.35)",
          border: "2px solid #FFF8DC",
        }}
      >
        {/* Inner Star / Badge Pattern */}
        <div
          className="w-full h-full rounded-full border border-dashed border-amber-900/50 flex flex-col items-center justify-center text-center p-1"
          style={{
            background: "radial-gradient(circle at 50% 50%, #FFFBEA 0%, #E6C200 100%)",
          }}
        >
          <Award size={18} className="text-amber-950 drop-shadow-xs" />
          <span className="text-[6.5px] sm:text-[7.5px] font-black tracking-widest text-amber-950 uppercase mt-0.5 leading-none">
            OFFICIAL
          </span>
          <span className="text-[5.5px] sm:text-[6.5px] font-bold text-amber-900 tracking-wider leading-none mt-0.5">
            EXCELLENCE
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CertificateModal({
  certificate,
  user,
  demo,
  pFor,
  onClose,
}: CertificateModalProps) {
  if (!certificate) return null;

  const certCompany = (certificate.company || "AGE") as Company;
  const certInfo = COMPANIES_INFO[certCompany] || COMPANIES_INFO.AGE;
  const theme = THEMES[certCompany] || THEMES.AGE;

  const completedDate = new Date(
    pFor(certificate.id)?.completedAt ?? Date.now(),
  ).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certCode = `CERT-${certificate.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${user.name.charCodeAt(0)}${String(pFor(certificate.id)?.completedAt || Date.now()).slice(-4)}`;

  return (
    <div className="modal-backdrop overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="certificate-modal w-full max-w-[960px]">
        {/* Actions Bar (Excluded from printing) */}
        <div className="modal-actions flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>ใบประกาศนียบัตรรับรองอย่างเป็นทางการ · {certInfo.shortName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="primary flex items-center gap-2 text-xs sm:text-sm px-4 py-2"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              พิมพ์ / บันทึกเป็น PDF
            </button>
            <button
              type="button"
              className="icon-button bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              aria-label="ปิด"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Container - Landscape Aspect Ratio */}
        <div
          className="certificate-paper w-full max-w-[920px] mx-auto bg-[#FDFBF7] text-slate-800 rounded-2xl relative overflow-hidden shadow-2xl"
          style={{
            border: `5px solid ${theme.borderOuter}`,
          }}
        >
          <div
            className="certificate-inner-border m-2 sm:m-3 p-6 sm:p-10 relative flex flex-col items-center justify-between text-center min-h-[580px]"
            style={{
              border: `2px solid ${theme.borderInner}`,
            }}
          >
            {/* Corner Decorative Ornaments */}
            <CornerOrnaments color={theme.cornerAccent} />

            {/* Background Faint Watermark Logo */}
            <div className="certificate-watermark absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
              <Image
                src={certInfo.logoPath}
                alt=""
                width={320}
                height={320}
                className="opacity-[0.045] object-contain filter grayscale contrast-125"
                priority
              />
            </div>

            {/* Content Container */}
            <div className="certificate-content relative z-10 w-full flex flex-col items-center">
              {/* Top Company Brand */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-xs">
                  <Image
                    src={certInfo.logoPath}
                    alt={certInfo.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <span className="block text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    {certInfo.shortName}
                  </span>
                  <small className="block text-[10px] font-bold text-slate-500 tracking-wider mt-1 leading-none">
                    {certInfo.headerSubtitle}
                  </small>
                </div>
              </div>

              {/* Certificate Heading */}
              <h3
                className="text-base sm:text-xl font-bold uppercase tracking-[0.25em] mt-5 sm:mt-6 mb-1"
                style={{ color: theme.headingColor }}
              >
                CERTIFICATE OF COMPLETION
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 tracking-wide font-medium">
                {theme.certTitleTh}
              </p>

              {/* Citation 1 */}
              <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide mt-4 sm:mt-5">
                ใบประกาศนียบัตรฉบับนี้ขอมอบให้เพื่อแสดงว่า
              </p>

              {/* Student Name */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight my-2 sm:my-3 font-serif max-w-2xl px-4 mx-auto break-words leading-tight">
                {user.name}
              </h1>
              <div
                className="w-48 sm:w-64 h-0.5 mx-auto mb-3"
                style={{ backgroundColor: theme.primary, opacity: 0.35 }}
              />

              {/* Citation 2 */}
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                ได้ผ่านการอบรมและทดสอบตามเกณฑ์มาตรฐานในหลักสูตร
              </p>

              {/* Course Title */}
              <h2
                className="text-lg sm:text-2xl font-bold my-2 px-4 max-w-2xl mx-auto break-words leading-snug"
                style={{ color: theme.headingColor }}
              >
                {certificate.title}
              </h2>

              {/* Metadata: Date & Verification ID */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-500 mt-2">
                <span>
                  วันที่สำเร็จการศึกษา: <strong className="text-slate-700">{completedDate}</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">·</span>
                <span>
                  รหัสเอกสาร: <strong className="font-mono text-slate-700">{certCode}</strong>
                </span>
              </div>
            </div>

            {/* Official Elements: Signatures & Gold Seal */}
            <div className="relative z-10 w-full mt-6 sm:mt-8 pt-4 border-t border-slate-200/60">
              <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                {/* Left: Course Instructor */}
                <div className="text-center">
                  <div className="h-10 sm:h-12 flex items-end justify-center">
                    <span className="font-serif italic text-lg sm:text-2xl text-slate-800 tracking-wider font-semibold select-none leading-none">
                      {certificate.instructor || "Academic Team"}
                    </span>
                  </div>
                  <div className="border-b border-slate-400 w-28 sm:w-44 mx-auto my-1.5" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                    {certificate.instructor || "วิทยากรประจำหลักสูตร"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                    Course Instructor & Specialist
                  </p>
                </div>

                {/* Center: Gold Medallion Seal */}
                <div className="flex justify-center -mb-2">
                  <GoldSeal ribbonColor={theme.ribbonColor} />
                </div>

                {/* Right: Executive Director */}
                <div className="text-center">
                  <div className="h-10 sm:h-12 flex items-end justify-center">
                    <span className="font-serif italic text-lg sm:text-2xl text-slate-800 tracking-wider font-semibold select-none leading-none">
                      Charnchai A.
                    </span>
                  </div>
                  <div className="border-b border-slate-400 w-28 sm:w-44 mx-auto my-1.5" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                    ผู้อำนวยการฝ่ายพัฒนาทรัพยากรบุคคล
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                    Director of People & Culture
                  </p>
                </div>
              </div>

              {/* Bottom Official Citation Line */}
              <div className="text-center mt-5 sm:mt-6">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  {certInfo.fullName} · CORPORATE ACADEMY
                </span>
                {demo && (
                  <p className="text-[9px] text-amber-600 font-semibold mt-1">
                    [โหมดสาธิต: เอกสารจำลองสำหรับแสดงตัวอย่างเท่านั้น]
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
