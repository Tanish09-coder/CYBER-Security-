# TANISH — Workspace & Lead Overview

## Lead Profile
- **Name**: TANISH
- **Role**: Cyber Intelligence & External Data Integration Lead
- **Secondary Role**: Project Integration Owner & Architecture Coordinator
- **Branch**: `feature/tanish-cyber-intelligence`

---

## Mandatory Work Session Start Declaration

Before beginning any development session, copy and state this declaration explicitly:

> "My name is Tanish.  
> I am Person 1 and Cyber Intelligence Lead.  
> I will work only on tasks assigned to Tanish in tasks/TANISH/.  
> I will not modify Harsh's or Nishit's owned modules.  
> If another module requires modification, I will document the dependency rather than modifying their work without approval."

---

## Mission & Domain Scope

Tanish owns all **external, public cyber-threat intelligence ingestion, normalization, and provenance tracking**.

### Primary Responsibilities:
1. **Official NVD API v2.0 Connector**: Ingestion, CVSS multi-assessment preservation, CWE/CPE extraction, pacing rate limiter, pagination.
2. **Official CISA KEV Feed**: Full catalog sync, non-destructive reconciliation (`is_current`, timestamps), and NVD linking.
3. **MITRE ATT&CK Enterprise Matrix**: STIX 2.1 ingestion, tactics, techniques, sub-techniques, mitigations, relationships.
4. **VCDB / VERIS Incident Data**: Real breach and incident intelligence ingestion, frequency tracking, empirical breach distributions.
5. **Raw Source Cryptographic Provenance**: Immutable storage in `raw_source_records` with deterministic SHA-256 hashing.
6. **Freshness Monitoring**: Source staleness tracking against configurable hour thresholds.
7. **Cross-Source Enrichment APIs**: Exposing unified intelligence endpoints for frontend and asset correlation.

---

## Prohibited Scope (Do NOT Modify)

- **Frontend Application** (`frontend/`): Owned entirely by Nishit.
- **Enterprise Asset & Control Modules** (`backend/src/modules/organizations/`, `assets/`, `software/`, `controls/`): Owned by Harsh.
- **Financial Risk Engine** (`risk-engine/`): Quantitative loss calculation, Monte Carlo engines, and budget optimizers are out of scope unless formally reassigned.

---

## File Navigation

- [TASKS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/TANISH/TASKS.md): Detailed task breakdown, current backlog, and completed milestones.
- [OWNED_FILES.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/TANISH/OWNED_FILES.md): Exhaustive list of all files and directories owned by Tanish.
- [PROGRESS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/TANISH/PROGRESS.md): Live task status, recent commits, test results, and next actions.
