import test from "node:test";
import assert from "node:assert/strict";
import { courses } from "../lib/data.ts";
import {
  activateDemoFallback,
  allCourses,
  demo,
  fallbackMode,
  userBy,
} from "../lib/store.ts";

test("database network failures switch reads to clearly marked demo data", async () => {
  const error = new Error("database server unavailable");
  error.name = "MongoServerSelectionError";

  assert.equal(activateDemoFallback(error), true);
  assert.equal(demo, true);
  assert.equal(fallbackMode, true);
  assert.equal((await allCourses()).length, courses.length);
  assert.equal((await userBy("email", "learner@aag.demo"))?.id, "demo-learner");
});

test("database configuration and application errors do not activate fallback", () => {
  assert.equal(
    activateDemoFallback(new Error("MONGODB_URI is required")),
    false,
  );
  const authenticationError = new Error("Authentication failed");
  authenticationError.name = "MongoServerError";
  assert.equal(activateDemoFallback(authenticationError), false);
});
