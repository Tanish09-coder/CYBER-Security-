# HARSH — Task Roadmap & Execution Backlog

## Task Summary

| Phase | Domain Area | Status | Deliverable |
| :--- | :--- | :--- | :--- |
| **Phase H1** | Organization Hierarchy | **NOT_STARTED** | Multi-tenant organization and business unit schemas and REST APIs |
| **Phase H2** | Enterprise Asset Inventory | **NOT_STARTED** | Asset data model, CSV & JSON import parsers, validation, unit mapping |
| **Phase H3** | Software Inventory | **NOT_STARTED** | Installed software model, version tracking, asset-software relationships |
| **Phase H4** | CPE Matching Engine | **NOT_STARTED** | CPE criteria evaluator with version-bound logic and confidence rating |
| **Phase H5** | Security Controls Posture | **NOT_STARTED** | Control catalog, asset-control mapping (MFA, EDR, Backups, PAM, Seg) |

---

## Detailed Phase Breakdown

### Phase H1 — Organization & Business Unit Model
- [ ] Design organization entity schema (`id`, `name`, `industry`, `employee_count`, `annual_revenue`, `currency`, `created_at`, `updated_at`).
- [ ] Design business unit schema (`id`, `organization_id`, `name`, `criticality_tier`, `budget`).
- [ ] Create database migration `003_organizations.sql` (or next sequential number) with header:
  ```sql
  -- Owner: HARSH
  -- Purpose: Organizations and business units hierarchy
  ```
- [ ] Implement REST endpoints:
  - `POST /api/organizations`: Create enterprise profile.
  - `GET /api/organizations/:id`: Retrieve profile.
  - `POST /api/business-units`: Create business unit.
  - `GET /api/business-units?organizationId=`: List units.
- [ ] Define import contract for organization onboarding.

---

### Phase H2 — Enterprise Asset Inventory
- [ ] Design asset schema (`id`, `organization_id`, `business_unit_id`, `name`, `hostname`, `ip_address`, `mac_address`, `asset_type`, `operating_system`, `business_criticality`, `internet_facing`, `data_classification`).
- [ ] Create database migration for assets and network interfaces.
- [ ] Implement CSV Asset Import Pipeline:
  - Streaming CSV parser with column mapping.
  - Header validation and strict row-level error reporting.
  - Deduping on hostname / MAC address / IP address.
- [ ] Implement JSON Asset Import Pipeline:
  - Batch JSON schema validation via Zod.
- [ ] Implement REST endpoints:
  - `GET /api/assets`: Paginated asset list with filtering (criticality, internet-facing, type).
  - `GET /api/assets/:id`: Detailed asset view with software and control posture.
  - `POST /api/assets/import/csv`: Upload CSV file.
  - `POST /api/assets/import/json`: Post JSON batch.

---

### Phase H3 — Software Inventory & Versioning
- [ ] Design installed software schema (`id`, `asset_id`, `vendor`, `product`, `version`, `release`, `install_path`, `last_observed_at`).
- [ ] Model asset ↔ software one-to-many relationship.
- [ ] Support software import via asset JSON payloads and dedicated software inventory lists.
- [ ] Implement REST endpoints:
  - `GET /api/assets/:assetId/software`: List all packages on an asset.
  - `POST /api/assets/:assetId/software`: Register or update installed packages.

---

### Phase H4 — CPE Matching Engine
- [ ] Integrate with Tanish's NVD CPE criteria (`vulnerability_cpes` table created in `001_nvd_ingestion.sql`).
- [ ] Implement CPE comparison logic:
  - Exact vendor and product matching (normalized lowercase).
  - Version-bound comparison evaluating `versionStartIncluding`, `versionStartExcluding`, `versionEndIncluding`, `versionEndExcluding` against semantic versions.
- [ ] Transparent match reasoning:
  - Generate confidence score and plain-English explanation (e.g., *"Matched Apache Log4j v2.14.1 because version is <= 2.15.0"*).
- [ ] **Strict Terminology Rule**:
  - The system must declare: **"Potential vulnerability match"**
  - The system must NEVER declare: **"Asset compromised"**
  - Vulnerability presence indicates exposure, NOT confirmed active intrusion.
- [ ] Implement REST endpoints:
  - `POST /api/cpe-matching/evaluate`: Trigger matching for an asset or across inventory.
  - `GET /api/assets/:assetId/vulnerabilities`: List correlated CVEs with match reasoning.

---

### Phase H5 — Security Controls Posture
- [ ] Define defensive control catalog:
  - `MFA`: Multi-Factor Authentication enforcement.
  - `EDR`: Endpoint Detection & Response active sensor status.
  - `BACKUP`: Immutable / offline backup coverage and testing frequency.
  - `SEGMENTATION`: Network micro-segmentation / isolation status.
  - `PAM`: Privileged Access Management enforcement.
  - `ENCRYPTION`: Data-at-rest and data-in-transit encryption status.
  - `MONITORING`: 24/7 SIEM / SOC telemetry coverage.
- [ ] Model asset-control assignment with implementation state (`IMPLEMENTED`, `PARTIAL`, `NOT_IMPLEMENTED`, `UNKNOWN`).
- [ ] Control values must originate **strictly from user configuration or automated scanner imports**—zero synthetic default claims.
- [ ] Implement REST endpoints:
  - `GET /api/controls`: Summary of controls and coverage.
  - `POST /api/assets/:assetId/controls`: Update control status on an asset.
