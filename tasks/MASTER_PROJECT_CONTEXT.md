# CyberRiskOS — Master Project Context

## Executive Summary
CyberRiskOS is an AI-assisted continuous cyber risk quantification and security investment optimization platform designed for modern enterprise security and executive decision-making.

The platform bridges the communication divide between technical security teams (SecOps, Threat Intel, Vulnerability Management) and executive boards/C-suite leadership by grounding cybersecurity telemetry, threat intelligence, and defensive control postures into mathematically modeled, explainable financial risk figures.

---

## Architecture Domains & Team Boundaries

### 1. External Cyber Intelligence (Owner: TANISH)
- **Ingestion & Normalization**:
  - NIST National Vulnerability Database (NVD) via REST 2.0 API with dual SHA-256 cryptographic provenance.
  - CISA Known Exploited Vulnerabilities (KEV) Catalog with active status, due dates, and verified ransomware campaign usage.
  - MITRE ATT&CK Enterprise Matrix (Tactics, Techniques, Subtechniques, Mitigations, Groups, Software, and Stix 2.1 relationships).
  - VCDB (VERIS Community Database) public cybersecurity incidents covering 4A dimensions (Actors, Actions, Assets, Attributes) and explicit CVE links.
- **REST APIs**:
  - `/api/vulnerabilities` and `/api/vulnerabilities/:cveId`
  - `/api/integrations/nvd/*`
  - `/api/integrations/cisa-kev/*`
  - `/api/integrations/mitre-attack/*`
  - `/api/integrations/vcdb/*`
  - `/api/threat-intel/*`

### 2. Enterprise Internal Context (Owner: HARSH)
- **Hierarchy & Asset Management**:
  - Multi-tenant organizations and departmental business units.
  - Enterprise asset registry (servers, workstations, cloud instances, network appliances) with criticality tiers (1-5), internet exposure, and data classification.
  - Streaming CSV and JSON batch import pipelines.
- **Software Inventory & CPE Correlation**:
  - Per-asset installed software inventory with semantic/numerical version bounds comparator.
  - Automatic correlation to NVD vulnerability CPE criteria with transparent match reasoning (`POTENTIAL_VULNERABILITY_MATCH` status, zero unfounded claims of compromise).
- **Defensive Security Controls Posture**:
  - Authoritative defensive control catalog (`MFA`, `EDR`, `BACKUP`, `SEGMENTATION`, `PAM`, `ENCRYPTION`, `MONITORING`).
  - Per-asset control posture (`IMPLEMENTED`, `PARTIAL`, `NOT_IMPLEMENTED`, `UNKNOWN`) and provenance tracking (`USER_CONFIG`, `SCANNER_IMPORT`, `AUDIT_VERIFIED`).
- **REST APIs**:
  - `/api/organizations`, `/api/business-units`
  - `/api/assets`, `/api/assets/:id`, `/api/assets/import/*`
  - `/api/software`, `/api/assets/:id/software`
  - `/api/cpe-matching`, `/api/assets/:id/vulnerabilities`
  - `/api/controls`, `/api/assets/:id/controls`

### 3. Frontend & Product Experience (Owner: NISHIT)
- **Stack & Theme**:
  - React 18, TypeScript, Tailwind CSS, Vite.
  - Light Enterprise Analytics Theme (`#F7F8FA` background, `#FFFFFF` cards, `#111827` primary text, `#2563EB` action, `#7C3AED` metric).
- **Screens**:
  - Screen N2: Integration Center (`/integrations`)
  - Screen N3: Vulnerability Explorer (`/vulnerabilities`)
  - Screen N4: Vulnerability Detail (`/vulnerabilities/:cveId`)
  - Screen N5: Enterprise Asset Explorer (`/assets`)
  - Screen N6: Security Controls Posture (`/controls`)
  - Screen N7: Threat Intelligence Feed (`/threat-intel`)

---

## Pre-Release Integration Principles
1. **Zero Synthetic / Mock Production Cyber Data**: No fake CVEs, fake assets, fake incidents, or hallucinated ROI/financial metrics in production code.
2. **Defensive Terminology Integrity**: Correlations between installed software and vulnerabilities are strictly identified as "Potential vulnerability match" unless empirical incident evidence exists.
3. **Database Migration Authority**: The migration system (`backend/src/db/migrations/`) is the authoritative source of truth for evolving database schema.
4. **Scope Control (Phase 1 Baseline)**: Risk quantification formulas, What-If simulation, investment optimizers, and AI assistants were strictly quarantined from Phase 1 foundation and are now authoritatively scheduled across Phases 2 through 9.

---

## Phase 2 → Final Delivery Master Roadmap (Phases 2–9)

With Phase 1 external cyber intelligence (NVD, CISA KEV, MITRE ATT&CK, VCDB), enterprise assets, software inventory, CPE matching, controls posture, and frontend screens N2–N7 fully integrated and verified, ownership is frozen for all remaining phases:

- **PHASE 2: Risk Quantification**: Deterministic Risk Model v1 evaluating `(asset_id, vulnerability_id)` pairs, CVSS, CISA KEV exploitation evidence, candidate exposure context, and defensive control posture.
- **PHASE 3: Financial Exposure / EAL**: Modeled financial exposure and Estimated Annualized Loss (EAL) calculation grounded in real enterprise monetary inputs.
- **PHASE 4: What-If Simulation**: In-memory scenario engine simulating remediations, control state adjustments, and isolation without mutating production data.
- **PHASE 5: Investment Optimization + ROSI**: Deterministic multi-strategy generation under budget constraints, Return on Security Investment (ROSI), and trade-off analysis.
- **PHASE 6: Executive Decision Dashboard**: High-level posture rollup, top risk exposures, BU breakdown, and data completeness metrics.
- **PHASE 7A: Compliance Intelligence**: Authoritative mapping of defensive controls against regulatory frameworks (NIST CSF, ISO 27001, CIS, SOC 2) with explicit gap analysis.
- **PHASE 7B: Attack Path Intelligence**: Topological graph traversal modeling asset dependencies, software vulnerabilities, and high-criticality destinations using verified evidence.
- **PHASE 8: AI Explanation Assistant**: Grounded AI orchestration explaining calculated risk scores, financial deltas, and strategy trade-offs using structured model outputs (no hallucinated scores).
- **PHASE 9: Final Integration, Performance, Security & Demo Readiness**: Full-system end-to-end regression, performance optimization, security auditing, and demo flow polish.

---

## Global Architectural Flow & Principle

The platform data flow is strictly unidirectional:

```text
HARSH (Enterprise & Business Inputs)
             ↓
TANISH (Risk, Financial & Decision Engine Calculations)
             ↓
NISHIT (Frontend Product Experience & Real-Data Visualization)
```

- **HARSH** owns: **WHAT ENTERPRISE DATA EXISTS** (Assets, BUs, criticality, controls, costs, budgets, dependencies, compliance mappings).
- **TANISH** owns: **HOW VERIFIED DATA IS CALCULATED / MODELED** (Risk engine, financial models, What-If simulator, optimizer algorithms, attack graphs, AI orchestration).
- **NISHIT** owns: **HOW VERIFIED OUTPUTS ARE PRESENTED TO USERS** (Screens N8–N15, interactive charts, loading/empty/error states, client adapters).

---

## Core Modeling & Anti-Hallucination Principles

1. **Separation of Layers**:
   $$\text{Technical Severity (CVSS)} \neq \text{Enterprise Risk} \neq \text{Financial Exposure (EAL)}$$
   CVSS scores reflect technical flaw severity; enterprise risk incorporates asset criticality, internet exposure, and defensive controls; financial exposure incorporates empirical downtime and recovery cost inputs.
2. **Phase 2 Factor Defensibility (No Pre-Committed Arbitrary Factors)**:
   - Risk Model v1 is **NOT pre-committed** to an arbitrary ransomware multiplier, exposure weight, or control offset percentage.
   - Ransomware flags, internet exposure, and control posture are **candidate factors only** until the Phase 2A Risk Engine Contract (`docs/RISK_ENGINE_CONTRACT.md`) verifies their:
     - **Source authority & provenance**
     - **Semantic meaning**
     - **Mathematical & empirical defensibility**
     - **Quantitative treatment**
     - **Null / missing-data behavior**
   - **CISA KEV Ransomware Evidence**: May be used as verified empirical evidence, but must NOT be automatically converted into an arbitrary multiplier.
   - **Asset Internet Exposure**: May be used as verified context, but its numerical weight must be defined, defended, and documented before implementation.
   - **Security Controls Quantitative Posture**: Security controls must **NOT** receive arbitrary percentage reductions. If no defensible quantitative effectiveness methodology exists, controls remain **contextual and explainability inputs** in Risk Model v1 and do **not** mathematically reduce risk scores.
3. **Deterministic Model v1**:
   Risk and optimization algorithms must remain deterministic, explainable, versioned, and mathematically testable. Custom black-box machine learning trained on synthetic data is strictly prohibited.
4. **Zero Synthetic / Mock Production Cyber Data**:
   No fabricated CVEs, assets, incidents, controls, effectiveness percentages, risk scores, breach probabilities, monetary losses, downtime costs, remediation costs, or ATT&CK relationships.
5. **Estimated / Modeled Labeling**:
   All financial exposure figures must be explicitly labeled `MODELED / ESTIMATED` and never presented as guaranteed actual loss.
6. **Neutral Decision Support**:
   The Investment Optimizer must generate multiple feasible strategies (e.g., Strategy A, B, C) showing trade-offs. The software does not unilaterally pick a political "winner"—human executives decide.


