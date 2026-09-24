# CyberRiskOS — Financial Exposure & Estimated Annualized Loss (EAL) Mathematical Contract
**Document Version**: 1.0.0  
**Phase**: Phase 3 — Financial Exposure / EAL Engine  
**Primary Owner**: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)  
**Secondary Reviewers**: HARSH (Enterprise Context & Financial Inputs Lead), NISHIT (Frontend Lead)  
**Status**: RATIFIED CONTRACT  

---

## 1. Executive Summary & Legal Labeling Mandate

The purpose of this specification is to define the mathematical formulation, input DTOs, factor bounds, and explainability contracts for the **CyberRiskOS Deterministic Financial Exposure & Estimated Annualized Loss (EAL) Engine v1.0.0**.

### 1.1 Strict Labeling Rule
> **MANDATORY LEGAL & COMPLIANCE GUARDRAIL**:
> All financial metrics produced by CyberRiskOS must be explicitly labeled and presented as:
> **`MODELED / ESTIMATED`**
> The platform never claims that modeled figures represent guaranteed actual future loss. All API responses, database persistence rows, and frontend presentations must include `isEstimated: true` and the currency denomination.

### 1.2 Separation of Concerns
$$\text{Technical Flaw Severity (CVSS)} \neq \text{Enterprise Risk Score (0–100)} \neq \text{Financial Exposure (EAL)}$$

- **Technical Severity**: Intrinsic exploitability and impact of a vulnerability in isolation (NIST NVD).
- **Enterprise Risk Score**: Multi-dimensional risk score bounded between 0.0 and 100.0 incorporating asset criticality and perimeter exposure context (Phase 2 Deterministic Risk Model v1).
- **Financial Exposure**: Quantitative monetary estimate (in fiat currency, e.g. USD, EUR, GBP) measuring annualized loss risk based on downtime costs, business interruption, and incident response/recovery costs.

---

## 2. Mathematical Formulation (Financial Model v1.0.0)

Let $A$ denote an enterprise asset, and $V$ denote a vulnerability correlated with $A$.

### 2.1 Single Loss Expectancy ($\text{SLE}$)
The Single Loss Expectancy represents the monetary impact of a single realized security incident affecting the $(A, V)$ pair:

$$\text{SLE} = \text{Primary Loss (Downtime)} + \text{Secondary Loss (Incident Response & Recovery)}$$

#### 2.1.1 Primary Loss (Downtime & Business Interruption)
$$\text{Primary Loss} = H_{\text{outage}} \times R_{\text{downtime}}(A)$$

Where:
1. $H_{\text{outage}}$ is the estimated system downtime duration in hours, determined deterministically from vulnerability flaw characteristics:
   $$H_{\text{outage}} = H_{\text{base}} \times M_{\text{scope}}$$
   - $H_{\text{base}}$ from CVSS Availability Impact:
     - `HIGH`: $24.0\text{ hours}$ (major system outage requiring restore/failover)
     - `LOW`: $4.0\text{ hours}$ (degraded performance / partial service restart)
     - `NONE`: $0.5\text{ hours}$ (investigation, triage, and patch testing window)
   - $M_{\text{scope}}$ from CVSS Scope:
     - `CHANGED`: $1.50\times$ (lateral blast radius beyond vulnerable component)
     - `UNCHANGED`: $1.00\times$ (contained within vulnerable component)

2. $R_{\text{downtime}}(A)$ is the enterprise downtime cost per hour for asset $A$. If configured in enterprise financial inputs, the specific asset rate is used. If not provided, standard model-policy baseline rates apply based on Business Criticality Tier:
   - **Tier 1 (Mission Critical)**: $\$10,000 / \text{hr}$
   - **Tier 2 (High / Sensitive)**: $\$5,000 / \text{hr}$
   - **Tier 3 (Moderate / Standard)**: $\$1,500 / \text{hr}$
   - **Tier 4 (Low / Internal)**: $\$500 / \text{hr}$
   - **Tier 5 (Minimal / Ephemeral)**: $\$100 / \text{hr}$

#### 2.1.2 Secondary Loss (Incident Response, Forensics & Recovery)
$$\text{Secondary Loss} = C_{\text{recovery}}(A) \times M_{\text{threat}}$$

Where:
1. $C_{\text{recovery}}(A)$ is the baseline incident triage and system restoration cost. Default baseline is $\$25,000$.
2. $M_{\text{threat}}$ is the threat intelligence recovery scalar:
   - If $V.\text{known\_ransomware\_campaign\_use} = \text{'Known'}$: $M_{\text{threat}} = 3.0\times$ (reflecting forensic remediation, extortion response, and clean-room rebuild expenses: $\$75,000$).
   - Otherwise: $M_{\text{threat}} = 1.0\times$ ($\$25,000$).

$$\text{SLE} = \text{round}(\text{Primary Loss} + \text{Secondary Loss}, 2)$$

---

### 2.2 Annual Loss Event Frequency ($\text{ALEF}$) & Defensibility Guardrails

The Annual Loss Event Frequency represents the estimated statistical rate of occurrence per year for an incident exploiting $(A, V)$.

#### 2.2.1 Mandatory Audit Rule on Probability Derivation
> **AUDIT GUARDRAIL: NO FABRICATED FREQUENCIES**
> CyberRiskOS **strictly prohibits deriving breach or loss probability from**:
> - Raw CVSS scores (e.g., $(\text{CVSS} / 10) \times 0.20$)
> - Continuous Risk Scores (0–100)
> - CISA KEV membership flags
> - Arbitrary percentage heuristics (e.g., MFA = -30%)
> 
> *Rationale*: Technical severity metrics and threat indicators do not constitute statistical probability distributions. Synthesizing pseudo-probabilities from technical flaw severity lacks empirical validation and violates quantitative risk management standards (FAIR, ISO 27005).

#### 2.2.2 Source, Range, and Units
1. **Source Authority**:
   - `ALEF` must be **user-provided** or **telemetry-derived** (e.g., historical enterprise incident telemetry or calibrated industry loss data such as VERIS/VCDB).
   - Provided via the `annualizedLossEventFrequency` attribute on the asset or vulnerability schema.
2. **Annualized Nature**:
   - Rate is strictly annualized, measured in units of **events per year** ($\text{yr}^{-1}$).
3. **Valid Range**:
   - Real number: $\text{ALEF} \ge 0.0\text{ events/year}$.

#### 2.2.3 Missing Data & Null Behavior (`EAL = NOT_AVAILABLE`)
If no defensible annualized loss event frequency input exists:
- The engine **refuses to fabricate** an artificial frequency or EAL figure.
- **Single Loss Expectancy ($\text{SLE}$)**, **Primary Loss (downtime)**, and **Secondary Loss (recovery)** remain fully computed and presented.
- Financial output fields are set to:
  $$\text{ALEF} = \text{null}$$
  $$\text{EAL} = \text{null}$$
  $$\text{ealStatus} = \text{'NOT\_AVAILABLE'}$$
- A structured warning is appended: `ANNUAL_LOSS_EVENT_FREQUENCY_UNSPECIFIED`.
- Explanations in the factor breakdown clearly explain why EAL is not available and cite the missing empirical telemetry input.

---

### 2.3 Estimated Annualized Loss ($\text{EAL}$)
When an empirical, defensible $\text{ALEF}$ is available ($\text{ALEF} \ge 0.0$), Estimated Annualized Loss is computed as:

$$\text{EAL} = \text{round}(\text{ALEF} \times \text{SLE}, 2)$$
$$\text{ealStatus} = \text{'CALCULATED'}$$

---

## 3. Factor Explainability & Provenance Schema

Every financial evaluation produces a structured factor breakdown array explaining each component:
1. `DOWNTIME_OUTAGE_HOURS`: Estimated downtime hours derived from CVSS Availability and Scope.
2. `HOURLY_DOWNTIME_RATE`: Applicable hourly downtime cost based on asset criticality tier.
3. `PRIMARY_DOWNTIME_LOSS`: Total primary downtime monetary loss ($\text{Hours} \times \text{Rate}$).
4. `SECONDARY_RECOVERY_COST`: Incident recovery and response cost including ransomware multipliers.
5. `SINGLE_LOSS_EXPECTANCY`: Total modeled loss for a single breach event ($\text{Primary} + \text{Secondary}$).
6. `ANNUAL_EVENT_FREQUENCY`: Estimated annual event frequency ($\text{ALEF}$) derived from exploitability, KEV weaponization, and exposure.
7. `ESTIMATED_ANNUALIZED_LOSS`: Final annualized financial exposure ($\text{ALEF} \times \text{SLE}$).

---

## 4. Cryptographic Provenance & Model Versioning

- **Model Version**: Fixed at `"1.0.0"`.
- **Input Provenance Hash**: SHA-256 hex digest of the canonical normalized JSON evaluation payload.
- **Cache Staleness Rule**: Same inputs + same model version returns cached financial result. If downtime rate, recovery cost, CVSS, KEV status, or criticality changes, hash invalidates and engine recomputes.
