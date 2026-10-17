# 📚 DocQuiz AI

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?logo=discord&logoColor=white)](https://discord.gg/DQqxbrrPB)

**Turn study notes, documents, textbooks, and photos into interactive, active-recall quizzes in seconds.**

[Explore Features](#-features) • [Quickstart](#-quickstart) • [Firebase Setup](#-google-cloud--firebase-setup) • [Architecture](#%EF%B8%8F-architecture--monorepo-structure) • [Discord Server](https://discord.gg/DQqxbrrPB)

</div>

---

## 🌟 Overview

**DocQuiz AI** is an intelligent, multimodal study platform designed to supercharge learning efficiency through **active recall** and **spaced repetition**. Instead of passively re-reading slides or textbooks, DocQuiz extracts core concepts and transforms them into interactive quizzes, visual explanations, and multiplayer challenges.

Whether you drop a 100 MB medical textbook PDF, take a live webcam snapshot of a handwritten math equation, or challenge a friend via Discord, DocQuiz delivers instant, step-by-step grounded learning.

---

## ✨ Features

### 🔍 1. Google Lens Visual Scanner
- **Live Webcam Scanning**: Capture diagrams, blackboard formulas, handwritten notes, or textbook pages with automatic frame downscaling.
- **High-Resolution Photo Upload**: Drag & drop or upload images (JPG, PNG, WEBP) with automatic client-side compression (< 150KB) for lightning-fast analysis.
- **Multimodal AI Solver**: Powered by Google Gemini 2.5 Flash and OpenAI Vision to transcribe, solve equations step-by-step, and explain complex figures.
- **Resilient Dual-Path Fallback**: Automatically connects through Vite proxy or directly to the Express backend with offline fallbacks.

### 🔐 2. Firebase & Google Authentication
- **1-Click Google Sign-In**: Authenticate securely using official Google Auth popup (`signInWithPopup`) without ever typing a password.
- **Email & Password Support**: Optional email registration and login with local and Firebase credential synchronization.
- **Avatar Customization & Profile Management**: Choose personalized study emojis, usernames, and security questions.

### 🗄️ 3. Google Cloud Firestore Quiz Vault & Review
- **Automatic History Tracking**: Every completed quiz is automatically saved to your user document in Google Cloud Firestore (`quiz_history` collection).
- **Full Question-by-Question Review**: Revisit any past quiz attempt to inspect:
  - Full question prompt & code snippets
  - All 4 options with exact markers
  - Your chosen answer vs. the correct answer
  - Deep-dive explanations and conceptual rationale
- **Search & Filter**: Filter past attempts by document name, topic, score percentage, or date.
- **Offline Resilient Storage**: Seamless automatic fallback to `localStorage` when offline or before logging in.

### 💬 4. Official Discord Community Integration
- **Direct Server Access**: One-click join link to the official DocQuiz Discord Server: **[https://discord.gg/DQqxbrrPB](https://discord.gg/DQqxbrrPB)**.
- **Dedicated Community Modal**: View server highlights, study lounges, peer leaderboards, and copy direct invite links.
- **1-Click Challenge Sharing**: Share your quiz score and peer challenge link directly to Discord channels.

### ⚔️ 5. Peer Challenge & Multiplayer Arena
- **1v1 Blitz Challenges**: Generate a shareable URL to challenge friends or classmates on the exact same quiz questions.
- **Live Leaderboards**: Compare completion times, scores, and accuracy percentages.

### 🏆 6. Badges, XP & Gamification
- **Leveling System**: Earn XP for every question answered, quiz completed, and streak maintained.
- **Achievement Badges**: Unlock badges for speed, perfect scores, night-owl study sessions, and milestone completions.

### 📂 7. Multi-Format Document Ingestion
- Supports files up to **100 MB**.
- Formats: **PDF**, **DOCX**, **DOC**, **TXT**, **Markdown (`.md`)**, **CSV**, and **JSON**.
- In-memory parsing ensures your private study files stay strictly in your session.

### 🧠 8. Dynamic & Non-Repetitive Quizzes
- Select customizable quiz lengths (**3 Qs** Quick Blitz, **5 Qs** Standard, **7 Qs** Deep Dive, **10 Qs** Mastery, or custom 1–30 questions).
- Fresh option shuffling (A, B, C, D) and unique concept sampling every time you retake or click **"Get New Questions"**.

---

## 🏗️ Architecture & Monorepo Structure

DocQuiz AI is engineered as a clean, high-performance **pnpm monorepo**:

```text
DocQuiz/
├── artifacts/
│   ├── docquiz-ai/                 # Frontend Web Application (React 19 + Vite 7)
│   │   ├── src/
│   │   │   ├── components/         # UI Components (Lens Scanner, AppShell, Discord Modal)
│   │   │   ├── pages/              # Home, Quiz, History Vault, Peer Challenge, Auth
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts     # Firebase App, Auth & Firestore initialization
│   │   │   │   ├── auth-service.ts # Google & password authentication manager
│   │   │   │   └── quiz-history-service.ts # Firestore Quiz Vault storage & sync
│   │   │   └── App.tsx             # Routing & global providers
│   │   └── vite.config.ts          # Reverse proxy (/api -> :5050), Tailwind v4 setup
│   │
│   └── api-server/                 # Backend API (Node.js + Express 5)
│       ├── src/
│       │   ├── routes/             # /api/quiz, /api/chat (Lens AI), /api/auth, /api/discord
│       │   ├── lib/                # Extractors (pdf-parse, mammoth), logger (pino)
│       │   └── index.ts            # Express server (listening on 0.0.0.0:5050)
│       └── build.mjs               # Fast esbuild bundler
│
├── lib/
│   ├── api-spec/                   # OpenAPI 3.1 Contract Definition
│   ├── api-zod/                    # Auto-generated Zod runtime validation schemas
│   └── api-client-react/           # Auto-generated React Query API client hooks
│
├── package.json                    # Monorepo root workspace commands
├── pnpm-workspace.yaml             # pnpm workspace config
└── README.md                       # Documentation
```

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: v18.0 or newer (v20+ or v22 recommended)
- **pnpm**: v9 or v10 (`npm install -g pnpm`)

### 2. Clone the Repository
```bash
git clone https://github.com/LarrenTrying/DocQuiz.git
cd DocQuiz
```

### 3. Install Dependencies
```bash
pnpm install
```

> **Note for pnpm v10+**: If prompted to approve native build dependencies (e.g. `esbuild`), run:
> ```bash
> pnpm approve-builds --all
> ```

### 4. Configure Environment Variables
Create a `.env` file in the root directory (or in `artifacts/docquiz-ai/.env`):

```env
# ==========================================
# Firebase & Google Authentication Config
# ==========================================
VITE_FIREBASE_API_KEY=AIzaSyCtthoYg4I6-uoupa5C5pycOLuqF47vg8Q
VITE_FIREBASE_AUTH_DOMAIN=docquiz-be307.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=docquiz-be307
VITE_FIREBASE_STORAGE_BUCKET=docquiz-be307.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=731118108909
VITE_FIREBASE_APP_ID=1:731118108909:web:232da22cb66cd47a5d0ce4
VITE_FIREBASE_MEASUREMENT_ID=G-RSJ06D0E42

# ==========================================
# Optional: Multimodal AI Vision Keys
# ==========================================
# (If omitted, DocQuiz automatically uses the smart built-in offline engine)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Backend Port (default: 5050)
PORT=5050
```

### 5. Start Development Servers
Start both the Express API server (`:5050`) and the Vite web client (`:3000`) with a single command:

```bash
pnpm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**!

---

## ☁️ Google Cloud & Firebase Setup

### 1. Enable Google Sign-In
1. Go to the [Firebase Console](https://console.firebase.google.com/) and open project **`docquiz-be307`**.
2. Navigate to **Authentication** > **Sign-in method**.
3. Click on **Google** and toggle it to **Enabled**.
4. Set your project support email and click **Save**.
5. Under **Authorized domains**, ensure `localhost` is listed.

### 2. Enable Firestore Database (For Quiz History)
1. In Firebase Console, click **Firestore Database** in the left sidebar.
2. Click **Create database**.
3. Select **Start in Test Mode** (free, allows client reads/writes for testing).
4. Choose any cloud region (e.g. `nam5 (us-central)` or `asia-south1`) and click **Enable**.
5. Once created, users will see their completed quizzes, answer reviews, and score history automatically synced!

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`pnpm run dev`** | `concurrently ...` | Runs both Express backend (`:5050`) and Vite frontend (`:3000`) |
| **`pnpm run build`** | `pnpm --filter ... build` | Compiles both backend and frontend for production |
| **`pnpm --filter @workspace/docquiz-ai run dev`** | `vite` | Starts only the frontend application |
| **`pnpm --filter @workspace/api-server run dev`** | `node ./build.mjs` | Starts only the API server |

---

## 💬 Community & Support

Join the official DocQuiz Discord server to report bugs, request features, find study partners, and test upcoming AI drops:

👉 **[Join the DocQuiz Discord Community](https://discord.gg/DQqxbrrPB)**

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
