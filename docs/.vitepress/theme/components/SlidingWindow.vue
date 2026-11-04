<script setup lang="ts">
// 滑动窗口：一行数，每次只看连续 4 个。
// 笨办法是每挪一格就把 4 个数重新加一遍；聪明办法是"进来的加进来、跑掉的减出去"。
// 所有数字都由脚本按举例数据算出来，不是实测。

const VALS = [3, 7, 2, 8, 5, 1, 9, 4, 6, 2, 7, 5]
const K = 4
const N = VALS.length
const W = N - K + 1 // 一共能滑几个位置

const SUMS: number[] = []
for (let s = 0; s < W; s++) {
  let t = 0
  for (let i = s; i < s + K; i++) t += VALS[i]
  SUMS.push(t)
}

// 定长窗口：暴力 = 每格加 (K−1) 次；滑窗 = 头一格加 (K−1) 次，之后每格一加一减
const BRUTE_FIXED = (K - 1) * W
const SLIDE_FIXED = K - 1 + 2 * (W - 1)

const COUNTS = [
  {
    cls: 'bad',
    label: `暴力：每格从头加 ${K - 1} 次 × ${W} 格`,
    v: BRUTE_FIXED,
    unit: '次加法'
  },
  {
    cls: 'ok',
    label: `滑窗：第一格加 ${K - 1} 次，后面每格一加一减`,
    v: SLIDE_FIXED,
    unit: `次（${K - 1} + ${2 * (W - 1)}）`
  }
]

const group = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// 窗口长度不固定、每段都要看一眼时才是滑窗的主场：
// 暴力逐段从头加，加法次数 = (n³ − n) / 6；滑窗两个指针各往右走一遍，不超过 2n
const SCALE = [12, 120, 1200].map((n) => {
  const brute = (n * n * n - n) / 6
  const slide = 2 * n
  return {
    n,
    brute: group(brute),
    slide: group(slide),
    ratio: group(brute / slide),
    bar: +((slide / brute) * 100).toFixed(3)
  }
})

// —— 三帧画面
const CELL_W = 24
const CELL_H = 26
const GAP = 3
const OX = 6
const VB_W = OX * 2 + N * (CELL_W + GAP) - GAP
const round1 = (v: number) => Math.round(v * 10) / 10

const FRAMES = [0, 4, 8].map((start) => {
  const cells = VALS.map((v, i) => ({
    v,
    i,
    x: round1(OX + i * (CELL_W + GAP)),
    inWin: i >= start && i < start + K,
    entering: start > 0 && i === start + K - 1,
    leaving: start > 0 && i === start - 1
  }))
  const winX = round1(OX + start * (CELL_W + GAP) - 2)
  return {
    start,
    cells,
    winX,
    winW: round1((K - 1) * (CELL_W + GAP) + CELL_W + 4),
    labelX: round1(winX + ((K - 1) * (CELL_W + GAP) + CELL_W) / 2),
    sum: SUMS[start],
    caption:
      start === 0
        ? `停在最左边：${VALS.slice(0, K).join(' + ')} = ${SUMS[0]}，老老实实加 ${K - 1} 次。`
        : `滑到第 ${start + 1} 格：出窗 ${VALS[start - 1]}、进窗 ${VALS[start + K - 1]}，${
            SUMS[start - 1]
          } − ${VALS[start - 1]} + ${VALS[start + K - 1]} = ${SUMS[start]}。`
  }
})
</script>

<template>
  <div class="ca-sliding-window ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Sliding Window · 滑动窗口</span>
      <p class="ca-widget-sub">一行 12 个数，窗口宽 4，从左滑到右：每挪一格到底要按几次加号？</p>
    </div>

    <figure class="ca-sw-fig">
      <div v-for="fr in FRAMES" :key="fr.start" class="ca-sw-frame">
        <svg
          class="ca-sw-svg"
          :viewBox="`0 0 ${VB_W} 56`"
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          <rect class="ca-sw-window" :x="fr.winX" y="6" :width="fr.winW" :height="CELL_H + 8" rx="5" />
          <rect
            v-for="c in fr.cells"
            :key="`c-${fr.start}-${c.i}`"
            :class="['ca-sw-cell', c.inWin ? 'ca-sw-cell--in' : '', c.entering ? 'ca-sw-cell--new' : '', c.leaving ? 'ca-sw-cell--out' : '']"
            :x="c.x"
            :y="10"
            :width="CELL_W"
            :height="CELL_H"
            rx="3"
          />
          <text
            v-for="c in fr.cells"
            :key="`t-${fr.start}-${c.i}`"
            :class="['ca-sw-digit', c.inWin ? 'ca-sw-digit--in' : '']"
            :x="round1(c.x + CELL_W / 2)"
            :y="10 + CELL_H / 2 + 4.5"
            text-anchor="middle"
          >
            {{ c.v }}
          </text>
          <text class="ca-sw-sum" :x="fr.labelX" :y="50" text-anchor="middle">和 = {{ fr.sum }}</text>
        </svg>
        <p class="ca-sw-cap-line">{{ fr.caption }}</p>
      </div>

      <div class="ca-sw-counts">
        <div v-for="r in COUNTS" :key="r.label" :class="`ca-sw-cnt ca-sw-cnt--${r.cls}`">
          <span class="ca-sw-lab">{{ r.label }}</span>
          <span class="ca-sw-track"
            ><span class="ca-sw-bar" :style="{ width: `${(r.v / BRUTE_FIXED) * 100}%` }"></span
          ></span>
          <span class="ca-sw-val">{{ r.v }} {{ r.unit }}</span>
        </div>
      </div>

      <div class="ca-sw-scale">
        <p class="ca-sw-scale-title">换个更狠的问法：窗口长度不固定、每段都要算一遍：</p>
        <div v-for="s in SCALE" :key="s.n" class="ca-sw-row">
          <span class="ca-sw-n">{{ s.n }} 个数</span>
          <span class="ca-sw-ops ca-sw-ops--bad">暴力 <b>{{ s.brute }}</b> 次加法</span>
          <span class="ca-sw-ops ca-sw-ops--ok">滑窗最多 <b>{{ s.slide }}</b> 次</span>
          <span class="ca-sw-ratio">差 <b>{{ s.ratio }}</b> 倍</span>
        </div>
      </div>

      <span class="sr-only">
        举例数据：12 个数，依次是 3、7、2、8、5、1、9、4、6、2、7、5，窗口宽度 4，一共能滑 9 格。
        定长窗口：暴力法每格从头加 3 次，共 27 次加法；滑窗法第一格加 3 次，后面 8 格各一加一减，共 19 次。
        窗口长度不固定、每段都要算时差距才拉开：12 个数，暴力 286 次、滑窗最多 24 次，差 12 倍；
        120 个数，暴力 287 980 次、滑窗最多 240 次，差 1 200 倍；1200 个数，暴力 287 999 800 次、滑窗最多
        2 400 次，差 120 000 倍。按举例数据计算，不是实测。
      </span>
    </figure>

    <p class="ca-cap">
      定长 4 的窗口只把 <b>27</b> 次加法省成 <b>19</b> 次，别急着惊叹；窗口长度不固定、每段都要看时才是它的主场：
      <b>12</b> 个数差 <b>12</b> 倍，<b>120</b> 个数差 <b>1200</b> 倍，<b>1200</b> 个数差 <b>120 000</b> 倍——
      数据每多 10 倍，这个差距自己再翻 <b>100</b> 倍。按举例数据计算，不是实测。
    </p>
  </div>
</template>

<style scoped>
.ca-sw-fig {
  margin: 0;
}

.ca-sw-frame + .ca-sw-frame {
  margin-top: 8px;
}

.ca-sw-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-sw-window {
  fill: var(--accent-soft);
  stroke: var(--accent);
  stroke-width: 1.4;
  stroke-dasharray: 6 4;
  animation: ca-sw-slide 6s linear infinite;
}

@keyframes ca-sw-slide {
  to {
    stroke-dashoffset: -40;
  }
}

.ca-sw-cell {
  fill: var(--panel);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-sw-cell--in {
  fill: var(--panel-3);
  stroke: var(--accent);
}

.ca-sw-cell--new {
  fill: var(--accent-soft);
  stroke-width: 1.8;
}

.ca-sw-cell--out {
  fill: var(--coral-soft);
  stroke: var(--coral);
  stroke-width: 1.8;
}

.ca-sw-digit {
  font-family: var(--font-mono);
  font-size: 13px;
  fill: var(--muted);
}

.ca-sw-digit--in {
  fill: var(--ink);
  font-weight: 700;
}

.ca-sw-sum {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--accent);
  font-weight: 700;
}

.ca-sw-cap-line {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-sw-counts {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sw-cnt {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  align-items: center;
  gap: 3px 10px;
  min-width: 0;
}

.ca-sw-lab {
  grid-column: 1;
  grid-row: 1;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-sw-track {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  height: 9px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-sw-bar {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--coral);
}

.ca-sw-cnt--ok .ca-sw-bar {
  background: var(--accent);
}

.ca-sw-val {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-sw-cnt--bad .ca-sw-val {
  color: var(--coral);
}

.ca-sw-cnt--ok .ca-sw-val {
  color: var(--accent);
}

.ca-sw-scale {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sw-scale-title {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-2);
}

.ca-sw-row {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 68px);
  align-items: baseline;
  gap: 3px 10px;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-sw-row b {
  font-weight: 700;
}

.ca-sw-n {
  color: var(--faint);
}

.ca-sw-ops--bad b {
  color: var(--coral);
}

.ca-sw-ops--ok b {
  color: var(--accent);
}

.ca-sw-ratio {
  text-align: right;
  color: var(--ink-2);
}

@media (max-width: 640px) {
  .ca-sw-cnt {
    grid-template-columns: minmax(0, 1fr) 84px;
  }

  .ca-sw-row {
    grid-template-columns: 54px minmax(0, 1fr) minmax(0, 1fr);
  }

  .ca-sw-ratio {
    grid-column: 1 / -1;
    text-align: left;
  }

  .ca-sw-digit {
    font-size: 15px;
  }

  .ca-sw-cap-line {
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-sw-window {
    animation: none;
  }
}
</style>
