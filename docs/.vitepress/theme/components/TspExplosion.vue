<script setup lang="ts">
// 旅行商问题：n 座城市、每条路都走一遍再回到起点，一共有多少种走法？
// 公式 (n−1)!/2（固定起点、把顺逆时针看成同一条）——这是 I-65／P-92 那三条可自证的数字。
// 曲线与倍数都是组件当场用 BigInt 按公式算出来的（按公式计算，不是实测）；
// "每秒能扫 10⁹ 条"是画来当尺子的假设，不是任何机器的实测速度。

const N_MIN = 4
const N_MAX = 20
const STEP = 2

const fact = (k: number) => {
  let r = 1n
  for (let i = 2n; i <= BigInt(k); i++) r *= i
  return r
}
// 走法数：(n−1)!/2
const tours = (n: number) => fact(n - 1) / 2n
// Held–Karp 动态规划要记的状态数：n²·2ⁿ（I-66／P-46）
const hk = (n: number) => n * n * 2 ** n

const log10 = (v: number) => Math.log10(v)
const SERIES = [] as { n: number; tours: number; toursLog: number; hkLog: number }[]
for (let n = N_MIN; n <= N_MAX; n += STEP) {
  const t = Number(tours(n))
  SERIES.push({ n, tours: t, toursLog: log10(t), hkLog: log10(hk(n)) })
}

const fmt = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const SUP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
}
const sci = (e: number) => `10${String(e).split('').map((c) => SUP[c] ?? c).join('')}`

// 秒→年只是单位换算（是换算关系，不是任何数据）
const HOUR_SECONDS = 3600
const DAY_SECONDS = 24 * HOUR_SECONDS
const YEAR_SECONDS = 365 * DAY_SECONDS

type Key = { n: number; exact: string; dur: string }
const RATE = 10 ** 9 // 假设的算力尺子：每秒 10 亿条走法（举例，不是实测）
const KEYS: Key[] = [10, 15, 20].map((n) => {
  const seconds = Number(tours(n)) / RATE
  let dur: string
  if (seconds < 1) dur = `${(seconds * 1000).toFixed(2)} 毫秒`
  else if (seconds < 60) dur = `${seconds.toFixed(1)} 秒`
  else if (seconds < HOUR_SECONDS) dur = `${Math.round(seconds / 60)} 分钟`
  else if (seconds < DAY_SECONDS) dur = `${Math.round(seconds / HOUR_SECONDS)} 小时`
  else dur = `${(seconds / YEAR_SECONDS).toFixed(2)} 年`
  return { n, exact: fmt(tours(n).toString()), dur }
})

// 10 城 → 20 城多出来的数量级（纯算式）
const DECADE_JUMP = Math.round((log10(Number(tours(20))) - log10(Number(tours(10)))) * 10) / 10
// 动态规划把 20 城的账压掉几个数量级（I-66 写的是"约 8 个数量级"）
const HK_20 = hk(20)
const HK_SAVED = Math.round((log10(Number(tours(20))) - log10(HK_20)) * 10) / 10

// —— 图形几何：全部在 viewBox 里算完 ——
const W = 460
const PAD_L = 14
const X0 = 60
const X1 = 438
const Y_TOP = 42
const Y_BASE = 208
const DECADE_MAX = 18
const Y_UNIT = (Y_BASE - Y_TOP) / DECADE_MAX
const PITCH = (X1 - X0) / (N_MAX - N_MIN)
const H = 246
const RATE_LOG = 9
const xFor = (n: number) => Math.round((X0 + (n - N_MIN) * PITCH) * 10) / 10
const yFor = (lv: number) => Math.round((Y_BASE - lv * Y_UNIT) * 10) / 10
const linePath = (get: (p: (typeof SERIES)[number]) => number) =>
  SERIES.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.n)} ${yFor(get(p))}`).join(' ')
const TOURS_PATH = linePath((p) => p.toursLog)
const HK_PATH = linePath((p) => p.hkLog)
const GRID_LEVELS = [0, 3, 6, 9, 12, 15, 18]
const MARKS = [10, 15, 20].map((n) => {
  const end = n === N_MAX
  return {
    n,
    x: xFor(n),
    y: yFor(log10(Number(tours(n)))),
    labelX: end ? xFor(n) + 10 : xFor(n),
    end
  }
})
const LAST_HK_Y = yFor(SERIES[SERIES.length - 1].hkLog)
</script>

<template>
  <div class="ca-tsp-explosion ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">TSP Blow-up · 城市一加，走法炸开</span>
      <p class="ca-widget-sub">从 10 座城加到 20 座城，"把所有走法数一遍"这件事要从几毫秒变成快两年——纵轴是数量级。</p>
    </div>

    <figure class="ca-tsp-fig">
      <svg
        class="ca-tsp-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-tsp-lab" :x="PAD_L" :y="16">纵轴：走法数（每格 1000 倍）</text>
        <text class="ca-tsp-lab is-end" :x="452" :y="16">横轴：城市数</text>

        <g v-for="lv in GRID_LEVELS" :key="`g-${lv}`">
          <line class="ca-tsp-grid" :x1="X0" :y1="yFor(lv)" :x2="X1" :y2="yFor(lv)" />
          <text class="ca-tsp-tick" :x="X0 - 6" :y="yFor(lv) + 3">{{ lv === 0 ? '1' : sci(lv) }}</text>
        </g>
        <line class="ca-tsp-axis" :x1="X0" :y1="Y_BASE" :x2="X1" :y2="Y_BASE" />

        <line class="ca-tsp-rate" :x1="X0" :y1="yFor(RATE_LOG)" :x2="X1" :y2="yFor(RATE_LOG)" />
        <text class="ca-tsp-rtatelab" :x="X0 + 4" :y="yFor(RATE_LOG) - 4">参照 {{ sci(RATE_LOG) }} 条：假设一秒扫完</text>

        <path class="ca-tsp-tours" :d="TOURS_PATH" />
        <path class="ca-tsp-hk" :d="HK_PATH" />

        <g v-for="m in MARKS" :key="`m-${m.n}`">
          <line class="ca-tsp-lead" :x1="m.x" :y1="m.y" :x2="m.x" :y2="Y_BASE" />
          <circle class="ca-tsp-dot" :cx="m.x" :cy="m.y" r="4" />
          <text class="ca-tsp-mlabel" :class="m.end ? 'is-end' : ''" :x="m.labelX" :y="Y_BASE + 15">{{ m.n }} 城</text>
        </g>
        <text class="ca-tsp-mlabel is-coral is-end" :x="452" :y="yFor(DECADE_MAX) - 4">全部走法</text>
        <text class="ca-tsp-mlabel is-accent is-end" :x="452" :y="LAST_HK_Y + 16">动态规划的状态数</text>
      </svg>

      <span class="sr-only">
        纵轴是走法数的数量级，从 10 的 0 次到 10 的 18 次，每上一格就是一千倍；横轴是城市数，从
        {{ N_MIN }} 座到 {{ N_MAX }} 座。红线是把所有走法一条条数完的量，按公式 (n−1)!/2 算；
        青线是聪明一点的做法（Held–Karp 动态规划）要记的状态数，按 n²·2ⁿ 算。
        三个能报出整数的点：10 座城市共 {{ KEYS[0].exact }} 种走法；15 座城市共 {{ KEYS[1].exact }} 种；
        20 座城市共 {{ KEYS[2].exact }} 种，约 6.1×10 的 16 次方。从 10 城到 20 城多出约
        {{ DECADE_JUMP }} 个数量级。
        拿"每秒能扫 10 亿条"这把假设的尺子量一下：10 城只要 {{ KEYS[0].dur }}，15 城要
        {{ KEYS[1].dur }}，20 城要 {{ KEYS[2].dur }}——这是纯算术换算，那个速度是假设，不是任何机器的实测。
        同样按公式：20 城用动态规划只要记 {{ fmt(String(HK_20)) }} 个状态，比全枚举少约
        {{ HK_SAVED }} 个数量级，但指数没被消掉——城市加到 100 座时 2 的 100 次方约 1.3×10 的 30 次方，还是宇宙尺度。
        人类真正精确解过、并且给出可验证证书的最大实例是 85,900 座城市（2009 年论文），
        第三方综述给的机时口径是墙钟约 568.9 小时、等效超过 136 个 CPU 年；再往前，1954 年解掉的是 49 座城。
        至于"52 座城只花了几分钟"，是跟上面机时口径冲突的流传段子，站内不印。
      </span>
    </figure>

    <div class="ca-tsp-legend">
      <span class="ca-tsp-lg"><i class="is-tours"></i>红＝所有走法 (n−1)!/2：这条路数不完</span>
      <span class="ca-tsp-lg"><i class="is-hk"></i>青＝Held–Karp 的状态数 n²·2ⁿ：少很多，但还是指数</span>
      <span class="ca-tsp-lg"><i class="is-rate"></i>蓝＝参照线 10⁹ 条（算力是假设的尺子）</span>
    </div>

    <div class="ca-tsp-rows">
      <div v-for="k in KEYS" :key="`r-${k.n}`" class="ca-tsp-row">
        <span class="ca-tsp-n">{{ k.n }} 座城</span>
        <span class="ca-tsp-time">{{ k.dur }}</span>
        <span class="ca-tsp-track">
          <span class="ca-tsp-fill" :style="{ width: `${(k.n / N_MAX) * 100}%` }"></span>
        </span>
        <span class="ca-tsp-exact">共 <b>{{ k.exact }}</b> 种走法（按公式 (n−1)!/2 算，可自证）</span>
      </div>
      <p class="ca-tsp-hint">
        条长只表示"城市数"——真要按时间画，红条会一路冲出画布。时间那一栏是把
        <b>每秒 10 亿条</b>当尺子的纯算术换算：<b>那个速度是假设，不是实测</b>。真实求解没人这么数，
        靠的是剪枝加上"能证明下面不会再短"的下界。
      </p>
    </div>

    <div class="ca-tsp-cols">
      <div class="ca-tsp-block">
        <p class="ca-tsp-blockhead">聪明一点，能省多少</p>
        <ul class="ca-tsp-list">
          <li>
            <b>20 城：从 6.1×10¹⁶ 条到约 4.19×10⁸ 个状态</b>
            <span>
              Held–Karp 动态规划（两人提出通常记为 1962 年）复杂度 O(n²·2ⁿ)，把要记的东西少了约
              <b>{{ HK_SAVED }} 个数量级</b>。但"指数被压小"不等于"能算了"（I-66／P-46）。
            </span>
          </li>
          <li>
            <b>加到 100 城呢</b>
            <span>
              2¹⁰⁰ ≈ 1.3×10³⁰——还是宇宙尺度的数。<b>这条曲线没有"再等等就跑得完"的尽头</b>，
              只有"换个问法"（近似、启发式、限定时间给个够好的解）。
            </span>
          </li>
          <li>
            <b>为什么是 (n−1)!/2，不是 n!</b>
            <span>
              固定起点省掉 n 倍，把顺时针与逆时针看成同一条再省 2 倍。<b>方向合并与否差一倍</b>，
              所以站内印这类数一定要说清用的是哪个口径（I-65／P-92）。
            </span>
          </li>
          <li>
            <b>网上流传的另一个"15 城"数字</b>
            <span>
              中文资料里常见的某个 15 城走法数，用阶乘公式复现不出来（14!/2 才是 43,589,145,600）。
              对不上的数<b>站内一个都不印</b>（I-65／P-92 的限定语）。
            </span>
          </li>
        </ul>
      </div>

      <div class="ca-tsp-block">
        <p class="ca-tsp-blockhead">人类真的解过多大</p>
        <ul class="ca-tsp-list is-human">
          <li>
            <b>1954 年 · 49 座城</b>
            <span>
              Dantzig、Fulkerson 与 Johnson 给出的 49 城解（Operations Research 2: 393–410），
              后来被当成精确求解的里程碑（I-73）。
            </span>
          </li>
          <li>
            <b>2009 年 · 85,900 座城</b>
            <span>
              Applegate 等人发表"85,900 城最优环游路的证书"（Oper. Res. Lett. 37: 11–15）——
              不只是算出答案，还给出<b>可让别人验证最优</b>的证书（I-72）。
            </span>
          </li>
          <li>
            <b>花了多久</b>
            <span>
              第三方综述的机时口径：墙钟约 <b>568.9 小时</b>，等效超过 <b>136 个 CPU 年</b>。
              这是<b>综述转述、不是论文正文的一手数</b>；证书行数本轮查不到一手，站内不印（I-72）。
            </span>
          </li>
          <li>
            <b>"52 座城只花了几分钟"</b>
            <span>
              流传段子，与上面的机时口径互相冲突，查不到一手出处——<b>删掉，不印</b>（I-73）。
            </span>
          </li>
        </ul>
      </div>
    </div>

    <p class="ca-cap">
      同一道"走完再回家"的题，<b>10</b> 座城有 <b>{{ KEYS[0].exact }}</b> 种走法，<b>20</b> 座城就有
      <b>{{ KEYS[2].exact }}</b> 种——城市数只翻一倍，走法数多出约 <b>{{ DECADE_JUMP }}</b> 个数量级；
      拿"每秒 10 亿条"这把<b>假设的尺子</b>量，就是 {{ KEYS[0].dur }} 与 {{ KEYS[2].dur }} 的差距。
      动态规划能把 20 城的账压到约 <b>4.19×10⁸</b> 个状态（少约 <b>{{ HK_SAVED }}</b> 个数量级），
      但压不掉指数本身。人类真正精确解过并给出可验证证书的最大实例是 <b>85,900</b> 座城（2009 年），
      第三方综述给的机时是墙钟约 <b>568.9</b> 小时、等效超过 <b>136</b> 个 CPU 年——
      那靠的不是"数得更快"，而是<b>一路剪枝加上能验证的下界</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-tsp-explosion {
  max-width: 560px;
  margin-inline: auto;
}

.ca-tsp-fig {
  margin: 0;
  min-width: 0;
}

.ca-tsp-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-tsp-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.02em;
  fill: var(--muted);
  text-anchor: start;
}

.ca-tsp-lab.is-end {
  text-anchor: end;
}

.ca-tsp-tick {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-tsp-mlabel {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-tsp-mlabel.is-end {
  text-anchor: end;
}

.ca-tsp-mlabel.is-coral {
  fill: var(--coral);
}

.ca-tsp-mlabel.is-accent {
  fill: var(--accent);
}

.ca-tsp-rtatelab {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--blue);
  text-anchor: start;
}

.ca-tsp-grid {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-tsp-axis {
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-tsp-rate {
  stroke: var(--blue);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
}

.ca-tsp-tours {
  fill: none;
  stroke: var(--coral);
  stroke-width: 2.4;
  stroke-linejoin: round;
}

.ca-tsp-hk {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.2;
  stroke-linejoin: round;
}

.ca-tsp-lead {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.ca-tsp-dot {
  fill: var(--coral);
  stroke: var(--panel);
  stroke-width: 1.2;
}

.ca-tsp-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 12px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--muted);
}

.ca-tsp-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-tsp-lg i {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  flex: none;
}

.ca-tsp-lg i.is-tours {
  background: var(--coral);
}

.ca-tsp-lg i.is-hk {
  background: var(--accent);
}

.ca-tsp-lg i.is-rate {
  background: var(--blue);
}

.ca-tsp-rows {
  display: grid;
  gap: 11px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-tsp-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  align-items: center;
  gap: 4px 8px;
  min-width: 0;
}

.ca-tsp-n {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-tsp-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--coral);
  text-align: right;
  min-width: 0;
}

.ca-tsp-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-tsp-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--coral);
  animation: ca-tsp-grow 1s var(--ease) both;
}

@keyframes ca-tsp-grow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
}

.ca-tsp-exact {
  grid-column: 1 / -1;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-tsp-exact b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-tsp-hint {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-tsp-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-tsp-block {
  min-width: 0;
}

.ca-tsp-blockhead {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-tsp-list {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-tsp-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-tsp-list.is-human li {
  border-left-color: var(--blue);
}

.ca-tsp-list b {
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-tsp-list span {
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (min-width: 760px) {
  .ca-tsp-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-tsp-fill {
    animation: none;
  }
}
</style>
