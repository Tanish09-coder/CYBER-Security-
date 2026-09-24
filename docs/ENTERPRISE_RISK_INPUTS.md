# CyberRiskOS — Enterprise Risk Inputs & Financial Context Audit

**Document Version:** 2.0  
**Author / Lead:** HARSH (Enterprise Asset, Software, Control & Exposure Context Lead)  
**Status:** Authoritative Specification & Risk Engine Input Catalog  
**Target Consumers:** TANISH (Risk Engine Lead), NISHIT (Frontend Lead)  

---

## 1. Overview & Philosophical Principles

In CyberRiskOS, **HARSH** owns the storage, validation, provenance, and REST API delivery of all **authoritative internal enterprise inputs**. 

### Boundary Principles:
1. **Harsh Provides Enterprise Context Only**: Stores asset criticality, network exposure, control statuses, financial baseline parameters, remediation action costs, organization budgets, asset relationships, and compliance evidence.
2. **Zero Financial Calculation in Harsh's Domain**: Harsh DOES NOT invent, implement, or execute risk formulas, Annual Exposure (EAL) math, Monte Carlo simulations, ROSI ratios, or knapsack optimizers. Those are exclusively owned by **Tanish** in `risk-engine/`.
3. **Zero Synthetic / Fabricated Defaults**: If an enterprise input (such as hourly downtime cost, remediation cost, or control status) is not explicitly provided by the user or scanner import, it MUST remain `NULL` / `UNKNOWN`. The system MUST NEVER assign fake numbers (e.g. defaulting downtime to $100,000/hr or control effectiveness to 50%).

---

## 2. Complete Enterprise Risk Input Field Audit

Below is the exhaustive field-by-field audit of all enterprise inputs available or created for consumption by Tanish's Risk Engine.

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
| `business_criticality` | `assets.business_criticality` (INTEGER 1..5) | `GET /api/assets/:id` | `NOT NULL` (Default `3`) | User-Provided | Yes (Ordinal Tier 1 to 5) | Explicit user-defined tier. 1 = Mission Critical (Tier 1), 5 = Low Importance (Tier 5). |
| `is_internet_facing` | `assets.is_internet_facing` (BOOLEAN) | `GET /api/assets` | `NOT NULL` (Default `false`) | User-Provided / Scanner | Yes (Directly sets Exposure Factor $E$) | If `true`, Exposure Factor $E = 1.0$. If `false`, internal asset ($E = 0.2$). |
| `data_classification` | `assets.data_classification` (VARCHAR) | `GET /api/assets/:id` | `NOT NULL` (Default `'Internal'`) | User-Provided | Categorical Driver for Data Cost | Valid values: `'Internal'`, `'Public'`, `'Confidential'`, `'Restricted'`, `'PII'`, `'Financial'`. |
| `revenue_dependency_pct` | `assets.revenue_dependency_pct` (NUMERIC(5,2)) | `GET /api/assets/:id` | `NULL` or `0.00` | User-Provided (% of revenue) | Safe only when provided | If `0.00` or `NULL`, direct revenue interruption cost ($C_{\text{interruption}}$) is zero or `UNKNOWN`. |
| `operational_importance` | `assets.operational_importance` (NUMERIC(5,2)) | `GET /api/assets/:id` | `NULL` or `1.00` | User-Provided (0.5 to 2.0) | Yes (Weighting coefficient) | Operational weighting multiplier. Default `1.00`. |

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

### 2.8 Compliance Frameworks & Evidence (`compliance_frameworks`, `compliance_evidence`)

| Field Name | Database Source | API Source | Nullable Semantics | User-Provided vs Derived | Safe for Risk Calculation? | Missing / Unknown Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `framework_code` | `compliance_frameworks.code` | `GET /api/compliance/frameworks` | `NOT NULL` | Standard Catalog | Yes | `NIST_CSF`, `ISO_27001`, `CIS_V8`, `RBI_CSF`, `SEBI_CS` |
| `requirement_code` | `compliance_controls.requirement_code` | `GET /api/compliance/frameworks` | `NOT NULL` | Standard Catalog | Yes | Specific clause (e.g. NIST PR.AC-1, ISO A.9.2.1) |
| `evidence_status` | `compliance_evidence.status` | `GET /api/compliance/evidence` | `NOT NULL` (Default `'PENDING'`) | User-Provided / Audit | Yes (`VERIFIED`, `EXPIRED`, `PENDING`, `REJECTED`) | Status of compliance proof for regulatory reporting. |

---

## 3. Aggregated Enterprise Input Contract for Risk Engine

To enable **Tanish** to retrieve all authoritative enterprise risk inputs in a single deterministic payload without touching Harsh's database tables directly, Harsh exposes:

`GET /api/enterprise-context/risk-inputs/:organizationId`

### API Response Structure:
```json
{
  "organizationId": "a88c7b20-4b1f-4bb9-8fdb-4cc2c3f36025",
  "currency": "USD",
  "financialParameters": {
    "hourlyDowntimeCost": 25000.00,
    "hourlyRecoveryRate": 150.00,
    "costPerSensitiveRecord": 250.00,
    "regulatoryBreachPenalty": 500000.00,
    "dailyTransactionVolume": 1200000.00
  },
  "assets": [
    {
      "assetId": "c39e281b-5201-4475-812e-10884639e1a1",
      "assetName": "Production Payment Gateway 01",
      "assetType": "server",
      "businessUnit": "Digital Banking",
      "criticalityTier": 1,
      "isInternetFacing": true,
      "dataClassification": "Financial",
      "revenueDependencyPct": 45.00,
      "operationalImportanceScore": 1.50,
      "controls": [
        {
          "controlCode": "MFA",
          "status": "IMPLEMENTED",
          "effectivenessScore": 1.00,
          "mitigationWeight": 0.85
        }
      ],
      "upstreamDependencies": [
        "b18e281b-5201-4475-812e-10884639e1a0"
      ]
    }
  ],
  "remediationActions": [
    {
      "actionId": "rem-001",
      "actionType": "ENABLE_CONTROL",
      "title": "Enforce MFA on Administrative Portals",
      "remediationCost": 15000.00,
      "targetControlCode": "MFA",
      "affectedAssetIds": ["c39e281b-5201-4475-812e-10884639e1a1"]
    }
  ]
}
```

---

## 4. Verification & Testing Guarantee

- Zero mock data in production database.
- 100% adherence to explicit nullability and unknown semantics.
- All endpoints fully covered by automated Jest integration tests.
