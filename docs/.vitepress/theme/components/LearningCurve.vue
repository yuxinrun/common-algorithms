<script setup lang="ts">
// ImageNet 分类赛（ILSVRC）里四个查得到出处的错误率：26.2% → 16.4% → 4.49% → 3.57%。
// 出处：I-27（AlexNet 与传统方法，论文摘要口径）、I-28（ResNet 集成与单模型）、I-117（同一基准可比）。
// 中间几年（2013、2014）的成绩本库没有收录，所以这里不连线、不补点——空着就是空着。

const W = 430
const H = 250
const Y_TOP = 24
const Y_BOT = 198
const Y_MAX = 40 // 纵轴上限 40%，为了把 top-1 的 37.5% 也放进来
const BAR_X0 = 62
const BAR_W = 54
const BAR_GAP = 12
const GROUP_GAP = 44

const pct = (v: number) => +(Y_BOT - (v / Y_MAX) * (Y_BOT - Y_TOP)).toFixed(1)

type Bar = {
  key: string
  value: number
  valueText: string
  tone: 'pick' | 'cost'
  metric: string
  hollow: boolean
  x: number
}

const BARS: Bar[] = [
  { key: 'a5', value: 16.4, valueText: '16.4%', tone: 'pick', metric: 'top-5', hollow: false, x: BAR_X0 },
  {
    key: 'a1',
    value: 37.5,
    valueText: '37.5%',
    tone: 'cost',
    metric: 'top-1',
    hollow: false,
    x: BAR_X0 + BAR_W + BAR_GAP
  },
  {
    key: 'r1',
    value: 4.49,
    valueText: '4.49%',
    tone: 'pick',
    metric: '单模型',
    hollow: true,
    x: BAR_X0 + 2 * (BAR_W + BAR_GAP) + GROUP_GAP
  },
  {
    key: 'r5',
    value: 3.57,
    valueText: '3.57%',
    tone: 'pick',
    metric: '集成',
    hollow: false,
    x: BAR_X0 + 3 * (BAR_W + BAR_GAP) + GROUP_GAP
  }
]

const BASELINE = 26.2 // ILSVRC-2012 第二名的传统方法（I-27），拿它当"别人家的基线"
const FALL = +(16.4 - 3.57).toFixed(2) // 同一赛事口径下的绝对差（I-117 写作约 12.8 个百分点）
const RELATIVE = Math.round(((26.2 - 16.4) / 26.2) * 100) // 相对降幅（I-27 限定语里给的算法）

const TICKS = [0, 10, 20, 30, 40]
const G2012_MID = BAR_X0 + BAR_W + BAR_GAP / 2
const G2015_MID = BAR_X0 + 2 * (BAR_W + BAR_GAP) + GROUP_GAP + BAR_W + BAR_GAP / 2
const GROUP_END = BAR_X0 + 3 * (BAR_W + BAR_GAP) + GROUP_GAP + BAR_W
const CUT_X = BAR_X0 + 2 * (BAR_W + BAR_GAP) + GROUP_GAP / 2 + 8
const RIGHT = GROUP_END + 12

// LSTM / YOLO / Transformer 各自站在哪儿（I-41、I-43、P-137、I-31）
const FPS_MAX = 155
const ROWS = [
  { id: 'lstm', name: 'LSTM', when: '1997 论文', tone: 'pick', note: '论文年代，不是成绩' },
  { id: 'yolo', name: 'YOLO', when: '45 帧/秒', tone: 'cost', note: '论文摘要口径' },
  { id: 'fast', name: 'Fast YOLO', when: '155 帧/秒', tone: 'cost', note: '同一篇摘要里另一档' },
  { id: 'tf', name: 'Transformer', when: '28.4 BLEU', tone: 'ref', note: '翻译任务的分数' }
]
const FPS: Record<string, number> = { yolo: 45, fast: 155 }
</script>

<template>
  <div class="ca-learning-curve ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">ImageNet Error Rates · 错误率怎么掉下来</span>
      <p class="ca-widget-sub">同一场比赛、同一把尺子，四年里错误率从 26.2% 掉到 3.57%——掉的是什么？</p>
    </div>

    <div class="ca-lc-body">
      <figure class="ca-lc-fig">
        <svg
          class="ca-lc-svg"
          :viewBox="`0 0 ${W} ${H}`"
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          <g class="ca-lc-grid">
            <g v-for="t in TICKS" :key="`t-${t}`">
              <line :x1="BAR_X0 - 10" :y1="pct(t)" :x2="RIGHT" :y2="pct(t)" />
              <text class="ca-lc-ylab" :x="BAR_X0 - 14" :y="pct(t) + 3">{{ t }}</text>
            </g>
            <text class="ca-lc-axis" :x="BAR_X0 - 14" :y="Y_TOP - 10" text-anchor="end">%</text>
            <line class="ca-lc-base" :x1="BAR_X0 - 10" :y1="pct(BASELINE)" :x2="RIGHT" :y2="pct(BASELINE)" />
            <text class="ca-lc-baselab" :x="RIGHT" :y="pct(BASELINE) - 5" text-anchor="end">
              传统方法 26.2%
            </text>
            <line class="ca-lc-axis" :x1="BAR_X0 - 10" :y1="Y_BOT" :x2="RIGHT" :y2="Y_BOT" />
          </g>

          <g v-for="b in BARS" :key="b.key" class="ca-lc-bar" :class="[`is-${b.tone}`, { 'is-hollow': b.hollow }]">
            <rect :x="b.x" :y="pct(b.value)" :width="BAR_W" :height="Y_BOT - pct(b.value)" />
            <text class="ca-lc-val" :x="b.x + BAR_W / 2" :y="pct(b.value) - 6">{{ b.valueText }}</text>
            <text class="ca-lc-metric" :x="b.x + BAR_W / 2" :y="Y_BOT + 15">{{ b.metric }}</text>
          </g>

          <text class="ca-lc-year" :x="G2012_MID" :y="Y_BOT + 31" text-anchor="middle">ILSVRC 2012</text>
          <text class="ca-lc-year" :x="G2015_MID" :y="Y_BOT + 31" text-anchor="middle">ILSVRC 2015</text>
          <line class="ca-lc-cut" :x1="CUT_X" :y1="Y_TOP - 4" :x2="CUT_X" :y2="Y_BOT" />
          <text class="ca-lc-note" :x="RIGHT" :y="14" text-anchor="end">两年之间不连线</text>
        </svg>

        <p class="ca-lc-legend">
          青色 = 神经网络自己的成绩；珊瑚色 = 换一把更狠的尺子（top-1：只让模型猜一个标签）；
          蓝色虚线 = 同一届第二名的传统方法。空心柱是"多个模型投票的集成"值，实心柱是单模型值——
          <b>同一篇 ResNet 论文里两个数都给了，站内不取平均</b>。
        </p>

        <span class="sr-only">
          四个数全部来自论文摘要，任务都是 ILSVRC 的 ImageNet 分类，类别 1000 个，
          错误率的分母是该届验证集的图片张数。传统方法在 ILSVRC 2012 的 top-5 错误率是 26.2%；
          AlexNet 同一届 top-5 是 16.4%，同一个模型的 top-1 错误率是 37.5%；
          ResNet 在 ILSVRC 2015 的 152 层网络，单模型 top-5 是 4.49%，多模型集成是 3.57%。
          从 16.4% 到 3.57%，绝对差是 12.83 个百分点（事实库里写作约 12.8）；
          从传统方法的 26.2% 到 16.4%，是砍掉约 37% 的误差。
          中间 2013、2014 两年的成绩本库没有收录，图上没有连线。
          旁边的三行：LSTM 论文 1997 年发表，沉睡到 2013 至 2015 年才被工业界大规模使用；
          YOLO 论文摘要给出 45 帧每秒、Fast YOLO 155 帧每秒，条件是论文那台显卡和那个输入分辨率；
          Transformer 论文给的是 WMT 2014 英译德 28.4 BLEU，那是翻译任务，不是分类错误率。
        </span>
      </figure>

      <div class="ca-lc-side">
        <p class="ca-lc-sidehead">LSTM 与 YOLO 各自站在哪儿<span class="ca-lc-hint">不是同一把尺子</span></p>
        <ul class="ca-lc-rows">
          <li v-for="r in ROWS" :key="r.id" class="ca-lc-row">
            <span class="ca-lc-dot" :class="`is-${r.tone}`"></span>
            <span class="ca-lc-rname">{{ r.name }}</span>
            <span class="ca-lc-rtrack">
              <span
                v-if="FPS[r.id]"
                class="ca-lc-rfill"
                :class="`is-${r.tone}`"
                :style="{ width: `${(FPS[r.id] / FPS_MAX) * 100}%` }"
              ></span>
            </span>
            <span class="ca-lc-rval">{{ r.when }}</span>
            <span class="ca-lc-rnote">{{ r.note }}</span>
          </li>
        </ul>
        <p class="ca-lc-formula">
          两条口径要说在前面：帧率绑死了论文那台显卡和那个输入分辨率，换个版本（v3/v5/v8）数字就变；
          BLEU 是翻译任务的自动指标，跟"认错几个类别"没关系。ImageNet 那条线只说明<b>这一场比赛的分数</b>，
          不等于"模型变聪明了多少"。
        </p>
      </div>
    </div>

    <p class="ca-cap">
      上面这张图里，<b>26.2%</b> 是 ILSVRC 2012 第二名的传统方法、<b>16.4%</b> 是 AlexNet 同一届的 top-5，
      两者差 <b>{{ RELATIVE }}%</b> 的相对误差；<b>3.57%</b> 是 ResNet 在 ILSVRC 2015 的<b>多模型集成</b>值，
      同一篇论文里的单模型值是 <b>4.49%</b>，从 16.4% 到 3.57% 掉了 <b>{{ FALL }}</b> 个百分点。
      这四个数字的分母都是"该届验证集图片数 ÷ 猜错的那些"，不是"AI 有多聪明"。
    </p>
  </div>
</template>

<style scoped>
.ca-learning-curve {
  max-width: 620px;
  margin-inline: auto;
}

.ca-lc-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}

.ca-lc-fig {
  margin: 0;
  min-width: 0;
}

.ca-lc-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-lc-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-lc-grid line.ca-lc-axis {
  stroke: var(--line-strong);
}

.ca-lc-grid .ca-lc-base {
  stroke: var(--blue);
  stroke-dasharray: 6 4;
}

.ca-lc-grid .ca-lc-cut {
  stroke: var(--line-strong);
  stroke-dasharray: 2 4;
  opacity: 0.7;
}

.ca-lc-ylab,
.ca-lc-axis {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-lc-baselab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--blue);
}

.ca-lc-year {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
}

.ca-lc-note {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-lc-metric {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-lc-bar.is-pick rect {
  fill: var(--accent);
  opacity: 0.85;
}

.ca-lc-bar.is-cost rect {
  fill: var(--coral);
  opacity: 0.8;
}

.ca-lc-bar.is-hollow rect {
  fill: var(--panel-2);
  stroke: var(--accent);
  stroke-width: 1.6;
  stroke-dasharray: 5 3;
}

.ca-lc-val {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-lc-bar.is-hollow .ca-lc-val {
  fill: var(--accent);
}

.ca-lc-bar {
  animation: ca-lc-rise 0.8s var(--ease) both;
}

@keyframes ca-lc-rise {
  from {
    opacity: 0;
  }
}

.ca-lc-legend {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-lc-legend b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-lc-side {
  min-width: 0;
}

.ca-lc-sidehead {
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

.ca-lc-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.ca-lc-rows {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-lc-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) minmax(0, 1.1fr) 78px;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-lc-dot {
  grid-row: 1 / 3;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ca-lc-dot.is-pick {
  background: var(--accent);
}

.ca-lc-dot.is-cost {
  background: var(--coral);
}

.ca-lc-dot.is-ref {
  background: var(--blue);
}

.ca-lc-rname {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-lc-rval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-lc-rtrack {
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-lc-rfill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  animation: ca-lc-grow 1s var(--ease) both;
}

.ca-lc-rfill.is-pick {
  background: var(--accent);
}

.ca-lc-rfill.is-cost {
  background: var(--coral);
}

.ca-lc-rfill.is-ref {
  background: var(--blue);
}

@keyframes ca-lc-grow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
}

.ca-lc-rnote {
  grid-column: 2 / -1;
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-lc-formula {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-lc-formula b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (max-width: 620px) {
  .ca-lc-row {
    grid-template-columns: 8px minmax(0, 1fr) minmax(0, 1fr) 68px;
  }
}

@media (min-width: 860px) {
  .ca-lc-body {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
    gap: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-lc-bar,
  .ca-lc-rfill {
    animation: none;
  }
}
</style>
