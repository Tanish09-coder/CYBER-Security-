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

## 3. Database Migrations

Only migrations directly related to enterprise context:
```text
backend/src/db/migrations/*_organizations_*.sql (upcoming)
backend/src/db/migrations/*_assets_*.sql        (upcoming)
backend/src/db/migrations/*_software_*.sql      (upcoming)
backend/src/db/migrations/*_cpe_matching_*.sql  (upcoming)
backend/src/db/migrations/*_controls_*.sql      (upcoming)
```

---

## 4. Documentation

```text
docs/ASSET_MODEL.md
docs/SOFTWARE_INVENTORY.md
docs/CPE_MATCHING.md
docs/CONTROL_MODEL.md
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
