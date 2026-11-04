<script setup lang="ts">
// 方波拆开是什么：一串奇次正弦，幅度按 1/k 衰减。
// 波形不是手画的：s_K(t) = (4/π) · Σ_{k=1,3,…,K} sin(k·t)/k，项数在下面写死，SSR 与客户端逐字节一致。
// 上面这两块图形只表达"形状"，横轴没有单位、纵轴没有量纲——是示意，不是任何实测信号。
// 有出处的数字在下面三块里：计算量（I-33，算术恒等式）、应用落点（I-127／P-16）、音频量级（I-87／C-61／C-63）、历史（I-32／P-81）。

const W = 440 // 画布宽
const H = 256 // 画布高
const AX0 = 36 // 面板左边（两块共用）
const AX1 = 412 // 面板右边
const AMID = 74 // 波形中线（值为 0 的那条）
const AHH = 40 // 幅度 1 对应的像素
const BTOP = 154 // 频谱面板上边（幅度 1 处）
const BBOT = 226 // 频谱基线
const BX0 = 56 // 第一根谱线的横坐标
const BX1 = 400 // 最后一根谱线的横坐标
const SAMPLES = 181 // 波形采样点数（写死，不靠随机）
const TERMS = [1, 3, 5, 7, 9, 11, 13] // 取到第 13 次谐波，共 7 项
const HALF = (AX1 - AX0) / 4 // 两个周期 = 4 个半周期

// 傅里叶级数部分和：只取奇次项，1/k 衰减
const partial = (terms: number[], u: number) => {
  const t = u * 2 * Math.PI * 2
  let v = 0
  for (let i = 0; i < terms.length; i++) v += Math.sin(terms[i] * t) / terms[i]
  return (4 / Math.PI) * v
}

const curve = (terms: number[]) => {
  const pts: string[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1)
    const x = +(AX0 + u * (AX1 - AX0)).toFixed(1)
    // 有限项会冲过 1（吉布斯振铃），这里给 AHH 留了余量
    const y = +(AMID - partial(terms, u) * AHH).toFixed(1)
    pts.push(`${x} ${y}`)
  }
  return `M ${pts.join(' L ')}`
}

// 目标方波：用整数坐标画台阶，保证与级数的奇次项同相
const STEP = (() => {
  const hi = AMID - AHH
  const lo = AMID + AHH
  const parts: string[] = []
  for (let j = 0; j < 4; j++) {
    const x0 = +(AX0 + j * HALF).toFixed(1)
    const x1 = +(AX0 + (j + 1) * HALF).toFixed(1)
    const y = j % 2 === 0 ? hi : lo
    parts.push(`${j === 0 ? `M ${x0} ${y}` : `L ${x0} ${y}`} L ${x1} ${y}`)
  }
  return parts.join(' ')
})()

const PATH_ONE = curve([1]) // 只给基频：一条正弦
const PATH_SEVEN = curve(TERMS) // 七个奇次项叠起来：已经很方，但角上是振铃

const SPAN = (BX1 - BX0) / (TERMS.length - 1)
const STEMS = TERMS.map((k, idx) => ({
  k,
  x: +(BX0 + idx * SPAN).toFixed(1),
  y: +(BBOT - (BBOT - BTOP) / k).toFixed(1),
  h: +((BBOT - BTOP) / k).toFixed(1),
  text: k === 1 ? '1' : `1/${k}`
}))

// —— 下面这些才是有出处的数（I-33：n=1024 的两个量级）——
const N_FFT = 1024
const DFT_DIRECT = N_FFT * N_FFT // 按定义算：n² ＝ 1,048,576 次复数乘法
const FFT_OPS = (N_FFT / 2) * Math.log2(N_FFT) // 分治：n/2·log₂n ＝ 5,120 次
const RATIO = Math.round(DFT_DIRECT / FFT_OPS) // 约 205 倍（只在 n=1024 这一档成立）
const group = (v: number) => String(v).replace(/\B(?=(\d{3})+$)/g, ',')
const DIRECT_TEXT = group(DFT_DIRECT)
const OPS_TEXT = group(Math.round(FFT_OPS))
const FILL_OPS = Math.max(2, Math.round((FFT_OPS / DFT_DIRECT) * 100)) // 画出来只剩一条细线

// 音频那一档的量级（I-87／C-61／C-63）
const CD_KBPS = 1411
const MP3_KBPS = 128
const LOSSY_PCT = Math.max(2, Math.round((MP3_KBPS / CD_KBPS) * 100))
const TIMES = Math.round(CD_KBPS / MP3_KBPS) // 1411÷128≈11.03，本站按公式算的量级
</script>

<template>
  <div class="ca-fft-spectrum ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Fourier Spectrum · 方波拆开是一堆正弦</span>
      <p class="ca-widget-sub">
        一个又方又硬的波形，用一串会抖的正弦就能凑出来；把它反过来用——先看出频率成分，再省着算——就是 FFT 干的事。
      </p>
    </div>

    <figure class="ca-fft-fig">
      <svg class="ca-fft-svg" :viewBox="`0 0 ${W} ${H}`" role="presentation" aria-hidden="true" focusable="false">
        <g class="ca-fft-grid">
          <line class="is-zero" :x1="AX0" :y1="AMID" :x2="AX1" :y2="AMID" />
          <line class="ca-fft-axis" :x1="AX0" :y1="18" :x2="AX0" :y2="AMID + AHH + 16" />
          <line class="ca-fft-axis" :x1="AX0" :y1="BTOP - 4" :x2="AX0" :y2="BBOT" />
          <line class="ca-fft-axis" :x1="AX0" :y1="BBOT" :x2="AX1" :y2="BBOT" />
          <line class="is-ref" :x1="AX0" :y1="BTOP" :x2="AX1" :y2="BTOP" />
        </g>

        <text class="ca-fft-lab" :x="AX0 + 4" y="14" text-anchor="start">波形（示意）</text>
        <text class="ca-fft-lab" :x="AX1" :y="BTOP - 8" text-anchor="end">谱线高度＝1/k</text>
        <text class="ca-fft-ref" :x="AX0 - 5" :y="BTOP + 3" text-anchor="end">1</text>
        <text class="ca-fft-ref" :x="AX0 - 5" :y="BBOT + 3" text-anchor="end">0</text>

        <path class="ca-fft-step" :d="STEP" />
        <path class="ca-fft-one" :d="PATH_ONE" />
        <path class="ca-fft-many" :d="PATH_SEVEN" />

        <g class="ca-fft-stem" v-for="st in STEMS" :key="st.k">
          <line :x1="st.x" :y1="BBOT" :x2="st.x" :y2="st.y" />
          <text class="ca-fft-stemlab" :x="st.x" :y="st.y - 4">{{ st.text }}</text>
        </g>

        <text class="ca-fft-k" :x="AX1" :y="BBOT + 15" text-anchor="end">只有奇次：1、3、5…</text>
        <text class="ca-fft-note" :x="AX1" :y="H - 4" text-anchor="end">形状按公式算，不是实测</text>
      </svg>

      <p class="ca-fft-legend">
        <span class="ca-fft-chip is-ref"></span>蓝虚线：目标方波——只有"高"和"低"两档
        <span class="ca-fft-chip is-cost"></span>珊瑚：只给它一条基频正弦，连方的影子都没有
        <span class="ca-fft-chip is-pick"></span>青：七条奇次正弦相加（1、1/3、1/5…1/13），已经很像方，
        但拐角处会多出一点过冲和振铃——项数取到有限，角就永远不尖。
      </p>

      <span class="sr-only">
        这张图是按傅里叶级数公式生成的示意，横轴是相位、不是秒；纵轴是幅度、不是伏。
        方波展开只有奇次项，第 k 次的幅度是基频的 1 除以 k：1、三分之一、五分之一、七分之一，一直到十三次项，
        共七项相加。拐角处的过冲是有限项的必然结果，不是画图误差。
        下面这些才是有出处的数字：Cooley 与 Tukey 的 FFT 论文发表于 1965 年，
        期刊是 Math. Comp. 第 19 卷第 89 期第 297 到 301 页；更早的史实是高斯约 1805 年已有等价的
        内插周期计算手稿，发表于其全集第 3 卷、约 1866 年前后，所以"1965 年第一次想到"只在数字计算机时代这个限定下成立。
        计算量：样本数 n 等于 1024 时，按定义直接算需要 n 的平方，也就是 1,048,576 次复数乘法，
        约一百万次；用快速算法约需 n 除以 2 再乘 log2 n，即 5,120 次；这一档相差约 205 倍。
        省多少倍随 n 变大而变大，n 等于 100 万时约省 5 万倍，所以站内印"快多少倍"必须先印 n 是多少。
        音频侧的量级：CD 音质是 44.1 千赫兹采样、16 比特、2 声道，码率约 1,411 千比特每秒；
        MP3 常见档位 128 千比特每秒，约 11 比 1，这个 11 倍是本站按公式算的量级、不是官方指标，
        而且它是有损压缩（丢掉心理声学上不敏感的成分），不能与 ZIP 那类无损压缩比放在同一张柱状图里；
        "压到十一分之一音质一样"是主观听感结论。MP3 每帧取 1,152 个采样点做变换编码，
        在 44.1 千赫兹下约 26.1 毫秒一帧。应用落点：MP3 与 AAC 的音频编码、JPEG 用的 DCT（与 FFT 同源，
        基线 JPEG 按 8×8 块处理）、手机的信道均衡与 OFDM，都建立在这种快速变换上；
        音乐识别用频谱上的峰值构造哈希，机器振动诊断在频谱里找与转速相关的故障特征频率。
        "没有 FFT 就没有流媒体"方向正确但不可量化成百分比，这里只列场景、不列贡献比例。
      </span>
    </figure>

    <div class="ca-fft-cost">
      <p class="ca-fft-blockhead">
        "省了多少倍"要看 n 是多少<span class="ca-fft-hint">n＝{{ N_FFT }}，按公式计算</span>
      </p>
      <ul class="ca-fft-rows">
        <li class="ca-fft-row">
          <span class="ca-fft-rname">按定义算 DFT（n²）</span>
          <span class="ca-fft-rtrack"><span class="ca-fft-rfill is-cost" style="width: 100%"></span></span>
          <span class="ca-fft-rval">{{ DIRECT_TEXT }} 次</span>
        </li>
        <li class="ca-fft-row">
          <span class="ca-fft-rname">FFT 分治（n/2·log₂n）</span>
          <span class="ca-fft-rtrack"><span class="ca-fft-rfill is-pick" :style="{ width: `${FILL_OPS}%` }"></span></span>
          <span class="ca-fft-rval">{{ OPS_TEXT }} 次</span>
        </li>
      </ul>
      <p class="ca-fft-note-text">
        这一档是 <b>约 {{ RATIO }} 倍</b>，但它只在 n＝1024 上成立：事实库原话是"省 100 倍随 n 增大而增大，
        n＝100 万时约省 5 万倍"（I-33，可站内自证的算术）。所以任何"快 N 倍"后面必须跟着 n 是多少，
        否则就是在比两把不同的尺子。
      </p>
    </div>

    <div class="ca-fft-sound">
      <p class="ca-fft-blockhead">
        同一把变换，落在声音上是什么量级<span class="ca-fft-hint">A 级：限定语一起印</span>
      </p>
      <ul class="ca-fft-rows">
        <li class="ca-fft-row">
          <span class="ca-fft-rname">CD 未压缩（44.1 kHz×16×2）</span>
          <span class="ca-fft-rtrack"><span class="ca-fft-rfill is-ref" style="width: 100%"></span></span>
          <span class="ca-fft-rval">≈ {{ CD_KBPS }} kbps</span>
        </li>
        <li class="ca-fft-row">
          <span class="ca-fft-rname">MP3 常见档（有损）</span>
          <span class="ca-fft-rtrack"><span class="ca-fft-rfill is-pick" :style="{ width: `${LOSSY_PCT}%` }"></span></span>
          <span class="ca-fft-rval">{{ MP3_KBPS }} kbps</span>
        </li>
      </ul>
      <p class="ca-fft-note-text">
        约 <b>{{ TIMES }} 比 1</b>：这个倍数是本站按 1411÷128 算出来的量级，不是任何机构的指标；
        而且它砍掉的是"心理声学上不敏感的成分"，属于<b>有损压缩</b>——不许和 ZIP 那种无损压缩比放进同一张柱状图。
        "压到十一分之一听着一样"是主观结论，取决于内容、编码器和听的人。MP3 每帧取
        <b>1,152</b> 个采样点做一次变换编码，44.1 kHz 下约 <b>26.1</b> 毫秒一帧（帧长是标准规定值，
        "帧越长延迟越大"要看具体实现）。
      </p>
    </div>

    <div class="ca-fft-uses">
      <p class="ca-fft-blockhead">
        它到底在设备里干什么<span class="ca-fft-hint">只列场景，不列"贡献了多少比例"</span>
      </p>
      <ul class="ca-fft-usetxt">
        <li>
          <b>音频编码</b>：MP3／AAC 把一小段声音变换到频域，再按掩蔽模型决定每个频段留几位精度
          （AAC 用更现代的感知编码与更灵活的窗长；站内不印"AAC 比 MP3 好百分之几"这种统一数）。
        </li>
        <li>
          <b>图像</b>：JPEG 走的是 DCT（离散余弦变换），与 FFT 同源、都是把信号拆成不同频率的分量；
          基线 JPEG 按 8×8 块处理，真正"丢掉信息"的是量化那一步，不是变换本身。
        </li>
        <li>
          <b>无线</b>：手机上的信道均衡与 OFDM 都靠这种 O(n log n) 的变换，这也是 4G／5G 物理层的日常。
        </li>
        <li>
          <b>识别与诊断</b>：音乐识别在短时频谱上挑峰值、把峰对做成哈希；机器振动诊断在频谱里找与转速相关的
          故障特征频率（轴承外圈、滚动体那几类）。两者的"成功率／提前几天预警"都绑死条件，站内不印统一数。
        </li>
      </ul>
    </div>

    <div class="ca-fft-history">
      <p class="ca-fft-blockhead">1965 年那篇论文，和它前面那一百六十年</p>
      <ul class="ca-fft-tl">
        <li class="is-ref">
          <span class="ca-fft-year">约 1805</span>
          <span class="ca-fft-tltxt">高斯已有等价的内插周期计算手稿，发表于其全集第 3 卷、约 1866 年前后。</span>
        </li>
        <li class="is-pick">
          <span class="ca-fft-year">1965</span>
          <span class="ca-fft-tltxt">
            Cooley &amp; Tukey，Math. Comp. 19(89): 297–301：把 DFT 从 O(n²) 降到 O(n log n)。
          </span>
        </li>
      </ul>
      <p class="ca-fft-note-text">
        "FFT 是 1965 年才第一次被想到"是流传说法：<b>那句只在"数字计算机时代"这个限定下成立</b>。
        站内讲这段历史必须把高斯的手稿并列印出来，不能写成凭空发明（I-32／P-81）。
      </p>
    </div>

    <p class="ca-cap">
      上面两块图形是<b>示意</b>——方波与谱线按傅里叶级数公式算出来，只表达形状，没有任何实测信号；
      能被引用的是这几句：n＝1024 时，按定义要
      <b>{{ DIRECT_TEXT }}</b> 次复数乘法、FFT 约 <b>{{ OPS_TEXT }}</b> 次（约 <b>{{ RATIO }} 倍</b>，
      n＝100 万时约省 5 万倍，所以倍数必须和 n 一起印）；CD 的 <b>{{ CD_KBPS }} kbps</b> 与 MP3 的
      <b>{{ MP3_KBPS }} kbps</b> 约 <b>{{ TIMES }} 比 1</b>，是有损压缩的量级、不是官方指标；
      而"1965 年发明"这句话，得带上高斯约 <b>1805</b> 年的那份手稿才成立。
    </p>
  </div>
</template>

<style scoped>
.ca-fft-spectrum {
  max-width: 640px;
  margin-inline: auto;
}

.ca-fft-fig {
  margin: 0;
  min-width: 0;
}

.ca-fft-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-fft-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-fft-grid .ca-fft-axis {
  stroke: var(--line-strong);
}

.ca-fft-grid .is-zero {
  stroke: var(--line-strong);
  opacity: 0.75;
}

.ca-fft-grid .is-ref {
  stroke: var(--blue-soft);
  stroke-dasharray: 3 3;
}

.ca-fft-lab {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
}

.ca-fft-ref {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-fft-k {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-fft-note {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-fft-step,
.ca-fft-one,
.ca-fft-many {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ca-fft-step {
  stroke: var(--blue);
  stroke-width: 1.6;
  stroke-dasharray: 6 4;
}

.ca-fft-one {
  stroke: var(--coral);
  stroke-width: 1.4;
  opacity: 0.85;
}

.ca-fft-many {
  stroke: var(--accent);
  stroke-width: 2;
  animation: ca-fft-draw 1.2s var(--ease) both;
}

@keyframes ca-fft-draw {
  from {
    opacity: 0;
  }
}

.ca-fft-stem line {
  stroke: var(--accent);
  stroke-width: 2.4;
  stroke-linecap: round;
  animation: ca-fft-rise 0.9s var(--ease) both;
}

@keyframes ca-fft-rise {
  from {
    opacity: 0;
  }
}

.ca-fft-stemlab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-fft-legend {
  display: grid;
  gap: 5px;
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-fft-chip {
  display: inline-block;
  width: 14px;
  height: 3px;
  margin-right: 6px;
  border-radius: 999px;
  vertical-align: middle;
}

.ca-fft-chip.is-ref {
  background: var(--blue);
}

.ca-fft-chip.is-cost {
  background: var(--coral);
}

.ca-fft-chip.is-pick {
  background: var(--accent);
}

.ca-fft-cost,
.ca-fft-sound,
.ca-fft-uses,
.ca-fft-history {
  min-width: 0;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-fft-blockhead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-fft-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-fft-rows {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-fft-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) 74px;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-fft-rname {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-fft-rval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-fft-rtrack {
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-fft-rfill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ca-fft-grow 0.9s var(--ease) both;
}

.ca-fft-rfill.is-cost {
  background: var(--coral);
}

.ca-fft-rfill.is-pick {
  background: var(--accent);
}

.ca-fft-rfill.is-ref {
  background: var(--blue);
  opacity: 0.75;
}

@keyframes ca-fft-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-fft-note-text {
  margin: 11px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-fft-note-text b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-fft-usetxt {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-fft-usetxt b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-fft-tl {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-fft-tl li {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  min-width: 0;
  padding-left: 8px;
  border-left: 2px solid var(--line);
}

.ca-fft-tl li.is-ref {
  border-left-color: var(--blue);
}

.ca-fft-tl li.is-pick {
  border-left-color: var(--accent);
}

.ca-fft-year {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
}

.ca-fft-tltxt {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 620px) {
  .ca-fft-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 70px;
  }

  .ca-fft-rname {
    font-size: 10.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-fft-many,
  .ca-fft-stem line,
  .ca-fft-rfill {
    animation: none;
  }
}
</style>
