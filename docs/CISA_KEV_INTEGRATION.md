# CyberRiskOS — CISA KEV Ingestion Specification & Integration Guide

## 1. Overview & Purpose
The Cybersecurity and Infrastructure Security Agency (CISA) Known Exploited Vulnerabilities (KEV) Catalog is the authoritative register of vulnerabilities that have been actively exploited in the wild.

In CyberRiskOS, CISA KEV serves as an objective threat-intelligence signal to establish real-world threat presence for modeled assets.

> [!IMPORTANT]
> **Exploitation Semantics**:  
> **CISA KEV membership indicates that a vulnerability is known to have been exploited according to the official CISA KEV catalog. CyberRiskOS does not infer KEV membership from CVSS severity or other vulnerability characteristics.**  
> Technical metrics such as high CVSS scores, network attack vectors, or proof-of-concept availability do not grant KEV status. Active exploitation is determined solely by presence in the official catalog.

---

## 2. Official Source & Configuration

- **Provider**: Cybersecurity and Infrastructure Security Agency (CISA)
- **Official Machine-Readable Catalog URL**: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **Format**: JSON (Versioned Catalog Envelope)

### Environment Variables
Configured in `backend/.env`:

| Variable | Description | Default |
|---|---|---|
| `CISA_KEV_URL` | Official machine-readable catalog endpoint | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` |
| `CISA_KEV_TIMEOUT_MS` | HTTP client timeout | `15000` (15s) |
| `CISA_KEV_MAX_RETRIES` | Max exponential backoff retry attempts | `4` |
| `CISA_KEV_STALE_AFTER_HOURS`| Staleness threshold for integration health | `24` (24h) |

---

## 3. Data Model & Database Schema

### 3.1 `cisa_kev_entries` (Authoritative Table)
Stores normalized KEV-specific attributes:
- `cve_id`: Natural unique key (e.g. `CVE-2021-44228`).
- `vulnerability_id`: Foreign key referencing `vulnerabilities(id)` (nullable).
- `vendor_project`, `product`, `vulnerability_name`.
- `date_added`: Date CISA added the CVE to the KEV catalog.
- `short_description`, `required_action`, `due_date`.
- `known_ransomware_campaign_use`: Official ransomware flag (`Known`, `Unknown`).
- `notes`: Official remediation URLs and references.
- `is_current`: `TRUE` if present in current catalog, `FALSE` if removed.
- `first_seen_at`, `last_seen_at`, `removed_from_catalog_at`.
- `raw_record_id`: Provenance link to exact catalog payload.

### 3.2 Vulnerability Table Linking
When a KEV entry matches an existing record in `vulnerabilities`:
- `vulnerabilities.known_exploited` is set to `TRUE`.
- `kev_date_added`, `kev_due_date`, and `kev_known_ransomware_campaign_use` are synchronized for low-latency queries.
- If a KEV record refers to a CVE not yet ingested from NVD, it is preserved in `cisa_kev_entries` with `vulnerability_id = NULL`. CyberRiskOS **never** fabricates synthetic NVD records for missing CVEs.

---

## 4. Synchronization Strategy & Idempotency

### 4.1 Full Catalog Sync (`POST /api/integrations/cisa-kev/sync`)
1. **Catalog Acquisition**: Fetches the complete official catalog.
2. **Catalog Metadata Preservation**: Captures `title`, `catalogVersion`, `dateReleased`, and `count`.
3. **SHA-256 Checksum**: Calculates the cryptographic hash of the raw canonical JSON.
4. **Idempotency Gate**: If the exact payload hash already exists in `raw_source_records`, no database row modifications occur; the run audit completes with `recordsSkipped = count`.
5. **Atomic Upsert**: Updates existing entries with modified attributes, inserts new entries, and sets heartbeat timestamps (`last_seen_at`).
6. **Safe Reconciliation**: If any CVE was previously current but is no longer present in the official catalog:
   - Sets `is_current = FALSE` and `removed_from_catalog_at = NOW()`.
   - Clears `vulnerabilities.known_exploited = FALSE`.
   - **Never deletes historical records or audit provenance.**

---

## 5. Outage Resilience & Staleness Detection

- **Failure Isolation**: If CISA's web server is temporarily down (HTTP 5xx, 429, timeout), existing KEV data is **never wiped or unflagged**. The last valid state is strictly preserved.
- **Health & Staleness**: `GET /api/integrations/cisa-kev/status` evaluates the age of `last_sync_at` against `CISA_KEV_STALE_AFTER_HOURS` (default 24h). If exceeded, the integration flags `isStale = true` for operator visibility.

---

## 6. Endpoints Implemented

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/integrations/cisa-kev/sync` | Triggers official KEV full catalog synchronization. |
| `GET` | `/api/integrations/cisa-kev/status` | Returns sync status, active count, data age, and staleness flag. |
| `GET` | `/api/integrations/cisa-kev/cve/:cveId` | Returns KEV record, linked NVD vulnerability, and provenance. |
| `GET` | `/api/vulnerabilities/:cveId` | Returns normalized NVD vulnerability enriched with KEV status. |
