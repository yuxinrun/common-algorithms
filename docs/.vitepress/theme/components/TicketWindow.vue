<script setup lang="ts">
// 这张图只画机制、不编数字：余票为什么「你看不到但别人买得到」，
// 候补为什么会「排得到」——全部按官方/客服公开口径（C-38、C-40、C-41、C-44、P-89）。
// 图里的站点、队列、票源位置都是机制示意，真实排队位次查不到也不印。
// 成功率必须分两套口径摆：C-36 是「春运前预估 70%以上」、C-37 是「春运期间披露 75%以上」，
// 两个都未公布计算口径，绝不平均成「约 72%」；自媒体 85%／95% 一律不印。
// C-43 是第三个东西：界面里那个「预估成功率」按历史候补订单兑现情况测算，跟前两者不可互相换算。

// —— 画布几何：逐个声明，它们是画布尺寸而不是数据 ——
const W = 440
const H = 190
const LINE_Y = 48
const TICK_X1 = 56
const TICK_X2 = 168
const TICK_X3 = 280
const TICK_X4 = 384
const TICKS = [TICK_X1, TICK_X2, TICK_X3, TICK_X4]
const ST_NAMES = ['始发站', '中间站', '中间站', '终到站']

const SOURCES = ['旅客退票', '旅客改签', '未支付释放', '加开加挂']
const SRC_Y1 = 122
const SRC_Y2 = 138
const SRC_Y3 = 154
const SRC_Y4 = 170
const SRC_Y = [SRC_Y1, SRC_Y2, SRC_Y3, SRC_Y4]
const FLOW_Y = 144

// 两套候补成功率口径：分行保留，绝不平均
const RATES = [
  { id: 'pre', tone: 'blue', label: '2026 年春运前·官方预估', value: '70% 以上', pct: 70, note: '「预计」' },
  { id: 'during', tone: 'accent', label: '2026 年春运期间·披露', value: '75% 以上', pct: 75, note: '「期间」' }
]

// 规则参数（2024-01-11 那次优化的口径，会变）
const RULES = [
  { id: 'orders', k: '每账号可提交候补订单', v: '6 个' },
  { id: 'combo', k: '最多「日期＋车次」组合', v: '60 个' },
  { id: 'deadline', k: '截止兑现时间（默认一般）', v: '开车前 6 小时' },
  { id: 'opt', k: '那次优化改到的截止点', v: '发车前 20 分钟' },
  { id: 'pax', k: '每单最多乘车人', v: '9 名' }
]

// 官方公布过的量（各自带口径，不能混着用）
const OFFICIAL = [
  { id: 'day', label: '单日售票量（2026-09-23，创单日新高）', v: '2973.7 万张', tone: 'accent' },
  { id: 'sum', label: '9 月 9 日至 23 日累计发售', v: '3.04 亿张', tone: 'accent' },
  { id: 'spring', label: '2026 年春运时段', v: '2 月 2 日—3 月 13 日，40 天', tone: 'ink' },
  { id: 'train', label: '2026 年春运首日开行（据车票与候补数据）', v: '3272 列，比上年多开 69 列', tone: 'blue' },
  { id: 'max', label: '春运期间单日最高可安排开行（运力计划值，非实际）', v: '4499 列，同比增长 9.8%', tone: 'coral' }
]
</script>

<template>
  <div class="ca-ticket-window ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Ticket Queue · 余票在算什么</span>
      <p class="ca-widget-sub">
        同一趟车、同一批座位，不同出发站看到的结果可以不一样。这张图只画机制，图里的位置排布是示意。
      </p>
    </div>

    <figure class="ca-ticket-window-fig">
      <svg
        class="ca-ticket-window-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-ticket-window-tag" :x="W - 8" :y="14">机制示意</text>

        <text class="ca-ticket-window-head" :x="8" :y="13">一、席位是分段卖的</text>

        <rect class="ca-ticket-window-br-long" :x="TICKS[0]" :y="18" :width="TICKS[3] - TICKS[0]" height="7" rx="2" />
        <text class="ca-ticket-window-bl" :x="(TICKS[0] + TICKS[3]) / 2" :y="35">长途票优先供给全程乘客</text>

        <line class="ca-ticket-window-rail" :x1="TICKS[0]" :y1="LINE_Y" :x2="TICKS[3]" :y2="LINE_Y" />
        <g v-for="(x, i) in TICKS" :key="`tk-${i}`">
          <circle class="ca-ticket-window-st" :cx="x" :cy="LINE_Y" r="4" />
          <text class="ca-ticket-window-stl" :x="x" :y="LINE_Y + 14">{{ ST_NAMES[i] }}</text>
        </g>

        <rect class="ca-ticket-window-br-short" :x="TICKS[1]" :y="68" :width="TICKS[2] - TICKS[1]" height="7" rx="2" />
        <text class="ca-ticket-window-bs" :x="(TICKS[1] + TICKS[2]) / 2" :y="86">你买的这一程：限售中</text>

        <text class="ca-ticket-window-head" :x="8" :y="102">二、候补的票从哪来</text>

        <g v-for="(s, i) in SOURCES" :key="`src-${i}`">
          <text class="ca-ticket-window-src" :x="8" :y="SRC_Y[i]">{{ s }}</text>
          <line class="ca-ticket-window-arrow" :x1="44" :y1="SRC_Y[i] - 3" :x2="98" :y2="FLOW_Y" />
        </g>

        <rect class="ca-ticket-window-box" x="100" y="112" width="120" height="64" rx="6" />
        <text class="ca-ticket-window-bt" x="160" y="130">候补队列</text>
        <text class="ca-ticket-window-bs2" x="160" y="144">按提交时间先后</text>
        <text class="ca-ticket-window-bs2" x="160" y="158">24 小时自动兑现</text>

        <line class="ca-ticket-window-flow" x1="220" :y1="FLOW_Y" x2="246" :y2="FLOW_Y" />
        <polygon class="ca-ticket-window-head-tri" :points="`248,${FLOW_Y} 240,${FLOW_Y - 4} 240,${FLOW_Y + 4}`" />

        <rect class="ca-ticket-window-box is-lead" x="250" y="112" width="182" height="64" rx="6" />
        <text class="ca-ticket-window-bt" x="341" y="130">买到票的是最早那几单</text>
        <text class="ca-ticket-window-bs2" x="341" y="146">席位复用＋动态加开</text>
        <text class="ca-ticket-window-bs2" x="341" y="162">分时段放量</text>
      </svg>

      <span class="sr-only">
        机制示意，不含任何真实排队位置。第一层：一趟车的席位是分段卖的，长途票优先供给全程乘客，
        你要的那一小程可能处在限售区间里，所以同一趟车在不同出发站看到的余票不同——这是区间限售与席位复用，
        不是伪造。第二层：候补订单按提交时间先后排队，系统 24 小时自动兑现；票源来自旅客退票、旅客改签、
        未支付释放的席位，以及铁路动态调整运力时加开列车、加挂车厢释放的新席位。规则口径：只要存在候补订单，
        就不会出现可直接购买的余票；没有设置截止兑现时间时，默认一般是开车前 6 小时。
        这就是「你点不到、但有人能买到」的原因。
      </span>
    </figure>

    <div class="ca-ticket-window-rates">
      <p class="ca-ticket-window-blocktitle">
        候补成功率：两套口径必须分开摆
        <span class="ca-ticket-window-mtag is-coral">绝不平均</span>
      </p>
      <p v-for="r in RATES" :key="r.id" class="ca-ticket-window-row">
        <span class="ca-ticket-window-rowlab" :class="`is-${r.tone}`">{{ r.label }}（{{ r.note }}）</span>
        <span class="ca-ticket-window-track">
          <span class="ca-ticket-window-fill" :class="`is-${r.tone}`" :style="{ width: `${r.pct}%` }"></span>
        </span>
        <span class="ca-ticket-window-rowval">{{ r.value }}</span>
      </p>
      <p class="ca-ticket-window-explode">
        两个数都没公布分母（全部候补订单还是待兑现订单？含不限车次还是含极限方案？），所以这里只画两根条、
        不做任何合并；网上更高的版本（85%、95%、「暑运 76%」）查不到官方通报原文，一律不印。
        第三个数字也别混：12306 界面显示的「预估成功率」是按历史候补订单兑现情况测算的提示，官方明确写「仅供参考，
        并非保证」，它跟前两个「平均成功率」不是一个东西，不能互相换算。
      </p>
    </div>

    <div class="ca-ticket-window-rules">
      <p class="ca-ticket-window-blocktitle">
        能查到的规则参数（会改，下单前以 12306 页面实时显示为准）
        <span class="ca-ticket-window-mtag is-ink">2024-01-11 那次优化</span>
      </p>
      <ul class="ca-ticket-window-rulelist">
        <li v-for="u in RULES" :key="u.id">
          <span class="ca-ticket-window-rk">{{ u.k }}</span>
          <b>{{ u.v }}</b>
        </li>
      </ul>
      <p class="ca-ticket-window-note">
        同一年还有「每单最多 19 名乘车人」「可选 3 个乘车日期」的转述版本；规则类信息本站只当「会变」的教材，
        不给操作技巧。
      </p>
    </div>

    <div class="ca-ticket-window-official">
      <p class="ca-ticket-window-blocktitle">官方公布过的量（各自的口径写在左边）</p>
      <ul class="ca-ticket-window-offlist">
        <li v-for="o in OFFICIAL" :key="o.id" :class="`is-${o.tone}`">
          <span class="ca-ticket-window-offlab">{{ o.label }}</span>
          <b class="ca-ticket-window-offval">{{ o.v }}</b>
        </li>
      </ul>
      <p class="ca-ticket-window-note">
        「售票量（张）」不等于「旅客发送量（人次）」，一张票可以含多个人；
        4499 列是「最高可安排」的运力计划值，不是实际开行值。
        这张图不写「12306 每天被访问多少次」「133.1 万张被拒出票」——查不到一手出处或口径经不起追问。
      </p>
    </div>

    <div class="ca-ticket-window-official ca-ticket-window-myth">
      <p class="ca-ticket-window-blocktitle">
        流传说法 vs 能查到的情况
        <span class="ca-ticket-window-mtag is-coral">辟谣语境</span>
      </p>
      <p class="ca-ticket-window-explain">
        流传说法是「余票是算出来的假票，故意不给你买」。本轮没有查到任何一手证据支持「故意放假票」；
        能公开描述的是限售区间、席位复用的运能调度、分时段放量这三件事。
        另一个流传说法是「买加速包走双通道更快」。官方口径是：第三方平台不产生任何票源，
        它的「抢票」本质是用旅客账号代为提交官方免费的候补订单，付费不改变候补排队顺序，
        宣传的「有票」常常是「买长乘短」「买短乘长」方案，要多花钱或上车补票。
        铁路 12306 网站（含客户端）是中国铁路唯一官方火车票网络售票平台，未与任何第三方平台机构开展合作，
        没有购票加速包、购票会员费、挑选车厢座位费等额外收费；2026 年 1 月 29
        日国务院新闻办公室发布会上再次强调，也没有把票务数据提供给第三方。
      </p>
    </div>

    <p class="ca-cap">
      候补不是「抽签」，是<b>按提交时间先后的队列</b>，票来自<b>退票、改签、未支付释放和加开加挂</b>——
      所以<b>只要存在候补订单，界面就不会出现可直接购买的余票</b>；不设截止时间的话，默认一般是<b>开车前 6
      小时</b>。成功率两套口径分开摆：官方预估「70% 以上」与春运期间披露「75% 以上」，都未公布计算口径、
      绝不平均。单日售票量最高纪录是 2026 年 9 月 23 日的 <b>2973.7 万张</b>（口径是「张」，不是人次）。
      这张图不给任何提高抢票成功率的办法，只教你认口径。
    </p>
  </div>
</template>

<style scoped>
.ca-ticket-window {
  max-width: 540px;
  margin-inline: auto;
}

.ca-ticket-window-fig {
  margin: 0;
}

.ca-ticket-window-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-ticket-window-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-ticket-window-head {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--ink-2);
}

.ca-ticket-window-rail {
  stroke: var(--line-strong);
  stroke-width: 2;
}

.ca-ticket-window-st {
  fill: var(--panel-2);
  stroke: var(--ink-2);
  stroke-width: 1.4;
}

.ca-ticket-window-stl {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-ticket-window-br-long {
  fill: var(--blue);
}

.ca-ticket-window-br-short {
  fill: var(--coral);
}

.ca-ticket-window-bl {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--blue);
}

.ca-ticket-window-bs {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--coral);
  text-anchor: middle;
}

.ca-ticket-window-src {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
}

.ca-ticket-window-arrow {
  stroke: var(--line-strong);
  stroke-width: 1;
}

.ca-ticket-window-box {
  fill: var(--panel-2);
  stroke: var(--accent);
  stroke-width: 1.4;
}

.ca-ticket-window-box.is-lead {
  stroke: var(--accent);
}

.ca-ticket-window-bt {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--accent);
  text-anchor: middle;
}

.ca-ticket-window-bs2 {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-ticket-window-flow {
  stroke: var(--accent);
  stroke-width: 1.6;
}

.ca-ticket-window-head-tri {
  fill: var(--accent);
}

.ca-ticket-window-rates,
.ca-ticket-window-rules,
.ca-ticket-window-official {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-ticket-window-blocktitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-ticket-window-mtag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 999px;
}

.ca-ticket-window-mtag.is-coral {
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-ticket-window-mtag.is-ink {
  color: var(--muted);
  background: var(--panel-3);
}

.ca-ticket-window-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px;
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 10px;
  min-width: 0;
}

.ca-ticket-window-rowlab {
  font-size: 11.5px;
  line-height: 1.45;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-ticket-window-rowlab.is-coral {
  color: var(--coral);
}

.ca-ticket-window-rowlab.is-accent {
  color: var(--accent);
}

.ca-ticket-window-rowlab.is-blue {
  color: var(--blue);
}

.ca-ticket-window-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-ticket-window-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  animation: ca-ticket-window-grow 1s var(--ease) both;
}

.ca-ticket-window-fill.is-accent {
  background: var(--accent);
}

.ca-ticket-window-fill.is-blue {
  background: var(--blue);
}

.ca-ticket-window-fill.is-coral {
  background: var(--coral);
}

@keyframes ca-ticket-window-grow {
  from {
    width: 0;
  }
}

.ca-ticket-window-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  min-width: 0;
}

.ca-ticket-window-explode,
.ca-ticket-window-explain,
.ca-ticket-window-note {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-ticket-window-rulelist {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-ticket-window-rulelist li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 4px 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--line);
  min-width: 0;
}

.ca-ticket-window-rk {
  font-size: 11.5px;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-ticket-window-rulelist b {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--accent);
  text-align: right;
}

.ca-ticket-window-offlist {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-ticket-window-offlist li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-ticket-window-offlist li.is-accent {
  border-left: 3px solid var(--accent);
}

.ca-ticket-window-offlist li.is-blue {
  border-left: 3px solid var(--blue);
}

.ca-ticket-window-offlist li.is-coral {
  border-left: 3px solid var(--coral);
}

.ca-ticket-window-offlist li.is-ink {
  border-left: 3px solid var(--line-strong);
}

.ca-ticket-window-offlab {
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-ticket-window-offval {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.ca-ticket-window-myth {
  border-left: 3px solid var(--coral);
  padding-left: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .ca-ticket-window-fill {
    animation: none;
  }
}
</style>
