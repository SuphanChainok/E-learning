import type { Course } from "./types";

export const demoVideoCourse: Course = {
  id: "video-learning-demo",
  title: "ทดลองเรียนด้วยวิดีโอ · 30 วินาที",
  subtitle: "Watch your learning grow",
  category: "ทดลองระบบวิดีโอ",
  description:
    "คลิปสาธิตการเรียนด้วยวิดีโอ ทดลองดู หยุด และกลับมาเรียนต่อ พร้อมดูเวลารับชม เปอร์เซ็นต์ และสถานะเรียนสำเร็จ",
  instructor: "AAG+ Learning",
  duration: 1,
  color: "mint",
  icon: "digital",
  level: "เริ่มต้น",
  lessons: [
    {
      id: "watch-and-learn",
      title: "เริ่มเรียนและติดตามความคืบหน้าของคุณ",
      content:
        "คลิปนี้เป็นวิดีโอสาธิตแบบไม่มีเสียง ความยาว 30 วินาที กดเล่นเพื่อทดลองระบบ\n\nระบบบันทึกความคืบหน้าเป็นระยะ เมื่อหยุดหรือออกจากบทเรียนจะบันทึกตำแหน่งล่าสุดให้กลับมาดูต่อได้ ดูครบคลิปจะแสดงสถานะเรียนสำเร็จโดยอัตโนมัติ",
      minutes: 1,
      videoUrl: "/videos/learning-demo.mp4",
      videoDurationSeconds: 30,
    },
  ],
  quiz: {
    question: "เมื่อหยุดเรียนกลางคลิป คุณสามารถทำอะไรได้?",
    options: [
      "กลับมาดูต่อจากตำแหน่งที่บันทึกไว้",
      "ต้องเริ่มใหม่ทุกครั้ง",
      "จะได้รับสถานะเรียนสำเร็จทันที",
    ],
    answer: 0,
  },
};
