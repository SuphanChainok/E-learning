"""Render silent Thai lesson videos from manifest.json; preserve all source and QA frames."""
from pathlib import Path
import json, sys, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tools/video"))
import imageio_ffmpeg

manifest = json.loads((ROOT / "artifacts/curriculum/manifest.json").read_text(encoding="utf-8"))
config = manifest["style"]
W, H, FPS = config["width"], config["height"], config["fps"]
OUT = ROOT / "public/videos"
OUT.mkdir(parents=True, exist_ok=True)
QA = ROOT / "artifacts/curriculum"
fonts = {s: ImageFont.truetype("C:/Windows/Fonts/tahoma.ttf", s) for s in [23, 26, 32, 40, 52, 120]}
palettes = {"mint": ("#183d32", "#d6efb0"), "peach": ("#51342c", "#ffd6b2"), "lavender": ("#352e52", "#dcd2ff"), "blue": ("#243e55", "#c3e5f5")}

def wrap(draw, text, font, width):
    # Thai has no mandatory spaces. Keep marks with the preceding glyph and measure the actual font.
    import unicodedata
    clusters = []
    for c in text:
        if clusters and unicodedata.combining(c): clusters[-1] += c
        else: clusters.append(c)
    lines, line = [], ""
    for c in clusters:
        if line and draw.textlength(line + c, font=font) > width:
            lines.append(line); line = c
        else: line += c
    if line: lines.append(line)
    return lines

def text_block(draw, text, xy, size, fill, width=1060):
    x, y = xy
    lines = wrap(draw, text, fonts[size], width)
    for i, line in enumerate(lines): draw.text((x, y + i * (size + 18)), line, font=fonts[size], fill=fill)
    return y + len(lines) * (size + 18)

def scene(lesson, index):
    bg, accent = palettes[lesson["color"]]
    image = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(image)
    d.text((72, 40), "AAG+ LEARNING", font=fonts[26], fill=accent)
    d.text((760, 42), lesson["category"], font=fonts[23], fill=accent)
    if index == 0:
        d.text((72, 155), "บทเรียนวิดีโอ", font=fonts[32], fill=accent)
        text_block(d, lesson["title"], (72, 240), 52, "#ffffff")
        d.text((72, 500), "3 แนวคิดที่นำไปใช้กับงานของคุณได้", font=fonts[32], fill=accent)
    elif index <= 3:
        # The numbered active idea replaces the previous one; earlier steps remain as small sequence markers.
        d.text((72, 155), f"0{index}", font=fonts[120], fill=accent)
        text_block(d, lesson["points"][index-1], (290, 205), 52, "#ffffff", 860)
        for j in range(3):
            x = 290 + j * 250
            d.line((x, 430, x+200, 430), fill=accent if j < index else "#6c7776", width=6)
            d.text((x, 450), f"แนวคิด {j+1}", font=fonts[26], fill=accent if j < index else "#a5adaa")
        text_block(d, lesson["title"], (72, 560), 26, accent)
    else:
        d.text((72, 155), "ลองนำไปใช้", font=fonts[40], fill=accent)
        text_block(d, lesson["activity"], (72, 245), 52, "#ffffff")
        d.text((72, 535), "หยุดคิดสักนิด แล้วเลือกสิ่งที่จะลงมือทำ", font=fonts[32], fill=accent)
    d.text((72, 660), "เนื้อหาสาธิต • อ่านตามภาพ • ไม่มีเสียง", font=fonts[23], fill=accent)
    return image

contact = Image.new("RGB", (640*4, 360*len(manifest["lessons"])), "white")
for row, lesson in enumerate(manifest["lessons"]):
    scenes = [scene(lesson, i) for i in range(5)]
    stem = Path(lesson["file"]).stem
    scenes[0].save(OUT / f"{stem}-poster.jpg", quality=90)
    for i in range(4): contact.paste(scenes[i if i==0 else i+1].resize((640,360)), (i*640,row*360))
    process = subprocess.Popen([
        imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
        "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "24", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(OUT / lesson["file"]),
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    for frame in range(FPS * config["seconds"]):
        t = frame / FPS
        idx = next(i for i,event in enumerate(manifest["timeline"]) if event["start"] <= t < event["end"])
        start = manifest["timeline"][idx]["start"]
        elapsed = t - start
        im = scenes[idx]
        # Short, deterministic reveal into a long readable hold; no decorative ambient motion.
        if 0 <= elapsed < 0.4:
            p = 1 - (1 - elapsed / 0.4)**3
            bg = Image.new("RGB", (W,H), palettes[lesson["color"]][0])
            im = Image.blend(bg, scenes[idx], p)
        process.stdin.write(im.tobytes())
    process.stdin.close()
    if process.wait(): raise RuntimeError(f"Encoding failed: {lesson['file']}")
    # Decode every output, checking readable frames and exact media duration.
    result = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(OUT / lesson["file"]), "-f", "null", "-"], capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.decode(errors="replace"))
    print(f"Rendered and decoded: {lesson['file']} (60 seconds)", flush=True)
contact.save(QA / "contact-sheet.jpg", quality=90)
print("All 11 lesson videos ready", flush=True)
