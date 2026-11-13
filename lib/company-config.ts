export type Company = "ABM" | "AGE" | "AAG+";

export const COMPANIES: Company[] = ["AGE", "ABM", "AAG+"];

export interface CompanyConfig {
  id: Company;
  name: string; // ชื่อบริษัททางการ
  shortName: string; // ชื่อเรียกสั้น
  badge: string; // ป้ายย่อ เช่น AGE, ABM, AAG+
  shortDesc: string; // คำอธิบายย่อ
  fullDesc: string; // คำอธิบายเต็ม
  logoPath: string; // path โลโก้
  bannerPath: string; // path แบนเนอร์
  themeColor: "emerald" | "teal" | "blue" | "gray"; // สีธีม
  primaryColor: string; // HEX สีหลัก
  tagline: string;
  eyebrow: string;
  headerLogoText: string;
  headerSubtitle: string;
  description: string; // compatibility with existing CompanyInfo
  fullName: string; // compatibility with existing CompanyInfo
}

export const COMPANIES_CONFIG: Record<Company, CompanyConfig> = {
  AGE: {
    id: "AGE",
    name: "บริษัท เอเชีย กรีน เอนเนอจี จำกัด (มหาชน)",
    shortName: "AGE Group",
    badge: "AGE",
    fullName: "บริษัท เอเชีย กรีน เอนเนอจี จำกัด (มหาชน)",
    shortDesc: "ผู้นำธุรกิจพลังงานครบวงจร โลจิสติกส์ พลังงานทดแทน และยานยนต์ไฟฟ้า",
    fullDesc:
      "ดำเนินธุรกิจจัดจำหน่ายถ่านหินสะอาด, ให้บริการโลจิสติกส์ครบวงจร, ผลิตและจำหน่ายพลังงานยั่งยืน (RDF/ชีวมวล) และการลงทุนในยานยนต์ไฟฟ้า",
    description: "ผู้นำธุรกิจพลังงานครบวงจร โลจิสติกส์ พลังงานทดแทน และยานยนต์ไฟฟ้า",
    logoPath: "/images/logos/age-logo.png",
    bannerPath: "/images/banners/age-banner.jpg",
    themeColor: "emerald",
    primaryColor: "#005B36",
    tagline: "A LITTLE LEARNING. A BIG DIFFERENCE.",
    eyebrow: "ASIA GREEN ENERGY (AGE) · LEARNING SPACE",
    headerLogoText: "AGE Group",
    headerSubtitle: "AGE GROUP · ACADEMY",
  },
  ABM: {
    id: "ABM",
    name: "บริษัท เอเชีย ไบโอแมส จำกัด (มหาชน)",
    shortName: "Asia Biomass",
    badge: "ABM",
    fullName: "บริษัท เอเชีย ไบโอแมส จำกัด (มหาชน)",
    shortDesc: "ผู้เชี่ยวชาญด้านการจัดหาและจัดจำหน่าย เชื้อเพลิงชีวมวลชั้นนำของประเทศไทย",
    fullDesc:
      "จัดจำหน่ายกะลาปาล์ม, ไม้สับ, ขี้เลื่อย, ชีวมวลอัดแท่ง และบริการจัดส่งเชื้อเพลิงให้กับโรงงานอุตสาหกรรมและโรงไฟฟ้าชีวมวล",
    description: "ผู้เชี่ยวชาญด้านการจัดหาและจัดจำหน่าย เชื้อเพลิงชีวมวลชั้นนำของประเทศไทย",
    logoPath: "/images/logos/abm-logo.png",
    bannerPath: "/images/banners/abm-banner.jpg",
    themeColor: "blue",
    primaryColor: "#0284C7",
    tagline: "LEADER IN BIOMASS & GREEN POWER",
    eyebrow: "ASIA BIOMASS (ABM) · LEARNING SPACE",
    headerLogoText: "Asia Biomass",
    headerSubtitle: "ABM · BIOMASS ACADEMY",
  },
  "AAG+": {
    id: "AAG+",
    name: "บริษัท เอจีอี ออโต้ แกลเลอรี่ จำกัด",
    shortName: "AGE Auto Gallery",
    badge: "AAG+",
    fullName: "บริษัท เอจีอี ออโต้ แกลเลอรี่ จำกัด",
    shortDesc: "กลุ่มธุรกิจค้าปลีกและบริการด้านยานยนต์ เน้นตลาดยานยนต์ไฟฟ้า (EV) และไฮบริด",
    fullDesc:
      "ตัวแทนจำหน่ายและศูนย์บริการพรีเมียมแบรนด์ ZEEKR, OMODA & JAECOO / CHERY และ Mitsubishi Motors อย่างเป็นทางการ",
    description: "กลุ่มธุรกิจค้าปลีกและบริการด้านยานยนต์ เน้นตลาดยานยนต์ไฟฟ้า (EV) และไฮบริด",
    logoPath: "/images/logos/aag-logo.png",
    bannerPath: "/images/banners/aag-banner.jpg",
    themeColor: "gray",
    primaryColor: "#004b2b",
    tagline: "EXCELLENCE IN AUTOMOTIVE & SERVICE",
    eyebrow: "AGE AUTO GALLERY (AAG+) · LEARNING SPACE",
    headerLogoText: "AGE Auto Gallery",
    headerSubtitle: "AAG+ · AUTO GALLERY ACADEMY",
  },
};

