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
        $set: {
          password: hashPassword(process.env.ADMIN_PASSWORD),
          role: "admin",
        },
        $setOnInsert: {
          id: randomUUID(),
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          name: "ผู้ดูแล AAG+",
        },
      },
      { upsert: true },
    );
  await db.collection("users").updateOne(
    { email: "learner@aag.demo" },
    {
      $set: {
        password: hashPassword("Learn@12345"),
        role: "learner",
        company: "AAG+",
        allowedCompanies: ["AAG+", "ABM", "AGE"],
      },
      $setOnInsert: {
        id: "demo-learner",
        email: "learner@aag.demo",
        name: "ผู้เรียน AAG+",
      },
    },
    { upsert: true },
  );
  await db.collection("users").updateOne(
    { email: "admin@aag.demo" },
    {
      $set: {
        password: hashPassword("Admin@12345"),
        role: "admin",
        company: "AAG+",
        allowedCompanies: ["AAG+", "ABM", "AGE"],
      },
      $setOnInsert: {
        id: "demo-admin",
        email: "admin@aag.demo",
        name: "ผู้ดูแล AAG+",
      },
    },
    { upsert: true },
  );
  for (const c of courses) {
    await db
      .collection("courses")
      .updateOne({ id: c.id }, { $set: c }, { upsert: true });
  }
  console.log(
    `✅ Seeded ${courses.length} courses with official business thumbnails (AGE, ABM, AAG+) and administrator successfully.`,
  );
} finally {
  await client.close();
}
