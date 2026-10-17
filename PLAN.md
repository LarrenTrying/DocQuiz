# PLAN.md (v2): Paper-to-Digital, Voice-First Clinic Assistant
### Now with login, separate Admin (clinic) and Customer (patient) portals

> **For any agent or teammate picking this up:** read sections 0 and 1 first, then the STATUS BOARD (section 10). Continue from the first unchecked item in your assigned lane. Update the status board and the HANDOFF LOG (section 11) before you stop.

---

## 0. How to use this file (handoff protocol)

1. This file is the single source of truth. If code and this file disagree, fix whichever is wrong and note it in the Handoff Log.
2. Work only in your lane (section 3) unless the status board shows a lane is blocked or abandoned. Then follow section 9 (redistribution).
3. After every finished task: tick the box in section 10 and add one line to section 11 (what was done, file paths, anything the next person must know).
4. Never change an interface contract (section 6) without writing the change in the Handoff Log and telling the other lanes.
5. If AI coding tokens or the Gemini API quota run out, follow section 8 and keep going on whatever still works.
6. Priorities: **P0** = demo breaks without it. **P1** = makes the demo impressive. **P2** = only if time remains.
7. **Admin and customer code must stay separate** (section 2.3). Never put an admin feature in a customer page or route, and never skip the role check.

---

## 1. Project summary

**One-liner:** Photograph the old paper register, speak visits in your own language, and the clinic is digital. No typing, no training. Patients get their own login to see their visits, bills, and prescriptions in simple words.

**Problem:** Small clinics and pharmacies in India often run on paper registers. Switching to software means re-typing years of records, and many staff are not comfortable typing in English. Patients, in turn, have no easy access to their own records.

**Why us vs. Practo / Eka Care / etc.:** Those tools serve clinics that are already digital. We serve clinics still on paper: onboarding by photo, daily use by voice, in regional languages.

### Two portals, one login page

| | **Admin portal** (clinic owner / doctor / pharmacist) | **Customer portal** (patient) |
|---|---|---|
| Who | Clinic staff. Accounts created by seed script or by an existing admin. **Never via public signup.** | Patients. Can self-sign-up. |
| Sees | All clinic data | **Only their own** visits, bills, and appointments |
| Features | Paper onboarding (register and shelf photos), voice visit entry, patients, billing and mark-paid, inventory and low stock, dashboard, copilot, appointment approvals, link patient to account | My visits, my bills, my prescriptions explained in simple words/language, request an appointment, view appointment status |
| URL area | `/admin/*` pages, `/api/admin/*` | `/customer/*` pages, `/api/me/*` |

**Safety rules (must appear in the pitch and the UI)**
- The AI only extracts, organizes, and explains what was already written. It gives no diagnosis or medical advice.
- A human reviews every extraction before it is saved.
- Customers can only ever read their own records. Role checks happen on the server, not just in the UI.
- Demo uses synthetic data only. No real patient data.

**Non-goals (roadmap slide only):** insurance, ABDM/ABHA integration (mock only if mentioned), real payments (a "Pay now" button may be a mock), WhatsApp integration, multi-clinic support, staff sub-roles (doctor vs pharmacist).

---

## 2. Tech stack and decisions

| Layer | Choice | Notes |
|---|---|---|
| AI | Gemini on Vertex AI (Flash-class model; check the current model ID in the console) | Multimodal: handwriting photos, shelf photos, audio. Use JSON structured output. |
| Voice | **Primary:** send audio directly to Gemini with the structured schema. **Fallback:** Speech-to-Text, then Gemini on the transcript. | Confirm supported languages first. Demo only languages actually tested. |
| **Auth** | **Firebase Authentication** (Email/Password; Google sign-in is P1) | Frontend signs in with the Firebase JS SDK, sends the ID token as `Authorization: Bearer <token>`. Backend verifies with `firebase-admin`. |
| **Roles** | `users/{uid}` document in Firestore with `role: "admin" | "customer"` | Role is read from Firestore on the server, **never** from the client. |
| Database | Firestore | Section 4. All access goes through the backend. Firestore rules deny direct client access (`allow read, write: if false;`). |
| File storage | Cloud Storage | Uploaded photos and audio. |
| Backend | Python + FastAPI | One service. |
| Frontend | Plain HTML + JS (Tailwind via CDN), served by FastAPI as static files. No build step. | Team may swap in React if everyone agrees in the first 15 minutes. |
| Hosting | Cloud Run (single container) | A public URL is part of the demo. |

### 2.1 Environment variables (`.env`, never commit)
```
GCP_PROJECT=
GCP_REGION=
GEMINI_MODEL=
BUCKET_NAME=
MOCK_AI=false           # true = return fixtures instead of calling Gemini (section 8)
AUTH_DISABLED=false     # true = local dev only, fake user from X-Dev-Role header. MUST be false on Cloud Run.
FIREBASE_WEB_CONFIG=    # public web config goes in static/firebase-config.js (not secret)
```

### 2.2 Auth flow
1. User opens `/login.html`. Tabs: **Sign in** (everyone) and **Create patient account** (customers only).
2. Firebase signs in and returns an ID token.
3. Frontend calls `POST /api/auth/session` with the token. Backend verifies it, creates `users/{uid}` as `customer` on first login (never `admin`), tries to auto-link to a patient record by matching email or phone, and returns `{role, patient_id, display_name}`.
4. Frontend redirects: `admin` goes to `/admin/dashboard.html`, `customer` goes to `/customer/home.html`.
5. Every API call carries the token. Backend dependencies:
   - `require_user()`: valid token, user exists.
   - `require_admin()`: user role must be `admin`, else **403**.
   - `require_customer()`: user role must be `customer`, else **403**.
6. Every page loads `guard.js`, which redirects to login if there is no session and redirects to the correct portal if the role does not match the page area. This is only for UX. The real protection is the backend.

### 2.3 Separation rules (admin vs customer)
- **Routes:** admin routes live in `routes/admin/` and mount at `/api/admin/*`, all depending on `require_admin`. Customer routes live in `routes/customer/` and mount at `/api/me/*`, all depending on `require_customer`.
- **Data scoping:** every customer endpoint filters by the `patient_id` stored on the caller's `users` doc. The client never sends a patient ID for "my" data.
- **Frontend:** separate folders `static/admin/` and `static/customer/`, with separate nav bars and different visual accent colors so the two portals look clearly distinct in the demo.
- **Admin creation:** only `seed/seed.py` or `POST /api/admin/staff` (P2) can create admins. Public signup always creates customers.
- **Test that proves it:** logged in as a customer, calling any `/api/admin/*` route returns 403, and opening `/admin/dashboard.html` redirects away. Run this before the demo and consider showing it live.

### 2.4 Repo layout
```
/app
  main.py                    # FastAPI app, mounts routers, serves /static
  auth.py                    # token verify, require_user/admin/customer, AUTH_DISABLED dev bypass   (Lane A)
  routes/
    auth_routes.py           # POST /api/auth/session, GET /api/me                                   (Lane A)
    admin/
      onboarding.py          # register + shelf photo extraction, confirm                            (Lane B)
      inventory.py           # medicines list, stock, low stock                                      (Lane B)
      visits.py              # voice visit draft + confirm                                           (Lane C)
      billing.py             # create_bill, mark paid, list bills                                    (Lane C)
      copilot.py             # question answering with tools                                         (Lane C)
      dashboard.py           # summary cards and lists                                               (Lane A)
      patients.py            # list, search, link email/phone to a patient                           (Lane A)
      appointments.py        # list, approve/decline (P1)                                            (Lane A)
    customer/
      me.py                  # my visits, my bills, my prescriptions + explanation, appointments     (Lane A)
  services/
    gemini.py                # call_gemini() with MOCK_AI and cache                                  (Lane A)
    firestore.py             # DB helpers                                                            (Lane A)
    matching.py              # fuzzy match medicines/patients                                        (Lane C)
  static/
    login.html               # shared login + patient signup                                         (Lane D)
    firebase-config.js, app.js, guard.js                                                             (Lane D)
    admin/    dashboard.html onboarding.html visit.html patients.html inventory.html bills.html copilot.html appointments.html   (Lane D, onboarding review UI shared with B)
    customer/ home.html visits.html bills.html appointments.html                                     (Lane B from ~1:45, shell by D)
/fixtures                    # canned AI responses for MOCK_AI mode (every lane adds its own)
/seed/seed.py                # fake clinic data + demo accounts                                        (Lane D)
/samples                     # test photos and audio                                                   (B and C)
PLAN.md  Dockerfile  requirements.txt
```

### 2.4a Demo accounts (created by `seed/seed.py`)
```
admin@demo.clinic     / (set in seed)     role: admin
patient@demo.clinic   / (set in seed)     role: customer, linked to seeded patient "Ramesh K"
patient2@demo.clinic  / (set in seed)     role: customer, linked to another patient (to prove no data leakage)
```
Do not use real emails or real passwords. Share the demo passwords only inside the team.

---

## 3. Team lanes (four people)

Names are placeholders. Assign real names in the first 10 minutes.

### Lane A: Platform, auth and roles, customer API
**Owner:** Vineeth
**Owns:** GCP + Firebase setup, auth middleware, shared helpers, admin dashboard/patients/appointments APIs, **all customer APIs**, Cloud Run deploy.
- [P0] Create project, enable APIs (Vertex AI, Firestore, Cloud Storage, Cloud Run, Speech-to-Text), service account and IAM for the team.
- [P0] Add Firebase to the project, enable Email/Password sign-in, add the Cloud Run domain to Firebase "Authorized domains" (**common gotcha: login fails on the deployed URL if this is missed**).
- [P0] `services/gemini.py`: `call_gemini(prompt, schema, files=None)` with `MOCK_AI`, retries, cache. **Done by 0:45, it unblocks B and C.**
- [P0] `auth.py` with `require_user / require_admin / require_customer` and the **`AUTH_DISABLED` dev bypass** (fake user chosen by `X-Dev-Role: admin|customer` header) so no one is blocked while real login is being finished. **Done by 0:45.**
- [P0] `POST /api/auth/session`, `GET /api/me`, auto-link customer to patient by email/phone.
- [P0] Firestore helpers and security rules (deny all direct client access).
- [P0] Customer API (`/api/me/*`): visits, bills, prescription explanation (Gemini, grounded only in that visit's saved data, plain language, chosen language, "not medical advice" footer), appointments (P1).
- [P0] Admin: `dashboard.py` (summary, low stock, unpaid, patients today), `patients.py` (list, search, link email).
- [P0] Dockerfile, first deploy by 2:30, **set `AUTH_DISABLED=false` on Cloud Run**.
- [P1] `appointments.py` for admin approve/decline.
- [P2] `POST /api/admin/staff` to create more admins, Google sign-in.

### Lane B: Paper-to-digital onboarding, inventory, customer portal UI
**Owner:** Larren (tentative, swap if needed)
**Owns:** photo extraction, stock management, and (from about 1:45) the customer portal screens.
- [P0] Collect 5 to 8 sample images in `/samples`: a handwritten register page (write one with fake data), a prescription slip, a medicine shelf, one messy example.
- [P0] `admin/onboarding.py`: `POST /api/admin/onboarding/register` (image to rows with `confidence` and `needs_review`), `POST /api/admin/onboarding/confirm` (saves to `patients` and `visits`). Prompt rule: never guess, return `null` and `needs_review: true`.
- [P0] `admin/inventory.py`: list medicines, update stock and price, low-stock flag. (Lane C calls the deduct function when a bill is created, agree on its name in section 6.4.)
- [P0, from 1:45] **Customer portal UI** in `static/customer/`: home (greeting plus summary), visits list and detail with "Explain in simple words" button, bills list with paid/unpaid badge, using Lane A's `/api/me/*` (build against the contract and fixtures first).
- [P1] Shelf photo to medicines: `POST /api/admin/onboarding/shelf`.
- [P1] Customer appointment request form and status list.
- [P1] "Listen" button on the explanation using Cloud Text-to-Speech.
- [P2] Duplicate patient merge on confirm.

### Lane C: Admin voice visits, billing, copilot
**Owner:** Pratik (tentative, swap if needed)
**Owns:** speech to structured visit, medicine matching, bills, copilot.
- [P0] Record 3 to 5 sample audio clips in `/samples` (English plus at least one regional language, fake patients).
- [P0] `admin/visits.py`: `POST /api/admin/visits/voice` (audio to draft visit), `POST /api/admin/visits/confirm` (saves visit, then calls `create_bill`).
- [P0] `matching.py`: fuzzy match spoken medicine names to the clinic's `medicines`. Low-confidence matches are highlighted, never silently accepted. Also match spoken patient name to existing patients.
- [P0] `admin/billing.py`: `create_bill(visit_id)` (items, fee, total, deducts stock via Lane B's function), list bills, `PATCH /api/admin/bills/{id}/paid`.
- [P1] `admin/copilot.py`: Gemini function calling over tools `get_low_stock()`, `get_unpaid_bills()`, `get_todays_patients()`, `get_revenue(range)`, `get_patient_history(name)`. **Read-only. The copilot never writes to the database and is admin-only.**
- [P1] Voice input for the copilot.
- [P2] Draft purchase-order text for low-stock items.
- Fallback if direct audio is weak: Speech-to-Text transcript, then Gemini.

### Lane D: Login, admin UI, seed data, demo and pitch
**Owner:** Abhishek (tentative, swap if needed)
**Owns:** the login page, all admin screens, the shared auth JS, seed data, demo script, slides.
- [P0] `login.html` (Sign in plus Create patient account tabs), `firebase-config.js`, `app.js` (fetch wrapper that attaches the token), `guard.js` (role-based redirect). **Done by 1:00 so everyone can log in.**
- [P0] Admin shell with its own nav and accent color: Dashboard, Onboard, New Visit, Patients, Inventory, Bills, Ask (copilot), Appointments (P1).
- [P0] Onboarding screen: upload, loading state, editable review table, highlight `needs_review`, confirm.
- [P0] Visit screen: record button (MediaRecorder), editable draft visit, confirm, shows the resulting bill and stock change.
- [P0] Dashboard screen (cards plus tables), Patients screen (with "link email" field), Bills screen (mark paid), Inventory screen.
- [P0] `seed/seed.py`: 50 fake patients, 40 medicines with prices and stock, 150 past visits and bills, **plus the three demo accounts in 2.4a** (one admin, two customers each linked to a different patient).
- [P0] Build against mock JSON from the contracts first, never wait for backend lanes.
- [P1] Copilot chat box with mic button, safety banner ("AI-assisted. Review before saving. Not medical advice.").
- [P1] Slides, Q&A sheet.
- **Owns the backup demo video** (full run: login as admin, voice visit, login as patient, see bill), recorded by 3:30.

---

## 4. Firestore data model

All documents carry `created_at` and `clinic_id` (use `"demo"`).

```
users/{uid}                       # uid = Firebase Auth uid
  email, display_name, role ("admin"|"customer"), patient_id (customers only, nullable), language ("en"|"hi"|"kn"|"ta")

patients/{patient_id}
  name, age, sex, phone, email, linked_uid (nullable), source ("register_photo"|"manual"|"voice")

visits/{visit_id}
  patient_id, patient_name, date, complaint,
  medicines: [{name, matched_medicine_id, dose, frequency, duration_days, quantity}],
  notes, status ("draft"|"confirmed"), source ("register_photo"|"voice")

medicines/{medicine_id}
  name, strength, unit_price, stock_qty, low_stock_threshold, expiry_date (optional)

bills/{bill_id}
  visit_id, patient_id, items: [{medicine_id, name, qty, unit_price, line_total}],
  consultation_fee, total, paid (bool), paid_at (nullable)

appointments/{appt_id}            # P1: the link between the two portals
  patient_id, requested_date, requested_slot, reason_note,
  status ("requested"|"approved"|"declined"), admin_note

ai_logs/{log_id}                  # P1: AI output vs final saved value
  kind, input_ref, ai_output, user_final, actor_uid
```

---

## 5. Features by portal (acceptance checklist)

### 5.1 Admin portal
- [ ] Can only be entered with an `admin` account
- [ ] Upload register photo, review and fix rows, confirm to save
- [ ] Speak a visit, review draft, confirm, bill created, stock deducted
- [ ] Dashboard: patients today, revenue today, unpaid bills, low stock
- [ ] Patients list with search and "link email" to connect a patient to a customer account
- [ ] Bills list with "mark as paid"
- [ ] Inventory list with low-stock highlight
- [ ] Copilot answers a question from real data
- [ ] (P1) Approve or decline appointment requests
- [ ] (P1) Shelf photo to inventory

### 5.2 Customer portal
- [ ] Can sign up and log in, lands on the customer home (never the admin area)
- [ ] Sees **only their own** visits and bills (verify with the second demo patient)
- [ ] "Explain in simple words" on a visit: medicines, dose, timing in plain language and chosen language, no diagnosis, "ask your doctor" footer
- [ ] Shows paid/unpaid on each bill
- [ ] (P1) Request an appointment, see its status after admin decision
- [ ] (P1) Listen to the explanation (Text-to-Speech)
- [ ] (P1) "Pay now" mock button that calls the same mark-paid path

### 5.3 Separation checks (run before the demo)
- [ ] Customer token calling `/api/admin/dashboard/summary` returns 403
- [ ] Customer opening `/admin/dashboard.html` is redirected to the customer home
- [ ] Patient 1 cannot fetch Patient 2's visit or bill by guessing an ID (returns 404 or 403)
- [ ] Public signup cannot create an admin
- [ ] `AUTH_DISABLED=false` on the deployed service

---

## 6. Interface contracts (do not change silently)

### 6.1 Gemini schema: register extraction (Lane B)
```json
{
  "rows": [
    {
      "patient_name": "string|null",
      "age": "number|null",
      "sex": "M|F|other|null",
      "date": "YYYY-MM-DD|null",
      "complaint": "string|null",
      "medicines_text": "string|null",
      "confidence": 0.0,
      "needs_review": true
    }
  ],
  "page_notes": "string"
}
```

### 6.2 Gemini schema: voice visit (Lane C)
```json
{
  "language_detected": "string",
  "transcript": "string",
  "patient_name": "string|null",
  "age": "number|null",
  "complaint": "string|null",
  "medicines": [
    { "name": "string", "dose": "string|null", "frequency": "string|null", "duration_days": "number|null" }
  ],
  "notes": "string|null",
  "needs_review_fields": ["string"]
}
```

### 6.3 Endpoints

**Auth (any logged-in user)**
```
POST /api/auth/session            {id_token}   -> {role, patient_id, display_name}
GET  /api/me                                   -> {uid, email, role, patient_id, language}
```

**Admin only (`require_admin`), prefix `/api/admin`**
```
POST  /onboarding/register        multipart image     -> {rows:[...]}                  (B)
POST  /onboarding/shelf           multipart image     -> {medicines:[...]}             (B)
POST  /onboarding/confirm         {rows|medicines}    -> {saved: n}                    (B)
GET   /medicines   PATCH /medicines/{id}                                               (B)
POST  /visits/voice               multipart audio     -> draft visit                   (C)
POST  /visits/confirm             {visit}             -> {visit_id, bill}              (C)
GET   /bills      PATCH /bills/{id}/paid                                               (C)
POST  /copilot                    {question}          -> {answer, data}                (C)
GET   /dashboard/summary | /dashboard/low-stock | /dashboard/unpaid-bills | /dashboard/patients-today   (A)
GET   /patients   PATCH /patients/{id}/link-email  {email}                             (A)
GET   /appointments   POST /appointments/{id}/decision {status, admin_note}  (P1)      (A)
```

**Customer only (`require_customer`), prefix `/api/me`**
```
GET   /visits                                      -> my visits only                    (A)
GET   /visits/{visit_id}                           -> 404 if not mine                   (A)
POST  /visits/{visit_id}/explain {language}        -> {explanation, disclaimer}         (A)
GET   /bills                                       -> my bills only                     (A)
POST  /bills/{bill_id}/pay                         -> mock pay (P1)                     (A)
POST  /appointments {requested_date, slot, reason} -> {appt}   (P1)                     (A)
GET   /appointments                                -> my appointments  (P1)             (A)
```

### 6.4 Python functions shared across lanes
```python
call_gemini(prompt, schema, files=None)       # Lane A. Respects MOCK_AI, caches by input hash
require_user / require_admin / require_customer   # Lane A, FastAPI dependencies
create_bill(visit_id) -> dict                 # Lane C. Builds bill, calls deduct_stock, returns bill
deduct_stock(items) -> list                   # Lane B. Reduces stock, returns low-stock warnings
```

### 6.5 Prompt starters

**Register extraction:** "You are reading a photo of a handwritten clinic register. Extract each row. Use only what is written. If a field is unclear or missing, return null and set needs_review to true. Do not guess names, ages, or medicines. Return JSON matching the schema."

**Voice visit:** "The audio is a doctor dictating a clinic visit, in Kannada, Hindi, Tamil, or English, possibly mixed. Return the transcript and extract patient name, age, complaint, and medicines with dose, frequency, and duration. If anything is unclear, list it in needs_review_fields. Do not add medicines or advice that were not spoken."

**Copilot (admin):** "You answer questions about this clinic's data using only the provided tools. Do not give medical advice. If the tools cannot answer, say so."

**Customer explanation:** "You are explaining a patient's own prescription record in simple words in {language}. Use only the medicines, doses, and durations in the data. Do not diagnose, do not suggest other medicines, do not say what condition the patient has. End with: 'Please ask your doctor or pharmacist if you have any doubts.'"

---

## 7. Four-hour timeline

| Time | A (Platform/Auth/Customer API) | B (Onboarding/Inventory/Customer UI) | C (Voice/Billing/Copilot) | D (Login/Admin UI/Seed/Pitch) |
|---|---|---|---|---|
| 0:00 to 0:30 | GCP + Firebase setup, IAM for all | Collect sample photos | Record sample audio | Repo, static shell, mock JSON |
| 0:30 to 1:00 | **`call_gemini` + `auth.py` with dev bypass (by 0:45)**, session endpoint | Register extraction endpoint | Voice endpoint | **Login page + guard.js (by 1:00)**, admin shell |
| 1:00 to 1:45 | Firestore helpers, customer API (`/api/me/*`) | Confirm endpoint, inventory endpoints | Matching, confirm to bill, `deduct_stock` hookup | Onboarding + visit screens |
| 1:45 to 2:30 | Admin dashboard + patients APIs, **first Cloud Run deploy by 2:30** | **Customer portal UI** (home, visits, bills) | Bills (mark paid), start copilot | Dashboard, patients, bills, inventory screens, seed script |
| 2:30 to 3:00 | Real auth on deployed URL, run separation checks (5.3) | Explain button + polish, appointments (P1) | Copilot finish | Connect all screens to real endpoints, copilot UI |
| 3:00 to 3:40 | Redeploy, end-to-end test **as both roles** | End-to-end test, shelf photo (P1) | End-to-end test | **Record backup demo video**, slides |
| 3:40 to 4:00 | Code freeze at 3:40. Everyone: rehearse the pitch, assign Q&A answers |

**Checkpoints (everyone stops and syncs):**
- **1:00:** can a user log in and land on the right portal (even via the dev bypass)? Can Gemini extract at least one register page and one audio clip?
- **2:15:** does the full admin flow work locally (photo to patients, voice to bill to stock)?
- **2:45:** is it deployed with real login, seeded data, and `AUTH_DISABLED=false`?
- **3:15:** does the customer portal show real bills and visits for the seeded patient, and nobody else's?
- **3:40:** code freeze. Only bug fixes and demo prep.

---

## 8. Token and quota fallback plan

### 8.1 AI coding agent tokens run out
- Everything an agent needs is in this file. A new agent reads sections 0 to 6, the status board, and the handoff log, then continues the first unchecked item in the assigned lane.
- Keep commits small and frequent with clear messages so the next agent can read `git log`.
- Keep each file under about 300 lines so an agent can read a whole file cheaply.
- Before stopping, write in the Handoff Log: the file you were editing, what works, what is broken, the exact next step.
- Ask the coding agent for short, targeted edits rather than whole-app regeneration.
- If one person's agent is out of tokens, a teammate with budget takes over their lane using section 9.

### 8.2 Gemini API quota or cost runs out
- **`MOCK_AI=true`** returns canned JSON from `/fixtures` instead of calling Gemini. Every lane adds one fixture per AI call (for example `fixtures/register_sample1.json`, `fixtures/voice_sample1.json`, `fixtures/copilot_low_stock.json`, `fixtures/explain_visit1.json`). The app keeps working for UI work and demo fallback.
- **Cache:** `call_gemini` hashes (prompt + file bytes) and stores the result, so repeat runs on the same sample cost nothing.
- Use the cheaper/faster model by default.
- Resize photos to about 1600px on the long edge, cap audio at 30 seconds, never call Gemini inside a loop over rows.
- Pre-run the exact demo inputs once so they are cached. If live AI fails on stage, flip `MOCK_AI=true`.

### 8.3 Firebase Auth trouble
- If real login breaks and time is short, use the dev bypass locally, and for the deployed demo fall back to the backup video. Do not ship `AUTH_DISABLED=true` publicly: it would let anyone act as admin. If you must use it for a private demo, keep the URL unshared and turn it off right after.
- Most common causes: Cloud Run domain missing from Firebase authorized domains, wrong web config in `firebase-config.js`, or Email/Password provider not enabled.

---

## 9. Redistribution if someone is blocked or out of budget

Priority order if only some work can be finished. Cut from the bottom.

1. Admin voice visit to bill to stock deduction (C + B + A)
2. Login with role separation, admin vs customer (A + D)
3. Register photo to patient table with review (B + D)
4. Admin dashboard with seeded data (A + D)
5. Customer portal: my visits and my bills (A + B)
6. Deployed Cloud Run URL (A)
7. Customer "explain in simple words" (A + B)
8. Copilot (C)
9. Appointments request and approval (A, B, D)
10. Shelf photo, Text-to-Speech, forecast, duplicate merge (P2)

**If a lane owner is out:**
- **A out:** D takes login/session and auth middleware from the Firebase docs, C takes the dashboard APIs, B takes the customer API and the explain endpoint.
- **B out:** D takes the onboarding review screen, C takes inventory, A takes the customer UI with a minimal plain-table layout.
- **C out:** B takes the voice endpoint (same pattern as register extraction with audio), A takes billing, the copilot becomes P2.
- **D out:** A takes the login page, B takes admin screens for onboarding, C takes the visit screen. Keep the UI minimal. A plain table beats nothing.

---

## 10. STATUS BOARD

`[x]` done, `[~]` in progress (add name), `[ ]` not started.

**Lane A**
- [ ] GCP project, APIs, Firebase Auth enabled, team has access
- [ ] `call_gemini` with MOCK_AI and cache
- [ ] `auth.py` with role dependencies and dev bypass
- [ ] `/api/auth/session` and `/api/me`, auto-link by email/phone
- [ ] Firestore helpers and rules
- [ ] Customer API: visits, bills, explain
- [ ] Admin dashboard and patients APIs
- [ ] Dockerfile and Cloud Run deploy, `AUTH_DISABLED=false`, authorized domain added
- [ ] Separation checks (5.3) all pass
- [ ] (P1) Appointments admin and customer APIs

**Lane B**
- [ ] Sample photos collected
- [ ] Register extraction endpoint
- [ ] Onboarding confirm endpoint
- [ ] Inventory endpoints and `deduct_stock`
- [ ] Customer portal UI: home, visits, bills, explain button
- [ ] (P1) Customer appointments UI
- [ ] (P1) Shelf photo to medicines
- [ ] (P1) Text-to-Speech "Listen"

**Lane C**
- [ ] Sample audio recorded
- [ ] Voice endpoint
- [ ] Medicine and patient matching
- [ ] Visit confirm to `create_bill`
- [ ] Mark bill paid, bills list
- [ ] (P1) Copilot with function calling (admin only)
- [ ] (P1) Voice input for copilot

**Lane D**
- [ ] Login page, `app.js`, `guard.js`, `firebase-config.js`
- [ ] Admin shell and nav
- [ ] Onboarding screen with review table
- [ ] Visit screen with recorder
- [ ] Dashboard, patients, bills, inventory screens
- [ ] Seed script with demo accounts run
- [ ] (P1) Copilot UI and safety banners
- [ ] (P1) Admin appointments screen
- [ ] Backup demo video recorded
- [ ] Slides and Q&A sheet

---

## 11. HANDOFF LOG

Newest entries at the top. One line per entry: `[time] [lane/person] done / files / next step / known issues`

```
[0:00] Plan v2 created. Added Firebase login, admin vs customer portals, customer API and UI lanes. No code yet. Start with section 7, first row.
```

---

## 12. Demo script (3 to 4 minutes)

1. **Problem (20s):** photo of a messy handwritten register. "This is how most small clinics work."
2. **Login (15s):** one login page, sign in as **admin**.
3. **Onboard (40s):** upload the register photo, patient table fills, fix one highlighted cell to show human review, confirm.
4. **Voice visit (50s):** record a visit in a regional language, review the draft, confirm, show the bill and the stock number dropping.
5. **Dashboard and copilot (25s):** cards, then ask "Which medicines will run out this week?"
6. **Switch to the patient (50s):** log out, log in as **patient@demo**. Show their visit, the new bill, and "Explain in simple words" in their language. Mention that this account cannot open the admin pages (optionally show the redirect).
7. **Safety and roadmap (15s):** AI organizes only, human confirms, role-based access, synthetic data. Roadmap: WhatsApp reminders, ABDM-readiness, pilots with real clinics.
8. **Close (10s):** "Existing tools serve digital clinics. We bring the paper clinics online, and give their patients a window into their own care."

---

## 13. Likely judge questions (assign one owner each)

| Question | Owner | Answer direction |
|---|---|---|
| Why not Practo/Eka Care? | D | They serve already-digital clinics. We target paper clinics with photo onboarding and voice entry in regional languages. |
| How accurate is handwriting extraction? | B | Varies. Unclear fields are flagged, never guessed, and a human reviews before saving. Quote our own results on the samples. |
| What if the AI mishears a medicine? | C | Matched against the clinic's own medicine list, low-confidence matches highlighted, user confirms. |
| How do you keep patient data private and separate? | A | Firebase Auth, roles stored server-side, customer endpoints filtered to the caller's own patient ID, no direct database access from the browser. Production would add encryption review, consent flows, audit logs, and compliance review under Indian health data rules. |
| Can a patient see another patient's data, or become admin? | A | No. Admin accounts cannot be created through signup, all "my" queries are scoped by the token, and we tested cross-access (5.3). |
| Is the patient explanation medical advice? | B | No. It restates what the doctor recorded in simple words, never diagnoses, and tells the patient to ask their doctor. |
| Would clinics pay? Have you talked to any? | D | Be honest. Next step is pilots with 3 to 5 clinics. Mention any real contact a teammate has. |
| Why Google Cloud / Gemini? | A | Multimodal reads handwriting and audio without a separate OCR pipeline, Firebase Auth plus Firestore plus Cloud Run on one platform, fast deploy. |
| What is your moat? | D | Underserved segment, regional language depth, niche workflows later, speed and local trust. |
| Which languages? | C | Only claim languages we actually tested in the demo. |

Check any statistic or regulation claim before it goes on a slide.

---

## 14. Quick start commands

```bash
# one-time (Lane A shares results with the team)
gcloud auth login
gcloud config set project $GCP_PROJECT
gcloud services enable aiplatform.googleapis.com firestore.googleapis.com \
  storage.googleapis.com run.googleapis.com speech.googleapis.com

# Firebase: add Firebase to the same project in the Firebase console, enable
# Authentication > Sign-in method > Email/Password, copy the web config into
# app/static/firebase-config.js, and add your Cloud Run domain under
# Authentication > Settings > Authorized domains.

# local run (dev bypass, no real login needed)
pip install -r requirements.txt
AUTH_DISABLED=true uvicorn app.main:app --reload --port 8080
# call admin routes with header  X-Dev-Role: admin   and customer routes with  X-Dev-Role: customer

# deploy (after Dockerfile exists)
gcloud run deploy clinic-assistant --source . --region $GCP_REGION --allow-unauthenticated
# then confirm AUTH_DISABLED is false in the service's environment variables
```

`requirements.txt` starter: `fastapi`, `uvicorn`, `python-multipart`, `firebase-admin`, `google-cloud-firestore`, `google-cloud-storage`, `google-genai` (or `google-cloud-aiplatform`), `rapidfuzz`, `python-dotenv`.
