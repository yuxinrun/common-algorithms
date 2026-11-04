<script setup lang="ts">
// 一次外卖的时限是怎么来的：美团 2020-09-10 公开过规则——同一单先跑四种评估算法，
// 取其中「最长」的那个当预估送达时间（C-22）。图里四根条的长短是示意：
// 只用来表达「会有四个不同的估法、系统挑最长」，不代表任何平台的真实分钟数。
// 下面那段「这三几分钟花在哪」同样是示意形状；真正的口径提醒是：
// 预估送达时间含商家出餐与等餐，跟「骑手骑行时间」不是同一个口径（C-22 限定语）。
// 最后一块换口径：国家邮政局的快递时限（C-15 / C-16 / C-17）。
// 季度分环节值与年度全程值是两套口径——四段不能相加当全程，年度值与季度值不能互比，
// 这里只分开摆着，绝不平均成一个「大约」。

// —— 画布几何（全部在 viewBox 内算完）——
const X0 = 104
const BARMAX = 34
const PLOT = 250
const ROW_Y = [40, 64, 88, 112]
const W = 440
const H = 168

const barW = (v: number) => Math.round((v / BARMAX) * PLOT)

const CAND = [
  { id: 'hist', label: '历史数据模型', mins: 18 },
  { id: 'city', label: '城市通行状态', mins: 24 },
  { id: 'scene', label: '各场景累加', mins: 31 },
  { id: 'dist', label: '配送距离', mins: 21 }
]

const CHOSEN = CAND.reduce((a, b) => (b.mins > a.mins ? b : a), CAND[0])

const STAGES = [
  { id: 'cook', label: '商家出餐', mins: 12, tone: 'accent' },
  { id: 'arrive', label: '骑手到店', mins: 6, tone: 'accent' },
  { id: 'wait', label: '到店后等餐', mins: 4, tone: 'coral' },
  { id: 'ride', label: '骑行送达', mins: 9, tone: 'blue' },
  { id: 'last', label: '交付（楼宇、楼层）', mins: 2, tone: 'accent' }
]

const STAGE_MAX = 14
const stagePct = (v: number) => Math.round((v / STAGE_MAX) * 100)

const EXPRESS_STEPS = ['寄出地处理', '运输', '寄达地处理', '投递']
const QUARTERS = [
  { id: 'q3', when: '2026 年第三季度', hours: [8.46, 29.88, 9.91, 2.89], rate: 86.81 },
  { id: 'q2', when: '2026 年第二季度', hours: [8.46, 30.12, 9.7, 3.05], rate: 86.74 }
]
const ANNUAL = { when: '2025 年度', full: 51.22, rate: 87.04, score: 85.0 }

const HOUR_SCALE = 32
const hourPct = (v: number) => Math.round((v / HOUR_SCALE) * 100)
</script>

<template>
  <div class="ca-cn-dispatch ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Delivery Window · 这三十分钟怎么来的</span>
      <p class="ca-widget-sub">
        同一单先跑四种估法，取最长的那个当时限。条的长短是示意，只有「取最长」是公开过的规则。
      </p>
    </div>

    <figure class="ca-cn-dispatch-fig">
      <svg
        class="ca-cn-dispatch-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-cn-dispatch-tag" :x="W - 8" :y="14">示意·分钟</text>
        <text class="ca-cn-dispatch-axis" :x="X0" :y="26">0</text>
        <text class="ca-cn-dispatch-axis is-end" :x="X0 + PLOT" :y="26">{{ BARMAX }} 分钟</text>

        <line class="ca-cn-dispatch-grid" :x1="X0" :y1="30" :x2="X0" :y2="136" />
        <line class="ca-cn-dispatch-grid" :x1="X0 + PLOT" :y1="30" :x2="X0 + PLOT" :y2="136" />

        <g
          v-for="(c, i) in CAND"
          :key="c.id"
          class="ca-cn-dispatch-cand"
          :class="c.id === CHOSEN.id ? 'is-chosen' : 'is-lost'"
        >
          <text class="ca-cn-dispatch-lab" :x="X0 - 6" :y="ROW_Y[i] + 9">{{ c.label }}</text>
          <rect class="ca-cn-dispatch-bar" :x="X0" :y="ROW_Y[i]" :width="barW(c.mins)" height="12" rx="2" />
          <text class="ca-cn-dispatch-val" :x="X0 + barW(c.mins) + 5" :y="ROW_Y[i] + 9">{{ c.mins }}</text>
        </g>

        <text class="ca-cn-dispatch-rule" :x="X0" :y="156">四个估法取最长 → 页面上的时限</text>
      </svg>

      <span class="sr-only">
        示意数据，分钟数只用来摆形状，不是任何平台的真实时长。同一订单存在四种评估算法：历史数据模型估算
        {{ CAND[0].mins }} 分钟、城市通行状态估算 {{ CAND[1].mins }} 分钟、各场景（出餐、到店、取餐等）累加估算
        {{ CAND[2].mins }} 分钟、配送距离估算 {{ CAND[3].mins }} 分钟；实际取其中最长的那个——也就是
        {{ CHOSEN.mins }} 分钟这一档——作为预估送达时间。这是美团外卖 2020 年 9 月 10
        日公开过的计算规则。要注意口径：预估送达时间含商家出餐与等餐，跟骑手的骑行时间不是同一个东西。
      </span>
    </figure>

    <div class="ca-cn-dispatch-parts">
      <p class="ca-cn-dispatch-blocktitle">
        这几十分钟花在哪几段（示意形状，不是实测）
        <span class="ca-cn-dispatch-mtag">示意</span>
      </p>
      <div class="ca-cn-dispatch-stages">
        <p v-for="s in STAGES" :key="s.id" class="ca-cn-dispatch-row">
          <span class="ca-cn-dispatch-rowlab" :class="`is-${s.tone}`">{{ s.label }}</span>
          <span class="ca-cn-dispatch-track">
            <span class="ca-cn-dispatch-fill" :class="`is-${s.tone}`" :style="{ width: `${stagePct(s.mins)}%` }"></span>
          </span>
          <span class="ca-cn-dispatch-rowval">{{ s.mins }} 分</span>
        </p>
      </div>
      <p class="ca-cn-dispatch-note">
        「到店后等餐」那一格为什么单独标红：站内讲「配送时长」必须先说含不含等餐。企业公开说明里，
        预估送达时间<b>含商家出餐与等餐</b>，所以「时限变短了」不等于「骑手骑得更快了」。
        交付段按楼宇与楼层颗粒度估算，企业要求地址精度到 5 级以上（4 级是街道、5 级是楼宇）——
        这套分级是企业自定义的，不是行业标准。
      </p>
    </div>

    <div class="ca-cn-dispatch-promises">
      <p class="ca-cn-dispatch-blocktitle">公开过的三件事，各自能推到哪一步</p>
      <ul class="ca-cn-dispatch-list">
        <li>
          <b>8 分钟弹性时间</b>：是企业在 2020 年 9 月公开承诺「调度系统给骑手留出 8 分钟」，
          恶劣天气下延长配送时间甚至停止接单。可核的是「作出过这个承诺」这件事，
          <b>不等于每一单都多 8 分钟</b>，也不等于所有城市同时上线。
        </li>
        <li>
          <b>时间点改时间段</b>：企业公布的试点数据显示，把预估送达时间由时间点改成弹性时间段后，
          用户对骑手的<b>差评率降低 50.7%</b>。企业自报，未经独立评估；试点城市、样本量、时长都没公布，
          而且差评率是投诉侧指标，不等于超时率或事故率。
        </li>
        <li>
          <b>派单考虑什么</b>：企业公开的口径是「会考虑骑手时间宽裕程度与路径顺路程度，对新骑手有所考虑，
          特殊场景适当延长配送时间」。这是一份「考虑因素清单」，不是算法参数——
          不能据此写「系统一定会照顾新手」。
        </li>
      </ul>
    </div>

    <div class="ca-cn-dispatch-express">
      <p class="ca-cn-dispatch-blocktitle">
        换个口径：快递的时限是另一个统计（国家邮政局，重点地区抽样）
        <span class="ca-cn-dispatch-mtag is-blue">官方口径</span>
      </p>
      <div v-for="q in QUARTERS" :key="q.id" class="ca-cn-dispatch-qgroup">
        <p class="ca-cn-dispatch-when">{{ q.when }}·分环节平均时限（小时）</p>
        <p v-for="(h, k) in q.hours" :key="`h-${q.id}-${k}`" class="ca-cn-dispatch-row">
          <span class="ca-cn-dispatch-rowlab is-ink">{{ EXPRESS_STEPS[k] }}</span>
          <span class="ca-cn-dispatch-track">
            <span class="ca-cn-dispatch-fill is-blue" :style="{ width: `${hourPct(h)}%` }"></span>
          </span>
          <span class="ca-cn-dispatch-rowval">{{ h }} 小时</span>
        </p>
        <p class="ca-cn-dispatch-rate">{{ q.when }}·72 小时妥投率 <b>{{ q.rate }}%</b></p>
      </div>
      <p class="ca-cn-dispatch-annual">
        {{ ANNUAL.when }}·全程平均时限 <b>{{ ANNUAL.full }} 小时</b>，72 小时妥投率 <b>{{ ANNUAL.rate }}%</b>，
        公众满意度 <b>{{ ANNUAL.score }} 分</b>
      </p>
      <p class="ca-cn-dispatch-note">
        两块数字不能拼在一起用：上面四个环节时限<b>不可相加</b>当「全程时限」（官方另有全程口径）；
        年度值和季度值的分母、抽样范围不同，<b>不能直接比大小</b>；「重点地区」也不是全国所有地区。
        两套口径分开摆，绝不平均成一个「大约」。
      </p>
    </div>

    <p class="ca-cap">
      你在页面上看到的那个时限，是四种估法里<b>最长</b>的那个——所以同一条路线不同天给出不同时限，并不奇怪。
      它<b>含商家出餐与等餐</b>，和「骑手骑行时间」不是同一个口径；企业自报的试点数字里，
      把时间点改成时间段后差评率<b>降低 50.7%</b>（企业自报，未经独立评估）。
      至于「3 公里 45 分钟」「比三年前缩短 10 分钟」这类流传数字，查不到平台或监管公布的统计口径，
      这张图不给。法律侧的定位是《互联网信息服务算法推荐管理规定》第二十条：向劳动者提供工作调度服务的，
      平台要保护劳动报酬、休息休假等合法权益，建立完善订单分配、报酬构成、工作时间、奖惩等算法。
    </p>
  </div>
</template>

<style scoped>
.ca-cn-dispatch {
  max-width: 540px;
  margin-inline: auto;
}

.ca-cn-dispatch-fig {
  margin: 0;
}

.ca-cn-dispatch-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-cn-dispatch-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-cn-dispatch-axis {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-cn-dispatch-axis.is-end {
  text-anchor: end;
}

.ca-cn-dispatch-grid {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-cn-dispatch-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: end;
}

.ca-cn-dispatch-val {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
}

.ca-cn-dispatch-rule {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
}

.ca-cn-dispatch-cand.is-chosen .ca-cn-dispatch-bar {
  fill: var(--accent);
}

.ca-cn-dispatch-cand.is-chosen .ca-cn-dispatch-lab {
  fill: var(--accent);
}

.ca-cn-dispatch-cand.is-lost .ca-cn-dispatch-bar {
  fill: var(--coral-soft);
  stroke: var(--coral);
  stroke-width: 1;
}

.ca-cn-dispatch-cand {
  animation: ca-cn-dispatch-in 0.9s var(--ease) both;
}

@keyframes ca-cn-dispatch-in {
  from {
    opacity: 0;
  }
}

.ca-cn-dispatch-parts,
.ca-cn-dispatch-promises,
.ca-cn-dispatch-express {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-cn-dispatch-blocktitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cn-dispatch-mtag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 999px;
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-cn-dispatch-mtag.is-blue {
  color: var(--blue);
  background: var(--blue-soft);
}

.ca-cn-dispatch-stages,
.ca-cn-dispatch-qgroup {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.ca-cn-dispatch-qgroup + .ca-cn-dispatch-qgroup {
  margin-top: 12px;
}

.ca-cn-dispatch-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 62px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-cn-dispatch-rowlab {
  font-size: 11.5px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-cn-dispatch-rowlab.is-accent {
  color: var(--accent);
}

.ca-cn-dispatch-rowlab.is-coral {
  color: var(--coral);
}

.ca-cn-dispatch-rowlab.is-blue {
  color: var(--blue);
}

.ca-cn-dispatch-rowlab.is-ink {
  color: var(--muted);
}

.ca-cn-dispatch-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-cn-dispatch-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  animation: ca-cn-dispatch-grow 1s var(--ease) both;
}

.ca-cn-dispatch-fill.is-accent {
  background: var(--accent);
}

.ca-cn-dispatch-fill.is-coral {
  background: var(--coral);
}

.ca-cn-dispatch-fill.is-blue {
  background: var(--blue);
}

@keyframes ca-cn-dispatch-grow {
  from {
    width: 0;
  }
}

.ca-cn-dispatch-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-cn-dispatch-when,
.ca-cn-dispatch-rate {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cn-dispatch-rate b {
  font-family: var(--font-mono);
  color: var(--ink);
}

.ca-cn-dispatch-annual {
  margin: 14px 0 0;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--blue);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cn-dispatch-annual b {
  font-family: var(--font-mono);
  color: var(--ink);
}

.ca-cn-dispatch-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 9px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
}

.ca-cn-dispatch-list b {
  color: var(--ink-2);
}

.ca-cn-dispatch-list li:first-child b {
  color: var(--accent);
}

.ca-cn-dispatch-list li:nth-child(2) b {
  color: var(--coral);
}

.ca-cn-dispatch-note {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cn-dispatch-note b {
  color: var(--coral);
}

@media (prefers-reduced-motion: reduce) {
  .ca-cn-dispatch-cand,
  .ca-cn-dispatch-fill {
    animation: none;
  }
}
</style>
