"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  Play,
  Check,
  Clock,
  Sparkles,
  Leaf,
  Award,
} from "lucide-react";
import {
  type PublicUser,
  type PublicCourse,
  type View,
  type Company,
  COURSE_CATEGORIES,
  sortCoursesLatestFirst,
} from "../../lib/types";
import { useCompany } from "../../lib/company-context";
import CourseCard from "../CourseCard";

interface HeroSlide {
  image: string;
  alt: string;
}

const COMPANY_SLIDES: Record<Company, HeroSlide[]> = {
  AGE: [
    {
      image: "/images/banners/age-banner.jpg",
      alt: "ภาพบรรยากาศการเรียนรู้และการพัฒนาบุคลากร AGE Group",
    },
    {
      image: "/images/age-team-banner.jpg",
      alt: "ภาพทีมงานและการเติบโตขององค์กร AGE Group",
    },
    {
      image: "/images/age-showroom-feature.jpg",
      alt: "ภาพสำนักงานและโชว์รูมทันสมัย AGE Group",
    },
    {
      image: "/images/courses/age-safety.jpg",
      alt: "ภาพมาตรฐานความปลอดภัยในการปฏิบัติงาน AGE Group",
    },
    {
      image: "/images/courses/age-logistics.jpg",
      alt: "ภาพระบบโลจิสติกส์และการขนส่งครบวงจร AGE Group",
    },
  ],
  ABM: [
    {
      image: "/images/banners/abm-banner.jpg",
      alt: "ภาพโรงงานและพลังงานชีวมวลยั่งยืน Asia Biomass",
    },
    {
      image: "/images/courses/abm-biomass.jpg",
      alt: "ภาพผลิตภัณฑ์เชื้อเพลิงชีวมวล ไม้สับ กะลาปาล์ม",
    },
    {
      image: "/images/courses/abm-qc.jpg",
      alt: "ภาพมาตรฐานการควบคุมคุณภาพเชื้อเพลิง",
    },
    {
      image: "/images/age-team-banner.jpg",
      alt: "ภาพทีมงานและการเรียนรู้ Asia Biomass",
    },
  ],
  "AAG+": [
    {
      image: "/images/banners/aag-banner.jpg",
      alt: "ภาพโชว์รูมยานยนต์ไฟฟ้า ZEEKR AGE Auto Gallery",
    },
    {
      image: "/images/courses/aag-zeekr.jpg",
      alt: "ภาพรถยนต์พรีเมียม ZEEKR 009 & X",
    },
    {
      image: "/images/courses/aag-sales.jpg",
      alt: "ภาพการขายและการส่งมอบรถยนต์ระดับพรีเมียม",
    },
    {
      image: "/images/courses/aag-ev-battery.jpg",
      alt: "ภาพระบบไฟฟ้าและแบตเตอรี่รถยนต์ EV",
    },
  ],
};

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
  user: _user,
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
  const { companyInfo, activeCompany } = useCompany();

  // Sort courses with the latest created courses first
  const companyCourses = useMemo(() => {
    const list = courses.filter((c) => (c.company || "AGE") === activeCompany);
    return sortCoursesLatestFirst(list);
  }, [courses, activeCompany]);

  const companyFiltered = useMemo(() => {
    const list = filtered.filter((c) => (c.company || "AGE") === activeCompany);
    return sortCoursesLatestFirst(list);
  }, [filtered, activeCompany]);

  const featuredCourse = ongoing[0] || companyCourses[0] || null;

  // Derive categories dynamically from the active company's actual courses
  const companyCategories = [
    "ทั้งหมด",
    ...Array.from(
      new Set(companyCourses.map((c) => c.category).filter(Boolean)),
    ),
  ];

  const baseSlides = COMPANY_SLIDES[activeCompany] || COMPANY_SLIDES.AGE;
  const slides = useMemo(() => {
    if (baseSlides.some((s) => s.image === companyInfo.bannerPath)) {
      return baseSlides;
    }
    return [
      { image: companyInfo.bannerPath, alt: companyInfo.name },
      ...baseSlides,
    ];
  }, [baseSlides, companyInfo.bannerPath, companyInfo.name]);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset to first slide when active company switches
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeCompany]);

  // Auto-slide every 5 seconds (5000ms)
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, activeCompany]);

  return (
    <>
      <section className="hero hero-fullbleed relative z-10">
        <div className="hero-bg-photo overflow-hidden" aria-hidden="true">
          <div
            className="hero-slider-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((s, idx) => (
              <div key={idx} className="hero-slider-slide">
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  priority={idx === 0}
                  loading={idx === 0 ? undefined : "lazy"}
                  sizes="(max-width: 1000px) 100vw, 1400px"
                  className="hero-bg-img"
                  style={{ objectFit: "cover", objectPosition: "center 28%" }}
                />
              </div>
            ))}
          </div>
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-copy relative z-10">
          <span className="hero-label">
            <Sparkles size={13} /> {companyInfo.name}
          </span>
          <h2 className="text-3xl font-bold leading-tight md:text-5xl text-white">
            เติมทักษะให้วันนี้
            <br />
            <em className="font-normal italic">ต่อยอดโอกาสในวันหน้า.</em>
          </h2>
          <div className="hero-desc-box">
            <p className="hero-short-desc">
              <b>{companyInfo.shortDesc}</b>
            </p>
            <p className="hero-full-desc hidden sm:block">
              {companyInfo.fullDesc}
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="hero-cta-white min-h-[44px]"
              onClick={() => navigate("catalog")}
            >
              สำรวจคอร์สเรียนทั้งหมด
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="stats">
        <div>
          <span className="stat-icon">
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
          <span className="stat-icon">
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
          <span className="stat-icon">
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

      {featuredCourse && (
        <section className="showroom-spotlight">
          <div className="showroom-spotlight-media">
            <Image
              src="/images/age-showroom-feature.jpg"
              alt="มาตรฐานการบริการและองค์กร AGE Group"
              width={480}
              height={260}
              loading="lazy"
              className="rounded-cover-img"
            />
            <span className="spotlight-badge">
              <Award size={13} /> บทเรียนเด่นประจำสัปดาห์ · AGE GROUP
            </span>
          </div>
          <div className="showroom-spotlight-body">
            <span className="eyebrow">
              FEATURED LEARNING · {featuredCourse.category}
            </span>
            <h3>{featuredCourse.title}</h3>
            <p>
              {featuredCourse.description ||
                "ยกระดับทักษะการทำงาน การสื่อสาร และมาตรฐานการปฏิบัติงานแบบมืออาชีพตามแบบฉบับ AGE Group"}
            </p>
            <div className="spotlight-meta">
              <span>
                <Clock size={14} /> {featuredCourse.duration} นาที
              </span>
              <span>
                <BookOpen size={14} /> {featuredCourse.lessons.length} บทเรียน
              </span>
              <span>ผู้สอน: {featuredCourse.instructor}</span>
            </div>
            <button
              type="button"
              className="primary small-btn"
              onClick={() => openCourse(featuredCourse)}
            >
              <Play size={14} />
              เข้าเรียนหลักสูตรเด่น
            </button>
          </div>
        </section>
      )}

      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <h2>
              คอร์สแนะนำสำหรับคุณ
              <span className="count">{companyCourses.length}</span>
            </h2>
            <p className="muted">
              เติมความรู้รอบด้านสำหรับบุคลากร {companyInfo.name} พร้อมสำหรับทุกโอกาส
            </p>
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
          {companyFiltered.map((c, index) => (
            <CourseCard
              key={c.id}
              course={c}
              percent={percent}
              openCourse={openCourse}
              priority={index <= 2}
            />
          ))}
        </div>
        {!companyFiltered.length && (
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
          <b>การเรียนรู้ไม่มีเส้นชัย มีแต่ก้าวต่อไปกับ {companyInfo.shortName}</b>
          <p>เลือกเรียนวันละนิด แล้วคุณจะเห็นการเปลี่ยนแปลง</p>
        </div>
        <span>
          GROW AT YOUR OWN PACE <ArrowUpRight size={18} />
        </span>
      </div>
    </>
  );
}
