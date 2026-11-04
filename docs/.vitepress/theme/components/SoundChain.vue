<script setup lang="ts">
// 声音从空气到耳机经过哪几道算法。
// 链路上的每个数字都是 setup 里算出来的：采样率×位深×声道数得到未压缩码率，
// 除以常见 MP3 档得到倍数；波长用声速除以频率得到。没有随机、没有读时间。

const RATE = 44100 // 采样次数/秒（CD 口径，也是站内声音行的锚点）
const BITS = 16 // 每个样本的位深
const CH = 2 // 双声道
const MP3 = 128 // 常见档位之一，不是上限
const BLOCK = 1152 // MP3 每块的采样点数（改进离散余弦变换的工作尺寸）
const SPEED = 343 // 声速，米/秒（常温空气）
const MS = 1000
const PER_MS = SPEED / MS // 每毫秒声音走多少米
const LO_HZ = 100
const MID_HZ = MS
const HI_HZ = 10 * MS

const pcmKbps = Math.round(((RATE * BITS * CH) / MS) * 10) / 10
const ratio = Math.round((pcmKbps / MP3) * 10) / 10
const blockMs = Math.round((BLOCK / RATE) * MS * 10) / 10

type Node = { t: string; s: string; kind: 'ref' | 'algo' | 'lossy' | 'back' }

// 上行=把空气变成数；下行=把数变回空气。红框那两环是信息真正被删掉的地方。
const LINE_A: Node[] = [
  { t: '空气里的疏密', s: '声波：压强起伏', kind: 'ref' },
  { t: '麦克风振膜', s: '振动变电压', kind: 'ref' },
  { t: '每秒取样', s: `${RATE} 次/秒`, kind: 'algo' },
  { t: '样本存几位', s: `${BITS} bit 量化`, kind: 'lossy' }
]
const LINE_B: Node[] = [
  { t: '心理声学编码', s: '掩蔽阈值下删', kind: 'lossy' },
  { t: '存成 MP3', s: `常见 ${MP3} kbps`, kind: 'algo' },
  { t: '解码回波形', s: `每块 ${BLOCK} 点`, kind: 'algo' },
  { t: '耳机推空气', s: '又是振膜', kind: 'back' }
]

// —— 画布几何 ——
const OX = 10
const BW = 100
const BH = 30
const GX = 12
const W = OX * 2 + BW * 4 + GX * 3
const H = 128
const ROW_Y = [18, 84]

const boxAt = (row: number, i: number) => ({
  x: OX + i * (BW + GX),
  y: ROW_Y[row],
  cx: Math.round((OX + i * (BW + GX) + BW / 2) * 10) / 10
})

const CHAIN = [LINE_A, LINE_B].map((row, ri) =>
  row.map((n, i) => ({ ...n, ...boxAt(ri, i), row: ri }))
)

const KEEP_PCT = Math.max(4, Math.round((MP3 / pcmKbps) * 100))

const LONGEST = SPEED / LO_HZ // 最长的锚点：100 赫兹的波长
const SHORTEST = SPEED / HI_HZ // 最短的锚点：10 千赫兹的波长
const SPAN = Math.log10(LONGEST) - Math.log10(SHORTEST)

const WAVES = [
  { hz: LO_HZ, name: '低音 100 赫兹', label: '100 赫兹' },
  { hz: MID_HZ, name: '人声 1 千赫兹', label: '1 千赫兹' },
  { hz: HI_HZ, name: '镲片 10 千赫兹', label: '10 千赫兹' }
].map((w) => {
  const m = Math.round((SPEED / w.hz) * 100) / 100 // 米，保留两位
  const cm = Math.round((SPEED / w.hz) * MS) / 10 // 厘米，保留一位
  return {
    ...w,
    text: m >= 1 ? `${m} 米` : `${cm} 厘米`,
    pct: Math.max(8, Math.round(((Math.log10(SPEED / w.hz) - Math.log10(SHORTEST)) / SPAN) * 100))
  }
})
</script>

<template>
  <div class="ca-sound-chain ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Audio Pipeline · 声音到耳机的几道算法</span>
      <p class="ca-widget-sub">空气的疏密最后能变成耳机的振动，中间这几步每步都只解决一个小问题。</p>
    </div>

    <figure class="ca-sound-chain-fig">
      <svg
        class="ca-sound-chain-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-sound-chain-tag" :x="W - OX" :y="H - 4">红框＝信息在这里被删</text>

        <g v-for="(n, i) in CHAIN[0]" :key="`a-${i}`" class="ca-sound-chain-node" :class="`is-${n.kind}`">
          <rect class="ca-sound-chain-box" :x="n.x" :y="n.y" :width="BW" :height="BH" rx="4" />
          <text class="ca-sound-chain-t" :x="n.cx" :y="n.y + 13">{{ n.t }}</text>
          <text class="ca-sound-chain-s" :x="n.cx" :y="n.y + 25">{{ n.s }}</text>
          <line v-if="i < 3" class="ca-sound-chain-arrow" :x1="n.x + BW" :y1="n.y + BH / 2" :x2="n.x + BW + GX" :y2="n.y + BH / 2" />
        </g>
        <path class="ca-sound-chain-drop" :d="`M ${W - OX - BW / 2} ${ROW_Y[0] + BH} V ${ROW_Y[1] - 8} H ${OX + BW / 2} V ${ROW_Y[1]}`" />
        <g v-for="(n, i) in CHAIN[1]" :key="`b-${i}`" class="ca-sound-chain-node" :class="`is-${n.kind}`">
          <rect class="ca-sound-chain-box" :x="n.x" :y="n.y" :width="BW" :height="BH" rx="4" />
          <text class="ca-sound-chain-t" :x="n.cx" :y="n.y + 13">{{ n.t }}</text>
          <text class="ca-sound-chain-s" :x="n.cx" :y="n.y + 25">{{ n.s }}</text>
          <line v-if="i < 3" class="ca-sound-chain-arrow" :x1="n.x + BW" :y1="n.y + BH / 2" :x2="n.x + BW + GX" :y2="n.y + BH / 2" />
        </g>
      </svg>

      <span class="sr-only">
        一条八环链路：空气里的疏密（声波）→ 麦克风振膜把振动变成电压 → 每秒取样
        {{ RATE }} 次 → 每个样本存 {{ BITS }} 位（这一步开始不可逆）→ 心理声学编码按掩蔽阈值删掉听不见的部分 →
        存成常见 {{ MP3 }} 千比特每秒的 MP3 → 解码回波形（每块 {{ BLOCK }} 个采样点，约 {{ blockMs }} 毫秒）→
        耳机振膜再推空气。
        未压缩的立体声是 {{ RATE }} × {{ BITS }} × {{ CH }} 比特每秒，约 {{ pcmKbps }} 千比特每秒；
        {{ MP3 }} 千比特每秒只有它的约 {{ ratio }} 分之一。
        另外三个波长：100 赫兹约 {{ WAVES[0].text }}，1 千赫兹约 {{ WAVES[1].text }}，10 千赫兹约 {{ WAVES[2].text }}；
        声音每毫秒走约 {{ Math.round(PER_MS * 100) }} 厘米。
      </span>
    </figure>

    <div class="ca-sound-chain-groups">
      <div class="ca-sound-chain-group">
        <p class="ca-sound-chain-glab">同一段声音，每秒多少信息（千比特）</p>
        <p class="ca-sound-chain-row">
          <span class="ca-sound-chain-rowlab is-ref">未压缩（双声道）</span>
          <span class="ca-sound-chain-track">
            <span class="ca-sound-chain-fill is-ref" style="width: 100%"></span>
          </span>
          <span class="ca-sound-chain-rowval">{{ pcmKbps }}</span>
        </p>
        <p class="ca-sound-chain-row">
          <span class="ca-sound-chain-rowlab is-accent">MP3 常见档</span>
          <span class="ca-sound-chain-track">
            <span class="ca-sound-chain-fill is-accent" :style="{ width: `${KEEP_PCT}%` }"></span>
            <span class="ca-sound-chain-fill is-cost" :style="{ width: `${100 - KEEP_PCT}%` }"></span>
          </span>
          <span class="ca-sound-chain-rowval">{{ MP3 }}</span>
        </p>
        <p class="ca-sound-chain-unit">约 <b>{{ ratio }}</b> 分之一；青色是留下的，红色是按掩蔽阈值删掉的量。</p>
      </div>

      <div class="ca-sound-chain-group">
        <p class="ca-sound-chain-glab">波长（对数刻度，一格 10 倍）</p>
        <p v-for="w in WAVES" :key="w.hz" class="ca-sound-chain-row">
          <span class="ca-sound-chain-rowlab">{{ w.name }}</span>
          <span class="ca-sound-chain-track">
            <span class="ca-sound-chain-fill is-ref" :style="{ width: `${w.pct}%` }"></span>
          </span>
          <span class="ca-sound-chain-rowval">{{ w.text }}</span>
        </p>
        <p class="ca-sound-chain-unit">声速取 {{ SPEED }} 米/秒：波长 = 声速 ÷ 频率。</p>
      </div>
    </div>

    <div class="ca-sound-chain-facts">
      <p class="ca-sound-chain-fact">
        <b>删东西的依据是"听不见"，不是"不重要"。</b>MP3 用的是心理声学模型：一个响音旁边较弱的声音会被"掩蔽"掉，
        编码器就把那部分码量省了。标准号是 ISO/IEC 11172-3（1993 年）。所以能说"多数人多数场景听不出差别"，
        <b>不能说"音质完全无损"</b>——它确实删了，删得对不对取决于你的耳朵和那副耳机。
      </p>
      <p class="ca-sound-chain-fact">
        <b>128 kbps 是档位，不是天花板。</b>MP3 每块处理 {{ BLOCK }} 个采样点（{{ RATE }} 赫兹下约 {{ blockMs }} 毫秒），
        用改进离散余弦变换加窗口；{{ MP3 }} 千比特每秒只是过去网络条件常见的中间档，这里拿它举例。
        上面那条"<b>约 {{ ratio }} 分之一</b>"是<b>这两个数相除的算术</b>（换了档位倍数就变），不是任何机构给的压缩承诺。
      </p>
      <p class="ca-sound-chain-fact">
        <b>有损和无损不能放在一根尺子上比。</b>这一条链路上的量化与心理声学编码都会真删信息；
        ZIP、霍夫曼那类无损编码一个比特都不丢，倍数小得多而且完全取决于内容。
        把"MP3 十一倍"和"ZIP 五倍"画进同一张排行榜是错的，所以这里只画了有损这一路。
        "听起来一样"是主观判断，也不当成指标印。
      </p>
      <p class="ca-sound-chain-fact">
        <b>降噪耳机为什么只跟低音较真。</b>主动降噪是采集外部噪声后播一发反相（相差半个周期、即 180°）的波去抵消它。
        麻烦在延迟：声音每毫秒就走约 {{ Math.round(PER_MS * 100) }} 厘米，而波长是
        {{ WAVES[0].text }}（{{ WAVES[0].label }}）到 {{ WAVES[2].text }}（{{ WAVES[2].label }}）——
        波长越长，同样的处理延迟占的比例越小，反相就还对得上。所以<b>低频稳定、高频偏弱</b>是几何问题，不是厂家偷懒。
        这类产品不写"消掉所有噪声"，也很少给可比的分贝数。
      </p>
      <p class="ca-sound-chain-fact">
        <b>"语音助手听见了"是另一条链。</b>常见做法是本地只做关键词检测，命中之后才把音频送去识别，
        再交给语言理解；本地检测不等于"绝对没有上传"，那要看产品自己的说明。
        识别质量用词错误率（WER）衡量：错词数 ÷ 参考文本总词数，绑测试集——"准确率 95%"脱离测试集就没有意义。
        误唤醒一类数字（论文里常见设定是每小时少于 0.5 次、错误接受率低于 5%）是<b>工程目标，不是标准</b>。
        解码这块的老底子：维特比算法（1967 年，IEEE Trans. Information Processing 原刊 IEEE Trans. IT 13(2): 260–267）
        至今还在语音识别的搜索里；长短期记忆网络出自 1997 年 Neural Computation 9(8): 1735–1780。
      </p>
    </div>

    <p class="ca-cap">
      一段双声道声音不压就是 <b>{{ pcmKbps }}</b> 千比特每秒（{{ RATE }} × {{ BITS }} × {{ CH }}），
      存成常见 MP3 档 <b>{{ MP3 }}</b> 千比特每秒，是它的约 <b>{{ ratio }}</b> 分之一；
      被删掉的依据是掩蔽阈值，不是"这段没用了"。链路里 <b>16 bit 量化</b> 和 <b>心理声学编码</b>
      两个红框就是全部"小下去"的地方——再顺一句：MP3、AAC、JPEG 用的是同一族变换（图里那两块红色都靠它）。
    </p>
  </div>
</template>

<style scoped>
.ca-sound-chain {
  max-width: 640px;
  margin-inline: auto;
}

.ca-sound-chain-fig {
  margin: 0;
}

.ca-sound-chain-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-sound-chain-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-sound-chain-box {
  fill: var(--panel-2);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.is-ref .ca-sound-chain-box {
  stroke: var(--blue);
}

.is-algo .ca-sound-chain-box {
  stroke: var(--accent);
}

.is-lossy .ca-sound-chain-box {
  stroke: var(--coral);
}

.is-back .ca-sound-chain-box {
  stroke: var(--lime);
}

.ca-sound-chain-t {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-sound-chain-s {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-sound-chain-arrow {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-sound-chain-drop {
  fill: none;
  stroke: var(--muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.ca-sound-chain-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 14px 20px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sound-chain-group {
  min-width: 0;
}

.ca-sound-chain-glab {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-sound-chain-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 62px;
  align-items: center;
  gap: 3px 8px;
  margin: 0 0 8px;
  min-width: 0;
}

.ca-sound-chain-rowlab {
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-sound-chain-rowlab.is-accent {
  color: var(--accent);
}

.ca-sound-chain-rowlab.is-ref {
  color: var(--blue);
}

.ca-sound-chain-track {
  grid-column: 1 / -1;
  display: flex;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-sound-chain-fill {
  display: block;
  min-width: 0;
  height: 100%;
}

.ca-sound-chain-fill.is-accent {
  background: var(--accent);
}

.ca-sound-chain-fill.is-cost {
  background: var(--coral);
  opacity: 0.75;
}

.ca-sound-chain-fill.is-ref {
  background: var(--blue);
}

.ca-sound-chain-rowval {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-sound-chain-unit {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-sound-chain-unit b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-sound-chain-node {
  animation: ca-sound-chain-in 0.7s var(--ease) both;
}

@keyframes ca-sound-chain-in {
  from {
    opacity: 0;
  }
}

.ca-sound-chain-facts {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-sound-chain-fact {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-sound-chain-fact b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 700px) {
  .ca-sound-chain-groups {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-sound-chain-node {
    animation: none;
  }
}
</style>
