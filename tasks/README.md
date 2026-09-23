# CyberRiskOS — Strict Team Collaboration & Task Allocation Framework

## Overview
CyberRiskOS is a continuous cyber-risk quantification and security investment optimization platform. Due to the high complexity and cross-disciplinary nature of the architecture, strict team task allocation, explicit file ownership boundaries, and formal integration protocols are enforced.

The primary objective of this structure is **zero merge conflicts**, **zero accidental regressions**, and **zero unauthorized scope creep**.

---

## Team Structure & Leads

| Member | Primary Role | Domain Scope |
| :--- | :--- | :--- |
| **TANISH** | Cyber Intelligence & External Data Integration Lead | Official threat intelligence feeds (NVD, CISA KEV, MITRE ATT&CK, VCDB), raw provenance, crypto hashing, source freshness, external ingestion pipelines. *Also serves as Integration Owner & Architecture Coordinator.* |
| **HARSH** | Enterprise Asset, Software, Control & Exposure Context Lead | Internal enterprise context: Organizations, business units, assets, software inventories, CPE version matching, asset dependencies, security controls (EDR, MFA, PAM, Backups, Segmentation). |
| **NISHIT** | Frontend, Product Experience & Real-Data Visualization Lead | Enterprise web application, light analytics interface, threat explorer, asset & control visualization, real API consumption, loading/empty states. |

---

## Directory Layout

```text
tasks/
├── README.md                 # This root collaboration guide
├── TEAM_OWNERSHIP.md         # Definitive file and folder ownership boundaries
├── SHARED_FILES.md           # Rules and change procedures for cross-domain files
├── INTEGRATION_RULES.md      # Protocol for cross-domain integration & PR reviews
├── dependencies/             # Formal cross-team dependency requests
│   ├── README.md
│   ├── TANISH_REQUESTS.md    # Incoming requests directed to Tanish
│   ├── HARSH_REQUESTS.md     # Incoming requests directed to Harsh
│   └── NISHIT_REQUESTS.md    # Incoming requests directed to Nishit
├── TANISH/                   # Tanish's dedicated workspace & progress tracking
│   ├── README.md
│   ├── TASKS.md
│   ├── OWNED_FILES.md
│   └── PROGRESS.md
├── HARSH/                    # Harsh's dedicated workspace & progress tracking
│   ├── README.md
│   ├── TASKS.md
│   ├── OWNED_FILES.md
│   └── PROGRESS.md
└── NISHIT/                   # Nishit's dedicated workspace & progress tracking
    ├── README.md
    ├── TASKS.md
    ├── OWNED_FILES.md
    └── PROGRESS.md
```

---

## 10 Golden Team Rules

Every team member must strictly adhere to these 10 rules during every coding session:

1. **Work Only Inside Your Assigned Scope**: Never initiate development on features or modules assigned to another lead.
2. **Never Edit Another Member's Owned Files**: Files listed under another member's `OWNED_FILES.md` are strictly read-only for you.
3. **Never Refactor Another Member's Code**: Even if you see potential optimizations or stylistic differences, do not modify their code.
4. **Never Rename Files or Folders Owned by Others**: Path alterations cause breaking changes across active branches.
5. **Never Alter Another Member's Database Tables**: New tables, schema modifications, or altered constraints must be managed exclusively through new migrations created by the table owner.
6. **Never Modify Shared Architecture Without Prior Approval**: Changes to shared core modules (e.g., `server.ts`, database client, config) require coordination with integration owner Tanish.
7. **Never Implement Another Member's Pending Task**: If a task is on another member's roadmap, wait for their completion and API contract delivery.
8. **Never "Fix" Unrelated Code During Your Task**: Confine commits strictly to the files required for your specific active task.
9. **Keep Changes Strictly Within Scope**: Atomic, focused pull requests make integration trivial and prevent cascading failures.
10. **Stop and Document When Blocked by Another Domain**: If you need a change in another member's module, STOP and file a request in `tasks/dependencies/` instead of modifying it yourself.

---

## Session Startup Declarations

Every AI assistant or developer session **must** begin by explicitly declaring their identity and scope:

- **Tanish**:
  > *"My name is Tanish. I am Person 1 and Cyber Intelligence Lead. I will work only on tasks assigned to Tanish in tasks/TANISH/. I will not modify Harsh's or Nishit's owned modules. If another module requires modification, I will document the dependency rather than modifying their work without approval."*

- **Harsh**:
  > *"My name is Harsh. I am Person 2 and Enterprise Context Lead. I will work only on tasks assigned to Harsh in tasks/HARSH/. I will not modify Tanish's Cyber Intelligence modules or Nishit's frontend. If another module requires modification, I will document the dependency rather than modifying their work without approval."*

- **Nishit**:
  > *"My name is Nishit. I am Person 3 and Frontend/Product Experience Lead. I will work only on tasks assigned to Nishit in tasks/NISHIT/. I will not modify Tanish's Cyber Intelligence modules or Harsh's enterprise-context modules. If backend changes are required, I will document the API requirement rather than modifying another member's backend implementation."*

---

## Critical Real-Data Mandate

CyberRiskOS is built on a non-negotiable principle: **ZERO SYNTHETIC PRODUCTION CYBER DATA**.
- **Tanish** ingests only official public feeds (NIST NVD, CISA KEV, MITRE ATT&CK, VCDB).
- **Harsh** accepts only user-provided enterprise inputs (via CSV, JSON, or forms) and never seeds fake corporate assets into production.
- **Nishit** renders only authentic backend API responses. If data is unavailable, clear empty or loading states must be displayed—never placeholder statistics or fabricated metrics.
- Mock fixtures are permitted **only** in isolated automated unit/integration tests and must never touch demo or production databases.
