<script setup lang="ts">
// 家里的两个算法：扫地机的"不漏"其实是一道几何题，恒温器的"冲顶"其实是一段热惯性。
// 左边那张覆盖图按"带宽 = 一个清扫宽度、相邻带步进正好一个宽度"画；右边的温度曲线
// 是把一个带滞后的一阶温控模型当场迭代出来的（示意：形状对，刻度和分钟数都不对）。

const round1 = (v: number) => Math.round(v * 10) / 10

const W = 460
const H = 252

// —— 左：弓字形覆盖 ——
const ROOM_L = 22
const ROOM_R = 202
const SWEEP = 18 // 一个清扫宽度（图上的单位就是"带宽"）
const BAND_TOP = 54
// 相邻带的步进：前几条正好一个带宽（相切、不重叠、不留缝），后几条被误差拉开。
// 下面三个倍数是画图用的举例设定（不是任何机型的实测漂移率），只为把"缝"画出来。
const DRIFT_A = 1.05
const DRIFT_B = 1.15
const DRIFT_C = 1.3
const STEP_MULT = [1, 1, 1, DRIFT_A, DRIFT_B, DRIFT_C]
const BANDS: number[] = [BAND_TOP + SWEEP / 2]
for (let i = 0; i < STEP_MULT.length; i++) {
  BANDS.push(round1(BANDS[i] + SWEEP * STEP_MULT[i]))
}
const ROOM_H = round1(BANDS[BANDS.length - 1] + SWEEP / 2 + 4 - BAND_TOP)
const MOW_PATH: string[] = []
BANDS.forEach((y, i) => {
  const x1 = i % 2 === 0 ? ROOM_L + 6 : ROOM_R - 6
  const x2 = i % 2 === 0 ? ROOM_R - 6 : ROOM_L + 6
  MOW_PATH.push(`${x1},${y}`, `${x2},${y}`)
})
const GAPS: { y: number; h: number }[] = []
for (let i = 1; i < BANDS.length; i++) {
  const top = round1(BANDS[i - 1] + SWEEP / 2)
  const bottom = round1(BANDS[i] - SWEEP / 2)
  if (bottom - top > 1) GAPS.push({ y: top, h: round1(bottom - top) })
}
const LAST_GAP_LABEL = round1(BANDS[BANDS.length - 1] + SWEEP / 2 + 13)

// —— 右：带迟滞的双位控制 + 热惯性 ——
const LO = 24 // 举例阈值：低于它开热
const HI = 26 // 举例阈值：高于它停热
const AMB = 20 // 房间想往这个温度掉
const GAIN = 12 // 加热功率折算成的稳态抬升
const TAU_H = 0.7 // 加热器与传感器之间的滞后
const TAU_T = 1 // 房间温度自己的响应速度
const DT = 0.04 // 迭代步长：只为把这条示意曲线跑出来
const STEPS = 900
const EVERY = 2
const TEMPS: number[] = []
const CYCLES: number[] = []
{
  let T = LO
  let h = 0
  let on = true
  TEMPS.push(T)
  for (let i = 0; i < STEPS; i++) {
    const u = on ? 1 : 0
    h += ((u - h) / TAU_H) * DT
    T += ((GAIN * h - (T - AMB)) / TAU_T) * DT
    if (on && T >= HI) {
      on = false
      CYCLES.push(TEMPS.length)
    } else if (!on && T <= LO) {
      on = true
    }
    if (i % EVERY === 0) TEMPS.push(round1(T))
  }
}
const PL_L = 268
const PL_R = 448
const PL_TOP = 48
const PL_BOT = 200
const PAD = 0.6
const T_MIN = round1(Math.min(...TEMPS) - PAD)
const T_MAX = round1(Math.max(...TEMPS) + PAD)
const SPAN_X = PL_R - PL_L
const SPAN_Y = PL_BOT - PL_TOP
const tx = (i: number) => round1(PL_L + (i / (TEMPS.length - 1)) * SPAN_X)
const ty = (v: number) => round1(PL_BOT - ((v - T_MIN) / (T_MAX - T_MIN)) * SPAN_Y)
const TEMP_PTS = TEMPS.map((v, i) => `${tx(i)},${ty(v)}`).join(' ')

// 整条曲线里最高的那个点：它出现在"已经停热"之后，就是 overshoot
let peakI = 0
TEMPS.forEach((v, i) => {
  if (v > TEMPS[peakI]) peakI = i
})
const PEAK_X = tx(peakI)
const PEAK_Y = ty(TEMPS[peakI])
const FIRST_OFF_X = tx(CYCLES[0])
const BAND_Y_TOP = ty(HI)
const BAND_Y_BOT = ty(LO)

// —— 底部：三条机制对照（不给任何机型参数）——
const LAYERS = [
  { id: 'ctl', name: '控制层', body: 'PID／迟滞／模糊规则', tone: 'accent', note: '恒温、调速、定水位：这一层是反馈控制，不是从数据里学出来的' },
  { id: 'loc', name: '定位层', body: 'SLAM：里程计＋IMU＋滤波或图优化', tone: 'blue', note: '先搞清楚"我在哪儿、走过哪儿"，覆盖路径才有意义' },
  { id: 'rec', name: '识别层（可选）', body: '视觉模型认"这是电线／是宠物"', tone: 'lime', note: '这一层才可能用到机器学习；有没有、用在哪，各机型不同' }
]
</script>

<template>
  <div class="ca-home-robot ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Coverage &amp; Hysteresis · 扫地机与恒温器</span>
      <p class="ca-widget-sub">它凭什么敢说"不漏"？以及为什么到点停了手，房间还在往上升。</p>
    </div>

    <figure class="ca-home-robot-fig">
      <svg
        class="ca-home-robot-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-home-robot-tag" :x="W - 12" :y="16">右图曲线为示意</text>

        <g class="ca-home-robot-cov">
          <text class="ca-home-robot-ptitle" :x="ROOM_L" :y="34">① 弓字形覆盖</text>
          <rect class="is-room" :x="ROOM_L" :y="BAND_TOP" :width="ROOM_R - ROOM_L" :height="ROOM_H" />
          <rect
            v-for="(b, i) in BANDS"
            :key="`band-${i}`"
            class="is-band"
            :x="ROOM_L + 1"
            :y="round1(b - SWEEP / 2)"
            :width="ROOM_R - ROOM_L - 2"
            :height="SWEEP"
          />
          <polyline class="is-path" :points="MOW_PATH.join(' ')" />
          <rect
            v-for="(g, gi) in GAPS"
            :key="`gap-${gi}`"
            class="is-gap"
            :x="ROOM_L + 1"
            :y="g.y"
            :width="ROOM_R - ROOM_L - 2"
            :height="g.h"
          />
          <line class="is-gauge" :x1="ROOM_R + 4" :y1="round1(BANDS[0] - SWEEP / 2)" :x2="ROOM_R + 4" :y2="round1(BANDS[0] + SWEEP / 2)" />
          <text class="ca-home-robot-mini" :x="ROOM_R + 8" :y="BANDS[0] + 3" text-anchor="start">一个扫宽</text>
          <text class="ca-home-robot-mini is-coral" :x="ROOM_R - 2" :y="LAST_GAP_LABEL" text-anchor="end">步进被拉开 → 留缝</text>
        </g>

        <g class="ca-home-robot-th">
          <text class="ca-home-robot-ptitle" :x="PL_L - 22" :y="34">② 迟滞与冲顶</text>
          <line class="is-axis" :x1="PL_L" :y1="PL_BOT" :x2="PL_R" :y2="PL_BOT" />
          <line class="is-axis" :x1="PL_L" :y1="PL_TOP" :x2="PL_L" :y2="PL_BOT" />
          <rect class="is-dead" :x="PL_L" :y="BAND_Y_TOP" :width="SPAN_X" :height="round1(BAND_Y_BOT - BAND_Y_TOP)" />
          <line class="is-hi" :x1="PL_L" :y1="BAND_Y_TOP" :x2="PL_R" :y2="BAND_Y_TOP" />
          <line class="is-lo" :x1="PL_L" :y1="BAND_Y_BOT" :x2="PL_R" :y2="BAND_Y_BOT" />
          <line class="is-off" :x1="FIRST_OFF_X" :y1="PL_TOP" :x2="FIRST_OFF_X" :y2="PL_BOT" />
          <polyline class="is-temp" :points="TEMP_PTS" />
          <circle class="is-peak" :cx="PEAK_X" :cy="PEAK_Y" r="4" />
          <text class="ca-home-robot-mini is-coral" :x="PEAK_X + 6" :y="PEAK_Y - 5" text-anchor="start">冲顶</text>
          <text class="ca-home-robot-mini is-coral" :x="FIRST_OFF_X - 4" :y="PL_TOP + 10" text-anchor="end">已停热</text>
          <text class="ca-home-robot-mini" :x="PL_L + 5" :y="round1(BAND_Y_BOT - 6)" text-anchor="start">带内波动</text>
          <text class="ca-home-robot-mini is-coral" :x="PL_R" :y="round1(BAND_Y_TOP - 4)" text-anchor="end">停热 {{ HI }}℃</text>
          <text class="ca-home-robot-mini" :x="PL_R" :y="round1(BAND_Y_BOT + 10)" text-anchor="end">开热 {{ LO }}℃</text>
          <text class="ca-home-robot-mini" :x="PL_R" :y="PL_BOT + 14" text-anchor="end">时间 →</text>
        </g>
      </svg>

      <span class="sr-only">
        左边这张图：扫地机把房间切成一条条等间距的平行带，带的宽度等于吸口或滚刷的一个清扫宽度，
        转弯时横向正好步进一个宽度，于是相邻两条边相切——既不重叠，也不留缝。这是理想几何前提下的结论：
        不打滑、读数不漂。图上前面四条是正好一个宽度，后面三条的步进被里程计误差逐步拉开到 1.05、1.15、1.3 倍带宽
        （这三个倍数是画图用的举例设定，不是任何机型的实测漂移率），
        带与带之间就露出没扫到的缝——所以漏扫来自航迹推算的误差累积，而不是"它没规划"；
        真实机器靠 IMU、轮编码器和回充对接来纠偏。顺带辟个谣：主流机型的清扫路径是系统覆盖（回字形、弓字形），
        随机游走只在早期或简单机型上、或者作为兜底出现。
        右边这张图：恒温器不是"到 26 度就开关"，而是设两条线——低于 24 度开热、高于 26 度停热（这两个数是举例阈值，
        不是某台机器的设定）。两条线之间的区域是故意留出来的死区，为的是不让压缩机在阈值边上频繁启停；
        代价就是允许温度在这条带里来回波动。曲线在停热之后还继续往上顶了一点，那个尖就是冲顶（overshoot）：
        加热器关掉了，余温还在往房间放，而传感器测到的又总是刚才的事。热惯量越大，这个滞后就越大。
      </span>
    </figure>

    <div class="ca-home-robot-fight">
      <p class="ca-home-robot-head">
        那个尖怎么消掉：两条常见对策
        <span class="ca-home-robot-hint">站内不给任何机型的阈值与秒数</span>
      </p>
      <div class="ca-home-robot-two">
        <div class="ca-home-robot-card">
          <span class="ca-home-robot-eyebrow is-coral">对策一：把带拉宽（迟滞）</span>
          <p>
            两条线离得越远，启停次数越少、机器越省心，但房间温度波动的范围越大——省的是电与压缩机，
            花的是"体感恒定"。带宽是个工程取舍，不是越智能越小。
          </p>
        </div>
        <div class="ca-home-robot-card">
          <span class="ca-home-robot-eyebrow is-accent">对策二：提前关（预测补偿）</span>
          <p>
            既然知道关机后余温还要放一阵，就在还没到上限时提前收手。提前多少取决于这间房的热参数，
            它不是普适常数；变频空调那一档走的是同一条思路：比例项管当前差多少、积分项管长期差多少、
            微分项专门压超调，三个系数各家整定不同。
          </p>
        </div>
      </div>
    </div>

    <div class="ca-home-robot-layers">
      <p class="ca-home-robot-head">一台扫地机里其实是三层，别把它们混成"AI"</p>
      <div v-for="l in LAYERS" :key="l.id" class="ca-home-robot-layer">
        <span class="ca-home-robot-dot" :class="`is-${l.tone}`"></span>
        <span class="ca-home-robot-lname">{{ l.name }}</span>
        <span class="ca-home-robot-lbody">{{ l.body }}</span>
        <span class="ca-home-robot-lnote">{{ l.note }}</span>
      </div>
      <p class="ca-home-robot-both">
        所以"扫地机等于 AI"和"扫地机没脑子"都不准：覆盖路径与避障主要是几何加控制，建图核心是位姿估计
        （常含卡尔曼滤波或粒子滤波、图优化），只有认物体那一步才可能用到视觉模型。定位的两条主流路线也各有一处短板：
        激光雷达（LDS／LiDAR）用三角测距或直接测飞行时间，距离测得准、不吃光照，但对低矮障碍和玻璃容易漏；
        视觉（vSLAM）靠多帧特征匹配估相机位姿，硬件便宜、能带上"这是什么"的语义，却怕黑、怕白墙这种没纹理的面。
        多数产品是两者融合，站内不给任何品牌排高下。
      </p>
    </div>

    <div class="ca-home-robot-fuzzy">
      <p class="ca-home-robot-head">顺手拆一个"看起来会想"</p>
      <p class="ca-home-robot-body">
        洗衣机的"负载感知"是可公开描述的机制：靠电机转速与电流的响应、或水位与重量的关系估衣物量，
        再定水位和洗涤时间。有些机型写着"模糊控制"，它不是玄学也不是机器学习——它是把"偏脏""水偏硬"
        这类人话写成隶属函数与 if-then 规则表：脏就多洗一会儿。规则是人给的，不是从数据里学出来的。
        于是"会自己想的东西"不等于"用了 AI"：家电里大量决策是规则与控制算法。站内也不据这一点去评价
        任何品牌"智商"高低——各家参数与实现都不公开到可以横向比的粒度。
      </p>
    </div>

    <p class="ca-cap">
      两张图各回答一半：扫地机的"不漏"来自一道几何题——<b>相邻两带的间距正好等于一个清扫宽度</b>，
      一旦航迹推算的误差把步进拉开（图上那三档 1.05／1.15／1.3 倍带宽是举例倍数，不是实测），缝就露出来了，所以漏扫是<b>误差累积</b>不是没规划；
      恒温器的"冲顶"来自热惯性——停热之后余温还在放，图上那个尖就是这么来的，而 24℃／26℃
      这两条线之间的波动是<b>故意留的死区</b>（两个数是举例阈值，不是某台机器的设定）。
    </p>
  </div>
</template>

<style scoped>
.ca-home-robot {
  max-width: 560px;
  margin-inline: auto;
}

.ca-home-robot-fig {
  margin: 0;
  min-width: 0;
}

.ca-home-robot-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-home-robot-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-home-robot-ptitle {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--ink-2);
  text-anchor: start;
}

.ca-home-robot-mini {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--muted);
  paint-order: stroke;
  stroke: var(--panel);
  stroke-width: 2.4;
  stroke-linejoin: round;
}

.ca-home-robot-mini.is-coral {
  fill: var(--coral);
}

.ca-home-robot-cov .is-room {
  fill: none;
  stroke: var(--line-strong);
  stroke-width: 1.4;
}

.ca-home-robot-cov .is-band {
  fill: var(--accent);
  opacity: 0.16;
}

.ca-home-robot-cov .is-path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linejoin: round;
}

.ca-home-robot-cov .is-gap {
  fill: var(--coral);
  opacity: 0.34;
}

.ca-home-robot-cov .is-gauge {
  stroke: var(--coral);
  stroke-width: 1.6;
}

.ca-home-robot-th .is-axis {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-home-robot-th .is-dead {
  fill: var(--blue);
  opacity: 0.12;
}

.ca-home-robot-th .is-lo,
.ca-home-robot-th .is-hi {
  stroke-width: 1.3;
  stroke-dasharray: 5 4;
}

.ca-home-robot-th .is-hi {
  stroke: var(--coral);
}

.ca-home-robot-th .is-lo {
  stroke: var(--blue);
}

.ca-home-robot-th .is-temp {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linejoin: round;
}

.ca-home-robot-th .is-off {
  stroke: var(--coral);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  opacity: 0.6;
}

.ca-home-robot-th .is-peak {
  fill: var(--coral);
}

.ca-home-robot-cov,
.ca-home-robot-th {
  animation: ca-home-robot-in 1s var(--ease) both;
}

.ca-home-robot-th {
  animation-delay: 0.14s;
}

@keyframes ca-home-robot-in {
  from {
    opacity: 0;
  }
}

.ca-home-robot-fight,
.ca-home-robot-layers,
.ca-home-robot-fuzzy {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
  min-width: 0;
}

.ca-home-robot-head {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-home-robot-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-home-robot-two {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.ca-home-robot-card {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-home-robot-eyebrow {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.05em;
}

.ca-home-robot-eyebrow.is-coral {
  color: var(--coral);
}

.ca-home-robot-eyebrow.is-accent {
  color: var(--accent);
}

.ca-home-robot-card p {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-home-robot-layer {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  align-items: start;
  gap: 3px 8px;
  padding: 9px 0;
  border-top: 1px solid var(--line);
  min-width: 0;
}

.ca-home-robot-dot {
  width: 8px;
  height: 8px;
  margin-top: 4px;
  border-radius: 50%;
}

.ca-home-robot-dot.is-accent {
  background: var(--accent);
}

.ca-home-robot-dot.is-blue {
  background: var(--blue);
}

.ca-home-robot-dot.is-lime {
  background: var(--lime);
}

.ca-home-robot-lname {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-home-robot-lbody {
  grid-column: 2;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-home-robot-lnote {
  grid-column: 2;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--faint);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-home-robot-both,
.ca-home-robot-body {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (min-width: 620px) {
  .ca-home-robot-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-home-robot-cov,
  .ca-home-robot-th {
    animation: none;
  }
}
</style>
