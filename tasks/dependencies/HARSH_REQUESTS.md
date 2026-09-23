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
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Phase H2 in `tasks/HARSH/TASKS.md`.

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
- **STATUS**: OPEN
- **DELIVERY COMMITMENT**: Planned under Phase H5 in `tasks/HARSH/TASKS.md`.
