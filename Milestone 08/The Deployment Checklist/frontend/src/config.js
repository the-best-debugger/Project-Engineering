// VITE_API_BASE_URL is set at build time (Render) or in frontend/.env for local dev.
// RENDER_EXTERNAL_URL is the host only — ensure /api suffix for Express routes.
const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_BASE = raw.endsWith('/api')
  ? raw
  : `${raw.replace(/\/$/, '')}/api`;
