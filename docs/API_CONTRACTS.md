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

### 1.2 NVD Integration Status
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

## 2. Enterprise Asset & Context (Owner: HARSH)

### 2.1 Paginated Asset Inventory
- **Method**: `GET`
- **Path**: `/api/assets`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N5: Asset Explorer)
- **Purpose**: Return paginated enterprise assets with criticality, network exposure, and count of potential vulnerability matches.
- **Request**:
  - Query Parameters: `page` (number, default 1), `limit` (number, default 20), `search` (string), `criticality` (CRITICAL, HIGH, MEDIUM, LOW), `businessUnitId` (string).
- **Response (HTTP 200)**:
  ```json
  {
    "assets": [
      {
        "id": "uuid",
        "name": "Production Payment Gateway 01",
        "hostname": "paygate-prod-01.internal",
        "ipAddress": "10.0.12.50",
        "assetType": "SERVER",
        "businessCriticality": "CRITICAL",
        "internetFacing": true,
        "businessUnitName": "Digital Banking",
        "matchedVulnerabilitiesCount": 3,
        "highestCvssScore": 9.8
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
  ```
- **Status**: **PLANNED (Phase H2)**

---

### 2.2 Asset Detail & Correlated Vulnerabilities
- **Method**: `GET`
- **Path**: `/api/assets/:assetId/vulnerabilities`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N5 Drawer)
- **Purpose**: Retrieve correlated vulnerabilities for a specific asset with plain-English match reasoning.
- **Response (HTTP 200)**:
  ```json
  {
    "assetId": "uuid",
    "assetName": "Production Payment Gateway 01",
    "matches": [
      {
        "cveId": "CVE-2021-44228",
        "softwareName": "log4j-core",
        "installedVersion": "2.14.1",
        "matchedCpeCriteria": "cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*",
        "confidence": "HIGH",
        "reasoning": "Installed version 2.14.1 satisfies range <= 2.15.0",
        "label": "Potential vulnerability match",
        "knownExploited": true,
        "cvssBaseScore": 10.0,
        "cvssBaseSeverity": "CRITICAL"
      }
    ]
  }
  ```
- **Status**: **PLANNED (Phase H4)**

---

### 2.3 Security Controls Inventory
- **Method**: `GET`
- **Path**: `/api/controls`
- **Owner**: Harsh
- **Consumer**: Nishit (Screen N6: Controls UI)
- **Purpose**: Return defensive security control coverage across enterprise assets.
- **Response (HTTP 200)**:
  ```json
  {
    "controls": [
      {
        "id": "ctrl-edr",
        "name": "Endpoint Detection & Response (EDR)",
        "category": "PROTECTION",
        "totalAssets": 250,
        "implementedCount": 235,
        "coveragePercentage": 94.0
      },
      {
        "id": "ctrl-mfa",
        "name": "Multi-Factor Authentication (MFA)",
        "category": "ACCESS_CONTROL",
        "totalAssets": 250,
        "implementedCount": 250,
        "coveragePercentage": 100.0
      }
    ]
  }
  ```
- **Status**: **PLANNED (Phase H5)**
