# Human-in-the-Loop AI Supervisor

Full-stack supervisor workflow for handling customer questions with a learning loop. The automated agent answers from a knowledge base and defaults; unknown questions are escalated to supervisors who resolve and optionally save answers back to the knowledge base.

- Backend: Node.js / Express / MongoDB (Mongoose)
- Frontend: React (Vite) + Tailwind CSS
- Voice: optional server STT/Chat/TTS; browser STT/TTS fallback; LiveKit token endpoint

Live deployments
- Backend (Render): https://human-in-the-loop-ai-supervisor-0umh.onrender.com
- Frontend (Vercel): https://reception-ai-inky.vercel.app

## Features
- Help request lifecycle: Pending, Resolved, Unresolved (timeout)
- Supervisor dashboard and Knowledge Base management
- Automated agent: KB lookup → defaults → escalation
- Voice endpoints: text-to-speech, STT→reply→TTS, token route for LiveKit
- Browser fallback for speech (no server key required)
- Basic webhook support for notifications

## Architecture
1. Frontend sends question.
2. Backend agent
   - tries KB
   - falls back to defaults (hours, address, services, phone)
   - escalates if unknown
3. Supervisors resolve, optionally save answer to KB.
4. Agent follows up using saved answer.

MongoDB stores help requests, KB entries, and supervisors. The frontend consumes a REST API.

## Project Structure
```
Human-in-the-Loop AI Supervisor/
├─ backend/
│  └─ src/{config,controllers,models,routes,services,utils}
└─ frontend/
   └─ src/{components,pages,services}
```

## API (base: /api)

Help Requests
- GET /help-requests
- GET /help-requests/pending
- GET /help-requests/resolved
- GET /help-requests/unresolved
- GET /help-requests/:id
- POST /help-requests
- POST /help-requests/:id/resolve
- DELETE /help-requests/:id

Knowledge Base
- GET /knowledge-base
- GET /knowledge-base/:id
- POST /knowledge-base
- PUT /knowledge-base/:id
- DELETE /knowledge-base/:id
- GET /knowledge-base/search?q=...

Agent
- POST /simulate-call
- POST /help-requests/simulate-livekit-call

Voice
- GET /voice/tts?text=Hello
- POST /voice/reply { customerName, question }
- POST /voice/stt-respond (multipart: audio=Blob, optional voice)
- POST /livekit/token { identity, roomName }

Health
- GET /health

## Environment Variables

Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/human-in-loop-ai
ALLOW_NO_DB=1
JWT_SECRET=change-me

OPENAI_API_KEY=
TTS_VOICE=alloy

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# CORS: comma-separated or wildcard patterns (e.g., https://*.vercel.app)
CORS_ORIGIN=
```

Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_LIVEKIT_URL=
```

## Local Development
Backend
```
cd backend
npm install
cp .env.example .env  # set values
npm start
```
Frontend
```
cd frontend
npm install
echo VITE_API_BASE_URL=http://localhost:5000/api > .env.local
npm run dev
```

PowerShell quick checks
```
Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri 'http://localhost:5000/api/simulate-call' -Method Post -Body (@{customerName='Alice'; question='Hours?'} | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

## Voice
- Server TTS: /voice/tts and /voice/reply
- Full loop: /voice/stt-respond (STT → agent/chat → TTS)
- Browser fallback: SpeechRecognition + speechSynthesis in LiveVoice page
- LiveKit: token route, client joins via VITE_LIVEKIT_URL

## Deployment
- Backend: Render (Web Service). Set envs; health at /api/health.
- Frontend: Vercel (Vite). Set VITE_API_BASE_URL to the backend /api URL.
- Optional: vercel.json rewrites in frontend to proxy /api calls to Render.
See DEPLOYMENT.md for full details.

## Troubleshooting
- 404 from /help-requests on Vercel: set VITE_API_BASE_URL or ensure vercel.json rewrites are active and the project root is frontend.
- CORS errors: set CORS_ORIGIN on backend (supports comma list and wildcards).
- Beep-only voice: missing/limited OpenAI key; browser fallback continues working.
- Port conflicts locally: free port 5000 or set VITE_API_BASE_URL to deployed backend.

## Security
- Do not commit secrets. Rotate keys if exposed.
- Restrict CORS_ORIGIN to your domains in production.

## License
MIT

