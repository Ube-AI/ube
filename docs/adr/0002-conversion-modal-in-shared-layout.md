---
status: accepted
---

# Conversion modal mounts globally in the shared layout

The Request Access modal is the site's only conversion mechanism — every page's primary signal is whether a visitor opens it and fills it in. In the Astro architecture (ADR 0001), "globally available" maps to "rendered by the `BaseLayout.astro` that wraps every route." We mount the conversion modal in the layout and hydrate it on every page, including `/terms-of-service/` and `/privacy-policy/`. Those legal pages get organic search traffic ("ube terms", etc.) and a non-trivial fraction of cold landings on them should still be able to convert without a roundtrip.

## Considered Options

- **Modal only on pages with primary CTAs** (landing, future `/publisher/`, `/pricing/`); legal pages link back to `/?request-access` to trigger the modal on landing. Rejected: breaks the conversion path on the exact pages where SEO is most likely to surface us to cold visitors, and adds a full navigation + scroll + auto-open dance whose UX is materially worse than just opening the modal in place.
- **Deferred hydration** (`client:only="react"` + lazy module-load when the store flips open). Rejected as premature optimization until a real Total Blocking Time problem is measured. The modal subtree is small enough that eager hydration on every page is acceptable.

## Consequences

- Terms and Privacy ship the React + nano-store + modal bundle (~25–35KB gzipped estimated) even though their content is static prose. This is the price of preserving the conversion path uniformly.
- Any future page added under `src/pages/` inherits the modal automatically — no per-page wiring required.
- The "source" analytics label (`nav`, `hero`, `final_cta`) stays coarse; page context comes from Amplitude's auto-captured URL.
- Any route can be opened with the bare `request-access` query flag (for example, `/?request-access` or `/maintainer/?request-access`) to open the form automatically. These opens use the `direct_link` analytics source, and the flag composes with attribution parameters such as `utm_source`.
