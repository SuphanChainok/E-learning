"use client";
import type { FormEvent } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export interface LoginViewProps {
  adminPasswordMode: boolean;
  setAdminPasswordMode: (mode: boolean) => void;
  otpStep: "email" | "otp";
  setOtpStep: (step: "email" | "otp") => void;
  otpEmail: string;
  setOtpEmail: (email: string) => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpResendCountdown: number;
  otpExpireCountdown: number;
  otpInfoMessage: string;
  setOtpInfoMessage: (msg: string) => void;
  error: string;
  setError: (err: string) => void;
  busy: boolean;
  demo: boolean;
  fallback: boolean;
  dbError?: string | null;
  handleAdminPasswordLogin: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleSendOtp: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleVerifyOtp: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  requestOtpForEmail: (email: string) => void | Promise<void>;
}

const INPUT_CLASS =
  "login-field-input w-full m-0 mt-2 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg focus:bg-white focus:ring-2 focus:ring-[#004b2b] focus:border-transparent transition-all outline-none";
const BUTTON_CLASS =
  "login-primary-btn w-full inline-flex items-center justify-center gap-3 px-5 py-4 mt-6 bg-[#004b2b] hover:bg-[#00361f] text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:hover:translate-y-0 disabled:hover:shadow-lg";
const LABEL_CLASS = "login-field-label block text-sm font-semibold text-gray-700";

export default function LoginView({
  adminPasswordMode,
  setAdminPasswordMode,
  otpStep,
  setOtpStep,
  otpEmail,
  setOtpEmail,
  otpCode,
  setOtpCode,
  otpResendCountdown,
  otpExpireCountdown,
  otpInfoMessage,
  setOtpInfoMessage,
  error,
  setError,
  busy,
  demo,
  fallback,
  dbError,
  handleAdminPasswordLogin,
  handleSendOtp,
  handleVerifyOtp,
  requestOtpForEmail,
}: LoginViewProps) {
  return (
    <div className="login-split-layout flex min-h-screen w-full">
      {/* Left Panel (50%) - Hero image + welcome text */}
      <section
        className="login-left-hero relative hidden md:flex md:w-1/2 bg-[#004b2b] items-center justify-center overflow-hidden"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <Image
          src="/images/age-showroom-login.jpg"
          alt="โชว์รูมและบรรยากาศการทำงานของ AGE Auto Gallery"
          fill
          priority
          sizes="50vw"
          className="login-hero-bg-img absolute inset-0 w-full h-full object-cover z-0"
        />
        <div
          aria-hidden="true"
          className="login-left-overlay absolute inset-0 bg-gradient-to-r from-[#004b2b] via-[#004b2b]/60 to-transparent z-10"
        />

        <div className="login-left-content relative z-20 w-full p-12 lg:p-20 text-white">
          <div className="brand light mb-12 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md">
              <Image
                src="/images/logos/age-logo.png"
                alt="AGE Group"
                width={42}
                height={42}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="brand-copy">
              <span className="brand-title">
                AGE <span>Group</span>
              </span>
              <small>AGE GROUP · LEARNING SPACE</small>
            </span>
          </div>

          <span className="login-hero-kicker block text-[11px] font-bold tracking-[0.2em] text-[#F3C65F]">
            AGE AUTO GALLERY · A LITTLE LEARNING. A BIG DIFFERENCE.
          </span>
          <h1 className="login-hero-heading mt-5 mb-4 text-4xl font-bold leading-[1.5] tracking-tight text-white drop-shadow-lg lg:text-5xl lg:leading-[1.5]">
            พื้นที่เล็ก ๆ
            <br />
            เพื่อการเติบโต
            <br />
            <em className="not-italic text-[#F3C65F]">ที่ยิ่งใหญ่ของคุณ.</em>
          </h1>
          <p className="login-hero-subcopy m-0 text-base text-white/90 drop-shadow">
            เติมความรู้ สร้างทักษะ และก้าวไปข้างหน้า
            <br />
            ด้วยกันกับพวกเราชาว AGE Auto Gallery (AAG+)
          </p>

          <div className="login-glass-card mt-8 inline-flex max-w-md items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md">
            <Image
              src="/images/age-showroom-feature.jpg"
              alt="โชว์รูมรถยนต์ AGE Auto Gallery"
              width={80}
              height={58}
              loading="lazy"
              className="login-glass-thumb h-[58px] w-20 rounded-xl border border-white/25 object-cover"
            />
            <div>
              <strong className="block text-sm text-[#F3C65F]">
                AGE Auto Gallery Excellence
              </strong>
              <small className="mt-0.5 block text-xs leading-relaxed text-white/85">
                ยกระดับมาตรฐานการบริการและความเชี่ยวชาญของทีมงานทุกคน
              </small>
            </div>
          </div>

          <span className="login-hero-footer mt-12 flex items-center gap-2.5 text-[10px] font-bold tracking-[0.2em] text-[#F3C65F]">
            <Sparkles size={14} /> AGE GROUP · GROW TOGETHER, GO FURTHER{" "}
            <ArrowUpRight size={16} />
          </span>
        </div>
      </section>

      {/* Right Panel (50%) - Login form */}
      <section className="login-right-panel w-full md:w-1/2 flex items-center justify-center bg-slate-50 p-6 sm:p-12">
        <div className="login-right-inner w-full max-w-md">
          <div className="login-mobile-brand brand mb-6 md:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <Image
                src="/images/logos/age-logo.png"
                alt="AGE Group"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="brand-copy">
              <span className="brand-title">
                AGE <span>Group</span>
              </span>
              <small>AGE GROUP · LEARNING SPACE</small>
            </span>
          </div>
          <div className="login-card-box w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <span className="login-card-badge mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-[#004b2b]">
              <Leaf size={14} /> AGE AUTO GALLERY · LMS
            </span>
            <h2 className="login-card-title mt-0 mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
              {adminPasswordMode
                ? "เข้าสู่ระบบผู้ดูแลระบบ"
                : otpStep === "email"
                  ? "เข้าสู่ระบบด้วยอีเมลบริษัท"
                  : "ยืนยันรหัส OTP 6 หลัก"}
            </h2>
            <p className="login-card-desc mb-7 text-sm text-gray-500">
              {adminPasswordMode
                ? "เข้าสู่ระบบด้วยอีเมลและรหัสผ่านสำหรับผู้ดูแลระบบ (Admin)"
                : otpStep === "email"
                  ? "กรอกอีเมลบริษัทของคุณ (@age.co.th) เพื่อรับรหัส OTP สำหรับเข้าสู่ระบบ"
                  : `เราได้ส่งรหัสยืนยัน 6 หลักไปยัง ${otpEmail} แล้ว`}
            </p>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {!adminPasswordMode &&
              otpStep === "otp" &&
              otpInfoMessage &&
              !error && (
                <div className="login-otp-info mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  ✓ {otpInfoMessage}
                  {otpExpireCountdown > 0 && (
                    <span className="mt-1 block text-xs text-emerald-800/80">
                      รหัสหมดอายุใน {Math.floor(otpExpireCountdown / 60)}:
                      {String(otpExpireCountdown % 60).padStart(2, "0")} นาที
                    </span>
                  )}
                </div>
              )}
            {adminPasswordMode ? (
              <form
                key="admin-password-form"
                onSubmit={handleAdminPasswordLogin}
              >
                <label className={LABEL_CLASS}>
                  อีเมลผู้ดูแลระบบ
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@aag.ac.th"
                    required
                    autoComplete="email"
                    disabled={busy}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={LABEL_CLASS + " login-label-spaced mt-4"}>
                  รหัสผ่าน
                  <input
                    name="password"
                    type="password"
                    placeholder="รหัสผ่านผู้ดูแลระบบ"
                    required
                    autoComplete="current-password"
                    disabled={busy}
                    className={INPUT_CLASS}
                  />
                </label>
                <button className={BUTTON_CLASS} disabled={busy}>
                  {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบผู้ดูแลระบบ"}
                  <ArrowRight size={20} />
                </button>
              </form>
            ) : otpStep === "email" ? (
              <form key="otp-email-form" onSubmit={handleSendOtp}>
                <label className={LABEL_CLASS}>
                  อีเมลบริษัท
                  <input
                    name="email"
                    type="email"
                    value={otpEmail ?? ""}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="name@age.co.th"
                    required
                    autoComplete="email"
                    disabled={busy}
                    className={INPUT_CLASS}
                  />
                </label>
                <button className={BUTTON_CLASS} disabled={busy}>
                  {busy ? "กำลังส่งรหัส OTP…" : "ขอรับรหัส OTP"}
                  <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <form key="otp-verify-form" onSubmit={handleVerifyOtp}>
                <label className={LABEL_CLASS}>
                  รหัส OTP 6 หลัก
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otpCode ?? ""}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    disabled={busy}
                    className={
                      INPUT_CLASS +
                      " login-otp-code-input text-center text-2xl font-bold tracking-[0.5em]"
                    }
                  />
                </label>
                <button
                  className={BUTTON_CLASS}
                  disabled={busy || otpCode.length !== 6}
                >
                  {busy ? "กำลังตรวจสอบรหัส OTP…" : "ยืนยันรหัส OTP"}
                  <ArrowRight size={20} />
                </button>
                <div className="login-otp-actions mt-4 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="login-link-btn inline-flex items-center gap-1.5 bg-transparent text-sm font-semibold text-[#004b2b] disabled:opacity-60"
                    disabled={busy || otpResendCountdown > 0}
                    onClick={() => requestOtpForEmail(otpEmail)}
                  >
                    <RefreshCw size={13} />
                    {otpResendCountdown > 0
                      ? `ส่งรหัสใหม่อีกครั้ง (${otpResendCountdown}s)`
                      : "ส่งรหัสใหม่อีกครั้ง (Resend)"}
                  </button>
                  <button
                    type="button"
                    className="login-muted-btn bg-transparent text-sm font-semibold text-gray-500 hover:text-[#004b2b]"
                    disabled={busy}
                    onClick={() => {
                      setOtpStep("email");
                      setOtpCode("");
                      setError("");
                      setOtpInfoMessage("");
                    }}
                  >
                    เปลี่ยนอีเมล
                  </button>
                </div>
              </form>
            )}
            <p className="login-mode-switch mt-6 mb-0 text-center text-xs">
              <button
                type="button"
                className="login-switch-btn bg-transparent text-xs font-semibold text-[#004b2b] hover:underline"
                onClick={() => {
                  setAdminPasswordMode(!adminPasswordMode);
                  setError("");
                  setOtpInfoMessage("");
                }}
              >
                {adminPasswordMode
                  ? "← กลับไปเข้าสู่ระบบด้วยรหัส OTP ทางอีเมล"
                  : "เข้าสู่ระบบด้วยรหัสผ่าน (สำหรับผู้ดูแลระบบ)"}
              </button>
            </p>
            {demo && (
              <div className="login-demo-box mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-gray-500">
                <b className="text-xs">
                  {fallback
                    ? "ฐานข้อมูลไม่พร้อม · ใช้ข้อมูลสาธิตชั่วคราว"
                    : "โหมดสาธิต · ข้อมูลรีเซ็ตเมื่อรีสตาร์ต"}
                </b>
                <p className="mt-2 mb-0 break-words text-xs leading-loose">
                  อีเมลผู้เรียน: learner@aag.demo (รหัส: Learn@12345)
                  <br />
                  อีเมลผู้ดูแล: admin@aag.ac.th (รหัส: admin123456) หรือ admin@aag.demo (รหัส: Admin@12345)
                  {fallback && (
                    <>
                      <br />
                      ความคืบหน้าชั่วคราวจะไม่บันทึกลงฐานข้อมูลจริง
                      {dbError && (
                        <span className="block mt-1 font-mono text-[11px] text-red-600 break-all">
                          ข้อผิดพลาด: {dbError}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          <small className="login-copyright mt-6 block text-center text-[11px] text-gray-400">
            © {new Date().getFullYear()} AGE Auto Gallery (AGE Group). เติบโตไปด้วยกันทุกวัน
          </small>
        </div>
      </section>
    </div>
  );
}
