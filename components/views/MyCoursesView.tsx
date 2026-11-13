"use client";
import { BookOpen, Search, Leaf, ArrowUpRight } from "lucide-react";
import {
  type PublicCourse,
  type View,
  COURSE_CATEGORIES,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";
import CourseCard from "../CourseCard";

export interface MyCoursesViewProps {
  courses: PublicCourse[];
  filtered: PublicCourse[];
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  percent: (c: PublicCourse) => number;
  openCourse: (c: PublicCourse) => void;
  navigate: (v: View) => void;
}

export default function MyCoursesView({
  courses,
  filtered,
  query,
  setQuery,
  category,
  setCategory,
  percent,
  openCourse,
  navigate,
}: MyCoursesViewProps) {
  const { activeCompany } = useCompany();
  const companyCourses = courses.filter((c) => (c.company || "AGE") === activeCompany);
  const companyFiltered = filtered.filter((c) => (c.company || "AGE") === activeCompany);
  const myCourses = companyFiltered.filter((c) => percent(c) > 0);
  const totalMyCoursesCount = companyCourses.filter((c) => percent(c) > 0).length;

  // Derive categories dynamically from the active company's actual courses
  const companyCategories = [
    "ทั้งหมด",
    ...Array.from(
      new Set(companyCourses.map((c) => c.category).filter(Boolean)),
    ),
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL JOURNEY</span>
          <h1>เส้นทางการเรียนรู้ของฉัน</h1>
          <p>กลับมาเรียนต่อ และติดตามทุกก้าวของคุณ</p>
        </div>
      </div>
      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <h2>
              คอร์สของฉัน
              <span className="count">{totalMyCoursesCount}</span>
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
          {companyCategories.map((c) => (
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
          {myCourses.map((c, index) => (
            <CourseCard
              key={c.id}
              course={c}
              percent={percent}
              openCourse={openCourse}
              priority={index <= 2}
            />
          ))}
        </div>
        {!myCourses.length && (
          <div className="empty">
            <BookOpen size={35} />
            <h3>ยังไม่มีคอร์สที่เริ่มเรียน</h3>
            <button
              className="secondary"
              onClick={() => {
                setCategory("ทั้งหมด");
                setQuery("");
                navigate("catalog");
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

