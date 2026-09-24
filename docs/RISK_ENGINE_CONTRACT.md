# CyberRiskOS — Risk Engine v1.0.0 Mathematical Contract & Input Specification
**Document Version**: 1.0.0 (Post-Audit Defensibility Correction)  
**Phase**: Phase 2 — Risk Quantification  
**Primary Owner**: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)  
**Secondary Reviewers**: HARSH (Enterprise Context Lead), NISHIT (Frontend Lead)  
**Status**: RATIFIED & DEFENSIBLE CONTRACT

---

## 1. Executive Summary & Purpose

The purpose of this specification is to define the mathematical formulation, factor defensibility audit, data transfer objects (DTOs), and explainability contracts for **CyberRiskOS Deterministic Risk Model v1**.

### Core Tenet: Technical Severity $\neq$ Enterprise Risk
A raw vulnerability metric such as CVSS (Common Vulnerability Scoring System) quantifies the intrinsic technical severity of a flaw under idealized, isolated conditions. It does not measure enterprise risk:
- A CVSS 9.8 flaw on an isolated, non-critical sandbox workstation with no sensitive data carries vastly different enterprise risk than the same CVSS 9.8 flaw on a Tier 1 core banking transactional database.
- A CVSS 7.5 vulnerability with active weaponization and exploitation in the wild (cataloged in CISA KEV) poses higher immediate real-world likelihood than an unexploited CVSS 9.0 vulnerability.
- **Auditing Rule**: Arbitrary multipliers and invented breach probabilities violate corporate audit standards and undermine C-suite credibility. All quantitative factors must be rigorously classified, defended, and documented.

Risk Model v1 establishes an **empirical, deterministic, explainable, and versioned (`v1.0.0`)** methodology for computing enterprise risk scores bounded strictly between **0.0 and 100.0**.

---

## 2. Atomic Evaluation Entity

The fundamental atomic evaluation unit of Risk Model v1 is the tuple:

$$\text{Evaluation Entity} = (\text{asset\_id}, \text{vulnerability\_id})$$

### Rationale:
1. **No Conflation**: Evaluating risk solely at the "asset" level obscures which specific vulnerability drives exposure. Evaluating risk solely at the "vulnerability" level ignores which specific business systems are exposed.
2. **Actionable Remediation**: Security teams patch or isolate specific vulnerabilities on specific assets. The atomic $(A, V)$ pair directly maps to remediation actions.
3. **Asset Posture Rollup**: An asset's overall risk posture is deterministically aggregated from the set of active $(A, V_i)$ pairs associated with it through verified software/CPE matches.

---

## 3. Factor Defensibility & Non-Arbitrary Audit

In compliance with the CyberRiskOS Master Modeling Guardrails, candidate factors were subjected to a rigorous audit across five mandatory criteria:
1. **Source Authority & Provenance**: Is the data sourced from authoritative official catalogs or verified enterprise inventories?
2. **Semantic Meaning**: What does the factor actually measure?
3. **Defensibility**: Can the numerical treatment be defended to an external auditor or board?
4. **Quantitative Treatment**: How does it enter the mathematical formula?
5. **Null / Missing Data Behavior**: What happens when this input is absent?

### 3.1 Detailed Audit of Proposed Numerical Constants

#### Audit 1: Proposed CISA KEV Multiplier ($1.30\times$)
- **Why Quantitatively Evaluated**: CISA KEV provides empirical proof that a vulnerability is actively exploited in the wild by threat actors.
- **Exact Source / Methodology**: Official US DHS / CISA Known Exploited Vulnerabilities catalog feed ingested with SHA-256 provenance.
- **Why Was 1.30 Proposed?**: It was an initial candidate design assumption representing a $+30\%$ likelihood/threat uplift.
- **Classification**: **MODEL DESIGN ASSUMPTION (Not Empirically Validated)**. CISA provides binary evidence of active exploitation, but publishes *no mathematical multipliers*. Applying an arbitrary $+30\%$ to technical severity is statistically indefensible.
- **Sensitivity Implications**: Applying $1.30\times$ would arbitrarily inflate CVSS 7.7 to 100.0 without empirical justification.
- **Audit Decision**: **REMOVED AS NUMERICAL MULTIPLIER**. KEV membership is retained in `RiskEvaluationInputDTO` and explainability outputs as **Authoritative Exploitation Evidence**. In Risk Model v1, a minimum risk-level rule is enforced explicitly as a **CYBERRISKOS MODEL-POLICY RULE**:
  - CISA KEV provides authoritative evidence that a vulnerability is known to have been exploited in the wild.
  - CISA does **NOT** prescribe CyberRiskOS risk score bands or a `MEDIUM`/`HIGH` severity floor.
  - The resulting severity-floor treatment (an actively exploited CVE cannot be ranked `LOW`, elevating to at least `MEDIUM`, or `HIGH` if base CVSS $\ge 7.0$) is a **CyberRiskOS modeling decision**.
  - It is deterministic, versioned (`v1.0.0`), and is not a CISA-prescribed numerical rule.
  - Continuous likelihood quantification is deferred to Phase 3 financial modeling where empirical incident distributions (VCDB) provide defensible loss frequencies.

#### Audit 2: Proposed Internet Exposure Multiplier ($1.25\times$)
- **Why Quantitatively Evaluated**: Public network accessibility expands the attack surface to automated scanning and external threat actors.
- **Exact Source / Methodology**: Enterprise asset registry network topology flag (`is_internet_facing: boolean`).
- **Why Was 1.25 Proposed?**: An initial candidate design assumption representing a $+25\%$ attack surface expansion.
- **Classification**: **MODEL DESIGN ASSUMPTION (Not Standards-Derived)**. While network exposure increases opportunistic probe volume, assigning an arbitrary $+25\%$ scalar directly to technical severity lacks empirical validation.
- **Sensitivity Implications**: Disproportionately penalizes edge assets regardless of firewall protections or whether the flaw is locally vs remotely exploitable.
- **Audit Decision**: **REMOVED AS NUMERICAL MULTIPLIER**. Retained in `RiskEvaluationInputDTO` and explainability output as **Perimeter Attack Surface Context**. When `is_internet_facing = true`, the engine emits structured factor explanation and appends the `INTERNET_FACING_PERIMETER` risk flag.

#### Audit 3: Asset Criticality Consequence Weights ($0.60$ to $1.40$)
- **Why Quantitatively Included**: Standard risk theory (NIST SP 800-30r1, ISO 27005) establishes that:
  $$\text{Enterprise Risk} = f(\text{Vulnerability Flaw Severity}, \text{Asset Business Consequence})$$
  Without asset consequence, enterprise risk collapses back to technical flaw severity (CVSS), which directly violates the core principle: "CVSS is NOT enterprise risk."
- **Exact Source / Methodology**: Enterprise Asset Inventory Business Criticality Tier ($1$ to $5$), formally assigned by departmental business unit owners and system custodians.
- **Exact Values Chosen**:
  - Tier 1 (Mission Critical / Core Banking): $1.40$ ($+40\%$ consequence uplift)
  - Tier 2 (High / Business Sensitive): $1.20$ ($+20\%$ consequence uplift)
  - Tier 3 (Moderate / Operational Standard): $1.00$ ($0\%$ baseline reference)
  - Tier 4 (Low / Non-Critical Internal): $0.80$ ($-20\%$ consequence reduction)
  - Tier 5 (Minimal / Ephemeral Lab): $0.60$ ($-40\%$ consequence reduction)
- **Why These Specific Values Were Chosen**: A symmetrical, linear policy construct centered on Tier 3 (1.00) with a uniform step size of $\pm 0.20$ per tier. It bounds the maximum business consequence delta to $\pm 40\%$ of technical severity, preventing consequence weighting from completely obliterating technical flaw signals.
- **Sensitivity Implications**:
  - A CVSS 7.0 flaw ($S_{\text{tech}} = 70.0$):
    - Tier 1 asset: $70.0 \times 1.40 = 98.0$ (`CRITICAL` enterprise risk)
    - Tier 2 asset: $70.0 \times 1.20 = 84.0$ (`HIGH` enterprise risk)
    - Tier 3 asset: $70.0 \times 1.00 = 70.0$ (`HIGH` enterprise risk)
    - Tier 4 asset: $70.0 \times 0.80 = 56.0$ (`MEDIUM` enterprise risk)
    - Tier 5 asset: $70.0 \times 0.60 = 42.0$ (`MEDIUM` enterprise risk)
- **Honest Classification**: **EXPLICIT MODEL-POLICY CONSTRUCT (Organizational Consequence Scalar)**.
  - *Audit Label*: This is NOT an empirical physical constant. It is explicitly labeled and documented as an **organizational model-policy assumption** that maps discrete organizational consequence tiers to a bounded mathematical weight.

#### Audit 4: Proposed Security Controls Reductions
- **Audit Decision**: **RETAINED CONTEXTUAL-ONLY**. No validated quantitative reduction percentages exist for individual controls in isolation. Controls are audited and listed in the factor explainability breakdown (`SECURITY_CONTROLS_POSTURE`) and contribute to compensating control flags, but do **NOT** mathematically reduce the score in Model v1.

#### Audit 5: Proposed Ransomware Campaign Multipliers
- **Audit Decision**: **RETAINED CONTEXTUAL-ONLY**. CISA KEV ransomware evidence is empirical threat intel. In Model v1, it generates the `RANSOMWARE_CAMPAIGN_ASSOCIATED` risk flag and sets a severity floor of at least `HIGH` if actively exploited in the wild, but injects **zero arbitrary numerical multipliers**.

---

### Factor Audit Summary Table

| Candidate Factor | Source Authority | Classification | Defensibility Assessment | Treatment in Risk Model v1 |
| :--- | :--- | :--- | :--- | :--- |
| **CVSS Base Score** | NIST NVD (FIRST.org) | **STANDARDS_DERIVED** | Internationally accepted technical flaw metric. | Base Technical Severity ($S_{\text{tech}} = \text{CVSS} \times 10.0 \in [0, 100]$). |
| **Asset Criticality Tier** | Enterprise Asset Registry (Tiers 1–5) | **EXPERT_POLICY_CONSTRUCT** | Required consequence dimension ($\text{Risk} = \text{Severity} \times \text{Consequence}$). | Bounded linear consequence scalar ($W_{\text{crit}} \in [0.60, 1.40]$). Documented policy assumption. |
| **CISA KEV Exploitation** | US DHS / CISA KEV | **EMPIRICAL_EVIDENCE** | Authoritative empirical evidence of active weaponization. | **Qualitative Severity Floor & Risk Flag**. Zero arbitrary numerical multipliers. |
| **CISA KEV Ransomware** | US DHS / CISA KEV | **EMPIRICAL_EVIDENCE** | Authoritative empirical evidence of ransomware playbook use. | **Contextual Threat Tag & Severity Floor**. Zero arbitrary numerical multipliers. |
| **Internet Exposure** | Enterprise Network Topology | **EXPOSURE_CONTEXT** | Attack surface reachability context. | **Contextual Explainability & Risk Flag**. Zero arbitrary numerical multipliers. |
| **Security Controls** | Enterprise Controls Catalog | **DEFENSIVE_CONTEXT** | Defensive posture audit (MFA, EDR, Backups, etc.). | **Compensating Controls Context**. Zero arbitrary percentage deductions. |

---

## 4. Mathematical Formulation (Risk Model v1.0.0)

Let $A$ denote an enterprise asset, and $V$ denote a vulnerability affecting $A$.

### Step 1: Baseline Technical Severity ($S_{\text{tech}}$)
$$S_{\text{tech}} = \begin{cases} 
\text{CVSS}_{\text{base}} \times 10.0 & \text{if } \text{CVSS}_{\text{base}} \text{ is valid and present} \\
0.0 & \text{if } \text{CVSS}_{\text{base}} \text{ is null (generates structured warning)}
\end{cases}$$

where $S_{\text{tech}} \in [0.0, 100.0]$.

### Step 2: Enterprise Consequence Weight ($W_{\text{crit}}$)
Monotonic model-policy consequence scalar derived from the asset's business criticality tier:

$$W_{\text{crit}} = \begin{cases} 
1.40 & \text{if Criticality Tier} = 1 \text{ (Mission Critical)} \\
1.20 & \text{if Criticality Tier} = 2 \text{ (High)} \\
1.00 & \text{if Criticality Tier} = 3 \text{ (Moderate / Baseline)} \\
0.80 & \text{if Criticality Tier} = 4 \text{ (Low)} \\
0.60 & \text{if Criticality Tier} = 5 \text{ (Minimal)} 
\end{cases}$$

*(If asset criticality tier is missing or null, default baseline of $1.00$ is applied and `MISSING_ASSET_CRITICALITY` warning is recorded).*

### Step 3: Unclamped Enterprise Risk Score ($R_{\text{raw}}$)
$$R_{\text{raw}} = S_{\text{tech}} \times W_{\text{crit}}$$

### Step 4: Final Bounded Score Calculation ($R$)
The final enterprise risk score is rounded to two decimal places and strictly bounded between $0.00$ and $100.00$:

$$R = \min\left(100.0, \max\left(0.0, \text{round}(R_{\text{raw}}, 2)\right)\right)$$

### Step 5: Qualitative Severity Band Mapping & CyberRiskOS Model-Policy Floor Rules

The score is mapped to a standard enterprise severity tier:

| Calculated Score Range ($R$) | Baseline Severity Band | Definition |
| :--- | :--- | :--- |
| **0.00 – 39.99** | `LOW` | Minimal business risk; routine patching lifecycle. |
| **40.00 – 69.99** | `MEDIUM` | Moderate exposure; schedule within standard maintenance window. |
| **70.00 – 89.99** | `HIGH` | Elevated enterprise risk; prioritize accelerated remediation. |
| **90.00 – 100.00** | `CRITICAL` | Severe enterprise risk; immediate containment or emergency patch. |

#### CyberRiskOS Model-Policy Floor Rules:
> **Explicit Policy Rule Definition**: CISA KEV provides authoritative evidence that a vulnerability is known to have been exploited in the wild. CISA does **NOT** prescribe CyberRiskOS risk score bands or a `MEDIUM`/`HIGH` floor. The resulting severity-floor treatment is an explicit **CYBERRISKOS MODEL-POLICY RULE**:
> - KEV is the authoritative evidence input.
> - The resulting severity-floor treatment is a CyberRiskOS modeling decision.
> - It is deterministic and versioned (`v1.0.0`).
> - It is not a CISA-prescribed numerical rule.

1. **Model-Policy Active Exploitation Floor**: If $V.\text{is\_known\_exploited} = \text{true}$ (CISA KEV active):
   - Severity cannot be `LOW`. If $R < 40.0$, the qualitative severity is elevated to `MEDIUM`.
   - If $S_{\text{tech}} \ge 70.0$, the qualitative severity is elevated to at least `HIGH`.
   - Appends risk flag: `CISA_KEV_ACTIVE_EXPLOITATION`.
2. **Model-Policy Ransomware Campaign Floor**: If $V.\text{known\_ransomware\_campaign\_use} = \text{'Known'}$:
   - Appends risk flag: `RANSOMWARE_CAMPAIGN_ASSOCIATED`.
   - If also actively exploited in the wild, severity is guaranteed a minimum floor of `HIGH`.
3. **Perimeter Exposure Flag**: If $A.\text{is\_internet\_facing} = \text{true}$:
   - Appends risk flag: `INTERNET_FACING_PERIMETER`.

---

## 5. Explainability Breakdown Schema

Every risk calculation must produce a structured explainability factor breakdown array. Black-box scores are prohibited.

Each factor item conforms to:
```typescript
interface FactorExplanationDTO {
  name: string;
  category: 'TECHNICAL_SEVERITY' | 'THREAT_INTEL' | 'BUSINESS_CONTEXT' | 'DEFENSIVE_POSTURE';
  value: string | number | boolean | null;
  weight: number;
  contribution: number; // Signed delta on base technical score
  rationale: string;
}
```

### Standard Factors Emitted:
1. `CVSS_TECHNICAL_SEVERITY`:
   - Category: `TECHNICAL_SEVERITY`
   - Weight: $1.00$
   - Contribution: $+S_{\text{tech}}$
   - Rationale: "Intrinsic technical flaw severity from NIST NVD (CVSS X.X)."
2. `ASSET_CRITICALITY_CONSEQUENCE`:
   - Category: `BUSINESS_CONTEXT`
   - Weight: $W_{\text{crit}}$
   - Contribution: $R - S_{\text{tech}}$ (signed difference showing consequence adjustment)
   - Rationale: "Tier X asset consequence scaling (Model-Policy Construct: weight Y.YY)."
3. `CISA_KEV_EXPLOITATION_EVIDENCE`:
   - Category: `THREAT_INTEL`
   - Weight: $0.00$ (evidence flag)
   - Contribution: $0.00$ (governs severity floor and prioritization)
   - Rationale: "Empirical proof of active exploitation in the wild cataloged by CISA."
4. `CISA_KEV_RANSOMWARE_EVIDENCE`:
   - Category: `THREAT_INTEL`
   - Weight: $0.00$
   - Contribution: $0.00$
   - Rationale: "Verified association with ransomware campaigns."
5. `PERIMETER_EXPOSURE_CONTEXT`:
   - Category: `BUSINESS_CONTEXT`
   - Weight: $0.00$
   - Contribution: $0.00$
   - Rationale: "Asset is directly accessible from public Internet networks."
6. `SECURITY_CONTROLS_POSTURE`:
   - Category: `DEFENSIVE_POSTURE`
   - Weight: $0.00$
   - Contribution: $0.00$
   - Rationale: "Active compensating controls evaluated; no arbitrary percentage offset applied in Model v1."

---

## 6. Data Completeness & Missing Data Protocol

### Completeness Score Calculation:
$$\text{Completeness} = \frac{\sum_{i=1}^{k} \text{PresentField}_i}{k} \quad \in [0.0, 1.0]$$

Evaluated across four primary inputs ($k = 4$):
1. CVSS Base Score provided
2. Asset Criticality Tier provided
3. Asset Internet Exposure status provided
4. Security controls posture recorded (at least 1 known control record)

### Missing Data Warnings:
The engine generates explicit structured warning strings:
- `MISSING_CVSS_SCORE`: CVSS score missing; baseline treated as 0.0.
- `MISSING_ASSET_CRITICALITY`: Criticality missing; default Tier 3 (1.00) applied.
- `MISSING_EXPOSURE_STATUS`: Exposure missing; default internal (false) applied.
- `INCOMPLETE_CONTROLS_DATA`: No controls recorded for asset.

---

## 7. Cryptographic Provenance & Versioning

To guarantee auditability and repeatability:
1. **Model Version**: Every result includes `modelVersion: "1.0.0"`.
2. **Provenance Hash**: Every result includes `provenanceHash: string` (SHA-256 hex digest of the canonical normalized input payload).
   $$\text{Provenance Hash} = \text{SHA-256}(\text{CanonicalJSON}(\text{InputDTO}))$$
3. Identical inputs must yield identical output scores and identical provenance hashes across all runtimes (Node.js and Python).

### 7.1 Cache Staleness & Evaluation Invalidation Protocol

A persisted risk calculation result in the `risk_results` table must **NOT** be treated as permanently current.

A previously persisted evaluation result becomes **stale** whenever any underlying evaluation input or the risk calculation model version changes:
1. **CVSS / Vulnerability Source Modification**: Any update to the base CVSS score or technical severity metrics in NVD.
2. **CISA KEV Membership Change**: Vulnerability added to or updated within the CISA Known Exploited Vulnerabilities catalog.
3. **Asset Criticality Change**: Organizational update to the asset's assigned business criticality tier ($1$ through $5$).
4. **Internet Exposure Change**: Network topology modification toggling `is_internet_facing`.
5. **Control State Change**: Addition, removal, or status transition of compensating security controls associated with the asset.
6. **Model Version Change**: Upgrades to the risk engine calculation algorithms (e.g. from `1.0.0` to `2.0.0`).

#### Deterministic Cache Validation Rule:
- **Canonical Input Provenance Hash**: A SHA-256 hash computed over the canonically sorted JSON representation of the normalized evaluation inputs.
- **Cache Hit Condition**: A persisted risk result is valid and fresh **if and only if**:
  $$\text{persisted.asset\_id} = \text{input.asset\_id} \quad \land \quad \text{persisted.cve\_id} = \text{input.cve\_id} \quad \land \quad \text{persisted.input\_provenance\_hash} = \text{computed\_input\_hash} \quad \land \quad \text{persisted.model\_version} = \text{current\_model\_version}$$
- **Cache Miss / Invalidation Condition**: If the computed `input_provenance_hash` differs from the persisted hash, or if `model_version` differs, the cached result is stale. The backend orchestration service **MUST** trigger a fresh evaluation via the Python Risk Engine and update the persisted record with the newly computed score, factors, provenance hash, and updated timestamp.
- **Auditing Integrity**: A cached result must never be claimed as current if its source inputs or model version have changed.

---

## 8. Data Transfer Object (DTO) Contracts

### 8.1 TypeScript Schema (`backend/src/modules/risk/risk.types.ts`)

```typescript
export interface ControlContextDTO {
  controlCode: string;
  status: 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED' | 'UNKNOWN';
  source?: 'USER_CONFIG' | 'SCANNER_IMPORT' | 'AUDIT_VERIFIED';
}

export interface VulnerabilityRiskInputDTO {
  cveId: string;
  cvssScore: number | null;
  cvssVersion?: string | null;
  isKnownExploited: boolean;
  knownRansomwareCampaignUse?: string | null;
  sourceIdentifier?: string | null;
}

export interface AssetRiskInputDTO {
  assetId: string;
  assetName: string;
  criticalityTier: 1 | 2 | 3 | 4 | 5;
  isInternetFacing: boolean;
  businessUnitId?: string | null;
  businessUnitName?: string | null;
  controls?: ControlContextDTO[];
}

export interface RiskEvaluationInputDTO {
  asset: AssetRiskInputDTO;
  vulnerability: VulnerabilityRiskInputDTO;
}

export interface FactorExplanationDTO {
  name: string;
  category: 'TECHNICAL_SEVERITY' | 'THREAT_INTEL' | 'BUSINESS_CONTEXT' | 'DEFENSIVE_POSTURE';
  value: string | number | boolean | null;
  weight: number;
  contribution: number;
  rationale: string;
}

export interface RiskEvaluationResultDTO {
  assetId: string;
  assetName: string;
  cveId: string;
  baseCvss: number | null;
  riskScore: number; // 0.00 to 100.00
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: FactorExplanationDTO[];
  missingDataWarnings: string[];
  dataCompletenessScore: number; // 0.0 to 1.0
  riskFlags: string[];
  modelVersion: string; // "1.0.0"
  provenanceHash: string;
  evaluatedAt: string;
}

export interface BatchRiskEvaluationInputDTO {
  evaluations: RiskEvaluationInputDTO[];
}

export interface BatchRiskEvaluationResultDTO {
  results: RiskEvaluationResultDTO[];
  totalEvaluated: number;
  modelVersion: string;
}
```

### 8.2 Python Pydantic Schema (`risk-engine/app/schemas/risk_input.py`)

```python
from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

class ControlStatus(str, Enum):
    IMPLEMENTED = "IMPLEMENTED"
    PARTIAL = "PARTIAL"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    UNKNOWN = "UNKNOWN"

class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class FactorCategory(str, Enum):
    TECHNICAL_SEVERITY = "TECHNICAL_SEVERITY"
    THREAT_INTEL = "THREAT_INTEL"
    BUSINESS_CONTEXT = "BUSINESS_CONTEXT"
    DEFENSIVE_POSTURE = "DEFENSIVE_POSTURE"

class ControlContextSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    control_code: str = Field(..., alias="controlCode", min_length=1)
    status: ControlStatus
    source: Optional[str] = None

class VulnerabilityRiskInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    cve_id: str = Field(..., alias="cveId", min_length=1)
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0, alias="cvssScore")
    cvss_version: Optional[str] = Field(None, alias="cvssVersion")
    is_known_exploited: bool = Field(False, alias="isKnownExploited")
    known_ransomware_campaign_use: Optional[str] = Field(None, alias="knownRansomwareCampaignUse")
    source_identifier: Optional[str] = Field(None, alias="sourceIdentifier")

    @field_validator("cve_id")
    @classmethod
    def validate_cve_id(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if not v_upper.startswith("CVE-"):
            raise ValueError(f"Invalid CVE identifier format: {v}")
        return v_upper

class AssetRiskInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId", min_length=1)
    asset_name: str = Field(..., alias="assetName", min_length=1)
    criticality_tier: int = Field(3, ge=1, le=5, alias="criticalityTier")
    is_internet_facing: bool = Field(False, alias="isInternetFacing")
    business_unit_id: Optional[str] = Field(None, alias="businessUnitId")
    business_unit_name: Optional[str] = Field(None, alias="businessUnitName")
    controls: List[ControlContextSchema] = Field(default_factory=list)

class RiskEvaluationInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset: AssetRiskInputSchema
    vulnerability: VulnerabilityRiskInputSchema

class FactorExplanationSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    category: FactorCategory
    value: Any
    weight: float
    contribution: float
    rationale: str

class RiskEvaluationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId")
    asset_name: str = Field(..., alias="assetName")
    cve_id: str = Field(..., alias="cveId")
    base_cvss: Optional[float] = Field(None, ge=0.0, le=10.0, alias="baseCvss")
    risk_score: float = Field(..., ge=0.0, le=100.0, alias="riskScore")
    severity: RiskSeverity
    factors: List[FactorExplanationSchema]
    missing_data_warnings: List[str] = Field(default_factory=list, alias="missingDataWarnings")
    data_completeness_score: float = Field(..., ge=0.0, le=1.0, alias="dataCompletenessScore")
    risk_flags: List[str] = Field(default_factory=list, alias="riskFlags")
    model_version: str = Field("1.0.0", alias="modelVersion")
    provenance_hash: str = Field(..., alias="provenanceHash", min_length=64, max_length=64)
    evaluated_at: str = Field(..., alias="evaluatedAt")

class BatchRiskEvaluationInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    evaluations: List[RiskEvaluationInputSchema] = Field(..., min_length=1, max_length=500)

class BatchRiskEvaluationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    results: List[RiskEvaluationResultSchema]
    total_evaluated: int = Field(..., ge=0, alias="totalEvaluated")
    model_version: str = Field("1.0.0", alias="modelVersion")
```

---

## 9. Phase 2 REST API Surface

| Endpoint | Method | Owner | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/risk/evaluate` | POST | Tanish | Evaluate single $(A, V)$ pair on demand | Spec Defined |
| `/api/risk/evaluate/batch` | POST | Tanish | Batch evaluation of $(A_i, V_j)$ pairs | Spec Defined |
| `/api/risk/scores` | GET | Tanish | Query persisted/cached risk scores with filters | Spec Defined |
| `/api/risk/assets/:assetId` | GET | Tanish | Get aggregated risk profile for an asset | Spec Defined |
| `/api/risk/vulnerabilities/:cveId` | GET | Tanish | Get asset impact distribution for a CVE | Spec Defined |

---

## 10. Audit Sign-off

- [x] Evaluates atomic unit $(A, V)$ directly.
- [x] Zero invented breach probabilities.
- [x] Zero arbitrary control effectiveness percentage subtractions.
- [x] Zero arbitrary ransomware multipliers.
- [x] Zero arbitrary CISA KEV multipliers (KEV used as empirical evidence and severity floor).
- [x] Zero arbitrary internet exposure multipliers (exposure used as perimeter context).
- [x] Asset criticality weights ($0.60$ to $1.40$) explicitly audited and labeled as **EXPERT_POLICY_CONSTRUCT (Model-Policy Assumption)**.
- [x] Zero LLM-generated risk scores (all scoring is deterministic).
- [x] Fully versioned (`v1.0.0`) and cryptographically hashed.

---

## 11. What-If Scenario Calculation & Consistency Semantics (Phase 4 Consistency Audit)

### 11.1 Zero Database Mutation Sandbox
What-If simulation operates in an isolated in-memory sandbox without committing changes to PostgreSQL.

### 11.2 Consistency Across Action Types Under Risk Model v1
| Scenario Action Type | Posture Modification | Mathematical Impact (Risk Model v1) | Attribution Rationale |
| :--- | :--- | :--- | :--- |
| `PATCH_VULNERABILITY` | Remediates matching $(A, V)$ pair(s) from simulated inventory. | $\Delta \text{Risk} < 0$, $\Delta \text{EAL} < 0$ | Direct flaw remediation eliminates active flaw exposure from the modeled portfolio. Attributed delta equals the baseline flaw's risk score and baseline EAL. |
| `IMPLEMENT_CONTROL` | Updates asset control status (`IMPLEMENTED`) and triggers `COMPENSATING_CONTROLS_ACTIVE`. | $\Delta \text{Risk} = 0.0$, $\Delta \text{EAL} = 0.0$ | Controls are contextual-only in Model v1. Without an empirical, validated quantitative effectiveness model, no arbitrary percentages (e.g. MFA = 30%, EDR = 25%) may be deducted. |
| `ISOLATE_ASSET` | Sets `isInternetFacing = false`. | $\Delta \text{Risk} = 0.0$, $\Delta \text{EAL} = 0.0$ | Internet exposure multiplier was removed in Risk Model v1 as an arbitrary scalar. Perimeter defense context is updated, but continuous score delta remains 0.0. |
| `DECOMMISSION_ASSET` | Removes asset from the active portfolio. | Asset flaws eliminated from modeled exposure; portfolio re-averaged across remaining active assets. | Explicit distinction: the asset is retired and removed from modeled portfolio exposure, rather than risk score magically becoming zero. |

### 11.3 Scenario Simulation Presets
- **`PRESET-PATCH-KEV`**: Simulates remediating all actively exploited CISA KEV vulnerabilities. Produces quantitative continuous risk score and EAL reductions.
- **`PRESET-MFA-TIER1`**: Simulates deploying MFA controls across Tier-1 systems. Formally labeled as qualitative context enhancement with 0.0 arbitrary quantitative score discount.
- **`PRESET-ISOLATE-EDGE`**: Simulates revoking direct internet ingress for edge appliances. Formally labeled as qualitative perimeter isolation with 0.0 continuous score delta.
