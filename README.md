# Ube — Landing site

Static landing for [ube.dev](https://ube.dev). Built with [Astro](https://astro.build) — per-route static HTML with React islands. Deployed to Cloudflare Workers Static Assets on push to `main`.

## Local dev

```bash
npm install
npm run dev    # Astro dev server (HMR; defaults to :4321)
```

## Production build

```bash
npm run build   # → dist/
npm run preview # serve dist/ locally
```

Cloudflare Workers Builds runs `npm run build` and deploys `dist/` with `npx wrangler deploy`.

## Upgrade deps

To upgrade deps:

```bash
npm update --save
npm run check && npm run build
```

To upgrade deps including major versions:

```bash
npx npm-check-updates@latest -u --install always
npm run check && npm run build
```

## Layout

```
astro.config.mjs               # Astro config — integrations, redirects, sitemap
wrangler.jsonc                 # Cloudflare deployment, assets, and custom domains
tsconfig.json                  # TypeScript strict mode (per ADR 0004)
biome.json                     # lint/format
public/                        # served verbatim at the site root
  assets/                      # customer logos, integration icons, favicons, og image
  robots.txt
src/
  pages/                       # one .astro file per route → one HTML file
  layouts/BaseLayout.astro     # shared <head> + RequestAccessModal island
  components/
    pages/*PageApp.tsx         # one big React island per route (slice 0001;
                               #   sections will split into .astro in 0003–0008)
    sections/                  # Nav, Hero, Footer, page sections (React .tsx)
    modals/                    # Sources, Dedupe, FixLoop, RequestAccess (.tsx)
    mockups/                   # in-page product mockups (.tsx)
  stores/request-access.ts     # nano store for cross-island modal open
  data/                        # FAQ items, tweak defaults
  lib/                         # analytics, palette, modal primitive, asset registry
  dev/                         # tweaks panel (dev-only; gated by import.meta.env.DEV)
  styles.css                   # tokens, layout, components, mockups
docs/adr/                      # architecture decision records
spec/                          # implementation slices (0001 → ...)
```
