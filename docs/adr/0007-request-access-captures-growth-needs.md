---
status: accepted
---

# Request access captures concrete growth needs

The Conversion modal previously asked visitors to choose one of two broad needs: growth and distribution (`publisher`) or maintenance and fixes (`maintainer`). That binary signal helped decide which product should lead the company, and the result has already been acted on: growth became the Ube flagship while Maintainer was deliberately de-emphasised (ADR 0006). The next useful demand question is no longer which product should lead, but which concrete growth jobs prospective customers most want Ube to perform.

The global Conversion modal now asks "What do you need most?" as a required multi-select with six choices: lower customer acquisition cost, set up attribution, understand retention and monetization, find user-acquisition funding, keep ad creatives flowing, and decide what to test next. Competitive research is combined with experimentation because its useful output is a prioritized test; the vague umbrella option "AI brain to grow my app" is omitted because it overlaps every specific job and would be difficult to interpret.

## Consequences

- The old `product_interest` field and its `publisher` / `maintainer` values are retired. New submissions carry one or more stable `needs` identifiers instead. This intentionally ends the historical binary series rather than pretending the more detailed question is comparable to it.
- The form is the same on every route, including `/maintainer/`. There is no contextual Maintainer variant. Interest arriving through Maintainer CTAs remains visible through CTA source and page analytics, while the form itself collects growth needs.
- Choice order is shuffled each time the form opens so aggregate selections are less biased toward the first option. The displayed `needs_order` is submitted with the selected `needs`, allowing later analysis to account for position.
- "Project / app name" is collected as an optional field. Keeping it optional accommodates pre-launch and stealth projects while still improving lead context when visitors volunteer it.

## Considered Options

- **Keep all eight proposed choices.** Rejected: competitive research naturally feeds experiment recommendations, and "AI brain to grow my app" is an umbrella over the other seven rather than a distinct job.
- **Show a different form on the Maintainer page.** Rejected: one global form is simpler and the current product decision is to focus the demand probe on specific growth needs regardless of entry route.
- **Keep the old binary field alongside the detailed choices.** Rejected: it adds friction and asks a product-level question whose main strategic purpose has already been served.
