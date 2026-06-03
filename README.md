# EduMentor AI 🎓🤖

An AI-powered personalized learning platform (MERN stack) that helps students learn
efficiently through AI-generated quizzes, study-material management, progress tracking,
and a **3D voice AI tutor**.

> **Stack:** MongoDB · Express · React (Vite) · Node.js + Tailwind CSS · JWT auth ·
> Google **Gemini** (AI) · **Google OAuth** · **Cloudinary** (uploads) · **Recharts** (analytics) ·
> **three.js** (3D tutor) · **Nodemailer** (OTP email).

---

## ✨ Features

| Module | Student | Teacher | Admin |
| --- | :---: | :---: | :---: |
| Auth — JWT access + refresh, RBAC | ✅ | ✅ | ✅ |
| **Sign in with Google** (OAuth) | ✅ | ✅ | ✅ |
| **Forgot password via emailed OTP** | ✅ | ✅ | ✅ |
| Study material upload (PDF/DOCX/Notes → Cloudinary) | ✅ | ✅ | — |
| AI quiz generator (Gemini) | ✅ | ✅ | — |
| Manual quiz creation | — | ✅ | — |
| Attempt quizzes + history | ✅ | — | — |
| **3D AI Tutor** — voice chat, sentiment-driven emotions | ✅ | ✅ | — |
| Courses (create, enroll, resources) | enroll | ✅ | manage |
| Progress tracking & insights | ✅ | — | — |
| Analytics dashboards (charts) | ✅ | ✅ | ✅ |
| User / content moderation | — | — | ✅ |

---

## 🤖 The 3D AI Tutor

The AI Tutor page renders the three.js **RobotExpressive** model as a talking teacher:

- **Live voice** — speak via the mic (Web Speech API → speech-to-text); the robot answers
  with Gemini and **speaks back** (text-to-speech). It waves and says "Hello!" on start.
- **Sentiment-driven emotions** — your words set its face + animation: e.g. *"I hate you"* →
  😢 sad, anger words → 😠 angry, praise → 😄 thumbs-up, *"wow"* → 😲 surprised.
- Drag to rotate / scroll to zoom, mute toggle, full chat history + transcript.

> Voice (mic + speech) requires **Chrome or Edge**. The model is served locally from
> `public/models/RobotExpressive.glb`.

---

## 🗂 Project layout

The **frontend lives at the repo root** (Vite SPA) and the **backend lives in `server/`**.

```
EduMentor_AI/
├── src/                     # ── FRONTEND (React + Vite) ──
│   ├── api/                 # axios instance + endpoint helpers
│   ├── context/             # Auth + Theme providers
│   ├── components/          # layout, ui, charts, route guards, RobotTutor (3D)
│   ├── pages/               # route screens
│   ├── lib/                 # utilities (cn, sentiment, speech)
│   ├── App.jsx              # router
│   └── main.jsx             # entry
├── public/models/           # RobotExpressive.glb (3D tutor model)
├── index.html
├── tailwind.config.js
├── vite.config.js
├── package.json             # frontend deps
│
└── server/                  # ── BACKEND (Express + MongoDB) ──
    ├── src/
    │   ├── config/          # env, db, cloudinary, logger
    │   ├── models/          # Mongoose schemas
    │   ├── middleware/      # auth, roles, upload, rate-limit, errors, validate
    │   ├── utils/           # jwt, ApiError, asyncHandler, sendEmail, seed
    │   ├── services/        # business logic (ai, auth, quiz, analytics)
    │   ├── controllers/     # thin request handlers
    │   ├── validators/      # express-validator schemas
    │   ├── routes/          # REST routes
    │   ├── app.js           # express app + security middleware
    │   └── server.js        # bootstrap + DB connect
    └── package.json         # backend deps
```

---

## 🚀 Quick start (local)

### 1) Backend

```bash
cd server
copy .env.example .env        # (Windows)  →  fill in values
npm install
npm run seed                  # optional: demo users/courses
npm run dev                   # http://localhost:5000
```

### 2) Frontend (repo root)

```bash
copy .env.example .env        # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

You need accounts/keys for **MongoDB Atlas**, **Google AI Studio (Gemini)**, **Google OAuth**,
**Cloudinary**, and a **Gmail App Password** (for OTP email).

> Demo logins after `npm run seed`:
> `admin@edumentor.ai`, `teacher@edumentor.ai`, `student@edumentor.ai` — password `Password123!`

---

## 🔧 Environment variables (`server/.env`)

```
PORT, NODE_ENV, CLIENT_URL
MONGODB_URI
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES
GEMINI_API_KEY, GEMINI_MODEL          # default model: gemini-2.0-flash
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM   # Gmail App Password for OTP
```

Frontend (root `.env`): `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

> The server degrades gracefully: AI, Cloudinary, Google, and email each activate only when
> their keys are present (`GET /api/health` reports which are configured). Without SMTP,
> OTP codes are logged to the server console instead of emailed.

---

## 🔐 Auth flow

1. `POST /api/auth/register` / `login` → returns a short-lived **access token** (JSON) and
   sets an **httpOnly refresh-token cookie**.
2. `POST /api/auth/google` → verifies a Google ID token, creates/links the user, issues tokens.
3. The SPA keeps the access token in memory and sends `Authorization: Bearer <token>`.
4. On `401`, the axios interceptor calls `POST /api/auth/refresh` to silently rotate tokens.
5. **Forgot password (OTP):** `forgot-password` emails a 6-digit code → `reset-password-otp`
   verifies it and signs the user in. Codes are hashed, expire in 10 min, single-use,
   5-attempt lockout.
6. `POST /api/auth/logout` clears the refresh cookie and bumps the user's `tokenVersion`.

Route guards: `protect` (authenticated) → `authorize('teacher','admin')` (role-based).

---

## 🧱 Data relationships

```
User 1───* StudyMaterial          (uploadedBy)
User 1───* Quiz                   (createdBy)
User 1───* QuizAttempt ───1 Quiz  (user / quiz)
User 1───* ChatHistory            (one doc per chat session)
User 1───* Course (as teacher)    Course *───* User (students)
```

---

## 🌐 API surface

```
/api/auth       register, login, google, refresh, logout,
                forgot-password, reset-password-otp, reset-password/:token, me
/api/users      profile get/update, change password, avatar upload
/api/materials  CRUD + Cloudinary upload, filter by subject/tag
/api/quizzes    AI-generate, manual create, list, get, delete
/api/attempts   submit attempt, my history, per-attempt review
/api/chat       send message, list sessions, get session, delete
/api/courses    CRUD, enroll/unenroll, add/remove resource
/api/analytics  student / teacher / admin dashboards
/api/admin      users mgmt, content moderation, platform stats
/api/health     service status (ai, google, cloudinary)
```

---

## 🛡 Security

Helmet · CORS allow-list · express-rate-limit (global + auth + AI) · express-mongo-sanitize ·
xss-clean · hpp · bcrypt hashing · JWT token-versioning · hashed single-use OTPs ·
strong-password + email validation.

---

## ☁️ Deployment

| Layer | Host | Notes |
| --- | --- | --- |
| Frontend | **Vercel** | root dir = repo root, build `npm run build`, set `VITE_*` env |
| Backend | **Render** | root dir = `server`, start `npm start`, add all env vars |
| Database | **MongoDB Atlas** | whitelist Render egress (or `0.0.0.0/0` for demo) |

Set `CLIENT_URL` on the backend to the Vercel domain so CORS + refresh cookies work, and add
the deployed origins to your Google OAuth client (JS origins + redirect URIs).

---

## 🗺 Development roadmap

1. **Foundations** — repo, env, DB, User model, auth (register/login/refresh).
2. **Materials** — Cloudinary upload, CRUD, tagging, ownership guards.
3. **Quizzes** — Gemini generator (with model fallback), manual creation, attempts + scoring.
4. **AI Tutor** — markdown chat → upgraded to **3D robot with voice + sentiment**.
5. **Progress & Analytics** — aggregation pipelines, dashboards, charts.
6. **Courses & Admin** — enrollment, moderation, platform stats.
7. **Auth extras** — Google OAuth, OTP email password reset.
8. **Hardening & Deploy** — rate limits, CI, Vercel + Render.

---

## 🔮 Future enhancements

- Real-time tutor streaming (SSE/WebSockets) and lip-synced mouth morphs.
- RAG over uploaded PDFs with **Atlas Vector Search** so the tutor cites the student's notes.
- Spaced-repetition flashcards auto-generated from materials.
- Gamification: XP, badges, leaderboards (Duolingo-style streak engine).
- Assignments, live classes, and peer review for teachers.
- React Native mobile app on the same API.
- Stripe billing + organization/team plans.
