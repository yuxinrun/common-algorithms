<script setup lang="ts">
// 「关闭个性化推荐」这个按钮按下去，动的是流水线里的哪一层？
// 链路本身是行业通用架构描述（召回多路并行→粗排→精排→重排，C-52），不是任一平台的真实拓扑；
// 条上的候选「条数」是示意，只表达「逐层减少候选、模型逐层变复杂」这个形状。
// 平台侧公开口径（C-50：抖音把推荐描述为包含召回、过滤、排序，并称当前算法几乎不依赖给内容和用户打标签）
// 与公开资料里的「用户标签管理」表述并存，必须并列呈现，不择一。
// 法条侧：第十七条要求「不针对个人特征的选项，或者便捷的关闭选项；用户选择关闭的，应当立即停止提供相关服务」，
// 并要求提供选择或删除个人特征标签的功能（C-95）；关闭不等于广告消失（C-124）。
// 「一个算法给你打分」是简化叙事，但也不能反过来暗示用户能精确操纵排序（P-123 / I-140）。

// —— 画布几何 ——
const W = 440
const H = 210
const LBL_X = 122
const BAR_X = 128
const BAR_MAX = 250
const ROW0 = 42
const PITCH = 30
const BARH = 16
const N_MAX = 40

const STAGES = [
  { id: 'recall', name: '召回（多路并行）', n: 40, personal: true },
  { id: 'rough', name: '粗排', n: 20, personal: true },
  { id: 'fine', name: '精排（排序）', n: 10, personal: true },
  { id: 'rerank', name: '重排（多样性）', n: 5, personal: false },
  { id: 'screen', name: '落到你的屏幕', n: 3, personal: false }
]

const barW = (v: number) => Math.round((v / N_MAX) * BAR_MAX)
const rowY = (i: number) => ROW0 + i * PITCH

// 三条「人均时长」：分母各不相同，不相加、不比高低、不换单位
const DURATIONS = [
  {
    id: 'av',
    tone: 'accent',
    num: '201 分钟',
    who: '网络视听用户（10.99 亿人，截至 2025 年 12 月）',
    src: '中国网络视听协会《中国网络视听发展研究报告（2026）》',
    unit: '人·单日'
  },
  {
    id: 'drama',
    tone: 'blue',
    num: '129 分钟',
    who: '微短剧类独立 App 的用户',
    src: '同一份报告（不含长短视频平台里的微短剧内容）',
    unit: '人·单日'
  },
  {
    id: 'mob',
    tone: 'coral',
    num: '189.3 小时',
    who: '中国移动互联网月活跃用户（12.82 亿）',
    src: 'QuestMobile 第三方监测（截至 2026 年 6 月，含工作、通讯等非娱乐使用）',
    unit: '人·单月'
  }
]
</script>

<template>
  <div class="ca-feed-switch ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Recall → Rank → Rerank · 那个按钮管到哪一层</span>
      <p class="ca-widget-sub">
        推荐不是一次打分，是一条多阶段流水线。条上的候选数是示意，只用来看「逐层变少」的形状。
      </p>
    </div>

    <figure class="ca-feed-switch-fig">
      <svg
        class="ca-feed-switch-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-feed-switch-tag" :x="W - 8" :y="14">候选条数·示意</text>

        <rect
          class="ca-feed-switch-brace"
          x="124"
          y="34"
          width="258"
          height="84"
        />
        <text class="ca-feed-switch-blab" x="124" :y="30">按钮管得到这三层</text>

        <g v-for="(s, i) in STAGES" :key="s.id" class="ca-feed-switch-stage">
          <text class="ca-feed-switch-lab" :x="LBL_X" :y="rowY(i) + 12">{{ s.name }}</text>
          <rect
            class="ca-feed-switch-bar"
            :class="s.personal ? 'is-personal' : 'is-rule'"
            :x="BAR_X"
            :y="rowY(i)"
            :width="barW(s.n)"
            :height="BARH"
            rx="2"
          />
          <text class="ca-feed-switch-val" :x="BAR_X + barW(s.n) + 6" :y="rowY(i) + 12">{{ s.n }} 条</text>
        </g>

        <line class="ca-feed-switch-split" x1="124" y1="126" x2="390" y2="126" />
        <text class="ca-feed-switch-warn" x="190" :y="rowY(3) + 12">← 按钮管不到这层</text>
        <text class="ca-feed-switch-foot" :x="BAR_X" :y="200">逐层减少候选、逐层换更复杂的模型</text>
      </svg>

      <span class="sr-only">
        示意数据，条数不是任何平台的真实候选量。链路自上而下是：召回，多路并行产生约 {{ STAGES[0].n }}
        条候选；粗排，约 {{ STAGES[1].n }} 条；精排也就是排序，约 {{ STAGES[2].n }}
        条；这三层是「按你的特征选人、选内容」发生的地方，也是那个关闭按钮管得到的范围。
        再往下是重排，约 {{ STAGES[3].n }} 条，做多样性、打散和业务规则——这层不会因为按钮消失；
        最后落到屏幕约 {{ STAGES[4].n }} 条。这是行业通用架构描述，不是任一平台的真实拓扑。
      </span>
    </figure>

    <div class="ca-feed-switch-cols">
      <div class="ca-feed-switch-col is-on">
        <p class="ca-feed-switch-colhead">按钮没按：个性化在跑</p>
        <ul class="ca-feed-switch-ul">
          <li>召回用你的行为信号与相似用户/相似内容路线（协同过滤、双塔召回、Wide&amp;Deep 这类技术类别，公开材料只给类别、不给参数与权重）</li>
          <li>排序预估「你会不会看完、点不点」，同一条内容对不同人分数不同</li>
          <li>平台公开说明自己包含召回、过滤、排序等环节；「几乎不依赖给内容和用户打标签」是工程技术人员的说法，与公开资料里的「用户标签管理」表述并存，两条都要看见</li>
        </ul>
      </div>
      <div class="ca-feed-switch-col is-off">
        <p class="ca-feed-switch-colhead">按钮按下：改的是这几层，不是全部</p>
        <ul class="ca-feed-switch-ul">
          <li>要求是「提供不针对你个人特征的选项，或者便捷的关闭选项」；你选择关闭的，应当<b>立即停止</b>提供相关服务</li>
          <li>另有一个独立权利：选择或删除用于算法推荐的个人特征<b>标签</b>——它和「关闭」不是同一个入口</li>
          <li>关闭后信息流按热度等非个性化规则排列；<b>你仍会看到广告</b>，只是不再基于你的画像定向，那是另一个开关</li>
          <li>重排的多样性、打散、业务规则照旧；具体入口名称由平台自定，以 App 实时页面为准</li>
        </ul>
      </div>
    </div>

    <div class="ca-feed-switch-dur">
      <p class="ca-feed-switch-blocktitle">
        「到底看了多久」：三个数字、三个分母
        <span class="ca-feed-switch-mtag is-coral">不可相加·不可比高低</span>
      </p>
      <ul class="ca-feed-switch-durlist">
        <li v-for="d in DURATIONS" :key="d.id" :class="`is-${d.tone}`">
          <span class="ca-feed-switch-durnum">{{ d.num }}</span>
          <span class="ca-feed-switch-durwho">{{ d.who }}</span>
          <span class="ca-feed-switch-dursrc">{{ d.src }}｜口径：{{ d.unit }}</span>
        </li>
      </ul>
      <p class="ca-feed-switch-note">
        第三个是第三方监测口径，分母、样本、测量方法与行业协会报告完全不同，不能拿来验证前两个，
        也不能把它折算成「每人每天刷几小时短视频」。同一个「10.74 亿」在两份报告里分别指
        「2023 年 12 月网络视听用户」和「2025 年 12 月短视频用户」——数值相同、含义不同。
        另有一项受访调查：37% 的受访微短剧用户会因热榜推荐观看、50.1% 希望 AI 生成内容得到明确标注，
        这些都是<b>受访者比例</b>（抽样），不是全国用户数。
      </p>
    </div>

    <div class="ca-feed-switch-law">
      <p class="ca-feed-switch-blocktitle">这条链子上已经套了三道义务</p>
      <ul class="ca-feed-switch-lawlist">
        <li>
          <b>第八条</b>：应当定期审核、评估、验证算法机制机理、模型、数据和应用结果，
          <b>不得设置诱导用户沉迷、过度消费</b>等违反法律法规或违背伦理道德的算法模型。
        </li>
        <li>
          <b>第十六条</b>：以显著方式告知用户提供算法推荐服务，并公示基本原理、目的意图和主要运行机制
          ——「公示基本原理」不等于「公开源代码」。
        </li>
        <li>
          <b>第十七条</b>：不针对个人特征的选项或便捷关闭选项、标签选择与删除、
          对用户权益造成重大影响的应当依法予以说明并承担相应责任。
        </li>
      </ul>
      <p class="ca-feed-switch-note">
        机制只讲到「有多阶段、有反馈回路」这一层：既不说「一个算法控制你」，也不暗示你可以精确操纵排序。
        本页条款摘录以现行有效文本与官方解释为准，具体请咨询执业律师。
      </p>
    </div>

    <p class="ca-cap">
      「关闭个性化推荐」作用在<b>召回与排序那几层</b>（示意链路里自上而下的前三层），法条要求你一旦选择关闭，
      服务应当<b>立即停止</b>；<b>重排</b>（多样性、打散、业务规则）不受这个按钮影响，<b>广告另算</b>。
      至于「看了多久」：网络视听用户人均单日 <b>201 分钟</b>、微短剧类独立 App 用户 <b>129 分钟</b>、
      第三方监测的移动用户 <b>189.3 小时/月</b>——三个分母各不相同，绝不平均、绝不换算。
    </p>
  </div>
</template>

<style scoped>
.ca-feed-switch {
  max-width: 540px;
  margin-inline: auto;
}

.ca-feed-switch-fig {
  margin: 0;
}

.ca-feed-switch-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-feed-switch-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-feed-switch-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: end;
}

.ca-feed-switch-val {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--ink-2);
}

.ca-feed-switch-bar.is-personal {
  fill: var(--accent);
}

.ca-feed-switch-bar.is-rule {
  fill: var(--blue);
}

.ca-feed-switch-brace {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.ca-feed-switch-blab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--accent);
}

.ca-feed-switch-split {
  stroke: var(--line);
  stroke-width: 1;
}

.ca-feed-switch-warn {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--coral);
}

.ca-feed-switch-foot {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-feed-switch-stage {
  animation: ca-feed-switch-in 0.9s var(--ease) both;
}

@keyframes ca-feed-switch-in {
  from {
    opacity: 0;
  }
}

.ca-feed-switch-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

@media (min-width: 720px) {
  .ca-feed-switch-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ca-feed-switch-col {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
}

.ca-feed-switch-col.is-on {
  border-left: 3px solid var(--accent);
}

.ca-feed-switch-col.is-off {
  border-left: 3px solid var(--coral);
}

.ca-feed-switch-colhead {
  margin: 0 0 8px;
  font-size: 11.5px;
  color: var(--ink);
}

.ca-feed-switch-col.is-on .ca-feed-switch-colhead {
  color: var(--accent);
}

.ca-feed-switch-col.is-off .ca-feed-switch-colhead {
  color: var(--coral);
}

.ca-feed-switch-ul {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 7px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-feed-switch-ul b {
  color: var(--ink-2);
}

.ca-feed-switch-dur,
.ca-feed-switch-law {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-feed-switch-blocktitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-feed-switch-mtag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 999px;
}

.ca-feed-switch-mtag.is-coral {
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-feed-switch-durlist {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-feed-switch-durlist li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-feed-switch-durlist li.is-accent {
  border-left: 3px solid var(--accent);
}

.ca-feed-switch-durlist li.is-blue {
  border-left: 3px solid var(--blue);
}

.ca-feed-switch-durlist li.is-coral {
  border-left: 3px solid var(--coral);
}

.ca-feed-switch-durnum {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
}

.ca-feed-switch-durwho,
.ca-feed-switch-dursrc {
  font-size: 11px;
  line-height: 1.55;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-feed-switch-dursrc {
  color: var(--faint);
}

.ca-feed-switch-lawlist {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 9px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-feed-switch-lawlist b {
  font-family: var(--font-mono);
  color: var(--accent);
}

.ca-feed-switch-note {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-feed-switch-note b {
  color: var(--coral);
}

@media (prefers-reduced-motion: reduce) {
  .ca-feed-switch-stage {
    animation: none;
  }
}
</style>
