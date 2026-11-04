<script setup lang="ts">
// 一张照片能压到多小，压掉的到底是什么。
// 图里不是示意图：setup 里真的对一个手工构造的 8×8 小块做了一遍 DCT，
// 再按三档量化表"除以步长、取整、再乘回来"，最后做逆变换算出还原误差。
// 全部是确定性浮点运算，SSR 与客户端逐字节一致；小块是举例数据，不是任何一张真实照片。

const SZ = 8 // 举例小块的边长（JPEG 的最小处理单元就是 8×8）
const CELLS = SZ * SZ
const LEVELS = 256 // 像素取值档数（0–255）
const NCOL = 4 // 原始小块 + 三个量化档位

// 举例小块：对角渐变 + 一条硬边 + 一点确定性纹理（没有任何随机）
const pixAt = (r: number, c: number) => {
  const tex =
    Math.sin(((17 * r + 11 * c) * Math.PI) / 40) + Math.sin(((7 * r + 23 * c) * Math.PI) / 36) / 2
  const norm = ((r + c) * 3 + (c >= 4 ? 22 : 0) + tex * 9 + 18) / 100
  return Math.round(Math.max(0, Math.min(1, norm)) * (LEVELS - 1))
}

const BLK: number[][] = []
for (let r = 0; r < SZ; r++) {
  BLK[r] = []
  for (let c = 0; c < SZ; c++) BLK[r][c] = pixAt(r, c)
}

const wk = (k: number) => (k === 0 ? Math.SQRT1_2 : 1)
const ct = (x: number, k: number) => Math.cos(((2 * x + 1) * k * Math.PI) / (2 * SZ))
const HALF = 1 / (SZ / 2) // 正/逆变换共用的归一化系数（就是 1/4）

// 正向 DCT-II（JPEG 用的那一组归一化系数）
const fwd = (src: number[][]) => {
  const out: number[][] = []
  for (let u = 0; u < SZ; u++) {
    out[u] = []
    for (let v = 0; v < SZ; v++) {
      let s = 0
      for (let x = 0; x < SZ; x++)
        for (let y = 0; y < SZ; y++) s += src[x][y] * ct(x, u) * ct(y, v)
      out[u][v] = HALF * wk(u) * wk(v) * s
    }
  }
  return out
}

// 逆向 DCT
const inv = (src: number[][]) => {
  const out: number[][] = []
  for (let x = 0; x < SZ; x++) {
    out[x] = []
    for (let y = 0; y < SZ; y++) {
      let s = 0
      for (let u = 0; u < SZ; u++)
        for (let v = 0; v < SZ; v++) s += HALF * wk(u) * wk(v) * src[u][v] * ct(x, u) * ct(y, v)
      out[x][y] = s
    }
  }
  return out
}

// 举例量化表：频率越高、步长越大（人眼对高频不敏感是这件事的经验依据）
const stepOf = (u: number, v: number) => 1 + Math.floor(((u + v) * 9) / 16)

const COEF = fwd(BLK)
const FLAT = COEF.flat()
const rawZero = FLAT.filter((x) => Math.abs(x) < 1e-9).length
// 亮度按"最大的交流系数"归一（直流那格天然最大，不参与归一，否则交流全成暗格）
const coefMax = Math.max(
  ...COEF.flatMap((row, u) => row.map((x, v) => (u === 0 && v === 0 ? 0 : Math.abs(x))))
)

const STAGES = [1, 3, 8]

const round2 = (v: number) => Math.round(v * 100) / 100

const QUANT = STAGES.map((st) => {
  const q: number[][] = []
  for (let u = 0; u < SZ; u++) {
    q[u] = []
    for (let v = 0; v < SZ; v++) q[u][v] = Math.round(COEF[u][v] / (stepOf(u, v) * st))
  }
  const deq = q.map((row, u) => row.map((x, v) => x * stepOf(u, v) * st))
  const rec = inv(deq)
  let acc = 0
  let worst = 0
  for (let r = 0; r < SZ; r++) {
    for (let c = 0; c < SZ; c++) {
      const d = Math.abs(rec[r][c] - BLK[r][c])
      acc += d
      if (d > worst) worst = d
    }
  }
  const alive: { op: number; dead: boolean }[][] = q.map((row, u) =>
    row.map((x, v) => ({ op: Math.abs(COEF[u][v]) / coefMax, dead: x === 0 }))
  )
  return {
    st,
    cells: alive,
    nz: q.flat().filter((x) => x !== 0).length,
    meanErr: round2(acc / CELLS),
    maxErr: round2(worst)
  }
})

// —— 画布几何 ——
const OX = 16
const CELL = 10
const CSTEP = 11
const BLOCK = SZ * CSTEP - 1
const GAPB = 16
const W = OX * 2 + NCOL * BLOCK + (NCOL - 1) * GAPB
const MIN_OP = 14
const H = 186
const TOP = 46

const colX = (k: number) => OX + k * (BLOCK + GAPB)
const BLOCKS = [
  {
    head: '原始小块',
    ref: true,
    cells: BLK.map((row) => row.map((p) => ({ op: p / (LEVELS - 1), dead: false }))),
    l1: `像素 ${CELLS} 个`,
    l2: `参照 0–${LEVELS - 1}`,
  },
  ...QUANT.map((s) => ({
    head: `量化×${s.st}`,
    ref: false,
    cells: s.cells,
    l1: `非零 ${s.nz}/${CELLS}`,
    l2: `误差 ${s.meanErr.toFixed(2)}`
  }))
].map((b, k) => ({
  ...b,
  x: colX(k),
  cx: Math.round((colX(k) + BLOCK / 2) * 10) / 10,
  rects: b.cells.flatMap((row, u) =>
    row.map((m, v) => ({
      x: Math.round(colX(k) + v * CSTEP),
      y: TOP + u * CSTEP,
      op: m.dead
        ? 0
        : Math.max(MIN_OP, Math.round(Math.min(1, Math.max(0, m.op)) * 100)) / 100,
      dead: m.dead
    }))
  )
}))

const KEEP = QUANT.map((s) => ({
  name: `量化×${s.st}`,
  keepPct: Math.round((s.nz / CELLS) * 100),
  lostPct: Math.round(((CELLS - s.nz) / CELLS) * 100),
  text: `${s.nz}/${CELLS}`
}))

const errMax = Math.max(...QUANT.map((s) => s.meanErr))
const ERR = QUANT.map((s) => ({
  name: `量化×${s.st}`,
  text: s.meanErr.toFixed(2),
  pct: Math.max(4, Math.round((s.meanErr / errMax) * 100)),
  tone: s.meanErr === Math.min(...QUANT.map((t) => t.meanErr)) ? 'accent' : s.meanErr === errMax ? 'cost' : 'ref'
}))
</script>

<template>
  <div class="ca-compression-bars ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Quantization · 压掉的是什么</span>
      <p class="ca-widget-sub">照片变小不是"塞进更小的盒子"，是有东西被扔掉了——扔的那一步能看见。</p>
    </div>

    <figure class="ca-compression-bars-fig">
      <svg
        class="ca-compression-bars-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-compression-bars-tag" :x="W - OX" :y="14">举例小块 · 真算了一遍</text>
        <text class="ca-compression-bars-legend" :x="OX" :y="14">深浅＝数值大小</text>

        <g v-for="b in BLOCKS" :key="b.x" class="ca-compression-bars-col">
          <text class="ca-compression-bars-head" :x="b.cx" :y="34">{{ b.head }}</text>
          <rect
            v-for="(r, i) in b.rects"
            :key="`r-${b.x}-${i}`"
            class="ca-compression-bars-cell"
            :class="{ 'is-dead': r.dead, 'is-ref': b.ref }"
            :x="r.x"
            :y="r.y"
            :width="CELL"
            :height="CELL"
            :fill-opacity="r.op"
          />
          <text class="ca-compression-bars-l1" :x="b.cx" :y="148">{{ b.l1 }}</text>
          <text class="ca-compression-bars-l2" :x="b.cx" :y="160">{{ b.l2 }}</text>
        </g>
        <line class="ca-compression-bars-axis" :x1="OX" :y1="168" :x2="W - OX" :y2="168" />
        <text class="ca-compression-bars-foot" :x="OX" :y="180">像素 → 系数 → 量化</text>
        <text class="ca-compression-bars-foot is-right" :x="W - OX" :y="180">暗红格＝取整归零</text>
      </svg>

      <span class="sr-only">
        举例用的 8×8 小块（共 {{ CELLS }} 个像素，取值 0 到 {{ LEVELS - 1 }} 档，不是任何一张真实照片）
        先做一遍二维 DCT，得到 {{ CELLS }} 个系数，其中本来就等于零的是 {{ rawZero }} 个。
        然后按三档量化表把每个系数除以步长再取整：第一档剩非零 {{ QUANT[0].nz }} 个，平均还原误差
        {{ QUANT[0].meanErr.toFixed(2) }} 档，最大 {{ QUANT[0].maxErr.toFixed(2) }} 档；
        第二档剩 {{ QUANT[1].nz }} 个，平均误差 {{ QUANT[1].meanErr.toFixed(2) }} 档，最大
        {{ QUANT[1].maxErr.toFixed(2) }} 档；第三档剩 {{ QUANT[2].nz }} 个，平均误差
        {{ QUANT[2].meanErr.toFixed(2) }} 档，最大 {{ QUANT[2].maxErr.toFixed(2) }} 档。
        注意第一档已经有 {{ CELLS - QUANT[0].nz }} 个系数被取整取没了——有损链路从最轻的那一档起就不是无损的。
      </span>
    </figure>

    <div class="ca-compression-bars-groups">
      <div class="ca-compression-bars-group">
        <p class="ca-compression-bars-glab">系数存活数（共 {{ CELLS }} 个）</p>
        <p v-for="k in KEEP" :key="k.name" class="ca-compression-bars-row">
          <span class="ca-compression-bars-rowlab">{{ k.name }}</span>
          <span class="ca-compression-bars-track">
            <span class="ca-compression-bars-keep" :style="{ width: `${k.keepPct}%` }"></span>
            <span class="ca-compression-bars-lost" :style="{ width: `${k.lostPct}%` }"></span>
          </span>
          <span class="ca-compression-bars-rowval">{{ k.text }}</span>
        </p>
      </div>
      <div class="ca-compression-bars-group">
        <p class="ca-compression-bars-glab">还原误差（0–255 档，每像素平均）</p>
        <p v-for="e in ERR" :key="e.name" class="ca-compression-bars-row">
          <span class="ca-compression-bars-rowlab" :class="`is-${e.tone}`">{{ e.name }}</span>
          <span class="ca-compression-bars-track">
            <span class="ca-compression-bars-fill" :class="`is-${e.tone}`" :style="{ width: `${e.pct}%` }"></span>
          </span>
          <span class="ca-compression-bars-rowval">{{ e.text }}</span>
        </p>
      </div>
    </div>

    <p class="ca-compression-bars-note">
      看第一档：量化表没放大，{{ CELLS }} 个系数里已经有 <b>{{ CELLS - QUANT[0].nz }}</b> 个被"除以步长再取整"取成了 0。
      这不是"存到别的地方去了"——反量化之后那些格子就只剩步长的整数倍，
      逆变换回来的画面和原画面差了平均 <b>{{ QUANT[0].meanErr.toFixed(2) }}</b> 档、最大
      <b>{{ QUANT[0].maxErr.toFixed(2) }}</b> 档（0–255 档内）。取整不可逆，所以"打开—另存—再打开"每来一次都会再削一刀，
      这就是编辑保存时那种越存越糊的世代损失。
    </p>

    <div class="ca-compression-bars-facts">
      <p class="ca-compression-bars-fact">
        <b>所以"一张照片能压到多小"这个问题，站内不给统一倍数。</b>"JPEG 随手压 20 倍""照片压到十分之一、二十分之一"
        这类说法查不到一手出处，也没有条件（内容、画质档、尺寸、色度二次采样都会改结果），它们属于流传说法，
        只放在这里辟谣。这张图能给的是机制：压掉的是<b>量化那一步被取整归零的高频系数</b>，
        前面那些环节（色彩表示、分块、DCT）都还没真正扔东西。
      </p>
      <p class="ca-compression-bars-fact">
        <b>DCT 为什么便宜到能实时做。</b>离散余弦变换与快速傅里叶变换同源，JPEG 用的是 DCT-II；
        快速算法把规模 n 的乘法量从"平方级"拉到"n  log n 级"——取 n=1024 时，直接算是上百万次乘加，
        快速算法约 5120 次。视频还多压一层：帧与帧之间重复的信息（I/P/B 帧的帧间冗余），同样不给统一倍数。
      </p>
      <p class="ca-compression-bars-fact">
        <b>旁边那条路是有损还是无损，别混在一根尺子上量。</b>霍夫曼编码（1952 年，IRE Transactions on Geoscience Electronics 原刊为
        IRE Proc. 40: 1099–1101）是<b>无损</b>的：平均码长不超过信源熵加 1 bit，短得多但一个字节都不丢，
        典型文本大约压到 2–3 倍，而真随机数据是 1 倍——压不动；所以"ZIP 平均压 5 倍"这种数也不印。
        JPEG/MP3 是<b>有损</b>：靠"人眼人耳看不见听不出"来换空间。两者数量级不能同图比较，
        这也是上面这组条形只画量化、不画"压缩比排行榜"的原因。
      </p>
      <p class="ca-compression-bars-fact">
        <b>手机拍照时，压之前还有别的算法。</b>多帧合成（HDR 一类）会把连拍的几帧对齐后再合并，
        站内不印统一的"拍几张"；人像磨皮的常见实现是<b>双边滤波</b>这类保留边缘的平滑，
        不是"AI 修图"——它认的是局部亮度差异，不认脸。这些都不改变上面那条结论：真正扔信息的是量化。
      </p>
    </div>

    <p class="ca-cap">
      同一块 8×8 举例小块：<b>{{ CELLS }}</b> 个系数在量化前一个不少，最轻的一档只剩
      <b>{{ QUANT[0].nz }}</b> 个非零，放大到第三档剩 <b>{{ QUANT[2].nz }}</b> 个，
      平均误差从 <b>{{ QUANT[0].meanErr.toFixed(2) }}</b> 涨到 <b>{{ QUANT[2].meanErr.toFixed(2) }}</b>（0–255 档）。
      "压到多小"没有统一答案（小块与三档量化表都是举例，倍数不外推），但有确定的答案：<b>扔掉的是被取整归零的那几十个系数</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-compression-bars {
  max-width: 640px;
  margin-inline: auto;
}

.ca-compression-bars-fig {
  margin: 0;
}

.ca-compression-bars-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-compression-bars-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-compression-bars-legend {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-compression-bars-head {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--accent);
  text-anchor: middle;
}

.ca-compression-bars-cell {
  fill: var(--accent);
}

.ca-compression-bars-cell.is-ref {
  fill: var(--blue);
}

.ca-compression-bars-cell.is-dead {
  fill: var(--coral);
  fill-opacity: 0.22;
}

.ca-compression-bars-l1 {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-compression-bars-l2 {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-compression-bars-axis {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-opacity: 0.6;
}

.ca-compression-bars-foot {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: start;
}

.ca-compression-bars-foot.is-right {
  text-anchor: end;
}

.ca-compression-bars-col {
  animation: ca-compression-bars-in 0.8s var(--ease) both;
}

@keyframes ca-compression-bars-in {
  from {
    opacity: 0;
  }
}

.ca-compression-bars-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 14px 20px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-compression-bars-group {
  min-width: 0;
}

.ca-compression-bars-glab {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-compression-bars-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px;
  align-items: center;
  gap: 3px 8px;
  margin: 0 0 8px;
  min-width: 0;
}

.ca-compression-bars-rowlab {
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-compression-bars-rowlab.is-accent {
  color: var(--accent);
}

.ca-compression-bars-rowlab.is-cost {
  color: var(--coral);
}

.ca-compression-bars-rowlab.is-ref {
  color: var(--blue);
}

.ca-compression-bars-track {
  grid-column: 1 / -1;
  display: flex;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-compression-bars-keep,
.ca-compression-bars-lost,
.ca-compression-bars-fill {
  display: block;
  min-width: 0;
  height: 100%;
}

.ca-compression-bars-keep {
  background: var(--accent);
}

.ca-compression-bars-lost {
  background: var(--coral);
}

.ca-compression-bars-fill.is-accent {
  background: var(--accent);
}

.ca-compression-bars-fill.is-cost {
  background: var(--coral);
}

.ca-compression-bars-fill.is-ref {
  background: var(--blue);
  opacity: 0.75;
}

.ca-compression-bars-rowval {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-compression-bars-note,
.ca-compression-bars-fact {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-compression-bars-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-compression-bars-facts {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-compression-bars-note b,
.ca-compression-bars-fact b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 700px) {
  .ca-compression-bars-groups {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-compression-bars-col {
    animation: none;
  }
}
</style>
