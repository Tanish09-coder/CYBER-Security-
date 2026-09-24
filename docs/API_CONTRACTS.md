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

---

## 4. Phase 2: Risk Quantification Engine APIs (Owner: TANISH)

### 4.1 Evaluate Atomic Risk Pair
- **Method**: `POST`
- **Canonical Path**: `/api/risk/evaluate` (and `/api/v1/risk/evaluate`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N8: Risk Overview / Simulation trigger)
- **Purpose**: Evaluates an atomic `(asset_id, vulnerability_id)` pair deterministically using Model v1.0.0.
- **Request Body**:
  ```json
  {
    "asset": {
      "assetId": "b8bf43be-637b-4cb5-826a-390275cafbac",
      "assetName": "SWIFT Core Payment Switch",
      "criticalityTier": 1,
      "isInternetFacing": true,
      "controls": [
        { "controlCode": "MFA", "status": "IMPLEMENTED" },
        { "controlCode": "EDR", "status": "IMPLEMENTED" }
      ]
    },
    "vulnerability": {
      "cveId": "CVE-2021-44228",
      "cvssScore": 7.0,
      "cvssVersion": "3.1",
      "isKnownExploited": true,
      "knownRansomwareCampaignUse": "Known"
    }
  }
  ```
### 4.1 Single Risk Evaluation (On Demand & Cached)
- **Method**: `POST`
- **Canonical Path**: `/api/risk/evaluate` (and `/api/v1/risk/evaluate`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N8: On-Demand Risk Assessment), Batch Pipeline
- **Purpose**: Evaluates enterprise risk for an atomic `(asset_id, vulnerability_id)` pair. Checks persistent cache in `risk_results` using canonical input provenance hash: returns cached result on match; otherwise triggers Python Risk Engine evaluation and updates cache.
- **Request Body**:
  ```json
  {
    "asset": {
      "assetId": "b8bf43be-637b-4cb5-826a-390275cafbac",
      "assetName": "SWIFT Core Payment Switch",
      "criticalityTier": 1,
      "isInternetFacing": true,
      "controls": [
        { "controlCode": "MFA", "status": "IMPLEMENTED" },
        { "controlCode": "EDR", "status": "IMPLEMENTED" }
      ]
    },
    "vulnerability": {
      "cveId": "CVE-2021-44228",
      "cvssScore": 7.0,
      "cvssVersion": "3.1",
      "isKnownExploited": true,
      "knownRansomwareCampaignUse": "Known"
    }
  }
  ```
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "b8bf43be-637b-4cb5-826a-390275cafbac",
    "assetName": "SWIFT Core Payment Switch",
    "cveId": "CVE-2021-44228",
    "score": 98.0,
    "level": "CRITICAL",
    "baseCvss": 7.0,
    "modelVersion": "1.0.0",
    "inputProvenanceHash": "bccf4f3a6389397b9599e500c9dd84f81769327633f36ae9b31f918d0ffd4ade",
    "dataCompleteness": 1.0,
    "factors": [
      {
        "name": "CVSS_TECHNICAL_SEVERITY",
        "category": "TECHNICAL_SEVERITY",
        "value": 7.0,
        "weight": 1.0,
        "contribution": 70.0,
        "rationale": "Intrinsic technical flaw severity from NIST NVD (CVSS 7.0)."
      },
      {
        "name": "ASSET_CRITICALITY_CONSEQUENCE",
        "category": "BUSINESS_CONTEXT",
        "value": 1,
        "weight": 1.4,
        "contribution": 28.0,
        "rationale": "Tier 1 asset consequence scaling (Model-Policy Construct: weight 1.40)."
      }
    ],
    "missingDataWarnings": [],
    "riskFlags": [
      "CISA_KEV_ACTIVE_EXPLOITATION",
      "RANSOMWARE_CAMPAIGN_ASSOCIATED",
      "INTERNET_FACING_PERIMETER",
      "COMPENSATING_CONTROLS_ACTIVE"
    ],
    "evaluatedAt": "2026-09-24T12:00:00.000Z",
    "isCached": false
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid or malformed RiskInput payload (e.g. missing assetId, invalid CVE format).
  - `503 Service Unavailable`: Python Risk Engine is offline or unreachable (`code: "RISK_ENGINE_UNAVAILABLE"`). Strictly NO silent local fallback score calculation in Node.
  - `504 Gateway Timeout`: Python Risk Engine request exceeded configured timeout (`code: "RISK_ENGINE_TIMEOUT"`).
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 4.2 Batch Evaluate Risk Pairs
- **Method**: `POST`
- **Canonical Path**: `/api/risk/evaluate/batch` (and `/api/v1/risk/evaluate/batch`)
- **Owner**: Tanish
- **Purpose**: Batch evaluation of up to 500 atomic `(asset_id, vulnerability_id)` pairs. Reuses cached evaluations for unchanged inputs; evaluates misses via Python Risk Engine.
- **Request Body**: `{ "evaluations": [ ...RiskEvaluationInputDTO ] }`
- **Response (HTTP 200)**:
  ```json
  {
    "items": [ ...RiskScoreItemDTO ],
    "totalEvaluated": 2,
    "modelVersion": "1.0.0"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Empty evaluations array or invalid item.
  - `503 Service Unavailable`: Python Risk Engine offline.
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 4.3 Query Risk Scores
- **Method**: `GET`
- **Canonical Path**: `/api/risk/scores` (and `/api/v1/risk/scores`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N8: Risk Overview Explorer Table)
- **Query Parameters**:
  - `page` (int, default 1)
  - `limit` (int, default 25, max 100)
  - `assetId` (UUID)
  - `cveId` (string)
  - `level` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
  - `minScore` (float 0-100)
  - `maxScore` (float 0-100)
  - `modelVersion` (string, default "1.0.0")
  - `organizationId` (UUID)
- **Response (HTTP 200)**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "assetId": "uuid",
        "cveId": "CVE-2021-44228",
        "score": 98.0,
        "level": "CRITICAL",
        "baseCvss": 7.0,
        "modelVersion": "1.0.0",
        "inputProvenanceHash": "bccf4f3a...",
        "dataCompleteness": 1.0,
        "factors": [ ... ],
        "missingDataWarnings": [],
        "riskFlags": [ "CISA_KEV_ACTIVE_EXPLOITATION" ],
        "evaluatedAt": "2026-09-24T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "totalPages": 1
    }
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 4.4 Asset Risk Summary
- **Method**: `GET`
- **Canonical Path**: `/api/risk/assets/:assetId` (and `/api/v1/risk/assets/:assetId`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N8: Asset Risk Drawer / Detail Modal)
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "uuid",
    "assetName": "SWIFT Core Payment Switch",
    "assetType": "server",
    "criticalityTier": 1,
    "isInternetFacing": true,
    "totalVulnerabilitiesEvaluated": 4,
    "highestScore": 98.0,
    "highestLevel": "CRITICAL",
    "averageScore": 76.5,
    "levelDistribution": {
      "CRITICAL": 1,
      "HIGH": 2,
      "MEDIUM": 1,
      "LOW": 0
    },
    "evaluations": [ ... ]
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 4.5 Vulnerability Risk Distribution
- **Method**: `GET`
- **Canonical Path**: `/api/risk/vulnerabilities/:cveId` (and `/api/v1/risk/vulnerabilities/:cveId`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N4: Vulnerability Detail / Enterprise Blast Radius)
- **Response (HTTP 200)**:
  ```json
  {
    "cveId": "CVE-2021-44228",
    "baseCvss": 10.0,
    "baseSeverity": "CRITICAL",
    "knownExploited": true,
    "totalAssetsAffected": 5,
    "highestScore": 100.0,
    "highestLevel": "CRITICAL",
    "averageScore": 88.4,
    "levelDistribution": {
      "CRITICAL": 3,
      "HIGH": 2,
      "MEDIUM": 0,
      "LOW": 0
    },
    "evaluations": [ ... ]
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

---

## 5. Financial Exposure & Estimated Annualized Loss (EAL) Engine (Owner: TANISH)

### 5.1 Single Financial Exposure Evaluation
- **Method**: `POST`
- **Canonical Path**: `/api/financial/evaluate` (and `/api/v1/financial/evaluate`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N9: Financial Loss Modeling)
- **Purpose**: Evaluates Single Loss Expectancy (SLE), Annual Loss Event Frequency (ALEF), and Estimated Annualized Loss (EAL). Strictly labeled `MODELED / ESTIMATED`.
- **Request (JSON)**:
  ```json
  {
    "asset": {
      "assetId": "uuid",
      "assetName": "SWIFT Core Payment Switch",
      "criticalityTier": 1,
      "isInternetFacing": true,
      "hourlyDowntimeCost": 15000,
      "recoveryCost": 60000,
      "annualizedLossEventFrequency": 1.0,
      "currency": "USD"
    },
    "vulnerability": {
      "cveId": "CVE-2021-44228",
      "cvssScore": 10.0,
      "availabilityImpact": "HIGH",
      "scope": "CHANGED",
      "isKnownExploited": true,
      "knownRansomwareCampaignUse": "Known"
    }
  }
  ```
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "uuid",
    "assetName": "SWIFT Core Payment Switch",
    "cveId": "CVE-2021-44228",
    "sle": 420000.0,
    "alef": 1.0,
    "eal": 420000.0,
    "ealStatus": "CALCULATED",
    "currency": "USD",
    "primaryLoss": 360000.0,
    "secondaryLoss": 60000.0,
    "estimatedOutageHours": 24.0,
    "hourlyDowntimeRate": 15000.0,
    "recoveryCost": 60000.0,
    "factors": [ ... ],
    "missingDataWarnings": [],
    "dataCompletenessScore": 1.0,
    "modelVersion": "1.0.0",
    "provenanceHash": "64-char-hex",
    "isEstimated": true,
    "evaluatedAt": "2026-09-24T20:00:00.000Z",
    "isCached": false
  }
  ```
- **Frequency Audit & Missing Data Protocol**:
  - `annualizedLossEventFrequency` must be an empirical, annualized rate ($\text{events/year}$).
  - CyberRiskOS strictly refuses to derive breach frequency from CVSS, KEV, or arbitrary percentages.
  - If `annualizedLossEventFrequency` is omitted / null:
    - `alef`: `null`
    - `eal`: `null`
    - `ealStatus`: `"NOT_AVAILABLE"`
    - `missingDataWarnings`: `["ANNUAL_LOSS_EVENT_FREQUENCY_UNSPECIFIED"]`
    - `sle`, `primaryLoss`, and `secondaryLoss` remain fully calculated and reported.
- **Errors**: `400 Bad Request` (validation error), `503 Service Unavailable` (Python engine offline), `504 Gateway Timeout`.
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 5.2 Batch Financial Evaluation
- **Method**: `POST`
- **Canonical Path**: `/api/financial/evaluate/batch` (and `/api/v1/financial/evaluate/batch`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N9: Financial Table Ingestion)
- **Response (HTTP 200)**:
  ```json
  {
    "results": [ ... ],
    "totalEvaluated": 10,
    "totalModeledEal": 1250000.0,
    "currency": "USD",
    "modelVersion": "1.0.0"
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 5.3 Financial Exposures Listing & Filtering
- **Method**: `GET`
- **Canonical Path**: `/api/financial/exposure` (and `/api/v1/financial/exposure`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N9: Financial Loss Ledger)
- **Query Parameters**:
  - `page`: integer (default 1)
  - `limit`: integer (default 25, max 100)
  - `assetId`: UUID
  - `cveId`: string
  - `minEal`: number
  - `maxEal`: number
  - `sortBy`: `eal` | `sle` | `alef` | `evaluatedAt`
  - `sortOrder`: `asc` | `desc`
- **Response (HTTP 200)**:
  ```json
  {
    "items": [ ... ],
    "total": 42,
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 42,
      "totalItems": 42,
      "totalPages": 2
    }
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 5.4 Enterprise Financial Loss Summary
- **Method**: `GET`
- **Canonical Path**: `/api/financial/summary` (and `/api/v1/financial/summary`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N9: Executive Financial KPI Cards)
- **Response (HTTP 200)**:
  ```json
  {
    "totalModeledEal": 4500000.0,
    "currency": "USD",
    "totalEvaluatedAssets": 15,
    "totalEvaluatedVulnerabilities": 87,
    "highestEalAsset": {
      "assetId": "uuid",
      "assetName": "SWIFT Core Payment Switch",
      "eal": 1200000.0
    },
    "topLossDrivers": [ ... ],
    "isEstimated": true
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 5.5 Asset Financial Summary
- **Method**: `GET`
- **Canonical Path**: `/api/financial/assets/:assetId` (and `/api/v1/financial/assets/:assetId`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N9 / N5: Asset Financial Drawer)
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "uuid",
    "assetName": "SWIFT Core Payment Switch",
    "totalVulnerabilities": 4,
    "totalModeledEal": 420000.0,
    "maxSle": 420000.0,
    "avgAlef": 0.85,
    "totalPrimaryLoss": 360000.0,
    "totalSecondaryLoss": 60000.0,
    "currency": "USD",
    "isEstimated": true,
    "topLossVulnerabilities": [ ... ]
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

---

## 6. What-If Simulation Engine (Owner: TANISH)

### 6.1 Enterprise Posture Simulation (Zero DB Mutations)
- **Method**: `POST`
- **Canonical Path**: `/api/scenarios/simulate` (and `/api/v1/scenarios/simulate`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N10: What-If Sandbox)
- **Purpose**: Computes in-memory baseline vs hypothetical posture without mutating the PostgreSQL database.
- **Request (JSON)**:
  ```json
  {
    "scenarioName": "Patch KEV Flaws & Isolate Public Perimeter",
    "actions": [
      {
        "actionType": "PATCH_VULNERABILITY",
        "targetAssetId": "uuid",
        "targetCveId": "CVE-2021-44228",
        "description": "Remediate Log4Shell"
      },
      {
        "actionType": "ISOLATE_ASSET",
        "targetAssetId": "uuid",
        "description": "Disable direct internet exposure"
      }
    ]
  }
  ```
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": {
      "scenarioName": "Patch KEV Flaws & Isolate Public Perimeter",
      "baselineAvgRiskScore": 8.8,
      "simulatedAvgRiskScore": 3.2,
      "riskScoreDelta": -5.6,
      "riskReductionPct": 63.64,
      "baselineTotalEal": 500000.0,
      "simulatedTotalEal": 120000.0,
      "ealDelta": -380000.0,
      "ealReductionPct": 76.0,
      "ealStatus": "CALCULATED",
      "currency": "USD",
      "totalActionsApplied": 2,
      "actionImpacts": [
        {
          "actionType": "PATCH_VULNERABILITY",
          "targetAssetId": "uuid",
          "targetCveId": "CVE-2021-44228",
          "riskScoreReduction": 5.6,
          "ealReduction": 380000.0,
          "currency": "USD",
          "summary": "Remediated CVE-2021-44228 on asset uuid (eliminated flaw exposure from modeled portfolio)."
        },
        {
          "actionType": "ISOLATE_ASSET",
          "targetAssetId": "uuid",
          "targetCveId": null,
          "riskScoreReduction": 0.0,
          "ealReduction": 0.0,
          "currency": "USD",
          "summary": "Isolated asset uuid from public Internet edge (perimeter context updated; continuous risk score delta remains 0.0 under Risk Model v1)."
        }
      ],
      "modelVersion": "1.0.0",
      "isSimulation": true,
      "simulatedAt": "2026-09-24T20:00:00.000Z"
    }
  }
  ```
- **Errors**: `400 Bad Request`, `503 Service Unavailable`, `504 Gateway Timeout`.
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 6.2 Targeted Single-Asset Simulation
- **Method**: `POST`
- **Canonical Path**: `/api/scenarios/assets/:assetId/simulate` (and `/api/v1/scenarios/assets/:assetId/simulate`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N10 / Asset Drawer Simulation)
- **Response (HTTP 200)**: Same structure as 6.1 with results scoped to asset posture.
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

### 6.3 Executive Scenario Presets
- **Method**: `GET`
- **Canonical Path**: `/api/scenarios/presets` (and `/api/v1/scenarios/presets`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N10: Scenario Presets Dropdown)
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "PRESET-PATCH-KEV",
        "name": "Remediate All CISA KEV Exploited Vulnerabilities",
        "description": "Simulates patching known actively exploited vulnerabilities across enterprise assets.",
        "category": "VULNERABILITY_PATCHING",
        "actions": [ ... ]
      },
      {
        "id": "PRESET-MFA-TIER1",
        "name": "Enforce Multi-Factor Authentication Across Tier-1 Assets",
        "description": "Simulates deploying and enforcing strict MFA controls across mission-critical systems.",
        "category": "CONTROLS_ENFORCEMENT",
        "actions": [ ... ]
      },
      {
        "id": "PRESET-ISOLATE-EDGE",
        "name": "Perimeter Defense: Isolate Exposed High-Risk Systems",
        "description": "Simulates revoking direct public internet ingress for vulnerable edge appliances.",
        "category": "PERIMETER_DEFENSE",
        "actions": [ ... ]
      }
    ]
  }
  ```
- **Status**: **LOCAL IMPLEMENTATION VERIFIED (FINAL CROSS-MODULE INTEGRATION PENDING)**

---

## 7. INVESTMENT OPTIMIZATION & ROSI (PHASE 5)

### 7.1 Multi-Strategy Optimization Solve
- **Method**: `POST`
- **Canonical Path**: `/api/optimization/solve` (and `/api/v1/optimization/solve`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N11: Security Investment Optimizer)
- **Purpose**: Generates three distinct, mathematically grounded investment strategies under budget and dependency constraints:
  - **Strategy A (Maximum Reduction):** Maximizes absolute risk & loss reduction.
  - **Strategy B (Balanced ROSI):** Maximizes capital efficiency ($\text{ROSI} = \frac{\Delta\text{EAL} - \text{Cost}}{\text{Cost}}$).
  - **Strategy C (Quick Wins):** Prioritizes low-cost actions ($\le 25\%$ budget) for rapid vulnerability remediation.
- **Request Body**:
  ```json
  {
    "budgetLimit": 50000.0,
    "currency": "USD",
    "baselinePortfolioRisk": 72.5,
    "baselinePortfolioEal": 350000.0,
    "candidateActions": [
      {
        "actionId": "act-1",
        "actionType": "PATCH_VULNERABILITY",
        "targetAssetId": "uuid-1",
        "targetCveId": "CVE-2021-44228",
        "cost": 15000.0,
        "estimatedRiskReduction": 20.0,
        "estimatedEalReduction": 120000.0,
        "dependencies": [],
        "conflictsWith": [],
        "title": "Patch Log4Shell on Payment Gateway",
        "description": "Remediates critical RCE flaw."
      }
    ]
  }
  ```
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": {
      "budgetLimit": 50000.0,
      "currency": "USD",
      "totalCandidates": 1,
      "evaluatedAt": "2026-09-24T20:30:00.000Z",
      "modelVersion": "1.0.0",
      "strategies": [
        {
          "strategyId": "STRATEGY_A_MAX_REDUCTION",
          "strategyName": "Maximum Risk & Loss Reduction",
          "strategyType": "MAX_REDUCTION",
          "description": "Maximizes absolute risk reduction benefit.",
          "selectedActions": [ ... ],
          "totalCost": 15000.0,
          "remainingBudget": 35000.0,
          "totalRiskReduction": 20.0,
          "totalEalReduction": 120000.0,
          "simulatedPortfolioRisk": 52.5,
          "simulatedPortfolioEal": 230000.0,
          "netFinancialBenefit": 105000.0,
          "rosiPct": 700.0,
          "rosiRatio": 7.0,
          "actionCount": 1
        }
      ]
    }
  }
  ```
- **Status**: **LIVE & VERIFIED**

### 7.2 Strategies Metadata Catalog
- **Method**: `GET`
- **Canonical Path**: `/api/optimization/strategies` (and `/api/v1/optimization/strategies`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N11 Strategy Selector)
- **Response (HTTP 200)**: Metadata for `STRATEGY_A_MAX_REDUCTION`, `STRATEGY_B_BALANCED_ROSI`, `STRATEGY_C_QUICK_WINS`.
- **Status**: **LIVE & VERIFIED**

### 7.3 Multi-Strategy Side-by-Side Comparison
- **Method**: `POST`
- **Canonical Path**: `/api/optimization/compare` (and `/api/v1/optimization/compare`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N11 Comparison Grid)
- **Purpose**: Generates side-by-side trade-off metrics without picking a political winner.
- **Status**: **LIVE & VERIFIED**

---

## 8. EXECUTIVE DECISION DASHBOARD (PHASE 6)

### 8.1 Executive Aggregated Risk Posture
- **Method**: `GET`
- **Canonical Path**: `/api/executive/posture` (and `/api/v1/executive/posture`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N1 / Executive Summary View)
- **Query Parameters**: `organizationId` (optional)
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": {
      "overallRiskScore": 68.5,
      "riskSeverity": "MEDIUM",
      "riskDistribution": { "low": 30, "medium": 50, "high": 30, "critical": 10 },
      "totalAssetsEvaluated": 45,
      "totalVulnerabilitiesEvaluated": 80,
      "kevExposureCount": 8,
      "ransomwareAssociatedCount": 3,
      "internetFacingAssetCount": 12,
      "businessUnitRollups": [ ... ],
      "dataFreshnessTimestamp": "2026-09-24T20:45:00.000Z",
      "modelVersion": "1.0.0"
    }
  }
  ```
- **Status**: **LIVE & VERIFIED**

### 8.2 Top Critical Risk Exposures
- **Method**: `GET`
- **Canonical Path**: `/api/executive/top-risks` (and `/api/v1/executive/top-risks`)
- **Owner**: Tanish
- **Query Parameters**: `limit` (default: 5, max: 20), `organizationId` (optional)
- **Response (HTTP 200)**: Array of ranked high-criticality asset/CVE exposure records with CVSS, KEV status, risk score, and modeled EAL.
- **Status**: **LIVE & VERIFIED**

### 8.3 Enterprise Financial Loss Summary
- **Method**: `GET`
- **Canonical Path**: `/api/executive/financial-summary` (and `/api/v1/executive/financial-summary`)
- **Owner**: Tanish
- **Query Parameters**: `organizationId` (optional)
- **Response (HTTP 200)**: Aggregated modeled EAL, primary downtime loss, secondary recovery loss, and top financial loss driver assets.
- **Status**: **LIVE & VERIFIED**

---

## 9. COMPLIANCE INTELLIGENCE QUERY BUILDER (PHASE 7A)

- **Owner**: Tanish
- **Module**: `backend/src/modules/compliance/compliance.query-builder.ts`
- **Methods**:
  - `buildFrameworkCoverageQuery(filter)`: Aggregates requirements and control postures per framework.
  - `buildComplianceGapsQuery(filter)`: Identifies unmitigated controls prioritized by asset criticality.
  - `buildEvidenceAggregationQuery(filter)`: Aggregates verified audit evidence with timestamps and sources.
  - `buildAssetComplianceScoreQuery(organizationId)`: Aggregates compliance score per asset.
  - `getRecommendedOptimizationIndexes()`: Recommended composite indexes for sub-50ms execution.
- **Status**: **LIVE & VERIFIED**

---

## 10. ATTACK PATH & BLAST RADIUS INTELLIGENCE (PHASE 7B)

### 10.1 Topological Attack Graph Analysis
- **Method**: `GET`
- **Canonical Path**: `/api/attack-paths` (and `/api/v1/attack-paths`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N12: Attack Path & Blast Radius Visualizer)
- **Query Parameters**: `organizationId` (optional)
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": {
      "totalNodes": 12,
      "totalEdges": 18,
      "totalPathsFound": 5,
      "maxPathRisk": 96.4,
      "discoveredPaths": [
        {
          "pathId": "path-1",
          "nodeIds": ["asset-web", "asset-app", "asset-db"],
          "edgeIds": ["edge-1", "edge-2"],
          "hopCount": 2,
          "cumulativeRiskScore": 94.0,
          "entryAssetId": "asset-web",
          "targetAssetId": "asset-db",
          "criticalCves": ["CVE-2021-44228", "CVE-2023-34362"]
        }
      ],
      "chokePoints": [
        {
          "assetId": "asset-app",
          "assetName": "Core Banking Application Server",
          "interceptedPathsCount": 4,
          "interceptedRiskScore": 340.5,
          "chokePointScore": 0.88,
          "remediationRecommendation": "Remediating or segmenting 'Core Banking Application Server' severs 4 attack path(s) to critical enterprise assets."
        }
      ],
      "entryPointsCount": 3,
      "criticalTargetsCount": 2,
      "evaluatedAt": "2026-09-24T21:00:00.000Z",
      "modelVersion": "1.0.0"
    }
  }
  ```
- **Status**: **LIVE & VERIFIED**

### 10.2 Ad-Hoc Custom Graph Simulation
- **Method**: `POST`
- **Canonical Path**: `/api/attack-paths/analyze` (and `/api/v1/attack-paths/analyze`)
- **Owner**: Tanish
- **Purpose**: Evaluates custom graph payloads without database persistence.
- **Status**: **LIVE & VERIFIED**

### 10.3 Structural Choke Points Ranking
- **Method**: `GET`
- **Canonical Path**: `/api/attack-paths/choke-points` (and `/api/v1/attack-paths/choke-points`)
- **Owner**: Tanish
- **Query Parameters**: `limit` (default: 10), `organizationId` (optional)
- **Status**: **LIVE & VERIFIED**

### 10.4 Asset Inbound Attack Vectors & Blast Radius
- **Method**: `GET`
- **Canonical Path**: `/api/attack-paths/asset/:id` (and `/api/v1/attack-paths/asset/:id`)
- **Owner**: Tanish
- **Consumer**: Nishit (Screen N12 / Asset Detail Drawer)
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": {
      "assetId": "asset-app",
      "assetName": "Core Banking Application Server",
      "criticalityTier": 2,
      "isInternetFacing": false,
      "upstreamInboundPaths": [ ... ],
      "downstreamOutboundPaths": [ ... ],
      "compromiseRiskScore": 94.0,
      "isChokePoint": true,
      "chokePointDetails": { ... }
    }
  }
  ```
- **Status**: **LIVE & VERIFIED**




