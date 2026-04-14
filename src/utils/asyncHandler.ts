import type { NextFunction, Request, Response } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return function wrapped(req: Request, res: Response, next: NextFunction): void {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
