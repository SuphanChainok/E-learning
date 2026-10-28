import { MongoClient } from "mongodb";
import { mkdir, writeFile, access } from "node:fs/promises";
import { asVideoCourse, videoCourseIds } from "../lib/video-curriculum.ts";
import { courses } from "../lib/data.ts";
import type { Course } from "../lib/types";

const client = new MongoClient(process.env.MONGODB_URI || "", {
  serverSelectionTimeoutMS: 5000,
});
const timer = setTimeout(() => {
  console.error("Database operation timed out");
  process.exit(1);
}, 30000);
try {
  // Verify assets before changing any database records.
  for (const course of courses.filter((c) => videoCourseIds.includes(c.id)))
    for (const lesson of course.lessons)
      await access(`public${lesson.videoUrl}`);
  await client.connect();
  const collection = client
    .db(process.env.MONGODB_DB || "aag_learning")
    .collection<Course>("courses");
  const originals = await collection
    .find({ id: { $in: videoCourseIds } }, { projection: { _id: 0 } })
    .toArray();
  await mkdir(".data/backups", { recursive: true });
  const backup = `.data/backups/courses-before-video-${Date.now()}.json`;
  await writeFile(backup, JSON.stringify(originals, null, 2));
  for (const id of videoCourseIds) {
    const original = originals.find((c) => c.id === id);
    if (!original) {
      await collection.updateOne(
        { id },
        { $setOnInsert: courses.find((c) => c.id === id)! },
        { upsert: true },
      );
    } else {
      const updated = asVideoCourse(original);
      const result = await collection.updateOne(
        { id, lessons: original.lessons },
        { $set: { lessons: updated.lessons, duration: updated.duration } },
      );
      if (!result.matchedCount)
        throw new Error(
          "Course changed during migration; retry after reviewing it",
        );
    }
  }
  const saved = await collection
    .find({ id: { $in: videoCourseIds } }, { projection: { _id: 0 } })
    .toArray();
  console.log(
    JSON.stringify({
      backup,
      courses: saved.map((c) => ({
        category: c.category,
        lessons: c.lessons.length,
        videos: c.lessons.filter((l) => l.videoUrl).length,
        minutes: c.duration,
      })),
    }),
  );
} catch (error) {
  const e = error as { name?: string; code?: number };
  console.error(JSON.stringify({ name: e.name, code: e.code }));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  await client.close();
}
