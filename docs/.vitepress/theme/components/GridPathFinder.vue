<script setup lang="ts">
// 同一张 12×8 的方格纸、同一道墙、同一个终点，两种找路办法各"看过多少格"。
// 两边的格子数都不是编的：Dijkstra 与 A* 都在 script 里真跑了一遍（代价全是 1，
// 每次从待办里挑最小的那个，挑选顺序写死，所以每次构建出来的数一模一样）。
// 不用随机数、不用当前时间、不碰浏览器全局对象，服务端与客户端渲染逐字节一致。

const COLS = 12
const ROWS = 8
const CELL = 21

const WALL_COL = 7
const WALL_ROWS = [0, 1, 2, 3, 4, 5] // 一整道墙，只在下面留两个缺口
const START = { c: 0, r: 3 }
const GOAL = { c: 11, r: 3 }

const NEIGHBORS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
] as const

const id = (c: number, r: number) => r * COLS + c
const colOf = (k: number) => k % COLS
const rowOf = (k: number) => Math.floor(k / COLS)
const BLOCKED = new Set(WALL_ROWS.map((r) => id(WALL_COL, r)))

const startId = id(START.c, START.r)
const goalId = id(GOAL.c, GOAL.r)
const TOTAL_FREE = COLS * ROWS - BLOCKED.size

// 启发式：直线还要走几格（曼哈顿距离），不看墙——A* 就是多带了这个方向感
const heuristic = (k: number) => Math.abs(colOf(k) - GOAL.c) + Math.abs(rowOf(k) - GOAL.r)

type RunResult = {
  seen: number[]
  path: number[]
  goalCost: number
}

// mode = 'dijkstra'：只认"从起点到这里已经走了多远"
// mode = 'astar'   ：再加"估计离终点还有多远"，两者一样小时先看离终点近的
function run(mode: 'dijkstra' | 'astar'): RunResult {
  const cost = new Map<number, number>([[startId, 0]])
  const prev = new Map<number, number>()
  const done = new Set<number>()
  const seen: number[] = []

  for (;;) {
    let best = -1
    let bestKey = Infinity
    let bestH = Infinity
    for (let k = 0; k < COLS * ROWS; k++) {
      if (done.has(k) || BLOCKED.has(k)) continue
      const g = cost.get(k)
      if (g === undefined) continue
      const key = mode === 'astar' ? g + heuristic(k) : g
      const h = mode === 'astar' ? heuristic(k) : 0
      if (key < bestKey || (key === bestKey && h < bestH)) {
        bestKey = key
        bestH = h
        best = k
      }
    }
    if (best < 0) break
    done.add(best)
    seen.push(best)
    if (best === goalId) break
    const cur = cost.get(best)!
    for (const [dc, dr] of NEIGHBORS) {
      const c = colOf(best) + dc
      const r = rowOf(best) + dr
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue
      const nk = id(c, r)
      if (BLOCKED.has(nk) || done.has(nk)) continue
      const nd = cur + 1
      if (nd < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, nd)
        prev.set(nk, best)
      }
    }
  }

  const path: number[] = []
  let k: number | undefined = goalId
  while (k !== undefined) {
    path.push(k)
    k = prev.get(k)
  }
  path.reverse()
  return { seen, path, goalCost: path.length - 1 }
}

const DIJK = run('dijkstra')
const ASTAR = run('astar')

const round = (v: number) => Math.round(v * 100) / 100
const SAME_PATH = DIJK.path.length === ASTAR.path.length
const SAVED = DIJK.seen.length - ASTAR.seen.length
const SAVE_PCT = Math.round((SAVED / DIJK.seen.length) * 100)
const PATH_NOTE = SAME_PATH
  ? `两条路都是 ${DIJK.path.length} 格`
  : `路长 ${DIJK.path.length} 格对 ${ASTAR.path.length} 格`

// —— 几何：两块面板上下排，右侧留一栏读数 ——
const OX = 8
const STAT_X = OX + COLS * CELL + 16
const W = 430
const PANELS = [
  {
    mode: 'dijkstra' as const,
    title: 'Dijkstra · 只问"走到这儿多远"',
    sub: '不认方向，从起点往四面铺开',
    seen: DIJK.seen,
    path: DIJK.path,
    len: DIJK.path.length,
    labelY: 14,
    gridY: 22
  },
  {
    mode: 'astar' as const,
    title: 'A* · 多问一句"离终点还有多远"',
    sub: '带方向感，铺得窄得多',
    seen: ASTAR.seen,
    path: ASTAR.path,
    len: ASTAR.path.length,
    labelY: 216,
    gridY: 224
  }
]
const H = 400

// 下面那栏对照条：最长的一条 = 谁看得最多
const BAR_MAX = Math.max(DIJK.seen.length, ASTAR.seen.length)
const BARS = [
  {
    id: 'seen-d',
    tone: 'blue',
    label: '参照：Dijkstra 看过',
    value: `${DIJK.seen.length} 格`,
    pct: round((DIJK.seen.length / BAR_MAX) * 100)
  },
  {
    id: 'seen-a',
    tone: 'accent',
    label: '推荐：A* 看过',
    value: `${ASTAR.seen.length} 格`,
    pct: round((ASTAR.seen.length / BAR_MAX) * 100)
  },
  {
    id: 'saved',
    tone: 'coral',
    label: '省下来的是"看过的个数"',
    value: `${SAVED} 格`,
    pct: round((SAVED / BAR_MAX) * 100)
  },
  {
    id: 'len',
    tone: 'ink',
    label: `${PATH_NOTE}：路长一点没省`,
    value: `${DIJK.path.length} 格`,
    pct: 100
  }
]

const px = (c: number) => OX + c * CELL
const pyOf = (r: number, gridY: number) => gridY + r * CELL
const dot = (k: number, gridY: number) =>
  `${round(OX + colOf(k) * CELL + CELL / 2)},${round(gridY + rowOf(k) * CELL + CELL / 2)}`
const polyline = (path: number[], gridY: number) => path.map((k) => dot(k, gridY)).join(' ')
const centerOf = (cell: { c: number; r: number }, gridY: number) => ({
  x: round(OX + cell.c * CELL + CELL / 2),
  y: round(gridY + cell.r * CELL + CELL / 2)
})
const START_XY = PANELS.map((p) => centerOf(START, p.gridY))
const GOAL_XY = PANELS.map((p) => centerOf(GOAL, p.gridY))

const ALL = Array.from({ length: COLS * ROWS }, (_, k) => ({ k, c: colOf(k), r: rowOf(k) }))
const CELLS = ALL.filter((p) => !BLOCKED.has(p.k))
const WALLS = ALL.filter((p) => BLOCKED.has(p.k))
</script>

<template>
  <div class="ca-grid-path-finder ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Dijkstra vs A Star · 看多少个</span>
      <p class="ca-widget-sub">同一张示意网格、同一道墙、同一个终点，两种找路办法各要翻过多少格子。</p>
    </div>

    <figure class="ca-grid-path-finder-fig">
      <svg
        class="ca-grid-path-finder-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <g v-for="(p, pi) in PANELS" :key="p.mode" class="ca-grid-path-finder-panel">
          <text class="ca-grid-path-finder-title" :class="`is-${p.mode}`" :x="OX" :y="p.labelY">{{ p.title }}</text>

          <rect
            v-for="c in CELLS"
            :key="`g-${p.mode}-${c.k}`"
            class="ca-grid-path-finder-cell"
            :x="px(c.c) + 1"
            :y="pyOf(c.r, p.gridY) + 1"
            :width="CELL - 2"
            :height="CELL - 2"
          />

          <rect
            v-for="w in WALLS"
            :key="`w-${p.mode}-${w.k}`"
            class="ca-grid-path-finder-wall"
            :x="px(w.c) + 1"
            :y="pyOf(w.r, p.gridY) + 1"
            :width="CELL - 2"
            :height="CELL - 2"
          />

          <rect
            v-for="s in p.seen"
            :key="`s-${p.mode}-${s}`"
            class="ca-grid-path-finder-seen"
            :x="px(colOf(s)) + 5"
            :y="pyOf(rowOf(s), p.gridY) + 5"
            :width="CELL - 10"
            :height="CELL - 10"
          />

          <polyline class="ca-grid-path-finder-shadow" :points="polyline(p.path, p.gridY)" />
          <polyline class="ca-grid-path-finder-path" :points="polyline(p.path, p.gridY)" />

          <circle class="ca-grid-path-finder-start" :cx="START_XY[pi].x" :cy="START_XY[pi].y" r="6" />
          <circle class="ca-grid-path-finder-goal" :cx="GOAL_XY[pi].x" :cy="GOAL_XY[pi].y" r="7" />

          <text class="ca-grid-path-finder-stat is-seen" :x="STAT_X" :y="p.gridY + 26">看过 {{ p.seen.length }} 格</text>
          <text class="ca-grid-path-finder-stat is-len" :x="STAT_X" :y="p.gridY + 44">路长 {{ p.len }} 格</text>
          <text class="ca-grid-path-finder-stat is-sub" :x="STAT_X" :y="p.gridY + 62">{{ p.sub }}</text>
        </g>
      </svg>

      <span class="sr-only">
        上下两张一样的 12 乘 8 方格纸，右边第 8 列有一道墙，只在最下面两行留了缺口，必须绕。
        上面这张是 Dijkstra：它不知道终点在哪个方向，从起点往四面铺开，走完这条
        {{ DIJK.path.length }} 格的路，一共看过 {{ DIJK.seen.length }} 个格子，这张纸上一共才
        {{ TOTAL_FREE }} 个能走的格子。下面这张是 A*：它每步多问一句"这一格离终点还有多远"，
        同样走出 {{ ASTAR.path.length }} 格，只看过 {{ ASTAR.seen.length }} 个格子。
        两条路都是 {{ DIJK.path.length }} 格，长度上一格没省；省下来的全是"看过的个数"，
        一共少看 {{ SAVED }} 格，约 {{ SAVE_PCT }}%。珊瑚色的方块是看过的格子，
        青色的折线是最后走的那条路，蓝点是起点，黑圈是终点。A* 那句"离终点还有多远"用的是直线格数，
        从不把距离往大里说，加上这张纸上的格子数得清，所以它给出的仍然是最短的一条。
        网格和那道墙是举例的地图，两边看过的格子数是照着这同一张网格真跑一遍算出来的，不是实测统计。
      </span>
    </figure>

    <div class="ca-grid-path-finder-legend">
      <span class="ca-grid-path-finder-swatch is-seen"></span>看过（算过的格子）
      <span class="ca-grid-path-finder-swatch is-path"></span>最后走的那条
      <span class="ca-grid-path-finder-swatch is-wall"></span>墙
      <span class="ca-grid-path-finder-swatch is-start"></span>起点
      <span class="ca-grid-path-finder-swatch is-goal"></span>终点
    </div>

    <div class="ca-grid-path-finder-bars">
      <p v-for="b in BARS" :key="b.id" class="ca-grid-path-finder-row">
        <span class="ca-grid-path-finder-rowlab" :class="`is-${b.tone}`">{{ b.label }}</span>
        <span class="ca-grid-path-finder-track">
          <span class="ca-grid-path-finder-fill" :class="`is-${b.tone}`" :style="{ width: `${b.pct}%` }"></span>
        </span>
        <span class="ca-grid-path-finder-rowval">{{ b.value }}</span>
      </p>
    </div>

    <p class="ca-grid-path-finder-caveat">
      A* 凭什么敢少看：<b>它每步多算一句"这一格离终点直线还差几格"</b>。这个估计从不把距离往大里说（墙只会让它少算），
      加上图上的格子数得清，两个条件凑齐，它找到的才仍然是最短的那条。换成会高估距离的估计，它就只算"通常很快"，
      不再保证给你最短的路。
    </p>

    <p class="ca-cap">
      上面这两条路一样长，都是 <b>{{ DIJK.path.length }}</b> 格——A* 并没有走出更短的路。区别只在代价：不带方向感的
      Dijkstra 看过 <b>{{ DIJK.seen.length }}</b> 个格子，带一句"离终点还有多远"的 A* 只看过
      <b>{{ ASTAR.seen.length }}</b> 个，少 <b>{{ SAVE_PCT }}%</b> 左右。省的是<b>看多少个</b>，不是<b>走哪条</b>；
      这两个数是按同一张网格真跑一遍算出来的，不是实测。
    </p>
  </div>
</template>

<style scoped>
.ca-grid-path-finder {
  max-width: 460px;
  margin-inline: auto;
}

.ca-grid-path-finder-fig {
  margin: 0;
}

.ca-grid-path-finder-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-grid-path-finder-title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.ca-grid-path-finder-title.is-dijkstra {
  fill: var(--blue);
}

.ca-grid-path-finder-title.is-astar {
  fill: var(--accent);
}

.ca-grid-path-finder-cell {
  fill: var(--panel-2);
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-grid-path-finder-wall {
  fill: var(--panel-3);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-grid-path-finder-seen {
  fill: var(--coral);
  opacity: 0.18;
  animation: ca-grid-path-finder-in 1.1s var(--ease) both;
}

@keyframes ca-grid-path-finder-in {
  from {
    opacity: 0;
  }
}

.ca-grid-path-finder-shadow,
.ca-grid-path-finder-path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ca-grid-path-finder-shadow {
  stroke: var(--panel);
  stroke-width: 8;
  opacity: 0.8;
}

.ca-grid-path-finder-path {
  stroke: var(--accent);
  stroke-width: 3;
}

.ca-grid-path-finder-start {
  fill: var(--blue);
}

.ca-grid-path-finder-goal {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
}

.ca-grid-path-finder-stat {
  font-family: var(--font-mono);
  font-size: 10px;
}

.ca-grid-path-finder-stat.is-seen {
  fill: var(--coral);
}

.ca-grid-path-finder-stat.is-len {
  fill: var(--accent);
}

.ca-grid-path-finder-stat.is-sub {
  fill: var(--faint);
  font-size: 9px;
}

.ca-grid-path-finder-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 10px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--muted);
}

.ca-grid-path-finder-swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid var(--line);
}

.ca-grid-path-finder-swatch.is-seen {
  background: var(--coral);
  opacity: 0.35;
}

.ca-grid-path-finder-swatch.is-path {
  background: var(--accent);
  border-color: var(--accent);
}

.ca-grid-path-finder-swatch.is-wall {
  background: var(--panel-3);
  border-color: var(--line-strong);
}

.ca-grid-path-finder-swatch.is-start {
  background: var(--blue);
  border-color: var(--blue);
}

.ca-grid-path-finder-swatch.is-goal {
  background: var(--panel);
  border: 2px solid var(--ink);
}

.ca-grid-path-finder-bars {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-grid-path-finder-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 58px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-grid-path-finder-rowlab {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-grid-path-finder-rowlab.is-coral {
  color: var(--coral);
}

.ca-grid-path-finder-rowlab.is-accent {
  color: var(--accent);
}

.ca-grid-path-finder-rowlab.is-blue {
  color: var(--blue);
}

.ca-grid-path-finder-rowlab.is-ink {
  color: var(--muted);
}

.ca-grid-path-finder-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-grid-path-finder-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ca-grid-path-finder-grow 1s var(--ease) both;
}

@keyframes ca-grid-path-finder-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-grid-path-finder-fill.is-coral {
  background: var(--coral);
}

.ca-grid-path-finder-fill.is-accent {
  background: var(--accent);
}

.ca-grid-path-finder-fill.is-blue {
  background: var(--blue);
  opacity: 0.7;
}

.ca-grid-path-finder-fill.is-ink {
  background: var(--muted);
  opacity: 0.55;
}

.ca-grid-path-finder-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-grid-path-finder-caveat {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-grid-path-finder-caveat b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (prefers-reduced-motion: reduce) {
  .ca-grid-path-finder-seen,
  .ca-grid-path-finder-fill {
    animation: none;
  }
}
</style>
