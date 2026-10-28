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
});
