"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoProgress } from "../lib/types";

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
  src: string;
  durationSeconds: number;
  initialProgress?: VideoProgress;
  onProgress: (progress: VideoProgress) => void;
  onError: (error: unknown) => void;
}

interface Snapshot {
  currentTime: number;
}

export default function VideoPlayer({
  courseId,
  lessonId,
  src,
  durationSeconds,
  initialProgress,
  onProgress,
  onError,
}: VideoPlayerProps) {
  const player = useRef<HTMLVideoElement>(null);
  const latest = useRef<Snapshot>({
    currentTime: initialProgress?.currentTime ?? 0,
  });
  const queued = useRef<Snapshot | null>(null);
  const inFlight = useRef(false);
  const lastSentAt = useRef(0);
  const [currentTime, setCurrentTime] = useState(
    initialProgress?.currentTime ?? 0,
  );
  const [maxWatchedTime, setMaxWatchedTime] = useState(
    initialProgress?.maxWatchedTime ?? 0,
  );
  const [completed, setCompleted] = useState(
    initialProgress?.completed ?? false,
  );
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [mediaError, setMediaError] = useState(false);

  const sendProgress = useCallback(
    async (snapshot: Snapshot, force = false): Promise<void> => {
      if (!force && Date.now() - lastSentAt.current < 5000) return;
      if (inFlight.current) {
        queued.current = snapshot;
        return;
      }

      inFlight.current = true;
      setSaveState("saving");
      lastSentAt.current = Date.now();
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            courseId,
            lessonId,
            currentTime: snapshot.currentTime,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "บันทึกความคืบหน้าวิดีโอไม่สำเร็จ");
        const progress = data.videoProgress as VideoProgress;
        setMaxWatchedTime(progress.maxWatchedTime);
        setCompleted(progress.completed);
        onProgress(progress);
        setSaveState("saved");
      } catch (error) {
        setSaveState("error");
        onError(error);
      } finally {
        inFlight.current = false;
        const next = queued.current;
        queued.current = null;
        if (next) await sendProgress(next, true);
      }
    },
    [courseId, lessonId, onError, onProgress],
  );

  useEffect(() => {
    const flush = () => void sendProgress(latest.current, true);
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flush();
    };
  }, [sendProgress]);

  function onTimeUpdate() {
    if (player.current?.seeking) return;
    const time = player.current?.currentTime ?? 0;
    const snapshot = { currentTime: time };
    latest.current = snapshot;
    setCurrentTime(time);
    void sendProgress(snapshot);
  }

  function flush() {
    latest.current = {
      currentTime: player.current?.currentTime ?? latest.current.currentTime,
    };
    void sendProgress(latest.current, true);
  }

  const watchedPercent = Math.min(
    100,
    durationSeconds > 0
      ? Math.floor((maxWatchedTime / durationSeconds) * 100)
      : 0,
  );

  return (
    <div className="tracked-video">
      <video
        ref={player}
        controls
        aria-label="วิดีโอบทเรียน"
        playsInline
        poster={
          /^\/videos\/(learning-demo|curriculum-[a-z0-9-]+)\.mp4$/.test(src)
            ? src.replace(/\.mp4$/, "-poster.jpg")
            : undefined
        }
        src={src}
        preload="metadata"
        onError={() => setMediaError(true)}
        onLoadedMetadata={() => {
          if (player.current)
            player.current.currentTime = Math.min(
              initialProgress?.currentTime ?? 0,
              durationSeconds,
            );
        }}
        onSeeking={() => {
          const video = player.current;
          if (
            video &&
            video.currentTime >
              Math.max(maxWatchedTime, latest.current.currentTime) + 1
          )
            video.currentTime = Math.max(
              maxWatchedTime,
              latest.current.currentTime,
            );
        }}
        onTimeUpdate={onTimeUpdate}
        onPause={flush}
        onEnded={flush}
        onSeeked={() => {
          const time = player.current?.currentTime ?? 0;
          latest.current = { currentTime: time };
          setCurrentTime(time);
        }}
      />
      {mediaError && (
        <p role="alert" className="error">
          โหลดวิดีโอไม่สำเร็จ กรุณาตรวจสอบลิงก์ไฟล์วิดีโอของบทเรียน
        </p>
      )}
      <div className="video-progress">
        <div className="video-stats">
          <div>
            <span>เวลาที่รับชมแล้ว</span>
            <strong>
              {Math.floor(maxWatchedTime / 60)} นาที{" "}
              {Math.floor(maxWatchedTime % 60)} วินาที
            </strong>
            <small>
              จาก {Math.floor(durationSeconds / 60)} นาที{" "}
              {Math.floor(durationSeconds % 60)} วินาที
            </small>
          </div>
          <div>
            <span>ความคืบหน้าบทเรียน</span>
            <strong>{watchedPercent}%</strong>
            <small>บันทึกแยกตามบัญชีผู้เรียน</small>
          </div>
          <div>
            <span>สถานะบทเรียน</span>
            <strong className={completed ? "video-completed" : ""}>
              {completed
                ? "เรียนสำเร็จ"
                : maxWatchedTime > 0
                  ? "กำลังเรียน"
                  : "ยังไม่เริ่มเรียน"}
            </strong>
            <small role="status">
              {saveState === "saving"
                ? "กำลังบันทึก…"
                : saveState === "error"
                  ? "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"
                  : "บันทึกความคืบหน้าแล้ว"}
            </small>
          </div>
        </div>
        <div
          className="progress"
          role="meter"
          aria-label="ความคืบหน้าการรับชมวิดีโอ"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={watchedPercent}
        >
          <i style={{ width: watchedPercent + "%" }} />
        </div>
        <small>
          ตำแหน่งปัจจุบัน {Math.floor(currentTime / 60)}:
          {String(Math.floor(currentTime % 60)).padStart(2, "0")} ·
          ดูครบคลิปเพื่อเรียนสำเร็จ
        </small>
      </div>
    </div>
  );
}
