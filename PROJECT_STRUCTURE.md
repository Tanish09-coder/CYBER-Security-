# CyberRiskOS — Project Architecture & Structural Layout

This document defines the structural blueprint, directory tree, module responsibilities, database schema domains, and API boundaries for **CyberRiskOS**. No functional business code is implemented here; this is the structural reference.

---

## 1. Directory Tree Overview

```text
CyberRiskOS/
├── PRD.md                           # Product Requirements Document
├── PROJECT_STRUCTURE.md             # Repository layout & structural specification (this file)
├── RISK_MODEL.md                    # Mathematical quantification & ROSI formulations
├── docker-compose.yml               # Multi-service orchestration (Postgres, Backend, Risk Engine, Frontend)
│
├── frontend/                        # React + TypeScript + Tailwind CSS (Light Enterprise Analytics Theme)
│   ├── public/                      # Static assets, icons, metadata
│   ├── src/
│   │   ├── assets/                  # Brand vectors, icons
│   │   ├── components/              # Modular UI components
│   │   │   ├── common/              # Buttons, Badges, Modals, Breadcrumbs, EmptyStates, Skeletons
│   │   │   ├── layout/              # SidebarNav, HeaderBar, PageContainer, Breadcrumbs
│   │   │   ├── kpi/                 # FinancialKPICard, RiskMetricCard, DeltaIndicator
│   │   │   ├── tables/              # DataTable, AssetTable, VulnTable, StrategyTable, ComplianceTable
│   │   │   ├── charts/              # ExposureTrendChart, BusinessUnitBarChart, DiminishingReturnCurve
│   │   │   ├── graph/               # AttackPathGraph (Cytoscape.js / Network canvas)
│   │   │   ├── simulator/           # WhatIfControlPanel, DeltaComparisonView, ImpactBreakdown
│   │   │   ├── optimizer/           # BudgetSlider, StrategyCard, RosiMetricsTable
│   │   │   └── ai/                  # GroundedAssistantDrawer, ExplanationCard
│   │   ├── pages/                   # Application route views (Section 19 in PRD)
│   │   │   ├── auth/                # Login, Unauthorized
│   │   │   ├── executive/           # ExecutiveRiskOverview (CISO / Board view)
│   │   │   ├── technical/           # TechnicalDashboard (SecOps view)
│   │   │   ├── assets/              # AssetExplorer & AssetDetailView
│   │   │   ├── vulnerabilities/     # VulnerabilityExplorer & CVE Detail
│   │   │   ├── threats/             # ThreatIntelligenceFeed (MITRE & KEV)
│   │   │   ├── simulator/           # WhatIfSimulator (Sandbox scenario testing)
│   │   │   ├── optimizer/           # InvestmentOptimizer (Budget-to-ROSI)
│   │   │   ├── attack-paths/        # AttackPathVisualizer (Lateral movement graph)
│   │   │   ├── compliance/          # ComplianceMapping (NIST CSF, ISO 27001, CIS, RBI, SEBI)
│   │   │   ├── reports/             # Executive & Technical Report Generator
│   │   │   ├── integrations/        # Data Sources / Telemetry Ingestion (CSV, JSON, REST)
│   │   │   └── settings/            # Organization Profile, Financial Assumptions, Users & RBAC
│   │   ├── hooks/                   # Custom React hooks (useRiskData, useSimulation, useOptimizer)
│   │   ├── context/                 # Global state (AuthContext, OrganizationContext, ScenarioContext)
│   │   ├── services/                # Axios / Fetch client calling Backend API Gateway
│   │   ├── types/                   # TypeScript interfaces matching backend models & risk schemas
│   │   ├── utils/                   # Currency formatters (INR ₹ Lakhs/Crores), Date helpers, Risk color helpers
│   │   ├── styles/                  # Tailwind theme, light enterprise palette (#F7F8FA, #2563EB, #7C3AED)
│   │   ├── App.tsx                  # Main router & layout shell
│   │   └── main.tsx                 # React DOM entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                         # Node.js API Gateway & Orchestrator (Express / NestJS)
│   ├── src/
│   │   ├── config/                  # Environment variables, database config, service endpoints
│   │   ├── constants/               # Enums (AssetTypes, Criticality, RiskLevels, Frameworks)
│   │   ├── middleware/              # Auth (JWT), RBAC guard, Request Validator, Audit Logger, Rate Limiter
│   │   ├── modules/                 # Domain-driven backend modules
│   │   │   ├── auth/                # Authentication, password hashing, session management
│   │   │   ├── organizations/       # Enterprise profiles, financial assumptions & loss calibrations
│   │   │   ├── assets/              # Asset registry, dependencies, asset criticality CRUD
│   │   │   ├── vulnerabilities/     # NVD / CISA KEV ingestion, asset vulnerability mappings
│   │   │   ├── threat-intel/        # Threat feeds, MITRE ATT&CK technique catalog
│   │   │   ├── telemetry/           # Telemetry parsers (CSV, JSON, REST API) for SIEM/IAM/EDR
│   │   │   ├── controls/            # Security control catalog, implementation tracking, effectiveness
│   │   │   ├── risk/                # Proxy & coordination with Python Risk Engine, snapshot storage
│   │   │   ├── simulation/          # What-If scenario cloning, parameter overrides, delta diffing
│   │   │   ├── optimizer/           # Security budget parameter dispatch & strategy persistence
│   │   │   ├── attack-paths/        # Graph traversal & blast-radius route calculation
│   │   │   ├── compliance/          # Frameworks (ISO 27001, NIST CSF, CIS, RBI, SEBI) & gap mapping
│   │   │   ├── reports/             # PDF/HTML audit report generation
│   │   │   ├── assistant/           # Grounded AI assistant dispatch (reads structured metrics only)
│   │   │   └── audit/               # Immutable audit trail logger (Section 25 in PRD)
│   │   ├── database/                # Database connection pool (pg / TypeORM / Prisma)
│   │   │   ├── migrations/          # 22 Domain SQL migration scripts
│   │   │   └── seeds/               # Initial bootstrap datasets (SIH Demo Enterprise Profile)
│   │   ├── utils/                   # Math helpers, currency conversions, logging utilities
│   │   └── server.ts                # HTTP server bootstrap & health check routes
│   ├── package.json
│   └── tsconfig.json
│
├── risk-engine/                     # High-Performance Python Risk Quantification & Optimization Service
│   ├── app/
│   │   ├── core/                    # App configuration, logging, mathematical constants
│   │   ├── schemas/                 # Pydantic data validation schemas (Inputs, Outputs, DTOs)
│   │   │   ├── asset.py             # Asset valuation, exposure, business criticality schema
│   │   │   ├── vulnerability.py     # CVSS vector, exploitability, patch status schema
│   │   │   ├── control.py           # Control status (Implemented/Partial/None) & weighting schema
│   │   │   ├── risk.py              # Likelihood, Financial Loss, Modeled Exposure schema
│   │   │   ├── simulation.py        # Scenario action schemas (MFA toggle, Patch applied, Delay days)
│   │   │   └── optimizer.py         # Budget, Initiative constraints, ROSI, Pareto strategy schemas
│   │   ├── engine/                  # Core deterministic quantification algorithms (no black boxes)
│   │   │   ├── risk_quantifier.py   # Likelihood = Threat × Vuln × Exposure × Criticality × ControlWeakness
│   │   │   ├── financial_loss.py    # Downtime + Recovery + Data + Interruption + Regulatory Loss
│   │   │   ├── exposure.py          # Expected Annual Loss (EAL = IncidentProb × FinancialImpact)
│   │   │   ├── explainability.py    # Factor attribution & Shapley/driver breakdown for dollar exposure
│   │   │   ├── whatif_simulator.py  # Sandbox recalculation & delta differential generator
│   │   │   ├── optimizer.py         # Multi-initiative knapsack / linear optimizer (SciPy / OR-Tools)
│   │   │   └── rosi.py              # Return on Security Investment calculation [(ΔLoss - Cost) / Cost]
│   │   ├── api/                     # FastAPI route handlers
│   │   │   ├── v1/
│   │   │   │   ├── risk_routes.py       # POST /api/v1/risk/calculate, /api/v1/risk/asset/{id}
│   │   │   │   ├── simulation_routes.py # POST /api/v1/simulate/whatif
│   │   │   │   ├── optimizer_routes.py  # POST /api/v1/optimize/budget
│   │   │   │   └── explain_routes.py    # GET  /api/v1/explain/asset/{id}
│   │   └── main.py                  # FastAPI application entry point
│   ├── requirements.txt             # fastapi, uvicorn, pydantic, numpy, pandas, scipy, ortools
│   └── Dockerfile
│
├── database/                        # PostgreSQL relational schemas & initialization
│   ├── schema.sql                   # Comprehensive DDL covering all 22 domain tables
│   ├── seeds/
│   │   ├── 01_frameworks.sql        # NIST CSF, ISO 27001, CIS, RBI, SEBI controls
│   │   ├── 02_demo_enterprise.sql   # SIH Demo: Payment Gateway, Customer DB, Identity Svc, Cloud
│   │   ├── 03_vulnerabilities.sql   # Real CVEs (Log4j, OpenSSL, KEV items)
│   │   └── 04_mitigation_catalog.sql# Candidate security initiatives with costs & control impact
│   └── README.md
│
├── data/                            # Public intelligence ingestion samples & schemas
│   ├── nvd_sample.json              # Public NVD CVE sample records
│   ├── cisa_kev_sample.json         # CISA Known Exploited Vulnerabilities catalog
│   ├── mitre_attack_sample.json     # Enterprise ATT&CK matrix mappings
│   └── telemetry_sample.csv         # Sample authentication and security event log entries
│
└── docs/                            # Architecture and formula documentation
    ├── RISK_MODEL.md                # Formally documented mathematical models & calibration criteria
    ├── API_SPEC.md                  # REST endpoints specifications
    └── SIH_DEMO_SCRIPT.md           # Step-by-step judge walkthrough matching Section 26 of PRD
```

---

## 2. Core Database Schema Domains (PRD Section 22)

The 22 core tables are structured into logical functional domains:

| Domain | Tables | Primary Purpose |
|---|---|---|
| **Identity & Tenancy** | `organizations`, `users` | Multi-tenant organization profile, financial base currency (₹ INR), user roles (CISO, Analyst, Auditor, Executive). |
| **Asset Management** | `assets`, `asset_dependencies` | Asset criticality (1-5), internet exposure, data classification, revenue dependence, and directional dependency graph. |
| **Vulnerability & Threat** | `vulnerabilities`, `asset_vulnerabilities`, `threat_intelligence`, `security_events` | CVE metadata (CVSS v3/v4), KEV status, MITRE ATT&CK techniques, mapped telemetry logs. |
| **Controls & Posture** | `controls`, `asset_controls` | Security controls (MFA, EDR, PAM, Encryption), status (Implemented, Partial, None), effectiveness scores (0.0 - 1.0). |
| **Financial Calibration** | `financial_profiles` | Org-provided financial inputs: hourly downtime cost, record cost, breach liability, recovery rate. |
| **Risk & Explainability**| `risk_snapshots`, `risk_drivers` | Historical & live calculation of Expected Annual Exposure (₹), decomposed by driver weight. |
| **What-If Simulation** | `scenarios`, `scenario_actions`, `scenario_results` | Sandbox simulation records, intervention overrides (e.g. patch applied, MFA enabled), risk delta comparisons. |
| **Investment Optimization**| `mitigation_actions`, `mitigation_costs`, `investment_runs`, `investment_strategies` | Security initiatives, cost estimates, budget limits, multi-strategy outputs (Strategy A, B, C) with ROSI. |
| **Compliance & Audit** | `frameworks`, `framework_controls`, `control_mappings`, `reports`, `audit_logs` | NIST CSF, ISO 27001, CIS, RBI, SEBI mapping, immutable tamper-evident change log. |

---

## 3. Service Communication Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │                   FRONTEND (React)                     │
       │  Light Enterprise Analytics Theme (#F7F8FA / #2563EB)  │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS / REST / WebSockets
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               NODE.JS API GATEWAY (Port 5000)          │
       │  - Auth & RBAC (CISO, Analyst, Executive, Auditor)     │
       │  - Telemetry Ingestion (CSV / JSON / REST)             │
       │  - Scenario Management & Audit Logging                 │
       │  - Grounded AI Assistant (Metrics Context Assembler)   │
       └─────────────┬───────────────────────────┬──────────────┘
                     │                           │
       Direct Queries│               Inter-Service│ HTTP Calls
                     ▼                           ▼
       ┌────────────────────────┐  ┌────────────────────────────┐
       │ POSTGRESQL (Port 5432) │  │  PYTHON RISK ENGINE (8000) │
       │ - 22 Domain Tables     │  │  - Deterministic Exposure  │
       │ - Asset Dependencies   │  │  - What-If Engine          │
       │ - Audit Trails         │  │  - Knapsack Optimizer      │
       │ - Risk Snapshots       │  │  - Explainability & ROSI   │
       └────────────────────────┘  └────────────────────────────┘
```

---

## 4. UI Screen Hierarchy (PRD Section 19 & 32)

1. **Executive Risk Overview**: Top-level Modeled Annual Exposure (₹ Crores/Lakhs), Risk Trend chart, Top Risky Business Units, Top Risky Assets, Immediate Risk Reduction Opportunities.
2. **Technical Dashboard**: SecOps telemetry, open CVEs, KEV alert badges, active controls, remediation backlog.
3. **Asset Explorer & Detail View**: Master asset inventory, criticality tier, dependency tree, deep-dive risk factor cards, financial exposure breakdown.
4. **Vulnerability Explorer**: Ingested NVD CVEs, CISA KEV status, exploitability filters, mapped affected assets.
5. **Threat Intelligence Layer**: Active threats, MITRE ATT&CK technique matrix, targeted technologies.
6. **Risk Drivers & Explainability**: Factor attribution waterfall (Critical CVE, Known Exploitation, Internet Exposure, Missing MFA, Weak Segmentation).
7. **What-If Simulation Studio**: Sandbox panel to toggle interventions (Enable MFA, Patch CVE, Segment Network, Delay 7/30/60 days), side-by-side Before vs. After financial delta.
8. **Security Investment Optimizer**: Budget input slider (e.g. ₹1 Crore), strategy generator (Strategy A, B, C), diminishing return curve, portfolio residual risk.
9. **Attack Path Visualizer**: Cytoscape.js directed lateral movement graph from Internet -> VPN -> Endpoint -> App Server -> Payment/Customer DB.
10. **Compliance Mapping Center**: Control gaps mapped to NIST CSF, ISO 27001, CIS Safeguards, RBI Cyber Security Framework, SEBI Resilience guidelines.
11. **Data Integrations**: Upload CSV/JSON telemetry, trigger live NVD/KEV synchronization.
12. **Executive & Audit Reports**: Traceable PDF/HTML reports, compliance scorecards, audit change logs.
