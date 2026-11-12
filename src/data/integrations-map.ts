// The first 11 tools and their links come from ube-platform's attribution
// graph, in its order, without BigQuery and Amplitude: PostHog takes
// Amplitude's link to Ube, and Amplitude's handoffs are left out. TikTok Ads
// and Clarity come from the site's own copy.
export const tools = [
  { id: "ube_sdk", label: "Ube Attribution SDK" },
  { id: "revenuecat", label: "RevenueCat" },
  { id: "firebase", label: "Firebase" },
  { id: "appsflyer", label: "AppsFlyer" },
  { id: "posthog", label: "PostHog" },
  { id: "app_store_connect", label: "App Store Connect" },
  { id: "google_play", label: "Google Play" },
  { id: "admob", label: "AdMob" },
  { id: "github", label: "GitHub" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "tiktok_ads", label: "TikTok Ads" },
  { id: "clarity", label: "Clarity" },
] as const satisfies readonly { id: string; label: string }[]

export type ToolId = (typeof tools)[number]["id"]
export type NodeId = ToolId | "ube"
type Handoff = { source: ToolId; target: ToolId }
type Spine = { source: ToolId; label: string; twoWay?: boolean }
export type Point = { x: number; y: number }

export const HUB_RADIUS = 40
// The space between a tool's circle and the top of its name.
export const LABEL_GAP = 12

// Links to Ube; a two-way link is one Ube also writes to. TikTok Ads comes
// from the site's own copy.
export const spines: Spine[] = [
  { source: "revenuecat", label: "Revenue" },
  { source: "firebase", label: "Analytics" },
  { source: "appsflyer", label: "Attribution" },
  { source: "posthog", label: "Events" },
  { source: "admob", label: "Ad revenue" },
  { source: "github", label: "Source" },
  { source: "meta_ads", label: "Campaigns & metrics", twoWay: true },
  { source: "google_ads", label: "Campaigns & metrics", twoWay: true },
  { source: "tiktok_ads", label: "Campaigns & metrics", twoWay: true },
]

// Links between tools, set up in a vendor's dashboard or wired by the Ube
// SDK. The last two come from the site's own copy.
export const handoffs: Handoff[] = [
  { source: "ube_sdk", target: "appsflyer" },
  { source: "ube_sdk", target: "firebase" },
  { source: "revenuecat", target: "posthog" },
  { source: "app_store_connect", target: "revenuecat" },
  { source: "google_play", target: "firebase" },
  { source: "google_play", target: "google_ads" },
  { source: "revenuecat", target: "firebase" },
  { source: "revenuecat", target: "appsflyer" },
  { source: "appsflyer", target: "meta_ads" },
  { source: "appsflyer", target: "google_ads" },
  { source: "appsflyer", target: "admob" },
  { source: "firebase", target: "admob" },
  { source: "firebase", target: "google_ads" },
  { source: "admob", target: "google_ads" },
  { source: "appsflyer", target: "tiktok_ads" },
  { source: "ube_sdk", target: "clarity" },
]

export const linkKinds = ["handoff", "spine"] as const
export type LinkKind = (typeof linkKinds)[number]
export type Link = {
  source: NodeId
  target: NodeId
  kind: LinkKind
  twoWay: boolean
}

// Every link the map draws: the handoffs, then the links to Ube.
export const links: Link[] = [
  ...handoffs.map((handoff) => ({
    ...handoff,
    kind: "handoff" as const,
    twoWay: false,
  })),
  ...spines.map((spine) => ({
    source: spine.source,
    target: "ube" as const,
    kind: "spine" as const,
    twoWay: spine.twoWay ?? false,
  })),
]

const handoffCount = new Map<NodeId, number>()
for (const { source, target } of handoffs) {
  handoffCount.set(source, (handoffCount.get(source) ?? 0) + 1)
  handoffCount.set(target, (handoffCount.get(target) ?? 0) + 1)
}

// A tool with more handoffs is drawn larger, as on the panel.
export const radiusOf = (id: NodeId) =>
  id === "ube" ? HUB_RADIUS : 22 + Math.min(10, (handoffCount.get(id) ?? 0) * 2)

function towards(point: Point, target: Point, distance: number): Point {
  const ux = target.x - point.x
  const uy = target.y - point.y
  const span = Math.max(1, Math.hypot(ux, uy))
  return {
    x: point.x + (ux / span) * distance,
    y: point.y + (uy / span) * distance,
  }
}

// A link bends to the same side of its direction as on the panel, and is
// trimmed to the rims of its two circles. A two-way link leaves room for an
// arrowhead at both ends.
export function linkCurve(
  from: Point,
  to: Point,
  fromRadius: number,
  toRadius: number,
  twoWay: boolean,
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(1, Math.hypot(dx, dy))
  const bend = Math.min(90, length * 0.2)
  const control = {
    x: (from.x + to.x) / 2 - (dy / length) * bend,
    y: (from.y + to.y) / 2 + (dx / length) * bend,
  }
  return {
    start: towards(from, control, fromRadius + (twoWay ? 6 : 4)),
    control,
    end: towards(to, control, toRadius + 6),
  }
}

// The hero's drawing: 4:5, so on a phone it stands a little taller than it is
// wide. The positions come from scripts/layout-integrations-map.ts: after
// changing the tools or links, run `node scripts/layout-integrations-map.ts`
// from the repo root and it rewrites them.
export const heroLayout = {
  width: 520,
  height: 650,
  positions: {
    ube: { x: 268, y: 317 },
    ube_sdk: { x: 81.4, y: 586.4 },
    revenuecat: { x: 468.2, y: 124.3 },
    firebase: { x: 474.2, y: 525.5 },
    appsflyer: { x: 44.9, y: 225.4 },
    posthog: { x: 389.7, y: 235.6 },
    app_store_connect: { x: 356.8, y: 45.5 },
    google_play: { x: 317.1, y: 505.4 },
    admob: { x: 137.9, y: 347.5 },
    github: { x: 286.2, y: 157.9 },
    meta_ads: { x: 167.8, y: 207.1 },
    google_ads: { x: 169, y: 481.9 },
    tiktok_ads: { x: 201.2, y: 45.7 },
    clarity: { x: 31, y: 459.2 },
  },
} as const satisfies {
  width: number
  height: number
  positions: Record<NodeId, Point>
}
