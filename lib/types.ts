export type Role = "admin" | "learner";
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
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
> & { id?: string; lessons: (Omit<Lesson, "id"> & { id?: string })[] };
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
export interface DemoStore {
  courses: Course[];
  users: User[];
  progress: Progress[];
  videoProgress: VideoProgress[];
  attempts: Attempt[];
}
export interface ApiResponses {
  "auth/session": { user: PublicUser | null; demo: boolean; fallback: boolean };
  "auth/login": { user: PublicUser };
  "auth/register": { user: PublicUser };
  "auth/logout": { ok: boolean };
  courses: { courses: PublicCourse[] };
  progress: { progress: Progress[] };
  quiz: { passed: boolean };
  "admin/courses": { courses: Course[] };
  "admin/report": { users: UserReport[] };
}
