import type { VideoProgress } from "./types";

const INITIAL_ADVANCE_SECONDS = 8;
const MAX_ADVANCE_SECONDS = 15;
const ADVANCE_TOLERANCE_SECONDS = 2;

export function updateVideoProgress(
  existing: VideoProgress | undefined,
  currentTime: number,
  durationSeconds: number,
  userId: string,
  courseId: string,
  lessonId: string,
  now = Date.now(),
): VideoProgress {
  if (
    !Number.isFinite(currentTime) ||
    currentTime < 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > 86400 ||
    currentTime > durationSeconds + 1
  )
    throw new Error("ตำแหน่งวิดีโอไม่ถูกต้อง");

  const elapsedSeconds = existing
    ? Math.max(0, (now - Date.parse(existing.updatedAt)) / 1000)
    : 0;
  const allowedAdvance = existing
    ? Math.min(MAX_ADVANCE_SECONDS, elapsedSeconds + ADVANCE_TOLERANCE_SECONDS)
    : INITIAL_ADVANCE_SECONDS;
  const maxAllowedTime = Math.min(
    durationSeconds,
    (existing?.maxWatchedTime ?? 0) + allowedAdvance,
  );
  const acceptedTime = Math.min(currentTime, maxAllowedTime);
  const maxWatchedTime = Math.max(existing?.maxWatchedTime ?? 0, acceptedTime);
  const completed = maxWatchedTime >= durationSeconds;

  return {
    userId,
    courseId,
    lessonId,
    currentTime: acceptedTime,
    maxWatchedTime,
    durationSeconds,
    watchedSeconds: maxWatchedTime,
    percent: Math.min(
      100,
      Math.floor((maxWatchedTime / durationSeconds) * 100),
    ),
    completed,
    updatedAt: new Date(now).toISOString(),
    revision: (existing?.revision ?? 0) + 1,
  };
}
