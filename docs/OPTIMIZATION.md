# CyberRiskOS — Investment Optimization & Return on Security Investment (ROSI) Mathematical Specification
**Document Version**: 1.0.0  
**Phase**: Phase 5 — Investment Optimization + ROSI  
**Primary Owner**: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)  
**Secondary Reviewers**: HARSH (Enterprise Context & Financial Inputs Lead), NISHIT (Frontend Lead)  
**Status**: RATIFIED SPECIFICATION  

---

## 1. Executive Summary & Purpose

The purpose of this specification is to define the mathematical optimization formulation, Return on Security Investment ($\text{ROSI}$) model, budget constraints, and multi-strategy candidate generation contracts for the **CyberRiskOS Deterministic Investment Optimization Engine v1.0.0**.

### 1.1 Mandatory Decision Support Mandate
### 1.1 Mandatory Decision Support Mandate
> **NO POLITICAL "WINNER" DIRECTIVE**:
> Security leadership must make informed trade-offs between competing priorities. The CyberRiskOS Investment Optimizer **never selects a single forced political "winner"** or labels any strategy as "BEST", "WINNER", or "RECOMMENDED CHOICE".
> Instead, it deterministically computes and presents **three distinct, neutral feasible candidate strategies**:
> 1. **Strategy A (Maximum Risk & Loss Reduction)**: Maximizes absolute risk reduction and monetary EAL savings within the budget ceiling.
> 2. **Strategy B (Balanced ROSI / Capital Efficiency)**: Maximizes return on capital per dollar invested ($\text{ROSI}$ ratio).
> 3. **Strategy C (Quick Wins / High Velocity)**: Prioritizes low-cost, fast-turnaround actions ($\le 25\%$ of budget ceiling) to eliminate maximum vulnerable instances rapidly.
>
> All candidate strategies explicitly expose: objective, cost, benefit, constraints, missing data warnings, and trade-offs. The human decision-maker makes the selection.

---

## 1.2 Quantitative Audit & Objective Separation Rules

1. **Explicit Objective Selection**:
   Optimization requests must explicitly specify a primary objective function:
   - `MAX_MODELED_RISK_REDUCTION`: Maximizes portfolio continuous risk score reduction ($\Delta \text{Risk}$).
   - `MAX_MODELED_EAL_REDUCTION`: Maximizes monetary annualized loss reduction ($\Delta \text{EAL}$).
   - `MAX_ROSI`: Maximizes Return on Security Investment ratio.
   
2. **Missing Financial Input Behavior**:
   If required financial inputs are `NOT_AVAILABLE`:
   - `MAX_MODELED_EAL_REDUCTION` and `MAX_ROSI` objectives are **UNAVAILABLE** and return structured validation errors.
   - The engine **never** substitutes continuous risk scores in place of missing monetary values.
   - Missing financial values are **never** treated as zero.

3. **Quick Wins Policy Standard**:
   The $\le 25\%$ budget ceiling rule for Strategy C is formally defined as a **CYBERRISKOS STRATEGY-GENERATION POLICY**, not a mathematically global optimum. The policy threshold parameter (default $25\%$) is configurable in solver requests.

---

## 2. Mathematical Formulation

Let $\mathcal{A} = \{a_1, a_2, \dots, a_n\}$ denote the set of candidate remediation actions.

Each candidate action $a_i$ is characterized by:
- $c(a_i) \ge 0$: Remediation implementation and operational cost in fiat currency.
- $\Delta R(a_i) \ge 0$: Modeled continuous enterprise risk reduction.
- $\Delta \text{EAL}(a_i) \ge 0$: Modeled monetary annualized loss reduction ($\text{USD}$).
- $\mathcal{D}(a_i) \subseteq \mathcal{A} \setminus \{a_i\}$: Prerequisite action dependencies that must be executed prior to or concurrently with $a_i$.
- $\mathcal{X}(a_i) \subseteq \mathcal{A} \setminus \{a_i\}$: Mutually exclusive conflicting actions (e.g. patching an OS vs decommissioning the host).

Let $x_i \in \{0, 1\}$ be the decision variable indicating whether action $a_i$ is selected ($x_i = 1$) or not ($x_i = 0$).

### 2.1 Budget Constraint
$$\sum_{i=1}^n c(a_i) \cdot x_i \le B$$
Where $B$ is the enterprise security budget ceiling.

### 2.2 Dependency & Mutual Exclusion Constraints
1. **Dependency Constraint**:
   $$x_i \le x_j \quad \forall j \in \mathcal{D}(a_i)$$
   An action cannot be selected unless all its prerequisite actions are also selected.

2. **Mutual Exclusion (Conflict) Constraint**:
   $$x_i + x_k \le 1 \quad \forall k \in \mathcal{X}(a_i)$$
   Conflicting actions cannot both be selected.

---

## 3. Return on Security Investment ($\text{ROSI}$)

CyberRiskOS adheres to standard quantitative cyber risk economics (ENISA, SANS, ISO 27005):

$$\text{Net Financial Benefit} = \sum_{a_i \in \mathcal{S}} \Delta \text{EAL}(a_i) - \sum_{a_i \in \mathcal{S}} c(a_i)$$

$$\text{ROSI Ratio} = \frac{\sum_{a_i \in \mathcal{S}} \Delta \text{EAL}(a_i) - \sum_{a_i \in \mathcal{S}} c(a_i)}{\sum_{a_i \in \mathcal{S}} c(a_i)}$$

$$\text{ROSI Pct} = \text{round}(\text{ROSI Ratio} \times 100\%, 2)$$

### 3.1 Division-by-Zero & Boundary Protocol
- If total remediation cost $\sum c(a_i) = 0.0$:
  - If $\sum \Delta \text{EAL}(a_i) > 0$: $\text{ROSI Ratio} = \text{null}$, $\text{ROSI Pct} = \text{null}$, Net Benefit is positive ($\text{Infinite ROI / Zero-Cost Fix}$).
  - If $\sum \Delta \text{EAL}(a_i) = 0$: $\text{ROSI Ratio} = 0.0$, $\text{ROSI Pct} = 0.0\%$.

---

## 4. Multi-Strategy Optimization Heuristics

### 4.1 Strategy A: Maximum Risk & Loss Reduction
Evaluates candidate actions by marginal benefit-to-cost ratio and selects feasible subsets under budget constraint:
$$\max \sum_{i=1}^n \Delta \text{EAL}(a_i) \cdot x_i \quad \text{or} \quad \max \sum_{i=1}^n \Delta R(a_i) \cdot x_i$$

### 4.2 Strategy B: Balanced ROSI (Optimal Capital Efficiency)
Maximizes capital efficiency ratio:
$$\max \frac{\sum_{i=1}^n \Delta \text{EAL}(a_i) \cdot x_i - \sum_{i=1}^n c(a_i) \cdot x_i}{\sum_{i=1}^n c(a_i) \cdot x_i}$$
Requires valid monetary EAL inputs; unavailable when EAL is `NOT_AVAILABLE`.

### 4.3 Strategy C: Quick Wins / Low-Cost Strategy (Policy-Driven)
Applies CyberRiskOS Strategy-Generation Policy filter:
$$c(a_i) \le \max(\text{policyThreshold} \times B, \$5,000)$$
Default policy threshold is $25\%$ ($\text{policyThreshold} = 0.25$). Maximizes action velocity and candidate coverage under minimal unit capital expenditure.

---

## 5. REST API Surface

| Endpoint | Method | Owner | Description |
| :--- | :--- | :--- | :--- |
| `/api/optimization/solve` | POST | Tanish | Computes Strategy A, Strategy B, and Strategy C candidates for given budget |
| `/api/optimization/strategies` | GET | Tanish | Returns strategy definitions, descriptions, and executive guidance |
| `/api/optimization/compare` | POST | Tanish | Compares two strategies side-by-side with trade-off analysis |
