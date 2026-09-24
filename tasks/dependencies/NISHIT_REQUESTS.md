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
