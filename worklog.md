# Worklog - ANSUT Cockpit DG Project

---
Task ID: 1
Agent: Main
Task: Make AdminSettings.tsx fully responsive on mobile

Work Log:
- Read AdminSettings.tsx (1036 lines) and identified 7 categories of responsiveness issues
- Added `shrink-0` to 7 card header icon wrappers (Building2, Globe, Palette, FileText, Bell, Shield, Server)
- Added `min-w-0` to 6 card header title containers for text overflow protection
- Added `shrink-0` to all 15 label icons (Languages, Clock, CalendarDays, RefreshCw, CalendarRange, Hash, FileText, Presentation, FileSpreadsheet, ImageLucide, Mail, Lock)
- Added `shrink-0` to all 4 Switch components (includeLogo, includeGenerationDate, emailAlerts, ipLogging)
- Fixed save button: changed `min-w-[200px]` to `w-full sm:w-auto sm:min-w-[200px]`
- Fixed AdminLayout.tsx: added `min-w-0` to mobile wrapper, `overflow-x-hidden` to both mobile and desktop content areas, `overflow-hidden` to root flex container
- Added `overflow-x-hidden` to AdminSettings root div
- Added `min-w-0` to admin motion wrapper in page.tsx
- Verified via Agent Browser: no horizontal overflow at 320px, 375px viewports
- Confirmed save button fits viewport (351px on 375px, 296px on 320px)
- All 4 switches properly visible and functional on mobile
- Lint passes cleanly

Stage Summary:
- AdminSettings.tsx is now fully responsive on mobile (320px+)
- Key fixes: shrink-0 on all icons/switches, min-w-0 on text containers, responsive save button, overflow containment in AdminLayout
- Files modified: AdminSettings.tsx, AdminLayout.tsx, page.tsx

---
Task ID: 2
Agent: Main
Task: Créer les différents comptes des acteurs ANSUT

Work Log:
- Analyzed existing database: 7 users, 7 roles, 8 departments already existed
- Identified 4 missing actors: DSIS, DDIR, DJMG, RDRHF
- Created seed script `prisma/seed-actors.ts` with 11 actor definitions
- Each actor includes: email, name, matricule (ANSUT-XXX-001), fonction, role, department, color
- Ran seed: 4 new departments (DSIS, DDIR, DJMG), 4 new roles, 4 new users created; 7 existing users updated with matricule & fonction
- Fixed AdminUsers.tsx data extraction bug: API returns `{ data: [...] }` but frontend expected `data.users`
- Fixed role fetching: same `{ data: [...] }` pattern
- Departments API returns raw array (correct, no fix needed)
- Verified in browser: all 11 matricules visible, all users displayed correctly in admin panel

Stage Summary:
- 11 actor accounts created/updated in database
- 11 roles with proper levels (10-100) and ANSUT brand colors
- 11 departments including 3 new ones (DSIS, DDIR, DJMG)
- AdminUsers.tsx fixed to properly map API response data
- All accounts use password "ansut2025"
- Files created: prisma/seed-actors.ts
- Files modified: src/components/admin/AdminUsers.tsx (data mapping fix)

---
Task ID: 3
Agent: Main
Task: Configurer les 116 KPI du cahier des charges ANSUT par module et sous-module

Work Log:
- Analyzed existing indicator structure: 38 old indicators with mismatched subDomains
- Created comprehensive seed script `prisma/seed-kpi.ts` with all 116 KPIs from the ANSUT cahier des charges
- Each KPI includes: code, name, domain, subDomain, unit, targetValue, alertValue, criticalValue, description, frequency
- Generated 1,392 monthly sample values for 2025 (Q1-Q4) with realistic variations
- Deleted old indicators (38) and values (684), replaced with new structure
- Created generic `KpiModuleView` component (600+ lines) with:
  - 4 summary KPI cards (Total, Atteint, Partiel, Non atteint)
  - Sub-domain tabs auto-generated from data
  - Responsive data table (desktop) / card layout (mobile)
  - Status logic: lower-is-better (jours, nb, h, ratio) vs higher-is-better (%, Mds FCFA)
  - Écart column with color coding
- Replaced all 6 module components with thin wrappers using KpiModuleView
- Fixed API `/api/indicators/domain` year parsing for undefined values
- Verified all 6 modules in browser with correct tab counts and KPI display

Stage Summary:
- 116 KPIs seeded across 6 modules, 24 sous-modules
- Module breakdown: Gouvernance (19), Finance (12), Opérationnel (46), RH (12), Risque (14), PTA (13)
- All modules display tabs per sous-module with KPI tables
- Dashboard Accueil shows "116 indicateurs" with correct domain counts
- Files created: prisma/seed-kpi.ts, src/components/cockpit/KpiModuleView.tsx
- Files modified: 6 module wrappers (Governance, Finance, Operational, RH, Risque, PTA), api/indicators/domain/route.ts

---
Task ID: 4
Agent: Main
Task: Fix Gouvernance KPI filter not showing results in AdminKPI view

Work Log:
- User reported Gouvernance filter in "Indicateurs KPI" admin view returned empty
- Root cause: AdminKPI.tsx used French key `gouvernance` in DOMAIN_LABELS/DOMAIN_COLORS/DOMAIN_BADGE_COLORS but database stores English key `governance`
- Verified via DB query: 19 indicators with domain=governance, not gouvernance
- Confirmed cockpit module views and dashboard API use `governance` (English) consistently
- Fixed 4 occurrences in AdminKPI.tsx: `gouvernance` → `governance` in DOMAIN_LABELS, DOMAIN_COLORS, DOMAIN_BADGE_COLORS, and EMPTY_FORM default domain
- Verified via Agent Browser: dropdown filter "Gouvernance" now correctly sends `domain=governance` to API
- API test confirmed: `GET /api/admin/indicators?domain=governance` returns 19 indicators (GOV-001 to GOV-019)

Stage Summary:
- AdminKPI domain filter now works correctly for all 6 domains
- Files modified: src/components/admin/AdminKPI.tsx (4 string replacements)

---
Task ID: 5
Agent: Main
Task: Marquer 43 KPIs Lot 1 (DG) comme prioritaires et les afficher sur les vues modules

Work Log:
- Added `isPriority Boolean @default(false)` to Indicator model in Prisma schema
- Ran `db:push` to sync schema and regenerate Prisma Client
- Created `prisma/seed-priority.ts` with 43 Lot 1 KPI codes from KPMG document:
  - Gouvernance: 13 (GOV-001 to GOV-019 subset)
  - Finance: 11 (all except FIN-003)
  - Opérationnel: 6 (OP-001, OP-003 to OP-006, OP-008)
  - RH: 5 (RH-006, RH-007, RH-008, RH-011, RH-012)
  - Risque: 8 (RIS-002 to RIS-012 subset)
  - PTA: 0 (none in Lot 1)
- Ran seed: all 43/43 found and updated, 0 not found
- Updated KpiModuleView.tsx:
  - Added `isPriority` to Indicator interface
  - Created `PriorityBadge` component (★ Lot 1 in tango color)
  - Added "Priorité" column to desktop table
  - Priority KPIs get: border-l-tango (mobile card), bg-tango/[0.03] highlight (desktop row), PriorityBadge in priority column
  - Indicators sorted: priority first within each sub-domain
  - Tab labels show "X/Y" priority count (e.g., "Reporting réglementaire (8/9)")
  - Added 5th summary card "KPI Lot 1 (DG)" with Star icon
  - Header subtitle shows "X Lot 1" in tango color
- Updated AdminKPI.tsx:
  - Added Star import, `isPriority` to IndicatorEntry interface
  - Added 5th stat card "Lot 1 (DG)" showing priority count
  - Added "Lot 1" column to desktop table with tango badge
  - Mobile cards: border-l-tango for priority, Lot 1 badge next to code
- Updated API `/api/admin/indicators/[id]` PUT handler to accept `isPriority`
- Verified via Agent Browser: Gouvernance module shows correct counts (8/9, 1/5, 1/2, 3/3) and LOT 1 badges

Stage Summary:
- 43 KPIs Lot 1 marked as priority across 5 domains (PTA has none)
- Visual distinction: tango star badge "Lot 1", row highlight, priority-first sorting
- Files created: prisma/seed-priority.ts
- Files modified: prisma/schema.prisma, KpiModuleView.tsx, AdminKPI.tsx, api/admin/indicators/[id]/route.ts

---
Task ID: 6
Agent: Main
Task: Add filter titles in header + drag-and-drop on Hero KPI cards

Work Log:
- Analyzed uploaded screenshot to understand missing filter titles in header
- Added visible text labels (Année, Trimestre, Mois, Jour, Département) above each inline filter Select in Header.tsx
- Wrapped each filter Select in flex-col div with centered 9px label text in white/70 opacity
- Changed parent flex from items-center to items-end so labels align above selects
- Wrapped ExportDropdown to align with other labeled filters
- Replaced HeroCard with SortableHeroCard using @dnd-kit/sortable in ModuleHeroSection.tsx
- Added GripVertical drag handle to each hero card
- Created DraggableHeroCards wrapper with DndContext, SortableContext, DragOverlay
- Added localStorage persistence via store.cardOrder with key `${domain}__hero`
- Added "Réinitialiser" reset button when custom order exists
- Added HeroCardOverlay for drag overlay visual feedback
- Verified with VLM on desktop: filter labels visible, drag handles on cards, "Indicateurs clés · Glisser pour réordonner" text
- Verified on mobile (iPhone 14): 2-col grid with drag handles, charts visible below

Stage Summary:
- Header.tsx: All 5 inline filter selects now have visible labels (Année, Trimestre, Mois, Jour, Département) on md+ breakpoints
- ModuleHeroSection.tsx: 4 hero KPI cards are now draggable with grip handles, DnD overlay, localStorage persistence, and reset button
- Both changes work on desktop and mobile viewports
- ESLint clean, no compilation errors
- Files modified: Header.tsx, ModuleHeroSection.tsx

---
Task ID: 2
Agent: full-stack-developer
Task: Enhance dashboard API with richer data

Work Log:
- Read worklog.md and existing `/api/dashboard/route.ts` to understand current implementation
- Analyzed Prisma schema: Indicator (isPriority, targetValue, unit), IndicatorValue (quarter field)
- Created `computeStatus()` helper with tri-state logic:
  - Lower-is-better units (jours, nb, h, ratio): value<=target=atteint, value<=target*1.5=partiel, else=non_atteint
  - All other units (%, Mds FCFA, FCFA, km): value>=target=atteint, value>=target*0.8=partiel, else=non_atteint
  - Null value, null target, or zero target → non_atteint
- Created `computeAchievementPct()` helper: for lower-is-better uses target/value, for others uses value/target
- Created `computeTrend()` mapping status to positive/neutral/negative for backward compat
- Added `quarter` query param support: filters IndicatorValue.quarter when provided
- Added per-domain status counts (atteint, partiel, non_atteint) and weighted `performance` field
- Added global `statusCounts` object with {atteint, partiel, non_atteint}
- Added `priorityStats` with status breakdown for 43 isPriority indicators
- Added `topPriorityIndicators`: first 6 priority KPIs sorted worst-first by achievementPct, each with id/name/code/unit/targetValue/value/domain/status/achievementPct
- Replaced old binary score (value>=target only) with weighted: atteint=100%, partiel=50%, non_atteint=0%
- Fixed projectSummary.avgProgress division-by-zero guard when no projects exist
- Verified: lint clean, API returns correct shape with all new fields
- Tested with and without quarter filter (quarter=1 vs default): results differ correctly

Stage Summary:
- `/api/dashboard` now returns 8 top-level fields: summary, globalPerformance, totalIndicators, statusCounts, priorityStats, topPriorityIndicators, projectSummary, lastUpdated
- Each domain in summary now includes: count, atteint, partiel, non_atteint, performance (weighted), indicators[]
- Global performance uses weighted scoring (atteint=100, partiel=50, non_atteint=0) instead of binary
- Quarter filtering via `?quarter=N` query param
- Files modified: src/app/api/dashboard/route.ts

---
Task ID: 3
Agent: Main
Task: Redesign DashboardAccueil with premium executive dashboard

Work Log:
- Analyzed user's reference dashboard screenshot (7 flat metric cards) to understand desired direction
- Enhanced `/api/dashboard` API via subagent: added statusCounts, priorityStats, topPriorityIndicators, per-domain performance
- Completely rewrote DashboardAccueil.tsx (~560 lines) with 7 rich sections:
  1. Executive Summary Strip: 6 compact KPI cards (Score Global with mini gauge, Total KPI, Atteint/Partiel/Non Atteint with percentages, Lot 1 DG)
  2. Performance par Domaine: Horizontal bar chart with tooltips showing A/P/NA breakdown, clickable bars
  3. Répartition par Statut: Donut chart with legend showing counts + mini progress bars
  4. Accès Rapide par Domaine: 6 clickable domain cards with stacked status bars (green/amber/red) and performance %
  5. KPI Lot 1 Points d'Attention: Top 6 worst-achieving priority KPIs with progress bars, status badges, value/target
  6. Aperçu des Projets: Project stats grid (4 metrics), average progress bar, budget consumption card
  7. Alertes Critiques: Cards for indicators below 60% achievement, sorted worst-first
- Created MiniGauge component (SVG semicircle arc gauge with animation)
- Created StatPill component (compact icon+label+value card)
- Responsive: 2-col mobile, 3-col sm, 6-col xl for strips
- All domain cards and chart bars are clickable → navigate to module
- Verified on desktop (1440x900) via Agent Browser + VLM: all 7 sections visible, real data (116 KPI, 62% global, etc.)
- Verified on mobile (iPhone 14): 2-col grids, vertical chart stacking, all readable
- Verified domain card click navigates to Finance module correctly
- No console errors, ESLint clean

Stage Summary:
- Dashboard redesigned from basic mock-data gauge + simple cards to a data-driven executive dashboard with 7 rich sections
- Uses real API data (no more mock fallback) with weighted performance scoring
- Files rewritten: src/components/cockpit/DashboardAccueil.tsx
- Files modified: src/app/api/dashboard/route.ts (enhanced by subagent)

---
Task ID: 6
Agent: Explore
Task: Investigate KPI-module bug — "KPIs assignés à un module depuis 'Indicateurs KPI' n'apparaissent pas sur la vue module"

Work Log:
- Read worklog for full project context (Tasks 1–6, 2 subagent tasks)
- Analyzed Prisma schema: Indicator has `domain` field (String) and `isActive` (Boolean @default true). No explicit relation/link table between indicators and modules — assignment is purely via the `domain` field.
- Analyzed AdminKPI.tsx: The admin "Indicateurs KPI" page creates/edits KPIs via POST/PUT to `/api/admin/indicators`. The `domain` field is set via a Select dropdown with 6 English keys: governance, finance, operational, rh, risque, pta. These match exactly the ModuleKey type in store.ts.
- Analyzed 6 module wrappers (GovernanceModule, FinanceModule, OperationalModule, RHModule, RisqueModule, PTAModule): All are thin wrappers that pass a hardcoded `domain` string to both `ModuleHeroSection` and `KpiModuleView`.
- Analyzed KpiModuleView.tsx: Fetches `/api/indicators/domain?domain=X&year=Y` in useEffect. Parses `data.indicators`. Groups by `subDomain`, creates tabs, renders table/cards. Returns null if indicators.length === 0.
- Analyzed ModuleHeroSection.tsx: Also fetches `/api/indicators/domain?domain=X&year=Y`. Shows hero cards (hardcoded codes or priority fallback), donut chart, bar chart. Returns null if indicators.length === 0.
- Analyzed `/api/indicators/domain/route.ts`: Queries `db.indicator.findMany({ where: { domain, isActive: true } })` with included values filtered by year/quarter/month. Returns `{ indicators: [...] }`.
- Analyzed `/api/admin/indicators/route.ts` (POST): Creates indicator with the provided domain. Does NOT set isActive explicitly — relies on Prisma default (true).
- Analyzed `/api/admin/indicators/[id]/route.ts` (PUT): Can update domain, isActive, isPriority, etc.
- Verified domain key consistency: Admin DOMAIN_LABELS keys, module wrapper domain props, and API queries all use identical English keys (governance, finance, operational, rh, risque, pta).
- Verified DB state: 116 indicators, all isActive=true, all with valid domain keys matching the 6 modules.
- Verified with live API test: Created a test KPI via POST `/api/admin/indicators` with domain="governance". Confirmed it appeared in GET `/api/indicators/domain?domain=governance`. Then cleaned up.
- Checked for caching: No Next.js route caching config, no service worker, no middleware. Route handlers use `request` param (auto-dynamic). Client-side fetch in useEffect (not cached).
- Checked Header.tsx filters: Year, Quarter, Month, Period, Department filters. Department filter is set in store but NOT passed to module view API calls (dead filter — minor issue, not root cause).
- Checked page.tsx navigation: AnimatePresence with mode="wait", key changes between admin/module views trigger proper remount.

Root Cause Analysis:
After exhaustive investigation, the core data flow is CORRECT — there is no code-level bug preventing KPIs from appearing. The domain field consistently links admin-created KPIs to module views. However, the following factors likely contribute to the user's perception of this bug:

1. **PRIMARY ISSUE — No values entry mechanism in AdminKPI**: When a KPI is created from AdminKPI, it has ZERO IndicatorValue records. The KPI appears in the module view with "—" for all values and "Non atteint" status. There is NO UI in the admin to add values. The module view correctly renders the KPI row, but it shows no data, making it appear "empty" or "not really there" to the user.

2. **No explicit "module assignment" feedback**: The admin form uses a generic `domain` dropdown. There is no visual confirmation like "This KPI will appear on the Gouvernance module" or a link to navigate to that module after saving. The user has no clear understanding that setting the domain IS the assignment.

3. **ModuleHeroSection uses hardcoded hero codes**: Only specific KPIs (e.g., GOV-001, GOV-008, GOV-009, GOV-010 for governance) appear in the prominent hero cards at the top. A newly created KPI will NOT appear in the hero section unless it matches a hardcoded code or is marked as priority. It will only appear in the lower KpiModuleView table — which the user may not scroll to.

4. **Department filter is dead code**: The Header has a Département filter that updates `filters.departmentId` in the store, but neither KpiModuleView nor ModuleHeroSection pass `departmentId` to their API calls. If a user sets a department filter expecting it to affect the module view, nothing happens.

What needs to be fixed:
- Add a values/saisie entry mechanism in AdminKPI or create a separate "Saisie des valeurs" admin page so KPIs can have actual data
- Add post-save navigation or confirmation linking to the target module view
- Consider making the hero section dynamic (auto-select based on priority or recent values) rather than hardcoded codes
- Either implement the department filter in the module view APIs or remove it from the Header for module views
- Consider adding a visible "assigned module" badge/indicator in the admin KPI list to make the domain→module mapping explicit

Files investigated (not modified):
- src/components/admin/AdminKPI.tsx
- src/components/cockpit/KpiModuleView.tsx
- src/components/cockpit/ModuleHeroSection.tsx
- src/components/cockpit/GovernanceModule.tsx (and 5 other module wrappers)
- src/app/api/indicators/domain/route.ts
- src/app/api/indicators/route.ts
- src/app/api/admin/indicators/route.ts
- src/app/api/admin/indicators/[id]/route.ts
- src/app/api/dashboard/route.ts
- src/app/page.tsx
- src/components/cockpit/AppSidebar.tsx
- src/components/cockpit/Header.tsx
- src/lib/store.ts
- prisma/schema.prisma
- prisma/seed-kpi.ts
- next.config.ts
---
Task ID: 2-a
Agent: Main
Task: Replace homepage KPI cards with specific indicators from user's reference image

Work Log:
- Analyzed user's uploaded image to extract desired KPIs per domain (6 domains × 2 KPIs each)
- Queried DB to find matching indicator codes:
  - governance: GOV-011 (Tenue des AG), GOV-015 (Taux exécution marchés publics)
  - finance: FIN-001 (Taux exécution CA), FIN-002 (Taux exécution charges)
  - operational: OP-001 (Localités couvertes), OP-003 (Lignes backbone KM)
  - rh: RH-007 (Objectifs stratégiques), RH-006 (Croissance effectifs)
  - risque: RIS-002 (Projets en retard), RIS-005 (Résolution incidents RNHD)
  - pta: PTA-005 (FO déployé exploitable), PTA-007 (e-services déployés)
- Added HOMEPAGE_KPI_CODES constant mapping domain → [code1, code2]
- Updated DomainKpiCard to filter by HOMEPAGE_KPI_CODES (maintaining defined order)
- Removed priorityCodes prop (no longer needed)
- Hidden "nb" unit from display (not meaningful to users)
- Verified via Agent Browser: all 6 cards show correct KPIs in correct order

Stage Summary:
- File: src/components/cockpit/DashboardAccueil.tsx
- Added HOMEPAGE_KPI_CODES constant with 12 specific indicator codes
- DomainKpiCard now uses code-based selection instead of priority-based
- "nb" unit hidden from display, "km" and "%" units shown

---
Task ID: 2-b
Agent: Main
Task: Fix KPI↔module bug — ModuleHeroSection had wrong indicator codes

Work Log:
- Investigated root cause: DOMAIN_CONFIG.heroCodes used wrong prefixes
  - operational: OPS-001→OP-001, OPS-002→OP-003, etc.
  - rh: HR-001→RH-006, HR-002→RH-007, etc.
  - risque: RSK-001→RIS-002, RSK-002→RIS-003, etc.
  - pta: was empty → added PTA-003, PTA-005, PTA-006, PTA-007
- Fixed all heroCodes to use correct DB indicator codes
- Verified via Agent Browser: Opérationnel shows OP-001/OP-003/OP-004/OP-005, PTA shows PTA-003/PTA-005/PTA-006/PTA-007
- Secondary finding: newly created KPIs don't appear in hero section (expected — they have no values). They DO appear in the KpiModuleView table.

Stage Summary:
- File: src/components/cockpit/ModuleHeroSection.tsx
- Fixed 4 domain configs (operational, rh, risque, pta) with correct indicator codes
- PTA hero section now has 4 indicators instead of 0

---
Task ID: 7
Agent: Main
Task: Fix admin sidebar scrolling, add DnD on homepage, add global search in header

Work Log:
- Fixed admin sidebar scrolling: added `h-full` to `<aside>` in AdminLayout.tsx so it constrains to parent height instead of expanding with content. The nav inside already had `overflow-y-auto`.
- Added drag-and-drop to homepage ExecutiveStrip (DashboardAccueil.tsx):
  - Imported @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
  - Renamed DomainKpiCard → SortableDomainKpiCard with useSortable hook
  - Added GripVertical drag handle to each card header
  - ExecutiveStrip wraps cards in DndContext + SortableContext
  - Order persisted via store.cardOrder with key 'homepage-domains'
  - Added "Glisser pour réordonner" hint text above the grid
  - Fixed React hooks rule violation (useSortable called before early return)
- Added global search to header (Header.tsx):
  - Created /api/search/route.ts: searches indicators by name/code/subDomain, also searches by domain label for modules
  - Added GlobalSearchDialog component using CommandDialog from shadcn/ui
  - Search button in header (desktop: styled input-like button with ⌘K shortcut hint, mobile: icon button)
  - Keyboard shortcut Ctrl+K/Cmd+K to open search
  - Results grouped by domain with colored dots, KPI codes, values, and targets
  - Clicking a result navigates to the corresponding module
  - Debounced search (250ms) with loading spinner
  - Admin view also gets search icon
  - Fixed missing useMemo import
- Verified all 3 features via Agent Browser:
  - Sidebar: height=1104.5px matches parent, stays fixed when content scrolls
  - DnD: grip handles visible on all 6 cards, "Glisser pour réordonner" text visible
  - Search: typing "fin" shows Finance module + 12 financial KPIs, clicking a result navigates to Finance module

Stage Summary:
- Admin sidebar is now fixed (h-full prevents it from scrolling with content)
- Homepage domain cards are draggable with persistent order
- Global search (Ctrl+K) searches KPIs and modules with navigation
- Files created: src/app/api/search/route.ts
- Files modified: src/components/admin/AdminLayout.tsx, src/components/cockpit/DashboardAccueil.tsx, src/components/cockpit/Header.tsx

---
Task ID: 4-a/4-b/4-c/4-d
Agent: Main
Task: SystemSetting model, settings API, export API, module documents

Work Log:
- Task 4-a: Added `SystemSetting` model (id, key, value, updatedAt, createdAt) to prisma/schema.prisma. Ran `db:push` to sync.
- Task 4-b: Created `/api/admin/settings` route (GET: flat key-value object with JSON parsing; PUT: upsert by key). Updated AdminSettings.tsx:
  - Added `PERSIST_KEYS` array for 6 export settings (pdfTemplate, pptTemplate, excelTemplate, defaultExportFormat, includeLogo, includeGenerationDate)
  - Added `fetchPersistedSettings()` callback that merges DB settings into local state on mount
  - Replaced fake `setTimeout` in `handleSave` with real API calls (PUT for each PERSIST_KEY via Promise.allSettled)
  - Toast notification shows success or partial failure count
- Task 4-c: Created `/api/export` route that reads SystemSetting values, fetches indicators with values for given module/filters. Updated ExportDropdown in Header.tsx:
  - Replaced `console.log` handlers with real API calls to `/api/export`
  - Added `ExportResponseData` interface
  - Fetches `defaultExportFormat` from settings API to show "Par défaut" badge on the default format
  - Excel export generates CSV (with BOM, semicolon separator for French Excel)
  - PDF export generates styled HTML table (respects includeLogo/includeGenerationDate settings)
  - Both trigger file download via Blob URLs
  - Loading state with spinner, toast on success/error
- Task 4-d: Created `ModuleDocuments` component that fetches documents from `/api/admin/documents?module={key}`. Shows card with "Documents & Ressources liées" header, type badges (Lien/SharePoint/OneDrive/Teams), external link icons, hover effects. Returns null when no documents exist. Added `<ModuleDocuments>` to all 6 module wrappers (Governance, Finance, Operational, RH, Risque, PTA).

Stage Summary:
- SystemSetting model added to Prisma schema and DB
- Settings CRUD API at /api/admin/settings (GET flat object, PUT upsert)
- AdminSettings.tsx now persists Export & Rapports settings to DB
- Export API at /api/export returns structured indicator data with settings
- ExportDropdown generates CSV (Excel) or HTML (PDF) downloads with toast feedback
- ModuleDocuments component shows linked documents in all 6 module views
- Files created: src/app/api/admin/settings/route.ts, src/app/api/export/route.ts, src/components/cockpit/ModuleDocuments.tsx
- Files modified: prisma/schema.prisma, src/components/admin/AdminSettings.tsx, src/components/cockpit/Header.tsx, 6 module wrappers
---
Task ID: 3
Agent: Main Agent
Task: Add 2-second visual indicator when searching for a KPI + Connect Export & Rapports

Work Log:
- Added `highlightIndicatorId` and `setHighlightIndicatorId` to Zustand store (non-persisted)
- Modified GlobalSearchDialog in Header.tsx to set highlight ID on indicator search select, with 2.5s auto-clear
- Added CSS keyframe animation `kpi-highlight-pulse` in globals.css (2s ease-out, tango orange glow)
- Added `.kpi-highlight` class for cards and `.kpi-highlight-row` class for table rows
- Implemented DOM-based highlight approach in KpiModuleView, ModuleHeroSection, and DashboardAccueil using useEffect that watches highlightIndicatorId, finds element by ID, applies CSS class, and removes after 2s
- Added scroll-into-view behavior for highlighted indicators
- Created SystemSetting model in Prisma schema and pushed to DB
- Created GET/PUT /api/admin/settings for settings persistence
- Created GET /api/export route that reads export settings from DB, fetches indicators with values
- Updated AdminSettings.tsx to load/save Export & Rapports settings to DB via API
- Updated ExportDropdown in Header.tsx to call real export API, generate CSV (Excel) and HTML (PDF) downloads, show toast notifications, and display "Par défaut" badge based on saved settings
- Created ModuleDocuments component showing linked documents per module
- Added ModuleDocuments to all 6 module views (Governance, Finance, Operational, RH, Risque, PTA)

Stage Summary:
- KPI search highlight: Working with 2-second pulse animation (tango orange glow), scrolls to element
- Export & Rapports settings: Persisted to DB, connected to header export dropdown
- Export buttons: Generate real CSV/HTML downloads with indicator data
- Module documents: Fetched from DB and displayed as linked list in each module view
- All lint checks pass, no runtime errors

---
Task ID: highlight-3beat-echo
Agent: Main
Task: Add 3-beat echo highlight animation on KPI search + auto-switch to correct sub-domain tab

Work Log:
- Updated CSS `@keyframes kpi-highlight-echo` in `globals.css` with 3 distinct pulse beats (0-16%, 33-49%, 66-82%) over 2 seconds using tango orange (#f18120) with decreasing intensity
- Added `highlightSubDomain: string | null` and `setHighlightSubDomain` to Zustand store (`src/lib/store.ts`)
- Added `subDomain` field to search API response (`src/app/api/search/route.ts`)
- Updated `SearchResult` interface in Header.tsx to include `subDomain: string | null`
- Updated `handleSelect` in Header.tsx to set both `highlightIndicatorId` and `highlightSubDomain` when selecting a KPI result, with 2500ms auto-clear
- Refactored `KpiModuleView.tsx` Tabs from uncontrolled (`defaultValue`) to controlled (`value`) using a derived `activeTab` useMemo that prioritizes: (1) highlightSubDomain, (2) user's manual tab selection, (3) default first tab
- Used `manualTab` state (set via `onValueChange` event handler) to avoid lint violations (no setState in effects)
- Verified via Agent Browser: searching "rentabil" → clicking FIN-006 → Finance module loads → "Rentabilité & Performance" tab auto-selects → row gets `kpi-highlight` + `kpi-highlight-row` classes → 3-beat echo animation plays for 2 seconds

Stage Summary:
- 3-beat echo pulse animation CSS with 3 decreasing-intensity pulses
- Sub-domain aware navigation: search result carries subDomain info, KpiModuleView auto-switches to correct tab
- Controlled Tabs pattern using derived value (no lint violations)
- Files modified: `globals.css`, `store.ts`, `api/search/route.ts`, `Header.tsx`, `KpiModuleView.tsx`

---
Task ID: fix-tab-sticky-hydration-pta-import
Agent: Main
Task: Fix tab reverting after highlight clears, fix hydration error, correct PTA label, add PowerPoint import

Work Log:
- **Tab persistence**: Changed `highlightSubDomain` to persist (not cleared by timeout). Only `highlightIndicatorId` clears after 2.5s for the animation. `highlightSubDomain` is cleared when: (a) user manually clicks a tab via `onValueChange`, (b) user clicks sidebar module via `setActiveModule`, (c) user searches for a module. Used `useState(manualTab)` set only from `onValueChange` event handler (lint-safe).
- **Hydration error**: ThemeToggle used `theme` (differs SSR vs client). Fixed by using `resolvedTheme` from next-themes which is `undefined` during SSR, rendering a placeholder `<div>` that matches both server and client.
- **PTA label**: Changed "Plan Triennal d'Actions" → "Plan de Travail Annuel" in: Header.tsx MODULE_LABELS, DashboardAccueil.tsx DOMAIN_META, AdminDataSources.tsx MODULE_LABELS, api/search/route.ts DOMAIN_LABELS. Sidebar keeps short "PTA" label.
- **PowerPoint import**: Added `jszip` package. Created `/api/import/pptx` route with POST (analyze) and PUT (apply) handlers. POST parses PPTX ZIP, extracts tables from slides, matches KPI codes (regex `CODE-XXX`), returns preview. PUT upserts indicator values in DB. Added `ImportPptxButton` component in Header.tsx with file picker, analyze preview table, and apply button.
- Store `setActiveModule` now clears `highlightSubDomain` and `highlightIndicatorId` to prevent stale highlights.

Stage Summary:
- Tab stays on correct sub-module after search highlight animation ends
- No more hydration mismatch errors from ThemeToggle
- PTA = "Plan de Travail Annuel" across all labels
- PowerPoint import button in header with analyze → preview → apply workflow
- Files modified: store.ts, Header.tsx, KpiModuleView.tsx, DashboardAccueil.tsx, AdminDataSources.tsx, api/search/route.ts
- Files created: api/import/pptx/route.ts
- Package added: jszip
