# CyberRiskOS — NVD CVE Ingestion Specification & Integration Guide

## 1. Overview & Purpose
The National Vulnerability Database (NVD) CVE Ingestion module provides automated, reliable, and auditable ingestion of published vulnerabilities from the official NIST NVD API v2.0 into the CyberRiskOS platform.

> [!IMPORTANT]
> **Risk Scoring Disassociation**:  
> **NVD CVSS represents vulnerability technical severity and must not be treated as enterprise financial risk by itself.**  
> In CyberRiskOS, CVSS metrics provide only technical vulnerability signals. Financial exposure calculation is performed separately by the Risk Engine by combining asset criticality, threat intelligence (e.g. CISA KEV active exploitation), internet exposure, and control effectiveness.

---

## 2. Official Source & Endpoint

- **Provider**: National Institute of Standards and Technology (NIST)
- **API Version**: 2.0
- **Base Endpoint**: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- **Official Documentation**: [NIST NVD API Developer Documentation](https://nvd.nist.gov/developers/vulnerabilities)

---

## 3. Authentication & Security Configuration

The NVD API supports both unauthenticated requests and requests authenticated via an API key.

### Environment Variables
Configure the following in `backend/.env`:

| Variable | Description | Default |
|---|---|---|
| `NVD_API_KEY` | Official NIST NVD API Key (leave blank for unauthenticated mode) | `undefined` |
| `NVD_BASE_URL` | Base endpoint URL for NVD API | `https://services.nvd.nist.gov/rest/json/cves/2.0` |
| `NVD_TIMEOUT_MS` | HTTP client request timeout | `15000` (15s) |
| `NVD_MAX_RETRIES` | Max exponential backoff retry attempts | `4` |
| `NVD_REQUEST_DELAY_MS` | Configurable request pacing limiter between outgoing calls | `600` (600ms) |

### Security Safeguards
1. **Server-Side Only**: The `NVD_API_KEY` is loaded strictly by the backend runtime. It is never exposed in client bundles or frontend APIs.
2. **Secret Redaction**: The structured logger automatically scrubs `apiKey`, `password`, `authorization`, and related tokens from all logs and error stacks.
3. **No Hardcoded Credentials**: Default configs in code contain no secrets.

---

## 4. Synchronization Strategy & Endpoints

### 4.1 Single CVE Lookup
- **Endpoint**: `POST /api/integrations/nvd/cve/:cveId`
- **Method**: Direct query to NVD for exact CVE (e.g., `CVE-2021-44228`).
- **Validation**: Strict regex `/^CVE-\d{4}-\d{4,}$/i`.
- **Idempotency**: If the raw payload matches an existing record's SHA-256 hash, normalized updates are skipped to preserve audit integrity.

### 4.2 Date-Range Synchronization
- **Endpoint**: `POST /api/integrations/nvd/sync/date-range`
- **Payload**:
  ```json
  {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-15T23:59:59.000Z",
    "resultsPerPage": 100
  }
  ```
- **Constraint**: Window cannot exceed 120 consecutive days (enforced by NVD API v2.0).

### 4.3 Incremental Synchronization
- **Endpoint**: `POST /api/integrations/nvd/sync`
- **Mechanism**: Reads `data_sources.last_sync_at`. If present, fetches CVEs modified between `last_sync_at` and current timestamp.
- **Safety Rule**: If no previous sync has occurred, an explicit date range is required to prevent accidental bulk downloading of the full historical archive.

---

## 5. Rate Limiting, Retries & Pacing

- **Request Pacing**: The client uses a configurable delay limiter (`NVD_REQUEST_DELAY_MS`) between outbound calls to prevent bursting.
- **Retry Mechanism**: Exponential backoff with randomized jitter on transient failures:
  - HTTP `429` (Rate Limited)
  - HTTP `500`, `502`, `503`, `504` (Server Errors)
  - Network timeouts and socket resets
- **Non-Retryable Errors**: HTTP `400` (Bad Request) and `404` (Not Found) fail immediately without retry.

---

## 6. Normalization & CVSS Assessment Model

CyberRiskOS normalizes raw NVD records into structured relational models while preserving **all** assessments:

1. **Multiple Assessments Preserved**: NIST/NVD, CNA (CVE Numbering Authority), and ADP (Authorized Data Publisher) assessments are each stored in `vulnerability_cvss_metrics`.
2. **Display/Preferred Metric**: A single preferred metric is derived deterministically:
   $$\text{CVSS v4.0} > \text{CVSS v3.1} > \text{CVSS v3.0} > \text{CVSS v2.0}$$
   Within the same version, `Primary` is preferred over `Secondary`.
3. **No Synthetic Inference**: Missing scores remain `null`; the system never invents or guesses CVSS ratings.
4. **Child Entities**: Weaknesses (CWE), affected CPE configurations, and references are parsed into separate indexed tables.

---

## 7. Known Limitations
1. NVD API availability may experience occasional degradation or maintenance outages; retry mechanisms mitigate transient downtime.
2. NVD CVSS scores do not indicate whether an exploit is being actively used in ransomware campaigns; this signal is provided separately by the CISA KEV integration.
