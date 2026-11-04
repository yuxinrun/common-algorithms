<script setup lang="ts">
// 又抖又漂的读数，怎么被修成一条线。
// 三条线都在 script 里真跑一遍：真值走匀速直线，读数 = 真值 + 缓慢漂移 + 固定种子（LCG，种子写死）的抖动，
// 青色那条是卡尔曼递推的结果（预测位置与速度 → 算增益 → 按可信度修正）。SSR 与客户端逐字节一致。
// 图上这一段是"按公式生成的示意"：横轴的秒、纵轴的米、抖动与漂移的幅度全是人为假设；
// 有出处的真实数字在下面那两张列表里（1960 年的论文、GPS 的官方口径）。

const W = 440 // 画布宽
const H = 214 // 画布高
const PL = 34 // 主图左边
const PR = 384 // 主图右边
const PT = 22 // 主图上边
const PB = 168 // 主图下边
const N = 50 // 采样点数：每秒 1 个，画 50 个
const Y_LO = -15 // 纵轴下限（米）
const Y_HI = 100 // 纵轴上限（米）

const SPEED = 1.6 // 真值速度：1.6 米/秒（假设）
const JITTER = 9 // 读数抖动幅度：±9 米（假设）
const BIAS_RATE = 0.05 // 漂移速率：每一步加 0.05 米（假设）
const DT = 1 // 采样间隔（秒）
const QACC = 0.002 // 过程噪声：模型认为速度几乎不会变（假设）
const R = 30 // 测量噪声：与上面 ±9 米抖动的量级相配（假设）
const P0 = 100 // 初始不确定度（假设）

let s = 7 // 固定种子
const lcg = () => {
  s = (s * 1103515245 + 12345) % 2147483648
  return s / 2147483648
}

const py = (m: number) => +(PB - ((m - Y_LO) / (Y_HI - Y_LO)) * (PB - PT)).toFixed(1)
const px = (i: number) => +(PL + (i / (N - 1)) * (PR - PL)).toFixed(1)

type Sample = { i: number; truth: number; raw: number; est: number; errRaw: number; errEst: number }

let K0 = 0 // 第一步的增益：一开始什么都不信，所以几乎全信读数

const SERIES: Sample[] = []
{
  // —— 卡尔曼滤波：状态是"位置 + 速度"两个数，可测的只有位置 ——
  let pos = 0
  let vel = 0
  let p00 = P0
  let p01 = 0
  let p11 = P0
  let bias = 0
  for (let i = 0; i < N; i++) {
    const truth = SPEED * i
    bias += BIAS_RATE
    const raw = truth + bias + (lcg() - 0.5) * 2 * JITTER
    const pred = pos + vel * DT // 预测：按速度往前推
    const q11 = (QACC * DT * DT * DT * DT) / 4
    const q12 = (QACC * DT * DT * DT) / 2
    const q22 = QACC * DT * DT
    const a00 = p00 + 2 * DT * p01 + DT * DT * p11 + q11
    const a01 = p01 + DT * p11 + q12
    const a11 = p11 + q22
    const side = a00 + R // 这次读数有多可信，全看还剩多少不确定度
    const k0 = a00 / side
    const k1 = a01 / side
    if (i === 0) K0 = k0
    const innov = raw - pred
    pos = pred + k0 * innov // 修正：朝读数挪一步
    vel = vel + k1 * innov // 速度也跟着一起改
    p00 = a00 - k0 * a00
    p01 = a01 - k0 * a01
    p11 = a11 - k1 * a01
    SERIES.push({ i, truth, raw, est: pos, errRaw: raw - truth, errEst: pos - truth })
  }
}

const line = (key: 'truth' | 'raw' | 'est') => SERIES.map((d) => `${px(d.i)} ${py(d[key])}`).join(' L ')
const PATH_TRUTH = `M ${line('truth')}`
const PATH_RAW = `M ${line('raw')}`
const PATH_EST = `M ${line('est')}`

const LAST = SERIES[N - 1]
const LAST_I = N - 1
const meanAbs = (f: (d: Sample) => number) => SERIES.reduce((a, d) => a + Math.abs(f(d)), 0) / SERIES.length
const MAE_RAW = +meanAbs((d) => d.errRaw).toFixed(1)
const MAE_EST = +meanAbs((d) => d.errEst).toFixed(1)
const END_BIAS = +LAST.errEst.toFixed(1)
const KEEP_PCT = Math.round((MAE_EST / MAE_RAW) * 100) // 滤波后还剩几成误差
const K0TEXT = K0.toFixed(2)
const TOTAL_BIAS = +(BIAS_RATE * N).toFixed(1)

const Y_TICKS = [0, 25, 50, 75, 100]
const X_TICKS = [0, 10, 25, 40, LAST_I]

// 下面列表里的轨道宽度只是"米数"的比例尺，用同一个上限换算
const METER_MAX = 100
const mPct = (m: number) => `${Math.max(3, Math.round((m / METER_MAX) * 100))}%`
const FACTS = [
  { id: 'h', name: '水平误差（官方承诺）', val: 8, tone: 'pick', text: '95% ≤ 8 米' },
  { id: 'v', name: '垂直误差（同批口径）', val: 13, tone: 'pick', text: '13 米以内' },
  { id: 'u', name: '空间信号测距误差', val: 2, tone: 'ref', text: '95% ≤ 2 米' },
  { id: 'sa', name: '关闭 SA 之前（量级）', val: 100, tone: 'cost', text: '约 100 米级' }
]

// 三行误差账：用同一个上限换算成条宽，数字本身是"按公式计算"的结果
const ERR_MAX = Math.max(MAE_RAW, MAE_EST, Math.abs(END_BIAS))
const ePct = (m: number) => `${Math.max(4, Math.round((Math.abs(m) / ERR_MAX) * 100))}%`
const BARS = [
  { id: 'raw', name: `滤波前平均绝对误差`, tone: 'cost', pct: ePct(MAE_RAW), text: `${MAE_RAW} 米` },
  { id: 'est', name: '滤波后平均绝对误差', tone: 'pick', pct: ePct(MAE_EST), text: `${MAE_EST} 米` },
  { id: 'bias', name: `第 ${N} 秒滤波值仍偏`, tone: 'soft', pct: ePct(END_BIAS), text: `${END_BIAS} 米` }
]
</script>

<template>
  <div class="ca-kalman-converge ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Kalman Filter · 把抖和漂修成一条线</span>
      <p class="ca-widget-sub">读数一会儿跳、一会儿歪，滤波凭什么一边猜一边改，最后贴出一条能用的线。</p>
    </div>

    <figure class="ca-kk-fig">
      <svg class="ca-kk-svg" :viewBox="`0 0 ${W} ${H}`" role="presentation" aria-hidden="true" focusable="false">
        <g class="ca-kk-grid">
          <g v-for="m in Y_TICKS" :key="`y-${m}`">
            <line :x1="PL" :y1="py(m)" :x2="PR" :y2="py(m)" />
            <text class="ca-kk-ylab" :x="PL - 5" :y="py(m) + 3" text-anchor="end">{{ m }}</text>
          </g>
          <g v-for="t in X_TICKS" :key="`x-${t}`">
            <line class="is-x" :x1="px(t)" :y1="PT" :x2="px(t)" :y2="PB" />
            <text
              class="ca-kk-xlab"
              :x="px(t)"
              :y="PB + 13"
              :text-anchor="t === 0 ? 'start' : t === LAST_I ? 'end' : 'middle'"
            >
              {{ t === LAST_I ? `${N} 秒` : `${t} 秒` }}
            </text>
          </g>
          <text class="ca-kk-unit" :x="PL - 5" :y="PT - 9" text-anchor="end">米</text>
          <line class="ca-kk-axis" :x1="PL" :y1="PB" :x2="PR" :y2="PB" />
          <line class="ca-kk-axis" :x1="PL" :y1="PT" :x2="PL" :y2="PB" />
          <text class="ca-kk-note" :x="PR" :y="H - 2" text-anchor="end">示意：参数是假设的</text>
        </g>

        <path class="ca-kk-raw" :d="PATH_RAW" />
        <path class="ca-kk-truth" :d="PATH_TRUTH" />
        <path class="ca-kk-est" :d="PATH_EST" />
      </svg>

      <p class="ca-kk-legend">
        <span class="ca-kk-chip is-cost"></span>珊瑚：单路读数——真值上叠了 ±{{ JITTER }} 米的抖动和每步
        {{ BIAS_RATE }} 米的漂移
        <span class="ca-kk-chip is-ref"></span>蓝：真值，匀速直线；滤波器并不知道它在哪
        <span class="ca-kk-chip is-pick"></span>青：卡尔曼的输出——先按"位置＋速度"的模型猜一步，再按"这次读数可信几分"
        打折修正；第一步增益 <b>{{ K0TEXT }}</b>，因为一开始它什么都不信。
      </p>

      <span class="sr-only">
        这张图是按公式生成的示意，不是实测。采样 {{ N }} 个点、每秒 1 个；真值取每秒 {{ SPEED }} 米的匀速直线；
        读数在真值上叠加固定种子伪随机数给出的正负 {{ JITTER }} 米抖动，以及每步累积
        {{ BIAS_RATE }} 米、到第 {{ N }} 秒共 {{ TOTAL_BIAS }} 米的漂移。卡尔曼滤波的状态是"位置＋速度"两个数，
        过程噪声取 {{ QACC }}、测量噪声取 {{ R }}、初始不确定度取 {{ P0 }}，第一步的增益约 {{ K0TEXT }}。
        跑下来的结果：滤波前平均绝对误差 {{ MAE_RAW }} 米，滤波后 {{ MAE_EST }} 米，也就是只剩原来的
        {{ KEEP_PCT }}%；但到第 {{ N }} 秒，滤波值仍比真值高约 {{ END_BIAS }} 米——抖动被压掉了，
        慢慢涨上来的系统偏差没被压掉。
        下面这些数字才是有出处的：卡尔曼滤波原始论文 1960 年发表于 ASME Journal of Basic Engineering 第 82 卷第 1 期
        第 51 到 60 页；GPS 民用标准服务 2024 年公布的官方性能口径是全球平均 95% 水平误差在 8 米以内、
        垂直误差 13 米以内，空间信号的用户测距误差承诺为 95% 在 2 米以内；8 米和 2 米是两套口径，
        不是"手机定位就是 2 米"；2000 年 5 月 2 日美国关闭 SA 政策之前，民用精度是约 100 米级，关闭之后跃升一个数量级，
        跃升到几米各资料说法不一，站内不取单一数字。
      </span>
    </figure>

    <div class="ca-kk-measure">
      <p class="ca-kk-blockhead">
        同样这 {{ N }} 个点上，各自离真值差多少<span class="ca-kk-hint">按公式计算，参数是假设的</span>
      </p>
      <ul class="ca-kk-bars">
        <li v-for="b in BARS" :key="b.id" class="ca-kk-brow">
          <span class="ca-kk-bname">{{ b.name }}</span>
          <span class="ca-kk-btrack">
            <span class="ca-kk-bfill" :class="`is-${b.tone}`" :style="{ width: b.pct }"></span>
          </span>
          <span class="ca-kk-bval">{{ b.text }}</span>
        </li>
      </ul>
      <p class="ca-kk-bnote">
        青色那条不是"零误差"，它只是把跳来跳去的毛刺打折收掉了；最后剩下的
        <b>{{ END_BIAS }} 米</b>是漂移——它每一步都只偏一点点，滤波器把它当成了"确实走远了"。
      </p>
    </div>

    <div class="ca-kk-side">
      <p class="ca-kk-sidehead">
        图上的米是假设刻度，下面这些数才有出处
        <span class="ca-kk-hint">B 级：限定语一起印</span>
      </p>
      <ul class="ca-kk-facts">
        <li v-for="f in FACTS" :key="f.id" class="ca-kk-frow">
          <span class="ca-kk-fname">{{ f.name }}</span>
          <span class="ca-kk-ftrack">
            <span class="ca-kk-ffill" :class="`is-${f.tone}`" :style="{ width: mPct(f.val) }"></span>
          </span>
          <span class="ca-kk-fval">{{ f.text }}</span>
        </li>
      </ul>
      <p class="ca-kk-source">
        <b>卡尔曼滤波原始论文</b>：1960 年，ASME J. Basic Engineering 82(1): 51–60。"阿波罗登月用了卡尔曼滤波"这句，
        可核的是<b>卡尔曼本人多次自述</b>该滤波被用于阿波罗导航与惯性制导；NASA 的实际实现（含地面轨道确定、
        后来的扩展卡尔曼）跟论文里那个线性版本不是一回事。
      </p>
      <p class="ca-kk-source">
        <b>三条 GPS 口径别混着印</b>：水平 95% ≤ 8 米、垂直 13 米以内是官方承诺的全球平均；
        95% ≤ 2 米是<b>空间信号段的测距误差</b>，不是你最终位置的误差——把 2 米当"手机定位精度"是最常见的误读。
        2000 年 5 月 2 日美国关闭 SA 政策，民用从约 100 米级跃升；"关闭之后具体几米"各资料写过 3.3／6.2／15–30 米，
        那是 RMS／95%／单双频不同口径，站内只说"一个数量级的跃升"、并列不取平均。
      </p>
      <p class="ca-kk-formula">
        滤波到底干了什么：卫星信号更新慢、惯导（IMU）自己会漂，卡尔曼做的事是<b>按各自的不确定度加权融合</b>，
        再拿预测去补两帧之间的空档。它让轨迹<b>更平滑、更连续、短时更稳</b>；隧道和地库里没了信号就靠惯导推算顶住，
        但那段误差会随时间累积，出隧道后要等新到的卫星读数把它往回拉。卫星几何、大气、多路径造成的长期系统偏差，
        滤波改不掉——它不是"更准"的魔法，是"更稳"的算术。
      </p>
    </div>

    <p class="ca-cap">
      这张图最该记住的是那三行按公式算出来的账：同一批假设参数跑下来，平均绝对误差从 <b>{{ MAE_RAW }} 米</b>降到
      <b>{{ MAE_EST }} 米</b>（只剩 <b>{{ KEEP_PCT }}%</b>），可到第 <b>{{ N }} 秒</b>滤波值仍比真值高
      <b>{{ END_BIAS }} 米</b>——<b>抖动可以被打折掉，每步偏一点点的系统偏差不能</b>。曲线是按公式生成的示意；
      真实定位的量级看上面那四条带口径的米数。
    </p>
  </div>
</template>

<style scoped>
.ca-kalman-converge {
  max-width: 640px;
  margin-inline: auto;
}

.ca-kk-fig {
  margin: 0;
  min-width: 0;
}

.ca-kk-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-kk-grid line {
  stroke: var(--grid-line);
  stroke-width: 1;
}

.ca-kk-grid .is-x {
  stroke-dasharray: 2 4;
}

.ca-kk-grid line.ca-kk-axis {
  stroke: var(--line-strong);
}

.ca-kk-ylab,
.ca-kk-xlab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-kk-ylab {
  text-anchor: end;
}

.ca-kk-unit {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
}

.ca-kk-note {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-kk-raw,
.ca-kk-truth,
.ca-kk-est {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ca-kk-raw {
  stroke: var(--coral);
  stroke-width: 1.3;
  opacity: 0.55;
}

.ca-kk-truth {
  stroke: var(--blue);
  stroke-width: 2;
  stroke-dasharray: 7 5;
}

.ca-kk-est {
  stroke: var(--accent);
  stroke-width: 2.4;
  animation: ca-kk-fade 1.1s var(--ease) both;
}

@keyframes ca-kk-fade {
  from {
    opacity: 0;
  }
}

.ca-kk-legend {
  display: grid;
  gap: 5px;
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-kk-legend b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-kk-chip {
  display: inline-block;
  width: 14px;
  height: 3px;
  margin-right: 6px;
  border-radius: 999px;
  vertical-align: middle;
}

.ca-kk-chip.is-cost {
  background: var(--coral);
}

.ca-kk-chip.is-ref {
  background: var(--blue);
}

.ca-kk-chip.is-pick {
  background: var(--accent);
}

.ca-kk-measure,
.ca-kk-side {
  min-width: 0;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-kk-blockhead,
.ca-kk-sidehead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-kk-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-kk-bars,
.ca-kk-facts {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-kk-brow,
.ca-kk-frow {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) 92px;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-kk-bname,
.ca-kk-fname {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-kk-bval,
.ca-kk-fval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-kk-btrack,
.ca-kk-ftrack {
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-kk-bfill,
.ca-kk-ffill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ca-kk-grow 1s var(--ease) both;
}

.ca-kk-bfill.is-ref,
.ca-kk-ffill.is-ref {
  background: var(--blue);
  opacity: 0.75;
}

.ca-kk-bfill.is-pick,
.ca-kk-ffill.is-pick {
  background: var(--accent);
}

.ca-kk-bfill.is-cost,
.ca-kk-ffill.is-cost {
  background: var(--coral);
}

.ca-kk-bfill.is-soft {
  background: repeating-linear-gradient(
    135deg,
    var(--coral) 0 4px,
    var(--coral-soft) 4px 8px
  );
}

@keyframes ca-kk-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-kk-bnote {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-kk-bnote b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-kk-source {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-kk-source b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-kk-formula {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-kk-formula b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (max-width: 620px) {
  .ca-kk-brow,
  .ca-kk-frow {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 82px;
  }

  .ca-kk-bname,
  .ca-kk-fname {
    font-size: 10.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-kk-est,
  .ca-kk-bfill,
  .ca-kk-ffill {
    animation: none;
  }
}
</style>
