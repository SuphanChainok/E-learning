import test from "node:test";
import assert from "node:assert/strict";
import { allCourses } from "../lib/store.ts";
import { resolveCourseCompany, type Company } from "../lib/types.ts";
import { validateCourse } from "../lib/security.ts";
import { NextRequest } from "next/server";
import { GET as getCoursesRoute } from "../app/api/courses/route.ts";
import { signSession } from "../lib/security.ts";
import { getCourseCoverImage, isVideoMedia } from "../components/CourseCard.tsx";
import { userBy } from "../lib/store.ts";

test("resolveCourseCompany correctly identifies company or falls back", () => {
  assert.equal(resolveCourseCompany({ company: "ABM" }), "ABM");
  assert.equal(resolveCourseCompany({ company: "AAG+" }), "AAG+");
  assert.equal(resolveCourseCompany({ company: "AGE" }), "AGE");
  assert.equal(resolveCourseCompany({ id: "welcome-aag" }), "AAG+");
  assert.equal(resolveCourseCompany({ id: "video-learning-demo" }), "AAG+");
  assert.equal(resolveCourseCompany({ id: "cyber-awareness" }), "ABM");
  assert.equal(resolveCourseCompany({ id: "other-legacy-course" }), "AGE");
});

test("allCourses filters by company strictly", async () => {
  const abmCourses = await allCourses({ company: "ABM" });
  assert.ok(abmCourses.length > 0, "Should have ABM courses");
  for (const c of abmCourses) {
    assert.equal(c.company, "ABM", "Every course returned must be ABM");
  }

  const ageCourses = await allCourses({ company: "AGE" });
  assert.ok(ageCourses.length > 0, "Should have AGE courses");
  for (const c of ageCourses) {
    assert.equal(c.company, "AGE", "Every course returned must be AGE");
  }

  const aagCourses = await allCourses({ company: "AAG+" });
  assert.ok(aagCourses.length > 0, "Should have AAG+ courses");
  for (const c of aagCourses) {
    assert.equal(c.company, "AAG+", "Every course returned must be AAG+");
  }
});

test("validateCourse sets company properly", () => {
  const base = {
    title: "คอร์สทดสอบระบบ",
    description: "ทดสอบคำอธิบาย",
    lessons: [{ title: "บทที่ 1", content: "เนื้อหา", minutes: 10 }],
    quiz: { question: "ข้อใดถูกต้อง?", options: ["ก", "ข", "ค"], answer: 0 },
  };

  const abmValid = validateCourse({ ...base, company: "ABM" });
  assert.equal(abmValid.company, "ABM");

  const aagValid = validateCourse({ ...base, company: "AAG+" });
  assert.equal(aagValid.company, "AAG+");

  const ageValid = validateCourse({ ...base, company: "AGE" });
  assert.equal(ageValid.company, "AGE");

  // Invalid or omitted company defaults to AGE
  const defaultValid = validateCourse({ ...base, company: "UNKNOWN" });
  assert.equal(defaultValid.company, "AGE");
});

test("GET /api/courses with company query returns only matching courses for admin session", async () => {
  const sessionToken = signSession("demo-admin", "admin");
  const req = new NextRequest("http://127.0.0.1:3000/api/courses?company=ABM", {
    headers: {
      cookie: `aag_session=${sessionToken}`,
    },
  });

  const res = await getCoursesRoute(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.courses));
  assert.ok(data.courses.length > 0);
  for (const c of data.courses) {
    assert.equal(c.company, "ABM");
  }
});

test("validateCourse preserves and sanitizes course thumbnail", () => {
  const base = {
    title: "คอร์สทดสอบปก",
    description: "ทดสอบคำอธิบาย",
    lessons: [{ title: "บทที่ 1", content: "เนื้อหา", minutes: 10 }],
    quiz: { question: "ข้อใดถูกต้อง?", options: ["ก", "ข", "ค"], answer: 0 },
    thumbnail: "  /images/courses/abm-biomass.jpg  ",
  };

  const valid = validateCourse(base);
  assert.equal(valid.thumbnail, "/images/courses/abm-biomass.jpg");
});

test("getCourseCoverImage prioritizes thumbnail and falls back to company cover", () => {
  const customCourse = {
    id: "custom-1",
    title: "คอร์สปกกำหนดเอง",
    description: "คำอธิบาย",
    category: "ทั่วไป",
    color: "mint" as const,
    duration: 10,
    company: "ABM" as Company,
    lessons: [],
    thumbnail: "/images/courses/custom-uploaded.jpg",
  };
  assert.equal(
    getCourseCoverImage(customCourse),
    "/images/courses/custom-uploaded.jpg",
  );

  const abmFallbackCourse = {
    id: "abm-generic-1",
    title: "คอร์สทั่วไป ABM",
    description: "คำอธิบาย",
    category: "ทั่วไป",
    color: "mint" as const,
    duration: 10,
    company: "ABM" as Company,
    lessons: [],
  };
  assert.equal(
    getCourseCoverImage(abmFallbackCourse),
    "/images/courses/fallback-abm.jpg",
  );

  const aagFallbackCourse = {
    id: "aag-generic-1",
    title: "คอร์สทั่วไป AAG+",
    description: "คำอธิบาย",
    category: "ทั่วไป",
    color: "mint" as const,
    duration: 10,
    company: "AAG+" as Company,
    lessons: [],
  };
  assert.equal(
    getCourseCoverImage(aagFallbackCourse),
    "/images/courses/fallback-aag.jpg",
  );

  const ageFallbackCourse = {
    id: "age-generic-1",
    title: "คอร์สทั่วไป AGE",
    description: "คำอธิบาย",
    category: "ทั่วไป",
    color: "mint" as const,
    duration: 10,
    company: "AGE" as Company,
    lessons: [],
  };
  assert.equal(
    getCourseCoverImage(ageFallbackCourse),
    "/images/courses/fallback-age.jpg",
  );
});

test("userBy retrieves demo user and admin user without failure", async () => {
  const demoLearner = await userBy("email", "learner@aag.demo");
  assert.ok(demoLearner, "Demo learner must exist");
  assert.equal(demoLearner?.role, "employee");

  const demoAdmin = await userBy("email", "admin@aag.demo");
  assert.ok(demoAdmin, "Demo admin must exist");
  assert.equal(demoAdmin?.role, "admin");
});

test("isVideoMedia identifies video formats correctly", () => {
  assert.equal(isVideoMedia("/videos/preview.mp4"), true);
  assert.equal(isVideoMedia("/videos/teaser.webm"), true);
  assert.equal(isVideoMedia("/videos/intro.mov"), true);
  assert.equal(isVideoMedia("/images/courses/aag-zeekr.jpg"), false);
  assert.equal(isVideoMedia("/images/courses/abm-biomass.png"), false);
  assert.equal(isVideoMedia(""), false);
  assert.equal(isVideoMedia(undefined), false);
});

test("sortCoursesLatestFirst sorts newly created courses ahead of default courses", async () => {
  const { sortCoursesLatestFirst } = await import("../lib/store.ts");
  const testList = [
    { id: "age-safety", createdAt: "2024-01-01T00:00:00.000Z" },
    { id: "newly-created-1", createdAt: "2026-11-13T10:00:00.000Z" },
    { id: "digital-productivity" },
    { id: "newly-created-2", createdAt: "2026-11-13T12:00:00.000Z" },
  ];
  const sorted = sortCoursesLatestFirst(testList);
  assert.equal(sorted[0].id, "newly-created-2", "Newest course must be first");
  assert.equal(sorted[1].id, "newly-created-1", "Second newest course must be second");
});
