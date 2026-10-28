import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { courses } from "../lib/data.ts";
import { asVideoCourse, videoCourseIds } from "../lib/video-curriculum.ts";

test("all four curriculum categories have distinct playable one-minute lesson assets", () => {
  const curriculum = courses.filter((c) => videoCourseIds.includes(c.id));
  assert.equal(curriculum.length, 4);
  const urls = curriculum.flatMap((c) => c.lessons.map((l) => l.videoUrl));
  assert.equal(urls.length, 11);
  assert.equal(new Set(urls).size, 11);
  for (const course of curriculum) {
    assert.equal(course.duration, course.lessons.length);
    for (const lesson of course.lessons) {
      assert.equal(lesson.videoDurationSeconds, 60);
      assert.ok(existsSync(`public${lesson.videoUrl}`));
    }
    assert.deepEqual(
      asVideoCourse(course),
      course,
      "Migration must be repeatable without duplicating text",
    );
  }
});

test("conversion preserves custom video lessons and existing lesson identifiers", () => {
  const original = structuredClone(
    courses.find((c) => c.id === "welcome-aag")!,
  );
  original.lessons[0].videoUrl = "https://example.com/custom.mp4";
  original.lessons[0].videoDurationSeconds = 120;
  original.lessons[0].minutes = 2;
  const converted = asVideoCourse(original);
  assert.deepEqual(converted.lessons[0], original.lessons[0]);
  assert.equal(converted.duration, 4);
});
