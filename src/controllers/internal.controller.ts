import type { Request, Response } from "express";
import {
  sendEmailSchema,
  sendSelectionSchema,
  validateBody,
} from "../validators/notification.validators.js";
import {
  sendSelectionNotification,
  sendTransactionalEmail,
} from "../services/notification.service.js";

export async function sendEmail(req: Request, res: Response): Promise<void> {
  const payload = validateBody(sendEmailSchema, req.body ?? {});
  const sourceService = req.service?.serviceId ?? "unknown-service";
  const result = await sendTransactionalEmail(payload, sourceService);
  res.status(202).json({
    success: true,
    data: {
      accepted: result.sent,
      messageId: result.messageId,
    },
  });
}

export async function sendSelection(req: Request, res: Response): Promise<void> {
  const payload = validateBody(sendSelectionSchema, req.body ?? {});
  const sourceService = req.service?.serviceId ?? "unknown-service";
  const result = await sendSelectionNotification(payload, sourceService);
  res.status(202).json({
    success: true,
    data: {
      accepted: result.sent,
      messageId: result.messageId,
    },
  });
}
