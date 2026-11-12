// Lays out the hero's integrations map. After changing its tools or links,
// run `node scripts/layout-integrations-map.ts` from the repo root (Node 24)
// and it rewrites heroLayout.positions in src/data/integrations-map.ts. It
// starts from the positions it last wrote, and even with no changes a run can
// move tools a long way, so look at the map before keeping the result.
import { readFileSync, writeFileSync } from "node:fs"
import {
  heroLayout,
  LABEL_GAP,
  linkCurve,
  links,
  type NodeId,
  type Point,
  radiusOf,
  tools,
} from "../src/data/integrations-map.ts"

const setting = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number.`)
  return value
}
// The random streams the search uses; the same seed gives the same layout.
const SEED = setting("SEED", 7)
const RUNS = setting("RUNS", 24)
// Space wanted between two circles; closer tools cost more.
const GAP = setting("GAP", 82)

const STEPS = 60000
const SEGMENTS = 12
// How far Ube may move from the middle of the drawing.
const HUB_REACH = 8
// Names as a phone draws them, in map units (.imap-label in IntegrationsMap.astro).
const NAME_SIZE = 16
const NAME_HEIGHT = NAME_SIZE * 1.1
// A wave must land and its ring fade within the 5 s cycle (waveAlong in
// IntegrationsMap.astro): (5 s - 1.4 s) x 150 units a second is 540, less a margin.
const MAX_LINK = 520
// What a failure, a crossing, and each map unit of drift from the start or of
// link length cost.
const FAIL_COST = 5000
const CROSSING_COST = 3000
// A link under its own tool's name: the name's halo hides it, but it reads
// better clear of the name.
const OWN_NAME_COST = 200
const DRIFT_COST = 0.02
const LENGTH_COST = 1
// Each map unit two tools sit closer than GAP.
const CLOSE_COST = 40
// Tools spread unevenly round Ube (spreadCheck), each squared unit: a gap
// between neighbours off an even share of the way round, and a tool off the
// tools' average distance from Ube.
const UNEVEN_ANGLE_COST = 0.2
const UNEVEN_REACH_COST = 0.05

type Box = { left: number; top: number; right: number; bottom: number }
// What one check found; `cost` is the part that grows by degree.
type Tally = {
  fails: number
  crossings: number
  underOwnName: number
  cost: number
}
const tally = (found: Partial<Tally>): Tally => ({
  fails: 0,
  crossings: 0,
  underOwnName: 0,
  cost: 0,
  ...found,
})
const price = (found: Tally) =>
  found.fails * FAIL_COST +
  found.crossings * CROSSING_COST +
  found.underOwnName * OWN_NAME_COST +
  found.cost

const item = <T>(list: readonly T[], index: number): T => {
  const value = list[index]
  if (value === undefined) throw new Error(`Nothing at index ${index}.`)
  return value
}
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

// Inter's advances, roughly, in em.
const advance = (character: string) => {
  if (" iljI".includes(character)) return 0.27
  if ("ftr".includes(character)) return 0.38
  if ("mwMW&".includes(character)) return 0.86
  if (character >= "A" && character <= "Z") return 0.68
  return 0.57
}

const { width, height } = heroLayout
const middle = { x: width / 2, y: height / 2 }
const ids: NodeId[] = ["ube", ...tools.map((tool) => tool.id)]
const known: Partial<Record<NodeId, Point>> = heroLayout.positions
const newTools = ids.filter((id) => !known[id])
// Where a new tool starts: on a ring around Ube.
const onRing = (index: number) => {
  const angle = (2 * Math.PI * (index + 0.5)) / newTools.length
  return {
    x: middle.x + Math.cos(angle) * width * 0.36,
    y: middle.y + Math.sin(angle) * height * 0.36,
  }
}

// Ube's name sits inside its circle; every tool has one under it.
const nameOf = (id: NodeId) => {
  if (id === "ube") return ""
  const tool = tools.find((candidate) => candidate.id === id)
  if (tool === undefined) throw new Error(`${id} has no name.`)
  return tool.label
}

const nodes = ids.map((id) => {
  const r = radiusOf(id)
  const label = nameOf(id)
  const nameHalf =
    ([...label].reduce((sum, c) => sum + advance(c), 0) * NAME_SIZE) / 2
  // Where its centre may go, with its circle and name inside the drawing.
  const inset = Math.max(r, nameHalf) + 6
  const limit: Box =
    id === "ube"
      ? {
          left: middle.x - HUB_REACH,
          right: middle.x + HUB_REACH,
          top: middle.y - HUB_REACH,
          bottom: middle.y + HUB_REACH,
        }
      : {
          left: inset,
          right: width - inset,
          top: r + 8,
          bottom: height - (r + LABEL_GAP + NAME_HEIGHT + 6),
        }
  const startFrom = known[id] ?? onRing(newTools.indexOf(id))
  const start = {
    x: clamp(startFrom.x, limit.left, limit.right),
    y: clamp(startFrom.y, limit.top, limit.bottom),
  }
  return { id, r, nameHalf, limit, start }
})
const positions: Point[] = nodes.map((node) => ({ ...node.start }))

const indexOf = (id: NodeId) => {
  const index = ids.indexOf(id)
  if (index < 0) throw new Error(`${id} is not on the map.`)
  return index
}
const hubIndex = indexOf("ube")
const lines = links.map((link) => ({
  from: indexOf(link.source),
  to: indexOf(link.target),
  twoWay: link.twoWay,
  points: [] as Point[],
  box: { left: 0, top: 0, right: 0, bottom: 0 },
  chord: 0,
}))
type Line = (typeof lines)[number]
const linesAt = ids.map((_, node) =>
  lines.flatMap((line, index) =>
    line.from === node || line.to === node ? [index] : [],
  ),
)
const touches = (line: Line, node: number) =>
  line.from === node || line.to === node

// The link as the hero draws it, sampled into straight segments.
function resample(line: Line) {
  const from = item(nodes, line.from)
  const to = item(nodes, line.to)
  const { start, control, end } = linkCurve(
    item(positions, line.from),
    item(positions, line.to),
    from.r,
    to.r,
    line.twoWay,
  )
  line.points = Array.from({ length: SEGMENTS + 1 }, (_, k) => {
    const t = k / SEGMENTS
    const u = 1 - t
    return {
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
    }
  })
  const xs = line.points.map((point) => point.x)
  const ys = line.points.map((point) => point.y)
  line.box = {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  }
  line.chord = distance(start, end)
}

const overlaps = (a: Box, b: Box, margin = 0) =>
  a.left - margin < b.right &&
  b.left - margin < a.right &&
  a.top - margin < b.bottom &&
  b.top - margin < a.bottom

// Which side of the line a-b the point c falls on.
const side = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)

const segmentsCross = (p1: Point, p2: Point, q1: Point, q2: Point) =>
  side(q1, q2, p1) * side(q1, q2, p2) < 0 &&
  side(p1, p2, q1) * side(p1, p2, q2) < 0

function distanceToSegment(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const along = (point.x - a.x) * dx + (point.y - a.y) * dy
  const t = clamp(along / Math.max(1e-9, dx * dx + dy * dy), 0, 1)
  return distance(point, { x: a.x + t * dx, y: a.y + t * dy })
}

// Whether the segment a-b enters a box, by clipping it to the box's slabs.
function segmentEntersBox(a: Point, b: Point, box: Box) {
  let low = 0
  let high = 1
  const clip = (start: number, delta: number, min: number, max: number) => {
    if (Math.abs(delta) < 1e-9) return start >= min && start <= max
    const t1 = (min - start) / delta
    const t2 = (max - start) / delta
    low = Math.max(low, Math.min(t1, t2))
    high = Math.min(high, Math.max(t1, t2))
    return low <= high
  }
  return (
    clip(a.x, b.x - a.x, box.left, box.right) &&
    clip(a.y, b.y - a.y, box.top, box.bottom)
  )
}

const segments = (line: Line) =>
  line.points.slice(1).map((end, k) => [item(line.points, k), end] as const)

function crosses(a: Line, b: Line) {
  const others = segments(b)
  return segments(a).some(([p1, p2]) =>
    others.some(([q1, q2]) => segmentsCross(p1, p2, q1, q2)),
  )
}

// Two links from the same tool whose middles run within a few units.
function runAlongside(a: Line, b: Line) {
  const middleOf = (line: Line) =>
    line.points.slice(SEGMENTS * 0.25, SEGMENTS * 0.75 + 1)
  const others = middleOf(b)
  return middleOf(a).some((p) => others.some((q) => distance(p, q) < 12))
}

// Links that share a tool meet at its rim, so for them the failure is running
// side by side; links that share none should not cross.
function pairCheck(a: Line, b: Line) {
  if (!overlaps(a.box, b.box, 12)) return tally({})
  const sharesTool = touches(b, a.from) || touches(b, a.to)
  if (sharesTool) return tally({ fails: runAlongside(a, b) ? 1 : 0 })
  return tally({ crossings: crosses(a, b) ? 1 : 0 })
}

function nameBox(node: number, margin: number): Box {
  const { r, nameHalf } = item(nodes, node)
  const { x, y } = item(positions, node)
  return {
    left: x - nameHalf - margin,
    right: x + nameHalf + margin,
    top: y + r + LABEL_GAP - margin,
    bottom: y + r + LABEL_GAP + NAME_HEIGHT + margin,
  }
}

// A link running too close to a tool it does not touch, or through its name,
// fails; one running under its own tool's name only costs more.
function throughCheck(line: Line, node: number) {
  const centre = item(positions, node)
  const clearance = item(nodes, node).r + 12
  const hasName = item(nodes, node).nameHalf > 0
  const name = nameBox(node, 3)
  const reach = hasName
    ? {
        left: Math.min(centre.x - clearance, name.left),
        right: Math.max(centre.x + clearance, name.right),
        top: centre.y - clearance,
        bottom: name.bottom,
      }
    : {
        left: centre.x - clearance,
        right: centre.x + clearance,
        top: centre.y - clearance,
        bottom: centre.y + clearance,
      }
  if (!overlaps(line.box, reach)) return tally({})
  const ownTool = touches(line, node)
  const underName =
    hasName && segments(line).some(([a, b]) => segmentEntersBox(a, b, name))
  if (ownTool) return tally({ underOwnName: underName ? 1 : 0 })
  const tooClose = segments(line).some(
    ([a, b]) => distanceToSegment(centre, a, b) < clearance,
  )
  return tally({ fails: tooClose || underName ? 1 : 0 })
}

const insideDrawing = (box: Box) =>
  box.left >= 2 &&
  box.top >= 2 &&
  box.right <= width - 2 &&
  box.bottom <= height - 2

// A link leaving the drawing or too long for its wave fails; any link costs
// its length.
const lineCheck = (line: Line) =>
  tally({
    fails: (insideDrawing(line.box) ? 0 : 1) + (line.chord > MAX_LINK ? 1 : 0),
    cost: line.chord * LENGTH_COST,
  })

function nameHitsCircle(name: number, circle: number) {
  if (item(nodes, name).nameHalf === 0) return false
  const box = nameBox(name, 4)
  const centre = item(positions, circle)
  const nearest = {
    x: clamp(centre.x, box.left, box.right),
    y: clamp(centre.y, box.top, box.bottom),
  }
  return distance(centre, nearest) < item(nodes, circle).r + 4
}

// Two tools, or their names, touching.
function collide(a: number, b: number) {
  const namesTouch =
    item(nodes, a).nameHalf > 0 &&
    item(nodes, b).nameHalf > 0 &&
    overlaps(nameBox(a, 4), nameBox(b, 4))
  return (
    distance(item(positions, a), item(positions, b)) <
      item(nodes, a).r + item(nodes, b).r + 16 ||
    namesTouch ||
    nameHitsCircle(a, b) ||
    nameHitsCircle(b, a)
  )
}

// Touching tools fail; tools closer than GAP cost more the closer they are.
function toolPairCheck(a: number, b: number) {
  const wanted = item(nodes, a).r + item(nodes, b).r + GAP
  const gap = distance(item(positions, a), item(positions, b))
  return tally({
    fails: collide(a, b) ? 1 : 0,
    cost: Math.max(0, wanted - gap) * CLOSE_COST,
  })
}

const driftCheck = (node: number) =>
  tally({
    cost: distance(item(positions, node), item(nodes, node).start) * DRIFT_COST,
  })

// How unevenly the tools sit round Ube, measured on an ellipse the shape of
// the drawing so the tools can use its height.
function spreadCheck() {
  const hub = item(positions, hubIndex)
  const squash = width / height
  const around = positions.flatMap((point, node) => {
    if (node === hubIndex) return []
    const dx = point.x - hub.x
    const dy = (point.y - hub.y) * squash
    return [{ angle: Math.atan2(dy, dx), reach: Math.hypot(dx, dy) }]
  })
  const averageReach =
    around.reduce((sum, tool) => sum + tool.reach, 0) / around.length
  const share = (2 * Math.PI) / around.length
  const angles = around.map((tool) => tool.angle).sort((a, b) => a - b)
  let angleOff = 0
  for (const [k, angle] of angles.entries()) {
    // The last tool's neighbour is the first, a full turn on.
    const next =
      k === angles.length - 1
        ? item(angles, 0) + 2 * Math.PI
        : item(angles, k + 1)
    angleOff += ((next - angle - share) * averageReach) ** 2
  }
  let reachOff = 0
  for (const tool of around) reachOff += (tool.reach - averageReach) ** 2
  return tally({
    cost: angleOff * UNEVEN_ANGLE_COST + reachOff * UNEVEN_REACH_COST,
  })
}

// Every cost that depends on where one tool sits.
function localCost(node: number) {
  const own = item(linesAt, node)
  let cost = price(driftCheck(node)) + price(spreadCheck())
  for (const index of own) {
    const line = item(lines, index)
    lines.forEach((other, otherIndex) => {
      const counted = own.includes(otherIndex) && otherIndex < index
      if (otherIndex !== index && !counted)
        cost += price(pairCheck(line, other))
    })
    nodes.forEach((_, tool) => {
      if (tool !== node) cost += price(throughCheck(line, tool))
    })
    cost += price(lineCheck(line))
  }
  for (const line of lines) cost += price(throughCheck(line, node))
  nodes.forEach((_, other) => {
    if (other !== node) cost += price(toolPairCheck(node, other))
  })
  return cost
}

// Everything the checks find across the whole layout, summed.
function survey() {
  const found = tally({})
  const add = (more: Tally) => {
    found.fails += more.fails
    found.crossings += more.crossings
    found.underOwnName += more.underOwnName
    found.cost += more.cost
  }
  lines.forEach((line, index) => {
    for (const other of lines.slice(index + 1)) add(pairCheck(line, other))
    nodes.forEach((_, node) => {
      add(throughCheck(line, node))
    })
    add(lineCheck(line))
  })
  add(spreadCheck())
  nodes.forEach((_, a) => {
    add(driftCheck(a))
    for (let b = a + 1; b < nodes.length; b++) add(toolPairCheck(a, b))
  })
  return found
}

function place(points: readonly Point[]) {
  points.forEach((point, node) => {
    positions[node] = { ...point }
  })
  for (const line of lines) resample(line)
}

// A small seeded generator (mulberry32), so every run is repeatable.
function random(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Simulated annealing: move one tool at a time, now and then a jump, and keep
// a worse layout with a chance that shrinks as the search cools.
function anneal(next: () => number) {
  place(nodes.map((node) => node.start))
  let cost = price(survey())
  let best = { cost, positions: positions.map((point) => ({ ...point })) }
  for (let step = 0; step < STEPS; step++) {
    const progress = step / STEPS
    const temperature = 900 * (1 - progress) ** 2 + 1
    const reach = 140 * (1 - progress) + 8
    const node = Math.floor(next() * nodes.length)
    const { limit } = item(nodes, node)
    const old = item(positions, node)
    const jump = next() < 0.1 * (1 - progress)
    const x = jump
      ? limit.left + next() * (limit.right - limit.left)
      : old.x + (next() * 2 - 1) * reach
    const y = jump
      ? limit.top + next() * (limit.bottom - limit.top)
      : old.y + (next() * 2 - 1) * reach
    const before = localCost(node)
    moveTo(node, {
      x: clamp(x, limit.left, limit.right),
      y: clamp(y, limit.top, limit.bottom),
    })
    const delta = localCost(node) - before
    if (delta > 0 && next() >= Math.exp(-delta / temperature)) {
      moveTo(node, old)
      continue
    }
    cost += delta
    if (cost < best.cost) {
      best = { cost, positions: positions.map((point) => ({ ...point })) }
    }
  }
  return best
}

function moveTo(node: number, point: Point) {
  positions[node] = point
  for (const index of item(linesAt, node)) resample(item(lines, index))
}

let kept: ReturnType<typeof anneal> | undefined
for (let run = 0; run < RUNS; run++) {
  const result = anneal(random(SEED + run * 7919))
  place(result.positions)
  const { fails, crossings, underOwnName } = survey()
  console.info(
    `run ${run}: cost ${Math.round(result.cost)}, ${fails} failures, ${crossings} crossings, ${underOwnName} under their own name`,
  )
  if (!kept || result.cost < kept.cost) kept = result
}
if (!kept) throw new Error("RUNS must be at least 1.")
place(kept.positions)
const { fails, crossings, underOwnName } = survey()
console.info(
  `kept: ${fails} failures, ${crossings} crossings, ${underOwnName} under their own name`,
)

if (fails > 0) {
  console.error("The best layout still fails, so it was not written.")
  process.exitCode = 1
} else {
  const tenth = (value: number) => Math.round(value * 10) / 10
  const block = ids
    .map((id, node) => {
      const { x, y } = item(positions, node)
      return `    ${id}: { x: ${tenth(x)}, y: ${tenth(y)} },`
    })
    .join("\n")
  const file = new URL("../src/data/integrations-map.ts", import.meta.url)
  const source = readFileSync(file, "utf8")
  const positionsBlock =
    /(export const heroLayout = \{[\s\S]*?positions: \{\n)[\s\S]*?(\n {2}\},\n\})/
  if (!positionsBlock.test(source)) {
    throw new Error("Could not find heroLayout's positions to rewrite.")
  }
  writeFileSync(file, source.replace(positionsBlock, `$1${block}$2`))
  console.info("Wrote heroLayout.positions in src/data/integrations-map.ts.")
}
