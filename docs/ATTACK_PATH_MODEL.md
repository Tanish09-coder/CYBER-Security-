# CyberRiskOS — Attack Path & Blast Radius Mathematical Specification

**Document Version:** 1.0.0  
**Phase:** Phase 7B — Attack Path Intelligence  
**Owner:** TANISH (Risk Intelligence, Quantification & Decision Engine Lead)  
**Status:** APPROVED & IMPLEMENTED  

---

## 1. Executive Overview & Design Principles

The CyberRiskOS Attack Path Engine provides deterministic, evidence-based graph intelligence tracing multi-hop exploit progression from internet-exposed entry points to high-value enterprise crown jewels (Tier 1 assets).

### Core Guardrails
1. **Strictly Verified Topological Evidence:** Graph edges are built exclusively from authentic infrastructure evidence:
   - Verified network connectivity / open firewall routes between subnets (`NetworkExposureEdge`)
   - Verified software vulnerabilities present on target assets (`VulnerabilityEdge`)
   - Active defensive controls applied to nodes (`DefensiveControl`)
2. **Zero Hallucinated Links:** No speculative or unverified ATT&CK links are generated without topological evidence.
3. **Deterministic Graph Traversal:** Acyclic path generation using bounded Depth-First Search (DFS) / Breadth-First Search (BFS) with strict cycle detection.
4. **Structural Choke Point Identification:** Mathematical ranking of nodes/controls whose remediation breaks the maximum number of multi-hop attack vectors to critical assets.

---

## 2. Graph Schema & Entities

A directed attack graph $G = (V, E)$ consists of:

### 2.1 Nodes ($V$)
Each node represents an enterprise asset:
- `id` (UUID): Unique asset identifier.
- `name` (string): Human-readable asset name.
- `ipAddress` (string | null): Primary network address.
- `criticalityTier` (int, 1–5): Business criticality (1 = Tier 1 Crown Jewel).
- `isInternetFacing` (bool): True if exposed to untrusted external networks (Entry Points).
- `businessUnitId` (string | null): Organizational attribution.

### 2.2 Directed Edges ($E$)
An edge $e = (u, v)$ represents an exploitable transition or reachable network pathway from asset $u$ to asset $v$:
- `edgeId` (string): Unique transition identifier.
- `sourceAssetId` (UUID): Originating asset.
- `targetAssetId` (UUID): Destination asset.
- `edgeType`:
  - `NETWORK_EXPOSURE`: Direct network connectivity (protocol, port, firewall-allowed route).
  - `VULNERABILITY_EXPLOIT`: Remote code execution or privilege escalation via CVE.
  - `TRUST_RELATIONSHIP`: Credential caching or shared domain administrative trust.
- `riskWeight` (float, 0.0–100.0): Composite risk magnitude of the transition, derived from CVSS exploitability and KEV active exploitation evidence.
- `cveId` (string | null): Associated CVE if vulnerability-driven.
- `isKnownExploited` (bool): Evidence from CISA KEV.

---

## 3. Path Traversal & Cycle Prevention

### 3.1 Directed Acyclic Traversal
Attack paths are discovered by traversing directed paths from any entry point ($u \in V_{\text{entry}}$ where `isInternetFacing = True`) to any crown jewel ($w \in V_{\text{target}}$ where `criticalityTier == 1`).

Algorithm:
1. Identify all $S = \{u \in V \mid u.\text{isInternetFacing} == \text{True}\}$.
2. Identify all $T = \{w \in V \mid w.\text{criticalityTier} == 1\}$.
3. For each $s \in S$, perform depth-bounded DFS towards $T$:
   - Maintain a path-specific `visited` set to eliminate cycles ($O(V)$ cycle detection).
   - Enforce `maxHops` limit (default: 8 hops) to guarantee polynomial termination.
   - Discard paths that terminate without reaching any $t \in T$.

### 3.2 Path Exposure Score & Quantitative Semantics

> [!IMPORTANT]
> **Quantitative Semantics Guardrail (Attack Path v1)**:
> Existing CyberRiskOS risk scores and graph edge weights are model-policy severity metrics, **not statistically calibrated breach probabilities**.
> The path composite score must **NEVER** be described, labeled, or reported as a "breach probability", "likelihood of compromise", or "chance of breach".
> Authoritative field names: `pathExposureScore` (primary DTO field), `pathPriorityScore`, or `structuralSeverity`.

For a discovered acyclic attack path $P = (v_0, e_1, v_1, e_2, \dots, e_k, v_k)$, the composite **Path Exposure Score** is computed deterministically:

$$\text{pathExposureScore}(P) = 100 \times \left( 1 - \prod_{i=1}^{k} \left(1 - \frac{\text{riskWeight}(e_i)}{100}\right) \right)$$

#### Model-Policy Semantics:
1. **Bounded Composite Score:** Strictly bounded in $[0.0, 100.0]$.
2. **Monotonic Severity Accumulation:** Longer paths or paths containing high-exploitability transitions (e.g. CISA KEV active exploits) yield higher exposure priority scores.
3. **Individual Node Exposure:** Individual node risk scores $R(v_i)$ and edge risk weights $\text{riskWeight}(e_i)$ remain individually exposed in API payloads for granular inspection.
4. **Deterministic Ranking:** Used strictly for prioritizing structural choke-point remediation, preserving deterministic entry point $\to$ dependency $\to$ crown jewel path traversal.

---

## 4. Structural Choke Point Identification

A **Choke Point** is an intermediate node $c \in V \setminus (S \cup T)$ or a critical entry point whose severance interrupts the maximum number of high-risk paths reaching crown jewels.

### 4.1 Choke Point Score Formula

$$\text{ChokeScore}(c) = \frac{\sum_{P \in \mathcal{P}(c)} \text{PathRisk}(P)}{\sum_{P \in \mathcal{P}_{\text{all}}} \text{PathRisk}(P)}$$

Where:
- $\mathcal{P}_{\text{all}}$ is the set of all discovered attack paths to crown jewels.
- $\mathcal{P}(c)$ is the subset of paths traversing node $c$.

### 4.2 Remediation Impact
Intervening at node $c$ (e.g., patching the traversing CVE or isolating the asset) severs $100\%$ of paths in $\mathcal{P}(c)$, yielding an immediate structural blast radius reduction.

---

## 5. API Contracts

### 5.1 Python Risk Engine (`POST /api/v1/attack-paths/analyze`)
- **Input:** `AttackGraphInputSchema` containing `nodes`, `edges`, `entryAssetIds`, `targetAssetIds`, `maxDepth`.
- **Output:** `AttackGraphAnalysisResultSchema` containing `discoveredPaths`, `chokePoints`, `totalPathsCount`, `maxPathRisk`, `evaluatedAt`.

### 5.2 Node.js API Gateway (`/api/attack-paths` & `/api/v1/attack-paths`)
- `GET /api/attack-paths`: Returns the complete enterprise attack graph with paths and choke points.
- `GET /api/attack-paths/choke-points`: Returns ranked structural choke points.
- `GET /api/attack-paths/asset/:id`: Returns upstream attack vectors and downstream blast radius for a specific asset.
