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

---

## 6. Phase 2 → Final Delivery Frozen Ownership & Boundary Matrix (Phases 2–9)

This section freezes all ownership boundaries across **Tanish**, **Harsh**, and **Nishit** for all remaining platform development through final release.

```text
========================================================================================
HARSH (Enterprise & Business Inputs)
  ↓ Provides: Assets, Criticality, Controls, Costs, Budgets, Frameworks, Dependencies
TANISH (Risk Intelligence, Quantification & Decision Engine)
  ↓ Calculates: Risk Scores, Financial EAL, Scenarios, Optimizer Strategies, Attack Paths, AI
NISHIT (Frontend, Product Experience & Real-Data Visualization)
  Renders: Screens N8–N15, Real APIs, Decision Trade-offs, Explainability UI, Graph Views
========================================================================================
```

### 6.1 PERSON 1 — TANISH (Risk Intelligence, Quantification & Decision Engine Lead)

#### Primary Ownership:
1. **Risk Engine**: Deterministic Risk Model v1 evaluating `(asset_id, vulnerability_id)` pairs, CVSS, and verified evidence/context (CISA KEV exploitation, candidate exposure context, and defensive control posture).
   - **Phase 2 Modeling Guardrail**:
     - Do not pre-commit Risk Model v1 to an arbitrary ransomware multiplier, exposure weight, or control offset percentage.
     - Ransomware status, internet exposure, and control states are **candidate factors only** until the Phase 2A Risk Engine Contract (`docs/RISK_ENGINE_CONTRACT.md`) verifies their:
       - Source authority & provenance
       - Semantics
       - Defensibility
       - Quantitative treatment
       - Null / missing-data behavior
     - CISA KEV ransomware status may be used as verified empirical evidence, but must NOT be automatically converted into an arbitrary multiplier.
     - Asset internet exposure may be used as verified context, but its numerical weight must be defined and documented before implementation.
     - Security controls must NOT receive arbitrary percentage reductions. If no defensible quantitative effectiveness methodology exists: controls remain contextual and explainability inputs in Risk Model v1 and do **not** mathematically reduce risk.
2. **Financial Calculation Logic & EAL**: Loss event frequency (LEF), magnitude of impact, and Estimated Annualized Loss (EAL) calculation models.
3. **What-If Calculation Engine**: Scenario simulation snapshotting, transient delta calculations without database mutation.
4. **Optimization Algorithm & ROSI**: Deterministic multi-strategy generation under budget constraints, Return on Security Investment (ROSI) formulas, Pareto trade-off curves.
5. **Attack-Path Calculation & Graph Logic**: Graph traversal algorithms, topological reachability, choke point identification, and critical destination pathing based exclusively on verified evidence.
6. **Backend ↔ Python Risk-Engine Orchestration**: Express gateway ↔ Python FastAPI / service coordination, DTO validation, and RPC serialization.
7. **Calculation Explainability & Model Versioning**: Structured mathematical breakdown DTOs, factor contribution matrices, and semantic model versioning (`v1.0.0`).
8. **AI Explanation Backend & Orchestration**: Grounded prompt engineering, context sanitization, and structured reasoning over deterministic calculation results (never inventing figures).
9. **Risk & Decision APIs**: Exposing `/api/risk/*`, `/api/financial/*`, `/api/scenarios/*`, `/api/optimization/*`, `/api/executive/*`, `/api/attack-paths/*`, and `/api/assistant/*`.

#### Owned Directories & Files (Phases 2–9):

```text
risk-engine/
  app/main.py
  app/schemas/
  app/models/
  app/calculators/
  app/scenarios/
  app/optimizers/
  app/attack_graph/
  app/ai/
  tests/

backend/src/modules/risk/
backend/src/modules/financial/
backend/src/modules/scenarios/
backend/src/modules/optimization/
backend/src/modules/executive/
backend/src/modules/attack-paths/
backend/src/modules/assistant/

docs/RISK_ENGINE_CONTRACT.md
docs/FINANCIAL_MODEL.md
docs/OPTIMIZATION.md
docs/ATTACK_PATH_MODEL.md

backend/src/db/migrations/010+_risk_*.sql
backend/src/db/migrations/010+_financial_*.sql
backend/src/db/migrations/010+_optimization_*.sql
backend/src/db/migrations/010+_attack_paths_*.sql
```

#### Tanish MUST NOT Own:
- Enterprise CRUD, asset inventory CRUD, or organization CRUD.
- Financial input storage owned by Harsh.
- Frontend React implementation.
- Compliance evidence storage or framework curation.

---

### 6.2 PERSON 2 — HARSH (Enterprise Context, Financial Inputs, Controls & Compliance Lead)

#### Primary Ownership:
1. **Organization Business Context & Units**: Departmental hierarchy, revenue tiers, employee count, currency settings.
2. **Asset & Business Criticality**: Criticality scoring (Tier 1–5), data classification, internet exposure posture.
3. **Enterprise Security Control State**: Posture updates (`IMPLEMENTED`, `PARTIAL`, `NOT_IMPLEMENTED`, `UNKNOWN`) and provenance.
4. **User-Provided Monetary & Impact Inputs**: Hourly downtime costs, recovery cost inputs, business interruption values, remediation action costs, and organization budget thresholds.
5. **Remediation Action Catalog**: Real/user-defined action definitions (action ID, target asset, target vuln/control, cost, dependencies, constraints, feasibility).
6. **Compliance Frameworks & Mappings (Primary Owner)**: NIST CSF, ISO 27001, CIS, SOC 2 control mappings, evidence records, implementation status, and gap analysis (no false certification claims).
7. **Asset Dependencies & Topology**: Asset-to-asset network relationships, shared services, and exposure context required for attack path analysis.

#### Owned Directories & Files (Phases 2–9):
```text
backend/src/modules/organizations/
backend/src/modules/business-units/
backend/src/modules/assets/
backend/src/modules/software/
backend/src/modules/cpe-matching/
backend/src/modules/controls/
backend/src/modules/financial-inputs/
backend/src/modules/remediation-actions/
backend/src/modules/compliance/
backend/src/modules/asset-dependencies/

docs/RISK_ENTERPRISE_INPUTS.md
docs/COMPLIANCE_MAPPINGS.md
docs/REMEDIATION_CATALOG.md

backend/src/db/migrations/010+_financial_inputs_*.sql
backend/src/db/migrations/010+_remediation_actions_*.sql
backend/src/db/migrations/010+_compliance_*.sql
backend/src/db/migrations/010+_asset_dependencies_*.sql
```

#### Harsh MUST NOT Own:
- Risk score calculation formula.
- EAL / financial exposure calculation formula.
- ROSI calculation formula.
- Optimizer algorithm or Pareto generation.
- What-If calculation engine.
- Frontend React implementation.

> **CRITICAL SEPARATION**: Harsh provides monetary/business inputs (e.g. `downtimeCostPerHour = 25000`). Harsh does **NOT** calculate financial risk. Tanish owns how `downtimeCostPerHour` participates in modeled financial exposure.

---

### 6.3 PERSON 3 — NISHIT (Frontend, Product Experience & Real-Data Visualization Lead)

#### Primary Ownership:
1. **Risk Overview UI (Screen N8)**: Risk score badges, factor breakdown drawers, missing data warnings, model version stamps.
2. **Financial Exposure UI (Screen N9)**: Modeled financial exposure cards, EAL breakdown charts, currency formatting, input completeness warnings.
3. **What-If Simulator UI (Screen N10)**: Interactive scenario builder, baseline vs scenario comparative views, delta metrics, reset controls.
4. **Investment Optimizer UI (Screen N11)**: Budget constraint sliders, strategy cards (A, B, C), trade-off charts, ROSI indicators, neutral decision comparison (no single declared "winner").
5. **Executive Decision Dashboard UI (Screen N12)**: Board-ready posture summary, top risk exposures, BU breakdown, data completeness & freshness badges.
6. **Compliance UI (Screen N13)**: Framework selector, mapped controls table, evidence records, gap analysis, coverage gauges.
7. **Attack Path Visualization (Screen N14)**: Node-edge topological graph, choke point highlights, critical asset destinations, path detail inspector.
8. **AI Assistant UI (Screen N15)**: Contextual assistant drawer/chat, question prompts ("Why is this asset high risk?"), explicit visual distinction separating AI explanations from deterministic numbers.
9. **Component States & Polish**: Skeleton loaders, informative empty states, error retry boundaries, responsive behavior, WCAG AA accessibility, end-to-end demo navigation.

#### Owned Directories & Files (Phases 2–9):
```text
frontend/src/pages/RiskOverview.tsx           (Screen N8)
frontend/src/pages/FinancialExposure.tsx       (Screen N9)
frontend/src/pages/WhatIfSimulator.tsx         (Screen N10)
frontend/src/pages/InvestmentOptimizer.tsx     (Screen N11)
frontend/src/pages/ExecutiveDashboard.tsx     (Screen N12)
frontend/src/pages/Compliance.tsx              (Screen N13)
frontend/src/pages/AttackPaths.tsx             (Screen N14)
frontend/src/pages/AiAssistant.tsx             (Screen N15)

frontend/src/components/risk/
frontend/src/components/financial/
frontend/src/components/scenarios/
frontend/src/components/optimizer/
frontend/src/components/executive/
frontend/src/components/compliance/
frontend/src/components/attack-paths/
frontend/src/components/assistant/

frontend/src/api/risk.ts
frontend/src/api/financial.ts
frontend/src/api/scenarios.ts
frontend/src/api/optimization.ts
frontend/src/api/executive.ts
frontend/src/api/compliance.ts
frontend/src/api/attackPaths.ts
frontend/src/api/assistant.ts

docs/DESIGN_SYSTEM.md
docs/FRONTEND_ARCHITECTURE.md
```

#### Nishit MUST NOT:
- Modify risk formulas or financial formulas.
- Modify optimizer algorithms.
- Directly query PostgreSQL or bypass REST APIs.
- Invent missing backend fields or financial values.
- Invent control effectiveness percentages or risk scores.
- Modify Harsh's or Tanish's backend logic.
- If frontend requires a missing field: create a request in `tasks/dependencies/`. Never silently fake it in the UI.

