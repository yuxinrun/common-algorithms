<script setup lang="ts">
// 同一份点集，两种聚类各切一刀。
// 点集是写死的：两条同心月牙弧（外面一条 30 个点、里面一条 30 个点），
// 坐标由固定公式算出，不引入任何随机源，SSR 与客户端完全一致。
// 两组算法都真跑：K-Means 用固定规则的初始中心 + 反复重分配；DBSCAN 用距离阈值 + 邻居数量。

const CY = 46
const round2 = (v: number) => Math.round(v * 100) / 100

type Pt = { x: number; y: number; g: number }

// 一条弧上的 30 个点；j 是固定的小偏移，让形状看起来自然，不引入任何随机
const arc = (r: number, n: number, seed: number, amp: number, g: number): Pt[] => {
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = ((20 + (i / (n - 1)) * 140) * Math.PI) / 180
    const j = (((i * seed) % 5) - 2) * amp
    out.push({
      x: round2(50 + (r + j) * Math.cos(a)),
      y: round2(CY - (r + j) * Math.sin(a)),
      g
    })
  }
  return out
}

const OUTER = arc(34, 30, 37, 0.7, 0)
const INNER = arc(19, 30, 53, 0.7, 1)
const PTS: Pt[] = [...OUTER, ...INNER]
const TOTAL = PTS.length

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

// —— K-Means：先定两个中心，各自把点分给最近的中心，再把中心挪到组员平均位置，重复
const meanX = PTS.reduce((s, p) => s + p.x, 0) / TOTAL
const meanY = PTS.reduce((s, p) => s + p.y, 0) / TOTAL
const toMean = PTS.map((p) => dist(p, { x: meanX, y: meanY, g: 0 }))
const SEED_A = PTS[toMean.indexOf(Math.min(...toMean))]
const fromA = PTS.map((p) => dist(p, SEED_A))
const SEED_B = PTS[fromA.indexOf(Math.max(...fromA))]

type Cen = { x: number; y: number }
let cens: Cen[] = [{ x: SEED_A.x, y: SEED_A.y }, { x: SEED_B.x, y: SEED_B.y }]
let kmLabels: number[] = []
for (let it = 0; it < 200; it++) {
  kmLabels = PTS.map((p) => {
    const d = cens.map((c) => dist(p, { x: c.x, y: c.y, g: 0 }))
    return d.indexOf(Math.min(...d))
  })
  const next: Cen[] = [0, 1].map((c) => {
    const mem = PTS.filter((_, i) => kmLabels[i] === c)
    return { x: mem.reduce((s, p) => s + p.x, 0) / mem.length, y: mem.reduce((s, p) => s + p.y, 0) / mem.length }
  })
  const moved = next.some((c, i) => Math.abs(c.x - cens[i].x) > 1e-9 || Math.abs(c.y - cens[i].y) > 1e-9)
  cens = next
  if (!moved) break
}
const DIVIDER_X = +((cens[0].x + cens[1].x) / 2).toFixed(2)

// —— DBSCAN：距离 ≤ EPS 的邻居凑够 MIN_PTS 个就算核心点，核心点手拉手连成一簇
const EPS = 6
const MIN_PTS = 4
const REGION = PTS.map((p) => PTS.map((_, j) => j).filter((j) => dist(p, PTS[j]) <= EPS))
const dsLabels: number[] = new Array(TOTAL).fill(-2)
let cid = -1
for (let i = 0; i < TOTAL; i++) {
  if (dsLabels[i] !== -2) continue
  dsLabels[i] = -1
  if (REGION[i].length < MIN_PTS) continue
  cid += 1
  dsLabels[i] = cid
  const seeds = [...REGION[i]]
  for (let h = 0; h < seeds.length; h++) {
    const j = seeds[h]
    if (dsLabels[j] === -1) dsLabels[j] = cid
    if (dsLabels[j] !== -2) continue
    dsLabels[j] = cid
    if (REGION[j].length >= MIN_PTS) seeds.push(...REGION[j])
  }
}

// 两种标签都和"真实的那两条弧"对一次账（整体交换组号允许，因为编号本身没有意义）
const agree = (labels: number[], swap: boolean) =>
  labels.filter((l, i) => l >= 0 && (swap ? 1 - l : l) === PTS[i].g).length

const bestView = (labels: number[]) => {
  const s0 = agree(labels, false)
  const s1 = agree(labels, true)
  const swap = s1 > s0
  const hit = Math.max(s0, s1)
  return {
    hit,
    dots: PTS.map((p, i) => {
      const c = labels[i] < 0 ? -1 : swap ? 1 - labels[i] : labels[i]
      return { x: p.x, y: p.y, g: p.g, c, wrong: c !== p.g }
    })
  }
}

const KM = bestView(kmLabels)
const DS = bestView(dsLabels)
const KM_HIT = KM.hit
const DS_HIT = DS.hit

// —— DBSCAN 面板上的"邻居连线"：距离在 EPS 以内就连一下，看得出两条弧各自连成一串
let LINKS = ''
for (let i = 0; i < TOTAL; i++) {
  for (let j = i + 1; j < TOTAL; j++) {
    if (dsLabels[i] === dsLabels[j] && dsLabels[i] >= 0 && dist(PTS[i], PTS[j]) <= EPS) {
      LINKS += `M${PTS[i].x} ${PTS[i].y}L${PTS[j].x} ${PTS[j].y}`
    }
  }
}
const LINK_COUNT = (LINKS.match(/M/g) || []).length
</script>

<template>
  <div class="ca-cluster-compare ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">K-Means vs DBSCAN · 两种分法</span>
      <p class="ca-widget-sub">同一批 60 个点，两种聚类各切一刀：一刀按"离中心近"，一刀按"离得近就连手"。</p>
    </div>

    <figure class="ca-cc-fig">
      <div class="ca-cc-panels">
        <div class="ca-cc-panel">
          <p class="ca-cc-name">K-Means：先点两个中心，强行分成 2 团</p>
          <svg class="ca-cc-svg" viewBox="0 0 100 50" role="presentation" aria-hidden="true" focusable="false">
            <line class="ca-cc-divider" :x1="DIVIDER_X" y1="4" :x2="DIVIDER_X" y2="46" />
            <template v-for="(p, i) in KM.dots" :key="`k-${i}`">
              <rect
                v-if="p.g === 1"
                :class="['ca-cc-dot', p.c === 0 ? 'ca-cc-a' : 'ca-cc-b']"
                :x="p.x - 1.5"
                :y="p.y - 1.5"
                width="3"
                height="3"
              />
              <circle
                v-else
                :class="['ca-cc-dot', p.c === 0 ? 'ca-cc-a' : 'ca-cc-b']"
                :cx="p.x"
                :cy="p.y"
                r="1.9"
              />
              <circle v-if="p.wrong" class="ca-cc-ring" :cx="p.x" :cy="p.y" r="3.4" />
            </template>
            <g class="ca-cc-center">
              <line :x1="cens[0].x - 2.6" :y1="cens[0].y - 2.6" :x2="cens[0].x + 2.6" :y2="cens[0].y + 2.6" />
              <line :x1="cens[0].x - 2.6" :y1="cens[0].y + 2.6" :x2="cens[0].x + 2.6" :y2="cens[0].y - 2.6" />
              <line :x1="cens[1].x - 2.6" :y1="cens[1].y - 2.6" :x2="cens[1].x + 2.6" :y2="cens[1].y + 2.6" />
              <line :x1="cens[1].x - 2.6" :y1="cens[1].y + 2.6" :x2="cens[1].x + 2.6" :y2="cens[1].y - 2.6" />
            </g>
          </svg>
          <p class="ca-cc-score">跟真实的两条弧对账：只对 <b>{{ KM_HIT }}</b> / {{ TOTAL }} 个</p>
        </div>

        <div class="ca-cc-panel">
          <p class="ca-cc-name">DBSCAN：邻居够多就连成一簇</p>
          <svg class="ca-cc-svg" viewBox="0 0 100 50" role="presentation" aria-hidden="true" focusable="false">
            <path class="ca-cc-link" :d="LINKS" />
            <template v-for="(p, i) in DS.dots" :key="`d-${i}`">
              <rect
                v-if="p.g === 1"
                :class="['ca-cc-dot', p.c === 0 ? 'ca-cc-a' : 'ca-cc-b']"
                :x="p.x - 1.5"
                :y="p.y - 1.5"
                width="3"
                height="3"
              />
              <circle
                v-else
                :class="['ca-cc-dot', p.c === 0 ? 'ca-cc-a' : 'ca-cc-b']"
                :cx="p.x"
                :cy="p.y"
                r="1.9"
              />
            </template>
          </svg>
          <p class="ca-cc-score">连了 <b>{{ LINK_COUNT }}</b> 条邻居线，分成 2 簇：对 <b>{{ DS_HIT }}</b> / {{ TOTAL }} 个</p>
        </div>
      </div>

      <p class="ca-cc-legend">
        形状是"真实答案"：圆点属于外面那条弧，方块属于里面那条弧。颜色是算法分的组——
        青色一组、蓝色一组。左图红圈是 K-Means 分错的那些点。示意点集（坐标写死），不是实测数据。
      </p>

      <span class="sr-only">
        同一份写死的 60 个点，排成两条同心月牙弧，每条 30 个点。
        K-Means 按两个中心切成左右两半，把每条弧都劈开，跟真实答案对齐后只对 {{ KM_HIT }} 个，也就是 60 个里对一半；
        DBSCAN 按"距离 6 以内、邻居至少 4 个"连成簇，连了 {{ LINK_COUNT }} 条邻居线，正好分出上下两条弧，{{ DS_HIT }} 个全对。
        这是示意点集，坐标写死，不是实测数据。
      </span>
    </figure>

    <p class="ca-cap">
      同样的 60 个点，K-Means 只对 <b>{{ KM_HIT }}</b> 个，DBSCAN 对 <b>{{ DS_HIT }}</b> 个——比的不是谁算得准，
      而是你<b>事先假设数据长什么形状</b>：一个假设"每团都圆滚滚"，一个假设"挤在一起就连手"。示意点集，坐标写死。
    </p>
  </div>
</template>

<style scoped>
.ca-cc-fig {
  margin: 0;
}

.ca-cc-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ca-cc-panel {
  min-width: 0;
  padding: 9px 9px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
}

.ca-cc-name {
  margin: 0 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cc-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-cc-divider {
  stroke: var(--line-strong);
  stroke-width: 0.7;
  stroke-dasharray: 2.4 2;
}

.ca-cc-link {
  fill: none;
  stroke: var(--muted);
  stroke-width: 0.35;
  opacity: 0.5;
}

.ca-cc-dot {
  stroke: var(--panel);
  stroke-width: 0.4;
}

.ca-cc-a {
  fill: var(--accent);
}

.ca-cc-b {
  fill: var(--blue);
}

.ca-cc-ring {
  fill: none;
  stroke: var(--coral);
  stroke-width: 0.7;
}

.ca-cc-center line {
  stroke: var(--ink);
  stroke-width: 0.8;
}

.ca-cc-score {
  margin: 7px 0 0;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cc-score b {
  color: var(--ink-2);
}

.ca-cc-legend {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

@media (max-width: 620px) {
  .ca-cc-panels {
    grid-template-columns: minmax(0, 1fr);
  }

  .ca-cc-name,
  .ca-cc-score {
    font-size: 9.5px;
  }
}
</style>
