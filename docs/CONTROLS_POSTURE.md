# CyberRiskOS — Security Controls Posture Specification
**Owner:** HARSH (Enterprise Context Lead)  
**Status:** Implemented (Phase H5)  
**Data Provenance Rule:** Zero Synthetic Posture Claims (strictly user-configured or scanner-imported)

---

## 1. Overview
The Security Controls Posture module manages the organization's defensive controls architecture. It enables security teams to track the implementation status, verified effectiveness, and provenance of defensive capabilities across enterprise assets.

---

## 2. Defensive Controls Catalog

The system defines 7 authoritative defensive controls:

| Code | Control Name | Category | Default Mitigation Weight | Purpose & Description |
| :--- | :--- | :--- | :--- | :--- |
| **MFA** | Multi-Factor Authentication | Identity & Access | **0.85** | Multi-Factor Authentication enforcement across privileged and administrative pathways. |
| **EDR** | Endpoint Detection & Response | Endpoint Security | **0.80** | Active sensor coverage with behavioral anomaly detection and automated containment. |
| **BACKUP** | Immutable & Offline Backups | Data Protection & Resilience | **0.75** | Ransomware-resilient, offline or immutable backup snapshots with verified restoration. |
| **SEGMENTATION** | Network Micro-segmentation | Network Security | **0.70** | Zero-trust network micro-segmentation restricting lateral movement and blast radius. |
| **PAM** | Privileged Access Management | Identity & Access | **0.80** | Vaulting, just-in-time access, credential rotation, and session recording. |
| **ENCRYPTION** | Data Encryption (Rest & Transit) | Data Protection | **0.65** | FIPS-compliant cryptographic protection for all sensitive records at rest and in transit. |
| **MONITORING** | 24/7 SIEM & SOC Monitoring | Detection & Monitoring | **0.75** | Continuous security telemetry ingestion, correlation rules, and active incident response. |

---

## 3. Implementation Posture Lifecycle

Each control on an asset has an explicit state:
- `IMPLEMENTED`: Fully deployed and operational.
- `PARTIAL`: Partially deployed (e.g. sensor installed but non-blocking mode).
- `NOT_IMPLEMENTED`: Control is missing or disabled.
- `UNKNOWN`: Default before audit or scanner verification.

### Provenance Tracking
Every control record tracks its `source`:
- `USER_CONFIG`: Manually declared by security officer.
- `SCANNER_IMPORT`: Ingested via automated discovery telemetry.
- `AUDIT_VERIFIED`: Confirmed by external or internal audit inspection.

---

## 4. API Reference

### List Controls Catalog
`GET /api/controls`

### Defense Coverage Summary
`GET /api/controls?summary=true`

### Retrieve Specific Control
`GET /api/controls/:code`

### List Controls on Asset
`GET /api/assets/:assetId/controls`

### Set / Update Controls on Asset
`POST /api/assets/:assetId/controls`
```json
{
  "controls": [
    {
      "control_code": "MFA",
      "status": "IMPLEMENTED",
      "effectiveness_score": 0.90,
      "source": "USER_CONFIG",
      "notes": "FIDO2 hardware keys enforced on all admin accounts"
    },
    {
      "control_code": "EDR",
      "status": "PARTIAL",
      "effectiveness_score": 0.50,
      "source": "SCANNER_IMPORT"
    }
  ]
}
```

### Update Single Control State
`PATCH /api/assets/:assetId/controls/:controlCode`

### Delete Control State from Asset
`DELETE /api/assets/:assetId/controls/:controlCode`
