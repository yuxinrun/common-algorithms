<script setup lang="ts">
// 梯度下降：在一条碗形损失曲线上"朝低的方向迈一步"，步子大小就是学习率。
// 函数取 f(x) = x²，起点 x = 3，更新规则 x ← x − 学习率 × 2x。
// 函数、学习率、步数全是人为设定的示意，不是实测。

const X_MIN = -3.9
const X_MAX = 3.9
const PX_L = 30
const PX_R = 322
const F_TOP = 13.2
const PY_BASE = 178
const PY_TOP = 28
const STEPS = 20 // 画图只画前 20 步
const CHASE = 60 // 最多追 60 步，看它哪天算"到了"
const GOAL = 0.1 // f 小于它就算落到碗底附近

const f = (x: number) => x * x
const gx = (x: number) => +(PX_L + ((x - X_MIN) / (X_MAX - X_MIN)) * (PX_R - PX_L)).toFixed(1)
const gy = (v: number) => +(PY_BASE - (Math.min(v, F_TOP) / F_TOP) * (PY_BASE - PY_TOP)).toFixed(1)

// 碗形曲线本身
const BOWL: string[] = []
{
  for (let i = 0; i <= 72; i++) {
    const x = -3.6 + (i / 72) * 7.2
    BOWL.push(`${gx(x)} ${gy(f(x))}`)
  }
}

const descend = (lr: number, limit: number) => {
  const xs = [3]
  for (let i = 0; i < limit; i++) xs.push(xs[i] - lr * 2 * xs[i])
  return xs
}

const reachStep = (lr: number) => {
  const hit = descend(lr, CHASE).findIndex((x) => f(x) < GOAL)
  return hit < 0 ? null : hit
}

type Run = { cls: string; name: string; lr: number; lrText: string; dy: number }
const RUNS: Run[] = [
  { cls: 'ok', name: '刚好', lr: 0.4, lrText: '0.4', dy: 0 },
  { cls: 'ref', name: '太小', lr: 0.05, lrText: '0.05', dy: 7 },
  { cls: 'bad', name: '太大', lr: 1.0, lrText: '1.0', dy: 0 }
]

const TRAJ = RUNS.map((r) => {
  const xs = descend(r.lr, STEPS)
  const seen = new Set<string>()
  const dots: { x: number; y: number; step: number }[] = []
  xs.forEach((x, i) => {
    const key = `${gx(x)},${gy(f(x))}`
    if (seen.has(key)) return
    seen.add(key)
    dots.push({ x: gx(x), y: gy(f(x)), step: i })
  })
  const line = `M ${xs.map((x) => `${gx(x)} ${gy(f(x)) + r.dy}`).join(' L ')}`
  const last = xs[STEPS]
  return {
    ...r,
    line,
    dots,
    lastX: last.toFixed(2),
    lastF: f(last).toFixed(3),
    hit: reachStep(r.lr)
  }
})

const OK = TRAJ[0]
const REF = TRAJ[1]

// 学习率再大一点就不是震荡，是发散：同样 20 步，人已经飞出碗外
const DIVERGE_F = f(descend(1.05, STEPS)[STEPS]).toFixed(0)

// 牛顿法多用了二阶信息（曲率）：在 f(x)=x² 上，x − 2x/2 一步就变成 0
const NEWTON_LANDS = 3 - (2 * 3) / 2
// 曲率为负的地方它会朝山上走：f(x) = x³ − 3x，从 x = −1.2 出发，那里是局部最高点
const NEG_X = -1.2
const NEWTON_BAD_ABS = (Math.abs(NEG_X - (3 * NEG_X * NEG_X - 3) / (6 * NEG_X))).toFixed(2)
</script>

<template>
  <div class="ca-gradient-valley ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Gradient Descent · 摸黑下山</span>
      <p class="ca-widget-sub">同一个起点、同一条碗，只改学习率：迈太小要爬半天，迈刚好几步到底，迈太大直接在两边弹。</p>
    </div>

    <figure class="ca-gv-fig">
      <svg class="ca-gv-svg" viewBox="0 0 340 210" role="presentation" aria-hidden="true" focusable="false">
        <line class="ca-gv-axis" :x1="PX_L" :y1="PY_BASE" :x2="PX_R" :y2="PY_BASE" />
        <line class="ca-gv-axis" :x1="gx(0)" :y1="PY_TOP - 8" :x2="gx(0)" :y2="PY_BASE" />
        <path class="ca-gv-bowl" :d="`M ${BOWL.join(' L ')}`" />

        <path v-for="t in TRAJ" :key="`l-${t.cls}`" :class="`ca-gv-line ca-gv-line--${t.cls}`" :d="t.line" />
        <template v-for="t in TRAJ" :key="`g-${t.cls}`">
          <circle
            v-for="d in t.dots"
            :key="`p-${t.cls}-${d.step}`"
            :class="`ca-gv-dot ca-gv-dot--${t.cls}`"
            :cx="d.x"
            :cy="d.y"
            :r="d.step === 0 ? 4 : 2.4"
          />
        </template>

        <circle class="ca-gv-bottom" :cx="gx(0)" :cy="gy(0)" r="3.2" />
        <text class="ca-gv-tag" :x="PX_L" :y="18" text-anchor="start">损失曲线 f(x) = x²（示意）</text>
        <text class="ca-gv-tag ca-gv-tag--start" :x="gx(3) - 8" :y="gy(9) - 12" text-anchor="end">
          起点 x = 3
        </text>
        <text class="ca-gv-tag" :x="gx(0)" :y="PY_BASE + 15" text-anchor="middle">谷底 f = 0</text>
        <text class="ca-gv-tag ca-gv-tag--bad" :x="gx(0)" :y="gy(9) + 14" text-anchor="middle">
          太大：在 3 和 −3 之间来回弹
        </text>
      </svg>

      <div class="ca-gv-legend">
        <div v-for="t in TRAJ" :key="t.cls" :class="`ca-gv-row ca-gv-row--${t.cls}`">
          <span class="ca-gv-chip"></span>
          <span class="ca-gv-name">学习率 {{ t.lrText }} · {{ t.name }}</span>
          <span class="ca-gv-nums">
            <template v-if="t.hit !== null">第 <b>{{ t.hit }}</b> 步落到碗底附近</template>
            <template v-else>追到 <b>{{ CHASE }}</b> 步也没落到碗底附近</template>
            ；第 {{ STEPS }} 步时 f = <b>{{ t.lastF }}</b>
          </span>
        </div>
        <p class="ca-gv-note">
          圆点都踩在同一条曲线上；蓝色那条的连线整体挪低了一点，只为不跟青色叠成一条。学习率再大些（1.05）就不是弹，
          是飞：第 {{ STEPS }} 步时 f 已经到 <b>{{ DIVERGE_F }}</b>。
        </p>
      </div>

      <span class="sr-only">
        损失函数取 f 等于 x 的平方，起点 x 等于 3，一共画前 20 步。
        学习率 0.4 这条青色线：第 2 步就落到碗底附近，20 步时 f 等于 0.000；
        学习率 0.05 这条蓝色线：第 22 步才落到碗底附近，20 步时 f 还有 0.133；
        学习率 1.0 这条珊瑚色线：20 步一直在 x 等于 3 和 x 等于负 3 之间来回弹，f 始终等于 9.000，追到 60 步也一样；
        学习率 1.05 时更糟，20 步后 f 冲到 407。示意：函数与轨迹都是人为设定的，不是实测。
      </span>
    </figure>

    <p class="ca-cap">
      同一条碗，<b>{{ OK.hit }}</b> 步到底和 <b>{{ REF.hit }}</b> 步才到，差的只是学习率；迈过头就白弹
      <b>{{ CHASE }}</b> 步。牛顿法为什么快——它把<b>曲率</b>（二阶信息）一起用了，在这条碗上从 x = 3 一步就踩到
      <b>{{ NEWTON_LANDS }}</b>；但它也会翻车：曲率为负的地方它朝山上走，在 f(x) = x³−3x 上从 x = −1.2 一步迈到
      <b>−{{ NEWTON_BAD_ABS }}</b>，那是局部最高点；碰上鞍点更惨，它不知道该往哪走。示意：函数与轨迹都是人为设定的，不是实测。
    </p>
  </div>
</template>

<style scoped>
.ca-gv-fig {
  margin: 0;
}

.ca-gv-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-gv-axis {
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-gv-bowl {
  fill: none;
  stroke: var(--muted);
  stroke-width: 1.8;
  opacity: 0.7;
}

.ca-gv-line {
  fill: none;
  stroke-width: 2.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ca-gv-line--ok {
  stroke: var(--accent);
}

.ca-gv-line--ref {
  stroke: var(--blue);
}

.ca-gv-line--bad {
  stroke: var(--coral);
}

.ca-gv-dot {
  stroke: var(--panel);
  stroke-width: 0.9;
}

.ca-gv-dot--ok {
  fill: var(--accent);
}

.ca-gv-dot--ref {
  fill: var(--blue);
}

.ca-gv-dot--bad {
  fill: var(--coral);
}

.ca-gv-bottom {
  fill: var(--ink);
}

.ca-gv-tag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--muted);
}

.ca-gv-tag--start {
  fill: var(--ink-2);
}

.ca-gv-tag--bad {
  fill: var(--coral);
}

.ca-gv-legend {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-gv-row {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: baseline;
  gap: 2px 8px;
  min-width: 0;
}

.ca-gv-chip {
  grid-row: 1 / 3;
  align-self: center;
  width: 12px;
  height: 4px;
  border-radius: 999px;
}

.ca-gv-row--ok .ca-gv-chip {
  background: var(--accent);
}

.ca-gv-row--ref .ca-gv-chip {
  background: var(--blue);
}

.ca-gv-row--bad .ca-gv-chip {
  background: var(--coral);
}

.ca-gv-name {
  grid-column: 2;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.03em;
}

.ca-gv-row--ok .ca-gv-name {
  color: var(--accent);
}

.ca-gv-row--ref .ca-gv-name {
  color: var(--blue);
}

.ca-gv-row--bad .ca-gv-name {
  color: var(--coral);
}

.ca-gv-nums {
  grid-column: 2;
  min-width: 0;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-gv-nums b,
.ca-gv-note b {
  color: var(--ink);
  font-weight: 680;
}

.ca-gv-note {
  grid-column: 1 / -1;
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (max-width: 560px) {
  .ca-gv-nums {
    font-size: 11px;
  }
}
</style>
