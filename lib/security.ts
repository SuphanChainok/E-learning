import type { CourseData, CourseColor } from "./types";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}
const localSecret = (globalThis.aagLocalSecret ??=
  randomBytes(48).toString("hex"));
function secret() {
  const value = process.env.SESSION_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    (!value || value.length < 32 || value.startsWith("replace-"))
  )
    throw new Error("Configure SESSION_SECRET");
  return value || localSecret;
}
export function signSession(id: string): string {
  const body = Buffer.from(
    JSON.stringify({ id, expires: Date.now() + 7 * 86400000 }),
  ).toString("base64url");
  return (
    body + "." + createHmac("sha256", secret()).update(body).digest("base64url")
  );
}
export function readSession(token: string): string | null {
  try {
    const [body, signature] = token.split(".");
    const expected = createHmac("sha256", secret()).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      return null;
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as { id: string; expires: number };
    return data.expires > Date.now() ? data.id : null;
  } catch {
    return null;
  }
}
export function validateCourse(value: unknown): CourseData {
  if (!value || typeof value !== "object")
    throw new Error("ข้อมูลคอร์สไม่ถูกต้อง");
  const input = value as Record<string, unknown>;
  if (
    !input ||
    typeof input.title !== "string" ||
    input.title.trim().length < 3 ||
    input.title.length > 150
  )
    throw new Error("ชื่อคอร์สต้องมี 3–150 ตัวอักษร");
  if (
    !Array.isArray(input.lessons) ||
    !input.lessons.length ||
    input.lessons.length > 50
  )
    throw new Error("ต้องมีบทเรียน 1–50 บท");
  const lessons = input.lessons.map((l, i) => {
    if (
      typeof l.title !== "string" ||
      !l.title.trim() ||
      typeof l.content !== "string" ||
      !l.content.trim() ||
      l.content.length > 30000
    )
      throw new Error("กรุณากรอกชื่อและเนื้อหาทุกบทเรียน");
    const minutes = Number(l.minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600)
      throw new Error("ระยะเวลาบทเรียนต้องเป็น 1–600 นาที");
    const videoUrl = String(l.videoUrl || "");
    if (
      videoUrl &&
      !/^https:\/\/[^\s]+$/.test(videoUrl) &&
      !/^\/videos\/[a-zA-Z0-9_-]+\.(mp4|webm)$/.test(videoUrl)
    )
      throw new Error("ใช้ลิงก์ HTTPS หรือไฟล์ MP4/WebM ใน /videos/");
    const videoDurationSeconds = Number(l.videoDurationSeconds);
    if (
      videoUrl &&
      (!Number.isInteger(videoDurationSeconds) ||
        videoDurationSeconds < 1 ||
        videoDurationSeconds > 86400)
    )
      throw new Error("กรุณาระบุความยาววิดีโอ 1–86,400 วินาที");
    return {
      id: "lesson-" + (i + 1),
      title: l.title.trim().slice(0, 150),
      content: l.content,
      minutes,
      videoUrl,
      ...(videoUrl ? { videoDurationSeconds } : {}),
    };
  });
  const q = input.quiz as Record<string, unknown> | undefined;
  if (
    !q ||
    typeof q.question !== "string" ||
    !q.question.trim() ||
    q.question.length > 500 ||
    !Array.isArray(q.options) ||
    q.options.length !== 3 ||
    q.options.some(
      (x) => typeof x !== "string" || !x.trim() || x.length > 300,
    ) ||
    typeof q.answer !== "number" ||
    !Number.isInteger(q.answer) ||
    q.answer < 0 ||
    q.answer > 2
  )
    throw new Error("กรุณากรอกคำถาม ตัวเลือก 3 ข้อ และคำตอบที่ถูกต้อง");
  return {
    title: input.title.trim(),
    description: String(input.description || "").slice(0, 1000),
    category: String(input.category || "พัฒนาตนเอง").slice(0, 60),
    instructor: String(input.instructor || "AAG+ Academy").slice(0, 100),
    subtitle: "Grow your potential",
    level: "ทุกระดับ",
    color: ["mint", "peach", "lavender", "blue"].includes(String(input.color))
      ? (input.color as CourseColor)
      : "mint",
    icon: "spark",
    duration: lessons.reduce((a, l) => a + l.minutes, 0),
    lessons,
    quiz: { question: q.question, options: q.options, answer: q.answer },
  };
}
