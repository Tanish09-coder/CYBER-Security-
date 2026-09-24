# CyberRiskOS — Normative AI Grounding & Anti-Hallucination Specification

**Version:** 1.0.0  
**Phase:** Phase 8 — AI Explanation Assistant  
**Owner:** TANISH (Risk Intelligence, Quantification & Decision Engine Lead)  

---

## 1. Overview & Architectural Principle

The **CyberRiskOS AI Explanation Assistant** provides grounded natural language explanations of quantitative risk, financial exposure, and optimization trade-offs.

### Core Architectural Mandate
1. **Authoritative Backend Resolution:** The Assistant API **NEVER** accepts client/frontend-provided calculation numbers (`score`, `EAL`, `SLE`, `ALEF`, `ROSI`, strategy cost) as ground truth.
   - Ground truth values are loaded authoritatively from persistent backend storage (`risk_results`, `financial_results`, solver engine) by primary result IDs or `(asset_id, cve_id)` keys.
2. **Deterministic Dual-Layer Grounding Validation:**
   - **Layer 1 (Structured Claim Validation):** Explicit extraction and comparison of `sourceField` / `claimedValue` pairs against authoritative calculation DTOs.
   - **Layer 2 (Defense-in-Depth Numeric Anchors):** Verification that every numeric anchor from calculation DTOs appears within the text within tolerance ($\le 5.0\%$).
3. **Canonical EAL Status Preservation:** EAL status must be explicitly `CALCULATED` or `NOT_AVAILABLE`. `totalEalReduction` is nullable and status-aware.
4. **Enterprise Privacy & Security Sanitization:** Prompts sent to external LLM providers must pass through enterprise sanitization to strip PII, internal subnets (`10.x.x.x`, `192.168.x.x`), DB connection strings, and secret credentials.
5. **Deterministic Fallback Guarantee:** If an external LLM fails grounding validation, times out, or errors out, the system automatically returns a grounded, safe template explanation (`TEMPLATE_GENERATED`).

---

## 2. Shared Golden Test Vector Format

Golden vectors are serialized in JSON format and shared across TypeScript (Jest) and Python (pytest):

```json
{
  "testCaseId": "GOLDEN-01-RISK-SCORE-PASS",
  "requestType": "EXPLAIN_RISK",
  "authoritativeContext": {
    "riskScore": 84.5,
    "severity": "HIGH",
    "cveId": "CVE-2021-44228",
    "assetName": "Core Database Server"
  },
  "candidateResponse": "The asset Core Database Server has a high risk score of 84.5 due to Log4Shell CVE-2021-44228.",
  "expectedValidation": {
    "passed": true,
    "violationsCount": 0
  }
}
```

---

## 3. Grounding Rules Summary

| Field | Source Field | Tolerated Range | Behavior on Mismatch |
| :--- | :--- | :--- | :--- |
| Risk Score | `score` / `riskScore` | $\pm 0.5$ | `GROUNDING_FAILED` fallback to template |
| Single Loss Expectancy | `sle` | $\pm 1.0\%$ | `GROUNDING_FAILED` fallback to template |
| Annual Loss Event Frequency | `alef` | Exact / $\pm 0.01$ | `GROUNDING_FAILED` fallback to template |
| Estimated Annualized Loss | `eal` | $\pm 1.0\%$ | `GROUNDING_FAILED` fallback to template |
| Strategy Cost | `totalCost` | $\pm 1.0\%$ | `GROUNDING_FAILED` fallback to template |
| ROSI Ratio | `rosiPct` | $\pm 1.0\%$ | `GROUNDING_FAILED` fallback to template |

