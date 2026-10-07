// Ube — Attribution capture.
//
// Ad platforms stamp each ad click with an ID in the landing URL (Google
// `gclid`, Reddit `rdt_cid`, Meta `fbclid`, …); UTM params tag the campaign. We
// capture them on page load and persist them (localStorage) so they survive the
// multi-page hops between landing and the Request-access form. We also derive
// Meta's `_fbp` / `_fbc` identifiers first-party (see below). The full set is
// then surfaced two ways: as fields on the Basin submission, and on every Zaraz
// conversion event — so attribution and retargeting work without shipping any
// pixel script (the Zaraz tools still call their ad endpoints from the browser;
// see conversions.ts).
//
// Scope note — who consumes what:
//   - Amplitude's Browser SDK already auto-captures every URL param below as
//     marketing attribution, so we deliberately do NOT re-send any of it to
//     Amplitude — that would be duplicate noise. See the marketing-attribution
//     docs.
//   - Basin records nothing on its own, so the Request-access form sends the
//     full set (getAttribution) for retargeting.
//   - Zaraz gets the same set on each conversion event, but a tool only sees
//     the fields its action explicitly maps — sent verbatim, never hashed (see
//     conversions.ts). Pixels normally self-capture the click ID from the
//     landing URL, but deeper-page navigation breaks that — the persisted copy
//     is what survives.
//
// Meta `_fbp` / `_fbc`: the identifiers Meta's tools match on. We generate them
// ourselves, first-party, so we never load Meta's pixel script (which ad
// blockers target): `_fbc` encodes the `fbclid` from the landing URL, `_fbp` is
// a durable random browser id. Stored as real cookies under the names Meta's
// tooling looks for (`_fbp` / `_fbc`) and also echoed in the event payload —
// intended for Zaraz's Meta tool (not configured yet) to read; verify in prod
// that the value it reports matches the cookie (whether a managed component
// prefers a page-set cookie over its own stored value is its detail).

const STORAGE_PREFIX = "ube_attr_"

// Click IDs (deterministic ad-click attribution). Add a new platform's click-ID
// param here as we onboard it — getAttribution picks it up everywhere with no
// other change.
const CLICK_ID_PARAMS = [
  "gclid", // Google Ads
  "gbraid", // Google Ads (iOS, app→web)
  "wbraid", // Google Ads (iOS, web)
  "rdt_cid", // Reddit Ads
  "fbclid", // Meta
  "msclkid", // Microsoft Ads
  "li_fat_id", // LinkedIn
  "ttclid", // TikTok
] as const

// UTM campaign tags. Labels, not user-matching identifiers, but we forward them
// alongside the click IDs so every lead and conversion event carries its full
// campaign context.
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const

const ATTRIBUTION_PARAMS = [...CLICK_ID_PARAMS, ...UTM_PARAMS]

// Meta cookie format is `fb.<subdomainIndex>.<creationMs>.<value>`. The
// subdomain index is 1 for a registrable domain like ube.dev.
const FB_SUBDOMAIN_INDEX = 1
// Match Meta's own 90-day _fbp / _fbc lifetime.
const FB_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

// localStorage throws in some privacy modes / when storage is disabled. Guard
// both sides so a blocked store can never break page-load tracking or the form.
const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Cookie helpers — used only for Meta's `_fbp` / `_fbc`, which must be real
// cookies (under their canonical names) for Zaraz's Meta tool to read them.
const getCookie = (name: string): string | null => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    const value = match?.[1]
    return value !== undefined ? decodeURIComponent(value) : null
  } catch {
    return null
  }
}

const setCookie = (name: string, value: string): void => {
  try {
    // The Cookie Store API is Chromium-only and async; _fbp/_fbc must be set
    // synchronously and read cross-browser (incl. Safari) for Zaraz's Meta tool.
    // biome-ignore lint/suspicious/noDocumentCookie: cross-browser sync cookie required (see above)
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${FB_COOKIE_MAX_AGE}; SameSite=Lax; Secure`
  } catch {}
}

// A long numeric suffix for `_fbp`, high-entropy via crypto with a Math.random
// fallback for ancient engines.
const randomFbpSuffix = (): string => {
  try {
    return `${crypto.getRandomValues(new Uint32Array(1))[0] ?? 0}`
  } catch {
    return `${Math.floor(Math.random() * 1e10)}`
  }
}

// Persist any attribution params present in the current URL, and refresh Meta's
// `_fbp` / `_fbc` cookies. Last-touch for URL params: only overwrites a stored
// value when the param is actually in this URL, so a later direct/organic visit
// never wipes a prior ad click. Call once per page load.
export const captureAttribution = (): void => {
  const params = new URLSearchParams(window.location.search)
  for (const key of ATTRIBUTION_PARAMS) {
    const value = params.get(key)
    if (value) safeSet(STORAGE_PREFIX + key, value)
  }
  // `_fbc` encodes the click; refresh it on every new fbclid, mirroring Meta's
  // own pixel behavior.
  const fbclid = params.get("fbclid")
  if (fbclid) {
    setCookie("_fbc", `fb.${FB_SUBDOMAIN_INDEX}.${Date.now()}.${fbclid}`)
  }
  // `_fbp` is the durable browser id: keep the same value but re-set it every
  // visit so its 90-day window slides forward, the way Meta's own pixel does —
  // otherwise a visitor returning after 90 days gets a brand-new identity.
  const fbp =
    getCookie("_fbp") ??
    `fb.${FB_SUBDOMAIN_INDEX}.${Date.now()}.${randomFbpSuffix()}`
  setCookie("_fbp", fbp)
}

// The full attribution set, keyed by field name — persisted URL params plus
// Meta's `_fbp` / `_fbc`. This is what the Basin form sends and what every Zaraz
// conversion event carries. Never fully empty: `_fbp` is always generated, so
// even an organic visitor's lead can be matched / retargeted.
export const getAttribution = (): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const key of ATTRIBUTION_PARAMS) {
    const value = safeGet(STORAGE_PREFIX + key)
    if (value) result[key] = value
  }
  const fbc = getCookie("_fbc")
  if (fbc) result["fbc"] = fbc
  const fbp = getCookie("_fbp")
  if (fbp) result["fbp"] = fbp
  return result
}
