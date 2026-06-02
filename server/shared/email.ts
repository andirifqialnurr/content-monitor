type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const webhookUrl = getEmailWebhookUrl();

  if (!webhookUrl) {
    return { sent: false, reason: "EMAIL_WEBHOOK_NOT_CONFIGURED" as const };
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), parseEmailWebhookTimeoutMs());

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: getEmailWebhookHeaders(),
    body: JSON.stringify({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
    signal: abortController.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Email webhook failed with status ${response.status}.`);
  }

  return { sent: true, reason: null };
}

export function isEmailWebhookConfigured() {
  return Boolean(getEmailWebhookUrl());
}

function getEmailWebhookHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = process.env.EMAIL_WEBHOOK_TOKEN ?? process.env.RESET_EMAIL_WEBHOOK_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getEmailFrom() {
  return process.env.RESET_EMAIL_FROM ?? process.env.EMAIL_FROM ?? "";
}

function getEmailWebhookUrl() {
  return process.env.EMAIL_WEBHOOK_URL ?? process.env.RESET_EMAIL_WEBHOOK_URL ?? "";
}

function parseEmailWebhookTimeoutMs() {
  const timeoutMs = Number(process.env.EMAIL_WEBHOOK_TIMEOUT_MS ?? 8000);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 8000;
}
