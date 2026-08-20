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

function trueFalseText(value: unknown, options?: unknown): string {
  const optionsObject = asObject(parseValue(options));
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") {
    const key = value.trim();
    if (optionsObject && key in optionsObject) return text(optionsObject[key]);
    if (/^true$/i.test(key)) return "True";
    if (/^false$/i.test(key)) return "False";
  }
  return text(value);
}

// FIND_ERROR options are stored id-keyed (`{ [optionId]: codeLine }`), but the
// letter labels ("A"/"B"/...) students actually pick from are assigned at
// exam-taking time by sorting those ids (see exam-taking-model.ts's
// `parseOptions`, which does `Object.keys(options).sort()`). A submitted
// answer therefore holds a letter, while `correctAnswer.answers` holds the
// raw option id — two different codes for the same option. Resolve either
// shape back to "<letter>. <code line>" by rebuilding that same sorted order.
function findErrorText(code: string, options: unknown): string {
  const structured = asObject(parseValue(options));
  if (!structured) return code;
  const sortedIds = Object.keys(structured).sort();
  const normalized = code.trim();
  let index = sortedIds.findIndex((id) => id.toLowerCase() === normalized.toLowerCase());
  if (index === -1 && /^[a-z]$/i.test(normalized)) {
    index = normalized.toUpperCase().charCodeAt(0) - 65;
  }
  if (index < 0 || index >= sortedIds.length) return code;
  const letter = String.fromCharCode(65 + index);
  return `${letter}. ${text(structured[sortedIds[index]])}`;
}

/** Human-readable lines for structured answers. Never serialize raw JSON to graders. */
export function formatManualAnswer(questionType: unknown, answer: unknown, options?: unknown): string[] {
  const type = String(questionType || "").toUpperCase();
  const rawAnswer = parseValue(answer);
  const answerObject = asObject(rawAnswer);
  if (type === "TRUE_FALSE") {
    const value = answerObject && "answer" in answerObject ? answerObject.answer : rawAnswer;
    return [trueFalseText(value, options)];
  }
  if (type === "MATCHING") {
    // The hidden grading key is always `{ pairs: [{left, right}] }` — read it
    // directly instead of index-zipping against `options`, which only holds
    // the (shuffled) student-facing left/right lists and never the answer.
    const pairs = Array.isArray(answerObject?.pairs) ? answerObject.pairs : null;
    if (pairs) return pairs.map((pair: any) => `${text(pair?.left)} → ${text(pair?.right) || "Chưa ghép"}`);
    const { left } = matchingSides(options);
    if (left.length) return left.map((item, index) => `${item} → ${text(answerObject?.[String(index)]) || "Chưa ghép"}`);
    if (answerObject) return Object.entries(answerObject).map(([key, value]) => `${key} → ${text(value) || "Chưa ghép"}`);
  }
  if (type === "ORDERING") {
    const order = Array.isArray(rawAnswer) ? rawAnswer : stringList(answerObject?.order ?? answerObject?.items ?? answerObject?.answer);
    if (order.length) return order.map((item, index) => `${index + 1}. ${text(item)}`);
  }
  if (type === "FIND_ERROR") {
    const codes = Array.isArray(rawAnswer) ? rawAnswer : stringList(answerObject?.answers ?? answerObject?.answer);
    if (codes.length) return codes.map((code) => findErrorText(String(code), options));
  }
  if (type === "FILL_IN_BLANK") {
    const blanks = Array.isArray(rawAnswer) ? rawAnswer : stringList(answerObject?.answers ?? answerObject?.answer);
    if (blanks.length) return blanks.map((item, index) => `Chỗ trống ${index + 1}: ${text(item)}`);
  }
  return [text(rawAnswer) || "Chưa nộp câu trả lời"];
}
