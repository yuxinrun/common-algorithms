<script setup lang="ts">
// 复杂度阶梯：七种"要算多少次"的活法，画在同一张纵轴为"位数"的图上。
// 图上每一个点、右栏每一段时间，都是 script 里用 steps(n) 的公式当场算出来的：
// 没有实测、没有手抄数字、没有随机。SSR 与客户端跑同一段算术，结果逐字节一致。

const N_MAX = 40 // 横轴：问题规模 n = 1 … 40
const N_TABLE = 10 ** 5 // 右栏换算时间时看的规模：n = 10 万
const OPS_PER_SEC = 10 ** 9 // 假设一台机器每秒做 10 亿次运算

const log10 = (v: number) => Math.log10(v)
const log2 = (v: number) => Math.log2(v)
const round = (v: number) => Math.round(v * 100) / 100

// 阶乘太大，double 会溢出成 Infinity，所以按定义式累加"以 10 为底的对数"
const logFactorial = (n: number) => {
  let s = 0
  for (let k = 2; k <= n; k++) s += log10(k)
  return s
}

type Tone = 'calm' | 'pick' | 'cost'

type Curve = {
  id: string
  name: string
  note: string
  tone: Tone
  dash: string
  width: number
  logSteps: (n: number) => number // log10(步数)
}

const CURVES: Curve[] = [
  { id: 'one', name: '1', note: '一口价，跟 n 无关', tone: 'calm', dash: '', width: 1.6, logSteps: () => 0 },
  { id: 'lg', name: 'log₂n', note: '每次砍掉一半', tone: 'calm', dash: '6 4', width: 1.6, logSteps: (n) => (n < 2 ? NaN : log10(log2(n))) },
  { id: 'ln', name: 'n', note: '一格看一眼', tone: 'calm', dash: '2 3', width: 1.6, logSteps: (n) => log10(n) },
  { id: 'nlogn', name: 'n·log₂n', note: '老实办法里最快的那档', tone: 'pick', dash: '', width: 2.6, logSteps: (n) => (n < 2 ? NaN : log10(n * log2(n))) },
  { id: 'sq', name: 'n²', note: '两两都要比一遍', tone: 'cost', dash: '', width: 2.2, logSteps: (n) => log10(n * n) },
  { id: 'p2', name: '2ⁿ', note: '每种组合都试一遍', tone: 'cost', dash: '7 4', width: 2.2, logSteps: (n) => n * log10(2) },
  { id: 'fct', name: 'n!', note: '所有排法挨个看', tone: 'cost', dash: '2 4', width: 2.2, logSteps: (n) => logFactorial(n) }
]

// 天花板故意取 n² 在 n=40 的那一步，让这条线刚好顶到最上边
const TOP_LOG = log10(N_MAX * N_MAX)
const CEIL_STEPS = N_MAX * N_MAX // 1600

const W = 470
const H = 300
const L = 46
const R = 356
const TOP = 30
const BOT = 258

const px = (n: number) => round(L + ((n - 1) / (N_MAX - 1)) * (R - L))
const py = (l: number) => round(TOP + (1 - l / TOP_LOG) * (BOT - TOP))

type Line = {
  id: string
  name: string
  tone: Tone
  width: number
  dash: string | null
  points: string
  labelX: number
  labelY: number
  capX: number // > 0 表示这条线在 capX 处冲出天花板
}

const LINES: Line[] = CURVES.map((c) => {
  const pts: string[] = []
  let lastY = py(c.logSteps(2))
  let capX = 0
  for (let n = 1; n <= N_MAX; n++) {
    const l = c.logSteps(n)
    if (!Number.isFinite(l)) continue // log₂1 = 0，落不到"位数"轴上，跳过
    if (l > TOP_LOG) {
      capX = px(n)
      pts.push(`${capX},${TOP}`)
      break
    }
    lastY = py(l)
    pts.push(`${px(n)},${lastY}`)
  }
  if (capX) pts.push(`${capX},${TOP}`)
  return {
    id: c.id,
    name: c.name,
    tone: c.tone,
    width: c.width,
    dash: c.dash === '' ? null : c.dash,
    points: pts.join(' '),
    labelX: capX ? capX + 6 : R + 6,
    labelY: capX ? TOP + 14 : lastY + 3,
    capX
  }
})

const Y_GRID = [0, 1, 2, 3].map((l) => ({ l, y: py(l), text: l === 0 ? '1' : '10'.padEnd(1 + l, '0') }))
const X_GRID = [1, 10, 20, 30, 40].map((n) => ({ n, x: px(n), text: String(n) }))

// —— 右栏：把同一个公式在 n = 10 万处算一次，再换算成时间 ——
const HOUR = 60 * 60
const DAY = 24 * HOUR
const YEAR_SEC = DAY * 365.25 // 一年按 365.25 天折秒

const LOG60 = log10(60)
const LOG3600 = log10(HOUR)
const LOG86400 = log10(DAY)
const LOGYEAR = log10(YEAR_SEC)

const num = (v: number) => String(v >= 10 ? Math.round(v) : round(v))
const POW = (v: number) => Math.pow(10, v)

// 只吃 log10(秒)：大数不进 double，避免溢出
function humanSeconds(ls: number): string {
  if (ls < -6) return `约 ${num(POW(ls + 9))} 纳秒`
  if (ls < -3) return `约 ${num(POW(ls + 6))} 微秒`
  if (ls < 0) return `约 ${num(POW(ls + 3))} 毫秒`
  if (ls < LOG60) return `约 ${num(POW(ls))} 秒`
  if (ls < LOG3600) return `约 ${num(POW(ls - LOG60))} 分钟`
  if (ls < LOG86400) return `约 ${num(POW(ls - LOG3600))} 小时`
  if (ls < LOGYEAR) return `约 ${num(POW(ls - LOG86400))} 天`
  const years = ls - LOGYEAR
  if (years < 6) return `约 ${num(POW(years))} 年`
  return `10 的 ${Math.floor(years)} 次方年`
}

const TRACK_LO = -log10(OPS_PER_SEC) // 轨道左端 = 1 次运算
const TRACK_SPAN = LOGYEAR - TRACK_LO // 轨道右端 = 1 年

const ROWS = CURVES.map((c) => {
  const logSteps = c.logSteps(N_TABLE)
  const logSec = logSteps - log10(OPS_PER_SEC)
  const over = logSec > LOGYEAR
  const pct = Math.min(100, Math.max(2, round(((logSec - TRACK_LO) / TRACK_SPAN) * 100)))
  return {
    id: c.id,
    name: c.name,
    note: c.note,
    tone: c.tone,
    digits: Math.max(1, Math.floor(logSteps) + 1),
    time: humanSeconds(logSec),
    over,
    pct
  }
})
</script>

<template>
  <div class="ca-complexity-ladder ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Growth Rates · 复杂度阶梯</span>
      <p class="ca-widget-sub">同一件活有七种干法，它们"要算多少次"能差多远？</p>
    </div>

    <div class="ca-complexity-ladder-body">
      <figure class="ca-complexity-ladder-fig">
        <svg
          class="ca-complexity-ladder-svg"
          :viewBox="`0 0 ${W} ${H}`"
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          <g class="ca-complexity-ladder-grid">
            <g v-for="g in Y_GRID" :key="`y-${g.l}`">
              <line :x1="L" :y1="g.y" :x2="R" :y2="g.y" />
              <text class="ca-complexity-ladder-ylab" :x="L - 7" :y="g.y + 3">{{ g.text }}</text>
            </g>
            <g v-for="g in X_GRID" :key="`x-${g.n}`">
              <line class="is-x" :x1="g.x" :y1="TOP" :x2="g.x" :y2="BOT" />
              <text class="ca-complexity-ladder-xlab" :x="g.x" :y="BOT + 15">{{ g.text }}</text>
            </g>
            <line class="is-axis" :x1="L" :y1="BOT" :x2="R" :y2="BOT" />
            <line class="is-axis" :x1="L" :y1="TOP" :x2="L" :y2="BOT" />
            <line class="is-ceiling" :x1="L" :y1="TOP" :x2="R" :y2="TOP" />
            <text class="ca-complexity-ladder-ylab is-ceil" :x="L - 7" :y="TOP + 3">{{ CEIL_STEPS }}</text>
            <text class="ca-complexity-ladder-note" :x="R" :y="TOP - 10">天花板 = {{ CEIL_STEPS }} 次运算</text>
            <text class="ca-complexity-ladder-note" :x="R" :y="BOT + 27">问题规模 n →</text>
          </g>

          <g v-for="l in LINES" :key="l.id" class="ca-complexity-ladder-line" :class="`is-${l.tone}`">
            <polyline :points="l.points" :stroke-width="l.width" :stroke-dasharray="l.dash" />
            <path
              v-if="l.capX"
              class="ca-complexity-ladder-cap"
              :d="`M${l.capX - 4} ${TOP - 8} L${l.capX + 4} ${TOP - 8} L${l.capX} ${TOP - 1} Z`"
            />
            <text class="ca-complexity-ladder-lab" :x="l.labelX" :y="l.labelY">{{ l.name }}</text>
          </g>
        </svg>

        <span class="sr-only">
          七条增长曲线，横轴是规模 n 从 1 到 40，纵轴是运算量的位数（往上挪一格就是乘 10）。
          图顶的天花板定在 {{ CEIL_STEPS }} 次运算，正好是 n² 走到 n=40 的位置，所以 n² 那条线在
          n=40 顶到天花板；2ⁿ 在 n=11 就冲出图外，n 的阶乘在 n=7 就冲出图外，图上的小三角就是出界的位置。
          按公式算，n=40 时 2ⁿ 约是 10 的 12 次方量级，n 的阶乘约是 10 的 48 次方量级。
          右边一栏是 n=10 万时、假设每秒 10 亿次运算各自要多久：常数 1 {{ ROWS[0].time }}，log₂n
          {{ ROWS[1].time }}，n {{ ROWS[2].time }}，n·log₂n {{ ROWS[3].time }}，n 的平方
          {{ ROWS[4].time }}，2 的 n 次方 {{ ROWS[5].time }}，n 的阶乘 {{ ROWS[6].time }}。
          这些数字全部按公式计算，不是实测。
        </span>
      </figure>

      <div class="ca-complexity-ladder-side">
        <p class="ca-complexity-ladder-sidehead">
          n = 10 万时，假设每秒做 10 亿次运算，各要多久
          <span class="ca-complexity-ladder-hint">按公式计算，不是实测</span>
        </p>
        <ul class="ca-complexity-ladder-times">
          <li v-for="r in ROWS" :key="r.id" class="ca-complexity-ladder-trow" :class="{ 'is-over': r.over }">
            <span class="ca-complexity-ladder-dot" :class="`is-${r.tone}`"></span>
            <span class="ca-complexity-ladder-name">{{ r.name }}</span>
            <span class="ca-complexity-ladder-time">{{ r.time }}</span>
            <span class="ca-complexity-ladder-track">
              <span class="ca-complexity-ladder-fill" :class="`is-${r.tone}`" :style="{ width: `${r.pct}%` }"></span>
            </span>
            <span class="ca-complexity-ladder-note2">{{ r.note }} · 约 {{ r.digits }} 位数</span>
          </li>
        </ul>
        <p class="ca-complexity-ladder-tracknote">
          这条轨道的右端是 1 年。n² 的条还在轨道里，2ⁿ 和 n! 的条直接顶穿右端——不是它慢一点，是它压根排不进这条轨道。
        </p>
        <p class="ca-complexity-ladder-assume">
          两件事得说在前面：这里只数"要算多少次"，没算常数、缓存、翻磁盘这些真实开销；而"每秒 10 亿次"是个假设，
          换一台机器、换一个假设，年数就跟着变。变的是那个具体的数，不变的是<b>量级差多少</b>。
        </p>
      </div>
    </div>

    <p class="ca-cap">
      上面这张图的天花板只有 <b>{{ CEIL_STEPS }}</b> 次运算，那是 n² 走到 n=40 的位置——它刚好顶到；而 2ⁿ 在
      <b>n=11</b> 就冲出了图外，n! 更早，<b>n=7</b> 就出去了。同一台假想机器、同样按公式算，把规模换成 10 万：n² 要
      <b>{{ ROWS[4].time }}</b>，2ⁿ 要 <b>{{ ROWS[5].time }}</b>。差距不在"快一点慢一点"，在于<b>有些问题一变大就再也算不动</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-complexity-ladder {
  max-width: 620px;
  margin-inline: auto;
}

.ca-complexity-ladder-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

.ca-complexity-ladder-fig {
  margin: 0;
  min-width: 0;
}

.ca-complexity-ladder-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-complexity-ladder-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-complexity-ladder-grid .is-x {
  stroke-dasharray: 2 4;
}

.ca-complexity-ladder-grid .is-axis {
  stroke: var(--line-strong);
}

.ca-complexity-ladder-grid .is-ceiling {
  stroke: var(--coral);
  stroke-dasharray: 5 4;
  opacity: 0.6;
}

.ca-complexity-ladder-ylab,
.ca-complexity-ladder-xlab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-complexity-ladder-xlab {
  text-anchor: middle;
}

.ca-complexity-ladder-ylab.is-ceil {
  fill: var(--coral);
  opacity: 0.85;
}

.ca-complexity-ladder-note {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: end;
}

.ca-complexity-ladder-line polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ca-complexity-ladder-line.is-calm polyline {
  stroke: var(--blue);
  opacity: 0.85;
}

.ca-complexity-ladder-line.is-pick polyline {
  stroke: var(--accent);
}

.ca-complexity-ladder-line.is-cost polyline {
  stroke: var(--coral);
}

.ca-complexity-ladder-line {
  animation: ca-complexity-ladder-in 1s var(--ease) both;
}

@keyframes ca-complexity-ladder-in {
  from {
    opacity: 0;
  }
}

.ca-complexity-ladder-cap {
  fill: var(--coral);
  opacity: 0.8;
}

.ca-complexity-ladder-lab {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--ink-2);
}

.ca-complexity-ladder-side {
  min-width: 0;
}

.ca-complexity-ladder-sidehead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line-strong);
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.ca-complexity-ladder-times {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-complexity-ladder-trow {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-complexity-ladder-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ca-complexity-ladder-dot.is-calm {
  background: var(--blue);
}

.ca-complexity-ladder-dot.is-pick {
  background: var(--accent);
}

.ca-complexity-ladder-dot.is-cost {
  background: var(--coral);
}

.ca-complexity-ladder-name {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-trow.is-over .ca-complexity-ladder-time {
  color: var(--coral);
}

.ca-complexity-ladder-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-complexity-ladder-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-complexity-ladder-fill.is-calm {
  background: var(--blue);
  opacity: 0.7;
}

.ca-complexity-ladder-fill.is-pick {
  background: var(--accent);
}

.ca-complexity-ladder-fill.is-cost {
  background: var(--coral);
}

.ca-complexity-ladder-note2 {
  grid-column: 1 / -1;
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-tracknote {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-assume {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-complexity-ladder-assume b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 820px) {
  .ca-complexity-ladder-body {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: start;
    gap: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-complexity-ladder-line {
    animation: none;
  }
}
</style>
