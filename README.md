# Northstar Online Examination System

A responsive college exam portal built with React, Vite, CSS, and an optional Express/MongoDB Atlas API.

## Run locally

```bash
npm install
npm run dev:all
```

Open the local Vite URL shown in the terminal. The API runs on port 5000. The example exam works without a database. Results are saved in the browser if the API cannot store them.

## Connect MongoDB Atlas

1. Create a database user and allow your development IP address in Atlas Network Access.
2. Copy `.env.example` to `.env` and replace the URI placeholders with your Atlas connection string. Keep `.env` private; it is ignored by Git.
3. Start the frontend and API together:

```bash
npm run dev:all
```

Vite proxies `/api` calls to port 5000. `MONGO_URI` is the preferred Atlas setting; `MONGODB_URI` is also accepted. If no MongoDB URI is set, the API serves demo questions and reports local demo mode.

## Host as one service

The Express server serves both the built React site and `/api` routes. On a Node hosting provider, set the build command to `npm install && npm run build` and the start command to `npm start`. Add `MONGO_URI` and `MONGODB_DB=examDB` as private environment variables in the host dashboard. The app listens on the host-provided `PORT` (5000 locally). In Atlas Network Access, allow the hosting provider's outbound IP addresses.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check API and database status |
| GET, POST | `/api/students` | List students / upsert a student |
| PUT, DELETE | `/api/students/:studentId` | Update or remove a student |
| GET, POST | `/api/questions` | List questions (answers omitted) / create one |
| PUT, DELETE | `/api/questions/:id` | Update or remove a question |
| GET, POST | `/api/results` | List results (optional `?studentId=...`) / save a result |
| PUT, DELETE | `/api/results/:id` | Update score/total or remove a result |

The API is a learning starter, not a production exam service. Add authentication and role checks before exposing student records or question answer keys to real users.
