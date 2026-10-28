"""Create the local, silent 30-second demonstration clip (Pillow + imageio-ffmpeg)."""
from pathlib import Path
import sys
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tools" / "video"))
import imageio_ffmpeg

OUT = ROOT / "public" / "videos"
OUT.mkdir(parents=True, exist_ok=True)
font = lambda size: ImageFont.truetype("C:/Windows/Fonts/tahoma.ttf", size)
small, body, title = font(24), font(30), font(46)
fps, duration = 15, 30
process = subprocess.Popen([
    imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
    "-s", "960x540", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "24",
    str(OUT / "learning-demo.mp4"),
], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
scenes = [
    ("เริ่มต้นเรียนรู้ไปด้วยกัน", "กดเล่นวิดีโอ แล้วเริ่มเรียนได้เลย", "คลิปสาธิตระบบการเรียนรู้ • ไม่มีเสียง"),
    ("เรียนทีละนิด ก็มีความคืบหน้า", "ดูเวลาที่รับชมและเปอร์เซ็นต์ใต้คลิป", "ความคืบหน้าจะถูกบันทึกระหว่างเรียน"),
    ("หยุดพัก แล้วกลับมาเรียนต่อ", "ตำแหน่งล่าสุดช่วยให้ดูต่อได้สะดวก", "ดูครบคลิป → เรียนสำเร็จ"),
]
for frame in range(fps * duration):
    t = frame / fps
    im = Image.new("RGB", (960, 540), "#142b21")
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((50, 40, 270, 85), radius=22, fill="#d6f4b7")
    draw.text((74, 48), "AAG+ LEARNING", font=small, fill="#142b21")
    heading, description, note = scenes[min(2, int(t // 10))]
    draw.text((60, 170), heading, font=title, fill="#f3f7ed")
    draw.text((60, 255), description, font=body, fill="#d6f4b7")
    draw.text((60, 320), note, font=small, fill="#b4c6bc")
    draw.rounded_rectangle((60, 435, 900, 445), radius=5, fill="#355143")
    draw.rounded_rectangle((60, 435, 61 + 839 * t / duration, 445), radius=5, fill="#bdeb87")
    draw.text((60, 467), "วิดีโอสาธิตการติดตามการเรียนรู้", font=small, fill="#b4c6bc")
    draw.text((760, 467), f"{int(t):02d} / 30 sec", font=small, fill="#f3f7ed")
    if frame == 0: im.save(OUT / "learning-demo-poster.jpg")
    process.stdin.write(im.tobytes())
process.stdin.close()
if process.wait(): raise RuntimeError("Video encoding failed")
print("Created public/videos/learning-demo.mp4 (30 seconds)")
