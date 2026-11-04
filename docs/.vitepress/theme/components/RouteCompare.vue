<script setup lang="ts">
// 代价函数决定路线：同一张举例路网，把"要最小化的东西"换一次，路线就换一条。
// 三条路线不是在纸上画出来的，是 setup 里对同一张图跑三遍 Dijkstra 跑出来的：
// 边权分别换成里程 / 时间 / 油耗。没有随机、没有读时间，SSR 与客户端逐字节一致。

const COLS = 5 // 举例路网的横向路口数
const ROWS = 3 // 举例路网的纵向路口数
const N = COLS * ROWS
const START = (ROWS - 1) * COLS // 左下角：出发
const GOAL = COLS - 1 // 右上角：到家

const nid = (c: number, r: number) => r * COLS + c

type Kind = 'plain' | 'special'
type Edge = { a: number; b: number; d: number; t: number; f: number; kind: Kind }

// 三元组：里程（百米）/ 预计时间（分钟）/ 油耗（份）。全是举例数值，不是任何城市的实测。
const PLAIN: [number, number, number] = [10, 6, 5]
const ALLEY: [number, number, number] = [6, 16, 9] // 穿老城：最近，但最堵、最费油
const EXPRESS: [number, number, number] = [14, 4, 4] // 外环快速路：绕远，但最快
const STEADY: [number, number, number] = [12, 7, 2] // 匀速大路：不算快，但最省油
const JAM: [number, number, number] = [8, 12, 8] // 又一段"短而堵"

const EDGES: Edge[] = []
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS - 1; c++) {
    let w = PLAIN
    let kind: Kind = 'plain'
    if (r === ROWS - 1 && c === 2) {
      w = ALLEY
      kind = 'special'
    } else if (r === 0) {
      w = EXPRESS
      kind = 'special'
    } else if (r === 1) {
      w = STEADY
      kind = 'special'
    }
    EDGES.push({ a: nid(c, r), b: nid(c + 1, r), d: w[0], t: w[1], f: w[2], kind })
  }
}
for (let r = 0; r < ROWS - 1; r++) {
  for (let c = 0; c < COLS; c++) {
    let w = PLAIN
    let kind: Kind = 'plain'
    if (r === 0 && c === COLS - 1) {
      w = JAM
      kind = 'special'
    }
    EDGES.push({ a: nid(c, r), b: nid(c, r + 1), d: w[0], t: w[1], f: w[2], kind })
  }
}

type Key = 'd' | 't' | 'f'
const linkOf = (u: number, v: number) =>
  EDGES.find((e) => (e.a === u && e.b === v) || (e.b === u && e.a === v))

// 朴素 Dijkstra（N=15，不用堆也瞬间跑完）：换边权就是换代价函数
function shortest(key: Key) {
  const dist: number[] = new Array(N).fill(Infinity)
  const prev: number[] = new Array(N).fill(-1)
  const done: boolean[] = new Array(N).fill(false)
  dist[START] = 0
  for (;;) {
    let u = -1
    for (let i = 0; i < N; i++) {
      if (done[i]) continue
      if (u === -1 || dist[i] < dist[u]) u = i
    }
    if (u === -1 || !Number.isFinite(dist[u])) break
    done[u] = true
    for (const e of EDGES) {
      const v = e.a === u ? e.b : e.b === u ? e.a : -1
      if (v === -1 || done[v]) continue
      const nd = dist[u] + e[key]
      if (nd < dist[v]) {
        dist[v] = nd
        prev[v] = u
      }
    }
  }
  const path: number[] = []
  for (let cur = GOAL; cur !== -1; cur = prev[cur]) path.unshift(cur)
  return path
}

function sumOf(path: number[], key: Key) {
  let s = 0
  for (let i = 0; i < path.length - 1; i++) s += linkOf(path[i], path[i + 1])![key]
  return s
}

const METRICS = [
  { key: 'd' as Key, panel: '按里程', unit: '公里', factor: 0.1, note: '只把米数当代价' },
  { key: 't' as Key, panel: '按时间', unit: '分钟', factor: 1, note: '把预计通行时间当代价' },
  { key: 'f' as Key, panel: '按油耗', unit: '份', factor: 1, note: '把烧掉的油当代价' }
]

const ROUTES = METRICS.map((m, k) => {
  const path = shortest(m.key)
  return {
    ...m,
    idx: k,
    path,
    km: Math.round(sumOf(path, 'd') * 10) / 10,
    min: sumOf(path, 't'),
    fuel: sumOf(path, 'f'),
    value: Math.round(sumOf(path, m.key) * m.factor * 10) / 10
  }
})

// —— 画布几何：三块小地图并排，全部在 viewBox 内算完 ——
const OX = 10
const PW = 132
const GAP = 14
const W = OX * 2 + PW * 3 + GAP * 2
const H = 172
const PAD = 18
const STEP_X = 24
const TOP = 44
const STEP_Y = 28
const round1 = (v: number) => Math.round(v * 10) / 10

const nodeXY = (id: number, ox: number) => ({
  x: round1(ox + PAD + (id % COLS) * STEP_X),
  y: round1(TOP + Math.floor(id / COLS) * STEP_Y)
})

const PANELS = ROUTES.map((r, k) => {
  const ox = OX + k * (PW + GAP)
  // 整张举例路网都画出来：普通街道实线、三段"性格不同"的路虚线
  const streets = EDGES.map((e) => {
    const a = nodeXY(e.a, ox)
    const b = nodeXY(e.b, ox)
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, special: e.kind === 'special' }
  })
  const pts = r.path.map((id) => nodeXY(id, ox))
  return {
    ...r,
    ox,
    cx: round1(ox + PW / 2),
    streets,
    route: pts.map((p) => `${p.x},${p.y}`).join(' '),
    nodes: pts
  }
})

// 每组三个数：赢的那条用青（算法选中），最贵的那条用珊瑚红（代价），中间那条用蓝（参照）
const GROUPS = [
  {
    label: '里程（公里）',
    key: 'km' as const,
    unit: ' 公里',
    rows: ROUTES.map((r) => ({ name: `${r.panel}选的路`, v: r.km }))
  },
  {
    label: '预计时间（分钟）',
    key: 'min' as const,
    unit: ' 分钟',
    rows: ROUTES.map((r) => ({ name: `${r.panel}选的路`, v: r.min }))
  },
  {
    label: '油耗（份）',
    key: 'fuel' as const,
    unit: ' 份',
    rows: ROUTES.map((r) => ({ name: `${r.panel}选的路`, v: r.fuel }))
  }
].map((g) => {
  const max = Math.max(...g.rows.map((r) => r.v))
  const min = Math.min(...g.rows.map((r) => r.v))
  return {
    label: g.label,
    unit: g.unit,
    rows: g.rows.map((r, i) => ({
      name: r.name,
      text: `${r.v}${g.unit}`,
      pct: Math.max(4, Math.round((r.v / max) * 100)),
      tone: r.v === min ? 'accent' : r.v === max ? 'cost' : 'ref',
      pick: ROUTES[i].key
    }))
  }
})
</script>

<template>
  <div class="ca-route-compare ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Cost Functions · 代价函数决定路线</span>
      <p class="ca-widget-sub">同一次出门，"最短""最快""最省油"是三套答案——差别在你让它省什么。</p>
    </div>

    <figure class="ca-route-compare-fig">
      <svg
        class="ca-route-compare-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-route-compare-tag" :x="W - OX" :y="14">举例路网 · 同一张图跑三遍</text>

        <g v-for="p in PANELS" :key="p.ox" class="ca-route-compare-panel">
          <text class="ca-route-compare-ptitle" :x="p.ox" :y="30">{{ p.panel }}</text>
          <line
            v-for="(s, i) in p.streets"
            :key="`g-${p.ox}-${i}`"
            class="ca-route-compare-street"
            :class="{ 'is-special': s.special }"
            :x1="s.x1"
            :y1="s.y1"
            :x2="s.x2"
            :y2="s.y2"
          />
          <polyline class="ca-route-compare-route" :points="p.route" />
          <circle v-for="(n, i) in p.nodes" :key="`n-${p.ox}-${i}`" class="ca-route-compare-node" :cx="n.x" :cy="n.y" r="3.4" />
          <text class="ca-route-compare-end" :x="p.nodes[0].x" :y="118" text-anchor="middle">出发</text>
          <text class="ca-route-compare-end" :x="p.nodes[p.nodes.length - 1].x + 6" :y="p.nodes[p.nodes.length - 1].y + 3" text-anchor="start">家</text>
          <text class="ca-route-compare-r1" :x="p.cx" :y="130">{{ p.panel }}这条</text>
          <text class="ca-route-compare-r2" :x="p.cx" :y="144">里程 {{ p.km }} 公里</text>
          <text class="ca-route-compare-r2" :x="p.cx" :y="157">时间 {{ p.min }} 分</text>
          <text class="ca-route-compare-r3" :x="p.cx" :y="170">油耗 {{ p.fuel }} 份</text>
        </g>
      </svg>

      <span class="sr-only">
        这是一张举例路网，不是任何真实城市的数据：横向 5 个路口、纵向 3 个路口，出发点在左下、家在右上。
        同图上跑三遍最短路径，只换"要最小化的东西"。
        按里程选的路：{{ PANELS[0].km }} 公里，但要 {{ PANELS[0].min }} 分钟，油耗 {{ PANELS[0].fuel }} 份。
        按时间选的路：{{ PANELS[1].km }} 公里，{{ PANELS[1].min }} 分钟，油耗 {{ PANELS[1].fuel }} 份。
        按油耗选的路：{{ PANELS[2].km }} 公里，{{ PANELS[2].min }} 分钟，油耗 {{ PANELS[2].fuel }} 份。
        三条路没有一条同时在三项上最好；里程单位是百米换算成公里，时间与油耗都是举例档位。
      </span>
    </figure>

    <div class="ca-route-compare-bars">
      <div v-for="g in GROUPS" :key="g.label" class="ca-route-compare-group">
        <p class="ca-route-compare-glab">{{ g.label }}</p>
        <p v-for="(r, i) in g.rows" :key="r.name" class="ca-route-compare-row">
          <span class="ca-route-compare-rowlab" :class="`is-${r.tone}`">{{ r.name }}</span>
          <span class="ca-route-compare-track">
            <span class="ca-route-compare-fill" :class="`is-${r.tone}`" :style="{ width: `${r.pct}%` }"></span>
          </span>
          <span class="ca-route-compare-rowval">{{ r.text }}</span>
        </p>
      </div>
    </div>

    <p class="ca-route-compare-note">
      三条路的差别来自三段"性格不同"的路（虚线）：穿老城那段
      <b>{{ ALLEY[0] }}</b> 百米却要走 <b>{{ ALLEY[1] }}</b> 分钟；外环那段 <b>{{ EXPRESS[0] }}</b> 百米只要
      <b>{{ EXPRESS[1] }}</b> 分钟；匀速大路那段 <b>{{ STEADY[0] }}</b> 百米、<b>{{ STEADY[1] }}</b> 分钟、只记
      <b>{{ STEADY[2] }}</b> 份油。把它们换成哪一项当代价，路线就往哪边倒。真实导航没有更神秘：它也只是先把每条边填上一个数。
    </p>

    <div class="ca-route-compare-facts">
      <p class="ca-route-compare-fact">
        <b>真实路网比这张举例图大得多。</b>路网节点可达<b>数百万级</b>、边达<b>数千万级</b>，实时路况把"通过时间"当成边权；工业实现常用
        A*（带启发式）或收缩层级来加速，先在秒级给一条可行解、再择机优化。"秒出路线"是工程口径，随规模、路况刷新与缓存变化，
        <b>这张图不给固定毫秒数</b>。A* 要保证最优，前提是启发函数不高估真实代价；路况估计本身带不确定性时，它只保证"对当前这套估计最优"
        ——导航不一定给你最短的那条路，机制就在这里（A* 的形式化定义出自 1968 年 IEEE Trans. SSC-4(2): 87–94）。
      </p>
      <p class="ca-route-compare-fact">
        <b>绕远反而更快，不是算法出错。</b>算路优化的是预计通行时间，不是里程；把高速与环线的时间收益计进边权之后，就可能出现"里程更长、
        时间更短"。前提是时间估计准——路况估错时这条"更长但更快"也会翻车。至于"躲避拥堵到底能省几分钟"：
        <b>没有官方公布的量化口径</b>，站内一个百分比都不印。
      </p>
      <p class="ca-route-compare-fact">
        <b>边权那个数是怎么来的。</b>某地图公开的技术口径里，路段通行耗时真值按 5 分钟时间窗去噪后取均值，历史速度按 10 分钟聚合，
        实时路况每分钟发布新值，累计超过 1 小时的路段改回用历史均值；另一家把"拥堵延时指数"定义为实际通行时间与完全畅通通行时间的比值。
        同一家公司也自述过：最早那种"距离除以限速"的静态估算法，误差常超过 30%——<b>企业自报的早期情况，未经独立评估</b>。
        这些都是机制披露，不是准确率承诺。
      </p>
      <p class="ca-route-compare-fact">
        <b>优化真的省了吗？只印谁说的。</b>UPS 自报其路线优化系统全面部署后每年少跑约 1 亿英里、少烧约 1,000 万加仑燃油，
        平均每条投递线路少 6–8 英里；2012 年首批约 1 万条线路、2017 年覆盖北美约 5.5 万条。三个数字全是<b>企业自报、无独立审计</b>，
        其中那个碳排放数是环保署换算器的折算而非实测；同期高管说的"每年省 3–4 亿美元"是<b>事前预期</b>，
        而哈佛案例里还记录了司机反馈"同区两辆车、跳户投递"的不一致。算法史那头也一样：Dijkstra 那篇最短路论文发表于 1959 年、全文只有 3 页，
        他本人 2001 年回忆构思"大约 20 分钟"（1956 构思、1959 发表是两件事）；网上还有"3 分钟"的版本，<b>查不到一手出处</b>。
      </p>
    </div>

    <p class="ca-cap">
      同一次出门，按里程选的路最短只有 <b>{{ PANELS[0].km }}</b> 公里，却要走上 <b>{{ PANELS[0].min }}</b> 分钟；
      按时间选的路里程涨到 <b>{{ PANELS[1].km }}</b> 公里，时间压到 <b>{{ PANELS[1].min }}</b> 分钟。
      三个数字里最该记住的是这一句：<b>路线不是"算出来的最好那条"，是"你让它最小化什么"的那条</b>——
      换代价函数就换路线，图上的三段虚线路就是全部的差别（路网与分钟、油耗均为举例）。
    </p>
  </div>
</template>

<style scoped>
.ca-route-compare {
  max-width: 640px;
  margin-inline: auto;
}

.ca-route-compare-fig {
  margin: 0;
}

.ca-route-compare-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-route-compare-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: end;
}

.ca-route-compare-ptitle {
  font-family: var(--font-mono);
  font-size: 9.5px;
  fill: var(--accent);
}

.ca-route-compare-street {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-opacity: 0.45;
  fill: none;
}

.ca-route-compare-street.is-special {
  stroke: var(--coral);
  stroke-opacity: 0.55;
  stroke-width: 1.4;
  stroke-dasharray: 4 3;
}

.ca-route-compare-route {
  stroke: var(--accent);
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.ca-route-compare-node {
  fill: var(--panel-2);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-route-compare-end {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
}

.ca-route-compare-r1 {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--accent);
  text-anchor: middle;
}

.ca-route-compare-r2,
.ca-route-compare-r3 {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-route-compare-r3 {
  fill: var(--faint);
}

.ca-route-compare-panel {
  animation: ca-route-compare-in 0.9s var(--ease) both;
}

@keyframes ca-route-compare-in {
  from {
    opacity: 0;
  }
}

.ca-route-compare-bars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 14px 20px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-route-compare-group {
  min-width: 0;
}

.ca-route-compare-glab {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-route-compare-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px;
  align-items: center;
  gap: 3px 8px;
  margin: 0 0 8px;
  min-width: 0;
}

.ca-route-compare-rowlab {
  font-size: 11px;
  line-height: 1.4;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-route-compare-rowlab.is-accent {
  color: var(--accent);
}

.ca-route-compare-rowlab.is-cost {
  color: var(--coral);
}

.ca-route-compare-rowlab.is-ref {
  color: var(--blue);
}

.ca-route-compare-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-route-compare-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
}

.ca-route-compare-fill.is-accent {
  background: var(--accent);
}

.ca-route-compare-fill.is-cost {
  background: var(--coral);
}

.ca-route-compare-fill.is-ref {
  background: var(--blue);
  opacity: 0.7;
}

.ca-route-compare-rowval {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-route-compare-note {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-route-compare-note b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-route-compare-facts {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
}

.ca-route-compare-fact {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-route-compare-fact b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (min-width: 700px) {
  .ca-route-compare-bars {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-route-compare-panel {
    animation: none;
  }
}
</style>
