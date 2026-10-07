// Ube — Conversion events (sink: Cloudflare Zaraz).
//
// `track()` in analytics.ts is the single dispatch point for every event in
// the app; it forwards each call here. We translate the handful of events that
// matter to ad platforms into three generic conversion events our Zaraz tools
// trigger on — `cta_click`, `generate_lead`, `engaged` — so LinkedIn and Reddit
// today (and Meta / Google Ads later) can hang tags off the same names without
// any further app changes.
//
// Why Zaraz, and what is (and isn't) first-party:
//   - Its loader and track endpoint are first-party, served by Cloudflare from
//     custom paths on ube.dev (/imp/init.js, /imp/main.js, /imp/t) — not
//     googletagmanager.com, and not the stock /cdn-cgi/zaraz/ path blocklists
//     filter. A blocked loader just leaves window.zaraz undefined and every
//     call no-ops.
//   - We ship zero pixel scripts, but the two tools configured today are NOT
//     server-side: the LinkedIn Insight and Reddit managed components use
//     `client.fetch`, so the visitor's browser requests
//     px.ads.linkedin.com/collect/ and alb.reddit.com/rp.gif directly — and an
//     ad blocker can drop those. (Zaraz's Meta tool is server-side CAPI, but
//     isn't configured.) Verified against managed-components/{linkedin,reddit}
//     and a live capture, 2026-10-06.
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
//     (gclid, fbclid, rdt_cid, …) and the Meta _fbp / _fbc identifiers. A tool
//     only receives the fields its Zaraz action explicitly maps, and neither
//     the LinkedIn nor the Reddit component hashes anything: mapped fields go
//     into the request URL verbatim (LinkedIn's takes no custom fields at all).
//     So the one piece of PII we send — the lead's email — is canonicalized
//     and SHA-256 hashed here, in the browser, to Reddit's spec; only the hash
//     ever leaves the page.
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

// `email` is the canonicalized address to hash before dispatch — never sent raw.
type ConversionEvent = {
  name: string
  props: Record<string, unknown>
  email?: string
}

// Reddit's canonical form for a hashed email (Ads Help, "Manual Advanced
// Matching for Developers"): lowercase, drop the +alias, then strip every
// non-alphanumeric from the username — `Al.ice$+Apple@Example.Com` and
// `alice@example.com` must hash alike. Empty if there's no username to keep.
const canonicalizeEmailForReddit = (email: string): string => {
  const lowered = email.trim().toLowerCase()
  const at = lowered.lastIndexOf("@")
  if (at < 1) return ""
  const username = (lowered.slice(0, at).split("+")[0] ?? "").replace(
    /[^a-z0-9]/g,
    "",
  )
  return username ? `${username}@${lowered.slice(at + 1)}` : ""
}

// Lowercase-hex SHA-256, as Reddit expects. Null if SubtleCrypto is
// unavailable, so the event still goes out.
const sha256Hex = async (value: string): Promise<string | null> => {
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    )
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("")
  } catch {
    return null
  }
}

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
    // signup form we have today. The email is handed back, canonicalized, for
    // pushConversion to hash into `reddit_email_sha256` — made to be mapped
    // onto the Reddit tool's `em` field, which forwards it verbatim. The hash
    // is Reddit-specific (other networks canonicalize differently), so don't
    // reuse it for another tool. Never add the raw address to `props`.
    case "request_access_submitted": {
      const email = props?.["email"]
      const canonical =
        typeof email === "string" ? canonicalizeEmailForReddit(email) : ""
      return {
        name: "generate_lead",
        props: { form_id: "signup" },
        ...(canonical ? { email: canonical } : {}),
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
// each stamped with a dedup `event_id` and the full attribution bundle. The
// payload is built synchronously; only an event carrying an email is dispatched
// a tick later, once its hash resolves.
export const pushConversion = (
  name: string,
  props?: Record<string, unknown>,
): void => {
  const mapped = toConversionEvent(name, props)
  if (!mapped) return
  const payload = {
    ...getAttribution(),
    ...mapped.props,
    event_id: String(props?.["event_id"] || newEventId()),
  }
  if (!mapped.email) {
    window.zaraz?.track(mapped.name, payload)
    return
  }
  sha256Hex(mapped.email)
    .then((hash) => {
      window.zaraz?.track(mapped.name, {
        ...payload,
        ...(hash ? { reddit_email_sha256: hash } : {}),
      })
    })
    // Past track()'s try/catch by now — swallow so a Zaraz hiccup stays silent.
    .catch(() => {})
}
