import express from "express";
import cors from "cors";
import morgan from "morgan";
import internalRoutes from "./routes/internal.routes.js";
import serviceAuthMiddleware from "./middleware/serviceAuth.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();
const ACTION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use((req, res, next) => {
  if (!ACTION_METHODS.has(req.method) || req.path === "/health") {
    return next();
  }

  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(
      `[notification-service] action=${req.method} ${req.originalUrl} status=${res.statusCode} durationMs=${durationMs}`,
    );
  });

  return next();
});

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { service: "notification-service", status: "ok" } });
});

app.use("/internal", serviceAuthMiddleware, internalRoutes);

app.use((req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

app.use(errorHandler);

export default app;
