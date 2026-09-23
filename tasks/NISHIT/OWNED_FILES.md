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
