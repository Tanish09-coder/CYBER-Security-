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
4. **Scope Control**: Risk quantification formulas, What-If simulation, investment optimizers, and AI assistants belong to downstream development phases and are strictly out of scope for the post-merge integration pass.
