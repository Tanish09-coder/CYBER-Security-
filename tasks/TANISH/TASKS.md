# TANISH — Task Roadmap & Execution Backlog

## Task Summary

| Milestone | Area | Status | Deliverable |
| :--- | :--- | :--- | :--- |
| **M1: NVD Ingestion** | External Threat Intel | **COMPLETED** | NVD API v2.0 client, CVSS preservation, CPE parser, live verification |
| **M2: CISA KEV Ingestion** | External Threat Intel | **COMPLETED** | Official KEV feed, non-destructive reconciliation, NVD join, dual provenance |
| **M3: MITRE ATT&CK Ingestion** | External Threat Intel | **COMPLETED** | STIX 2.1 parser, tactics, techniques, mitigations, attack-pattern graph |
| **M4: VCDB / VERIS Ingestion** | Historical Incident Intel | **NEXT** | Public incident parser, breach frequency distributions, loss telemetry |
| **M5: Unified Threat Intel API** | Cross-Source Lookup | **PLANNED** | Multi-source lookup API (`CVE -> NVD + KEV + ATT&CK + VCDB`) |

---

## Detailed Task Breakdown

### Phase 1: National Vulnerability Database (NVD) [COMPLETED]
- [x] Production NVD REST API v2.0 client with exponential backoff & configurable request pacing limiter.
- [x] Immutable raw payload storage in `raw_source_records` with deterministic SHA-256 provenance hashing.
- [x] Normalization engine preserving all CVSS assessments (NIST, CNA, ADP) without discarding vendor scores.
- [x] Extraction of CWE weakness categories and CPE version criteria.
- [x] Idempotency: exact payload hash deduplication on re-sync.
- [x] Unit/integration tests (24 automated tests passed).
- [x] Live end-to-end verification script with real `CVE-2021-44228`.

---

### Phase 2: CISA Known Exploited Vulnerabilities (KEV) [COMPLETED]
- [x] Production CISA KEV client fetching official live catalog feed.
- [x] Zod schema validation for catalog envelope and vulnerability entries.
- [x] Preservation of catalog-level metadata (`title`, `catalogVersion`, `dateReleased`, `officialCount`).
- [x] Migration `002_cisa_kev_ingestion.sql` defining `cisa_kev_entries` and `vulnerabilities` KEV columns.
- [x] Non-destructive historical reconciliation: `is_current = false` and `removed_from_catalog_at = NOW()` when entries drop out.
- [x] Bi-directional join between NVD vulnerabilities and CISA KEV entries without synthetic rows.
- [x] Catalog staleness detection against `CISA_KEV_STALE_AFTER_HOURS=24`.
- [x] 10 automated unit/integration tests for KEV (bringing total test suite to 34 tests, 100% passing).
- [x] Data-driven live verification (`verify-live-cisa-kev.ts`) ingesting 1,721 live KEV entries and real NVD join on `CVE-2026-93952`.

---

### Phase 3: MITRE ATT&CK Enterprise Matrix [COMPLETED]
- [x] Connect to official MITRE ATT&CK GitHub STIX 2.1 repository and dynamic release index (`index.json`).
- [x] Implement memory-efficient STIX object parser with Zod schema validation.
- [x] Normalize ATT&CK Tactics (matrix columns, external ID, name, short name).
- [x] Normalize ATT&CK Techniques & Sub-techniques (T-codes, name, kill chain phases, data sources, platforms).
- [x] Normalize ATT&CK Mitigations (M-codes, description, addressable techniques).
- [x] Normalize Threat Groups & Software (G-codes, S-codes, aliases, software classification).
- [x] Preserve STIX Relationship Graph (`technique -> mitigation`, `group -> technique`, `subtechnique-of`).
- [x] Resolve sub-technique parents authoritatively from official `subtechnique-of` STIX relationships.
- [x] Store complete raw STIX bundle in `raw_source_records` with cryptographic SHA-256 provenance.
- [x] Create Migration `003_mitre_attack_ingestion.sql` with owner header `-- Owner: TANISH`.
- [x] Build 27 automated unit/integration tests across 4 test suites (100% pass rate).
- [x] Implement and execute `verify-live-mitre-attack.ts` end-to-end data-driven verification script (v19.2, 26,086 objects, 100% idempotent).

---

### Phase 4: VCDB / VERIS Empirical Incident Ingestion [COMPLETED]
- [x] Connect to VERIS Community Database (VCDB) repository / official data feed.
- [x] Parse VERIS schema elements: Action (Malware, Hacking, Social, Misuse), Actor, Asset, Attribute (Confidentiality, Integrity, Availability).
- [x] Store raw incident records with cryptographic SHA-256 provenance.
- [x] Normalize incident frequency distributions by industry sector (NAICS) and victim size.
- [x] Create Migration `004_vcdb_incidents.sql` with owner header `-- Owner: TANISH`.
- [x] Freshness monitoring for incident dataset updates (10,003 active incidents verified).

---

### Phase 5: Cross-Source Cyber Intelligence Enrichment [COMPLETED]
- [x] Build unified multi-source intelligence resolver endpoint:
  `GET /api/threat-intel/summary`, `GET /api/threat-intel/kev`, `GET /api/vulnerabilities`
- [x] Aggregate:
  - NIST NVD: CVSS scores, vector strings, CWEs, CPE criteria.
  - CISA KEV: Known exploitation status, ransomware campaign use, remediation due date.
  - MITRE ATT&CK: Associated attack techniques, tactics, mitigations mapped via STIX relationships.
  - VCDB: Real-world breach prevalence in similar industries.
- [x] Maintain dual/triple cryptographic audit hashes across all sources.
- [x] Document final contracts in `docs/API_CONTRACTS.md`.

---

## Phase 2 → Final Delivery Master Roadmap (Phases 2–9)

The following roadmap defines all remaining tasks owned by **TANISH** (Risk Intelligence, Quantification & Decision Engine Lead).

```text
========================================================================================
TANISH ROADMAP SUMMARY (PHASES 2–9)
- Phase 2: Risk Quantification Engine (Risk Model v1, DTOs, API)
- Phase 3: Financial Exposure / EAL Engine (Modeled Loss, EAL, API)
- Phase 4: What-If Simulation Engine (In-Memory Scenarios, Deltas, API)
- Phase 5: Investment Optimization Engine (Budget Constraints, Multi-Strategy, ROSI, API)
- Phase 6: Executive Decision Aggregation (Rollup Posture, Top Risks, Trends, API)
- Phase 7A: Compliance Support (Optimized Query Builder)
- Phase 7B: Attack Path Intelligence (Topological Graph Engine, Choke Points, API)
- Phase 8: AI Explanation Assistant Backend (Grounded Reasoning, Anti-Hallucination, API)
- Phase 9: Final Integration & Performance (Deterministic Consistency, Latency, Security)
========================================================================================
```

---

### PHASE 2: RISK QUANTIFICATION

#### TASK ID: TANISH-P2-01
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Author `docs/RISK_ENGINE_CONTRACT.md` defining the mathematical formulation, input DTOs, factor bounds, and calculation entities for Risk Model v1. Define `(asset_id, vulnerability_id)` as the atomic risk evaluation unit.
  - **Mandatory Modeling Guardrail**:
    - Do not pre-commit Risk Model v1 to an arbitrary ransomware multiplier, exposure weight, or control offset percentage.
    - Ransomware status, internet exposure, and control states are **candidate factors only** until the Phase 2A Risk Engine Contract verifies their:
      - Source authority & provenance
      - Semantics
      - Defensibility
      - Quantitative treatment
      - Null / missing-data behavior
    - CISA KEV ransomware status may be used as verified empirical evidence, but must NOT be automatically converted into an arbitrary multiplier.
    - Asset internet exposure may be used as verified context, but its numerical weight must be defined and documented before implementation.
    - Security controls must NOT receive arbitrary percentage reductions. If no defensible quantitative effectiveness methodology exists: controls remain contextual and explainability inputs in Risk Model v1 and do **not** mathematically reduce risk.
- **DEPENDENCIES**: HARSH-P2-01 (Risk Enterprise Inputs Contract)
- **OWNED FILES/MODULE**:
  - `docs/RISK_ENGINE_CONTRACT.md`
  - `backend/src/modules/risk/risk.types.ts`
  - `risk-engine/app/schemas/risk_input.py`
- **EXPECTED OUTPUT**: Comprehensive DTO contracts specifying verified input schema, factor bounds, explainability breakdown, null behavior, and score bounds strictly [0.0, 100.0].
- **TEST REQUIREMENTS**: Schema validation tests in TypeScript (Zod) and Python (Pydantic); null-handling assertions.
- **STATUS**: COMPLETED

#### TASK ID: TANISH-P2-02
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Implement deterministic Risk Model v1 core in Python risk-engine based strictly on the verified methodology in `docs/RISK_ENGINE_CONTRACT.md`. Evaluates CVSS base/exploitability, CISA KEV exploitation evidence, documented exposure context, and defensive control posture. If controls lack a defensible quantitative reduction model, they participate as explainability context rather than arbitrary score reductions. Includes factor contribution breakdown array, model versioning (`v1.0.0`), and explicit missing-data handling (never inventing scores).
- **DEPENDENCIES**: TANISH-P2-01, HARSH-P2-02 (Enterprise asset & control status endpoints)
- **OWNED FILES/MODULE**:
  - `risk-engine/app/calculators/risk_model_v1.py`
  - `risk-engine/app/models/risk_entity.py`
  - `risk-engine/tests/test_risk_model_v1.py`
- **EXPECTED OUTPUT**: Deterministic scoring function returning `{ score: number, severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', factors: [...], missingDataWarnings: [...], modelVersion: '1.0.0', provenanceHash: string }`.
- **TEST REQUIREMENTS**: 100% deterministic calculation unit tests; boundary tests (0.0 to 100.0); edge cases (zero CVSS, missing controls, maximum exposure, unverified factor treatment).
- **STATUS**: COMPLETED

#### TASK ID: TANISH-P2-03
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Implement Node.js backend integration layer, orchestration client to Python risk-engine, database migration for risk score caching/persistence, and REST APIs (`GET /api/risk/assets/:assetId`, `GET /api/risk/vulnerabilities/:cveId`, `GET /api/risk/scores`, `POST /api/risk/evaluate`).
  - **Mandatory Corrections & Parallel-Branch Rules**:
    - Migration schedule: strictly use `backend/src/db/migrations/014_risk_results.sql` (reserving 010–013 for Harsh).
    - CISA KEV severity floor documented explicitly as `CYBERRISKOS MODEL-POLICY RULE` (not an empirical physical constant or CISA-prescribed numerical rule).
    - Node → Python client (`risk.client.ts`): explicit timeout, configurable URL, no secrets in logs, strictly NO silent fallback score generation in Node (propagates structured 503 `RiskEngineServiceError`).
    - Cache & Staleness: deterministic cache hit on identical canonical `input_provenance_hash` + identical `model_version`. Invalidates and re-evaluates when inputs change.
    - Harsh branch independence: isolated fixtures used only inside automated tests. Harsh enterprise inputs are a final merge dependency.
- **DEPENDENCIES**: TANISH-P2-02, HARSH-P2-02 (Final Integration Merge Dependency)
- **OWNED FILES/MODULE**:
  - `backend/src/modules/risk/risk.client.ts`
  - `backend/src/modules/risk/risk.repository.ts`
  - `backend/src/modules/risk/risk.service.ts`
  - `backend/src/modules/risk/risk.controller.ts`
  - `backend/src/modules/risk/risk.routes.ts`
  - `backend/src/modules/risk/risk.types.ts`
  - `backend/src/modules/risk/risk.validation.ts`
  - `backend/src/db/migrations/014_risk_results.sql`
  - `backend/src/modules/risk/__tests__/risk.client.test.ts`
  - `backend/src/modules/risk/__tests__/risk.repository.test.ts`
  - `backend/src/modules/risk/__tests__/risk.service.test.ts`
  - `backend/src/modules/risk/__tests__/risk.validation.test.ts`
  - `backend/src/modules/risk/__tests__/risk.integration.test.ts`
- **EXPECTED OUTPUT**: Production-ready Express REST endpoints serving normalized risk scores with factor explainability, model versioning, pagination, and deterministic caching.
- **TEST REQUIREMENTS**: 5 risk test suites (61 tests), full backend Jest suite (247 tests), Python pytest (28 tests), clean TypeScript build.
- **STATUS**: TANISH-P2-03 IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING


---

### PHASE 3: FINANCIAL EXPOSURE / EAL

#### TASK ID: TANISH-P3-01
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **DESCRIPTION**: Author `docs/FINANCIAL_MODEL.md` specifying the quantitative financial exposure and Estimated Annualized Loss (EAL) calculation contract. Model loss event frequency (LEF) based on exploitability + exposure, loss magnitude based on downtime cost, recovery cost, and business impact. Strict labeling: "MODELED / ESTIMATED", never actual loss.
- **DEPENDENCIES**: HARSH-P3-01 (Enterprise Financial Inputs Contract)
- **OWNED FILES/MODULE**:
  - `docs/FINANCIAL_MODEL.md`
  - `backend/src/modules/financial/financial.types.ts`
  - `risk-engine/app/schemas/financial_input.py`
- **EXPECTED OUTPUT**: Mathematical specification and DTOs for financial risk modeling, currency normalization, and calculation explainability.
- **TEST REQUIREMENTS**: Pydantic and Zod schema validation tests; negative cost rejection tests.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P3-02
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **DESCRIPTION**: Implement deterministic Financial Exposure & EAL Engine in Python risk-engine and Node.js gateway with REST APIs (`GET /api/financial/exposure`, `GET /api/financial/assets/:id`, `GET /api/financial/summary`).
- **DEPENDENCIES**: TANISH-P3-01, HARSH-P3-02 (Enterprise financial inputs delivery)
- **OWNED FILES/MODULE**:
  - `backend/src/db/migrations/015_financial_results.sql`
  - `risk-engine/app/calculators/financial_exposure.py`
  - `risk-engine/tests/test_financial_exposure.py`
  - `backend/src/modules/financial/financial.service.ts`
  - `backend/src/modules/financial/financial.controller.ts`
  - `backend/src/modules/financial/financial.routes.ts`
  - `backend/src/modules/financial/__tests__/financial.integration.test.ts`
- **EXPECTED OUTPUT**: Deterministic EAL and financial exposure results with breakdown of contributing downtime and recovery costs, data completeness warnings, and model versioning.
- **TEST REQUIREMENTS**: Calculation tests validating deterministic math, zero-downtime edge cases, high-volume asset aggregation tests.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 4: WHAT-IF SIMULATION

#### TASK ID: TANISH-P4-01
- **PHASE**: Phase 4 — What-If Simulation
- **DESCRIPTION**: Implement Scenario Calculation Engine capable of snapshotting baseline risk posture and applying in-memory override state (e.g. patched CVEs, altered control postures, isolated assets) without mutating the PostgreSQL database.
- **DEPENDENCIES**: TANISH-P2-03, TANISH-P3-02, HARSH-P4-01 (Enterprise Action & Scenario Definitions)
- **OWNED FILES/MODULE**:
  - `risk-engine/app/scenarios/scenario_engine.py`
  - `risk-engine/tests/test_scenario_engine.py`
  - `backend/src/modules/scenarios/scenarios.types.ts`
- **EXPECTED OUTPUT**: Stateless, deterministic scenario evaluator computing baseline vs scenario delta for both risk score and modeled financial exposure.
- **TEST REQUIREMENTS**: In-memory mutation tests proving zero database writes; calculation accuracy comparing baseline against hypothetical states.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P4-02
- **PHASE**: Phase 4 — What-If Simulation
- **DESCRIPTION**: Implement What-If Simulation REST APIs (`POST /api/scenarios/simulate`, `POST /api/scenarios/assets/:assetId/simulate`, `GET /api/scenarios/presets`).
- **DEPENDENCIES**: TANISH-P4-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/scenarios/scenarios.service.ts`
  - `backend/src/modules/scenarios/scenarios.controller.ts`
  - `backend/src/modules/scenarios/scenarios.routes.ts`
  - `backend/src/modules/scenarios/__tests__/scenarios.integration.test.ts`
- **EXPECTED OUTPUT**: Production REST APIs returning baseline metrics, simulated metrics, risk delta, financial exposure delta, and missing data warnings.
- **TEST REQUIREMENTS**: Jest API integration tests; invalid override validation tests; concurrency tests.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 5: INVESTMENT OPTIMIZATION + ROSI

#### TASK ID: TANISH-P5-01
- **PHASE**: Phase 5 — Investment Optimization + ROSI
- **DESCRIPTION**: Author `docs/OPTIMIZATION.md` and implement deterministic multi-strategy optimization algorithm under budget constraints. Calculates Return on Security Investment (ROSI = (Risk Reduction Benefit - Action Cost) / Action Cost). Generates multiple candidate strategies (Strategy A: Maximum Risk Reduction, Strategy B: Balanced ROSI, Strategy C: Low Cost Quick Wins). Must NOT pick a single political "winner".
- **DEPENDENCIES**: HARSH-P5-01 (Remediation Action Catalog & Budget Constraints), TANISH-P3-02
- **OWNED FILES/MODULE**:
  - `docs/OPTIMIZATION.md`
  - `risk-engine/app/optimizers/budget_optimizer.py`
  - `risk-engine/app/calculators/rosi.py`
  - `risk-engine/tests/test_budget_optimizer.py`
- **EXPECTED OUTPUT**: Multi-strategy optimizer returning discrete, feasible action subsets respecting dependencies and budget ceilings.
- **TEST REQUIREMENTS**: Deterministic algorithm tests; budget boundary limit tests; mutually exclusive action tests; ROSI division-by-zero tests.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P5-02
- **PHASE**: Phase 5 — Investment Optimization + ROSI
- **DESCRIPTION**: Implement Investment Optimization REST APIs (`POST /api/optimization/solve`, `GET /api/optimization/strategies`, `POST /api/optimization/compare`).
- **DEPENDENCIES**: TANISH-P5-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/optimization/optimization.service.ts`
  - `backend/src/modules/optimization/optimization.controller.ts`
  - `backend/src/modules/optimization/optimization.routes.ts`
  - `backend/src/modules/optimization/__tests__/optimization.integration.test.ts`
- **EXPECTED OUTPUT**: REST endpoints delivering feasible strategy candidates, total costs, modeled risk reduction, modeled financial benefit, and ROSI.
- **TEST REQUIREMENTS**: Backend integration tests; invalid budget payload handling; performance check under 100+ candidate actions (< 500ms).
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 6: EXECUTIVE DECISION DASHBOARD

#### TASK ID: TANISH-P6-01
- **PHASE**: Phase 6 — Executive Decision Dashboard
- **DESCRIPTION**: Implement backend executive aggregation service rolling up enterprise risk posture, top 5 critical risk exposures, modeled financial exposure summary, active scenario summary, and optimizer strategy trade-off summary.
- **DEPENDENCIES**: TANISH-P2-03, TANISH-P3-02, TANISH-P5-02, HARSH-P6-01 (Enterprise Aggregation Dimensions)
- **OWNED FILES/MODULE**:
  - `backend/src/modules/executive/executive.service.ts`
  - `backend/src/modules/executive/executive.repository.ts`
- **EXPECTED OUTPUT**: Fast, pre-aggregated executive metrics respecting authentic PostgreSQL data with provenance timestamps and data completeness metrics.
- **TEST REQUIREMENTS**: Aggregation unit tests; empty database handling; verified zero synthetic KPIs.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P6-02
- **PHASE**: Phase 6 — Executive Decision Dashboard
- **DESCRIPTION**: Implement Executive Dashboard REST APIs (`GET /api/executive/posture`, `GET /api/executive/top-risks`, `GET /api/executive/financial-summary`).
- **DEPENDENCIES**: TANISH-P6-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/executive/executive.controller.ts`
  - `backend/src/modules/executive/executive.routes.ts`
  - `backend/src/modules/executive/__tests__/executive.integration.test.ts`
- **EXPECTED OUTPUT**: Real HTTP APIs returning executive posture, KEV exposure metrics, business unit rollups, and freshness indicators.
- **TEST REQUIREMENTS**: Integration tests; response time < 200ms; contract compliance tests.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 7A: COMPLIANCE INTELLIGENCE

#### TASK ID: TANISH-P7A-01
- **PHASE**: Phase 7A — Compliance Intelligence
- **DESCRIPTION**: Provide backend database query optimization, indexing, and joining layer for Harsh's compliance framework mapping tables. Ensure efficient cross-referencing between enterprise security controls and framework requirements.
- **DEPENDENCIES**: HARSH-P7A-01 (Compliance Framework & Evidence Tables)
- **OWNED FILES/MODULE**:
  - `backend/src/modules/compliance/compliance.query-builder.ts`
- **EXPECTED OUTPUT**: Optimized PostgreSQL queries for framework coverage, gap identification, and evidence aggregation.
- **TEST REQUIREMENTS**: SQL explain-analyze tests on joined control-compliance queries.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 7B: ATTACK PATH INTELLIGENCE

#### TASK ID: TANISH-P7B-01
- **PHASE**: Phase 7B — Attack Path Intelligence
- **DESCRIPTION**: Author `docs/ATTACK_PATH_MODEL.md` and build the Topological Attack Path Graph Engine in Python risk-engine. Models graph entities (Assets, Network Exposures, Installed Software, Exploitable Vulnerabilities, Defensive Controls, High-Criticality Destinations). Traverses directed paths using strictly verified evidence (no hallucinated ATT&CK links). Identifies structural choke points where defensive intervention breaks maximum attack paths.
- **DEPENDENCIES**: HARSH-P7B-01 (Asset Dependency & Network Topology Context), TANISH-P2-02
- **OWNED FILES/MODULE**:
  - `docs/ATTACK_PATH_MODEL.md`
  - `risk-engine/app/attack_graph/graph_traversal.py`
  - `risk-engine/app/attack_graph/choke_points.py`
  - `risk-engine/tests/test_attack_graph.py`
- **EXPECTED OUTPUT**: Directed graph model returning discovered paths, hop count, cumulative risk weight, choke points, and critical destinations.
- **TEST REQUIREMENTS**: Graph cycle detection tests; acyclic path discovery tests; zero-path disconnected asset tests; choke-point ranking verification.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P7B-02
- **PHASE**: Phase 7B — Attack Path Intelligence
- **DESCRIPTION**: Implement Attack Path REST APIs (`GET /api/attack-paths`, `GET /api/attack-paths/choke-points`, `GET /api/attack-paths/asset/:id`).
- **DEPENDENCIES**: TANISH-P7B-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/attack-paths/attack-paths.service.ts`
  - `backend/src/modules/attack-paths/attack-paths.controller.ts`
  - `backend/src/modules/attack-paths/attack-paths.routes.ts`
  - `backend/src/modules/attack-paths/__tests__/attack-paths.integration.test.ts`
- **EXPECTED OUTPUT**: Graph payload formatted for frontend visualization (nodes array, edges array, path metadata, provenance references).
- **TEST REQUIREMENTS**: API integration tests; payload structure validation; response time benchmarking.
- **STATUS**: IMPLEMENTED — FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 8: AI EXPLANATION ASSISTANT

#### TASK ID: TANISH-P8-01
- **PHASE**: Phase 8 — AI Explanation Assistant
- **DESCRIPTION**: Implement backend AI Explanation Orchestration Service. Consumes structured, deterministic calculation outputs from Risk Model v1, Financial Engine, and Optimizer. Constructs grounded prompts strictly constrained to provided numbers. Must NOT invent risk scores, financial losses, threat intel, or breach probabilities. Validates LLM responses against calculation ground truth.
- **DEPENDENCIES**: TANISH-P2-03, TANISH-P3-02, TANISH-P5-02, HARSH-P8-01 (Enterprise Context Sanitization)
- **OWNED FILES/MODULE**:
  - `backend/src/modules/assistant/assistant.service.ts`
  - `backend/src/modules/assistant/assistant.prompt-builder.ts`
  - `risk-engine/app/ai/grounding.py`
  - `backend/src/modules/assistant/__tests__/assistant.service.test.ts`
- **EXPECTED OUTPUT**: Grounded AI reasoning engine explaining *why* an asset is high risk, *why* financial exposure changed, or *how* Strategy A differs from Strategy B.
- **TEST REQUIREMENTS**: Anti-hallucination unit tests (verifying rejected claims that deviate from input numbers); prompt grounding assertions; safe error handling on API timeout.
- **STATUS**: IMPLEMENTED — LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING

#### TASK ID: TANISH-P8-02
- **PHASE**: Phase 8 — AI Explanation Assistant
- **DESCRIPTION**: Implement AI Assistant REST APIs (`POST /api/assistant/explain-risk`, `POST /api/assistant/explain-financial`, `POST /api/assistant/compare-strategies`).
- **DEPENDENCIES**: TANISH-P8-01
- **OWNED FILES/MODULE**:
  - `backend/src/modules/assistant/assistant.controller.ts`
  - `backend/src/modules/assistant/assistant.routes.ts`
  - `backend/src/modules/assistant/__tests__/assistant.integration.test.ts`
- **EXPECTED OUTPUT**: REST endpoints delivering structured AI explanations with explicit citation of underlying deterministic factors.
- **TEST REQUIREMENTS**: Integration tests; mock AI provider tests; payload validation tests.
- **STATUS**: IMPLEMENTED — LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING

---

### PHASE 9: FINAL INTEGRATION, PERFORMANCE, SECURITY & DEMO READINESS

#### TASK ID: TANISH-P9-01
- **PHASE**: Phase 9 — Final Integration, Performance, Security & Demo Readiness
- **DESCRIPTION**: Execute full backend and Python risk-engine regression test suite. Verify 100% calculation determinism across repeated executions. Conduct API latency optimization (< 250ms p95 across all risk and decision endpoints).
- **DEPENDENCIES**: All Phase 2–8 backend deliverables across Tanish, Harsh, and Nishit.
- **OWNED FILES/MODULE**:
  - `backend/src/`
  - `risk-engine/`
  - All automated test suites
- **EXPECTED OUTPUT**: Comprehensive regression verification report with 0 failed tests and confirmed calculation determinism.
- **TEST REQUIREMENTS**: 100% passing tests across backend Jest and Python pytest suites; load testing script execution.
- **STATUS**: TODO

#### TASK ID: TANISH-P9-02
- **PHASE**: Phase 9 — Final Integration, Performance, Security & Demo Readiness
- **DESCRIPTION**: Conduct architectural security audit, container hardening, CORS/header verification, secret masking checks, and finalize production demo data flow verification.
- **DEPENDENCIES**: TANISH-P9-01, HARSH-P9-01, NISHIT-P9-01
- **OWNED FILES/MODULE**:
  - `docker-compose.yml`
  - `backend/src/config/`
  - `docs/API_CONTRACTS.md`
- **EXPECTED OUTPUT**: Production-ready containerized deployment and final architecture sign-off.
- **TEST REQUIREMENTS**: Clean security audit; zero unmasked secrets; zero synthetic production data violations.
- **STATUS**: TODO

