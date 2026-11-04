<script setup lang="ts">
// 四把钥匙全部来自《互联网信息服务算法推荐管理规定》（国家网信办等四部门，2022-03-01 施行）
// 与《中华人民共和国个人信息保护法》（2021-11-01 施行）的条文原文口径（C-95、C-96、C-100—C-104、C-110）。
// 条号照抄原始表述，不改写；每张卡片同时给「这把钥匙开不了什么」，
// 因为「备案＝官方背书」「关闭＝没有广告」「价格不一样＝杀熟」这三条都是被误用的（C-123、C-124、C-125）。
// 数字只引官方公告与公开处罚文书：备案总量截至 2026-08-31（C-107）、批次是「第十九批」（C-106）、
// 兜底罚则是「1 万元以上 10 万元以下」（C-103）。个案不得外推（C-113、C-114）。

// —— 画布几何 ——
const W = 440
const H = 190
const PLATE_W = 206
const PLATE_H = 72
const GAP_X = 14
const GAP_Y = 10
const OX = 8
const OY = 24

const KEYS = [
  { id: 'k1', no: '01', name: '查它备过案', law: '第二十四条·第二十六条' },
  { id: 'k2', no: '02', name: '关掉个性化', law: '第十七条·个保法第二十四条' },
  { id: 'k3', no: '03', name: '要一个说明', law: '第十六条·第二十二条' },
  { id: 'k4', no: '04', name: '拒不合理差别', law: '第二十一条·个保法第二十四条' }
]

const plateX = (i: number) => OX + (i % 2) * (PLATE_W + GAP_X)
const plateY = (i: number) => OY + Math.floor(i / 2) * (PLATE_H + GAP_Y)

// 每把钥匙「开得了哪扇门 / 开不了哪扇门」，两列都必须随卡出现
const OPEN = [
  {
    id: 'k1',
    opens:
      '开得了：查得到它有没有备案、备案编号标在哪。具有舆论属性或社会动员能力的算法推荐服务，应当在提供服务之日起 10 个工作日内通过备案系统填报名称、服务形式、应用领域、算法类型、自评估报告、拟公示内容；完成备案的还应当在对外提供服务的网站、App 的显著位置标明备案编号并提供公示信息链接。',
    limit:
      '开不了：备案是形式性填报义务，不等于对算法效果或商业模式的认可；反过来「没查到备案」也不能直接推定违法（要不要备案取决于服务范围）。'
  },
  {
    id: 'k2',
    opens:
      '开得了：要么拿到「不针对你个人特征」的选项，要么拿到便捷的关闭入口；你选择关闭的，平台应当立即停止提供相关服务。另有一件独立的事：选择或删除用于算法推荐服务的个人特征标签。',
    limit:
      '开不了：不是「广告从此消失」。关闭后信息流按热度等非个性化规则排列，广告展示另受广告法与个性化广告开关约束，两个不是同一个开关；具体入口名称由平台自定，以 App 实时页面为准。'
  },
  {
    id: 'k3',
    opens:
      '开得了：平台应当以显著方式告知它在提供算法推荐服务，并公示基本原理、目的意图和主要运行机制；应当设置便捷有效的用户申诉和公众投诉、举报入口，明确处理流程和反馈时限。对你的权益造成重大影响的自动化决策，你还有权要求说明理由，并拒绝「仅通过自动化决策」作出的决定。',
    limit:
      '开不了：「公示基本原理」不等于「公开源代码」；「反馈时限」由提供者自行明确，法规没有统一的小时数，所以别拿这张钥匙去要一个具体数字。'
  },
  {
    id: 'k4',
    opens:
      '开得了：向消费者销售商品或提供服务时，不得根据消费者的偏好、交易习惯等特征，利用算法在交易价格等交易条件上实施不合理的差别待遇；个人信息保护法第二十四条是同一方向的上位法依据。',
    limit:
      '开不了：条文里写的是「不合理的」差别待遇——新客券、会员价、时段折扣未必满足构成要件，「老客价更高」也要证据与监管认定。个案判断请保留证据并咨询执业律师。'
  }
]

// 备案程序的天数是条文原值（工作日）
const FILING = [
  { id: 'new', v: '10 个工作日', k: '开始提供服务之日起填报备案', pct: 50 },
  { id: 'change', v: '10 个工作日', k: '备案信息变更之日起办理变更', pct: 50 },
  { id: 'stop', v: '20 个工作日', k: '终止服务之日起注销并作出妥善安排', pct: 100 }
]

// 官方公告里「备案」与「登记」是两类程序，不合并成一个总数
const REG = [
  { id: 'file', tone: 'accent', num: '1112 款', k: '生成式人工智能服务·累计完成备案', pct: 100 },
  { id: 'reg', tone: 'blue', num: '731 款', k: '应用或功能·累计完成登记（调用已备案模型）', pct: 66 }
]
</script>

<template>
  <div class="ca-cn-rights ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Four Keys · 法律给你的四把钥匙</span>
      <p class="ca-widget-sub">
        四条能落地的权利，各自对应哪一条、开得了哪扇门、开不了哪扇门。条号照抄原文表述。
      </p>
    </div>

    <figure class="ca-cn-rights-fig">
      <svg
        class="ca-cn-rights-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-cn-rights-tag" :x="W - 8" :y="14">条号照抄</text>

        <g v-for="(k, i) in KEYS" :key="k.id" class="ca-cn-rights-plate">
          <rect class="ca-cn-rights-platebg" :x="plateX(i)" :y="plateY(i)" :width="PLATE_W" :height="PLATE_H" rx="6" />
          <text class="ca-cn-rights-no" :x="plateX(i) + 10" :y="plateY(i) + 18">钥匙 {{ k.no }}</text>
          <text class="ca-cn-rights-name" :x="plateX(i) + 10" :y="plateY(i) + 38">{{ k.name }}</text>
          <text class="ca-cn-rights-law" :x="plateX(i) + 10" :y="plateY(i) + 58">{{ k.law }}</text>
        </g>
      </svg>

      <span class="sr-only">
        四把钥匙分别是：一、查它备过案，依据第二十四条与第二十六条；二、关掉个性化，依据第十七条与个人信息保护法
        第二十四条；三、要一个说明，依据公示基本原理与申诉投诉入口的第十六条、第二十二条，
        以及个人信息保护法第二十四条里「对个人权益有重大影响的决定可以要求说明理由」那一段；
        四、拒绝不合理的差别待遇，依据第二十一条与个人信息保护法第二十四条。
        备案程序的天数是条文原值：开始提供服务之日起 10 个工作日内填报，变更 10 个工作日内办理，
        终止服务之日起 20 个工作日内注销。
      </span>
    </figure>

    <div class="ca-cn-rights-detail">
      <ul class="ca-cn-rights-keylist">
        <li v-for="(o, i) in OPEN" :key="`d-${o.id}`">
          <p class="ca-cn-rights-khead">
            <span class="ca-cn-rights-knum">钥匙 {{ KEYS[i].no }}</span>
            <b>{{ KEYS[i].name }}</b>
          </p>
          <p class="ca-cn-rights-ktxt">{{ o.opens }}</p>
          <p class="ca-cn-rights-klimit">{{ o.limit }}</p>
        </li>
      </ul>
    </div>

    <div class="ca-cn-rights-filing">
      <p class="ca-cn-rights-blocktitle">
        钥匙一展开：备案是「形式性填报义务」，不是评优
        <span class="ca-cn-rights-mtag is-coral">不是认证</span>
      </p>
      <p v-for="f in FILING" :key="f.id" class="ca-cn-rights-row">
        <span class="ca-cn-rights-rowlab">{{ f.k }}</span>
        <span class="ca-cn-rights-track">
          <span class="ca-cn-rights-fill" :style="{ width: `${f.pct}%` }"></span>
        </span>
        <span class="ca-cn-rights-rowval">{{ f.v }}</span>
      </p>
      <p v-for="r in REG" :key="r.id" class="ca-cn-rights-row">
        <span class="ca-cn-rights-rowlab" :class="`is-${r.tone}`">{{ r.k }}</span>
        <span class="ca-cn-rights-track">
          <span class="ca-cn-rights-fill" :class="`is-${r.tone}`" :style="{ width: `${r.pct}%` }"></span>
        </span>
        <span class="ca-cn-rights-rowval">{{ r.num }}</span>
      </p>
      <p class="ca-cn-rights-note">
        备案范围以「具有舆论属性或者社会动员能力」为条件，不是所有算法都要备案；「第 N 批」是批次、不是总数，
        2026 年 10 月 30 日公开发布的是第十九批境内深度合成服务算法备案信息。上面两个总数（1112 款、731 款）
        来自同一份官方公告，<b>截至 2026 年 8 月 31 日</b>，且分属「备案」与「登记」两类程序，
        不能相加成一个数。查询入口是互联网信息服务算法备案系统 <a href="https://beian.cac.gov.cn/"
        rel="noopener noreferrer" target="_blank">beian.cac.gov.cn</a>——它只证明「登记过」，
        不评价某个算法该不该用。通过隐瞒情况、虚假材料取得备案的，第三十三条规定可撤销并处 1 万元以上
        10 万元以下罚款。
      </p>
    </div>

    <div class="ca-cn-rights-penalty">
      <p class="ca-cn-rights-blocktitle">罚则与个案：幅度是多少、能说明什么</p>
      <p class="ca-cn-rights-bar">
        <span class="ca-cn-rights-barlab">违反第十七条、第二十二条、第二十四条、第二十六条</span>
        <span class="ca-cn-rights-range">
          <span class="ca-cn-rights-rangefill"></span>
        </span>
        <span class="ca-cn-rights-barval">1 万元 — 10 万元</span>
      </p>
      <p class="ca-cn-rights-note">
        这条「1 万元以上 10 万元以下」是<b>法律、行政法规没有规定时的兜底幅度</b>（第三十一条），
        不代表所有违法只罚 10 万，其他法条可能加重。
        另一侧的公开处罚事实：2021 年 4 月 10 日市场监管总局认定阿里巴巴「二选一」构成滥用市场支配地位，
        按其 2019 年中国境内销售额 4557.12 亿元的 4% 处 <b>182.28 亿元</b>罚款，处罚决定书明确它
        「借助市场力量、平台规则和数据、算法等技术手段」保障执行；2021 年 10 月 8 日对美团的「二选一」处罚
        退还独家合作保证金 12.89 亿元、按其 2020 年境内销售额 1147.48 亿元的 3% 处 <b>34.42 亿元</b>罚款，
        并发出《行政指导书》，要求完善平台佣金收费机制与<b>算法规则</b>、连续三年提交自查合规报告。
        这两件是<b>个案</b>：既不能写成「平台用算法就是垄断」，也不能写成「没被罚过就没问题」。
      </p>
      <ul class="ca-cn-rights-laws">
        <li>
          <b>《生成式人工智能服务管理暂行办法》</b>：国家网信办、国家发展改革委、教育部、科技部、
          工业和信息化部、公安部、国家广播电视总局令第 15 号，2023 年 7 月 10 日签署公布，
          自 <b>2023 年 8 月 15 日</b>起施行；监管方式是<b>包容审慎、分类分级</b>——不是「不监管」，
          也不是「所有 AI 都必须备案」。
        </li>
        <li>
          <b>《中华人民共和国个人信息保护法》第二十四条</b>三段适用对象不同（一般自动化决策／信息推送与商业营销／
          对个人权益有重大影响的决定），只引第一段就得不出「价格差异一律违法」。
          2021 年 8 月 20 日通过、<b>2021 年 11 月 1 日</b>施行。
        </li>
        <li>
          <b>专项行动是阶段性部署</b>：「清朗·2022 年算法综合治理」自 2022 年 4 月部署至当年 12 月初；
          「清朗·网络平台算法典型问题治理」在 2024 年 11 月至 2025 年 2 月开展；2026 年 5 月中央网信办通报
          《生活服务类平台算法负面清单（试行）》实施情况时点名的是<b>个别平台</b>存在「选择性整改」等问题。
          都不等于「全行业已解决」或「以后每年都要查」。
        </li>
      </ul>
    </div>

    <p class="ca-cap">
      四把钥匙的原文口径是：<b>第十七条</b>——要么给不针对你个人特征的选项，要么给便捷关闭算法推荐的选项，
      你选了关闭它就应当<b>立即停止</b>；<b>第二十一条</b>——不得利用算法在交易价格等条件上实施
      <b>不合理的</b>差别待遇（「不合理」三个字是构成要件）；<b>第二十四条、第二十六条</b>——
      具备条件的算法要在提供服务之日起 <b>10 个工作日</b>内备案、并在显著位置标明备案号；
      <b>第十六条、第二十二条</b>——公示基本原理、给申诉与投诉入口。
      开不了的三门也记住：备案号不是认可，关闭个性化不等于没有广告，价格有差异不等于杀熟成立。
      本页条款摘录以现行有效文本与官方解释为准，具体请咨询执业律师。
    </p>

    <p class="ca-cn-rights-src">
      条文原文：<a href="https://www.cac.gov.cn/2022-01/04/c_1642894606364259.htm" rel="noopener noreferrer"
      target="_blank">《互联网信息服务算法推荐管理规定》全文</a>·
      <a href="https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm" rel="noopener noreferrer"
      target="_blank">《中华人民共和国个人信息保护法》全文</a>·
      <a href="https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm" rel="noopener noreferrer"
      target="_blank">《生成式人工智能服务管理暂行办法》全文</a>
    </p>
  </div>
</template>

<style scoped>
.ca-cn-rights {
  max-width: 540px;
  margin-inline: auto;
}

.ca-cn-rights-fig {
  margin: 0;
}

.ca-cn-rights-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-cn-rights-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-cn-rights-platebg {
  fill: var(--panel-2);
  stroke: var(--accent);
  stroke-width: 1.2;
}

.ca-cn-rights-no {
  font-family: var(--font-mono);
  font-size: 7.5px;
  letter-spacing: 0.08em;
  fill: var(--faint);
}

.ca-cn-rights-name {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--accent);
}

.ca-cn-rights-law {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--muted);
}

.ca-cn-rights-plate {
  animation: ca-cn-rights-in 0.9s var(--ease) both;
}

@keyframes ca-cn-rights-in {
  from {
    opacity: 0;
  }
}

.ca-cn-rights-detail {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-cn-rights-keylist {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-cn-rights-keylist li {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-cn-rights-khead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin: 0 0 5px;
}

.ca-cn-rights-knum {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.ca-cn-rights-khead b {
  font-size: 12.5px;
  color: var(--ink);
}

.ca-cn-rights-ktxt {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cn-rights-klimit {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--coral);
  overflow-wrap: anywhere;
}

.ca-cn-rights-filing,
.ca-cn-rights-penalty {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-cn-rights-blocktitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cn-rights-mtag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 999px;
}

.ca-cn-rights-mtag.is-coral {
  color: var(--coral);
  background: var(--coral-soft);
}

.ca-cn-rights-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 84px;
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 10px;
  min-width: 0;
}

.ca-cn-rights-rowlab {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-cn-rights-rowlab.is-accent {
  color: var(--accent);
}

.ca-cn-rights-rowlab.is-blue {
  color: var(--blue);
}

.ca-cn-rights-track {
  grid-column: 1 / -1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-cn-rights-fill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--muted);
  animation: ca-cn-rights-grow 1s var(--ease) both;
}

.ca-cn-rights-fill.is-accent {
  background: var(--accent);
}

.ca-cn-rights-fill.is-blue {
  background: var(--blue);
}

@keyframes ca-cn-rights-grow {
  from {
    width: 0;
  }
}

.ca-cn-rights-rowval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  text-align: right;
  min-width: 0;
}

.ca-cn-rights-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 10px;
  min-width: 0;
}

.ca-cn-rights-barlab {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--muted);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-cn-rights-range {
  grid-column: 1 / -1;
  min-width: 0;
  height: 8px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-cn-rights-rangefill {
  display: block;
  min-width: 0;
  width: 100%;
  height: 100%;
  background: var(--coral);
  animation: ca-cn-rights-grow 1s var(--ease) both;
}

.ca-cn-rights-barval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--coral);
  text-align: right;
  min-width: 0;
}

.ca-cn-rights-laws {
  margin: 10px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 9px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cn-rights-laws b {
  color: var(--ink-2);
}

.ca-cn-rights-note {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cn-rights-note b {
  color: var(--coral);
}

.ca-cn-rights-src {
  margin: 12px 0 0;
  font-size: 11px;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-cn-rights-src a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent-soft);
}

@media (prefers-reduced-motion: reduce) {
  .ca-cn-rights-plate,
  .ca-cn-rights-fill,
  .ca-cn-rights-rangefill {
    animation: none;
  }
}
</style>
