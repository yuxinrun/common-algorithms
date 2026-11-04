<script setup lang="ts">
// 算法史竖轴：17 行年份，全部取事实库里的「论文记年」，不做任何推算。
// 三条硬规矩：构思年与发表年分两行印（I-01／I-02）；「共同发表」那种合写说法要拆开（I-06／P-76）；
// 两次 AI 寒冬只能写「约」，起止年份各资料不一（I-105／I-106）。
// 图上没有一个是实测数，也没有示意数——年份本身就在事实库里。

type Tone = 'prior' | 'algo' | 'cold'

type Row = {
  id: string
  year: string
  title: string
  note: string
  tone: Tone
}

const ROWS: Row[] = [
  { id: 'y1687', year: '1687', title: '牛顿《原理》里的求根思想', note: '算法之前的数学', tone: 'prior' },
  { id: 'y1808', year: '1808', title: '拉夫森写成迭代式', note: '牛顿法的另一条线', tone: 'prior' },
  { id: 'y1847', year: '1847', title: '柯西：最速下降法', note: '当时用来解线性方程组', tone: 'prior' },
  { id: 'y1948', year: '1948', title: '香农：通信的数学理论', note: '标题不叫「信息论」', tone: 'algo' },
  { id: 'y1951', year: '1951', title: '随机梯度的统计学源头', note: 'Robbins–Siegmund', tone: 'algo' },
  { id: 'y1953', year: '1953', title: '卡诺图论文', note: '人用的图解，不是自动化过程', tone: 'algo' },
  { id: 'y1956', year: '1956–1958', title: '贝尔曼–福特：能带负权', note: '单源最短路', tone: 'algo' },
  { id: 'y1956d', year: '1956', title: 'Dijkstra 构思（本人回忆）', note: '构思年 ≠ 发表年', tone: 'prior' },
  { id: 'y1959', year: '1959', title: 'Dijkstra 发表：全文 3 页', note: '≠「3 分钟」讹传', tone: 'algo' },
  { id: 'y1961', year: '1961–1964', title: '伯克利迷宫老鼠找路', note: '与 A* 不是一回事', tone: 'algo' },
  { id: 'y1962', year: '1962', title: 'Floyd：全源最短路', note: '两人各提，不是合写', tone: 'algo' },
  { id: 'y1968', year: '1968', title: 'Warshall：独立提出', note: '与 1962 相隔数年', tone: 'algo' },
  { id: 'w1974', year: '约 1974–1980', title: '第一次 AI 寒冬', note: '英国与美国大幅收缩资助', tone: 'cold' },
  { id: 'y1974b', year: '1974', title: '反向传播更早的博士论文', note: 'Werbos；1982 另有一版', tone: 'prior' },
  { id: 'y1986', year: '1986', title: '一篇 Nature 论文让 BP 普及', note: '≠1986 才发明', tone: 'algo' },
  { id: 'w1987', year: '约 1987–1993', title: '第二次 AI 寒冬', note: '专用 LISP 机市场崩解', tone: 'cold' },
  { id: 'y1998', year: '1998', title: 'PageRank 工程化论文', note: '今天的排序早不只靠它', tone: 'algo' }
]

// —— 几何：竖轴，每行一行文字，标签全在 viewBox 内算完 ——
const W = 480
const ROW_H = 28
const TOP = 46
const YEAR_X = 92
const SPINE_X = 104
const NAME_X = 116
const NOTE_X = 470
const LAST_Y = TOP + (ROWS.length - 1) * ROW_H
const H = LAST_Y + 30
</script>

<template>
  <div class="ca-algo-timeline ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Algorithm Timeline · 哪年冒出来的</span>
      <p class="ca-widget-sub">这些算法各是哪年见诸论文的？哪些「发明年份」其实被读歪了？</p>
    </div>

    <figure class="ca-algo-timeline-fig">
      <svg
        class="ca-algo-timeline-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-algo-timeline-tag" :x="8" :y="18">年份一律取论文记年</text>
        <text class="ca-algo-timeline-tag is-right" :x="NOTE_X" :y="18">寒冬只敢写「约」</text>
        <line class="ca-algo-timeline-spine" :x1="SPINE_X" :y1="TOP - 12" :x2="SPINE_X" :y2="LAST_Y + 8" />

        <g
          v-for="(r, i) in ROWS"
          :key="r.id"
          class="ca-algo-timeline-row"
          :class="`is-${r.tone}`"
          :style="{ animationDelay: `${i * 40}ms` }"
        >
          <rect
            v-if="r.tone === 'cold'"
            class="ca-algo-timeline-band"
            :x="8"
            :y="TOP + i * ROW_H - 12"
            :width="W - 16"
            :height="24"
            rx="6"
          />
          <text class="ca-algo-timeline-year" :x="YEAR_X" :y="TOP + i * ROW_H + 3.5">{{ r.year }}</text>
          <circle class="ca-algo-timeline-dot" :cx="SPINE_X" :cy="TOP + i * ROW_H" r="4" />
          <text class="ca-algo-timeline-name" :x="NAME_X" :y="TOP + i * ROW_H + 3.5">{{ r.title }}</text>
          <text class="ca-algo-timeline-note" :x="NOTE_X" :y="TOP + i * ROW_H + 3.5">{{ r.note }}</text>
        </g>
      </svg>

      <span class="sr-only">
        竖向时间轴，往上更早、往下更近，共 17 行。1687 年，牛顿《原理》里的求根思想；1808 年，拉夫森写成迭代式；
        1847 年，柯西的最速下降法，当时用来解线性方程组；1948 年，香农的论文标题是「通信的数学理论」，不叫「信息论」；
        1951 年，随机梯度的统计学源头；1953 年，卡诺图论文，它是人用的图解、不是自动化过程；1956 到 1958 年，
        贝尔曼与福特等提出能处理负权边的单源最短路；1956 年，迪杰斯特拉本人回忆的构思年；1959 年，他的三页短文发表；
        1961 到 1964 年，加州伯克利迷宫老鼠的启发式搜索，它与 1968 年形式化的 A* 不是一回事；1962 年 Floyd 独立发表全源最短路，
        1968 年 Warshall 独立提出，两人相隔数年、并非合写；约 1974 到 1980 年是第一次 AI 寒冬，1973 年 Lighthill 提交批评报告；
        1974 年反向传播已出现在 Werbos 的博士论文里（他 1982 年还有一版）；1986 年一篇 Nature 论文让反向传播被广泛接受；
        约 1987 到 1993 年是第二次 AI 寒冬，专用 LISP 机市场崩解，日本第五代计算机计划 1982 年启动、1992 年终止；
        1998 年是 PageRank 的工程化论文。三处讹传：「3 分钟想出最短路」查不到出处，可查到的原话是本人 2001 年回忆的「大约 20 分钟」；
        「1962 年两人共同发表」不成立；「1986 年才发明反向传播」也不成立。
      </span>
    </figure>

    <div class="ca-algo-timeline-legend">
      <span class="ca-algo-timeline-lg"><i class="is-prior"></i>更早的数学前史／更早的独立提出</span>
      <span class="ca-algo-timeline-lg"><i class="is-algo"></i>算法事件</span>
      <span class="ca-algo-timeline-lg"><i class="is-cold"></i>寒冬与需要打问号的年份</span>
    </div>

    <div class="ca-algo-timeline-fixes">
      <p class="ca-algo-timeline-fixhead">三处被读歪的「发明年份」</p>
      <ul class="ca-algo-timeline-list">
        <li>
          <b>「三分钟就想出最短路」</b>
          <span>网上还有更短的版本，但查不到一手出处。可查到的原话是迪杰斯特拉本人 2001 年的回忆「大约 20 分钟」，
            而且是在咖啡馆、无纸无笔的构思，三年后（1959）才发表——构思与写出能跑的程序是两件事。</span>
        </li>
        <li>
          <b>「1962 年 Floyd 和 Warshall 共同发表」</b>
          <span>中文资料常这么写，但两人相隔数年、彼此独立，通常记为 Floyd 1962、Warshall 1968。
            站内的写法是「分别独立提出」。</span>
        </li>
        <li>
          <b>「1986 年才有人发明反向传播」</b>
          <span>Werbos 1974 年的博士论文与 1982 年、Parker 1985 年都在前面。1986 年那篇 Nature 论文做的事，
            是让这套方法被广泛接受。</span>
        </li>
      </ul>
      <p class="ca-algo-timeline-quiet">
        另外两件常被合并的事：PageRank 的 1998 年论文，实验规模是当时抓取的数千万级页面子集，而它早已不是今天搜索排序的全部；
        两次 AI 寒冬的起止年份各资料不一（1974–1980 或 1973–1979 都见过），所以这张轴上给它们都加了「约」。
      </p>
    </div>

    <p class="ca-cap">
      这条轴上最该记住的不是某个年份，而是<b>两个年份经常不是同一件事</b>：迪杰斯特拉本人说构思用了<b>大约 20 分钟</b>，
      那是 <b>1956 年</b>的事，论文 <b>1959 年</b>才发表、全文只有 <b>3 页</b>；反向传播 <b>1974 年</b>就在博士论文里，
      <b>1986 年</b>才被广泛接受；两次 AI 寒冬只能写成「约 <b>1974–1980</b>」与「约 <b>1987–1993</b>」——
      年份好查，<b>年份指的是哪件事</b>才容易搞错。
    </p>
  </div>
</template>

<style scoped>
.ca-algo-timeline {
  max-width: 560px;
  margin-inline: auto;
}

.ca-algo-timeline-fig {
  margin: 0;
  min-width: 0;
}

.ca-algo-timeline-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-algo-timeline-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: start;
}

.ca-algo-timeline-tag.is-right {
  text-anchor: end;
}

.ca-algo-timeline-spine {
  stroke: var(--line-strong);
  stroke-width: 1.4;
}

.ca-algo-timeline-year {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--ink-2);
  text-anchor: end;
}

.ca-algo-timeline-name {
  font-family: var(--font-sans);
  font-size: 10.5px;
  fill: var(--ink-2);
  text-anchor: start;
}

.ca-algo-timeline-note {
  font-family: var(--font-sans);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-algo-timeline-band {
  fill: var(--coral-soft);
}

.ca-algo-timeline-row.is-prior .ca-algo-timeline-dot {
  fill: var(--blue);
}

.ca-algo-timeline-row.is-prior .ca-algo-timeline-year {
  fill: var(--blue);
}

.ca-algo-timeline-row.is-algo .ca-algo-timeline-dot {
  fill: var(--accent);
}

.ca-algo-timeline-row.is-cold .ca-algo-timeline-dot {
  fill: var(--coral);
}

.ca-algo-timeline-row.is-cold .ca-algo-timeline-year,
.ca-algo-timeline-row.is-cold .ca-algo-timeline-note {
  fill: var(--coral);
}

.ca-algo-timeline-row {
  animation: ca-algo-timeline-in 0.6s var(--ease) both;
}

@keyframes ca-algo-timeline-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
}

.ca-algo-timeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-algo-timeline-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-algo-timeline-lg i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.ca-algo-timeline-lg i.is-prior {
  background: var(--blue);
}

.ca-algo-timeline-lg i.is-algo {
  background: var(--accent);
}

.ca-algo-timeline-lg i.is-cold {
  background: var(--coral);
}

.ca-algo-timeline-fixes {
  margin-top: 14px;
}

.ca-algo-timeline-fixhead {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 680;
  color: var(--coral);
  overflow-wrap: anywhere;
}

.ca-algo-timeline-list {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-algo-timeline-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--coral);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-algo-timeline-list b {
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-algo-timeline-list span {
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-algo-timeline-quiet {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .ca-algo-timeline-row {
    animation: none;
  }
}
</style>
