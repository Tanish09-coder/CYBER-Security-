# CyberRiskOS

## AI-Assisted Continuous Cyber Risk Quantification & Security Investment Optimization Platform

**Domain:** Blockchain & Cybersecurity  
**Version:** 1.0.0 (Release Candidate — Phase 9 Complete)  
**Repository:** [https://github.com/Tanish09-coder/CYBER-Security-](https://github.com/Tanish09-coder/CYBER-Security-)  
**License:** Enterprise Proprietary  

---

## 1. Verified Release State (Phase 9 Acceptance)

| Subsystem / Gate | Verified Status | Evidence |
| :--- | :---: | :--- |
| **Harsh ↔ Tanish Backend Integration** | ✅ VERIFIED | Live HTTP Integration Suite (`15 passed`) |
| **Nishit ↔ Backend Contracts** | ✅ VERIFIED | Shared DTO contracts aligned across all modules |
| **N8–N15 Real API Wiring** | ✅ VERIFIED | Zero mock data in production; all screens wired |
| **Organization Currency Architecture** | ✅ VERIFIED | ISO-4217 canonical base currency, `Intl.NumberFormat`, no silent fallback |
| **Security & Auth Hardening** | ✅ VERIFIED | JWT Bearer, bcrypt cost 12, org-scoped isolation, helmet, rate limiting |
| **Performance Benchmarking** | ✅ MEASURED | Real measured endpoints: p95 < 60ms across all core endpoints |
| **Fresh Database Migration Gate** | ✅ VERIFIED | 13 sequential migrations applied zero-to-head cleanly |
| **Docker Container Topology** | ✅ VERIFIED | Internal network isolation for Python engine & PostgreSQL |
| **No-Synthetic Production Audit** | ✅ VERIFIED | Zero synthetic CVEs, assets, or budgets in production code. Synthetic fixtures are isolated to recognized automated-test/fixture paths (__tests__, __fixtures__) and are unreachable from production/demo runtime paths. |
| **Frontend TypeScript & Production Build** | ✅ VERIFIED | `tsc --noEmit` clean, Vite production bundle (368 kB JS gzip 94 kB) |
| **Backend TypeScript & Test Suite** | ✅ VERIFIED | `tsc --noEmit` clean, 100% test pass rate across 40+ test suites |

---

## 2. Product Overview & Core Mathematical Guardrails

CyberRiskOS translates real-world technical cyber threat signals into defensible, quantitative financial risk metrics:
- **Threat Intelligence Provenance**: Direct ingestion from NIST NVD, CISA KEV, MITRE ATT&CK, and VCDB/VERIS with SHA-256 integrity verification.
- **Enterprise Context Correlation**: Automated CPE 2.3 software inventory matching against vulnerability criteria without manual intervention.
- **Deterministic Risk Model v1**: Continuous multi-factor evaluation combining CVSS v3.1/v4.0 base metrics, CISA KEV active exploitation flags, asset business criticality tier, perimeter internet exposure, and verified defensive control posture/context.
- **Deterministic Financial Model**: Single Loss Expectancy (SLE) and Estimated Annualized Loss (EAL) calculated from authoritative enterprise financial parameters (downtime cost, recovery rate, outage duration, annualized loss frequency).
- **Investment Optimization**: Multi-strategy portfolio knapsack solver identifying optimal remediation actions under capital budget constraints to maximize modeled risk and EAL reduction.
- **Grounded AI Assistant**: Strict audit-anchored LLM decision support with deterministic fallback; never hallucinates scores, never invents loss guarantees, and never recommends a single "winner".

> [!IMPORTANT]
> **Defensible Modeling Boundaries:**
> - Modeled risk scores are continuous prioritization metrics, **NOT** probabilities of breach.
> - Modeled EAL is an estimated decision-support exposure metric, **NOT** guaranteed monetary loss.
> - Potential CVE matches indicate vulnerable software presence, **NOT** proof of asset compromise.
> - Compliance coverage reflects internal defensive posture against security standards, **NOT** formal regulatory audit certification.

---

## 3. Organization Base Currency Architecture

CyberRiskOS implements strict enterprise multi-currency handling:

1. **One Organization = One Base Currency**:
   - Each organization defines a single authoritative ISO-4217 base currency (`INR`, `USD`, `EUR`, `GBP`, etc.).
   - All financial parameters (hourly downtime cost, recovery rate, remediation cost, available budget, SLE, EAL, modeled EAL reduction) are measured in the organization's base currency.
2. **No Silent Fallback**:
   - `currency || 'USD'` fallbacks are strictly prohibited.
   - If organization currency is unconfigured or unavailable, financial exposure renders `NOT_AVAILABLE`.
3. **No Mixed-Currency Arithmetic**:
   - Monetary inputs with mismatched currencies are rejected with `400 Bad Request` (`CURRENCY_MISMATCH`) unless accompanied by authoritative FX provenance metadata.
4. **Currency-Independent Scores**:
   - CVSS scores, Risk Scores (0.0–100.0), ALEF, ROSI percentages, attack path structural severity scores, and compliance coverage percentages remain purely dimensionless.
5. **Frontend Rendering**:
   - Uses browser-native `Intl.NumberFormat` with appropriate locale formatting (e.g. `en-IN` for INR, `en-US` for USD). Currency symbols are never hardcoded in JSX.

---

## 4. API Security Hardening

- **Authentication**: JWT access tokens (1-hour lifespan, HS256) with passwords hashed via `bcryptjs` (cost 12).
- **Tenant Isolation**: `requireOrgAccess` middleware verifies that the authenticated user belongs to the requested organization. Cross-organization access attempts are blocked with `403 Forbidden` and audited.
- **CORS Protection**: Strict allowlist validation; wildcards (`origin: true`) are rejected in production.
- **Brute-Force & Rate Limiting**: Strict windowed rate limiters protect authentication and high-cost calculation endpoints.
- **Sanitized Logging**: Passwords, tokens, API keys, and connection strings are masked at the logger boundary.
- **Zero Information Leakage**: Production error responses omit stack traces and internal database schemas.

---

## 5. LOCAL / CI PERFORMANCE BENCHMARK

> [!IMPORTANT]
> **Benchmark Scope & Environment Specifications:**
> - **Environment**: Local / CI Development & Automated Pipeline Benchmark
> - **Node.js Runtime**: Node.js v24.18.1
> - **Database Engine**: In-memory PostgreSQL-compatible test engine (`pg-mem`)
> - **Test Workload**: 25 assets, 20 correlated CVEs, authentic graph topology
> - **Load Profile**: 50 requests per endpoint
> 
> *These measurements reflect local/CI in-memory execution and should not be represented as production-scale PostgreSQL performance.*

| Endpoint | Target | Measured Median (p50) | Measured p95 | Measured p99 | Error Rate | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Risk List** (`GET /api/v1/risk/scores`) | < 250 ms | **4.4 ms** | **7.7 ms** | **39.2 ms** | **0.0%** | ✅ PASS |
| **Financial Exposure** (`GET /api/v1/financial/exposure`) | < 250 ms | **3.7 ms** | **5.9 ms** | **10.3 ms** | **0.0%** | ✅ PASS |
| **Executive Posture** (`GET /api/v1/executive/posture`) | < 250 ms | **10.7 ms** | **15.1 ms** | **48.6 ms** | **0.0%** | ✅ PASS |
| **Compliance Coverage** (`GET /api/v1/compliance/frameworks`) | < 250 ms | **2.1 ms** | **4.2 ms** | **5.3 ms** | **0.0%** | ✅ PASS |
| **Attack Graph Query** (`GET /api/v1/attack-paths`) | < 250 ms | **7.4 ms** | **57.2 ms** | **605.8 ms** | **0.0%** | ✅ PASS |

*Note: Attack path query p99 latency (605.8 ms) reflects complete recursive traversal and cycle detection across deep dependency graphs during single-threaded test execution.*

---

## 6. Official 12-Step SIH Demonstration Flow

For the Smart India Hackathon (SIH) live evaluation, execute this repeatable 12-step verification flow:

1. **Threat Intelligence Provenance**: Open Threat Intel Explorer; inspect official synchronization timestamps and SHA-256 payload hashes from NIST NVD and CISA KEV.
2. **Real Vulnerability Examination**: Select an active CVE (e.g. `CVE-2021-44228` Log4Shell) showing CVSS v3.1 10.0 and official CISA KEV Ransomware Campaign flag.
3. **Enterprise Asset Inventory**: Navigate to Assets; inspect enterprise assets with user-defined criticality tiers and network exposure.
4. **Automated CPE Matching**: View correlated asset vulnerabilities matched automatically by software version bounds without synthetic assumptions.
5. **Modeled Risk Evaluation & Control Posture**: Trigger atomic risk evaluation; inspect the deterministic factor breakdown (base CVSS, exploitability, asset tier, perimeter exposure). Verify active controls evaluated as **control posture/context** (defensive audit context without arbitrary quantitative score reduction).
6. **Authoritative Financial Exposure**: Navigate to Financial Exposure; view calculated SLE, ALEF, and EAL formatted in the organization's base currency (e.g. `₹` INR for the Indian demo entity).
7. **What-If Scenario Simulation**: Launch What-If Simulator; apply a patch remediation action to observe deterministic risk and EAL reduction with ZERO database mutations.
8. **Remediation Action Catalog**: Review the organization's remediation initiative catalog with explicit implementation costs.
9. **Investment Optimizer**: Execute optimizer under an enterprise budget ceiling; inspect generated strategies (`MAX_MODELED_RISK_REDUCTION`, `MAX_MODELED_EAL_REDUCTION`, `MAX_ROSI`).
10. **Executive Decision Dashboard**: Review enterprise-wide posture metrics, top financial risk drivers, and the explicit EAL completeness indicator (`Modeled EAL across N of M assets`).
11. **Attack Path & Topology Graph**: Inspect topological attack graph showing blast radius and critical choke points based strictly on authentic asset dependencies.
12. **Grounded AI Explanation**: Ask AI Assistant to compare Strategy A vs Strategy B; observe objective trade-off presentation grounded in authoritative figures with zero hallucination.

---

## 7. Container Deployment & Production Startup

### Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+
- Node.js 20+ (for local development)
- Python 3.11+ (for local risk engine development)

### Quick Start with Docker
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure mandatory production secrets in .env
# Set JWT_SECRET, POSTGRES_PASSWORD, ALLOWED_ORIGINS

# 3. Build and launch all isolated containers
docker compose up -d --build

# 4. Check service health
docker compose ps
```

### Network Architecture
```text
Browser (Client)
      │
      ▼  :80 / :443
┌───────────────────────────────────────┐
│        Frontend Web Server (Nginx)     │
└──────────────────┬────────────────────┘
                   │ /api/*
                   ▼  :5000
┌───────────────────────────────────────┐
│     Node.js API Gateway & Service     │
└─────────┬───────────────────┬─────────┘
          │ (internal network) │ (internal network)
          ▼                   ▼
┌───────────────────┐ ┌─────────────────────────┐
│ PostgreSQL 16 DB  │ │ Python Risk Engine      │
│ :5432 (Internal)  │ │ :8000 (Internal Only)   │
└───────────────────┘ └─────────────────────────┘
```

---

## 8. Verification & Test Gate Commands

```bash
# Backend TypeScript Check
cd backend && npx tsc --noEmit

# Backend Complete Test Suite
cd backend && node ./node_modules/jest/bin/jest.js --runInBand

# Performance Benchmark
cd backend && node ./node_modules/jest/bin/jest.js src/__tests__/performance.benchmark.test.ts --runInBand

# Database Migration Gate (Zero-to-Head)
cd backend && node ./node_modules/jest/bin/jest.js src/db/__tests__/migration.gate.test.ts --runInBand

# Frontend TypeScript Check & Production Build
cd frontend && npx tsc --noEmit && npm run build
```

---

## 9. Release Package Cleanup & Exclusions

When generating the final release candidate submission archive, the following patterns are strictly excluded:
- `.env`, `.env.*` (safe template `.env.example` preserved)
- `node_modules/`, `dist/`, `build/`
- `__pycache__/`, `*.pyc`, `.pytest_cache/`
- `coverage/`, `.nyc_output/`
- `.git/`, `.vscode/`, `.idea/`
- Local `.log` files and temporary test artifacts

