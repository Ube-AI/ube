---
status: accepted
---

# Ube Publisher collapses into the Ube brand

The site launched as a two-product demand probe — Ube Maintainer and Ube Publisher as co-equal siblings, each with its own page, nav entry, and pricing tier — precisely so we could find out which one the market wanted. It answered: inbound interest in Publisher has substantially outrun Maintainer. So we are acting on the probe's result. Publisher stops being a named product and becomes the whole of **Ube**: it owns `/`, the `<title>`, the hero, and the Organization's primary offering, and the string "Ube Publisher" disappears from user-facing copy. Maintainer survives as a named sub-product — off the nav and absent from pricing, reachable from the footer and from the `/maintainer/` page it keeps — so we go on measuring residual demand without spending the homepage on it.

## Consequences

- **The word `publisher` stays everywhere in code and data while vanishing from copy.** `src/components/publisher/`, the `/publisher` → `/` redirect, `buildPublisherSchema`, and the `publisher` value submitted by the Conversion modal all keep the old name. This looks like an oversight and is not one — see the two entries below for why each is deliberate. A future reader tempted to "finish the rename" should read this ADR first.
- **The need signal's stored values are frozen at `publisher` / `maintainer`.** The modal question was reworded from "Which product matters more to you?" to "What do you need most?" (Growth & distribution / Maintenance & fixes) because asking a reader to choose between Ube and its own sub-product is incoherent. But the question measures the same underlying thing before and after — growth versus maintenance — so renaming the values would split the site's central measurement series at exactly the moment we most want to compare across the change. Copy moved; the identifiers did not.
- **Analytics source labels went the other way and were renamed** (`publisher_hero` → `home_hero`, `pricing_maintainer` → `pricing_solo`, and so on). The inconsistency with the point above is intentional: a source label names a CTA, and those CTAs now live on differently-named pages and differently-priced cards. `pricing_maintainer` was a $40/app Maintainer plan; `pricing_solo` is a $200/app Ube plan. That series is already discontinuous in substance, so keeping the old label would preserve a chart that quietly compares two different things.
- **SEO continuity was the main cost and we accepted it.** The homepage title moves off "Ube Publisher — Mobile App Distribution Orchestrator" to "Ube — Mobile App Growth Agent", shifting the primary keyword from *distribution* to *growth*. On a pre-launch site with little accrued authority this is cheap now and gets steadily more expensive later, which is an argument for doing it at this point rather than after launch. The `/publisher` redirect is kept so external backlinks do not 404.
- **The JSON-LD `@id` for the flagship changes**, which is the least reversible part of this. Consumers that cached the old node identity will see a new one.
- **Maintainer's page stays indexed.** It is a demand probe and an SEO surface for maintenance-related queries, not dead weight — demoting it in the navigation is not the same as retiring it.

## Considered Options

- **Keep "Ube Publisher" as the product name and change only the nav label.** Zero SEO churn and the smallest diff. Rejected: it leaves the company's flagship carrying a qualifier that implies a sibling we are deliberately de-emphasising, and the modal would still have to ask people to pick between two named products when we have already picked.
- **Retire Maintainer entirely.** Simpler story, one product. Rejected: the page costs nothing to keep, still collects leads, and the residual-demand reading is genuinely useful — the whole point of the site is measurement, and switching off a working instrument to tidy the navigation is a bad trade.
