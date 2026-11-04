<script setup lang="ts">
// 退火、遗传、群智各自的脾气：在同一片举例地形上真的跑一遍。
// 没有随机库、没有读时间——固定种子的线性同余发生器，SSR 与客户端逐字节一致。
// 地形、种子、参数全是举例，结论不能外推成"某种方法更强"。

const MOD = 2147483648
const nextRaw = (s: number) => ((Math.imul(s, 1103515245) + 12345) >>> 0) % MOD
const makeRng = (seed: number) => {
  let s = seed
  return () => {
    s = nextRaw(s)
    return s / MOD
  }
}

const XMAX = 108
const UNIT = 6
// 四个坑：[坑底在第几格, 坑深×10]。全局最低在第 7 格，第一个碰到的坑在第 3 格。
const PITS: [number, number][] = [
  [3, 12],
  [7, 5],
  [12, 16],
  [16, 10]
]
const TRAP_K = 0
const BEST_K = 1
const SLOPE = 8
const pitX = (k: number) => PITS[k][0] * UNIT
const f = (x: number) =>
  Math.min(...PITS.map(([c, d], k) => d / 10 + Math.abs(x - pitX(k)) / SLOPE))
const round2 = (v: number) => Math.round(v * 100) / 100

type Run = { name: string; x: number; y: number; evals: number; tone: string; note: string }

// 1) 参照：爬山，只接受更好的邻居，走到走不动就停
const climb = (x0: number) => {
  let evals = 0
  let x = x0
  let cur = f(x0)
  evals++
  let moved = true
  while (moved) {
    moved = false
    for (const d of [-2, 2, -1, 1]) {
      const v = f(x + d)
      evals++
      if (v < cur) {
        x += d
        cur = v
        moved = true
      }
    }
  }
  return { x, y: cur, evals }
}

// 2) 退火：按 Metropolis 准则偶尔接受更差的解，降温表用常见的几何降温
const COOL = 95
const STEPS = 120
const ANNEAL_SEEDS = [7, 21, 99]
const anneal = (seed: number) => {
  const rnd = makeRng(seed)
  let x = 3
  let cur = f(3)
  let evals = 1
  let worse = 0
  let T = 20
  const path: { x: number; y: number }[] = [{ x, y: cur }]
  for (let i = 0; i < STEPS; i++) {
    T = (T * COOL) / 100
    const maxJump = 1 + Math.round(T)
    let nx = x
    while (nx === x) {
      const jump = (Math.floor(rnd() * maxJump) + 1) * (rnd() < 0.5 ? -1 : 1)
      nx = Math.max(0, Math.min(XMAX, x + jump))
    }
    const v = f(nx)
    evals++
    const dv = v - cur
    if (dv < 0 || rnd() < Math.exp(-dv / T)) {
      if (dv > 0) worse++
      x = nx
      cur = v
      path.push({ x, y: cur })
    }
  }
  return { x, y: cur, evals, worse, visited: path.length, dots: path }
}

// 3) 遗传：留精英 + 双亲平均 + 偶尔变异
const POP = 16
const GENS = 10
const ga = (seed: number) => {
  const rnd = makeRng(seed)
  let gen: number[] = []
  for (let i = 0; i < POP; i++) gen.push(Math.round(rnd() * XMAX))
  const scored = () => gen.map((x) => ({ x, y: f(x) })).sort((a, b) => a.y - b.y)
  for (let g = 0; g < GENS; g++) {
    const s = scored()
    const next = s.slice(0, 3).map((o) => o.x)
    while (next.length < POP) {
      const a = s[Math.floor(rnd() * 6)].x
      const b = s[Math.floor(rnd() * 6)].x
      let child = Math.round((a + b) / 2)
      if (rnd() * 10 < 4) {
        const m = (Math.floor(rnd() * 8) + 1) * (rnd() < 0.5 ? -1 : 1)
        child = Math.max(0, Math.min(XMAX, child + m))
      }
      next.push(child)
    }
    gen = next
  }
  const s = scored()
  return { x: s[0].x, y: s[0].y, evals: POP * GENS, whole: s.map((o) => o.x) }
}

// 4) 群智（PSO）：每只记住自己最好的、再朝全场最好的挪
const NB = 10
const ITER = 40
const pso = (seed: number) => {
  const rnd = makeRng(seed)
  const ps = []
  for (let i = 0; i < NB; i++) {
    const x = rnd() * XMAX
    ps.push({ x, v: 0, bx: x, by: f(x) })
  }
  let evals = NB
  const lead = ps.reduce((a, b) => (a.by < b.by ? a : b))
  const g = { x: lead.bx, y: lead.by }
  for (let t = 0; t < ITER; t++) {
    for (const p of ps) {
      p.v =
        (9 * p.v) / 10 + (15 * rnd() * (p.bx - p.x)) / 10 + (15 * rnd() * (g.x - p.x)) / 10
      p.x = Math.max(0, Math.min(XMAX, p.x + p.v))
      const y = f(p.x)
      evals++
      if (y < p.by) {
        p.by = y
        p.bx = p.x
      }
      if (p.by < g.y) {
        g.x = p.bx
        g.y = p.by
      }
    }
  }
  const tally: Record<number, number> = {}
  for (const p of ps) {
    const k = Math.round(p.bx)
    tally[k] = (tally[k] || 0) + 1
  }
  let crowd = 1
  let where = Math.round(g.x)
  for (const k of Object.keys(tally)) {
    if (tally[Number(k)] > crowd) {
      crowd = tally[Number(k)]
      where = Number(k)
    }
  }
  return { x: round2(g.x), y: round2(g.y), evals, crowd, where }
}

const CLIMB = climb(3)
const ANNEAL = ANNEAL_SEEDS.map(anneal)
const GA = ga(11)
const PSO = pso(5)
const TRAP = f(pitX(TRAP_K))
const BEST = f(pitX(BEST_K))
const BASIN = UNIT
const ESCAPED = ANNEAL.filter((a) => Math.abs(a.x - pitX(BEST_K)) <= BASIN).length

const MARKS: Run[] = [
  { name: '爬山（参照）', x: CLIMB.x, y: round2(CLIMB.y), evals: CLIMB.evals, tone: 'ref', note: '走到不动就停' },
  { name: `退火·种子${ANNEAL_SEEDS[0]}`, x: ANNEAL[0].x, y: round2(ANNEAL[0].y), evals: ANNEAL[0].evals, tone: 'algo', note: `接受过 ${ANNEAL[0].worse} 次更差的解` },
  { name: `退火·种子${ANNEAL_SEEDS[1]}`, x: ANNEAL[1].x, y: round2(ANNEAL[1].y), evals: ANNEAL[1].evals, tone: 'algo', note: `接受过 ${ANNEAL[1].worse} 次更差的解` },
  { name: `退火·种子${ANNEAL_SEEDS[2]}`, x: ANNEAL[2].x, y: round2(ANNEAL[2].y), evals: ANNEAL[2].evals, tone: 'algo', note: `接受过 ${ANNEAL[2].worse} 次更差的解` },
  { name: '遗传', x: GA.x, y: round2(GA.y), evals: GA.evals, tone: 'algo', note: `一代 ${POP} 个候选` },
  { name: '群智', x: PSO.x, y: round2(PSO.y), evals: PSO.evals, tone: 'algo', note: `${PSO.crowd}/${NB} 只挤在同一个位置` }
]

// —— 画布几何 ——
const OX = 16
const TOP = 22
const SCALE = 28 // 每单位函数值的像素高度
const VMAX = 4 // 纵轴顶端对应的函数值
const PLOT = XMAX
const W = 444
const H = 168
const px = (x: number) => Math.round((OX + (x / PLOT) * (W - OX * 2)) * 10) / 10
const py = (v: number) => Math.round((TOP + (VMAX - v) * SCALE) * 10) / 10

const CURVE = []
for (let x = 0; x <= XMAX; x++) CURVE.push(`${px(x)},${py(f(x))}`)
const CURVE_POINTS = CURVE.join(' ')

const DOTS = ANNEAL.flatMap((a) =>
  a.dots.filter((d) => d.y > TRAP).map((d) => ({ x: px(d.x), y: py(d.y) }))
)

const MARK_XY = MARKS.map((m, i) => ({
  ...m,
  cx: Math.round(px(m.x) + (i - (MARKS.length - 1) / 2) * 3.5),
  cy: py(m.y)
}))
const TRAP_X = px(pitX(TRAP_K))
const BEST_X = px(pitX(BEST_K))

const Y_MAX = Math.max(...MARKS.map((m) => m.y))
const VALS = MARKS.map((m) => ({
  ...m,
  pct: Math.max(6, Math.round((m.y / Y_MAX) * 100)),
  tone:
    m.tone === 'ref'
      ? 'ref'
      : m.y >= TRAP
        ? 'cost'
        : m.y <= round2(BEST) + 0.1
          ? 'accent'
          : 'ref'
}))
const COST_MAX = Math.max(...MARKS.map((m) => m.evals))
const COSTS = MARKS.map((m) => ({
  name: m.name,
  evals: m.evals,
  note: m.note,
  pct: Math.max(6, Math.round((m.evals / COST_MAX) * 100))
}))
</script>

<template>
  <div class="ca-try-smarter ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Metaheuristics · 三种聪明地试</span>
      <p class="ca-widget-sub">同一片地形、同一套评估次数上限：区别只在于它们允许自己"暂时变差"到什么程度。</p>
    </div>

    <figure class="ca-try-smarter-fig">
      <svg
        class="ca-try-smarter-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-try-smarter-tag" :x="W - OX" :y="12">举例地形 · 站内现跑</text>
        <text class="ca-try-smarter-axis" :x="OX" :y="12">函数值：越低越好</text>

        <line class="ca-try-smarter-guide" :x1="BEST_X" :y1="TOP" :x2="BEST_X" :y2="H - 26" />
        <line class="ca-try-smarter-guide is-trap" :x1="TRAP_X" :y1="TOP" :x2="TRAP_X" :y2="H - 26" />
        <text class="ca-try-smarter-lab" :x="TRAP_X" :y="34" text-anchor="middle">第一个坑</text>
        <text class="ca-try-smarter-lab is-best" :x="BEST_X" :y="46" text-anchor="middle">全局最低</text>

        <polyline class="ca-try-smarter-terrain" :points="CURVE_POINTS" />
        <circle v-for="(d, i) in DOTS" :key="`d-${i}`" class="ca-try-smarter-dot" :cx="d.x" :cy="d.y" r="1.3" />
        <g v-for="(m, i) in MARK_XY" :key="`m-${i}`" class="ca-try-smarter-marks">
          <circle class="ca-try-smarter-mark" :class="`is-${m.tone}`" :cx="m.cx" :cy="m.cy" r="3.6" />
        </g>
      </svg>

      <span class="sr-only">
        举例的一维地形有四个坑，最低点在横坐标 {{ pitX(BEST_K) }}（函数值 {{ BEST }}），路上第一个碰到的坑在横坐标
        {{ pitX(TRAP_K) }}（函数值 {{ TRAP }}）。爬山从横坐标 3 出发，用了 {{ CLIMB.evals }} 次评估，停在
        {{ CLIMB.x }}、函数值 {{ round2(CLIMB.y) }}——正好是第一个坑。
        退火跑三颗种子：种子 {{ ANNEAL_SEEDS[0] }} 落在 {{ ANNEAL[0].x }}（函数值 {{ round2(ANNEAL[0].y) }}，
        接受过 {{ ANNEAL[0].worse }} 次更差的解）；种子 {{ ANNEAL_SEEDS[1] }} 落在 {{ ANNEAL[1].x }}（
        {{ round2(ANNEAL[1].y) }}，{{ ANNEAL[1].worse }} 次）；种子 {{ ANNEAL_SEEDS[2] }} 落在 {{ ANNEAL[2].x }}（
        {{ round2(ANNEAL[2].y) }}，{{ ANNEAL[2].worse }} 次）——这一颗没能跳出第一个坑。三颗各用
        {{ ANNEAL[0].evals }} 次评估，其中 {{ ESCAPED }} 颗落到了最低点那一带。
        遗传用 {{ GA.evals }} 次评估（{{ POP }} 个候选跑 {{ GENS }} 代）落在 {{ GA.x }}、函数值 {{ round2(GA.y) }}；
        群智（PSO）用 {{ PSO.evals }} 次评估落在 {{ PSO.x }}、函数值 {{ round2(PSO.y) }}，
        {{ NB }} 只里有 {{ PSO.crowd }} 只最后挤在横坐标 {{ PSO.where }} 同一个位置。
        地形、种子与参数全是举例，这些次数和落点不构成方法之间的排名。
      </span>
    </figure>

    <div class="ca-try-smarter-groups">
      <div class="ca-try-smarter-group">
        <p class="ca-try-smarter-glab">最后落在多少（函数值，红=还在坑里）</p>
        <p v-for="v in VALS" :key="`v-${v.name}`" class="ca-try-smarter-row">
          <span class="ca-try-smarter-rowlab" :class="`is-${v.tone}`">{{ v.name }}</span>
          <span class="ca-try-smarter-track">
            <span class="ca-try-smarter-fill" :class="`is-${v.tone}`" :style="{ width: `${v.pct}%` }"></span>
          </span>
          <span class="ca-try-smarter-rowval">{{ v.y }}</span>
        </p>
      </div>
      <div class="ca-try-smarter-group">
        <p class="ca-try-smarter-glab">花掉多少次评估（只是开销，不含好坏）</p>
        <p v-for="c in COSTS" :key="`c-${c.name}`" class="ca-try-smarter-row">
          <span class="ca-try-smarter-rowlab">{{ c.name }}</span>
          <span class="ca-try-smarter-track">
            <span class="ca-try-smarter-fill is-blue" :style="{ width: `${c.pct}%` }"></span>
          </span>
          <span class="ca-try-smarter-rowval">{{ c.evals }}</span>
        </p>
      </div>
    </div>

    <p class="ca-try-smarter-note">
      同一套退火代码、同一个起点，只换种子：三颗里有 <b>{{ ESCAPED }}</b> 颗跳出第一个坑、走到最低点
      <b>{{ pitX(BEST_K) }}</b> 那一侧，第三颗（种子 <b>{{ ANNEAL_SEEDS[2] }}</b>）停在
      <b>{{ ANNEAL[2].x }}</b>、函数值 <b>{{ round2(ANNEAL[2].y) }}</b>，比第一个坑还浅一点。
      每颗都花 <b>{{ ANNEAL[0].evals }}</b> 次评估，其中约 <b>{{ ANNEAL[0].worse }}</b> 次是"明知更差还接受"——
      这份本钱让它有机会翻过坑边的棱，但也可能只是在坑里多绕几步。图上那些红点，就是三趟退火走过的、
      比第一个坑更差的位置；青点是各家最后的落点，蓝点是爬山的参照落点（同一位置的几个青点做了错位，免得压在一起）。
      <b>这些都是搜索方法，不是定理，不许排名：</b>换一片地形、换一套参数，名次就会重排（下面第一段是这件事的正式版本）。
    </p>

    <div class="ca-try-smarter-facts">
      <p class="ca-try-smarter-fact">
        <b>"没有万能算法"是有定理的。</b>无免费午餐（Wolpert 与 Macready，圣塔菲研究所工作区报告
        SFI 95-02-014，1995 年；期刊版 1997 年）的前提是<b>对所有可能的函数取平均</b>：那时候任何算法的期望表现一样。
        它说的是"别指望一把钥匙开所有锁"，<b>不等于"这些方法没用"</b>——现实中的问题地形有结构，有结构就有偏好。
        选哪一种，看的是问题结构：解能不能编码成串、评估贵不贵、局部移动自不自然。
      </p>
      <p class="ca-try-smarter-fact">
        <b>退火的来历与限度。</b>Kirkpatrick、Gelatt 与 Vecchi 1983 年把它写进 Science（220(4598): 671–680），
        判据借自 Metropolis 等人 1953 年的统计力学方法；理论上"降温足够慢"才谈得上以概率收敛，
        Hajek 1988 给出的是对数式降温表——工程里几乎不用，因为太慢。所以站内<b>不写"保证找到全局最优"</b>。
        上面那条几何降温曲线是举例，真做退火时降温表、初始温度、邻域大小都要调。
      </p>
      <p class="ca-try-smarter-fact">
        <b>遗传与群智不是自然界的说明书。</b>遗传算法的框架来自 Holland 1975 年的研究，工程化普及靠 Goldberg 1989
        年的教材；它的"收敛"定义比退火的那套更弱。粒子群来自 Kennedy 与 Eberhart 1995 年（IEEE International
        Conference on Neural Networks）：每只粒子记住自己去过的最好位置、再朝全场最好的位置挪，
        "鸟群觅食"只是隐喻，真实鸟群并没有这种全局信息；它对惯性权重和两个学习因子很敏感，也<b>不保证最优</b>。
        同族的蚁群（Dorigo 1992 年博士论文，1996 年 IEEE Trans. Systems, Man, and Cybernetics B 26(1)）靠信息素正反馈，
        真实蚂蚁靠的是改变环境来间接沟通（stigmergy），蚁群算法收敛慢、同样不保证最优。
        这张图里 <b>{{ PSO.crowd }}/{{ NB }}</b> 只挤在同一格，就是"群体智慧"最容易出的毛病：早熟收敛。
      </p>
      <p class="ca-try-smarter-fact">
        <b>什么时候根本不该用它们。</b>如果问题能被写成整数规划、或者规模小到能穷举，就别让启发式来碰运气。
        更大的背景是 P 与 NP：千禧年七大数学问题之一（Clay 数学研究所的官方表述），至今未解——Karp 1972
        年列出了 <b>21 个</b> NP 难问题，把"这批问题都不容易"变成了系统性结论。
        <b>奖金金额这里不印</b>（没抓到一手出处，不写进图表）。手工小规模的真值表另有笨办法：卡诺图一般只到
        4–6 个变量，人眼就够用。
      </p>
    </div>

    <p class="ca-cap">
      一片四个坑的举例地形，四种试法各跑一遍：爬山 <b>{{ CLIMB.evals }}</b> 次评估停在第一个坑
      <b>{{ CLIMB.x }}</b>（函数值 <b>{{ round2(CLIMB.y) }}</b>）；退火同样 <b>{{ ANNEAL[0].evals }}</b> 次、
      其中 <b>{{ ANNEAL[0].worse }}</b> 次接受更差的解，三颗种子有 <b>{{ ESCAPED }}</b> 颗走到全局最低
      <b>{{ BEST }}</b> 所在的 <b>{{ pitX(BEST_K) }}</b> 一带、一颗仍停在坑里；遗传 <b>{{ GA.evals }}</b> 次落在
      <b>{{ GA.x }}</b>（<b>{{ round2(GA.y) }}</b>）；群智 <b>{{ PSO.evals }}</b>
      次落在 <b>{{ PSO.x }}</b>，代价是 <b>{{ PSO.crowd }}/{{ NB }}</b> 只挤在同一个位置。<b>地形、种子、参数全是举例</b>，
      这些次数与落点不能当成方法之间的排名。
    </p>
  </div>
</template>

<style scoped>
.ca-try-smarter {
  max-width: 640px;
  margin-inline: auto;
}

.ca-try-smarter-fig {
  margin: 0;
}

.ca-try-smarter-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-try-smarter-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-try-smarter-axis {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-try-smarter-terrain {
  fill: none;
  stroke: var(--line-strong);
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.ca-try-smarter-guide {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  stroke-opacity: 0.6;
}

.ca-try-smarter-guide.is-trap {
  stroke: var(--coral);
}

.ca-try-smarter-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--coral);
}

.ca-try-smarter-lab.is-best {
  fill: var(--accent);
}

.ca-try-smarter-dot {
  fill: var(--coral);
  opacity: 0.45;
}

.ca-try-smarter-mark {
  stroke: var(--panel);
  stroke-width: 1;
}

.ca-try-smarter-mark.is-ref {
  fill: var(--blue);
}

.ca-try-smarter-mark.is-algo {
  fill: var(--accent);
}

.ca-try-smarter-marks {
  animation: ca-try-smarter-in 0.8s var(--ease) both;
}

@keyframes ca-try-smarter-in {
  from {
    opacity: 0;
  }
}

.ca-try-smarter-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 14px 20px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-try-smarter-group {
  min-width: 0;
}

.ca-try-smarter-glab {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-try-smarter-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px;
  align-items: center;
  gap: 3px 8px;
  margin: 0 0 8px;
  min-width: 0;
}

.ca-try-smarter-rowlab {
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-try-smarter-rowlab.is-accent {
  color: var(--accent);
}

.ca-try-smarter-rowlab.is-cost {
  color: var(--coral);
}

.ca-try-smarter-rowlab.is-ref {
  color: var(--blue);
}

.ca-try-smarter-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-try-smarter-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-try-smarter-fill.is-accent {
  background: var(--accent);
}

.ca-try-smarter-fill.is-cost {
  background: var(--coral);
}

.ca-try-smarter-fill.is-ref {
  background: var(--blue);
}

.ca-try-smarter-fill.is-blue {
  background: var(--blue);
  opacity: 0.6;
}

.ca-try-smarter-rowval {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-try-smarter-note,
.ca-try-smarter-fact {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-try-smarter-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-try-smarter-facts {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-try-smarter-note b,
.ca-try-smarter-fact b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 700px) {
  .ca-try-smarter-groups {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-try-smarter-marks {
    animation: none;
  }
}
</style>
