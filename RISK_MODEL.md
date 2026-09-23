# CyberRiskOS — Risk Quantification & ROSI Formulation Specification

**Document Version:** 1.0  
**Status:** Canonical Reference  
**Mandated by:** PRD Section 6, 7, 10 & 11

---

## 1. Philosophical Principle: Transparent & Deterministic

CyberRiskOS explicitly rejects black-box or purely subjective risk scoring. Machine Learning is not used for financial quantification. Every rupee of modeled exposure is deterministically computed from observable technical telemetry, public threat intelligence, control postures, and organization-provided financial assumptions.

All outputs are presented as:
> **Modeled / Estimated Annual Financial Exposure (EAL)**

rather than guaranteed factual losses.

---

## 2. Core Risk Formulation

The quantification pipeline consists of two orthogonal dimensions:
1. **Annual Incident Likelihood ($P_{incident}$)**: The probability (0.0 to 1.0) that an asset is successfully compromised within a 1-year horizon.
2. **Single Loss Expectancy ($SLE_{asset}$)**: The modeled financial damage incurred if a compromise occurs.

$$\text{Expected Annual Exposure (EAL)} = P_{\text{incident}}(\text{Asset}) \times SLE_{\text{financial}}(\text{Asset})$$

---

## 3. Likelihood Engine ($P_{\text{incident}}$)

Likelihood is calculated per asset as a composite function of threat activity, vulnerability severity, internet exposure, and mitigating control effectiveness:

$$P_{\text{incident}} = \min\left(1.0, \; \text{BaseThreat} \times \text{ExposureFactor} \times \text{VulnFactor} \times (1 - \text{ControlEffectiveness})\right)$$

### 3.1 Factor Definitions

1. **Threat Factor ($T$) $\in [0.1, 1.0]$**:
   - Baseline: $0.2$ (ambient opportunistic scanning)
   - Active exploit in the wild (CISA KEV): $+0.5$
   - Target technology matched in MITRE ATT&CK campaign: $+0.3$

2. **Exposure Factor ($E$) $\in [0.2, 1.0]$**:
   - Internet-facing / Publicly routable: $1.0$
   - Partner / DMZ network: $0.6$
   - Internal isolated network / air-gapped: $0.2$

3. **Vulnerability Factor ($V$) $\in [0.1, 1.0]$**:
   Derived from normalized CVSS v3.1/v4.0 base and exploitability metrics:
   $$V = \max_{v \in \text{AssetVulns}} \left( \frac{\text{CVSS}(v)}{10} \times \omega_{\text{exploit}}(v) \right)$$
   where $\omega_{\text{exploit}} = 1.2$ if weaponized PoC exists or KEV is confirmed.

4. **Control Effectiveness ($C$) $\in [0.0, 0.95]$**:
   Each mapped security control $k$ has a calibrated mitigation weight $w_k$ and status $s_k$:
   - Implemented: $s_k = 1.0$
   - Partially Implemented: $s_k = 0.5$
   - Not Implemented: $s_k = 0.0$

   $$C = 1 - \prod_{k \in \text{Controls}} \left( 1 - (w_k \times s_k) \right)$$
   *(Controls act in depth; residual risk diminishes multiplicatively, capped at 95% maximum mitigation).*

---

## 4. Financial Impact Formulation ($SLE_{\text{financial}}$)

Financial impact is computed using organization-calibrated business variables:

$$SLE = C_{\text{downtime}} + C_{\text{recovery}} + C_{\text{data}} + C_{\text{interruption}} + C_{\text{regulatory}}$$

Where:
- **Downtime Cost ($C_{\text{downtime}}$)**: $\text{Estimated Outage Hours} \times \text{Hourly Revenue Loss}$
- **Recovery Cost ($C_{\text{recovery}}$)**: $\text{Incident Response Hours} \times \text{Blended Hourly Rate} + \text{Forensic/Tooling Costs}$
- **Data Impact ($C_{\text{data}}$)**: $\text{Exposed Sensitive Records} \times \text{Cost per Record (e.g. ₹2,500/record)}$
- **Business Interruption ($C_{\text{interruption}}$)**: Asset Revenue Dependency % $\times$ Daily Transaction Volume $\times$ Days Affected
- **Regulatory / Compliance Exposure ($C_{\text{regulatory}}$)**: Statutory penalties (e.g., RBI / SEBI breach reporting guidelines, DPDP Act penalties).

---

## 5. Organizational Aggregation

For an enterprise with $N$ assets:

$$\text{Total Modeled Enterprise Exposure} = \sum_{i=1}^{N} EAL_i$$

Dependencies propagate blast radius: if an upstream asset (e.g. Identity Service) is compromised, the incident likelihood of dependent downstream assets (e.g. Payment Gateway) increases by a dependency propagation coefficient $\alpha_{\text{dep}} \in [0.1, 0.4]$.

---

## 6. What-If Simulation Engine

In simulation mode, a cloned state $S'$ is evaluated without mutating baseline $S_0$:

$$\Delta \text{Exposure} = \text{Exposure}(S_0) - \text{Exposure}(S')$$

Supported Interventions:
- **Control Implementation**: Toggle control status from `None` $\to$ `Implemented` (e.g. MFA deployed, EDR enabled).
- **Vulnerability Remediation**: Remove or downgrade specific CVEs.
- **Segmentation**: Reduce Exposure Factor $E$ from $1.0$ (Direct Internet) $\to$ $0.4$ (Segmented DMZ).
- **Remediation Delay**: Decay control effectiveness and increase exploit likelihood over $t \in \{7, 30, 60\}$ days:
  $$P_{\text{incident}}(t) = P_{\text{incident}}(0) \times (1 + \lambda_{\text{delay}} \times t)$$

---

## 7. Security Investment Optimization & ROSI

Given an available cybersecurity budget $B \in \mathbb{R}^+$ and a set of candidate security initiatives $I = \{i_1, i_2, \dots, i_m\}$ where each initiative has:
- Cost: $c(i) > 0$
- Target Controls & Assets: $A(i)$
- Modeled Risk Reduction: $\Delta \text{Exposure}(i)$

### 7.1 Optimization Goal
Find the subset $I^* \subseteq I$ that maximizes total risk reduction subject to budget:

$$\max_{I^*} \sum_{i \in I^*} \Delta \text{Exposure}(i) \quad \text{subject to} \quad \sum_{i \in I^*} c(i) \le B$$

The system generates **multiple Pareto-optimal strategies** (e.g. Balanced Strategy A, High-Impact Strategy B, Conservative Strategy C) to provide executive choice.

### 7.2 Return on Security Investment (ROSI)

$$\text{ROSI} = \frac{\Delta \text{Exposure} - \text{Cost of Investment}}{\text{Cost of Investment}} \times 100\%$$

Where:
- $\Delta \text{Exposure} = \text{Baseline Exposure} - \text{Residual Exposure}$
- $\text{Cost of Investment} = \sum_{i \in \text{Strategy}} c(i)$
- $\text{Residual Exposure} = \text{Baseline Exposure} - \Delta \text{Exposure}$

Example:
- Baseline Exposure: ₹4.72 Cr
- Strategy Cost: ₹55 L
- Modeled Exposure Reduction: ₹1.10 Cr
- Residual Exposure: ₹3.62 Cr
- $\text{ROSI} = \frac{₹1.10\text{ Cr} - ₹0.55\text{ Cr}}{₹0.55\text{ Cr}} = 100\%$

---

## 8. Explainability Decomposition

For any asset, the modeled exposure is decomposed into a percentage contribution waterfall:

$$\sum \text{Driver Contributions} = 100\%$$

Drivers include:
1. Critical Unpatched Vulnerability Weight
2. Active CISA KEV Threat Factor
3. Direct Internet Exposure
4. Missing High-Impact Controls (e.g., Lack of MFA / PAM)
5. Business Asset Criticality Tier (Tier 1 vs. Tier 5)
6. Network Blast Radius / Dependency Exposure
