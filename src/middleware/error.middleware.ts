import type { NextFunction, Request, Response } from "express";
import Joi from "joi";

function normaliseError(err: unknown): {
  statusCode: number;
  code: string;
  message: string;
  details?: string[];
} {
  if (!err) {
    return {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "An unknown error occurred",
    };
  }
  if (Joi.isError(err)) {
    const maybeJoi = err;
    const details = maybeJoi.details?.map((d) => d.message);
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      ...(details && details.length > 0 ? { details } : {}),
    };
  }
  const anyErr = err as {
    statusCode?: number;
    status?: number;
    code?: string;
    message?: string;
    details?: string[];
  };
  return {
    statusCode: anyErr.statusCode ?? anyErr.status ?? 500,
    code: anyErr.code ?? "INTERNAL_ERROR",
    message: anyErr.message ?? "Internal error",
    ...(anyErr.details && anyErr.details.length > 0 ? { details: anyErr.details } : {}),
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const normalised = normaliseError(err);
  if (normalised.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[notification-service] Unexpected error", {
      code: normalised.code,
      message: normalised.message,
      path: req.path,
    });
  }
  res.status(normalised.statusCode).json({
    success: false,
    error: {
      code: normalised.code,
      message: normalised.message,
      ...(normalised.details ? { details: normalised.details } : {}),
    },
  });
}

export default errorHandler;
