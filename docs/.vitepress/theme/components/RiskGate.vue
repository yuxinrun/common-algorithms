<script setup lang="ts">
// 风控闸门：一笔扫码付款在"进来了"到"要不要拦你"之间经过哪几层，以及企业自报的处置时间窗。
// 时间窗那五个点是同一家机构不同年份、不同系统版本的自报值：分年摆，不相加、不平均。
// 下面那两组百分比是把一个"举例假设"的混淆矩阵代进精确率/召回率的定义式算出来的，不是任何机构的真实率。

const round1 = (v: number) => Math.round(v * 10) / 10
const log10 = (v: number) => Math.log10(v)
const HOUR = 60 * 60

// —— 分层拦截：只讲每一层在看什么，不给阈值、不给步骤、不给"怎么让某一笔更容易通过" ——
const LAYERS = [
  { id: 'ctx', no: '①', name: '设备与账户', sub: '指纹·上下文' },
  { id: 'graph', no: '②', name: '图关系', sub: '账号·收款方' },
  { id: 'rule', no: '③', name: '规则与阈值', sub: '命中才升级' },
  { id: 'score', no: '④', name: '模型评分', sub: '不确定转人工' }
]

// —— 处置时间窗（企业自报口径，见 C-63 / C-64 / C-65）——
type Stage = {
  id: string
  secs: number
  big: string
  tag: string
  tone: 'accent' | 'coral'
  row: number // 0 = 上排，1 = 下排（避免相邻标签打架）
}

const STAGES: Stage[] = [
  { id: 'j22', secs: 0.01, big: '10 毫秒', tag: '风险判定·2022', tone: 'accent', row: 0 },
  { id: 'j19', secs: 0.1, big: '0.1 秒', tag: '预警+检测+管控·2019', tone: 'accent', row: 1 },
  { id: 'confirm', secs: 90, big: '90 秒', tag: '风险确认期', tone: 'coral', row: 0 },
  { id: 'calm', secs: 15 * 60, big: '15 分钟', tag: '交易冷静期', tone: 'coral', row: 1 },
  { id: 'regret', secs: 24 * HOUR, big: '24 小时', tag: '交易反悔期', tone: 'coral', row: 0 }
]

// —— 对数横轴：一格就是 10 倍 ——
const W = 460
const H = 300
const L = 30
const R = 436
const AXIS_Y = 208
const ROW_Y = [146, 176]
const AX_LO = -3
const AX_HI = 6

const ax = (secs: number) => round1(L + ((log10(secs) - AX_LO) / (AX_HI - AX_LO)) * (R - L))

const anchorAt = (x: number) => (x < 62 ? 'start' : x > 400 ? 'end' : 'middle')
const nudgeAt = (x: number) => (x < 62 ? x - 2 : x > 400 ? x + 2 : x)

const POINTS = STAGES.map((s) => {
  const x = ax(s.secs)
  return { ...s, x, yBig: ROW_Y[s.row], anchor: anchorAt(nudgeAt(x)), tx: nudgeAt(x) }
})

const DECADES = [-2, -1, 0, 1, 2, 3, 4, 5].map((e) => ({ e, x: ax(Math.pow(10, e)) }))
const TICKS = [
  { secs: Math.pow(10, -2), text: '0.01 秒' },
  { secs: 1, text: '1 秒' },
  { secs: HOUR, text: '1 小时' },
  { secs: 24 * HOUR, text: '24 小时' }
].map((t) => ({ ...t, x: ax(t.secs), anchor: anchorAt(ax(t.secs)) }))

// —— 精确率 vs 召回率：下面全部是"举例假设"的笔数，不是任何平台的真实率 ——
const TOTAL = 10000 // 举例：一万笔交易
const FRAUD = 20 // 举例：其中真欺诈 20 笔
const CLEAN = TOTAL - FRAUD

type Mode = { id: string; name: string; mood: string; tp: number; fp: number }
const MODES: Mode[] = [
  { id: 'tight', name: '阈值调严', mood: '宁可多拦一个正常人', tp: 12, fp: 30 },
  { id: 'loose', name: '阈值调松', mood: '宁可少拦一步', tp: 18, fp: Math.round((CLEAN * 5) / 100) }
]

const METRICS = MODES.map((m) => {
  const precision = (m.tp / (m.tp + m.fp)) * 100
  const recall = (m.tp / FRAUD) * 100
  return {
    id: m.id,
    name: m.name,
    mood: m.mood,
    caught: m.tp,
    missed: FRAUD - m.tp,
    blocked: m.fp,
    precision: round1(precision),
    recall: round1(recall),
    pctPrecision: Math.max(2, round1(precision)),
    pctRecall: Math.max(2, round1(recall))
  }
})

const PRE = METRICS[0]
const LO = METRICS[1]
</script>

<template>
  <div class="ca-risk-gate ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Risk Gate · 风控那一闸门</span>
      <p class="ca-widget-sub">你按下确认键之后，机器在看什么；它为什么有时拦你一下、有时一秒就放行。</p>
    </div>

    <figure class="ca-risk-gate-fig">
      <svg
        class="ca-risk-gate-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-risk-gate-tag" :x="W - 12" :y="16">时间窗为企业自报口径</text>

        <g class="ca-risk-gate-layers">
          <g v-for="(l, i) in LAYERS" :key="l.id" class="ca-risk-gate-layer">
            <rect :x="12 + i * 111" y="34" width="102" height="46" rx="8" />
            <text class="ca-risk-gate-lname" :x="63 + i * 111" y="54">{{ l.no }} {{ l.name }}</text>
            <text class="ca-risk-gate-lsub" :x="63 + i * 111" y="69">{{ l.sub }}</text>
            <path
              v-if="i < LAYERS.length - 1"
              class="ca-risk-gate-arrow"
              :d="`M${116 + i * 111} 57 L${121 + i * 111} 57`"
            />
          </g>
          <text class="ca-risk-gate-note" :x="12" y="96">分层叠加：任何单层都能被糊弄</text>
          <line class="ca-risk-gate-drop" x1="220" y1="104" x2="220" :y2="AXIS_Y - 12" />
        </g>

        <g class="ca-risk-gate-axis">
          <line v-for="d in DECADES" :key="`d-${d.e}`" class="is-grid" :x1="d.x" y1="118" :x2="d.x" :y2="AXIS_Y" />
          <line class="is-axis" :x1="L" :y1="AXIS_Y" :x2="R" :y2="AXIS_Y" />
          <text class="ca-risk-gate-note" :x="R" :y="AXIS_Y + 34">时间往右每格乘 10 →</text>
          <g v-for="t in TICKS" :key="t.text">
            <line class="is-tick" :x1="t.x" :y1="AXIS_Y" :x2="t.x" :y2="AXIS_Y + 5" />
            <text class="ca-risk-gate-tick" :x="t.x" :y="AXIS_Y + 17" :text-anchor="t.anchor">{{ t.text }}</text>
          </g>

          <g v-for="p in POINTS" :key="p.id" class="ca-risk-gate-point" :class="`is-${p.tone}`">
            <line class="is-stem" :x1="p.x" :y1="p.yBig + 5" :x2="p.x" :y2="AXIS_Y" />
            <circle class="is-dot" :cx="p.x" :cy="AXIS_Y" r="4.2" />
            <text class="ca-risk-gate-big" :x="p.tx" :y="p.yBig" :text-anchor="p.anchor">{{ p.big }}</text>
            <text class="ca-risk-gate-sub" :x="p.tx" :y="p.yBig + 12" :text-anchor="p.anchor">{{ p.tag }}</text>
          </g>
        </g>
      </svg>

      <span class="sr-only">
        上半条是叠在一起的四层：第一层看设备与账户上下文，第二层看账号—设备—地址—收款方的图关系，第三层是规则与阈值，
        第四层是模型评分；分数落在不确定的那一档时既不放行也不拒绝，而是要求多走一步验证或转人工复核。
        下半条是按 10 倍递进的时间轴，从左到右五个点：2022 年企业半年报自报的风险判定耗时 10 毫秒，也就是 0.01 秒；
        2019 年企业技术演讲自报的"预警、检测、管控"合计不足 0.1 秒；同一份 2022 年报告给出的处置阶段是
        风险确认期 90 秒、交易冷静期 15 分钟、交易反悔期 24 小时。
        前两个数字是不同年份、不同系统版本的自报值，必须分开看，不能相加也不能取平均；
        后三个阶段名是企业自定义的流程叫法，不是法律或监管术语。以上都未经独立评估。
        任何单一环节都可能被糊弄过去，所以实践上是分层拦截；站内不给阈值、不给操作步骤。
      </span>
    </figure>

    <div class="ca-risk-gate-pr">
      <p class="ca-risk-gate-prhead">
        一个旋钮的两端：报警里真货的比例（精确率） vs 真货里被抓到的比例（召回率）
        <span class="ca-risk-gate-hint">下面笔数是举例假设，不是任何平台的真实率</span>
      </p>

      <div v-for="m in METRICS" :key="m.id" class="ca-risk-gate-mode">
        <p class="ca-risk-gate-modename">{{ m.name }} —— {{ m.mood }}</p>
        <p class="ca-risk-gate-row">
          <span class="ca-risk-gate-rowlab is-accent">抓到的真欺诈：{{ m.caught }} / {{ FRAUD }} 笔</span>
          <span class="ca-risk-gate-track">
            <span class="ca-risk-gate-fill is-accent" :style="{ width: `${m.pctRecall}%` }"></span>
          </span>
          <span class="ca-risk-gate-rowval">召回率 {{ m.recall }}%</span>
        </p>
        <p class="ca-risk-gate-row">
          <span class="ca-risk-gate-rowlab is-coral">报警里真是假货的比例：{{ m.caught }} / {{ m.caught + m.blocked }} 笔报警</span>
          <span class="ca-risk-gate-track">
            <span class="ca-risk-gate-fill is-coral" :style="{ width: `${m.pctPrecision}%` }"></span>
          </span>
          <span class="ca-risk-gate-rowval">精确率 {{ m.precision }}%</span>
        </p>
        <p class="ca-risk-gate-cost">
          代价清单：误拦正常交易 <b>{{ m.blocked }}</b> 笔（这些人是被冤枉的），放走的真欺诈 <b>{{ m.missed }}</b> 笔。
        </p>
      </div>

      <p class="ca-risk-gate-explode">
        举例的前提是一万笔交易里只有 {{ FRAUD }} 笔真欺诈——货太少了。召回率从
        <b>{{ PRE.recall }}%</b> 提到 <b>{{ LO.recall }}%</b>，多抓 {{ LO.caught - PRE.caught }} 笔，看着是好事；
        同一行精确率却从 <b>{{ PRE.precision }}%</b> 掉到 <b>{{ LO.precision }}%</b>，报警条从
        {{ PRE.blocked }} 笔涨到 {{ LO.blocked }} 笔。想同时把两个都推到接近一百，在一万笔里只有 {{ FRAUD }} 笔坏人
        的前提下做不到：报警里必然掺进大量正常交易。这就是"你被拦一下"和"盗刷没拦住"共用一个旋钮的意思。
      </p>

      <p class="ca-risk-gate-no">
        站内不印的东西：任何"某风控准确率 99.9%""拦截率百分之几十"这类脱离条件的百分比；任何阈值的具体位置；
        任何让某一笔更容易通过的操作步骤。阈值由各家机构按自己的损失率设定，从不公开。
        另外，被拦下时你能走的路是官方申诉与人工复核；涉及人脸识别的验证，按
        《人脸识别技术应用安全管理办法》第十条，在存在其他非人脸识别方式时不得把人脸作为唯一验证方式，
        你不同意用人脸时，机构应提供其他合理便捷的方式。以现行文本与官方解释为准，具体请询问执业律师。
      </p>
    </div>

    <p class="ca-cap">
      上面那条时间轴要读成两件事：企业自报的<b>判定环节</b>确实短（2022 年半年报说 10 毫秒、2019 年演讲说不足
      <b>0.1 秒</b>，都是自报、未经独立评估，年份不同不能混着写），但同一套报告里紧跟着的处置窗口是
      <b>90 秒</b>确认、<b>15 分钟</b>冷静、<b>24 小时</b>反悔——机器那一下是毫秒级的，把人拉回来的那几道是分钟到小时级的。
      而它为什么有时拦你：精确率与召回率是<b>同一个旋钮的两端</b>，报警越干净，漏网的就越多。
    </p>
  </div>
</template>

<style scoped>
.ca-risk-gate {
  max-width: 560px;
  margin-inline: auto;
}

.ca-risk-gate-fig {
  margin: 0;
  min-width: 0;
}

.ca-risk-gate-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-risk-gate-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-risk-gate-note {
  font-family: var(--font-sans);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: start;
}

.ca-risk-gate-axis .ca-risk-gate-note {
  text-anchor: end;
}

.ca-risk-gate-layer rect {
  fill: var(--panel-2);
  stroke: var(--accent);
  stroke-width: 1.2;
}

.ca-risk-gate-lname {
  font-family: var(--font-sans);
  font-size: 9.5px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-risk-gate-lsub {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-risk-gate-arrow {
  stroke: var(--line-strong);
  stroke-width: 2;
}

.ca-risk-gate-layers {
  animation: ca-risk-gate-in 1s var(--ease) both;
}

.ca-risk-gate-drop {
  stroke: var(--line-strong);
  stroke-width: 1.2;
  stroke-dasharray: 3 3;
}

.ca-risk-gate-axis .is-grid {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-risk-gate-axis .is-axis,
.ca-risk-gate-axis .is-tick {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-risk-gate-tick {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-risk-gate-point .is-stem {
  stroke-width: 1.2;
  stroke-dasharray: 2 3;
}

.ca-risk-gate-point.is-accent .is-stem {
  stroke: var(--accent);
}

.ca-risk-gate-point.is-coral .is-stem {
  stroke: var(--coral);
}

.ca-risk-gate-point .is-dot {
  fill: var(--panel);
  stroke-width: 2;
}

.ca-risk-gate-point.is-accent .is-dot {
  stroke: var(--accent);
}

.ca-risk-gate-point.is-coral .is-dot {
  stroke: var(--coral);
}

.ca-risk-gate-big {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
  text-anchor: middle;
}

.ca-risk-gate-sub {
  font-family: var(--font-sans);
  font-size: 7.5px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-risk-gate-pr {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-risk-gate-prhead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-risk-gate-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-risk-gate-mode {
  display: grid;
  gap: 7px;
  padding: 10px 0 12px;
  border-top: 1px solid var(--line);
  min-width: 0;
}

.ca-risk-gate-modename {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-risk-gate-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-risk-gate-rowlab {
  font-size: 11px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-risk-gate-rowlab.is-accent {
  color: var(--accent);
}

.ca-risk-gate-rowlab.is-coral {
  color: var(--coral);
}

.ca-risk-gate-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-risk-gate-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-risk-gate-fill.is-accent {
  background: var(--accent);
}

.ca-risk-gate-fill.is-coral {
  background: var(--coral);
}

.ca-risk-gate-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-risk-gate-cost {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-risk-gate-cost b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-risk-gate-explode {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-risk-gate-explode b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-risk-gate-no {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--faint);
  overflow-wrap: anywhere;
}

@media (min-width: 560px) {
  .ca-risk-gate-row {
    grid-template-columns: minmax(0, 1fr) 104px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-risk-gate-layers {
    animation: none;
  }
}
</style>
