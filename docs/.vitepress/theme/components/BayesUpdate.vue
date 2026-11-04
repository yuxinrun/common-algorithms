<script setup lang="ts">
// 阳性不等于有病：把一万人摊开，看看"阳性"这两个字里混着多少人。
// 这里全部是示例算术（P-38、P-110 给的那两组参数），不是任何真实筛查项目的实测数据。
// 数字在 setup 里现算：患病人数 × 灵敏度 = 真阳性；健康人数 ×（1 - 特异度）= 假阳性。

const POP = 1e5 // 示例人群规模：十万人
const SENS = 99 // 灵敏度：有病的人里被查出来的比例（示例）
const SPEC = 95 // 特异度：没病的人里被判为阴性的比例（示例）

type Case = { name: string; prev: number }

const CASES: Case[] = [
  { name: '患病率 1%', prev: 1 },
  { name: '患病率 0.1%', prev: 0.1 }
]

const round1 = (v: number) => Math.round(v * 10) / 10

const CALC = CASES.map((c) => {
  const sick = Math.round((POP * c.prev) / 100) // 真正患病的人数
  const well = POP - sick
  const tp = Math.round((sick * SENS) / 100) // 真阳性
  const fn = sick - tp // 漏掉的
  const fp = Math.round((well * (100 - SPEC)) / 100) // 假阳性
  const pos = tp + fp
  const ppv = round1((tp / pos) * 100)
  const per = Math.round(pos / tp) // 多少个阳性里有一个真的
  return { ...c, sick, well, tp, fn, fp, pos, ppv, per }
})

// —— 画布几何：两根同样尺度的条，比的是"阳性里真患病的占比" ——
const OX = 14
const X0 = 80 // 条形起点（左边留出标签列）
const FULL = 250 // 最长那根条的像素长度
const TX = X0 + FULL + 8 // 右侧数值列
const W = TX + 92
const H = 132
const BAR_H = 22
const Y0 = 42 // 第一根条的顶部
const YSTEP = 46
const RPAD = 92 // 右侧数值列的宽度
const totalMax = Math.max(...CALC.map((c) => c.pos))

const BARS = CALC.map((c, i) => {
  const y = Y0 + i * YSTEP
  const len = Math.round((c.pos / totalMax) * FULL)
  const tpLen = Math.max(2, Math.round((c.tp / c.pos) * len))
  return {
    ...c,
    y,
    len,
    tpLen,
    fpLen: len - tpLen,
    ppvText: `PPV ≈ ${c.ppv}%`
  }
})

const axisX = X0 + FULL
</script>

<template>
  <div class="ca-bayes-update ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Bayes Theorem · 阳性不等于有病</span>
      <p class="ca-widget-sub">同一套检出能力，只把患病率改小一档，"阳性"里真患病的比例就塌下去。这是示例算术，不是某个真实筛查项目的实测。</p>
    </div>

    <figure class="ca-bayes-update-fig">
      <svg
        class="ca-bayes-update-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-bayes-update-tag" :x="W - OX" :y="14">示例算术 · 十万人摊平</text>
        <text class="ca-bayes-update-axis" :x="OX" :y="30">阳性里真患病 vs 假阳性</text>
        <text class="ca-bayes-update-scale" :x="axisX" :y="30">条长＝阳性总人数</text>

        <g v-for="(b, i) in BARS" :key="`bar-${i}`" class="ca-bayes-update-bar">
          <text class="ca-bayes-update-name" :x="OX" :y="b.y + 14">{{ b.name }}</text>
          <rect class="ca-bayes-update-tp" :x="X0" :y="b.y" :width="b.tpLen" :height="BAR_H" rx="2" />
          <rect class="ca-bayes-update-fp" :x="X0 + b.tpLen" :y="b.y" :width="b.fpLen" :height="BAR_H" rx="2" />
          <text v-if="b.tpLen > 40" class="ca-bayes-update-in" :x="X0 + b.tpLen / 2" :y="b.y + 14">{{ b.tp }}</text>
          <text class="ca-bayes-update-in" :x="X0 + b.tpLen + b.fpLen / 2" :y="b.y + 14">{{ b.fp }}</text>
          <text class="ca-bayes-update-ppv" :x="TX" :y="b.y + 14">{{ b.ppvText }}</text>
        </g>
        <line class="ca-bayes-update-rule" :x1="X0" :y1="112" :x2="axisX" :y2="112" />
        <text class="ca-bayes-update-rulelab" :x="X0" :y="124">左段＝真阳性，右段＝假阳性</text>
      </svg>

      <span class="sr-only">
        示例人群十万人，灵敏度按 {{ SENS }}% 计、特异度按 {{ SPEC }}% 计。
        第一种：患病率 {{ CASES[0].prev }}%，真正患病 {{ CALC[0].sick }} 人，其中检出 {{ CALC[0].tp }} 人（真阳性），
        漏掉 {{ CALC[0].fn }} 人；健康的 {{ CALC[0].well }} 人里有 {{ CALC[0].fp }} 人被误报成阳性（假阳性）。
        拿到阳性单的一共 {{ CALC[0].pos }} 人，其中真患病 {{ CALC[0].tp }} 人，阳性预测值约 {{ CALC[0].ppv }}%，
        也就是大约 {{ CALC[0].per }} 个阳性里 1 个真患病。
        第二种：患病率 {{ CASES[1].prev }}%，真正患病 {{ CALC[1].sick }} 人，真阳性 {{ CALC[1].tp }} 人；
        假阳性 {{ CALC[1].fp }} 人，阳性合计 {{ CALC[1].pos }} 人，阳性预测值降到约 {{ CALC[1].ppv }}%，
        大约 {{ CALC[1].per }} 个阳性里才有 1 个真患病。
        以上全部是按这两个假设参数算出来的示例，不是任何真实筛查项目的结果；真实情况以医生判断与设备说明书为准。
      </span>
    </figure>

    <div class="ca-bayes-update-table">
      <p class="ca-bayes-update-glab">这几行就是全部运算（示例参数，可按计算器复现）</p>
      <table class="ca-bayes-update-grid">
        <thead>
          <tr>
            <th></th>
            <th v-for="c in CALC" :key="c.name">{{ c.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>真正患病</th>
            <td v-for="c in CALC" :key="`s-${c.name}`">{{ c.sick }}</td>
          </tr>
          <tr>
            <th>真阳性</th>
            <td v-for="c in CALC" :key="`t-${c.name}`">{{ c.tp }}</td>
          </tr>
          <tr>
            <th>假阳性</th>
            <td v-for="c in CALC" :key="`f-${c.name}`">{{ c.fp }}</td>
          </tr>
          <tr>
            <th>阳性合计</th>
            <td v-for="c in CALC" :key="`p-${c.name}`">{{ c.pos }}</td>
          </tr>
          <tr class="is-ppv">
            <th>阳性里真患病</th>
            <td v-for="c in CALC" :key="`v-${c.name}`">{{ c.ppv }}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="ca-bayes-update-facts">
      <p class="ca-bayes-update-fact">
        <b>算法只有一步乘法。</b>贝叶斯定理说的是：后验正比于似然乘先验（写作 P(H∣E) ∝ P(E∣H)·P(H)）。
        上面这张表里，"患病率"就是先验，"灵敏度与特异度"决定似然，最后一行就是后验。
        Thomas Bayes 的论文在他去世后于 1763 年在 Philosophical Transactions 宣读发表。
        至于"贝叶斯派与频率派"，那是统计推断的两套立场之争，不是谁算错了，站内不下这个判断。
      </p>
      <p class="ca-bayes-update-fact">
        <b>为什么一改患病率就崩。</b>灵敏度、特异度一个没动，被改的只有先验。同一个
        <b>{{ 100 - SPEC }}%</b> 的误报率，乘在 {{ CALC[0].well }} 个健康人身上得 {{ CALC[0].fp }} 个假阳性，
        乘在 {{ CALC[1].well }} 个健康人身上得 {{ CALC[1].fp }} 个；而病人那边的真阳性只剩 {{ CALC[1].tp }} 个，
        两边一比就从 {{ CALC[0].per }} 比 1 变成 {{ CALC[1].per }} 比 1。健康人越多，固定误报率乘出来的假阳性就越占上风——
        患病率降一个量级，阳性预测值近乎腰斩再腰斩，这正是"罕见病不宜对全体人群普筛"的数学理由。
        <b>参数换一套，结论大变</b>：这两组数只是用来讲清机制的示例算术，不是某项真实筛查的实测。
      </p>
      <p class="ca-bayes-update-fact">
        <b>拿到"阳性"之后该做的事，不在这张图里。</b>要不要复查、怎么复核、结合哪些症状与病史，都由医生判断；
        某个读数的含义以医生判断与设备说明书为准。本组件不给任何"看到某个读数该怎么办"的操作建议，也不承诺任何诊断结论；
        真实的筛查策略由医生与公共卫生规范决定，不由一张示例表决定。这里只留一句：<b>阳性是一个需要复核的信号，不是一个结论</b>。
      </p>
    </div>

    <p class="ca-cap">
      十万人示例人群、灵敏度 <b>{{ SENS }}%</b>、特异度 <b>{{ SPEC }}%</b>：患病率 <b>{{ CALC[0].prev }}%</b> 时
      <b>{{ CALC[0].tp }}</b> 个真阳性对 <b>{{ CALC[0].fp }}</b> 个假阳性，阳性预测值约 <b>{{ CALC[0].ppv }}%</b>（约
      <b>{{ CALC[0].per }}</b> 个阳性里 1 个真患病）；患病率降到 <b>{{ CALC[1].prev }}%</b>，阳性预测值只剩约
      <b>{{ CALC[1].ppv }}%</b>。<b>以上全是示例算术</b>，换一个项目、换一个人群就换一个数——
      真实检查该不该做、结果怎么读，<b>以医生判断与设备说明书为准</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-bayes-update {
  max-width: 640px;
  margin-inline: auto;
}

.ca-bayes-update-fig {
  margin: 0;
}

.ca-bayes-update-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-bayes-update-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-bayes-update-axis {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-bayes-update-name {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--ink-2);
  text-anchor: start;
}

.ca-bayes-update-tp {
  fill: var(--accent);
}

.ca-bayes-update-fp {
  fill: var(--coral);
  opacity: 0.8;
}

.ca-bayes-update-in {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--bg);
  text-anchor: middle;
}

.ca-bayes-update-scale {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-bayes-update-rulelab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-bayes-update-ppv {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--accent);
  text-anchor: start;
}

.ca-bayes-update-rule {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-opacity: 0.6;
}

.ca-bayes-update-bar {
  animation: ca-bayes-update-in 0.9s var(--ease) both;
}

@keyframes ca-bayes-update-in {
  from {
    opacity: 0;
  }
}

.ca-bayes-update-table {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-bayes-update-glab {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-bayes-update-grid {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 11px;
}

.ca-bayes-update-grid th,
.ca-bayes-update-grid td {
  padding: 5px 6px;
  border-bottom: 1px solid var(--line);
  text-align: right;
}

.ca-bayes-update-grid thead th {
  color: var(--ink-2);
  font-weight: 700;
  border-bottom: 1px solid var(--line-strong);
}

.ca-bayes-update-grid tbody th {
  text-align: left;
  color: var(--muted);
  font-weight: 500;
}

.ca-bayes-update-grid td {
  color: var(--ink-2);
}

.ca-bayes-update-grid tr.is-ppv td {
  color: var(--accent);
  font-weight: 700;
}

.ca-bayes-update-facts {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-bayes-update-fact {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-bayes-update-fact b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (prefers-reduced-motion: reduce) {
  .ca-bayes-update-bar {
    animation: none;
  }
}
</style>
