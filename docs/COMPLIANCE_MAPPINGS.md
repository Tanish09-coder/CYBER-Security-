# Compliance Frameworks & Security Control Mappings

**Owner**: HARSH (Enterprise Context & Compliance Lead)  
**Status**: ACTIVE  
**Last Updated**: 2026-09-25  

---

## 1. Regulatory & Compliance Frameworks Supported

CyberRiskOS directly models five primary compliance and regulatory frameworks:
1. **`NIST_CSF`**: NIST Cybersecurity Framework (v2.0)
2. **`ISO_27001`**: ISO/IEC 27001 (2022) Information Security Management Systems
3. **`CIS_V8`**: CIS Critical Security Controls (v8)
4. **`RBI_CSF`**: Reserve Bank of India Cyber Security Framework for Banks (2016)
5. **`SEBI_CS`**: Securities and Exchange Board of India Cybersecurity & Resilience Framework (2023)

---

## 2. Dynamic Compliance Coverage & Gap Analysis Rules

- **Coverage Percentage**: Calculated dynamically from verified internal defensive controls (`MFA`, `EDR`, `BACKUP`, `SEGMENTATION`, `PAM`, `ENCRYPTION`, `MONITORING`) mapped to framework requirements.
  $$\text{Coverage } \% = \frac{\text{Implemented Framework Controls}}{\text{Total Framework Controls}} \times 100$$
- **Strict Certification Rule**: The platform computes implementation posture coverage ONLY. The platform NEVER claims "certified" or "fully compliant" unless backed by verified external audit evidence.
- **Evidence Management**: External audit artifacts, policy documents, and certificates are attached via `POST /api/compliance/evidence` with status tracking (`VERIFIED`, `EXPIRED`, `PENDING`, `REJECTED`).

---

## 3. Database Schema & REST APIs

- **Tables**: `compliance_frameworks`, `compliance_controls`, `control_compliance_mappings`, `compliance_evidence`
- **REST Endpoints**:
  - `GET /api/compliance/frameworks`: List supported regulatory frameworks
  - `GET /api/compliance/frameworks/:code/coverage`: Calculate framework coverage percentage for an organization
  - `POST /api/compliance/evidence`: Attach audit evidence document
  - `GET /api/compliance/evidence?organizationId=`: Retrieve uploaded evidence artifacts
  - `GET /api/compliance/gaps?organizationId=`: Retrieve list of unmitigated control compliance gaps
