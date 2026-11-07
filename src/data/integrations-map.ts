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

// Each box keeps the hub at the centre of the area inside its padding.
export type MapLayout = {
  width: number
  height: number
  pad: { x: number; top: number; bottom: number }
  positions: Record<NodeId, Point>
}

export const landscapeLayout: MapLayout = {
  width: 740,
  height: 640,
  pad: { x: 62, top: 52, bottom: 72 },
  positions: {
    ube: { x: 370, y: 310 },
    ube_sdk: { x: 678, y: 568 },
    revenuecat: { x: 257.1, y: 123.7 },
    firebase: { x: 678, y: 60.4 },
    bigquery: { x: 104.4, y: 52 },
    appsflyer: { x: 62, y: 568 },
    amplitude: { x: 62, y: 199.5 },
    posthog: { x: 468.8, y: 52 },
    app_store_connect: { x: 222, y: 225 },
    google_play: { x: 678, y: 252.3 },
    admob: { x: 533.3, y: 406.9 },
    github: { x: 504.8, y: 214.9 },
    meta_ads: { x: 192.9, y: 442 },
    google_ads: { x: 651.7, y: 423.1 },
    tiktok_ads: { x: 154, y: 348.4 },
    clarity: { x: 498.5, y: 568 },
    creatify: { x: 371.5, y: 177.8 },
    sett: { x: 341, y: 470.1 },
  },
}

export const portraitLayout: MapLayout = {
  width: 460,
  height: 960,
  pad: { x: 56, top: 44, bottom: 60 },
  positions: {
    ube: { x: 230, y: 472 },
    ube_sdk: { x: 72.9, y: 900 },
    revenuecat: { x: 389, y: 324.4 },
    firebase: { x: 397.2, y: 900 },
    bigquery: { x: 397.2, y: 86 },
    appsflyer: { x: 63.2, y: 240.5 },
    amplitude: { x: 290.8, y: 63 },
    posthog: { x: 395.6, y: 523 },
    app_store_connect: { x: 305, y: 169.8 },
    google_play: { x: 262.4, y: 875.2 },
    admob: { x: 238.5, y: 747.2 },
    github: { x: 184.1, y: 579.7 },
    meta_ads: { x: 169, y: 350.7 },
    google_ads: { x: 141.2, y: 807.9 },
    tiktok_ads: { x: 259.5, y: 313.5 },
    clarity: { x: 57.5, y: 721.9 },
    creatify: { x: 301.9, y: 664.3 },
    sett: { x: 319.7, y: 400.3 },
  },
}
