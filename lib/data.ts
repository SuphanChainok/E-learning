import type { Course, PublicCourse } from "./types";
import { demoVideoCourse } from "./demo-video-course.ts";
import { asVideoCourse } from "./video-curriculum.ts";
const sourceCourses: Course[] = [
  demoVideoCourse,
  {
    id: "welcome-aag",
    title: "ก้าวแรกสู่การเป็นส่วนหนึ่งของ AAG+",
    subtitle: "Your journey starts here",
    category: "องค์กรและวัฒนธรรม",
    description:
      "รู้จักตัวตน วิสัยทัศน์ และวิธีการทำงานร่วมกันของเรา พร้อมเริ่มต้นเส้นทางใหม่อย่างมั่นใจ",
    instructor: "ทีม People & Culture",
    duration: 45,
    color: "mint",
    icon: "spark",
    level: "เริ่มต้น",
    lessons: [
      {
        id: "welcome",
        title: "ยินดีต้อนรับสู่ AAG+",
        minutes: 10,
        content:
          "AAG+ Learning เป็นพื้นที่พัฒนาทักษะร่วมกันของทุกคน เริ่มจากการทำความเข้าใจเป้าหมายของทีม สอบถามเมื่อไม่แน่ใจ และแบ่งปันสิ่งที่ได้เรียนรู้กับเพื่อนร่วมงาน\n\nเนื้อหานี้เป็นตัวอย่างสำหรับพัฒนาระบบ กรุณาให้ทีม HR ปรับข้อมูลบริษัทก่อนใช้งานจริง",
      },
      {
        id: "culture",
        title: "วัฒนธรรมการทำงานร่วมกัน",
        minutes: 15,
        content:
          "การทำงานร่วมกันเริ่มจากความไว้วางใจ สื่อสารเป้าหมายและข้อจำกัดให้ชัดเจน รับฟังความคิดเห็นที่แตกต่าง และให้ข้อเสนอแนะที่ช่วยให้อีกฝ่ายพัฒนาต่อได้\n\nลองเขียนหนึ่งสิ่งที่คุณจะทำเพื่อช่วยให้ทีมทำงานร่วมกันได้ดีขึ้น",
      },
      {
        id: "journey",
        title: "วางแผนการเรียนรู้ของคุณ",
        minutes: 20,
        content:
          "เลือกทักษะที่สัมพันธ์กับงาน ตั้งเป้าหมายเล็ก ๆ ที่วัดผลได้ และจัดเวลาเรียนอย่างสม่ำเสมอ\n\nกิจกรรม: กำหนดเป้าหมายการพัฒนาหนึ่งข้อ พร้อมวันทบทวนผลกับหัวหน้าทีม",
      },
    ],
    quiz: {
      question: "วิธีใดช่วยพัฒนาการทำงานร่วมกันได้ดีที่สุด?",
      options: [
        "เก็บความรู้ไว้คนเดียว",
        "สื่อสารเป้าหมายและรับฟังผู้อื่น",
        "รอให้เกิดปัญหาก่อนจึงพูดคุย",
      ],
      answer: 1,
    },
  },
  {
    id: "digital-productivity",
    title: "ทำงานให้คล่อง ด้วยเครื่องมือดิจิทัล",
    subtitle: "Work smarter, every day",
    category: "ทักษะดิจิทัล",
    description:
      "จัดระเบียบงาน สื่อสารกับทีม และใช้เครื่องมือดิจิทัลให้เกิดประโยชน์ในทุกวัน",
    instructor: "ทีม Digital Transformation",
    duration: 60,
    color: "peach",
    icon: "digital",
    level: "เริ่มต้น",
    lessons: [
      {
        id: "organize",
        title: "จัดระเบียบงานให้เป็นระบบ",
        minutes: 20,
        content:
          "รวบรวมงานในที่เดียว แบ่งงานเป็นขั้นตอน และระบุผู้รับผิดชอบกับกำหนดส่งอย่างชัดเจน ทบทวนลำดับความสำคัญทุกวันก่อนเริ่มงาน",
      },
      {
        id: "collaborate",
        title: "ทำงานร่วมกันบนคลาวด์",
        minutes: 20,
        content:
          "ใช้เอกสารร่วมกันเพื่อลดไฟล์ซ้ำซ้อน ตั้งชื่อไฟล์ให้อ่านเข้าใจได้ง่าย และแบ่งปันสิทธิ์เข้าถึงตามความจำเป็น",
      },
      {
        id: "focus",
        title: "สร้างเวลาสำหรับงานสำคัญ",
        minutes: 20,
        content:
          "กำหนดช่วงเวลาโฟกัส ปิดการแจ้งเตือนที่ไม่จำเป็น และรวบรวมงานประเภทเดียวกันไว้ทำในช่วงเดียวกัน",
      },
    ],
    quiz: {
      question: "การจัดการไฟล์ร่วมกันที่เหมาะสมคือข้อใด?",
      options: [
        "ส่งสำเนาใหม่ทุกครั้ง",
        "เปิดสิทธิ์ให้ทุกคนแก้ไขเสมอ",
        "ใช้เอกสารกลางและกำหนดสิทธิ์ตามหน้าที่",
      ],
      answer: 2,
    },
  },
  {
    id: "cyber-awareness",
    title: "Cybersecurity ใกล้ตัวกว่าที่คิด",
    subtitle: "Think before you click",
    category: "ความปลอดภัย",
    description:
      "รู้ทันอีเมลหลอกลวง ปกป้องข้อมูลสำคัญ และสร้างพฤติกรรมการใช้งานที่ปลอดภัย",
    instructor: "ทีม IT Security",
    duration: 40,
    color: "lavender",
    icon: "shield",
    level: "ทุกระดับ",
    lessons: [
      {
        id: "phishing",
        title: "สังเกตสัญญาณอีเมลหลอกลวง",
        minutes: 15,
        content:
          "ตรวจสอบผู้ส่งและโดเมนก่อนคลิกลิงก์ ระวังข้อความเร่งด่วนที่ขอรหัสผ่านหรือข้อมูลสำคัญ หากสงสัยให้ติดต่อทีม IT ผ่านช่องทางที่รู้จัก",
      },
      {
        id: "password",
        title: "ดูแลบัญชีและรหัสผ่าน",
        minutes: 15,
        content:
          "ใช้รหัสผ่านที่ไม่ซ้ำกัน เปิดการยืนยันตัวตนหลายขั้นตอน และไม่แบ่งปันรหัสผ่านหรือรหัส OTP ให้บุคคลอื่น",
      },
      {
        id: "report",
        title: "เมื่อพบเหตุการณ์ผิดปกติ",
        minutes: 10,
        content:
          "หยุดการดำเนินการที่น่าสงสัย เก็บรายละเอียดที่เกี่ยวข้อง และแจ้งทีม IT ตามช่องทางภายในของบริษัทโดยเร็ว",
      },
    ],
    quiz: {
      question: "เมื่อได้รับอีเมลขอรหัส OTP ควรทำอย่างไร?",
      options: [
        "ส่งให้ทันที",
        "ตรวจสอบผ่านช่องทางที่เชื่อถือได้และแจ้ง IT",
        "ส่งต่อให้ทุกคน",
      ],
      answer: 1,
    },
  },
  {
    id: "communication",
    title: "สื่อสารอย่างเข้าใจ ทำงานอย่างเข้าทีม",
    subtitle: "Better conversations, better teams",
    category: "พัฒนาตนเอง",
    description:
      "ฝึกฟังอย่างตั้งใจ สื่อสารให้ตรงประเด็น และให้ feedback ที่สร้างการเปลี่ยนแปลง",
    instructor: "ทีม Learning & Development",
    duration: 50,
    color: "blue",
    icon: "people",
    level: "ทุกระดับ",
    lessons: [
      {
        id: "listen",
        title: "การฟังอย่างตั้งใจ",
        minutes: 25,
        content:
          "ให้เวลาคู่สนทนาพูดจนจบ ถามเพื่อทำความเข้าใจ และทวนสิ่งที่ได้ยินก่อนเสนอความคิดเห็นของตนเอง",
      },
      {
        id: "feedback",
        title: "ให้ feedback อย่างสร้างสรรค์",
        minutes: 25,
        content:
          "อธิบายพฤติกรรมที่สังเกตได้ ผลกระทบที่เกิดขึ้น และชวนกันหาแนวทางพัฒนา หลีกเลี่ยงการตัดสินตัวบุคคล",
      },
    ],
    quiz: {
      question: "feedback ที่มีประโยชน์ควรเน้นสิ่งใด?",
      options: [
        "พฤติกรรมและแนวทางพัฒนา",
        "การตำหนิตัวบุคคล",
        "การเปรียบเทียบกับเพื่อน",
      ],
      answer: 0,
    },
  },
];
export const courses: Course[] = sourceCourses.map(asVideoCourse);
export function publicCourse(course: Course): PublicCourse {
  const { quiz, ...rest } = course;
  return { ...rest, quiz: { question: quiz.question, options: quiz.options } };
}
