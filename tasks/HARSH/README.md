# HARSH — Workspace & Lead Overview

## Lead Profile
- **Name**: HARSH
- **Role**: Enterprise Context, Financial Inputs, Controls & Compliance Lead
- **Phase 1 Branch**: `feature/harsh-enterprise-context`
- **Phase 2–9 Branch**: `feature/harsh-enterprise-financial-context`

---

## Mandatory Work Session Start Declaration (Phase 2–9 Frozen Version)

Before beginning any development session, copy and state this declaration explicitly:

> "My name is Harsh.  
> I am Person 2 and Enterprise Context, Financial Inputs, Controls & Compliance Lead.  
> I will work only on tasks assigned to Harsh in tasks/HARSH/.  
> I own enterprise assets, business context, controls posture, user monetary inputs (downtime/recovery/action costs), budget limits, compliance mappings, and asset dependencies.  
> I will not modify Tanish's risk/financial calculation formulas, optimizer algorithms, or Nishit's frontend.  
> If another module requires modification, I will document the dependency in tasks/dependencies/TANISH_REQUESTS.md or tasks/dependencies/NISHIT_REQUESTS.md."

---

## Mission & Domain Scope

Harsh owns all **internal enterprise context**: the organizations, business units, assets, software inventories, security controls, monetary inputs, remediation catalogs, compliance framework mappings, and network topology that ground threat intelligence and risk modeling into the enterprise.

### Primary Responsibilities (Phase 2–9):
1. **Organization & Multi-Tenant Model**: Organization profile, business units, departmental hierarchy, currency settings.
2. **Enterprise Asset Inventory**: Hardware/virtual assets, IP addresses, hostnames, asset types, criticality tiers (1–5), internet exposure, data classification.
3. **Software Inventory & Versions**: Installed software packages, version tracking, vendor normalization.
4. **CPE Matching Engine**: Evaluating installed software against NVD CPE criteria bounds with transparent match reasoning (`POTENTIAL_VULNERABILITY_MATCH` status, zero unfounded claims of compromise).
5. **Security Control Posture**: Tracking defensive controls (MFA, EDR, Backups, PAM, Network Segmentation, Encryption, Monitoring) with genuine provenance (`USER_CONFIG`, `SCANNER_IMPORT`, `AUDIT_VERIFIED`).
6. **Enterprise Financial Inputs**: Managing organization-provided monetary baselines (hourly downtime costs, recovery cost baselines, business interruption valuation).
7. **Remediation Action Catalog**: Managing discrete candidate actions (action ID, target asset, target vuln/control, implementation cost, dependencies, feasibility, budget ceiling).
8. **Compliance Frameworks & Evidence (Primary Owner)**: Mapping defensive controls to NIST CSF, ISO 27001, CIS Controls, SOC 2; tracking evidence and gap analysis (no false certification claims).
9. **Asset Dependencies & Network Topology**: Maintaining asset adjacencies, upstream/downstream dependencies, and exposure context for attack path analysis.
10. **Enterprise Context Privacy Boundaries**: Enforcing redaction of sensitive credentials, hostnames, and PII before context participates in AI assistant prompts.

---

## Non-Negotiable Real-Data Mandate

**HARSH MUST NOT CREATE SYNTHETIC PRODUCTION ORGANIZATION DATA.**

The platform must support:
- Real user-entered organization profiles
- Real CSV file imports
- Real JSON payload imports
- Real user-entered financial baselines and budget limits
- Authentic compliance evidence records

Never seed fake production companies or placeholder asset lists. In tests, use isolated test-only fixtures that never enter the demo or production database.

---

## Prohibited Scope (Do NOT Modify)

- **External Cyber Intelligence Modules** (`backend/src/modules/nvd/`, `cisa-kev/`, `mitre-attack/`, `vcdb/`, `ingestion/`): Owned by Tanish.
- **Risk & Decision Calculation Engines** (`risk-engine/`, `backend/src/modules/risk/`, `financial/`, `scenarios/`, `optimization/`, `attack-paths/`, `assistant/`): Owned by Tanish.
  - Harsh provides monetary inputs (e.g. `downtimeCostPerHour`), but does **NOT** compute financial risk exposure.
  - Harsh defines remediation actions and budgets, but does **NOT** compute optimizer strategies or ROSI.
- **Frontend Application** (`frontend/`): Owned by Nishit.
- **Database Migrations Created by Others**: Never edit `001_nvd_ingestion.sql` through `004_vcdb_incidents.sql` or Tanish's calculation migrations.

---

## File Navigation


- [TASKS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/TASKS.md): Detailed task breakdown and Phase H1-H5 roadmap.
- [OWNED_FILES.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/OWNED_FILES.md): Exhaustive list of all files and directories owned by Harsh.
- [PROGRESS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/PROGRESS.md): Live task status, recent work, blockers, and next steps.
