"use client";
import { Award, X } from "lucide-react";
import type { PublicUser, PublicCourse, Progress } from "../../lib/types";

export interface CertificateModalProps {
  certificate: PublicCourse | null;
  user: PublicUser;
  demo: boolean;
  pFor: (id: string) => Progress | undefined;
  onClose: () => void;
}

export default function CertificateModal({
  certificate,
  user,
  demo,
  pFor,
  onClose,
}: CertificateModalProps) {
  if (!certificate) return null;

  return (
    <div className="modal-backdrop">
      <div className="certificate-modal">
        <div className="modal-actions">
          <button className="secondary" onClick={() => window.print()}>
            พิมพ์ / บันทึก PDF
          </button>
          <button className="icon-button" aria-label="ปิด" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="certificate-paper">
          <span className="brand">
            AAG<span>+</span>
          </span>
          <Award size={65} />
          <p className="eyebrow">CERTIFICATE OF COMPLETION</p>
          <h2>ใบประกาศนียบัตร</h2>
          <p>ขอมอบให้แก่</p>
          <h1>{user.name}</h1>
          <p>เพื่อแสดงว่าได้เรียนจบและผ่านแบบทดสอบในหลักสูตร</p>
          <h2>{certificate.title}</h2>
          <p>
            {new Date(
              pFor(certificate.id)?.completedAt ?? Date.now(),
            ).toLocaleDateString("th-TH", { dateStyle: "long" })}
          </p>
          <span>AAG+ ACADEMY · LEARNING & DEVELOPMENT</span>
          {demo && <small>เอกสารตัวอย่างจากโหมดสาธิต</small>}
        </div>
      </div>
    </div>
  );
}

