<script setup lang="ts">
// 蒙特卡洛估 π：往一个正方形里撒点，数一数落在四分之一圆里的比例，乘 4 就是 π。
// 点由固定种子的 LCG 生成（s = (s * 1103515245 + 12345) % 2^31），
// 所以每次构建、每台设备跑出来的都是同一批点：服务端与客户端逐字节一致。

const MOD = 2147483648 // 2^31
const SEED = 21
const MAX_N = 10000

type Panel = { n: number; dot: number; every: number }
const PANEL_DEF: Panel[] = [
  { n: 10, dot: 3.2, every: 1 },
  { n: 100, dot: 1.7, every: 1 },
  { n: 1000, dot: 0.85, every: 1 },
  // 一万个点全画出来会把这一页撑爆：每 5 个画 1 个，计数和估值仍然按足 10000 个算
  { n: 10000, dot: 0.55, every: 5 }
]

// Math.imul 取乘积的低 32 位，>>> 0 转成无符号，再对 2^31 取模：
// 低位不被双精度舍入污染，结果与上面那条公式等价。
const nextRaw = (s: number) => ((Math.imul(s, 1103515245) + 12345) >>> 0) % MOD

type Dot = { x: number; y: number }
const DOTS: Dot[] = []
{
  let s = SEED
  for (let i = 0; i < MAX_N; i++) {
    s = nextRaw(s)
    const x = s / MOD
    s = nextRaw(s)
    const y = s / MOD
    DOTS.push({ x, y })
  }
}

const at = (v: number) => (v * 100).toFixed(1)
// 四分之一圆贴着正方形的左下角，所以点的纵坐标要翻一下
const seg = (p: Dot) => `M${at(p.x)} ${at(1 - p.y)}h.01`

const QUARTER = 'M 0 100 L 100 100 A 100 100 0 0 0 0 0 Z'

// 1) 先只管数：圆里有几个
const COUNTS = PANEL_DEF.map((def) => {
  let inside = 0
  for (let i = 0; i < def.n; i++) {
    const p = DOTS[i]
    if (p.x * p.x + p.y * p.y <= 1) inside += 1
  }
  // 按公式：π 估计的标准差 ≈ 4 × 根号下 p(1−p)/N，其中 p = π/4
  const q = Math.PI / 4
  return { inside, sd: (4 * Math.sqrt((q * (1 - q)) / def.n)).toFixed(3) }
})

// 2) 再只管画：画出来的那些点分两摞，一摞在圆里、一摞在圆外
const PANELS = PANEL_DEF.map((def, k) => {
  let dIn = ''
  let dOut = ''
  let drawn = 0
  for (let i = 0; i < def.n; i += def.every) {
    drawn += 1
    const p = DOTS[i]
    if (p.x * p.x + p.y * p.y <= 1) dIn += seg(p)
    else dOut += seg(p)
  }
  const est = (4 * COUNTS[k].inside) / def.n
  return {
    n: def.n,
    dot: def.dot,
    every: def.every,
    drawn,
    inside: COUNTS[k].inside,
    sd: COUNTS[k].sd,
    dIn,
    dOut,
    est: est.toFixed(3),
    err: Math.abs(est - Math.PI).toFixed(3)
  }
})

const ERR_100 = PANELS[1].err
const ERR_10000 = PANELS[3].err
const SD_100 = PANELS[1].sd
const SD_10000 = PANELS[3].sd
</script>

<template>
  <div class="ca-monte-carlo-pi ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Monte Carlo Pi · 撒点算 π</span>
      <p class="ca-widget-sub">同一个固定种子，撒 10 个、100 个、1000 个、10000 个点各估一次 π，看它爬得多慢。</p>
    </div>

    <figure class="ca-mc-fig">
      <div class="ca-mc-panels">
        <div v-for="p in PANELS" :key="p.n" class="ca-mc-panel">
          <p class="ca-mc-count">
            {{ p.n }} 个点<span v-if="p.every > 1">（只画了 {{ p.drawn }} 个）</span>
          </p>
          <svg class="ca-mc-svg" viewBox="-4 -4 108 108" role="presentation" aria-hidden="true" focusable="false">
            <rect class="ca-mc-square" x="0" y="0" width="100" height="100" />
            <path class="ca-mc-wedge" :d="QUARTER" />
            <path class="ca-mc-out" :d="p.dOut" :stroke-width="p.dot" />
            <path class="ca-mc-in" :d="p.dIn" :stroke-width="p.dot" />
            <path class="ca-mc-edge" :d="QUARTER" />
          </svg>
          <p class="ca-mc-est">π ≈ <b>{{ p.est }}</b></p>
          <p class="ca-mc-err">
            离真值 <b>{{ p.err }}</b><span class="ca-mc-sd">／按公式的量级 {{ p.sd }}</span>
          </p>
        </div>
      </div>

      <p class="ca-mc-note">
        青色点落在圆里，红色点落在圆外。最后一幅每 5 个点只画 1 个（画了 {{ PANELS[3].drawn }} 个），
        但数和估值都是按足 {{ PANELS[3].n }} 个点算的。
      </p>

      <span class="sr-only">
        固定种子撒点估 π，单位正方形里的四分之一圆，真值 3.14159。
        撒 10 个点，圆里 {{ PANELS[0].inside }} 个，估到 {{ PANELS[0].est }}，误差 {{ PANELS[0].err }}；
        撒 100 个点，圆里 {{ PANELS[1].inside }} 个，估到 {{ PANELS[1].est }}，误差 {{ PANELS[1].err }}，按公式的误差量级 {{ PANELS[1].sd }}；
        撒 1000 个点，圆里 {{ PANELS[2].inside }} 个，估到 {{ PANELS[2].est }}，误差 {{ PANELS[2].err }}，量级 {{ PANELS[2].sd }}；
        撒 10000 个点，圆里 {{ PANELS[3].inside }} 个，估到 {{ PANELS[3].est }}，误差 {{ PANELS[3].err }}，量级 {{ PANELS[3].sd }}；
        最后一幅每 5 个点画 1 个，共画了 {{ PANELS[3].drawn }} 个。
        青色点在圆里，红色点在圆外。这是同一串固定种子的伪随机点，示意图形，不是实测数据。
      </span>
    </figure>

    <p class="ca-cap">
      点数翻 <b>100</b> 倍（100 个变成 10000 个），误差只缩 <b>10</b> 倍：<b>{{ ERR_100 }}</b> 变成
      <b>{{ ERR_10000 }}</b>，刚好多对一位小数。这就是 <b>1/√N</b> 那种慢法——按公式，100 个点的误差量级约
      <b>{{ SD_100 }}</b>，10000 个点约 <b>{{ SD_10000 }}</b>；想再稳一位，还得再翻 100 倍。点由固定种子生成，示意、可复现。
    </p>
  </div>
</template>

<style scoped>
.ca-mc-fig {
  margin: 0;
}

.ca-mc-panels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ca-mc-panel {
  min-width: 0;
  padding: 8px 8px 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
}

.ca-mc-count,
.ca-mc-est,
.ca-mc-err {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-mc-count {
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-mc-est {
  margin-top: 6px;
  font-size: 11px;
  color: var(--ink-2);
}

.ca-mc-est b {
  color: var(--accent);
  font-weight: 700;
}

.ca-mc-sd {
  color: var(--faint);
}

.ca-mc-note {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

.ca-mc-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-mc-square {
  fill: var(--panel);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-mc-wedge {
  fill: var(--accent-soft);
  stroke: none;
}

.ca-mc-in,
.ca-mc-out {
  fill: none;
  stroke-linecap: round;
  animation: ca-mc-in 900ms var(--ease) both;
}

.ca-mc-in {
  stroke: var(--accent);
}

.ca-mc-out {
  stroke: var(--coral);
  opacity: 0.5;
}

.ca-mc-edge {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.2;
  opacity: 0.75;
}

@keyframes ca-mc-in {
  from {
    opacity: 0;
  }
}

@media (max-width: 940px) {
  .ca-mc-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .ca-mc-panels {
    gap: 8px;
  }

  .ca-mc-panel {
    padding: 7px 6px 5px;
  }

  .ca-mc-count,
  .ca-mc-err {
    font-size: 9px;
  }

  .ca-mc-est {
    font-size: 10.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-mc-in,
  .ca-mc-out {
    animation: none;
  }

  .ca-mc-out {
    opacity: 0.5;
  }
}
</style>
