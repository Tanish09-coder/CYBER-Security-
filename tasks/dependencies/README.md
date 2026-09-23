# Cross-Domain Dependency Request System

## Overview
When a team member requires a change, an API endpoint, a data field, or a schema modification from another domain, **they must never modify that domain's code themselves**.

Instead, they log a structured request in this directory.

---

## Files in this Directory

- `TANISH_REQUESTS.md`: Requests submitted to **Tanish** (Cyber Intelligence & Ingestion).
- `HARSH_REQUESTS.md`: Requests submitted to **Harsh** (Enterprise Assets, Software, Controls).
- `NISHIT_REQUESTS.md`: Requests submitted to **Nishit** (Frontend, UI/UX, Visualization).

---

## Standard Request Format

To submit a request, append a new entry to the appropriate file using this schema:

```markdown
### REQUEST ID: [OWNER_PREFIX]-[NUMBER] (e.g. TANISH-001, HARSH-001, NISHIT-001)
- **REQUESTED BY**: [Name]
- **OWNER NEEDED**: [Tanish / Harsh / Nishit]
- **DATE**: [YYYY-MM-DD]
- **DESCRIPTION**: [Clear description of what is needed]
- **WHY REQUIRED**: [Business and technical rationale]
- **EXPECTED CONTRACT**:
  - Method / Schema / Function: [Details]
  - Input: [Payload / Parameters]
  - Output: [Expected Response / Return Value]
- **BLOCKING / NON-BLOCKING**: [BLOCKING / NON-BLOCKING]
- **STATUS**: [OPEN / IN_PROGRESS / DELIVERED / REJECTED]
- **DELIVERY COMMITMENT**: [Notes or PR reference from owner once delivered]
```

---

## Lifecycle of a Request

1. **OPEN**: Request created by another member.
2. **IN_PROGRESS**: Target owner acknowledges the request, validates the contract, and begins implementation.
3. **DELIVERED**: Target owner completes implementation, adds automated tests, updates `docs/API_CONTRACTS.md`, and marks status DELIVERED with the relevant commit / branch info.
4. **CLOSED**: Requesting member verifies integration and closes the ticket.
