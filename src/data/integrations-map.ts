// The first 13 tools mirror ube-platform's attribution graph, in its order;
// the last four come from the site's own copy.
export const tools = [
  { id: "ube_sdk", label: "Ube Attribution SDK" },
  { id: "revenuecat", label: "RevenueCat" },
  { id: "firebase", label: "Firebase" },
  { id: "bigquery", label: "BigQuery" },
  { id: "appsflyer", label: "AppsFlyer" },
  { id: "amplitude", label: "Amplitude" },
  { id: "posthog", label: "PostHog" },
  { id: "app_store_connect", label: "App Store Connect" },
  { id: "google_play", label: "Google Play" },
  { id: "admob", label: "AdMob" },
  { id: "github", label: "GitHub" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "tiktok_ads", label: "TikTok Ads" },
  { id: "clarity", label: "Clarity" },
  { id: "creatify", label: "Creatify" },
  { id: "sett", label: "Sett" },
] as const satisfies readonly { id: string; label: string }[]

export type ToolId = (typeof tools)[number]["id"]
export type NodeId = ToolId | "ube"
type Handoff = { source: ToolId; target: ToolId }
type Spine = { source: ToolId; label: string; twoWay?: boolean }
export type Point = { x: number; y: number }

export const HUB_RADIUS = 40

// Links to Ube; a two-way link is one Ube also writes to. The last three
// come from the site's own copy.
export const spines: Spine[] = [
  { source: "revenuecat", label: "Revenue" },
  { source: "firebase", label: "Analytics" },
  { source: "appsflyer", label: "Attribution" },
  { source: "amplitude", label: "Events" },
  { source: "admob", label: "Ad revenue" },
  { source: "github", label: "Source" },
  { source: "meta_ads", label: "Campaigns & metrics", twoWay: true },
  { source: "google_ads", label: "Campaigns & metrics", twoWay: true },
  { source: "tiktok_ads", label: "Campaigns & metrics", twoWay: true },
  { source: "creatify", label: "Creatives", twoWay: true },
  { source: "sett", label: "Playables", twoWay: true },
]

// Links between tools, set up in a vendor's dashboard or wired by the Ube
// SDK. The last two come from the site's own copy.
export const handoffs: Handoff[] = [
  { source: "ube_sdk", target: "appsflyer" },
  { source: "ube_sdk", target: "firebase" },
  { source: "revenuecat", target: "amplitude" },
  { source: "revenuecat", target: "posthog" },
  { source: "app_store_connect", target: "revenuecat" },
  { source: "google_play", target: "firebase" },
  { source: "google_play", target: "google_ads" },
  { source: "revenuecat", target: "firebase" },
  { source: "revenuecat", target: "appsflyer" },
  { source: "firebase", target: "bigquery" },
  { source: "bigquery", target: "amplitude" },
  { source: "appsflyer", target: "amplitude" },
  { source: "appsflyer", target: "meta_ads" },
  { source: "appsflyer", target: "google_ads" },
  { source: "appsflyer", target: "admob" },
  { source: "firebase", target: "admob" },
  { source: "firebase", target: "google_ads" },
  { source: "admob", target: "google_ads" },
  { source: "appsflyer", target: "tiktok_ads" },
  { source: "ube_sdk", target: "clarity" },
]

// The hero's drawing: 4:5, so on a phone it stands a little taller than it is
// wide. Placed by the panel's own layout search (neuron-layout.ts and
// untangle-layout.ts), sized for the names a phone draws, with Ube held near
// the middle.
export const heroLayout = {
  width: 520,
  height: 650,
  positions: {
    ube: { x: 290, y: 299.5 },
    ube_sdk: { x: 79.9, y: 592.8 },
    revenuecat: { x: 384.8, y: 97.4 },
    firebase: { x: 479.9, y: 583.4 },
    bigquery: { x: 480.1, y: 34 },
    appsflyer: { x: 44.9, y: 184 },
    amplitude: { x: 145.6, y: 36 },
    posthog: { x: 458.3, y: 262.1 },
    app_store_connect: { x: 245.6, y: 129.9 },
    google_play: { x: 306.4, y: 573.2 },
    admob: { x: 183, y: 435.4 },
    github: { x: 343.3, y: 203.4 },
    meta_ads: { x: 159.4, y: 206.8 },
    google_ads: { x: 192.2, y: 551.8 },
    tiktok_ads: { x: 166.2, y: 315.1 },
    clarity: { x: 32.1, y: 481.6 },
    creatify: { x: 437.9, y: 369.3 },
    sett: { x: 341.3, y: 410.7 },
  },
} as const satisfies {
  width: number
  height: number
  positions: Record<NodeId, Point>
}
