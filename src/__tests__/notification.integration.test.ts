import jwt from "jsonwebtoken";
import request from "supertest";
import { jest } from "@jest/globals";

const sendMailMock = jest.fn<Promise<{ messageId: string }>, unknown[]>();
const createMock = jest.fn<Promise<unknown>, [unknown]>();

jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: sendMailMock,
    })),
  },
}));

jest.unstable_mockModule("../models/NotificationLog.js", () => ({
  default: {
    create: createMock,
  },
}));

const { default: app } = await import("../app.js");

function signServiceToken(payload: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      scope: "internal",
      serviceId: "social-service",
      ...payload,
    },
    process.env.SERVICE_JWT_SECRET as string
  );
}

describe("notification-service internal routes", () => {
  beforeEach(() => {
    process.env.SERVICE_JWT_SECRET = "test-service-secret";
    process.env.SMTP_HOST = "smtp.test.local";
    process.env.SMTP_PORT = "2525";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    process.env.SMTP_FROM = "no-reply@test.local";
    sendMailMock.mockReset();
    createMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: "mail-1" });
    createMock.mockResolvedValue({});
  });

  it("returns 401 when service token is missing", async () => {
    const response = await request(app).post("/internal/send-email").send({
      to: "player@example.com",
      subject: "Hello",
      text: "Test",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("accepts transactional email when token is valid", async () => {
    const token = signServiceToken();

    const response = await request(app)
      .post("/internal/send-email")
      .set("Authorization", `Bearer ${token}`)
      .send({
        to: ["player@example.com", "coach@example.com"],
        subject: "Match reminder",
        text: "Training starts at 18:00.",
      });

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accepted).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

