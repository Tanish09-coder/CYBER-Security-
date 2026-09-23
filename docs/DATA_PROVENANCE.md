# CyberRiskOS — Data Provenance & Traceability Architecture

## 1. Architectural Principle: Immutable Provenance

In enterprise cyber risk quantification and compliance, auditability is a hard requirement. Every risk calculation, financial metric, and vulnerability assessment presented to executives, auditors, or CISOs must be verifiable against its authoritative source.

The CyberRiskOS ingestion pipeline enforces an unbroken chain of custody:

```text
┌───────────────────────┐
│  EXTERNAL SOURCE      │  NIST NVD API v2.0
│  (Authoritative Feed) │  https://services.nvd.nist.gov/rest/json/cves/2.0
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  RAW SOURCE RECORD    │  Immutable JSONB payload stored in raw_source_records
│  (Cryptographic Hash) │  Unique Key: (source_id, external_id, payload_hash)
└───────────┬───────────┘  SHA-256 digest guaranteed
            │
            ▼
┌───────────────────────┐
│  NORMALIZED RECORD    │  Relational model in vulnerabilities table
│  (Clean Domain Model) │  Links directly to raw_record_id & source_record_id
└───────────┬───────────┘  Preserves all CVSS metrics, CWEs, CPEs, and refs
            │
            ▼
┌───────────────────────┐
│  CYBER RISK ENGINE    │  Consumes validated vulnerability records
│  (Quantification)     │  Answers: "Why is this asset at risk?" with full proof
└───────────────────────┘
```

---

## 2. Provenance Pipeline Stages

### Stage 1: Data Ingestion Run Audit (`data_ingestion_runs`)
Every synchronization cycle initiates an immutable audit entry tracking:
- `source_id`: Link to registered data source
- `sync_type`: `MANUAL`, `INCREMENTAL`, `DATE_RANGE`, or `CVE_LOOKUP`
- `status`: `RUNNING` $\to$ `COMPLETED` | `PARTIAL` | `FAILED`
- `records_received`, `records_inserted`, `records_updated`, `records_skipped`
- `request_parameters`: Full query parameters recorded for reproducibility

### Stage 2: Raw Payload Preservation (`raw_source_records`)
Before normalization, the exact JSON payload returned by NIST is captured:
- **Canonical Serialization**: JSON keys are canonically sorted.
- **SHA-256 Checksum**: A deterministic 64-character hexadecimal hash is generated.
- **Deduplication Constraint**: `UNIQUE (source_id, external_id, payload_hash)` ensures:
  1. Identical payloads from re-queries are never duplicated.
  2. If NIST modifies a CVE, the new payload version is appended as a distinct raw audit record.
  3. Historical revisions of a vulnerability remain permanently queryable.

### Stage 3: Normalized Vulnerability (`vulnerabilities`)
The normalized domain record stores:
- `source`: `'NVD'`
- `source_record_id`: e.g. `'CVE-2021-44228'`
- `source_identifier`: e.g. `'cve@mitre.org'`
- `vuln_status`: e.g. `'Analyzed'`
- `raw_record_id`: Foreign key pointing directly to the exact `raw_source_records` row.

---

## 3. Querying Provenance via API

When querying any normalized vulnerability via `GET /api/vulnerabilities/:cveId`, the response includes structured provenance:

```json
{
  "cveId": "CVE-2021-44228",
  "description": "Apache Log4j2 2.0-beta9 through 2.15.0 JNDI features...",
  "sourceIdentifier": "cve@mitre.org",
  "vulnStatus": "Analyzed",
  "cvssVersion": "3.1",
  "cvssBaseScore": 10.0,
  "cvssBaseSeverity": "CRITICAL",
  "source": "NVD",
  "sourceRecordId": "CVE-2021-44228",
  "provenance": {
    "sourceName": "National Vulnerability Database",
    "sourceProvider": "NIST",
    "rawPayloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ingestedAt": "2026-09-23T15:20:00.000Z"
  }
}
```

This guarantees mathematical reproducibility and regulatory compliance under ISO 27001 and RBI/SEBI cybersecurity audit standards.
