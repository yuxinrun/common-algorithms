<script setup lang="ts">
// M/M/1 排队：一个服务台，来人和办事都按经典假设，队伍长度只被"利用率 ρ"牵着走。
// Lq = ρ² / (1 − ρ)：分母里那个 (1 − ρ) 一逼近 0，整条曲线就起飞。
// 所有点都由公式在脚本里算出来，不是实测数据。

const RHO_MAX = 1
const Y_MAX = 20 // 纵轴画到 20 个人

const PX0 = 46
const PX1 = 314
const PY0 = 168
const PY1 = 20

const px = (rho: number) => +(PX0 + (rho / RHO_MAX) * (PX1 - PX0)).toFixed(1)
const py = (v: number) => +(PY0 - (v / Y_MAX) * (PY0 - PY1)).toFixed(1)
const lq = (rho: number) => (rho * rho) / (1 - rho)

const CURVE_RHO: number[] = []
{
  for (let i = 1; i <= 9; i++) CURVE_RHO.push(+(i / 10).toFixed(2))
  CURVE_RHO.push(0.95)
}

const CURVE = CURVE_RHO.map((r) => ({ rho: r, v: lq(r) }))
const POLYLINE = CURVE.map((c) => `${px(c.rho)},${py(c.v)}`).join(' ')
const AREA = `M ${px(CURVE[0].rho)} ${PY0} L ${CURVE.map((c) => `${px(c.rho)} ${py(c.v)}`).join(' L ')} L ${px(0.95)} ${PY0} Z`

const GRID_V = [0, 5, 10, 15, 20]
const TICKS = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => ({ x: px(t), label: `${Math.round(t * 100)}%` }))

type Read = { rho: number; cls: string; rhoText: string; note: string }
const READ_DEF: Read[] = [
  { rho: 0.5, cls: 'ok', rhoText: '50%', note: '来得不算勤，队伍基本是空的' },
  { rho: 0.8, cls: 'warn', rhoText: '80%', note: '常见目标：看着还挺顺' },
  { rho: 0.95, cls: 'bad', rhoText: '95%', note: '再快一点，人就堆到门口了' }
]

const READS = READ_DEF.map((d) => {
  const v = lq(d.rho)
  return {
    ...d,
    x: px(d.rho),
    y: py(v),
    people: v.toFixed(1),
    // 假设每分钟来 1 个人，按 Little 定律，平均等待时间 ≈ 队伍人数 / 1
    mins: v.toFixed(1),
    bar: +((v / Y_MAX) * 100).toFixed(1)
  }
})

const AT05 = lq(0.5).toFixed(1)
const AT08 = lq(0.8).toFixed(1)
const AT095 = lq(0.95).toFixed(1)
const RATIO = (lq(0.95) / lq(0.8)).toFixed(1)
const ASYM_X = px(0.99)
const BAD_Y = py(lq(0.95)) - 5
const BAD_X = px(0.95) - 9
</script>

<template>
  <div class="ca-queue-curve ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Queueing Curve · 排队曲线</span>
      <p class="ca-widget-sub">一个窗口，利用率从 10% 涨到 95%，平均要排多少人全由公式算出来。</p>
    </div>

    <figure class="ca-qc-fig">
      <svg class="ca-qc-svg" viewBox="0 0 340 210" role="presentation" aria-hidden="true" focusable="false">
        <line
          v-for="g in GRID_V"
          :key="`h-${g}`"
          class="ca-qc-grid"
          :x1="PX0"
          :y1="py(g)"
          :x2="PX1"
          :y2="py(g)"
        />
        <text v-for="g in GRID_V" :key="`hl-${g}`" class="ca-qc-ylabel" :x="PX0 - 8" :y="py(g) + 3.5">
          {{ g }}
        </text>
        <text
          v-for="t in TICKS"
          :key="`xt-${t.label}`"
          class="ca-qc-xlabel"
          :x="t.x"
          :y="PY0 + 16"
          text-anchor="middle"
        >
          {{ t.label }}
        </text>

        <line class="ca-qc-axis" :x1="PX0" :y1="PY0" :x2="PX1" :y2="PY0" />
        <line class="ca-qc-axis" :x1="PX0" :y1="PY1 - 6" :x2="PX0" :y2="PY0" />
        <line class="ca-qc-asym" :x1="ASYM_X" :y1="PY1 - 6" :x2="ASYM_X" :y2="PY0" />
        <text class="ca-qc-asym-tag" :x="PX1 - 4" :y="PY1 - 10" text-anchor="end">ρ = 1：窗口被占满</text>

        <path class="ca-qc-area" :d="AREA" />
        <polyline class="ca-qc-line" :points="POLYLINE" />

        <line
          v-for="r in READS"
          :key="`drop-${r.rho}`"
          :class="`ca-qc-drop ca-qc-drop--${r.cls}`"
          :x1="r.x"
          :y1="r.y"
          :x2="r.x"
          :y2="PY0"
        />
        <circle
          v-for="r in READS"
          :key="`dot-${r.rho}`"
          :class="`ca-qc-dot ca-qc-dot--${r.cls}`"
          :cx="r.x"
          :cy="r.y"
          r="4"
        />
        <text class="ca-qc-note ca-qc-note--bad" :x="BAD_X" :y="BAD_Y" text-anchor="end">
          {{ AT095 }} 人
        </text>
        <text class="ca-qc-axis-name" :x="PX0 - 8" :y="PY1 - 9" text-anchor="start">平均排队人数</text>
        <text class="ca-qc-axis-name" :x="PX0" :y="204">服务利用率 ρ →</text>
      </svg>

      <div class="ca-qc-reads">
        <div v-for="r in READS" :key="`r-${r.rho}`" :class="`ca-qc-read ca-qc-read--${r.cls}`">
          <span class="ca-qc-rho">ρ {{ r.rhoText }}</span>
          <div class="ca-qc-track">
            <span class="ca-qc-bar" :style="{ width: `${r.bar}%` }"></span>
          </div>
          <span class="ca-qc-val">{{ r.people }} 人</span>
          <p class="ca-qc-sub">{{ r.note }}；假设每分钟来 1 人，约等 {{ r.mins }} 分钟</p>
        </div>
      </div>

      <span class="sr-only">
        按公式 Lq = ρ²/(1−ρ) 算的平均排队人数：利用率 50% 时排 {{ AT05 }} 人，80% 时排 {{ AT08 }} 人，95% 时排
        {{ AT095 }} 人。利用率从 80% 提到 95%，只多了 15 个百分点，队伍却从 {{ AT08 }} 人变成 {{ AT095 }} 人，是
        {{ RATIO }} 倍。曲线在 ρ 接近 1 的时候冲向顶部，因为公式的分母是 1 减 ρ，越接近 0 除得越凶。
        按公式计算，不是实测。
      </span>
    </figure>

    <p class="ca-cap">
      利用率从 <b>80%</b> 提到 <b>95%</b>，队伍不是多 19%，而是从 <b>{{ AT08 }}</b> 人涨到 <b>{{ AT095 }}</b> 人——变成
      <b>{{ RATIO }}</b> 倍。按公式计算（Lq = ρ²/(1−ρ)，一个服务台），不是实测。
    </p>
  </div>
</template>

<style scoped>
.ca-qc-fig {
  margin: 0;
}

.ca-qc-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-qc-grid {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-qc-axis {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-qc-asym {
  stroke: var(--coral);
  stroke-width: 1.2;
  stroke-dasharray: 4 4;
  opacity: 0.6;
}

.ca-qc-asym-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--coral);
}

.ca-qc-ylabel,
.ca-qc-xlabel {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--faint);
}

.ca-qc-ylabel {
  text-anchor: end;
}

.ca-qc-axis-name {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  fill: var(--muted);
}

.ca-qc-area {
  fill: var(--accent-soft);
  stroke: none;
}

.ca-qc-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 420;
  stroke-dashoffset: 420;
  animation: ca-qc-draw 1.6s var(--ease) 0.2s forwards;
}

@keyframes ca-qc-draw {
  to {
    stroke-dashoffset: 0;
  }
}

.ca-qc-dot {
  stroke: var(--panel);
  stroke-width: 1.4;
}

.ca-qc-dot--ok {
  fill: var(--accent);
}

.ca-qc-dot--warn {
  fill: var(--blue);
}

.ca-qc-dot--bad {
  fill: var(--coral);
}

.ca-qc-drop {
  stroke-width: 1.1;
  stroke-dasharray: 3 3;
  opacity: 0.55;
}

.ca-qc-drop--ok {
  stroke: var(--accent);
}

.ca-qc-drop--warn {
  stroke: var(--blue);
}

.ca-qc-drop--bad {
  stroke: var(--coral);
}

.ca-qc-note {
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.ca-qc-note--bad {
  fill: var(--coral);
}

.ca-qc-reads {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-qc-read {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  grid-template-rows: auto auto auto;
  align-items: center;
  gap: 3px 10px;
  min-width: 0;
}

.ca-qc-rho {
  grid-column: 1;
  grid-row: 1;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}

.ca-qc-track {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  height: 9px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-qc-bar {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
}

.ca-qc-read--warn .ca-qc-bar {
  background: var(--blue);
}

.ca-qc-read--bad .ca-qc-bar {
  background: var(--coral);
}

.ca-qc-val {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  color: var(--ink-2);
}

.ca-qc-read--bad .ca-qc-val {
  color: var(--coral);
}

.ca-qc-sub {
  grid-column: 1 / -1;
  grid-row: 3;
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .ca-qc-read {
    grid-template-columns: minmax(0, 1fr) 52px;
  }

  .ca-qc-sub {
    font-size: 10.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-qc-line {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
