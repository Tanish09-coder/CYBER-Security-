# Enterprise Remediation Action Catalog & What-If Scenario Definitions

**Owner**: HARSH (Enterprise Context & Action Catalog Lead)  
**Status**: ACTIVE  
**Last Updated**: 2026-09-25  

---

## 1. Overview & Action Types

CyberRiskOS defines candidate enterprise security initiatives as explicit **Remediation Actions**. These actions feed Tanish's What-If Simulation and ROSI Optimization engines.

### Permitted Action Types
1. **`PATCH_CVE`**: Apply security patch to remediate specific CVEs on target asset(s).
2. **`ENABLE_CONTROL`**: Upgrade defensive security control posture on target asset(s) (e.g. `NOT_IMPLEMENTED` $\rightarrow$ `IMPLEMENTED` for `MFA`, `EDR`, `BACKUP`, `SEGMENTATION`, `PAM`, `ENCRYPTION`, `MONITORING`).
3. **`SEGMENT_NETWORK`**: Apply micro-segmentation policies to restrict lateral movement boundaries.
4. **`ISOLATE_ASSET`**: Isolate asset from internet exposure (setting `is_internet_facing = false`).

---

## 2. Mandatory Modeling Rules (Zero Synthetic Data)

1. **Action Cost Origin**: `remediationCost` MUST originate from user/organization configuration or verified labor/license estimates.
2. **Zero Hardcoded Effectiveness Math**: Harsh supplies implementation costs, effort hours, and targeted assets/controls. Risk reduction math is computed dynamically by Tanish's Risk Engine.
3. **Feasibility Constraints**: Actions may declare prerequisites or execution constraints (e.g., maintenance window required, budget limits).

---

## 3. Database & REST API Interface

- **Database Table**: `remediation_actions`
- **REST Endpoints**:
  - `POST /api/remediation-actions`: Create action initiative
  - `GET /api/remediation-actions?organizationId=`: List initiatives
  - `GET /api/remediation-actions/budget?organizationId=`: Summary of total remediation investment vs department budgets
