import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

function unauthorized(message: string): Error & { statusCode: number; code: string } {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 401;
  error.code = "UNAUTHORIZED";
  return error;
}

function forbidden(message: string): Error & { statusCode: number; code: string } {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 403;
  error.code = "FORBIDDEN";
  return error;
}

type ServiceTokenPayload = {
  serviceId?: string;
  scope?: string;
};

export function serviceAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(unauthorized("Service token required"));
    return;
  }

  const secret = process.env.SERVICE_JWT_SECRET;
  if (!secret) {
    const error = new Error("Service auth not configured") as Error & {
      statusCode: number;
      code: string;
    };
    error.statusCode = 503;
    error.code = "SERVICE_UNAVAILABLE";
    next(error);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, secret) as ServiceTokenPayload;
    if (decoded.scope !== "internal") {
      next(forbidden("Invalid token scope"));
      return;
    }

    req.service = {
      serviceId: typeof decoded.serviceId === "string" ? decoded.serviceId : "unknown-service",
      scope: decoded.scope ?? "internal",
    };

    next();
  } catch {
    next(unauthorized("Invalid or expired service token"));
  }
}

export default serviceAuthMiddleware;
