// Ube — Conversion events (sink: Cloudflare Zaraz).
//
// `track()` in analytics.ts is the single dispatch point for every event in
// the app; it forwards each call here. We translate the handful of events that
// matter to ad platforms into three generic conversion events our Zaraz tools
// trigger on — `cta_click`, `generate_lead`, `engaged` — so Reddit today (and
// Meta / Google Ads / LinkedIn later) can hang tags off the same names without
// any further app changes.
//
// Why Zaraz, and why it stays under ad blockers' radar:
//   - Its loader is first-party, served from Cloudflare at ube.dev/cdn-cgi/zaraz
//     — not googletagmanager.com — so it's harder to block than a tracker-domain
//     match (uBlock/EasyPrivacy do carry /cdn-cgi/zaraz/ path filters; a blocked
//     loader just leaves window.zaraz undefined and every call no-ops).
//   - Zaraz routes the ad tags through Cloudflare, so the browser never loads
//     or calls third-party tracker domains (connect.facebook.net, etc.)
//     directly. We ship zero client-side pixel scripts.
//   - On localhost Cloudflare never injects Zaraz, so `window.zaraz` is
//     undefined and every track() below is a silent no-op — no tags, no
//     network, no noise. Same contract Amplitude has.
//
// Every conversion we emit carries:
//   - `event_id` — a unique id per event the ad tools use to deduplicate, so a
//     re-fired or double-submitted event isn't counted twice. The signup form
//     mints one id and reuses it for both the Zaraz `generate_lead` event and
//     its Basin record; every other event mints its own here.
//   - The full attribution bundle (getAttribution): UTM tags, every ad-click ID
//     (gclid, fbclid, rdt_cid, …) and the Meta _fbp / _fbc identifiers — the
//     raw material Zaraz's tools need for advanced matching. We forward it
//     unhashed; each tool normalizes and hashes its own subset before sending.
import { getAttribution } from "@/lib/attribution"

declare global {
  interface Window {
    // Zaraz's Web API. Present only once Cloudflare's edge-injected script has
    // run (production); undefined on localhost, where every call no-ops.
    zaraz?: {
      track: (name: string, properties?: Record<string, unknown>) => void
    }
  }
}

// A unique id for one event. `crypto.randomUUID` exists in every context we
// serve from (HTTPS and localhost are both secure contexts); the fallback just
// keeps an ancient engine from throwing.
export const newEventId = (): string => {
  try {
    return crypto.randomUUID()
  } catch {
    return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

// "Engaged" must reach the ad platforms exactly once per session, whether the
// 30s active-time threshold or the 50% scroll threshold trips first. Both
// `engaged_30s` and `scroll_depth` fire independently; this flag collapses them
// into a single ad signal.
const ENGAGED_FLAG = "ube_engaged_sent"
const SCROLL_ENGAGED_THRESHOLD = 50

const claimEngagedOnce = (): boolean => {
  if (sessionStorage.getItem(ENGAGED_FLAG) === "1") return false
  sessionStorage.setItem(ENGAGED_FLAG, "1")
  return true
}

type ConversionEvent = { name: string; props: Record<string, unknown> }

// Map an internal analytics event to its conversion event — the Zaraz event
// name plus only the props unique to it — or null if it isn't part of the ad
// funnel (most events aren't). `event_id` and the attribution bundle are
// attached centrally in pushConversion, so every conversion carries them.
const toConversionEvent = (
  name: string,
  props?: Record<string, unknown>,
): ConversionEvent | null => {
  switch (name) {
    // Every "Request access" CTA routes through openRequestAccess(), which
    // fires this with a `source` (nav, home_hero, …) — our cta_id.
    case "request_access_modal_opened":
      return {
        name: "cta_click",
        props: { cta_id: String(props?.["source"] ?? "unknown") },
      }
    // Fires in the form's onSubmit, before the Basin POST — the immediate,
    // valid-submission lead signal. `generate_lead` is the canonical lead event
    // ad platforms recognize as a conversion; `form_id` scopes it to the one
    // signup form we have today. `user_email` rides along (lowercased + trimmed
    // only) so each tool can run its own advanced matching — it normalizes and
    // hashes tool-side, so the networks only ever receive a hash.
    case "request_access_submitted": {
      const email = props?.["email"]
      const normalized =
        typeof email === "string" ? email.trim().toLowerCase() : ""
      return {
        name: "generate_lead",
        props: {
          form_id: "signup",
          ...(normalized ? { user_email: normalized } : {}),
        },
      }
    }
    // Engagement: whichever of 30s-active / 50%-scroll trips first, once.
    case "engaged_30s":
      return claimEngagedOnce() ? { name: "engaged", props: {} } : null
    case "scroll_depth": {
      const percent = props?.["percent"]
      if (typeof percent !== "number" || percent < SCROLL_ENGAGED_THRESHOLD)
        return null
      return claimEngagedOnce() ? { name: "engaged", props: {} } : null
    }
    default:
      return null
  }
}

// Called by `track()` for every event. Forwards the ad-relevant ones to Zaraz,
// each stamped with a dedup `event_id` and the full attribution bundle.
export const pushConversion = (
  name: string,
  props?: Record<string, unknown>,
): void => {
  const mapped = toConversionEvent(name, props)
  if (!mapped) return
  window.zaraz?.track(mapped.name, {
    ...getAttribution(),
    ...mapped.props,
    event_id: String(props?.["event_id"] || newEventId()),
  })
}
