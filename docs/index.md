---
layout: home
title: "算法这件事"
titleTemplate: false
description: "导航怎么找路、照片为什么能变小、风控凭什么说你可疑——把每天替你决定的那些算法讲成人话，每个数字带出处，全站可以听完。"
hero:
  name: '算法这件事'
  text: '生活里到处都在算'
  tagline: '导航怎么找路、照片为什么能变小、风控凭什么说你可疑——把那些每天替你决定的算法讲成人话。'
  actions:
    - theme: brand
      text: '先花 3 分钟看看'
      link: /start
    - theme: alt
      text: '直接开始听'
      link: /listen
    - theme: alt
      text: '我已经被唬住了'
      link: /myths/list
features:
  - title: '先搞懂这六件事'
    details: '算法是什么、大 O 到底在比什么、为什么"更聪明"常常打不过"更笨但更快"。这六页是给后面所有页装的地基。'
    link: '/basics/what-is-algorithm'
    linkText: '去打底'
  - title: '生活现场'
    details: '手机、路、照片、声音、钱、工厂、身体、游戏、家。九个场景，每个都指得出"这里跑的是哪一个"。'
    link: '/life/phone'
    linkText: '看现场'
  - title: '算法族谱'
    details: '搜索、图、优化、动态规划、概率、学习、信号、密码、校验。九个家族，分清楚谁是谁的亲戚。'
    link: '/family/search'
    linkText: '认亲戚'
  - title: '身边的算法'
    details: '导航、派单、抢票、推荐、风控、城市、监管。这些是你手里那个 App 真正在跑的东西。'
    link: '/cn/routing'
    linkText: '看国内'
  - title: '别被唬住'
    details: '那些"AI 已经……""量子计算马上……"的句子，逐条翻到能查到的那一面。'
    link: '/myths/list'
    linkText: '翻牌'
  - title: '证据与出处'
    details: '每个硬数字回得到论文、标准、源码或官方口径；查不到的一律标成"流传说法"或直接不给数。'
    link: '/evidence/sources'
    linkText: '查底稿'
---

## 这个站在回答什么

你手里那台手机，每天早上在你醒过来之前就已经算完了一批东西：把闹钟音量调高一格、把消息按重要性重新排一遍、决定哪张照片可以糊一点发出去。这些事没有一件是"魔法"，也没有一件是"阴谋"。它们是一串能照着做完的步骤，加上一个"要什么、愿意牺牲什么"的取舍。

这个站只做一件事：把那串步骤和那个取舍讲清楚。

<div class="mp-stats">
  <div class="mp-stat"><strong>42</strong><span>可以按顺序读完的正文页</span></div>
  <div class="mp-stat"><strong>24</strong><span>生活里真在跑的算法，逐个点名</span></div>
  <div class="mp-stat"><strong>3</strong><span>可信度分级：可核 / 需限定 / 流传</span></div>
  <div class="mp-stat"><strong>1 键</strong><span>Alt+P 从当前位置开始朗读</span></div>
</div>

## 它不做什么

不神化，也不吓唬。

这里不会预告哪天所有密码都被破光，也不会说机器已经能读出你在想什么。两类句子看着都有出处，凑在一起就变成预言；这个站只写查得到、并且有限定的那部分。同样，这里不会给你任何"绕过风控、绕过验证码、操纵推荐"的操作步骤——讲机制可以，教绕过不行。

<span class="sr-only">首页只说明站点范围，没有硬数据。</span>

<div class="mp-split">
  <div>
    <span class="mp-eyebrow coral">这个站不负责</span>
    <p>不负责让你相信"算法正在替你决定人生"。一种神秘力量式的叙述，读起来痛快，但它不解释任何一次导航为什么绕路。</p>
  </div>
  <div>
    <span class="mp-eyebrow">这个站负责</span>
    <p>负责把一串写得完、算得清的步骤讲清楚，并且把它的代价一起讲。强弱、适用边界、被谁否决过，都能落到一句人话上。</p>
  </div>
</div>

## 三种读法

<div class="mp-steps">
  <div class="mp-step"><b>1</b><div><strong>跳着读</strong><p>直接去 <a href="/life/phone">手机那一页</a> 或者 <a href="/cn/tickets">抢票那一页</a>。每页只回答一个问题，第一屏就给答案，不用前后翻。</p></div></div>
  <div class="mp-step"><b>2</b><div><strong>从头读</strong><p>按侧栏顺序走：先搞懂六件事，再看九个生活现场，然后认族谱，最后看国内。整本读完约两小时。</p></div></div>
  <div class="mp-step"><b>3</b><div><strong>听完</strong><p>按 Alt+P，或者用页底的朗读条选"本章""全书"。图表会被跳过，但每张图的结论都由那句图注念出来，详见 <a href="/listen">听书怎么用</a>。</p></div></div>
</div>

## 首页这张图在算什么

上面那张方格纸不是装饰。它是一次真实的广度优先搜索：从起点出发，一圈一圈往外扩，直到碰到终点。图上那条折线是找到的路径，其余被涂浅的格子是"看过但没走"的部分。

它想说的是：**任何一个"正确答案"背后，都藏着一个你看不见的开销。** 答案要多好，以及你愿意让它看多少个格子，这两件事永远是绑在一起卖的。这正是<a href="/basics/complexity">复杂度那一页</a>要讲的东西。

## 数字怎么给的

凡是被写成事实的数字，都能点回一个出处：论文卷期页码、标准编号、开源库源码、官方口径。三个等级印在每一行前面：

<div class="mp-band">
  <div class="mp-band-grid">
    <div class="mp-band-card"><h3>A · 可核</h3><p>一手材料直接可查：论文卷期页码、标准编号、开源库源码。站内照抄原始口径，不改数。</p></div>
    <div class="mp-band-card"><h3>B · 需限定</h3><p>可查，但前提必须跟着一起印。少了那句前提，同一个数字就会变成假的。</p></div>
    <div class="mp-band-card"><h3>C · 流传</h3><p>追不到一手。只出现在辟谣语境，并且明写"流传说法"，绝不混进正文当依据。</p></div>
  </div>
</div>

有些数字被有意**不给**。理由都写在<a href="/evidence/red-lines">红线清单</a>那一页里：口径互斥、来源是厂商自报、或者干脆追不到一手。宁缺毋滥在这里不是姿态，是硬规矩。

<div class="mp-quote">看懂一个算法，从来不是记住它的名字，是说得出它换掉了什么。</div>

---

**接着读**：
      <a href="/start">这本手册怎么用</a> ·
      <a href="/basics/what-is-algorithm">算法到底是个什么东西</a> ·
      <a href="/quiz">算法画像自评</a> ·
      <a href="/books/shelf">书单</a>
