# Dependency Requests for NISHIT (Frontend Lead)

All requests directed to **Nishit** regarding frontend UI components, dashboard displays, visualization adapters, or user experience flows must be filed here.

---

### REQUEST ID: NISHIT-001
- **REQUESTED BY**: Tanish
- **OWNER NEEDED**: Nishit
- **DATE**: 2026-09-23
- **DESCRIPTION**: Add dual-source cryptographic provenance indicators on the Vulnerability Detail modal/page.
- **WHY REQUIRED**: For high-trust regulatory audits, users need to see both the official source authority (NVD/NIST and CISA) and their respective SHA-256 payload hashes directly in the UI.
- **EXPECTED CONTRACT**:
  - Component reads `vulnerability.provenance` and `vulnerability.kevProvenance`.
  - Displays SHA-256 hashes with click-to-copy utility and ingestion timestamp.
- **BLOCKING / NON-BLOCKING**: NON-BLOCKING (Scheduled for Screen N4)
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Screen N4 in `tasks/NISHIT/TASKS.md`.

---

### REQUEST ID: NISHIT-002
- **REQUESTED BY**: Harsh
- **OWNER NEEDED**: Nishit
- **DATE**: 2026-09-23
- **DESCRIPTION**: Ensure Asset Explorer terminology strictly states *"Potential vulnerability match"* rather than *"Asset compromised"*.
- **WHY REQUIRED**: CPE matching identifies vulnerable software packages installed on an asset. Exploitation requires attack path confirmation and active threat actors; mislabeling matching as compromise causes false enterprise alarms.
- **EXPECTED CONTRACT**:
  - UI labels, tooltips, and table headers must use: *"Potential Vulnerability Matches"* or *"CPE Vulnerability Correlation"*.
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N5 review
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Will adhere strictly to this terminology rule during Screen N5 implementation.
