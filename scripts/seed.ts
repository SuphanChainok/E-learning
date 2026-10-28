import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/security.ts";
import { courses } from "../lib/data.ts";
if (
  !process.env.MONGODB_URI ||
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD.length < 12 ||
  process.env.ADMIN_PASSWORD.startsWith("replace-")
)
  throw Error(
    "Configure MongoDB, ADMIN_EMAIL and a strong ADMIN_PASSWORD (12+ characters) in .env.local",
  );
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "aag_learning");
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("courses").createIndex({ id: 1 }, { unique: true });
  await db
    .collection("progress")
    .createIndex({ userId: 1, courseId: 1 }, { unique: true });
  await db
    .collection("users")
    .updateOne(
      { email: process.env.ADMIN_EMAIL.toLowerCase() },
      {
        $setOnInsert: {
          id: randomUUID(),
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          name: "ผู้ดูแล AAG+",
          password: hashPassword(process.env.ADMIN_PASSWORD),
          role: "admin",
        },
      },
      { upsert: true },
    );
  for (const c of courses)
    await db
      .collection("courses")
      .updateOne({ id: c.id }, { $setOnInsert: c }, { upsert: true });
  console.log(
    "Created indexes, sample courses and initial administrator. Existing records unchanged.",
  );
} finally {
  await client.close();
}
