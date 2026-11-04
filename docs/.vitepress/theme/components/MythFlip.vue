<script setup lang="ts">
// 翻牌：一面是刷到的说法，一面是本稿查到的情况。
// 右侧圆点的位置不是本站新发明——它照抄事实分片里那一行的等级：A 可核 / B 需限定 / C 流行。
// 左侧圆点是「流传说法」本身的位置：绝大多数是 C（查不到一手出处，或在转述里被加码）。
// 纪律：C 级说法只能待在辟谣语境里；每条都要把限定语一起印出来（P-13、P-66、P-74、P-81、P-86、P-89、I-102—104）。

import { ref } from 'vue'

// —— 画布几何 ——
const W = 440
const LABEL_X = 8
const AXIS_Y = 34
const ROW0 = 56
const PITCH = 24
const POS_C = 132
const POS_B = 254
const POS_A = 376
const DOT_R = 4
const H = 268

const GRADE_POS: Record<string, number> = { C: POS_C, B: POS_B, A: POS_A }
const GRADE_NAME: Record<string, string> = { C: 'C 流行', B: 'B 需限定', A: 'A 可核' }

const MYTHS = [
  {
    id: 'm1',
    short: '三分钟想出最短路',
    mythGrade: 'C',
    factGrade: 'B',
    myth: '「Dijkstra 三分钟就想出了最短路径算法。」',
    fact: '能查到的是他本人 2001 年的回忆：大约 20 分钟，在咖啡馆、无纸无笔；1956 年构思，1959 年才发表那篇 3 页短文。',
    limit: '「3 分钟」查不到任何一手出处，是在转述里加码的版本。构思年不等于发表年，也不能写成「20 分钟写出可运行程序」。',
    src: '出处：freeCodeCamp 转引原论文（Numerische Mathematik 1: 269—271，1959）与 2001 年回忆；本稿编号 P-13、P-87。'
  },
  {
    id: 'm2',
    short: '大 O 就是速度排名',
    mythGrade: 'C',
    factGrade: 'B',
    myth: '「O(n log n) 一定比 O(n²) 快，所以大 O 就是快慢排行榜。」',
    fact: '大 O 只描述增长率，不含常数、不含硬件、不含数据分布；要讲「快」必须先说 n 足够大。CLRS 的定义里 O 是上界集合，不是紧界。',
    limit: '同理，「O(1) 一定比 O(log n) 快」也不成立：一个要 10⁶ 次基本操作的 O(1)，比只要 10 次的 O(log n) 更慢；内存布局、缓存与哈希冲突常被大 O 忽略。',
    src: '出处：Big O notation / Analysis of algorithms 条目转引 CLRS 第 3 章；本稿编号 P-66、P-67、P-91。'
  },
  {
    id: 'm3',
    short: '匈牙利人发明的算法',
    mythGrade: 'C',
    factGrade: 'B',
    myth: '「匈牙利算法是匈牙利人发明的。」',
    fact: 'Kuhn 1955 年给出基于 König／Egerváry 定理的匹配算法，Edmonds 1965 年用「开花（blossom）」处理一般图；König 与 Egerváry 属匈牙利学派，只给了定理、没给算法。',
    limit: 'Edmonds 本人抗议过「匈牙利算法」这个命名。名字当趣闻可以讲，但不能写成「匈牙利人发明的算法」。',
    src: '出处：Hungarian／Blossom algorithm 条目转引 Kuhn 1955、Edmonds 1965；本稿编号 P-74。'
  },
  {
    id: 'm4',
    short: 'FFT 是 1965 年凭空出现的',
    mythGrade: 'B',
    factGrade: 'B',
    myth: '「快速傅里叶变换是 1965 年第一次被想到的。」',
    fact: '1965 年 Cooley & Tukey 的论文让它进入数字计算机时代（Math. Comp. 19(89): 297—301），把 DFT 从 O(n²) 降到 O(n log n)；但 Gauss 约 1805 年已有等价的手稿。',
    limit: '「1965 第一次想到」只在「数字计算机时代」这个限定下成立。讲 FFT 历史必须把 Gauss 手稿并列，不能写「凭空发明」。',
    src: '出处：Cooley—Tukey 与 History of the FFT 条目；本稿编号 P-17、P-81。'
  },
  {
    id: 'm5',
    short: '量子计算机要破解密码了',
    mythGrade: 'C',
    factGrade: 'A',
    myth: '「现有的加密撑不住了，量子计算机一上线就能破解。」',
    fact: '可核的是两件事：一是资源估算——拆 RSA-2048 需要约 2000 万个含噪量子比特、1μs 操作周期、约 8 小时（Gidney & Ekerå 2021）；二是 NIST 自 2024 年起分批发布后量子密码标准，迁移以「年」为单位。',
    limit: '「8 小时」必须和「2000 万比特」「1μs 周期」同框出现，否则就是在制造恐慌。这是资源估算，不是倒计时。',
    src: '出处：Quantum 5, 433（2021）论文标题与摘要可直接抓取；本稿编号 P-86。'
  },
  {
    id: 'm6',
    short: '余票是算出来的假票',
    mythGrade: 'C',
    factGrade: 'B',
    myth: '「12306 显示的余票是算出来的假票，故意不卖给你。」',
    fact: '本轮没有查到任何一手证据支持「故意放假票」。能公开描述的是机制：候补订单按提交时间先后排队、系统 24 小时自动兑现；存在候补订单时不会出现可直接购买的余票；席位受限售区间、席位复用与分时段放量影响，所以同一趟车在不同出发站结果不同。',
    limit: '「同一趟车余票不一样」是真的，但它是区间限售，不是伪造。站内不给任何提高抢票成功率的操作指引。',
    src: '出处：官方与客服口径（本稿编号 C-38）＋辟谣行 P-89（C 流行，指「假余票」说法本身查无一手）。'
  },
  {
    id: 'm7',
    short: 'AI 判案比人客观',
    mythGrade: 'C',
    factGrade: 'A',
    myth: '「机器不会带偏见，用它量刑比法官客观。」',
    fact: '三条必须同框：ProPublica 2016 年以两年内再犯为标签比较 COMPAS 风险分，黑人被告假阳性率 45%、白人 23%，白人假阴性率 48%、黑人 28%；开发方 Northpointe 反驳说两群的校准度与总体准确率相当（其自称 68%，ProPublica 复核为 61%）；形式化结论是——两群基准率不同且分类器不完美时，「校准」与「错误率平衡」在数学上不能同时满足。',
    limit: '双方都不是「算错了」：一个比较错误率平衡、一个比较预测值与校准。定理能解释「为什么两方都能自证清白」，但不能告诉你该选哪个公平定义。样本来自佛罗里达州 Broward 县公开记录，标签本身受执法差异影响。',
    src: '出处：ProPublica「Machine Bias」（2016-05-23）原文，含 Northpointe 来信；本稿编号 I-102、I-103、I-104。'
  }
]

const open = ref('m1')
const toggle = (id: string) => {
  open.value = open.value === id ? '' : id
}
const xOf = (g: string) => GRADE_POS[g] ?? POS_C
const isToggled = (id: string) => open.value === id
</script>

<template>
  <div class="ca-myth-flip ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Myth Flip · 翻牌：流传说法 vs 查到的情况</span>
      <p class="ca-widget-sub">
        左边是刷到的那句话，右边是本稿查到的情况。点一下卡片可以把出处和限定语摊开看。
      </p>
    </div>

    <figure class="ca-myth-flip-fig">
      <svg
        class="ca-myth-flip-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-myth-flip-tag" :x="W - 8" :y="14">等级来自本稿</text>

        <line class="ca-myth-flip-axis" :x1="POS_C" :y1="AXIS_Y" :x2="POS_A" :y2="AXIS_Y" />
        <g v-for="g in ['C', 'B', 'A']" :key="`ax-${g}`">
          <line class="ca-myth-flip-tick" :x1="xOf(g)" :y1="AXIS_Y - 4" :x2="xOf(g)" :y2="AXIS_Y + 4" />
          <text class="ca-myth-flip-ticklab" :x="xOf(g)" :y="AXIS_Y - 8">{{ GRADE_NAME[g] }}</text>
        </g>

        <g v-for="(m, i) in MYTHS" :key="m.id" class="ca-myth-flip-row">
          <text class="ca-myth-flip-lab" :x="LABEL_X" :y="ROW0 + i * PITCH">{{ m.short }}</text>
          <line
            class="ca-myth-flip-link"
            :x1="xOf(m.mythGrade)"
            :y1="ROW0 + i * PITCH - 3"
            :x2="xOf(m.factGrade)"
            :y2="ROW0 + i * PITCH - 3"
          />
          <circle class="ca-myth-flip-dot-myth" :cx="xOf(m.mythGrade)" :cy="ROW0 + i * PITCH - 3" :r="DOT_R" />
          <circle class="ca-myth-flip-dot-fact" :cx="xOf(m.factGrade)" :cy="ROW0 + i * PITCH - 3" :r="DOT_R" />
        </g>

        <text class="ca-myth-flip-foot" :x="LABEL_X" :y="ROW0 + MYTHS.length * PITCH + 8">
          ● 流传说法的位置　● 本稿查到的等级
        </text>
        <text class="ca-myth-flip-foot2" :x="LABEL_X" :y="ROW0 + MYTHS.length * PITCH + 22">
          A 可核＝有原始文献可查　B 需限定＝有出处但必须带限定语
        </text>
        <text class="ca-myth-flip-foot2" :x="LABEL_X" :y="ROW0 + MYTHS.length * PITCH + 36">
          C 流行＝转述与口碑，只能待在辟谣语境里
        </text>
      </svg>

      <span class="sr-only">
        七张牌，每条的等级取自本稿分片。一，三分钟想出最短路：流传说法属 C 流行，能查到的情况属 B 需限定——本人
        2001 年回忆约 20 分钟，1956 构思、1959 发表。二，大 O 就是速度排名：C 对 B。三，匈牙利人发明的算法：C 对
        B——Kuhn 1955、Edmonds 1965。四，FFT 是 1965 年第一次想到：B 对 B，Gauss 约 1805
        年已有等价手稿。五，量子计算机要破解密码：C 对 A 可核——资源估算约 2000 万含噪量子比特、1
        微秒周期、约 8 小时，NIST 自 2024 年起分批发布标准。六，余票是假票：C 对
        B，机制有官方口径但「故意放假票」查无一手。七，AI 判案比人客观：C 对 A 可核——45% 比 23% 的假阳性率、68%
        与 61% 的准确率争议、以及「校准与错误率平衡不可兼得」的定理，三条必须同框。
      </span>
    </figure>

    <div class="ca-myth-flip-deck">
      <button
        v-for="m in MYTHS"
        :key="`b-${m.id}`"
        class="ca-myth-flip-card"
        :class="{ 'is-open': isToggled(m.id) }"
        type="button"
        :aria-expanded="isToggled(m.id) ? 'true' : 'false'"
        @click="toggle(m.id)"
      >
        <p class="ca-myth-flip-head">
          <span class="ca-myth-flip-chip is-myth">{{ GRADE_NAME[m.mythGrade] }}</span>
          <span class="ca-myth-flip-chip is-fact">{{ GRADE_NAME[m.factGrade] }}</span>
          <span class="ca-myth-flip-name">{{ m.short }}</span>
        </p>
        <p class="ca-myth-flip-myth">{{ m.myth }}</p>
        <p class="ca-myth-flip-fact">{{ m.fact }}</p>
        <p class="ca-myth-flip-limit">{{ m.limit }}</p>
        <p v-if="isToggled(m.id)" class="ca-myth-flip-src">{{ m.src }}</p>
      </button>
    </div>

    <p class="ca-cap">
      七张牌里只有两张的「能查到的情况」够得上 <b>A 可核</b>：量子资源估算（<b>2024</b> 年起 NIST
      分批发标准、拆解要 <b>2000 万</b>含噪量子比特与 <b>约 8 小时</b>同框）与 COMPAS 之争（<b>45%</b>
      对 <b>23%</b>、<b>68%</b> 对 <b>61%</b>）。其余五条的「能查到的情况」也只是 <b>B
      需限定</b>——限定语必须跟着数字一起读。看到「某人几分钟想出某算法」「某技术马上颠覆某行业」这类句子，
      先问一句：这一行的等级是 A、B 还是 C？
    </p>
  </div>
</template>

<style scoped>
.ca-myth-flip {
  max-width: 540px;
  margin-inline: auto;
}

.ca-myth-flip-fig {
  margin: 0;
}

.ca-myth-flip-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-myth-flip-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-myth-flip-axis {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-myth-flip-tick {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-myth-flip-ticklab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-myth-flip-lab {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--ink-2);
}

.ca-myth-flip-link {
  stroke: var(--line-strong);
  stroke-width: 1.4;
}

.ca-myth-flip-dot-myth {
  fill: var(--coral);
}

.ca-myth-flip-dot-fact {
  fill: var(--accent);
}

.ca-myth-flip-foot,
.ca-myth-flip-foot2 {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--faint);
}

.ca-myth-flip-row {
  animation: ca-myth-flip-in 0.8s var(--ease) both;
}

@keyframes ca-myth-flip-in {
  from {
    opacity: 0;
  }
}

.ca-myth-flip-deck {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-myth-flip-card {
  display: grid;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  color: var(--ink-2);
  transition: border-color 0.2s var(--ease), background-color 0.2s var(--ease);
}

.ca-myth-flip-card.is-open {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.ca-myth-flip-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0;
  min-width: 0;
}

.ca-myth-flip-chip {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 999px;
}

.ca-myth-flip-chip.is-myth {
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-myth-flip-chip.is-fact {
  color: var(--accent);
  background: var(--accent-soft);
}

.ca-myth-flip-name {
  font-size: 12px;
  color: var(--ink);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-myth-flip-myth,
.ca-myth-flip-fact,
.ca-myth-flip-limit,
.ca-myth-flip-src {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-myth-flip-myth {
  color: var(--coral);
}

.ca-myth-flip-fact {
  color: var(--ink-2);
}

.ca-myth-flip-limit {
  color: var(--muted);
}

.ca-myth-flip-src {
  color: var(--faint);
  border-top: 1px solid var(--line);
  padding-top: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .ca-myth-flip-row,
  .ca-myth-flip-card {
    animation: none;
    transition: none;
  }
}
</style>
