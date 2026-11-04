<script setup lang="ts">
// 掷骰子的算法凭什么靠得住：① 种子写死 → 服务端与客户端数出来一模一样；② 误差按 1/√N → 慢，但有账可算。
// 骰子是一颗线性同余"假骰子"（LCG），递推式取自事实库 P-63：下一条 =（上一条 × 乘数 + 增量）mod 模数。
// 图上那 600 次是本组件当场用固定种子跑出来的举例数据，不是任何统计口径下的实测。

const MOD = 2147483648
const MULT = 1103515245
const INC = 12345
const SEED = 7
const THROWS = 600
const STRIP = 24

// Math.imul 只取乘积低 32 位，避免双精度把高位抹掉：结果等价于上面那条公式
const nextRaw = (s: number) => ((Math.imul(s, MULT) + INC) >>> 0) % MOD

const VALUES: number[] = []
{
  let s = SEED
  for (let i = 0; i < THROWS; i++) {
    s = nextRaw(s)
    VALUES.push(s / MOD)
  }
}

const COUNTS = [0, 0, 0, 0, 0, 0]
for (const v of VALUES) COUNTS[Math.min(5, Math.floor(v * 6))] += 1

const EXPECT = THROWS / 6
const FACES = COUNTS.map((c, i) => {
  const dev = Math.round((c - EXPECT) * 10) / 10
  return { face: i + 1, count: c, dev, abs: Math.abs(dev) }
})
const WORST = FACES.reduce((a, f) => (f.abs > a.abs ? f : a), FACES[0])
const BEST = FACES.reduce((a, f) => (f.abs < a.abs ? f : a), FACES[0])
// 出现最少／最多的两面（用于"落在几到几次之间"这句话，别拿 BEST/WORST 当最小最大）
const LOWEST = FACES.reduce((a, f) => (f.count < a.count ? f : a), FACES[0])
const HIGHEST = FACES.reduce((a, f) => (f.count > a.count ? f : a), FACES[0])

// 上面那一排小竖线：同一个种子的头 24 个输出，画出来才知道它"看着就随机"
const TICKS = VALUES.slice(0, STRIP)

// —— 1/√N：误差只跟样本数的平方根成反比（P-45 / P-82 的口径，按公式计算，不是实测）——
const LADDER = [10 ** 2, 10 ** 4, 10 ** 6].map((n) => {
  const err = 100 / Math.sqrt(n)
  return {
    n,
    label: n >= 10 ** 6 ? '100 万个样本' : `${n} 个样本`,
    errText: `${err}%`,
    pct: Math.max(1, err)
  }
})

// —— 6/49 彩票的组合数：C(49,6)，纯整数递推，任何计算器都能复现（I-135）——
const PICK = 6
const POOL = 49
let combos = 1
for (let i = 0; i < PICK; i++) combos = (combos * (POOL - i)) / (i + 1)
const COMBOS = combos
const fmt = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// —— 图形几何：全部在 viewBox 里算完，窄屏只等比缩放 ——
const W = 460
const PAD_L = 14
const STRIP_X0 = 62
const STRIP_X1 = 442
const STRIP_Y = 46
const BAR_BASE = 170
const BAR_UNIT = 0.62
const BAR_W = 44
const BAR_PITCH = 62
const BAR_X0 = 60
const H = 202
const tickX = (v: number) => Math.round((STRIP_X0 + v * (STRIP_X1 - STRIP_X0)) * 10) / 10
const barX = (i: number) => BAR_X0 + i * BAR_PITCH
const barMid = (i: number) => BAR_X0 + i * BAR_PITCH + BAR_W / 2
const barTop = (count: number) => Math.round((BAR_BASE - count * BAR_UNIT) * 10) / 10
const EXPECT_Y = barTop(EXPECT)
</script>

<template>
  <div class="ca-dice-rolls ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Randomized Algorithms · 掷骰子凭什么算数</span>
      <p class="ca-widget-sub">故意掷骰子的算法不是碰运气：种子写死就次次相同，误差和概率都算得出账。</p>
    </div>

    <figure class="ca-dice-fig">
      <svg
        class="ca-dice-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-dice-lab" :x="PAD_L" :y="16">头 24 个输出：一串定死的小数</text>
        <line class="ca-dice-axis" :x1="STRIP_X0" :y1="STRIP_Y" :x2="STRIP_X1" :y2="STRIP_Y" />
        <line
          v-for="(v, i) in TICKS"
          :key="`tick-${i}`"
          class="ca-dice-tick"
          :x1="tickX(v)"
          :y1="STRIP_Y"
          :x2="tickX(v)"
          :y2="STRIP_Y - 22"
        />
        <text class="ca-dice-mini" :x="STRIP_X0" :y="STRIP_Y + 12">0</text>
        <text class="ca-dice-mini is-end" :x="STRIP_X1" :y="STRIP_Y + 12">1</text>

        <text class="ca-dice-lab is-accent" :x="PAD_L" :y="82">{{ THROWS }} 次投掷，每面各出了几次</text>
        <line class="ca-dice-ideal" :x1="42" :y1="EXPECT_Y" :x2="452" :y2="EXPECT_Y" />
        <text class="ca-dice-mini is-end is-blue" :x="452" :y="EXPECT_Y - 4">期望 {{ EXPECT }} 次</text>

        <g v-for="f in FACES" :key="`face-${f.face}`">
          <rect
            class="ca-dice-bar"
            :x="barX(f.face - 1)"
            :y="barTop(f.count)"
            :width="BAR_W"
            :height="BAR_BASE - barTop(f.count)"
            rx="3"
          />
          <line
            class="ca-dice-dev"
            :x1="barMid(f.face - 1)"
            :y1="EXPECT_Y"
            :x2="barMid(f.face - 1)"
            :y2="barTop(f.count)"
          />
          <text class="ca-dice-count" :x="barMid(f.face - 1)" :y="barTop(f.count) - 5">{{ f.count }}</text>
          <text class="ca-dice-face" :x="barMid(f.face - 1)" :y="BAR_BASE + 13">{{ f.face }} 点</text>
        </g>
        <line class="ca-dice-axis" :x1="42" :y1="BAR_BASE" :x2="452" :y2="BAR_BASE" />
        <text class="ca-dice-note" :x="PAD_L" :y="BAR_BASE + 28">固定种子 LCG：举例数据，非统计口径</text>
      </svg>

      <span class="sr-only">
        一颗写死种子的线性同余"假骰子"，投 {{ THROWS }} 次，六个面各出现的次数是：
        <template v-for="f in FACES" :key="`s-${f.face}`">{{ f.face }} 点 {{ f.count }} 次、</template>
        每个面理论上该出 {{ EXPECT }} 次（{{ THROWS }} 除以六）。离期望最远的是 {{ WORST.face }} 点，出了
        {{ WORST.count }} 次，偏 {{ WORST.dev }} 次；最贴线的是 {{ BEST.face }} 点，出了 {{ BEST.count }} 次。
        这 {{ THROWS }} 次是组件当场用固定种子跑出来的举例数据：换任何设备、任何一次构建，六个数都完全一样——
        这正是"伪随机"可以被复现的意思，也是它不能拿去做密钥的原因。图上半排小竖线是同一种子的头 24 个输出。
        下面的误差账：样本 100 个时误差量级约 {{ LADDER[0].errText }}，一万个时约 {{ LADDER[1].errText }}，
        一百万个时约 {{ LADDER[2].errText }}，按公式 1/√N 计算、不是实测——样本翻 100 倍，误差才减 10 倍。
        还算得清的一笔：6/49 型彩票要从 49 个号里选 6 个，一共 {{ fmt(COMBOS) }} 种组合，每注等可能，
        历史频率不改变下一期概率，期望回报为负。
      </span>
    </figure>

    <div class="ca-dice-legend">
      <span class="ca-dice-lg"><i class="is-bar"></i>实际出现次数（青）</span>
      <span class="ca-dice-lg"><i class="is-ideal"></i>期望线：每面 {{ EXPECT }} 次（蓝＝参照）</span>
      <span class="ca-dice-lg"><i class="is-dev"></i>偏离期望的那一截（红＝抽样噪声）</span>
    </div>

    <div class="ca-dice-cols">
      <div class="ca-dice-block">
        <p class="ca-dice-blockhead">这颗骰子是什么做的</p>
        <ul class="ca-dice-list">
          <li>
            <b>线性同余（LCG）</b>
            <span>
              下一条数 =（上一条 × 乘数 + 增量）对模数取余，图上用的就是 C/POSIX 常用的那组最小参数；Knuth 在
              《计算机程序设计的艺术》卷 2 给过推荐乘数。<b>它有可预测的结构，绝不能拿来生成密钥</b>（P-63）。
            </span>
          </li>
          <li>
            <b>Python／NumPy 的默认随机数</b>
            <span>
              是 Mersenne Twister（MT19937，Matsumoto 1998 年提出），周期长得夸张（约 6232 位的一个质数）。
              但"周期长"不等于"猜不到"：拿到约 624 个连续输出就能反推内部状态，所以它同样不是密码安全随机源（P-64）。
            </span>
          </li>
          <li>
            <b>随机化快排</b>
            <span>
              快排平均 O(n log n)、最坏 O(n²)。随机主元或三数取中只是把"最坏输入"变成概率极小，
              <b>并没有把它变成零</b>；工业实现（introsort，Musser 1997）还会在递归深度到 2·⌊log₂n⌋ 时切堆排序兜底（P-62）。
            </span>
          </li>
          <li>
            <b>模拟退火</b>
            <span>
              算法论文是 Kirkpatrick、Gelatt 与 Vecchi 1983 年发在 Science 上的，底下垫着 Metropolis 等 1953 年的蒙特卡洛采样。
              "退火"是个比喻：严格收敛结论要求极慢的对数降温表，工程上用的是快得多、也没有保证的降温表（P-52）。
            </span>
          </li>
          <li>
            <b>为什么点两下"重新计算"结果就变了</b>
            <span>
              K-Means 的 Lloyd 迭代每步让簇内平方和单调不增，所以它一定会停，但可能停在局部极小——工程上跑多次不同初始、
              取最好的那个。全局最优是 NP-hard，多次重启只降风险、不做保证（P-60／P-131）。
            </span>
          </li>
        </ul>
      </div>

      <div class="ca-dice-block">
        <p class="ca-dice-blockhead">随机换来的误差，是有账的</p>
        <ul class="ca-dice-ladder">
          <li v-for="row in LADDER" :key="row.n" class="ca-dice-srow">
            <span class="ca-dice-sname">{{ row.label }}</span>
            <span class="ca-dice-sval">误差量级 {{ row.errText }}</span>
            <span class="ca-dice-track">
              <span class="ca-dice-fill" :style="{ width: `${row.pct}%` }"></span>
            </span>
          </li>
        </ul>
        <p class="ca-dice-formula">
          条长按误差线性缩放，最长那格就是 10%。这套账叫 1/√N：蒙特卡洛方法（Metropolis 与 Ulam 的论文发表于 1949 年，
          想法来自 Ulam 1946–1947 年病中，名字取自蒙特卡洛赌场）用可控的随机采样去估那些解析算不出来的量，
          误差随样本数按平方根倒数收敛，固定种子还能原样复现——所以它是"可验证的近似"，不是瞎猜（P-45／P-82）。
        </p>

        <p class="ca-dice-blockhead is-nfl">无免费午餐定理说了什么</p>
        <ul class="ca-dice-nfl">
          <li>
            <b>它说的</b>
            <span>
              Wolpert 与 Macready 的技术报告 95-02-014（1995 年，期刊版 1997 年）证明：在"把所有可能的目标函数都平均一遍"
              这个前提下，任何搜索算法都不比随机搜索更强（I-64／P-40）。
            </span>
          </li>
          <li>
            <b>前提不能丢</b>
            <span>
              现实里的问题分布远不是"平均"的：数据大致有序、地形有坡度、骰子有偏。所以"没有万能算法"
              <b>不等于</b>"别的方法都没用"——这是这条定理最常被读反的地方。
            </span>
          </li>
          <li>
            <b>正确用法</b>
            <span>
              别问"哪个算法最强"，问"在什么数据上"。扫地机、导航、风控各用各的算法，恰恰是因为问题结构不同——
              这也是把算法分家族来讲的理由（P-118）。
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div class="ca-dice-quiet">
      <p class="ca-dice-blockhead">同样叫"猜"，这几件事差得远</p>
      <ul class="ca-dice-fine">
        <li>
          <b>算得出账的随机</b>
          <span>
            随机化快排与蒙特卡洛都属于"用随机换可行解"，代价与概率都有数学保证，所以才敢叫靠得住（P-130）。
          </span>
        </li>
        <li>
          <b>算得清、但不划算的随机</b>
          <span>
            6/49 型彩票：从 {{ POOL }} 个号里选 {{ PICK }} 个，共 {{ fmt(COMBOS) }} 种组合（组合数可自证）。
            每期相互独立，<b>任何历史频率分析都不改变下一期的概率</b>；每注等可能，而期望回报是负的（I-135）。
          </span>
        </li>
        <li>
          <b>不该拿随机当卖点的随机</b>
          <span>
            "某个模型能预测股价稳定盈利"这类说法，本轮查不到任何可复现的一手证据；回测收益与实际收益之间还隔着交易成本、
            滑点和样本外衰减（I-136）。所以站内一个收益率数字都不印。
          </span>
        </li>
        <li>
          <b>阈值不是随机，是取舍</b>
          <span>
            语音助手的误唤醒：开源引擎 openWakeWord 文档给的是一条工程目标（假接受率低于每小时 0.5 次、假拒绝率低于 5%
            通常算可用；厂商另有"每小时不超过 1 次"的说法），<b>那是开发者自设的目标、不是国际标准，换一份测试语料就不能横比</b>（P-24）。
          </span>
        </li>
        <li>
          <b>连定位都得估</b>
          <span>
            GPS 的算法本质是"四球交点"：每台卫星给一个球面，接收机要用 4 颗卫星的伪距同时解出经度、纬度、海拔
            <b>加上接收机自己的钟差</b>，共 4 个未知数（P-08）。把信号段的测距误差直接当成手机定位精度，是最常见的误读。
          </span>
        </li>
      </ul>
    </div>

    <p class="ca-cap">
      这张图里最该记住的是<b>两笔相反的账</b>：同一颗写死种子的骰子投 <b>{{ THROWS }}</b> 次，六个面落在
      <b>{{ LOWEST.count }}</b> 到 <b>{{ HIGHEST.count }}</b> 次之间（期望各 <b>{{ EXPECT }}</b> 次）——看着"有偏"，
      其实只是抽样噪声，而且换任何设备跑出来都是这六个数；反过来，想把误差量级从 <b>{{ LADDER[0].errText }}</b>
      压到 <b>{{ LADDER[2].errText }}</b>，样本得从 <b>{{ LADDER[0].n }}</b> 加到一百万个：按 1/√N，
      <b>翻 100 倍才减 10 倍</b>。随机算法靠的就是这两笔账，不是运气；而无免费午餐定理补上第三笔——
      <b>没有任何一种方法在所有问题上都最好</b>，选哪个要看问题的结构。
    </p>
  </div>
</template>

<style scoped>
.ca-dice-rolls {
  max-width: 560px;
  margin-inline: auto;
}

.ca-dice-fig {
  margin: 0;
  min-width: 0;
}

.ca-dice-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-dice-lab {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
  fill: var(--muted);
  text-anchor: start;
}

.ca-dice-lab.is-accent {
  fill: var(--accent);
}

.ca-dice-note {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-dice-mini {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-dice-mini.is-end {
  text-anchor: end;
}

.ca-dice-mini.is-blue {
  fill: var(--blue);
}

.ca-dice-axis {
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-dice-tick {
  stroke: var(--blue);
  stroke-width: 1.6;
  opacity: 0.8;
}

.ca-dice-ideal {
  stroke: var(--blue);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
}

.ca-dice-bar {
  fill: var(--accent);
  opacity: 0.85;
  animation: ca-dice-rise 0.7s var(--ease) both;
  transform-box: fill-box;
  transform-origin: bottom;
}

.ca-dice-dev {
  stroke: var(--coral);
  stroke-width: 2.2;
  stroke-linecap: round;
}

.ca-dice-count {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-dice-face {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--muted);
  text-anchor: middle;
}

@keyframes ca-dice-rise {
  from {
    transform: scaleY(0);
  }
}

.ca-dice-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 12px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--muted);
}

.ca-dice-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-dice-lg i {
  width: 12px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}

.ca-dice-lg i.is-bar {
  background: var(--accent);
}

.ca-dice-lg i.is-ideal {
  background: var(--blue);
  height: 2px;
}

.ca-dice-lg i.is-dev {
  background: var(--coral);
  height: 3px;
}

.ca-dice-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-dice-block {
  min-width: 0;
}

.ca-dice-blockhead {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-dice-blockhead.is-nfl {
  margin-top: 16px;
  color: var(--coral);
}

.ca-dice-list,
.ca-dice-nfl,
.ca-dice-fine {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-dice-list li,
.ca-dice-nfl li,
.ca-dice-fine li {
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

.ca-dice-nfl li {
  border-left-color: var(--coral);
}

.ca-dice-list b,
.ca-dice-nfl b,
.ca-dice-fine b {
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-dice-fine b {
  color: var(--blue);
}

.ca-dice-list b {
  color: var(--accent);
}

.ca-dice-nfl b {
  color: var(--coral);
}

.ca-dice-list span,
.ca-dice-nfl span,
.ca-dice-fine span {
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-dice-ladder {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-dice-srow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 104px;
  align-items: center;
  gap: 4px 8px;
  min-width: 0;
}

.ca-dice-sname {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-dice-sval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--coral);
  text-align: right;
  min-width: 0;
}

.ca-dice-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-dice-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--coral);
  animation: ca-dice-grow 1s var(--ease) both;
}

@keyframes ca-dice-grow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
}

.ca-dice-formula {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-dice-quiet {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

@media (min-width: 760px) {
  .ca-dice-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-dice-bar,
  .ca-dice-fill {
    animation: none;
  }
}
</style>
