# Task Management & Time Tracking App

A full-stack, real-time task management and time tracking application with statistics, built with React, Node.js/Express, Supabase, and Socket.IO.

---

## 🚀 Features

- **Authentication:** Secure registration, login, and logout with JWT (HTTP-only cookies)
- **Task Management:** Create, update, delete, and track tasks with priorities and due dates
- **Time Tracking:** Start/stop timers for tasks, view time entries, and see total time spent
- **Statistics:** Visualize productivity, completion rates, time spent, and streaks
- **Real-time Updates:** Instant task and time updates via Socket.IO
- **Responsive UI:** Modern, mobile-friendly interface

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, motion, axios, socket.io-client
- **Backend:** Node.js, Express, Supabase (Postgres), Socket.IO
- **Auth:** JWT, bcrypt, HTTP-only cookies
- **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD ready)

---

## 📦 Project Structure

```
/frontend      # React app
/backend       # Node.js/Express API
/docker-compose.yml
```

---

## ⚡ API Endpoints

### **Authentication**
- `POST   /api/auth/register` — Register a new user
- `POST   /api/auth/login` — Login
- `POST   /api/auth/logout` — Logout
- `GET    /api/auth/me` — Get current user

### **Tasks**
- `GET    /api/tasks` — List all tasks
- `POST   /api/tasks` — Create a new task
- `GET    /api/tasks/:id` — Get a task by ID
- `PUT    /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task
- `PATCH  /api/tasks/:id/status` — Update task status

### **Time Tracking**
- `POST   /api/time/tasks/:task_id/start` — Start time tracking for a task
- `POST   /api/time/tasks/:task_id/stop` — Stop time tracking for a task
- `GET    /api/time/tasks/:task_id/entries` — Get all time entries for a task
- `GET    /api/time/report` — Get time tracking report

### **Statistics**
- `GET    /api/statistics/tasks` — Task statistics (completion, priorities, etc.)
- `GET    /api/statistics/time` — Time statistics (total, per priority, per day)
- `GET    /api/statistics/productivity` — Productivity metrics (streaks, tasks/day)

---

## 📊 Real-time Events

- `task:created`, `task:updated`, `task:deleted`
- `time:started`, `time:stopped`
- All events are user-specific via Socket.IO rooms

---

## 🏗️ Setup & Installation

### **1. Clone the repo**
```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### **2. Environment Variables**

- Copy `.env.example` to `.env` in both `/backend` and `/frontend`
- Fill in your Supabase and other secrets

**Backend `.env` example:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
PORT=3000
```

**Frontend `.env` example:**
```
REACT_APP_API_URL=http://localhost:3000/api
```

### **3. Local Development**

**Backend:**
```bash
cd backend
pnpm install
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

### **4. Dockerized Development**

```bash
docker-compose up --build
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000/api](http://localhost:3000/api)

---

## 🐳 Docker & Deployment

- Both frontend and backend are fully containerized.
- Use `docker-compose` for local or production deployment.
- Environment variables are injected at runtime (not baked into images).

---

## 🛡️ Security

- JWT authentication with HTTP-only cookies
- Passwords hashed with bcrypt
- Input validation and error handling
- Row-level security in Supabase

---

## 📈 Statistics & Productivity

- Task completion rates and breakdowns
- Time spent per task, per day, and by priority
- Productivity streaks and averages

---

## 🧩 Extending

- Add more statistics or analytics endpoints
- Integrate with calendar or notification services
- Add user/team management

---

## 🤝 Contributing

PRs and issues welcome! Please open an issue to discuss your idea.

---

## 📄 License

MIT

---

**Made  by Pratham Shirbhate**
pratham.shirbhate22@spit.ac.in
