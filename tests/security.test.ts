import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  signSession,
  readSession,
  validateCourse,
} from "../lib/security.ts";
import { courses, publicCourse } from "../lib/data.ts";
test("passwords are salted and reject incorrect values", () => {
  const a = hashPassword("correct password");
  assert.notEqual(a, hashPassword("correct password"));
  assert.equal(verifyPassword("correct password", a), true);
  assert.equal(verifyPassword("wrong password", a), false);
  assert.equal(verifyPassword("password", "malformed"), false);
});
test("session detects tampering and expires", () => {
  const token = signSession("test-user");
  assert.equal(readSession(token), "test-user");
  assert.equal(readSession(token + "x"), null);
  const real = Date.now;
  try {
    Date.now = () => real() + 8 * 86400000;
    assert.equal(readSession(token), null);
  } finally {
    Date.now = real;
  }
});
test("public courses never expose correct answers", () => {
  for (const c of courses)
    assert.equal(
      "answer" in publicCourse(c).quiz ? "exposed" : undefined,
      undefined,
    );
});
test("admin input rejects invalid quizzes and unsafe media links", () => {
  const c = structuredClone(courses[0]);
  assert.equal(validateCourse(c).title, c.title);
  c.quiz.answer = 9;
  assert.throws(() => validateCourse(c));
  c.quiz.answer = 1;
  c.lessons[0].videoUrl = "javascript:alert(1)";
  assert.throws(() => validateCourse(c));
  for (const url of [
    "//other-site/video.mp4",
    "/videos/../private.mp4",
    "/videos/%2e%2e/private.mp4",
  ]) {
    c.lessons[0].videoUrl = url;
    assert.throws(() => validateCourse(c));
  }
  c.lessons[0].videoUrl = "/videos/learning-demo.mp4";
  assert.equal(validateCourse(c).lessons[0].videoUrl, c.lessons[0].videoUrl);
  c.lessons[0].videoUrl = "/videos/upload-1700000000000-abcd1234.mp4";
  assert.equal(validateCourse(c).lessons[0].videoUrl, c.lessons[0].videoUrl);
  c.lessons[0].videoUrl = "/videos/upload-1700000000000-abcd1234.webm";
  assert.equal(validateCourse(c).lessons[0].videoUrl, c.lessons[0].videoUrl);
});
test("admin video upload endpoint saves valid video and rejects unauthorized", async () => {
  const { POST } = await import("../app/api/[...path]/route.ts");
  const { NextRequest } = await import("next/server");
  const { unlink } = await import("node:fs/promises");
  const { join } = await import("node:path");

  // Non-admin request
  const unauthReq = new NextRequest("http://127.0.0.1:3000/api/admin/upload", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
  });
  const unauthRes = await POST(unauthReq, {
    params: Promise.resolve({ path: ["admin", "upload"] }),
  });
  assert.equal(unauthRes.status, 401);

  // Admin request with mp4 video
  const token = signSession("demo-admin");
  const formData = new FormData();
  const blob = new Blob(["fake video content"], { type: "video/mp4" });
  formData.append("video", blob, "sample.mp4");

  const adminReq = new NextRequest("http://127.0.0.1:3000/api/admin/upload", {
    method: "POST",
    headers: {
      origin: "http://127.0.0.1:3000",
      host: "127.0.0.1:3000",
      cookie: `aag_session=${token}`,
    },
    body: formData,
  });

  const adminRes = await POST(adminReq, {
    params: Promise.resolve({ path: ["admin", "upload"] }),
  });
  assert.equal(adminRes.status, 200);
  const data = await adminRes.json();
  assert.equal(data.ok, true);
  assert.ok(data.url.startsWith("/videos/upload-"));
  assert.ok(data.url.endsWith(".mp4"));

  // Clean up created file
  try {
    await unlink(join(process.cwd(), "public", "videos", data.filename));
  } catch {}
});
test("course targetRole is validated and defaults to all", () => {
  const c = structuredClone(courses[0]);
  assert.equal(validateCourse(c).targetRole, "all");
  (c as any).targetRole = "admin";
  assert.equal(validateCourse(c).targetRole, "admin");
  (c as any).targetRole = "learner";
  assert.equal(validateCourse(c).targetRole, "learner");
  (c as any).targetRole = "invalid";
  assert.equal(validateCourse(c).targetRole, "all");
});
test("admin can create user with specified role and update role", async () => {
  const { POST, PUT } = await import("../app/api/[...path]/route.ts");
  const { NextRequest } = await import("next/server");

  // Non-admin cannot create users
  const unauthReq = new NextRequest("http://127.0.0.1:3000/api/admin/users", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
    body: JSON.stringify({
      name: "Test User",
      email: "test-new@aag.demo",
      password: "Password123!",
      role: "admin",
    }),
  });
  const unauthRes = await POST(unauthReq, {
    params: Promise.resolve({ path: ["admin", "users"] }),
  });
  assert.equal(unauthRes.status, 401);

  // Admin can create new admin user
  const adminToken = signSession("demo-admin");
  const createReq = new NextRequest("http://127.0.0.1:3000/api/admin/users", {
    method: "POST",
    headers: {
      origin: "http://127.0.0.1:3000",
      host: "127.0.0.1:3000",
      cookie: `aag_session=${adminToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: "New Admin",
      email: "new-admin@aag.demo",
      password: "Password123!",
      role: "admin",
    }),
  });
  const createRes = await POST(createReq, {
    params: Promise.resolve({ path: ["admin", "users"] }),
  });
  assert.equal(createRes.status, 200);
  const created = await createRes.json();
  assert.equal(created.ok, true);
  assert.equal(created.user.role, "admin");

  // Admin can update user's role to learner
  const updateReq = new NextRequest("http://127.0.0.1:3000/api/admin/users", {
    method: "PUT",
    headers: {
      origin: "http://127.0.0.1:3000",
      host: "127.0.0.1:3000",
      cookie: `aag_session=${adminToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      userId: created.user.id,
      role: "learner",
    }),
  });
  const updateRes = await PUT(updateReq, {
    params: Promise.resolve({ path: ["admin", "users"] }),
  });
  assert.equal(updateRes.status, 200);
});
