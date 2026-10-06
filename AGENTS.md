# 247420 Technical Documentation

## Stack & Constraints

SPA with hash routing (`#/home` `#/community` `#/lore` `#/tv` `#/org` `#/blog` `#/p/<code>`). Pure ES6 modules, no build step, no bundler, no polyfills, no external framework deps — runs as-is in modern browsers.

- **Error-first**: errors throw with context. No silent failures, no fallbacks.
- **No test files, ever.** Verification is live execution against real data: `node verify.mjs` loads the real `lib/projects.js` against the real `lib/showcase.json` and asserts on actual output. An assertion written next to its own fix can encode that fix's misreading, so "tests pass" only proves the code agrees with itself. Re-read the request's literal words and exercise the real system instead. Never create `*.test.js`/`*.spec.js`/`test/` or pull in jest/mocha/vitest/pytest.
- **`window.__debug`**: the SDK pre-defines it **read-only** — never reassign it, set properties (`window.__debug.foo = x`). It carries router/scheduler/video/player state.
- **Content authenticity**: scrub LLM giveaways (buzzwords, clichés) from site copy, but preserve em dashes, the stoner-aesthetic branding, jargon, and frozen git history.

## Modules

| File | Role |
|---|---|
| `lib/components.js` | All pages as pure functions rendering via the SDK kit (`window.ds.components`). Exposes `window.__topbar`/`window.__themeToggle` so `community.js` reuses chrome without a circular import. Router comes from the SDK (`lib/router.js` was dropped). |
| `lib/community.js` | CommunityPage + `JoinLink` + the single-source `DISCORD_INVITE`. Every join button points at that one constant. |
| `lib/projects.js` | Catalog (SSOT) + showcase enrichment + `activityFor`/`rankByActivity`. |
| `lib/scheduler.js` | Time parsing, slot calc, UTC sync. `getCurrentSlot`/`getUpcomingSlots` feed the TV now/next strip. |
| `lib/video.js` | Native HTML5 `<video>` player abstraction (replaced the Schwelevision orchestrator), sub-second slot precision. |
| `main.js` | SPA entry, route registration, `renderNowNext`/`renderTv`. Enforced `<= 200` lines by verify.mjs. |
| `styles.css` | Site-only surfaces on top of SDK CSS (~143L). |
| `schedule.json` | Sub-hourly broadcast montage. |
| `verify.mjs` | Live-execution verification (see above). |
| `scripts/fetch-showcase.mjs` | Pulls `__site__` JSON from each project's gh-pages + GitHub stars/`pushed_at`/`archived`/`commits14d` → `lib/showcase.json`. Path-resolved off its own `__dirname`, so it runs in any checkout. Authenticates via `GITHUB_TOKEN` (60 → 5000 req/hr). |
| `scripts/lib/sweep.mjs` | SSOT for what does **not** count as work. See "Meaningful Update" below. |
| `scripts/sync-catalog.mjs` | **Report-only** catalog drift detector. Never edits the catalog. |
| `scripts/check-pipeline.mjs` | Exits non-zero if either workflow file is missing. |
| `scripts/lint-glyphs.mjs` | Decorative-glyph guard. |

Schedule format — array of `{ t: "H:MM AM/PM", v: "string | 'static'", d: number, title: "string" }` (GMT wall-clock). Same-time entries play sequentially; gaps show static.

## CI/CD — how 247420.xyz gets built and deployed

`ci.yml` (on push + PR): `node scripts/check-pipeline.mjs`, `node verify.mjs`, `node scripts/lint-glyphs.mjs`. No build step, no suite.

`deploy.yml` (on push to `main` + `workflow_dispatch`): refresh showcase (`continue-on-error: true`) → pipeline guard → build `_site` → Pages deploy.

```bash
mkdir -p _site
rsync -a --exclude='_site' --exclude='.git' --exclude='.gm' --exclude='saved_videos' --exclude='node_modules' --exclude='.github' . _site/
touch _site/.nojekyll
```

`CNAME` (containing `247420.xyz`) in repo root tells Pages the custom domain; `.nojekyll` disables Jekyll. `.gm` is excluded so orchestrator state never reaches a public site.

### DNS (gen.xyz registrar)

- Four A records `@` → `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`
- CNAME `www` → `anentrypoint.github.io`
- TXT `_github-pages-challenge-lanmower.247420.xyz` = `7fd255132d4991c2fdd208aea097d1`
- TXT `_github-pages-challenge-AnEntrypoint.247420.xyz` = `4c2cad18b03f67d1b764f1ab404330` (org owns the repo, so org-side verification is required)
- **Outstanding:** no AAAA records. GitHub's current set is `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. Needs registrar access nobody holds in-repo. Site works without them — this is forward-compat hardening, not an outage.

### A "certificate error" means Pages is off, not TLS

GitHub serves its shared `*.github.io` cert for any hostname with no Pages site bound, so `SEC_E_WRONG_PRINCIPAL` / "certificate doesn't match" almost always means nothing is published. Witnessed 2026-10-06: DNS and both challenge TXTs were correct the whole time, yet `has_pages` was `false` and remote `main` had been reset to one squashed `Initial commit` (c2a7513) that dropped `.github/`.

Diagnose in this order — each step isolates one cause:

1. `openssl s_client -connect 247420.xyz:443 -servername 247420.xyz </dev/null | openssl x509 -noout -ext subjectAltName` — a SAN covering `247420.xyz` means the cert is fine; only `*.github.io` means nothing is bound.
2. `curl -sS http://247420.xyz/` — GitHub's "Site not found" body confirms no Pages site.
3. `gh api repos/AnEntrypoint/247420/pages` — a 404 here is the smoking gun.
4. Only then DNS.

Recovery: `gh api -X POST repos/AnEntrypoint/247420/pages -f build_type=workflow`, restore both workflows, push, then `gh api -X PUT repos/AnEntrypoint/247420/pages -f cname=247420.xyz`. `https_enforced` flips to `false` on its own while the cert provisions — re-set it to `true` after (~10 min to `approved`, covers apex + www).

`.gitignore` (`node_modules/`, `_site/`, `.gm/`, `.agentplug-kv/`) is load-bearing: without it, deep `.gm/browser-*` paths exceed Windows MAX_PATH and crash tooling.

## Design SDK — use the kit, never a local reimplementation

`anentrypoint-design` ships chrome + content components on `window.ds.components` (alias `C`): `Topbar`, `Crumb`, `Side`, `Status`, `AppShell`, `Brand`, `ThemeToggle`, `Btn`, `Chip`, `Glyph`, `Dot`, `Rail`, `Heading`, `Lede`, `Panel`, `Row`, `RowLink`, `Section`, `Hero`, `Install`, `Receipt`, `Changelog`, `WorksList`, `WritingList`, `Manifesto`, `Kpi`, `Table`, `Form`, `HomeView`, `ProjectView`, plus `applyTheme`/`getTheme`/`resolvedTheme`/`initTheme` (`auto | paper | ink`).

Rules:

1. **No reinvention.** Don't hand-roll a local `Topbar()`, `.expo-card`, or `.project-hero` where the SDK ships one.
2. **Class names are the SDK's** — `.row`/`.code`/`.title`/`.sub`/`.meta`, `.panel-head`, `.cli`/`.prompt`/`.cmd`, `.ds-prose`, `.ds-manifesto`.
3. **Allowed local CSS** (~143L): glyph color helpers (`.g-*`), `.row-glyph`, `.panel-head-link`, `.work-detail-chips`, `.project-head/.project-glyph/.project-eyebrow/.project-body/.project-chips`, `.cli-line/.cli-cmt`, `.crumb-link/.app-crumb .crumb-right`, all `.tv-*`.
4. **Forbidden:** inline `style="..."` on SDK-rendered elements (`.panel`, `.row`, `.app-*`). SDK changelog v0.0.99 + this file ban it — use a class.

**Theme:** `<html class="ds-247420" data-theme="auto">` is canonical; the SDK auto-inits and writes `data-theme` back. Don't override `html`/`body` background or color.

**SDK CDN**: `index.html` (line 35 CSS, line 46 JS) and `main.js` (line 6, `Router`) load `dist/247420.{css,js}` from jsDelivr **pinned to a commit SHA**, not a branch: `https://cdn.jsdelivr.net/gh/AnEntrypoint/design@<sha>/dist/...`. A floating `@main` is unusable — jsDelivr caches a branch ref for up to 12h *regardless of purge* (a purge forces a Cloudflare MISS, but jsDelivr's backend re-serves its own still-stale resolution of what `main` points to). SHA-pinned URLs come back `cache-control: immutable`, so they never go stale — and never advance, so bumping the pin is a deliberate act. unpkg's npm package is dead: `registry.npmjs.org/anentrypoint-design/latest` is unavailable, so npm is not a source. Note `scripts/bump-sdk-pin.mjs` is referenced in the `index.html` comment but **does not exist** — bumping is currently a hand edit of three URLs.

**Current pin is orphaned — check before trusting it.** As of 2026-10-06 the site pins `4349f3af01f163d846b7464b936e4538691c1be9`, which no longer exists in `AnEntrypoint/design`: the commits API returns 422 "No commit found for SHA" and `raw.githubusercontent.com/.../4349f3a.../package.json` 404s. jsDelivr still serves it (200, `immutable`, JS 742,725 B / CSS 857,768 B) purely from its own cache of a build the repo has since rewritten away. Design `main` is `f53a112` (2026-10-06) at **version 1.0.34**, and its dist is a different build entirely (JS 582,445 B / CSS 580,420 B). So the site is not on the latest SDK, and the thing keeping it styled is a CDN cache entry, not the repo — if that entry is ever evicted the site loses all SDK CSS/JS at once. Re-pin deliberately; a 1.0.x landing is a big jump, so browser-witness the bump.

### Kit mapping

| Page | Kit | Grammar |
|---|---|---|
| `#/home` | `homepage` | `C.Hero` + "Currently shipping" Panel + "Works · N of N" Panel with click-to-expand `.row`/`.work-detail` + Manifesto |
| `#/p/<code>` | `project_page` | `C.Side` rail + h1/Lede/chips + `// install` + `C.Install` + `// metadata` + `C.Receipt` |
| `#/community` | `project_page` narrow | Heading+Lede, loudest `JoinLink` on the site, Panels of `.row`s, second CTA, `// house voice` Manifesto |
| `#/lore` | `homepage` Writing | single Panel of numbered `.row`s + `// chronicles` Manifesto |
| `#/org` | `gallery` + `homepage` | `C.Side` jump-nav + hero Panel + one Panel per category |
| `#/tv` | none | `AppShell` chrome + `.tv-stage` + `.tv-nownext` strip + `.tv-guide-overlay` + community tie-in Panel |

Discord is site-wide: `Community` is a top-level nav item, every page's `Status` footer right slot carries a join link, home has a `.home-join` banner, project pages end with `.project-contribute`. All route through `DISCORD_INVITE`.

### Caveats that cost someone a session

- **Mobile viewport-height clamp**: SDK `.app` is `100vh`/`overflow:clip` with inner-scrolled `.app-main` below desktop width, trapping mobile content. Fix: `@media(max-width:900px)` overrides scoped to `.ds-247420` release the clamp. Cap at 900px so desktop inner-scroll survives.
- **`.app-main` flex-column shrink**: children default to `flex-shrink:1`, so a tall panel gets squashed and later siblings overlap. Fix: `.ds-247420 .app-main > * { flex: none }`.
- **Connected row list**: stacked `.row`s (14px radius) read as detached pills — round only the outer corners via `.panel-body`-anchored selectors (rows are wrapped in unclassed `<div>`s on home/lore). Project crumb leaf must be `p.code`, not `p.title`, or it duplicates the h1.
- **Merged chrome bar**: `AppShell` folds `topbar`+`crumb` into one `.app-chrome` band (~63px) when both are passed; either alone renders standalone. Its bug shape is two stacked `<header role="banner">` — assert `headerCount === 1`, and don't diagnose a minified bundle by substring count (use a structural regex against known-good source).

## Featured = actually active, and "meaningful" is a commit-message judgment

Home works-list and the org "reach for first" rail rank by GitHub **activity**, not stale stars. `fetch-showcase.mjs` captures `pushed_at`/`archived`/`commits14d`; `lib/projects.js` exports `activityFor(code)` (tier 2 active / 1 dormant / 0 archived) and `rankByActivity()` (tier → recency → stars). `activityFor` reads the **raw** showcase entry — `showcaseFor()` hides `missing` ones.

The page filters are `tier === 2`, not `tier !== 0`: dormant must be **excluded**, not merely deprioritized. `tier !== 0` let months-dormant repos render unranked — that recurred at least four times (2026-05-01, 06-04, 06-21, 08-13, 10-06) because each round re-fixed ranking without re-deriving "what counts as active" from the user's literal words.

**`pushed_at` is polluted** by mechanical org-wide sweeps (malware-payload removal, `.gm` cleanup) that touch every repo the same day. So the add/remove rule — add repos with meaningful work in 14 days, drop catalog entries with none in 60 — cannot be decided from `pushed_at` or a raw commit count. `awesome-github` showed 47 commits in-window, every one `chore: refresh trending tree`.

`scripts/lib/sweep.mjs` is the SSOT for what does **not** count:

- `SWEEP_COMMIT_RE` — org-wide sweeps (malware removal, vendored `.gm` removal, `declaudeify`, showcase regen)
- `RELEASE_BUMP_RE` — `chore: release v1.3.10 [skip ci]`, version bumps
- `METADATA_ONLY_RE` — `Initial commit`, LICENSE adds
- `AUTO_REFRESH_RE` — `chore: refresh …`

`isSubstantive()` is their conjunction. Both `fetch-showcase.mjs` and `sync-catalog.mjs` import from it — neither keeps a local copy, because a divergence between them is exactly how this bug keeps recurring.

`scripts/sync-catalog.mjs` prints ADD / REMOVE / resulting size and **never edits** `lib/projects.js`; adding an entry still needs a hand-written `sub`/`body`. Knobs: `ADD_WINDOW_DAYS` (14), `REMOVE_WINDOW_DAYS` (60), `MIN_SUBSTANTIVE` (2), `ORG`.

**Lost-evidence caveat:** the 2026-09-03 squash reset several org repos to a lone `Initial commit`, so pre-squash work is invisible to any commit-window scan. A repo showing only `Initial commit` is indistinguishable from a dormant one — that's absent evidence, not evidence of inactivity. Removing it is a judgment call, not a measurement.

## Org page (`#/org`)

Rendered by `OrgPage()` in `lib/components.js` — part of the SPA, no standalone `organization.html`. Mission: "Building Claude workflows that are rigorous, deterministic, and production-grade. No guessing. No compromises." Thesis: "Reproducible AI workflows start with explicit state machines. gm proves the pattern at scale." 247420 is both a creative project and the org's proof-of-concept. Lead with problems solved ("The problem: X. Solution: Y."), not features. Preserve authenticity — don't over-edit.

## Audit log

Compacted per INVARIANT 3 (this file exceeded 30kb on 2026-10-06). One line per session; detail lives in git history.

| Date | Notes |
|---|---|
| 2026-05-01 | CI/DNS/200L-gate/video/routing baseline verified. `window.__debug` read-only caveat added. |
| 2026-05-19 | Design refresh to SDK ≥ v0.0.113; components.js delegates chrome+content to `C.*`; styles.css trimmed to site-only surfaces. |
| 2026-05-19 pm | Pro-rata kit migration: all pages mapped to SDK kits (~285L local CSS deleted). Browser-witnessed all routes + themes. |
| 2026-06-04 | Merged chrome bar; SDK rebuild + push (npm publish blocked, no auth). Browser-witnessed live, mobile 390px clean. |
| 2026-06-04 pm | Activity ranking introduced (`commits14d`, `activityFor`/`rankByActivity`); gm-cc archival 404 fixed. |
| 2026-06-21 | CI added; two portability bugs fixed (`__dirname`/`fileURLToPath`); catalog 27→40; glyph sweep + `lint-glyphs.mjs` added. |
| 2026-08-12 | Archive exclusion tightened; org reach-for-first made activity-derived (was hardcoded `['gm','thebird']`); CDN switched unpkg → jsDelivr; blog route merged. |
| 2026-08-13 | `tier !== 0` bug fixed → `tier === 2`; `test.js` (198L of source-text-echo assertions) deleted in favour of `verify.mjs`; upstream `gm` SKILL.md given a "no test files, ever" invariant + `gm-continue` closeout check. |
| 2026-08-13 pm | Double title bar root-caused in SDK `AppShell`; CDN switched jsDelivr → raw.githack. |
| 2026-10-06 | "Certificate error" was Pages-off: squashed `Initial commit` (c2a7513) had dropped `.github/`. Pages re-enabled, workflows re-authored, `.gitignore` added, `check-pipeline.mjs` guard added, cert re-issued to 2027-01-04. |
| 2026-10-06 catalog | Catalog 44→37: +15 repos with ≥2 substantive commits in 14d (codes 084–098), −22 stale. Sweep filters extracted to `scripts/lib/sweep.mjs`; `sync-catalog.mjs` added (report-only). Browser-witnessed live: 1 header/1 banner, 0 removed titles present, all added present, no console errors. gm's own `git_status` os-error-206 bug fixed in `c:\dev\gm` (rs-plugkit `761e96f4db`, gm `9f713f920f`). |

@.gm/next-step.md
