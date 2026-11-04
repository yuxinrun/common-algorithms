<script setup lang="ts">
// 二分查找 vs 一格一格数：同一排已排好号的格子，找同一个目标。
// 下面的每一次比较都是 script 里真跑了一遍二分得到的，步数不是我手写的。
// 换算到 1024 格、100 万格那两行用的是 log₂ 公式（每砍一半算一次），标了"按公式计算"。

const LOCKERS = [3, 7, 11, 18, 23, 29, 34, 41, 47, 52, 58, 63, 71, 78, 85, 92]
const TARGET = 47

type Probe = {
  step: number
  mid: number
  value: number
  verdict: string
  left: number
}

const PROBES: Probe[] = []
let lo = 0
let hi = LOCKERS.length - 1
let hitIndex = -1

while (lo <= hi) {
  const mid = (lo + hi) >> 1
  const value = LOCKERS[mid]
  let verdict: string
  if (value === TARGET) {
    verdict = '正好是它'
    hitIndex = mid
  } else if (value < TARGET) {
    verdict = `比 ${TARGET} 小，左半边整段废掉`
    lo = mid + 1
  } else {
    verdict = `比 ${TARGET} 大，右半边整段废掉`
    hi = mid - 1
  }
  PROBES.push({ step: PROBES.length + 1, mid, value, verdict, left: hi - lo + 1 })
  if (hitIndex >= 0) break
}

// 每一格在图上是什么状态
const PROBED_AT = new Map<number, number>(PROBES.map((p) => [p.mid, p.step]))
const CELLS = LOCKERS.map((value, i) => ({
  i,
  value,
  cls: i === hitIndex ? 'hit' : PROBED_AT.has(i) ? 'probe' : 'out',
  mark: PROBED_AT.get(i) ?? 0
}))

// 笨办法：从最左边一格开始数，数到命中为止
const LINEAR_STEPS = hitIndex + 1
const LINEAR_WORST = LOCKERS.length

// —— 规模换算：砍到只剩一格要砍几次（log₂ 向上取整）——
const round = (v: number) => Math.round(v * 100) / 100
const tiny = (v: number) => Math.round(v * 10000) / 10000
const SCALES = [LOCKERS.length, 1024, 10 ** 6, 10 ** 9].map((cells) => {
  const cuts = Math.ceil(Math.log2(cells))
  const share = (cuts / cells) * 100
  return {
    cells,
    label: cells === 10 ** 9 ? '10 亿个格子' : cells === 10 ** 6 ? '100 万个格子' : `${cells} 个格子`,
    count: cells === 10 ** 9 ? '10 亿个' : cells === 10 ** 6 ? '100 万个' : `${cells} 个`,
    cuts,
    shareText: share < 0.01 ? '不到 0.01%' : `≈ ${tiny(share)}%`,
    pct: Math.min(100, Math.max(1.2, round((share / 25) * 100)))
  }
})

// —— 图形几何：全部在 viewBox 里算完，窄屏靠等比缩放 ——
const PITCH = 29
const CELL = 26
const OX = 6
const ROW_A = 18
const DOT_Y = 54
const ROW_B = 84
const W = round(OX + (LOCKERS.length - 1) * PITCH + CELL + OX)
const H = 116
const cellX = (i: number) => round(OX + i * PITCH)
const cellMid = (i: number) => round(OX + i * PITCH + CELL / 2)
</script>

<template>
  <div class="ca-search-race ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Binary Search · 折半找东西</span>
      <p class="ca-widget-sub">一排已经排好号的格子，要找的那个凭什么只看 4 眼就到位。</p>
    </div>

    <figure class="ca-search-race-fig">
      <svg
        class="ca-search-race-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-search-race-rowlab is-accent" :x="OX" :y="12">
          折半找：比较 {{ PROBES.length }} 次就定位到 {{ TARGET }} 号
        </text>
        <g v-for="c in CELLS" :key="`a-${c.i}`" class="ca-search-race-cell" :class="`is-${c.cls}`">
          <rect :x="cellX(c.i)" :y="ROW_A" :width="CELL" :height="CELL" />
          <text class="ca-search-race-val" :x="cellMid(c.i)" :y="ROW_A + 17">{{ c.value }}</text>
          <template v-if="c.mark">
            <circle class="ca-search-race-dot" :cx="cellMid(c.i)" :cy="DOT_Y" r="7" />
            <text class="ca-search-race-dotnum" :x="cellMid(c.i)" :y="DOT_Y + 2.6">{{ c.mark }}</text>
          </template>
        </g>

        <text class="ca-search-race-rowlab is-blue" :x="OX" :y="78">
          一格一格数：数 {{ LINEAR_STEPS }} 格才碰到它（最坏要数满 {{ LINEAR_WORST }} 格）
        </text>
        <g v-for="c in CELLS" :key="`b-${c.i}`" class="ca-search-race-cell" :class="c.i <= hitIndex ? 'is-walked' : 'is-rest'">
          <rect :x="cellX(c.i)" :y="ROW_B" :width="CELL" :height="CELL" />
          <text class="ca-search-race-val" :x="cellMid(c.i)" :y="ROW_B + 17">{{ c.i <= hitIndex ? c.i + 1 : '' }}</text>
        </g>
      </svg>

      <span class="sr-only">
        一共 {{ LOCKERS.length }} 个已经排好号的格子，号码从 {{ LOCKERS[0] }} 到
        {{ LOCKERS[LOCKERS.length - 1] }}，要找的是 {{ TARGET }} 号。折半查找的真实过程：
        <template v-for="p in PROBES" :key="p.step">
          第 {{ p.step }} 次看第 {{ p.mid + 1 }} 格，号码是 {{ p.value }}，{{ p.verdict }}，还剩 {{ p.left }} 格；
        </template>
        一共比较 {{ PROBES.length }} 次。同一排格子从左往右一格一格数，要数 {{ LINEAR_STEPS }} 格，最坏要数满
        {{ LINEAR_WORST }} 格。规模再往上：{{ SCALES[1].label }}砍 {{ SCALES[1].cuts }} 次半就只剩一格，
        {{ SCALES[2].label }}砍 {{ SCALES[2].cuts }} 次，{{ SCALES[3].label }}砍 {{ SCALES[3].cuts }} 次。这些次数按 log₂ 公式计算，不是实测。
      </span>
    </figure>

    <div class="ca-search-race-legend">
      <span class="ca-search-race-swatch is-hit"></span>找到的那格
      <span class="ca-search-race-swatch is-probe"></span>真正翻开看过的
      <span class="ca-search-race-swatch is-out"></span>整段被排除的
      <span class="ca-search-race-swatch is-walked"></span>笨办法走过的
    </div>

    <div class="ca-search-race-cols">
      <div class="ca-search-race-block">
        <p class="ca-search-race-blockhead">折半的 {{ PROBES.length }} 次，每次都干什么</p>
        <ol class="ca-search-race-steps">
          <li v-for="p in PROBES" :key="p.step" class="ca-search-race-step">
            <span class="ca-search-race-round">第 {{ p.step }} 次</span>
            <span class="ca-search-race-detail">
              翻开第 <b>{{ p.mid + 1 }}</b> 格（{{ p.value }} 号），{{ p.verdict }}，剩下
              <b>{{ p.left }}</b> 格
            </span>
          </li>
        </ol>
      </div>

      <div class="ca-search-race-block">
        <p class="ca-search-race-blockhead">格子变多，次数涨得慢</p>
        <ul class="ca-search-race-scales">
          <li v-for="s in SCALES" :key="s.cells" class="ca-search-race-srow">
            <span class="ca-search-race-scells">{{ s.label }}</span>
            <span class="ca-search-race-scuts">砍 {{ s.cuts }} 次半</span>
            <span class="ca-search-race-track">
              <span class="ca-search-race-fill" :style="{ width: `${s.pct}%` }"></span>
            </span>
            <span class="ca-search-race-snote">次数 ÷ 格子总数 {{ s.shareText }}</span>
          </li>
        </ul>
        <p class="ca-search-race-formula">
          次数是这么来的：每砍一半记一次，砍到只剩一格为止，也就是 log₂ 往上取整。按公式计算，不是实测。
          两句要说在前面：这算的是"次数账"，不是时间账——真跑一遍还得算上翻柜子、跑路的工夫；
          格子很少的时候，一格一格数常常反而更快，因为它一直在同一块地方翻。
        </p>
      </div>
    </div>

    <p class="ca-cap">
      上面这张图里，<b>{{ LOCKERS.length }}</b> 个格子找 1 个目标，折半真实比较了 <b>{{ PROBES.length }}</b> 次，
      从左往右一格一格数要数 <b>{{ LINEAR_STEPS }}</b> 格。格子换成 <b>{{ SCALES[1].count }}</b>，砍
      <b>{{ SCALES[1].cuts }}</b> 次半就只剩一格；换成 {{ SCALES[2].count }}是 <b>{{ SCALES[2].cuts }}</b> 次，
      {{ SCALES[3].count }}也只要 <b>{{ SCALES[3].cuts }}</b> 次——按 log₂ 公式计算，不是实测。代价是<b>格子必须先排好序</b>，
      没排序的话这 {{ PROBES.length }} 次比较一次都省不下来。
    </p>
  </div>
</template>

<style scoped>
.ca-search-race {
  max-width: 560px;
  margin-inline: auto;
}

.ca-search-race-fig {
  margin: 0;
}

.ca-search-race-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-search-race-rowlab {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.ca-search-race-rowlab.is-accent {
  fill: var(--accent);
}

.ca-search-race-rowlab.is-blue {
  fill: var(--blue);
}

.ca-search-race-cell rect {
  stroke: var(--line);
  stroke-width: 1;
}

.ca-search-race-cell.is-out rect {
  fill: var(--coral-soft);
}

.ca-search-race-cell.is-probe rect {
  fill: var(--panel-2);
  stroke: var(--accent);
  stroke-width: 1.6;
}

.ca-search-race-cell.is-hit rect {
  fill: var(--accent);
  stroke: var(--accent);
}

.ca-search-race-cell.is-walked rect {
  fill: var(--blue-soft);
  stroke: var(--blue);
}

.ca-search-race-cell.is-rest rect {
  fill: var(--panel-2);
}

.ca-search-race-val {
  font-family: var(--font-mono);
  font-size: 9px;
  text-anchor: middle;
  fill: var(--muted);
}

.ca-search-race-cell.is-hit .ca-search-race-val {
  fill: var(--bg);
  font-weight: 700;
}

.ca-search-race-cell.is-walked .ca-search-race-val {
  fill: var(--blue);
}

.ca-search-race-dot {
  fill: var(--accent);
  opacity: 0.16;
}

.ca-search-race-dotnum {
  font-family: var(--font-mono);
  font-size: 8px;
  text-anchor: middle;
  fill: var(--accent);
}

.ca-search-race-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 10px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--muted);
}

.ca-search-race-swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid var(--line);
}

.ca-search-race-swatch.is-hit {
  background: var(--accent);
  border-color: var(--accent);
}

.ca-search-race-swatch.is-probe {
  background: var(--panel-2);
  border-color: var(--accent);
}

.ca-search-race-swatch.is-out {
  background: var(--coral-soft);
}

.ca-search-race-swatch.is-walked {
  background: var(--blue-soft);
  border-color: var(--blue);
}

.ca-search-race-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-search-race-block {
  min-width: 0;
}

.ca-search-race-blockhead {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-search-race-steps {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0 0 0 18px;
  list-style: none;
  counter-reset: race;
}

.ca-search-race-step {
  position: relative;
  counter-increment: race;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-search-race-step::before {
  content: counter(race);
  position: absolute;
  left: -18px;
  top: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 14px;
  text-align: center;
}

.ca-search-race-round {
  display: block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.ca-search-race-detail b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-search-race-scales {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-search-race-srow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-search-race-scells {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-search-race-scuts {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  text-align: right;
  min-width: 0;
}

.ca-search-race-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-search-race-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  animation: ca-search-race-grow 1.1s var(--ease) both;
}

@keyframes ca-search-race-grow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
}

.ca-search-race-snote {
  grid-column: 1 / -1;
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-search-race-formula {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (min-width: 760px) {
  .ca-search-race-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-search-race-fill {
    animation: none;
  }
}
</style>
