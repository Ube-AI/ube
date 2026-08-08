# Ube landing

The marketing site at [ube.dev](https://ube.dev). Its sole job is to measure interest in Ube (a software product not yet released). The Request Access modal's **need signal** — the concrete growth jobs prospective customers select — is the central signal the site is designed to collect.

## Language

**Ube**:
The flagship product and the company's primary offering: mobile app distribution and growth. It sets up the distribution stack, keeps the paid-acquisition-to-product-learning loop running, and asks for approval at expensive or risky points such as account creation, ad spend, campaign launches, monetization changes, and larger budget increases. Paid ads are treated as a measurement engine first: they create a steady stream of users so Ube can find working creatives, identify drop-off points, recommend A/B tests, improve retention and monetization, and only then help scale the app by investing dollars more efficiently. Lives at `/`.
_Avoid_: "Ube Publisher" — the product carried that name until the flagship collapsed into the bare brand. "Publisher" survives only as the `/publisher` legacy redirect and as the `publisher` **need signal** value.

**Ube Maintainer**:
The secondary product: automated triage, reproduction, and verified pull requests for production issues. Deliberately de-emphasised — absent from the top nav and from the pricing page, reachable from the footer and from the `/maintainer/` page it still owns. Not sold from a **pricing tier**; it is an off-menu product surfaced in conversation. The site keeps it alive to measure residual demand, not to convert.

**Conversion modal**:
The Request Access modal. Reachable from every route via the Nav, Hero, and Final CTAs. Captures the **need signal** the entire site is designed around. Has two **variants** (see below) that swap title, subtitle, and email-label copy while sharing the same form and submission path.
_Avoid_: "the modal" (ambiguous — see Detail modal)

**Conversion modal variant** (`default` / `enterprise`):
A parameter passed alongside the modal-open call. `default` is the standard waitlist framing; `enterprise` is the B2B framing reached from Pricing → "Contact sales" — title and subtitle shift to a sales conversation, the email field is labelled "Work email". Same component, no fork.

**Need signal**:
The Conversion modal's required, multi-select "What do you need most?" answer. Six choices cover paid-campaign efficiency, attribution, retention and monetization, user-acquisition funding, creative sourcing, and experimentation. Choices are shuffled on every open to reduce position bias, and both the selected values and displayed order are submitted. "AI brain to grow my app" is deliberately absent: it overlaps every concrete job and would produce a weak signal.
_Avoid_: "product radio", "product interest" — those names belong to the superseded growth-versus-maintenance question (ADR 0007).

**Pricing tier**:
One of `Solo` / `Team` / `Enterprise`. Solo and Team are billed per app, where **one app = one repo** (cross-platform projects shipping iOS + Android from one codebase count as one app); Enterprise is custom-priced. Every tier sells **Ube** only — no tier mentions **Ube Maintainer**. Solo and Team route to the default Conversion modal; Enterprise routes to the enterprise variant.

**Managed ad spend ceiling**:
The monthly paid-acquisition budget Ube will run on a customer's behalf under a given **pricing tier** — $1k on Solo, $15k on Team. Neither tier caps how many apps a customer may bring, so this ceiling, not app count, is what actually separates the two: a company spending $10k/mo cannot sit on Solo no matter how few apps it has. Treat it as the load-bearing differentiator; the rest of Team's list (team seats, multiple campaign refreshes per week, portfolio analytics across apps) supports it rather than replacing it.

**Portfolio view**:
Team's roll-up across every app on an account — cross-app analytics, shared audiences, portfolio-level attribution. A capability, not an allowance: Solo customers may run as many apps as they like, they just see each one on its own.
_Avoid_: "multi-app plan", "app allowance" — nothing about app count is metered.

**Founder support**:
The offer, stated once in a full-width band below the pricing cards, that Ube's founders work with the customer directly to identify a go-to-market plan and propose improvements to existing channels. Applies to every **pricing tier** but **only for the first cohort**, and the band says so — it is a launch offer, not a standing term. Because it expires, it is not a tier differentiator: Team's dedicated support and Enterprise's SLA-backed account manager are the standing commitments that outlive it.

**Detail modal**:
A modal scoped to a single section. Today: Sources, Dedupe, and Fix Loop modals inside HowItWorks, opened from a step's "Learn more" link. Lifetime is local to its owning section.
_Avoid_: "the modal" (ambiguous — see Conversion modal)

**Tweak**:
A dev-only design knob — either a **color tweak** (live-previewed via DOM manipulation) or a **structural tweak** (live-previewed via HMR reload). Each tweak has a baked default that ships in production; production code does not reference the tweaks system.

**Tweaks panel**:
The in-page UI for adjusting tweaks during development. Excluded from production builds entirely.

**Section**:
A top-level page region (Hero, Problems, HowItWorks, Benefits, FAQ, FinalCTA, etc.). Sections compose into pages. Some sections contain mockups.

**Mockup**:
An in-page visual representation of the Ube product (IntakeMockup, TriageMockup, FixMockup, ReportSuccessMockup, ReportFailureMockup, and the Hero mockup variants). Mockups are visual, not functional product surfaces.

**Ube, Inc.**:
The brand name the site presents as the company, carried only by the footer copyright line. **Not yet incorporated** — it names an intended future entity, not an existing one, so it must not appear anywhere that makes a legal assertion.

**Chunky Tofu Studios, LLC**:
The actual operating entity: the party to the Terms, the controller of personal data, the `legalName` in structured data, and the company named in `llms.txt`. Every legal or contractual surface names it and only it. The footer's `© Ube, Inc.` and the legal pages' `Chunky Tofu Studios, LLC` therefore appear on the same screen — the footer renders on every route, legal pages included. That is a known, accepted mismatch for as long as Ube, Inc. is unformed; it is not a bug for a future agent to "fix" by propagating either name over the other.
_Avoid_: naming **Ube, Inc.** in Terms, Privacy, `schema.org` `legalName`, or `llms.txt` until it is actually formed.

**Source** (analytics):
A coarse label identifying which CTA fired an analytics event — `"nav"`, `"home_hero"`, `"pricing_solo"`, `"pricing_final_cta"`, and so on. Page-level breakdown comes from Amplitude's auto-captured URL, not from the source label. Labels track user-facing copy: when a CTA is renamed, its label is renamed with it, accepting the break in the series rather than carrying a name that no longer describes what it points at. The **need signal** values are the deliberate exception.
