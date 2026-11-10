"use client";
import {
  BookOpen,
  ArrowUpRight,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  Monitor,
} from "lucide-react";
import type { PublicCourse } from "../lib/types";

const icons = {
  spark: Sparkles,
  digital: Monitor,
  shield: ShieldCheck,
  people: Users,
};

export interface CourseCardProps {
  course: PublicCourse;
  percent: (c: PublicCourse) => number;
  openCourse: (c: PublicCourse) => void;
}

export default function CourseCard({
  course: c,
  percent,
  openCourse,
}: CourseCardProps) {
  const Icon = icons[c.icon] || BookOpen;
  const pct = percent(c);

  return (
    <article className="course-card">
      <button
        className={"course-art " + c.color}
        onClick={() => openCourse(c)}
        aria-label={"เปิดคอร์ส " + c.title}
      >
        <span className="art-kicker">AAG+ ACADEMY</span>
        <div className="art-orbit">
          <Icon size={55} strokeWidth={1.1} />
        </div>
        <span className="art-caption">{c.subtitle}</span>
        <span className="art-arrow">
          <ArrowUpRight size={18} />
        </span>
      </button>
      <div className="course-body">
        <div className="course-meta">
          <span>{c.category}</span>
          <span>• {c.level}</span>
        </div>
        <button className="title-button" onClick={() => openCourse(c)}>
          {c.title}
        </button>
        <p className="instructor">{c.instructor}</p>
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
        {(pct > 0 || c.lessons.some((l) => l.videoUrl)) && (
          <div className="card-progress">
            <div className="progress">
              <i style={{ width: pct + "%" }} />
            </div>
            <small>
              {pct === 100 ? "เรียนสำเร็จ" : "เรียนแล้ว " + pct + "%"}
              {c.lessons.some((l) => l.videoUrl) && " · บทเรียนวิดีโอ"}
            </small>
          </div>
        )}
      </div>
    </article>
  );
}

