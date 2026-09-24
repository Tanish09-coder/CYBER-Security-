# CyberRiskOS — Shared Files Policy & Modification Protocol

## Overview
Shared files are components that sit at the boundary between different team members' domains. Uncoordinated edits to shared files are the leading cause of merge conflicts, broken builds, and runtime failures.

To protect system integrity, this document establishes the protocol for editing all shared assets.

---

## 1. Registry of Shared Files

The following files are strictly classified as **Shared Files**:

| Path | Purpose | Primary Coordinator |
| :--- | :--- | :--- |
| `PRD.md` | Master Product Requirements Document | Tanish |
| `PROJECT_STRUCTURE.md` | Architectural Directory Blueprint | Tanish |
| `MASTER_PROJECT_CONTEXT.md` | Core Cross-Domain System Context | Tanish |
| `RISK_MODEL.md` | Quantitative Financial Risk Specs | Tanish |
| `docker-compose.yml` | Container Orchestration Configuration | Tanish |
| `database/schema.sql` | Baseline Database Schema (Deprecated Reference) | Tanish / Harsh |
| `backend/src/server.ts` | Express Server Entrypoint & Route Mounting | Tanish (Lead Coordinator) |
| `backend/src/types/index.ts` | Global Shared TypeScript Interfaces | Tanish / Harsh |
| `backend/src/config/env.ts` | Zod Environment Schema & Runtime Config | Tanish |
| `backend/src/config/logger.ts` | Shared Winston/Console Structured Logger | Tanish |
| `backend/src/db/index.ts` | Database Connection Pool & Migration Runner | Tanish |
| `docs/API_CONTRACTS.md` | Authoritative Cross-Domain API Contract Registry | Tanish / Harsh / Nishit |
| `backend/package.json` & `package-lock.json` | Backend Dependencies & Version Lock | Tanish / Harsh |
| `frontend/package.json` & `package-lock.json` | Frontend Dependencies & Version Lock | Nishit |
| `.env.example` | Root Environment Variable Template | Tanish |
| `.gitignore` | Version Control Exclusions | Tanish |

---

## 2. Five Mandatory Rules for Shared File Changes (Phase 2–9 Protocol)

Shared files are the highest conflict risk in parallel multi-agent development. The following rules are non-negotiable:

1. **Strict Single-Editor Lock**:
   Only **ONE** person changes a shared file for a specific dependency at a time. Never make concurrent edits to `server.ts`, `docker-compose.yml`, or `package-lock.json`.
2. **Pre-Change Justification**:
   Before changing a shared file, explicitly record **why** the edit is required in your `PROGRESS.md` or file a structured request in `tasks/dependencies/`.
3. **Post-Change Audit Record**:
   Immediately after changing a shared file, record in your `PROGRESS.md`:
   - Exact file path modified.
   - Specific reason / dependency fulfilled.
   - Affected team members notified.
4. **Zero Unrelated Edits / Cleanup**:
   Never perform "drive-by" refactoring, re-formatting, import reordering, or linter cleanups on lines you did not write. Additive changes only.
5. **Atomic, Minimal Commits**:
   Keep shared-file commits small and isolated. Never bundle a `server.ts` route registration with 500 lines of module business logic.

---

## 3. Dedicated Rules for Specific Shared Files

### 3.1 `backend/src/server.ts`
When registering new module routes (e.g., Harsh adding `/api/financial-inputs` or Tanish adding `/api/risk`):
- **Allowed**: Append your new router import and `app.use('/api/...', yourRouter);` in the designated route mounting section.
- **Strictly Prohibited**:
  - Reordering or renaming existing routes (e.g., `/api/integrations/*`, `/api/vulnerabilities`, `/api/assets`, `/api/controls`).
  - Modifying middleware (CORS, JSON parser, request logger, error handler).
  - Refactoring server bootstrap, port binding, or shutdown handlers.

### 3.2 `docs/API_CONTRACTS.md`
- Acts as the single source of truth between Harsh's inputs, Tanish's engines, and Nishit's frontend.
- When delivering an API endpoint:
  - Document Method, Path, Query Params, Request Body DTO, Response DTO, Error formats.
  - Update status to `LIVE (Phase X)`.
  - Coordinate contract updates with Tanish (Architecture Lead).

### 3.3 `backend/src/config/env.ts` & `.env.example`
When introducing new environment variables (e.g., Python risk engine URL or OpenAI/Gemini API keys):
- Update `.env.example` with clear comments, placeholder formats, and safe defaults.
- Update `backend/src/config/env.ts` by adding validated Zod keys to `envSchema`.
- **Never create, edit, commit, or overwrite any real `.env` file**.

### 3.4 Database Migrations & `backend/src/db/index.ts`
- Migrations continue sequentially from `009_security_controls.sql`:
  - `010_...`
  - `011_...`
  - `012_...`
- Every migration must declare owner and purpose:
  ```sql
  -- Owner: HARSH
  -- Purpose: enterprise financial input storage
  ```
  or
  ```sql
  -- Owner: TANISH
  -- Purpose: risk result persistence
  ```
- **Never edit an already merged migration file**. All modifications require forward migrations.
- `backend/src/db/index.ts` automatically runs all `migrations/*.sql` in alphanumeric order. Do not modify the runner logic.

### 3.5 Package Files & `package-lock.json`
- Adding dependencies:
  - Backend dependencies (`npm install` inside `backend/`).
  - Frontend dependencies (`npm install` inside `frontend/`).
- Do not run bare `npm install` at root unless coordinating root tools.
- Never manually resolve `package-lock.json` merge conflicts with arbitrary text edits.

