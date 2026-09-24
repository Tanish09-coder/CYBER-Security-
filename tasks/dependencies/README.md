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

## Standard Request Format (Phase 2–9 Protocol)

To submit a request, append a new entry to the appropriate file using this strict schema:

```markdown
### REQUEST ID: [OWNER_PREFIX]-[NUMBER] (e.g. TANISH-003, HARSH-003, NISHIT-003)
- **REQUESTER**: [Tanish / Harsh / Nishit]
- **OWNER**: [Tanish / Harsh / Nishit]
- **PHASE**: [Phase 2 - Phase 9]
- **REQUIRED FIELD/API**: [Exact field, endpoint, or DTO needed]
- **WHY REQUIRED**: [Business and technical rationale]
- **EXPECTED CONTRACT**:
  - Method / Schema / Function: [Details]
  - Input: [Payload / Parameters]
  - Output: [Expected Response / Return Value]
- **BLOCKING / NON-BLOCKING**: [BLOCKING / NON-BLOCKING]
- **STATUS**: [OPEN / IN_PROGRESS / DELIVERED / CLOSED / REJECTED]
- **DELIVERY COMMITMENT**: [Notes or PR reference from owner once delivered]
```

---

## Golden Rule of Cross-Domain Dependencies

If Person A needs something from Person B:
1. **DO NOT modify Person B's module directly**.
2. **Create a dependency request** in `tasks/dependencies/<OWNER>_REQUESTS.md`.
3. In tests, use temporary mock fixtures that never touch production code.
4. **Never guess or invent missing backend fields in frontend code**.
5. Wait for target owner to deliver and document the contract in `docs/API_CONTRACTS.md`.

