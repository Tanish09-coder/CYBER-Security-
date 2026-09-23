# CyberRiskOS — CPE Matching & Vulnerability Correlation Specification
**Owner:** HARSH (Enterprise Context Lead)  
**Status:** Implemented (Phase H4)  
**Strict Terminology:** Potential Vulnerability Match (Zero claims of compromise)

---

## 1. Overview
The CPE Matching Engine continuously bridges internal enterprise context (assets and installed software) with authoritative external vulnerability intelligence (NIST NVD CVEs and CISA KEV).

It determines whether installed software versions fall within vulnerable CPE 2.3 criteria bounds and generates transparent, audit-ready reasoning.

---

## 2. Terminology & Legal Guardrails
- **Declared Output:** `POTENTIAL_VULNERABILITY_MATCH`
- **Strict Prohibition:** The engine **never** declares an asset "compromised" or "breached". The presence of a vulnerable version is purely a signal of exposure and attack surface, not a confirmed active intrusion.

---

## 3. CPE 2.3 Evaluation Architecture

### 3.1 Vendor & Product Normalization
Vendor and product strings from both installed software packages and NVD CPE criteria strings (`cpe:2.3:a:<vendor>:<product>:<version>:...`) are normalized to lowercase alphanumeric strings:
```typescript
normalizeName("Apache_Log4j") -> "apachelog4j"
normalizeName("log4j-core")   -> "log4jcore"
```

### 3.2 Semantic & Numerical Version Bounds
Version bounds from NVD (`version_start_including`, `version_start_excluding`, `version_end_including`, `version_end_excluding`) are evaluated using a multi-segment numerical and semantic version comparison algorithm:
- `v >= version_start_including`
- `v > version_start_excluding`
- `v <= version_end_including`
- `v < version_end_excluding`

### 3.3 Confidence Scoring Matrix
| Match Criteria | Confidence Score | Match Type |
| :--- | :--- | :--- |
| Exact Vendor + Product + Exact Version | **1.00** | `CPE_EXACT_VERSION` |
| Exact Vendor + Product + Bounded Version Range | **0.95** | `CPE_VERSION_BOUND` |
| Exact Vendor + Product + Wildcard Version (`*`) | **0.85** | `CPE_PRODUCT_WILDCARD` |

---

## 4. API Reference

### Trigger Matching Evaluation
`POST /api/cpe-matching/evaluate`
```json
{
  "asset_id": "uuid-optional",
  "organization_id": "uuid-optional"
}
```

### Correlated Asset Vulnerabilities
`GET /api/assets/:assetId/vulnerabilities`
Returns list of matched CVEs with CVSS metrics, CISA KEV ransomware metadata, and plain-English match reasoning.
