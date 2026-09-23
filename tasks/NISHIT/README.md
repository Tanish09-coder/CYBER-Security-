# NISHIT — Workspace & Lead Overview

## Lead Profile
- **Name**: NISHIT
- **Role**: Frontend, Product Experience & Real-Data Visualization Lead
- **Branch**: `feature/nishit-frontend`

---

## Mandatory Work Session Start Declaration

Before beginning any development session, copy and state this declaration explicitly:

> "My name is Nishit.  
> I am Person 3 and Frontend/Product Experience Lead.  
> I will work only on tasks assigned to Nishit in tasks/NISHIT/.  
> I will not modify Tanish's Cyber Intelligence modules or Harsh's enterprise-context modules.  
> If backend changes are required, I will document the API requirement rather than modifying another member's backend implementation."

---

## Mission & Domain Scope

Nishit owns the entire **frontend application, user experience, responsive desktop layout, design token implementation, and authentic real-data visualization**.

### Primary Responsibilities:
1. **Frontend Architecture**: Modern React + TypeScript foundation, modular components, clean routing, and state management.
2. **Enterprise Shell & Navigation**: Header, collapsible sidebar, breadcrumbs, search, user notifications.
3. **API Integration Layer**: Axios/Fetch API client communicating with backend endpoints via contracts defined in `docs/API_CONTRACTS.md`.
4. **Integration Center UI (Screen N2)**: Health, sync status, and freshness monitoring for NVD, CISA KEV, MITRE ATT&CK, and VCDB feeds.
5. **Vulnerability Explorer (Screen N3)**: Real CVE tables, CVSS badges, CISA KEV exploitation indicators, pagination, and multi-criteria search.
6. **Vulnerability Detail View (Screen N4)**: Full CVE deep dive, multi-source CVSS breakdown, affected CPEs, weaknesses (CWE), and dual cryptographic SHA-256 provenance badges.
7. **Asset Explorer UI (Screen N5)**: Displaying real enterprise assets, criticality levels, and correlated potential vulnerability matches.
8. **Security Controls UI (Screen N6)**: Interactive defensive posture inventory (MFA, EDR, PAM, Backups, Segmentation).
9. **Threat Intelligence UI (Screen N7)**: ATT&CK matrix visualization and VCDB empirical trends.
10. **State Management**: Robust loading skeletons, error boundaries, and empty integration states.

---

## Non-Negotiable Real-Data Mandate

**DO NOT POPULATE THE PRODUCT WITH FAKE RISK METRICS OR FAKE CYBER RECORDS.**

- If an API has not been implemented yet or returns an empty array, render an informative **empty state** (e.g., *"No assets registered yet. Upload asset CSV to begin"*).
- Never render hardcoded mock numbers (e.g., fake loss distributions, imaginary asset lists, fake CVE scores) in production components.

---

## Design System Specifications (Strict PRD Section 32 Compliance)

### Visual Direction: Light Enterprise Analytics
The interface must convey trust, precision, institutional authority, and clarity.
- **PROHIBITED STYLES**: Dark themes, black backgrounds, neon borders, cyberpunk aesthetics, AI glowing orbs, glassmorphism, or futuristic spaceship dashboards.
- **REQUIRED STYLE**: Clean, minimal, finance-grade, government-ready, executive-friendly light theme.

### Core Color Palette:
```css
--bg-app:             #F7F8FA; /* Application Background */
--surface-primary:    #FFFFFF; /* Primary Surface / Cards */
--surface-secondary:  #F1F3F5; /* Secondary Surface / Headers */
--border-primary:     #E5E7EB; /* Subtle Borders */

--text-primary:       #111827; /* Dark Gray / Black Text */
--text-secondary:     #6B7280; /* Neutral Slate Text */

--action-primary:     #2563EB; /* Executive Royal Blue */
--accent-secondary:   #0F766E; /* Institutional Teal */

--status-success:     #15803D; /* Verified Green */
--status-warning:     #D97706; /* Elevated Amber */
--status-critical:    #DC2626; /* Critical Exploited Red */
--accent-financial:   #7C3AED; /* Quantitative Exposure Violet */
```

---

## Prohibited Scope (Do NOT Modify)

- **Backend Application** (`backend/`): Owned by Tanish and Harsh.
- **Database Schema & Migrations** (`database/`, `backend/src/db/migrations/`): Frontend must never access the database directly. All interaction must flow through documented REST APIs.
- **Financial Risk Engines** (`risk-engine/`): Out of scope.

---

## File Navigation

- [TASKS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/TASKS.md): Detailed screen roadmap (N1 through N7).
- [OWNED_FILES.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/OWNED_FILES.md): Exhaustive list of all files owned by Nishit.
- [PROGRESS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/PROGRESS.md): Live task status, components created, and blockers.
