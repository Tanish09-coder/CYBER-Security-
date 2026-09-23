# CyberRiskOS — Strict Team Ownership & Boundary Matrix

## Overview
This document defines the absolute, authoritative boundaries of file and module ownership for CyberRiskOS. Under no circumstances may any team member modify code outside their designated boundary without following the formal integration protocol documented in `tasks/INTEGRATION_RULES.md`.

---

## 1. Domain Ownership Matrix

| Domain Area | Primary Owner | Secondary Reviewer | Scope & Path Definition |
| :--- | :--- | :--- | :--- |
| **External Cyber Intelligence** | **TANISH** | Harsh | All public threat data connectors, raw payload provenance, synchronization runs, normalization, and intelligence APIs. |
| **Enterprise Internal Context** | **HARSH** | Tanish | Organizations, business units, assets, software inventories, CPE version matching, asset-vulnerability links, and control posture. |
| **Frontend & Visualization** | **NISHIT** | Tanish | React application, UI shell, design tokens, light analytics theme, real-data explorers, detail modals, and API clients. |
| **Architecture & Shared Core** | **TANISH** | Harsh & Nishit | Server bootstrap, base database client, shared configuration, root Docker, and PRD coordination. |

---

## 2. Person 1: TANISH (Cyber Intelligence Lead)

### Owned Directories & Files
```text
backend/src/modules/nvd/
backend/src/modules/cisa-kev/
backend/src/modules/mitre-attack/
backend/src/modules/vcdb/
backend/src/modules/ingestion/
backend/src/modules/vulnerabilities/ (shared read-only for joins; core maintained by Tanish)

backend/src/scripts/verify-live-nvd.ts
backend/src/scripts/verify-live-cisa-kev.ts
backend/src/scripts/verify-live-mitre.ts (upcoming)
backend/src/scripts/verify-live-vcdb.ts  (upcoming)

docs/NVD_INTEGRATION.md
docs/CISA_KEV_INTEGRATION.md
docs/MITRE_ATTACK_INTEGRATION.md
docs/VCDB_INTEGRATION.md
docs/DATA_PROVENANCE.md

backend/src/db/migrations/001_nvd_ingestion.sql
backend/src/db/migrations/002_cisa_kev_ingestion.sql
backend/src/db/migrations/*_mitre_*.sql (upcoming)
backend/src/db/migrations/*_vcdb_*.sql  (upcoming)
```

### Absolute Boundaries
- **Must NOT modify**:
  - Any files in `frontend/` (owned by Nishit).
  - Any files in `backend/src/modules/organizations/`, `assets/`, `software/`, `controls/` (owned by Harsh).
  - Financial risk quantification engine (`risk-engine/`) unless formally assigned.
  - Optimization algorithms unless formally assigned.

---

## 3. Person 2: HARSH (Enterprise Context Lead)

### Owned Directories & Files
```text
backend/src/modules/organizations/
backend/src/modules/business-units/
backend/src/modules/assets/
backend/src/modules/software/
backend/src/modules/cpe-matching/
backend/src/modules/asset-vulnerabilities/
backend/src/modules/controls/
backend/src/modules/asset-controls/

backend/src/scripts/verify-asset-import.ts     (upcoming)
backend/src/scripts/verify-cpe-matching.ts     (upcoming)
backend/src/scripts/verify-control-status.ts   (upcoming)

docs/ASSET_MODEL.md
docs/SOFTWARE_INVENTORY.md
docs/CPE_MATCHING.md
docs/CONTROL_MODEL.md

backend/src/db/migrations/*_organizations_*.sql (upcoming)
backend/src/db/migrations/*_assets_*.sql        (upcoming)
backend/src/db/migrations/*_software_*.sql      (upcoming)
backend/src/db/migrations/*_controls_*.sql      (upcoming)
```

### Absolute Boundaries
- **Must NOT modify**:
  - Any files in `backend/src/modules/nvd/`, `cisa-kev/`, `mitre-attack/`, `vcdb/`, `ingestion/` (owned by Tanish).
  - Any files in `frontend/` (owned by Nishit).
  - Migrations created by Tanish (`001_...`, `002_...`).
  - Shared server setup beyond registering his own routes.

---

## 4. Person 3: NISHIT (Frontend Lead)

### Owned Directories & Files
```text
frontend/src/
frontend/public/
frontend/package.json
frontend/tsconfig.json
frontend/vite.config.ts (or equivalent config)
frontend/index.html
frontend/README.md

docs/DESIGN_SYSTEM.md (upcoming frontend UI specs)
docs/FRONTEND_ARCHITECTURE.md (upcoming)
```

### Absolute Boundaries
- **Must NOT modify**:
  - Any files in `backend/` (no backend logic, no controllers, no database migrations).
  - `database/` schema or migrations.
  - Must rely strictly on published REST API contracts documented in `docs/API_CONTRACTS.md`.
  - Must not generate or hardcode fake threat intelligence, fake assets, or fake risk numbers.

---

## 5. Shared Files Boundary (Integration Governance)

The following files are defined as **Shared Infrastructure Files**:

1. `PRD.md`
2. `PROJECT_STRUCTURE.md`
3. `RISK_MODEL.md`
4. `docker-compose.yml`
5. `database/schema.sql`
6. `backend/src/server.ts`
7. `backend/src/types/index.ts`
8. `backend/src/config/*` (`env.ts`, `logger.ts`)
9. `backend/src/db/index.ts`
10. `package.json` & package-lock files (backend and root)
11. `.env.example`

### Rules for Shared Files
- See `tasks/SHARED_FILES.md` for explicit edit procedures.
- In `backend/src/server.ts`, members may append ONLY their own route mounting lines (e.g., `app.use('/api/assets', assetRoutes);`). They must never reorder, rewrite, or refactor existing route registrations or middleware.
