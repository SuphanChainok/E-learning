"use client";
import { BookOpen, Search, Leaf, ArrowUpRight } from "lucide-react";
import { type PublicCourse, COURSE_CATEGORIES } from "../../lib/types";
import CourseCard from "../CourseCard";

export interface CatalogViewProps {
  courses: PublicCourse[];
  filtered: PublicCourse[];
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  percent: (c: PublicCourse) => number;
  openCourse: (c: PublicCourse) => void;
}

export default function CatalogView({
  courses,
  filtered,
  query,
  setQuery,
  category,
  setCategory,
  percent,
  openCourse,
}: CatalogViewProps) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPLORE. LEARN. GROW.</span>
          <h1>ค้นพบทักษะใหม่ที่ใช่คุณ</h1>
          <p>เลือกเติมความรู้ให้ตรงกับเป้าหมายของคุณ</p>
        </div>
      </div>
      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <h2>
              คอร์สเรียนทั้งหมด
              <span className="count">{courses.length}</span>
            </h2>
          </div>
          <label className="search">
            <Search size={17} />
            <input
              aria-label="ค้นหาคอร์ส"
              placeholder="ค้นหาคอร์สเรียน…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="filters">
          {COURSE_CATEGORIES.map((c) => (
            <button
              className={category === c ? "selected" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="course-grid">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              percent={percent}
              openCourse={openCourse}
            />
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <BookOpen size={35} />
            <h3>ไม่พบคอร์สที่ตรงกับการค้นหา</h3>
            <button
              className="secondary"
              onClick={() => {
                setCategory("ทั้งหมด");
                setQuery("");
              }}
            >
              สำรวจคอร์สทั้งหมด
            </button>
          </div>
        )}
      </section>
      <div className="bottom-banner">
        <span className="banner-icon">
          <Leaf />
        </span>
        <div>
          <b>การเรียนรู้ไม่มีเส้นชัย มีแต่ก้าวต่อไป</b>
          <p>เลือกเรียนวันละนิด แล้วคุณจะเห็นการเปลี่ยนแปลง</p>
        </div>
        <span>
          GROW AT YOUR OWN PACE <ArrowUpRight size={18} />
        </span>
      </div>
    </>
  );
}

