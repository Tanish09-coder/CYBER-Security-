# HARSH — Owned Files & Directories

The following files, directories, migrations, and scripts are strictly owned and maintained by **HARSH**. Other team members must not modify these files directly.

---

## 1. Backend Enterprise Context Modules

### Organizations & Business Units
```text
backend/src/modules/organizations/ (all files)
backend/src/modules/business-units/ (all files)
```

### Assets & Software Inventory
```text
backend/src/modules/assets/ (all files)
backend/src/modules/software/ (all files)
```

### CPE Matching & Exposure Correlation
```text
backend/src/modules/cpe-matching/ (all files)
backend/src/modules/asset-vulnerabilities/ (all files)
```

### Security Controls Inventory
```text
backend/src/modules/controls/ (all files)
backend/src/modules/asset-controls/ (all files)
```

*(Note: Harsh has full authority to create these module directories as implementation proceeds.)*

---

## 2. Verification Scripts

```text
backend/src/scripts/verify-organization-model.ts (upcoming)
backend/src/scripts/verify-asset-import.ts        (upcoming)
backend/src/scripts/verify-cpe-matching.ts        (upcoming)
backend/src/scripts/verify-controls-posture.ts    (upcoming)
```

---

## 3. Database Migrations (Phase 1 Delivered)

```text
backend/src/db/migrations/005_organizations.sql
backend/src/db/migrations/006_assets.sql
backend/src/db/migrations/007_software.sql
backend/src/db/migrations/008_cpe_matching.sql
backend/src/db/migrations/009_security_controls.sql
```

---

## 4. Documentation (Phase 1 Delivered)

```text
docs/ASSET_MODEL.md
docs/SOFTWARE_INVENTORY.md
docs/CPE_MATCHING.md
docs/CONTROLS_POSTURE.md
```

---

## 5. Task & Progress Records

```text
tasks/HARSH/README.md
tasks/HARSH/TASKS.md
tasks/HARSH/OWNED_FILES.md
tasks/HARSH/PROGRESS.md
tasks/dependencies/HARSH_REQUESTS.md
```

---

## 6. Phase 2 → Final Delivery Owned Directories & Files (Phases 2–9)

The following files, modules, specifications, and migrations are strictly owned and maintained by **HARSH** for Phases 2 through 9:

### 6.1 Backend Enterprise Context Modules (`backend/src/modules/`)
```text
backend/src/modules/financial-inputs/
  financial-inputs.types.ts
  financial-inputs.validation.ts
  financial-inputs.repository.ts
  financial-inputs.service.ts
  financial-inputs.controller.ts
  financial-inputs.routes.ts
  __tests__/financial-inputs.integration.test.ts

backend/src/modules/remediation-actions/
  remediation-actions.types.ts
  remediation-actions.validation.ts
  remediation-actions.repository.ts
  remediation-actions.service.ts
  remediation-actions.controller.ts
  remediation-actions.routes.ts
  __tests__/remediation-actions.test.ts

backend/src/modules/compliance/
  compliance.types.ts
  compliance.validation.ts
  compliance.repository.ts
  compliance.service.ts
  compliance.controller.ts
  compliance.routes.ts
  __tests__/compliance.integration.test.ts

backend/src/modules/asset-dependencies/
  asset-dependencies.types.ts
  asset-dependencies.validation.ts
  asset-dependencies.repository.ts
  asset-dependencies.service.ts
  asset-dependencies.controller.ts
  asset-dependencies.routes.ts
  __tests__/asset-dependencies.test.ts

backend/src/modules/assistant/context-sanitizer.ts
```

### 6.2 Authoritative Specifications & Contracts (`docs/`)
```text
docs/RISK_ENTERPRISE_INPUTS.md
docs/COMPLIANCE_MAPPINGS.md
docs/REMEDIATION_CATALOG.md
docs/ENTERPRISE_AI_BOUNDARIES.md
```

### 6.3 Database Migrations (Sequentially 010+)
```text
backend/src/db/migrations/010+_financial_inputs_*.sql
backend/src/db/migrations/010+_remediation_actions_*.sql
backend/src/db/migrations/010+_compliance_*.sql
backend/src/db/migrations/010+_asset_dependencies_*.sql
```

### 6.4 Absolute Prohibitions for Harsh
- Under **NO** circumstances may Harsh modify files in `frontend/` (Nishit).
- Under **NO** circumstances may Harsh modify quantitative risk formulas, EAL calculations, What-If simulation engines, or optimization algorithms in `risk-engine/` or `backend/src/modules/risk/`, `financial/`, `scenarios/`, `optimization/`, `attack-paths/` (Tanish).
- Harsh provides monetary inputs (e.g. `downtimeCostPerHour`), but does **NOT** compute financial risk exposure.

