# CLAUDE.md — UYSOT Shartnomalar CRM

This file describes the codebase for AI assistants working on this project.

## Project Overview

UYSOT is a **single-page SaaS CRM dashboard** for contract management and revenue analytics. It is a fully client-side application with no backend — all data comes from Google Sheets published as CSV. The UI is localized in **Uzbek**.

**Core use case:** Track Monthly Recurring Revenue (MRR), contracts, payments, debts, and manager/client performance for a property rental or subscription business.

---

## Architecture

### No Build System

This is **vanilla JavaScript** with no bundler, no npm, no TypeScript. Do not introduce build tooling or dependencies. Libraries are loaded via CDN in `index.html`.

### CDN Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| Chart.js | 4.4.1 | Charts (line, bar, doughnut) |
| PapaParse | 5.4.1 | CSV parsing from Google Sheets |
| Google Fonts | CDN | Outfit + IBM Plex Mono |

### File Structure

```
index.html      — HTML shell, CDN script tags, sidebar nav, page containers
core.js         — Global state, utilities, financial calculations
app.js          — Dashboard range calculations, MRR trend analysis, chart rendering
pages.js        — Page-level UI rendering functions
config.js       — Chart initialization, data loading, configuration modal
styles.css      — Full design system (tokens, themes, components)
uysot_config.json — Google Sheets CSV URLs keyed by data source name
start.bat       — Windows dev server: `npx -y serve . -p 3000 -s`
```

---

## Core Conventions

### Global State Object `S`

All application state lives in a single global object `S` defined in `core.js`. Do not fragment state into module-level variables. Key fields:

```js
S.contracts   // Array of processed contract objects
S.payments    // Payment records
S.mrr         // MRR snapshots by date
S.clients     // Client data
S.page        // Currently active page name
```

### Caching with `cached(key, fn)`

Expensive computations must be wrapped in `cached()`. The cache is keyed by string. Invalidate by clearing `S.cache` when source data changes.

```js
const result = cached('mrrSnapshot_2025-01', () => computeMRR('2025-01'));
```

### Short Variable Name Style

Internal calculation variables use abbreviated prefixes — keep this style when adding new metrics:

- `_mUSD` — monthly USD amount
- `_sUSD` — sum USD
- `_tUSD` — table USD
- `_dur` — duration (months)
- `_pre` — prepayment

### Function Naming

- `calc*` — pure financial computation
- `show*` — DOM rendering / display
- `build*` — constructs data structures from raw input
- `parse*` — parses raw CSV/string data into structured objects

### DOM Manipulation

There is no virtual DOM or reactive framework. UI is updated by direct DOM manipulation. Page containers are shown/hidden by toggling CSS classes. Event handlers use inline `onclick` attributes or are attached after rendering.

### LocalStorage Keys

User preferences are persisted to `localStorage` with the `uysot_` prefix:

| Key | Contents |
|-----|---------|
| `uysot_theme` | `"light"` or `"dark"` |
| `uysot_cards` | JSON — dashboard card visibility settings |
| `uysot_apikey` | Gemini/Claude API key |
| `uysot_geminikey` | Gemini API key |
| `uysot_ai` | AI provider name |
| `uysot_mkt` | JSON — marketing cost entries |
| `uysot_config` | Flag indicating config has been saved |

---

## Data Layer

### Source: Google Sheets → CSV

All data is fetched from Google Sheets published as CSV. URLs are stored in `uysot_config.json`:

```json
{
  "shartnomalar": "<CSV export URL>",  // Main contracts sheet
  "qoshimcha":    "<CSV export URL>",  // Additional contracts
  "payments":     "<CSV export URL>",  // Payment records
  "2024":         "<CSV export URL>",  // 2024 payments archive
  "perevod":      "<CSV export URL>",  // Transfers/conversions
  "mkt":          "<CSV export URL>"   // Marketing costs (optional)
}
```

### No Backend / No Database

There is no server-side logic. All calculations happen in the browser. There is no ORM, no SQL, no REST API of our own.

### Data Language

CSV column headers are in **Uzbek** (sometimes Cyrillic). When working with raw sheet fields, match the exact header strings from the source sheets.

---

## Pages

| Page | Key in `S.page` | Description |
|------|----------------|-------------|
| Dashboard | `dashboard` | KPIs, MRR trend, cash flow |
| Contracts | `contracts` | Full contract list |
| MRR Table | `mrr` | Monthly MRR by client/contract |
| Managers | `managers` | Per-manager performance |
| Clients | `clients` | Client list and metrics |
| Top MRR | `top` | Highest MRR contributors |
| Debts | `debts` | Outstanding debt tracking |

---

## Design System

### CSS Variables (Design Tokens)

All colors, spacing, and typography are defined as CSS custom properties in `:root` and `[data-theme="dark"]`. Do not hardcode color values — use variables:

```css
var(--color-primary)     /* Blue: #1746a2 */
var(--color-success)     /* Green: #117a52 */
var(--color-danger)      /* Red: #c42b1c */
var(--color-bg)          /* Page background */
var(--color-surface)     /* Card background */
var(--color-text)        /* Primary text */
var(--color-text-muted)  /* Secondary text */
```

### Theme System

Light/Dark mode is toggled via `data-theme` attribute on `<html>`. Theme is persisted in `localStorage` under `uysot_theme`. The toggle function is in `core.js`.

### Typography

- **Outfit** — UI text, headings, labels
- **IBM Plex Mono** — numeric values, currency amounts

---

## Key Financial Concepts

These terms appear throughout the code — understand them before modifying calculations:

- **MRR** — Monthly Recurring Revenue. Calculated per-contract based on total contract value divided by duration.
- **NRR** — Net Revenue Retention. Measures revenue expansion/contraction from existing clients.
- **DSO** — Days Sales Outstanding. Average collection time.
- **Churn** — Client stopped paying / contract ended without renewal.
- **Resurrected** — Previously churned client who returned.
- **New / Retained / Expansion / Contraction** — Client lifecycle states tracked month-over-month for MRR waterfall.

---

## Development Workflow

### Running Locally

```bat
start.bat        # Windows: starts npx serve on port 3000
```

Or manually:

```sh
npx -y serve . -p 3000 -s
```

Open `http://localhost:3000` in the browser.

### No Tests

There are no automated tests. Test changes manually in the browser across multiple pages and data states.

### No CI/CD

There is no GitHub Actions, no Docker, no deployment pipeline. Deployment is manual.

### Git Branch Convention

Active development branch: `claude/add-claude-documentation-11rIN`

Commit messages follow:
- `feat:` — new feature
- `fix:` — bug fix
- `update` — metric/data updates

---

## What NOT to Do

- Do **not** introduce npm packages, a bundler (Vite/Webpack), or TypeScript.
- Do **not** add a backend, API routes, or a database.
- Do **not** refactor into ES modules (no `import`/`export`) — the app uses global scripts loaded in order via `<script>` tags.
- Do **not** hardcode color values in CSS — use the design token variables.
- Do **not** add inline styles — use CSS classes.
- Do **not** add English-language UI text — the app is in Uzbek; keep all user-facing strings in Uzbek.
- Do **not** break the `S` global state contract — all state flows through this object.
