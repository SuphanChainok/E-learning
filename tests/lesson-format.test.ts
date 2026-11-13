import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLessonContent,
  formatLessonTitle,
  isRawVideoFilename,
} from "../lib/lesson-format.ts";

test("isRawVideoFilename detects generated, camera, and upload filenames", () => {
  assert.equal(isRawVideoFilename("gemini_generated_video_a1b2c3d4.mp4"), true);
  assert.equal(isRawVideoFilename("gemini_generated_video"), true);
  assert.equal(isRawVideoFilename("upload-1731456789000-deadbeef.mp4"), true);
  assert.equal(isRawVideoFilename("VID_20261113_103000.mov"), true);
  assert.equal(
    isRawVideoFilename("550e8400-e29b-41d4-a716-446655440000.mp4"),
    true,
  );
  assert.equal(isRawVideoFilename(""), true);

  assert.equal(isRawVideoFilename("พื้นฐานระบบไฟฟ้าและแบตเตอรี่ EV"), false);
  assert.equal(isRawVideoFilename("Product_Overview.mp4"), false);
});

test("formatLessonTitle replaces raw video filenames with clean Thai labels", () => {
  assert.equal(
    formatLessonTitle("gemini_generated_video_7f9a12b3.mp4", 0),
    "บทเรียนที่ 1",
  );
  assert.equal(
    formatLessonTitle("upload-1731456789000-a1b2c3.mp4", 2),
    "บทเรียนที่ 3",
  );
  assert.equal(
    formatLessonTitle("การส่งมอบรถยนต์พรีเมียม ZEEKR 009", 0),
    "การส่งมอบรถยนต์พรีเมียม ZEEKR 009",
  );
  assert.equal(
    formatLessonTitle("Safety_Protocol_Overview.mp4", 1),
    "Safety Protocol Overview",
  );
});

test("formatLessonContent strips raw video filename metadata lines cleanly", () => {
  const mixed = [
    "บทเรียนวิดีโอ: gemini_generated_video_123abc.mp4",
    "gemini_generated_video_123abc.mp4",
    "รับชมวิดีโอเพื่อทำความเข้าใจมาตรฐานบริการลูกค้า",
  ].join("\n");

  assert.equal(
    formatLessonContent(mixed),
    "รับชมวิดีโอเพื่อทำความเข้าใจมาตรฐานบริการลูกค้า",
  );

  assert.equal(
    formatLessonContent("บทเรียนวิดีโอ: upload-1731456789000-ff00aa.mp4"),
    "",
  );

  assert.equal(
    formatLessonContent("ไฟล์ตัวอย่าง demo_clip.mp4 สำหรับฝึกอบรม"),
    "ไฟล์ตัวอย่าง สำหรับฝึกอบรม",
  );
});

