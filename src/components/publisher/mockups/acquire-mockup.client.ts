/* Campaign table. Four creatives land in order, all reading alike, and only
   then does the table say which one is working: V1 takes a success band and
   its CAC and ROAS turn green.

   Same reasoning as the action board - if V1 arrived already banded, the
   table would look sorted rather than judged, and the point here is that
   Ube reached a verdict. */

const HEAD_AT = 140 // chrome label and the daily-spend pill
const COLS_AT = 380 // column headings
const ROW_AT = 620 // first creative lands
const ROW_STEP = 170
const WIN_GAP = 520 // beat after the last row before the verdict

function setup(root: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const headEls = Array.from(
    root.querySelectorAll<HTMLElement>("[data-camp-head-el]"),
  )
  const headCells = Array.from(
    root.querySelectorAll<HTMLElement>("[data-camp-headcell]"),
  )
  const cells = Array.from(
    root.querySelectorAll<HTMLElement>("[data-camp-cell]"),
  )
  const goodCells = Array.from(
    root.querySelectorAll<HTMLElement>("[data-camp-good]"),
  )

  const rowOf = (c: HTMLElement) => Number(c.dataset["campRow"])

  // Cells are grid children, not row elements, so a "row" is whichever four
  // share a data-camp-row. Grouped once here rather than per play.
  const rowCount = 1 + cells.reduce((m, c) => Math.max(m, rowOf(c)), 0)
  const rows = Array.from({ length: rowCount }, (_, i) =>
    cells.filter((c) => rowOf(c) === i),
  )
  const winner = rows[0] ?? []

  const at = (ms: number, fn: () => void) => {
    window.setTimeout(fn, reduced ? 0 : ms)
  }

  const winAt = ROW_AT + (rows.length - 1) * ROW_STEP + WIN_GAP

  function play() {
    // 1. Header.
    headEls.forEach((el, i) => {
      at(HEAD_AT + i * 90, () => el.classList.add("is-in"))
    })

    // 2. Column headings, left to right.
    headCells.forEach((el, i) => {
      at(COLS_AT + i * 70, () => el.classList.add("is-in"))
    })

    // 3. Creatives, top to bottom. All four cells of a row move together, so
    //    the row reads as one thing arriving rather than four.
    rows.forEach((row, i) => {
      at(ROW_AT + i * ROW_STEP, () => {
        for (const cell of row) cell.classList.add("is-in")
      })
    })

    // 4. The verdict: the band and the green metrics land together.
    at(winAt, () => {
      for (const cell of winner) cell.classList.add("is-winner")
      for (const cell of goodCells) cell.classList.add("is-good")
    })
  }

  const start = () => {
    // Reduced motion gets the still, right away: no scroll gate, since there
    // is no motion to wait for and nothing to reveal.
    if (reduced) {
      play()
      return
    }
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

const camp = document.querySelector<HTMLElement>("[data-acquire-mockup]")
if (camp) setup(camp)

export {}
