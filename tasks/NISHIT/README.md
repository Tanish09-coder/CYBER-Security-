# NISHIT — Workspace & Lead Overview

## Lead Profile
- **Name**: NISHIT
- **Role**: Frontend, Product Experience & Real-Data Visualization Lead
- **Phase 1 Branch**: `feature/nishit-frontend`
- **Phase 2–9 Branch**: `feature/nishit-risk-product-ui`

---

## Mandatory Work Session Start Declaration (Phase 2–9 Frozen Version)

Before beginning any development session, copy and state this declaration explicitly:

> "My name is Nishit.  
> I am Person 3 and Frontend, Product Experience & Real-Data Visualization Lead.  
> I will work only on tasks assigned to Nishit in tasks/NISHIT/.  
> I own Screens N8 through N15, UI design tokens, API client integration, state handling, and visualization adapters.  
> I will not modify Tanish's calculation formulas or Harsh's backend storage.  
> If frontend requires a missing field, I will file a dependency request rather than inventing synthetic fields in the UI."

---

## Mission & Domain Scope

Nishit owns the entire **frontend application, user experience, responsive desktop layout, design token implementation, and authentic real-data visualization** for all platform screens.

### Primary Responsibilities (Phase 2–9):
1. **Frontend Architecture**: Modern React + TypeScript foundation, modular components, clean routing, and state management.
2. **Enterprise Shell & Navigation**: Header, collapsible sidebar, breadcrumbs, search, user notifications.
3. **API Integration Layer**: Axios/Fetch API client communicating with backend endpoints via contracts defined in `docs/API_CONTRACTS.md`.
4. **Foundation Screens N1–N7 (Delivered)**: Integrations, Vulnerabilities, VulnerabilityDetail, Assets, Controls, ThreatIntel.
5. **Risk Overview UI (Screen N8)**: Paginated risk scores for `(asset, vulnerability)` pairs, risk levels, factor breakdown drawer, missing data warnings.
6. **Financial Exposure UI (Screen N9)**: Modeled financial exposure cards, EAL breakdown charts, currency formatting, contributing cost components.
7. **What-If Simulator UI (Screen N10)**: Interactive scenario builder, baseline vs simulated comparative views, delta metrics.
8. **Investment Optimizer UI (Screen N11)**: Budget input, strategy cards (A, B, C), trade-off charts, ROSI indicators, neutral decision support.
9. **Executive Dashboard UI (Screen N12)**: Executive posture summary, top risks, BU breakdown charts, data completeness & freshness badges.
10. **Compliance UI (Screen N13)**: Framework selector, mapped controls table, evidence records, gap analysis, coverage gauges.
11. **Attack Path Visualization (Screen N14)**: Topological node-edge graph, choke point highlights, critical asset destinations, path detail inspector.
12. **AI Assistant UI (Screen N15)**: Contextual assistant drawer, prompt suggestions, visual badge distinguishing AI text from deterministic numbers.
13. **State Management & Polish**: Skeleton loaders, informative empty states, error retry boundaries, responsive behavior, WCAG AA accessibility.

---

## Non-Negotiable Real-Data Mandate

**DO NOT POPULATE THE PRODUCT WITH FAKE RISK METRICS OR FAKE CYBER RECORDS.**

- If an API has not been implemented yet or returns an empty array, render an informative **empty state** (e.g., *"No assets registered yet. Upload asset CSV to begin"*).
- Never render hardcoded mock numbers (e.g., fake loss distributions, imaginary asset lists, fake CVE scores) in production components.
- If a backend field is missing, file a request in `tasks/dependencies/`. Never silently synthesize it in the frontend.

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
- **Risk & Decision Engines** (`risk-engine/`): Quantitative calculations, ROSI, and scenario algorithms are owned by Tanish.
- **Enterprise CRUD & Inputs**: Owned by Harsh.

---

## File Navigation

- [TASKS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/TASKS.md): Detailed screen roadmap (N1 through N15).
- [OWNED_FILES.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/OWNED_FILES.md): Exhaustive list of all files owned by Nishit.
- [PROGRESS.md](file:///c:/Users/A%20J/OneDrive/Desktop/Cyber/tasks/NISHIT/PROGRESS.md): Live task status, components created, and blockers.

