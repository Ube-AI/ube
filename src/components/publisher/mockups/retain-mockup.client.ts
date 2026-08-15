/* Onboarding funnel + A/B result. The funnel fills top to bottom, the drop
   is flagged once its bar has settled, then the pointer toggles from control
   to variant so the two D1 numbers can be read against each other and B is
   called.

   The pointer is the same ring the creative brief uses; only the timeline
   differs. */

const CONTROL = 0
const VARIANT = 1

const HEAD_AT = 140
const ROW_AT = 400
const ROW_STEP = 160
const BAR_MS = 750 // one bar, matching the CSS spring
const REACH_MS = 620 // pointer travel

type Point = { x: number; y: number }

function setup(
  root: HTMLElement,
  flagged: HTMLElement,
  abHead: HTMLElement,
  abGrid: HTMLElement,
  pill: HTMLElement,
  cursor: HTMLElement,
  control: HTMLElement,
  variant: HTMLElement,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const heads = Array.from(root.querySelectorAll<HTMLElement>("[data-fn-head]"))
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-fn-row]"))
  const variants = [control, variant]

  const at = (ms: number, fn: () => void) => {
    window.setTimeout(fn, reduced ? 0 : ms)
  }

  /* ----- pointer ------------------------------------------------ */

  function centreOf(el: HTMLElement, dx = 0, dy = 0): Point {
    const r = el.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    return {
      x: r.left - b.left + r.width / 2 + dx,
      y: r.top - b.top + r.height / 2 + dy,
    }
  }
  const place = (p: Point) => {
    cursor.style.transform = `translate(${p.x}px, ${p.y}px)`
  }
  function moveTo(p: Point, dur: number) {
    cursor.style.setProperty("--move-dur", `${dur}ms`)
    place(p)
  }
  function pressCursor() {
    cursor.classList.remove("is-clicking")
    void cursor.offsetWidth
    cursor.classList.add("is-clicking")
  }

  /* ----- timeline ----------------------------------------------- */

  const lastRowAt = ROW_AT + (rows.length - 1) * ROW_STEP
  const flagAt = ROW_AT + 2 * ROW_STEP + BAR_MS + 120 // once its own bar is out
  const abAt = lastRowAt + BAR_MS + 220
  const cardsAt = abAt + 180
  const enterAt = cardsAt + 620

  function setActive(i: number) {
    variants.forEach((v, vi) => {
      v.classList.toggle("is-active", vi === i)
    })
  }

  function play() {
    // 1. Header.
    heads.forEach((el, i) => {
      at(HEAD_AT + i * 90, () => el.classList.add("is-in"))
    })

    // 2. Steps land top to bottom, each bar growing as its row arrives.
    rows.forEach((row, i) => {
      at(ROW_AT + i * ROW_STEP, () => row.classList.add("is-in"))
    })

    // 3. The drop is called out only once its bar has stopped moving.
    at(flagAt, () => flagged.classList.add("is-flagged"))

    // 4. The test below it.
    at(abAt, () => abHead.classList.add("is-in"))
    variants.forEach((v, i) => {
      at(cardsAt + i * 140, () => v.classList.add("is-in"))
    })

    // Control is what is running today, so it is what is being read first.
    // Only now does the other card recede.
    at(cardsAt + 320, () => {
      abGrid.classList.add("is-picking")
      setActive(CONTROL)
    })

    if (reduced) {
      setActive(VARIANT)
      variant.classList.add("is-winner")
      return
    }

    // 5. The pointer toggles across to the variant - one move, so the two D1
    //    numbers are compared rather than just displayed.
    at(enterAt, () => {
      place(centreOf(control, 0, 58))
      cursor.classList.add("is-shown")
    })
    at(enterAt + 220, () => moveTo(centreOf(variant), REACH_MS))

    const clickAt = enterAt + 340 + REACH_MS
    at(clickAt, () => pressCursor())
    at(clickAt + 150, () => {
      setActive(VARIANT)
      variant.classList.add("is-winner")
    })
    at(clickAt + 520, () => pill.classList.add("is-stamped"))

    // 6. Pointer leaves; the card keeps the result.
    at(clickAt + 900, () => moveTo(centreOf(variant, 0, 58), 520))
    at(clickAt + 1020, () => cursor.classList.remove("is-shown"))
  }

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

const fn = document.querySelector<HTMLElement>("[data-retain-mockup]")
if (fn) {
  const flagged = fn.querySelector<HTMLElement>("[data-fn-flag]")
  const abHead = fn.querySelector<HTMLElement>("[data-fn-abhead]")
  const abGrid = fn.querySelector<HTMLElement>("[data-fn-abgrid]")
  const pill = fn.querySelector<HTMLElement>("[data-fn-pill]")
  const cursor = fn.querySelector<HTMLElement>("[data-fn-cursor]")
  const variants = Array.from(
    fn.querySelectorAll<HTMLElement>("[data-fn-variant]"),
  )
  const control = variants[CONTROL]
  const variant = variants[VARIANT]

  if (flagged && abHead && abGrid && pill && cursor && control && variant) {
    setup(fn, flagged, abHead, abGrid, pill, cursor, control, variant)
  }
}

export {}
