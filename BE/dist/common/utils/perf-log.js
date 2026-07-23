"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPerfLogEnabled = isPerfLogEnabled;
exports.nowMs = nowMs;
exports.elapsedMs = elapsedMs;
exports.measurePerf = measurePerf;
exports.logPerf = logPerf;
const enabledValues = new Set(['1', 'true', 'yes', 'on']);
function isPerfLogEnabled() {
    return enabledValues.has(String(process.env.PERF_LOG || '').toLowerCase());
}
function nowMs() {
    return Number(process.hrtime.bigint()) / 1_000_000;
}
function elapsedMs(startMs) {
    return Math.round((nowMs() - startMs) * 10) / 10;
}
async function measurePerf(label, action, parts) {
    if (!isPerfLogEnabled()) {
        return action();
    }
    const startedAt = nowMs();
    try {
        return await action();
    }
    finally {
        const duration = elapsedMs(startedAt);
        if (parts) {
            parts[label] = duration;
        }
    }
}
function logPerf(message) {
    if (isPerfLogEnabled()) {
        console.log(`[PERF] ${message}`);
    }
}
//# sourceMappingURL=perf-log.js.map