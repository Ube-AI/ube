// Ube — Analytics: Amplitude wrapper + tracking initializers.
//
// The tracking primitives were `useEngagement…` / `useScrollDepth…` React
// hooks while every page mounted a top-level React app island (slice 0001).
// Slice 0008 dissolved those islands — terms and privacy ship near-zero JS
// now and the landing page mounts only the components that actually need
// hydration (HowItWorks, FAQ, the conversion modal). So the trackers were
// rewritten as plain functions that are invoked once from a vanilla
// `<script>` in `BaseLayout.astro`. The cleanup contract returns a
// disposer; for now BaseLayout just fires-and-forgets since these run for
// the lifetime of the document.
//
// `track()` is the single dispatch point for every event in the app. It fans
// each call out to two sinks: Amplitude (product analytics) and Cloudflare
// Zaraz (ad platforms — LinkedIn and Reddit today, Meta / Google Ads later). The
// Zaraz mapping lives in `lib/conversions.ts`; keeping the fan-out inside
// `track()` means no call site has to know the ad layer exists.
import { pushConversion } from "@/lib/conversions"

// Loose Amplitude shape — we only use `.track` and the dynamic plugins are
// initialized inline in BaseLayout.astro. Keep this an `any` rather than
// pulling in @amplitude/analytics-browser types just to read one method.
declare global {
  interface Window {
    amplitude?: {
      track: (name: string, props?: Record<string, unknown>) => void
    }
  }
}

export const track = (name: string, props?: Record<string, unknown>): void => {
  try {
    window.amplitude?.track(name, props)
  } catch {}
  // Separate try/catch so a Zaraz hiccup can never take down Amplitude tracking.
  try {
    pushConversion(name, props)
  } catch {}
}

// Fires "engaged_30s" once per session after 30s of active time (visible + focused).
// Pauses while the tab is hidden or unfocused so background tabs don't count.
export const initEngagementTracking = (): (() => void) => {
  if (sessionStorage.getItem("ube_engaged_30s") === "1") return () => {}
  let elapsedMs = 0
  let lastTick: number | null = null
  let timerId: ReturnType<typeof setTimeout> | null = null
  const THRESHOLD_MS = 30000

  const isActive = () =>
    document.visibilityState === "visible" && document.hasFocus()

  const fire = () => {
    if (sessionStorage.getItem("ube_engaged_30s") === "1") return
    sessionStorage.setItem("ube_engaged_30s", "1")
    track("engaged_30s")
  }

  const pause = () => {
    if (lastTick !== null) {
      elapsedMs += Date.now() - lastTick
      lastTick = null
    }
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
    if (elapsedMs >= THRESHOLD_MS) fire()
  }

  const resume = () => {
    if (lastTick !== null) return
    lastTick = Date.now()
    const remaining = Math.max(0, THRESHOLD_MS - elapsedMs)
    timerId = setTimeout(() => {
      if (lastTick !== null) {
        elapsedMs += Date.now() - lastTick
        lastTick = Date.now()
      }
      if (elapsedMs >= THRESHOLD_MS) fire()
    }, remaining)
  }

  const sync = () => {
    if (sessionStorage.getItem("ube_engaged_30s") === "1") return
    if (isActive()) resume()
    else pause()
  }

  document.addEventListener("visibilitychange", sync)
  window.addEventListener("focus", sync)
  window.addEventListener("blur", sync)
  sync()

  return () => {
    document.removeEventListener("visibilitychange", sync)
    window.removeEventListener("focus", sync)
    window.removeEventListener("blur", sync)
    if (timerId) clearTimeout(timerId)
  }
}

// Fires scroll_depth at 25/50/75/100%, once per session per threshold.
export const initScrollDepthTracking = (): (() => void) => {
  const THRESHOLDS = [25, 50, 75, 100]
  const fired = new Set<number>()
  for (const p of THRESHOLDS) {
    if (sessionStorage.getItem(`ube_scroll_${p}`) === "1") fired.add(p)
  }

  const compute = () => {
    const doc = document.documentElement
    const scrollable = doc.scrollHeight - window.innerHeight
    if (scrollable <= 0) return 100
    const percent = (window.scrollY / scrollable) * 100
    return Math.max(0, Math.min(100, percent))
  }

  const onScroll = () => {
    const pct = compute()
    for (const t of THRESHOLDS) {
      if (!fired.has(t) && pct >= t) {
        fired.add(t)
        sessionStorage.setItem(`ube_scroll_${t}`, "1")
        track("scroll_depth", { percent: t })
      }
    }
    if (fired.size === THRESHOLDS.length) {
      window.removeEventListener("scroll", onScroll)
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  onScroll()
  return () => window.removeEventListener("scroll", onScroll)
}
