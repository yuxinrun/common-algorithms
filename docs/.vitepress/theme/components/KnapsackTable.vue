<script setup lang="ts">
// 0/1 背包：5 件东西、能装 10 公斤，怎么装最值。
// 表里的每个数字都是 script 里真填出来的（dp[i][c] = max(不要这件, 要这件)），
// 贪心那一栏也真按"性价比从高到低拿"跑了一遍。东西的重量和分数是举例数据。

const CAP = 10

type Item = { id: string; w: number; v: number }
const ITEMS: Item[] = [
  { id: 'A', w: 6, v: 14 },
  { id: 'B', w: 5, v: 11 },
  { id: 'C', w: 5, v: 10 },
  { id: 'D', w: 7, v: 12 },
  { id: 'E', w: 8, v: 13 }
]

const N = ITEMS.length

// —— 动态规划：整张表 (N+1) × (CAP+1) 全填完 ——
const DP: number[][] = Array.from({ length: N + 1 }, () => Array<number>(CAP + 1).fill(0))
for (let i = 1; i <= N; i++) {
  const it = ITEMS[i - 1]
  for (let c = 0; c <= CAP; c++) {
    const skip = DP[i - 1][c]
    const take = c >= it.w ? DP[i - 1][c - it.w] + it.v : -1
    DP[i][c] = Math.max(skip, take)
  }
}
const ANSWER = DP[N][CAP]

// 从最后一格往回走，看最优到底装了哪几件
const BEST_PICKS: string[] = []
{
  let c = CAP
  for (let i = N; i >= 1; i--) {
    if (DP[i][c] !== DP[i - 1][c]) {
      BEST_PICKS.unshift(ITEMS[i - 1].id)
      c -= ITEMS[i - 1].w
    }
  }
}
const BEST_WEIGHT = ITEMS.filter((it) => BEST_PICKS.includes(it.id)).reduce((s, it) => s + it.w, 0)

// —— 贪心：按"每一公斤值多少分"从高到低，装得下就拿 ——
const ORDER = ITEMS.map((it, i) => ({ ...it, i, ratio: it.v / it.w })).sort((a, b) => b.ratio - a.ratio || a.i - b.i)
const GREEDY_PICKS: string[] = []
let left = CAP
let greedyValue = 0
for (const it of ORDER) {
  if (it.w <= left) {
    left -= it.w
    greedyValue += it.v
    GREEDY_PICKS.push(it.id)
  }
}
const GAP = ANSWER - greedyValue
const round = (v: number) => Math.round(v * 100) / 100

// —— 图上只画前 4 行 × 全部 11 列（整张表 6 行，答案在最后一行） ——
const SHOW_ROWS = 4
const ROWS = Array.from({ length: SHOW_ROWS }, (_, i) => ({
  i,
  label: i === 0 ? '一件不带' : `前 ${i} 件`,
  hint: i === 0 ? '' : `可以用到 ${ITEMS.slice(0, i).map((x) => x.id).join('、')}`,
  cells: Array.from({ length: CAP + 1 }, (_, c) => ({
    c,
    value: DP[i][c],
    up: i > 0 && DP[i][c] !== DP[i - 1][c],
    last: i === SHOW_ROWS - 1 && c === CAP
  }))
}))

// —— 几何：全部在 viewBox 内算完 ——
const CW = 29
const CH = 28
const OX = 6
const LBL = 62
const HEAD = 30
const W = OX + LBL + (CAP + 1) * CW + OX
const H = HEAD + SHOW_ROWS * CH + 6
const colX = (c: number) => OX + LBL + c * CW
const rowY = (i: number) => HEAD + i * CH
const VISIBLE_ANSWER = ROWS[SHOW_ROWS - 1].cells[CAP].value

const BAR_MAX = Math.max(ANSWER, greedyValue)
const BARS = [
  {
    id: 'greedy',
    tone: 'coral',
    label: `贪心：拿了 ${GREEDY_PICKS.join(' + ')}，用掉 ${CAP - left} 公斤`,
    value: `${greedyValue} 分`,
    pct: round((greedyValue / BAR_MAX) * 100)
  },
  {
    id: 'dp',
    tone: 'accent',
    label: `填表：拿了 ${BEST_PICKS.join(' + ')}，${BEST_WEIGHT} 公斤刚好装满`,
    value: `${ANSWER} 分`,
    pct: round((ANSWER / BAR_MAX) * 100)
  },
  {
    id: 'gap',
    tone: 'ink',
    label: '贪心少拿的分',
    value: `少 ${GAP} 分`,
    pct: round((GAP / BAR_MAX) * 100)
  }
] as const
</script>

<template>
  <div class="ca-knapsack-table ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Knapsack DP · 一张表代替全部试一遍</span>
      <p class="ca-widget-sub">只能装 10 公斤，5 件东西装不装得下、值不值，为什么"挑性价比最高的先拿"会亏。</p>
    </div>

    <figure class="ca-knapsack-table-fig">
      <svg
        class="ca-knapsack-table-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-knapsack-table-axis" :x="OX" :y="12">举例数据 · 整张表 {{ N + 1 }} 行，这里画前 {{ SHOW_ROWS }} 行</text>
        <text class="ca-knapsack-table-axis" :x="OX" :y="27">容量（公斤）→</text>
        <text
          v-for="c in CAP + 1"
          :key="`h-${c}`"
          class="ca-knapsack-table-head"
          :x="colX(c - 1) + CW / 2"
          :y="27"
        >
          {{ c - 1 }}
        </text>

        <g v-for="r in ROWS" :key="`r-${r.i}`" class="ca-knapsack-table-row">
          <text class="ca-knapsack-table-rowlab" :x="OX" :y="rowY(r.i) + CH / 2 + 3">{{ r.label }}</text>
          <rect
            v-for="cell in r.cells"
            :key="`cell-${r.i}-${cell.c}`"
            class="ca-knapsack-table-cell"
            :class="{ 'is-up': cell.up, 'is-last': cell.last }"
            :x="colX(cell.c) + 1"
            :y="rowY(r.i) + 1"
            :width="CW - 2"
            :height="CH - 2"
          />
          <text
            v-for="cell in r.cells"
            :key="`t-${r.i}-${cell.c}`"
            class="ca-knapsack-table-num"
            :class="{ 'is-up': cell.up, 'is-last': cell.last }"
            :x="colX(cell.c) + CW / 2"
            :y="rowY(r.i) + CH / 2 + 3.5"
          >
            {{ cell.value }}
          </text>
        </g>
      </svg>

      <span class="sr-only">
        0/1 背包的填表过程，只画了前面 {{ SHOW_ROWS }} 行、{{ CAP + 1 }} 列（整张表是 {{ N + 1 }} 行）。
        五件东西举例：A 重 {{ ITEMS[0].w }} 公斤值 {{ ITEMS[0].v }} 分，B 重 {{ ITEMS[1].w }} 公斤值
        {{ ITEMS[1].v }} 分，C 重 {{ ITEMS[2].w }} 公斤值 {{ ITEMS[2].v }} 分，D 重 {{ ITEMS[3].w }} 公斤值
        {{ ITEMS[3].v }} 分，E 重 {{ ITEMS[4].w }} 公斤值 {{ ITEMS[4].v }} 分。
        表里每一格的意思是"只能用前面这几件东西、能装这么多公斤时，最多值几分"。
        画出来的最后一行最后一格是 {{ VISIBLE_ANSWER }} 分，整张 {{ N + 1 }} 行填完，最后一格还是
        {{ ANSWER }} 分：装 {{ BEST_PICKS.join(' 和 ') }}，正好 {{ BEST_WEIGHT }} 公斤。贪心按性价比从先到后拿，只拿得下
        {{ GREEDY_PICKS.join(' 和 ') }}，一共 {{ greedyValue }} 分，少 {{ GAP }} 分，还剩 {{ left }} 公斤空着却也塞不进任何东西。
        这些数举例数据按公式计算，不是实测。
      </span>
    </figure>

    <div class="ca-knapsack-table-items">
      <p class="ca-knapsack-table-listhead">
        5 件东西（重量与分数都是举例）
        <span class="ca-knapsack-table-swatch is-up"></span>这一格比上一行变大了
      </p>
      <ul class="ca-knapsack-table-list">
        <li v-for="(it, i) in ORDER" :key="it.id" class="ca-knapsack-table-lrow">
          <span class="ca-knapsack-table-ridx">{{ i + 1 }}</span>
          <span class="ca-knapsack-table-rname">{{ it.id }}</span>
          <span class="ca-knapsack-table-rval">{{ it.w }} 公斤 · {{ it.v }} 分</span>
          <span class="ca-knapsack-table-rratio">每公斤 {{ round(it.ratio) }} 分</span>
        </li>
      </ul>
      <p class="ca-knapsack-table-howto">
        每格只问两句：<b>这件不要</b>，值多少？<b>这件要</b>，就把重量让给它、去上一行查剩下的还能值多少？
        两句里挑大的写下来。所以填一格只比一次，不用把装法全试一遍。
      </p>
    </div>

    <div class="ca-knapsack-table-bars">
      <p v-for="b in BARS" :key="b.id" class="ca-knapsack-table-row2">
        <span class="ca-knapsack-table-rowlab2" :class="`is-${b.tone}`">{{ b.label }}</span>
        <span class="ca-knapsack-table-track">
          <span class="ca-knapsack-table-fill" :class="`is-${b.tone}`" :style="{ width: `${b.pct}%` }"></span>
        </span>
        <span class="ca-knapsack-table-rowval">{{ b.value }}</span>
      </p>
      <p class="ca-knapsack-table-fullrow">
        上面这张表只画了 {{ SHOW_ROWS }} 行。脚本里 {{ N + 1 }} 行 × {{ CAP + 1 }} 列一共
        {{ (N + 1) * (CAP + 1) }} 格全填完了，最后一行最后一格还是 {{ ANSWER }} 分——加上 D 和 E 也没能更大。
      </p>
      <p class="ca-knapsack-table-limit">
        两句限定：一是"少 {{ GAP }} 分"是<b>这一组例子</b>的算术结果，换一组重量和分数就换一个数，贪心的亏空没有公认的上限；
        二是这张表的格子数等于件数乘容量，东西一多、容量一大，格子就填不动了——现实里的装载问题多半填不起这张表，
        只能要一个"够用就好"的答案。
      </p>
    </div>

    <p class="ca-cap">
      贪心先拿性价比最高的 <b>{{ GREEDY_PICKS.join('、') }}</b>，剩下 <b>{{ left }}</b> 公斤却塞不进第二件，只得
      <b>{{ greedyValue }}</b> 分；把表填完知道最优是 <b>{{ BEST_PICKS.join('、') }}</b>，
      <b>{{ ANSWER }}</b> 分——贪心<b>少 {{ GAP }} 分</b>。重量和分数是举例数据，两边的分都是按公式计算，不是实测。
    </p>
  </div>
</template>

<style scoped>
.ca-knapsack-table {
  max-width: 460px;
  margin-inline: auto;
}

.ca-knapsack-table-fig {
  margin: 0;
}

.ca-knapsack-table-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-knapsack-table-axis {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
  fill: var(--faint);
}

.ca-knapsack-table-head {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-knapsack-table-rowlab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
}

.ca-knapsack-table-cell {
  fill: var(--panel-2);
  stroke: var(--line);
  stroke-width: 1;
}

.ca-knapsack-table-cell.is-up {
  fill: var(--accent-soft);
  stroke: var(--accent);
  stroke-width: 0.8;
}

.ca-knapsack-table-cell.is-last {
  fill: var(--accent);
  stroke: var(--accent);
}

.ca-knapsack-table-num {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-knapsack-table-num.is-up {
  fill: var(--ink-2);
}

.ca-knapsack-table-num.is-last {
  fill: var(--bg);
  font-weight: 700;
  font-size: 11px;
}

.ca-knapsack-table-items {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-knapsack-table-listhead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-knapsack-table-swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid var(--accent);
  background: var(--accent-soft);
}

.ca-knapsack-table-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-knapsack-table-lrow {
  display: grid;
  grid-template-columns: 16px 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ca-knapsack-table-ridx {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--faint);
}

.ca-knapsack-table-rname {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}

.ca-knapsack-table-rval {
  font-size: 11.5px;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-knapsack-table-rratio {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--accent);
  text-align: right;
  min-width: 0;
}

.ca-knapsack-table-howto {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-knapsack-table-howto b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-knapsack-table-bars {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-knapsack-table-row2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 62px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-knapsack-table-rowlab2 {
  font-size: 11.5px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-knapsack-table-rowlab2.is-coral {
  color: var(--coral);
}

.ca-knapsack-table-rowlab2.is-accent {
  color: var(--accent);
}

.ca-knapsack-table-rowlab2.is-ink {
  color: var(--muted);
}

.ca-knapsack-table-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-knapsack-table-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ca-knapsack-table-grow 1s var(--ease) both;
}

@keyframes ca-knapsack-table-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-knapsack-table-fill.is-coral {
  background: var(--coral);
}

.ca-knapsack-table-fill.is-accent {
  background: var(--accent);
}

.ca-knapsack-table-fill.is-ink {
  background: var(--muted);
  opacity: 0.55;
}

.ca-knapsack-table-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-knapsack-table-fullrow {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-knapsack-table-limit {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-knapsack-table-limit b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (prefers-reduced-motion: reduce) {
  .ca-knapsack-table-fill {
    animation: none;
  }
}
</style>
