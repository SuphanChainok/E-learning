export type PrimaryRole = "admin" | "manager" | "employee";
export type Role = PrimaryRole | "learner" | "student";
export type View = "dashboard" | "catalog" | "my" | "certificates" | "admin";

export const COURSE_CATEGORIES = [
  "ทั้งหมด",
  "องค์กรและวัฒนธรรม",
  "ทักษะดิจิทัล",
  "ความปลอดภัย",
  "พัฒนาตนเอง",
] as const;

export const ROLE_LABELS: Record<PrimaryRole, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "ผู้จัดการเรียน",
  employee: "ผู้เข้าอบรม",
};

export function normalizeRole(role?: string | null): PrimaryRole {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  return "employee";
}

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[normalizeRole(role)];
}

export function canManageCourses(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "manager";
}

export function isAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === "admin";
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  assignedCourses?: string[];
  azureId?: string;
  displayName?: string;
  userPrincipalName?: string;
  jobTitle?: string | null;
  department?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
export type PublicUser = Omit<User, "password">;
export interface Lesson {
  id: string;
  title: string;
  content: string;
  minutes: number;
  videoUrl?: string;
  videoDurationSeconds?: number;
}
export interface Quiz {
  question: string;
  options: string[];
  answer: number;
}
export type CourseColor = "mint" | "peach" | "lavender" | "blue";
export type CourseIcon = "spark" | "digital" | "shield" | "people";
export type CourseTargetRole =
  | "all"
  | "employee"
  | "manager"
  | "admin"
  | "learner";
export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  instructor: string;
  duration: number;
  color: CourseColor;
  icon: CourseIcon;
  level: string;
  targetRole?: CourseTargetRole;
  lessons: Lesson[];
  quiz: Quiz;
}
export type PublicCourse = Omit<Course, "quiz"> & {
  quiz: Omit<Quiz, "answer">;
};
export type CourseData = Omit<Course, "id">;
export type CourseDraft = Pick<
  Course,
  "title" | "description" | "category" | "instructor" | "color" | "quiz"
> & { id?: string; targetRole?: CourseTargetRole; lessons: (Omit<Lesson, "id"> & { id?: string })[] };
export interface Progress {
  userId: string;
  courseId: string;
  completed: string[];
  videoProgress?: VideoProgress[];
  passed?: boolean;
  completedAt?: string;
  updatedAt?: string;
}
export interface VideoProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  currentTime: number;
  maxWatchedTime: number;
  durationSeconds?: number;
  watchedSeconds?: number;
  percent?: number;
  completed: boolean;
  updatedAt: string;
  revision: number;
}
export interface ProgressUpdate {
  lessonId?: string;
  passed?: boolean;
}
export type UserReport = PublicUser & { progress: Progress[] };
export interface Attempt {
  key: string;
  at: Date;
}
export interface OtpRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}
export interface DemoStore {
  courses: Course[];
  users: User[];
  progress: Progress[];
  videoProgress: VideoProgress[];
  attempts: Attempt[];
  otps?: OtpRecord[];
}
export interface ApiResponses {
  "auth/session": { user: PublicUser | null; demo: boolean; fallback: boolean };
  "auth/login": { user: PublicUser };
  "auth/register": { user: PublicUser };
  "auth/send-otp": {
    ok: boolean;
    message: string;
    email: string;
    expiresInSeconds: number;
    expiresAt: string;
    devOtp?: string;
    mailWarning?: string;
  };
  "auth/verify-otp": {
    ok: boolean;
    token: string;
    user: PublicUser;
  };
  "auth/logout": { ok: boolean };
  courses: { courses: PublicCourse[] };
  progress: { progress: Progress[] };
  quiz: { passed: boolean };
  "admin/courses": { courses: Course[] };
  "admin/report": { users: UserReport[] };
  "admin/upload": { ok: boolean; url: string; filename: string };
}
