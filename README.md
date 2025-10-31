# Human-in-the-Loop AI Supervisor Dashboard

## Overview
A robust, production-ready dashboard for managing AI-assisted help requests with human supervision. Built with strict code hygiene, modular architecture, advanced error handling, and performance optimization.

## Features
- Supervisor authentication (JWT-based)
- Help request management (pending, resolved, unresolved)
- AI agent integration for automated responses
- Human-in-the-loop workflow for request resolution
- Knowledge base management
- Pagination and performance-optimized queries
- Error UI and toast notifications
- MongoDB indexing for fast queries
- Strict folder structure and clean code

## Technologies
- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Auth:** JWT

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
├── README.md
└── ...other config/docs
```

## Setup Instructions
### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account

### Backend Setup
1. Navigate to `backend/`
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Secret for JWT tokens
4. Start the backend server:
   ```sh
   npm start
   ```
   The backend runs on `http://localhost:5001`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend dev server:
   ```sh
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`

## Usage
- Register or log in as a supervisor
- View, resolve, and manage help requests
- Add answers to the knowledge base
- Use pagination controls for large datasets
- All actions are logged and validated

## API Endpoints
### Supervisor
- `POST /api/supervisors/register` — Register supervisor
- `POST /api/supervisors/login` — Login and get JWT
- `GET /api/supervisors/:id` — Get supervisor details

### Help Requests
- `GET /api/help-requests` — List all requests (paginated)
- `GET /api/help-requests/pending` — List pending requests (paginated)
- `GET /api/help-requests/resolved` — List resolved requests (paginated)
- `POST /api/help-requests/:id/resolve` — Resolve a request

### Knowledge Base
- `GET /api/knowledge-base` — List entries (paginated)
- `POST /api/knowledge-base` — Add entry
- `PUT /api/knowledge-base/:id` — Update entry

## Environment Variables
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: JWT signing secret

## Security
- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Sensitive routes protected by middleware

## Performance
- MongoDB indexes on frequently queried fields
- Pagination for all list endpoints
- Optimized queries and error handling

## Troubleshooting
- Ensure MongoDB Atlas IP is whitelisted
- Check `.env` for correct credentials
- Use browser dev tools for API/network errors

## License
MIT

## Author
Jitendra
