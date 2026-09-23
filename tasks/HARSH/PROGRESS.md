# HARSH — Live Progress Tracker

# Current Task
Phase H3: Software Inventory & Versioning — COMPLETED

# Status
COMPLETED

# Work Completed
- **Phase H1: Organization & Business Unit Model**
  - Multi-tenant organization & business unit schemas.
  - Migration `003_organizations.sql`.
  - REST APIs, Zod validation, repository, service, controller.
  - 24 passing tests.
- **Phase H2: Enterprise Asset Inventory**
  - Enterprise asset schema with network context, exposure attributes, and financial metrics.
  - Migration `004_assets.sql` with unique deduplication indexes.
  - Streaming CSV and JSON batch import pipelines.
  - 18 passing tests.
- **Phase H3: Software Inventory & Versioning**
  - Designed installed software schema (`id`, `asset_id`, `vendor`, `product`, `version`, `release`, `cpe23`, `install_path`, `last_observed_at`, `metadata`).
  - Created database migration `005_software.sql` with unique constraint on `(asset_id, vendor, product, version)` and cascade on asset delete.
  - Created domain types, mappers, and Zod validation with lowercase normalization for vendors and products (ready for CPE matching).
  - Implemented repository with transactional batch upsert semantics.
  - Implemented REST APIs:
    - `POST /api/assets/:assetId/software`: Single or batch software registration with upsert.
    - `GET /api/assets/:assetId/software`: Paginated & filtered package query (`?vendor=...`, `?product=...`, `?search=...`).
    - `GET /api/software/:id`: Package detail.
    - `PATCH /api/software/:id`: Update package release or metadata.
    - `DELETE /api/software/:id`: Delete package.
  - Mounted `/api/assets/:assetId/software` sub-router and `/api/software` in `backend/src/server.ts`.
  - Comprehensive test suite: 14 integration tests covering single/batch registration, upserting, filtering, search, and cascading deletion.

# Files Created
- `backend/src/db/migrations/003_organizations.sql`
- `backend/src/modules/organizations/organizations.types.ts`
- `backend/src/modules/organizations/organizations.validation.ts`
- `backend/src/modules/organizations/organizations.repository.ts`
- `backend/src/modules/organizations/organizations.service.ts`
- `backend/src/modules/organizations/organizations.controller.ts`
- `backend/src/modules/organizations/organizations.routes.ts`
- `backend/src/modules/organizations/__tests__/organizations.test.ts`
- `backend/src/db/migrations/004_assets.sql`
- `backend/src/modules/assets/assets.types.ts`
- `backend/src/modules/assets/assets.validation.ts`
- `backend/src/modules/assets/assets.csv-parser.ts`
- `backend/src/modules/assets/assets.repository.ts`
- `backend/src/modules/assets/assets.service.ts`
- `backend/src/modules/assets/assets.controller.ts`
- `backend/src/modules/assets/assets.routes.ts`
- `backend/src/modules/assets/__tests__/assets.test.ts`
- `backend/src/db/migrations/005_software.sql` [NEW]
- `backend/src/modules/software/software.types.ts` [NEW]
- `backend/src/modules/software/software.validation.ts` [NEW]
- `backend/src/modules/software/software.repository.ts` [NEW]
- `backend/src/modules/software/software.service.ts` [NEW]
- `backend/src/modules/software/software.controller.ts` [NEW]
- `backend/src/modules/software/software.routes.ts` [NEW]
- `backend/src/modules/software/__tests__/software.test.ts` [NEW]

# Files Modified
- `backend/src/server.ts` [MODIFIED — added import + route registration lines only]

# Tests
- 90 total tests run across 10 test suites, 90 passed, 0 failures.
- Zero regressions.

# Dependencies
- Dependent on Tanish's `vulnerability_cpes` table for Phase H4 (already delivered).

# Next Step
Phase H4: CPE Matching Engine — Integrate installed software with Tanish's `vulnerability_cpes` table, implement version-bound semantic evaluator, match confidence scoring, transparent reasoning, and `/api/cpe-matching/evaluate` endpoint.
