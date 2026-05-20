# Online Exam Portal (Examify)

A full-stack **online examination system** for universities and training institutes. Examify automates question banks, exam scheduling, secure live exams, auto-grading, and role-based analytics for **Admins**, **Instructors**, and **Students**.



---

## Highlights

- **Role-based access** — Admin, Instructor, and Student dashboards with protected routes
- **Question bank** — MCQ (single/multiple), True/False, Short answer; categories, difficulty, bulk import
- **Exam lifecycle** — Create, schedule, assign batches, shuffle questions/options
- **Secure exam UI** — Countdown timer, auto-submit, question navigator, mark-for-review, tab-switch alerts, auto-save
- **Grading & reports** — Instant MCQ/TF scoring, manual short-answer grading, PDF grade sheets
- **Analytics** — Recharts dashboards per role
- **Modern UX** — React + Tailwind + shadcn/ui, responsive layout, dark mode

---

## Tech Stack

| Layer | Stack |
|--------|--------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, React Router v6, TanStack Query, Zustand, Recharts, Lucide |
| **Backend** | Node.js, Express, TypeScript, MongoDB, Mongoose |
| **Auth & security** | JWT, bcrypt, Zod, Helmet, CORS, express-rate-limit |
| **Documents** | PDFKit (grade sheet export) |

---

## Project Structure

```
├── frontend/                 # React SPA (Vite)
│   └── src/
│       ├── components/       # ui, layout, exam portal
│       ├── features/         # auth, questions, exams, results, dashboard
│       ├── pages/
│       ├── routes/
│       └── store/
├── backend/                  # REST API (Express)
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── utils/
└── package.json              # Concurrent dev scripts
```

---

## Prerequisites

- **Node.js** 18 or later
- **MongoDB** 6+ (local install, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas))  
  — *Optional:* set `USE_MEMORY_DB=true` in `backend/.env` for local dev without installing MongoDB

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/GitwithHaseeb/Online-Exam-Portal.git
cd Online-Exam-Portal
npm run install:all
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key (min. 16 characters) |
| `CLIENT_URL` | Frontend URL (default `http://localhost:5173`) |
| `USE_MEMORY_DB` | `true` = in-memory DB for quick local testing |

### 3. Seed demo data (MongoDB mode)

```bash
npm run seed --prefix backend
```

> With `USE_MEMORY_DB=true`, demo users are created automatically when the API starts.

### 4. Run the application

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

---

## Demo Accounts

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@examify.edu` | `admin123` |
| Instructor | `instructor@examify.edu` | `instructor123` |
| Student | `student@examify.edu` | `student123` |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend (watch mode) |
| `npm run dev:frontend` | Vite dev server only |
| `npm run dev:backend` | Express API only |
| `npm run build` | Production build (API + SPA) |
| `npm run seed --prefix backend` | Reset & seed demo data |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Student registration |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `GET` | `/api/auth/me` | Current user profile |
| `GET/POST/PATCH/DELETE` | `/api/questions` | Question bank |
| `GET/POST/PATCH/DELETE` | `/api/exams` | Exam management |
| `POST` | `/api/exams/:id/start` | Start exam attempt |
| `POST` | `/api/exams/:id/answer` | Auto-save answer |
| `POST` | `/api/exams/:id/submit` | Submit & grade |
| `GET` | `/api/dashboard/:role` | Role analytics |
| `GET` | `/api/attempts/:id/pdf` | Download grade sheet |

---

## Security Features

- Password hashing (bcrypt, 12 rounds)
- JWT-based authentication & role authorization middleware
- Request validation with Zod
- Helmet, CORS, and rate limiting
- One active attempt per student per exam
- Server-enforced exam window and expiry
- Tab-switch tracking during live exams

---

## Production Notes

1. Set `NODE_ENV=production` and a strong `JWT_SECRET`.
2. Use a managed MongoDB instance (`USE_MEMORY_DB=false`).
3. Build the frontend: `npm run build --prefix frontend` and serve `frontend/dist` via CDN or reverse proxy.
4. Run the API: `npm run build --prefix backend && npm start --prefix backend`.
5. Point `CLIENT_URL` to your production frontend domain.

---

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit your changes (`git commit -m 'Add amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---



If this project helps you, consider giving the repo a star on GitHub.
