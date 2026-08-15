/* Top-line metrics dashboard. Rows land one after another: header, then the
   four KPI cards, then the chart. Each card's number rolls into place and
   its delta is stamped the moment the number settles, so the stamp reads as
   a consequence of the roll rather than a second effect running alongside
   it. The cohort lines draw last. */

const HEAD_AT = 140 // chrome label + source logo
const KPI_AT = 460 // first card lands
const KPI_STEP = 120 // gap between cards
const ROLL_AT = 940 // first reel starts spinning
const ROLL_STEP = 140 // gap between one card's roll and the next
const SPIN_MS = 1080 // one digit reel, before its own per-digit stagger
const DIGIT_STEP = 70 // digits within a number settle left to right
const DRAW_MS = 1400 // one cohort line, D0 to D7
const LINE_STEP = 110 // control leads, variant B follows

type Reel = { spin: (duration: number, delay: number) => void }

function setup(root: HTMLElement, chart: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const heads = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dash-head]"),
  )
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dash-kpi]"),
  )
  const draws = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dash-draw]"),
  )
  const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-dash-dot]"))

  const at = (ms: number, fn: () => void) => {
    window.setTimeout(fn, reduced ? 0 : ms)
  }

  /* ----- reels -------------------------------------------------- */

  // Same reel geometry as the weekly brief: one column per digit, spun to
  // its last cell. Non-digits ($ , . % and the space) are set once and stay.
  function buildReels(host: HTMLElement): Reel[] {
    const target = host.dataset["dashRoll"] ?? ""
    const SPINS = 2 // full 0-9 passes before settling
    host.textContent = ""

    const reels: Reel[] = []
    for (const ch of target) {
      if (!/\d/.test(ch)) {
        const lit = document.createElement("span")
        lit.className = "reel-lit"
        lit.textContent = ch
        host.appendChild(lit)
        continue
      }

      const reel = document.createElement("span")
      reel.className = "reel reel--digit"
      const track = document.createElement("span")
      track.className = "reel-track"

      const cells: string[] = []
      for (let s = 0; s < SPINS; s++) {
        for (let d = 0; d < 10; d++) cells.push(String(d))
      }
      cells.push(ch)
      for (const cell of cells) {
        const el = document.createElement("span")
        el.className = "reel-cell"
        el.textContent = cell
        track.appendChild(el)
      }

      reel.appendChild(track)
      host.appendChild(reel)

      const end = `translateY(calc(${cells.length - 1} * var(--cell) * -1))`
      reels.push({
        spin(duration, delay) {
          if (reduced) {
            track.style.transform = end
            return
          }
          track.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
          requestAnimationFrame(() => {
            track.style.transform = end
          })
        },
      })
    }
    return reels
  }

  const tiles = cards.flatMap((card) => {
    const host = card.querySelector<HTMLElement>("[data-dash-roll]")
    const delta = card.querySelector<HTMLElement>("[data-dash-delta]")
    if (!host || !delta) return []
    return [{ reels: buildReels(host), delta }]
  })

  /* ----- timeline ----------------------------------------------- */

  // The delta is stamped over the tail of the roll, not after it. The reel
  // easing spends its last third barely moving, so by here the number reads
  // as settled and the two gestures overlap instead of queueing.
  const stampAt = (i: number) =>
    ROLL_AT + i * ROLL_STEP + Math.round(SPIN_MS * 0.52)

  // The chart box is a row landing, not a result: it comes in behind the
  // last stamp rather than waiting for every digit to stop, which left a
  // dead beat with nothing moving. The lines still hold until the box has
  // settled, so the box always reads as arriving first.
  const chartAt = stampAt(tiles.length - 1) + 140
  const drawAt = chartAt + 400

  function play() {
    // 1. Header row.
    heads.forEach((el, i) => {
      at(HEAD_AT + i * 90, () => el.classList.add("is-in"))
    })

    // 2. KPI cards, left to right.
    cards.forEach((el, i) => {
      at(KPI_AT + i * KPI_STEP, () => el.classList.add("is-in"))
    })

    // 3. Each number rolls, then its delta is stamped on top of it.
    tiles.forEach((tile, i) => {
      at(ROLL_AT, () => {
        tile.reels.forEach((reel, ri) => {
          reel.spin(SPIN_MS + ri * 80, i * ROLL_STEP + ri * DIGIT_STEP)
        })
      })
      at(stampAt(i), () => tile.delta.classList.add("is-stamped"))
    })

    // 4. Chart box.
    at(chartAt, () => chart.classList.add("is-in"))

    // 5. Both cohorts sweep D0 to D7 on the one clock, control a beat
    //    ahead. The end dot lands into the tail of its own line, while the
    //    pen is already slowing.
    draws.forEach((draw, i) => {
      const delay = i * LINE_STEP
      draw.style.setProperty("--draw-dur", `${DRAW_MS}ms`)
      draw.style.setProperty("--draw-delay", `${delay}ms`)
      at(drawAt, () => draw.classList.add("is-drawn"))
      at(drawAt + delay + DRAW_MS - 60, () => {
        dots[i]?.classList.add("is-in")
      })
    })
  }

  // Bottom of the page, so hold until it is actually on screen.
  const start = () => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect()
            play()
          }
        }
      },
      { threshold: 0.3 },
    )
    io.observe(root)
  }

  if (document.fonts) {
    document.fonts.ready.then(start)
  } else {
    window.addEventListener("load", start)
  }
}

const dash = document.querySelector<HTMLElement>("[data-measure-mockup]")
if (dash) {
  const chart = dash.querySelector<HTMLElement>("[data-dash-chart]")
  if (chart) setup(dash, chart)
}

export {}
