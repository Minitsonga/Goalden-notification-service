import "express";

declare global {
  namespace Express {
    interface Request {
      service?: {
        serviceId: string;
        scope: string;
      };
    }
  }
}

export {};
