import type { NextFunction, Request, Response } from "express";

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

export function asyncHandler(fn: AsyncHandler) {
  return function wrapped(req: Request, res: Response, next: NextFunction): void {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
