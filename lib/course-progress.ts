import type { Progress, PublicCourse } from "./types";

// Text-era completion flags must not complete a newly attached video.
// Stored history stays intact; API responses describe the current lessons.
export function normalizeProgress(
  course: PublicCourse,
  progress: Progress,
): Progress {
  const completed = course.lessons
    .filter((lesson) =>
      lesson.videoUrl
        ? (progress.videoProgress?.find((video) => video.lessonId === lesson.id)
            ?.maxWatchedTime ?? 0) >=
          (lesson.videoDurationSeconds ?? lesson.minutes * 60)
        : progress.completed.includes(lesson.id),
    )
    .map((lesson) => lesson.id);
  const allCompleted =
    course.lessons.length > 0 && completed.length === course.lessons.length;
  return {
    ...progress,
    completed,
    passed: allCompleted && progress.passed === true,
    completedAt: allCompleted ? progress.completedAt : undefined,
  };
}

export function courseProgress(course: PublicCourse, progress?: Progress) {
  let total = 0;
  let watched = 0;
  let complete = course.lessons.length > 0;
  for (const lesson of course.lessons) {
    const duration = lesson.videoDurationSeconds ?? lesson.minutes * 60;
    const video = progress?.videoProgress?.find(
      (v) => v.lessonId === lesson.id,
    );
    const done = lesson.videoUrl
      ? (video?.maxWatchedTime ?? 0) >= duration
      : progress?.completed.includes(lesson.id) === true;
    total += duration;
    watched += done
      ? duration
      : Math.min(duration, Math.max(0, video?.maxWatchedTime ?? 0));
    complete = complete && done;
  }
  return {
    seconds: watched,
    percent: complete
      ? 100
      : total > 0
        ? Math.min(99, Math.floor((watched / total) * 100))
        : 0,
    complete,
  };
}
