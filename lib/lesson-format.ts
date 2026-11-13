const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|ogg)$/i;

const RAW_GENERATED_PATTERNS: RegExp[] = [
  /^gemini[_-]?generated[_-]?video(?:[_-]?[a-z0-9-]+)?$/i,
  /^(?:veo|sora|kling|runway|luma|pika|krea)[_-]?(?:generated|video|clip)(?:[_-]?[a-z0-9-]+)?$/i,
  /^upload[-_]\d{8,}[-_][a-f0-9]+$/i,
  /^(?:vid|mov|img|pxl|dsc|dji|gh|gp)[_-]?\d{4,}(?:[_-]?\d+)*$/i,
  /^(?:screen[\s_-]?recording|recording|capture|clip|video|untitled|temp|tmp)(?:[\s_-]*\d{2,}.*)?$/i,
  /^whatsapp[\s_-]?(?:video|audio|image).*$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^[0-9a-f]{16,}$/i,
  /^\d{4}[-_.]?\d{2}[-_.]?\d{2}(?:[-_.\sT]?\d{2}[-_.]?\d{2}[-_.]?\d{2})?$/,
  /^\d+$/,
];

function stripExtensionAndUploadPrefix(value: string): string {
  return value
    .trim()
    .replace(VIDEO_EXT_RE, "")
    .replace(/^upload[-_]\d{8,}[-_][a-f0-9]+[-_]?/i, "")
    .trim();
}

export function isRawVideoFilename(value?: string | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  const hadVideoExt = VIDEO_EXT_RE.test(trimmed);
  const withoutExt = stripExtensionAndUploadPrefix(trimmed);
  if (!withoutExt) return true;

  for (const re of RAW_GENERATED_PATTERNS) {
    if (re.test(withoutExt)) return true;
  }

  if (/gemini[_-]?generated[_-]?video/i.test(withoutExt)) return true;

  if (
    hadVideoExt &&
    !/\s/.test(withoutExt) &&
    !/[\u0E00-\u0E7F]/.test(withoutExt) &&
    /[_-][a-f0-9]{6,}$/i.test(withoutExt)
  ) {
    return true;
  }

  if (
    !/\s/.test(withoutExt) &&
    !/[\u0E00-\u0E7F]/.test(withoutExt) &&
    /_/.test(withoutExt) &&
    /(?:video|clip|generated|screen|record|final|export|render)/i.test(withoutExt) &&
    /(?:\d{3,}|[a-f0-9]{6,})/i.test(withoutExt)
  ) {
    return true;
  }

  return false;
}

export function formatLessonTitle(
  rawTitle: string | undefined | null,
  index: number,
): string {
  const fallback = `บทเรียนที่ ${index + 1}`;
  if (!rawTitle || !rawTitle.trim()) return fallback;

  const trimmed = rawTitle.trim();
  if (isRawVideoFilename(trimmed)) return fallback;

  if (VIDEO_EXT_RE.test(trimmed)) {
    const clean = trimmed
      .replace(VIDEO_EXT_RE, "")
      .replace(/[_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean && !isRawVideoFilename(clean) ? clean : fallback;
  }

  return trimmed;
}

export function formatLessonContent(
  rawContent: string | undefined | null,
): string {
  if (!rawContent) return "";

  const lines = rawContent.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const videoPrefixMatch = line.match(
      /^(?:บทเรียนวิดีโอ|ไฟล์วิดีโอ|ชื่อไฟล์|Video(?:\s*File)?|File)\s*:\s*(.+)$/i,
    );
    if (videoPrefixMatch) {
      const payload = videoPrefixMatch[1].trim();
      if (
        isRawVideoFilename(payload) ||
        VIDEO_EXT_RE.test(payload) ||
        /^บทเรียนวิดีโอ/i.test(line)
      ) {
        continue;
      }
    }

    if (isRawVideoFilename(line)) {
      continue;
    }

    if (
      /^วิดีโอสาธิตแบบข้อความเคลื่อนไหว/i.test(line) ||
      /^คลิปนี้เป็นวิดีโอสาธิต/i.test(line) ||
      /^ระบบบันทึกความคืบหน้าเป็นระยะ/i.test(line) ||
      /ความยาว\s*\d+\s*(?:นาที|วินาที)/i.test(line)
    ) {
      continue;
    }

    const sanitizedLine = line
      .replace(/\b(?:gemini[_-]?generated[_-]?video|upload[-_]\d{8,})[^\s]*/gi, "")
      .replace(/\S+\.(?:mp4|webm|mov|m4v|avi|mkv|ogv)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (sanitizedLine) {
      cleanedLines.push(sanitizedLine);
    }
  }

  return cleanedLines.join("\n").trim();
}

