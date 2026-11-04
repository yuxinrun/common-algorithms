<script setup lang="ts">
// 排序对决：为什么 O(n²) 的插入排序会给快排收尾。
// 图上三条线全是指定公式当场算出来的（次数，不是时间）：完全乱序的插入排序按 n(n−1)/2、
// 近乎有序按「移动次数 ≈ n」（逆序对越少、挪得越少，可自证）、参照线是 n·log₂n。
// 16 与 64 是源码里查得到的调参常量（I-54／P-61），不是理论常数；「libc++ 30」本轮未一手核实，标待核。

const round = (v: number) => Math.round(v * 10) / 10
const log10 = (v: number) => Math.log10(v)
const log2 = (v: number) => Math.log2(v)

const N_MAX = 64 // 横轴：子区间长度 n = 1 … 64（右端正是 CPython 的 minrun 上限）
const CUT = 16 // libstdc++ 的 _S_threshold：≤16 停止递归
const MINRUN = 64 // CPython 的 minrun 上限
const LIBCPP_CLAIM = 30 // 中文资料转述，未一手核实 → 图上标「待核」

type Tone = 'cost' | 'pick' | 'ref'
type Curve = { id: string; name: string; desc: string; tone: Tone; width: number; dash: string | null; f: (n: number) => number }

const CURVES: Curve[] = [
  {
    id: 'worst',
    name: '插入排序·完全乱序',
    desc: '≈ n(n−1)/2：每插一个，前面排好的都可能要往后挪一格',
    tone: 'cost',
    width: 2.2,
    dash: '7 4',
    f: (n) => (n * (n - 1)) / 2
  },
  {
    id: 'nlogn',
    name: '参照·n·log₂n',
    desc: '快排与归并的期望阶，大 n 时它才是赢家',
    tone: 'ref',
    width: 1.8,
    dash: '',
    f: (n) => (n < 2 ? NaN : n * log2(n))
  },
  {
    id: 'sorted',
    name: '插入排序·近乎有序',
    desc: '≈ n：尾巴已经排好时，它一趟就扫过去了',
    tone: 'pick',
    width: 2.6,
    dash: '',
    f: (n) => n
  }
]

// —— 几何 ——
const W = 480
const H = 254
const L = 46
const R = 448
const TOP = 40
const BOT = 202
const TOP_LOG = log10((N_MAX * (N_MAX - 1)) / 2) // 天花板 = 乱序插入在 n=64 的次数（2016）

const px = (n: number) => round(L + ((n - 1) / (N_MAX - 1)) * (R - L))
const py = (v: number) => round(TOP + (1 - log10(Math.max(1, v)) / TOP_LOG) * (BOT - TOP))

type Line = { id: string; name: string; desc: string; tone: Tone; width: number; dash: string | null; points: string }

const LINES: Line[] = CURVES.map((c) => {
  const pts: string[] = []
  for (let n = 1; n <= N_MAX; n++) {
    const v = c.f(n)
    if (!Number.isFinite(v) || v < 1) continue // log 轴上「不到 1 次」没有位置，跳过
    pts.push(`${px(n)},${py(v)}`)
  }
  return { id: c.id, name: c.name, desc: c.desc, tone: c.tone, width: c.width, dash: c.dash, points: pts.join(' ') }
})

const Y_TICKS = [0, 1, 2, 3].map((l) => ({ l, y: round(TOP + (1 - l / TOP_LOG) * (BOT - TOP)), text: l === 0 ? '1' : `1${'0'.repeat(l)}` }))
const X_TICKS = [1, 8, 16, 32, 64].map((n) => ({ n, x: px(n), text: String(n) }))

// 两个「按公式当场比出来的」交叉点：
// 完全乱序时，插入排序从 n=7 起比参照线更费；近乎有序时，它从 n=3 起就一直压在参照线下面。
const OVER = (() => {
  let first = 0
  for (let n = 2; n <= N_MAX; n++) {
    if ((n * (n - 1)) / 2 > n * log2(n)) {
      first = n
      break
    }
  }
  return first
})()

const UNDER = (() => {
  let first = 0
  for (let n = 2; n <= N_MAX; n++) {
    if (n < n * log2(n)) {
      first = n
      break
    }
  }
  return first
})()

const TRACK_MAX = MINRUN
const TRACKS = [
  { id: 'gnu', label: 'libstdc++（GCC）子区间阈值', value: `${CUT} 个元素`, pct: round((CUT / TRACK_MAX) * 100), tone: 'pick', tag: '源码常量 _S_threshold' },
  { id: 'py', label: 'CPython 的 minrun 上限', value: `${MINRUN} 个元素`, pct: round((MINRUN / TRACK_MAX) * 100), tone: 'pick', tag: '构造 run 后转归并' },
  { id: 'cpp', label: '有资料称 libc++ 用这个数', value: `${LIBCPP_CLAIM} 个元素`, pct: round((LIBCPP_CLAIM / TRACK_MAX) * 100), tone: 'todo', tag: '待核：本轮未一手核实' }
]
</script>

<template>
  <div class="ca-sort-showdown ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Sort Showdown · 小 n 时谁反超</span>
      <p class="ca-widget-sub">教科书说插入排序 O(n²)，真实标准库却拿它收尾——图上的线只回答一半。</p>
    </div>

    <figure class="ca-sort-showdown-fig">
      <svg
        class="ca-sort-showdown-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-sort-showdown-tag" :x="8" :y="18">按公式算的次数，不是时间</text>
        <text class="ca-sort-showdown-tag is-right" :x="R" :y="18">收尾区：n ≤ {{ CUT }}</text>

        <rect class="ca-sort-showdown-band" :x="L" :y="TOP" :width="px(CUT) - L" :height="BOT - TOP" />
        <line class="ca-sort-showdown-cut" :x1="px(CUT)" :y1="TOP" :x2="px(CUT)" :y2="BOT" />
        <text class="ca-sort-showdown-cutlab" :x="px(CUT)" :y="30">{{ CUT }}</text>

        <g class="ca-sort-showdown-grid">
          <g v-for="t in Y_TICKS" :key="`y-${t.l}`">
            <line :x1="L" :y1="t.y" :x2="R" :y2="t.y" />
            <text class="ca-sort-showdown-ylab" :x="L - 7" :y="t.y + 3">{{ t.text }}</text>
          </g>
          <g v-for="t in X_TICKS" :key="`x-${t.n}`">
            <line class="is-x" :x1="t.x" :y1="BOT" :x2="t.x" :y2="BOT + 4" />
            <text class="ca-sort-showdown-xlab" :x="t.x" :y="BOT + 16">{{ t.text }}</text>
          </g>
          <line class="is-axis" :x1="L" :y1="BOT" :x2="R" :y2="BOT" />
          <line class="is-axis" :x1="L" :y1="TOP" :x2="L" :y2="BOT" />
          <text class="ca-sort-showdown-axnote" :x="R" :y="BOT + 30">子区间长度 n →</text>
          <text class="ca-sort-showdown-axnote is-left" :x="L" :y="BOT + 44">纵轴：运算次数（每上一格就是 10 倍）</text>
        </g>

        <g v-for="l in LINES" :key="l.id" class="ca-sort-showdown-line" :class="`is-${l.tone}`">
          <polyline :points="l.points" :stroke-width="l.width" :stroke-dasharray="l.dash" />
        </g>

        <line class="ca-sort-showdown-over" :x1="px(OVER)" :y1="TOP" :x2="px(OVER)" :y2="BOT" />
        <text class="ca-sort-showdown-overlab" :x="px(OVER)" :y="TOP + 14">乱序代价抬头</text>
      </svg>

      <span class="sr-only">
        三条线，横轴是子区间长度 n 从 1 到 64，纵轴是运算次数、每上一格乘 10。
        珊瑚色是插入排序在完全乱序时的次数，按 n 乘 n 减 1 再除以 2 计算，n 等于 64 时是 2016 次；
        蓝色是参照线 n 乘 log₂n，n 等于 64 时是 384 次；青色是同一个插入排序在数据近乎有序时的次数，
        按「移动次数约等于 n」计算，n 等于 64 时只有 64 次。
        按这两个公式逐点比：完全乱序那条从 n 等于 {{ OVER }} 起超过参照线（{{ OVER }} 个元素时 21 次对 19.6 次），
        近乎有序那条从 n 等于 {{ UNDER }} 起一直压在参照线下面，到 64 个元素时是 64 次对 384 次。
        图上竖着的青色虚线在 n 等于 16，那是 libstdc++（GCC）源码里的常量 _S_threshold：子区间不超过 16 个元素就停止递归、
        最后统一用插入排序收尾；横轴右端的 64 是 CPython 的 minrun 上限。
        另有一份中文资料称 libc++ 用 30，本轮没查到一手，图上标为待核。三个数都是实现调参结果，不是理论常数。
        这些全部按公式计算，不是实测。
      </span>
    </figure>

    <div class="ca-sort-showdown-legend">
      <p v-for="l in LINES" :key="`lg-${l.id}`" class="ca-sort-showdown-legrow">
        <span class="ca-sort-showdown-key" :class="`is-${l.tone}`"></span>
        <span class="ca-sort-showdown-legname">{{ l.name }}</span>
        <span class="ca-sort-showdown-legdesc">{{ l.desc }}</span>
      </p>
    </div>

    <div class="ca-sort-showdown-tracks">
      <p class="ca-sort-showdown-trackhead">
        真实库里「多小算小」的三条口径
        <span class="ca-sort-showdown-hint">轨道右端 = {{ MINRUN }} 个元素；阈值是实现调参结果，不是理论常数</span>
      </p>
      <div v-for="t in TRACKS" :key="t.id" class="ca-sort-showdown-trow" :class="{ 'is-todo': t.tone === 'todo' }">
        <span class="ca-sort-showdown-tlab">{{ t.label }}</span>
        <span class="ca-sort-showdown-tval">{{ t.value }}</span>
        <span class="ca-sort-showdown-track">
          <span class="ca-sort-showdown-fill" :class="`is-${t.tone}`" :style="{ width: `${t.pct}%` }"></span>
        </span>
        <span class="ca-sort-showdown-ttag">{{ t.tag }}</span>
      </div>
    </div>

    <div class="ca-sort-showdown-notes">
      <div class="ca-sort-showdown-note is-pick">
        <b>谁在给谁收尾</b>
        <p>
          GCC 的 libstdc++ 在子区间长度不超过 16 时停止递归、最后统一用插入排序收尾（源码常量 _S_threshold = 16）；
          CPython 的 list.sort 用「二分插入排序」构造有序 run（minrun 上限 64），之后才进入 galloping 归并。
        </p>
      </div>
      <div class="ca-sort-showdown-note is-cost">
        <b>快排为什么不敢单干</b>
        <p>
          快排平均 O(n log n)、最坏 O(n²)：随机主元或三数取中只是把最坏情形变成概率极小、不是零。工业实现走的是 introsort
          （Musser 1997）——递归深度到 2·⌊log₂n⌋ 就兜底切换成堆排序。「期望很好」和「主动放弃纯快排」是同一件事的两面。
        </p>
      </div>
      <div class="ca-sort-showdown-note is-ref">
        <b>稳定不等于随机</b>
        <p>
          稳定性说的是相等键保持原始相对顺序。C++ 的 std::sort 不保证稳定、std::stable_sort 才保证（通常是归并，空间可能 O(n)）；
          同一输入同一实现，不稳定的结果也是确定的，只是不承诺相等元素的先后。归并最坏与平均都是 O(n log n) 但要 O(n) 额外空间，
          快排原地、期望栈空间 O(log n) 但不稳定——内存放不下的时候则改用外部归并排序，多路归并少读几趟盘，
          真正的瓶颈是磁盘与内存带宽，不是大 O。
        </p>
      </div>
      <div class="ca-sort-showdown-note is-ref">
        <b>顺手把 Timsort 放对位置</b>
        <p>
          Tim Peters 在 2002 年为 Python 设计了 Timsort（Python 2.3 起是默认），Java 7 起对象数组的 Arrays.sort 也改用它；
          它稳定、最坏 O(n log n)、最好 O(n)，靠的是数据里已经存在的有序 run，代价是需要额外空间（近似 O(n/2)）。
          另外提醒一句：已排序数组里「小规模时逐条扫描常比二分快」是流传经验，机制是缓存友好，
          具体交叉点依 CPU 与元素大小而定，站内不印「多少个以下一定更快」那种阈值。
        </p>
      </div>
    </div>

    <p class="ca-cap">
      图上三条线只数「要挪多少次」，一次比较花多少它一概不知道，所以 <b>O(n²) 的插入排序反而在收尾</b>：数据近乎有序时它的次数约等于
      <b>n</b>，而参照线是 <b>n·log₂n</b>——按这两个公式，<b>64</b> 个元素时是 <b>64</b> 次对 <b>384</b> 次。
      真实库把这一步写死成常量：libstdc++ 在子区间 <b>≤16</b> 停递归、CPython 的 minrun 上限 <b>64</b>，
      <b>两个都是调参结果、不是理论常数</b>，所以站内不印「多少以下插入排序一定更快」。
    </p>
  </div>
</template>

<style scoped>
.ca-sort-showdown {
  max-width: 560px;
  margin-inline: auto;
}

.ca-sort-showdown-fig {
  margin: 0;
  min-width: 0;
}

.ca-sort-showdown-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-sort-showdown-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: start;
}

.ca-sort-showdown-tag.is-right {
  text-anchor: end;
}

.ca-sort-showdown-band {
  fill: var(--accent-soft);
}

.ca-sort-showdown-cut {
  stroke: var(--accent);
  stroke-width: 1.4;
  stroke-dasharray: 4 3;
}

.ca-sort-showdown-over {
  stroke: var(--coral);
  stroke-width: 1.2;
  stroke-dasharray: 3 3;
  opacity: 0.75;
}

.ca-sort-showdown-overlab {
  font-family: var(--font-sans);
  font-size: 8.5px;
  fill: var(--coral);
  text-anchor: middle;
}

.ca-sort-showdown-cutlab {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--accent);
  text-anchor: middle;
}

.ca-sort-showdown-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-sort-showdown-grid .is-x {
  stroke: var(--line);
}

.ca-sort-showdown-grid .is-axis {
  stroke: var(--line-strong);
}

.ca-sort-showdown-ylab,
.ca-sort-showdown-xlab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-sort-showdown-ylab {
  text-anchor: end;
}

.ca-sort-showdown-xlab {
  text-anchor: middle;
}

.ca-sort-showdown-axnote {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: end;
}

.ca-sort-showdown-axnote.is-left {
  text-anchor: start;
}

.ca-sort-showdown-line polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ca-sort-showdown-line.is-cost polyline {
  stroke: var(--coral);
}

.ca-sort-showdown-line.is-ref polyline {
  stroke: var(--blue);
}

.ca-sort-showdown-line.is-pick polyline {
  stroke: var(--accent);
}

.ca-sort-showdown-line {
  animation: ca-sort-showdown-in 1.1s var(--ease) both;
}

@keyframes ca-sort-showdown-in {
  from {
    opacity: 0;
  }
}

.ca-sort-showdown-legend {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sort-showdown-legrow {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 2px 8px;
  margin: 0;
  min-width: 0;
}

.ca-sort-showdown-key {
  width: 20px;
  height: 0;
  border-top: 3px solid var(--ink-2);
  border-radius: 2px;
}

.ca-sort-showdown-key.is-cost {
  border-top-style: dashed;
  border-top-color: var(--coral);
}

.ca-sort-showdown-key.is-ref {
  border-top-color: var(--blue);
}

.ca-sort-showdown-key.is-pick {
  border-top-color: var(--accent);
}

.ca-sort-showdown-legname {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-sort-showdown-legdesc {
  grid-column: 2;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--faint);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-sort-showdown-tracks {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sort-showdown-trackhead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-sort-showdown-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.05em;
  color: var(--faint);
}

.ca-sort-showdown-trow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  align-items: center;
  gap: 3px 8px;
  margin-bottom: 12px;
  min-width: 0;
}

.ca-sort-showdown-tlab {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-sort-showdown-tval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-sort-showdown-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-sort-showdown-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  animation: ca-sort-showdown-grow 0.9s var(--ease) both;
  transform-origin: left center;
}

@keyframes ca-sort-showdown-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-sort-showdown-fill.is-pick {
  background: var(--accent);
}

.ca-sort-showdown-fill.is-todo {
  background: repeating-linear-gradient(90deg, var(--coral) 0 5px, var(--coral-soft) 5px 10px);
}

.ca-sort-showdown-ttag {
  grid-column: 1 / -1;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-sort-showdown-trow.is-todo .ca-sort-showdown-ttag {
  color: var(--coral);
}

.ca-sort-showdown-notes {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sort-showdown-note {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-sort-showdown-note.is-cost {
  border-left-color: var(--coral);
}

.ca-sort-showdown-note.is-ref {
  border-left-color: var(--blue);
}

.ca-sort-showdown-note b {
  display: block;
  margin-bottom: 4px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-sort-showdown-note p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .ca-sort-showdown-line,
  .ca-sort-showdown-fill {
    animation: none;
  }
}
</style>
