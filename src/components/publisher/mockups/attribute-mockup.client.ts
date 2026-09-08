/* Attribution loop. One rAF clock drives everything, so the pulse and the
   stage highlights cannot drift apart: the pulse arrives at a stage exactly
   as that stage fires, waits inside it while it enlarges and returns, then
   moves on. After the last stage it runs the return lane and the caption
   fills in step with it. */

type Parts = {
  root: HTMLElement
  diagram: HTMLElement
  svg: SVGSVGElement
  rail: SVGPathElement
  trail: SVGPathElement
  head: SVGPathElement
  stageRow: HTMLElement
  stages: HTMLElement[]
  firstStage: HTMLElement
  caption: HTMLElement
  reel: HTMLElement
  track: HTMLElement
}

const POP_MS = 460 // one stage: enlarge, hold, return to normal
const GAP_MS = 160 // rest between two consecutive stage highlights
const HOLD_F = 0.55 // fraction of the pop the pulse waits inside the stage
const RETURN_MS = 1000 // pulse travels the return lane
const RESET_MS = 520 // beat at the start port before the next lap
const CORNER = 6 // rail corner radius
const HEAD_LEN = 20 // pulse head, in px of path length
const TRAIL_LEN = 72 // its wake
const CELL_H = 14 // caption clause line height

function setup(p: Parts) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const { root, diagram, svg, rail, trail, head, stageRow, stages } = p
  const { firstStage, caption, reel, track } = p
  const cells = Array.from(track.children)

  root.style.setProperty("--pop-dur", `${POP_MS}ms`)

  const popAt = (i: number) => i * (POP_MS + GAP_MS)
  const returnAt = popAt(stages.length - 1) + POP_MS * HOLD_F
  const closeAt = returnAt + RETURN_MS
  const cycle = closeAt + RESET_MS

  /* ----- geometry ---------------------------------------------- */

  // Offsets rather than bounding rects: a stage mid-pop is scaled, and a
  // rect would report the scaled box and make the rail twitch.
  function offsetIn(el: HTMLElement, ancestor: HTMLElement) {
    let x = 0
    let y = 0
    let node: HTMLElement | null = el
    while (node && node !== ancestor) {
      x += node.offsetLeft
      y += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    return { x, y }
  }

  let stops: number[] = [] // path distance of each stage centre
  let total = 0
  let ready = false

  function measure(): boolean {
    const w = diagram.offsetWidth
    const h = diagram.offsetHeight
    if (!w || !h || !firstStage.offsetWidth) return false

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
    const rowAt = offsetIn(stageRow, diagram)
    const xs = stages.map((s) => rowAt.x + s.offsetLeft + s.offsetWidth / 2)
    const cy = rowAt.y + firstStage.offsetTop + firstStage.offsetHeight / 2
    const laneY = h - 10
    const x0 = xs[0]
    const xn = xs[xs.length - 1]
    if (x0 === undefined || xn === undefined) return false
    const r = CORNER

    // A closed rectangular circuit. The top run and both verticals hide
    // behind the cards; what stays visible is the three gaps between the
    // stages and the return lane underneath.
    const d =
      `M ${x0 + r} ${cy} L ${xn - r} ${cy} Q ${xn} ${cy} ${xn} ${cy + r} ` +
      `L ${xn} ${laneY - r} Q ${xn} ${laneY} ${xn - r} ${laneY} ` +
      `L ${x0 + r} ${laneY} Q ${x0} ${laneY} ${x0} ${laneY - r} ` +
      `L ${x0} ${cy + r} Q ${x0} ${cy} ${x0 + r} ${cy} Z`

    for (const path of [rail, trail, head]) path.setAttribute("d", d)
    total = rail.getTotalLength()

    const topLen = Math.max(0, xn - r - (x0 + r))
    stops = xs.map((x) => Math.min(topLen, Math.max(0, x - (x0 + r))))

    trail.style.strokeDasharray = `${TRAIL_LEN} ${total}`
    head.style.strokeDasharray = `${HEAD_LEN} ${total}`
    ready = true
    return true
  }

  /* ----- rolling caption clause -------------------------------- */

  let clause = 0

  function showClause(i: number) {
    clause = i
    track.style.transform = `translateY(${-i * CELL_H}px)`
  }

  function measureClauses() {
    const widest = cells.reduce(
      (w, c) => Math.max(w, c.getBoundingClientRect().width),
      0,
    )
    reel.style.setProperty("--cap-w", `${Math.ceil(widest) + 1}px`)
    showClause(0)
  }

  /* ----- the clock --------------------------------------------- */

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const smooth = (t: number) => t * t * (3 - 2 * t)

  // Where the pulse sits at time t within one lap.
  function distanceAt(t: number): number {
    const last = stages.length - 1
    for (let i = 0; i < stages.length; i++) {
      const from = stops[i]
      if (from === undefined) break
      const held = popAt(i) + POP_MS * HOLD_F
      if (t < held) return from
      if (i < last) {
        const next = popAt(i + 1)
        const to = stops[i + 1]
        if (t < next && to !== undefined) {
          return lerp(from, to, (t - held) / (next - held))
        }
      }
    }
    const p2 = Math.min(1, (t - returnAt) / RETURN_MS)
    return lerp(stops[last] ?? 0, total, smooth(p2))
  }

  let t0: number | null = null
  let rafId: number | null = null
  let closed = false
  let lastT = 0

  function frame(now: number) {
    if (t0 === null) t0 = now
    const t = (now - t0) % cycle

    if (t < lastT) closed = false // new lap
    lastT = t

    // Stage highlights. Applied by state rather than by timer, so a dropped
    // frame or a tab wake-up cannot leave one stuck on.
    stages.forEach((s, i) => {
      const on = t >= popAt(i) && t < popAt(i) + POP_MS
      s.classList.toggle("is-hot", on)
    })

    // Pulse.
    const d = distanceAt(t)
    head.style.strokeDashoffset = String(HEAD_LEN - d)
    trail.style.strokeDashoffset = String(TRAIL_LEN - d)

    // Caption: marks the close as the pulse lands back on stage 01.
    if (!closed && t >= closeAt) {
      closed = true
      caption.classList.add("is-closed")
      showClause((clause + 1) % cells.length)
      window.setTimeout(() => {
        caption.classList.remove("is-closed")
      }, RESET_MS - 80)
    }

    rafId = window.requestAnimationFrame(frame)
  }

  let visible = true

  function stop() {
    if (rafId === null) return
    window.cancelAnimationFrame(rafId)
    rafId = null
    for (const s of stages) s.classList.remove("is-hot")
    caption.classList.remove("is-closed")
    diagram.classList.add("is-idle")
  }

  // The rail can only be drawn once the row has a real width, which is not
  // guaranteed on the first pass (fonts, a hidden tab, a zero-width layout
  // pass). Every entry point runs through here instead of measuring once.
  function sync() {
    if (!ready) measure()
    if (!ready || reduced) return
    if (visible && rafId === null) {
      t0 = null
      lastT = 0
      closed = false
      diagram.classList.remove("is-idle")
      rafId = window.requestAnimationFrame(frame)
    } else if (!visible && rafId !== null) {
      stop()
    }
  }

  function init() {
    measureClauses()
    measure()

    new ResizeObserver(() => {
      measure()
      sync()
    }).observe(diagram)

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible = e.isIntersecting
        sync()
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    sync()
  }

  if (document.fonts) {
    document.fonts.ready.then(init)
  } else {
    window.addEventListener("load", init)
  }
}

const root = document.querySelector<HTMLElement>("[data-attribute-mockup]")
if (root) {
  const diagram = root.querySelector<HTMLElement>("[data-loop-diagram]")
  const svg = root.querySelector<SVGSVGElement>("[data-loop-svg]")
  const rail = root.querySelector<SVGPathElement>("[data-rail]")
  const trail = root.querySelector<SVGPathElement>("[data-trail]")
  const head = root.querySelector<SVGPathElement>("[data-head]")
  const stageRow = root.querySelector<HTMLElement>("[data-stage-row]")
  const stages = Array.from(root.querySelectorAll<HTMLElement>(".loop-stage"))
  const firstStage = stages[0]
  const caption = root.querySelector<HTMLElement>("[data-loop-caption]")
  const reel = root.querySelector<HTMLElement>("[data-cap-reel]")
  const track = reel?.querySelector<HTMLElement>(".cap-track")

  if (
    diagram &&
    svg &&
    rail &&
    trail &&
    head &&
    stageRow &&
    firstStage &&
    caption &&
    reel &&
    track
  ) {
    setup({
      root,
      diagram,
      svg,
      rail,
      trail,
      head,
      stageRow,
      stages,
      firstStage,
      caption,
      reel,
      track,
    })
  }
}

export {}
