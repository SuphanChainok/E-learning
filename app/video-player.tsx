"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, EyeOff, X } from "lucide-react";
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

function fmtTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
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
  const frame = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [visibilityNotice, setVisibilityNotice] = useState(false);
  const visibilityNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const armHideTimer = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setControlsVisible(false), 5000);
  }, [clearHideTimer]);

  const revealControls = useCallback(
    (autoHide: boolean) => {
      setControlsVisible(true);
      if (autoHide && player.current && !player.current.paused) armHideTimer();
      else clearHideTimer();
    },
    [armHideTimer, clearHideTimer],
  );

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

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

  // Auto-pause video when switching tabs, minimizing, or blurring window
  useEffect(() => {
    function pauseIfPlaying() {
      const video = player.current;
      if (video && !video.paused && !video.ended) {
        video.pause();
        setVisibilityNotice(true);
        setControlsVisible(true);
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pauseIfPlaying();
      }
    }

    function handleBlur() {
      pauseIfPlaying();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      if (visibilityNoticeTimer.current) {
        clearTimeout(visibilityNoticeTimer.current);
      }
    };
  }, []);

  // Auto-dismiss the visibility notice toast after 9 seconds if not manually closed
  useEffect(() => {
    if (visibilityNotice) {
      if (visibilityNoticeTimer.current) clearTimeout(visibilityNoticeTimer.current);
      visibilityNoticeTimer.current = setTimeout(() => {
        setVisibilityNotice(false);
      }, 9000);
    }
    return () => {
      if (visibilityNoticeTimer.current) clearTimeout(visibilityNoticeTimer.current);
    };
  }, [visibilityNotice]);

  const seekMax = Math.min(
    durationSeconds,
    Math.max(maxWatchedTime, latest.current.currentTime),
  );

  function clampToAllowed(time: number) {
    // Allow rewinding anywhere within already-watched range; never allow skipping ahead.
    const limit = Math.min(
      durationSeconds,
      Math.max(maxWatchedTime, latest.current.currentTime),
    );
    return Math.max(0, Math.min(time, limit));
  }

  function setVideoTime(time: number) {
    const video = player.current;
    if (!video) return;
    const next = clampToAllowed(time);
    video.currentTime = next;
    latest.current = { currentTime: next };
    setCurrentTime(next);
  }

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

  function togglePlay() {
    const video = player.current;
    if (!video) return;
    setVisibilityNotice(false);
    if (video.paused) {
      video.play()?.catch((err: unknown) => {
        if (
          err instanceof Error &&
          (err.name === "NotSupportedError" || err.name === "NotAllowedError")
        ) {
          setMediaError(true);
        }
      });
    } else {
      video.pause();
    }
  }

  function rewind() {
    setVideoTime((player.current?.currentTime ?? latest.current.currentTime) - 10);
  }

  function seekFromTrack(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
    setVideoTime(ratio * durationSeconds);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === frame.current)
        await document.exitFullscreen();
      else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen();
    } catch {
      // Fullscreen may be unavailable (permissions/unsupported); ignore.
    }
  }

  function onActivity(e?: SyntheticEvent) {
    // Show controls on any interaction; hide again after 5s only while playing.
    if (
      e?.type === "pointermove" &&
      "pointerType" in e.nativeEvent &&
      (e.nativeEvent as PointerEvent).pointerType === "touch"
    )
      return;
    revealControls(true);
  }

  const watchedPercent = Math.min(
    100,
    durationSeconds > 0
      ? Math.floor((maxWatchedTime / durationSeconds) * 100)
      : 0,
  );
  const currentPercent =
    durationSeconds > 0 ? Math.min(100, (currentTime / durationSeconds) * 100) : 0;
  const seekablePercent =
    durationSeconds > 0 ? Math.min(100, (seekMax / durationSeconds) * 100) : 0;

  return (
    <div className="tracked-video cinematic-video-wrapper">
      <div
        ref={frame}
        className={
          "video-frame cinematic-video-frame rounded-2xl overflow-hidden shadow-xl bg-black relative" +
          (controlsVisible ? " controls-visible" : " controls-hidden") +
          (fullscreen ? " is-fullscreen" : "")
        }
        onPointerMove={onActivity}
        onPointerDown={onActivity}
        onTouchStart={() => onActivity()}
        onMouseLeave={() => {
          if (playing) armHideTimer();
        }}
      >
        {/* Auto-pause notice toast banner on visibility change */}
        {visibilityNotice && (
          <div
            className="auto-pause-toast absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-30 bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-xl border border-amber-500/50 shadow-2xl flex items-center gap-3 animate-fade-in"
            role="alert"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <EyeOff size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-amber-300">
                ระบบหยุดวิดีโอชั่วคราว
              </p>
              <p className="text-[11px] sm:text-xs text-slate-200 mt-0.5 leading-snug">
                ระบบหยุดวิดีโอชั่วคราว เนื่องจากคุณสลับหน้าต่างหรือเปลี่ยนแท็บ
              </p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition flex-shrink-0"
              aria-label="ปิดการแจ้งเตือน"
              onClick={(e) => {
                e.stopPropagation();
                setVisibilityNotice(false);
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        <video
          ref={player}
          aria-label="วิดีโอบทเรียน"
          playsInline
          poster={
            /^\/videos\/(learning-demo|curriculum-[a-z0-9-]+)\.mp4$/.test(src)
              ? src.replace(/\.mp4$/, "-poster.jpg")
              : undefined
          }
          src={src}
          preload="metadata"
          className="w-full aspect-video block bg-black object-contain"
          onClick={() => {
            togglePlay();
            revealControls(true);
          }}
          onPlay={() => {
            setPlaying(true);
            setVisibilityNotice(false);
            revealControls(true);
          }}
          onPause={() => {
            setPlaying(false);
            revealControls(false);
            flush();
          }}
          onEnded={() => {
            setPlaying(false);
            revealControls(false);
            flush();
          }}
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
            if (!video) return;
            const limit = clampToAllowed(video.currentTime);
            if (video.currentTime > limit + 0.25) video.currentTime = limit;
          }}
          onSeeked={() => {
            const time = player.current?.currentTime ?? 0;
            latest.current = { currentTime: time };
            setCurrentTime(time);
          }}
          onTimeUpdate={onTimeUpdate}
        />
        {!playing && !mediaError && !visibilityNotice && (
          <button
            type="button"
            className="video-center-play"
            aria-label="เล่นวิดีโอ"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
              revealControls(true);
            }}
          >
            <Play size={28} className="ml-1" fill="currentColor" />
          </button>
        )}
        <div
          className="video-overlay"
          aria-hidden={controlsVisible ? "false" : "true"}
          onClick={() => revealControls(true)}
        >
          <div className="video-controls" aria-label="ตัวควบคุมวิดีโอ">
            <button
              type="button"
              className="video-control-btn"
              aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
                revealControls(true);
              }}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              className="video-control-btn"
              aria-label="ย้อนกลับ 10 วินาที"
              title="ย้อนกลับ 10 วินาที (กรอข้ามไปข้างหน้าไม่ได้)"
              onClick={(e) => {
                e.stopPropagation();
                rewind();
                revealControls(true);
              }}
            >
              <RotateCcw size={18} />
            </button>
            <span className="video-time" aria-label="เวลาปัจจุบัน">
              {fmtTime(currentTime)} / {fmtTime(durationSeconds)}
            </span>
            <div
              className="video-seek"
              role="slider"
              aria-label="แถบเวลา (กดย้อนกลับได้ แต่กรอข้ามไปข้างหน้าไม่ได้)"
              aria-valuemin={0}
              aria-valuemax={Math.floor(durationSeconds)}
              aria-valuenow={Math.floor(currentTime)}
              onClick={seekFromTrack}
              title="กดย้อนกลับได้ แต่กรอข้ามไปข้างหน้าไม่ได้"
            >
              <div
                className="video-seek-allowed"
                style={{ width: seekablePercent + "%" }}
              />
              <div
                className="video-seek-fill"
                style={{ width: currentPercent + "%" }}
              />
            </div>
            <span
              className="video-save-pill"
              role="status"
              title={
                completed
                  ? "เรียนสำเร็จ"
                  : `รับชมแล้ว ${watchedPercent}% (ไม่สามารถกรอข้ามไปข้างหน้าได้)`
              }
            >
              {saveState === "saving"
                ? "กำลังบันทึก…"
                : saveState === "error"
                  ? "บันทึกไม่สำเร็จ"
                  : completed
                    ? "ดูจบแล้ว 100%"
                    : `รับชม ${watchedPercent}%`}
            </span>
            <button
              type="button"
              className="video-control-btn"
              aria-label={fullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
              title={fullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
              onClick={(e) => {
                e.stopPropagation();
                void toggleFullscreen();
                revealControls(true);
              }}
            >
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
      {mediaError && (
        <p role="alert" className="error mt-3">
          โหลดวิดีโอไม่สำเร็จ กรุณาตรวจสอบลิงก์ไฟล์วิดีโอของบทเรียน
        </p>
      )}
    </div>
  );
}
