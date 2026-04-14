import type { NextFunction, Request, Response } from "express";
import type { ValidationError } from "joi";

type NormalisedError = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

function normaliseError(err: unknown): NormalisedError {
  if (!err) {
    return {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "An unknown error occurred",
    };
  }

  const maybeJoi = err as Partial<ValidationError> & { isJoi?: boolean };
  if (maybeJoi.isJoi) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: maybeJoi.details?.map((detail) => detail.message) ?? undefined,
    };
  }

  const anyErr = err as {
    statusCode?: number;
    status?: number;
    code?: string;
    message?: string;
    details?: unknown;
  };

  return {
    statusCode: anyErr.statusCode || anyErr.status || 500,
    code: anyErr.code || "INTERNAL_ERROR",
    message: anyErr.message || "Internal error",
    details: anyErr.details,
  };
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
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
