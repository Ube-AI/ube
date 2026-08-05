import type { FaqItem } from "@/data/faq-items"

// Feeds both the FAQ section on /pricing/ and that page's FAQPage JSON-LD
// (via `buildFaqPageSchema`) — there is no second copy to keep in sync.
//
// Every tier sells Ube only (ADR 0006), so nothing here may describe pull
// requests, crash triage, or other Ube Maintainer mechanics: those are no
// longer part of any plan.
export const PRICING_FAQ_ITEMS: FaqItem[] = [
  {
    q: "What counts as one app?",
    a: "One repo = one app. Cross-platform projects (React Native, Flutter, Capacitor, etc.) ship to both stores under a single subscription.",
  },
  {
    q: "What's the difference between Solo and Studio?",
    a: "Managed ad spend, mostly. Solo runs up to $1k/mo of paid acquisition on your behalf; Studio runs up to $15k/mo. Studio also adds seats for your team, several campaign refreshes a week instead of one, and a portfolio view that rolls analytics, audiences, and attribution up across every app on the account. Neither plan limits how many apps you bring — the spend ceiling is the real dividing line.",
  },
  {
    q: "Do you need access to my ad accounts?",
    a: "Yes. Ube works inside your own Meta, Google, TikTok, and app-store accounts, so the campaigns, audiences, and billing history stay yours if you ever leave. You grant access at the account level and we ask for approval before anything expensive or irreversible: creating accounts, launching campaigns, changing monetization, or raising budgets.",
  },
  {
    q: "Are ad platform fees included in my plan?",
    a: "No. Ad spend (Meta, Google, TikTok, etc.) is paid directly to those platforms with your own credit card. Same for optional creative-generation AI fees (Ube doesn't mark these up).",
  },
  {
    q: "What does scholarship access mean?",
    a: "We help eligible startups apply to programs like Amplitude for Startups and the AppsFlyer Startup Program. We're not a partner and don't get a referral fee. We just know the application playbook and can shepherd you through it.",
  },
]
