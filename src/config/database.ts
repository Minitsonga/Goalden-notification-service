import mongoose from "mongoose";

const DEFAULT_URI =
  "mongodb://127.0.0.1:27017/goalden_notification";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGO_URI?.trim() || DEFAULT_URI;
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
