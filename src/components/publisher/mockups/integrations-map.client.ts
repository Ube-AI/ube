// Runs the integrations map only while it is on screen: SMIL keeps animating
// a drawing scrolled out of view, at a cost on every frame. Under reduced
// motion it stays paused.
const drawings = document.querySelectorAll<SVGSVGElement>(".imap-drawing")
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
const onScreen = new Set<SVGSVGElement>()

const update = (drawing: SVGSVGElement) => {
  if (onScreen.has(drawing) && !reducedMotion.matches) {
    drawing.unpauseAnimations()
  } else {
    drawing.pauseAnimations()
  }
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const drawing = entry.target
    if (!(drawing instanceof SVGSVGElement)) continue
    if (entry.isIntersecting) onScreen.add(drawing)
    else onScreen.delete(drawing)
    update(drawing)
  }
})

for (const drawing of drawings) observer.observe(drawing)
reducedMotion.addEventListener("change", () => {
  for (const drawing of drawings) update(drawing)
})
