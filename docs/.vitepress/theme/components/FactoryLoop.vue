<script setup lang="ts">
// 工厂回路：一只贴在轴承座上的振动传感器，怎么一步步变成检修工单上那句"几天后要停机"。
// 三行图共用一根时间轴：上面是原始波形，中间是把它拆成频率后的谱，下面是把谱峰高度连成的退化曲线。
// 波形与谱都是示意（固定种子生成的形状），曲线的四个点是举例设定的观测值；站内不印"提前 X 天、准确率 Y%"的统一数。

const round1 = (v: number) => Math.round(v * 10) / 10

// —— 固定种子伪随机：只用来给示意波形加一点抖，SSR 与客户端逐字节一致 ——
const MOD = 2147483648 // 2^31
const SEED = 7
let state = SEED
const rnd = () => {
  state = (Math.imul(state, 1103515245) + 12345) >>> 0
  state %= MOD
  return state / MOD
}

// —— 画布 ——
const W = 460
const H = 344
const COL = [16, 166, 316]
const COL_W = 132
const WAVE_BASE = 66
const SPEC_BASE = 150
const CURVE_TOP = 186
const CURVE_BOT = 302
const CL = 44
const CR = 436

// —— 第一行：振动波形（示意）。同一转数下，冲击一次比一次深 ——
const CYC_A = 5 // 每格 5/2 = 2.5 个载波周期
const CYC_B = 13 // 每格 13/2 = 6.5 个谐波周期
const AMP = [5, 8, 12]
const SPIKE = [1, 3, 6]
const wavePts = (ci: number) => {
  const pts: string[] = []
  const x0 = COL[ci]
  for (let i = 0; i <= 44; i++) {
    const u = i / 44
    const carrier = Math.sin((2 * Math.PI * CYC_A * u) / 2) + Math.sin((2 * Math.PI * CYC_B * u) / 2) / 4
    const bump = (SPIKE[ci] / 2) * Math.exp(-Math.pow((u - 1 / 2) * 8, 2)) * (7 / 10 + (3 / 5) * rnd())
    const y = WAVE_BASE - (carrier * AMP[ci]) / 2 - (bump * AMP[ci]) / 5
    pts.push(`${round1(x0 + u * COL_W)},${round1(y)}`)
  }
  return pts.join(' ')
}
const WAVES = [0, 1, 2].map((ci) => ({ ci, points: wavePts(ci), x0: COL[ci] }))

// —— 第二行：把波形拆成频率（FFT 那一类）。底噪是示意，只有一根谱峰在长高 ——
const BINS = 13
const PEAK_BIN = 5
const PEAK_H = [6, 13, 24]
const SPEC_FLOOR = 1
const SPEC_JITTER = 2
const specBars = (ci: number) => {
  const bars: { x: number; top: number }[] = []
  const step = COL_W / BINS
  for (let b = 0; b < BINS; b++) {
    const floor = SPEC_FLOOR + rnd() * SPEC_JITTER
    const h = b === PEAK_BIN ? floor + PEAK_H[ci] : floor
    bars.push({ x: round1(COL[ci] + step * (b + 0.5)), top: round1(SPEC_BASE - 4 - h) })
  }
  return bars
}
const SPECS = [0, 1, 2].map((ci) => ({
  ci,
  bars: specBars(ci),
  x0: COL[ci],
  peak: round1(COL[ci] + (COL_W / BINS) * (PEAK_BIN + 0.5)),
  peakTop: round1(SPEC_BASE - 4 - SPEC_FLOOR - SPEC_JITTER - PEAK_H[ci])
}))

// —— 第三行：把每次巡检读到的峰高连成退化曲线，再往右外推到报警线 ——
// 下面这四个分数是"举例设定"的观测值（无量纲指数），不是任何设备的实测读数。
const DAY_MAX = 30
const SCORE_MAX = 24
const OBS = [
  { d: 0, s: 5 },
  { d: 7, s: 7 },
  { d: 14, s: 10 },
  { d: 21, s: 14 }
]
const K = Math.log(OBS[3].s / OBS[2].s) / (OBS[3].d - OBS[2].d) // 每长一天的对数斜率
const ALARM = 20 // 报警线的高度：这条线是人画的
const CROSS = OBS[3].d + Math.log(ALARM / OBS[3].s) / K // 越线那天
const LEFT_DAYS = round1(CROSS - OBS[3].d) // 离最后一次读数还剩几天
const CROSS_R = round1(CROSS)
const cx = (d: number) => round1(CL + (d / DAY_MAX) * (CR - CL))
const cy = (s: number) => round1(CURVE_BOT - (s / SCORE_MAX) * (CURVE_BOT - CURVE_TOP))
const fitAt = (d: number) => OBS[3].s * Math.exp(K * (d - OBS[3].d))

const FIT_PTS: string[] = []
for (let i = 0; i <= 60; i++) {
  const d = (CROSS * i) / 60
  FIT_PTS.push(`${cx(d)},${cy(fitAt(d))}`)
}
const EXTRAP_PTS = `${cx(OBS[3].d)},${cy(OBS[3].s)} ${cx(CROSS)},${cy(ALARM)}`
const CURVE_GRID = [0, 10, 20, 30].map((d) => ({ d, x: cx(d) }))
const SCORE_GRID = [12, 24].map((s) => ({ s, y: cy(s) }))

// —— 漏检与过检的账（示例算术，出处见事实底稿）——
const LOT = 10000 // 一批 10000 件
const DEFECT = LOT / 100 // 真实缺陷率 1% → 100 件真坏
const GOOD = LOT - DEFECT // 9900 件良品
const FP_RAW = Math.round((GOOD * 5) / 100) // 95% 特异度 → 约 495 件被误判
const FP_ADJ = 475 // 扣掉灵敏度损失后的口径：约 475 件
const FN = DEFECT - Math.round((DEFECT * 99) / 100) // 99% 灵敏度 → 漏掉 1 件
const CMP = [
  { id: 'fp', tone: 'coral', label: '被误判的良品（过检）', value: FP_ADJ, pct: 100 },
  { id: 'fp2', tone: 'blue', label: '同一批按 95% 特异度直算', value: FP_RAW, pct: round1((FP_RAW / FP_ADJ) * 100) },
  { id: 'fn', tone: 'accent', label: '漏掉的缺陷品（漏检）', value: FN, pct: Math.max(2, round1((FN / FP_ADJ) * 100)) }
]

// —— 落地程度：官方研究机构口径与政策目标，两种口径分开摆 ——
const GOAL_MAX = 1000 // 政策目标里的"1000 家行业标杆企业"，只当作下面两根计数条的刻度右端
const STATS = [
  { id: 'pen', label: '制造业重点场景 AI 应用普及率', value: '34.2%', pct: 34.2, src: '国家工业信息安全发展研究中心《制造业数智化转型能力水平（2026）》，截至 2026 年 6 月底；"重点场景"是评估框架里的场景集合，34.2% 不等于"三分之一工厂在用 AI"' },
  { id: 'llm', label: '已普及大模型的规模以上制造企业', value: '10.6%', pct: 10.6, src: '同一份报告：指企业内应用覆盖程度达标，含义须照原文引用，不等于"全厂都在用大模型"' },
  { id: 'up', label: '上一年的同比提升', value: '5.5 个百分点', pct: 5.5, src: '同一份报告；百分点不是百分比，两者不能混着读' },
  { id: 'case', label: '2025 年工信部人工智能应用典型案例', value: '285 项', pct: round1((285 / GOAL_MAX) * 100), src: '示范遴选，不等于该技术已在全行业规模化应用；单个案例的效果数字由申报企业自述' },
  { id: 'goal', label: '政策目标：到 2027 年推广典型场景／选树标杆', value: '500 个／1000 家', pct: round1((500 / GOAL_MAX) * 100), src: '《"人工智能+制造"专项行动实施意见》给的是场景数与企业数目标，不是已经完成的现状' }
]

// —— 企业自报墙：每一条都要带"未经独立评估"，且指标名不许混用 ——
const CLAIMS = [
  { id: 'c1', who: '某汽车零部件企业', text: '百余工序毫秒级识别、准确率超 99.9%，单台检测由 45 秒缩至 3 秒', note: '分母没说清是缺陷类别、图像数还是工位数；45 秒→3 秒是人工目检与设备节拍的对比，与"漏检率下降"不是一回事' },
  { id: 'c2', who: '某线缆企业', text: '0.25 秒完成高精度检测，产品不良率降至 0.76% 以下', note: '不良率口径由企业内部定义，与质检的检出率/误判率不可互换' },
  { id: 'c3', who: '某车企工厂', text: '把 150 余个独立质检小模型整合为通用方案，单工位仅需 50—100 张样本微调，整车缺陷拦截率达 99.99%，覆盖 1500 余项检测场景', note: '"拦截率"与"检出率""准确率""误判率"是不同指标；试点工厂不等于全行业' },
  { id: 'c4', who: '某多模态质检方案', text: '从单个工厂试点起步，已在 90 余条产线落地，累计完成质检超 6000 万次', note: '90 余条与 6000 万次是累计值，不等于当前在运行产线数；跨行业适配由同一利益方陈述' }
]
</script>

<template>
  <div class="ca-factory-loop ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Predictive Loop · 振动怎么变成工单</span>
      <p class="ca-widget-sub">一只贴在轴承座上的传感器，怎么一步步变成检修单上那句"几天后要停机"。</p>
    </div>

    <figure class="ca-factory-loop-fig">
      <svg
        class="ca-factory-loop-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-factory-loop-tag" :x="W - 12" :y="16">波形与谱为示意</text>

        <g class="ca-factory-loop-wave">
          <text class="ca-factory-loop-rowlab" :x="12" :y="30">① 振动波形</text>
          <g v-for="w in WAVES" :key="`w-${w.ci}`">
            <rect class="is-cell" :x="w.x0" :y="38" :width="COL_W" height="56" rx="6" />
            <polyline :points="w.points" />
          </g>
        </g>

        <g class="ca-factory-loop-spec">
          <text class="ca-factory-loop-rowlab" :x="12" :y="112">② 拆成频率（谱）</text>
          <g v-for="sp in SPECS" :key="`s-${sp.ci}`">
            <rect class="is-cell" :x="sp.x0" :y="118" :width="COL_W" height="36" rx="6" />
            <line v-for="(b, bi) in sp.bars" :key="`b-${sp.ci}-${bi}`" class="is-bin" :x1="b.x" :y1="SPEC_BASE - 4" :x2="b.x" :y2="b.top" />
            <line class="is-peak" :x1="sp.peak" :y1="SPEC_BASE - 4" :x2="sp.peak" :y2="sp.peakTop" />
          </g>
          <text class="ca-factory-loop-mini" :x="SPECS[2].peak" :y="106">故障特征峰</text>
        </g>

        <g class="ca-factory-loop-curve">
          <text class="ca-factory-loop-rowlab" :x="12" :y="176">③ 分数曲线与报警线</text>
          <line v-for="g in CURVE_GRID" :key="`cg-${g.d}`" class="is-grid" :x1="g.x" :y1="CURVE_TOP" :x2="g.x" :y2="CURVE_BOT" />
          <line v-for="g in SCORE_GRID" :key="`sg-${g.s}`" class="is-grid" :x1="CL" :y1="g.y" :x2="CR" :y2="g.y" />
          <line class="is-axis" :x1="CL" :y1="CURVE_BOT" :x2="CR" :y2="CURVE_BOT" />
          <line class="is-axis" :x1="CL" :y1="CURVE_TOP" :x2="CL" :y2="CURVE_BOT" />

          <line class="is-alarm" :x1="CL" :y1="cy(ALARM)" :x2="CR" :y2="cy(ALARM)" />
          <text class="ca-factory-loop-alarm" :x="CL + 6" :y="cy(ALARM) - 5">报警线·人画的</text>

          <polyline class="is-fit" :points="FIT_PTS.join(' ')" />
          <polyline class="is-extrapolate" :points="EXTRAP_PTS" />
          <circle v-for="o in OBS" :key="`o-${o.d}`" class="is-obs" :cx="cx(o.d)" :cy="cy(o.s)" r="3.2" />
          <circle class="is-cross" :cx="cx(CROSS)" :cy="cy(ALARM)" r="4.6" />

          <text class="ca-factory-loop-mini" :x="cx(OBS[3].d)" :y="cy(OBS[3].s) + 17">最后一次读数</text>
          <text class="ca-factory-loop-mini is-end" :x="CR" :y="CURVE_BOT + 27">运行天数 →</text>
          <text v-for="g in CURVE_GRID" :key="`gl-${g.d}`" class="ca-factory-loop-tick" :x="g.x" :y="CURVE_BOT + 14">{{ g.d }}</text>
          <text v-for="g in SCORE_GRID" :key="`sl-${g.s}`" class="ca-factory-loop-tick is-left" :x="CL - 6" :y="g.y + 3">
            {{ g.s }}
          </text>
          <text class="ca-factory-loop-tick is-left" :x="CL - 6" :y="CURVE_BOT + 3">0</text>
        </g>
      </svg>

      <span class="sr-only">
        三行共用一条从左到右变糟的时间轴，全部是示意与举例，不是任何设备的实测。
        第一行是加速度计读到的振动波形，同一个转速下冲击一次比一次深。
        第二行把波形拆成频率：底下那一排矮的是正常底噪，唯一长高的那根是滚动轴承损坏时会出现的故障特征峰，
        它的位置和主轴转速有关，所以位置可以算、不用试。
        第三行把每次巡检读到的峰高画成一个点，举例设定的四个点是第 0、7、14、21 天读到 5、7、10、14（无量纲指数）。
        按指数外推，曲线在第 {{ CROSS_R }} 天上穿高度为 20 的报警线，也就是离最后一次读数还剩约 {{ LEFT_DAYS }} 天。
        这条报警线的位置是人定的：定低了误报多，定高了漏报多；真实产线保留人工确认，模型不直接拍板停机。
      </span>
    </figure>

    <div class="ca-factory-loop-chain">
      <p class="ca-factory-loop-sec">
        上面三行背后其实是六道工序：<b>采集</b>（振动／温度／电流的时序信号）→ <b>提特征</b>（时域看 RMS 与峰值、频域看谱峰、
        再做包络解调把轴承特征频率挖出来）→ <b>算异常分数</b>（异常检测或退化模型）→ <b>估剩余可用时间</b> →
        <b>设报警线</b>（这一步是人给的规则，不是模型自己决定的）→ <b>排工单与备件</b>。
        轴承外圈或滚动体损坏时，频谱里会长出与转速相关的那根峰（BPFO／BPFI 一类），所以"哪一环坏了"是从频率位置上读出来的。
      </p>
    </div>

    <div class="ca-factory-loop-cmp">
      <p class="ca-factory-loop-head">
        报警线两侧的账：漏检和过检是两个数，不许混着报
        <span class="ca-factory-loop-hint">示例算术，可自证，不是某产品的真实率</span>
      </p>
      <p v-for="c in CMP" :key="c.id" class="ca-factory-loop-row">
        <span class="ca-factory-loop-rowlab" :class="`is-${c.tone}`">{{ c.label }}</span>
        <span class="ca-factory-loop-track">
          <span class="ca-factory-loop-fill" :class="`is-${c.tone}`" :style="{ width: `${c.pct}%` }"></span>
        </span>
        <span class="ca-factory-loop-rowval">{{ c.value }} 件</span>
      </p>
      <p class="ca-factory-loop-note">
        举例的一批 {{ LOT }} 件里，按真实缺陷率 1% 算有 {{ DEFECT }} 件真坏。把检出灵敏度设成 99%、特异度设成 95%，
        被误判的良品约 {{ FP_ADJ }} 件（直算是 {{ FP_RAW }} 件，扣掉灵敏度损失后是 {{ FP_ADJ }} 件这个口径），
        而漏掉的缺陷品只有 {{ FN }} 件。产线上"宁误杀不漏放"不是胆大，是这本账：安全件的漏检代价和一件良品重检的代价
        不在同一量级。真实率以厂商与现场标定为准，站内不印脱离条件的"检出率""零漏检"这种话。
      </p>
    </div>

    <div class="ca-factory-loop-stat">
      <p class="ca-factory-loop-head">现在到底铺到什么程度：两套口径分开摆，站内不取平均</p>
      <p v-for="s in STATS" :key="s.id" class="ca-factory-loop-row">
        <span class="ca-factory-loop-rowlab is-ink">{{ s.label }}</span>
        <span class="ca-factory-loop-track">
          <span class="ca-factory-loop-fill is-blue" :style="{ width: `${s.pct}%` }"></span>
        </span>
        <span class="ca-factory-loop-rowval">{{ s.value }}</span>
      </p>
      <ul class="ca-factory-loop-srcs">
        <li v-for="s in STATS" :key="`src-${s.id}`">{{ s.src }}</li>
      </ul>
    </div>

    <div class="ca-factory-loop-claims">
      <p class="ca-factory-loop-head">企业自报墙：以下每一条都是企业自报，未经独立评估</p>
      <dl class="ca-factory-loop-claimlist">
        <div v-for="c in CLAIMS" :key="c.id" class="ca-factory-loop-claim">
          <dt>{{ c.who }}</dt>
          <dd>{{ c.text }}</dd>
          <dd class="is-note">{{ c.note }}</dd>
        </div>
      </dl>
      <p class="ca-factory-loop-statnote">
        上面五根条的右端不是同一个刻度：前三根是一百份里的占比，后两根是"数量对着一千这个目标数摆"，
        所以横向长度不可比，只有各自的数值可比。
      </p>
      <p class="ca-factory-loop-myth">
        至于宣传里"能提前好几天预警、准确率极高"这类话——它把<b>流传说法</b>讲成了结论：本轮查不到一手出处，
        也不能换算成"以后不用保养"。真实系统能提前几天，绑死设备、工况和"算坏"的定义，各篇论文的条件互斥，
        所以站内不印统一的"提前 X 天、准确率 Y%"（见 P-32／P-127）。上面那条 {{ LEFT_DAYS }} 天是举例曲线算出来的，换一组观测点就换个数。
      </p>
    </div>

    <p class="ca-cap">
      这条回路里真正被算的只有一件事：把<b>频谱里那根会长高的峰</b>连成曲线，再问它哪天穿过人画的那条线。
      举例的四个读数按指数外推是<b>第 {{ CROSS_R }} 天</b>越线、离最后一次读数还剩约 <b>{{ LEFT_DAYS }} 天</b>；
      而"提前多少天、准确率百分之九十几"那类话是查不到一手的流传说法，站内不印。线定低了误报多、定高了漏报多，
      所以<b>停机这一拍最后
      仍由人来确认</b>——它不是省掉保养，是把保养挪到还没坏的那天。
    </p>
  </div>
</template>

<style scoped>
.ca-factory-loop {
  max-width: 560px;
  margin-inline: auto;
}

.ca-factory-loop-fig {
  margin: 0;
  min-width: 0;
}

.ca-factory-loop-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-factory-loop-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-factory-loop-rowlab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: start;
}

.ca-factory-loop-mini {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-factory-loop-mini.is-end {
  text-anchor: end;
  fill: var(--muted);
}

.ca-factory-loop-tick {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-factory-loop-tick.is-left {
  text-anchor: end;
}

.ca-factory-loop-wave .is-cell,
.ca-factory-loop-spec .is-cell {
  fill: var(--panel-2);
  stroke: var(--line);
  stroke-width: 1;
}

.ca-factory-loop-wave polyline {
  fill: none;
  stroke: var(--blue);
  stroke-width: 1.3;
  stroke-linejoin: round;
  opacity: 0.9;
}

.ca-factory-loop-spec .is-bin {
  stroke: var(--line-strong);
  stroke-width: 3.4;
  opacity: 0.5;
}

.ca-factory-loop-spec .is-peak {
  stroke: var(--accent);
  stroke-width: 3.4;
}

.ca-factory-loop-curve .is-grid {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-factory-loop-curve .is-axis {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-factory-loop-curve .is-alarm {
  stroke: var(--coral);
  stroke-width: 1.4;
  stroke-dasharray: 5 4;
  opacity: 0.85;
}

.ca-factory-loop-alarm {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--coral);
  text-anchor: start;
}

.ca-factory-loop-curve .is-fit {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.2;
  stroke-linecap: round;
}

.ca-factory-loop-curve .is-extrapolate {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.6;
  stroke-dasharray: 3 4;
  opacity: 0.75;
}

.ca-factory-loop-curve .is-obs {
  fill: var(--panel);
  stroke: var(--blue);
  stroke-width: 1.6;
}

.ca-factory-loop-curve .is-cross {
  fill: var(--coral);
}

.ca-factory-loop-wave,
.ca-factory-loop-spec,
.ca-factory-loop-curve {
  animation: ca-factory-loop-in 1s var(--ease) both;
}

.ca-factory-loop-spec {
  animation-delay: 0.12s;
}

.ca-factory-loop-curve {
  animation-delay: 0.24s;
}

@keyframes ca-factory-loop-in {
  from {
    opacity: 0;
  }
}

.ca-factory-loop-chain {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-factory-loop-sec {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-factory-loop-sec b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-factory-loop-cmp,
.ca-factory-loop-stat,
.ca-factory-loop-claims {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
  min-width: 0;
}

.ca-factory-loop-head {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-factory-loop-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-factory-loop-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-factory-loop-rowlab {
  font-size: 11px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-factory-loop-rowlab.is-coral {
  color: var(--coral);
}

.ca-factory-loop-rowlab.is-accent {
  color: var(--accent);
}

.ca-factory-loop-rowlab.is-blue {
  color: var(--blue);
}

.ca-factory-loop-rowlab.is-ink {
  color: var(--ink-2);
}

.ca-factory-loop-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-factory-loop-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-factory-loop-fill.is-coral {
  background: var(--coral);
}

.ca-factory-loop-fill.is-accent {
  background: var(--accent);
}

.ca-factory-loop-fill.is-blue {
  background: var(--blue);
  opacity: 0.75;
}

.ca-factory-loop-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-factory-loop-note {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-factory-loop-srcs {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 14px;
  list-style: disc;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-factory-loop-statnote {
  margin: 2px 0 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-factory-loop-claimlist {
  display: grid;
  gap: 10px;
  margin: 0;
}

.ca-factory-loop-claim {
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-factory-loop-claim dt {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--coral);
}

.ca-factory-loop-claim dd {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-factory-loop-claim dd.is-note {
  margin-top: 3px;
  font-size: 10.5px;
  color: var(--faint);
}

.ca-factory-loop-myth {
  margin: 4px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-factory-loop-myth b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 560px) {
  .ca-factory-loop-row {
    grid-template-columns: minmax(0, 1fr) 92px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-factory-loop-wave,
  .ca-factory-loop-spec,
  .ca-factory-loop-curve {
    animation: none;
  }
}
</style>
