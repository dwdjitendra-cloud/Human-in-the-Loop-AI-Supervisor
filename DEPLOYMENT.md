# Deployment Guide: Render (Backend) + Vercel (Frontend)

This project is split into two apps:
- Backend (Express API) in `backend/`
- Frontend (React + Vite) in `frontend/`

Below are the steps to redeploy reliably to Render (backend) and Vercel (frontend).

---

## 1) Backend on Render

Create a new Web Service on Render that points to the `backend` folder.

- Repository: your GitHub repo
- Root Directory: `backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Instance Type: your choice (Free works for testing)
- Health Check Path: `/api/health`

Environment variables (set in Render → Settings → Environment):

Required:
- `MONGODB_URI` = your MongoDB connection string
- `OPENAI_API_KEY` = your OpenAI API Key (if using server STT/TTS or Chat)
- `JWT_SECRET` = any strong secret (used by auth routes)

Optional, recommended:
- `TTS_VOICE` = default TTS voice (e.g., `verse`, `alloy`)
- `LIVEKIT_API_KEY` = LiveKit API key (for token issuing)
- `LIVEKIT_API_SECRET` = LiveKit API secret (for token issuing)
- `CORS_ORIGIN` = comma-separated allowed origins for the frontend (e.g., `https://your-app.vercel.app,https://your-staging.vercel.app`)

Notes:
- The server binds to `process.env.PORT` automatically (Render sets this). No changes needed.
- CORS is open by default; if you set `CORS_ORIGIN`, only those origins will be allowed.

After the first deploy, visit:
- `https://<your-render-app>.onrender.com/api/health` → should return `{ success: true }`

---

## 2) Frontend on Vercel

Create a new Project in Vercel that points to the `frontend` folder.

- Framework Preset: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables (set in Vercel → Settings → Environment Variables):

Required:
- `VITE_API_BASE_URL` = `https://<your-render-app>.onrender.com/api`

Optional:
- `VITE_LIVEKIT_URL` = your LiveKit URL (e.g., `wss://<your-livekit>.livekit.cloud`)

Optional (no env needed): Rewrites
- If you prefer not to set `VITE_API_BASE_URL`, you can add `frontend/vercel.json` with rewrites that proxy API calls to Render. This repo includes an example mapping like:
  - `/help-requests/*` → `https://<render>.onrender.com/api/help-requests/*`
  - `/knowledge-base/*` → `https://<render>.onrender.com/api/knowledge-base/*`
  - `/supervisors/*` → `https://<render>.onrender.com/api/supervisors/*`
  - `/voice/*` → `https://<render>.onrender.com/api/voice/*`
  - `/livekit/*` → `https://<render>.onrender.com/api/livekit/*`
  - `/simulate-call` → `https://<render>.onrender.com/api/simulate-call`
  This lets relative calls work in production even if `VITE_API_BASE_URL` is missing.

Notes:
- The frontend now requires `VITE_API_BASE_URL` in production; we removed a brittle hard-coded fallback.
- The browser voice fallback (Web Speech) requires HTTPS, which Vercel provides.

After the first deploy, open your Vercel URL and test:
- Live Voice page → "Test server voice" button (when `VITE_API_BASE_URL` and OpenAI key are set)
- Or toggle "Use browser STT/TTS" and try the browser-only path

---

## 3) Local development vs production

- Local dev: Frontend defaults to `http://localhost:5000/api` when VITE_API_BASE_URL is not set and running on localhost.
- Production: Set `VITE_API_BASE_URL` to your Render backend URL.

If you see `ERR_CONNECTION_REFUSED` locally:
- Make sure the backend is running on port 5000, or set `VITE_API_BASE_URL` to your Render URL in `frontend/.env.local`.
- On Windows, to free port 5000:
  ```powershell
  netstat -ano | findstr :5000
  # Note the PID, then:
  taskkill /F /PID <PID>
  ```

---

## 4) Environment summary

Backend (Render):
- MONGODB_URI (required)
- OPENAI_API_KEY (required for server STT/Chat/TTS)
- JWT_SECRET (required)
- TTS_VOICE (optional)
- LIVEKIT_API_KEY, LIVEKIT_API_SECRET (optional, for LiveKit token endpoint)
- CORS_ORIGIN (optional, comma-separated origins)

Frontend (Vercel):
- VITE_API_BASE_URL (required in production) → `https://<render-app>.onrender.com/api`
- VITE_LIVEKIT_URL (optional, wss URL for LiveKit)

---

## 5) Troubleshooting

- 400 or 415 on `/voice/stt-respond`: ensure the frontend is sending multipart FormData without manually setting `Content-Type`; the code already does this.
- 500 or beep-only responses: likely OpenAI quota or missing key; fallbacks will keep the UI responsive. Add an OpenAI key to backend env.
- CORS errors in browser console: set `CORS_ORIGIN` on the backend to include your Vercel domain(s).
- LiveKit connect issues: verify `VITE_LIVEKIT_URL` and that the backend has API key/secret for token issuing.

---

That’s it—set envs, deploy backend on Render, then deploy frontend on Vercel pointing to the backend URL.
