# CyberRiskOS — Enterprise Risk Inputs & Context Specification

**Document Version:** 2.0  
**Author / Lead:** HARSH (Enterprise Asset, Software, Control & Exposure Context Lead)  
**Status:** Authoritative Specification & Risk Engine Input Catalog  
**Target Consumers:** TANISH (Risk Engine Lead), NISHIT (Frontend Lead)  

---

## 1. Overview & Philosophical Principles

In CyberRiskOS, **HARSH** owns the storage, validation, provenance, and REST API delivery of all **authoritative internal enterprise inputs**. 

### Mandatory Modeling Guardrails:
1. **Harsh Provides Enterprise Context Only**: Stores asset criticality, network exposure, control statuses, financial baseline parameters, remediation action costs, organization budgets, asset relationships, and compliance evidence.
2. **Zero Financial Calculation in Harsh's Domain**: Harsh DOES NOT invent, implement, or execute risk formulas, Annual Exposure (EAL) math, Monte Carlo simulations, ROSI ratios, or knapsack optimizers. Those are exclusively owned by **Tanish** in `risk-engine/`.
3. **Zero Synthetic / Fabricated Defaults**: If an enterprise input (such as hourly downtime cost, remediation cost, or control status) is not explicitly provided by the user or scanner import, it MUST remain `NULL` / `UNKNOWN`. The system MUST NEVER assign fake numbers (e.g. defaulting downtime to $100,000/hr or control effectiveness to 50%).
4. **No Hardcoded Reduction Weights**: Harsh MUST NOT create arbitrary effectiveness percentages or reduction weights (e.g., no hardcoded "EDR reduces risk by 35%"). Distinguish strictly between `UNKNOWN`, `FALSE`, and `NOT CONFIGURED`. If no defensible quantitative effectiveness methodology exists: controls remain **contextual/explainability inputs** in Risk Model v1 and do **not** mathematically reduce risk.

---

## 2. Complete Enterprise Risk Input Field Audit

Below is the exhaustive field-by-field audit of all enterprise inputs available for consumption by Tanish's Risk Engine.

### 2.1 Organization & Tenant Baseline (`organizations`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `organizations.id` (UUID) | `GET /api/organizations/:id` | `NOT NULL` | System Generated | Yes (Unique Org Key) | N/A |
| `name` | `organizations.name` (VARCHAR) | `GET /api/organizations/:id` | `NOT NULL` | User-Provided | Informational | Required string |
| `annual_revenue` | `organizations.annual_revenue` (NUMERIC(18,2)) | `GET /api/organizations/:id` | `NULL` Allowed | User-Provided | Safe only when `!= NULL` and `> 0` | If `NULL`, organization revenue is `UNKNOWN`. Risk engine MUST NOT assume a default revenue figure (e.g. $10M). |
| `currency` | `organizations.currency` (VARCHAR(3)) | `GET /api/organizations/:id` | `NOT NULL` (Default `'USD'`) | User-Provided / Configured | Yes (ISO Code) | Defaults to `'USD'` if unconfigured. Currency unit display required. |
| `employee_count` | `organizations.employee_count` (INTEGER) | `GET /api/organizations/:id` | `NULL` Allowed | User-Provided | Non-financial context metric | If `NULL`, employee count is `UNKNOWN`. |

---

### 2.2 Business Unit Hierarchy & Budgets (`business_units`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `business_units.id` (UUID) | `GET /api/business-units` | `NOT NULL` | System Generated | Yes | N/A |
| `organization_id` | `business_units.organization_id` | `GET /api/business-units` | `NOT NULL` | User-Provided | Yes | Foreign key reference |
| `budget` | `business_units.budget` (NUMERIC(18,2)) | `GET /api/business-units` | `NULL` Allowed | User-Provided | Safe only when `!= NULL` | Required for ROSI & Optimizer budget constraint ($\sum c(i) \le B$). If `NULL`, BU budget constraint is `UNCONSTRAINED` / `UNKNOWN`. |
| `criticality_tier` | `business_units.criticality_tier` (INTEGER 1..5) | `GET /api/business-units` | `NOT NULL` (Default `3`) | User-Provided | Yes (1=Highest, 5=Lowest) | Stored as integer 1..5. If unconfigured by user, default `3` applies. |

---

### 2.3 Enterprise Assets (`assets`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `assets.id` (UUID) | `GET /api/assets` | `NOT NULL` | System Generated | Yes (Asset Identifier) | N/A |
| `business_criticality` | `assets.business_criticality` (INTEGER 1..5) | `GET /api/assets/:id/risk-inputs` | `NOT NULL` (Default `3`) | User-Provided | Yes (Ordinal Tier 1 to 5) | Explicit user-defined tier. 1 = Mission Critical (Tier 1), 5 = Low Importance (Tier 5). |
| `is_internet_facing` | `assets.is_internet_facing` (BOOLEAN) | `GET /api/assets/:id/risk-inputs` | `NOT NULL` (Default `false`) | User-Provided / Scanner | Yes (Directly sets Exposure Factor $E$) | If `true`, Exposure Factor $E = 1.0$. If `false`, internal asset ($E = 0.2$). |
| `data_classification` | `assets.data_classification` (VARCHAR) | `GET /api/assets/:id/risk-inputs` | `NOT NULL` (Default `'Internal'`) | User-Provided | Categorical Driver for Data Cost | Valid values: `'Internal'`, `'Public'`, `'Confidential'`, `'Restricted'`, `'PII'`, `'Financial'`. |
| `revenue_dependency_pct` | `assets.revenue_dependency_pct` (NUMERIC(5,2)) | `GET /api/assets/:id/risk-inputs` | `NULL` or `0.00` | User-Provided (% of revenue) | Safe only when provided | If `0.00` or `NULL`, direct revenue interruption cost ($C_{\text{interruption}}$) is zero or `UNKNOWN`. |
| `operational_importance` | `assets.operational_importance` (NUMERIC(5,2)) | `GET /api/assets/:id/risk-inputs` | `NULL` or `1.00` | User-Provided (0.5 to 2.0) | Yes (Weighting coefficient) | Operational weighting multiplier. Default `1.00`. |

---

### 2.4 Security Controls & Posture (`security_controls` & `asset_controls`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `code` | `security_controls.code` (VARCHAR) | `GET /api/controls` | `NOT NULL` | Catalog Catalog Key | Yes (`MFA`, `EDR`, `BACKUP`, `SEGMENTATION`, `PAM`, `ENCRYPTION`, `MONITORING`) | Standardized defensive control catalog codes. |
| `status` | `asset_controls.status` (VARCHAR) | `GET /api/assets/:assetId/controls` | `NOT NULL` (Default `'UNKNOWN'`) | User-Provided / Scanner | Yes (`IMPLEMENTED`, `PARTIAL`, `NOT_IMPLEMENTED`, `UNKNOWN`) | If `'UNKNOWN'`, residual risk mitigation credit is strictly **0%**. Zero assumption of security. |
| `effectiveness_score` | `asset_controls.effectiveness_score` (NUMERIC(3,2)) | `GET /api/assets/:assetId/controls` | `NOT NULL` (Default `0.00`) | User-Provided / Derived | Yes ($s_k \in [0.00, 1.00]$) | If `status = 'UNKNOWN'`, `effectiveness_score` MUST be `0.00`. |
| `default_mitigation_weight` | `security_controls.default_mitigation_weight` (NUMERIC(4,2)) | `GET /api/controls` | `NOT NULL` | Authoritative Baseline | Yes ($w_k \in [0.00, 1.00]$) | Mapped baseline mitigation weight per control type (e.g. MFA = 0.85, EDR = 0.80). |

---

### 2.5 Financial Impact Parameters (`organization_financial_parameters`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hourly_downtime_cost` | `organization_financial_parameters.hourly_downtime_cost` | `GET /api/organizations/:orgId/financial-parameters` | `NULL` Allowed | User-Provided | Safe when `!= NULL` | Used in $C_{\text{downtime}} = \text{Hours} \times \text{Cost/Hr}$. If `NULL`, downtime financial impact is `UNQUANTIFIED`. |
| `hourly_recovery_rate` | `organization_financial_parameters.hourly_recovery_rate` | `GET /api/organizations/:orgId/financial-parameters` | `NULL` Allowed | User-Provided | Safe when `!= NULL` | Used in $C_{\text{recovery}} = \text{IR Hours} \times \text{Rate}$. If `NULL`, recovery impact is `UNQUANTIFIED`. |
| `cost_per_sensitive_record` | `organization_financial_parameters.cost_per_sensitive_record` | `GET /api/organizations/:orgId/financial-parameters` | `NULL` Allowed | User-Provided | Safe when `!= NULL` | Used in $C_{\text{data}} = \text{Exposed Records} \times \text{Cost/Record}$. If `NULL`, data breach cost is `UNQUANTIFIED`. |
| `regulatory_breach_penalty` | `organization_financial_parameters.regulatory_breach_penalty` | `GET /api/organizations/:orgId/financial-parameters` | `NULL` Allowed | User-Provided | Safe when `!= NULL` | Baseline statutory penalty exposure ($C_{\text{regulatory}}$). If `NULL`, penalty cost is `UNQUANTIFIED`. |
| `daily_transaction_volume` | `organization_financial_parameters.daily_transaction_volume` | `GET /api/organizations/:orgId/financial-parameters` | `NULL` Allowed | User-Provided | Safe when `!= NULL` | Financial transaction velocity per day. If `NULL`, assumed `0.00`. |

---

### 2.6 Remediation Action Catalog & Costs (`remediation_actions`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `remediation_actions.id` (UUID) | `GET /api/remediation-actions` | `NOT NULL` | System Generated | Yes | Initiative key for ROSI calculation. |
| `action_type` | `remediation_actions.action_type` | `GET /api/remediation-actions` | `NOT NULL` | User-Provided | Yes (`ENABLE_CONTROL`, `PATCH_CVE`, `SEGMENT_NETWORK`, `REMEDIATE_VULNERABILITY`) | Target intervention category for simulation / optimization. |
| `remediation_cost` | `remediation_actions.remediation_cost` (NUMERIC(18,2)) | `GET /api/remediation-actions` | `NOT NULL` | User-Provided | Yes ($c(i) > 0$) | Direct implementation cost of the security action. Required for ROSI formula $\frac{\Delta EAL - c(i)}{c(i)}$. |
| `estimated_effort_hours` | `remediation_actions.estimated_effort_hours` | `GET /api/remediation-actions` | `NULL` Allowed | User-Provided | Informational / Resource Constraint | Operational hours required for implementation. |
| `target_control_code` | `remediation_actions.target_control_code` | `GET /api/remediation-actions` | `NULL` Allowed | User-Provided | Yes (MFA, EDR, etc.) | Mapped security control to deploy or upgrade. |
| `target_cve_id` | `remediation_actions.target_cve_id` | `GET /api/remediation-actions` | `NULL` Allowed | User-Provided | Yes (CVE-2021-44228, etc.) | Mapped vulnerability to patch. |

---

### 2.7 Asset Dependency Graph (`asset_dependencies`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `source_asset_id` | `asset_dependencies.source_asset_id` | `GET /api/assets/:assetId/dependencies` | `NOT NULL` | User-Provided / CMDB | Yes (Upstream Asset ID) | Preceding system in attack path (e.g. Identity Provider). |
| `target_asset_id` | `asset_dependencies.target_asset_id` | `GET /api/assets/:assetId/dependencies` | `NOT NULL` | User-Provided / CMDB | Yes (Downstream Asset ID) | Dependent system (e.g. Payment Gateway). |
| `dependency_type` | `asset_dependencies.dependency_type` | `GET /api/assets/:assetId/dependencies` | `NOT NULL` (Default `'API'`) | User-Provided | Yes (`IDENTITY`, `DATABASE`, `NETWORK_PATH`, `API`, `PIPELINE`) | Relationship categorization for lateral blast radius. |
| `propagation_weight` | `asset_dependencies.propagation_weight` (NUMERIC(3,2)) | `GET /api/assets/:assetId/dependencies` | `NOT NULL` (Default `0.20`) | User-Provided / Configured | Yes ($\alpha_{\text{dep}} \in [0.1, 0.4]$) | Risk propagation coefficient for lateral compromise. |

---

## 3. Data Completeness Calculation Methodology

Data Completeness Score for an asset ($0.0 \to 1.0$) is computed strictly based on verified non-null configuration:
- Criticality specified (explicit Tier 1-5 vs default): 20%
- Internet facing specified explicitly: 20%
- Data classification assigned: 20%
- Control posture defined (`!= UNKNOWN`): 20%
- Business unit assigned: 20%

If an attribute is `NULL` or default `UNKNOWN`, its completeness component is 0%.
