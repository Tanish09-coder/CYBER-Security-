# Dependency Requests for HARSH (Enterprise Context Lead)

All requests directed to **Harsh** regarding Organizations, Business Units, Assets, Installed Software, CPE Matching, and Controls must be filed here.

---

### REQUEST ID: HARSH-001
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Harsh
- **DATE**: 2026-09-23
- **DESCRIPTION**: Need paginated Asset List endpoint (`GET /api/assets`) and single Asset Detail endpoint (`GET /api/assets/:assetId`).
- **WHY REQUIRED**: Required by Frontend Screen N5 (Asset Explorer) to display active enterprise systems, IP addresses, criticality tiers, and business unit ownership.
- **EXPECTED CONTRACT**:
  - `GET /api/assets?page=1&limit=20&search=&criticality=`
  - Response: `{ assets: Array<{ id: string, name: string, ipAddress: string, assetType: string, criticality: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW', businessUnitName: string, internetFacing: boolean, matchedVulnerabilitiesCount: number }>, total: number, page: number, totalPages: number }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N5 (Asset Explorer)
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in Migration `006_assets.sql` and `assets.controller.ts`. Live verification passed in post-merge pass.

---

### REQUEST ID: HARSH-002
- **REQUESTED BY**: Nishit
- **OWNER NEEDED**: Harsh
- **DATE**: 2026-09-23
- **DESCRIPTION**: Need Security Control inventory endpoint (`GET /api/controls`) returning implementation status across enterprise assets.
- **WHY REQUIRED**: Required by Frontend Screen N6 (Controls UI) to visualize security posture (EDR, MFA, PAM, Backups, Segmentation, Encryption).
- **EXPECTED CONTRACT**:
  - `GET /api/controls`
  - Response: `{ controls: Array<{ id: string, name: string, category: string, totalAssignedAssets: number, implementedCount: number, coveragePercentage: number }> }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Screen N6
- **STATUS**: DELIVERED
- **DELIVERY COMMITMENT**: Delivered in Migration `009_security_controls.sql` and `controls.controller.ts`. Live verification passed in post-merge pass.

---

### REQUEST ID: HARSH-003
- **REQUESTER**: Tanish
- **OWNER**: Harsh
- **PHASE**: Phase 2 — Risk Quantification
- **REQUIRED FIELD/API**: Enterprise Risk Inputs contract `docs/RISK_ENTERPRISE_INPUTS.md` & `GET /api/assets/:id/risk-inputs`
- **WHY REQUIRED**: Tanish's Risk Model v1 requires asset criticality tier (1–5), internet-facing exposure boolean, business unit context, and control implementation posture.
- **EXPECTED CONTRACT**:
  - `GET /api/assets/:id/risk-inputs`
  - Response: `{ assetId: string, criticalityTier: 1|2|3|4|5, internetFacing: boolean, businessUnitId: string, controls: Array<{ code: string, status: 'IMPLEMENTED'|'PARTIAL'|'NOT_IMPLEMENTED'|'UNKNOWN' }>, dataCompletenessScore: number }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Task TANISH-P2-01 & TANISH-P2-02
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Task HARSH-P2-01 & HARSH-P2-02 in `tasks/HARSH/TASKS.md`.

---

### REQUEST ID: HARSH-004
- **REQUESTER**: Tanish
- **OWNER**: Harsh
- **PHASE**: Phase 3 — Financial Exposure / EAL
- **REQUIRED FIELD/API**: Enterprise Financial Inputs schema & REST APIs (`GET /api/financial-inputs`)
- **WHY REQUIRED**: Quantitative financial modeling and EAL calculations must be grounded in user-configured downtime costs and recovery costs.
- **EXPECTED CONTRACT**:
  - `GET /api/financial-inputs`
  - Response: `{ organizationCurrency: string, downtimeCostPerHour: { tier1: number, tier2: number, tier3: number, tier4: number, tier5: number }, baselineRecoveryCost: number, businessInterruptionMultiplier: number, provenance: string }`
- **BLOCKING / NON-BLOCKING**: BLOCKING for Task TANISH-P3-01 & TANISH-P3-02
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Task HARSH-P3-01 & HARSH-P3-02 in `tasks/HARSH/TASKS.md`.

