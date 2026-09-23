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
