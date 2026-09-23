# MITRE ATT&CK® Enterprise STIX 2.1 Integration Specification

**Owner**: TANISH (Cyber Intelligence & External Data Integration Lead)  
**Standard**: STIX 2.1 JSON Specification / Official MITRE ATT&CK Enterprise Matrix  
**Status**: Production-Ready Connector & Normalized Knowledge Base

---

## 1. Official MITRE Source & STIX 2.1 Standard

CyberRiskOS ingests exclusively from the official MITRE ATT&CK STIX data repository:
* **Repository**: `https://github.com/mitre-attack/attack-stix-data`
* **Release & Collection Index**: `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json`
* **Default Enterprise Collection URL**: `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json`

No unofficial mirrors, scraped HTML, AI-generated threat intelligence, or synthetic ATT&CK objects are permitted.

---

## 2. Mandatory Architectural Statements & Governance

> [!IMPORTANT]
> **Adversary Behavior vs. Asset Compromise**:  
> MITRE ATT&CK models adversary tactics, techniques, and related threat knowledge. CyberRiskOS does not interpret ATT&CK technique presence as proof that a particular organization's asset has been compromised.

> [!IMPORTANT]
> **Vulnerability (CVE) vs. Attack Technique Separation**:  
> CyberRiskOS does not automatically map CVEs to ATT&CK techniques without an explicit evidence source supporting that relationship. NVD and CISA KEV model vulnerabilities in software components; ATT&CK models behavioral execution tactics used by human adversaries. Conflating the two without verifiable threat intelligence is prohibited.

---

## 3. Scope: Enterprise Matrix Only

This integration strictly targets the **Enterprise ATT&CK Matrix**. Mobile ATT&CK and ICS ATT&CK are excluded from this release to focus on enterprise IT, cloud, and corporate perimeter threat vectors.

---

## 4. Dynamic Release Discovery

The ingestion connector does not hardcode static version numbers (e.g. `19.2`). Instead, the ingestion sequence executes dynamically:
1. Fetches official `index.json`.
2. Locates the `enterprise-attack` collection in `collections`.
3. Discovers the latest version and its specific release URL (e.g. `enterprise-attack-19.2.json`).
4. Fetches the release-specific bundle directly.
5. In accordance with project governance, if a release-specific fetch fails, the connector fails safely and preserves the last valid state rather than silently falling back to an unversioned bundle.

---

## 5. Supported Objects & Normalization

The connector parses official STIX 2.1 object classes and normalizes them into dedicated relational tables:

| STIX Object Type | Domain Concept | Table | Primary External Key |
| :--- | :--- | :--- | :--- |
| `x-mitre-tactic` | Tactic | `mitre_attack_tactics` | `TAxxxx` (e.g. `TA0001`) |
| `attack-pattern` | Technique & Sub-technique | `mitre_attack_techniques` | `Txxxx` or `Txxxx.yyy` (e.g. `T1059.001`) |
| `course-of-action` | Mitigation | `mitre_attack_mitigations` | `Mxxxx` (e.g. `M1036`) |
| `intrusion-set` | Threat Group | `mitre_attack_groups` | `Gxxxx` (e.g. `G0016`) |
| `malware` / `tool` | Software | `mitre_attack_software` | `Sxxxx` (e.g. `S0029`) |
| `relationship` | Graph Edges | `mitre_attack_relationships` | STIX ID (`relationship--...`) |

### Unknown / Un-normalized STIX Types
STIX types such as `campaign`, `marking-definition`, and `identity` are preserved in the raw bundle, counted in audit logs, and not fabricated into synthetic normalized types.

---

## 6. Authoritative STIX Relationships & Sub-Technique Parentage

ATT&CK is relationship-heavy. Relationships are never flattened or discarded:
* **Parent-Child Sub-techniques**: Sub-technique parents are resolved **authoritatively from official `subtechnique-of` STIX relationships**. The dotted ATT&CK ID (e.g. `T1059.001` vs `T1059`) is used strictly as a consistency check.
* **Unresolved Endpoints**: Official relationships are preserved even when the source or target object is not among the normalized object types (e.g. targeting an identity or campaign).
* **Kill Chain Mapping**: Tactic-to-technique associations are derived from official STIX `kill_chain_phases` and normalized into `mitre_attack_tactic_techniques`.

---

## 7. Natural Keys: Dual Identifier Architecture

CyberRiskOS preserves both identifiers for all ATT&CK objects:
1. **STIX ID**: (e.g. `attack-pattern--970a4a58-6933-4f9e-876e-aa5e4939b70b`) used as the immutable natural key for upserting and graph joins.
2. **ATT&CK External ID**: (e.g. `T1059.001`, `TA0001`, `M1036`) extracted from `external_references` where `source_name` matches `mitre-attack` without assuming array order.

---

## 8. Database Schema & Migration

All tables are created in Migration `003_mitre_attack_ingestion.sql`:
* `mitre_attack_releases`: Audits all historical and current Enterprise ATT&CK releases.
* `mitre_attack_tactics`: Matrix tactics with short names (`initial-access`, `execution`).
* `mitre_attack_techniques`: Techniques and sub-techniques with platforms and kill chain phases.
* `mitre_attack_mitigations`: Addressable security controls and countermeasures.
* `mitre_attack_groups`: Adversary groups and threat actors with known aliases.
* `mitre_attack_software`: Malware and administrative tools used in campaigns.
* `mitre_attack_relationships`: Full bi-directional relationship graph (`uses`, `mitigates`, `subtechnique-of`).
* `mitre_attack_tactic_techniques`: Junction table for matrix navigation.

---

## 9. Historical Release Retention & Idempotency

* **Release Evolution**: When a newer Enterprise release is published and ingested, previous releases are marked `is_current = false`. Historical release records, hashes, and raw payloads are never deleted.
* **Idempotency**: Before processing, the canonical SHA-256 hash of the entire bundle is compared against previously ingested bundles. If identical, all record processing is skipped (`recordsSkipped = totalObjects`), returning in milliseconds with zero duplicates.

---

## 10. Revoked & Deprecated Objects

MITRE ATT&CK retires techniques over time. CyberRiskOS never deletes revoked or deprecated records.
* Normalized tables maintain `revoked: boolean` and `deprecated: boolean` flags.
* Default API queries filter out retired objects unless `includeRetired=true` is requested.

---

## 11. REST API Endpoints

Mounted under `/api/integrations/mitre-attack` and `/api/v1/threats`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/integrations/mitre-attack/sync` | Trigger manual dynamic release discovery & full STIX sync |
| `GET` | `/api/integrations/mitre-attack/status` | Ingestion status, current release, counts, and staleness |
| `GET` | `/api/integrations/mitre-attack/tactics` | Paginated list of tactics (supports `search`, `includeRetired`) |
| `GET` | `/api/integrations/mitre-attack/tactics/:attackId` | Tactic details with all mapped techniques |
| `GET` | `/api/integrations/mitre-attack/techniques` | Query techniques (`tactic`, `platform`, `isSubtechnique`, `search`) |
| `GET` | `/api/integrations/mitre-attack/techniques/:attackId`| Full technique graph: parent, sub-techniques, tactics, mitigations, groups, software |
| `GET` | `/api/integrations/mitre-attack/groups` | Threat groups with aliases |
| `GET` | `/api/integrations/mitre-attack/groups/:attackId` | Group details with techniques and software used |
| `GET` | `/api/integrations/mitre-attack/software` | Malware and tools catalog |
| `GET` | `/api/integrations/mitre-attack/mitigations` | Security mitigations and countermeasures |
