import nodemailer from "nodemailer";
import type { Model } from "mongoose";
import { NotificationLog } from "../models/NotificationLog.js";
import type { NotificationKind } from "../models/NotificationLog.js";

function asArray(recipients: string | string[]): string[] {
  return Array.isArray(recipients) ? recipients : [recipients];
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  const lower = String(value).toLowerCase().trim();
  if (["1", "true", "yes", "on"].includes(lower)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(lower)) {
    return false;
  }
  return fallback;
}

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  if (!host || !user || !pass) {
    // En dev/test, on autorise un transport "stub" pour valider le flux end-to-end
    // sans dépendre d'un vrai provider SMTP.
    if ((process.env.NODE_ENV ?? "development") !== "production") {
      return nodemailer.createTransport({ jsonTransport: true });
    }
    const error = new Error("SMTP configuration is incomplete") as Error & {
      statusCode: number;
      code: string;
    };
    error.statusCode = 503;
    error.code = "SERVICE_UNAVAILABLE";
    throw error;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function buildSelectionHtml(payload: {
  teamName: string;
  eventName: string;
  eventDate: string;
  selectionSummary?: string;
}): string {
  const summary = payload.selectionSummary
    ? `<p><strong>Résumé :</strong> ${payload.selectionSummary}</p>`
    : "";
  return `
    <h2>Sélection officielle publiée</h2>
    <p><strong>Équipe :</strong> ${payload.teamName}</p>
    <p><strong>Événement :</strong> ${payload.eventName}</p>
    <p><strong>Date :</strong> ${payload.eventDate}</p>
    ${summary}
  `;
}

async function persistLog(input: {
  kind: NotificationKind;
  recipients: string[];
  subject: string;
  status: "SENT" | "FAILED";
  provider: "smtp";
  sourceService: string;
  messageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  payloadMeta: Record<string, unknown>;
}): Promise<void> {
  const Log = NotificationLog as Model<Record<string, unknown>>;
  await Log.create({
    kind: input.kind,
    recipients: input.recipients,
    subject: input.subject,
    status: input.status,
    provider: input.provider,
    sourceService: input.sourceService,
    messageId: input.messageId,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    payloadMeta: input.payloadMeta,
  });
}

export async function sendTransactionalEmail(
  payload: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    meta?: Record<string, unknown>;
  },
  sourceService: string,
  kind: NotificationKind = "TRANSACTIONAL",
): Promise<{ sent: boolean; messageId: string | null }> {
  const to = asArray(payload.to);
  const from = process.env.SMTP_FROM || "no-reply@goalden.local";
  // eslint-disable-next-line no-console
  console.log(
    `[notification-service] email_prepare kind=${kind} source=${sourceService} recipients=${to.length} subject="${payload.subject}"`,
  );
  const transporter = createSmtpTransporter();
  try {
    // eslint-disable-next-line no-console
    console.log(
      `[notification-service] email_send_start kind=${kind} source=${sourceService} recipients=${to.join(",")}`,
    );
    const result = await transporter.sendMail({
      from,
      to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[notification-service] email_send_success kind=${kind} source=${sourceService} messageId=${result.messageId ?? "n/a"}`,
    );
    await persistLog({
      kind,
      recipients: to,
      subject: payload.subject,
      status: "SENT",
      provider: "smtp",
      sourceService,
      messageId: result.messageId ?? null,
      errorCode: null,
      errorMessage: null,
      payloadMeta: payload.meta ?? {},
    });
    return { sent: true, messageId: result.messageId ?? null };
  } catch (error: unknown) {
    const anyErr = error as { code?: string; message?: string };
    // eslint-disable-next-line no-console
    console.error(
      `[notification-service] email_send_failure kind=${kind} source=${sourceService} code=${anyErr.code ?? "UNKNOWN"} message="${anyErr.message ?? "SMTP delivery failure"}"`,
    );
    await persistLog({
      kind,
      recipients: to,
      subject: payload.subject,
      status: "FAILED",
      provider: "smtp",
      sourceService,
      messageId: null,
      errorCode: anyErr.code ?? null,
      errorMessage: anyErr.message ?? "SMTP delivery failure",
      payloadMeta: payload.meta ?? {},
    });
    const wrappedError = new Error("Email delivery failed") as Error & {
      statusCode: number;
      code: string;
    };
    wrappedError.statusCode = 503;
    wrappedError.code = "SERVICE_UNAVAILABLE";
    throw wrappedError;
  }
}

export async function sendSelectionNotification(
  payload: {
    to: string | string[];
    teamName: string;
    eventName: string;
    eventDate: string;
    selectionSummary?: string;
    meta?: Record<string, unknown>;
  },
  sourceService: string,
): Promise<{ sent: boolean; messageId: string | null }> {
  const subject = `[Sélection] ${payload.teamName} - ${payload.eventName}`;
  return sendTransactionalEmail(
    {
      to: payload.to,
      subject,
      text: `Sélection officielle pour ${payload.teamName} (${payload.eventName}) le ${payload.eventDate}.`,
      html: buildSelectionHtml(payload),
      meta: {
        ...payload.meta,
        teamName: payload.teamName,
        eventName: payload.eventName,
        eventDate: payload.eventDate,
      },
    },
    sourceService,
    "SELECTION",
  );
}
