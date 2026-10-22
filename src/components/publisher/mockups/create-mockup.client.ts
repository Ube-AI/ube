/* Creative brief. The email assembles, then a pointer walks the format
   select: opens it, moves down the list, picks AI UGC, and the trigger takes
   the new value. The menu is left open on the result rather than shut, so
   the card rests on the choice it just made.

   Pointer positions are read from the live layout rather than written as
   coordinates, so the cursor keeps landing on the right thing when the card
   reflows - which it does, since the shell is fluid. */

const START = 0 // Static ad - where the brief arrives
const PICK = 1 // AI UGC - what the pointer chooses

const ROW_AT = 160 // first row of the email lands
const ROW_STEP = 150
const ENTER_AT = 1120 // pointer fades in
const REACH_MS = 620 // pointer travel, trigger and list alike

// Which of the four a row is. Drives --fmt, so the trigger can borrow the
// selected row's colour by borrowing its class.
const FORMATS = [
  "static-format",
  "video-format",
  "ugc-format",
  "playable-format",
]

type Point = { x: number; y: number }

function setup(
  root: HTMLElement,
  trigger: HTMLElement,
  menu: HTMLElement,
  prodName: HTMLElement,
  prodPrice: HTMLElement,
  prodIcon: HTMLElement,
  cursor: HTMLElement,
  options: HTMLElement[],
  picked: HTMLElement,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const rows = Array.from(
    root.querySelectorAll<HTMLElement>("[data-brief-row]"),
  )

  const at = (ms: number, fn: () => void) => {
    window.setTimeout(fn, reduced ? 0 : ms)
  }

  /* ----- pointer ------------------------------------------------ */

  // Centre of el, in the card's coordinate space. Measured per move: the
  // menu is only laid out once it is open, so anything cached at load would
  // be stale by the time the pointer needs it.
  function centreOf(el: HTMLElement, dx = 0, dy = 0): Point {
    const r = el.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    return {
      x: r.left - b.left + r.width / 2 + dx,
      y: r.top - b.top + r.height / 2 + dy,
    }
  }
  function place(p: Point) {
    cursor.style.transform = `translate(${p.x}px, ${p.y}px)`
  }
  function moveTo(p: Point, dur: number) {
    cursor.style.setProperty("--move-dur", `${dur}ms`)
    place(p)
  }
  function press() {
    cursor.classList.remove("is-clicking")
    void cursor.offsetWidth // restart the ripple
    cursor.classList.add("is-clicking")
  }

  /* ----- selection ---------------------------------------------- */

  function select(i: number) {
    const chosen = options[i]
    if (!chosen) return
    options.forEach((opt, oi) => {
      opt.classList.toggle("selected", oi === i)
    })
    prodName.textContent = chosen.dataset["name"] ?? ""
    prodPrice.textContent = chosen.dataset["price"] ?? ""

    // The trigger wears the chosen format's own glyph rather than a second
    // copy kept in sync by hand - cloned from the row, so the two can never
    // disagree.
    const glyph = chosen.querySelector(".format-icon svg")
    if (glyph) prodIcon.replaceChildren(glyph.cloneNode(true))
    prodIcon.className = `production-icon ${FORMATS[i] ?? ""}`
  }

  function setOpen(open: boolean) {
    menu.classList.toggle("is-open", open)
    trigger.classList.toggle("is-open", open)
  }

  /* ----- timeline ----------------------------------------------- */

  function play() {
    select(START)

    // 1. The email assembles.
    rows.forEach((row, i) => {
      at(ROW_AT + i * ROW_STEP, () => row.classList.add("is-in"))
    })

    if (reduced) {
      select(PICK)
      setOpen(true)
      return
    }

    // 2. The pointer arrives, parked clear of the card's content.
    at(ENTER_AT, () => {
      place(centreOf(trigger, 96, 74))
      cursor.classList.add("is-shown")
    })

    // 3. It reaches the trigger and opens the menu.
    at(ENTER_AT + 220, () => moveTo(centreOf(trigger), REACH_MS))
    at(ENTER_AT + 220 + REACH_MS, () => trigger.classList.add("is-hot"))
    at(ENTER_AT + 340 + REACH_MS, () => {
      press()
      at(140, () => setOpen(true))
    })

    // 4. Down the list to AI UGC. The menu has to be open and laid out
    //    before that row can be measured, hence the beat after setOpen.
    const toList = ENTER_AT + 700 + REACH_MS
    at(toList, () => {
      trigger.classList.remove("is-hot")
      moveTo(centreOf(picked), REACH_MS)
    })
    at(toList + REACH_MS, () => picked.classList.add("is-hot"))

    // 5. The pick. The menu stays open on the result, so the check landing
    //    on AI UGC and the trigger taking the new value are both still on
    //    screen once the pointer has gone.
    const clickAt = toList + REACH_MS + 200
    at(clickAt, () => press())
    at(clickAt + 150, () => select(PICK))
    at(clickAt + 620, () => picked.classList.remove("is-hot"))

    // 6. The pointer leaves the way it came.
    at(clickAt + 780, () => moveTo(centreOf(trigger, 96, 74), 520))
    at(clickAt + 900, () => cursor.classList.remove("is-shown"))
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

const creative = document.querySelector<HTMLElement>("[data-create-mockup]")
if (creative) {
  const trigger = creative.querySelector<HTMLElement>("[data-prod-trigger]")
  const menu = creative.querySelector<HTMLElement>("[data-format-menu]")
  const prodName = creative.querySelector<HTMLElement>("[data-prod-name]")
  const prodPrice = creative.querySelector<HTMLElement>("[data-prod-price]")
  const prodIcon = creative.querySelector<HTMLElement>("[data-prod-icon]")
  const cursor = creative.querySelector<HTMLElement>("[data-vcursor]")
  const options = Array.from(
    creative.querySelectorAll<HTMLElement>("[data-format-option]"),
  )
  const picked = options[PICK]

  if (
    trigger &&
    menu &&
    prodName &&
    prodPrice &&
    prodIcon &&
    cursor &&
    picked
  ) {
    setup(
      creative,
      trigger,
      menu,
      prodName,
      prodPrice,
      prodIcon,
      cursor,
      options,
      picked,
    )
  }
}

export {}
