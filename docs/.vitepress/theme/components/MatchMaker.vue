<script setup lang="ts">
// 匹配与分数：Elo 那条曲线是怎么来的，K 因子为什么是"灵敏度 vs 稳得住"的旋钮。
// 曲线与下面每一格加减分都是把公式代进去当场算的（可回代自证），不是任何玩家的真实分。
// 匹配时间—分差那一段按事实底稿的"拒绝给数"处理：只讲放宽机制，一个秒数与分差的具体值都不印。

const round1 = (v: number) => Math.round(v * 10) / 10

// —— Elo 期望胜率（P-41）：E_A = 1 / (1 + 10^((R_B − R_A)/400)) ——
const DIV = 400
const expected = (diff: number) => 1 / (1 + Math.pow(10, -diff / DIV))

const W = 460
const H = 232
const L = 38
const R = 420
const TOP = 34
const BOT = 184
const D_MAX = 600

const ex = (d: number) => round1(L + ((d + D_MAX) / (2 * D_MAX)) * (R - L))
const ey = (p: number) => round1(BOT - p * (BOT - TOP))

const CURVE_PTS: string[] = []
{
  const STEP = 25
  for (let d = -D_MAX; d <= D_MAX; d += STEP) {
    CURVE_PTS.push(`${ex(d)},${ey(expected(d))}`)
  }
}

const E400 = round1(expected(DIV) * 100) // 分差 400：高位方约 0.909
const E600 = round1(expected(2 * DIV) * 100)
const LOW600 = round1(100 - E600)
const X_GRID = [-D_MAX, 0, D_MAX].map((d) => ({ d, x: ex(d) }))
const Y_GRID = [0, 0.5, 1].map((p) => ({ p, y: ey(p), text: p === 0 ? '0' : p === 1 ? '100%' : '50%' }))

// —— K 因子：R' = R + K(S − E)。三档是美国国际棋联（FIDE）公开规则的现行分档 ——
const K_TIERS = [
  { k: 40, who: '新棋手／过渡期' },
  { k: 20, who: '大部分注册棋手' },
  { k: 10, who: '长期在 2400 分以上的顶尖棋手' }
]
const E_EVEN = expected(0) // 对手同级：0.5
const E_UNDER = expected(-DIV) // 你比对面低 400 分：就是 1 − 0.909 那一头
const K_MAX = 40
const K_ROWS = K_TIERS.map((t) => {
  const winEven = t.k * (1 - E_EVEN)
  const winUpset = t.k * (1 - E_UNDER)
  const loseEven = t.k * E_EVEN
  return {
    ...t,
    winEven: round1(winEven),
    winUpset: round1(winUpset),
    loseEven: round1(loseEven),
    pctEven: round1((winEven / K_MAX) * 100),
    pctUpset: round1((winUpset / K_MAX) * 100),
    pctLose: round1((loseEven / K_MAX) * 100)
  }
})

// —— 匹配时间 vs 允许分差：机制是"一档一档放宽"，具体秒数与分差不印（P-111）——
// 三条的长短纯为方向示意，写在 CSS 里，不代表任何百分比或秒数。
const WIDEN = [
  { id: 'w0', cls: 'is-narrow', name: '开局：只找几乎同分的', cost: '最平，但可能要等很久' },
  { id: 'w1', cls: 'is-mid', name: '过一会儿：分差放宽一档', cost: '更快，对局开始变得不那么平' },
  { id: 'w2', cls: 'is-wide', name: '再等：上限由产品替你决定', cost: '一定开得了，但平不平原靠运气' }
]
</script>

<template>
  <div class="ca-match-maker ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Elo &amp; K Factor · 分数与 matchmaking</span>
      <p class="ca-widget-sub">分差多少算"该赢"，一盘棋该加几分，以及为什么"秒开"和"势均力敌"不能同时要。</p>
    </div>

    <figure class="ca-match-maker-fig">
      <svg
        class="ca-match-maker-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-match-maker-tag" :x="W - 12" :y="16">按公式计算，非实测</text>

        <g class="ca-match-maker-grid">
          <line v-for="g in X_GRID" :key="`vx-${g.d}`" class="is-v" :x1="g.x" :y1="TOP" :x2="g.x" :y2="BOT" />
          <line v-for="g in Y_GRID" :key="`hy-${g.p}`" class="is-h" :x1="L" :y1="g.y" :x2="R" :y2="g.y" />
          <line class="is-axis" :x1="L" :y1="BOT" :x2="R" :y2="BOT" />
          <line class="is-axis" :x1="L" :y1="TOP" :x2="L" :y2="BOT" />
          <text v-for="g in X_GRID" :key="`tx-${g.d}`" class="ca-match-maker-tick" :x="g.x" :y="BOT + 14">{{ g.d }}</text>
          <text v-for="g in Y_GRID" :key="`ty-${g.p}`" class="ca-match-maker-tick is-left" :x="L - 6" :y="g.y + 3">
            {{ g.text }}
          </text>
          <text class="ca-match-maker-note" :x="ex(0)" :y="BOT + 28">你比对面高多少分 →</text>
        </g>

        <g class="ca-match-maker-curve">
          <polyline :points="CURVE_PTS.join(' ')" />
          <line class="is-lead" :x1="ex(DIV)" :y1="BOT" :x2="ex(DIV)" :y2="ey(expected(DIV))" />
          <circle class="is-dot" :cx="ex(DIV)" :cy="ey(expected(DIV))" r="4" />
          <text class="ca-match-maker-call" :x="ex(DIV) - 8" :y="ey(expected(DIV)) - 8" text-anchor="end">
            高 {{ DIV }} 分：期望 {{ E400 }}%
          </text>
        </g>
      </svg>

      <span class="sr-only">
        这条曲线是 Elo 的期望胜率公式本身：E 等于 1 除以（1 加 10 的（对手分减你分再除以 400）次方）。
        横轴是你比对面高多少分，从负六百到正六百；纵轴是你的期望得分，从零到百分之百。
        分差为零时期望是 50%；你比对面高 400 分时期望约 {{ E400 }}%，也就是常说的大约九成；
        高 600 分时期望约 {{ E600 }}%，对面只剩约 {{ LOW600 }}%。这几个数把公式代进去就能自己验，不是实测。
        Elo 由物理学家 Arpad Elo 创立，美国象棋协会 1960 年首先采用，国际棋联 FIDE 在 1970 年正式采用。
        它衡量的是"对局胜负的预测"，不是发给你的一张段位证书；它假设结果能由稳定实力解释，
        而组队上分、版本改动都会破坏这个假设。
      </span>
    </figure>

    <div class="ca-match-maker-k">
      <p class="ca-match-maker-head">
        每局加减多少分由 K 说了算：新分 = 旧分 + K ×（实际得分 − 期望得分）
        <span class="ca-match-maker-hint">三档为 FIDE 公开规则；下面每格都是代公式算出来的</span>
      </p>

      <div v-for="r in K_ROWS" :key="r.k" class="ca-match-maker-tier">
        <p class="ca-match-maker-tiername">K = {{ r.k }} —— {{ r.who }}</p>
        <p class="ca-match-maker-row">
          <span class="ca-match-maker-rowlab is-accent">赢了同级对手</span>
          <span class="ca-match-maker-track">
            <span class="ca-match-maker-fill is-accent" :style="{ width: `${r.pctEven}%` }"></span>
          </span>
          <span class="ca-match-maker-rowval">+{{ r.winEven }}</span>
        </p>
        <p class="ca-match-maker-row">
          <span class="ca-match-maker-rowlab is-accent">赢了比你高 400 分的</span>
          <span class="ca-match-maker-track">
            <span class="ca-match-maker-fill is-accent" :style="{ width: `${r.pctUpset}%` }"></span>
          </span>
          <span class="ca-match-maker-rowval">+{{ r.winUpset }}</span>
        </p>
        <p class="ca-match-maker-row">
          <span class="ca-match-maker-rowlab is-coral">输给同级对手</span>
          <span class="ca-match-maker-track">
            <span class="ca-match-maker-fill is-coral" :style="{ width: `${r.pctLose}%` }"></span>
          </span>
          <span class="ca-match-maker-rowval">−{{ r.loseEven }}</span>
        </p>
      </div>

      <p class="ca-match-maker-note2">
        看这三档的差别：同一盘爆冷，<b>K = 40</b> 加 <b>{{ K_ROWS[0].winUpset }}</b> 分，
        <b>K = 10</b> 只加 <b>{{ K_ROWS[2].winUpset }}</b> 分。K 大就灵敏——状态真的变了，几局之内分就跟上；
        K 大也脆——连输两三局手冷的正常波动，就能把你的分拽下去一截。K 小正相反：稳，但你变强了它半天不认。
        所以"这局加了几分"从来不是实力的度量，它是规则里那个旋钮的刻度。另外，"大师级比赛 K 取 16"一类
        是历史或部分体系的取值（不同资料还给 24、32），站内印 K 值都要指明是哪套规则，不同体系的分不许互比。
      </p>

      <p class="ca-match-maker-true">
        组队游戏为什么不好用一条 Elo 曲线说完：微软研究院的 TrueSkill（NIPS 2006）把它推广成"每人一个高斯分布"——
        除了均值还有一个代表不确定的方差，赛后用因子图一起更新。方差大的人分数跳得快，方差小的人几乎不动，
        这就是新人上分忽高忽低、老玩家稳的机制。它专门处理多人对局，但站内不承诺"绝对公平"——
        它算的仍然是"结果能不能由稳定实力解释"。
      </p>
    </div>

    <div class="ca-match-maker-mm">
      <p class="ca-match-maker-head">
        匹配时间与段位差：机制能讲，曲线不印
        <span class="ca-match-maker-hint">这一段故意没有任何秒数</span>
      </p>
      <div class="ca-match-maker-widen">
        <div v-for="w in WIDEN" :key="w.id" class="ca-match-maker-step">
          <span class="ca-match-maker-stepname">{{ w.name }}</span>
          <span class="ca-match-maker-steptack">
            <span class="ca-match-maker-stepfill" :class="w.cls"></span>
          </span>
          <span class="ca-match-maker-stepcost">{{ w.cost }}</span>
        </div>
      </div>
      <p class="ca-match-maker-nodeal">
        条子的长度只表示"允许的对手分差一档一档变宽"这个方向，<b>不表示任何秒数或分数区间</b>。
        机制是确定的：分差窗口每放宽一档，找到对局的速度就上去、对局变不平的比例也一起上去——
        "秒匹配"和"势均力敌"是同一颗旋钮的两端，等待上限由产品替你按下。
        至于"某游戏第 X 秒放宽到 Y 分段"这种曲线，本轮没抓到任何厂商公布的一手数据，
        所以站内一条都不画、一个数都不印；将来若厂商自己公开，引用时也必须标"自报"。
      </p>
    </div>

    <p class="ca-cap">
      这条曲线只有一个旋钮值得记住：Elo 用 <b>400 分</b>当刻度，代进公式就是高 400 分期望约 <b>{{ E400 }}%</b>、
      高 <b>600 分</b>期望约 <b>{{ E600 }}%</b>（对面只剩约 {{ LOW600 }}%）；而每局加减几分由
      <b>K</b> 决定，同一盘爆冷在 FIDE 三档里分别是 <b>+{{ K_ROWS[0].winUpset }}</b>、<b>+{{ K_ROWS[1].winUpset }}</b>、
      <b>+{{ K_ROWS[2].winUpset }}</b>。灵敏与稳，一格里装不下两个。匹配时间那段是站内故意留白的：
      放宽的方向可讲，<b>具体秒数与分差查不到一手，就不印</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-match-maker {
  max-width: 540px;
  margin-inline: auto;
}

.ca-match-maker-fig {
  margin: 0;
  min-width: 0;
}

.ca-match-maker-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-match-maker-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-match-maker-grid .is-v,
.ca-match-maker-grid .is-h {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-match-maker-grid .is-axis {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-match-maker-tick {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-match-maker-tick.is-left {
  text-anchor: end;
}

.ca-match-maker-note {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-match-maker-curve polyline {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.4;
  stroke-linecap: round;
  animation: ca-match-maker-draw 1.1s var(--ease) both;
}

.ca-match-maker-curve .is-lead {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.ca-match-maker-curve .is-dot {
  fill: var(--panel);
  stroke: var(--accent);
  stroke-width: 2;
}

.ca-match-maker-call {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
  text-anchor: end;
}

@keyframes ca-match-maker-draw {
  from {
    opacity: 0;
  }
}

.ca-match-maker-k,
.ca-match-maker-mm {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
  min-width: 0;
}

.ca-match-maker-head {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-match-maker-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-match-maker-tier {
  display: grid;
  gap: 7px;
  padding: 10px 0 12px;
  border-top: 1px solid var(--line);
  min-width: 0;
}

.ca-match-maker-tiername {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-match-maker-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  min-width: 0;
}

.ca-match-maker-rowlab {
  font-size: 11px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-match-maker-rowlab.is-accent {
  color: var(--accent);
}

.ca-match-maker-rowlab.is-coral {
  color: var(--coral);
}

.ca-match-maker-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-match-maker-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-match-maker-fill.is-accent {
  background: var(--accent);
}

.ca-match-maker-fill.is-coral {
  background: var(--coral);
}

.ca-match-maker-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-match-maker-note2,
.ca-match-maker-true,
.ca-match-maker-nodeal {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-match-maker-note2 b,
.ca-match-maker-nodeal b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-match-maker-widen {
  display: grid;
  gap: 8px;
}

.ca-match-maker-step {
  display: grid;
  gap: 4px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-match-maker-stepname {
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-match-maker-steptack {
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-match-maker-stepfill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--muted);
}

.ca-match-maker-stepfill.is-narrow {
  width: 24%;
  background: var(--accent);
}

.ca-match-maker-stepfill.is-mid {
  width: 54%;
  background: var(--blue);
}

.ca-match-maker-stepfill.is-wide {
  width: 88%;
  background: var(--coral);
}

.ca-match-maker-stepcost {
  font-size: 10.5px;
  color: var(--faint);
  overflow-wrap: anywhere;
}

@media (min-width: 540px) {
  .ca-match-maker-row {
    grid-template-columns: minmax(0, 1fr) 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-match-maker-curve polyline {
    animation: none;
  }
}
</style>
