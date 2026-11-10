"use client";
import { Award, ArrowUpRight, ArrowRight } from "lucide-react";
import type { PublicUser, PublicCourse, View } from "../../lib/types";

export interface CertificatesViewProps {
  user: PublicUser;
  certified: PublicCourse[];
  setCertificate: (course: PublicCourse | null) => void;
  navigate: (v: View) => void;
}

export default function CertificatesView({
  user,
  certified,
  setCertificate,
  navigate,
}: CertificatesViewProps) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CELEBRATE YOUR GROWTH</span>
          <h1>ทุกความสำเร็จ มีความหมาย</h1>
          <p>ใบประกาศนียบัตรจากคอร์สที่คุณเรียนจบและผ่านแบบทดสอบ</p>
        </div>
      </div>
      {certified.length ? (
        <div className="course-grid">
          {certified.map((c) => (
            <article className="certificate-card" key={c.id}>
              <Award size={46} />
              <span>COMPLETED WITH AAG+</span>
              <h2>{c.title}</h2>
              <p>{user.name}</p>
              <button className="secondary" onClick={() => setCertificate(c)}>
                ดูใบประกาศนียบัตร
                <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Award size={42} />
          <h2>ความสำเร็จครั้งต่อไป รอคุณอยู่</h2>
          <p>เรียนให้ครบและผ่านแบบทดสอบเพื่อรับใบประกาศนียบัตร</p>
          <button className="primary" onClick={() => navigate("catalog")}>
            เริ่มเรียนรู้
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}

