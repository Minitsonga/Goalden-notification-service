import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

dotenv.config();

const port = process.env.PORT || 3006;

async function start(): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "test") {
      await connectDatabase();
      app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[notification-service] Listening on port ${port}`);
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[notification-service] Failed to start service", error);
    process.exit(1);
  }
}

void start();

export default app;

