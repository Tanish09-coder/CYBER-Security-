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
| `RISK_MODEL.md` | Quantitative Financial Risk Specs | Tanish |
| `docker-compose.yml` | Container Orchestration Configuration | Tanish |
| `database/schema.sql` | Baseline Database Schema Definition | Tanish / Harsh |
| `backend/src/server.ts` | Express Server Entrypoint & Route Mounting | Tanish (Lead Coordinator) |
| `backend/src/types/index.ts` | Global Shared TypeScript Interfaces | Tanish / Harsh |
| `backend/src/config/env.ts` | Zod Environment Schema & Runtime Config | Tanish |
| `backend/src/config/logger.ts` | Shared Winston/Console Structured Logger | Tanish |
| `backend/src/db/index.ts` | Database Connection Pool & Migration Runner | Tanish |
| `backend/package.json` | Backend Dependencies & Scripts | Tanish |
| `.env.example` | Root Environment Variable Template | Tanish |
| `.gitignore` | Version Control Exclusions | Tanish |

---

## 2. Six Mandatory Rules for Shared File Changes

Whenever a member needs to change any shared file:

1. **Document the Need First**: Record the required change in your `PROGRESS.md` or submit a request via `tasks/dependencies/`.
2. **Make the Smallest Possible Modification**: Do not touch lines outside your immediate need. Additive changes are preferred over destructive modifications.
3. **No Unrelated Formatting or Refactoring**: Never reformat, reorder, clean up imports, or apply linter auto-fixes to lines you did not write.
4. **Preserve Surrounding Comments & Semantics**: Retain existing docstrings, warnings, and architectural notes.
5. **No Local Secret Exposure**: Never write actual passwords, tokens, or runtime credentials into `.env.example` or any committed shared file. Real `.env` files are user-managed and must never be committed.
6. **Notify Integration Owner**: Coordinate with Tanish (Architecture Coordinator) before merging shared file changes.

---

## 3. Dedicated Rules for Specific Shared Files

### 3.1 `backend/src/server.ts`
When registering new module routes (e.g., Harsh adding `/api/organizations` or `/api/assets`):
- **Allowed**: Append your new router import and `app.use('/api/...', yourRouter);` in the designated route mounting section.
- **Strictly Prohibited**:
  - Reordering or renaming existing routes (e.g., `/api/integrations/nvd`, `/api/integrations/cisa-kev`, `/api/vulnerabilities`).
  - Modifying middleware (CORS, JSON parser, request logger, error handler).
  - Refactoring server bootstrap, port binding, or shutdown handlers.

### 3.2 `backend/src/config/env.ts` & `.env.example`
When introducing new environment variables (e.g., asset upload directory or MITRE endpoint):
- Update `.env.example` with clear comments, placeholder formats, and safe defaults.
- Update `backend/src/config/env.ts` by adding validated Zod keys to `envSchema`.
- **Never create, edit, commit, or overwrite any real `.env` file**.

### 3.3 Database Migrations & `backend/src/db/index.ts`
- **Never edit an existing migration file** once it has been committed or merged (e.g., `001_nvd_ingestion.sql`, `002_cisa_kev_ingestion.sql`).
- All schema changes must be introduced via **new, sequentially numbered migration files**.
- Every migration file must declare its owner and purpose at the top:
  ```sql
  -- =============================================================================
  -- Migration 003: MITRE ATT&CK Enterprise Matrix Tables
  -- Owner: TANISH
  -- Purpose: Ingestion and normalization of tactics, techniques, and mitigations
  -- =============================================================================
  ```
  or:
  ```sql
  -- =============================================================================
  -- Migration 004: Enterprise Organization & Business Unit Models
  -- Owner: HARSH
  -- Purpose: Internal tenant and departmental hierarchy storage
  -- =============================================================================
  ```
- `backend/src/db/index.ts` automatically runs all `migrations/*.sql` in alphanumeric order. Do not modify the runner logic unless resolving a database connectivity bug.

### 3.4 Root `package.json` & Backend `package.json`
- Adding a dependency (e.g., `csv-parse` for Harsh's CSV ingestion or charting libraries for Nishit) must be done cleanly:
  - Run `npm install <package>` only in the specific directory (`backend/` or `frontend/`).
  - Do not introduce conflicting versions of already installed libraries (`zod`, `axios`, `express`, `pg`).
