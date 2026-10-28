import type {
  Course,
  CourseData,
  User,
  PublicUser,
  Progress,
  ProgressUpdate,
  UserReport,
  DemoStore,
  Attempt,
  VideoProgress,
} from "./types";
import { MongoClient, type UpdateFilter } from "mongodb";
import { courses } from "./data.ts";
import { hashPassword } from "./security.ts";
import { updateVideoProgress } from "./video-progress.ts";
import { normalizeProgress } from "./course-progress.ts";
export let demo =
  process.env.DEMO_MODE === "true" ||
  (!process.env.MONGODB_URI && process.env.NODE_ENV !== "production");
export let fallbackMode = false;
const globals = globalThis;
let courseInitialization: Promise<void> | undefined;
function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return [
    "MongoNetworkError",
    "MongoServerSelectionError",
    "MongoNotConnectedError",
    "MongoTopologyClosedError",
  ].includes(error.name);
}
export function activateDemoFallback(error: unknown): boolean {
  if (!isDatabaseUnavailable(error)) return false;
  if (!fallbackMode) {
    console.warn(
      "AAG database unavailable; switched to temporary in-memory demo data:",
      error instanceof Error ? error.name : "Unknown",
    );
  }
  demo = true;
  fallbackMode = true;
  memory();
  return true;
}
export async function database() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!globals.aagMongo)
    globals.aagMongo = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
      .connect()
      .catch((e) => {
        globals.aagMongo = null;
        activateDemoFallback(e);
        throw e;
      });
  return (await globals.aagMongo).db(process.env.MONGODB_DB || "aag_learning");
}
function memory(): DemoStore {
  return (globals.aagDemo ??= {
    courses: structuredClone(courses),
    users: [
      {
        id: "demo-learner",
        name: "ผู้เรียน AAG+",
        email: "learner@aag.demo",
        password: hashPassword("Learn@12345"),
        role: "learner",
      },
      {
        id: "demo-admin",
        name: "ผู้ดูแล AAG+",
        email: "admin@aag.demo",
        password: hashPassword("Admin@12345"),
        role: "admin",
      },
    ],
    progress: [],
    videoProgress: [],
    attempts: [],
  });
}
export async function allCourses(): Promise<Course[]> {
  if (demo) return memory().courses;

  try {
    const collection = (await database()).collection<Course>("courses");
    courseInitialization ??= (async () => {
      await collection.createIndex({ id: 1 }, { unique: true });
      if ((await collection.countDocuments()) === 0) {
        for (const course of courses) {
          try {
            await collection.updateOne(
              { id: course.id },
              { $setOnInsert: course },
              { upsert: true },
            );
          } catch (error) {
            if (
              !(error instanceof Error) ||
              !("code" in error) ||
              error.code !== 11000
            )
              throw error;
          }
        }
      }
    })().catch((error: unknown) => {
      courseInitialization = undefined;
      throw error;
    });
    await courseInitialization;
    return await collection.find({}, { projection: { _id: 0 } }).toArray();
  } catch (error) {
    if (activateDemoFallback(error)) return memory().courses;
    throw error;
  }
}
export async function courseById(id: string) {
  return (await allCourses()).find((c) => c.id === id);
}
export async function userBy(
  field: "id" | "email",
  value: string,
): Promise<User | null | undefined> {
  if (demo) return memory().users.find((u) => u[field] === value);
  try {
    return await (
      await database()
    )
      .collection<User>("users")
      .findOne({ [field]: value }, { projection: { _id: 0 } });
  } catch (error) {
    if (activateDemoFallback(error))
      return memory().users.find((u) => u[field] === value);
    throw error;
  }
}
export async function addUser(user: User) {
  if (demo) {
    if (await userBy("email", user.email)) throw Error("Duplicate");
    memory().users.push(user);
  } else {
    const db = await database();
    await db
      .collection<User>("users")
      .createIndex({ email: 1 }, { unique: true });
    await db.collection<User>("users").insertOne(user);
  }
}
export async function getProgress(userId: string): Promise<Progress[]> {
  let progress: Progress[];
  let videos: VideoProgress[];
  if (demo) {
    progress = memory().progress.filter((p) => p.userId === userId);
    videos = memory().videoProgress.filter((p) => p.userId === userId);
  } else {
    try {
      const db = await database();
      [progress, videos] = await Promise.all([
        db
          .collection<Progress>("progress")
          .find({ userId }, { projection: { _id: 0 } })
          .toArray(),
        db
          .collection<VideoProgress>("video_progress")
          .find({ userId }, { projection: { _id: 0 } })
          .toArray(),
      ]);
    } catch (error) {
      if (!activateDemoFallback(error)) throw error;
      progress = memory().progress.filter((p) => p.userId === userId);
      videos = memory().videoProgress.filter((p) => p.userId === userId);
    }
  }
  const courses = await allCourses();
  return progress.map((item) => {
    const hydrated = {
      ...item,
      videoProgress: videos.filter((video) => video.courseId === item.courseId),
    };
    const course = courses.find((c) => c.id === item.courseId);
    return course ? normalizeProgress(course, hydrated) : hydrated;
  });
}
export async function saveVideoProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  currentTime: number,
  durationSeconds: number,
): Promise<VideoProgress> {
  if (demo) {
    const records = memory().videoProgress;
    const index = records.findIndex(
      (item) =>
        item.userId === userId &&
        item.courseId === courseId &&
        item.lessonId === lessonId,
    );
    const result = updateVideoProgress(
      records[index],
      currentTime,
      durationSeconds,
      userId,
      courseId,
      lessonId,
    );
    if (index >= 0) records[index] = result;
    else records.push(result);
    await saveProgress(userId, courseId, result.completed ? { lessonId } : {});
    return result;
  }

  const collection = (await database()).collection<VideoProgress>(
    "video_progress",
  );
  await collection.createIndex(
    { userId: 1, courseId: 1, lessonId: 1 },
    { unique: true },
  );
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await collection.findOne(
      { userId, courseId, lessonId },
      { projection: { _id: 0 } },
    );
    const result = updateVideoProgress(
      existing ?? undefined,
      currentTime,
      durationSeconds,
      userId,
      courseId,
      lessonId,
    );
    if (!existing) {
      try {
        await collection.insertOne(result);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== 11000
        )
          throw error;
        continue;
      }
    } else {
      const { revision: _previousRevision, ...fields } = result;
      const updated = await collection.updateOne(
        { userId, courseId, lessonId, revision: existing.revision },
        { $set: fields, $inc: { revision: 1 } },
      );
      if (!updated.modifiedCount) continue;
    }
    await saveProgress(userId, courseId, result.completed ? { lessonId } : {});
    return result;
  }
  throw new Error("ไม่สามารถบันทึกความคืบหน้าวิดีโอได้ กรุณาลองอีกครั้ง");
}
export async function saveProgress(
  userId: string,
  courseId: string,
  update: ProgressUpdate,
) {
  if (demo) {
    let p = memory().progress.find(
      (p) => p.userId === userId && p.courseId === courseId,
    );
    if (!p) {
      p = { userId, courseId, completed: [] };
      memory().progress.push(p);
    }
    if (update.lessonId && !p.completed.includes(update.lessonId))
      p.completed.push(update.lessonId);
    if (update.passed) {
      p.passed = true;
      p.completedAt ??= new Date().toISOString();
    }
    return;
  }
  const db = await database();
  await db
    .collection<Progress>("progress")
    .createIndex({ userId: 1, courseId: 1 }, { unique: true });
  const fields: Partial<Progress> = { updatedAt: new Date().toISOString() };
  if (update.passed)
    Object.assign(fields, {
      passed: true,
      completedAt: new Date().toISOString(),
    });
  const changes: UpdateFilter<Progress> = {
    $set: fields,
    $setOnInsert: update.lessonId
      ? { userId, courseId }
      : { userId, courseId, completed: [] },
  };
  if (update.lessonId) changes.$addToSet = { completed: update.lessonId };
  await db
    .collection<Progress>("progress")
    .updateOne({ userId, courseId }, changes, { upsert: true });
}
export async function mutateCourse(
  id: string,
  data: CourseData | null,
  remove = false,
): Promise<void> {
  if (remove) {
    if (demo) {
      const list = memory().courses;
      const index = list.findIndex((course) => course.id === id);
      if (index >= 0) list.splice(index, 1);
    } else
      await (await database()).collection<Course>("courses").deleteOne({ id });
    return;
  }
  if (!data) throw new Error("Course data required");
  const course: Course = { ...data, id };
  if (demo) {
    const list = memory().courses;
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list[index] = course;
    else list.push(course);
  } else
    await (
      await database()
    )
      .collection<Course>("courses")
      .replaceOne({ id }, course, { upsert: true });
}
export async function report(): Promise<UserReport[]> {
  let users: User[];
  let progress: Progress[];
  let videos: VideoProgress[];
  if (demo) {
    ({ users, progress, videoProgress: videos } = memory());
  } else {
    try {
      const db = await database();
      [users, progress, videos] = await Promise.all([
        db
          .collection<User>("users")
          .find({}, { projection: { _id: 0, password: 0 } })
          .toArray(),
        db
          .collection<Progress>("progress")
          .find({}, { projection: { _id: 0 } })
          .toArray(),
        db
          .collection<VideoProgress>("video_progress")
          .find({}, { projection: { _id: 0 } })
          .toArray(),
      ]);
    } catch (error) {
      if (!activateDemoFallback(error)) throw error;
      ({ users, progress, videoProgress: videos } = memory());
    }
  }
  const courses = await allCourses();
  return users.map(({ password, ...u }) => ({
    ...u,
    progress: progress
      .filter((p) => p.userId === u.id)
      .map((item) => {
        const hydrated = {
          ...item,
          videoProgress: videos.filter(
            (video) =>
              video.userId === u.id && video.courseId === item.courseId,
          ),
        };
        const course = courses.find((c) => c.id === item.courseId);
        return course ? normalizeProgress(course, hydrated) : hydrated;
      }),
  }));
}
export async function throttle(key: string) {
  const since = new Date(Date.now() - 15 * 60000);
  if (demo) return throttleInMemory(key, since);
  try {
    const db = await database();
    await db
      .collection<Attempt>("attempts")
      .createIndex({ at: 1 }, { expireAfterSeconds: 900 });
    if (
      (await db
        .collection<Attempt>("attempts")
        .countDocuments({ key, at: { $gte: since } })) >= 10
    )
      return false;
    await db.collection<Attempt>("attempts").insertOne({ key, at: new Date() });
    return true;
  } catch (error) {
    if (activateDemoFallback(error)) return throttleInMemory(key, since);
    throw error;
  }
}
function throttleInMemory(key: string, since: Date) {
  const m = memory();
  m.attempts = m.attempts.filter((a) => a.at > since);
  if (m.attempts.filter((a) => a.key === key).length >= 10) return false;
  m.attempts.push({ key, at: new Date() });
  return true;
  return true;
}
