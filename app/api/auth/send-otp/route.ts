import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { userBy, createAndSaveOtp, throttle } from "../../../../lib/store.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sendOtpViaGmail(
  toEmail: string,
  otp: string,
  userName?: string,
): Promise<void> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailPass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ยังไม่ได้ตั้งค่า GMAIL_USER และ GMAIL_APP_PASSWORD ใน .env.local");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #dbe6d5; border-radius: 12px; background: #ffffff; color: #1e3318;">
      <h2 style="margin: 0 0 12px; color: #2d4e24;">AAG+ Learning</h2>
      <p style="margin: 0 0 16px; font-size: 15px;">สวัสดีคุณ <strong>${userName || toEmail}</strong>,</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #44593e;">รหัสยืนยันตัวตน (OTP) สำหรับเข้าสู่ระบบ AAG+ Learning ของคุณคือ:</p>
      <div style="text-align: center; margin: 24px 0; padding: 18px; background: #f4f8f2; border-radius: 10px; border: 1px dashed #9ab892;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e4c19;">${otp}</span>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7d65;">* รหัสนี้มีอายุการใช้งาน <strong>5 นาที</strong> กรุณาอย่าเปิดเผยรหัสนี้แก่ผู้อื่น</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"AAG+ Learning" <${gmailUser}>`,
    to: toEmail,
    subject: `[AAG+ Learning] รหัส OTP สำหรับเข้าสู่ระบบ: ${otp}`,
    text: `รหัส OTP สำหรับเข้าสู่ระบบ AAG+ Learning ของคุณคือ ${otp} (มีอายุการใช้งาน 5 นาที)`,
    html: htmlContent,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "กรุณากรอกรูปแบบอีเมลบริษัทให้ถูกต้อง" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!(await throttle(`otp:${email}`))) {
      return NextResponse.json(
        { error: "ขอรหัส OTP หลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    const user = await userBy("email", email);
    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้งานในระบบ" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const targetEmail = (user.email || email).trim().toLowerCase();

    // บันทึกรหัส OTP 6 หลักลงคอลเลกชัน otps ใน MongoDB พร้อม expiresAt (5 นาที)
    const { otp, expiresAt } = await createAndSaveOtp(targetEmail);

    // ส่งอีเมลแจ้งรหัส OTP 6 หลักไปยังอีเมลปลายทางของผู้ใช้จริงผ่าน Gmail
    await sendOtpViaGmail(
      targetEmail,
      otp,
      user.displayName || user.name,
    );

    return NextResponse.json(
      {
        ok: true,
        message: "ส่งรหัส OTP ไปยังอีเมลเรียบร้อยแล้ว",
        email: targetEmail,
        expiresInSeconds: 300,
        expiresAt: expiresAt.toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Send OTP Error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `ไม่สามารถส่งอีเมล OTP ได้: ${error.message}`
            : "เกิดข้อผิดพลาดในการส่งรหัส OTP",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
