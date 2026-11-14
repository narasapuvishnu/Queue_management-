# 🎯 QueueFlow Technical Interview Preparation Guide

This cheat sheet prepares you to explain every technical, architectural, and design decision made in this project during the technical interview with the Rugas Team.

---

## 1. High-Level Architecture

**Q: Can you describe the high-level architecture of your application?**
> "QueueFlow is an enterprise-grade full-stack queue management system architected in a modular client-server pattern:
> - **Frontend**: Built with React 19 and Vite, styled using Tailwind CSS v4. It features a responsive SPA with views for live queue operations, multi-queue management, deep analytics with Chart.js, and a dedicated Waiting Room TV Kiosk mode.
> - **Backend**: Node.js and Express 5 REST API organized into controllers, middleware, routes, and data access layers.
> - **Data Persistence**: Powered by an ACID-compliant atomic file-backed JSON database engine that guarantees durability through atomic write-and-replace semantics without requiring external database dependencies for local or cloud deployment.
> - **Deployment**: Fully pre-configured for Render with automated build scripts (`render.yaml`) and integrated SPA fallback routing."

---

## 2. Queue Ordering & Token Reordering Algorithm (Move Up / Down)

**Q: How do you handle queue ordering and the Move Up / Move Down functionality?**
> "Each token in the waiting state has a sequential `position` integer ($1, 2, 3, \dots, N$).
> 1. When a new person is added, their initial position is $N + 1$ (FIFO).
> 2. When a manager clicks **Move Up** on token $A$ at position $k$:
>    - We validate boundary condition ($k > 1$).
>    - We locate token $B$ at position $k - 1$.
>    - We swap their positions ($A \to k - 1$, $B \to k$).
>    - We run a deterministic re-indexing pass `reindexWaitingTokens()` that sorts by position and guarantees continuous numbering $1, 2, \dots, N$ with zero gaps or collisions.
> 3. Moving **Down** follows the inverse logic with boundary check ($k < N$)."

---

## 3. Top of Queue Assignment ("Call Next for Service")

**Q: What happens when the manager clicks "Call Next for Service"?**
> "The endpoint `POST /api/tokens/queue/:queueId/call-next` performs an atomic state transition:
> 1. It queries the waiting roster for the token at position $1$.
> 2. If a token is currently `IN_SERVICE`, it automatically transitions that token to `COMPLETED` and stamps `completedAt = Date.now()`.
> 3. The top token is transitioned from `WAITING` to `IN_SERVICE`:
>    - `serviceStartedAt = Date.now()`
>    - `position = null` (no longer in the waiting queue)
> 4. The queue's `currentServingTokenId` is updated to this token.
> 5. The remaining waiting tokens are shifted up by 1 ($2 \to 1$, $3 \to 2$, etc.) via `reindexWaitingTokens()`.
> 6. On the frontend, a synthetic sound chime plays via Web Audio API, and the active counter stopwatch timer begins ticking."

---

## 4. Token Cancellation

**Q: How is cancellation handled, and what happens to the remaining tokens in line?**
> "When a manager cancels a token:
> 1. The token's status transitions to `CANCELLED`.
> 2. A cancellation timestamp and manager-provided reason (e.g. 'Customer left', 'Duplicate') are recorded for audit logs and analytics.
> 3. If the cancelled token was in the waiting queue, the positions of all downstream tokens are recalculated so there is no gap in the queue line."

---

## 5. Analytics & Metrics Calculation

**Q: How did you compute wait times and queue length trends?**
> "We compute wait time and service duration using real timestamps:
> - **Wait Time** = `serviceStartedAt - createdAt` (in minutes).
> - **Service Time** = `completedAt - serviceStartedAt` (in minutes).
> - **Hourly Traffic Flow**: We group tokens by the hour of arrival (`new Date(t.createdAt).getHours()`) and the hour of service to produce the hourly volume trend line chart.
> - **Wait Time Distribution**: Grouped into histogram buckets ($<5\text{m}$, $5\text{–}15\text{m}$, $15\text{–}30\text{m}$, $>30\text{m}$) for operational SLA tracking."

---

## 6. Concurrency & Scaling Considerations

**Q: How would you scale this application to handle 100,000+ tokens per day across multiple locations?**
> "For massive enterprise scale:
> 1. **Database**: Migrate the atomic JSON data layer to PostgreSQL with row-level locking or Redis Sorted Sets (`ZADD`, `ZRANK`) for sub-millisecond priority queue operations.
> 2. **Real-time Synchronization**: Replace periodic client polling with WebSockets (`Socket.io`) or Server-Sent Events (SSE) backed by a Redis Pub/Sub cluster.
> 3. **Stateless Horizontal Scaling**: Run multiple Express worker pods behind a load balancer with shared Redis and PostgreSQL.
> 4. **Multi-Tenancy**: Add tenant isolation keys (`organizationId`) across queues and tokens so multiple branches operate independently."

---

## 7. Security Decisions

**Q: What security measures did you implement?**
> 1. **Password Hashing**: Passwords are never stored in plaintext; hashed using `bcryptjs` with 10 salt rounds.
> 2. **Stateless Authentication**: JWT tokens signed with HMAC-SHA256, verified via auth middleware on protected mutating endpoints (`POST`, `PUT`, `DELETE`).
> 3. **Input Sanitization**: Request payloads are trimmed and validated before mutating database state.
> 4. **Graceful Error Handling**: Unhandled exceptions are caught by centralized middleware without leaking server internal stack traces to clients."
