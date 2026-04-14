# notification-service

SMTP notification service for Goalden internal workflows.

## Features

- Internal endpoints secured by service JWT (`scope=internal`)
- Transactional email sending through SMTP
- Selection email template endpoint
- Notification delivery logs stored in Postgres (`goalden_notification`)

## Endpoints

- `GET /health`
- `POST /internal/send-email`
- `POST /internal/send-selection`

## Environment

See `.env.example`.

Required variables:

- `SERVICE_JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `DATABASE_URL` (or `PG*`)

## Local run

```bash
npm install
npm run dev
```

Default port: `3006`.
