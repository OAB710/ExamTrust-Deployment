import crypto from "node:crypto";

const {
  ZALO_WEBHOOK_SECRET,
  ZALO_ALLOWED_USER_ID,
  ZALO_BUILD_FE_COMMAND = "Build fe",
  ZALO_STOP_FE_COMMAND = "Off FE",
  ZALO_START_FE_COMMAND = "On FE",
  ZALO_USAGE_FE_COMMAND = "Usage FE",
  ZALO_BOT_TOKEN,
  GITHUB_PAT,
  GITHUB_REPO = "OAB710/ExamTrust-Deployment",
  GITHUB_WORKFLOW_FILE = "deploy-fe.yml",
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_WORKER_NAME = "examtrust-deployment-final-thesis",
} = process.env;

function safeEqual(a, b) {
  const bufA = Buffer.from(a ?? "", "utf8");
  const bufB = Buffer.from(b ?? "", "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const COOLDOWN_MS = 3 * 60 * 1000;
const githubHeaders = {
  Authorization: `Bearer ${GITHUB_PAT}`,
  Accept: "application/vnd.github+json",
};

async function getLastRunAgeMs() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/runs?per_page=1`;
  const resp = await fetch(url, { headers: githubHeaders });
  if (!resp.ok) return null;
  const data = await resp.json();
  const lastRun = data.workflow_runs?.[0];
  if (!lastRun) return null;
  return Date.now() - new Date(lastRun.created_at).getTime();
}

async function triggerFeDeploy() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { ...githubHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error("GitHub dispatch failed", resp.status, text);
    return false;
  }
  return true;
}

async function setFeSubdomainEnabled(enabled) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${CLOUDFLARE_WORKER_NAME}/subdomain`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled, previews_enabled: enabled }),
  });
  if (!resp.ok) {
    console.error("Cloudflare subdomain toggle failed", resp.status, await resp.text());
    return false;
  }
  return true;
}

async function cfGraphQL(query, variables) {
  const resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) {
    console.error("Cloudflare GraphQL HTTP error", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  if (data.errors) {
    console.error("Cloudflare GraphQL errors", JSON.stringify(data.errors));
    return null;
  }
  return data;
}

async function getTodayRequestCount() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const query = `
    query ($accountTag: string!, $start: Time!, $end: Time!, $scriptName: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            limit: 1
            filter: { datetime_geq: $start, datetime_leq: $end, scriptName: $scriptName }
          ) {
            sum { requests }
          }
        }
      }
    }
  `;
  const data = await cfGraphQL(query, {
    accountTag: CLOUDFLARE_ACCOUNT_ID,
    start: startOfDay.toISOString(),
    end: new Date().toISOString(),
    scriptName: CLOUDFLARE_WORKER_NAME,
  });
  if (!data) return null;
  const groups = data?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];
  return groups.reduce((total, g) => total + (g.sum?.requests ?? 0), 0);
}

async function getTodayObservabilityEventCount() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/observability/telemetry/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeframe: { from: startOfDay.getTime(), to: Date.now() },
        view: "calculations",
        parameters: {
          calculations: [{ operator: "count", alias: "total" }],
          datasets: [],
          filterCombination: "and",
          filters: [],
        },
      }),
    },
  );
  if (!resp.ok) {
    console.error("Observability query failed", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  // result may be in data.result.data[0].total or data.result.rows[0]
  const result = data?.result;
  if (result?.data?.[0]?.total !== undefined) return result.data[0].total;
  if (result?.rows?.[0]?.total !== undefined) return result.rows[0].total;
  // fallback: sum all count-like fields
  const rows = result?.data ?? result?.rows ?? [];
  if (rows.length > 0) {
    const first = rows[0];
    const val = first.total ?? first.count ?? first["count()"] ?? Object.values(first)[0];
    return typeof val === "number" ? val : null;
  }
  return null;
}

async function getThisMonthBuildMinutes() {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const query = `
    query ($accountTag: string!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersBuildsBuildMinutesAdaptiveGroups(
            limit: 1
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            sum { buildTimeMs }
          }
        }
      }
    }
  `;
  const data = await cfGraphQL(query, {
    accountTag: CLOUDFLARE_ACCOUNT_ID,
    start: startOfMonth.toISOString(),
    end: new Date().toISOString(),
  });
  if (!data) return null;
  const groups = data?.data?.viewer?.accounts?.[0]?.workersBuildsBuildMinutesAdaptiveGroups ?? [];
  const totalMs = groups.reduce((total, g) => total + (g.sum?.buildTimeMs ?? 0), 0);
  return Math.round(totalMs / 60000);
}

async function replyToZalo(chatId, text) {
  if (!ZALO_BOT_TOKEN) return;
  const resp = await fetch(`https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!resp.ok) {
    console.error("Zalo sendMessage failed", resp.status, await resp.text());
  }
}

export const handler = async (event) => {
  const ok = { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const headers = event.headers ?? {};
  const secretHeader = headers["x-bot-api-secret-token"] ?? headers["X-Bot-Api-Secret-Token"];

  if (!safeEqual(secretHeader, ZALO_WEBHOOK_SECRET)) {
    console.warn("Rejected: bad secret token");
    return ok;
  }

  let body;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return ok;
  }

  const senderId = body?.message?.from?.id;
  if (senderId !== ZALO_ALLOWED_USER_ID) {
    console.warn("Rejected: unknown sender", senderId);
    return ok;
  }

  const text = (body?.message?.text ?? "").trim().toLowerCase();
  const chatId = body?.message?.chat?.id;

  if (body?.event_name === "message.text.received") {
    if (text === ZALO_BUILD_FE_COMMAND.toLowerCase()) {
      const lastRunAgeMs = await getLastRunAgeMs();
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa build xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerFeDeploy();
        await replyToZalo(chatId, dispatched ? "🚀 Đang build FE..." : "❌ Trigger lỗi rồi");
      }
    } else if (text === ZALO_STOP_FE_COMMAND.toLowerCase()) {
      const done = await setFeSubdomainEnabled(false);
      await replyToZalo(chatId, done ? "🔴 Đã tắt FE" : "❌ Tắt lỗi rồi");
    } else if (text === ZALO_START_FE_COMMAND.toLowerCase()) {
      const done = await setFeSubdomainEnabled(true);
      await replyToZalo(chatId, done ? "🟢 Đã bật FE" : "❌ Bật lỗi rồi");
    } else if (text === ZALO_USAGE_FE_COMMAND.toLowerCase()) {
      const [requests, obsEvents, buildMinutes] = await Promise.all([
        getTodayRequestCount(),
        getTodayObservabilityEventCount(),
        getThisMonthBuildMinutes(),
      ]);
      const fmt = (n, fallback = "?") =>
        n === null ? fallback : n.toLocaleString("vi-VN");
      await replyToZalo(
        chatId,
        `📊 Cloudflare Usage\n` +
        `• Requests hôm nay: ${fmt(requests)} / 100.000\n` +
        `• Observability events hôm nay: ${fmt(obsEvents)} / 200.000\n` +
        `• Build minutes tháng này: ${fmt(buildMinutes)} / 3.000`,
      );
    } else {
      await replyToZalo(
        chatId,
        `🤖 Lệnh không hợp lệ. Các lệnh:\n- "${ZALO_BUILD_FE_COMMAND}"\n- "${ZALO_STOP_FE_COMMAND}"\n- "${ZALO_START_FE_COMMAND}"\n- "${ZALO_USAGE_FE_COMMAND}"`,
      );
    }
  }

  return ok;
};
