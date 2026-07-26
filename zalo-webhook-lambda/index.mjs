import crypto from "node:crypto";

const {
  ZALO_WEBHOOK_SECRET,
  ZALO_ALLOWED_USER_ID,
  ZALO_BUILD_FE_COMMAND = "build fe",
  GITHUB_PAT,
  GITHUB_REPO = "OAB710/ExamTrust-Deployment",
  GITHUB_WORKFLOW_FILE = "deploy-fe.yml",
} = process.env;

function safeEqual(a, b) {
  const bufA = Buffer.from(a ?? "", "utf8");
  const bufB = Buffer.from(b ?? "", "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function triggerFeDeploy() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error("GitHub dispatch failed", resp.status, text);
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
  if (body?.event_name === "message.text.received" && text === ZALO_BUILD_FE_COMMAND.toLowerCase()) {
    await triggerFeDeploy();
  }

  return ok;
};
