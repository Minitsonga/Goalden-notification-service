# Notification Service

Service d'emails transactionnels de Goalden (SMTP), expose uniquement des routes internes securisees.

## Ce que le service fait

- Envoie des emails transactionnels generiques.
- Envoie des notifications de publication de selection.
- Journalise les envois en base MongoDB (`goalden_notification`).
- Protege toutes les routes internes via JWT de service.

## Endpoints principaux

- `POST /internal/send-email` : envoi d'email standard.
- `POST /internal/send-selection` : envoi lie aux selections d'equipe.
- `GET /health` : etat du service.

## Interactions avec les autres services

### Sortantes (notification-service -> autres)

- Aucune dependance inter-service sortante (SMTP + DB uniquement).

### Entrantes (autres -> notification-service)

- `gateway` appelle `POST /internal/send-email` (mutation GraphQL `sendDemoEmail`).
- `social-service` appelle `POST /internal/send-selection` en best-effort apres publication d'une selection.

## Stack technique

- Node.js + TypeScript (Express).
- MongoDB (Mongoose) pour les logs.
- SMTP configurable (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- JWT service (`SERVICE_JWT_SECRET`) pour l'auth inter-services.

## Demarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

Variables: voir `.env.example`.
