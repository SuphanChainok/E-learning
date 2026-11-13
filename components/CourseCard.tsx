"use client";
import Image from "next/image";
import { BookOpen, ArrowUpRight, Clock } from "lucide-react";
import type { PublicCourse, Course, Company } from "../lib/types";

export function isVideoMedia(url?: string): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".ogg") ||
    clean.startsWith("data:video")
  );
}

export function getCourseCoverImage(
  course: Pick<PublicCourse | Course, "category" | "color"> & {
    thumbnail?: string;
    company?: Company;
  },
): string {
  // 1. ตรวจสอบรูปภาพหน้าปกที่กำหนดมาจากฐานข้อมูล / ข้อมูลหลักสูตร
  if (course.thumbnail && course.thumbnail.trim()) {
    return course.thumbnail.trim();
  }

  // 2. หากยังไม่มีรูปภาพ (Fallback) ให้แสดงรูปภาพ Default ตามบริษัทนั้นๆ
  const comp = course.company || "AGE";
  if (comp === "ABM") {
    return "/images/courses/fallback-abm.jpg";
  }
  if (comp === "AAG+") {
    return "/images/courses/fallback-aag.jpg";
  }
  return "/images/courses/fallback-age.jpg";
}

export interface CourseCardProps {
  course: PublicCourse;
  percent: (c: PublicCourse) => number;
  openCourse: (c: PublicCourse) => void;
  priority?: boolean;
}

export default function CourseCard({
  course: c,
  percent,
  openCourse,
  priority = false,
}: CourseCardProps) {
  const pct = percent(c);
  const coverSrc = getCourseCoverImage(c);

  return (
    <article className="course-card">
      <button
        className="course-art"
        onClick={() => openCourse(c)}
        aria-label={"เปิดคอร์ส " + c.title}
      >
        {isVideoMedia(coverSrc) ? (
          <video
            src={coverSrc}
            autoPlay
            muted
            loop
            playsInline
            className="course-art-bg-img"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <Image
            src={coverSrc}
            alt={c.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            unoptimized={coverSrc.startsWith("http")}
            sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="course-art-bg-img"
          />
        )}
        <span className="course-art-overlay" />
        <span className="art-kicker">
          {c.company === "ABM"
            ? "ABM · BIOMASS ACADEMY"
            : c.company === "AAG+"
              ? "AGE AUTO GALLERY · ACADEMY"
              : "AGE GROUP · ACADEMY"}
        </span>
        <span className="art-caption">{c.subtitle || "AGE GROUP LMS"}</span>
        <span className="art-arrow">
          <ArrowUpRight size={18} />
        </span>
      </button>
      <div className="course-body">
        <div className="course-meta">
          <span className={`course-company-pill company-${(c.company || "AGE").toLowerCase().replace("+", "-plus")}`}>
            {c.company || "AGE"}
          </span>
          <span className="course-category-tag">{c.category}</span>
          {c.level && <span className="course-level-tag">{c.level}</span>}
        </div>
        <button
          className="title-button"
          onClick={() => openCourse(c)}
          title={c.title}
        >
          {c.title}
        </button>
        <p className="instructor">{c.instructor}</p>
        <div className="course-footer">
          <div className="course-bottom">
            <span>
              <Clock size={14} />
              {c.duration} นาที
            </span>
            <span>
              <BookOpen size={14} />
              {c.lessons.length} บทเรียน
            </span>
          </div>
          <div className="card-progress">
            <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: pct + "%" }} />
            </div>
            <small className={pct === 100 ? "completed" : ""}>
              {pct === 100 ? "เรียนจบแล้ว" : `เรียนแล้ว ${pct}%`}
            </small>
          </div>
        </div>
      </div>
    </article>
  );
}
