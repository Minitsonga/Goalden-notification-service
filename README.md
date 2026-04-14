# notification-service

Service d’**emails transactionnels** (SMTP uniquement) pour les flux internes Goalden.

## Cadrage

Conforme au **PRD** (NFR-INT1) et au **guide Goalden** (§7.6) : envoi via **SMTP configurable**. En développement, un compte **Mailtrap** (sandbox gratuit) suffit : créer une inbox, récupérer `SMTP_USER` / `SMTP_PASS`.

- Endpoints internes : `POST /internal/send-email`, `POST /internal/send-selection`.
- Sécurité : **JWT service** sur `/internal/*`.
- Logs : **MongoDB** (`goalden_notification`).

## Variables

Voir [`.env.example`](./.env.example).

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
npm test
```
