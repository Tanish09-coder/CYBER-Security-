# HARSH — Task Roadmap & Execution Backlog

## Task Summary

| Phase | Domain Area | Status | Deliverable |
| :--- | :--- | :--- | :--- |
| **Phase H1** | Organization Hierarchy | **COMPLETED** | Multi-tenant organization and business unit schemas and REST APIs |
| **Phase H2** | Enterprise Asset Inventory | **COMPLETED** | Asset data model, CSV & JSON import parsers, validation, unit mapping |
| **Phase H3** | Software Inventory | **COMPLETED** | Installed software model, version tracking, asset-software relationships |
| **Phase H4** | CPE Matching Engine | **COMPLETED** | CPE criteria evaluator with version-bound logic and confidence rating |
| **Phase H5** | Security Controls Posture | **COMPLETED** | Control catalog, asset-control mapping (MFA, EDR, Backups, PAM, Seg) |
| **Phase H6** | Enterprise Financial Context | **COMPLETED** | Audit of inputs, financial parameters, remediation catalog, asset dependencies, compliance mappings & aggregated risk inputs bundle |

---

## Detailed Phase Breakdown

### Phase H1 — Organization & Business Unit Model
- [x] Design organization entity schema (`id`, `name`, `industry`, `employee_count`, `annual_revenue`, `currency`, `created_at`, `updated_at`).
- [x] Design business unit schema (`id`, `organization_id`, `name`, `criticality_tier`, `budget`).
- [x] Create database migration `003_organizations.sql` (or next sequential number) with header:
  ```sql
  -- Owner: HARSH
  -- Purpose: Organizations and business units hierarchy
  ```
- [x] Implement REST endpoints:
  - `POST /api/organizations`: Create enterprise profile.
  - `GET /api/organizations/:id`: Retrieve profile.
  - `POST /api/business-units`: Create business unit.
  - `GET /api/business-units?organizationId=`: List units.
- [x] Define import contract for organization onboarding.

---

### Phase H2 — Enterprise Asset Inventory
- [x] Design asset schema (`id`, `organization_id`, `business_unit_id`, `name`, `hostname`, `ip_address`, `mac_address`, `asset_type`, `operating_system`, `business_criticality`, `internet_facing`, `data_classification`).
- [x] Create database migration for assets and network interfaces.
- [x] Implement CSV Asset Import Pipeline:
  - Streaming CSV parser with column mapping.
  - Header validation and strict row-level error reporting.
  - Deduping on hostname / MAC address / IP address.
- [x] Implement JSON Asset Import Pipeline:
  - Batch JSON schema validation via Zod.
- [x] Implement REST endpoints:
  - `GET /api/assets`: Paginated asset list with filtering (criticality, internet-facing, type).
  - `GET /api/assets/:id`: Detailed asset view with software and control posture.
  - `POST /api/assets/import/csv`: Upload CSV file.
  - `POST /api/assets/import/json`: Post JSON batch.

---

### Phase H3 — Software Inventory & Versioning
- [x] Design installed software schema (`id`, `asset_id`, `vendor`, `product`, `version`, `release`, `install_path`, `last_observed_at`).
- [x] Model asset ↔ software one-to-many relationship.
- [x] Support software import via asset JSON payloads and dedicated software inventory lists.
- [x] Implement REST endpoints:
  - `GET /api/assets/:assetId/software`: List all packages on an asset.
  - `POST /api/assets/:assetId/software`: Register or update installed packages.

---

### Phase H4 — CPE Matching Engine
- [x] Integrate with Tanish's NVD CPE criteria (`vulnerability_cpes` table created in `001_nvd_ingestion.sql`).
- [x] Implement CPE comparison logic:
  - Exact vendor and product matching (normalized lowercase).
  - Version-bound comparison evaluating `versionStartIncluding`, `versionStartExcluding`, `versionEndIncluding`, `versionEndExcluding` against semantic versions.
- [x] Transparent match reasoning:
  - Generate confidence score and plain-English explanation (e.g., *"Matched Apache Log4j v2.14.1 because version is <= 2.15.0"*).
- [x] **Strict Terminology Rule**:
  - The system must declare: **"Potential vulnerability match"**
  - The system must NEVER declare: **"Asset compromised"**
  - Vulnerability presence indicates exposure, NOT confirmed active intrusion.
- [x] Implement REST endpoints:
  - `POST /api/cpe-matching/evaluate`: Trigger matching for an asset or across inventory.
  - `GET /api/assets/:assetId/vulnerabilities`: List correlated CVEs with match reasoning.

---

### Phase H5 — Security Controls Posture [COMPLETED]
- [x] Define defensive control catalog:
  - `MFA`: Multi-Factor Authentication enforcement.
  - `EDR`: Endpoint Detection & Response active sensor status.
  - `BACKUP`: Immutable / offline backup coverage and testing frequency.
  - `SEGMENTATION`: Network micro-segmentation / isolation status.
  - `PAM`: Privileged Access Management enforcement.
  - `ENCRYPTION`: Data-at-rest and data-in-transit encryption status.
  - `MONITORING`: 24/7 SIEM / SOC telemetry coverage.
- [x] Model asset-control assignment with implementation state (`IMPLEMENTED`, `PARTIAL`, `NOT_IMPLEMENTED`, `UNKNOWN`).
- [x] Control values must originate **strictly from user configuration or automated scanner imports**—zero synthetic default claims.
- [x] Implement REST endpoints:
  - `GET /api/controls`: Summary of controls and coverage.
  - `POST /api/assets/:assetId/controls`: Update control status on an asset.

---

## Phase 2 → Final Delivery Master Roadmap (Phases 2–9)

The following roadmap defines all remaining tasks owned by **HARSH** (Enterprise Context, Financial Inputs, Controls & Compliance Lead).

```text
========================================================================================
HARSH ROADMAP SUMMARY (PHASES 2–9)
- Phase 2: Enterprise Risk Inputs & Posture (Criticality, Exposure, Completeness, API)
- Phase 3: Enterprise Monetary Inputs (Downtime Costs, Recovery Costs, Currency, Migration)
- Phase 4: Action Definitions & Control States for Scenarios (Valid Actions, Action Costs)
- Phase 5: Remediation Action Catalog & Budget Constraints (Catalog DB, Constraints, API)
- Phase 6: Enterprise Aggregation Dimensions (BU Rollups, Criticality Grouping, API)
- Phase 7A: Compliance Frameworks & Evidence (NIST, ISO, CIS, Mappings, Gaps, API) [PRIMARY OWNER]
- Phase 7B: Asset Dependencies & Network Topology (Dependency DB, Adjacencies, API)
- Phase 8: Enterprise Context Privacy & Exposure Boundaries (Context Sanitization, Redaction)
- Phase 9: Enterprise Data & Integrity Validation (Import Verification, Query Benchmarks)
========================================================================================
```

---

### PHASE 2: RISK QUANTIFICATION (ENTERPRISE INPUTS)

#### TASK ID: HARSH-P2-01
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Author `docs/RISK_ENTERPRISE_INPUTS.md` defining all internal enterprise context variables feeding Risk Model v1: asset criticality tiers (Tier 1–5), internet-facing exposure boolean, business unit context, data classification, and security control implementation status.
  - **Mandatory Modeling Guardrail**:
    - Harsh provides verified factual enterprise data (e.g., `internet_facing: true|false|unknown`, control implementation: `IMPLEMENTED|PARTIAL|NOT_IMPLEMENTED|UNKNOWN`).
    - Harsh must **NOT** create arbitrary effectiveness percentages or reduction weights (e.g., no hardcoded "EDR reduces risk by 35%").
    - Distinguish strictly between `UNKNOWN`, `FALSE`, and `NOT CONFIGURED`.
    - If no defensible quantitative effectiveness methodology exists: controls remain **contextual/explainability inputs** in Risk Model v1 and do **not** mathematically reduce risk.
- **DEPENDENCIES**: None (Harsh delivers this first to unblock Tanish)
- **OWNED FILES/MODULE**:
  - `docs/RISK_ENTERPRISE_INPUTS.md`
  - `backend/src/modules/assets/assets.types.ts`
- **EXPECTED OUTPUT**: Comprehensive documentation and DTO schema for enterprise asset context and control posture states with transparent provenance.
- **TEST REQUIREMENTS**: Schema type verification tests; completeness calculation tests; null/unknown state tests.
- **STATUS**: TODO

#### TASK ID: HARSH-P2-02
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Enhance Asset and Control REST endpoints to expose complete enterprise risk context and data completeness status (`GET /api/assets/:id/risk-inputs`, `GET /api/assets/risk-inputs/summary`). Ensure provenance tracking (`USER_CONFIG`, `SCANNER_IMPORT`, `AUDIT_VERIFIED`).
- **DEPENDENCIES**: HARSH-P2-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/assets/assets.service.ts`
  - `backend/src/modules/assets/assets.controller.ts`
  - `backend/src/modules/assets/assets.routes.ts`
  - `backend/src/modules/assets/__tests__/assets.risk-inputs.test.ts`
- **EXPECTED OUTPUT**: Production REST APIs delivering authentic enterprise risk attributes for any asset without fabricated weights.
- **TEST REQUIREMENTS**: Integration tests; zero synthetic fallback verification; HTTP status checks.
- **STATUS**: TODO


---

### PHASE 3: FINANCIAL EXPOSURE / EAL (ENTERPRISE MONETARY INPUTS)

#### TASK ID: HARSH-P3-01
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **DESCRIPTION**: Design and implement the Enterprise Financial Inputs data model and database migration `010_financial_inputs.sql`. Stores organization currency, hourly downtime costs per business unit / asset criticality tier, recovery cost baselines, and business interruption valuation. Organization/user-provided inputs ONLY (zero fabricated costs).
- **DEPENDENCIES**: None
- **OWNED FILES/MODULE**:
  - `backend/src/db/migrations/010_financial_inputs.sql`
  - `backend/src/modules/financial-inputs/financial-inputs.types.ts`
  - `backend/src/modules/financial-inputs/financial-inputs.validation.ts`
- **EXPECTED OUTPUT**: Authoritative database schema and validated Zod schemas for user-defined monetary assumptions.
- **TEST REQUIREMENTS**: Migration forward/rollback test; negative financial value validation tests; multi-currency support tests.
- **STATUS**: TODO

#### TASK ID: HARSH-P3-02
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **DESCRIPTION**: Implement Enterprise Financial Inputs REST APIs (`POST /api/financial-inputs`, `GET /api/financial-inputs`, `PATCH /api/financial-inputs/:id`) with audit provenance tracking and completeness scoring.
- **DEPENDENCIES**: HARSH-P3-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/financial-inputs/financial-inputs.repository.ts`
  - `backend/src/modules/financial-inputs/financial-inputs.service.ts`
  - `backend/src/modules/financial-inputs/financial-inputs.controller.ts`
  - `backend/src/modules/financial-inputs/financial-inputs.routes.ts`
  - `backend/src/modules/financial-inputs/__tests__/financial-inputs.integration.test.ts`
- **EXPECTED OUTPUT**: Production REST endpoints enabling organizations to supply and update authentic financial impact baselines.
- **TEST REQUIREMENTS**: Backend integration tests; 100% test pass rate; authorization checks.
- **STATUS**: TODO

---

### PHASE 4: WHAT-IF SIMULATION (ACTION DEFINITIONS)

#### TASK ID: HARSH-P4-01
- **PHASE**: Phase 4 — What-If Simulation
- **DESCRIPTION**: Define valid enterprise action models and parameters for scenario simulations. Permitted actions: Patch/Remediate Vulnerability, Upgrade Control Posture (`NOT_IMPLEMENTED` -> `IMPLEMENTED`), Isolate Asset (remove `internet_facing`). Define action costs and feasibility constraints without synthetic effectiveness percentages.
- **DEPENDENCIES**: HARSH-P3-02
- **OWNED FILES/MODULE**:
  - `backend/src/modules/remediation-actions/actions.types.ts`
  - `docs/REMEDIATION_CATALOG.md`
- **EXPECTED OUTPUT**: Standardized action schemas consumed by Tanish's What-If simulation engine.
- **TEST REQUIREMENTS**: Action payload validation tests; constraint consistency tests.
- **STATUS**: TODO

---

### PHASE 5: INVESTMENT OPTIMIZATION + ROSI (ACTION CATALOG & BUDGET)

#### TASK ID: HARSH-P5-01
- **PHASE**: Phase 5 — Investment Optimization + ROSI
- **DESCRIPTION**: Create Remediation Action Catalog database migration `011_remediation_actions.sql` and REST APIs (`GET /api/remediation-actions`, `POST /api/remediation-actions`, `GET /api/remediation-actions/budget`). Stores user/organization candidate actions: action ID, target asset, target vuln/control, implementation cost, action dependencies, execution constraints, feasibility rating, and total organization budget limit.
- **DEPENDENCIES**: HARSH-P4-01
- **OWNED FILES/MODULE**:
  - `backend/src/db/migrations/011_remediation_actions.sql`
  - `backend/src/modules/remediation-actions/remediation-actions.repository.ts`
  - `backend/src/modules/remediation-actions/remediation-actions.service.ts`
  - `backend/src/modules/remediation-actions/remediation-actions.controller.ts`
  - `backend/src/modules/remediation-actions/remediation-actions.routes.ts`
  - `backend/src/modules/remediation-actions/__tests__/remediation-actions.test.ts`
- **EXPECTED OUTPUT**: Normalized database catalog of real remediation actions with budget parameters.
- **TEST REQUIREMENTS**: CRUD integration tests; budget threshold validation; dependency cycle detection tests.
- **STATUS**: TODO

---

### PHASE 6: EXECUTIVE DECISION DASHBOARD (ENTERPRISE GROUPING)

#### TASK ID: HARSH-P6-01
- **PHASE**: Phase 6 — Executive Decision Dashboard
- **DESCRIPTION**: Implement enterprise aggregation endpoints grouping assets by business unit, asset ownership, criticality tiers, and business context dimensions (`GET /api/business-units/summary`, `GET /api/organizations/:id/dimensions`).
- **DEPENDENCIES**: None (builds on Phase 1 organizations & assets)
- **OWNED FILES/MODULE**:
  - `backend/src/modules/business-units/business-units.service.ts`
  - `backend/src/modules/business-units/business-units.controller.ts`
  - `backend/src/modules/business-units/business-units.routes.ts`
  - `backend/src/modules/business-units/__tests__/business-units.summary.test.ts`
- **EXPECTED OUTPUT**: Efficient rollup APIs providing departmental counts, revenue weighting, and criticality distribution.
- **TEST REQUIREMENTS**: SQL aggregation performance tests; empty state handling; unit tests.
- **STATUS**: TODO

---

### PHASE 7A: COMPLIANCE INTELLIGENCE (PRIMARY OWNER)

#### TASK ID: HARSH-P7A-01
- **PHASE**: Phase 7A — Compliance Intelligence
- **DESCRIPTION**: Author `docs/COMPLIANCE_MAPPINGS.md` and design Compliance Framework database schema migration `012_compliance_frameworks.sql`. Models supported frameworks (NIST CSF 2.0, ISO/IEC 27001:2022, CIS Controls v8, SOC 2 Type II), framework controls, internal defensive control mappings, evidence audit records, and implementation status. Strict rule: Never claim "certified" unless externally audited.
- **DEPENDENCIES**: None (builds on Phase H5 security controls)
- **OWNED FILES/MODULE**:
  - `docs/COMPLIANCE_MAPPINGS.md`
  - `backend/src/db/migrations/012_compliance_frameworks.sql`
  - `backend/src/modules/compliance/compliance.types.ts`
- **EXPECTED OUTPUT**: Production database tables for regulatory frameworks, control mappings, gap tracking, and evidence metadata.
- **TEST REQUIREMENTS**: Migration tests; mapping relationship integrity tests; foreign key checks.
- **STATUS**: TODO

#### TASK ID: HARSH-P7A-02
- **PHASE**: Phase 7A — Compliance Intelligence
- **DESCRIPTION**: Implement Compliance REST APIs (`GET /api/compliance/frameworks`, `GET /api/compliance/frameworks/:code/coverage`, `POST /api/compliance/evidence`, `GET /api/compliance/gaps`). Calculates coverage percentage and gaps strictly from authentic control implementation states.
- **DEPENDENCIES**: HARSH-P7A-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/compliance/compliance.repository.ts`
  - `backend/src/modules/compliance/compliance.service.ts`
  - `backend/src/modules/compliance/compliance.controller.ts`
  - `backend/src/modules/compliance/compliance.routes.ts`
  - `backend/src/modules/compliance/__tests__/compliance.integration.test.ts`
- **EXPECTED OUTPUT**: REST endpoints delivering framework coverage, mapped control evidence, and gap analysis.
- **TEST REQUIREMENTS**: Integration tests; zero synthetic compliance score checks; 100% test pass rate.
- **STATUS**: TODO

---

### PHASE 7B: ATTACK PATH INTELLIGENCE (ASSET TOPOLOGY)

#### TASK ID: HARSH-P7B-01
- **PHASE**: Phase 7B — Attack Path Intelligence
- **DESCRIPTION**: Design and implement Asset Dependency database migration `013_asset_dependencies.sql` and REST APIs (`POST /api/assets/:id/dependencies`, `GET /api/assets/:id/dependencies`). Models authentic network adjacencies, upstream/downstream service dependencies, shared credentials, and exposure boundaries.
- **DEPENDENCIES**: None (builds on Phase H2 assets)
- **OWNED FILES/MODULE**:
  - `backend/src/db/migrations/013_asset_dependencies.sql`
  - `backend/src/modules/asset-dependencies/asset-dependencies.repository.ts`
  - `backend/src/modules/asset-dependencies/asset-dependencies.service.ts`
  - `backend/src/modules/asset-dependencies/asset-dependencies.controller.ts`
  - `backend/src/modules/asset-dependencies/asset-dependencies.routes.ts`
  - `backend/src/modules/asset-dependencies/__tests__/asset-dependencies.test.ts`
- **EXPECTED OUTPUT**: Topological dependency graph data feeding Tanish's attack path traversal engine.
- **TEST REQUIREMENTS**: Directed edge validation tests; self-dependency rejection tests; cyclic graph handling tests.
- **STATUS**: TODO

---

### PHASE 8: AI EXPLANATION ASSISTANT (CONTEXT PRIVACY)

#### TASK ID: HARSH-P8-01
- **PHASE**: Phase 8 — AI Explanation Assistant
- **DESCRIPTION**: Establish enterprise context sanitization and privacy boundaries for AI orchestration. Enforce strict redaction of sensitive internal hostnames, credentials, and non-essential PII before enterprise context is passed to the AI assistant service.
- **DEPENDENCIES**: None
- **OWNED FILES/MODULE**:
  - `backend/src/modules/assistant/context-sanitizer.ts`
  - `docs/ENTERPRISE_AI_BOUNDARIES.md`
- **EXPECTED OUTPUT**: Robust context filter ensuring only authorized, sanitized business context participates in AI prompts.
- **TEST REQUIREMENTS**: Sanitization unit tests; regex redaction tests for IPs, keys, and tokens.
- **STATUS**: TODO

---

### PHASE 9: FINAL INTEGRATION, PERFORMANCE, SECURITY & DEMO READINESS

#### TASK ID: HARSH-P9-01
- **PHASE**: Phase 9 — Final Integration, Performance, Security & Demo Readiness
- **DESCRIPTION**: Validate integrity of all enterprise data ingestion pipelines (CSV/JSON asset imports, financial inputs, remediation actions, compliance evidence). Execute database index optimization and query benchmark.
- **DEPENDENCIES**: All Phase 2–8 Harsh deliverables.
- **OWNED FILES/MODULE**:
  - `backend/src/modules/organizations/`
  - `backend/src/modules/assets/`
  - `backend/src/modules/financial-inputs/`
  - `backend/src/modules/compliance/`
- **EXPECTED OUTPUT**: Enterprise data validation and optimization report with 100% test coverage and sub-50ms query times.
- **TEST REQUIREMENTS**: End-to-end import stress tests; data completeness verification; zero regression against Phase 1 foundation.
- **STATUS**: TODO

