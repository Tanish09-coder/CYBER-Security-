# CyberRiskOS

## AI-Assisted Continuous Cyber Risk Quantification & Security Investment Optimization Platform

**Project Type:** SIH 2026  
**Domain:** Blockchain & Cybersecurity  
**Problem Focus:** Continuous Cyber Risk Quantification and Investment Optimization  
**Document Version:** 1.0

---

## 1. Product Vision
CyberRiskOS is a cyber-risk decision-support platform designed to convert complex technical cybersecurity information into understandable financial risk.

Most existing security systems communicate risk using qualitative labels (Critical, High, Medium, Low). CyberRiskOS bridges the gap between technical teams and executive leadership by combining telemetry, asset criticality, threat intelligence, security control effectiveness, and organization-provided financial assumptions.

The platform answers:
- How much money is actually at risk? (Modeled Annual Exposure)
- Which assets create the greatest financial exposure?
- Which vulnerabilities should be fixed first?
- What happens if remediation is delayed?
- Which security investment provides the greatest modeled risk reduction?
- How should a limited cybersecurity budget be allocated?

---

## 2. Core Modules & Engine Pipeline
1. **Enterprise Asset Registry**: Assets, criticality, exposure, dependency graph.
2. **Vulnerability Intelligence**: Real ingestion (NVD, CISA KEV, CVSS v3/v4).
3. **Threat Intelligence Layer**: MITRE ATT&CK mappings, active exploit indicators.
4. **Security Telemetry Layer**: SIEM/IAM/EDR events (CSV/JSON/REST).
5. **Control Effectiveness Engine**: CIS/NIST controls, implementation status, mitigating weights.
6. **Risk Quantification Engine**: Transparent, deterministic formula ($Threat \times Vuln \times Exposure \times Criticality \times ControlWeakness$).
7. **Financial Risk Engine**: Expected Annual Loss ($EAL = IncidentProbability \times FinancialImpact$).
8. **Explainable Risk Engine**: Drill-down factor decomposition for every dollar at risk.
9. **What-If Simulation Engine**: Non-destructive sandbox simulating controls, patching, delays.
10. **Security Investment Optimizer**: Knapsack/heuristic multi-strategy budget allocation & diminishing-return curve.
11. **ROSI Engine**: Return on Security Investment calculation.
12. **Attack Path Visualization**: Directed graph of lateral traversal and blast radius.
13. **Compliance Mapping**: Independent mapping to NIST CSF, ISO 27001, CIS, RBI, SEBI.
14. **AI Decision-Support Assistant**: Grounded explanation layer consuming structured metrics (no hallucinated financial figures).

---

## 3. UI/UX Principles
- **Theme**: Light Enterprise Analytics Theme (`#F7F8FA` background, `#FFFFFF` cards, `#111827` text).
- **Semantics**: Low (Green), Moderate (Amber), High (Orange), Critical (Red), Financial Metric (Purple `#7C3AED`), Action (`#2563EB`).
- **Layout**: Enterprise sidebar navigation, top KPI metrics cards, analytical charts (Recharts/Plotly), Cytoscape network graph, clean sorting/filterable tables.
- **Strictly No**: Neon cyberpunk colors, glassmorphism, dark hacking aesthetics, or conversational chatbot-first visual patterns.
