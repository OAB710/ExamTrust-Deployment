import { QUESTION_LIMITS } from './question-validation.constants';

export interface LineValidationResult {
  valid: boolean;
  errors: string[];
  nonEmptyCount: number;
}

/**
 * Validate Find Error / Ordering line content.
 * Reports errors with real (1-indexed) line numbers from the raw text,
 * not the filtered array.
 */
export function validateLineContent(rawValue: string): LineValidationResult {
  const errors: string[] = [];
  const rawLines = rawValue.split(/\r?\n/);
  const nonEmptyLines: { index: number; text: string }[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.trim().length > 0) {
      nonEmptyLines.push({ index: i + 1, text: line });
    }
  }

  // Min lines
  if (nonEmptyLines.length < QUESTION_LIMITS.lineContent.minLines) {
    errors.push(`Cần ít nhất ${QUESTION_LIMITS.lineContent.minLines} dòng không rỗng.`);
  }

  // Max lines
  if (nonEmptyLines.length > QUESTION_LIMITS.lineContent.maxLines) {
    errors.push(
      `Nội dung theo dòng chỉ được chứa tối đa ${QUESTION_LIMITS.lineContent.maxLines} dòng không rỗng.`,
    );
  }

  // Per-line char limit
  const longLines: number[] = [];
  for (const item of nonEmptyLines) {
    if (item.text.length > QUESTION_LIMITS.lineContent.maxCharsPerLine) {
      longLines.push(item.index);
    }
  }
  if (longLines.length === 1) {
    const line = nonEmptyLines.find((l) => l.index === longLines[0])!;
    errors.push(
      `Dòng ${longLines[0]} có ${line.text.length} ký tự. Mỗi dòng tối đa ${QUESTION_LIMITS.lineContent.maxCharsPerLine} ký tự.`,
    );
  } else if (longLines.length > 1) {
    errors.push(
      `Có ${longLines.length} dòng vượt quá giới hạn ${QUESTION_LIMITS.lineContent.maxCharsPerLine} ký tự: dòng ${longLines.join(', ')}.`,
    );
  }

  // Total length
  if (rawValue.length > QUESTION_LIMITS.lineContent.maxTotalLength) {
    errors.push(
      `Nội dung theo dòng không được vượt quá ${QUESTION_LIMITS.lineContent.maxTotalLength.toLocaleString()} ký tự.`,
    );
  }

  return { valid: errors.length === 0, errors, nonEmptyCount: nonEmptyLines.length };
}

/**
 * Build line content counter text for display alongside the textarea.
 */
export function lineContentCounterText(rawValue: string): {
  chars: string;
  lines: string;
  charsWarn: boolean;
  linesWarn: boolean;
} {
  const total = rawValue.length;
  const max = QUESTION_LIMITS.lineContent.maxTotalLength;
  const nonEmpty = rawValue
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;

  return {
    chars: `${total.toLocaleString()} / ${max.toLocaleString()} ký tự`,
    lines: `${nonEmpty} / ${QUESTION_LIMITS.lineContent.maxLines} dòng`,
    charsWarn: total >= max * 0.8,
    linesWarn: nonEmpty >= QUESTION_LIMITS.lineContent.maxLines * 0.8,
  };
}
