# CyberRiskOS

## AI-Assisted Continuous Cyber Risk Quantification & Security Investment Optimization Platform

**Domain:** Blockchain & Cybersecurity  
**Version:** 1.0  
**Repository:** [https://github.com/Tanish09-coder/CYBER-Security-](https://github.com/Tanish09-coder/CYBER-Security-)

---

## 1. Product Vision

CyberRiskOS is a decision-support platform engineered to translate complex technical cybersecurity signals (vulnerabilities, exploits, assets, controls) into transparent, audit-ready financial risk exposure.

Instead of qualitative labels (Critical, High, Medium, Low), CyberRiskOS models:
- **Financial Loss Exposure**: Quantitative loss exceedance curves and annual loss expectancy.
- **Vulnerability Prioritization**: Joining real CVEs with active in-the-wild exploitation data (CISA KEV).
- **Security Investment Optimization**: Modeled risk reduction per invested security dollar.

---

## 2. Architecture & Technology Stack

- **Frontend**: React + TypeScript (Light Enterprise Analytics Theme).
- **Backend API**: Node.js + Express + TypeScript.
- **Risk Engine**: Python + FastAPI (Monte Carlo quantitative financial risk simulations).
- **Database**: PostgreSQL (UUID keys, JSONB raw payloads, cryptographic SHA-256 provenance).

---

## 3. Repository Structure

```text
├── backend/                  # Node.js + Express + TypeScript API server
│   ├── src/
│   │   ├── config/           # Environment and logging configurations
│   │   ├── db/               # PostgreSQL pool and migration runner
│   │   │   └── migrations/   # Sequentially numbered database DDL scripts
│   │   ├── modules/          # Domain modules (nvd, cisa-kev, ingestion, etc.)
│   │   └── scripts/          # Live end-to-end verification scripts
├── data/                     # Data stores and schemas
├── database/                 # Core relational schemas and init scripts
├── docs/                     # Technical specifications and integration guides
│   ├── API_CONTRACTS.md      # Binding REST API contracts directory
│   ├── CISA_KEV_INTEGRATION.md
│   ├── DATA_PROVENANCE.md
│   └── NVD_INTEGRATION.md
├── frontend/                 # React + TypeScript enterprise web application
├── risk-engine/              # Python quantitative financial risk engine
├── tasks/                    # Strict team task allocation and file-ownership structure
│   ├── TEAM_OWNERSHIP.md     # Authoritative domain boundary matrix
│   ├── SHARED_FILES.md       # Protocols for cross-domain infrastructure
│   ├── INTEGRATION_RULES.md  # Branch governance and handoff standards
│   ├── dependencies/         # Cross-team dependency request ticketing system
│   ├── TANISH/               # Cyber Intelligence Lead backlog and progress
│   ├── HARSH/                # Enterprise Context Lead backlog and progress
│   └── NISHIT/               # Frontend Lead backlog and progress
├── .env.example              # Template environment configuration (never commit real .env)
├── docker-compose.yml        # Multi-container orchestration
├── PRD.md                    # Master Product Requirements Document
├── PROJECT_STRUCTURE.md      # Comprehensive architectural blueprint
└── RISK_MODEL.md             # Quantitative financial loss formulas
```

---

## 4. Team Structure & Leads

| Lead | Role | Primary Scope |
| :--- | :--- | :--- |
| **TANISH** | Cyber Intelligence & External Data Integration Lead | Official public threat intelligence (NVD, CISA KEV, MITRE ATT&CK, VCDB), raw source preservation, SHA-256 provenance. *Integration Owner & Architecture Coordinator.* |
| **HARSH** | Enterprise Asset, Software, Control & Exposure Context Lead | Internal enterprise context: Organizations, assets, software inventories, CPE version matching, defensive controls. |
| **NISHIT** | Frontend, Product Experience & Real-Data Visualization Lead | Enterprise web application, light analytics interface, threat explorer, asset & control visualization, real API consumption. |

See [`tasks/README.md`](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/README.md) and [`tasks/TEAM_OWNERSHIP.md`](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/TEAM_OWNERSHIP.md) for detailed collaboration guidelines and boundary rules.

---

## 5. Non-Negotiable Real-Data Mandate

CyberRiskOS enforces a strict rule: **ZERO SYNTHETIC PRODUCTION CYBER DATA**.
- All vulnerability and exploit data originates exclusively from official authoritative sources (NIST NVD, CISA KEV).
- All asset, software, and control data originates from user configuration or authentic CSV/JSON imports.
- Mock fixtures are strictly isolated to automated tests and never enter the database.
