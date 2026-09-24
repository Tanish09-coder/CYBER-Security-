# Dependency Requests for TANISH (Cyber Intelligence Lead)

All requests directed to **Tanish** regarding NVD, CISA KEV, MITRE ATT&CK, VCDB, or raw provenance must be filed here.

---

### REQUEST ID: TANISH-001
- **REQUESTED BY**: Harsh
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-23
- **DESCRIPTION**: Need NVD vulnerability lookup endpoint to include CPE criteria array with version bounds (`versionStartIncluding`, `versionEndIncluding`, etc.) for internal enterprise software matching.
- **WHY REQUIRED**: Required by Phase H4 (CPE Matching Engine) to correlate installed enterprise software versions against known vulnerable configurations without re-fetching from NVD.
- **EXPECTED CONTRACT**:
  - `GET /api/vulnerabilities/:cveId`
  - Response property: `cpes: Array<{ criteria: string, vulnerable: boolean, versionStartIncluding?: string, versionStartExcluding?: string, versionEndIncluding?: string, versionEndExcluding?: string }>`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Phase H4 (CPE Matching)
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in Migration `001_nvd_ingestion.sql` via `vulnerability_cpes` child table and exposed on `GET /api/vulnerabilities/:cveId`.

---

### REQUEST ID: TANISH-002
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Tanish
- **DATE**: 2026-09-23
- **DESCRIPTION**: Need a unified health and sync status endpoint for the Integration Center dashboard page.
- **WHY REQUIRED**: Frontend Screen N2 (Integration Center) needs to display the status, last sync timestamp, total record count, and freshness status of NVD and CISA KEV feeds.
- **EXPECTED CONTRACT**:
  - `GET /api/integrations/status` (or individual status endpoints: `GET /api/integrations/nvd/status` and `GET /api/integrations/cisa-kev/status`)
  - Response: `{ enabled: boolean, sourceUrl: string, lastSyncAt: string | null, totalActiveKevCount?: number, dataAgeHours: number | null, isStale: boolean }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N2
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Both `GET /api/integrations/nvd/status` and `GET /api/integrations/cisa-kev/status` are live and operational. Unified status aggregator ready in `docs/API_CONTRACTS.md`.

---

### REQUEST ID: TANISH-003
- **REQUESTER**: Nishit
- **OWNER**: Tanish
- **PHASE**: Phase 2 — Risk Quantification (Screen N8)
- **REQUIRED FIELD/API**: `GET /api/risk/scores` and `GET /api/risk/assets/:assetId` with contributing factor breakdown array
- **WHY REQUIRED**: Screen N8 (Risk Overview) requires authentic risk scores, risk levels, and explainability factors for `(asset, vulnerability)` pairs.
- **EXPECTED CONTRACT**:
  - `GET /api/risk/scores?page=1&limit=25&severity=HIGH`
  - Response: `{ data: Array<{ assetId: string, assetName: string, cveId: string, baseCvss: number, riskScore: number, riskLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', factors: Array<{ name: string, weight: number, value: string|number, contribution: number }>, missingDataWarnings: string[], modelVersion: '1.0.0', provenanceHash: string }>, total: number, page: number, limit: number }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N8
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in Migration `010_risk_scores.sql`, `risk.routes.ts`, `risk.controller.ts`, and `risk.service.ts`. Endpoints `GET /api/risk/scores` and `GET /api/risk/assets/:assetId` live and operational. Documented in `docs/API_CONTRACTS.md` (Section 4).

---

### REQUEST ID: TANISH-004
- **REQUESTER**: Nishit
- **OWNER**: Tanish
- **PHASE**: Phase 3 — Financial Exposure / EAL (Screen N9)
- **REQUIRED FIELD/API**: `GET /api/financial/exposure` and `GET /api/financial/summary`
- **WHY REQUIRED**: Screen N9 (Financial Exposure) requires modeled financial exposure and EAL breakdown by loss components (downtime, recovery, breach impact).
- **EXPECTED CONTRACT**:
  - `GET /api/financial/exposure`
  - Response: `{ totalModeledExposure: number, estimatedAnnualizedLoss: number, currency: string, breakdown: { downtimeLoss: number, recoveryCost: number, businessInterruption: number }, dataCompletenessScore: number, isEstimated: true, modelVersion: '1.0.0' }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N9
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in Migration `015_financial_results.sql`, `financial.routes.ts`, `financial.controller.ts`, and `financial.service.ts`. Endpoints `GET /api/financial/exposure`, `GET /api/financial/summary`, and `GET /api/financial/assets/:id` live and operational. Documented in `docs/API_CONTRACTS.md` (Section 5).

