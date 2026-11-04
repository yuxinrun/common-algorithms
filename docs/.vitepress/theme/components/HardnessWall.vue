<script setup lang="ts">
// 硬度的墙：把七件事画在同一根「常用对数」轴上（横轴 = 10 的几次方），
// 再叠一条珊瑚色虚线——按假设口径一年能做完多少次运算。越过这条线的，
// 不是「再等十年」，是形状问题。轴上每个值都由公式当场算（log₂n、n(n−1)/2、n²·2ⁿ、(n−1)!/2），
// 是运算次数而不是时间；一年线来自一个假设（示意）口径，不对应任何具体机器。

const log10 = (v: number) => Math.log10(v)

// (n−1)!/2：固定起点后把剩下 n−1 个城市全排一遍，再把正着走与反着走算作同一条。
// 用 BigInt：20 城那一档是 17 位数，普通 Number 过了 2^53 就不再是整数了。
const routesOf = (n: number) => {
  let a = 1n
  for (let k = 2n; k <= BigInt(n - 1); k++) a *= k
  return a / 2n
}

const group = (v: number | bigint) =>
  String(typeof v === 'bigint' ? v : Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// —— 一年线的假设口径（示意）：每秒 10 亿次基本操作，一年 365 天 ——
const OPS_PER_SEC = 10 ** 9
const SEC_PER_DAY = 24 * 60 * 60
const DAYS_PER_YEAR = 365
const YEAR_OPS = OPS_PER_SEC * DAYS_PER_YEAR * SEC_PER_DAY
const WALL = log10(YEAR_OPS) // 约 16.5，即 10 的 16 次方量级多一点

const BIG_N = 10 ** 9 // 10 亿项那一组
const MID_N = 10 ** 6 // 100 万项那一组
const BIN_TIMES = Math.ceil(Math.log2(BIG_N + 1)) // 二分最坏比较次数
const LIN_TIMES = BIG_N / 2 // 无序数组平均查一半
const NLOGN_TIMES = MID_N * Math.log2(MID_N) // n·log₂n
const PAIR_TIMES = (MID_N * (MID_N - 1)) / 2 // 两两比较
const HK20 = 20 * 20 * 2 ** 20 // Held–Karp 状态量 n²·2ⁿ
const ROUTES20 = routesOf(20) // 20 城全枚举走法数
const EXP100 = 2 ** 100 // n 推到 100 时的指数项

type Tone = 'pick' | 'ref' | 'cost'
type Row = { id: string; lab: string; tone: Tone; pow: number; shown: string; note: string }

const ROWS: Row[] = [
  {
    id: 'bin',
    lab: '二分 · 10 亿项',
    tone: 'pick',
    pow: log10(BIN_TIMES),
    shown: `${BIN_TIMES} 次比较`,
    note: '最坏比较次数 = ⌈log₂(10⁹+1)⌉；是次数，不是时间'
  },
  {
    id: 'nlogn',
    lab: 'n·log₂n · 10⁶ 项',
    tone: 'pick',
    pow: log10(NLOGN_TIMES),
    shown: `≈${group(NLOGN_TIMES)} 次`,
    note: '归并／快排这一类的量级，约 2×10⁷'
  },
  {
    id: 'hk',
    lab: 'Held–Karp · 20 城',
    tone: 'pick',
    pow: log10(HK20),
    shown: `${group(HK20)} 个状态`,
    note: 'n²·2ⁿ，1962 年提出；状态量，不是墙钟'
  },
  {
    id: 'lin',
    lab: '线性扫 · 10 亿项',
    tone: 'ref',
    pow: log10(LIN_TIMES),
    shown: `≈${group(LIN_TIMES)} 次`,
    note: '无序就只能逐条看，平均 n/2；与二分差约 7 个数量级'
  },
  {
    id: 'pair',
    lab: '两两比较 · 10⁶ 项',
    tone: 'cost',
    pow: log10(PAIR_TIMES),
    shown: `${group(PAIR_TIMES)} 次`,
    note: 'n(n−1)/2，约 5×10¹¹；还在墙的这一侧'
  },
  {
    id: 'tour',
    lab: '全枚举 · 20 城',
    tone: 'cost',
    pow: log10(Number(ROUTES20)),
    shown: `${group(ROUTES20)} 条`,
    note: '(n−1)!/2 条走法全看一遍——已经越过一年线'
  },
  {
    id: 'exp',
    lab: '2 的 100 次方',
    tone: 'cost',
    pow: log10(EXP100),
    shown: '≈1.3×10³⁰ 次',
    note: 'n 推到 100 时的指数项，仍是宇宙尺度，压掉部分爆炸也还在墙外'
  }
]

// —— 几何：位数轴 0 … 32 ——
const W = 480
const ROW_H = 26
const TOP = 54
const LAB_X = 8
const X0 = 122
const X1 = 446
const AXIS_MAX = 32
const dx = (p: number) => Math.round(X0 + (p / AXIS_MAX) * (X1 - X0))
const TICKS = [0, 8, 16, 24, 32].map((p) => ({ p, x: dx(p) }))
const WALL_X = dx(WALL)
const BAR_ROWS = ROWS.map((r, i) => ({
  ...r,
  y: TOP + i * ROW_H,
  x2: Math.max(X0 + 3, dx(r.pow)),
  pos: r.pow.toFixed(1)
}))
const LAST_Y = TOP + (ROWS.length - 1) * ROW_H
const H = LAST_Y + 42

// —— 规模翻倍：n 变 2n 时，各种形状各自的次数变成几倍（在 n = 10⁶ 这一个点取值）——
const L2 = Math.log2(MID_N)
const SCALE = (r: number) => Math.min(100, Math.max(4, Math.round((Math.log(r) / Math.log(4)) * 100)))

type DRow = { id: string; lab: string; tone: Tone; pct: number; x: number | null; times: string; txt: string }

const DROWS: DRow[] = [
  {
    id: 'dlog',
    lab: 'log₂n',
    tone: 'pick',
    x: (L2 + 1) / L2,
    pct: SCALE((L2 + 1) / L2),
    times: `×${((L2 + 1) / L2).toFixed(2)}`,
    txt: '多走一格而已'
  },
  { id: 'dlin', lab: 'n', tone: 'pick', x: 2, pct: SCALE(2), times: '×2.00', txt: '次数跟着规模走' },
  {
    id: 'dnlogn',
    lab: 'n·log₂n',
    tone: 'ref',
    x: (2 * (L2 + 1)) / L2,
    pct: SCALE((2 * (L2 + 1)) / L2),
    times: `×${((2 * (L2 + 1)) / L2).toFixed(2)}`,
    txt: '比线性只多一点'
  },
  { id: 'dsq', lab: 'n²', tone: 'cost', x: 4, pct: SCALE(4), times: '×4.00', txt: '翻倍就是四倍' },
  { id: 'dexp', lab: '2ⁿ', tone: 'cost', x: null, pct: 100, times: '×2ⁿ', txt: '翻倍 = 把当前次数平方一次，超出刻度' }
]
</script>

<template>
  <div class="ca-hardness-wall ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Hardness Wall · 算不动的墙</span>
      <p class="ca-widget-sub">哪些事是「就是算不动」？规模翻倍时，它们各自怎么塌方？</p>
    </div>

    <figure class="ca-hardness-wall-fig">
      <svg
        class="ca-hardness-wall-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-hardness-wall-tag" :x="LAB_X" :y="18">轴上是运算次数</text>
        <text class="ca-hardness-wall-tag is-right" :x="W - 10" :y="18">横轴：10 的几次方</text>

        <g class="ca-hardness-wall-grid">
          <g v-for="t in TICKS" :key="`t-${t.p}`">
            <line :x1="t.x" :y1="TOP - 16" :x2="t.x" :y2="LAST_Y + 12" />
            <text class="ca-hardness-wall-tick" :x="t.x" :y="LAST_Y + 26">{{ t.p }}</text>
          </g>
          <line class="is-base" :x1="X0" :y1="LAST_Y + 12" :x2="X1" :y2="LAST_Y + 12" />
        </g>

        <g v-for="(r, i) in BAR_ROWS" :key="r.id" class="ca-hardness-wall-row" :class="`is-${r.tone}`">
          <text class="ca-hardness-wall-lab" :x="LAB_X" :y="r.y + 4">{{ r.lab }}</text>
          <rect
            class="ca-hardness-wall-bar"
            :x="X0"
            :y="r.y - 8"
            :width="r.x2 - X0"
            :height="16"
            rx="3"
            :style="{ animationDelay: `${i * 80}ms` }"
          />
          <text class="ca-hardness-wall-val" :x="r.x2 + 5" :y="r.y + 4">{{ r.pos }}</text>
        </g>

        <g class="ca-hardness-wall-wall">
          <line :x1="WALL_X" :y1="TOP - 20" :x2="WALL_X" :y2="LAST_Y + 12" />
          <text class="ca-hardness-wall-walltag" :x="WALL_X" :y="TOP - 26">一年线</text>
        </g>
      </svg>

      <span class="sr-only">
        七根横条画在同一根对数轴上，横轴读数是「十的几次方」，轴上是运算次数，不是时间。
        最短的是二分查找：十亿个有序项里最坏 {{ BIN_TIMES }} 次比较，读数一点五。
        第二条 n 乘 log₂n，一百万项时约 {{ group(NLOGN_TIMES) }} 次，读数七点三；
        第三条 Held–Karp 解二十城旅行商，约 {{ group(HK20) }} 个状态，读数八点六；
        第四条线性扫描十亿项，平均约 {{ group(LIN_TIMES) }} 次，读数八点七，与二分的 {{ BIN_TIMES }} 次差约七个数量级；
        第五条一百万项两两比较，{{ group(PAIR_TIMES) }} 次，读数十一点七，还在墙的这一侧。
        后两条撞墙：二十城全枚举要看完 {{ group(ROUTES20) }} 条走法，读数十六点八；
        城市数推到一百，二的 100 次方约是十的三十点一次方，也就是 1.3 乘十的三十次方。
        一条珊瑚色虚线竖在十六点五处：按「假设每秒做十亿次基本操作、一年三百六十五天」这个示意口径，
        一年约做得完十的十六次方多一点次运算；换一台机器、换一种负载，这条线会左右挪，但七根条子的相对间距不变。
        下面的翻倍表说的是规模从 n 变成 2n：在一百万这个点上，log₂n 只变成约 {{ DROWS[0].x?.toFixed(2) }} 倍，
        n 变二倍，n 乘 log₂n 变约 {{ DROWS[2].x?.toFixed(2) }} 倍，n 的平方变四倍，
        二的 n 次方是把当前次数再平方一次，图上已经没有可信刻度。
        文字里还有两面墙：Klee 与 Minty 一九七一年的指数级反例，配一九七九年 Khachiyan 的椭球法；
        以及 Cook 一九七一年、Karp 一九七二年列出的二十一个 NP 难问题——P 与 NP 是千禧年七大问题之一，
        跟着这句话流传的奖金数额本轮没核到，站内不印。所有数字都按公式计算，不是实测。
      </span>
    </figure>

    <div class="ca-hardness-wall-nums">
      <div v-for="r in ROWS" :key="`n-${r.id}`" class="ca-hardness-wall-nrow" :class="`is-${r.tone}`">
        <span class="ca-hardness-wall-nlab">
          {{ r.shown }}
          <em>{{ r.note }}</em>
        </span>
        <span class="ca-hardness-wall-nval">{{ r.pow.toFixed(1) }}</span>
      </div>
      <p class="ca-hardness-wall-note">
        横轴一格就是乘 10，所以条长比的是「这个数有多大」，不是「哪个算法更好」。
        <b>一年线是假设口径（示意）</b>：按每秒 10 亿次基本操作、一年 365 天算，一年约做得完
        10 的 16 次方多一点次运算；它只用来给「这辈子算不完」画一条直觉上的界线，
        换一台机器、换一种负载，这条线会左右挪，但挪不动七根条子之间的相对间距。
      </p>
    </div>

    <div class="ca-hardness-wall-double">
      <p class="ca-hardness-wall-head">
        规模翻倍时怎么塌方
        <span class="ca-hardness-wall-hint">n 变成 2n · 在 n = 10⁶ 这一个点取比值 · 轨道按倍数取对数刻度，最右为 4 倍</span>
      </p>
      <ul class="ca-hardness-wall-dlist">
        <li v-for="d in DROWS" :key="d.id" class="ca-hardness-wall-drow" :class="`is-${d.tone}`">
          <span class="ca-hardness-wall-dlab">{{ d.lab }}</span>
          <span class="ca-hardness-wall-dtrack"><span class="ca-hardness-wall-dfill" :style="{ width: `${d.pct}%` }"></span></span>
          <span class="ca-hardness-wall-dtimes">{{ d.times }}</span>
          <span class="ca-hardness-wall-dtxt">{{ d.txt }}</span>
        </li>
      </ul>
      <p class="ca-hardness-wall-note">
        前四行的倍数是定义层面的算术（log₂(2n)/log₂n、2n/n、2n·log₂(2n) ÷ n·log₂n、(2n)²/n²），
        不是实测；最后一行超出刻度，站内只说形状——二的 n 次方一翻倍就是把当前次数平方一次，
        再往上没有可信的刻度可以画。
      </p>
    </div>

    <div class="ca-hardness-wall-cls">
      <div class="ca-hardness-wall-card is-cold">
        <b>第一面墙：最坏情况就是指数</b>
        <p>
          Klee 与 Minty 在 1971 年用立方体构造出反例：单纯形法在最坏情况下必须访问指数级数量的顶点；
          1979 年 Khachiyan 给出第一个多项式时间算法（椭球法）。这两句必须同框——
          「单纯形法最坏指数」和「它实践中常常更快」并不矛盾，差的是最坏情况与典型情况。
        </p>
      </div>
      <div class="ca-hardness-wall-card is-cold">
        <b>第二面墙：连「有没有高效解」都不知道</b>
        <p>
          Cook 1971 年提出定理，Karp 1972 年列出 21 个 NP 难问题，Levin 在苏联同期独立提出
          （因语言与冷战壁垒晚被西方知晓，「Cook 一个人证明」要补一句独立地 Levin）。
          P 与 NP 是克莱数学研究所千禧年七大问题之一，官方表述是「如果验证解容易，是否求解也容易」。
          常跟着这句话的奖金数额，本轮没从该题页面核到，站内不印；
          而且它是「有没有高效解」的元问题，跟「我的这段代码能不能再快点」不是一回事。
        </p>
      </div>
      <div class="ca-hardness-wall-card">
        <b>加机器搬的是数量级，不是形状</b>
        <p>
          Spark 论文自报：内存工作集让交互式分析比 Hadoop MapReduce 快约 100 倍、批处理约快 10 倍量级——
          这是特定负载、特定集群上的论文自报对比，不是普适倍数，被厂商引用时通常已经剥掉了前提。
          MapReduce 论文自述单个作业跑在数千台机器（2008 年 CACM 版给出约 3000 台量级），
          那是 2004 与 2008 年的自述，不是今天的规模。倍数再大也只是把条子往左挪几格，斜率不变。
        </p>
      </div>
      <div class="ca-hardness-wall-card">
        <b>这一页不讲「不可计算」</b>
        <p>
          上面七根条子都属于「原则上算得出，只是算不起」。停机问题那一类「没有任何算法能判定」的
          不可计算，本轮事实库没有对应行，这里不展开，也不借它说「所以算法有极限」那种大词。
        </p>
      </div>
    </div>

    <ul class="ca-hardness-wall-qual">
      <li>
        {{ BIN_TIMES }} 次是<b>比较次数不是时间</b>：这几次里只要有一次落在磁盘或跨网络，
        延迟就由 I/O 决定；前提还是「数据已排序且可随机访问」，通讯录没排序时用的就是逐条扫描。
      </li>
      <li>
        二分 {{ BIN_TIMES }} 次，对比线性扫描约 5 亿次，差<b>约 7 个数量级</b>；这个「7」的前提是
        「都在内存、随机访问代价相同」。线性扫描缓存友好，小规模数据上反而更快，
        而那个交叉点没有通用数值，站内不印「多少项以下线性更快」的阈值。
      </li>
      <li>
        大 O 只描述增长率，<b>不含常数、不含硬件、不含数据分布</b>：把「O(n log n)」说成「比 O(n²) 快」
        必须先说 n 足够大；同一个算法换一种数据分布，差一个数量级是常态。反过来也别把 O(1) 读成"快"——
        渐近记号丢掉常数项与低阶项，一个要 10⁶ 次基本操作的 O(1)，比一个 10 次操作的 O(log n) 更慢；
        常数、缓存、I/O 这三个词得同时出现，才够解释"算法不慢，机器上却慢"。
      </li>
    </ul>

    <p class="ca-cap">
      同一根轴上看：<b>多项式那一侧撞不到墙</b>——10 亿项二分 {{ BIN_TIMES }} 次、100 万项 n·log₂n 约
      {{ group(NLOGN_TIMES) }} 次；<b>指数与阶乘那一侧不是「再等十年」</b>——20 城全枚举
      {{ group(ROUTES20) }} 条（已越过一年线），100 城的 2¹⁰⁰ 远在墙外。
      规模翻倍时 log₂n 几乎不动、线性翻倍、平方变 4 倍、指数把自己平方一次：
      <b>能挑的是形状，不是常数</b>；而 1971 年的 Klee–Minty 反例与 1972 年 Karp 的 21 个问题提醒我们，
      「最坏情况有多坏」和「这类问题有没有高效解法」是两面不同的墙。
    </p>
  </div>
</template>

<style scoped>
.ca-hardness-wall {
  max-width: 540px;
  margin-inline: auto;
}

.ca-hardness-wall-fig {
  margin: 0;
  min-width: 0;
}

.ca-hardness-wall-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-hardness-wall-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: start;
}

.ca-hardness-wall-tag.is-right {
  text-anchor: end;
}

.ca-hardness-wall-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-hardness-wall-grid .is-base {
  stroke: var(--line-strong);
}

.ca-hardness-wall-tick {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-hardness-wall-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
  text-anchor: start;
}

.ca-hardness-wall-val {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: start;
}

.ca-hardness-wall-bar {
  transform-box: fill-box;
  transform-origin: left center;
  animation: ca-hardness-wall-grow 0.7s var(--ease) both;
}

@keyframes ca-hardness-wall-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-hardness-wall-row.is-pick .ca-hardness-wall-bar {
  fill: var(--accent);
}

.ca-hardness-wall-row.is-ref .ca-hardness-wall-bar {
  fill: var(--blue);
}

.ca-hardness-wall-row.is-cost .ca-hardness-wall-bar {
  fill: var(--coral);
}

.ca-hardness-wall-row.is-cost .ca-hardness-wall-lab {
  fill: var(--coral);
}

.ca-hardness-wall-wall line {
  stroke: var(--coral);
  stroke-width: 1.4;
  stroke-dasharray: 4 3;
  animation: ca-hardness-wall-drop 0.9s var(--ease) both;
}

.ca-hardness-wall-walltag {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--coral);
  text-anchor: middle;
}

@keyframes ca-hardness-wall-drop {
  from {
    opacity: 0;
  }
}

.ca-hardness-wall-nums {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-hardness-wall-nrow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.ca-hardness-wall-nlab {
  font-family: var(--font-mono);
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-hardness-wall-nlab em {
  display: block;
  font-family: var(--font-sans);
  font-style: normal;
  font-size: 10.5px;
  color: var(--muted);
}

.ca-hardness-wall-nval {
  font-family: var(--font-mono);
  font-size: 10.5px;
  text-align: right;
  color: var(--muted);
  min-width: 0;
}

.ca-hardness-wall-nrow.is-pick .ca-hardness-wall-nval {
  color: var(--accent);
}

.ca-hardness-wall-nrow.is-cost .ca-hardness-wall-nval {
  color: var(--coral);
}

.ca-hardness-wall-note {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-hardness-wall-note b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-hardness-wall-double {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-hardness-wall-head {
  display: grid;
  gap: 4px;
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-hardness-wall-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.03em;
  color: var(--faint);
}

.ca-hardness-wall-dlist {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-hardness-wall-drow {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 46px;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 4px 8px;
  min-width: 0;
}

.ca-hardness-wall-dlab {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-hardness-wall-dtrack {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: var(--panel-3);
  min-width: 0;
  overflow: hidden;
}

.ca-hardness-wall-dfill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: var(--muted);
  min-width: 0;
  animation: ca-hardness-wall-wide 0.7s var(--ease) both;
}

@keyframes ca-hardness-wall-wide {
  from {
    width: 0;
  }
}

.ca-hardness-wall-dtimes {
  font-family: var(--font-mono);
  font-size: 10px;
  text-align: right;
  color: var(--muted);
  min-width: 0;
}

.ca-hardness-wall-dtxt {
  grid-column: 2 / 4;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--faint);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-hardness-wall-drow.is-pick .ca-hardness-wall-dfill {
  background: var(--accent);
}

.ca-hardness-wall-drow.is-pick .ca-hardness-wall-dtimes {
  color: var(--accent);
}

.ca-hardness-wall-drow.is-ref .ca-hardness-wall-dfill {
  background: var(--blue);
}

.ca-hardness-wall-drow.is-cost .ca-hardness-wall-dfill {
  background: var(--coral);
}

.ca-hardness-wall-drow.is-cost .ca-hardness-wall-dtimes {
  color: var(--coral);
}

.ca-hardness-wall-cls {
  display: grid;
  gap: 9px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-hardness-wall-card {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-hardness-wall-card.is-cold {
  border-left-color: var(--coral);
}

.ca-hardness-wall-card b {
  display: block;
  margin-bottom: 4px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-hardness-wall-card p {
  margin: 0;
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-hardness-wall-qual {
  display: grid;
  gap: 7px;
  margin: 14px 0 0;
  padding: 0 0 0 16px;
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
}

.ca-hardness-wall-qual li {
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-hardness-wall-qual b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (prefers-reduced-motion: reduce) {
  .ca-hardness-wall-bar,
  .ca-hardness-wall-wall line,
  .ca-hardness-wall-dfill {
    animation: none;
  }
}
</style>
