import { NextResponse, type NextRequest } from "next/server";
import {
  userBy,
  verifyAndConsumeOtp,
  throttle,
} from "../../../../lib/store.ts";
import { signSession } from "../../../../lib/security.ts";
import { normalizeRole } from "../../../../lib/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const otp = String(body?.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัส OTP ตัวเลข 6 หลักให้ถูกต้อง" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!(await throttle(`verify-otp:${email}`))) {
      return NextResponse.json(
        { error: "ยืนยันรหัสผิดพลาดหลายครั้งเกินไป กรุณารอ 15 นาที" },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    const isValid = await verifyAndConsumeOtp(email, otp);
    if (!isValid) {
      return NextResponse.json(
        { error: "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const account = await userBy("email", email);
    if (!account) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้งานในระบบ" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const normalizedRole = normalizeRole(account.role);
    const safeUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: normalizedRole,
      company: account.company,
      allowedCompanies: account.allowedCompanies,
      assignedCourses: account.assignedCourses,
    };

    const token = signSession(account.id, normalizedRole);
    const response = NextResponse.json(
      {
        ok: true,
        token,
        user: safeUser,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );

    response.cookies.set("aag_session", token, {
      httpOnly: true,
      secure: new URL(req.url).protocol === "https:",
      sameSite: "lax",
      maxAge: 604800,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "Verify OTP Error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

