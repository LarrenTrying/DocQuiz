# 🗺️ Repository Map & Comprehensive Codebase Overview

> **DocQuiz AI Monorepo**  
> An intelligent active-recall learning platform that transforms documents into interactive quizzes, peer challenges, and AI tutor sessions.

---

## 📑 Table of Contents
1. [Executive Summary & Tech Stack](#-executive-summary--tech-stack)
2. [Monorepo Architecture & Directory Topology](#-monorepo-architecture--directory-topology)
3. [Deep-Dive by Workspace Package](#-deep-dive-by-workspace-package)
   - [3.1 Web Client (`artifacts/docquiz-ai`)](#31-frontend-web-application-artifactsdocquiz-ai)
   - [3.2 API Backend Server (`artifacts/api-server`)](#32-api-backend-server-artifactsapi-server)
   - [3.3 API Specification (`lib/api-spec`)](#33-api-specification--contract-libapi-spec)
   - [3.4 Zod Validation Schemas (`lib/api-zod`)](#34-validation--types-libapi-zod)
   - [3.5 Generated React Client Hooks (`lib/api-client-react`)](#35-generated-api-client-libapi-client-react)
   - [3.6 Database Models & Schema (`lib/db`)](#36-database--orm-layer-libdb)
   - [3.7 Testing & Utility Scripts (`scripts/`)](#37-automation--testing-scripts-scripts)
   - [3.8 Mockup Sandbox (`artifacts/mockup-sandbox`)](#38-mockup-sandbox-artifactsmockup-sandbox)
4. [Deployment, Infrastructure & Vercel Integration](#-deployment-infrastructure--vercel-integration)
5. [Complete File Registry & Descriptions](#-complete-file-registry)

---

## 🌟 Executive Summary & Tech Stack

**DocQuiz AI** is a full-stack, TypeScript-powered educational platform designed to elevate active recall and study engagement. Users can drag-and-drop notes in numerous file formats (PDF, DOCX, DOC, TXT, MD, CSV, JSON), extract text in memory, configure custom question counts and timer difficulties (Blitz, Challenge, Relaxed, Untimed), take quizzes with instant citations/explanations, consult a multimodal visual scanner (Google Lens-style tutor), compete with peers via Discord challenge arenas, and track gamified progression (XP, levels, streaks, badges).

### Technology Matrix
| Layer | Technologies |
| :--- | :--- |
| **Monorepo Manager** | `pnpm` workspaces (v10+), pnpm catalog |
| **Frontend Framework** | React 19, Vite 7, TypeScript 5.9 |
| **Styling & UI** | Tailwind CSS v4, Radix UI primitives, Lucide React, Framer Motion, Sonner |
| **Frontend Routing** | Wouter v3 |
| **Data Fetching / State** | TanStack React Query v5, Browser SessionStorage, Custom Fetcher |
| **Backend API** | Node.js (v24), Express 5, Multer (in-memory streaming) |
| **Document Parsers** | `pdf-parse` (PDF extraction), `mammoth` (Word .docx/.doc), native UTF-8 streaming |
| **AI & Multimodal Engine**| Google Gemini (2.5 Flash / Pro) & OpenAI (GPT-4o mini) with robust local offline fallback generators |
| **Database & ORM** | PostgreSQL, Drizzle ORM, `drizzle-zod` |
| **Contract & API Codegen**| OpenAPI 3.1, Orval |
| **Build & Bundling** | `esbuild` (CJS/ESM), Vite |
| **Hosting & CI/CD** | Vercel Serverless Functions (`api/index.ts`, `vercel.json`), Replit |

---

## 📁 Monorepo Architecture & Directory Topology

```text
HEADACHE/
├── .agents/                      # Agent persistent guidelines and memory
│   └── memory/                   # System memories (AI provider fallback strategy)
├── .conversation/                # Conversation assets and prompt references
├── api/
│   └── index.ts                  # Vercel serverless entrypoint routing to api-server
├── artifacts/
│   ├── api-server/               # Express 5 REST API microservice
│   │   ├── api/index.ts          # Server entrypoint alias
│   │   ├── src/
│   │   │   ├── lib/              # Discord helper & logger (pino)
│   │   │   ├── routes/           # REST endpoints (auth, quiz, chat, discord, health)
│   │   │   ├── types/            # TypeScript module declarations
│   │   │   ├── app.ts            # Express application setup & middleware
│   │   │   └── index.ts          # Server listener initialization
│   │   ├── build.mjs             # Production esbuild bundler script
│   │   ├── package.json          # Express service manifest
│   │   └── tsconfig.json         # TypeScript configuration
│   ├── docquiz-ai/               # React 19 + Vite 7 Single Page Application
│   │   ├── public/               # Static icons, favicons, robots.txt
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI widgets, modals & Radix primitives
│   │   │   │   └── ui/           # Accessible Radix UI component library (40+ components)
│   │   │   ├── hooks/            # Mobile detection & toast notification hooks
│   │   │   ├── lib/              # Auth context, avatars, gamification engine & storage
│   │   │   ├── pages/            # Page views (Home, Quiz, Challenge, Auth, NotFound)
│   │   │   ├── App.tsx           # Top-level routing, query provider & error boundary
│   │   │   ├── index.css         # Theme tokens, font imports & CSS utility classes
│   │   │   └── main.tsx          # React DOM root render
│   │   ├── package.json          # Frontend dependencies & build commands
│   │   ├── tsconfig.json         # Frontend TypeScript config
│   │   ├── vercel.json           # Client routing and build rules
│   │   └── vite.config.ts        # Vite build tool config with API proxy
│   └── mockup-sandbox/           # Isolated component preview and design sandbox
├── lib/
│   ├── api-client-react/         # Auto-generated TanStack Query hooks & custom fetch client
│   ├── api-spec/                 # OpenAPI 3.1 YAML definition & Orval codegen configs
│   ├── api-zod/                  # Type-safe Zod validation schemas derived from OpenAPI
│   └── db/                       # PostgreSQL database layer, Drizzle schemas & config
├── scripts/                      # Integration test suites and CI scripts
│   ├── src/
│   │   ├── hello.ts              # Smoke test utility
│   │   ├── test_auth.ts          # Authentication flow test suite
│   │   ├── test_chat.ts          # Visual tutor and chat endpoint verification
│   │   └── test_discord.ts       # Discord integration & challenge test suite
│   └── post-merge.sh             # Git merge lifecycle automation
├── .gitignore                    # Git ignore file list
├── .npmrc                        # NPM configuration
├── .replit                       # Replit environment configuration
├── .replitignore                 # Replit file exclusions
├── package.json                  # Root monorepo workspace configuration
├── pnpm-lock.yaml                # Lockfile containing exact dependency trees
├── pnpm-workspace.yaml           # pnpm workspace mapping & dependency catalog
├── README.md                     # Project quickstart & feature overview
├── replit.md                     # Runtime instructions, operational stack & architecture
├── tsconfig.base.json            # Base TypeScript configuration inherited across monorepo
├── tsconfig.json                 # Project reference root TypeScript config
└── vercel.json                   # Root Vercel deployment configuration
```

---

## 🔍 Deep-Dive by Workspace Package

### 3.1 Frontend Web Application (`artifacts/docquiz-ai`)

The frontend delivers an active-recall study environment with rich animations, glassmorphism accents, and accessible primitives.

- **Primary Pages (`src/pages/`)**:
  - `home.tsx`: Document upload desk supporting drag-and-drop, multi-format parsing, file metrics recap (word/character/chunk count), question count selection (3, 5, 7, 10, or custom 1–30), difficulty timer selection (Blitz, Challenge, Relaxed, Untimed), and direct trigger for Google Lens-style scanner and multiplayer challenges.
  - `quiz.tsx`: Focused one-question-at-a-time active recall session with countdown timer, answer shuffling, immediate citation feedback, mistake review recap, badge unlocking modal, and Discord result sharing.
  - `challenge.tsx`: Multiplayer challenge arena allowing users to compete on shared study decks with real-time scoreboards, completion time metrics, and Discord leaderboard syncing.
  - `auth.tsx`: Complete authentication portal with Sign In, Sign Up, Security Question recovery, animated interactive avatars (customizable styles, colors, and accessories), and password strength indicators.
  - `not-found.tsx`: 404 handler with redirection back to the study desk.

- **Core Components & Modals (`src/components/`)**:
  - `app-shell.tsx`: Navigation header with study desk branding, current active document indicator, theme toggle, and authenticated user profile menu.
  - `lens-scanner-modal.tsx`: Visual study tutor that takes captured/uploaded images (homework problems, diagrams, notes), sends them to the multimodal AI backend, and outputs step-by-step solutions and summaries.
  - `challenge-create-modal.tsx`: Modal to package active notes into timed challenges for peer competition.
  - `discord-settings-modal.tsx`: Connects Discord accounts, manages study reminder webhooks, and configures channel broadcasts.
  - `animated-avatar.tsx`: Generates dynamic SVG avatars with customizable facial features and mood accessories.
  - `badges-modal.tsx`: Displays gamification trophies (Speed Demon, Perfect Recall, Study Streak, Master Explorer).
  - `quiz-toolbar.tsx`: Controls for instant restart, font scaling, sound effects, and focus mode.
  - `ui/`: Full Radix UI suite (Button, Card, Dialog, Sheet, Popover, Progress, Tabs, Toaster, Command, Tooltip, etc.).

- **Application Services & State (`src/lib/`)**:
  - `storage.ts`: Safe in-browser storage layer managing documents, active quizzes, session states, and offline question generators.
  - `gamification.ts`: Experience points (XP), leveling algorithms, streak tracking, and achievement triggers.
  - `auth-context.tsx` & `auth-service.ts`: React authentication provider handling bearer tokens, user profile persistence, and security challenge responses.

---

### 3.2 API Backend Server (`artifacts/api-server`)

Built with **Express 5** and bundled using `esbuild`, the API handles document parsing, LLM prompt engineering, fallback logic, authentication, and Discord bots.

- **Server Routes (`src/routes/`)**:
  - `quiz.ts`:
    - `POST /api/documents/extract`: Multer-assisted in-memory extraction of files up to 100 MB. Extracts text from PDF (`pdf-parse`), DOCX (`mammoth`), TXT/MD/CSV/JSON. Partitions large documents into logical 12,000-character chunks.
    - `POST /api/generate-quiz`: Generates multi-choice quizzes using Google Gemini / OpenAI with strict JSON schemas. If external AI APIs fail or are unconfigured, a deterministic local fallback engine parses sentences into plausible questions and distractors.
  - `auth.ts`:
    - `POST /api/auth/register`: User creation with cryptographic PBKDF2 password and security answer hashing.
    - `POST /api/auth/login`: Authenticates credentials and issues bearer session tokens.
    - `POST /api/auth/get-security-question`: Retrieves registered security questions for self-service password recovery.
    - `POST /api/auth/reset-password`: Validates security question responses and resets passwords.
    - `GET /api/auth/me` & `POST /api/auth/logout`: Session verification and revocation.
  - `chat.ts`:
    - `POST /api/chat/ask`: Multimodal visual tutor endpoint accepting base64 images and study questions. Orchestrates Gemini 2.5 Flash/Pro and OpenAI GPT-4o mini with intelligent offline diagram analysis fallback.
  - `discord.ts`:
    - `GET /api/discord/auth-url` & `POST /api/discord/callback`: Discord OAuth2 link and token exchange.
    - `GET /api/discord/status` & `POST /api/discord/disconnect`: Connection management.
    - `POST /api/discord/challenge/create`: Packages study questions into Discord-shareable challenges with rich embedded cards.
    - `GET /api/discord/challenge/:id` & `POST /api/discord/challenge/:id/submit`: Leaderboard tracking and participant score logging.
    - `POST /api/discord/share-achievement`: Posts achievement embeds into designated Discord channels.
    - `POST /api/discord/interactions`: Official Discord slash commands handler (`/quiz`, `/ask`).
  - `health.ts`:
    - `GET /api/healthz`: Service health check.

---

### 3.3 API Specification & Contract (`lib/api-spec`)

- **`openapi.yaml`**: The single source of truth defining the OpenAPI 3.1 specification for all endpoints, schemas (`ExtractedDocument`, `Quiz`, `QuizQuestion`, `DocumentUpload`, `HealthStatus`), and error envelopes.
- **`orval.config.ts`**: Orval configuration file that consumes `openapi.yaml` and generates:
  1. Zod schemas into `lib/api-zod`
  2. Typed React Query client hooks into `lib/api-client-react`

---

### 3.4 Validation & Types (`lib/api-zod`)

- Generates runtime TypeScript types and Zod schemas (`api.ts`, `extractedDocument.ts`, `quiz.ts`, `quizQuestion.ts`, `healthStatus.ts`).
- Ensures type parity between frontend client payloads and backend validation guards.

---

### 3.5 Generated API Client (`lib/api-client-react`)

- Generated React Query hooks (`useExtractDocument`, `useGenerateQuiz`, `useHealthCheck`).
- **`custom-fetch.ts`**: Resilient fetch wrapper supporting base URLs, automatic header injection, bearer token getters, response auto-parsing (JSON, text, blobs), and typed `ApiError` handling.

---

### 3.6 Database & ORM Layer (`lib/db`)

Utilizes **PostgreSQL** configured through **Drizzle ORM**.

- **Tables Defined (`src/schema/`)**:
  - `usersTable` (`users.ts`): User accounts, salted password hashes, and security question credentials.
  - `discordConnectionsTable` (`discord.ts`): User-to-Discord OAuth accounts, access tokens, and alert preferences.
  - `discordServersTable` (`discord.ts`): Guild configurations, target quiz channels, and webhook URLs.
  - `quizChallengesTable` (`discord.ts`): Multiplayer challenge sessions, topic metadata, and serialized question payloads.
  - `challengeParticipantsTable` (`discord.ts`): Participant submissions, score percentages, and completion speed metrics.
- **`drizzle.config.ts`**: Database migration and connection configuration pointing to `DATABASE_URL`.

---

### 3.7 Automation & Testing Scripts (`scripts/`)

- `src/test_auth.ts`: End-to-end integration test validating user registration, duplicate checks, login, security question recovery, and token verification.
- `src/test_chat.ts`: Tests the visual tutor multimodal chat endpoint with mock text and image queries.
- `src/test_discord.ts`: Validates Discord challenge creation, participant score submission, and leaderboard ordering.
- `src/hello.ts`: Monorepo script execution sanity check.
- `post-merge.sh`: Post-git hook script automating dependency reconciliation and builds.

---

### 3.8 Mockup Sandbox (`artifacts/mockup-sandbox`)

- An isolated Vite application used for building, previewing, and visually testing component variations and design tokens without impacting the production build.

---

## 🚀 Deployment, Infrastructure & Vercel Integration

The repository is pre-configured for frictionless monorepo hosting:

1. **Root Configuration (`vercel.json`)**:
   - Points the production build command to `pnpm run build`.
   - Directs the static output directory to `artifacts/docquiz-ai/dist/public`.
   - Sets up URL rewrites routing `/api/*` to the serverless function handler at `api/index.ts`.
2. **Serverless Bridge (`api/index.ts`)**:
   - Re-exports the Express application from `artifacts/api-server/src/app` as an asynchronous serverless request listener on Vercel.
3. **Supply-Chain Security (`pnpm-workspace.yaml`)**:
   - Enforces `minimumReleaseAge: 1440` (packages must be published for at least 24 hours to mitigate zero-day npm supply chain poisoning).

---

## 📋 Complete File Registry

| Path | Purpose / Description |
| :--- | :--- |
| `README.md` | General project introduction, feature highlights, and local quickstart guide. |
| `replit.md` | Runtime instructions, stack architecture decisions, and environment variables. |
| `package.json` | Monorepo root manifest declaring workspace commands (`dev`, `build`, `typecheck`). |
| `pnpm-workspace.yaml` | Declares all monorepo package glob paths and shared dependency catalog. |
| `pnpm-lock.yaml` | Resolved lockfile containing exact package versions across all packages. |
| `tsconfig.base.json` | Shared compiler options (ES2022, bundler module resolution, strict mode). |
| `tsconfig.json` | Root project references file for `tsc --build`. |
| `vercel.json` | Vercel deployment routes and serverless output mapping. |
| `.gitignore` | Ignores `node_modules`, build outputs (`dist/`), environment files, and local logs. |
| `.npmrc` | Configuration flags for package management. |
| `.replit` / `.replitignore`| Replit container configuration and deployment rules. |
| `api/index.ts` | Serverless API handler proxying requests to the Express application. |
| **`artifacts/api-server/`** | **Node.js Express backend service** |
| `artifacts/api-server/package.json` | Dependencies (`express`, `multer`, `pdf-parse`, `mammoth`, `pino`, `drizzle-orm`). |
| `artifacts/api-server/build.mjs` | Custom production esbuild script producing an optimized bundle. |
| `artifacts/api-server/tsconfig.json` | Server-specific TypeScript compiler configuration. |
| `artifacts/api-server/src/app.ts` | Express application instance configuring CORS, JSON parsers, and route mounts. |
| `artifacts/api-server/src/index.ts` | Development and production HTTP listener. |
| `artifacts/api-server/src/routes/quiz.ts` | Text extractors, chunking, OpenAI/Gemini quiz builders, and local fallback generators. |
| `artifacts/api-server/src/routes/auth.ts` | Authentication, PBKDF2 hashing, sessions, and security question password recovery. |
| `artifacts/api-server/src/routes/chat.ts` | Multimodal visual lens assistant and study tutor chat endpoint. |
| `artifacts/api-server/src/routes/discord.ts`| Discord OAuth2, slash command interactions, and challenge sharing. |
| `artifacts/api-server/src/routes/health.ts` | Health check endpoint (`/healthz`). |
| `artifacts/api-server/src/routes/index.ts` | Route aggregator combining all sub-routers. |
| `artifacts/api-server/src/lib/discord.ts` | Discord webhook dispatchers, embed formatters, and memory stores. |
| `artifacts/api-server/src/lib/logger.ts` | Structured logging powered by Pino and Pino-HTTP. |
| `artifacts/api-server/src/lib/env.ts` | Environment variable validation helper. |
| `artifacts/api-server/src/types/pdf-parse.d.ts` | Ambient type definitions for `pdf-parse`. |
| **`artifacts/docquiz-ai/`** | **React 19 + Vite 7 Frontend application** |
| `artifacts/docquiz-ai/package.json` | Dependencies (React 19, Wouter, Radix UI, TanStack Query, Tailwind). |
| `artifacts/docquiz-ai/vite.config.ts` | Vite configuration with local proxy to the API server on port 5050. |
| `artifacts/docquiz-ai/tsconfig.json` | Frontend TypeScript config with path aliases (`@/*`). |
| `artifacts/docquiz-ai/src/main.tsx` | Main React entry point mounting to DOM root. |
| `artifacts/docquiz-ai/src/App.tsx` | Route definitions, authentication state gate, and global query providers. |
| `artifacts/docquiz-ai/src/index.css` | Design system styling, color variables, paper shadows, and ink grids. |
| `artifacts/docquiz-ai/src/pages/home.tsx` | Document upload desk, file statistics, question setup, and difficulty selectors. |
| `artifacts/docquiz-ai/src/pages/quiz.tsx` | Interactive quiz interface, countdown timer, recall questions, and review summaries. |
| `artifacts/docquiz-ai/src/pages/challenge.tsx`| Multiplayer challenge arena and competitive leaderboard view. |
| `artifacts/docquiz-ai/src/pages/auth.tsx` | Login, account registration, avatar selector, and security question recovery forms. |
| `artifacts/docquiz-ai/src/pages/not-found.tsx`| 404 page for unmatched routes. |
| `artifacts/docquiz-ai/src/components/app-shell.tsx` | Header bar, logo branding, and user account dropdown. |
| `artifacts/docquiz-ai/src/components/lens-scanner-modal.tsx` | Visual tutor modal with camera/image file scanning and step-by-step solutions. |
| `artifacts/docquiz-ai/src/components/challenge-create-modal.tsx`| Timed peer challenge creation dialog. |
| `artifacts/docquiz-ai/src/components/challenge-card.tsx` | Display card for active multiplayer quiz challenges. |
| `artifacts/docquiz-ai/src/components/discord-settings-modal.tsx`| Discord configuration and webhook preference panel. |
| `artifacts/docquiz-ai/src/components/animated-avatar.tsx` | Interactive SVG avatar preview and customizer modal. |
| `artifacts/docquiz-ai/src/components/badges-modal.tsx` | Achievement and gamification trophy showcase. |
| `artifacts/docquiz-ai/src/components/quiz-toolbar.tsx` | Floating toolbar for quiz adjustments, font size, and audio. |
| `artifacts/docquiz-ai/src/components/ask-ai-bar.tsx` | Quick visual AI tutor prompt bar. |
| `artifacts/docquiz-ai/src/components/error-boundary.tsx` | React error boundary with fallback UI and recovery. |
| `artifacts/docquiz-ai/src/components/ui/` | Complete library of 40+ Radix UI-backed components. |
| `artifacts/docquiz-ai/src/lib/auth-context.tsx` | Authentication React Context provider and hook (`useAuth`). |
| `artifacts/docquiz-ai/src/lib/auth-service.ts` | Client HTTP requests for authentication endpoints. |
| `artifacts/docquiz-ai/src/lib/storage.ts` | Local storage management for documents, quizzes, and difficulty settings. |
| `artifacts/docquiz-ai/src/lib/gamification.ts` | XP scoring, levels, streak management, and badge trigger logic. |
| `artifacts/docquiz-ai/src/lib/avatar-generator.ts` | Procedural SVG avatar creation utilities. |
| `artifacts/docquiz-ai/src/lib/utils.ts` | Classname merging (`clsx` + `tailwind-merge`). |
| `artifacts/docquiz-ai/src/hooks/use-toast.ts` | Toast notification state management. |
| `artifacts/docquiz-ai/src/hooks/use-mobile.tsx` | Screen breakpoint detection hook. |
| **`artifacts/mockup-sandbox/`**| **Component prototyping environment** |
| `artifacts/mockup-sandbox/package.json` | Development sandbox dependencies. |
| `artifacts/mockup-sandbox/vite.config.ts` | Sandbox Vite setup. |
| `artifacts/mockup-sandbox/src/App.tsx` | Component gallery test harness. |
| **`lib/api-spec/`** | **OpenAPI contracts and code generators** |
| `lib/api-spec/openapi.yaml` | OpenAPI 3.1 specification for all endpoints and schemas. |
| `lib/api-spec/orval.config.ts` | Orval generator configuration. |
| `lib/api-spec/package.json` | Codegen build scripts (`pnpm run codegen`). |
| **`lib/api-zod/`** | **Generated runtime Zod schemas** |
| `lib/api-zod/src/index.ts` | Public export of Zod validators and TypeScript types. |
| `lib/api-zod/src/generated/api.ts` | Auto-generated Zod request and response schemas. |
| **`lib/api-client-react/`** | **Generated React Query client library** |
| `lib/api-client-react/src/index.ts` | Export of React Query hooks and custom fetch functions. |
| `lib/api-client-react/src/custom-fetch.ts` | Custom fetch wrapper with bearer auth and typed error parsing. |
| `lib/api-client-react/src/generated/api.ts` | Auto-generated TanStack Query hooks. |
| **`lib/db/`** | **PostgreSQL & Drizzle ORM layer** |
| `lib/db/drizzle.config.ts` | Drizzle Kit configuration. |
| `lib/db/src/index.ts` | Database connection client and schema re-exports. |
| `lib/db/src/schema/users.ts` | User table definition and types. |
| `lib/db/src/schema/discord.ts` | Discord connections, servers, challenges, and participants tables. |
| **`scripts/`** | **Testing & CI automation** |
| `scripts/package.json` | Script runner dependencies (`tsx`, `typescript`). |
| `scripts/src/test_auth.ts` | Integration test for the authentication workflow. |
| `scripts/src/test_chat.ts` | Integration test for the multimodal visual tutor. |
| `scripts/src/test_discord.ts` | Integration test for Discord challenges and leaderboards. |
| `scripts/src/hello.ts` | Basic verification script. |
| `scripts/post-merge.sh` | Post-merge Git automation script. |
| **`.agents/memory/`** | **Agent persistent context** |
| `.agents/memory/MEMORY.md` | Agent memory index. |
| `.agents/memory/ai-provider-fallback.md` | Guidelines on bounded AI queries and graceful local fallback. |
