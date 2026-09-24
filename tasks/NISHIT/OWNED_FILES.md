# NISHIT — Owned Files & Directories

The following files and directories are strictly owned and maintained by **NISHIT**. Other team members must not modify frontend source files directly.

---

## 1. Frontend Application Workspace

```text
frontend/src/
├── api/             # API client, Axios interceptors, endpoint wrappers
├── assets/          # SVG icons, institutional logos, static assets
├── components/
│   ├── common/      # Reusable primitives: Badge, Button, Table, Modal, Card, Input
│   └── layout/      # Sidebar, Header, Breadcrumbs, PageContainer, Navbar
├── context/         # React Context providers (Theme, Auth, Notification)
├── hooks/           # Custom React hooks (useVulnerabilities, useIntegrations, useAssets)
├── pages/           # Screen views (IntegrationCenter, VulnerabilityExplorer, etc.)
├── styles/          # CSS variables, global styles, theme.css
├── types/           # Frontend TypeScript interfaces mirroring API contracts
├── App.tsx          # Main routing & application shell
├── main.tsx         # React DOM mount point
└── index.css        # Base styling reset and typography rules

frontend/public/     # Public static web assets
frontend/index.html  # HTML entrypoint
frontend/package.json
frontend/tsconfig.json
frontend/vite.config.ts (or equivalent config)
```

---

## 2. Documentation

```text
docs/DESIGN_SYSTEM.md (upcoming frontend UI specs)
docs/FRONTEND_ARCHITECTURE.md (upcoming)
```

---

## 3. Task & Progress Records

```text
tasks/NISHIT/README.md
tasks/NISHIT/TASKS.md
tasks/NISHIT/OWNED_FILES.md
tasks/NISHIT/PROGRESS.md
tasks/dependencies/NISHIT_REQUESTS.md
```

---

## 4. Phase 2 → Final Delivery Owned Pages & Components (Phases 2–9)

The following pages, components, client adapters, and styling assets are strictly owned and maintained by **NISHIT** for Screens N8 through N15:

### 4.1 Phase 2–9 Page Views (`frontend/src/pages/`)
```text
frontend/src/pages/RiskOverview.tsx           (Screen N8: Risk Quantification)
frontend/src/pages/FinancialExposure.tsx       (Screen N9: Financial Exposure & EAL)
frontend/src/pages/WhatIfSimulator.tsx         (Screen N10: What-If Scenario Builder)
frontend/src/pages/InvestmentOptimizer.tsx     (Screen N11: Investment Portfolio Optimizer)
frontend/src/pages/ExecutiveDashboard.tsx     (Screen N12: Executive C-Suite Dashboard)
frontend/src/pages/Compliance.tsx              (Screen N13: Compliance Frameworks & Gaps)
frontend/src/pages/AttackPaths.tsx             (Screen N14: Topological Attack Paths)
frontend/src/pages/AiAssistant.tsx             (Screen N15: AI Explanation Assistant)
```

### 4.2 Phase 2–9 Component Directories (`frontend/src/components/`)
```text
frontend/src/components/risk/
  RiskScoreBadge.tsx
  RiskFactorsDrawer.tsx
  RiskTable.tsx

frontend/src/components/financial/
  EalBreakdownChart.tsx
  FinancialCard.tsx
  CurrencySelector.tsx

frontend/src/components/scenarios/
  ScenarioBuilder.tsx
  DeltaCard.tsx
  ComparisonTable.tsx

frontend/src/components/optimizer/
  StrategyComparisonCard.tsx
  TradeoffChart.tsx
  BudgetSlider.tsx

frontend/src/components/executive/
  PostureSummaryCard.tsx
  BuBreakdownChart.tsx
  TopRisksList.tsx

frontend/src/components/compliance/
  FrameworkCoverageGauge.tsx
  ControlsMappingTable.tsx
  EvidenceModal.tsx

frontend/src/components/attack-paths/
  TopologyGraph.tsx
  ChokePointBadge.tsx
  PathInspectorDrawer.tsx

frontend/src/components/assistant/
  AiAssistantDrawer.tsx
  PromptSuggestionChips.tsx
  ExplanationMessage.tsx
```

### 4.3 Phase 2–9 API Client Adapters (`frontend/src/api/`)
```text
frontend/src/api/risk.ts
frontend/src/api/financial.ts
frontend/src/api/scenarios.ts
frontend/src/api/optimization.ts
frontend/src/api/executive.ts
frontend/src/api/compliance.ts
frontend/src/api/attackPaths.ts
frontend/src/api/assistant.ts
```

### 4.4 Absolute Prohibitions for Nishit
- Under **NO** circumstances may Nishit modify calculation formulas or optimizer algorithms.
- Under **NO** circumstances may Nishit directly connect to PostgreSQL or bypass backend REST APIs.
- Under **NO** circumstances may Nishit invent synthetic backend fields, mock financial values, mock control effectiveness, or mock risk scores in the UI. If an API field is missing, file a request in `tasks/dependencies/`.
- Under **NO** circumstances may Nishit modify files in `backend/` or `risk-engine/`.

