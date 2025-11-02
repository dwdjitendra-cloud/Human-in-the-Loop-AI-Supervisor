# HIL-AI (Human-in-the-Loop AI Supervisor Dashboard)

## Project Overview
HIL-AI is a full-stack MERN web dashboard for customer support that combines AI automation with human supervision. AI agents answer customer questions using a knowledge base. If the AI cannot answer, the query is escalated to a human supervisor, who reviews, resolves, and updates the knowledge base—making the AI smarter over time.

---

## Demo Links
- **Backend (Render):** https://human-in-the-loop-ai-supervisor-0umh.onrender.com
- **Frontend (Vercel):** https://reception-ai-inky.vercel.app
- **GitHub Repo:** https://github.com/dwdjitendra-cloud/Human-in-the-Loop-AI-Supervisor

---

## Architecture Diagram (Text Description)
- User submits a question via the frontend (React + Vercel)
- AI agent (OpenAI + knowledge base) tries to answer
- If AI cannot answer, request is escalated to supervisor
- Supervisor reviews and resolves the request, updating the knowledge base
- AI uses updated knowledge base for future queries
- All data is stored in MongoDB Atlas, accessed via Express.js backend (Render)

---

## Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Axios
- **Backend:** Node.js, Express.js, JWT, bcrypt, MongoDB Atlas, Mongoose
- **AI Integration:** OpenAI API
- **Optional:** LiveKit (real-time audio agent)

---

## Features
- AI agent answers queries using OpenAI + knowledge base
- Escalation flow when AI can’t answer (help request created)
- Supervisor dashboard to view/respond to pending requests
- Knowledge Base view to add/edit Q&A entries
- Authentication system (JWT) for supervisors
- Automatic updates to AI learning context after resolution
- Request lifecycle: Pending → Resolved / Unresolved
- Modern responsive UI using Tailwind CSS
- Optional LiveKit integration for real-time audio

---

## Folder Structure
```
Human-in-the-Loop AI Supervisor/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── index.css
│   └── package.json
```

---

## API Endpoints
| Method | Endpoint                        | Description                       |
|--------|----------------------------------|-----------------------------------|
| POST   | /api/supervisors/register        | Register a new supervisor         |
| POST   | /api/supervisors/login           | Login and get JWT                 |
| GET    | /api/supervisors/:id             | Get supervisor details            |
| GET    | /api/help-requests               | List all help requests (paginated)|
| GET    | /api/help-requests/pending       | List pending requests (paginated) |
| GET    | /api/help-requests/resolved      | List resolved requests (paginated)|
| POST   | /api/help-requests/:id/resolve   | Resolve a help request            |
| GET    | /api/knowledge-base              | List knowledge base entries       |
| POST   | /api/knowledge-base              | Add knowledge base entry          |
| PUT    | /api/knowledge-base/:id          | Update knowledge base entry       |
| DELETE | /api/knowledge-base/:id          | Delete knowledge base entry       |

---

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/dwdjitendra-cloud/Human-in-the-Loop-AI-Supervisor.git
cd Human-in-the-Loop-AI-Supervisor
```

### 2. Backend Setup
```sh
cd backend
npm install
# Create a .env file and add required environment variables (see below)
npm start
```

### 3. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

### 4. Deployment
- **Backend:** Deployed on Render: https://human-in-the-loop-ai-supervisor-0umh.onrender.com
- **Frontend:** Deployed on Vercel: https://reception-ai-inky.vercel.app
- **Database:** Hosted on MongoDB Atlas

---

## Environment Variables (.env Example)
```
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
LIVEKIT_URL=your-livekit-url         # Optional
LIVEKIT_API_KEY=your-livekit-api-key # Optional
LIVEKIT_API_SECRET=your-livekit-api-secret # Optional
```

---

## How It Works
1. User asks a question via the dashboard.
2. AI agent (OpenAI + knowledge base) tries to answer.
3. If the AI cannot answer, the request is escalated to a supervisor.
4. Supervisor reviews and resolves the request, updating the knowledge base.
5. AI learns from the updated knowledge base for future queries.

---

## Future Enhancements
- Supervisor analytics dashboard (performance, response times)
- Bulk import/export for knowledge base
- Role-based access (admin, supervisor, viewer)
- Multi-language support
- Enhanced AI learning (feedback loop from supervisor corrections)
- Integration with messaging platforms (WhatsApp, Slack, etc.)
- Improved mobile experience

---

## Developer Info
**Jitendra Kumar Dodwadiya**  
MERN + ML Developer  
[LinkedIn](https://www.linkedin.com/in/dwdjitendra/)  
Email: jitendrakumar637587@gmail.com

---

## License
MIT

---

For questions, suggestions, or contributions, please open an issue or pull request on GitHub.

