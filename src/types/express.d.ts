import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    service?: {
      serviceId: string;
      scope: string;
    };
  }
}

export {};
