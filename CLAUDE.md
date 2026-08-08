# Ube landing — CLAUDE.md

## Purpose
Landing page at [ube.dev](https://ube.dev) whose sole job is to **measure interest in Ube**. The product itself doesn't exist yet — this site is a demand probe. Background essays live at `../ube-app/app_distribution_essay.md` (Publisher) and `../ube-app/app_maintenance_essay.md` (Maintainer). The Request Access modal's multi-select growth-needs question is the key signal we're collecting.

## Working alongside other agents
Other Claude Code sessions may be running in this repo in parallel.
- Treat uncommitted working-tree changes as possibly belonging to another agent.
- Don't reuse another agent's preview server. `preview_start` silently attaches to an existing instance with the same name. Call `preview_list` to see which slots are in use, then pick an unused one from the `dev-a` … `dev-f` pool in [.claude/launch.json](.claude/launch.json).
- If there are no slots available, STOP.
- `mcp__Claude_Preview__preview_screenshot` returns a blank canvas at any non-zero scroll position — Chromium throttles the headless tab's compositor while `document.hidden === true`, so JS-driven scrolls never reach the captured surface. To verify scrolled layouts, either resize the viewport tall enough that the target section sits above the fold at scrollY=0, or use preview_inspect (reads the live DOM via CDP, stays accurate).

## Build / run
- **Dev server:** `npm run dev` (or use the `preview_*` tools with the `dev-a`..`dev-f` configs in [.claude/launch.json](.claude/launch.json) — each runs `astro dev --port {port}`).
- **Prod build:** `npm run build` → Astro emits one HTML file per route into `dist/`, plus `sitemap-index.xml`. Cloudflare Workers Builds deploys `dist/` as static assets on push to `main`.
- **Prod preview locally:** `npm run preview` serves `dist/`.

## Verifying changes
After modifying any code, run `npm run check` before considering work complete. This runs Biome (lint/format) and `astro check` (TypeScript across `.astro` and `.tsx`) in one pass. Both must exit 0. If either fails, fix the underlying issue — do not skip or weaken the rules to make the check pass.

## File layout
Astro + React islands; one big `<PageApp client:load />` per route for now (slice 0001 baseline; later slices peel sections into native `.astro` components).

```
astro.config.mjs               # output: static, redirects { /maintainer: / }, sitemap
wrangler.jsonc                 # Cloudflare deployment, assets, and custom domains
tsconfig.json                  # strict; ADR 0004
src/
  pages/                       # one .astro per route
    index.astro                # /
    terms-of-service.astro     # /terms-of-service/
    privacy-policy.astro       # /privacy-policy/
  layouts/BaseLayout.astro     # <head> props API + Amplitude + RequestAccessIsland
  components/
    pages/                     # *PageApp.tsx — page-level React islands
    sections/                  # Nav, Hero, Footer, page sections (.tsx)
    modals/                    # Sources, Dedupe, FixLoop, RequestAccess (.tsx)
    mockups/                   # in-page product mockups (.tsx)
  stores/request-access.ts     # nano store + openRequestAccess(source) wrapper
  data/                        # faq-items.ts (single source of truth for the
                               #   FAQ component + the FAQPage JSON-LD)
                               # tweak-defaults.ts (EDITMODE-marked block)
  lib/                         # analytics, palette, modal primitive,
                               #   integration-logos.ts (typed logo registry)
  assets/                      # bundled imagery imported via @/assets/* — hashed
                               #   at build (customers/, integrations/)
  dev/                         # tweaks panel (dev-only; gated by import.meta.env.DEV)
  styles.css                   # tokens + components + mockups
public/                        # copied verbatim to dist/ — served at site root
  assets/                      # favicons, og image, social (unhashed, stable URLs)
  robots.txt
```

## Things to know before editing
- **The Request Access form posts to Basin** (`src/components/modals/request-access-modal.tsx`). reCAPTCHA v3 is lazy-loaded on first open; submissions go to `BASIN_ENDPOINT`. The conversion modal is mounted once globally by `BaseLayout.astro` (ADR 0002) and any CTA island opens it by calling `openRequestAccess(source)` from `src/stores/request-access.ts`. The wrapper fires `request_access_modal_opened` so no call site can forget the analytics event.
- **The Conversion modal is intentionally growth-focused on every route.** Its six-option, multi-select need signal is global, including on `/maintainer/`; do not reintroduce a contextual Maintainer form without a new product decision (ADR 0007).
- **Tweaks panel is dev-only** (`src/dev/tweaks-panel.tsx`, gated by `import.meta.env.DEV`). Each knob mutation POSTs (debounced ~120ms) to `POST /__tweaks`, a Vite dev-middleware endpoint (`src/dev/tweaks-writeback-plugin.ts`, registered in `astro.config.mjs` with `apply: "serve"`) that rewrites the `EDITMODE-BEGIN`/`EDITMODE-END` region of `src/data/tweak-defaults.ts` on disk. Vite's HMR then re-renders the page with the new defaults. The endpoint is excluded from production builds entirely — see ADR 0005. Don't reformat the EDITMODE block by hand; the plugin's parser expects `key: "string-value",` pairs.
- **Amplitude is gated to production.** `BaseLayout.astro` injects the Amplitude Unified Script tag dynamically — only when `location.hostname` is `ube.dev` or a subdomain. On `localhost` the script is never loaded, so no events or replays fire and no connection to Amplitude is opened. Escape hatch for local verification: append `?amplitude=1` to the URL. Why dynamic injection instead of a static `<script src>` with a runtime gate: the Unified Script auto-initializes from dashboard config the moment it executes, so gating only the `window.amplitude.init()` call doesn't actually stop tracking — the script tag itself has to be conditional. **Only test Amplitude locally if explicitly asked.**
- **Integration logos are typed, not path strings.** Reference them via the `integrationLogos` registry in `src/lib/integration-logos.ts` (e.g. `integrationLogos.firebase.src`), never as `"/assets/integrations/…"` literals. The files live in `src/assets/integrations/` (bundled, hashed) — a wrong key is a compile error (`astro check`) and a missing file fails `npm run build`. This closed a class of silent 404s where a relative path resolved against `/maintainer/`.
- **TypeScript is strict** (per ADR 0004): `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`. Match what's already in the codebase rather than weakening the config.
- No test suite. Don't add tooling unless asked.
