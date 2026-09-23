# HARSH — Workspace & Lead Overview

## Lead Profile
- **Name**: HARSH
- **Role**: Enterprise Asset, Software, Control & Exposure Context Lead
- **Branch**: `feature/harsh-enterprise-context`

---

## Mandatory Work Session Start Declaration

Before beginning any development session, copy and state this declaration explicitly:

> "My name is Harsh.  
> I am Person 2 and Enterprise Context Lead.  
> I will work only on tasks assigned to Harsh in tasks/HARSH/.  
> I will not modify Tanish's Cyber Intelligence modules or Nishit's frontend.  
> If another module requires modification, I will document the dependency rather than modifying their work without approval."

---

## Mission & Domain Scope

Harsh owns all **internal enterprise context**: the organizations, business units, assets, software inventories, security controls, and exposure attributes that turn abstract threat intelligence into actionable enterprise security posture.

### Primary Responsibilities:
1. **Organization & Multi-Tenant Model**: Organization profile, business units, departmental hierarchy.
2. **Enterprise Asset Inventory**: Hardware/virtual assets, IP addresses, hostnames, asset types (server, workstation, cloud instance, network appliance).
3. **Software Inventory & Versions**: Installed software packages, version tracking, vendor normalization.
4. **CPE Matching Engine**: Evaluating installed software against NVD CPE criteria bounds (`versionStartIncluding`, `versionEndIncluding`, etc.) with transparent match reasoning.
5. **Asset-Vulnerability Correlation**: Linking real matched vulnerabilities to assets without claiming compromise.
6. **Criticality & Exposure Configuration**: Business criticality ratings (CRITICAL to LOW), data classification (PII, Financial, Internal), Internet exposure flag.
7. **Security Control Inventory**: Tracking implementation status of key defensive controls (MFA, EDR, Backups, PAM, Network Segmentation, Encryption).
8. **Real Import Pipelines**: Robust CSV and JSON ingestion pipelines for enterprise asset and control catalogs.

---

## Non-Negotiable Real-Data Mandate

**HARSH MUST NOT CREATE SYNTHETIC PRODUCTION ORGANIZATION DATA.**

The platform must support:
- Real user-entered organization profiles
- Real CSV file imports
- Real JSON payload imports
- Future enterprise CMDB / EDR API integrations

Never seed fake production companies or placeholder asset lists. In tests, use isolated test-only fixtures that never enter the demo or production database.

---

## Prohibited Scope (Do NOT Modify)

- **External Cyber Intelligence Modules** (`backend/src/modules/nvd/`, `cisa-kev/`, `mitre-attack/`, `vcdb/`, `ingestion/`): Owned by Tanish.
- **Frontend Application** (`frontend/`): Owned by Nishit.
- **Database Migrations Created by Others**: Never edit `001_nvd_ingestion.sql`, `002_cisa_kev_ingestion.sql`, etc.

---

## File Navigation

- [TASKS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/TASKS.md): Detailed task breakdown and Phase H1-H5 roadmap.
- [OWNED_FILES.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/OWNED_FILES.md): Exhaustive list of all files and directories owned by Harsh.
- [PROGRESS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/HARSH/PROGRESS.md): Live task status, recent work, blockers, and next steps.
