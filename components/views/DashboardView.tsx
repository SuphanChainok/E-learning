"use client";
import {
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  Play,
  Check,
  Clock,
  Sparkles,
  Leaf,
} from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type View,
  COURSE_CATEGORIES,
} from "../../lib/types";
import CourseCard from "../CourseCard";

export interface DashboardViewProps {
  user: PublicUser;
  courses: PublicCourse[];
  filtered: PublicCourse[];
  ongoing: PublicCourse[];
  finished: PublicCourse[];
  minutes: number;
  category: string;
  setCategory: (cat: string) => void;
  setQuery: (q: string) => void;
  percent: (c: PublicCourse) => number;
  openCourse: (c: PublicCourse) => void;
  navigate: (v: View) => void;
}

export default function DashboardView({
  user,
  courses,
  filtered,
  ongoing,
  finished,
  minutes,
  category,
  setCategory,
  setQuery,
  percent,
  openCourse,
  navigate,
}: DashboardViewProps) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE ROOM FOR GROWTH</div>
          <h1>
            สวัสดี, {user.name.split(" ")[0]} <span className="wave">✦</span>
          </h1>
          <p>วันนี้เป็นวันที่ดี ที่จะเรียนรู้สิ่งใหม่ ๆ</p>
        </div>
        <span className="welcome-stamp">
          <span />
          เติบโตไปด้วยกันทุกวัน
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-label">
            <span /> AAG+ LEARNING EXPERIENCE
          </span>
          <h2>
            เติมทักษะให้วันนี้
            <br />
            <em>ต่อยอดโอกาสในวันหน้า.</em>
          </h2>
          <p>
            ค้นพบความรู้ที่ใช่ ในจังหวะการเรียนรู้ของคุณ
            <br />
            เพราะการเติบโตของคุณ คือการเติบโตของเรา
          </p>
          <button onClick={() => navigate("catalog")}>
            สำรวจคอร์สเรียน
            <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-leaf leaf-one" />
          <div className="art-leaf leaf-two" />
          <div className="art-leaf leaf-three" />
          <div className="hero-plus">+</div>
          <span className="hero-float">
            <Sparkles size={17} /> NEVER STOP GROWING
          </span>
          <span className="art-numeral">aag</span>
        </div>
      </section>
      <div className="stats">
        <div>
          <span className="stat-icon green">
            <BookOpen />
          </span>
          <div>
            <p>กำลังเรียน</p>
            <b>
              {ongoing.length}
              <small> คอร์ส</small>
            </b>
          </div>
          <ArrowUpRight size={16} />
        </div>
        <div>
          <span className="stat-icon orange">
            <Check />
          </span>
          <div>
            <p>เรียนสำเร็จแล้ว</p>
            <b>
              {finished.length}
              <small> คอร์ส</small>
            </b>
          </div>
          <ArrowUpRight size={16} />
        </div>
        <div>
          <span className="stat-icon violet">
            <Clock />
          </span>
          <div>
            <p>เวลาที่ใช้เรียนรู้</p>
            <b>
              {Math.floor(minutes)}
              <small> นาที</small>
            </b>
          </div>
          <span className="stat-note">KEEP IT UP ↗</span>
        </div>
      </div>
      {ongoing.length > 0 && (
        <section className="continue">
          <div>
            <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
            <h3>{ongoing[0].title}</h3>
            <div className="progress">
              <i style={{ width: percent(ongoing[0]) + "%" }} />
            </div>
          </div>
          <button className="primary" onClick={() => openCourse(ongoing[0])}>
            <Play size={16} />
            เรียนต่อ
          </button>
        </section>
      )}
      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <h2>
              คอร์สแนะนำสำหรับคุณ
              <span className="count">{courses.length}</span>
            </h2>
            <p className="muted">เติมความรู้รอบด้าน พร้อมสำหรับทุกโอกาส</p>
          </div>
          <button
            className="text-button"
            onClick={() => navigate("catalog")}
          >
            ดูคอร์สทั้งหมด
            <ArrowRight size={16} />
          </button>
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

