# common-algorithms 正文契约（八个人同时写，靠这份对齐）

写之前必读顺序：**`.qoder/factbase.md`（数字与红线）→ 本文件（怎么写）→ `.qoder/component-spec.md` 第三节（哪个组件在哪页）**。
本文件只管文风、结构、密度、链接、禁区。数字一律以事实库为准，**事实库里没有的数字不许写进正文**；标了"拒绝给数"的条目，正文里也不许出现具体数字。

## 一、这个站在回答什么问题

读者不是程序员，是**每天都在被算法决定、却说不清它干了什么的人**：他想知道导航凭什么这么绕、照片发给朋友为什么变糊、扫码付款为什么有时被拦、外卖那三十分钟是怎么算出来的、以及"关闭个性化推荐"那个按钮到底关了什么。
每一页只回答一个问题，并在第一屏就把答案给出来。不铺垫、不从"随着科技的发展"开始。
全站的态度：**不神化，也不吓唬**。算法不是魔法，也不是阴谋，它是一串能照着做完的步骤 + 一个"要什么、愿意牺牲什么"的取舍。

## 二、页面骨架（照抄，不要发明新结构）

```markdown
---
title: "页面标题（口语，可带冒号）"
description: "一句话摘要，进搜索结果和 og:description。40–70 字，说清这页给什么。"
---

# 页面标题

早上七点，你的闹钟响之前十分钟，手机已经把音量调大了一格…… ← 第一句必须是**具体场景**：时间点、动作、手里的东西。不许从定义开始。
（第二、三段把场景收到本页要回答的那个问题上，最多三段。）

## 本页第一个小标题（是一个判断句，不是名词）

正文段落。一段 2–4 句，一句不超过 30 字。

<ComponentName />

::: warning 这页不能替你做决定（医疗/金融/法律/用工类页面必带，标题按页面调整）
这里是算法与信息技术的科普介绍，不构成医疗、金融或法律建议。涉及身体、钱和合同的判断，请以医生、设备说明书、银行客服或执业律师为准。
:::

<div class="mp-quote">本页最需要被记住的那句话。</div>
```

- 小标题写**判断句**（"压缩不是把照片变小，是把你看不见的那部分扔掉"），不写名词短语（"图像压缩概述"）。听书时听众只能靠标题分段。
- `title` 与正文首个 `#` 一致。frontmatter 里不要再写 `draft`。

## 三、版式原语（已在 style.css 里，直接用，不要新写 CSS）

| 原语 | 用途 |
| --- | --- |
| `<div class="mp-quote">…</div>` | 一句可被记住的话。每页 1–2 个，别超过 3 个 |
| `.mp-stats` + `.mp-stat`（`<strong>数字</strong><span>说明</span>`） | 3–4 个硬指标并列开场 |
| `.mp-steps` + `.mp-step` | 落地流程（算法一步步干什么、手机上的一次拍照经过哪几道） |
| `.mp-grid` + `.mp-card` | 并列的 3–6 个条目（六类问题、六个算法家族） |
| `.mp-split` | 左右对照（你以为的 vs 实际上的） |
| `.mp-band` + `.mp-band-grid` + `.mp-band-card` | 分级清单（复杂度档位、可信度分级、风险档） |
| `.mp-tags` | 标签行（这页用到的算法名） |
| `::: warning` / `::: tip` / `::: info` | 免责与边界用 warning，可操作提示用 tip，中性补充用 info |

图表一律用注册好的组件标签（`<ComplexityLadder />` 等）。**缺图就用原语拼，不许改组件、不许加新组件、不许动 `style.css` / `index.ts` / `reading-order.ts` / `config.mts`。**

### 原语的内部结构必须照抄（CSS 只认这套 DOM）

```html
<div class="mp-stats">
  <div class="mp-stat"><strong>6 页</strong><span>说明文字</span></div>
</div>

<div class="mp-grid">
  <div class="mp-card"><span class="mp-num">01</span><h3>标题</h3><p>两到三句。</p><a class="mp-go" href="/family/graph">接着读</a></div>
</div>
<!-- 卡片色调：默认青，可加 tone-coral / tone-blue / tone-lime -->

<div class="mp-steps">
  <div class="mp-step"><b>1</b><div><strong>这一步叫什么</strong><p>这一步干什么。</p></div></div>
</div>
<!-- <b> 是序号圆点；strong 与 p 必须包在一个 div 里，否则挤进 34px 那一列 -->

<div class="mp-split">
  <div><span class="mp-eyebrow coral">左边标题</span><p>内容。</p></div>
  <div><span class="mp-eyebrow">右边标题</span><p>内容。</p></div>
</div>

<div class="mp-band">
  <div class="mp-band-grid">
    <div class="mp-band-card"><h3>档位名</h3><p>说明。</p><a href="/evidence/numbers">可选链接</a></div>
  </div>
</div>
<!-- mp-band 自带深色底，明暗两种主题下都是深色，里面不要再写行内样式 -->

<div class="mp-tags"><span>梯度下降</span><span>A*</span><span>FFT</span></div>
```

`<span class="sr-only">` 只用在图表组件里，正文不要单独塞。

## 四、密度与"听"的约束（硬性）

1. **每 400–600 字必须有一个可视化**（组件或原语块）。连续正文不得超过 12 行。
2. 数字放在图里，**"所以呢"放在正文里**。图表带 `data-listen="skip"`，听书会整块跳过——所以每个要记住的数字必须在正文里以完整句子再出现一次。
3. 每个组件后面紧跟一句承接，不许把图孤立地插在那里。
4. 一页正文目标：**1200–2000 字**（`/start` `/listen` 与 `/evidence/*`、`/books/*` 可到 2200；`/about` 800–1200）。
5. **代码只写伪代码或一句话比喻**。真代码一出现，大众读者就划走了；确实要写，控制在 4 行内，且必须紧跟一句人话解释。
6. 术语第一次出现必须当场用生活话解释（"哈希表：把东西按'名字算出来的号码'放进柜子的寄存处"），并且同一页内不许连续用三个未解释的术语。

## 五、幽默怎么来

幽默来自**具体场景和准确的比喻**，不来自网络梗。允许："你和闹钟之间那场每天早上七点准时开始的谈判"；"压缩算法像个只肯带一半行李出门的人，而且他扔掉的正好是你不会看的那半"；"排序算法吵架的唯一证据，是它们跑得一样快的时候谁也不服谁"。
禁止：表情符号、"家人们/宝子/打工人"式口癖、谐音梗标题、把读者的无知当笑话（"这都不懂？"）。
**禁区（不许玩笑）**：医疗诊断与病、精神健康、算法裁员与失业、司法量刑与再犯预测、未成年人、残障、事故与伤亡、疫情。这些段落写成短句 + 明确指令 + 给出口。

## 六、红线（违反就返工）

以事实库的红线节为准。摘要版：

- **不承诺学习收益。**"看完这页你就能进大厂 / 转行 / 面试不慌"是禁止句式。可以说"读完你能自己判断这段描述靠不靠谱"。
- **不荐课、不荐 App、不荐模型、不荐平台、不带货。** 出现公司或产品名只能是"举例说明某类做法"，且不得评价其好坏、不得给购买或下载建议、不得出现价格。
- **不给规避算法的操作指引。** 不教绕过风控、验证码、人脸/指纹识别、青少年模式、实名、排队与抢票机制；不写"养号""提权""破解推荐"的方法。可以解释"它为什么这样设计"以及"你能行使的合法权利是什么"。
- **不预测 AI 对就业与社会的影响**，不给"几年内取代 X%"这类数字。
- **不把论文结果说成已落地**，不把厂商自报当客观事实——必须写"企业自报，未经独立评估"。
- **不神化也不恐慌。**"量子计算明天破解密码""AI 已经能读心"是禁止句式；同一段里要给出"目前实际能做到的是……"。
- 事实库里标 **C 级**的说法只能出现在辟谣语境，且明确写成"流传说法"；标"拒绝给数"的条目**不许出现具体数字**，改成定性表述。
- **禁句不要原句引用。** `audit.mjs` 是全篇 grep，不区分"我在批评这句话"和"我在说这句话"。想辟谣"量子计算明天破解密码""AI 已经能读心""学完就能进大厂"，必须换一种写法（"不会预告哪天所有密码都被破光""不会说机器能读出你在想什么"），照抄原句会直接判失败。
- 数字带单位与口径（"ImageNet 2012 年 top-5 错误率 16.4%，是这一届比赛的口径，不是'AI 只有 83.6% 聪明'"）。等级 B 必须带限定语。
- 每页除页脚外，正文里必须出现一次 `::: warning` 形式的边界声明。医疗、金融、法律、用工类页面必带。
- **医疗与金融段落一律给出口**："以医生/说明书/银行客服/执业律师为准"，不许写成诊断或投资建议。

## 七、链接

内链只能用 `reading-order.ts` 里已有的 **42 个路由**，写成 `/family/graph` 这样的绝对路径（不带 `.md`、不带 `.html`）。**不许造新链接**——VitePress 构建会因死链失败。
外链只用在"来源与出处"，且必须是事实库里已经带 URL 的那条。每页至少 2 个指向站内其它页的"接着读"链接。

## 八、每人负责的文件（不要碰别人的）

| 负责 | 文件 |
| --- | --- |
| W1 | `docs/index.md`（首页，`layout: home` + hero + features + 正文区）、`docs/start.md`、`docs/listen.md`、`docs/about.md` |
| W2 | `docs/quiz.md`、`docs/basics/what-is-algorithm.md`、`docs/basics/history.md`、`docs/basics/complexity.md`、`docs/basics/speed-vs-clever.md` |
| W3 | `docs/basics/randomness.md`、`docs/basics/limits.md`、`docs/family/search.md`、`docs/family/graph.md`、`docs/family/verify.md` |
| W4 | `docs/family/optimize.md`、`docs/family/dp.md`、`docs/family/probability.md`、`docs/family/signal.md`、`docs/family/crypto.md` |
| W5 | `docs/family/learn.md`、`docs/life/phone.md`、`docs/life/road.md`、`docs/life/picture.md`、`docs/life/sound.md` |
| W6 | `docs/life/money.md`、`docs/life/factory.md`、`docs/life/health.md`、`docs/life/play.md`、`docs/life/home.md` |
| W7 | `docs/cn/routing.md`、`docs/cn/delivery.md`、`docs/cn/tickets.md`、`docs/cn/recommend.md`、`docs/cn/risk.md`、`docs/cn/city.md`、`docs/cn/regulate.md` |
| W8 | `docs/myths/list.md`、`docs/myths/numbers.md`、`docs/evidence/numbers.md`、`docs/evidence/sources.md`、`docs/evidence/red-lines.md`、`docs/books/shelf.md`、`docs/books/roadmap.md` |

组件归属见 `component-spec.md` 第三节；首页 hero 里的方格纸路径图由 Layout 插槽自动注入，正文里**不要**写它。

## 九、交稿前自查（每页都过一遍）

- [ ] 第一句是场景，不是定义
- [ ] 每 400–600 字有一个可视化，连续正文没超 12 行
- [ ] 每个图表后面有一句承接，图里的关键数字在正文里以句子形式出现过
- [ ] 所有数字都能在事实库里找到，等级 B 的带了限定语，"拒绝给数"的没印具体数字
- [ ] 内链全在 42 个路由内，没有 `.md` / `.html` 后缀
- [ ] 医疗/金融/法律/用工页有 `::: warning`，且没有承诺、没有操作规避、给了出口
- [ ] 术语第一次出现当场用生活话解释过
- [ ] `description` 40–70 字，没有照抄标题
- [ ] 朗读友好：没有只用括号表达的信息、没有"如下图"（要说"上面这张图"，因为听的人看不见）
- [ ] 删掉了所有"值得注意的是""总而言之""在当今时代""随着……的发展"这类空转句
