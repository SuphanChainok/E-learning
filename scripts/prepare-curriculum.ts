import { mkdir, writeFile } from "node:fs/promises";
import { courses } from "../lib/data.ts";
import { videoCurriculum, videoCourseIds } from "../lib/video-curriculum.ts";
await mkdir("artifacts/curriculum", { recursive: true });
const lessons = courses
  .filter((c) => videoCourseIds.includes(c.id))
  .flatMap((course) =>
    course.lessons.map((lesson) => ({
      courseId: course.id,
      category: course.category,
      title: lesson.title,
      id: lesson.id,
      color: course.color,
      file: lesson.videoUrl!.split("/").pop(),
      ...videoCurriculum[lesson.id],
    })),
  );
await writeFile(
  "artifacts/curriculum/manifest.json",
  JSON.stringify(
    {
      style: {
        name: "AAG editorial typography",
        font: "Tahoma",
        width: 1280,
        height: 720,
        fps: 15,
        seconds: 60,
        titleSize: 52,
        bodySize: 40,
        margin: 72,
        motion: "0.4 second ease-out reveal followed by stable reading holds",
        audio: "silent",
        exclusions: [
          "no decorative charts",
          "no tiny text",
          "no stock claims about company policy",
        ],
      },
      timeline: [
        { start: 0, settled: 0.4, cue: 0, hold_end: 6, end: 6 },
        { start: 6, settled: 6.4, cue: 6, hold_end: 20, end: 20 },
        { start: 20, settled: 20.4, cue: 20, hold_end: 34, end: 34 },
        { start: 34, settled: 34.4, cue: 34, hold_end: 48, end: 48 },
        { start: 48, settled: 48.4, cue: 48, hold_end: 60, end: 60 },
      ],
      lessons,
    },
    null,
    2,
  ),
);
console.log(`Prepared ${lessons.length} video lessons`);
