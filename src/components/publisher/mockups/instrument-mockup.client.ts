/* SDK diff. Types the patch in line by line, parks a caret on an empty
   line, then walks the footer logos. */

export {}

const mockup = document.querySelector<HTMLElement>("[data-instrument-mockup]")

if (mockup) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const lines = Array.from(
    mockup.querySelectorAll<HTMLElement>(".code .diff-add"),
  )

  const LINE_MS = 140 // how long one line takes to fade in
  const STEP_MS = 60 // gap between line starts (lines overlap slightly)

  mockup.style.setProperty("--line-dur", `${LINE_MS}ms`)
  // The caret holds for one beat, so exactly one line is ever marked.
  mockup.style.setProperty("--caret-dur", `${STEP_MS}ms`)
  lines.forEach((line, i) => {
    line.style.setProperty("--delay", `${i * STEP_MS}ms`)
  })

  const typedMs = (lines.length - 1) * STEP_MS + LINE_MS

  function play() {
    if (!mockup) return
    mockup.classList.add("is-typing")
    const at = (ms: number, fn: () => void) => {
      window.setTimeout(fn, reduced ? 0 : ms)
    }
    at(typedMs + 220, () => mockup.classList.add("is-ready"))
    at(typedMs + 420, () => mockup.classList.add("is-syncing"))
  }

  // It sits well below the fold, so wait until it is actually on screen.
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
      { threshold: 0.4 },
    )
    io.observe(mockup)
  }

  if (document.fonts) {
    document.fonts.ready.then(start)
  } else {
    start()
  }
}
