<script setup lang="ts">
// 书架卡：每本都给「难度 1–5 ＋该档判据句」「建议阅读时长（区间＋估算＋按每天 1 小时折算）」「最容易被读歪成什么」
// 「版次·出版社·ISBN 三元组」（表 B 卡表，编号 B-01…B-75 供料）。
// 时长是本站的估算区间，不是任何出版社或实测数据；条的起点不是零，是估算下限。
// 两源冲突的页数一律不写；印数、销量、点击、使用院校数都不当质量证据。

// —— 画布几何 ——
const W = 440
const LBL_X = 112
const BAR_X = 118
const BAR_MAX = 252
const HOUR_MAX = 150
const VAL_X = 376
const ROW0 = 44
const PITCH = 26
const H = 244

const BOOKS = [
  {
    id: 'grok',
    name: '算法图解 2e',
    short: '人民邮电·2024-09-25·第 2 版',
    isbn: '9787115649706',
    lo: 10,
    hi: 16,
    weeks: '约 2 周',
    level: 1,
    rule: '只需初中数学＋愿意照着敲 Python',
    tone: 'accent',
    skew: '读成「读完这本就够了」：它不讲图算法的复杂度分析、不严格推动态规划，也不会让你写出可维护的实现。它是直觉地图，不是教材。'
  },
  {
    id: 'math',
    name: '数学之美 3e',
    short: '人民邮电·2020-05·第 3 版',
    isbn: '9787115537973',
    lo: 14,
    hi: 20,
    weeks: '约 3 周',
    level: 1,
    rule: '只需高中数学，公式基本不给证明',
    tone: 'accent',
    skew: '读成「讲机器学习原理」：它是工程随笔，讲的是搜索引擎年代的方法；2020 年之后的大模型技术不在覆盖范围内（第 3 版新增的是区块链、量子通信、AI 的数学极限三章）。'
  },
  {
    id: 'sedg',
    name: '算法 4e',
    short: '人民邮电·2012-10·第 4 版中译',
    isbn: '9787115293800',
    lo: 35,
    hi: 55,
    weeks: '约 6–8 周',
    level: 3,
    rule: '能读 Java；不需要严格证明训练',
    tone: 'blue',
    skew: '读成「跟《算法导论》等价」：它对渐近分析处理得轻、证明少。另一个常见坑是买错成人邮 2016 年的影印英文版（ISBN 9787115416902），两者不是同一产品。'
  },
  {
    id: 'clrs',
    name: '算法导论 3e',
    short: '机械工业·2012-12·第 3 版中译',
    isbn: '9787111407010',
    lo: 60,
    hi: 100,
    weeks: '约 10–15 周',
    level: 4,
    rule: '需要离散数学＋概率＋能读带证明的段落；定位是研究生教材/参考书',
    tone: 'coral',
    skew: '读成「零基础也能读的入门书」。顺带一条误传：「第 4 版中文全译本已出」不成立，2026 年 5 月只出了《核心篇》（ISBN 9787111800026，仅第 1–25 章）。'
  },
  {
    id: 'melon',
    name: '机器学习（西瓜书）',
    short: '清华大学·2016-01·第 1 版',
    isbn: '9787302423287',
    lo: 35,
    hi: 55,
    weeks: '约 6–8 周',
    level: 4,
    rule: '需要线性代数＋概率＋能读公式推导',
    tone: 'coral',
    skew: '读成「入门第一本」：前言自陈「本书是一本教科书」，读者定位是研究生与高年级本科生；也容易被读成「读完就能做算法岗」，它不讲工程落地、也没有可跑代码路径。'
  },
  {
    id: 'slmt',
    name: '统计学习方法 2e',
    short: '清华大学·2019-05·第 2 版',
    isbn: '9787302517276',
    lo: 40,
    hi: 60,
    weeks: '约 7–9 周',
    level: 5,
    rule: '需要矩阵与优化、概率；几乎是纯公式推导',
    tone: 'coral',
    skew: '读成「入门/科普」或「机器学习全景图」：它不给你代码，也不给你数据实践。ISBN 只用 9787302517276，网传另一个号码与高校编目不咬合。'
  },
  {
    id: 'geb',
    name: '哥德尔、艾舍尔、巴赫',
    short: '商务印书馆·1996 年前后·旧译本',
    isbn: '9787100013239',
    lo: 80,
    hi: 150,
    weeks: '约 15–22 周',
    level: 4,
    rule: '需要能读长链条抽象论证，跟得住形式系统与自指',
    tone: 'coral',
    skew: '读成「算法入门／人工智能教科书」：它既不讲算法设计也不讲工程。英文原版 1980 年获普利策奖非虚构类，写成「普利策文学奖」是错的；读它也不等于读懂了不完备定理。'
  }
]

const xOf = (h: number) => Math.round((h / HOUR_MAX) * BAR_MAX)
const rowY = (i: number) => ROW0 + i * PITCH
</script>

<template>
  <div class="ca-book-shelf ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Shelf Cards · 书架上的七张卡</span>
      <p class="ca-widget-sub">
        横条是本站估算的阅读时长区间（小时），不是出版社数据，也不是实测；条的颜色跟着门槛走。
      </p>
    </div>

    <figure class="ca-book-shelf-fig">
      <svg
        class="ca-book-shelf-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-book-shelf-tag" :x="W - 8" :y="14">时长·估算</text>

        <line class="ca-book-shelf-axis" :x1="BAR_X" :y1="28" :x2="BAR_X + BAR_MAX" :y2="28" />
        <text class="ca-book-shelf-tick" :x="BAR_X" :y="22">0</text>
        <text class="ca-book-shelf-tick" :x="BAR_X + xOf(50)" :y="22">50</text>
        <text class="ca-book-shelf-tick" :x="BAR_X + xOf(100)" :y="22">100</text>
        <text class="ca-book-shelf-tick is-end" :x="BAR_X + BAR_MAX" :y="22">{{ HOUR_MAX }} 小时</text>

        <g v-for="(b, i) in BOOKS" :key="b.id" class="ca-book-shelf-row" :class="`is-${b.tone}`">
          <text class="ca-book-shelf-lab" :x="LBL_X" :y="rowY(i) + 4">{{ b.level }} · {{ b.name }}</text>
          <rect class="ca-book-shelf-track" :x="BAR_X" :y="rowY(i) - 5" :width="BAR_MAX" height="8" rx="2" />
          <rect
            class="ca-book-shelf-band"
            :x="BAR_X + xOf(b.lo)"
            :y="rowY(i) - 5"
            :width="xOf(b.hi) - xOf(b.lo)"
            height="8"
            rx="2"
          />
          <text class="ca-book-shelf-val" :x="VAL_X" :y="rowY(i) + 4">{{ b.lo }}–{{ b.hi }}</text>
        </g>

        <text class="ca-book-shelf-foot" :x="BAR_X" :y="rowY(BOOKS.length - 1) + 30">
          标签最前的数字＝难度 1—5　颜色＝门槛高低
        </text>
      </svg>

      <span class="sr-only">
        七本书的估算阅读时长区间（单位：小时，本站估算，按每天 1 小时折算）：《算法图解（第 2 版）》10 到 16
        小时、难度 1；《数学之美（第 3 版）》14 到 20 小时、难度 1；《算法（第 4 版）》中译 35 到 55
        小时、难度 3；《算法导论（原书第 3 版）》中译 60 到 100 小时、难度 4，只精读主干章节可压到 40
        小时；《机器学习》（西瓜书）35 到 55 小时、难度 4；《统计学习方法（第 2 版）》40 到 60
        小时、难度 5；《哥德尔、艾舍尔、巴赫》旧译本 80 到 150 小时、难度 4，多数人读不完。
      </span>
    </figure>

    <div class="ca-book-shelf-cards">
      <article v-for="b in BOOKS" :key="`c-${b.id}`" class="ca-book-shelf-card" :class="`is-${b.tone}`">
        <p class="ca-book-shelf-chead">
          <b class="ca-book-shelf-cname">{{ b.name }}</b>
          <span class="ca-book-shelf-badge">难度 {{ b.level }}</span>
          <span class="ca-book-shelf-badge is-time">{{ b.lo }}–{{ b.hi }} 小时（估算）</span>
        </p>
        <p class="ca-book-shelf-line">
          <span class="ca-book-shelf-k">判据</span>{{ b.rule }}
        </p>
        <p class="ca-book-shelf-line">
          <span class="ca-book-shelf-k">折算</span>每天 1 小时，{{ b.weeks }}读完（本站估算，不是承诺）
        </p>
        <p class="ca-book-shelf-line is-skew">
          <span class="ca-book-shelf-k">读歪</span>{{ b.skew }}
        </p>
        <p class="ca-book-shelf-ver">
          {{ b.short }}｜ISBN {{ b.isbn }}｜页数两源记录不一致的不写
        </p>
      </article>
    </div>

    <p class="ca-cap">
      把门槛从低到高排：<b>难度 1</b> 的《算法图解》《数学之美》各约 <b>10–16</b>、<b>14–20</b>
      小时（估算）就能过一遍；到 <b>难度 4—5</b>，同一件事要 <b>60–100</b>、<b>35–55</b>、<b>40–60</b>
      小时，GEB 更是 <b>80–150</b> 小时且多数人读不完。这些数字全是<b>估算区间</b>，按每天 1
      小时折算，不构成任何保证；难度分必须连着判据句一起读——「难度 4」的意思是需要离散数学或线性代数，
      不是「这书不好」。读完任何一本都不等于拿到某种工作。
    </p>
  </div>
</template>

<style scoped>
.ca-book-shelf {
  max-width: 540px;
  margin-inline: auto;
}

.ca-book-shelf-fig {
  margin: 0;
}

.ca-book-shelf-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-book-shelf-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-book-shelf-axis {
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-book-shelf-tick {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-book-shelf-tick.is-end {
  text-anchor: end;
}

.ca-book-shelf-lab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--ink-2);
  text-anchor: end;
}

.ca-book-shelf-track {
  fill: var(--panel-3);
}

.ca-book-shelf-val {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
}

.ca-book-shelf-row.is-accent .ca-book-shelf-band {
  fill: var(--accent);
}

.ca-book-shelf-row.is-blue .ca-book-shelf-band {
  fill: var(--blue);
}

.ca-book-shelf-row.is-coral .ca-book-shelf-band {
  fill: var(--coral);
}

.ca-book-shelf-row {
  animation: ca-book-shelf-in 0.9s var(--ease) both;
}

@keyframes ca-book-shelf-in {
  from {
    opacity: 0;
  }
}

.ca-book-shelf-foot {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-book-shelf-cards {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-book-shelf-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
}

.ca-book-shelf-card.is-accent {
  border-left: 3px solid var(--accent);
}

.ca-book-shelf-card.is-blue {
  border-left: 3px solid var(--blue);
}

.ca-book-shelf-card.is-coral {
  border-left: 3px solid var(--coral);
}

.ca-book-shelf-chead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px 8px;
  margin: 0 0 7px;
  min-width: 0;
}

.ca-book-shelf-cname {
  font-size: 12.5px;
  color: var(--ink);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-book-shelf-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 999px;
  color: var(--muted);
  background: var(--panel-3);
}

.ca-book-shelf-badge.is-time {
  color: var(--accent);
  background: var(--accent-soft);
}

.ca-book-shelf-line {
  margin: 0 0 4px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-book-shelf-line.is-skew {
  color: var(--coral);
}

.ca-book-shelf-k {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  margin-right: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--ink-2);
  background: var(--panel-3);
}

.ca-book-shelf-ver {
  margin: 6px 0 0;
  font-family: var(--font-mono);
  font-size: 9.5px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .ca-book-shelf-row {
    animation: none;
  }
}
</style>
