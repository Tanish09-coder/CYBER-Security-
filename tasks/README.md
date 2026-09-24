# CyberRiskOS — Strict Team Collaboration & Task Allocation Framework

## Overview
CyberRiskOS is a continuous cyber-risk quantification and security investment optimization platform. Due to the high complexity and cross-disciplinary nature of the architecture, strict team task allocation, explicit file ownership boundaries, and formal integration protocols are enforced.

The primary objective of this structure is **zero merge conflicts**, **zero accidental regressions**, and **zero unauthorized scope creep**.

---

## Team Structure & Leads

| Member | Primary Role | Phase 1 Domain Scope | Phase 2–9 Frozen Domain Scope |
| :--- | :--- | :--- | :--- |
| **TANISH** | Risk Intelligence, Quantification & Decision Engine Lead | Official threat intel (NVD, CISA KEV, MITRE, VCDB), crypto provenance. Architecture Coordinator. | Risk calculation engine, Financial exposure & EAL, What-If simulation engine, Investment optimizer, Attack path graph, AI explanation backend. |
| **HARSH** | Enterprise Context, Financial Inputs, Controls & Compliance Lead | Enterprise hierarchy, assets, software inventory, CPE matching, controls posture. | Monetary & impact inputs, remediation action catalog, budget constraints, compliance framework mappings & evidence, asset dependencies. |
| **NISHIT** | Frontend, Product Experience & Visualization Lead | UI shell, theme, Screens N2–N7, real API consumption, loading/empty states. | Screens N8–N15 (Risk, Financial, Simulator, Optimizer, Executive, Compliance, Attack Paths, AI Assistant), decision visualizations, demo flow. |

---

## Directory Layout

```text
tasks/
├── README.md                 # This root collaboration guide
├── MASTER_PROJECT_CONTEXT.md # Master project context & Phase 2–9 architectural rules
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

## Session Startup Declarations (Phase 2–9 Frozen Version)

Every AI assistant or developer session **must** begin by explicitly declaring their identity and scope:

- **Tanish**:
  > *"My name is Tanish. I am Person 1 and Risk Intelligence, Quantification & Decision Engine Lead. I will work only on tasks assigned to Tanish in tasks/TANISH/. I own the risk calculation engine, financial models, What-If simulation, investment optimizer, attack path engine, and AI explanation backend. I will not modify Harsh's enterprise CRUD/monetary input storage or Nishit's React frontend. If another module requires modification, I will document the dependency in tasks/dependencies/HARSH_REQUESTS.md or tasks/dependencies/NISHIT_REQUESTS.md."*

- **Harsh**:
  > *"My name is Harsh. I am Person 2 and Enterprise Context, Financial Inputs, Controls & Compliance Lead. I will work only on tasks assigned to Harsh in tasks/HARSH/. I own enterprise assets, business context, controls posture, user monetary inputs (downtime/recovery/action costs), budget limits, compliance mappings, and asset dependencies. I will not modify Tanish's risk/financial calculation formulas, optimizer algorithms, or Nishit's frontend. If another module requires modification, I will document the dependency in tasks/dependencies/TANISH_REQUESTS.md or tasks/dependencies/NISHIT_REQUESTS.md."*

- **Nishit**:
  > *"My name is Nishit. I am Person 3 and Frontend, Product Experience & Real-Data Visualization Lead. I will work only on tasks assigned to Nishit in tasks/NISHIT/. I own Screens N8 through N15, UI design tokens, API client integration, state handling, and visualization adapters. I will not modify Tanish's calculation formulas or Harsh's backend storage. If frontend requires a missing field, I will file a dependency request rather than inventing synthetic fields in the UI."*


---

## Critical Real-Data Mandate

CyberRiskOS is built on a non-negotiable principle: **ZERO SYNTHETIC PRODUCTION CYBER DATA**.
- **Tanish** ingests only official public feeds (NIST NVD, CISA KEV, MITRE ATT&CK, VCDB).
- **Harsh** accepts only user-provided enterprise inputs (via CSV, JSON, or forms) and never seeds fake corporate assets into production.
- **Nishit** renders only authentic backend API responses. If data is unavailable, clear empty or loading states must be displayed—never placeholder statistics or fabricated metrics.
- Mock fixtures are permitted **only** in isolated automated unit/integration tests and must never touch demo or production databases.
