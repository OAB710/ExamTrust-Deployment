const enabledValues = new Set(['1', 'true', 'yes', 'on']);

export function isPerfLogEnabled() {
  return enabledValues.has(String(process.env.PERF_LOG || '').toLowerCase());
}

export function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function elapsedMs(startMs: number) {
  return Math.round((nowMs() - startMs) * 10) / 10;
}

export async function measurePerf<T>(
  label: string,
  action: () => Promise<T>,
  parts?: Record<string, number>,
) {
  if (!isPerfLogEnabled()) {
    return action();
  }

  const startedAt = nowMs();
  try {
    return await action();
  } finally {
    const duration = elapsedMs(startedAt);
    if (parts) {
      parts[label] = duration;
    }
  }
}

export function logPerf(message: string) {
  if (isPerfLogEnabled()) {
    console.log(`[PERF] ${message}`);
  }
}
