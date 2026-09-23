# CyberRiskOS — Master API Contracts Directory

## Overview
This document serves as the binding contract between the Backend domain leads (**Tanish**, **Harsh**) and the Frontend Lead (**Nishit**). 

The frontend must never infer, couple to, or make assumptions about internal database schemas. All frontend interaction must flow strictly through the documented contracts below.

---

## Contract Format Specification
Every endpoint entry must declare:
- **Method**: HTTP Verb (`GET`, `POST`, `PUT`, `DELETE`).
- **Path**: Full URI path with route parameters.
- **Owner**: Backend Domain Lead responsible for maintenance.
- **Consumer**: Primary consumer (e.g., Nishit / Frontend).
- **Purpose**: Business and technical objective.
- **Request**: Query parameters, URL parameters, and JSON payload specification.
- **Response**: Exact JSON payload shape on HTTP 200/201.
- **Errors**: Domain and HTTP status codes (`400`, `404`, `429`, `500`, `503`).
- **Status**: Contract status (`LIVE`, `PLANNED`, `DEPRECATED`).

---

## 1. Cyber Intelligence & External Feeds (Owner: TANISH)

### 1.1 Single Vulnerability Lookup
- **Method**: `GET`
- **Path**: `/api/vulnerabilities/:cveId`
- **Owner**: Tanish
- **Consumer**: Nishit (Screens N3, N4), Harsh (CPE Correlation)
- **Purpose**: Retrieve authoritative normalized CVE data with multi-source CVSS, weaknesses, CPEs, CISA KEV exploitation details, and dual cryptographic SHA-256 provenance.
- **Request**:
  - URL Parameter: `cveId` (string, e.g. `CVE-2021-44228` or `CVE-2026-93952`, case-insensitive).
- **Response (HTTP 200)**:
  ```json
  {
    "id": "uuid",
    "cveId": "CVE-2026-93952",
    "description": "Vulnerability description text...",
    "sourceIdentifier": "psirt@arista.com",
    "vulnStatus": "Modified",
    "cvssVersion": "4.0",
    "cvssBaseScore": 9.5,
    "cvssBaseSeverity": "CRITICAL",
    "attackVector": "NETWORK",
    "attackComplexity": "LOW",
    "privilegesRequired": "NONE",
    "userInteraction": "NONE",
    "scope": "UNCHANGED",
    "confidentialityImpact": "HIGH",
    "integrityImpact": "HIGH",
    "availabilityImpact": "HIGH",
    "publishedAt": "2026-09-22T00:00:00.000Z",
    "modifiedAt": "2026-09-23T00:00:00.000Z",
    "knownExploited": true,
    "kevDateAdded": "2026-09-22",
    "kevDueDate": "2026-09-25",
    "kevKnownRansomwareCampaignUse": "Unknown",
    "kevDetails": {
      "vendorProject": "Arista",
      "product": "VeloCloud Orchestrator",
      "vulnerabilityName": "Arista VeloCloud Orchestrator Improper Input Validation Vulnerability",
      "requiredAction": "Apply mitigations in accordance with vendor instructions...",
      "isCurrent": true
    },
    "provenance": {
      "sourceName": "National Vulnerability Database",
      "sourceProvider": "NIST",
      "rawPayloadHash": "52edff8622862587e524dbcc9713d7511b426a2f47c3be2045ae296f3163e4a8",
      "ingestedAt": "2026-09-23T16:20:36.000Z"
    },
    "kevProvenance": {
      "sourceName": "CISA Known Exploited Vulnerabilities Catalog",
      "sourceProvider": "CISA",
      "rawPayloadHash": "629dcbcd40e4b796e254ee16fe0f8224f784bdf7d3c6d2e1e547ee40a11b7ac7",
      "ingestedAt": "2026-09-23T16:20:21.000Z"
    },
    "cvssAssessments": [
      {
        "source": "psirt@arista.com",
        "type": "Secondary",
        "version": "4.0",
        "baseScore": 9.5,
        "baseSeverity": "CRITICAL",
        "vectorString": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N"
      }
    ],
    "weaknesses": [
      { "cweId": "CWE-20", "description": "Improper Input Validation" }
    ],
    "cpes": [
      {
        "criteria": "cpe:2.3:a:arista:velocloud_orchestrator:*:*:*:*:*:*:*:*",
        "vulnerable": true,
        "versionEndExcluding": "5.4.0"
      }
    ],
    "references": [
      { "url": "https://arista.my.site.com/...", "source": "psirt@arista.com", "tags": ["Vendor Advisory"] }
    ]
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid CVE ID format.
  - `404 Not Found`: CVE not found in normalized database.
- **Status**: **LIVE**

---

### 1.2 Vulnerability List & Explorer Query
- **Method**: `GET`
- **Path**: `/api/vulnerabilities` (also accessible at `/api/v1/vulnerabilities`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N3: Vulnerability Explorer, Screen N4: Prioritization)
- **Purpose**: Paginated, filtered, and searchable listing of authoritative normalized CVE vulnerability records populated from official NVD and CISA KEV ingestion.
- **Request Parameters**:
  - `page` (optional integer >= 1, default `1`)
  - `limit` (optional integer >= 1, max `100`, default `25`)
  - `search` (optional string, max 200 chars): Case-insensitive partial matching against `cveId`, `description`, and `source.identifier`.
  - `severity` (optional enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`): Filter using preferred CVSS base severity. *Note: CVSS represents vulnerability severity only, not enterprise risk.*
  - `kevOnly` (optional boolean, accepts `'true'`, `'false'`, `'1'`, `'0'`):
    - `kevOnly=true`: Restricts results strictly to vulnerabilities with current, authoritative CISA KEV membership (`is_current = TRUE`). Does not infer exploitation from CVSS.
    - `kevOnly=false`: No KEV-only restriction.
  - `ransomwareOnly` (optional boolean, accepts `'true'`, `'false'`, `'1'`, `'0'`):
    - `ransomwareOnly=true`: Restricts results strictly to vulnerabilities where official CISA KEV data explicitly indicates known ransomware campaign use (`known_ransomware_campaign_use = 'Known'`). A CVE with no KEV record is never treated as ransomware-related.
    - `ransomwareOnly=false`: No ransomware-only restriction.
- **Sorting**: Deterministic ordering by `lastModifiedAt DESC NULLS LAST, cveId ASC`.
- **Response (HTTP 200)**:
  ```json
  {
    "data": [
      {
        "cveId": "CVE-2021-44228",
        "description": "Apache Log4j2 JNDI Remote Code Execution Vulnerability",
        "publishedAt": "2021-12-10T10:00:00.000Z",
        "lastModifiedAt": "2021-12-14T10:00:00.000Z",
        "cvss": {
          "baseScore": 10.0,
          "severity": "CRITICAL",
          "version": "3.1",
          "attackVector": "NETWORK"
        },
        "knownExploited": true,
        "ransomwareCampaignUse": "Known",
        "source": {
          "identifier": "cve@mitre.org",
          "provider": "NIST"
        },
        "kev": {
          "dateAdded": "2021-12-10",
          "dueDate": "2021-12-24",
          "requiredAction": "Apply updates per vendor instructions."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
  ```
- **Null & Missing Data Semantics**:
  - `cvss`: `null` if CVSS score is not assigned by NVD.
  - `knownExploited`: `false` if not in active CISA KEV catalog.
  - `ransomwareCampaignUse`: `null` if not in active KEV or ransomware status is not explicitly known.
  - `kev`: `null` if no active CISA KEV record exists.
  - Missing data is never fabricated or synthesized. If the database has 0 matches, returns `"data": []` with valid pagination metadata.
- **Errors**:
  - `400 Bad Request`: Returned when any query parameter fails validation (e.g. `limit > 100`, `page < 1`, invalid severity enum, non-boolean string). Format:
    ```json
    {
      "error": "Validation Error",
      "details": ["limit cannot exceed 100"]
    }
    ```
  - `500 Internal Server Error`: Internal query error without leaking database connection details:
    ```json
    {
      "error": "QueryError",
      "message": "Failed to retrieve vulnerabilities"
    }
    ```
- **Status**: **LIVE**

---

### 1.3 NVD Integration Status
- **Method**: `GET`
- **Path**: `/api/integrations/nvd/status`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center)
- **Purpose**: Return operational status, last sync timestamp, and staleness of the NIST NVD connector.
- **Response (HTTP 200)**:
  ```json
  {
    "enabled": true,
    "sourceUrl": "https://services.nvd.nist.gov/rest/json/cves/2.0",
    "lastSyncAt": "2026-09-23T16:20:36.000Z",
    "lastSuccessfulRun": { "status": "COMPLETED", "recordsInserted": 1 },
    "latestRun": { "status": "COMPLETED" },
    "dataAgeHours": 0.1,
    "isStale": false,
    "staleThresholdHours": 24
  }
  ```
- **Status**: **LIVE**

---

### 1.3 CISA KEV Integration Status
- **Method**: `GET`
- **Path**: `/api/integrations/cisa-kev/status`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center)
- **Purpose**: Return health, catalog count, and freshness of the CISA KEV catalog feed.
- **Response (HTTP 200)**:
  ```json
  {
    "enabled": true,
    "sourceUrl": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    "lastSyncAt": "2026-09-23T16:20:20.000Z",
    "totalActiveKevCount": 1721,
    "dataAgeHours": 0.1,
    "isStale": false,
    "staleThresholdHours": 24
  }
  ```
- **Status**: **LIVE**

---

### 1.4 Trigger Full CISA KEV Catalog Sync
- **Method**: `POST`
- **Path**: `/api/integrations/cisa-kev/sync`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2 Manual Sync Button)
- **Purpose**: Download and reconcile the entire official CISA KEV catalog with automatic SHA-256 deduplication.
- **Response (HTTP 200)**:
  ```json
  {
    "runId": "uuid",
    "status": "COMPLETED",
    "recordsReceived": 1721,
    "recordsInserted": 0,
    "recordsUpdated": 0,
    "recordsSkipped": 1721,
    "durationMs": 4200,
    "catalogTitle": "CISA Catalog of Known Exploited Vulnerabilities",
    "catalogVersion": "2026.09.23",
    "dateReleased": "2026-09-23T12:51:35.821Z",
    "officialCount": 1721
  }
  ```
- **Status**: **LIVE**

---

### 1.5 CISA KEV Single CVE Lookup
- **Method**: `GET`
- **Path**: `/api/integrations/cisa-kev/:cveId`
- **Owner**: Tanish
- **Consumer**: Nishit, Harsh
- **Purpose**: Lookup raw KEV catalog attributes for a CVE, including linked NVD vulnerability UUID.
- **Response (HTTP 200)**:
  ```json
  {
    "id": "uuid",
    "cveId": "CVE-2026-93952",
    "vulnerabilityId": "uuid",
    "vendorProject": "Arista",
    "product": "VeloCloud Orchestrator",
    "vulnerabilityName": "Arista VeloCloud Orchestrator Improper Input Validation Vulnerability",
    "dateAdded": "2026-09-22",
    "dueDate": "2026-09-25",
    "requiredAction": "Apply mitigations in accordance with vendor instructions...",
    "knownRansomwareCampaignUse": "Unknown",
    "isCurrent": true,
    "firstSeenAt": "2026-09-23T16:20:22.000Z",
    "lastSeenAt": "2026-09-23T16:20:22.000Z",
    "linkedNvdVulnerability": {
      "id": "uuid",
      "cvssBaseScore": 9.5,
      "cvssBaseSeverity": "CRITICAL",
      "cvssVersion": "4.0"
    }
  }
  ```
- **Status**: **LIVE**

---

### 1.6 MITRE ATT&CK Enterprise Status & Health
- **Method**: `GET`
- **Path**: `/api/integrations/mitre-attack/status`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center)
- **Purpose**: Return live health, current release version, bundle hash, counts across tactics/techniques/subtechniques/groups/software/relationships, and staleness status.
- **Response (HTTP 200)**:
  ```json
  {
    "enabled": true,
    "domain": "enterprise-attack",
    "currentVersion": "19.2",
    "releaseDate": "2026-08-05T21:33:58.496Z",
    "bundleHash": "sha256-hash-string",
    "dataAgeHours": 1.2,
    "isStale": false,
    "staleThresholdHours": 168,
    "counts": {
      "tactics": 14,
      "techniques": 216,
      "subtechniques": 444,
      "mitigations": 44,
      "groups": 158,
      "software": 696,
      "relationships": 18500,
      "retired": 320,
      "deprecated": 180
    }
  }
  ```
- **Status**: **LIVE**

---

### 1.7 Trigger MITRE ATT&CK Full Enterprise Sync
- **Method**: `POST`
- **Path**: `/api/integrations/mitre-attack/sync`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center Sync Trigger)
- **Purpose**: Dynamically discover latest official Enterprise ATT&CK release, fetch STIX 2.1 bundle, compute SHA-256 hash, upsert entities, and update release state with idempotency.
- **Response (HTTP 200)**:
  ```json
  {
    "runId": "uuid",
    "status": "COMPLETED",
    "version": "19.2",
    "releaseDate": "2026-08-05T21:33:58.496Z",
    "bundleHash": "sha256...",
    "recordsReceived": 21450,
    "recordsInserted": 0,
    "recordsUpdated": 0,
    "recordsSkipped": 21450,
    "durationMs": 5200,
    "counts": {
      "tactics": 14,
      "techniques": 216,
      "subtechniques": 444,
      "mitigations": 44,
      "groups": 158,
      "software": 696,
      "relationships": 18500
    }
  }
  ```
- **Status**: **LIVE**

---

### 1.8 Query ATT&CK Techniques & Graph Explorer
- **Method**: `GET`
- **Path**: `/api/integrations/mitre-attack/techniques`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N4: Threat & Technique Matrix Explorer)
- **Purpose**: Filter techniques by tactic (e.g. `initial-access` or `TA0001`), platform, subtechnique status, or search string.
- **Request**:
  - Query Parameters: `tactic` (string), `platform` (string), `isSubtechnique` (boolean), `search` (string), `includeRetired` (boolean), `page` (number), `limit` (number).
- **Response (HTTP 200)**:
  ```json
  {
    "techniques": [
      {
        "id": "uuid",
        "stixId": "attack-pattern--970a4a58-6933-4f9e-876e-aa5e4939b70b",
        "attackId": "T1059.001",
        "name": "PowerShell",
        "description": "Adversaries may abuse PowerShell commands...",
        "isSubtechnique": true,
        "parentAttackId": "T1059",
        "platforms": ["Windows"],
        "killChainPhases": [{ "kill_chain_name": "mitre-attack", "phase_name": "execution" }]
      }
    ],
    "total": 660
  }
  ```
- **Status**: **LIVE**

---

### 1.9 Single Technique Deep Graph Lookup
- **Method**: `GET`
- **Path**: `/api/integrations/mitre-attack/techniques/:attackId`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N4: Technique Detail Modal)
- **Purpose**: Retrieve full technique details with parent, sub-techniques, mapped tactics, mitigations, threat groups using it, software using it, and relationship edges.
- **Request**:
  - URL Parameter: `attackId` (e.g. `T1059` or `T1059.001`).
- **Response (HTTP 200)**:
  ```json
  {
    "technique": {
      "attackId": "T1059.001",
      "name": "PowerShell",
      "isSubtechnique": true
    },
    "parentTechnique": { "attackId": "T1059", "name": "Command and Scripting Interpreter" },
    "subtechniques": [],
    "tactics": [{ "attackId": "TA0002", "name": "Execution", "shortName": "execution" }],
    "mitigations": [{ "attackId": "M1049", "name": "Antivirus/Antimalware" }],
    "groups": [{ "attackId": "G0016", "name": "APT29" }],
    "software": [{ "attackId": "S0029", "name": "PsExec" }],
    "relationships": []
  }
  ```
- **Status**: **LIVE**

---

### 1.10 VCDB / VERIS Integration Status & Health
- **Method**: `GET`
- **Path**: `/api/integrations/vcdb/status`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center)
- **Purpose**: Return live connector health, repository URL, current commit SHA, VERIS schema version, staleness, and VERIS 4A entity counts.
- **Response (HTTP 200)**:
  ```json
  {
    "enabled": true,
    "provider": "vz-risk / VERIS Community",
    "repositoryUrl": "https://raw.githubusercontent.com/vz-risk/VCDB/master/data/joined/vcdb.json.zip",
    "currentCommitSha": "230cf22b56a481dd1a994b21e4d94c59e2bccea9",
    "currentVerisVersion": "1.3.6",
    "lastSuccessfulSync": "2026-09-23T19:34:00.000Z",
    "dataAgeHours": 0.1,
    "isStale": false,
    "staleThresholdHours": 168,
    "counts": {
      "incidents": 10047,
      "activeIncidents": 10047,
      "actors": 11200,
      "actions": 12400,
      "assets": 15000,
      "attributes": 13800,
      "explicitCveLinks": 485
    }
  }
  ```
- **Status**: **LIVE**

---

### 1.11 Trigger VCDB / VERIS Full Incident Sync
- **Method**: `POST`
- **Path**: `/api/integrations/vcdb/sync`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N2: Integration Center Sync Trigger)
- **Purpose**: Download canonical joined ZIP archive, parse with security checks, compute SHA-256 payload hash, normalize 4A dimensions, and upsert with idempotency.
- **Response (HTTP 200)**:
  ```json
  {
    "status": "COMPLETED",
    "runId": "uuid",
    "repositoryUrl": "https://raw.githubusercontent.com/vz-risk/VCDB/master/data/joined/vcdb.json.zip",
    "commitSha": "230cf22b56a481dd1a994b21e4d94c59e2bccea9",
    "verisVersion": "1.3.6",
    "bundleHash": "5599777efa65a197ddfeb52c7a64fbe7d38c290b0416e2cdaba3ef031127ccdb",
    "totalDiscovered": 10047,
    "recordsInserted": 10047,
    "recordsUpdated": 0,
    "recordsSkipped": 0,
    "recordsRemovedFromSource": 0,
    "durationMs": 2800,
    "counts": {
      "incidents": 10047,
      "actors": 11200,
      "actions": 12400,
      "assets": 15000,
      "attributes": 13800,
      "explicitCveLinks": 485,
      "unknownFields": 0
    },
    "errorCount": 0
  }
  ```
- **Status**: **LIVE**

---

### 1.12 Query Normalized VCDB Incidents
- **Method**: `GET`
- **Path**: `/api/integrations/vcdb/incidents` (or `/api/v1/incidents`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N4 / Historical Incident Matrix Explorer)
- **Purpose**: Query historical cyber incidents by year, industry, country, 4A dimensions, search string, or structured CVE ID with pagination.
- **Request**:
  - Query Parameters: `search` (string), `cve` (string), `year` (number), `actorVariety` (string), `actionCategory` (string), `assetCategory` (string), `attributeCategory` (string), `victimIndustry` (string), `victimCountry` (string), `page` (number), `limit` (number).
- **Response (HTTP 200)**:
  ```json
  {
    "incidents": [
      {
        "id": "uuid",
        "vcdbId": "C20AD4D7-6FE9-7759-AA27-A0C99BFF6710",
        "incidentYear": 2025,
        "securityIncident": "Confirmed",
        "confidence": "High",
        "summary": "Security incident targeting sales workflow integrations...",
        "victimCountry": "FR",
        "victimIndustry": "541511",
        "employeeCount": "1001 to 10000",
        "dataDisclosure": "Yes",
        "schemaVersion": "1.4.1",
        "isCurrent": true
      }
    ],
    "total": 10047,
    "page": 1,
    "limit": 50,
    "hasNext": true
  }
  ```
- **Status**: **LIVE**

---

### 1.13 Single Incident Deep Lookup
- **Method**: `GET`
- **Path**: `/api/integrations/vcdb/incidents/:vcdbId`
- **Owner**: Tanish
- **Consumer**: Nishit (Incident Detail Modal)
- **Purpose**: Retrieve full VERIS incident details including 4A dimensions (Actors, Actions, Assets, Attributes), Timeline, and Authoritative Explicit Structured CVE Evidence.
- **Request**:
  - URL Parameter: `vcdbId` (string, e.g. `C20AD4D7-6FE9-7759-AA27-A0C99BFF6710`).
- **Response (HTTP 200)**:
  ```json
  {
    "incident": {
      "id": "uuid",
      "vcdbId": "C20AD4D7-6FE9-7759-AA27-A0C99BFF6710",
      "summary": "Security incident targeting sales workflow integrations...",
      "victimCountry": "FR",
      "victimIndustry": "541511",
      "schemaVersion": "1.4.1",
      "isCurrent": true
    },
    "actors": [
      { "actorCategory": "External", "actorSubtype": "Organized crime", "motive": "Financial" }
    ],
    "actions": [
      { "actionCategory": "Hacking", "variety": "Use of stolen creds", "vector": "Web application" }
    ],
    "assets": [
      { "assetCategory": "Server", "assetVariety": "S - Web application" }
    ],
    "attributes": [
      { "attributeCategory": "Confidentiality", "variety": "Unknown" }
    ],
    "timeline": {
      "incidentYear": 2025,
      "incidentMonth": 8,
      "incidentDay": 25
    },
    "explicitCves": [
      { "cveId": "CVE-2023-4444", "evidenceSource": "action.hacking.cve" }
    ]
  }
  ```
- **Status**: **LIVE**

---

### 1.14 VCDB / VERIS Aggregate Statistics
- **Method**: `GET`
- **Path**: `/api/integrations/vcdb/statistics`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N4: Incident Insights & Breach Visualizations)
- **Purpose**: Return aggregate historical incident distributions across incident years, VERIS 4A dimensions (Actors, Actions, Assets, Attributes), top victim industries, and top victim countries.
- **Request**: None.
- **Response (HTTP 200)**:
  ```json
  {
    "byYear": [
      { "year": 2024, "count": 1250 },
      { "year": 2023, "count": 1420 }
    ],
    "byActorCategory": [
      { "category": "External", "count": 8200 },
      { "category": "Internal", "count": 1850 }
    ],
    "byActionCategory": [
      { "category": "Hacking", "count": 5100 },
      { "category": "Malware", "count": 3400 }
    ],
    "byAssetCategory": [
      { "category": "Server", "count": 6400 },
      { "category": "User Device", "count": 2900 }
    ],
    "byAttributeCategory": [
      { "category": "Confidentiality", "count": 9100 },
      { "category": "Availability", "count": 3200 }
    ],
    "byIndustry": [
      { "industry": "541511", "count": 420 }
    ],
    "byCountry": [
      { "country": "US", "count": 4500 }
    ]
  }
  ```
- **Status**: **LIVE**

---

## 2. Enterprise Asset & Context (Owner: HARSH)

### 2.1 Paginated Asset Inventory
- **Method**: `GET`
- **Canonical Path**: `/api/assets`
- **Compatibility Alias**: `/api/v1/assets`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N5: Asset Explorer)
- **Purpose**: Return paginated enterprise assets with criticality, network exposure, and operational context. Zero synthetic assets are ever returned.
- **Request**:
  - Query Parameters: `page` (number, default 1), `limit` (number, default 50), `search` (string), `assetType` (string), `criticality` (1-5), `isInternetFacing` (boolean), `businessUnitId` (string).
- **Response (HTTP 200)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "organizationId": "uuid",
        "businessUnitId": "uuid",
        "assetIdentifier": "AST-001",
        "name": "Production Payment Gateway 01",
        "hostname": "paygate-prod-01.internal",
        "ipAddress": "10.0.12.50",
        "macAddress": "00:1A:2B:3C:4D:5E",
        "assetType": "server",
        "operatingSystem": "Ubuntu 22.04 LTS",
        "environment": "Production",
        "owner": "SecOps Team",
        "isInternetFacing": true,
        "businessCriticality": 5,
        "dataClassification": "Restricted",
        "revenueDependencyPct": 45.5,
        "operationalImportance": 5.0,
        "metadata": {},
        "createdAt": "2026-09-24T00:00:00.000Z",
        "updatedAt": "2026-09-24T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  }
  ```
- **Empty State**: When no assets exist, returns `{"data": [], "total": 0, "page": 1, "limit": 50}`.
- **Status**: **LIVE**

---

### 2.2 Asset Detail & Correlated Vulnerabilities
- **Method**: `GET`
- **Canonical Path**: `/api/assets/:assetId/vulnerabilities`
- **Compatibility Alias**: `/api/cpe-matching/correlations/:assetId`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N5 Drawer)
- **Purpose**: Retrieve correlated vulnerabilities for a specific asset with transparent match reasoning and confidence score. Strictly labelled as "Potential vulnerability match" (never infers compromise).
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "uuid",
    "assetName": "Production Payment Gateway 01",
    "count": 1,
    "data": [
      {
        "id": "uuid",
        "assetId": "uuid",
        "softwareId": "uuid",
        "vulnerabilityId": "uuid",
        "cveId": "CVE-2021-44228",
        "softwareName": "log4j-core",
        "installedVersion": "2.14.1",
        "cpeCriteria": "cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*",
        "matchConfidence": 0.95,
        "matchType": "CPE_VERSION_BOUND",
        "matchReason": "Installed version 2.14.1 satisfies range <= 2.15.0",
        "status": "POTENTIAL_VULNERABILITY_MATCH",
        "matchedAt": "2026-09-24T00:00:00.000Z"
      }
    ]
  }
  ```
- **Status**: **LIVE**

---

### 2.3 Security Controls Inventory & Defensive Coverage
- **Method**: `GET`
- **Canonical Path**: `/api/controls` (with `?summary=true` for coverage aggregation)
- **Compatibility Alias**: `/api/v1/controls`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N6: Controls Posture)
- **Purpose**: Return authoritative defensive security control catalog and enterprise asset coverage percentage. Never invents ROI or hallucinated effectiveness percentages.
- **Request Parameters**:
  - `summary` (boolean, default false): If true, aggregates coverage metrics across assets.
  - `organizationId` (optional UUID): Filter summary to a specific organization.
- **Response (HTTP 200, ?summary=true)**:
  ```json
  {
    "totalCatalogControls": 7,
    "controls": [
      {
        "code": "MFA",
        "name": "Multi-Factor Authentication",
        "category": "Identity & Access",
        "defaultMitigationWeight": 0.85,
        "totalAssetsAssigned": 0,
        "implementedCount": 0,
        "partialCount": 0,
        "notImplementedCount": 0,
        "unknownCount": 0,
        "coveragePercentage": 0
      }
    ]
  }
  ```
- **Status**: **LIVE**

---

## 3. Top-Level Unified Threat Intelligence (Owner: TANISH)

### 3.1 Unified Threat Intel Summary
- **Method**: `GET`
- **Canonical Path**: `/api/threat-intel/summary`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N7: Threat Intelligence Feed)
- **Purpose**: High-level aggregated threat intelligence metrics across CISA KEV active catalog and MITRE ATT&CK Enterprise Matrix.
- **Response (HTTP 200)**:
  ```json
  {
    "data": {
      "cisaKev": {
        "activeCount": 1721,
        "knownRansomwareCount": 240,
        "overdueCount": 15,
        "lastSyncAt": "2026-09-24T00:00:00.000Z",
        "lastSuccessfulRun": {}
      },
      "mitreAttack": {
        "domain": "enterprise-attack",
        "releaseVersion": "19.2",
        "releaseId": null,
        "tacticsCount": 14,
        "techniquesCount": 660,
        "groupsCount": 158,
        "softwareCount": 696,
        "mitigationsCount": 44,
        "lastSyncAt": "2026-09-24T00:00:00.000Z"
      },
      "generatedAt": "2026-09-24T00:00:00.000Z"
    }
  }
  ```
- **Status**: **LIVE**

### 3.2 Threat Intel KEV Catalog
- **Method**: `GET`
- **Canonical Path**: `/api/threat-intel/kev`
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N7: KEV Feed Explorer)
- **Purpose**: Paginated listing of active CISA KEV entries with date range, search, and ransomware campaign filters.
- **Status**: **LIVE**

