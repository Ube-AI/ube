// Astro shell for ube.dev.
//
// Static SSG output (no server runtime — Cloudflare serves dist/ as static
// assets). Each route in src/pages/ becomes a real HTML file. React islands
// hydrate on the client via @astrojs/react. /publisher → / lives here so it's
// emitted by the build (the Publisher landing was promoted from /publisher/
// to /).
//
// The `tweaksWritebackPlugin` is registered with `apply: "serve"` so it is
// skipped entirely during `astro build` — its source path is the only point
// of contact between the production config and `src/dev/` (ADR 0005). The
// plugin's `configureServer` hook installs a POST `/__tweaks` middleware on
// the dev connect instance; nothing in the static build output references
// it.

import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { defineConfig } from "astro/config"

import { tweaksWritebackPlugin } from "./src/dev/tweaks-writeback-plugin.ts"

export default defineConfig({
  site: "https://ube.dev",
  output: "static",
  trailingSlash: "always",
  // /publisher used to be the publisher landing page before it was promoted
  // to the homepage at /. Emit a meta-refresh redirect page so external
  // backlinks resolve without requiring a Worker script.
  redirects: {
    "/publisher": "/",
  },
  build: {
    format: "directory",
  },
  integrations: [react(), sitemap({ lastmod: new Date() })],
  vite: {
    plugins: [tweaksWritebackPlugin()],
  },
})
