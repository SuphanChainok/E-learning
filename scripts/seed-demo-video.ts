import { MongoClient } from "mongodb";
import { demoVideoCourse } from "../lib/demo-video-course.ts";

const timer = setTimeout(() => {
  console.error("Database connection timed out");
  process.exit(1);
}, 20000);
const client = new MongoClient(process.env.MONGODB_URI || "", {
  serverSelectionTimeoutMS: 5000,
});
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "aag_learning");
  const result = await db
    .collection("courses")
    .updateOne(
      { id: demoVideoCourse.id },
      { $setOnInsert: demoVideoCourse },
      { upsert: true },
    );
  console.log(
    result.upsertedCount
      ? "Video demo course added. Existing courses unchanged."
      : "Video demo course already exists.",
  );
} catch (error) {
  const e = error as { name?: string; code?: number };
  console.error(JSON.stringify({ name: e.name, code: e.code }));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  await client.close();
}
