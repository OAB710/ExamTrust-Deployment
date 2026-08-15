import crypto from "node:crypto";

const {
  ZALO_WEBHOOK_SECRET,
  ZALO_ALLOWED_USER_ID,
  ZALO_BUILD_FE_COMMAND = "Build FE",
  ZALO_STOP_FE_COMMAND = "Off FE",
  ZALO_START_FE_COMMAND = "On FE",
  ZALO_USAGE_FE_COMMAND = "FE Info",
  ZALO_USAGE_BE_COMMAND = "BE Info",
  ZALO_USAGE_R2_COMMAND = "R2 Info",
  ZALO_PUBLIC_INFO_COMMAND = "Info",
  ZALO_SYSTEM_OVERVIEW_COMMAND = "System Overview",
  ZALO_BUILD_BE_COMMAND = "Build BE",
  ZALO_AI_DEEPSEEK_COMMAND = "AI Deepseek",
  ZALO_AI_OPENROUTER_COMMAND = "AI Openrouter",
  ZALO_RESET_DB_COMMAND = "Reset DB",
  ZALO_CLEAR_QUESTIONS_COMMAND = "Clear Question Media",
  ZALO_CLEAR_EVIDENCE_COMMAND = "Clear Evidence Media",
  ZALO_CLEAR_ALL_STORAGE_COMMAND = "Clear All Media",
  // Bump this alongside every CHANGELOG.md release entry (xem skill
  // release-versioning) — hiển thị trong lệnh Info cho mọi user.
  ZALO_APP_VERSION = "v1.0.0",
  ZALO_FE_URL = "https://examtrust-deployment-final-thesis.examtrust.workers.dev",
  ZALO_BE_API_URL = "https://32-236-182-208.sslip.io/api",
  ZALO_AWS_CONSOLE_URL = "https://ap-southeast-2.console.aws.amazon.com/",
  ZALO_BOT_TOKEN,
  GITHUB_PAT,
  GITHUB_REPO = "OAB710/ExamTrust-Deployment",
  GITHUB_WORKFLOW_FILE = "deploy-fe.yml",
  GITHUB_WORKFLOW_FILE_BE = "deploy-be.yml",
  GITHUB_WORKFLOW_FILE_SWITCH_AI = "switch-ai.yml",
  GITHUB_WORKFLOW_FILE_RESET_DB = "reset-db.yml",
  GITHUB_WORKFLOW_FILE_CLEAR_STORAGE = "clear-storage.yml",
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_WORKER_NAME = "examtrust-deployment-final-thesis",
  // R2 bucket that stores question media attachments (images/audio) —
  // see BE/src/media and CLOUDFLARE_DEPLOY_NOTES.txt mục 10.
  CLOUDFLARE_R2_BUCKET_NAME = "examtrust-media",
} = process.env;

// Cloudflare R2 free tier: 10 GB storage, 1M Class A ops, 10M Class B ops
// per month. See CLOUDFLARE_DEPLOY_NOTES.txt mục 10.4.
const R2_FREE_TIER_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;

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

async function triggerDeploy(workflowFile = GITHUB_WORKFLOW_FILE, inputs) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { ...githubHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", ...(inputs ? { inputs } : {}) }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error("GitHub dispatch failed", resp.status, text);
    return false;
  }
  return true;
}

async function getLatestWorkflowRun(workflowFile) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?per_page=1`;
  const resp = await fetch(url, { headers: githubHeaders });
  if (!resp.ok) {
    console.error("Get workflow run failed", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  const run = data.workflow_runs?.[0];
  if (!run) return null;
  return { status: run.status, conclusion: run.conclusion };
}

function formatBuildStatus(run) {
  if (!run) return "❔ No builds yet";
  if (run.status === "in_progress" || run.status === "queued") return "🔄 Building...";
  if (run.status === "completed") {
    if (run.conclusion === "success") return "✅ Done";
    if (run.conclusion === "failure") return "❌ Failed";
    if (run.conclusion === "cancelled") return "⚠️ Cancelled";
    return `⚪ ${run.conclusion}`;
  }
  return `⚪ ${run.status}`;
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

async function getR2StorageBytes() {
  // Storage is a point-in-time snapshot, not a sum-over-range metric — take
  // the single most recent data point in the last 2 days and read its max
  // payloadSize. Field/dataset names confirmed against Cloudflare's R2
  // GraphQL Analytics docs (r2StorageAdaptiveGroups / max.payloadSize).
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const query = `
    query ($accountTag: string!, $bucketName: string!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2StorageAdaptiveGroups(
            limit: 1
            orderBy: [datetime_DESC]
            filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }
          ) {
            max { payloadSize }
          }
        }
      }
    }
  `;
  const data = await cfGraphQL(query, {
    accountTag: CLOUDFLARE_ACCOUNT_ID,
    bucketName: CLOUDFLARE_R2_BUCKET_NAME,
    start: twoDaysAgo.toISOString(),
    end: new Date().toISOString(),
  });
  if (!data) return null;
  const groups = data?.data?.viewer?.accounts?.[0]?.r2StorageAdaptiveGroups ?? [];
  const bytes = groups[0]?.max?.payloadSize;
  return typeof bytes === "number" ? bytes : null;
}

async function getR2MonthlyOperationCount() {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const query = `
    query ($accountTag: string!, $bucketName: string!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }
          ) {
            sum { requests }
          }
        }
      }
    }
  `;
  const data = await cfGraphQL(query, {
    accountTag: CLOUDFLARE_ACCOUNT_ID,
    bucketName: CLOUDFLARE_R2_BUCKET_NAME,
    start: startOfMonth.toISOString(),
    end: new Date().toISOString(),
  });
  if (!data) return null;
  const groups = data?.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups ?? [];
  return groups.reduce((total, g) => total + (g.sum?.requests ?? 0), 0);
}

function formatBytesGB(bytes) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

async function buildR2InfoText() {
  const [storageBytes, monthlyOps] = await Promise.all([
    getR2StorageBytes(),
    getR2MonthlyOperationCount(),
  ]);
  const storageLine =
    storageBytes === null
      ? monthlyOps === null
        ? "• Dung lượng hiện tại: ? (thiếu quyền 'Workers R2 Storage: Read' trên token)"
        : "• Dung lượng hiện tại: 0 B / 10 GB (0%) — bucket đang trống hoặc chưa có snapshot dung lượng trong 2 ngày qua"
      : `• Dung lượng hiện tại: ${formatBytesGB(storageBytes)} GB / 10 GB (${Math.round((storageBytes / R2_FREE_TIER_STORAGE_BYTES) * 100)}%)`;
  const opsLine =
    monthlyOps === null
      ? "• Số lượt request tháng này: ?"
      : `• Số lượt request tháng này: ${monthlyOps.toLocaleString("en-US")} (không tách Class A/B)`;
  return (
    `📦 R2 Info (${CLOUDFLARE_R2_BUCKET_NAME})\n` +
    `${storageLine}\n` +
    `${opsLine}\n\n` +
    `⚠️ Số này là dung lượng THẬT trên Cloudflare (quyết định có bị tính phí không). ` +
    `App còn có ngưỡng chặn riêng ở 3GB (30% free tier) để không bao giờ chạm mốc này — xem media_storage_usage.`
  );
}

async function getThisMonthBuildMinutes() {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  // AdaptiveGroups datasets implicitly group by day — limit:1 was only
  // returning a single day's bucket (often 0), not the whole month's total.
  // Use a limit wide enough to cover every day in the range and sum them all.
  const query = `
    query ($accountTag: string!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersBuildsBuildMinutesAdaptiveGroups(
            limit: 100
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

async function buildFeInfoText() {
  const [enabled, requests, obsEvents, buildMinutes, feRun] = await Promise.all([
    getFeSubdomainEnabled(),
    getTodayRequestCount(),
    getTodayObservabilityEventCount(),
    getThisMonthBuildMinutes(),
    getLatestWorkflowRun(GITHUB_WORKFLOW_FILE),
  ]);
  const fmt = (n, fallback = "?") => (n === null ? fallback : n.toLocaleString("en-US"));
  const statusLabel = enabled === null ? "?" : enabled ? "On" : "Off";
  // Deploys run `wrangler deploy` directly on the GitHub Actions runner
  // (see deploy-fe.yml), not Cloudflare's own hosted Workers Builds service —
  // so this quota is expected to stay at/near 0 regardless of deploy volume.
  const buildMinutesNote = buildMinutes === 0 ? " (deploy chạy qua GitHub Actions, không tính vào đây)" : "";
  return (
    `🖥️ FE Info\n` +
    `🏷️ Version: ${ZALO_APP_VERSION}\n` +
    `🔗 Link: ${ZALO_FE_URL} (${statusLabel})\n` +
    `🏗️ Build Status: ${formatBuildStatus(feRun)}\n\n` +
    `📊 Cloudflare Usage\n` +
    `• Requests today: ${fmt(requests)} / 100,000\n` +
    `• Observability events today: ${fmt(obsEvents)} / 200,000`
    // `• Workers build minutes this month: ${fmt(buildMinutes)} / 3,000${buildMinutesNote}`
  );
}

async function getAiStatus() {
  try {
    const resp = await fetch(`${ZALO_BE_API_URL}/ai-status`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return typeof data?.provider === "string" ? data : null;
  } catch (err) {
    console.error("AI status fetch failed", err);
    return null;
  }
}

async function getSystemOverview() {
  try {
    const resp = await fetch(`${ZALO_BE_API_URL}/system-overview`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    console.error("System overview fetch failed", err);
    return null;
  }
}

// Every number here is the same one an admin sees on-screen already (see
// CourseManagement/ExamManagement/QuestionBankManagement/UserRoleManagement/
// IntegrityOverview KPI cards) — this only reformats them for Zalo. The
// conclusion lines are plain arithmetic/threshold derivations of those same
// numbers (ratios, averages), never a fabricated metric.
function buildSystemOverviewConclusions(overview) {
  const { totalExams, publishedExams, totalSubmissions, integrity } = overview;
  const lines = [];

  if (integrity.totalFlagged > 0) {
    const pendingRatio = integrity.pendingReview / integrity.totalFlagged;
    if (pendingRatio >= 0.3) {
      const pendingPct = Math.round(pendingRatio * 100);
      lines.push(`⚠️ Còn ${integrity.pendingReview}/${integrity.totalFlagged} tín hiệu chờ xem xét (${pendingPct}%) — cần xem lại sớm.`);
    } else {
      const handled = integrity.totalFlagged - integrity.pendingReview;
      const handledPct = Math.round((handled / integrity.totalFlagged) * 100);
      lines.push(`✅ Đã xử lý ${handledPct}% tín hiệu nghi vấn ghi nhận được (${handled}/${integrity.totalFlagged}).`);
    }
  } else {
    lines.push("✅ Chưa ghi nhận tín hiệu nghi vấn nào.");
  }

  if (totalExams > 0) {
    const draftCount = totalExams - publishedExams;
    const draftRatio = draftCount / totalExams;
    if (draftRatio >= 0.5) {
      const draftPct = Math.round(draftRatio * 100);
      lines.push(`📝 Còn ${draftCount}/${totalExams} bài thi (${draftPct}%) chưa công bố — cần xem lại.`);
    }

    const avgSubmissions = Math.round((totalSubmissions / totalExams) * 10) / 10;
    lines.push(`📈 Trung bình ${avgSubmissions} lượt nộp mỗi bài thi.`);
  }

  return lines.join("\n");
}

async function buildSystemOverviewText() {
  const overview = await getSystemOverview();
  if (!overview) return "❌ Không lấy được số liệu hệ thống";

  const { totalUsers, totalCourses, totalExams, publishedExams, totalQuestions, totalSubmissions, integrity } = overview;

  return (
    `📊 System Overview\n` +
    `🏷️ Version: ${ZALO_APP_VERSION}\n\n` +
    `👥 Tổng số người dùng: ${totalUsers}\n` +
    `📚 Tổng số khóa học: ${totalCourses}\n` +
    `📝 Tổng số bài thi: ${totalExams} (Đã công bố: ${publishedExams})\n` +
    `❓ Tổng số câu hỏi: ${totalQuestions}\n` +
    `📥 Tổng số lượt nộp: ${totalSubmissions}\n\n` +
    `🛡️ Giám sát rủi ro\n` +
    `• Tổng tín hiệu: ${integrity.totalFlagged}\n` +
    `• Chờ xem xét: ${integrity.pendingReview}\n` +
    `• Mức tín hiệu cao: ${integrity.highConfidence}\n` +
    `• Đã xác nhận: ${integrity.confirmedCases}\n\n` +
    `🔎 Nhận xét\n` +
    buildSystemOverviewConclusions(overview)
  );
}

async function buildBeInfoText() {
  const [beRun, aiStatus] = await Promise.all([
    getLatestWorkflowRun(GITHUB_WORKFLOW_FILE_BE),
    getAiStatus(),
  ]);
  const aiLine = aiStatus ? `🧠 AI: ${aiStatus.provider} (${aiStatus.model})` : `🧠 AI: ?`;
  return (
    `🖥️ BE Info\n` +
    `🏗️ Build Status: ${formatBuildStatus(beRun)}\n\n` +
    `${aiLine}\n` +
    `💰 AWS Console: ${ZALO_AWS_CONSOLE_URL}`
  );
}

async function buildPublicInfoText() {
  const [enabled, requests, obsEvents, buildMinutes, feRun, beRun, aiStatus] = await Promise.all([
    getFeSubdomainEnabled(),
    getTodayRequestCount(),
    getTodayObservabilityEventCount(),
    getThisMonthBuildMinutes(),
    getLatestWorkflowRun(GITHUB_WORKFLOW_FILE),
    getLatestWorkflowRun(GITHUB_WORKFLOW_FILE_BE),
    getAiStatus(),
  ]);
  const fmt = (n, fallback = "?") => (n === null ? fallback : n.toLocaleString("en-US"));
  const statusLabel = enabled === null ? "?" : enabled ? "On" : "Off";
  const buildMinutesNote = buildMinutes === 0 ? " (deploy chạy qua GitHub Actions, không tính vào đây)" : "";
  const aiLine = aiStatus ? `🧠 AI: ${aiStatus.provider} (${aiStatus.model})` : `🧠 AI: ?`;
  return (
    `🖥️ FE Info\n` +
    `🏷️ Version: ${ZALO_APP_VERSION}\n` +
    `🔗 Link: ${ZALO_FE_URL} (${statusLabel})\n` +
    `🏗️ Build Status: ${formatBuildStatus(feRun)}\n\n` +
    `📊 Cloudflare Usage\n` +
    `• Requests today: ${fmt(requests)} / 100,000\n` +
    `• Observability events today: ${fmt(obsEvents)} / 200,000\n\n` +
    // `• Workers build minutes this month: ${fmt(buildMinutes)} / 3,000${buildMinutesNote}\n\n` +
    `--------------------\n\n` +
    `🖥️ BE Info\n` +
    `🏗️ Build Status: ${formatBuildStatus(beRun)}\n\n` +
    `${aiLine}`
  );
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
  const text = normalizeCommand(body?.message?.text);
  const chatId = body?.message?.chat?.id;

  console.log(
    "Incoming text:",
    JSON.stringify(body?.message?.text ?? ""),
    "-> normalized:",
    JSON.stringify(text),
    "from:",
    senderId,
  );

  // "Info" and "System Overview" are available to everyone, no owner check
  // required — Info gives the owner the full FE+BE detail (Cloudflare usage,
  // AWS console link) while anyone else only gets the stripped-down public
  // status; System Overview has no sensitive infra detail so it's identical
  // for everyone.
  if (body?.event_name === "message.text.received") {
    if (text === normalizeCommand(ZALO_PUBLIC_INFO_COMMAND)) {
      if (senderId === ZALO_ALLOWED_USER_ID) {
        const [feText, beText] = await Promise.all([buildFeInfoText(), buildBeInfoText()]);
        await replyToZalo(chatId, `${feText}\n\n--------------------\n\n${beText}`);
      } else {
        await replyToZalo(chatId, await buildPublicInfoText());
      }
      return ok;
    }

    if (text === normalizeCommand(ZALO_SYSTEM_OVERVIEW_COMMAND)) {
      await replyToZalo(chatId, await buildSystemOverviewText());
      return ok;
    }
  }

  if (senderId !== ZALO_ALLOWED_USER_ID) {
    console.warn("Rejected: unknown sender", senderId);
    if (body?.event_name === "message.text.received") {
      await replyToZalo(
        chatId,
        `🤖 Vui lòng chọn một trong các lệnh sau:\n` +
          `• ${ZALO_SYSTEM_OVERVIEW_COMMAND}\n` +
          `• ${ZALO_PUBLIC_INFO_COMMAND}`,
      );
    }
    return ok;
  }

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
      await replyToZalo(chatId, await buildFeInfoText());
    } else if (text === normalizeCommand(ZALO_USAGE_BE_COMMAND)) {
      await replyToZalo(chatId, await buildBeInfoText());
    } else if (text === normalizeCommand(ZALO_USAGE_R2_COMMAND)) {
      await replyToZalo(chatId, await buildR2InfoText());
    } else if (text === normalizeCommand(ZALO_RESET_DB_COMMAND)) {
      const lastRunAgeMs = await getLastRunAgeMs(GITHUB_WORKFLOW_FILE_RESET_DB);
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa reset xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerDeploy(GITHUB_WORKFLOW_FILE_RESET_DB);
        await replyToZalo(
          chatId,
          dispatched
            ? "⚠️ Đang XÓA SẠCH database production và seed lại data demo..."
            : "❌ Trigger lỗi rồi",
        );
      }
    } else if (
      text === normalizeCommand(ZALO_CLEAR_QUESTIONS_COMMAND) ||
      text === normalizeCommand(ZALO_CLEAR_EVIDENCE_COMMAND) ||
      text === normalizeCommand(ZALO_CLEAR_ALL_STORAGE_COMMAND)
    ) {
      const target =
        text === normalizeCommand(ZALO_CLEAR_QUESTIONS_COMMAND)
          ? "questions"
          : text === normalizeCommand(ZALO_CLEAR_EVIDENCE_COMMAND)
            ? "evidence"
            : "all";
      const lastRunAgeMs = await getLastRunAgeMs(GITHUB_WORKFLOW_FILE_CLEAR_STORAGE);
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa xóa xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerDeploy(GITHUB_WORKFLOW_FILE_CLEAR_STORAGE, { target });
        await replyToZalo(
          chatId,
          dispatched
            ? `⚠️ Đang XÓA VĨNH VIỄN toàn bộ tệp trong "${target}" trên R2 (chỉ tệp, không đụng dữ liệu trong database)...`
            : "❌ Trigger lỗi rồi",
        );
      }
    } else if (
      text === normalizeCommand(ZALO_AI_DEEPSEEK_COMMAND) ||
      text === normalizeCommand(ZALO_AI_OPENROUTER_COMMAND)
    ) {
      const provider = text === normalizeCommand(ZALO_AI_DEEPSEEK_COMMAND) ? "deepseek" : "openrouter";
      const lastRunAgeMs = await getLastRunAgeMs(GITHUB_WORKFLOW_FILE_SWITCH_AI);
      if (lastRunAgeMs !== null && lastRunAgeMs < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - lastRunAgeMs) / 1000);
        await replyToZalo(chatId, `⏳ Vừa đổi xong, đợi ${waitSec}s rồi thử lại nhé`);
      } else {
        const dispatched = await triggerDeploy(GITHUB_WORKFLOW_FILE_SWITCH_AI, { provider });
        await replyToZalo(
          chatId,
          dispatched
            ? `🔄 Đang chuyển AI provider sang ${provider}, BE sẽ tự restart để nhận cấu hình mới...`
            : "❌ Trigger lỗi rồi",
        );
      }
    } else {
      await replyToZalo(
        chatId,
        `🤖 Vui lòng chọn một trong các lệnh sau:\n\n` +
        `🖥️ Hệ Thống\n` +
        `• ${ZALO_SYSTEM_OVERVIEW_COMMAND}\n` +
        `• ${ZALO_PUBLIC_INFO_COMMAND}\n\n` +
        `--------------------\n\n` +
        `⚙️ DevOps\n` +
        `• ${ZALO_BUILD_FE_COMMAND}\n` +
        `• ${ZALO_BUILD_BE_COMMAND}\n` +
        `• On / Off FE\n` +
        `• ${ZALO_USAGE_FE_COMMAND} / ${ZALO_USAGE_BE_COMMAND} / ${ZALO_USAGE_R2_COMMAND}\n` +
        `• ${ZALO_AI_DEEPSEEK_COMMAND} / ${ZALO_AI_OPENROUTER_COMMAND}\n` +
        `• ${ZALO_RESET_DB_COMMAND} (⚠️ xóa sạch DB + seed lại)\n` +
        `• ${ZALO_CLEAR_QUESTIONS_COMMAND} / ${ZALO_CLEAR_EVIDENCE_COMMAND} / ${ZALO_CLEAR_ALL_STORAGE_COMMAND} (⚠️ xóa vĩnh viễn tệp trên R2)`,
      );
    }
  }

  return ok;
};