import mongoose, { Schema } from "mongoose";

export type NotificationKind = "TRANSACTIONAL" | "SELECTION";
export type NotificationStatus = "SENT" | "FAILED";

const notificationLogSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["TRANSACTIONAL", "SELECTION"],
      required: true,
    },
    recipients: { type: [String], required: true },
    subject: { type: String, required: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["SENT", "FAILED"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["smtp"],
      required: true,
    },
    sourceService: { type: String, required: true, default: "unknown-service" },
    messageId: { type: String, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    payloadMeta: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true },
);

notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ sourceService: 1, createdAt: -1 });

export const NotificationLog =
  mongoose.models.NotificationLog ??
  mongoose.model("NotificationLog", notificationLogSchema);
