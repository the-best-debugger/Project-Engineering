# AI Chatbot (Challenge 1.12)

## What I Built
A minimal AI chatbot with a Node.js Express backend and a React (Vite) frontend. The frontend sends the **full** conversation history (`messages[]`) to the backend on every turn, so the model can respond with context.

## API and Model
**API:** OpenRouter (`/api/v1/chat/completions`)  
**Model:** `openai/gpt-4o-mini`

## Why the backend makes the AI call (not the frontend)
If the API call is made from frontend JavaScript, the API key can be copied by anyone from the browser (DevTools / network tab) and then abused to spend your credits or impersonate your app. A backend proxy keeps the key server-side and never exposes it to users.

## Fallback provider (if OpenRouter credits run out)
**Provider:** Google Gemini (OpenAI-compatible endpoint)  
**Two code changes:**  
- Change the base URL from `https://openrouter.ai/api/v1/chat/completions` to `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`  
- Change the model name from `openai/gpt-4o-mini` to `gemini-1.5-flash` (and read the key from `process.env.GEMINI_API_KEY`)

## Live Deployment
**Frontend:** <!-- add Netlify/Vercel URL -->  
**Backend:** <!-- add Render URL -->

## Run Locally

### Backend
1. Create `backend/.env` (do not commit it):

```bash
cp backend/.env.example backend/.env
```

2. Put your real key in `backend/.env`:
- `OPENROUTER_API_KEY=...`

3. Start the server:

```bash
cd backend
npm install
npm start
```

### Frontend
Start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

By default the frontend calls your backend at `http://localhost:3002/chat` (via `VITE_CHAT_BACKEND_URL` in `frontend/.env.example`). After deployment, set `VITE_CHAT_BACKEND_URL` to your live backend `/chat` endpoint.
