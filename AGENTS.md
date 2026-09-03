# 247420 Technical Documentation

## CI/CD Pipeline — How 247420.xyz Gets Built and Deployed

### Workflow: `.github/workflows/ci.yml`

Triggers on every `push` and `pull_request`. Single job: `test`. Runs the live
verification witness (`node verify.mjs`) and the decorative-glyph guard
(`node scripts/lint-glyphs.mjs`) so a regression is caught before it can reach
the deploy workflow. No build step, no test suite, no mock data — `verify.mjs`
loads real project modules (`lib/projects.js`) against the real `lib/showcase.json`
and inspects the actual runtime output (see Architecture below); it is not a
test file and asserts no fixed suite cases, only live-derived facts. `verify.mjs`
and `scripts/fetch-showcase.mjs` resolve paths against their own dir (`__dirname` /
`fileURLToPath`), so they run in any checkout, not just `/dev/247420`.

### Workflow: `.github/workflows/deploy.yml`

Triggers on push to `main` (or `workflow_dispatch`). Single job: `deploy`.

**Step 1 — Prepare `_site`**
```bash
mkdir -p _site
rsync -a --exclude='_site' --exclude='.git' --exclude='saved_videos' --exclude='node_modules' --exclude='.github' . _site/
touch _site/.nojekyll
```
- Everything in repo root (minus exclusions) lands in `_site/`
- `CNAME` file (containing `247420.xyz`) in repo root → copied to `_site/` → tells GitHub Pages the custom domain
- `.nojekyll` disables Jekyll processing

**Step 2 — Deploy**
- `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`
- Deploys `_site/` to GitHub Pages at `https://247420.xyz`

### Custom Domain: 247420.xyz

**DNS (gen.xyz registrar)**
- Four A records: `@` → `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`
- CNAME record: `www` → `anentrypoint.github.io`

**Domain verification — personal account (lanmower)**
- TXT record: `_github-pages-challenge-lanmower.247420.xyz` = `7fd255132d4991c2fdd208aea097d1`

**Domain verification — AnEntrypoint org (required — org owns the repo)**
- TXT record: `_github-pages-challenge-AnEntrypoint.247420.xyz` = `4c2cad18b03f67d1b764f1ab404330`
- Critical: domain must be verified under the org that owns the repo

**Repo Pages settings**
- https://github.com/AnEntrypoint/247420/settings/pages → Custom domain → `247420.xyz`
- HTTPS enforced after TLS cert approved

**Why domain was initially "taken"**: GitHub stale binding. Fix: verify under AnEntrypoint org → releases it.

---

## Architecture: SPA with Hash-Based Routing

247420 is a single-page application (SPA) with no build tools, no external framework dependencies, and pure ES6 modules.

### Core Modules
- `lib/components.js` — All pages (home, community, lore, tv, org, p) as pure functions rendering via the SDK kit (`window.ds.components`). Exposes `window.__topbar`/`window.__themeToggle` so `community.js` reuses identical chrome without a circular import. (Router now comes from the SDK — the private `lib/router.js` was dropped.)
- `lib/community.js` — CommunityPage + `JoinLink` + the single-source `DISCORD_INVITE` constant. Every join button on the site points at this one constant; a swap is one edit here.
- `lib/projects.js` — Project catalog (single source of truth) + showcase enrichment + `activityFor`/`rankByActivity` (features actually-active repos first).
- `lib/scheduler.js` — Time parsing, slot calculation, UTC synchronization, validation. `getCurrentSlot`/`getUpcomingSlots` feed the TV now-playing strip.
- `lib/video.js` — Native HTML5 video player abstraction with volume control and playback tracking.
- `main.js` — SPA entry, page registration, router init, `renderNowNext`/`renderTv` for the always-visible TV now/next strip (deterministic from scheduler state + a 15s tick while on `/#/tv`). Enforced `<= 200` lines by verify.mjs.
- `styles.css` — Site-specific surfaces on top of the SDK CSS: glyph helpers, connected-row list, community + Discord-CTA surfaces, TV broadcast stage + now/next strip, responsive overrides.
- `schedule.json` — Sub-hourly broadcast montage with video IDs, durations, and titles.
- `verify.mjs` — Live-execution verification: loads real modules (`lib/projects.js`) against real data (`lib/showcase.json`) and inspects the actual output — routes, schedule shape, ranking behavior, module structure, observability. Not a test file; no fixed suite cases, no mocks.

### Architectural Constraints
- **Error-first philosophy**: All errors throw with context. No silent failures, no fallbacks.
- **Client-side observability**: `window.__debug` object exposes router, scheduler, video, and player state permanently for inspection.
- **Pure ES6 modules**: No build step, no bundler, no polyfills. Runs as-is in modern browsers.
- **No external dependencies**: No webjsx, htm, Tailwind, RippleUI, or CDN imports.
- **No test files, ever.** Verification is live execution against real data (`verify.mjs`), not a test suite — an assertion authored alongside its own fix can encode the same misreading the fix does, so "tests pass" only proves the code agrees with itself. When checking a fix, re-read the original request's literal words and exercise the real system, don't just confirm the diff matches its own test.

### Video System
Native HTML5 `<video>` API replaces the previous Schwelevision orchestrator. Playback, volume, and montage control via `lib/video.js`. Sub-second precision for scheduled slots.

### Schedule Format
`schedule.json` exports an array of objects mapping slot times (GMT wall-clock) to video IDs and durations:
```js
{
  t: "H:MM AM/PM",
  v: "string | 'static'",
  d: number,
  title: "string"
}
```
Multiple entries at same time slot play sequentially (montage). Gaps show static/off-air.

### Navigation
All navigation via hash-based routing in `lib/router.js`. Pages available: `#/home`, `#/lore`, `#/tv`, `#/org`, `#/p/<project-code>`.

---

## Organization Page: 247420 as Proof-of-Concept

### Purpose
`/#/org` (rendered by `OrgPage()` in `lib/components.js`, part of the SPA — there
is no standalone `organization.html`) showcases the AnEntrypoint organization
as a collection of creative projects, live off `lib/projects.js` +
`lib/showcase.json`. 247420 is both a standalone creative project and an
exposition of the AnEntrypoint org's broader work.

### Narrative (Professional Standards)
Mission statement: "Building Claude workflows that are rigorous, deterministic, and production-grade. No guessing. No compromises."

Core thesis: "Reproducible AI workflows start with explicit state machines. gm proves the pattern at scale."

### Core Infrastructure Section
Each tool is presented with specific value:
- **gm**: Reproducible Claude workflows via explicit state machines (SPECIFY, PROVE, EMIT, STATE, and onward through DECIDE). Same input, convergent output, every execution. No variance, no randomness, no faith-based engineering.
- **agentplug**: the wasm plugin runtime gm actually runs on — one native host, N shared wasm plugins, no per-host JS wrapper.
- **247420**: Production proof of concept. SPA with deterministic scheduling, sub-second precision broadcasts. Built with identical rigor as the tooling. Demonstrates scalable reproducibility in practice.

### Why This Exists
247420 is production validation. Every gm pattern gets tested at scale with real timing constraints and user traffic — not in labs. The broadcast system and scheduler aren't theoretical claims — they're measurable properties of shipping code.

### Features
- **Featured projects**: activity-ranked (real 14-day commit count, not stars — see `rankByActivity` below), catalog count is live off `lib/projects.js`, not a fixed number pasted into this doc
- **Recent work**: the `#/blog` route (`lib/blog-posts.json`, sourced from `AnEntrypoint/247420-blog`) carries real weekly-progress posts generated from actual commit history — not meta-work about the page
- **Dark theme**: CSS custom properties, no external framework
- **Professional tone**: Authentic technical voice, specific context, measurable claims

### Exposition Strategy

**Lead with problems solved, not features:**
- Each tool description starts with explicit problem statement
- Format: "The problem: X. Solution: Y."
- 247420 serves as proof-of-concept exemplar, not side project
- Shows integration of ideas, not isolated features

**What to preserve:**
- Original page authenticity baseline—don't over-edit
- Technical rigor in problem/solution framing
- 247420's role as proof that philosophy works in practice

---

## Content Authenticity: LLM-Generated Speech Patterns

When editing site copy, scrub LLM giveaways (buzzwords, clichés) but preserve em dashes, stoner-aesthetic branding, jargon, and frozen git history. Detail in rs-learn (recall "content authenticity LLM speech patterns").

---

## window.__debug: Read-Only Property Set by Design SDK

SDK pre-defines `window.__debug` read-only; never reassign it, set properties directly (`window.__debug.myProp = value`). Detail in rs-learn (recall "window.__debug read-only").

---

## Pro-Rata Kit Usage — Every Page Slot Maps to an SDK Kit

`anentrypoint-design/ui_kits/` ships reference apps demonstrating canonical compositions of the SDK primitives. Each 247420 page maps onto one of those kits and inherits its grammar — no bespoke per-page CSS surface where a kit already covers it.

**Current mapping:**

| Page | Kit | Grammar used |
|------|-----|--------------|
| `/#/home` | `ui_kits/homepage` | `C.Hero` (asymmetric `.ds-hero` grid) + `Currently shipping` Panel + `Works · N of N` Panel with click-to-expand `.row` + `.work-detail` chips/buttons + `Manifesto` block |
| `/#/p/<slug>` | `ui_kits/project_page` | `C.Side` rail (project/reference/links) + narrow main + h1+Lede+chip strip + `// install` + `C.Install` + `// metadata` + `C.Receipt` rows |
| `/#/community` | `ui_kits/project_page` narrow pattern | `Heading`+`Lede` hero with the loudest `JoinLink` on the site + `Panel`s of `.row`s ("what goes on in there", "how to show up") + a second-CTA block + `// house voice` Manifesto. The Discord is the through-line — invite is the loudest element, repeated 3×. |
| `/#/lore` | `ui_kits/homepage` Writing pattern | Single Panel of numbered `.row`s, click-to-expand `.work-detail`, `// chronicles` Manifesto below |
| `/#/org` | `ui_kits/gallery` + `ui_kits/homepage` hybrid | `C.Side` jump-nav (links group leads with `discord`) + hero Panel + one Panel per category with `.row` catalog |
| `/#/tv` | none (no SDK kit covers video broadcast) | `AppShell` chrome + `.tv-stage` + an always-visible `.tv-nownext` now-playing/up-next strip (fed by `main.js renderNowNext` from scheduler state) + `.tv-guide-overlay` (full guide, secondary) + a `this channel is fed by the room` community tie-in Panel with a join CTA. |

**Site-wide Discord presence:** `Community` is a top-level nav item (`NAV_ITEMS` in `components.js`); every page's `Status` footer right slot carries a persistent `discord` join link; the home page has a `.home-join` banner between hero and works; project pages end with a `.project-contribute` invite. All point at `DISCORD_INVITE` in `lib/community.js` (single source).

**Rules:**

1. **No reinvention.** If the SDK ships `C.Topbar`, `C.AppShell`, `C.Crumb`, `C.Status`, `C.Side`, `C.Panel`, `C.Install`, `C.Receipt`, `C.Chip`, `C.Heading`, `C.Lede`, `C.Manifesto`, `C.Dot` — use them. Do not write a local `Topbar()` or `.expo-card` or `.project-hero` block.
2. **Class names are the SDK's.** Catalog rows use `.row`/`.code`/`.title`/`.sub`/`.meta`. Panel headers use `.panel-head`. CLI blocks use `.cli`/`.prompt`/`.cmd`. Prose uses `.ds-prose`. Manifestos use `.ds-manifesto`. Site-specific class names are reserved for surfaces the SDK has no equivalent for.
3. **Allowed local CSS** (currently in `styles.css`, ~120L total): glyph color helpers (`.g-green` etc.), `.row-glyph`, `.panel-head-link`, `.work-detail-chips`, `.project-head/.project-glyph/.project-eyebrow/.project-body/.project-chips` (project-page-kit's local hero block), `.cli-line/.cli-cmt` (SDK ships `.cli` shell but not the per-line elements), `.crumb-link/.app-crumb .crumb-right`, all `.tv-*` (the one truly custom surface). The homepage hero has no local CSS — it renders entirely via the SDK's `C.Hero`.
4. **Forbidden:** inline `style="..."` strings on SDK-rendered elements (`.panel`, `.row`, `.app-*`). Site changelog v0.0.99 + AGENTS.md ban this. Use a class.

## Design SDK Components — Use the Kit, Not Local Reimplementations

`anentrypoint-design` ≥ v0.0.113 ships the full chrome and content component family on `window.ds.components` (alias `C`). Confirmed exports include:

- **Chrome**: `Topbar`, `Crumb`, `Side`, `Status`, `AppShell`, `Brand`, `ThemeToggle`
- **Primitives**: `Btn`, `Chip`, `Glyph`, `Dot`, `Rail`, `Heading`, `Lede`
- **Content**: `Panel`, `Row`, `RowLink`, `Section`, `Hero`, `Install`, `Receipt`, `Changelog`, `WorksList`, `WritingList`, `Manifesto`, `Kpi`, `Table`, `Form`
- **Composites**: `HomeView`, `ProjectView`
- **Theme**: `applyTheme(mode)`, `getTheme()`, `resolvedTheme()`, `initTheme()` where `mode` ∈ `auto | paper | ink`

**Use the kit; do not hand-roll equivalents.** `lib/components.js` delegates to `C.Topbar`, `C.AppShell`, `C.Crumb`, `C.Status`, `C.Panel`, `C.Section`, `C.Chip`, `C.Heading`, `C.Lede`, `C.ThemeToggle` for chrome and standard content. Site-specific surfaces (`.expo-card`, `.expo-hero`, `.tv-*`, `.lore-rule`, `.project-hero`, `.org-*`) live in `styles.css` and have no SDK equivalent — that's the only kind of CSS that belongs locally.

**Theme:** `<html class="ds-247420" data-theme="auto">` is the canonical root. The SDK auto-inits on import and writes `data-theme` back to `<html>`. Don't override `html`/`body` background or color — the SDK's `.app` paint and theme tokens cascade through.

**Reference:** `C:\dev\anentrypoint-update\app.html` is the canonical look. When in doubt, check what `C.AppShell({topbar, crumb, side, main, status, narrow})` produces there.

### Non-Obvious Caveat — Inline Styles

SDK changelog v0.0.99 banned inline `style="..."` strings on SDK-rendered elements. The site enforces the same rule: prefer CSS classes in `styles.css` over inline styles for anything that survives more than one page.

### Non-Obvious Caveat — SDK Mobile Viewport-Height Clamp

SDK app-shell clamps `.app` to `100vh`/`overflow:clip` + inner-scrolls `.app-main` below desktop width, trapping mobile content. Fix: `styles.css` `@media(max-width:900px)` overrides scoped to `.ds-247420` release the clamp (`height:auto`/`overflow:visible`); cap at 900px so desktop inner-scroll is preserved. Detail in rs-learn (recall "SDK mobile viewport-height clamp").

### Non-Obvious Caveat — `.app-main` Flex-Column Shrink (desktop)

`.app-main` is a flex column; its children default to `flex-shrink:1`, so a tall panel gets squashed below its content height (clipped rows) and later siblings overlap it. Fix: `styles.css` `.ds-247420 .app-main > * { flex: none }` pins each child to content height so `.app-main` scrolls through them. Detail in rs-learn (recall "app-main flex-column shrink").

### Non-Obvious Caveat — Connected Row List + Project Title Echo

Stacked SDK `.row`s (14px radius) read as detached pills — join them into one list with rounded outer corners only, using `.panel-body`-anchored structural selectors (rows are wrapped in unclassed `<div>`s on home/lore). Project crumb leaf must be `p.code` not `p.title` (else the leaf duplicates the h1). Detail in rs-learn (recall "row group outer radius").

### Non-Obvious — Featured Projects = Actually-Active (not stars)

The home work-list and org "reach for first" rail feature projects by GitHub **activity**, not stale stars. `scripts/fetch-showcase.mjs` captures `pushed_at`+`archived` into `lib/showcase.json` (deploy.yml re-runs it every deploy + weekly cron); `lib/projects.js` exports `activityFor(code)` (tier 2=active≤30d / 1=dormant / 0=archived) and `rankByActivity()` (tier, then recency, then stars tie-break). `activityFor` reads the RAW showcase entry — `showcaseFor()` hides `missing` ones. Reach-for-first must only point at non-archived catalog projects (gm-cc was archived + uncatalogued → 404). Detail in rs-learn (recall "featured actually-active project ranking").

### Non-Obvious Caveat — Merged Chrome Bar (single header, not stacked)

SDK `AppShell` folds `topbar`+`crumb` into ONE `.app-chrome` flex band when both are passed (was two stacked bars / "double title bar"); either prop alone renders standalone so other consumers are unaffected. Chrome drops from 88px to ~63px; responsive nav scrolls not clips; site `.crumb-link`/`.app-crumb .crumb-right` overrides still apply. Note `dist/` is tracked-but-gitignored (`git add -f` to commit a rebuild); `npm publish` needs auth the agent may not hold. Detail in rs-learn (recall "merged chrome bar single header").

---

## Learning Audit

| Date | Items Checked | Migrated to rs-learn | Retained in AGENTS.md | Notes |
|------|---------------|----------------------|-----------------------|-------|
| 2026-05-01 | 5 | 0 | 5 | CI pipeline, DNS, module gate, video system, routing. rs-learn store empty; all items retained. design-sdk caveat (new) ingested to rs-learn. |
| 2026-05-01 | 5 | 0 | 6 | Audit: CI pipeline, DNS config, 200L gate, design-sdk components, video system. exec:recall unavailable this run; all retained. window.__debug readonly caveat added. |
| 2026-05-01 | 2 | 0 | 2 | Test assertions: guide page removed (added p), schedule format (127 sub-hourly entries not 24-hourly), main.js 137L, styles.css 245L. Core modules and schedule sections updated. |
| 2026-05-19 | 7 | 0 | 7 | Design refresh against anentrypoint-design ≥ v0.0.113 + anentrypoint-update reference. lib/components.js now delegates Topbar/Crumb/Status/AppShell/Panel/Section/Chip/Heading/Lede/ThemeToggle to SDK. styles.css trimmed to genuine site-only surfaces (expo, tv, lore, project, org). index.html sets `<html class="ds-247420" data-theme="auto">`, calls initTheme(). Browser-witnessed: home/lore/tv/org/project routes render, paper bg `rgb(246,245,241)`, ink bg `rgb(19,19,24)`, no console errors. Stale v0.0.29 "components not exported" caveat removed. |
| 2026-05-19 (pm) | 9 | 0 | 9 | Pro-rata kit migration. All 5 pages mapped onto SDK kits per the table above: home→homepage, project→project_page, lore→homepage Writing, org→gallery+homepage hybrid, tv→chrome-only. Deleted `.expo-card/.expo-hero/.expo-grid/.expo-detail-*/.expo-group-*` (~140L CSS), `.lore-rule/.lore-intro/.lore-emph` (~25L), `.project-hero/.project-detail-grid/.project-feature*/.project-meta-grid` (~70L), `.org-block/.org-grid/.org-card-*/.org-pinned/.org-cat-*` (~50L) — total ~285L CSS deleted; styles.css now 143L. components.js renders via `.row`/`.panel`/`.cli`/`.ds-prose`/`C.Install`/`C.Receipt`/`C.Manifesto`/`C.Side`/`C.Dot`. Test 10 enforces no-`.expo-*`/`.lore-rule`/`.org-block` regression. Browser-witnessed: 33 rows on home (kit-hero ✓), 6 commandment rows on lore, 36 rows + 11-item Side rail on org, project page with Side rail + Install + Receipt + 7 chips, all themes (paper/ink). |
| 2026-06-04 | 14 | 1 | 1 | Merged chrome bar GUI audit (max-effort). SDK `AppShell` folds `topbar`+`crumb` into one `.app-chrome` band (`shell.js:238`) instead of two stacked bars; `app-shell.css` lays one ~56px row, hides duplicate brand, responsive nav scroll. Rebuilt SDK dist, bumped 0.0.186 to 0.0.187 (remote concurrent writer had taken 0.0.186), pushed AnEntrypoint/design. npm publish blocked (no local auth) but merge already live: unpkg @0.0.186 carries `.app-chrome`. Browser-witnessed live 247420.xyz all 5 routes: `hasChrome=true sameRow=true chromeH=63 brandHidden=true`, mobile 390px no overflow/overlap; screenshots in `.gm/witness/merged-bar-*`. New "Merged Chrome Bar" caveat added; resolved-mutable memo persisted to rs-learn. Earlier `all-symbols-everywhere` glyph sweep confirms rendered surfaces glyph-clean (build lint-glyphs gate OK). |
| 2026-06-04 (pm) | 15 | 2 | 1 | Featured = actually-active. fetch-showcase.mjs now captures pushed_at/archived into showcase.json (deploy re-runs it + weekly cron added); projects.js gains activityFor()+rankByActivity(); HomePage ranks by activity tier then recency, stars tie-break, gm leads; home rows show active/archived word label. Fixed org reach-for-first gm-cc (ARCHIVED + uncatalogued, 404) became thebird. Added freddie to catalog (code 018). test.js made count-agnostic + asserts activity fields, rankByActivity, no gm-cc, reach slugs resolve non-archived. Converted leftover U+2212 minus glyph converted to ASCII. Browser-witnessed local: home top rows 0-3d active, 20 active tags, thebird resolves, gm-cc 404s. Drained Connected-Row-List caveat to rs-learn pointer; added Featured=active caveat + memo. commits 0888865, f676320. |
| 2026-06-21 | 12 | 1 | 1 | New work sync + CI + portability. Added .github/workflows/ci.yml (push/PR: node test.js + node scripts/lint-glyphs.mjs). Fixed two portability bugs: test.js hardcoded `/dev/247420` became `__dirname`-relative ROOT; fetch-showcase.mjs leading-slash strip became `fileURLToPath` (was building doubled path); also added GITHUB_TOKEN auth (60 to 5000 req/hr) wired in deploy.yml. Catalog 27 to 40: added plugsdk(007) casey(019) gmweb(020) adaptogen(043) busybase(044) statekit(045) audit-cc-tail(055) thatcher(056) mux(078) + new `sandbox` category webix(080)/portabox(081)/portacastle(082)/cors(083). Refreshed stale fallback stars (gm 9 to 14, agentgui 13 to 15, design 0 to 1); regenerated showcase.json to 40 entries w/ live activity. Full-source glyph sweep: U+2500 box dividers + U+2212 minus + U+2026 ellipsis converted to ASCII, guarded by new lint-glyphs.mjs. Reverted stray `@.gm/next-step.md` AGENTS.md import. Browser-witnessed (chromium no-sandbox shim): import('/lib/projects.js') yields 40 projects, 13 new codes, sandbox cat, rankByActivity fn; served assets glyph-clean. SDK full-render blocked by env CDN policy (unpkg unreachable from headless; prod fine), see rs-learn 247420-browser-witness-env. |
| 2026-08-12 | 4 | 0 | 4 | HomePage now drops archived projects from the works list entirely (was showing all with an inline "archived" label) — `projects.filter(p => activityFor(p.code).tier !== 0)` gates entry before gm-lead + rankByActivity. OrgPage's "reach for first" second slot is now activity-derived (`rankByActivity` over non-archived, excluding gm) instead of a hardcoded `['gm','thebird']` pair, so a future archival can't silently strand a stale link the way gm-cc once did. SDK CDN switched from unpkg's npm package (`unpkg.com/anentrypoint-design@latest`, now stale — npm publishing stopped) to jsDelivr's GitHub source (`cdn.jsdelivr.net/gh/AnEntrypoint/design@main`); unpkg's own `gh:` shorthand 404'd on `dist/`, jsDelivr serves it directly (confirmed 200 + real JS/CSS bytes, no eval/child_process in the fetched bundle). Merged a concurrent upstream blog feature (#/blog route, `lib/blog-posts.json`) mid-session after a rebase conflict; resolved by hand-merging .gitignore, regenerating showcase.json live post-merge, and dropping the retired `.gm/memories/.flat-export-done` sentinel to match origin's own memory-corpus untracking. `test.js` 12/12 green post-merge; CI green on pushed HEAD. |
| 2026-08-13 | 6 | 0 | 6 | Featured-projects bug found live: `tier !== 0` only excluded archived repos, so months-dormant ones (portacastle, showpick, assets — real last commit 2.5mo/no real commits) still rendered on the homepage, just unranked-active. This was the 4th+ recurrence of the same class of bug across the project history (see 2026-05-01/2026-06-04/2026-06-21 rows above), each time re-fixing ranking without fixing the exclusion bar. Root cause: `pushed_at` from GitHub is polluted by mechanical org-wide sweeps (malware-payload removal, `.gm` cleanup) that touch every repo the same day, and no session had ever re-derived "what counts as active" from the user's literal words at closeout — only checked "is there an open PRD row." Fixed: `scripts/fetch-showcase.mjs` now also captures `commits14d` (real GitHub commits in the last 14 days, excluding known sweep-commit messages); `activityFor`/`rankByActivity` in `lib/projects.js` key off it; HomePage/OrgPage filters changed `tier !== 0` to `tier === 2` (dormant is now excluded, not just deprioritized). Deleted `test.js` (198L of source-text-echoing assertions — e.g. `components.includes("const live = ...")`, which can only fail if the string changes, never if the behavior is wrong) and replaced with `verify.mjs`: loads the real `lib/projects.js` module against the real `lib/showcase.json`, runs the actual `activityFor`/`rankByActivity` functions, and asserts on the live output (deliberately-broken-then-restored to confirm it actually catches the regression — old test.js could not have). Root-caused upstream in `../gm`'s own SKILL.md: added an absolute "no test files, ever" invariant (Section 1) plus a mandatory `gm-continue` closeout check (3a) that re-reads the user's literal words and exercises the live system before declaring done, since a fix and its own self-written test sharing the same misreading was the actual defect class, not this specific ranking bug. |
| 2026-08-13 (pm) | 3 | 0 | 3 | Double title bar found live on 247420.xyz. Root cause in `anentrypoint-design`'s `AppShell` (not this repo): merging `topbar`+`crumb` into one `.app-chrome` band nested `Topbar()`'s own self-wrapped `<header class="app-topbar" role="banner">` as a child of a second `<header class="app-chrome" role="banner">` instead of unwrapping it — two stacked `<header>`/`role="banner"` landmarks. Fixed upstream (`src/components/shell/app-shell.js`, commit e351d866), live-witnessed via a real `applyDiff` render (`headerCount` 2 to 1). SDK CDN then switched from jsDelivr (`cdn.jsdelivr.net/gh/.../design@main`) to `raw.githack.com/AnEntrypoint/design/main/...` in `index.html`+`main.js`: confirmed by direct investigation that jsDelivr caches a GitHub branch (`@main`) reference for up to 12h *regardless of purge* — a `purge.jsdelivr.net` call correctly forces a Cloudflare-edge cache MISS, but jsDelivr's own backend then re-serves its still-stale internal resolution of what commit `main` points to, so the purge doesn't actually help. githack fetches straight from GitHub with `max-age=60`; confirmed byte-identical to the GitHub Contents API blob via md5sum immediately after the fix landed. Correction logged: an earlier same-session claim that githack was "still stale" was wrong — caused by comparing raw `grep -c "app-topbar"` occurrence counts between builds, which isn't a reliable fixed-vs-unfixed signal in a minified bundle; the real check is a structural regex/diff against known-good source, not a substring count. Confirmed post-switch via a real local browser render against the actual repo files (not a CDN): `headerCount:1, banners:1`. |

@.gm/next-step.md
