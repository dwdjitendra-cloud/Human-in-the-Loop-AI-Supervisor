# HIL-AI (Human-in-the-Loop AI Supervisor Dashboard)

## Project Description
HIL-AI is a full-stack MERN application that enables AI agents to handle customer queries automatically and escalate unresolved questions to a human supervisor. Supervisors can review, resolve, and update a knowledge base, allowing the AI to improve over time. This is a Human-in-the-Loop AI support system, combining automation with human decision-making for robust customer support.

---

## Features
- JWT-based supervisor authentication (register, login)
- AI agent integration using OpenAI API for automated responses
- Help request management (pending, resolved, unresolved)
- Human-in-the-loop workflow for request escalation and resolution
- Knowledge base management (add/update/search questions)
- Pagination and indexed queries for performance
- Error UI and toast notifications
- Clean modular code structure
- Optional LiveKit integration for real-time audio
- Responsive React + Tailwind dashboard

---

## Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT, bcrypt
- **AI:** OpenAI API (text)
- **Optional:** LiveKit for audio agent

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

## Environment Variables
Set these in your `.env` files and deployment dashboards:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key
- `LIVEKIT_URL` (optional) - LiveKit server URL
- `LIVEKIT_API_KEY` (optional) - LiveKit API key
- `LIVEKIT_API_SECRET` (optional) - LiveKit API secret

---

## Setup & Installation

### 1. Clone the Repository
```sh
git clone https://github.com/your-username/Human-in-the-Loop-AI-Supervisor.git
cd Human-in-the-Loop-AI-Supervisor
```

### 2. Backend Setup
```sh
cd backend
npm install
# Create a .env file and add required environment variables
npm start
```

### 3. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

### 4. Deployment
- **Backend:** Deploy on Render or Railway. Set environment variables in the dashboard.
- **Frontend:** Deploy on Vercel. Set API base URL to your backend deployment.
- **Database:** Use MongoDB Atlas for cloud database hosting.

---

## API Routes
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

## Example Usage Flow
1. **Supervisor registers and logs in.**
2. **AI agent answers basic queries using the knowledge base.**
3. **Unknown queries are escalated to supervisors.**
4. **Supervisor reviews and resolves the request, updating the knowledge base.**
5. **AI learns from the updated knowledge base for future queries.**

---

## Architecture / Screenshot
*Add a diagram or screenshot here to showcase the dashboard and workflow.*

---

## License
MIT

---

## Contribution
Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features. Follow the existing code style and structure.

---

## Contact
**Jitendra Kumar Dodwadiya**  
Reliance Foundation Scholar | B.Tech CSE @ IIEST Shibpur  
MERN Developer | ML Enthusiast  
Email: jitendrakumar637587@gmail.com
LinkedIn: [linkedin.com/in/jitendrakumar637587](https://linkedin.com/in/jitendrakumar637587)
