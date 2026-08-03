type StructuredValue = Record<string, unknown>;

function asObject(value: unknown): StructuredValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as StructuredValue : null;
}

function parseValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  const object = asObject(value);
  if (!object) return "";
  for (const key of ["answer", "text", "content", "value"]) if (key in object) return text(object[key]);
  return Object.values(object).map(text).filter(Boolean).join(", ");
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function matchingSides(options: unknown): { left: string[]; right: string[] } {
  const raw = parseValue(options);
  const structured = asObject(raw);
  const left = stringList(structured?.left);
  const right = stringList(structured?.right);
  if (left.length || right.length) return { left, right };
  const flat = Array.isArray(raw) ? raw.map(text).filter(Boolean) : structured ? Object.values(structured).map(text).filter(Boolean) : [];
  const half = Math.floor(flat.length / 2);
  return { left: flat.slice(0, half), right: flat.slice(half) };
}

/** Human-readable lines for structured answers. Never serialize raw JSON to graders. */
export function formatManualAnswer(questionType: unknown, answer: unknown, options?: unknown): string[] {
  const type = String(questionType || "").toUpperCase();
  const rawAnswer = parseValue(answer);
  const answerObject = asObject(rawAnswer);
  if (type === "MATCHING") {
    const { left } = matchingSides(options);
    if (left.length) return left.map((item, index) => `${item} → ${text(answerObject?.[String(index)]) || "Chưa ghép"}`);
    if (answerObject) return Object.entries(answerObject).map(([key, value]) => `${key} → ${text(value) || "Chưa ghép"}`);
  }
  if (type === "ORDERING") {
    const order = Array.isArray(rawAnswer) ? rawAnswer : stringList(answerObject?.order ?? answerObject?.items ?? answerObject?.answer);
    if (order.length) return order.map((item, index) => `${index + 1}. ${text(item)}`);
  }
  if (type === "FILL_IN_BLANK") {
    const blanks = Array.isArray(rawAnswer) ? rawAnswer : stringList(answerObject?.answers ?? answerObject?.answer);
    if (blanks.length) return blanks.map((item, index) => `Chỗ trống ${index + 1}: ${text(item)}`);
  }
  return [text(rawAnswer) || "Chưa nộp câu trả lời"];
}
