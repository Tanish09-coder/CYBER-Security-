# TANISH — Owned Files & Directories

The following files, directories, migrations, and scripts are strictly owned and maintained by **TANISH**. Other team members must not modify these files directly.

---

## 1. Backend Integration Modules

### NVD Integration
```text
backend/src/modules/nvd/nvd.client.ts
backend/src/modules/nvd/nvd.mapper.ts
backend/src/modules/nvd/nvd.types.ts
backend/src/modules/nvd/nvd.validation.ts
backend/src/modules/nvd/nvd.service.ts
backend/src/modules/nvd/nvd.controller.ts
backend/src/modules/nvd/nvd.routes.ts
backend/src/modules/nvd/__tests__/nvd.client.test.ts
backend/src/modules/nvd/__tests__/nvd.mapper.test.ts
backend/src/modules/nvd/__tests__/nvd.service.test.ts
```

### CISA KEV Integration
```text
backend/src/modules/cisa-kev/cisa-kev.client.ts
backend/src/modules/cisa-kev/cisa-kev.mapper.ts
backend/src/modules/cisa-kev/cisa-kev.types.ts
backend/src/modules/cisa-kev/cisa-kev.validation.ts
backend/src/modules/cisa-kev/cisa-kev.repository.ts
backend/src/modules/cisa-kev/cisa-kev.service.ts
backend/src/modules/cisa-kev/cisa-kev.controller.ts
backend/src/modules/cisa-kev/cisa-kev.routes.ts
backend/src/modules/cisa-kev/__tests__/cisa-kev.client.test.ts
backend/src/modules/cisa-kev/__tests__/cisa-kev.mapper.test.ts
backend/src/modules/cisa-kev/__tests__/cisa-kev.service.test.ts
```

### General Ingestion Infrastructure
```text
backend/src/modules/ingestion/ingestion.types.ts
backend/src/modules/ingestion/ingestion.service.ts
backend/src/modules/ingestion/ingestion.repository.ts
backend/src/modules/ingestion/__tests__/ingestion.service.test.ts
```

### MITRE ATT&CK & VCDB Modules (Phase 1 Delivered)
```text
backend/src/modules/mitre-attack/ (all files)
backend/src/modules/vcdb/ (all files)
backend/src/modules/vulnerabilities/ (all files)
backend/src/modules/threat-intel/ (all files)
```

---

## 2. Integration Scripts (Phase 1 Delivered)

```text
backend/src/scripts/verify-live-nvd.ts
backend/src/scripts/verify-live-cisa-kev.ts
backend/src/scripts/verify-live-mitre-attack.ts
backend/src/scripts/verify-live-vcdb.ts
backend/src/scripts/verify-vulnerability-api.ts
```

---

## 3. Database Migrations (Phase 1 Delivered)

```text
backend/src/db/migrations/001_nvd_ingestion.sql
backend/src/db/migrations/002_cisa_kev_ingestion.sql
backend/src/db/migrations/003_mitre_attack_ingestion.sql
backend/src/db/migrations/004_vcdb_incidents.sql
```

---

## 4. Documentation (Phase 1 Delivered)

```text
docs/NVD_INTEGRATION.md
docs/CISA_KEV_INTEGRATION.md
docs/MITRE_ATTACK_INTEGRATION.md
docs/VCDB_INTEGRATION.md
docs/DATA_PROVENANCE.md
```

---

## 5. Task & Progress Records

```text
tasks/TANISH/README.md
tasks/TANISH/TASKS.md
tasks/TANISH/OWNED_FILES.md
tasks/TANISH/PROGRESS.md
tasks/dependencies/TANISH_REQUESTS.md
```

---

## 6. Phase 2 → Final Delivery Owned Directories & Files (Phases 2–9)

The following files, services, engines, and migrations are strictly owned and maintained by **TANISH** for Phases 2 through 9:

### 6.1 Risk Engine & Microservice (`risk-engine/`)
```text
risk-engine/Dockerfile
risk-engine/requirements.txt
risk-engine/app/main.py
risk-engine/app/schemas/risk_input.py
risk-engine/app/schemas/financial_input.py
risk-engine/app/schemas/scenario_override.py
risk-engine/app/schemas/optimization_request.py
risk-engine/app/models/risk_entity.py
risk-engine/app/models/financial_entity.py
risk-engine/app/calculators/risk_model_v1.py
risk-engine/app/calculators/financial_exposure.py
risk-engine/app/calculators/rosi.py
risk-engine/app/scenarios/scenario_engine.py
risk-engine/app/optimizers/budget_optimizer.py
risk-engine/app/attack_graph/graph_traversal.py
risk-engine/app/attack_graph/choke_points.py
risk-engine/app/ai/grounding.py
risk-engine/tests/ (all test files)
```

### 6.2 Backend Risk & Decision Modules (`backend/src/modules/`)
```text
backend/src/modules/risk/
  risk.types.ts
  risk.validation.ts
  risk.client.ts
  risk.repository.ts
  risk.service.ts
  risk.controller.ts
  risk.routes.ts
  __tests__/risk.integration.test.ts

backend/src/modules/financial/
  financial.types.ts
  financial.validation.ts
  financial.service.ts
  financial.controller.ts
  financial.routes.ts
  __tests__/financial.integration.test.ts

backend/src/modules/scenarios/
  scenarios.types.ts
  scenarios.validation.ts
  scenarios.service.ts
  scenarios.controller.ts
  scenarios.routes.ts
  __tests__/scenarios.integration.test.ts

backend/src/modules/optimization/
  optimization.types.ts
  optimization.validation.ts
  optimization.service.ts
  optimization.controller.ts
  optimization.routes.ts
  __tests__/optimization.integration.test.ts

backend/src/modules/executive/
  executive.types.ts
  executive.repository.ts
  executive.service.ts
  executive.controller.ts
  executive.routes.ts
  __tests__/executive.integration.test.ts

backend/src/modules/attack-paths/
  attack-paths.types.ts
  attack-paths.service.ts
  attack-paths.controller.ts
  attack-paths.routes.ts
  __tests__/attack-paths.integration.test.ts

backend/src/modules/assistant/
  assistant.types.ts
  assistant.prompt-builder.ts
  assistant.service.ts
  assistant.controller.ts
  assistant.routes.ts
  __tests__/assistant.service.test.ts
```

### 6.3 Authoritative Specifications & Contracts (`docs/`)
```text
docs/RISK_ENGINE_CONTRACT.md
docs/FINANCIAL_MODEL.md
docs/OPTIMIZATION.md
docs/ATTACK_PATH_MODEL.md
```

### 6.4 Database Migrations (Sequentially 010+)
```text
backend/src/db/migrations/010+_risk_*.sql
backend/src/db/migrations/010+_financial_*.sql
backend/src/db/migrations/010+_optimization_*.sql
backend/src/db/migrations/010+_attack_paths_*.sql
```

### 6.5 Absolute Prohibitions for Tanish
- Under **NO** circumstances may Tanish modify files in `frontend/` (Nishit).
- Under **NO** circumstances may Tanish modify enterprise asset, business unit, control state, or monetary input CRUD in `backend/src/modules/organizations/`, `business-units/`, `assets/`, `software/`, `financial-inputs/`, `remediation-actions/`, or `compliance/` (Harsh).

