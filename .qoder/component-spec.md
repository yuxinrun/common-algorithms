# common-algorithms 组件契约（谁写哪个、写成什么样）

写之前必读顺序：**`.qoder/factbase.md`（数字与红线）→ `.qoder/content-brief.md`（正文怎么写）→ 本文件（图表怎么画）**。
组件里的每个数字要么能在事实库里找到出处，要么**必须在图上明写"示意 / 假设 / 举例 / 待核"**——`component-numcheck.mjs` 会逐个数地查。

## 一、文件落位

- 全部落在 `docs/.vitepress/theme/components/<Name>.vue`，`<script setup lang="ts">`。
- `index.ts` 用 `import.meta.glob` 自动注册，**不要改 `index.ts`、不要改 `style.css`、不要改 `config.mts`、不要改 `reading-order.ts`**。
- 根元素固定：`<div class="ca-<kebab> ca-widget" data-listen="skip">`，内部结构：

```vue
<div class="ca-xxx ca-widget" data-listen="skip">
  <div class="ca-widget-head">
    <span class="ca-widget-title">English Label · 中文标题</span>
    <p class="ca-widget-sub">一句人话，说这张图在回答什么。</p>
  </div>
  <figure>…<svg>…</svg><span class="sr-only">给读屏与听书的数字读数</span></figure>
  <p class="ca-cap">这张图里最该被记住的那一句结论，带 <b>数字</b>。</p>
  <style scoped>…</style>
</div>
```

## 二、九条硬纪律（违反必返工）

1. **确定性**：`setup` 里不许出现 `Math.random`、`Date.now`、`new Date`、`localStorage`、`sessionStorage`、`window`、`document`。要"随机"就用固定种子的 LCG（`s = (s * 1103515245 + 12345) % 2147483648`），把种子写死。SSR 与客户端渲染必须逐字节一致，否则全站 hydration 报错。
2. **只用 token，不许写色值**：`var(--accent)` `var(--coral)` `var(--blue)` `var(--lime)` `var(--ink)` `var(--ink-2)` `var(--muted)` `var(--faint)` `var(--line)` `var(--line-strong)` `var(--panel)` `var(--panel-2)` `var(--panel-3)` `var(--bg)` `var(--bg-soft)` `var(--grid-line)` `var(--accent-soft)` `var(--coral-soft)` `var(--blue-soft)` `var(--font-mono)` `var(--font-sans)`。不许出现 `#xxxxxx`、`rgb()`、`hsl()`。
3. **三系列语义固定**：`--accent`（青）= 正常/推荐/算法选中的那条；`--coral`（珊瑚红）= 警告/代价/被否决的那个；`--blue`（蓝）= 参照/基线/别人的做法。不许混用。
4. **SVG 几何全部在 `viewBox` 内算完**，坐标不许依赖容器宽度；`viewBox` 用固定数字，`preserveAspectRatio` 默认。窄屏靠 `width:100%; height:auto` 缩放，不做等比压扁的横条。
5. **条形图/百分比条**的轨道必须是 `grid-template-columns: minmax(0, 1fr) NNpx` 或 `minmax(0,1fr)` 的 flex 子项，内条加 `min-width: 0`，否则 360px 下溢出。
6. **每张图都要有 `.ca-cap`**（听书时读不到图，结论只能从这句话来），关键数字还要在 `<span class="sr-only">` 里完整念一遍。
7. **不许把"示意"画成"数据"**：没有事实库出处的曲线，标题栏或 `.ca-cap` 里必须出现"示意"二字，并说明它只表达形状、不表达数值。
8. **动效可关**：任何 `animation` 都要在 `@media (prefers-reduced-motion: reduce)` 里关掉。
9. **不许写死交互依赖**：可以 `ref` + `@click` 做切换，但初始态必须能独立成立（听书、无 JS、SSR 都要能读懂）。

## 三、谁写哪个（34 个，四个一批）

| 批次 | 组件 | 主用页面 | 这张图要回答的问题 | 数字来源 |
| --- | --- | --- | --- | --- |
| A1 | `AlgoTimeline.vue` | /basics/history | 这些算法是哪年冒出来的，哪些"发明年份"其实是讹传 | facts-intl 历史行 |
| A1 | `ComplexityLadder.vue` | /basics/complexity | n 变大时 1/log n/n/n log n/n²/2ⁿ/n! 差多少 | 自算，标"按公式计算" |
| A1 | `SortShowdown.vue` | /basics/speed-vs-clever、/family/search | 为什么小 n 时插入排序反超；谁在真实库里当收尾 | facts-path 排序行 + 实现证据 |
| A1 | `DiceRolls.vue` | /basics/randomness | 掷骰子的算法为什么靠得住；无免费午餐说了什么 | facts-intl |
| A2 | `HardnessWall.vue` | /basics/limits | 哪类问题"就是算不动"，规模一翻几倍就崩 | facts-intl（TSP/NP） |
| A2 | `RouteCompare.vue` | /life/road、/cn/routing | 同一次出门，最短距离≠最快≠最省油：代价函数决定路线 | facts-cn 导航行 |
| A2 | `CompressionBars.vue` | /life/picture、/family/crypto | 一张照片能压到多小，压掉的到底是什么 | facts-path 图像行 |
| A2 | `SoundChain.vue` | /life/sound、/family/signal | 声音从空气到耳机经过哪几道算法 | facts-path 声音行 |
| B3 | `RiskGate.vue` | /life/money、/cn/risk | 0.1 秒里风控在看什么；精确率与召回率为什么不能同时要 | facts-path + facts-cn |
| B3 | `FactoryLoop.vue` | /life/factory、/cn/city | 振动信号怎么变成"三天后要停机" | facts-path 工厂行 |
| B3 | `MatchMaker.vue` | /life/play | Elo/MMR 的 K 因子与匹配时间—段位差的取舍 | facts-intl（Elo 原始定义） |
| B3 | `HomeRobot.vue` | /life/home | 扫地机怎么保证不漏；恒温器为什么 overshoot | facts-path 家庭行 |
| B4 | `SearchRace.vue` | /family/search | 1024 个格子二分只要 10 步；哈希冲突时会退化 | facts-intl + 自算 |
| B4 | `GridPathFinder.vue` | /family/graph | Dijkstra 与 A* 各看过多少格子，启发式省了什么 | 自算 BFS，标"按同一网格计算" |
| B4 | `MatchAssign.vue` | /family/graph、/cn/delivery | 贪心派单与匈牙利最优派单差多少钱 | 自算 3×3 成本矩阵，标"举例" |
| B4 | `TspExplosion.vue` | /family/optimize、/basics/limits | 城市数从 10 到 20，走法数量怎么炸；人类实际解过多大 | facts-intl |
| C5 | `GradientValley.vue` | /family/optimize | 学习率太大/太小/合适三条轨迹；牛顿法为什么快但会翻车 | 自算，标"示意" |
| C5 | `TrySmarter.vue` | /family/optimize | 退火、遗传、群智三种"聪明地试"各自的脾气 | facts-intl |
| C5 | `KnapsackTable.vue` | /family/dp | 背包填表过程；贪心在 0/1 背包上亏在哪 | 自算，标"举例" |
| C5 | `MonteCarloPi.vue` | /family/probability | 撒点越多越准，但收敛有多慢（1/√N） | 自算 LCG，标"固定种子" |
| C6 | `BayesUpdate.vue` | /family/probability、/life/health | 阳性不等于有病：假阳性后验怎么算 | facts-path 医疗行 |
| C6 | `QueueCurve.vue` | /family/probability、/cn/tickets | 利用率一逼近 1，等待时间就起飞 | 按 M/M/1 公式，标"按公式计算" |
| C6 | `ClusterCompare.vue` | /family/learn | 同一份点，K-Means 与 DBSCAN 给出两种"道理" | 自算点集，标"示意" |
| C6 | `ForestLadder.vue` | /family/learn | 单棵树→森林→提升：SVM/随机森林/XGBoost 各在哪 | facts-intl |
| D7 | `LearningCurve.vue` | /family/learn | ImageNet 错误率怎么从 26% 掉到 3.57%；LSTM/YOLO 各自的位置 | facts-intl A 级数字 |
| D7 | `KalmanConverge.vue` | /family/signal、/life/road | 又抖又漂的读数怎么被修成一条线 | facts-intl（阿波罗/GPS） |
| D7 | `FftSpectrum.vue` | /family/signal、/life/picture | 方波拆开是什么；为什么 FFT 是"现代设备的底座" | facts-intl |
| D7 | `CodeGarden.vue` | /family/crypto、/family/verify | 压缩、纠错、加密是三件不同的事（二维码纠错四档） | facts-path + facts-intl |
| D8 | `CnDispatch.vue` | /cn/delivery | 一次外卖的三十分钟由哪几段构成（含等餐口径） | facts-cn |
| D8 | `TicketWindow.vue` | /cn/tickets | 余票查询在算什么；候补为什么"点不到但有人能买到" | facts-cn |
| D8 | `FeedSwitch.vue` | /cn/recommend | 召回→排序→重排；那个"关闭个性化推荐"的按钮在哪一层起作用 | facts-cn |
| D8 | `CnRights.vue` | /cn/regulate | 法律给了哪几把钥匙：备案、关闭、要求说明、拒绝杀熟 | facts-cn 法规行 |
| E9 | `MythFlip.vue` | /myths/list | 翻牌：流传说法 vs 能查到的情况 | facts-path M 表 |
| E9 | `BookShelf.vue` | /books/shelf | 书架卡：难度、时长（估算）、被读歪成什么 | facts-books 卡表 |

## 四、页面里怎么用

正文写 `<ComponentName />` 一行即可，前后各留一个空行。**组件后面必须紧跟一句承接**（"这张图里值得记住的是最后那一格"），不许把图孤立地插在那里。一页 2–4 张图；缺图就用 `.mp-*` 原语拼（见 content-brief 第三节）。

## 五、交稿自查

- [ ] `grep -n "Math.random\|Date.now\|window\.\|localStorage" <你的文件>` 无输出
- [ ] `grep -n "#[0-9A-Fa-f]\{3,8\}\b\|rgb(\|hsl(" <你的文件>` 无输出
- [ ] 每张图有 `.ca-cap`、有 `<span class="sr-only">`、有 `data-listen="skip"`
- [ ] 没有出处的数字全部带"示意/假设/举例/待核"
- [ ] 360px 不溢出（轨道用 `minmax(0,1fr)`，内条 `min-width:0`）
- [ ] 只新建自己那 4 个 `.vue`，没动 `index.ts` / `style.css` / `config.mts` / `reading-order.ts`
