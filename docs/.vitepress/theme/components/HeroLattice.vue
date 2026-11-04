<script setup lang="ts">
// 首页 Hero：一张方格纸，一条绕开障碍的最短路径。
// 这就是本站想讲的那件事——算法不神秘，它是"在一堆走法里挑一个不那么绕的"。
// 纯几何 + 确定性 BFS，不碰 window / Math.random / Date，服务端与客户端渲染完全一致。

const COLS = 12
const ROWS = 10
const CELL = 27
const OX = 18
const OY = 18

type Cell = { c: number; r: number }
const key = (c: number, r: number) => `${c}:${r}`

// 两道墙，各留一个缺口：路径必须拐弯，但拐的是最短的那两下
const WALLS: Cell[] = [
  ...[0, 1, 2, 3, 4, 5, 6].map((r) => ({ c: 5, r })),
  ...[3, 4, 5, 6, 7, 8, 9].map((r) => ({ c: 8, r }))
]
const BLOCKED = new Set(WALLS.map((w) => key(w.c, w.r)))

const START: Cell = { c: 0, r: 4 }
const GOAL: Cell = { c: 11, r: 5 }

const NEIGHBORS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
] as const

// 确定性 BFS：队列顺序固定，所以每次构建出来的图一模一样
const dist = new Map<string, number>()
const from = new Map<string, string>()
const queue: Cell[] = [START]
dist.set(key(START.c, START.r), 0)

for (let head = 0; head < queue.length; head++) {
  const cur = queue[head]
  const d = dist.get(key(cur.c, cur.r))!
  for (const [dc, dr] of NEIGHBORS) {
    const c = cur.c + dc
    const r = cur.r + dr
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue
    const k = key(c, r)
    if (BLOCKED.has(k) || dist.has(k)) continue
    dist.set(k, d + 1)
    from.set(k, key(cur.c, cur.r))
    queue.push({ c, r })
  }
}

const goalKey = key(GOAL.c, GOAL.r)
const goalDist = dist.get(goalKey) ?? 0

const PATH: Cell[] = []
{
  let k: string | undefined = goalKey
  while (k) {
    const [c, r] = k.split(':').map(Number)
    PATH.push({ c, r })
    k = from.get(k)
  }
  PATH.reverse()
}

const round = (n: number) => Math.round(n * 100) / 100
const cx = (c: number) => round(OX + c * CELL + CELL / 2)
const cy = (r: number) => round(OY + r * CELL + CELL / 2)

const POLYLINE = PATH.map((p) => `${cx(p.c)},${cy(p.r)}`).join(' ')

// 搜索波纹：到得了、且不比终点更远的格子
const WAVE = [...dist.entries()]
  .filter(([k, d]) => d <= goalDist && !BLOCKED.has(k) && k !== goalKey)
  .map(([k, d]) => {
    const [c, r] = k.split(':').map(Number)
    return { c, r, d, op: round(0.1 + (1 - d / Math.max(goalDist, 1)) * 0.22) }
  })

const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  c: i % COLS,
  r: Math.floor(i / COLS)
}))

const STEPS = ['起点：你家门口', '撞墙：这条路不通', '换一条：还是最短', '终点：少拐两次弯']
</script>

<template>
  <div class="ca-hero-lattice ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Shortest Path · 最短路径</span>
      <p class="ca-widget-sub">生活里的算法大多长这样：走法很多，能忍的很少，得有个办法挑一个。</p>
    </div>

    <figure class="ca-hero-lattice-fig">
      <svg
        class="ca-hero-lattice-svg"
        :viewBox="`0 0 ${OX * 2 + COLS * CELL} ${OY * 2 + ROWS * CELL}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <g class="ca-hero-lattice-grid">
          <rect
            v-for="p in CELLS"
            :key="`g-${p.c}-${p.r}`"
            class="ca-hero-lattice-cell"
            :x="OX + p.c * CELL + 1"
            :y="OY + p.r * CELL + 1"
            :width="CELL - 2"
            :height="CELL - 2"
          />
        </g>

        <rect
          v-for="w in WALLS"
          :key="`w-${w.c}-${w.r}`"
          class="ca-hero-lattice-wall"
          :x="OX + w.c * CELL + 1"
          :y="OY + w.r * CELL + 1"
          :width="CELL - 2"
          :height="CELL - 2"
        />

        <rect
          v-for="p in WAVE"
          :key="`v-${p.c}-${p.r}`"
          class="ca-hero-lattice-wave"
          :x="OX + p.c * CELL + 4"
          :y="OY + p.r * CELL + 4"
          :width="CELL - 8"
          :height="CELL - 8"
          :opacity="p.op"
        />

        <polyline class="ca-hero-lattice-shadow" :points="POLYLINE" />
        <polyline class="ca-hero-lattice-path" :points="POLYLINE" />

        <circle class="ca-hero-lattice-start" :cx="cx(START.c)" :cy="cy(START.r)" r="8" />
        <circle class="ca-hero-lattice-goal" :cx="cx(GOAL.c)" :cy="cy(GOAL.r)" r="9" />
        <circle class="ca-hero-lattice-goal-ring" :cx="cx(GOAL.c)" :cy="cy(GOAL.r)" r="14" />

        <text class="ca-hero-lattice-tag" :x="cx(START.c) - 4" :y="cy(START.r) - 15">起点</text>
        <text class="ca-hero-lattice-tag" :x="cx(GOAL.c) - 4" :y="cy(GOAL.r) - 19">终点</text>
      </svg>

      <span class="sr-only">
        方格纸示意：{{ COLS }} 乘 {{ ROWS }} 的网格，中间有两道墙，一道留下方缺口，一道留上方缺口。
        从第 {{ START.r + 1 }} 行最左边走到第 {{ GOAL.r + 1 }} 行最右边，最短的一条要走
        {{ goalDist + 1 }} 个格子；图上浅色的方块是算法真的看过的位置，深青色的折线是最后选中的那条。
      </span>
    </figure>

    <div class="ca-hero-lattice-steps">
      <p v-for="(s, i) in STEPS" :key="s" class="ca-hero-lattice-step">
        <span class="ca-hero-lattice-idx">{{ i + 1 }}</span>{{ s }}
      </p>
    </div>

    <p class="ca-cap">
      这条折线走了 <b>{{ goalDist + 1 }}</b> 个格子，是这张图上<b>最短</b>的一条；算法为了确认这一点，
      实际看过 <b>{{ WAVE.length }}</b> 个格子。生活里的大部分算法都在这两件事之间讨价还价：
      <b>答案要多好</b>，以及<b>你愿意让它看多少个</b>。
    </p>
  </div>
</template>

<style scoped>
.ca-hero-lattice {
  max-width: 420px;
  margin-inline: auto;
}

.ca-hero-lattice-fig {
  margin: 0;
}

.ca-hero-lattice-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-hero-lattice-cell {
  fill: var(--panel-2);
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-hero-lattice-wall {
  fill: var(--panel-3);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-hero-lattice-wave {
  fill: var(--accent);
  animation: ca-hero-lattice-in 1.2s var(--ease) both;
}

@keyframes ca-hero-lattice-in {
  from {
    opacity: 0;
  }
}

.ca-hero-lattice-shadow,
.ca-hero-lattice-path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ca-hero-lattice-shadow {
  stroke: var(--bg);
  stroke-width: 8;
  opacity: 0.85;
}

.ca-hero-lattice-path {
  stroke: var(--accent);
  stroke-width: 3.2;
  stroke-dasharray: 620;
  stroke-dashoffset: 620;
  animation: ca-hero-lattice-draw 2.6s var(--ease) 0.35s forwards;
}

@keyframes ca-hero-lattice-draw {
  to {
    stroke-dashoffset: 0;
  }
}

.ca-hero-lattice-start {
  fill: var(--coral);
}

.ca-hero-lattice-goal {
  fill: var(--ink);
}

.ca-hero-lattice-goal-ring {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.4;
  opacity: 0.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: ca-hero-lattice-pulse 3.4s var(--ease) infinite;
}

@keyframes ca-hero-lattice-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.12);
  }
}

.ca-hero-lattice-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  fill: var(--muted);
}

.ca-hero-lattice-steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-hero-lattice-step {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-hero-lattice-idx {
  flex: none;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--faint);
}

@media (max-width: 760px) {
  .ca-hero-lattice-steps {
    gap: 5px 10px;
  }

  .ca-hero-lattice-step {
    font-size: 11.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-hero-lattice-path,
  .ca-hero-lattice-wave,
  .ca-hero-lattice-goal-ring {
    animation: none;
  }

  .ca-hero-lattice-path {
    stroke-dashoffset: 0;
  }
}
</style>
