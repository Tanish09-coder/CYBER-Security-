# HARSH — Live Progress Tracker

# Current Task
Phase 2: Enterprise Risk Inputs & Posture (HARSH-P2-01, HARSH-P2-02) — COMPLETED

# Status
PHASE_2_ENTERPRISE_INPUTS_COMPLETED (All Phase 1, H6, HARSH-P2-01, HARSH-P2-02 Verified & Delivered)

# Work Completed
- **Phase H1: Organization & Business Unit Model**
  - Multi-tenant organization & business unit schemas.
  - Migration `005_organizations.sql` (renumbering aligned with integration baseline).
  - REST APIs, Zod validation, repository, service, controller.
  - Passing unit & integration tests.
- **Phase H2: Enterprise Asset Inventory**
  - Enterprise asset schema with network context, exposure attributes, and financial metrics.
  - Migration `006_assets.sql` with unique deduplication indexes.
  - Streaming CSV and JSON batch import pipelines.
  - Passing unit & integration tests.
- **Phase H3: Software Inventory & Versioning**
  - Installed software schema with unique constraint on `(asset_id, vendor, product, version)`.
  - Migration `007_software.sql`.
  - Batch upserting, filtering, and cascade deletion.
  - Passing unit & integration tests.
- **Phase H4: CPE Matching Engine**
  - Integration with Tanish's `vulnerability_cpes` and `vulnerabilities` tables.
  - Semantic & numerical version bounds comparator (`compareVersions` & `evaluateCpeMatch`).
  - Confidence scoring matrix (1.00 exact, 0.95 bounded, 0.85 wildcard) & transparent reasoning.
  - Strict terminology adherence (`POTENTIAL_VULNERABILITY_MATCH` — zero claims of compromise).
  - Migration `008_cpe_matching.sql` & documentation `docs/CPE_MATCHING.md`.
  - Passing unit & integration tests.
- **Phase H5: Security Controls Posture**
  - Defined authoritative defensive control catalog (`MFA`, `EDR`, `BACKUP`, `SEGMENTATION`, `PAM`, `ENCRYPTION`, `MONITORING`) with default mitigation weights.
  - Created migration `009_security_controls.sql` with catalog seeding and `asset_controls` table.
  - Implemented provenance tracking (`USER_CONFIG`, `SCANNER_IMPORT`, `AUDIT_VERIFIED`) with zero synthetic default claims.
  - Created documentation `docs/CONTROLS_POSTURE.md`.
  - Passing unit & integration tests.
- **Phase H6 / Phase 2: Enterprise Financial Context & Risk Inputs (HARSH-P2-01 & HARSH-P2-02)** [COMPLETED]
  - Audited and documented all available enterprise inputs for Tanish's Risk Engine in `docs/ENTERPRISE_RISK_INPUTS.md` and `docs/RISK_ENTERPRISE_INPUTS.md` with database source, API source, nullability, user-provided vs derived, risk calculation safety, and explicit NULL/UNKNOWN semantics.
  - Enforced ZERO fabrication rule: missing financial inputs, downtime costs, remediation costs, budgets, and control effectiveness remain strictly `NULL` / `UNKNOWN` with zero synthetic default math.
  - Created Migration `010_enterprise_financial_context.sql` supporting `organization_financial_parameters`, `remediation_actions`, `asset_dependencies`, and compliance frameworks (`NIST_CSF`, `ISO_27001`, `CIS_V8`, `RBI_CSF`, `SEBI_CS`) with evidence tracking.
  - Built backend module `backend/src/modules/financial-context/` (types, validation, repository, service, controller, routes).
  - Implemented `GET /api/enterprise-context/risk-inputs/:orgId` endpoint delivering aggregated enterprise risk inputs bundle for Tanish's Risk Engine consumption.
  - Enhanced Asset module with asset risk inputs & completeness score endpoints:
    - `GET /api/assets/:id/risk-inputs`
    - `GET /api/assets/risk-inputs/summary`
  - Created unit & integration test suite `backend/src/modules/assets/__tests__/assets.risk-inputs.test.ts`.

# Files Created
- `docs/ENTERPRISE_RISK_INPUTS.md`
- `docs/RISK_ENTERPRISE_INPUTS.md`
- `backend/src/db/migrations/010_enterprise_financial_context.sql`
- `backend/src/modules/financial-context/financial-context.types.ts`
- `backend/src/modules/financial-context/financial-context.validation.ts`
- `backend/src/modules/financial-context/financial-context.repository.ts`
- `backend/src/modules/financial-context/financial-context.service.ts`
- `backend/src/modules/financial-context/financial-context.controller.ts`
- `backend/src/modules/financial-context/financial-context.routes.ts`
- `backend/src/modules/financial-context/__tests__/financial-context.test.ts`
- `backend/src/modules/assets/__tests__/assets.risk-inputs.test.ts`

# Files Modified
- `backend/src/modules/assets/assets.repository.ts`
- `backend/src/modules/assets/assets.service.ts`
- `backend/src/modules/assets/assets.controller.ts`
- `backend/src/modules/assets/assets.routes.ts`
- `backend/src/server.ts`
- `docs/API_CONTRACTS.md`
- `tasks/HARSH/TASKS.md`
- `tasks/HARSH/PROGRESS.md`

# Dependency Requests / Blockers
- **HARSH-001** (GET /api/assets for Nishit Screen N5): DELIVERED & LIVE.
- **HARSH-002** (GET /api/controls for Nishit Screen N6): DELIVERED & LIVE.
- **HARSH-003** (GET /api/enterprise-context/risk-inputs/:orgId for Tanish Risk Engine): DELIVERED & LIVE.

# Tests
- 24 test suites passed, 199 tests passed, 0 failures.
- 100% test pass rate across all backend modules.
- Rebased cleanly against `origin/main` integration baseline.

# Next Step
Phase 2 (HARSH-P2-01 & HARSH-P2-02) complete, tested (199/199 passing), and verified. Ready for Phase 3 (Enterprise Monetary Inputs & Financial Parameters).
