import type { Request, Response } from "express";
import {
  sendSelectionSchema,
  sendEmailSchema,
  validateBody,
  type SendEmailPayload,
  type SendSelectionPayload,
} from "../validators/notification.validators.js";
import {
  sendSelectionNotification,
  sendTransactionalEmail,
} from "../services/notification.service.js";

export async function sendEmail(req: Request, res: Response): Promise<Response> {
  const payload = validateBody<SendEmailPayload>(sendEmailSchema, req.body || {});
  const sourceService = req.service?.serviceId || "unknown-service";

  const result = await sendTransactionalEmail(payload, sourceService);
  return res.status(202).json({
    success: true,
    data: {
      accepted: result.sent,
      messageId: result.messageId,
    },
  });
}

export async function sendSelection(req: Request, res: Response): Promise<Response> {
  const payload = validateBody<SendSelectionPayload>(sendSelectionSchema, req.body || {});
  const sourceService = req.service?.serviceId || "unknown-service";

  const result = await sendSelectionNotification(payload, sourceService);
  return res.status(202).json({
    success: true,
    data: {
      accepted: result.sent,
      messageId: result.messageId,
    },
  });
}

