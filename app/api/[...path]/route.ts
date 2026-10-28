import type { User } from "../../../lib/types";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import {
  allCourses,
  courseById,
  userBy,
  addUser,
  getProgress,
  saveProgress,
  saveVideoProgress,
  mutateCourse,
  report,
  throttle,
  demo,
  fallbackMode,
  database,
  activateDemoFallback,
} from "../../../lib/store.ts";
import { publicCourse } from "../../../lib/data.ts";
import {
  hashPassword,
  verifyPassword,
  signSession,
  readSession,
  validateCourse,
} from "../../../lib/security.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  let requestedRoute = "";
  try {
    const { path } = await params;
    const route = path.join("/");
    requestedRoute = route;
    const method = req.method;
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== req.headers.get("host"))
        return json({ error: "ไม่อนุญาตคำขอจากเว็บไซต์อื่น" }, 403);
      if (Number(req.headers.get("content-length") || 0) > 1000000)
        return json({ error: "ข้อมูลใหญ่เกินไป" }, 413);
    }
    const uid = readSession(req.cookies.get("aag_session")?.value || "");
    const safeUser = (u: User) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    });
    if (route === "auth/session" && method === "GET") {
      if (!demo) await database();
      const user = uid ? await userBy("id", uid) : null;
      return json({
        user: user ? safeUser(user) : null,
        demo,
        fallback: fallbackMode,
      });
    }
    const user = uid ? await userBy("id", uid) : null;
    if (route === "auth/logout" && method === "POST") {
      const r = json({ ok: true });
      r.cookies.set("aag_session", "", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return r;
    }
    if (["auth/login", "auth/register"].includes(route) && method === "POST") {
      const b = await req.json();
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      const password = String(b.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128)
        return json({ error: "กรุณาตรวจสอบอีเมลและรหัสผ่าน" }, 400);
      if (!(await throttle(email)))
        return json({ error: "ลองหลายครั้งเกินไป กรุณารอ 15 นาที" }, 429);
      let account: User | null | undefined;
      if (route === "auth/register") {
        if (password.length < 10 || !String(b.name || "").trim())
          return json(
            { error: "กรอกชื่อ และรหัสผ่านอย่างน้อย 10 ตัวอักษร" },
            400,
          );
        account = {
          id: randomUUID(),
          name: String(b.name).trim().slice(0, 100),
          email,
          password: hashPassword(password),
          role: "learner",
        };
        try {
          await addUser(account);
        } catch (e) {
          if (
            e instanceof Error &&
            (("code" in e && e.code === 11000) || e.message === "Duplicate")
          )
            return json({ error: "อีเมลนี้มีบัญชีแล้ว" }, 409);
          throw e;
        }
      } else {
        account = await userBy("email", email);
        if (!account || !verifyPassword(password, account.password))
          return json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, 401);
      }
      const r = json({ user: safeUser(account) });
      r.cookies.set("aag_session", signSession(account.id), {
        httpOnly: true,
        secure: new URL(req.url).protocol === "https:",
        sameSite: "lax",
        maxAge: 604800,
        path: "/",
      });
      return r;
    }
    if (!user) return json({ error: "กรุณาเข้าสู่ระบบ" }, 401);
    if (route === "courses" && method === "GET")
      return json({ courses: (await allCourses()).map(publicCourse) });
    if (route === "progress" && method === "GET")
      return json({ progress: await getProgress(user.id) });
    if (route === "progress" && method === "POST") {
      const b = await req.json();
      if (
        !b ||
        typeof b.courseId !== "string" ||
        typeof b.lessonId !== "string"
      )
        return json({ error: "ข้อมูลบทเรียนไม่ถูกต้อง" }, 400);
      const c = await courseById(b.courseId);
      const lesson = c?.lessons.find((l) => l.id === b.lessonId);
      if (!c || !lesson) return json({ error: "ไม่พบบทเรียน" }, 400);
      if ("currentTime" in b) {
        if (!lesson.videoUrl)
          return json({ error: "บทเรียนนี้ไม่มีวิดีโอที่ติดตามได้" }, 400);
        if (
          typeof b.currentTime !== "number" ||
          !Number.isFinite(b.currentTime)
        )
          return json({ error: "ตำแหน่งวิดีโอไม่ถูกต้อง" }, 400);
        const videoProgress = await saveVideoProgress(
          user.id,
          c.id,
          lesson.id,
          b.currentTime,
          lesson.videoDurationSeconds ?? lesson.minutes * 60,
        );
        return json({ ok: true, videoProgress });
      }
      if (
        lesson.videoUrl &&
        !(await getProgress(user.id))
          .find((item) => item.courseId === c.id)
          ?.videoProgress?.some(
            (item) => item.lessonId === lesson.id && item.completed,
          )
      )
        return json(
          { error: "กรุณาดูวิดีโอให้ถึง 100% ก่อนทำเครื่องหมายเรียนจบ" },
          400,
        );
      await saveProgress(user.id, c.id, { lessonId: b.lessonId });
      return json({ ok: true });
    }
    if (route === "quiz" && method === "POST") {
      const b = await req.json();
      const c = await courseById(b.courseId);
      if (!c) return json({ error: "ไม่พบคอร์ส" }, 404);
      const p = (await getProgress(user.id)).find((p) => p.courseId === c.id);
      if (!c.lessons.every((l) => p?.completed?.includes(l.id)))
        return json({ error: "กรุณาเรียนให้ครบทุกบทก่อนทำแบบทดสอบ" }, 400);
      const passed = b.answer === c.quiz.answer;
      if (passed) await saveProgress(user.id, c.id, { passed: true });
      return json({ passed });
    }
    if (route.startsWith("admin/")) {
      if (user.role !== "admin")
        return json({ error: "เฉพาะผู้ดูแลระบบ" }, 403);
      if (route === "admin/report" && method === "GET")
        return json({ users: await report() });
      if (route === "admin/courses" && method === "GET")
        return json({ courses: await allCourses() });
      if (route === "admin/courses" && ["POST", "PUT"].includes(method)) {
        const b = await req.json();
        let data;
        try {
          data = validateCourse(b);
        } catch (e) {
          return json(
            { error: e instanceof Error ? e.message : "ข้อมูลไม่ถูกต้อง" },
            400,
          );
        }
        const id = method === "POST" ? randomUUID() : String(b.id || "");
        if (method === "PUT" && !(await courseById(id)))
          return json({ error: "ไม่พบคอร์ส" }, 404);
        await mutateCourse(id, data);
        return json({ ok: true, id });
      }
      if (path[1] === "courses" && path[2] && method === "DELETE") {
        await mutateCourse(path[2], null, true);
        return json({ ok: true });
      }
    }
    return json({ error: "ไม่พบ API" }, 404);
  } catch (e) {
    const switchedToFallback = activateDemoFallback(e);
    if (requestedRoute === "auth/session" && switchedToFallback)
      return json({ user: null, demo: true, fallback: true });
    console.error("AAG API:", e instanceof Error ? e.name : "Unknown error");
    return json(
      {
        error: switchedToFallback
          ? "เชื่อมต่อฐานข้อมูลไม่ได้ชั่วคราว ระบบเปลี่ยนเป็นข้อมูลสาธิตในหน่วยความจำแล้ว กรุณาโหลดหน้าใหม่และเข้าสู่ระบบบัญชีสาธิต ข้อมูลชั่วคราวจะหายเมื่อเซิร์ฟเวอร์เริ่มใหม่"
          : "ระบบไม่พร้อมใช้งาน กรุณาตรวจสอบ MONGODB_URI, MONGODB_DB และการตั้งค่าเซิร์ฟเวอร์",
      },
      503,
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
