import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
