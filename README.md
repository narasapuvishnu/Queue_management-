# ⚡ QueueFlow — Enterprise Queue & Token Management System (Full-Stack)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Render Deployable](https://img.shields.io/badge/Render-Ready-46E3B7.svg)](https://render.com/)

A modern, production-grade **Full-Stack Queue & Token Management Application** designed for hospitals, banks, retail service counters, customer care hubs, and government service centers.

---

## 🌟 Demo Credentials & Quick Test

For immediate evaluation without manual registration:
- **Manager Email**: `admin@queueflow.com`
- **Password**: `admin123`
- **1-Click Login**: The login modal features an **"⚡ Instant 1-Click Demo Login"** button for immediate access.
- **Pre-seeded Queues**:
  1. `[DOC]` **Doctor Consultation OPD** (Healthcare)
  2. `[SUP]` **Customer Support & KYC** (Customer Care)
  3. `[BIL]` **Billing & Cash Counter** (Finance)

---

## 📋 Evaluation Requirements Compliance Matrix

| # | Requirement | Implementation Details | Status |
|---|-------------|------------------------|--------|
| **1** | **Manager login and create Queues** | JWT authentication with bcrypt hashing (`server/controllers/authController.js`), manager dashboard with queue creation modal (`client/src/components/CreateQueueModal.jsx`). | ✅ Verified |
| **2** | **Each Queue has a Name** | Custom name, auto-suggested prefix (e.g. `DOC`, `SUP`), department category, description, and status toggle (Active/Paused). | ✅ Verified |
| **3** | **Manager can add new persons / tokens into queue** | `POST /api/tokens` generates auto-incremented token numbers (e.g. `DOC-106`), assigns sequential FIFO position, records timestamp, and prints virtual token slip (`client/src/components/AddTokenModal.jsx`). | ✅ Verified |
| **4** | **Queue displays list of people / tokens waiting** | Real-time waiting table showing token #, customer name, phone, priority tag, live waiting duration counter, and position badge (#1, #2...). | ✅ Verified |
| **5** | **Manager can move tokens UP and DOWN** | `POST /api/tokens/:id/move` with `direction: 'up' \| 'down'`. Atomically swaps queue positions and re-indexes contiguous numbering (1..N). UI features ⬆️ and ⬇️ buttons on each row. | ✅ Verified |
| **6** | **Assign token at top of queue for service with a simple button click** | Dedicated **"⚡ Call Next for Service"** button with glowing UI and audio chime. Moves token #1 to `IN_SERVICE`, tracks service timer, and shifts remaining tokens up. | ✅ Verified |
| **7** | **Manager can cancel a token from the queue** | `POST /api/tokens/:id/cancel` with reason tracking modal (No-show, emergency, duplicate). Re-indexes remaining queue seamlessly. | ✅ Verified |
| **8** | **Dashboard showing analytics on wait times, queue trends, etc.** | Full analytics suite with Chart.js: Average wait times, service durations, hourly arrival vs served flow trends, wait time distributions, and CSV export. | ✅ Verified |

---

## 🚀 Key Features Beyond the Basics

1. **📺 Public TV / Kiosk Display Mode**:
   - Dedicated full-screen waiting room screen with giant **NOW SERVING** token number and upcoming tickets list.
2. **🔊 Web Audio Chime**:
   - Zero-dependency synthetic chime generated via Web Audio API whenever a token is called for service.
3. **⏱️ Real-Time Elapsed Timers**:
   - Live stopwatch timers for both waiting customers and the active counter consultation.
4. **🔄 Contiguous Re-Indexing Algorithm**:
   - Moving or cancelling tokens never leaves holes or fragmented queue numbers.
5. **📊 Interactive Analytics & CSV Export**:
   - Visual charts powered by Chart.js (Line trends, hourly bar charts, status doughnut) plus 1-click CSV report export.
6. **💾 Atomic File-Backed Database**:
   - Thread-safe JSON database engine with atomic temp-file replace (`fs.renameSync`). Zero external database setup needed for deployment.
7. **☁️ Render Deployment Blueprint**:
   - Pre-configured `render.yaml` and full-stack production build pipeline for single-click deployment.

---

## 🛠️ Tech Stack

- **Backend**:
  - Node.js & Express.js 5
  - JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - Atomic File Database Engine (`data/database.json`)
  - RESTful API architecture with centralized error handling
- **Frontend**:
  - React 19 (Vite build engine)
  - Tailwind CSS v4
  - Lucide React (modern icon suite)
  - Chart.js & React-Chartjs-2
- **Testing & Tooling**:
  - Automated integration test suite (`npm test`)
  - Seeding utility (`npm run seed`)

---

## 💻 Local Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Clone the Repository
```bash
git clone https://github.com/narasapuvishnu/Queue_management-.git
cd Queue_management-
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 4. Build the Frontend
```bash
npm run build
```

### 5. Start the Application
```bash
npm start
```
Visit **`http://localhost:5000`** in your browser.

> **Development Mode (Hot Reloading)**:
> In one terminal: `npm run server` (runs Express on port 5000)
> In a second terminal: `npm run client` (runs Vite dev server on port 5173 with API proxy)

---

## 🧪 Running Automated Tests

Run the comprehensive integration test suite verifying all 8 requirements:
```bash
npm test
```
**Test Results Output**:
```
🧪 Starting Queue Management Application Test Suite...
➡️  Test 1: Manager Registration & Login (JWT)        ✅ PASSED
➡️  Test 2: Create Named Queue                        ✅ PASSED
➡️  Test 3: Add Persons and Generate Tokens          ✅ PASSED
➡️  Test 4: Display Waiting Tokens Roster             ✅ PASSED
➡️  Test 5: Move Tokens Up and Down                   ✅ PASSED
➡️  Test 6: Call Next Token for Service               ✅ PASSED
➡️  Test 7: Cancel Token from Queue                   ✅ PASSED
➡️  Test 8: Analytics Dashboard Endpoint              ✅ PASSED

🎉 ALL 8 REQUIREMENTS TESTED AND PASSED FLAWLESSLY!
```

---

## ☁️ Deploying to Render

### Option A: Deploy via Blueprint (`render.yaml`)
1. Push this repository to GitHub.
2. In Render dashboard, click **"New +"** ➜ **"Blueprint"**.
3. Select your GitHub repository (`Queue_management-`).
4. Render will automatically read `render.yaml`, run `npm install && npm run build`, and launch the web service!

### Option B: Manual Web Service Setup
1. In Render, select **"New +"** ➜ **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (Any secure random string)
5. Click **"Deploy Web Service"**.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new manager (`name`, `email`, `username`, `password`)
- `POST /api/auth/login` — Login manager (`emailOrUsername`, `password`) ➜ returns JWT token
- `GET /api/auth/me` — Get current logged-in manager profile

### Queues (`/api/queues`)
- `GET /api/queues` — Get all queues with live waiting/serving counts and avg wait times
- `GET /api/queues/:id` — Get single queue details and full token roster
- `POST /api/queues` — Create new queue (`name`, `prefix`, `department`, `description`)
- `PUT /api/queues/:id` — Update queue settings or pause/resume
- `DELETE /api/queues/:id` — Delete queue and associated tokens

### Tokens (`/api/tokens`)
- `GET /api/tokens/queue/:queueId` — Get waiting, in-service, and completed tokens
- `POST /api/tokens` — Add person & create token (`queueId`, `personName`, `personPhone`, `serviceReason`, `priority`)
- `POST /api/tokens/:id/move` — Reorder token (`direction: 'up' | 'down'`)
- `POST /api/tokens/queue/:queueId/call-next` — Assign top token (#1) to service
- `POST /api/tokens/:id/complete` — Mark in-service token as completed
- `POST /api/tokens/:id/cancel` — Cancel token with reason

### Analytics (`/api/analytics`)
- `GET /api/analytics?queueId=all&timeRange=all` — Wait times, hourly queue trends, status distribution, and comparison metrics

---

## 🎓 Technical Interview Reference Guide

### 1. Data Structures & FIFO Queue Ordering
The queue utilizes a strict contiguous indexing algorithm ($1, 2, 3, \dots, N$). Tokens are added with `position = totalWaiting + 1`.

### 2. Move Up / Down Mechanics
When a token at position $i$ is moved **Up**:
1. Target position is $i - 1$ (if $i > 1$).
2. The positions of token $i$ and token $i - 1$ are swapped atomically.
3. A contiguous re-indexing pass ensures no gaps or duplicates exist.

### 3. State Transitions
$$\text{Created} \xrightarrow{} \text{WAITING} \xrightarrow{\text{Call Next}} \text{IN\_SERVICE} \xrightarrow{\text{Complete}} \text{COMPLETED}$$
$$\text{WAITING} \text{ or } \text{IN\_SERVICE} \xrightarrow{\text{Cancel}} \text{CANCELLED}$$

### 4. Wait Time & Service Time Calculation
- $\text{Wait Time} = \text{serviceStartedAt} - \text{createdAt}$
- $\text{Service Time} = \text{completedAt} - \text{serviceStartedAt}$

---

## 👨‍💻 Author & Credits
- **Developer**: Vishnu Vardhan Narasapu
- **GitHub**: [https://github.com/narasapuvishnu/Queue_management-.git](https://github.com/narasapuvishnu/Queue_management-.git)
- **Submitted to**: Rugas Team
