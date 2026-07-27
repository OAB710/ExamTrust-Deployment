import crypto from "node:crypto";

const {
  ZALO_WEBHOOK_SECRET,
  ZALO_ALLOWED_USER_ID,
  ZALO_BUILD_FE_COMMAND = "Build FE",
  ZALO_STOP_FE_COMMAND = "Off FE",
  ZALO_START_FE_COMMAND = "On FE",
  ZALO_USAGE_FE_COMMAND = "FE Info",
  ZALO_BUILD_BE_COMMAND = "Build BE",
  ZALO_FE_URL = "https://examtrust-deployment-final-thesis.examtrust.workers.dev",
  ZALO_BOT_TOKEN,
  GITHUB_PAT,
  GITHUB_REPO = "OAB710/ExamTrust-Deployment",
  GITHUB_WORKFLOW_FILE = "deploy-fe.yml",
  GITHUB_WORKFLOW_FILE_BE = "deploy-be.yml",
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

function normalizeCommand(s) {
  return String(s ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const COOLDOWN_MS = 3 * 60 * 1000;
const githubHeaders = {
  Authorization: `Bearer ${GITHUB_PAT}`,
  Accept: "application/vnd.github+json",
};

async function getLastRunAgeMs(workflowFile = GITHUB_WORKFLOW_FILE) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?per_page=1`;
  const resp = await fetch(url, { headers: githubHeaders });
  if (!resp.ok) return null;
  const data = await resp.json();
  const lastRun = data.workflow_runs?.[0];
  if (!lastRun) return null;
  return Date.now() - new Date(lastRun.created_at).getTime();
}

async function triggerDeploy(workflowFile = GITHUB_WORKFLOW_FILE) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;
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

async function getFeSubdomainEnabled() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${CLOUDFLARE_WORKER_NAME}/subdomain`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
  });
  if (!resp.ok) {
    console.error("Cloudflare subdomain status check failed", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return typeof data?.result?.enabled === "boolean" ? data.result.enabled : null;
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
        queryId: crypto.randomUUID(),
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
  const result = data?.result;
  // For view: "calculations", Cloudflare returns:
  // result.calculations[i].aggregates[0].value (confirmed from live response).
  const calculations = result?.calculations ?? [];
  for (const calc of calculations) {
    const agg = calc?.aggregates?.[0];
    const val = agg?.value ?? agg?.count ?? calc?.total ?? calc?.count ?? calc?.value;
    if (typeof val === "number") return val;
  }
  // Fallback: older/alternate shapes seen in other Cloudflare Analytics endpoints.
  const rows = result?.data ?? result?.rows ?? [];
  if (rows.length > 0) {
    const first = rows[0];
    const val = first.total ?? first.count ?? first["count()"] ?? Object.values(first)[0];
    if (typeof val === "number") return val;
  }
  console.error(
    "Observability query: could not find a numeric count in response",
    JSON.stringify(data).slice(0, 1000),
  );
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
            sum { buildMinutes }
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
  const totalMinutes = groups.reduce((total, g) => total + (g.sum?.buildMinutes ?? 0), 0);
  return Math.round(totalMinutes);
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

  const text = normalizeCommand(body?.message?.text);
  const chatId = body?.message?.chat?.id;

  console.log(
    "Incoming text:",
    JSON.stringify(body?.message?.text ?? ""),
    "-> normalized:",
    JSON.stringify(text),
  );

  if (body?.event_name === "message.text.received") {
    if (text === normalizeCommand(ZALO_BUILD_FE_COMMAND)) {
      const lastRunAgeMs = await getLastRunAgeMs();
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa build xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerDeploy(GITHUB_WORKFLOW_FILE);
        await replyToZalo(chatId, dispatched ? "🚀 Đang build FE..." : "❌ Trigger lỗi rồi");
      }
    } else if (text === normalizeCommand(ZALO_BUILD_BE_COMMAND)) {
      const lastRunAgeMs = await getLastRunAgeMs(GITHUB_WORKFLOW_FILE_BE);
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa build xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerDeploy(GITHUB_WORKFLOW_FILE_BE);
        await replyToZalo(chatId, dispatched ? "🚀 Đang build BE..." : "❌ Trigger lỗi rồi");
      }
    } else if (text === normalizeCommand(ZALO_STOP_FE_COMMAND)) {
      const done = await setFeSubdomainEnabled(false);
      await replyToZalo(chatId, done ? "🔴 Đã tắt FE" : "❌ Tắt lỗi rồi");
    } else if (text === normalizeCommand(ZALO_START_FE_COMMAND)) {
      const done = await setFeSubdomainEnabled(true);
      await replyToZalo(chatId, done ? "🟢 Đã bật FE" : "❌ Bật lỗi rồi");
    } else if (text === normalizeCommand(ZALO_USAGE_FE_COMMAND)) {
      const [enabled, requests, obsEvents, buildMinutes] = await Promise.all([
        getFeSubdomainEnabled(),
        getTodayRequestCount(),
        getTodayObservabilityEventCount(),
        getThisMonthBuildMinutes(),
      ]);
      const fmt = (n, fallback = "?") =>
        n === null ? fallback : n.toLocaleString("en-US");
      const statusLabel = enabled === null ? "?" : enabled ? "On" : "Off";
      await replyToZalo(
        chatId,
        `🔗 Link FE: ${ZALO_FE_URL} (${statusLabel})\n\n` +
        `📊 Cloudflare Usage\n` +
        `• Requests today: ${fmt(requests)} / 100,000\n` +
        `• Observability events today: ${fmt(obsEvents)} / 200,000\n` +
        `• Workers build minutes this month: ${fmt(buildMinutes)} / 3,000`,
      );
    } else {
      await replyToZalo(
        chatId,
        `🤖 Vui lòng chọn một trong các lệnh sau:\n` +
        `• ${ZALO_BUILD_FE_COMMAND}\n` +
        `• ${ZALO_BUILD_BE_COMMAND}\n` +
        `• On / Off FE\n` +
        `• ${ZALO_USAGE_FE_COMMAND}`,
      );
    }
  }

  return ok;
};
