import test from "node:test";
import assert from "node:assert/strict";
import { updateVideoProgress } from "../lib/video-progress.ts";

test("video progress limits initial and forward seeking", () => {
  const first = updateVideoProgress(
    undefined,
    90,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    1000,
  );
  assert.equal(first.currentTime, 8);
  assert.equal(first.maxWatchedTime, 8);
  assert.equal(first.completed, false);

  const next = updateVideoProgress(
    first,
    90,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    11000,
  );
  assert.equal(next.currentTime, 20);
  assert.equal(next.maxWatchedTime, 20);
});

test("completion requires the full video duration", () => {
  const existing = updateVideoProgress(
    undefined,
    86,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    1000,
  );
  const almostDone = {
    ...existing,
    currentTime: 88,
    maxWatchedTime: 88,
    updatedAt: new Date(1000).toISOString(),
  };
  const completed = updateVideoProgress(
    almostDone,
    90,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    3000,
  );
  assert.equal(completed.maxWatchedTime, 90);
  assert.equal(completed.completed, false);
  const ended = updateVideoProgress(
    completed,
    100,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    13000,
  );
  assert.equal(ended.completed, true);
});

test("rewinding updates the resume position but preserves the highest timestamp", () => {
  const existing = {
    userId: "user-1",
    courseId: "course-1",
    lessonId: "lesson-1",
    currentTime: 70,
    maxWatchedTime: 70,
    completed: false,
    updatedAt: new Date(1000).toISOString(),
    revision: 1,
  };
  const rewound = updateVideoProgress(
    existing,
    20,
    100,
    "user-1",
    "course-1",
    "lesson-1",
    2000,
  );
  assert.equal(rewound.currentTime, 20);
  assert.equal(rewound.maxWatchedTime, 70);
});

test("invalid positions and durations are rejected", () => {
  assert.throws(() =>
    updateVideoProgress(undefined, Number.NaN, 100, "u", "c", "l"),
  );
  assert.throws(() => updateVideoProgress(undefined, 10, 0, "u", "c", "l"));
  assert.throws(() => updateVideoProgress(undefined, 102, 100, "u", "c", "l"));
});
