<script setup lang="ts">
// 派单：四个骑手、四家店，一人接一家，怎么配总耗时最短。
// 贪心那一栏是真按"轮流挑自己眼里最便宜的"跑了一遍，最优那一栏是把 24 种排法全枚举一遍取的最小值。
// 两个总数、每一条配对线，都是 script 里算出来的。矩阵里的数字是举例数据，不是任何平台的真实耗时。

const RIDERS = ['A', 'B', 'C', 'D'] as const
const SHOPS = ['1', '2', '3', '4'] as const

// 成本矩阵（分钟）：行是骑手，列是店铺
const COST = [
  [2, 8, 14, 20],
  [3, 17, 15, 21],
  [10, 4, 13, 19],
  [11, 6, 5, 17]
]

const N = RIDERS.length

// 贪心：按 A、B、C、D 的顺序，每人挑"我剩下的里面最快的那家"
const GREEDY: number[] = []
{
  const taken = new Set<number>()
  for (let i = 0; i < N; i++) {
    let best = -1
    let bv = Infinity
    for (let j = 0; j < N; j++) {
      if (taken.has(j)) continue
      if (COST[i][j] < bv) {
        bv = COST[i][j]
        best = j
      }
    }
    taken.add(best)
    GREEDY.push(best)
  }
}

// 全局最优：把 N! 种排法全看一遍（4 个人只有 24 种，这是枚举，不是猜）
const PERMS: number[][] = []
{
  const walk = (rest: number[], cur: number[]) => {
    if (!rest.length) {
      PERMS.push([...cur])
      return
    }
    for (const j of rest) {
      cur.push(j)
      walk(rest.filter((x) => x !== j), cur)
      cur.pop()
    }
  }
  walk(Array.from({ length: N }, (_, j) => j), [])
}

const totalOf = (assign: number[]) => assign.reduce((s, j, i) => s + COST[i][j], 0)
const GREEDY_TOTAL = totalOf(GREEDY)
const BEST = PERMS.reduce((a, p) => (totalOf(p) < totalOf(a) ? p : a), PERMS[0])
const BEST_TOTAL = totalOf(BEST)
const DIFF = GREEDY_TOTAL - BEST_TOTAL
const FACT4 = PERMS.length // 24
const factorial = (k: number) => {
  let s = 1
  for (let i = 2; i <= k; i++) s *= i
  return s
}
const FACT10 = factorial(10) // 3628800
const FACT20_DIGITS = Math.floor(Math.log10(factorial(20))) + 1 // 20 个人的排法是个 19 位数

type Cell = { i: number; j: number; value: number; mark: 'both' | 'greedy' | 'best' | 'none' }
const CELLS: Cell[] = COST.flatMap((row, i) =>
  row.map((value, j) => {
    const g = GREEDY[i] === j
    const b = BEST[i] === j
    return { i, j, value, mark: g && b ? 'both' : g ? 'greedy' : b ? 'best' : 'none' }
  })
)

const ROW_MIN = COST.map((row) => Math.min(...row))

// —— 图形几何：两块配对图并排，全部在 viewBox 内算完 ——
const round = (v: number) => Math.round(v * 10) / 10
const PITCH = 40
const ROW_Y = [50, 90, 130, 170]
const PANEL_W = 190
const GAP = 30
const OX = 8
const W = OX * 2 + PANEL_W * 2 + GAP
const H = 210

type Panel = {
  id: string
  tone: 'greedy' | 'best'
  title: string
  hint: string
  assign: number[]
  total: number
  ox: number
  riderX: number
  shopX: number
  midX: number
}

const PANELS: Panel[] = [
  { id: 'greedy', tone: 'greedy', title: '贪心：挨个挑自己最便宜的', hint: '被否决的做法', assign: GREEDY, total: GREEDY_TOTAL, ox: OX, riderX: OX + 14, shopX: OX + 176, midX: OX + 95 },
  {
    id: 'best',
    tone: 'best',
    title: '最优：四个人一起配',
    hint: '推荐的做法',
    assign: BEST,
    total: BEST_TOTAL,
    ox: OX + PANEL_W + GAP,
    riderX: OX + PANEL_W + GAP + 14,
    shopX: OX + PANEL_W + GAP + 176,
    midX: OX + PANEL_W + GAP + 95
  }
]

const edges = (p: Panel) =>
  p.assign.map((j, i) => ({
    i,
    j,
    value: COST[i][j],
    x1: round(p.riderX + 13),
    y1: ROW_Y[i],
    x2: round(p.shopX - 13),
    y2: ROW_Y[j],
    lx: round(p.midX + (i - 1.5) * 14),
    ly: round((ROW_Y[i] + ROW_Y[j]) / 2 - 6)
  }))

const BAR_MAX = Math.max(GREEDY_TOTAL, BEST_TOTAL)
const BARS = [
  {
    id: 'greedy',
    tone: 'coral',
    label: '贪心的总耗时',
    value: `${GREEDY_TOTAL} 分钟`,
    pct: round((GREEDY_TOTAL / BAR_MAX) * 100)
  },
  {
    id: 'best',
    tone: 'accent',
    label: '最优的总耗时',
    value: `${BEST_TOTAL} 分钟`,
    pct: round((BEST_TOTAL / BAR_MAX) * 100)
  },
  {
    id: 'diff',
    tone: 'ink',
    label: '多花出去的（白等）',
    value: `${DIFF} 分钟`,
    pct: round((DIFF / BAR_MAX) * 100)
  }
] as const
</script>

<template>
  <div class="ca-match-assign ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Greedy vs Optimal · 谁来接这单</span>
      <p class="ca-widget-sub">四个人各挑各的"最快那家"，和四个人一起配，最后差几分钟。</p>
    </div>

    <figure class="ca-match-assign-fig">
      <svg
        class="ca-match-assign-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-match-assign-tag" :x="W - OX" :y="16">举例数据</text>

        <g v-for="p in PANELS" :key="p.id" class="ca-match-assign-panel" :class="`is-${p.tone}`">
          <text class="ca-match-assign-ptitle" :x="p.ox" :y="16">{{ p.title }}</text>
          <text class="ca-match-assign-phead" :x="p.riderX" :y="32">骑手</text>
          <text class="ca-match-assign-phead" :x="p.shopX" :y="32">店铺</text>

          <line
            v-for="e in edges(p)"
            :key="`e-${p.id}-${e.i}`"
            class="ca-match-assign-edge"
            :x1="e.x1"
            :y1="e.y1"
            :x2="e.x2"
            :y2="e.y2"
          />
          <text v-for="e in edges(p)" :key="`t-${p.id}-${e.i}`" class="ca-match-assign-cost" :x="e.lx" :y="e.ly">
            {{ e.value }}
          </text>

          <g v-for="(r, i) in RIDERS" :key="`r-${p.id}-${i}`" class="ca-match-assign-node">
            <circle :cx="p.riderX" :cy="ROW_Y[i]" r="11" />
            <text :x="p.riderX" :y="ROW_Y[i] + 3.6">{{ r }}</text>
          </g>
          <g v-for="(s, j) in SHOPS" :key="`s-${p.id}-${j}`" class="ca-match-assign-node">
            <circle :cx="p.shopX" :cy="ROW_Y[j]" r="11" />
            <text :x="p.shopX" :y="ROW_Y[j] + 3.6">{{ s }}</text>
          </g>

          <text class="ca-match-assign-total" :x="p.ox" :y="198">
            合计 {{ p.total }} 分钟（{{ p.hint }}）
          </text>
        </g>
      </svg>

      <span class="sr-only">
        举例数据，四个骑手、四家店，一人只接一家，表里的数字是从骑手到那家店的分钟数。
        骑手 A 到 1 到 4 号店分别是 {{ COST[0].join('、') }} 分钟；
        骑手 B 是 {{ COST[1].join('、') }} 分钟；骑手 C 是 {{ COST[2].join('、') }} 分钟；
        骑手 D 是 {{ COST[3].join('、') }} 分钟。
        贪心的配法：A 接 {{ GREEDY[0] + 1 }} 号店、B 接 {{ GREEDY[1] + 1 }} 号店、C 接
        {{ GREEDY[2] + 1 }} 号店、D 接 {{ GREEDY[3] + 1 }} 号店，合计 {{ GREEDY_TOTAL }} 分钟。
        把 {{ FACT4 }} 种排法全看一遍的最优配法：A 接 {{ BEST[0] + 1 }} 号、B 接 {{ BEST[1] + 1 }} 号、C 接
        {{ BEST[2] + 1 }} 号、D 接 {{ BEST[3] + 1 }} 号，合计 {{ BEST_TOTAL }} 分钟。
        贪心比最优多花 {{ DIFF }} 分钟。分钟数是举例，两个总数是照这张表按公式算出来的，不是实测。
      </span>
    </figure>

    <div class="ca-match-assign-matrix">
      <p class="ca-match-assign-matrixhead">
        成本矩阵（分钟，举例数据）
        <span class="ca-match-assign-mtag is-greedy">贪心挑的</span>
        <span class="ca-match-assign-mtag is-best">最优配的</span>
      </p>
      <div class="ca-match-assign-grid">
        <span class="ca-match-assign-corner">骑手 \ 店铺</span>
        <span v-for="s in SHOPS" :key="`h-${s}`" class="ca-match-assign-shophead">{{ s }} 号店</span>
        <template v-for="(r, i) in RIDERS" :key="`row-${r}`">
          <span class="ca-match-assign-riderhead">{{ r }} · 最便宜 {{ ROW_MIN[i] }}</span>
          <span
            v-for="j in N"
            :key="`c-${r}-${j}`"
            class="ca-match-assign-mcell"
            :class="`is-${CELLS[i * N + (j - 1)].mark}`"
          >
            {{ CELLS[i * N + (j - 1)].value }}
          </span>
        </template>
      </div>
    </div>

    <div class="ca-match-assign-bars">
      <p v-for="b in BARS" :key="b.id" class="ca-match-assign-row">
        <span class="ca-match-assign-rowlab" :class="`is-${b.tone}`">{{ b.label }}</span>
        <span class="ca-match-assign-track">
          <span class="ca-match-assign-fill" :class="`is-${b.tone}`" :style="{ width: `${b.pct}%` }"></span>
        </span>
        <span class="ca-match-assign-rowval">{{ b.value }}</span>
      </p>
      <p class="ca-match-assign-explode">
        为什么最优那栏敢写"最优"：{{ N }} 个人只有 {{ FACT4 }} 种排法，上面那个数是把 {{ FACT4 }} 种全数过一遍得到的。
        人数到 10 就是 {{ FACT10 }} 种，到 20 就变成 {{ FACT20_DIGITS }} 位数——硬数这条路很快就走不通了。
        这时候才轮到匈牙利算法上场：它不挨个看，靠一张表一步步把配法改好，改到没人再能占便宜为止。
      </p>
    </div>

    <p class="ca-cap">
      同一张举例表，贪心挨个挑最便宜的，合计 <b>{{ GREEDY_TOTAL }}</b> 分钟；把 {{ FACT4 }} 种排法全看一遍的最优配法是
      <b>{{ BEST_TOTAL }}</b> 分钟，差 <b>{{ DIFF }}</b> 分钟。毛病就出在顺序上：<b>先开口的人把自己的最优格占了</b>，
      后面的人只能在剩下的里面挑，哪怕他其实更该接手那一格。贪心快的代价，就是<b>这 {{ DIFF }} 分钟再也找不回来</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-match-assign {
  max-width: 520px;
  margin-inline: auto;
}

.ca-match-assign-fig {
  margin: 0;
}

.ca-match-assign-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-match-assign-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-match-assign-ptitle {
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.ca-match-assign-panel.is-greedy .ca-match-assign-ptitle {
  fill: var(--coral);
}

.ca-match-assign-panel.is-best .ca-match-assign-ptitle {
  fill: var(--accent);
}

.ca-match-assign-phead {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-match-assign-edge {
  stroke-width: 2.6;
  stroke-linecap: round;
}

.ca-match-assign-panel.is-greedy .ca-match-assign-edge {
  stroke: var(--coral);
}

.ca-match-assign-panel.is-best .ca-match-assign-edge {
  stroke: var(--accent);
}

.ca-match-assign-cost {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--ink-2);
  text-anchor: middle;
  paint-order: stroke;
  stroke: var(--panel);
  stroke-width: 3;
}

.ca-match-assign-node circle {
  fill: var(--panel-2);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-match-assign-panel.is-greedy .ca-match-assign-node circle {
  stroke: var(--coral);
}

.ca-match-assign-panel.is-best .ca-match-assign-node circle {
  stroke: var(--accent);
}

.ca-match-assign-node text {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-match-assign-total {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--muted);
}

.ca-match-assign-panel {
  animation: ca-match-assign-in 1s var(--ease) both;
}

@keyframes ca-match-assign-in {
  from {
    opacity: 0;
  }
}

.ca-match-assign-matrix {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-match-assign-matrixhead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 10px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-match-assign-mtag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 999px;
}

.ca-match-assign-mtag.is-greedy {
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-match-assign-mtag.is-best {
  color: var(--accent);
  background: var(--accent-soft);
}

.ca-match-assign-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) repeat(4, minmax(0, 1fr));
  gap: 4px;
  min-width: 0;
}

.ca-match-assign-corner,
.ca-match-assign-shophead,
.ca-match-assign-riderhead {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-match-assign-shophead {
  text-align: center;
}

.ca-match-assign-riderhead {
  display: flex;
  align-items: center;
  font-size: 10px;
  color: var(--muted);
}

.ca-match-assign-mcell {
  min-width: 0;
  padding: 6px 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--panel-2);
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: center;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-match-assign-mcell.is-both {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.ca-match-assign-mcell.is-greedy {
  border-color: var(--coral);
  background: var(--coral-soft);
}

.ca-match-assign-mcell.is-best {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.ca-match-assign-bars {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-match-assign-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-match-assign-rowlab {
  font-size: 11.5px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-match-assign-rowlab.is-coral {
  color: var(--coral);
}

.ca-match-assign-rowlab.is-accent {
  color: var(--accent);
}

.ca-match-assign-rowlab.is-ink {
  color: var(--muted);
}

.ca-match-assign-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-match-assign-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-match-assign-fill.is-coral {
  background: var(--coral);
}

.ca-match-assign-fill.is-accent {
  background: var(--accent);
}

.ca-match-assign-fill.is-ink {
  background: var(--muted);
  opacity: 0.55;
}

.ca-match-assign-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-match-assign-explode {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .ca-match-assign-panel {
    animation: none;
  }
}
</style>
