import {
  type Course,
  type CourseData,
  type User,
  type PublicUser,
  type Progress,
  type ProgressUpdate,
  type UserReport,
  type DemoStore,
  type Attempt,
  type OtpRecord,
  type VideoProgress,
  type Role,
  type Company,
  normalizeRole,
  resolveCourseCompany,
  DEFAULT_BUILTIN_COURSE_IDS,
  getCourseSortTime,
  sortCoursesLatestFirst,
} from "./types.ts";
export { DEFAULT_BUILTIN_COURSE_IDS, getCourseSortTime, sortCoursesLatestFirst };
import { MongoClient, type UpdateFilter, type Filter } from "mongodb";
import { courses } from "./data.ts";
import { hashPassword, verifyPassword } from "./security.ts";
import { updateVideoProgress } from "./video-progress.ts";
import { normalizeProgress } from "./course-progress.ts";
import { connectToDatabase, dbLastError } from "./mongodb.ts";
export { dbLastError };
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
  try {
    return await connectToDatabase();
  } catch (e) {
    activateDemoFallback(e);
    throw e;
  }
}
function memory(): DemoStore {
  if (!globals.aagDemo) {
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD || "admin123456";
    const initialUsers: User[] = [
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
    ];

    if (envAdminEmail && envAdminEmail !== "admin@aag.demo") {
      initialUsers.push({
        id: "admin-initial",
        name: "ผู้ดูแลระบบ AAG+",
        email: envAdminEmail,
        password: hashPassword(envAdminPass),
        role: "admin",
      });
    }

    globals.aagDemo = {
      courses: structuredClone(courses),
      users: initialUsers,
      progress: [],
      videoProgress: [],
      attempts: [],
      otps: [],
    };
  }
  return globals.aagDemo;
}

export async function allCourses(filter?: { company?: string }): Promise<Course[]> {
  const mapAndFilter = (list: Course[]) => {
    const resolved = list.map((c) => ({
      ...c,
      company: resolveCourseCompany(c),
    }));
    const filtered = filter?.company
      ? resolved.filter((c) => c.company === filter.company)
      : resolved;
    return sortCoursesLatestFirst(filtered);
  };

  if (demo) return mapAndFilter(memory().courses);

  try {
    const collection = (await database()).collection<Course>("courses");
    courseInitialization ??= (async () => {
      await collection.createIndex({ id: 1 }, { unique: true });
      if ((await collection.countDocuments()) === 0) {
        for (const course of courses) {
          try {
            await collection.updateOne(
              { id: course.id },
              { $set: { ...course, company: resolveCourseCompany(course) } },
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

    const targetComp = filter?.company as Company | undefined;
    const mongoQuery: Filter<Course> = targetComp
      ? targetComp === "AGE"
        ? {
          $or: [
            { company: "AGE" },
            { company: { $exists: false } },
          ],
        }
        : { company: targetComp }
      : {};

    const docs = await collection.find(mongoQuery, { projection: { _id: 0 } }).toArray();
    const resolved = docs.map((c) => ({
      ...c,
      company: resolveCourseCompany(c),
    }));
    return sortCoursesLatestFirst(resolved);
  } catch (error) {
    if (activateDemoFallback(error)) return mapAndFilter(memory().courses);
    throw error;
  }
}
export async function courseById(id: string) {
  return (await allCourses()).find((c) => c.id === id);
}
function normalizeUserDoc(u: User | null | undefined): User | null | undefined {
  if (!u) return u;
  return {
    ...u,
    id: u.id || u.azureId || "",
    name: u.name || u.displayName || u.userPrincipalName || u.email || "ผู้ใช้งาน",
    email: u.email || u.userPrincipalName || "",
    role: normalizeRole(u.role),
  };
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export async function userBy(
  field: "id" | "email",
  value: string,
): Promise<User | null | undefined> {
  const normalized = value.trim().toLowerCase();
  if (demo) {
    return normalizeUserDoc(
      memory().users.find((u) =>
        field === "id"
          ? u.id === value || u.azureId === value
          : u.email.toLowerCase() === normalized ||
          (u.userPrincipalName || "").toLowerCase() === normalized,
      ),
    );
  }
  try {
    const emailRegex = new RegExp(`^${escapeRegex(normalized)}$`, "i");
    const query =
      field === "id"
        ? { $or: [{ id: value }, { azureId: value }] }
        : {
          $or: [
            { email: normalized },
            { email: emailRegex },
            { userPrincipalName: emailRegex },
          ],
        };
    const col = (await database()).collection<User>("users");
    let doc = await col.findOne(query, { projection: { _id: 0 } });
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD;

    if (
      field === "email" &&
      (normalized === "learner@aag.demo" || normalized === "admin@aag.demo")
    ) {
      if (!doc) {
        const isLearner = normalized === "learner@aag.demo";
        const demoUser: User = {
          id: isLearner ? "demo-learner" : "demo-admin",
          name: isLearner ? "ผู้เรียน AAG+" : "ผู้ดูแล AAG+",
          email: normalized,
          password: hashPassword(isLearner ? "Learn@12345" : "Admin@12345"),
          role: isLearner ? "learner" : "admin",
          company: "AAG+",
          allowedCompanies: ["AAG+", "ABM", "AGE"],
        };
        await col.updateOne(
          { email: normalized },
          { $setOnInsert: demoUser },
          { upsert: true },
        );
        doc = await col.findOne({ email: normalized }, { projection: { _id: 0 } });
      }
    }

    if (
      field === "email" &&
      envAdminEmail &&
      normalized === envAdminEmail &&
      envAdminPass
    ) {
      if (!doc) {
        const adminUser: User = {
          id: "admin-initial",
          name: "ผู้ดูแลระบบ AAG+",
          email: normalized,
          password: hashPassword(envAdminPass),
          role: "admin",
        };
        await col.updateOne(
          { email: normalized },
          { $setOnInsert: adminUser },
          { upsert: true },
        );
        doc = await col.findOne({ email: normalized }, { projection: { _id: 0 } });
      } else if (!doc.password || doc.role !== "admin" || !verifyPassword(envAdminPass, doc.password)) {
        const updatedPass = hashPassword(envAdminPass);
        await col.updateOne(
          { email: normalized },
          {
            $set: {
              password: updatedPass,
              role: "admin",
            },
          },
        );
        doc.password = updatedPass;
        doc.role = "admin";
      }
    }
    return normalizeUserDoc(doc);
  } catch (error) {
    if (activateDemoFallback(error))
      return normalizeUserDoc(
        memory().users.find((u) =>
          field === "id"
            ? u.id === value || u.azureId === value
            : u.email.toLowerCase() === normalized ||
            (u.userPrincipalName || "").toLowerCase() === normalized,
        ),
      );
    throw error;
  }
}
export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
let otpIndexCreated = false;
export async function createAndSaveOtp(
  emailInput: string,
): Promise<{ otp: string; expiresAt: Date; createdAt: Date }> {
  const email = emailInput.trim().toLowerCase();
  const otp = generateOtpCode();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);

  if (demo) {
    const store = memory();
    store.otps = (store.otps ?? []).filter((item) => item.email !== email);
    store.otps.push({ email, otp, expiresAt, createdAt });
    return { otp, expiresAt, createdAt };
  }

  try {
    const db = await database();
    const otps = db.collection<OtpRecord>("otps");
    if (!otpIndexCreated) {
      await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await otps.createIndex({ email: 1 });
      otpIndexCreated = true;
    }
    await otps.deleteMany({ email });
    await otps.insertOne({
      email,
      otp,
      expiresAt,
      createdAt,
    });
    return { otp, expiresAt, createdAt };
  } catch (error) {
    if (activateDemoFallback(error)) {
      const store = memory();
      store.otps = (store.otps ?? []).filter((item) => item.email !== email);
      store.otps.push({ email, otp, expiresAt, createdAt });
      return { otp, expiresAt, createdAt };
    }
    throw error;
  }
}
export async function verifyAndConsumeOtp(
  emailInput: string,
  otpInput: string,
): Promise<boolean> {
  const email = emailInput.trim().toLowerCase();
  const otp = otpInput.trim();
  const now = new Date();

  if (demo) {
    const store = memory();
    const list = store.otps ?? [];
    const match = list.find(
      (item) =>
        item.email === email &&
        item.otp === otp &&
        item.expiresAt.getTime() > now.getTime(),
    );
    if (!match) return false;
    store.otps = list.filter((item) => item.email !== email);
    return true;
  }

  try {
    const db = await database();
    const otps = db.collection<OtpRecord>("otps");
    const record = await otps.findOne({
      email,
      otp,
      expiresAt: { $gt: now },
    });
    if (!record) return false;
    await otps.deleteMany({ email });
    return true;
  } catch (error) {
    if (activateDemoFallback(error)) {
      const store = memory();
      const list = store.otps ?? [];
      const match = list.find(
        (item) =>
          item.email === email &&
          item.otp === otp &&
          item.expiresAt.getTime() > now.getTime(),
      );
      if (!match) return false;
      store.otps = list.filter((item) => item.email !== email);
      return true;
    }
    throw error;
  }
}
export async function syncMicrosoftLoginUser(profile: {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
}): Promise<User> {
  const azureId = profile.id.trim();
  const email = (profile.mail || profile.userPrincipalName || "")
    .trim()
    .toLowerCase();
  if (!azureId || !email) {
    throw new Error("ไม่พบอีเมลหรือรหัสผู้ใช้จากบัญชี Microsoft 365");
  }
  const displayName = (
    profile.displayName ||
    profile.userPrincipalName ||
    email
  ).trim();
  const now = new Date();

  if (demo) {
    let existing = memory().users.find(
      (u) =>
        u.email.toLowerCase() === email ||
        u.azureId === azureId ||
        u.id === azureId,
    );
    if (existing) {
      existing.azureId = azureId;
      existing.displayName = displayName;
      existing.name = existing.name || displayName;
      existing.email = email;
      existing.userPrincipalName = profile.userPrincipalName ?? email;
      existing.jobTitle = profile.jobTitle ?? null;
      existing.department = profile.department ?? null;
      existing.updatedAt = now;
      return normalizeUserDoc(existing)!;
    }
    const created: User = {
      id: azureId,
      azureId,
      name: displayName,
      displayName,
      email,
      userPrincipalName: profile.userPrincipalName ?? email,
      jobTitle: profile.jobTitle ?? null,
      department: profile.department ?? null,
      password: "",
      role: "employee",
      createdAt: now,
      updatedAt: now,
    };
    memory().users.push(created);
    return created;
  }

  const db = await database();
  const col = db.collection<User>("users");
  const existing = await col.findOne(
    { $or: [{ email }, { azureId }, { id: azureId }] },
    { projection: { _id: 0 } },
  );

  if (existing) {
    const resolvedId = existing.id || existing.azureId || azureId;
    const resolvedName = existing.name || displayName;
    await col.updateOne(
      { $or: [{ email }, { azureId }, { id: resolvedId }] },
      {
        $set: {
          id: resolvedId,
          azureId,
          displayName,
          name: resolvedName,
          email,
          userPrincipalName: profile.userPrincipalName ?? email,
          jobTitle: profile.jobTitle ?? existing.jobTitle ?? null,
          department: profile.department ?? existing.department ?? null,
          updatedAt: now,
        },
      },
    );
    return {
      ...existing,
      id: resolvedId,
      azureId,
      displayName,
      name: resolvedName,
      email,
      userPrincipalName: profile.userPrincipalName ?? email,
      jobTitle: profile.jobTitle ?? existing.jobTitle ?? null,
      department: profile.department ?? existing.department ?? null,
      updatedAt: now,
    };
  }

  await col.updateOne(
    { $or: [{ email }, { azureId }] },
    {
      $set: {
        azureId,
        displayName,
        name: displayName,
        email,
        userPrincipalName: profile.userPrincipalName ?? email,
        jobTitle: profile.jobTitle ?? null,
        department: profile.department ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        id: azureId,
        role: "employee" as const,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const upserted = await col.findOne(
    { $or: [{ email }, { azureId }] },
    { projection: { _id: 0 } },
  );
  if (!upserted) {
    throw new Error("ไม่สามารถบันทึกข้อมูลผู้ใช้ Microsoft 365 ลงฐานข้อมูลได้");
  }
  return normalizeUserDoc(upserted)!;
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
export async function updateUserRole(userId: string, role: Role) {
  if (demo) {
    const u = memory().users.find(
      (x) => x.id === userId || x.azureId === userId,
    );
    if (u) u.role = role;
  } else {
    try {
      const db = await database();
      await db
        .collection<User>("users")
        .updateOne(
          { $or: [{ id: userId }, { azureId: userId }] },
          { $set: { role } },
        );
    } catch (error) {
      if (!activateDemoFallback(error)) throw error;
      const u = memory().users.find(
        (x) => x.id === userId || x.azureId === userId,
      );
      if (u) u.role = role;
    }
  }
}
export async function updateUserCourses(
  userId: string,
  assignedCourses: string[],
) {
  if (demo) {
    const u = memory().users.find(
      (x) => x.id === userId || x.azureId === userId,
    );
    if (u) u.assignedCourses = assignedCourses;
  } else {
    try {
      const db = await database();
      await db
        .collection<User>("users")
        .updateOne(
          { $or: [{ id: userId }, { azureId: userId }] },
          { $set: { assignedCourses } },
        );
    } catch (error) {
      if (!activateDemoFallback(error)) throw error;
      const u = memory().users.find(
        (x) => x.id === userId || x.azureId === userId,
      );
      if (u) u.assignedCourses = assignedCourses;
    }
  }
}
export async function deleteUser(userId: string) {
  if (demo) {
    const store = memory();
    store.users = store.users.filter(
      (x) => x.id !== userId && x.azureId !== userId && x.email !== userId,
    );
    store.progress = store.progress.filter((p) => p.userId !== userId);
    store.videoProgress = store.videoProgress.filter(
      (v) => v.userId !== userId,
    );
  } else {
    try {
      const db = await database();
      await Promise.all([
        db.collection<User>("users").deleteOne({
          $or: [{ id: userId }, { azureId: userId }, { email: userId }],
        }),
        db.collection<Progress>("progress").deleteMany({ userId }),
        db.collection<VideoProgress>("video_progress").deleteMany({ userId }),
      ]);
    } catch (error) {
      if (!activateDemoFallback(error)) throw error;
      const store = memory();
      store.users = store.users.filter(
        (x) => x.id !== userId && x.azureId !== userId && x.email !== userId,
      );
      store.progress = store.progress.filter((p) => p.userId !== userId);
      store.videoProgress = store.videoProgress.filter(
        (v) => v.userId !== userId,
      );
    }
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
  const now = new Date().toISOString();
  const course: Course = {
    ...data,
    id,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  if (demo) {
    const list = memory().courses;
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list[index] = course;
    else list.unshift(course);
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
  return users.map(({ password, ...u }) => {
    const uid = u.id || u.azureId || "";
    const uname =
      u.name || u.displayName || u.userPrincipalName || "ผู้ใช้งาน";
    const uemail = u.email || u.userPrincipalName || "";
    return {
      ...u,
      id: uid,
      name: uname,
      email: uemail,
      role: normalizeRole(u.role),
      progress: progress
        .filter(
          (p) => p.userId === uid || (u.azureId && p.userId === u.azureId),
        )
        .map((item) => {
          const hydrated = {
            ...item,
            videoProgress: videos.filter(
              (video) =>
                (video.userId === uid ||
                  (u.azureId && video.userId === u.azureId)) &&
                video.courseId === item.courseId,
            ),
          };
          const course = courses.find((c) => c.id === item.courseId);
          return course ? normalizeProgress(course, hydrated) : hydrated;
        }),
    };
  });
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
