# NISHIT — Task Roadmap & Execution Backlog

## Screen Roadmap Summary

| Screen ID | Screen Title | Backend Dependency | Status | Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **N1** | Application Shell & Design Tokens | None (Internal) | **NOT_STARTED** | Layout, responsive navigation, sidebar, header, CSS variables |
| **N2** | Integration Center | Tanish (`/api/integrations/*`) | **READY_TO_START** | Real-time health, sync status, and freshness dashboard |
| **N3** | Vulnerability Explorer | Tanish (`/api/vulnerabilities`) | **READY_TO_START** | Searchable, paginated CVE table with CVSS & KEV badges |
| **N4** | Vulnerability Detail Modal/Page | Tanish (`/api/vulnerabilities/:cveId`) | **READY_TO_START** | Deep dive with dual provenance hashes, CPEs, and CWEs |
| **N5** | Asset Explorer | Harsh (`/api/assets`) | **WAITING_FOR_HARSH** | Enterprise assets, criticality tiers, potential CVE matches |
| **N6** | Security Controls UI | Harsh (`/api/controls`) | **WAITING_FOR_HARSH** | Implementation matrix for MFA, EDR, PAM, Backups |
| **N7** | Threat Intelligence Dashboard | Tanish (`/api/threat-intelligence/*`)| **WAITING_FOR_TANISH** | ATT&CK matrix view and empirical VCDB distributions |

---

## Detailed Screen Specifications

### Screen N1: Application Shell & Design Foundation
- [ ] Initialize standard frontend layout in `frontend/src/`:
  - `components/layout/Sidebar.tsx`: Enterprise navigation sidebar with section groupings.
  - `components/layout/Header.tsx`: Organization selector, breadcrumb trail, environment tag.
  - `styles/theme.css`: Core design tokens matching PRD Section 32 (`#F7F8FA`, `#2563EB`, etc.).
  - `components/common/Badge.tsx`, `Button.tsx`, `Table.tsx`, `Modal.tsx`, `Skeleton.tsx`.
- [ ] Establish client routing (React Router) with paths:
  - `/integrations`
  - `/vulnerabilities`
  - `/vulnerabilities/:cveId`
  - `/assets`
  - `/controls`
  - `/threat-intel`

---

### Screen N2: Integration Center Dashboard
- [ ] Create `pages/IntegrationCenter.tsx`.
- [ ] Connect to live integration endpoints:
  - NVD status: `GET /api/integrations/nvd/status`
  - CISA KEV status: `GET /api/integrations/cisa-kev/status`
  - Future: MITRE & VCDB status endpoints
- [ ] Display cards for each official data source:
  - Source Name and Provider Authority.
  - Operational Status badge: `ENABLED` / `STALE` / `SYNCING` / `ERROR`.
  - Last Successful Synchronization timestamp.
  - Total Ingested Records (e.g., *1,721 active KEV entries*).
  - Freshness indicator (`Data Age: X hours`, stale threshold alert if > 24h).
  - Trigger Manual Re-sync button with live loading state.

---

### Screen N3: Vulnerability Explorer
- [ ] Create `pages/VulnerabilityExplorer.tsx`.
- [ ] Table columns:
  - **CVE ID**: e.g., `CVE-2026-93952` (links to detail view).
  - **Preferred CVSS**: Base score with color-coded severity badge (CRITICAL: #DC2626, HIGH: #D97706, etc.).
  - **Known Exploited (CISA KEV)**: Distinct badge indicating active in-the-wild exploitation.
  - **Ransomware Campaign**: Flag if marked "Known" by CISA.
  - **Attack Vector**: Network / Adjacent / Local / Physical.
  - **Source Provider**: NIST / CNA identifier.
  - **Published Date**: ISO date.
- [ ] Filter toolbar:
  - Search by CVE ID or description substring.
  - Severity dropdown (Critical, High, Medium, Low).
  - Toggle: *"CISA KEV Known Exploited Only"*.
  - Toggle: *"Known Ransomware Campaigns Only"*.
- [ ] Pagination controls: Page size, next/previous buttons, total record count.

---

### Screen N4: Vulnerability Detail View
- [ ] Create `pages/VulnerabilityDetail.tsx` (or slide-out drawer).
- [ ] Header section: CVE ID, preferred CVSS score, vulnerability status, and description snippet.
- [ ] Multi-Assessment CVSS Breakdown:
  - Tabular view preserving all assessments across NIST, CNA, and ADP.
- [ ] CISA KEV Executive Action Box:
  - Remediation Due Date countdown banner.
  - Required Action instructions from CISA.
  - Active catalog membership confirmation (`is_current: true`).
- [ ] Affected Software Criteria (CPE):
  - Table of vulnerable CPE URIs and version bounds.
- [ ] Weaknesses (CWE):
  - Linked CWE identifiers and plain-language definitions.
- [ ] Dual Cryptographic Provenance Section:
  - NIST NVD SHA-256 payload hash with click-to-copy.
  - CISA KEV Catalog SHA-256 payload hash with click-to-copy.
  - Raw source record ingestion timestamps.

---

### Screen N5: Enterprise Asset Explorer
- [ ] Create `pages/AssetExplorer.tsx`.
- [ ] **State Handling**:
  - If Harsh's `/api/assets` endpoint returns empty: render informative empty state (*"No enterprise assets registered yet. Import an asset inventory CSV to correlate exposures"*).
  - **Strict Prohibition**: Do not generate synthetic mock assets or fake IP addresses.
- [ ] When API data is available:
  - Render asset table: Name, IP Address, Asset Type, Criticality Badge, Internet-Facing pill, and Matched Vulnerability Count.
  - Strict labeling: *"Potential Vulnerability Matches"* (never *"Asset Compromised"*).

---

### Screen N6: Security Controls Posture
- [ ] Create `pages/ControlsView.tsx`.
- [ ] Display defensive controls (MFA, EDR, Backups, PAM, Segmentation, Encryption).
- [ ] Render implementation coverage percentages based on Harsh's real control API.
- [ ] Display empty state if no control data has been uploaded.

---

### Screen N7: Threat Intelligence & Incident Trends
- [ ] Create `pages/ThreatIntelligence.tsx`.
- [ ] Render ATT&CK matrix column layout once Tanish's STIX API is ready.
- [ ] Render VCDB empirical breach trends once VCDB API is ready.
