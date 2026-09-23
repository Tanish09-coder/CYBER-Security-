# CyberRiskOS — VCDB / VERIS Cyber Incidents Ingestion Module

**Owner**: TANISH (Cyber Intelligence & External Data Integration Lead)  
**Status**: PRODUCTION READY  
**Data Sources**: Official `vz-risk/VCDB` (`data/joined/vcdb.json.zip`) and `vz-risk/veris` (`verisc.json`)  
**License**: Public Domain (CC0 1.0 Universal)

---

## 1. Architectural Overview & Governance

The VCDB / VERIS module ingests public cyber incident intelligence directly from the official Verizon Risk team (`vz-risk/VCDB`) GitHub repository.

### Key Architectural Commitments
1. **Official Sources Only**: Fetches canonical `vcdb.json.zip` archive containing over 10,000 real historical breach and security incident records.
2. **Safe ZIP Processing**:
   - Parses ZIP archives securely using `adm-zip`.
   - Validates PK zip headers (`0x04034b50`).
   - Strict path traversal rejection (`..`, leading `/`, leading `\`).
   - Maximum decompressed size threshold safety check (200MB limit).
3. **Dynamic VERIS 4A Normalization**:
   - Normalizes incidents across VERIS 4A dimensions: **Actor**, **Action**, **Asset**, and **Attribute**.
   - Preserves raw provenance and unmapped fields in `raw_source_records.payload_json`.
   - Dynamically detects and records official VERIS schema version from incident `schema_version` or remote `verisc.json`.
4. **Tightened CVE Evidence Rule**:
   - Creates authoritative `vcdb_incident_cves` join rows **ONLY** when explicit structured CVE fields exist (`action.hacking.cve`, `action.malware.cve`, `action.error.cve`, `cve_id`, `cve`).
   - Free-text mentions of CVEs in summary notes are **NEVER** regex-scraped to fabricate an unverified join.
5. **Non-Destructive Reconciliation & Idempotency**:
   - SHA-256 payload hash tracking avoids redundant database operations when the zip bundle is unchanged (`SKIPPED_IDENTICAL`).
   - Historical incidents missing from future upstream releases are marked `is_current = FALSE` with `removed_from_source_at = NOW()`. No historical incident rows are ever hard-deleted.
6. **Zero Synthetic Data & No Financial Extrapolation**:
   - Contains 0 synthetic production records.
   - Preserves empirical victim loss data as historical context without applying heuristic financial risk formulas.

---

## 2. Database Schema Architecture

- `vcdb_releases`: Tracks revision metadata (commit SHA, VERIS schema version, bundle SHA-256 hash, incident counts, current release flag).
- `vcdb_incidents`: Primary normalized incident record (VCDB ID, incident year, confidence, summary, victim industry, country, employee count, data disclosure).
- `vcdb_incident_actors`: 4A Actor dimension (External, Internal, Partner, Unknown, motives, countries, subtypes).
- `vcdb_incident_actions`: 4A Action dimension (Hacking, Malware, Social, Misuse, Physical, Error, Environmental, vectors, varieties).
- `vcdb_incident_assets`: 4A Asset dimension (Server, Network, User Device, Media, Person, varieties, amounts).
- `vcdb_incident_attributes`: 4A Attribute dimension (Confidentiality, Integrity, Availability, data varieties, record counts).
- `vcdb_incident_timeline`: Compromise, discovery, containment, and exfiltration timelines.
- `vcdb_incident_cves`: Authoritative explicit structured CVE relationships (`action.hacking.cve`, etc.).

---

## 3. Express HTTP API Endpoints

- `POST /api/integrations/vcdb/sync`: Triggers manual synchronization run from official `vz-risk/VCDB`.
- `GET /api/integrations/vcdb/status`: Returns connector health, last sync time, current release SHA, staleness, and entity counts.
- `GET /api/integrations/vcdb/statistics`: Returns aggregate statistics across years, 4A categories, industries, and countries.
- `GET /api/integrations/vcdb/incidents`: Query normalized incidents with search, 4A filters, CVE filter, and pagination.
- `GET /api/integrations/vcdb/incidents/:vcdbId`: Retrieve single incident with full 4A dimensions, timeline, and explicit CVE evidence.

---

## 4. Verification & Testing

- Automated test suites in `backend/src/modules/vcdb/__tests__/` cover client parsing, ZIP safety, 4A mapper logic, tightened CVE rules, repository persistence, and service idempotency.
- Live verification script: `npx ts-node src/scripts/verify-live-vcdb.ts`.
