# 247420

the creative department of the internet. a discord community of ~1,300 mercurials
shipping rough drafts since 2018, the broadcast that pressure-tests the tooling in
public, and the site you're reading.

live at **[247420.xyz](https://247420.xyz)**.

## the room is on discord

the site is the window; the bar is on discord. creatives post, priests riff, the
eye remixes, someone always ascends — 24 hours a day, 420 ideas a minute. the
broadcast on the site is fed by what people drop in the room.

**[join the discord →](https://discord.com/invite/c9VV59MKNr)**

take your shoes off. the first channel is `welcome-please-remove-shoes` and that's
the whole onboarding.

## what this repo is

a single-page app with no build tools, no bundler, no framework — pure ES6 modules
rendering through the [anentrypoint-design](https://github.com/AnEntrypoint/design)
SDK. hash-based routing, a broadcast synced to a UTC clock so every viewer sees the
same frame at the same second, and a project catalog that features the org's
actually-active work first.

routes: `#/home` (projects) · `#/community` · `#/lore` · `#/tv` (broadcast) ·
`#/org` (index) · `#/p/<slug>` (project pages).

## run it

```bash
git clone https://github.com/AnEntrypoint/247420
cd 247420
python -m http.server 8420    # or any static server
# open http://localhost:8420
```

no install step. it runs as-is in a modern browser. `node verify.mjs` runs the
live verification witness (real code against real data, not a test suite);
`node scripts/lint-glyphs.mjs` guards against decorative glyphs. both run in
CI on every push.

## the projects

everything in the catalog is built, broken, and argued about in the open — no
whitepapers, more PRs. the agent tooling (gm and the rs-* rust services), the
voice + avatar stack, the browser sandboxes, the data and memory layers: browse
them at [247420.xyz/#/org](https://247420.xyz/#/org) or straight on
[github.com/AnEntrypoint](https://github.com/AnEntrypoint).

## contribute

the projects are open. clone one, run it, tell us where it broke — in the discord
or a pull request. rough drafts welcome; that's the point.

- **join the room:** [discord.com/invite/c9VV59MKNr](https://discord.com/invite/c9VV59MKNr)
- **the org:** [github.com/AnEntrypoint](https://github.com/AnEntrypoint)
- **the broadcast:** [247420.xyz/#/tv](https://247420.xyz/#/tv)

ship the rough draft. humor is load-bearing. document honestly.
