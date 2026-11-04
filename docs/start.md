---
title: "这本手册怎么用（先看它回答哪九个问题）"
description: "四十二页正文的阅读顺序、三条入口路径，以及这本手册明确不做的事：不承诺学会、不荐课不带货、不教绕过风控与验证码。"
---

# 这本手册怎么用（先看它回答哪九个问题）

你大概率不是来学编程的。你只是想知道：导航凭什么让我绕这条路、发给朋友的照片为什么变糊了、扫码付款为什么有时直接被拦、外卖那三十分钟到底花在哪、以及"关闭个性化推荐"那个按钮按下去究竟关掉了什么。

这本手册不按"算法教材"的章节排，按**你被哪件事卡住**排。四十二页正文，每页只回答一个问题，第一屏就把答案给你，不铺垫。

## 先搞懂的是六件事，不是一百个名字

全站只要求你先接受六个判断：**算法是一串能照着做完的步骤**；**它的代价可以用大 O 说清楚**；**"更聪明"常常打不过"更笨但更快"**；**很多算法靠掷骰子，而且掷得很有规矩**；**有些问题就是算不动**；**以及这套东西有明确的边界**。

<div class="mp-steps">
  <div class="mp-step"><b>1</b><div><strong>算法到底是什么</strong><p>一串写得完、能照着做完的步骤。少了"能做完"这一条，它就只是一个愿望。<a href="/basics/what-is-algorithm">读这页</a></p></div></div>
  <div class="mp-step"><b>2</b><div><strong>它是怎么长出来的</strong><p>从纸上的欧几里得到 1959 年那篇三页短文，再到今天手机里的每一道。<a href="/basics/history">读这页</a></p></div></div>
  <div class="mp-step"><b>3</b><div><strong>大 O 在比什么</strong><p>不是比谁快，是比"数据翻十倍，工作量翻多少"。<a href="/basics/complexity">读这页</a></p></div></div>
  <div class="mp-step"><b>4</b><div><strong>聪明不一定赢</strong><p>小数据上，最笨的那个常常先跑完。这背后是缓存、常数和分支预测。<a href="/basics/speed-vs-clever">读这页</a></p></div></div>
  <div class="mp-step"><b>5</b><div><strong>随机是一种本事</strong><p>掷骰子的算法不是偷懒。有些问题只有靠随机才走得动，而且掷得很讲规矩。<a href="/basics/randomness">读这页</a></p></div></div>
  <div class="mp-step"><b>6</b><div><strong>有些就是算不动</strong><p>不是算力不够，是数学上就没那条路。知道边界在哪，比多知道三个名字有用。<a href="/basics/limits">读这页</a></p></div></div>
</div>

<div class="mp-stats">
  <div class="mp-stat"><strong>6 页</strong><span>地基：定义、历史、复杂度、取舍、随机、边界</span></div>
  <div class="mp-stat"><strong>9 页</strong><span>生活现场：手机、路、照片、声音、钱、工厂、身体、游戏、家</span></div>
  <div class="mp-stat"><strong>9 页</strong><span>族谱：搜索、图、优化、动态规划、概率、学习、信号、密码、校验</span></div>
  <div class="mp-stat"><strong>24 个</strong><span>被点名的算法，逐个说它在生活里干什么</span></div>
</div>

这四组数字不会被图表念出来，所以用完整的话说一遍：地基六页，生活现场九页，算法族谱九页，正文里被点名的算法二十四个；剩下的是国内落地七页、辟谣两页、证据与出处三页、书架两页，加首页、开篇、听书和自评。

## 三条入口，别从第一章开始读

- **只想搞懂手机里那些事**：读 [手机](/life/phone) → [路](/life/road) → [照片](/life/picture) → [声音](/life/sound)。这条路线不需要任何数学前置，四页读完你能说清一次拍照从按下快门到发出去经历了哪几道算法。
- **想知道平台为什么这样对你**：读 [导航](/cn/routing) → [外卖派单](/cn/delivery) → [抢票](/cn/tickets) → [推荐](/cn/recommend) → [风控](/cn/risk)。这一条最容易上头，所以每一页都带了"它不是什么"那一段。
- **准备认真学**：读 [算法到底是什么](/basics/what-is-algorithm) → [复杂度](/basics/complexity) → [搜索](/family/search) → [图](/family/graph) → [动态规划](/family/dp)，最后按 [书单](/books/shelf) 挑一本啃。这条路的终点不是"背住二十四个名字"，是你自己能判断一段描述靠不靠谱。

<div class="mp-grid">
  <div class="mp-card"><span class="mp-num">01</span><h3>梯度下降</h3><p>下山的人看不见全貌，只能看脚下这一步往哪斜。它是今天几乎所有"学习"的地基。</p><a class="mp-go" href="/family/optimize">看它属于哪一族</a></div>
  <div class="mp-card"><span class="mp-num">02</span><h3>Dijkstra 与 A*</h3><p>一个老老实实一圈圈扩，一个靠"估计还有多远"抄近路。抄近路的那个，赌注写在启发函数里。</p><a class="mp-go" href="/family/graph">看导航怎么找路</a></div>
  <div class="mp-card"><span class="mp-num">03</span><h3>K-Means 与 DBSCAN</h3><p>同样一堆点，一个先决定"分成几团"，一个只承认"挤在一起的就是同一团"。答案不同不是谁错了。</p><a class="mp-go" href="/family/learn">看学习这一族</a></div>
  <div class="mp-card tone-coral"><span class="mp-num">04</span><h3>蒙特卡洛</h3><p>算不出来的东西，靠大量随机样本逼近。收敛得很慢，但几乎什么都能试。</p><a class="mp-go" href="/family/probability">看概率这一族</a></div>
  <div class="mp-card tone-blue"><span class="mp-num">05</span><h3>FFT</h3><p>把"随时间抖"换成"由哪些频率组成"。它藏在照片、音频、基站和核磁共振里。</p><a class="mp-go" href="/family/signal">看信号这一族</a></div>
  <div class="mp-card"><span class="mp-num">06</span><h3>匈牙利算法</h3><p>一边是骑手一边是订单，怎么配总里程最短。贪心会亏，它保证不亏。</p><a class="mp-go" href="/cn/delivery">看它怎么派单</a></div>
</div>

## 这本手册明确不做的事

<div class="mp-split">
  <div>
    <span class="mp-eyebrow coral">你不会看到</span>
    <p>不承诺"读完就有工作机会"或"转行成功"；不荐课、不荐 App、不带货；不教绕过风控、验证码、人脸、青少年模式；不写"几年内取代百分之几"；不把论文里的结果说成现在正在用；不给厂商自报的数字换成客观事实的写法。</p>
  </div>
  <div>
    <span class="mp-eyebrow">你会看到</span>
    <p>每个硬数字后面挂着等级和出处：能直接当事实写的、必须加限定语的、以及查不到一手、只允许出现在辟谣章节的。全部来源与"我们拒绝印的数字"摊在 <a href="/evidence/red-lines">红线清单</a> 那一页。</p>
  </div>
</div>

::: warning 这本手册不替你做决定
这里是算法与信息技术的科普介绍，不构成医疗、金融或法律建议。涉及身体、钱和合同的判断，请以医生、设备说明书、银行客服或执业律师为准。站内讲机制，不讲"照这么做就能怎样"。
:::

<div class="mp-quote">看懂一个算法，从来不是记住它的名字，是说得出它换掉了什么。</div>

接着读：[把这本手册当成有声书](/listen) · [算法画像自评](/quiz) · [数字速查表](/evidence/numbers) · [我们不写的说法](/myths/list)
