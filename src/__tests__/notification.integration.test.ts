import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { NotificationLog } from "../models/NotificationLog.js";

let mongoServer: MongoMemoryServer;
let app: import("express").Express;

const SERVICE_JWT_SECRET = "notif-test-service-jwt";

function serviceToken(serviceId = "social-service") {
  return jwt.sign(
    { serviceId, scope: "internal", permissions: ["notification:write"] },
    SERVICE_JWT_SECRET,
    { expiresIn: "15m" },
  );
}

describe("notification-service HTTP", () => {
  beforeAll(async () => {
    await jest.unstable_mockModule("nodemailer", () => ({
      default: {
        createTransport: () => ({
          sendMail: async () => ({ messageId: "jest-smtp-mock-id" }),
        }),
      },
    }));

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.SERVICE_JWT_SECRET = SERVICE_JWT_SECRET;
    process.env.SMTP_HOST = "sandbox.smtp.mailtrap.test";
    process.env.SMTP_USER = "test-user";
    process.env.SMTP_PASS = "test-pass";
    process.env.SMTP_PORT = "2525";
    process.env.SMTP_SECURE = "false";
    process.env.NODE_ENV = "test";

    await mongoose.connect(process.env.MONGO_URI);

    const mod = await import("../app.js");
    app = mod.default;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it("returns 401 without service token on internal route", async () => {
    const res = await request(app).post("/internal/send-email").send({
      to: "a@b.com",
      subject: "Hello world",
      text: "Body",
    });
    expect(res.status).toBe(401);
  });

  it("accepts send-email with valid service JWT (SMTP mocked)", async () => {
    const res = await request(app)
      .post("/internal/send-email")
      .set("Authorization", `Bearer ${serviceToken()}`)
      .send({
        to: "coach@example.com",
        subject: "Test subject",
        text: "Plain text",
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accepted).toBe(true);

    const count = await NotificationLog.countDocuments();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
