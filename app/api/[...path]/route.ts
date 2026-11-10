import {
  type User,
  type Role,
  normalizeRole,
  canManageCourses,
  isAdminRole,
} from "../../../lib/types.ts";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  allCourses,
  courseById,
  userBy,
  addUser,
  syncMicrosoftLoginUser,
  getProgress,
  saveProgress,
  saveVideoProgress,
  mutateCourse,
  updateUserRole,
  updateUserCourses,
  deleteUser,
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
  signOAuthState,
  readOAuthState,
  validateCourse,
} from "../../../lib/security.ts";
import {
  getMicrosoftAuthorizeUrl,
  exchangeMicrosoftCodeForProfile,
} from "../../../lib/microsoftGraph.ts";
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
      const isUpload = route === "admin/upload";
      const maxLimit = isUpload ? 100 * 1024 * 1024 : 1000000;
      if (Number(req.headers.get("content-length") || 0) > maxLimit)
        return json({ error: "ข้อมูลใหญ่เกินไป" }, 413);
    }
    const uid = readSession(req.cookies.get("aag_session")?.value || "");
    const safeUser = (u: User) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      assignedCourses: u.assignedCourses,
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
    if (
      (route === "auth/microsoft" || route === "auth/signin/azure-ad") &&
      method === "GET"
    ) {
      try {
        const origin = new URL(req.url).origin;
        const redirectUri =
          process.env.AZURE_REDIRECT_URI ||
          `${origin}/api/auth/callback/azure-ad`;
        const state = signOAuthState(redirectUri);
        const authorizeUrl = getMicrosoftAuthorizeUrl(redirectUri, state);
        return NextResponse.redirect(authorizeUrl);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "ไม่สามารถเริ่มต้นการเข้าสู่ระบบด้วย Microsoft 365 ได้";
        return NextResponse.redirect(
          new URL("/?error=" + encodeURIComponent(msg), req.url),
        );
      }
    }
    if (
      [
        "auth/callback/azure-ad",
        "auth/microsoft/callback",
        "auth/callback/microsoft-entra-id",
      ].includes(route) &&
      method === "GET"
    ) {
      try {
        const url = new URL(req.url);
        const oauthError = url.searchParams.get("error");
        const oauthErrorDesc = url.searchParams.get("error_description");
        if (oauthError) {
          return NextResponse.redirect(
            new URL(
              "/?error=" + encodeURIComponent(oauthErrorDesc || oauthError),
              req.url,
            ),
          );
        }
        const code = url.searchParams.get("code") || "";
        const state = url.searchParams.get("state") || "";
        const stateData = readOAuthState(state);
        if (!code || !stateData) {
          return NextResponse.redirect(
            new URL(
              "/?error=" +
                encodeURIComponent(
                  "เซสชันการเข้าสู่ระบบ Microsoft หมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
                ),
              req.url,
            ),
          );
        }
        const profile = await exchangeMicrosoftCodeForProfile(
          code,
          stateData.redirectUri,
        );
        const account = await syncMicrosoftLoginUser(profile);
        const r = NextResponse.redirect(new URL("/", req.url));
        r.cookies.set(
          "aag_session",
          signSession(account.id, normalizeRole(account.role)),
          {
            httpOnly: true,
            secure: url.protocol === "https:",
            sameSite: "lax",
            maxAge: 604800,
            path: "/",
          },
        );
        return r;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Microsoft 365";
        return NextResponse.redirect(
          new URL("/?error=" + encodeURIComponent(msg), req.url),
        );
      }
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
          role: "employee",
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
      r.cookies.set(
        "aag_session",
        signSession(account.id, normalizeRole(account.role)),
        {
          httpOnly: true,
          secure: new URL(req.url).protocol === "https:",
          sameSite: "lax",
          maxAge: 604800,
          path: "/",
        },
      );
      return r;
    }
    if (!user) return json({ error: "กรุณาเข้าสู่ระบบ" }, 401);
    const isCourseTargetMatch = (
      targetRole: string | undefined,
      userRole: Role,
    ) => {
      const normUser = normalizeRole(userRole);
      if (!targetRole || targetRole === "all") return true;
      if (targetRole === "learner" || targetRole === "employee")
        return normUser === "employee";
      return targetRole === normUser;
    };
    if (route === "courses" && method === "GET") {
      const all = await allCourses();
      const visible = canManageCourses(user.role)
        ? all
        : all.filter((c) => {
            const roleMatch = isCourseTargetMatch(c.targetRole, user.role);
            const assignedMatch =
              !user.assignedCourses ||
              user.assignedCourses.includes("all") ||
              user.assignedCourses.includes(c.id);
            return roleMatch && assignedMatch;
          });
      return json({ courses: visible.map(publicCourse) });
    }
    if (route === "courses" && ["POST", "PUT"].includes(method)) {
      if (!canManageCourses(user.role))
        return json({ error: "ไม่มีสิทธิ์ในการสร้างหลักสูตร" }, 403);
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
      const roleMatch = isCourseTargetMatch(c.targetRole, user.role);
      const assignedMatch =
        !user.assignedCourses ||
        user.assignedCourses.includes("all") ||
        user.assignedCourses.includes(c.id);
      if (!canManageCourses(user.role) && (!roleMatch || !assignedMatch))
        return json({ error: "ไม่มีสิทธิ์เข้าถึงคอร์สนี้" }, 403);
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
      const quizRoleMatch = isCourseTargetMatch(c.targetRole, user.role);
      const quizAssignedMatch =
        !user.assignedCourses ||
        user.assignedCourses.includes("all") ||
        user.assignedCourses.includes(c.id);
      if (!canManageCourses(user.role) && (!quizRoleMatch || !quizAssignedMatch))
        return json({ error: "ไม่มีสิทธิ์เข้าถึงคอร์สนี้" }, 403);
      const p = (await getProgress(user.id)).find((p) => p.courseId === c.id);
      if (!c.lessons.every((l) => p?.completed?.includes(l.id)))
        return json({ error: "กรุณาเรียนให้ครบทุกบทก่อนทำแบบทดสอบ" }, 400);
      const passed = b.answer === c.quiz.answer;
      if (passed) await saveProgress(user.id, c.id, { passed: true });
      return json({ passed });
    }
    if (route.startsWith("admin/")) {
      if (!canManageCourses(user.role))
        return json(
          {
            error:
              route === "admin/courses"
                ? "ไม่มีสิทธิ์ในการสร้างหลักสูตร"
                : "เฉพาะผู้ดูแลระบบหรือผู้จัดการเรียนเท่านั้น",
          },
          403,
        );
      if (route === "admin/upload" && method === "POST") {
        const formData = await req.formData();
        const file = formData.get("video");
        if (!file || !(file instanceof File))
          return json({ error: "ไม่พบไฟล์วิดีโอ" }, 400);
        if (file.size > 100 * 1024 * 1024)
          return json({ error: "ไฟล์วิดีโอต้องมีขนาดไม่เกิน 100MB" }, 400);
        const nameLower = file.name.toLowerCase();
        const ext = nameLower.endsWith(".mp4")
          ? "mp4"
          : nameLower.endsWith(".webm")
            ? "webm"
            : "";
        if (!ext)
          return json({ error: "รองรับเฉพาะไฟล์ MP4 หรือ WebM เท่านั้น" }, 400);
        const safeBase = `upload-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
        const videosDir = join(process.cwd(), "public", "videos");
        await mkdir(videosDir, { recursive: true });
        const filePath = join(videosDir, safeBase);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        return json({ ok: true, url: `/videos/${safeBase}`, filename: safeBase });
      }
      if (route === "admin/report" && method === "GET")
        return json({ users: await report() });
      if (route === "admin/users" && method === "POST") {
        if (!isAdminRole(user.role))
          return json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, 403);
        const b = await req.json();
        const email = String(b.email || "").trim().toLowerCase();
        const password = String(b.password || "");
        const name = String(b.name || "").trim();
        const role: Role = normalizeRole(String(b.role || "employee"));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, 400);
        if (password.length < 10)
          return json({ error: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร" }, 400);
        if (!name)
          return json({ error: "กรุณาระบุชื่อผู้ใช้งาน" }, 400);
        const assignedCourses = Array.isArray(b.assignedCourses)
          ? b.assignedCourses.map(String)
          : undefined;
        const newUser: User = {
          id: randomUUID(),
          name: name.slice(0, 100),
          email,
          password: hashPassword(password),
          role,
          ...(assignedCourses ? { assignedCourses } : {}),
        };
        try {
          await addUser(newUser);
        } catch (e) {
          if (
            e instanceof Error &&
            (("code" in e && e.code === 11000) || e.message === "Duplicate")
          )
            return json({ error: "อีเมลนี้มีบัญชีแล้ว" }, 409);
          throw e;
        }
        return json({ ok: true, user: safeUser(newUser) });
      }
      if (route === "admin/users" && method === "PUT") {
        const b = await req.json();
        const targetUserId = String(b.userId || "");
        if (!targetUserId)
          return json({ error: "ไม่พบรหัสผู้ใช้" }, 400);
        if ("role" in b) {
          if (!isAdminRole(user.role))
            return json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยนบทบาทได้" }, 403);
          const targetRole: Role = normalizeRole(String(b.role || "employee"));
          await updateUserRole(targetUserId, targetRole);
        }
        if ("assignedCourses" in b && Array.isArray(b.assignedCourses)) {
          await updateUserCourses(targetUserId, b.assignedCourses.map(String));
        }
        return json({ ok: true });
      }
      if (path[1] === "users" && path[2] && method === "DELETE") {
        if (!isAdminRole(user.role))
          return json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, 403);
        const targetUserId = decodeURIComponent(path[2]);
        if (targetUserId === user.id)
          return json({ error: "ไม่สามารถลบบัญชีของตนเองได้" }, 400);
        await deleteUser(targetUserId);
        return json({ ok: true });
      }
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
