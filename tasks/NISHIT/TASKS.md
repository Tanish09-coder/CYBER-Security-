# NISHIT — Task Roadmap & Execution Backlog

## Screen Roadmap Summary

| Screen ID | Screen Title | Backend Dependency | Status | Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **N1** | Application Shell & Design Tokens | None (Internal) | **COMPLETED** | Layout, responsive navigation, sidebar, header, CSS variables |
| **N2** | Integration Center | Tanish (`/api/integrations/*`) | **COMPLETED** | Real-time health, sync status, and freshness dashboard |
| **N3** | Vulnerability Explorer | Tanish (`/api/vulnerabilities`) | **COMPLETED** | Searchable, paginated CVE table with CVSS & KEV badges |
| **N4** | Vulnerability Detail Modal/Page | Tanish (`/api/vulnerabilities/:cveId`) | **COMPLETED** | Deep dive with dual provenance hashes, CPEs, and CWEs |
| **N5** | Asset Explorer | Harsh (`/api/assets`) | **COMPLETED** | Enterprise assets, criticality tiers, potential CVE matches |
| **N6** | Security Controls UI | Harsh (`/api/controls`) | **COMPLETED** | Implementation matrix for MFA, EDR, PAM, Backups |
| **N7** | Threat Intelligence Dashboard | Tanish (`/api/threat-intel/*`) | **COMPLETED** | ATT&CK matrix view and empirical VCDB distributions |

---

## Detailed Screen Specifications (Phase 1 Baseline)

### Screen N1: Application Shell & Design Foundation [COMPLETED]
- [x] Initialized standard frontend layout in `frontend/src/`:
  - `components/layout/Sidebar.tsx`: Enterprise navigation sidebar with section groupings.
  - `components/layout/Header.tsx`: Organization selector, breadcrumb trail, environment tag.
  - `styles/theme.css`: Core design tokens matching PRD Section 32 (`#F7F8FA`, `#2563EB`, etc.).
  - `components/common/Badge.tsx`, `Button.tsx`, `Table.tsx`, `Modal.tsx`, `Skeleton.tsx`.
- [x] Client routing with React Router across all foundational screens.

---

### Screen N2: Integration Center Dashboard [COMPLETED]
- [x] Created `pages/Integrations.tsx` connecting to live status endpoints (NVD, CISA KEV, MITRE, VCDB).
- [x] Source health cards, freshness indicators, and manual re-sync actions.

---

### Screen N3: Vulnerability Explorer [COMPLETED]
- [x] Created `pages/Vulnerabilities.tsx` with preferred CVSS scores, CISA KEV flags, ransomware tags, search, and pagination.

---

### Screen N4: Vulnerability Detail View [COMPLETED]
- [x] Created `pages/VulnerabilityDetail.tsx` with multi-assessment CVSS tabs, CISA KEV executive banner, affected CPEs, CWEs, and dual SHA-256 provenance hashes.

---

### Screen N5: Enterprise Asset Explorer [COMPLETED]
- [x] Created `pages/Assets.tsx` with clean empty state when no assets are registered, strict "Potential Vulnerability Matches" labeling, and verified zero synthetic assets.

---

### Screen N6: Security Controls Posture [COMPLETED]
- [x] Created `pages/Controls.tsx` rendering authentic defensive controls (MFA, EDR, Backups, PAM, Segmentation, Encryption, Monitoring) with coverage percentages.

---

### Screen N7: Threat Intelligence & Incident Trends [COMPLETED]
- [x] Created `pages/ThreatIntel.tsx` rendering MITRE ATT&CK matrix columns and VCDB empirical breach trends.

---

## Phase 2 → Final Delivery Master Roadmap (Phases 2–9)

The following roadmap defines all remaining tasks owned by **NISHIT** (Frontend, Product Experience & Real-Data Visualization Lead).

```text
========================================================================================
NISHIT ROADMAP SUMMARY (PHASES 2–9)
- Phase 2: Screen N8 — Risk Overview UI (Scores, Levels, Factor Drawer, Model v1 Stamp)
- Phase 3: Screen N9 — Financial Exposure UI (Modeled Loss, EAL Breakdown, Completeness)
- Phase 4: Screen N10 — What-If Simulator UI (Interactive Builder, Baseline vs Scenario Deltas)
- Phase 5: Screen N11 — Investment Optimizer UI (Budget Input, Strategy Trade-offs, ROSI)
- Phase 6: Screen N12 — Executive Dashboard UI (Board Posture Rollup, Top Risks, BU Charts)
- Phase 7A: Screen N13 — Compliance UI (Frameworks, Controls Mapping, Evidence, Gaps)
- Phase 7B: Screen N14 — Attack Path UI (Topological Graph, Choke Points, Critical Assets)
- Phase 8: Screen N15 — AI Explanation Assistant UI (Contextual Drawer, AI vs Math Distinction)
- Phase 9: Final Integration, UX Consistency, Accessibility & Demo Flow
========================================================================================
```

---

### PHASE 2: RISK QUANTIFICATION (SCREEN N8)

#### TASK ID: NISHIT-P2-01
- **PHASE**: Phase 2 — Risk Quantification
- **DESCRIPTION**: Implement Screen N8 (Risk Overview) under `frontend/src/pages/RiskOverview.tsx`. Displays paginated risk scores for `(asset, vulnerability)` pairs. Columns: Asset Name, Criticality Tier, CVE ID, Base CVSS, Risk Score badge (color-coded, 0–100), Risk Level pill (CRITICAL, HIGH, MEDIUM, LOW), and Contributing Factors trigger. Includes search by asset/CVE, severity filter, KEV filter, and model version banner (`Model v1.0.0`).
  - **Mandatory Modeling Guardrail**:
    - UI strictly reflects verified factor contributions provided by backend DTOs.
    - Contributing factor drawer presents verified empirical evidence and context (e.g., CISA KEV Exploitation: Active, Internet Exposure: Yes/No, Control Implementation: Implemented/Unknown).
    - UI must **NOT** hardcode or display arbitrary multiplier claims unless officially specified in backend `docs/RISK_ENGINE_CONTRACT.md`.
    - If controls lack quantitative reduction in Risk Model v1, UI cleanly renders them as defensive context/posture rather than fabricated percentage deductions.
- **DEPENDENCIES**: TANISH-P2-03 (`GET /api/risk/scores`, `GET /api/risk/assets/:assetId`), HARSH-P2-02
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/RiskOverview.tsx`
  - `frontend/src/components/risk/RiskScoreBadge.tsx`
  - `frontend/src/components/risk/RiskFactorsDrawer.tsx`
  - `frontend/src/api/risk.ts`
- **EXPECTED OUTPUT**: Production React page rendering real risk scores from backend API, slide-out drawer showing factor breakdown, missing-data warnings, and zero synthetic placeholders.
- **TEST REQUIREMENTS**: Vitest / React Testing Library unit tests; Loading/Empty/Error state tests.
- **STATUS**: TODO


---

### PHASE 3: FINANCIAL EXPOSURE / EAL (SCREEN N9)

#### TASK ID: NISHIT-P3-01
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **DESCRIPTION**: Implement Screen N9 (Financial Exposure) under `frontend/src/pages/FinancialExposure.tsx`. Displays total modeled financial exposure and Estimated Annualized Loss (EAL). Visual breakdown of contributing components: Downtime Losses, Data Breach Impact, System Recovery Costs, and Remediation Expenses. Prominent label: "MODELED / ESTIMATED (Not Guaranteed Actual Loss)". Input completeness warnings if enterprise downtime costs are unconfigured.
- **DEPENDENCIES**: TANISH-P3-02 (`GET /api/financial/exposure`, `GET /api/financial/summary`), HARSH-P3-02
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/FinancialExposure.tsx`
  - `frontend/src/components/financial/EalBreakdownChart.tsx`
  - `frontend/src/components/financial/FinancialCard.tsx`
  - `frontend/src/api/financial.ts`
- **EXPECTED OUTPUT**: Enterprise financial analytics dashboard with currency formatting, contributing loss breakdown, and missing data banner.
- **TEST REQUIREMENTS**: Component tests; currency formatting tests; missing input warning assertions.
- **STATUS**: TODO

---

### PHASE 4: WHAT-IF SIMULATION (SCREEN N10)

#### TASK ID: NISHIT-P4-01
- **PHASE**: Phase 4 — What-If Simulation
- **DESCRIPTION**: Implement Screen N10 (What-If Simulator) under `frontend/src/pages/WhatIfSimulator.tsx`. Interactive scenario builder allowing users to stage hypothetical changes: patch specific CVEs, change control status (e.g. enable EDR on Tier 1 servers), or isolate assets. Comparative side-by-side view: Baseline Posture vs Simulated Posture. Shows delta in enterprise risk score and modeled financial exposure. Reset scenario and compare scenarios utilities.
- **DEPENDENCIES**: TANISH-P4-02 (`POST /api/scenarios/simulate`), HARSH-P4-01
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/WhatIfSimulator.tsx`
  - `frontend/src/components/scenarios/ScenarioBuilder.tsx`
  - `frontend/src/components/scenarios/DeltaCard.tsx`
  - `frontend/src/api/scenarios.ts`
- **EXPECTED OUTPUT**: Dynamic simulation workspace showing instant modeled deltas with zero mutations to production data.
- **TEST REQUIREMENTS**: Interactive state tests; scenario reset tests; delta calculation display tests.
- **STATUS**: TODO

---

### PHASE 5: INVESTMENT OPTIMIZATION + ROSI (SCREEN N11)

#### TASK ID: NISHIT-P5-01
- **PHASE**: Phase 5 — Investment Optimization + ROSI
- **DESCRIPTION**: Implement Screen N11 (Investment Optimizer) under `frontend/src/pages/InvestmentOptimizer.tsx`. Features: organization budget input/slider, candidate action selector, and strategy comparison cards (Strategy A: Maximum Risk Reduction, Strategy B: Balanced ROSI, Strategy C: Quick Wins). Visual trade-off scatter/bar chart (Cost vs Risk Reduction vs ROSI). Strict Rule: Neutral decision support—do NOT visually declare one political "winner", let executives evaluate trade-offs.
- **DEPENDENCIES**: TANISH-P5-02 (`POST /api/optimization/solve`), HARSH-P5-01
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/InvestmentOptimizer.tsx`
  - `frontend/src/components/optimizer/StrategyComparisonCard.tsx`
  - `frontend/src/components/optimizer/TradeoffChart.tsx`
  - `frontend/src/api/optimization.ts`
- **EXPECTED OUTPUT**: Decision intelligence UI presenting feasible security investment portfolios with trade-offs.
- **TEST REQUIREMENTS**: Strategy rendering tests; budget slider edge case tests; neutral presentation audit.
- **STATUS**: TODO

---

### PHASE 6: EXECUTIVE DECISION DASHBOARD (SCREEN N12)

#### TASK ID: NISHIT-P6-01
- **PHASE**: Phase 6 — Executive Decision Dashboard
- **DESCRIPTION**: Implement Screen N12 (Executive Dashboard) under `frontend/src/pages/ExecutiveDashboard.tsx`. Executive summary cards: Overall Enterprise Risk Posture, Critical Assets at Risk, Active CISA KEV Exposure, Total Modeled Financial Exposure, Business Unit Breakdown, Top Recommended Investment Strategies, and Defensive Control Posture. Data completeness and source freshness badges. Strict Rule: Zero fake executive KPIs.
- **DEPENDENCIES**: TANISH-P6-02 (`GET /api/executive/*`), HARSH-P6-01
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/ExecutiveDashboard.tsx`
  - `frontend/src/components/executive/PostureSummaryCard.tsx`
  - `frontend/src/components/executive/BuBreakdownChart.tsx`
  - `frontend/src/api/executive.ts`
- **EXPECTED OUTPUT**: Board-ready executive dashboard consolidating technical telemetry, risk scores, and financial impact.
- **TEST REQUIREMENTS**: Dashboard layout tests; real-time metric rendering tests; empty state tests.
- **STATUS**: TODO

---

### PHASE 7A: COMPLIANCE INTELLIGENCE (SCREEN N13)

#### TASK ID: NISHIT-P7A-01
- **PHASE**: Phase 7A — Compliance Intelligence
- **DESCRIPTION**: Implement Screen N13 (Compliance & Audit Posture) under `frontend/src/pages/Compliance.tsx`. Framework selector (NIST CSF 2.0, ISO 27001, CIS, SOC 2), coverage gauge, mapped defensive controls table, audit evidence records, and gap analysis alerts. Strict disclaimer: "Mapping and gap analysis only; does not constitute formal certification unless verified by accredited third-party auditor".
- **DEPENDENCIES**: HARSH-P7A-02 (`GET /api/compliance/*`), TANISH-P7A-01
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/Compliance.tsx`
  - `frontend/src/components/compliance/FrameworkCoverageGauge.tsx`
  - `frontend/src/components/compliance/ControlsMappingTable.tsx`
  - `frontend/src/api/compliance.ts`
- **EXPECTED OUTPUT**: Comprehensive compliance visibility page showing defensive alignment and gaps.
- **TEST REQUIREMENTS**: Framework switcher tests; coverage math rendering tests; disclaimer visibility tests.
- **STATUS**: TODO

---

### PHASE 7B: ATTACK PATH INTELLIGENCE (SCREEN N14)

#### TASK ID: NISHIT-P7B-01
- **PHASE**: Phase 7B — Attack Path Intelligence
- **DESCRIPTION**: Implement Screen N14 (Attack Path Intelligence) under `frontend/src/pages/AttackPaths.tsx`. Interactive topological graph visualization rendering nodes (Internet, Assets, Software, CVEs, Critical Destinations) and directed edges (network access, vulnerability exploitability, lateral movement). Visual highlighting of critical choke points. Detail inspector drawer for selected path.
- **DEPENDENCIES**: TANISH-P7B-02 (`GET /api/attack-paths/*`), HARSH-P7B-01
- **OWNED FILES/MODULE**:
  - `frontend/src/pages/AttackPaths.tsx`
  - `frontend/src/components/attack-paths/TopologyGraph.tsx`
  - `frontend/src/components/attack-paths/ChokePointBadge.tsx`
  - `frontend/src/api/attackPaths.ts`
- **EXPECTED OUTPUT**: High-impact, responsive graph visualizer highlighting adversarial attack paths and high-leverage defensive choke points.
- **TEST REQUIREMENTS**: Graph render tests; node click inspection tests; performance tests with 50+ nodes.
- **STATUS**: TODO

---

### PHASE 8: AI EXPLANATION ASSISTANT (SCREEN N15)

#### TASK ID: NISHIT-P8-01
- **PHASE**: Phase 8 — AI Explanation Assistant
- **DESCRIPTION**: Implement Screen N15 / Contextual AI Assistant Panel (`frontend/src/components/assistant/AiAssistantDrawer.tsx`). Interactive drawer accessible across risk, financial, and optimizer screens. Quick prompt buttons: "Why is this asset high risk?", "Explain this financial exposure", "Compare Strategy A and B". Clear visual styling that explicitly distinguishes AI-generated natural language from deterministic mathematical outputs.
- **DEPENDENCIES**: TANISH-P8-02 (`POST /api/assistant/*`), HARSH-P8-01
- **OWNED FILES/MODULE**:
  - `frontend/src/components/assistant/AiAssistantDrawer.tsx`
  - `frontend/src/components/assistant/PromptSuggestionChips.tsx`
  - `frontend/src/api/assistant.ts`
- **EXPECTED OUTPUT**: AI explainability interface empowering executives and security analysts to query complex mathematical risk models.
- **TEST REQUIREMENTS**: Drawer toggle tests; stream/markdown rendering tests; badge distinction assertions.
- **STATUS**: TODO

---

### PHASE 9: FINAL INTEGRATION, PERFORMANCE, SECURITY & DEMO READINESS

#### TASK ID: NISHIT-P9-01
- **PHASE**: Phase 9 — Final Integration, Performance, Security & Demo Readiness
- **DESCRIPTION**: Execute full frontend regression across all screens (N1 through N15). Verify responsive behavior across mobile, tablet, and widescreen. Implement WCAG AA contrast and keyboard accessibility. Verify 100% of loading skeletons, empty states, and error retry boundaries. Polish presentation and executive demo navigation flow.
- **DEPENDENCIES**: All Phase 2–8 Nishit deliverables.
- **OWNED FILES/MODULE**:
  - `frontend/src/`
  - `frontend/package.json`
  - `docs/DESIGN_SYSTEM.md`
- **EXPECTED OUTPUT**: Flawless, production-grade frontend build passing `npm run build` and end-to-end demo flow.
- **TEST REQUIREMENTS**: Full frontend test run; lighthouse accessibility score >= 90; production build size optimization.
- **STATUS**: TODO

