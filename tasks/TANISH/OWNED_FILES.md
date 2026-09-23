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

### MITRE ATT&CK & VCDB Modules (Upcoming)
```text
backend/src/modules/mitre-attack/ (all files)
backend/src/modules/vcdb/ (all files)
```

---

## 2. Integration Scripts

```text
backend/src/scripts/verify-live-nvd.ts
backend/src/scripts/verify-live-cisa-kev.ts
backend/src/scripts/verify-live-mitre.ts (upcoming)
backend/src/scripts/verify-live-vcdb.ts  (upcoming)
```

---

## 3. Database Migrations

```text
backend/src/db/migrations/001_nvd_ingestion.sql
backend/src/db/migrations/002_cisa_kev_ingestion.sql
backend/src/db/migrations/*_mitre_*.sql (upcoming)
backend/src/db/migrations/*_vcdb_*.sql  (upcoming)
```

---

## 4. Documentation

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
