import type { Course, Lesson } from "./types";

export const videoCurriculum: Record<
  string,
  { points: [string, string, string]; activity: string }
> = {
  welcome: {
    points: [
      "เริ่มจากเข้าใจเป้าหมายของทีม",
      "ถามให้ชัด เมื่อมีสิ่งที่ยังไม่แน่ใจ",
      "แบ่งปันสิ่งที่เรียนรู้ให้เพื่อนร่วมงาน",
    ],
    activity: "ลองคิด: วันนี้คุณช่วยให้ทีมเข้าใจตรงกันได้อย่างไร?",
  },
  culture: {
    points: [
      "บอกเป้าหมายและข้อจำกัดให้ชัด",
      "รับฟังมุมมองที่แตกต่าง",
      "ให้ข้อเสนอแนะที่นำไปพัฒนาต่อได้",
    ],
    activity: "เลือกหนึ่งพฤติกรรมที่จะเริ่มทำกับทีมในวันนี้",
  },
  journey: {
    points: [
      "เลือกทักษะที่ใช้ได้กับงานของคุณ",
      "ตั้งเป้าหมายเล็ก ๆ ที่วัดผลได้",
      "จัดเวลาเรียนและนัดทบทวนผล",
    ],
    activity: "เขียนเป้าหมายหนึ่งข้อ พร้อมวันที่จะทบทวน",
  },
  organize: {
    points: [
      "รวบรวมรายการงานไว้ในที่เดียว",
      "แยกงานเป็นขั้นตอนที่ลงมือทำได้",
      "กำหนดเจ้าของงานและวันส่ง",
    ],
    activity: "เลือกงานวันนี้ แล้วระบุขั้นตอนแรกที่จะทำ",
  },
  collaborate: {
    points: [
      "ใช้เอกสารกลางเพื่อลดไฟล์ซ้ำ",
      "ตั้งชื่อไฟล์ให้ทีมค้นหาได้ง่าย",
      "ให้สิทธิ์เข้าถึงตามความจำเป็น",
    ],
    activity: "ตรวจเอกสารหนึ่งไฟล์: ใครควรดูหรือแก้ไขได้?",
  },
  focus: {
    points: [
      "เลือกงานสำคัญก่อนเริ่มวัน",
      "กันช่วงเวลาและลดการแจ้งเตือน",
      "รวมงานคล้ายกันไว้ทำในช่วงเดียว",
    ],
    activity: "กำหนดช่วงเวลาโฟกัสสำหรับงานสำคัญหนึ่งงาน",
  },
  phishing: {
    points: [
      "ตรวจชื่อผู้ส่งและโดเมนให้ครบ",
      "ระวังข้อความเร่งด่วนที่ขอข้อมูลลับ",
      "ยืนยันกับทีม IT ผ่านช่องทางที่รู้จัก",
    ],
    activity: "ก่อนคลิกลิงก์ครั้งต่อไป ให้หยุดตรวจผู้ส่งก่อน",
  },
  password: {
    points: [
      "ใช้รหัสผ่านที่ไม่ซ้ำกับบัญชีอื่น",
      "เปิดการยืนยันตัวตนหลายขั้นตอน",
      "ไม่แบ่งปันรหัสผ่านหรือรหัส OTP",
    ],
    activity: "ตรวจว่าบัญชีงานของคุณเปิดการยืนยันหลายขั้นตอนหรือยัง",
  },
  report: {
    points: [
      "หยุดสิ่งที่กำลังทำเมื่อพบความผิดปกติ",
      "เก็บรายละเอียดเพื่ออธิบายเหตุการณ์",
      "แจ้งทีม IT ผ่านช่องทางภายใน",
    ],
    activity: "หาช่องทางแจ้งเหตุของบริษัทให้พร้อมก่อนเกิดเหตุ",
  },
  listen: {
    points: [
      "ให้คู่สนทนาพูดจนจบก่อนตอบ",
      "ถามเพื่อเข้าใจ ไม่รีบสรุปเอง",
      "ทวนสิ่งที่ได้ยินก่อนเสนอความเห็น",
    ],
    activity: "ลองพูดว่า: ถ้าเข้าใจถูก คุณกำลังหมายถึง…",
  },
  feedback: {
    points: [
      "อธิบายพฤติกรรมที่สังเกตได้",
      "บอกผลกระทบโดยไม่ตัดสินตัวบุคคล",
      "ชวนกันหาแนวทางพัฒนา",
    ],
    activity: "ฝึกใช้ลำดับ: สิ่งที่เห็น → ผลกระทบ → ทางเลือก",
  },
};

export const videoCourseIds = [
  "welcome-aag",
  "digital-productivity",
  "cyber-awareness",
  "communication",
];

export function asVideoLesson(courseId: string, lesson: Lesson): Lesson {
  if (
    !videoCourseIds.includes(courseId) ||
    !videoCurriculum[lesson.id] ||
    lesson.videoUrl
  )
    return lesson;
  return {
    ...lesson,
    minutes: 1,
    videoUrl: `/videos/curriculum-${courseId}-${lesson.id}.mp4`,
    videoDurationSeconds: 60,
    content: `วิดีโอสาธิตแบบข้อความเคลื่อนไหว ไม่มีเสียง ความยาว 1 นาที\n\n${lesson.content}`,
  };
}

export function asVideoCourse(course: Course): Course {
  if (!videoCourseIds.includes(course.id)) return course;
  const lessons = course.lessons.map((lesson) =>
    asVideoLesson(course.id, lesson),
  );
  return {
    ...course,
    lessons,
    duration: lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
  };
}
