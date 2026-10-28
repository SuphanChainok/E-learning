# AAG+ Learning

เว็บ E-learning ภาษาไทย: Next.js App Router + React + MongoDB Node.js driver ใช้ Node.js 20.9+ (แนะนำ Node.js 22 หรือ 24 LTS)

## ลองระบบสาธิต

```powershell
npm install
npm run dev
```

เปิด http://127.0.0.1:3000 ระบบ development ที่ไม่ได้ตั้ง `MONGODB_URI` จะเป็นโหมดสาธิตโดยอัตโนมัติ

| บัญชี    | อีเมล            | รหัสผ่าน    |
| -------- | ---------------- | ----------- |
| ผู้เรียน | learner@aag.demo | Learn@12345 |
| ผู้ดูแล  | admin@aag.demo   | Admin@12345 |

ข้อมูลสาธิตเก็บในหน่วยความจำของ process และรีเซ็ตเมื่อรีสตาร์ตหรือ hot reload บางกรณี ใช้สำหรับทดลองเท่านั้น ห้ามใส่ข้อมูลจริง เมื่อ MongoDB ติดต่อไม่ได้ชั่วคราว ระบบจะสลับเป็นข้อมูลสาธิตในหน่วยความจำ พร้อมแสดงคำเตือนและไม่อ้างว่าข้อมูลบันทึกถาวร การ fallback ไม่ใช้ทดแทนการแก้การตั้งค่า/การเชื่อมต่อฐานข้อมูลจริง โหมด production ควรตั้ง MongoDB และ secret จริง; หากตั้งใจสาธิตใน production ให้กำหนด `DEMO_MODE=true` อย่างชัดเจน

## ใช้ฐานข้อมูลจริง

1. เตรียม MongoDB ภายใน หรือ MongoDB Atlas พร้อม database user และสิทธิ์เครือข่ายของเซิร์ฟเวอร์
2. คัดลอก `.env.example` เป็น `.env.local` (ไฟล์ `.env.local` ไม่ควร commit)
3. กำหนด `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET` แบบสุ่มอย่างน้อย 32 ตัวอักษร, `ADMIN_EMAIL`, `ADMIN_PASSWORD` อย่างน้อย 12 ตัวอักษร และ `DEMO_MODE=false` อย่าส่ง URI ที่มีรหัสผ่านผ่านแชตหรือ commit ลง Git
4. รัน `npm run seed` เพื่อสร้าง indexes, บัญชีผู้ดูแล และคอร์สตัวอย่าง (ไม่เขียนทับข้อมูลเดิม) หาก collection คอร์สว่าง ระบบจะเพิ่มคอร์สตัวอย่างจาก `lib/data.ts` ให้อัตโนมัติเมื่อมีการเรียกดูรายการคอร์ส
5. รัน `npm run dev` แล้วเข้าสู่ระบบด้วยบัญชีที่ตั้งไว้

### แก้ปัญหาเชื่อมต่อฐานข้อมูล

- ตรวจว่ามี `.env.local` อยู่ที่ root ของโปรเจกต์และมี `MONGODB_URI`, `MONGODB_DB` กับ `SESSION_SECRET` กำหนดไว้ โดยอย่าแสดงหรือส่งค่า `MONGODB_URI`/secret ใน log หรือแชต
- MongoDB ในเครื่อง: ตรวจว่า service ทำงานและ URI เช่น `mongodb://127.0.0.1:27017` เข้าถึงได้จาก process ของ Next.js
- MongoDB Atlas: ตรวจ database user/password, Network Access allowlist และการเข้าถึง DNS/เครือข่ายจากเครื่องที่รันเว็บ; encode อักขระพิเศษใน password ของ URI ให้ถูกต้อง
- หลังแก้ environment variables หรือเปิด MongoDB แล้ว ให้หยุดและเริ่ม `npm run dev` ใหม่ การเชื่อมต่อที่ล้มเหลวจะเปลี่ยน process ปัจจุบันไปใช้ข้อมูลสาธิตชั่วคราวจนกว่าจะเริ่ม process ใหม่
- หากขึ้นป้าย `TEMP DEMO` ให้ถือว่าความคืบหน้า/การแก้ไขข้อมูลอยู่ในหน่วยความจำและไม่ถาวร ตรวจ log ฝั่งเซิร์ฟเวอร์เพื่อดูชนิดข้อผิดพลาด MongoDB โดยไม่บันทึก URI หรือข้อมูลรับรอง
- การไม่มี `MONGODB_URI` ใน production หรือข้อมูลรับรอง/รูปแบบ URI ไม่ถูกต้องจะแสดงข้อผิดพลาดการตั้งค่าแทนการเปิดบัญชีสาธิตโดยอัตโนมัติ หากตั้งใจใช้ demo ใน production ให้เปิด `DEMO_MODE=true` อย่างชัดเจน

```powershell
# สร้างค่า secret แล้วนำผลไปใส่ใน .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run seed
npm test
npm run build
npm start
```

## สิ่งที่ทำได้

- สมัครสมาชิก / เข้าสู่ระบบ / ออกจากระบบ พร้อม HttpOnly session cookie อายุ 7 วัน และรหัสผ่าน hash ด้วย scrypt
- หน้าภาพรวม แสดงคอร์สที่กำลังเรียน คอร์สที่ผ่าน และเวลาจากบทเรียนที่ทำเครื่องหมายว่าจบ
- ค้นหาคอร์ส กรองหมวดหมู่ อ่านบทเรียน และดูวิดีโอ MP4 ผ่าน URL HTTPS ที่ตั้งค่า
- บันทึกความคืบหน้าแยกตามผู้เรียน รวมตำแหน่งวิดีโอสำหรับดูต่อ และปลดล็อกบทเรียนวิดีโอเมื่อดูถึง 100% ที่เซิร์ฟเวอร์คำนวณ
- ใบประกาศนียบัตรเมื่อผ่านแบบทดสอบ พิมพ์หรือบันทึก PDF ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์
- ผู้ดูแลสร้าง แก้ไข ลบคอร์ส/บทเรียน/แบบทดสอบ ดูรายงานผู้เรียน และส่งออก CSV
- รองรับหน้าจอมือถือ แยกสิทธิ์ admin/learner ที่ API และตรวจ Origin สำหรับคำขอแก้ไขข้อมูล

## โครงสร้าง

- `app/ui.tsx`, `app/globals.css`: frontend
- `app/api/[...path]/route.ts`: Next.js backend API
- `lib/store.ts`: MongoDB และตัวเก็บข้อมูลสาธิต
- `lib/security.ts`: password, session, validation
- `lib/data.ts`: เนื้อหาตัวอย่าง
- `scripts/seed.ts`: ตั้งค่าฐานข้อมูลเริ่มต้น
- `tests/security.test.ts`: ตรวจ password, session, quiz answer isolation และ input validation

Collections: users (email unique), courses (id unique), progress (userId + courseId unique), video_progress (userId + courseId + lessonId unique), attempts (TTL 15 นาทีสำหรับจำกัดการลองเข้าสู่ระบบ 10 ครั้งต่ออีเมล)

API: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`; GET `/api/auth/session`, `/api/courses`, `/api/progress`; POST `/api/progress`, `/api/quiz`; admin: GET/POST/PUT `/api/admin/courses`, DELETE `/api/admin/courses/:id`, GET `/api/admin/report`

### ติดตามวิดีโอ

บทเรียนที่มีวิดีโอต้องกำหนดความยาวจริงเป็นวินาทีในหน้าจัดการคอร์ส ส่วน `video_progress` จัดเก็บ `userId`, `courseId`, `lessonId`, `currentTime`, `maxWatchedTime`, `completed`, `updatedAt` และ `revision` แยกต่อบทเรียน เมื่อเล่นวิดีโอ frontend ส่ง `currentTime` ทุก 5 วินาที และเมื่อ pause, ended, ซ่อนแท็บ หรือออกจากหน้า; ตำแหน่งล่าสุดใช้สำหรับ resume และ `maxWatchedTime` ใช้คิดเกณฑ์ 100%

`POST /api/progress` รับ `{ courseId, lessonId, currentTime }` สำหรับวิดีโอ เซิร์ฟเวอร์ใช้ความยาวที่ผู้ดูแลกำหนด จำกัดการเพิ่มตำแหน่งสูงสุดต่อช่วงเวลา และคำนวณ `completed` เอง การส่ง `lessonId` เพื่อทำเครื่องหมายบทเรียนที่มีวิดีโอจะถูกปฏิเสธจนกว่าจะผ่านเกณฑ์ ส่วนบทเรียนที่ไม่มีวิดีโอยังคงรองรับวิธีเดิม

ข้อจำกัด: HTML5 video ส่ง event จากอุปกรณ์ผู้เรียน จึงไม่สามารถพิสูจน์ได้แน่นอนว่ามีการรับชมจริง การจำกัดการกระโดดตำแหน่งเป็นเพียงมาตรการลดการกรอข้าม ไม่ใช่หลักฐานป้องกันการโกงสำหรับการสอบหรือการรับรองที่มีความเสี่ยงสูง ควรใช้ผู้ให้บริการวิดีโอที่มี signed playback session/telemetry ฝั่งเซิร์ฟเวอร์เมื่อต้องการการยืนยันที่เข้มงวด

## Deploy

Deploy ไปยัง Vercel หรือ Node.js hosting ที่เข้าถึง MongoDB ได้ กำหนด environment variables ผ่านระบบ secrets ของผู้ให้บริการ แล้ว build/start ตาม scripts ข้างต้น ใช้ HTTPS และ `DEMO_MODE=false` รัน seed จากเครื่องที่เข้าถึงฐานข้อมูลได้ก่อนเริ่มใช้งาน URL preview ภายในเครื่องไม่ใช่เว็บที่เผยแพร่แล้ว โครงการนี้ยังไม่ได้ deploy สู่ภายนอก

## ขอบเขตเวอร์ชันนี้

- ชื่อแบรนด์และคอร์สเป็นตัวอย่างสำหรับ AAG+ ต้องให้บริษัทตรวจเนื้อหา สี โลโก้ และนโยบายก่อนใช้จริง
- วิดีโอใส่เป็นลิงก์โดย admin ยังไม่มีระบบ upload หรือ transcoding และต้องใช้ URL ที่ผู้เรียนมีสิทธิ์เปิด
- บทเรียนไม่มีวิดีโอยังคงกดยืนยันว่าเรียนจบได้ ส่วนบทเรียนวิดีโอต้องมีตำแหน่งรับชมสูงสุดอย่างน้อย 100%; แบบทดสอบมี 1 คำถาม/คอร์ส และยังไม่มีระบบคุมสอบ
- ทุกบัญชีใหม่เป็น learner การสร้าง admin ใช้ seed ผ่านผู้ดูแลเซิร์ฟเวอร์ การสมัครปัจจุบันเปิดให้ทุกอีเมล ยังไม่มี approval, email verification, reset password หรือ SSO
- หากเปลี่ยนบทเรียนหรือแบบทดสอบในคอร์สเดิม ความคืบหน้า/ผลผ่านเดิมยังอยู่ ควรสร้างคอร์สใหม่สำหรับหลักสูตรรุ่นใหม่
- ใบประกาศเป็นเอกสารที่สร้างจากผลเรียน ยังไม่มีลายเซ็นดิจิทัลหรือหน้าตรวจสอบสาธารณะ
- รายงานเป็นสถานะปัจจุบัน ไม่ใช่ audit log; เวลาที่แสดงเป็นผลรวมระยะเวลาบทเรียนที่ยืนยันจบ ไม่ใช่เวลาจับจริง
- ฟอนต์ Google Fonts ต้องใช้อินเทอร์เน็ต หากโหลดไม่ได้จะใช้ฟอนต์สำรอง
- ก่อนเปิดใช้จริงควรเพิ่มนโยบายเข้าถึงพนักงาน, reset/SSO, distributed rate limit ตาม IP, backup, monitoring และตรวจนโยบายข้อมูลของบริษัท

## ทดลองบทเรียนวิดีโอ

เปิดคอร์ส **ทดลองเรียนด้วยวิดีโอ · 30 วินาที** ในหน้าคอร์สเรียน คลิปสาธิตแบบไม่มีเสียงอยู่ใน `public/videos/learning-demo.mp4` และแสดงเวลารับชม เปอร์เซ็นต์ สถานะการบันทึก และสถานะเรียนสำเร็จใต้คลิป

สำหรับฐานข้อมูลที่มีคอร์สเดิมอยู่แล้ว เพิ่มเฉพาะคอร์สสาธิตโดยไม่เขียนทับคอร์สเดิม:

```powershell
node --env-file=.env.local --import tsx scripts/seed-demo-video.ts
```

คอร์สสาธิตนี้ใช้ทดสอบการทำงานของระบบ ส่วนเนื้อหาจริงให้ผู้ดูแลเพิ่มลิงก์ไฟล์ MP4/WebM ในบทเรียนพร้อมระยะเวลาที่ตรงกับไฟล์ วิดีโอภายในโปรเจกต์ใช้พาธ `/videos/ชื่อไฟล์.mp4` ได้ ลิงก์หน้า YouTube ไม่ใช่ลิงก์ไฟล์วิดีโอโดยตรง

## เอกสารอ้างอิง

- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/connect/)

## TypeScript

โค้ด frontend ใช้ `.tsx` และ backend, scripts, tests, config ใช้ `.ts` เปิด strict type checking และไม่อนุญาต JavaScript source

```powershell
npm run typecheck
npm test
npm run build
# เปิด demo server ก่อนทดสอบ API
npm run test:api
```
