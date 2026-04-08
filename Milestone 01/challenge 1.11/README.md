# Dev Confessions

An anonymous confession app for developers to share their bugs, deadline stress, imposter syndrome, and vibe-coding sessions.

## Live demo

_Add the deployed URL here after Move 8 (e.g. `https://your-app.onrender.com`)._

## Setup

1. Copy `.env.example` to `.env` and adjust values if needed (required for `DELETE` with `x-delete-token`).
2. `npm install && npm start`

## Endpoints

- GET /api/v1/confessions
- POST /api/v1/confessions
- GET /api/v1/confessions/:id
- GET /api/v1/confessions/category/:cat
- DELETE /api/v1/confessions/:id

Configuration (port, categories, delete token) comes from environment variables — see `.env.example` and `CHANGES.md`.
