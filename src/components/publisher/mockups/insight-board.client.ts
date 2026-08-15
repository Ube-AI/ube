/* Action board. The four findings land as a plain list, in order, all
   reading alike. Only once they are all in does the board commit: the count
   is stamped, then the highlight starts walking the rows and never stops.
   Reading them one at a time is the point - the board is a queue of work,
   not a ranking with a single winner.

   The walk is driven off one rAF clock rather than a repeating timer, and
   the lit row is derived from elapsed time each frame instead of being
   advanced by a step. That is what keeps the loop seamless: a dropped
   frame, a scroll away, or a tab wake-up cannot leave two rows lit or drift
   the cycle out of phase with itself. */

const HEAD_AT = 140 // chrome label
const ROW_AT = 420 // first finding lands
const ROW_STEP = 170 // gap between findings
const PILL_GAP = 420 // beat after the last row before the count lands
const WALK_GAP = 320 // and again before the highlight sets off
const HOLD_MS = 1500 // one row keeps the highlight this long

function setup(root: HTMLElement, head: HTMLElement, pill: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-ins-row]"))
  if (rows.length === 0) return

  const pillAt = ROW_AT + (rows.length - 1) * ROW_STEP + PILL_GAP
  const walkAt = pillAt + WALK_GAP
  const cycle = HOLD_MS * rows.length

  const at = (ms: number, fn: () => void) => {
    window.setTimeout(fn, reduced ? 0 : ms)
  }

  /* ----- the walk ----------------------------------------------- */

  let t0: number | null = null
  let rafId: number | null = null
  let visible = true
  let walking = false // the entrance has handed over

  function frame(now: number) {
    if (t0 === null) t0 = now
    const lit = Math.floor(((now - t0) % cycle) / HOLD_MS)
    rows.forEach((row, i) => {
      row.classList.toggle("is-high", i === lit)
    })
    rafId = window.requestAnimationFrame(frame)
  }

  function startWalk() {
    if (rafId !== null || !visible) return
    t0 = null // re-entering the viewport picks up from 01 again
    rafId = window.requestAnimationFrame(frame)
  }

  function stopWalk() {
    if (rafId === null) return
    window.cancelAnimationFrame(rafId)
    rafId = null
  }

  function play() {
    // 1. Header row.
    at(HEAD_AT, () => head.classList.add("is-in"))

    // 2. Findings, top to bottom.
    rows.forEach((row, i) => {
      at(ROW_AT + i * ROW_STEP, () => row.classList.add("is-in"))
    })

    // 3. How many were found.
    at(pillAt, () => pill.classList.add("is-stamped"))

    // 4. The highlight sets off down the board and keeps going.
    at(walkAt, () => {
      walking = true
      // Reduced motion gets the board at rest with the first action marked,
      // rather than a highlight stepping between rows with no crossfade.
      if (reduced) rows[0]?.classList.add("is-high")
      else startWalk()
    })
  }

  // Bottom of the page, so hold until it is actually on screen - and let the
  // walk idle whenever the board is scrolled away from.
  const start = () => {
    let played = false
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible = e.isIntersecting
        if (!played && visible) {
          played = true
          play()
          return
        }
        if (!walking || reduced) return
        if (visible) startWalk()
        else stopWalk()
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

const board = document.querySelector<HTMLElement>("[data-insight-board]")
if (board) {
  const head = board.querySelector<HTMLElement>("[data-ins-head]")
  const pill = board.querySelector<HTMLElement>("[data-ins-pill]")
  if (head && pill) setup(board, head, pill)
}

export {}
