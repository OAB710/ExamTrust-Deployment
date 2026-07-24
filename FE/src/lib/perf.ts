const enabledValues = new Set(["1", "true", "yes", "on"]);

export function isPerfLogEnabled() {
  return enabledValues.has(
    String(process.env.NEXT_PUBLIC_PERF_LOG || "").toLowerCase(),
  );
}

export function nowMs() {
  return performance.now();
}

export function elapsedMs(startMs: number) {
  return Math.round((nowMs() - startMs) * 10) / 10;
}

export function logPerf(message: string) {
  if (isPerfLogEnabled()) {
    console.log(`[PERF] ${message}`);
  }
}
