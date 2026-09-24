# Dependency Requests for NISHIT (Frontend Lead)

All requests directed to **Nishit** regarding frontend UI components, dashboard displays, visualization adapters, or user experience flows must be filed here.

---

### REQUEST ID: NISHIT-001
- **REQUESTED BY**: Tanish
- **OWNER NEEDED**: Nishit
- **DATE**: 2026-09-23
- **DESCRIPTION**: Add dual-source cryptographic provenance indicators on the Vulnerability Detail modal/page.
- **WHY REQUIRED**: For high-trust regulatory audits, users need to see both the official source authority (NVD/NIST and CISA) and their respective SHA-256 payload hashes directly in the UI.
- **EXPECTED CONTRACT**:
  - Component reads `vulnerability.provenance` and `vulnerability.kevProvenance`.
  - Displays SHA-256 hashes with click-to-copy utility and ingestion timestamp.
- **BLOCKING / NON-BLOCKING**: NON-BLOCKING (Scheduled for Screen N4)
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in `VulnerabilityDetail.tsx` with dual SHA-256 click-to-copy badges. Verified in post-merge pass.

---

### REQUEST ID: NISHIT-002
- **REQUESTED BY**: Harsh
- **OWNER NEEDED**: Nishit
- **DATE**: 2026-09-23
- **DESCRIPTION**: Ensure Asset Explorer terminology strictly states *"Potential vulnerability match"* rather than *"Asset compromised"*.
- **WHY REQUIRED**: CPE matching identifies vulnerable software packages installed on an asset. Exploitation requires attack path confirmation and active threat actors; mislabeling matching as compromise causes false enterprise alarms.
- **EXPECTED CONTRACT**:
  - UI labels, tooltips, and table headers must use: *"Potential Vulnerability Matches"* or *"CPE Vulnerability Correlation"*.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N5 review
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Enforced across `Assets.tsx` with strict terminology. Verified in post-merge pass.

---

### REQUEST ID: NISHIT-003
- **REQUESTER**: Tanish
- **OWNER**: Nishit
- **PHASE**: Phase 2 — Risk Quantification (Screen N8)
- **REQUIRED FIELD/API**: Factor contribution drawer and model version badge (`Model v1.0.0`) on Risk Overview page
- **WHY REQUIRED**: Regulatory compliance and executive explainability require transparent factor weights, empirical evidence, and semantic model versioning clearly visible in UI.
- **EXPECTED CONTRACT**:
  - Screen N8 includes a model version pill and an expandable factor drawer displaying CVSS, verified CISA KEV exploitation evidence, documented exposure context, and defensive control posture (without arbitrary multipliers or unverified percentage deductions).
- **BLOCKING / NON-BLOCKING**: NON-BLOCKING for initial table render, BLOCKING for Phase 2 sign-off
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Task NISHIT-P2-01 in `tasks/NISHIT/TASKS.md`.

---

### REQUEST ID: NISHIT-004
- **REQUESTER**: Harsh
- **OWNER**: Nishit
- **PHASE**: Phase 3 — Financial Exposure / EAL (Screen N9)
- **REQUIRED FIELD/API**: Explicit visual label "MODELED / ESTIMATED" and unconfigured monetary input warning banner
- **WHY REQUIRED**: Financial exposure figures must never be confused with guaranteed actual loss, and missing downtime cost configurations must be prominently surfaced.
- **EXPECTED CONTRACT**:
  - Screen N9 includes banner: "MODELED / ESTIMATED" and warning chip when `dataCompletenessScore < 100%`.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Phase 3 sign-off
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Task NISHIT-P3-01 in `tasks/NISHIT/TASKS.md`.

---

### REQUEST ID: NISHIT-005
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: All
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing contracts for Executive Dashboard, Compliance UI, Attack Path, and AI Assistant.
- **WHY REQUIRED**: Frontend P2-5 through P2-8 are scaffolded but completely lack backend DTO schemas. The endpoints exist (`/api/v1/reports`, `/api/v1/compliance`, `/api/v1/attack-paths`, `/api/v1/assistant`) and return 501s, but there are no verifiable schemas in `schemas/contracts.py`. Cannot proceed with API client integration.
- **EXPECTED CONTRACT**:
  - Need explicit Request/Response schema definitions for these modules.
- **BLOCKING / NON-BLOCKING**: BLOCKING for P2-5, P2-6, P2-7, P2-8 integrations.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-006
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing `(asset, vulnerability)` pair granularity in Risk Calculation Response for Screen N8.
- **WHY REQUIRED**: The Screen N8 spec (Task NISHIT-P2-01) requires displaying "paginated risk scores for (asset, vulnerability) pairs" including "CVE ID, Base CVSS, Risk Score badge, Risk Level pill", but the current `AssetRiskResult` schema only provides aggregated asset-level risk (`incident_probability`, `single_loss_expectancy`, `modeled_annual_exposure`).
- **EXPECTED CONTRACT**:
  - Need a detailed list of scored vulnerabilities per asset in `AssetRiskResult`, or a separate paginated drill-down endpoint `GET /api/risk/assets/:assetId/vulnerabilities`.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Risk Overview (Screen N8) vulnerability table implementation.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-007
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing enterprise risk score delta in `WhatIfSimulationResponse`.
- **WHY REQUIRED**: The Screen N10 (What-If Simulator) specification (Task NISHIT-P4-01) requires a comparative side-by-side view showing the "delta in enterprise risk score". However, the current `WhatIfSimulationResponse` schema only provides financial exposure fields (`baseline_exposure`, `simulated_exposure`, `modeled_risk_reduction`).
- **EXPECTED CONTRACT**:
  - Add `baseline_risk_score`, `simulated_risk_score`, and `risk_score_delta` to `WhatIfSimulationResponse` in `contracts.py`.
- **BLOCKING / NON-BLOCKING**: BLOCKING for full N10 What-If Simulator side-by-side comparison implementation.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-008
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing dedicated backend contract and endpoint for Compliance UI (Screen N13).
- **WHY REQUIRED**: To populate N13, a backend endpoint (`/api/v1/compliance`) and response schema are needed to serve aggregated compliance mappings, framework status, and gap analysis.
- **EXPECTED CONTRACT**:
  - DTOs defining compliance status, gaps, and mapping to supported frameworks (NIST, ISO, CIS, RBI, SEBI).
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N13.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-009
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Harsh
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing enterprise control-to-framework mappings and evidence context for Compliance UI.
- **WHY REQUIRED**: Tanish's compliance endpoint requires enterprise inputs mapping raw technical controls to specific regulatory frameworks (NIST, ISO, CIS, RBI, SEBI).
- **EXPECTED CONTRACT**:
  - Provision of compliance mapping inputs, requirement definitions, and audit evidence requirements to the backend.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N13.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-010
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing dedicated backend contract and endpoint for Attack Path UI (Screen N14).
- **WHY REQUIRED**: To populate N14, a backend endpoint (`/api/v1/attack-paths`) and response schema are needed to serve the generated attack graph nodes, edges, traversal paths, and calculated path scores.
- **EXPECTED CONTRACT**:
  - DTOs defining graph nodes (assets, vulnerabilities, controls), relationships/edges, and ordered attack paths with severity, likelihood, and impact.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N14.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-011
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Harsh
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing enterprise dependency and structural context for Attack Path UI.
- **WHY REQUIRED**: Tanish's attack graph requires enterprise inputs such as network topology, asset dependencies, control placement, and business relationships to generate valid attack paths.
- **EXPECTED CONTRACT**:
  - Provision of network topology data, dependency definitions, and enterprise context to the backend graph engine.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N14.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-012
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing dedicated backend contract and endpoint for AI Assistant UI (Screen N15).
- **WHY REQUIRED**: To populate N15, a backend endpoint (`/api/v1/assistant`), AI orchestration logic, LLM integration, and a verified response schema are needed.
- **EXPECTED CONTRACT**:
  - Request/Response DTOs defining chat requests (prompt, context selections) and responses (messages, citations, sources, status).
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N15.
- **STATUS**: OPEN

---

### REQUEST ID: NISHIT-013
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Harsh
- **DATE**: 2026-09-25
- **DESCRIPTION**: Missing enterprise context and grounding data for AI Assistant.
- **WHY REQUIRED**: The AI backend requires enterprise context (assets, controls, business logic) to provide grounded and organization-specific answers.
- **EXPECTED CONTRACT**:
  - Provision of enterprise context and constraints to the AI orchestration layer.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N15.
- **STATUS**: OPEN
