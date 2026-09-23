# TANISH — Task Roadmap & Execution Backlog

## Task Summary

| Milestone | Area | Status | Deliverable |
| :--- | :--- | :--- | :--- |
| **M1: NVD Ingestion** | External Threat Intel | **COMPLETED** | NVD API v2.0 client, CVSS preservation, CPE parser, live verification |
| **M2: CISA KEV Ingestion** | External Threat Intel | **COMPLETED** | Official KEV feed, non-destructive reconciliation, NVD join, dual provenance |
| **M3: MITRE ATT&CK Ingestion** | External Threat Intel | **COMPLETED** | STIX 2.1 parser, tactics, techniques, mitigations, attack-pattern graph |
| **M4: VCDB / VERIS Ingestion** | Historical Incident Intel | **NEXT** | Public incident parser, breach frequency distributions, loss telemetry |
| **M5: Unified Threat Intel API** | Cross-Source Lookup | **PLANNED** | Multi-source lookup API (`CVE -> NVD + KEV + ATT&CK + VCDB`) |

---

## Detailed Task Breakdown

### Phase 1: National Vulnerability Database (NVD) [COMPLETED]
- [x] Production NVD REST API v2.0 client with exponential backoff & configurable request pacing limiter.
- [x] Immutable raw payload storage in `raw_source_records` with deterministic SHA-256 provenance hashing.
- [x] Normalization engine preserving all CVSS assessments (NIST, CNA, ADP) without discarding vendor scores.
- [x] Extraction of CWE weakness categories and CPE version criteria.
- [x] Idempotency: exact payload hash deduplication on re-sync.
- [x] Unit/integration tests (24 automated tests passed).
- [x] Live end-to-end verification script with real `CVE-2021-44228`.

---

### Phase 2: CISA Known Exploited Vulnerabilities (KEV) [COMPLETED]
- [x] Production CISA KEV client fetching official live catalog feed.
- [x] Zod schema validation for catalog envelope and vulnerability entries.
- [x] Preservation of catalog-level metadata (`title`, `catalogVersion`, `dateReleased`, `officialCount`).
- [x] Migration `002_cisa_kev_ingestion.sql` defining `cisa_kev_entries` and `vulnerabilities` KEV columns.
- [x] Non-destructive historical reconciliation: `is_current = false` and `removed_from_catalog_at = NOW()` when entries drop out.
- [x] Bi-directional join between NVD vulnerabilities and CISA KEV entries without synthetic rows.
- [x] Catalog staleness detection against `CISA_KEV_STALE_AFTER_HOURS=24`.
- [x] 10 automated unit/integration tests for KEV (bringing total test suite to 34 tests, 100% passing).
- [x] Data-driven live verification (`verify-live-cisa-kev.ts`) ingesting 1,721 live KEV entries and real NVD join on `CVE-2026-93952`.

---

### Phase 3: MITRE ATT&CK Enterprise Matrix [COMPLETED]
- [x] Connect to official MITRE ATT&CK GitHub STIX 2.1 repository and dynamic release index (`index.json`).
- [x] Implement memory-efficient STIX object parser with Zod schema validation.
- [x] Normalize ATT&CK Tactics (matrix columns, external ID, name, short name).
- [x] Normalize ATT&CK Techniques & Sub-techniques (T-codes, name, kill chain phases, data sources, platforms).
- [x] Normalize ATT&CK Mitigations (M-codes, description, addressable techniques).
- [x] Normalize Threat Groups & Software (G-codes, S-codes, aliases, software classification).
- [x] Preserve STIX Relationship Graph (`technique -> mitigation`, `group -> technique`, `subtechnique-of`).
- [x] Resolve sub-technique parents authoritatively from official `subtechnique-of` STIX relationships.
- [x] Store complete raw STIX bundle in `raw_source_records` with cryptographic SHA-256 provenance.
- [x] Create Migration `003_mitre_attack_ingestion.sql` with owner header `-- Owner: TANISH`.
- [x] Build 27 automated unit/integration tests across 4 test suites (100% pass rate).
- [x] Implement and execute `verify-live-mitre-attack.ts` end-to-end data-driven verification script (v19.2, 26,086 objects, 100% idempotent).

---

### Phase 4: VCDB / VERIS Empirical Incident Ingestion [PLANNED]
- [ ] Connect to VERIS Community Database (VCDB) repository / official data feed.
- [ ] Parse VERIS schema elements: Action (Malware, Hacking, Social, Misuse), Actor, Asset, Attribute (Confidentiality, Integrity, Availability).
- [ ] Store raw incident records with cryptographic SHA-256 provenance.
- [ ] Normalize incident frequency distributions by industry sector (NAICS) and victim size.
- [ ] Create Migration `004_vcdb_incidents.sql` with owner header `-- Owner: TANISH`.
- [ ] Freshness monitoring for incident dataset updates.

---

### Phase 5: Cross-Source Cyber Intelligence Enrichment [PLANNED]
- [ ] Build unified multi-source intelligence resolver endpoint:
  `GET /api/threat-intelligence/lookup/:cveId`
- [ ] Aggregate:
  - NIST NVD: CVSS scores, vector strings, CWEs, CPE criteria.
  - CISA KEV: Known exploitation status, ransomware campaign use, remediation due date.
  - MITRE ATT&CK: Associated attack techniques, tactics, mitigations mapped via CAPEC/CWE.
  - VCDB: Real-world breach prevalence in similar industries.
- [ ] Maintain dual/triple cryptographic audit hashes across all sources.
- [ ] Document final contracts in `docs/API_CONTRACTS.md`.
