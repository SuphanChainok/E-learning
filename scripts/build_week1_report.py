from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import simpleSplit
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'week1-project-summary.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
FONT=Path('C:/Windows/Fonts/tahoma.ttf')
FONT_B=Path('C:/Windows/Fonts/tahomabd.ttf')
pdfmetrics.registerFont(TTFont('Thai',str(FONT)))
pdfmetrics.registerFont(TTFont('ThaiB',str(FONT_B)))
W,H=A4
INK=HexColor('#17392f'); GREEN=HexColor('#d9efb7'); MINT=HexColor('#eef5e9'); MUTED=HexColor('#61736b'); LINE=HexColor('#d9e3da'); PEACH=HexColor('#fae2d2'); PURPLE=HexColor('#e8e0fa'); BLUE=HexColor('#deedf4')
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('สรุปความคืบหน้าโครงการ AAG+ Learning')
c.setAuthor('AAG+ Learning project team')
M=48

def base(n,eyebrow,title,sub=None):
    c.setFillColor(INK); c.rect(0,H-13,W,13,fill=1,stroke=0)
    c.setFillColor(MUTED); c.setFont('ThaiB',9); c.drawString(M,H-38,eyebrow)
    c.setFillColor(INK); c.setFont('ThaiB',24); c.drawString(M,H-75,title)
    if sub: paragraph(sub,M,H-101,W-2*M,11,MUTED,leading=17)
    c.setStrokeColor(LINE); c.line(M,34,W-M,34)
    c.setFillColor(MUTED); c.setFont('Thai',8); c.drawString(M,21,'AAG+ Learning  •  สรุปความคืบหน้า  •  30 ตุลาคม 2026')
    c.drawRightString(W-M,21,f'{n} / 7')

def paragraph(text,x,y,width,size=11,color=INK,leading=18,font='Thai'):
    c.setFillColor(color); c.setFont(font,size)
    lines=simpleSplit(text,font,size,width)
    for line in lines:
        c.drawString(x,y,line); y-=leading
    return y

def card(x,y,w,h,title,body,color=MINT):
    c.setFillColor(color); c.roundRect(x,y-h,w,h,11,fill=1,stroke=0)
    c.setFillColor(INK); c.setFont('ThaiB',12); c.drawString(x+14,y-23,title)
    paragraph(body,x+14,y-45,w-28,9.5,MUTED,14)

def flow(nodes,y,width=None):
    width=width or W-2*M; gap=10; nw=(width-gap*(len(nodes)-1))/len(nodes)
    x=M
    for i,(title,body,col) in enumerate(nodes):
        c.setFillColor(col); c.roundRect(x,y-64,nw,64,9,fill=1,stroke=0)
        c.setFillColor(INK); c.setFont('ThaiB',9); c.drawCentredString(x+nw/2,y-24,title)
        c.setFillColor(MUTED); c.setFont('Thai',7.7); c.drawCentredString(x+nw/2,y-43,body)
        if i<len(nodes)-1:
            c.setStrokeColor(MUTED); c.setLineWidth(1.3); c.line(x+nw+2,y-32,x+nw+gap-2,y-32)
            c.line(x+nw+gap-6,y-28,x+nw+gap-2,y-32); c.line(x+nw+gap-6,y-36,x+nw+gap-2,y-32)
        x+=nw+gap

# Page 1
c.setFillColor(INK); c.rect(0,0,W,H,fill=1,stroke=0)
c.setFillColor(GREEN); c.roundRect(M,H-93,160,28,13,fill=1,stroke=0)
c.setFillColor(INK); c.setFont('ThaiB',10); c.drawCentredString(M+80,H-84,'AAG+ LEARNING')
c.setFillColor(white); c.setFont('ThaiB',30); c.drawString(M,H-159,'สรุปความคืบหน้า')
c.drawString(M,H-201,'สรุปโครงการ')
paragraph('ภาพรวมหน้าจอ ฟังก์ชันที่ทำงานแล้ว ขั้นตอนเรียนวิดีโอ และรายการต่อยอด',M,H-238,W-2*M,12,GREEN,19)
# illustration: learning path
flow([('สำรวจ','ค้นหาและเลือกคอร์ส',GREEN),('เรียน','ดูคลิปและบันทึก',PEACH),('ติดตาม','ดูเปอร์เซ็นต์',PURPLE),('สำเร็จ','ครบคลิปและทดสอบ',BLUE)],H-335)
c.setFillColor(HexColor('#244b3e')); c.roundRect(M,174,W-2*M,172,16,fill=1,stroke=0)
c.setFillColor(GREEN); c.setFont('ThaiB',16); c.drawString(M+22,312,'สถานะปัจจุบัน')
c.setFillColor(white); c.setFont('ThaiB',37); c.drawString(M+22,266,'ประมาณ 40%')
paragraph('ประเมินขอบเขตงานจากฟังก์ชันที่มีอยู่ ไม่ใช่ตัวเลขจากระบบติดตามงานหรือชั่วโมงที่ใช้จริง',M+22,237,W-2*M-44,10,white,15)
paragraph('ทำแล้ว: ระบบผู้เรียนและผู้ดูแล, MongoDB, คอร์สตัวอย่าง 4 หมวด, วิดีโอ 11 บท และบันทึกความคืบหน้าแยกรายบัญชี',M+22,203,W-2*M-44,9,GREEN,14)
paragraph('ณ 30 ตุลาคม 2569',M,146,W-2*M,9,HexColor('#d0ddd5'),14)
paragraph('หมายเหตุ: คลิปเป็นวิดีโอสาธิตข้อความเคลื่อนไหวแบบไม่มีเสียง เนื้อหายังต้องให้เจ้าของหลักสูตรตรวจทานก่อนใช้จริง',M,128,W-2*M,9,HexColor('#d0ddd5'),14)
c.showPage()

# Page 2: walkthrough of the user's actual web screenshots
base(2,'ภาพหน้าจอจริง 01','ภาพรวมของฉัน','หน้า Dashboard ตามภาพล่าสุดที่ส่งมา')
img=ImageReader(str(ROOT/'artifacts'/'dashboard-new.png'))
iw,ih=img.getSize(); scale=min((W-2*M)/iw,508/ih); dw,dh=iw*scale,ih*scale
c.drawImage(img,(W-dw)/2,H-126-dh,width=dw,height=dh, preserveAspectRatio=True,mask='auto')
y=H-138-dh
card(M,y,W-2*M,57,'เมนูหลัก','ภาพรวมของฉัน • สำรวจคอร์สเรียน • การเรียนรู้ของฉัน • ใบประกาศนียบัตร',MINT)
card(M,y-65,W-2*M,57,'สรุปการเรียน','การ์ดแสดงคอร์สที่กำลังเรียน เรียนสำเร็จ และเวลาเรียนรู้ของผู้ใช้',PEACH)
card(M,y-130,W-2*M,57,'เรียนต่อและค้นหาคอร์ส','ปุ่มเรียนต่อกลับไปยังคอร์สเดิม ส่วนแท็บหมวดและการ์ดด้านล่างใช้เลือกคอร์สใหม่',BLUE)
c.showPage()

# Page 3: walkthrough of the lower portion of the actual dashboard
base(3,'ภาพหน้าจอจริง 02','หน้าห้องเรียนและวิดีโอ','หน้าที่เปิดจากคอร์ส • แสดงบทเรียน วิดีโอ และสถานะการรับชม')
img=ImageReader(str(ROOT/'artifacts'/'classroom-new.png'))
iw,ih=img.getSize(); scale=min((W-2*M)/iw,508/ih); dw,dh=iw*scale,ih*scale
c.drawImage(img,(W-dw)/2,H-126-dh,width=dw,height=dh, preserveAspectRatio=True,mask='auto')
y=H-138-dh
card(M,y,W-2*M,65,'ตัวเล่นวิดีโอ','ด้านบนระบุบทที่ 1 จาก 3 ชื่อบท และตัวเล่นแสดงเวลาที่เล่นแล้วเทียบกับความยาวคลิป',MINT)
card(M,y-73,W-2*M,65,'การติดตามการเรียน','การ์ดสรุปเวลา เปอร์เซ็นต์ความคืบหน้า และสถานะ “กำลังเรียน” พร้อมแถบตำแหน่งเล่นและปุ่มทำเครื่องหมายเมื่อเรียนจบ',PEACH)
paragraph('เมื่อผู้เรียนกลับมาเรียน ระบบควรเปิดต่อจากตำแหน่งที่บันทึกไว้ เปอร์เซ็นต์ในภาพเป็นข้อมูลตัวอย่างของบัญชีขณะจับภาพ',M,y-153,W-2*M,9.2,MUTED,14)
c.showPage()

# Page 2
base(4,'01  หน้าจอที่ผู้เรียนใช้','หน้าไหนทำหน้าที่อะไร','เมนูอยู่ด้านซ้าย ส่วนเนื้อหาจะเปลี่ยนตามหน้าที่เลือก และสิทธิ์ผู้ดูแลจะแสดงเมนูเพิ่ม')
cards=[
('เข้าสู่ระบบ / สมัครสมาชิก','ผู้เรียนเข้าสู่ระบบหรือสร้างบัญชี ข้อมูลสิทธิ์และ session ตรวจผ่าน API','/'),
('ภาพรวมของฉัน','แสดงคอร์สที่กำลังเรียน เรียนจบแล้ว เวลาที่ดู และปุ่มเรียนต่อ','/'),
('สำรวจคอร์สเรียน','ค้นหาคอร์สและกรองตามหมวด องค์กรและวัฒนธรรม, ทักษะดิจิทัล, ความปลอดภัย, พัฒนาตนเอง','catalog'),
('การเรียนรู้ของฉัน','แสดงคอร์สที่เริ่มเรียนแล้ว พร้อมเปอร์เซ็นต์และจุดที่เรียนต่อ','my'),
('ห้องเรียน','แสดงวิดีโอ บทเรียน แถบความคืบหน้า และแบบทดสอบท้ายคอร์ส','เปิดจากการ์ดคอร์ส'),
('ใบประกาศนียบัตร','แสดงประกาศนียบัตรหลังเรียนครบและผ่านแบบทดสอบ พิมพ์หรือบันทึก PDF จากเบราว์เซอร์','certificates'),
]
y=H-137
for i,(t,b,path) in enumerate(cards):
    col=[MINT,PEACH,BLUE,PURPLE][i%4]
    card(M,y,W-2*M,82,t,b,col)
    c.setFillColor(MUTED); c.setFont('Thai',7.5); c.drawRightString(W-M-14,y-71,path)
    y-=96
flow([('เข้าสู่ระบบ','ยืนยันบัญชี',GREEN),('เลือกคอร์ส','ค้นหาหมวด',PEACH),('เปิดบทเรียน','เล่นวิดีโอ',PURPLE),('เรียนต่อ','ดูความคืบหน้า',BLUE)],128)
c.showPage()

# Page 3
base(5,'02  ขั้นตอนเรียนและติดตาม','วิดีโอเก็บความคืบหน้าอย่างไร','มีคลิป MP4 แยกตามบทเรียนทั้งหมด 11 บท ความยาวประมาณ 1 นาทีต่อคลิป ครบทั้ง 4 หมวด')
categories=[('องค์กรและวัฒนธรรม','3 บท',GREEN),('ทักษะดิจิทัล','3 บท',PEACH),('ความปลอดภัย','3 บท',PURPLE),('พัฒนาตนเอง','2 บท',BLUE)]
for i,(name,count,col) in enumerate(categories):
    x=M+(i%2)*((W-2*M)/2); y=H-135-(i//2)*88
    card(x,y,(W-2*M-12)/2,70,name,count+' วิดีโอ • 60 วินาทีต่อบท',col)
flow([('เล่นคลิป','บันทึกทุก ~5 วิ',GREEN),('หยุด / ออก','บันทึกจุดล่าสุด',PEACH),('ดูต่อ','ต่อจากจุดเดิม',PURPLE),('ดูครบ 100%','สถานะเรียนสำเร็จ',BLUE)],H-340)
c.setFillColor(MINT); c.roundRect(M,H-493,W-2*M,92,12,fill=1,stroke=0)
c.setFillColor(INK); c.setFont('ThaiB',12); c.drawString(M+16,H-424,'ข้อมูลที่บันทึกต่อผู้เรียนและบทเรียน')
paragraph('ตำแหน่งล่าสุด • วินาทีที่ดูไปไกลที่สุด • เปอร์เซ็นต์รับชม • สถานะจบ • เวลาอัปเดต',M+16,H-448,W-2*M-32,10,MUTED,16)
paragraph('เปอร์เซ็นต์คอร์สคำนวณจากเวลาที่ดูรวมกับเวลาของแต่ละบท การดูไม่ครบทุกบทจะไม่แสดงว่าคอร์สสำเร็จ แบบทดสอบปลดล็อกเมื่อครบทุกบท และใบประกาศต้องผ่านแบบทดสอบด้วย',M,H-522,W-2*M,10.2,INK,17)
paragraph('ข้อจำกัด: เป็นคลิปสาธิตแบบไม่มีเสียง ผู้เรียนสามารถเรียนต่อจากตำแหน่งเดิมได้ แต่การวัดจากตัวเล่นเว็บเพียงอย่างเดียวยังยืนยันการรับชมจริงอย่างสมบูรณ์ไม่ได้',M,H-604,W-2*M,9,MUTED,15)
c.showPage()

# Page 4
base(6,'03  หน้าผู้ดูแลและระบบ','จัดการคอร์สและข้อมูลอย่างไร','หน้าผู้ดูแลใช้สิทธิ์ admin เพื่อสร้างและแก้ไขคอร์ส พร้อมติดตามรายงานผู้เรียน')
card(M,H-137,W-2*M,98,'จัดการการเรียนรู้','สร้าง แก้ไข และลบคอร์สหรือบทเรียน ตั้งหมวดหมู่ ใส่เนื้อหา ลิงก์ MP4/WebM ระยะเวลาคลิป และแบบทดสอบ',MINT)
card(M,H-253,W-2*M,87,'รายงานผู้เรียน','ดูจำนวนคอร์สที่ผ่าน และส่งออกรายงาน CSV',PEACH)
flow([('หน้าเว็บ','Next.js / React',GREEN),('API','ตรวจ session/สิทธิ์',PEACH),('MongoDB','ข้อมูลถาวร',PURPLE)],H-400)
for i,(title,body,col) in enumerate([
('users','บัญชีผู้เรียนและผู้ดูแล; รหัสผ่านเก็บแบบ hash',MINT),
('courses','รายละเอียดคอร์ส บทเรียน วิดีโอ และแบบทดสอบ',PEACH),
('progress','บทที่จบ ผลแบบทดสอบ และเวลาสรุป',PURPLE),
('video_progress','ตำแหน่งล่าสุด เวลาที่ดูไกลสุด และสถานะรายวิดีโอ',BLUE),
]):
    y=H-475-i*64
    c.setFillColor(col); c.roundRect(M,y-48,W-2*M,50,8,fill=1,stroke=0)
    c.setFillColor(INK); c.setFont('ThaiB',10); c.drawString(M+12,y-19,title)
    c.setFillColor(MUTED); c.setFont('Thai',8.4); c.drawString(M+128,y-19,body)
paragraph('กรณีฐานข้อมูลขัดข้องในโหมดพัฒนา ระบบอาจใช้ข้อมูลสาธิตชั่วคราวซึ่งไม่อยู่ถาวร ก่อนนำไปใช้จริงให้ตรวจว่าเชื่อม MongoDB ได้และไม่มีป้าย TEMP DEMO',M,79,W-2*M,9,MUTED,14)
c.showPage()

# Page 5
base(7,'04  ประเมินสถานะงาน','ทำแล้ว อะไรต่อ และตัวเลข 40%','สรุปจากโค้ดและสภาพระบบ ณ วันที่ 30 ตุลาคม 2026')
card(M,H-137,W-2*M,95,'ทำงานได้แล้ว','เข้าสู่ระบบ • บทบาทผู้เรียนและผู้ดูแล • MongoDB • คอร์ส 4 หมวด • วิดีโอและการบันทึกความคืบหน้า • แบบทดสอบ • ใบประกาศ • รายงาน CSV',MINT)
card(M,H-250,W-2*M,98,'ยังควรทำต่อ','แทนข้อความและคลิปสาธิตด้วยเนื้อหาจริงที่ผ่าน HR / IT ตรวจ • ทดลองทุกบัญชีและทุกขั้นบนอุปกรณ์มือถือ • ตรวจการจัดเก็บและสิทธิ์การเข้าถึง • เตรียม deploy และทดสอบ production',PEACH)
c.setFillColor(INK); c.roundRect(M,H-520,W-2*M,132,14,fill=1,stroke=0)
c.setFillColor(GREEN); c.setFont('ThaiB',14); c.drawString(M+18,H-414,'ความคืบหน้าประเมิน: ประมาณ 40%')
paragraph('วิธีประเมิน: ฟังก์ชันหลักของต้นแบบมีแล้วหลายส่วน แต่เนื้อหาจริง การตรวจรับจากเจ้าของหลักสูตร และการเปิดใช้งาน production ยังไม่ครบ จึงไม่ควรตีความเป็นเปอร์เซ็นต์ตามแผนงานที่อนุมัติหรือชั่วโมงทำงาน',M+18,H-445,W-2*M-36,9.5,white,15)
paragraph('ก้าวถัดไปที่แนะนำ',M,H-557,W-2*M,13,INK,20,'ThaiB')
for i,t in enumerate(['ให้ผู้รับผิดชอบแต่ละหมวดตรวจและแทนเนื้อหาสาธิต','ทดลองสมัครบัญชีผู้เรียน ดูคลิปครึ่งหนึ่ง ออกจากหน้า กลับมาเรียนต่อ และดูจนสำเร็จ','ตรวจรายงานผู้ดูแลและข้อมูลใน MongoDB ก่อนกำหนดวันเปิดใช้งาน']):
    c.setFillColor(GREEN); c.circle(M+7,H-591-i*39,8,fill=1,stroke=0)
    c.setFillColor(INK); c.setFont('ThaiB',8); c.drawCentredString(M+7,H-594-i*39,str(i+1))
    paragraph(t,M+24,H-588-i*39,W-2*M-24,9.5,INK,14)
paragraph('ที่มา: สำรวจไฟล์ระบบ หน้าจอ โครงสร้างข้อมูล และการเชื่อมต่อที่มีในโปรเจกต์ • ตัวเลขความคืบหน้าเป็นค่าประเมินเพื่อสื่อสารสถานะ ไม่ใช่ข้อมูล time tracking',M,H-725,W-2*M,8,MUTED,12)
c.showPage()
c.save()
print(OUT)
