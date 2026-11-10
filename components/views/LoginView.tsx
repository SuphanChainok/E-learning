"use client";
import type { FormEvent } from "react";
import { ArrowUpRight, ArrowRight, Leaf, RefreshCw } from "lucide-react";

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
  handleAdminPasswordLogin: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleSendOtp: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleVerifyOtp: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  requestOtpForEmail: (email: string) => void | Promise<void>;
}

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
  handleAdminPasswordLogin,
  handleSendOtp,
  handleVerifyOtp,
  requestOtpForEmail,
}: LoginViewProps) {
  return (
    <main className="login-screen">
      <section className="login-story">
        <div className="brand light">
          AAG<span>+</span>
          <small>LEARNING</small>
        </div>
        <div>
          <span className="eyebrow">A LITTLE LEARNING. A BIG DIFFERENCE.</span>
          <h1>
            พื้นที่เล็ก ๆ<br />
            เพื่อการเติบโต
            <br />
            <em>ที่ยิ่งใหญ่ของคุณ.</em>
          </h1>
          <p>
            เติมความรู้ สร้างทักษะ และก้าวไปข้างหน้า
            <br />
            ด้วยกันกับ AAG+
          </p>
        </div>
        <span className="story-footer">
          GROW TOGETHER, GO FURTHER. <ArrowUpRight />
        </span>
      </section>
      <section className="login-form">
        <div className="login-box">
          <span className="pill">
            <Leaf size={14} /> YOUR NEXT CHAPTER
          </span>
          <h2>
            {adminPasswordMode
              ? "เข้าสู่ระบบผู้ดูแลระบบ"
              : otpStep === "email"
                ? "เข้าสู่ระบบด้วยอีเมลบริษัท"
                : "ยืนยันรหัส OTP 6 หลัก"}
          </h2>
          <p className="muted">
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
              <div
                style={{
                  padding: "10px 14px",
                  marginBottom: "14px",
                  borderRadius: "8px",
                  background: "#eef6ea",
                  color: "#1e4c19",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                ✓ {otpInfoMessage}
                {otpExpireCountdown > 0 && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      marginTop: "4px",
                      color: "#44593e",
                    }}
                  >
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
              <label>
                อีเมลผู้ดูแลระบบ
                <input
                  name="email"
                  type="email"
                  placeholder="admin@aag.ac.th"
                  required
                  autoComplete="email"
                  disabled={busy}
                />
              </label>
              <label>
                รหัสผ่าน
                <input
                  name="password"
                  type="password"
                  placeholder="รหัสผ่านผู้ดูแลระบบ"
                  required
                  autoComplete="current-password"
                  disabled={busy}
                />
              </label>
              <button className="primary wide" disabled={busy}>
                {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบผู้ดูแลระบบ"}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : otpStep === "email" ? (
            <form key="otp-email-form" onSubmit={handleSendOtp}>
              <label>
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
                />
              </label>
              <button className="primary wide" disabled={busy}>
                {busy ? "กำลังส่งรหัส OTP…" : "ขอรับรหัส OTP"}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form key="otp-verify-form" onSubmit={handleVerifyOtp}>
              <label>
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
                  style={{
                    textAlign: "center",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "10px",
                  }}
                />
              </label>
              <button
                className="primary wide"
                disabled={busy || otpCode.length !== 6}
              >
                {busy ? "กำลังตรวจสอบรหัส OTP…" : "ยืนยันรหัส OTP"}
                <ArrowRight size={18} />
              </button>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "14px",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="text-button"
                  disabled={busy || otpResendCountdown > 0}
                  onClick={() => requestOtpForEmail(otpEmail)}
                  style={{
                    fontSize: "13px",
                    opacity: busy || otpResendCountdown > 0 ? 0.6 : 1,
                  }}
                >
                  <RefreshCw size={13} />{" "}
                  {otpResendCountdown > 0
                    ? `ส่งรหัสใหม่อีกครั้ง (${otpResendCountdown}s)`
                    : "ส่งรหัสใหม่อีกครั้ง (Resend)"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => {
                    setOtpStep("email");
                    setOtpCode("");
                    setError("");
                    setOtpInfoMessage("");
                  }}
                  style={{ fontSize: "13px" }}
                >
                  เปลี่ยนอีเมล
                </button>
              </div>
            </form>
          )}
          <p className="switch-auth" style={{ marginTop: "16px" }}>
            <button
              type="button"
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
            <div className="demo-box">
              <b>
                {fallback
                  ? "ฐานข้อมูลไม่พร้อม · ใช้ข้อมูลสาธิตชั่วคราว"
                  : "โหมดสาธิต · ข้อมูลรีเซ็ตเมื่อรีสตาร์ต"}
              </b>
              <p>
                อีเมลผู้เรียน: learner@aag.demo
                <br />
                อีเมลผู้ดูแล: admin@aag.demo
                {fallback && (
                  <>
                    <br />
                    ความคืบหน้าชั่วคราวจะไม่บันทึกลงฐานข้อมูลจริง
                  </>
                )}
              </p>
            </div>
          )}
        </div>
        <small className="login-footer">
          © {new Date().getFullYear()} AAG+ Learning. เติบโตไปด้วยกันทุกวัน
        </small>
      </section>
    </main>
  );
}

