const DEFAULT_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const DEFAULT_EMAIL = process.env.PERF_LOGIN_EMAIL || 'admin@tdtutdtu.edu.vn';
const DEFAULT_PASSWORD = process.env.PERF_LOGIN_PASSWORD || '123123123Az!';

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(label, results) {
  const ok = results.filter((item) => item.ok);
  const durations = ok.map((item) => item.ms);
  const errors = results.length - ok.length;

  return {
    label,
    count: results.length,
    errors,
    errorRate: results.length ? errors / results.length : 0,
    min: Math.min(...durations),
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    max: Math.max(...durations),
    rps: durations.length
      ? Math.round((durations.length / (durations.reduce((sum, ms) => sum + ms, 0) / 1000)) * 100) / 100
      : 0,
  };
}

async function timedRequest(label, path, options = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}${path}`, options);
    const text = await response.text();
    return {
      label,
      ok: response.ok,
      status: response.status,
      ms: Math.round((performance.now() - startedAt) * 10) / 10,
      body: text ? safeJson(text) : null,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      status: 0,
      ms: Math.round((performance.now() - startedAt) * 10) / 10,
      error: error.message,
    };
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function loginRequest() {
  return timedRequest('login', '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
    }),
  });
}

async function runSequential(count) {
  const results = [];
  for (let index = 0; index < count; index++) {
    results.push(await loginRequest());
  }
  return results;
}

async function runConcurrent(total, concurrency) {
  const results = [];
  let next = 0;

  async function worker() {
    while (next < total) {
      next += 1;
      results.push(await loginRequest());
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function main() {
  console.log(`[BENCH] base=${DEFAULT_BASE_URL} email=${DEFAULT_EMAIL}`);

  const coldLogin = await loginRequest();
  console.log('[BENCH] cold-login', coldLogin);

  const health = await timedRequest('health', '/health');
  console.log('[BENCH] health', health);

  for (let index = 0; index < 4; index++) {
    const warmup = await loginRequest();
    console.log(`[BENCH] warmup-${index + 1} ${warmup.ms}ms status=${warmup.status}`);
  }

  const sequential = await runSequential(10);
  const concurrent = await runConcurrent(20, 4);

  console.table([
    summarize('login sequential x10', sequential),
    summarize('login concurrent x20 c4', concurrent),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
