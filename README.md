# Human-in-the-Loop AI Supervisor Dashboard

## Overview
This project delivers a production-ready, human-in-the-loop supervisor workflow on a MERN stack. An automated agent answers common questions using a knowledge base and sensible defaults. When a question is not known, the request is escalated to a human supervisor who reviews, resolves, and can save the final answer back to the knowledge base. Over time, the system improves based on what supervisors teach it.

- Backend: Node.js/Express with MongoDB (Mongoose)
- Frontend: React (Vite) with Tailwind CSS
- Agent behavior: built-in knowledge base search + default business rules; an optional LiveKit simulation endpoint demonstrates how a real-time agent would behave

Live deployments (if enabled):
- Backend (Render): https://human-in-the-loop-ai-supervisor-0umh.onrender.com
- Frontend (Vercel): https://reception-ai-inky.vercel.app
- Repository: https://github.com/dwdjitendra-cloud/Human-in-the-Loop-AI-Supervisor

## Key Features
- End-to-end help request lifecycle: Pending → Resolved or Unresolved (via timeout)
- Supervisor dashboard for Pending, Resolved, and Unresolved queues
- Knowledge Base management with “Learned” entries created during resolution
- Automated agent with two modes: generic HTTP simulation and LiveKit-style simulation
- Optional outbound notifications via webhook on escalation and customer follow-up
- Configurable timeout for auto-marking stale pending requests

## Architecture (text)
1) Customer question is submitted from the frontend.
2) Backend agent attempts to answer by:
	 - Searching the knowledge base for an existing match
	 - Falling back to default answers (hours, location, services, phone)
3) If no answer is found, a Pending help request is created and supervisors are notified.
4) A supervisor resolves the request in the dashboard and can save the resolution to the knowledge base.
5) The agent follows up to the customer and learned answers are available for future questions.

Storage: MongoDB via Mongoose. Backend exposes a simple REST API consumed by the React frontend.

## Folder Structure
```
Human-in-the-Loop AI Supervisor/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── frontend/
		├── src/
		│   ├── components/
		│   ├── pages/
		│   ├── services/
		│   └── index.css
		└── package.json
```

## Backend API
Base URL: http://localhost:5000/api (or your deployed URL)

Help Requests
- GET /help-requests: List all (paginated via query params page, limit)
- GET /help-requests/pending: List pending
- GET /help-requests/resolved: List resolved
- GET /help-requests/unresolved: List unresolved
- GET /help-requests/:id: Get one
- POST /help-requests: Create (rarely needed directly by UI)
- POST /help-requests/:id/resolve: Mark resolved with payload { answer, supervisorId, saveToKnowledgeBase }
- DELETE /help-requests/:id: Remove

Knowledge Base
- GET /knowledge-base: List entries (paginated)
- GET /knowledge-base/:id: Get one
- POST /knowledge-base: Create
- PUT /knowledge-base/:id: Update
- DELETE /knowledge-base/:id: Delete
- GET /knowledge-base/search?q=...: Search

Agent Simulation
- POST /simulate-call: Text-only simulation that returns either an answer or an escalation with helpRequestId
- POST /help-requests/simulate-livekit-call: LiveKit-style simulation (no SDK connection) with the same behavior pattern

Health
- GET /health: Simple health check

## Frontend
- Pages: Pending Requests, Resolved, Unresolved, Knowledge Base (with Learned filter), Test Automated Agent, Login
- Components: Navbar, RequestList, KnowledgeBaseList

The Test Automated Agent page lets you:
- Enter a customer name and a question
- Toggle between the generic simulation and the LiveKit-style simulation
- See the latest result and call history

## Environment Variables

Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/human-in-loop-ai
# Allow server to start without DB in dev
ALLOW_NO_DB=1
JWT_SECRET=change-me

# OpenAI (optional but recommended for real STT/Chat/TTS)
OPENAI_API_KEY=
# Optional voice label for TTS (e.g., alloy)
TTS_VOICE=alloy

# LiveKit (optional for Live Voice)
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Optional notifications / timeouts
TIMEOUT_MINUTES=5
NOTIFY_WEBHOOK_URL=http://localhost:5000/api/webhook/notify
```

Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
# LiveKit server URL (wss) if you use Live Voice
VITE_LIVEKIT_URL=
```

## Local Setup
1) Backend
```
cd backend
npm install
cp .env.example .env   # then edit values (ensure MONGO_URI)
npm start
```
2) Frontend
```
cd frontend
npm install
echo VITE_API_BASE_URL=http://localhost:5000/api > .env.local
# optionally add LiveKit URL
Add-Content .env.local "`nVITE_LIVEKIT_URL=wss://YOUR_LIVEKIT_HOST"
npm run dev
```

### Set secrets on Windows PowerShell
```
# Backend
cd backend
Copy-Item .env.example .env -Force
# then edit .env to add your values (OPENAI_API_KEY, LIVEKIT_*, etc.)

# Frontend
cd ..\frontend
Copy-Item .env.local.example .env.local -Force
# then edit .env.local to set VITE_API_BASE_URL and optional VITE_LIVEKIT_URL
```

## Quick Tests (PowerShell)
Health
```
Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get | ConvertTo-Json -Depth 5
```
Agent simulation
```
Invoke-RestMethod -Uri 'http://localhost:5000/api/simulate-call' -Method Post -Body (@{
	customerName='Alice'; question='Where are you located?'
} | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 5
```
LiveKit-style simulation
```
Invoke-RestMethod -Uri 'http://localhost:5000/api/help-requests/simulate-livekit-call' -Method Post -Body (@{
	customerName='Bob'; question='Do you offer student discounts?'
} | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

## Data Model Summary
- HelpRequest: { customerName, question, status: Pending|Resolved|Unresolved, supervisorId?, answer?, createdAt, resolvedAt, isTimeoutResolved }
- KnowledgeBase: { question, answer, category, helpRequestId?, usageCount, createdAt, updatedAt }
- Supervisor: { name, email, password (hashed), createdAt }

## Lifecycle and Timeout
- New unknown questions create a Pending request
- A background handler marks Pending requests older than TIMEOUT_MINUTES as Unresolved
- Resolutions can optionally create a “Learned” KnowledgeBase entry and trigger a customer follow-up notification

## Notifications
Outbound notifications are sent to the console and optionally POSTed to NOTIFY_WEBHOOK_URL. A basic webhook receiver exists at POST /api/webhook/notify for local testing.

## Deployment Notes
- Backend: Render or any Node host; set MONGO_URI, JWT_SECRET, TIMEOUT_MINUTES, NOTIFY_WEBHOOK_URL
- Frontend: Vercel or any static host; set VITE_API_BASE_URL to point at the backend’s /api

## Troubleshooting
- Health check fails: confirm port and base URL. Default port is 5000 unless PORT is set.
- CORS errors: the backend enables CORS by default. Verify VITE_API_BASE_URL matches the backend base URL.
- Mongo connection issues: verify MONGO_URI is reachable and credentials are correct.

## License
MIT

For questions or contributions, open an issue or pull request.

