import test from "node:test";
import assert from "node:assert/strict";
import { courseProgress, normalizeProgress } from "../lib/course-progress.ts";
import type { PublicCourse, Progress } from "../lib/types";

const course = {
  lessons: [
    { id: "a", minutes: 1, videoUrl: "/a.mp4", videoDurationSeconds: 60 },
    { id: "b", minutes: 3, videoUrl: "/b.mp4", videoDurationSeconds: 180 },
  ],
} as PublicCourse;
test("course percentage includes partial viewing weighted by duration", () => {
  const progress = {
    completed: ["a"],
    videoProgress: [
      { lessonId: "a", maxWatchedTime: 60 },
      { lessonId: "b", maxWatchedTime: 60 },
    ],
  } as Progress;
  assert.deepEqual(courseProgress(course, progress), {
    seconds: 120,
    percent: 50,
    complete: false,
  });
  progress.videoProgress![1].maxWatchedTime = 180;
  assert.deepEqual(courseProgress(course, progress), {
    seconds: 240,
    percent: 100,
    complete: true,
  });
});
test("empty course and unwatched lessons do not count as complete", () => {
  assert.equal(courseProgress(course).percent, 0);
  assert.equal(
    courseProgress({ lessons: [] } as unknown as PublicCourse).complete,
    false,
  );
});

test("old text completions cannot unlock newly attached video lessons", () => {
  const old = {
    userId: "u",
    courseId: "c",
    completed: ["a", "b"],
    passed: true,
    completedAt: "2026-01-01",
  };
  const normalized = normalizeProgress(course, old);
  assert.deepEqual(normalized.completed, []);
  assert.equal(normalized.passed, false);
  assert.equal(courseProgress(course, normalized).percent, 0);
  assert.deepEqual(
    old.completed,
    ["a", "b"],
    "Historical records must stay intact",
  );
  const partial = normalizeProgress(course, {
    ...old,
    videoProgress: [
      { lessonId: "a", maxWatchedTime: 60 },
    ] as Progress["videoProgress"],
  });
  assert.deepEqual(partial.completed, ["a"]);
  assert.equal(partial.passed, false);
});
