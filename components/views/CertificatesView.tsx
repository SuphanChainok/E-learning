"use client";
import Image from "next/image";
import { Award, ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import type { PublicUser, PublicCourse, View } from "../../lib/types";
import { useCompany } from "../../lib/company-context";

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
  const { companyInfo } = useCompany();

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {companyInfo.eyebrow}
          </span>
          <h1>ทุกความสำเร็จ มีความหมาย</h1>
          <p>
            ประวัติความสำเร็จและใบประกาศนียบัตรจากหลักสูตรที่คุณเรียนจบและผ่านแบบทดสอบ ({companyInfo.shortName})
          </p>
        </div>
      </div>

      <section className="achievement-showcase">
        <div className="achievement-showcase-copy">
          <span className="eyebrow">
            <Sparkles size={13} style={{ verticalAlign: "middle" }} /> OUR
            PEOPLE & CULTURE · {companyInfo.shortName.toUpperCase()}
          </span>
          <h2>เติบโตไปด้วยกัน สร้างมาตรฐานที่เป็นเลิศ</h2>
          <p>
            ทุกหลักสูตรที่คุณผ่านการอบรมคือส่วนสำคัญในการยกระดับศักยภาพของทีมงาน
            และสร้างประสบการณ์ที่ดีที่สุดให้กับลูกค้าของ {companyInfo.name}
          </p>
        </div>
        <div className="achievement-showcase-photos">
          <div className="achievement-photo-item">
            <Image
              src={companyInfo.bannerPath || "/images/age-team-banner.jpg"}
              alt={`บรรยากาศการอบรมและพัฒนาศักยภาพทีมงาน ${companyInfo.shortName}`}
              width={260}
              height={150}
              loading="lazy"
              className="rounded-cover-img"
            />
            <span>การอบรมและพัฒนาทีมงาน</span>
          </div>
          <div className="achievement-photo-item">
            <Image
              src={companyInfo.logoPath}
              alt={`สัญลักษณ์แห่งความภูมิใจ ${companyInfo.shortName}`}
              width={260}
              height={150}
              loading="lazy"
              className="rounded-cover-img object-contain bg-white/80 p-4"
            />
            <span>มาตรฐานบริการระดับพรีเมียม</span>
          </div>
        </div>
      </section>

      {certified.length ? (
        <div className="course-grid">
          {certified.map((c) => (
            <article className="certificate-card" key={c.id}>
              <Award size={46} />
              <span>COMPLETED WITH AGE AUTO GALLERY</span>
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
          <p>เรียนให้ครบและผ่านแบบทดสอบเพื่อรับใบประกาศนียบัตรจาก AGE Group</p>
          <button className="primary" onClick={() => navigate("catalog")}>
            เริ่มเรียนรู้
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
