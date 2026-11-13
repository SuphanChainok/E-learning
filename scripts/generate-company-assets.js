import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const bannersDir = path.join(process.cwd(), "public/images/banners");
const logosDir = path.join(process.cwd(), "public/images/logos");

fs.mkdirSync(bannersDir, { recursive: true });
fs.mkdirSync(logosDir, { recursive: true });

// Copy banner source photos
fs.copyFileSync(
  path.join(process.cwd(), "public/images/age-team-banner.jpg"),
  path.join(bannersDir, "age-banner.jpg")
);
fs.copyFileSync(
  path.join(process.cwd(), "public/images/age-showroom-feature.jpg"),
  path.join(bannersDir, "abm-banner.jpg")
);
fs.copyFileSync(
  path.join(process.cwd(), "public/images/age-showroom-login.jpg"),
  path.join(bannersDir, "aag-banner.jpg")
);

console.log("Banners created successfully");

// Create crisp SVG logos and export to PNG
const ageSvg = `
<svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="120" rx="16" fill="transparent"/>
  <rect x="10" y="15" width="90" height="90" rx="22" fill="url(#age-grad)"/>
  <text x="55" y="72" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" text-anchor="middle" letter-spacing="0.5">AGE</text>
  <circle cx="80" cy="35" r="6" fill="#F59E0B"/>
  <text x="118" y="58" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800">AGE Group</text>
  <text x="118" y="82" fill="#059669" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.2">ASIA GREEN ENERGY PCL.</text>
  <defs>
    <linearGradient id="age-grad" x1="10" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
      <stop stop-color="#065F46"/>
      <stop offset="1" stop-color="#005B36"/>
    </linearGradient>
  </defs>
</svg>
`;

const abmSvg = `
<svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="120" rx="16" fill="transparent"/>
  <rect x="10" y="15" width="90" height="90" rx="22" fill="url(#abm-grad)"/>
  <text x="55" y="72" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" text-anchor="middle" letter-spacing="0.5">ABM</text>
  <circle cx="80" cy="35" r="6" fill="#38BDF8"/>
  <text x="118" y="58" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800">Asia Biomass</text>
  <text x="118" y="82" fill="#0284C7" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.2">ASIA BIOMASS PCL.</text>
  <defs>
    <linearGradient id="abm-grad" x1="10" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0369A1"/>
      <stop offset="1" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
</svg>
`;

const aagSvg = `
<svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="120" rx="16" fill="transparent"/>
  <rect x="10" y="15" width="90" height="90" rx="22" fill="url(#aag-grad)" stroke="#D4AF37" stroke-width="2"/>
  <text x="55" y="72" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" text-anchor="middle" letter-spacing="-0.5">AAG+</text>
  <text x="118" y="58" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="23" font-weight="800">AGE Auto Gallery</text>
  <text x="118" y="82" fill="#D97706" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1">PREMIUM AUTOMOTIVE &amp; EV</text>
  <defs>
    <linearGradient id="aag-grad" x1="10" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
      <stop stop-color="#002817"/>
      <stop offset="1" stop-color="#004b2b"/>
    </linearGradient>
  </defs>
</svg>
`;

await Promise.all([
  sharp(Buffer.from(ageSvg)).png().toFile(path.join(logosDir, "age-logo.png")),
  sharp(Buffer.from(abmSvg)).png().toFile(path.join(logosDir, "abm-logo.png")),
  sharp(Buffer.from(aagSvg)).png().toFile(path.join(logosDir, "aag-logo.png")),
]);

console.log("Logos generated successfully");

