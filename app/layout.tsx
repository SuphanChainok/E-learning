import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AAG+ Learning | เติบโตไปด้วยกัน",
  description: "พื้นที่เรียนรู้และพัฒนาทักษะสำหรับพนักงาน AAG+",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
