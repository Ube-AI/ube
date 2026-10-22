/* Weekly brief. The card assembles top to bottom: KPI cards land, their
   numbers roll into place, the recommendation and its funnel build, and the
   approval bar arrives and gets "clicked".

   This one sits in the hero, above the fold, so it plays on load rather than
   waiting on an IntersectionObserver like the mockups further down the page. */

export {}

const root = document.querySelector<HTMLElement>("[data-weekly-mockup]")

if (root) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const kpis = Array.from(root.querySelectorAll<HTMLElement>("[data-kpi]"))
  const rec = root.querySelector<HTMLElement>("[data-rec]")
  const recLines = Array.from(
    root.querySelectorAll<HTMLElement>("[data-rec-line]"),
  )
  const bars = Array.from(root.querySelectorAll<HTMLElement>(".a-bar"))
  const approve = root.querySelector<HTMLElement>("[data-approve]")
  const approveBtn = root.querySelector<HTMLElement>(".approve-btn")
  const approveDot = root.querySelector<HTMLElement>(".approve-dot")

  const at = (ms: number, fn: () => void) =>
    window.setTimeout(fn, reduced ? 0 : ms)

  /* ----- reels ------------------------------------------------- */

  type Reel = { node: HTMLElement; spin: (dur: number, delay: number) => void }

  /** Builds a vertical reel of cells that can be spun to its last cell. */
  function buildReel(cells: string[], variant: string): Reel {
    const reel = document.createElement("span")
    reel.className = `reel reel--${variant}`
    const track = document.createElement("span")
    track.className = "reel-track"

    for (const cell of cells) {
      const el = document.createElement("span")
      el.className = "reel-cell"
      el.textContent = cell
      track.appendChild(el)
    }
    reel.appendChild(track)

    const end = `translateY(calc(${cells.length - 1} * var(--cell) * -1))`

    return {
      node: reel,
      spin(duration, delay) {
        if (reduced) {
          track.style.transform = end
          return
        }
        track.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
        // next frame, so the transition actually runs
        requestAnimationFrame(() => {
          track.style.transform = end
        })
      },
    }
  }

  function buildNumberReels(host: HTMLElement): Reel[] {
    const target = host.dataset["roll"] ?? ""
    const prefix = host.dataset["prefix"] ?? ""
    const spins = 2 // full 0-9 passes before settling
    host.textContent = ""

    if (prefix) {
      const p = document.createElement("span")
      p.className = "reel-lit"
      p.textContent = prefix
      host.appendChild(p)
    }

    const reels: Reel[] = []
    for (const ch of target) {
      if (!/\d/.test(ch)) {
        const lit = document.createElement("span")
        lit.className = "reel-lit"
        lit.textContent = ch
        host.appendChild(lit)
        continue
      }
      const cells: string[] = []
      for (let s = 0; s < spins; s++) {
        for (let d = 0; d < 10; d++) cells.push(String(d))
      }
      cells.push(ch)
      const reel = buildReel(cells, "digit")
      host.appendChild(reel.node)
      reels.push(reel)
    }
    return reels
  }

  function buildWordReel(host: HTMLElement): Reel[] {
    const words = (host.dataset["rollWords"] ?? "").split("|")
    host.textContent = ""
    const reel = buildReel(words, "word")
    host.appendChild(reel.node)
    return [reel]
  }

  const reelGroups: Reel[][] = []
  for (const host of root.querySelectorAll<HTMLElement>("[data-roll]")) {
    reelGroups.push(buildNumberReels(host))
  }
  for (const host of root.querySelectorAll<HTMLElement>("[data-roll-words]")) {
    reelGroups.push(buildWordReel(host))
  }

  /* ----- timeline ---------------------------------------------- */

  function play() {
    // 1. KPI cards appear, staggered.
    kpis.forEach((el, i) => {
      at(180 + i * 130, () => el.classList.add("is-in"))
    })

    // 2. Numbers roll into place once their card has landed.
    at(760, () => {
      reelGroups.forEach((group, gi) => {
        group.forEach((reel, ri) => {
          reel.spin(1150 + ri * 90, gi * 140 + ri * 70)
        })
      })
    })

    // 3. Recommendation card appears.
    if (rec) at(2050, () => rec.classList.add("is-in"))

    // 4. Its copy slides in from transparent.
    recLines.forEach((el, i) => {
      at(2320 + i * 150, () => el.classList.add("is-in"))
    })

    // 5. Funnel bars grow sideways, one after another, text fading in behind.
    bars.forEach((el, i) => {
      at(2980 + i * 260, () => el.classList.add("is-in"))
    })

    // 6. Approval bar slides in.
    at(4320, () => {
      approve?.classList.add("is-in")
      at(300, () => approveDot?.classList.add("is-pulsing"))
    })

    // 7. The Approve button gets "clicked".
    at(5000, () => {
      approveBtn?.classList.add("is-pressed")
      at(600, () => approveBtn?.classList.remove("is-pressed"))
    })
  }

  // Kick off after fonts settle so the reels measure correctly.
  if (document.fonts) {
    document.fonts.ready.then(play)
  } else {
    play()
  }
}
