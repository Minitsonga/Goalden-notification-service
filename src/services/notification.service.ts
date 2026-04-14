import nodemailer from "nodemailer";
import NotificationLog from "../models/NotificationLog.js";
import type { SendEmailPayload, SendSelectionPayload } from "../validators/notification.validators.js";

function asArray(recipients: string | string[]): string[] {
  return Array.isArray(recipients) ? recipients : [recipients];
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
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

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

  if (!host || !user || !pass) {
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
    auth: {
      user,
      pass,
    },
  });
}

function buildSelectionHtml(payload: SendSelectionPayload): string {
  const summary = payload.selectionSummary
    ? `<p><strong>Summary:</strong> ${payload.selectionSummary}</p>`
    : "";

  return `
    <h2>Official selection published</h2>
    <p><strong>Team:</strong> ${payload.teamName}</p>
    <p><strong>Event:</strong> ${payload.eventName}</p>
    <p><strong>Date:</strong> ${payload.eventDate}</p>
    ${summary}
  `;
}

export async function sendTransactionalEmail(
  payload: SendEmailPayload,
  sourceService: string
): Promise<{ sent: true; messageId: string | null }> {
  const transporter = createTransporter();
  const to = asArray(payload.to);
  const from = process.env.SMTP_FROM || "no-reply@goalden.local";

  try {
    const result = await transporter.sendMail({
      from,
      to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    await NotificationLog.create({
      kind: "TRANSACTIONAL",
      recipients: to,
      subject: payload.subject,
      status: "SENT",
      sourceService,
      messageId: result.messageId ?? null,
      payloadMeta: payload.meta || {},
    });

    return {
      sent: true,
      messageId: result.messageId ?? null,
    };
  } catch (error: unknown) {
    const anyErr = error as { code?: string; message?: string };
    await NotificationLog.create({
      kind: "TRANSACTIONAL",
      recipients: to,
      subject: payload.subject,
      status: "FAILED",
      sourceService,
      errorCode: anyErr.code || null,
      errorMessage: anyErr.message || "SMTP delivery failure",
      payloadMeta: payload.meta || {},
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
  payload: SendSelectionPayload,
  sourceService: string
): Promise<{ sent: true; messageId: string | null }> {
  const subject = `[Selection] ${payload.teamName} - ${payload.eventName}`;

  return sendTransactionalEmail(
    {
      to: payload.to,
      subject,
      text: `Official selection for ${payload.teamName} (${payload.eventName}) on ${payload.eventDate}.`,
      html: buildSelectionHtml(payload),
      meta: {
        ...payload.meta,
        teamName: payload.teamName,
        eventName: payload.eventName,
        eventDate: payload.eventDate,
      },
    },
    sourceService
  );
}

