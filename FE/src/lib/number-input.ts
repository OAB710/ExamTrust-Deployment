type NumericInputOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
};

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?(?:\d+|\d*\.\d+)$/;

const hasValidNumberFormat = (rawValue: string, integer: boolean) => {
  const trimmed = rawValue.trim();
  if (!trimmed) return true;
  return integer ? INTEGER_PATTERN.test(trimmed) : DECIMAL_PATTERN.test(trimmed);
};

const getMinError = (min: number) => {
  if (min === 0) return "Giá trị phải lớn hơn hoặc bằng 0";
  return `Giá trị phải lớn hơn hoặc bằng ${min}`;
};

export const getNumericInputError = (
  rawValue: string,
  options: NumericInputOptions = {},
): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const integer = options.integer ?? true;
  if (!hasValidNumberFormat(trimmed, integer)) {
    return "Vui lòng nhập một số hợp lệ";
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return "Vui lòng nhập một số hợp lệ";
  }

  if (typeof options.min === "number" && parsed < options.min) {
    return getMinError(options.min);
  }

  if (typeof options.max === "number" && parsed > options.max) {
    return `Giá trị phải nhỏ hơn hoặc bằng ${options.max}`;
  }

  return null;
};

export const sanitizeNumericInput = (
  rawValue: string,
  _options: NumericInputOptions = {},
): string => rawValue;

export const parseNumericInput = (
  rawValue: string,
  options: NumericInputOptions = {},
): number | undefined => {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  const error = getNumericInputError(trimmed, options);
  if (error) return undefined;

  return Number(trimmed);
};

export const parseNumericInputOr = (
  rawValue: string,
  fallback: number,
  options: NumericInputOptions = {},
): number => {
  const parsed = parseNumericInput(rawValue, options);
  return parsed === undefined ? fallback : parsed;
};
