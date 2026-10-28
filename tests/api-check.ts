import type { Progress, Course } from "../lib/types";
// Run against a running DEMO server: npm run test:api
import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://127.0.0.1:3000";
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
) {
  const res = await fetch(base + "/api/" + path, {
    method,
    headers: {
      "content-type": "application/json",
      origin: base,
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    data: await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
  };
}
const session = await request("auth/session");
assert.equal(
  session.data.demo,
  true,
  "Only run this test against a DEMO server",
);
if (process.env.EXPECT_FALLBACK === "true")
  assert.equal(session.data.fallback, true, "Expected database fallback mode");
assert.equal((await request("courses")).status, 401);
assert.equal(
  (
    await request("auth/login", "POST", {
      email: "learner@aag.demo",
      password: "wrong",
    })
  ).status,
  401,
);
const learner = await request("auth/login", "POST", {
  email: "learner@aag.demo",
  password: "Learn@12345",
});
assert.equal(learner.status, 200);
const cookie = learner.cookie;
assert.ok(cookie);
assert.equal((await request("admin/report", "GET", null, cookie)).status, 403);
const listing = await request("courses", "GET", null, cookie);
assert.equal(listing.status, 200);
const fixtureAdmin = await request("auth/login", "POST", {
  email: "admin@aag.demo",
  password: "Admin@12345",
});
assert.equal(fixtureAdmin.status, 200);
const textFixture = await request(
  "admin/courses",
  "POST",
  {
    title: "Text lesson API fixture",
    lessons: [{ title: "Read", content: "Test text lesson", minutes: 1 }],
    quiz: { question: "Test?", options: ["A", "B", "C"], answer: 1 },
  },
  fixtureAdmin.cookie,
);
assert.equal(textFixture.status, 200);
const c = (await request("courses", "GET", null, cookie)).data.courses.find(
  (course: Course) => course.id === textFixture.data.id,
);
assert.ok(c, "Expected the text-based test fixture");
assert.equal(c.quiz.answer, undefined);
const enrollBefore = await request(
  "quiz",
  "POST",
  { courseId: c.id, answer: 1 },
  cookie,
);
// New demo process has no completed lessons; repeated runs can already have progress.
assert.ok([200, 400].includes(enrollBefore.status));
assert.equal(
  (
    await request(
      "progress",
      "POST",
      { courseId: c.id, lessonId: "invalid" },
      cookie,
    )
  ).status,
  400,
);
for (const l of c.lessons)
  assert.equal(
    (
      await request(
        "progress",
        "POST",
        { courseId: c.id, lessonId: l.id },
        cookie,
      )
    ).status,
    200,
  );
assert.equal(
  (await request("quiz", "POST", { courseId: c.id, answer: 0 }, cookie)).data
    .passed,
  false,
);
assert.equal(
  (await request("quiz", "POST", { courseId: c.id, answer: 1 }, cookie)).data
    .passed,
  true,
);
assert.equal(
  (await request("progress", "GET", null, cookie)).data.progress.find(
    (p: Progress) => p.courseId === c.id,
  ).passed,
  true,
);
const newEmail = "test-" + Date.now() + "@example.test";
const registered = await request("auth/register", "POST", {
  name: "Integration learner",
  email: newEmail,
  password: "Test-password-123",
  role: "admin",
});
assert.equal(registered.status, 200);
assert.equal(registered.data.user.role, "learner");
assert.equal(
  (await request("progress", "GET", null, registered.cookie)).data.progress
    .length,
  0,
);
const admin = await request("auth/login", "POST", {
  email: "admin@aag.demo",
  password: "Admin@12345",
});
assert.equal(admin.status, 200);
const payload = {
  title: "Integration test course",
  category: "ทักษะดิจิทัล",
  instructor: "Test",
  lessons: [
    {
      title: "Test lesson",
      minutes: 10,
      content: "Test content",
      videoUrl: "https://example.test/lesson.mp4",
      videoDurationSeconds: 100,
    },
  ],
  quiz: { question: "Test?", options: ["A", "B", "C"], answer: 2 },
};
const created = await request("admin/courses", "POST", payload, admin.cookie);
assert.equal(created.status, 200);
const id = created.data.id;
try {
  const skipped = await request(
    "progress",
    "POST",
    { courseId: id, lessonId: "lesson-1", currentTime: 95 },
    cookie,
  );
  assert.equal(skipped.status, 200);
  assert.equal(skipped.data.videoProgress.currentTime, 8);
  assert.equal(skipped.data.videoProgress.completed, false);
  assert.equal(
    (
      await request(
        "progress",
        "POST",
        { courseId: id, lessonId: "lesson-1" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("progress", "GET", null, cookie)).data.progress.find(
      (p: Progress) => p.courseId === id,
    ).videoProgress[0].currentTime,
    8,
  );
  assert.equal(
    (
      await request(
        "admin/courses",
        "PUT",
        { ...payload, id, title: "Updated test course" },
        admin.cookie,
      )
    ).status,
    200,
  );
  const edited = await request("admin/courses", "GET", null, admin.cookie);
  assert.equal(
    edited.data.courses.find((c: Course) => c.id === id).title,
    "Updated test course",
  );
  assert.equal(
    (await request("admin/report", "GET", null, admin.cookie)).status,
    200,
  );
  const cross = await fetch(base + "/api/progress", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin: "https://other.example",
    },
    body: JSON.stringify({ courseId: c.id, lessonId: c.lessons[0].id }),
  });
  assert.equal(cross.status, 403);
} finally {
  assert.equal(
    (await request("admin/courses/" + id, "DELETE", null, admin.cookie)).status,
    200,
  );
}
assert.equal((await request("auth/logout", "POST", {}, cookie)).status, 200);
assert.equal(
  (await request("admin/courses/" + c.id, "DELETE", null, fixtureAdmin.cookie))
    .status,
  200,
);
console.log(
  "PASS: authentication, authorization, validation, progress, quiz, user isolation, admin CRUD, reports, cross-origin protection and logout",
);
