# 算法这件事

一个讲「生活里到处都在跑的那些算法」的中文手册站：复杂度到底在说什么、导航凭什么这么绕、照片为什么能变小、扫码付款为什么有时被拦、外卖那三十分钟是怎么算出来的、扫地机怎么保证不漏、以及那些听起来很科学的算法数字哪些经不起追问。

设计语言继承母品牌 [BRAND.md](./BRAND.md)（暖白纸面 + 深海墨绿 + 青色主强调 + 珊瑚红警示），站点图形按本站主题重画：导航标记是一段两级台阶的阶梯路径（起点与终点各挖一个孔），吉祥物是一条戴圆眼镜、拿直尺在方格纸上画最短路径的小青鱼。

## 本地跑起来

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # 产物在 docs/.vitepress/dist
npm run preview
```

部署到 GitHub Pages 仓库名子路径时，构建要带前缀：

```bash
BASE=/common-algorithms/ npm run build
```

## 目录

```
docs/                     首页 + 42 个正文页（reading-order.ts 是顺序与连播队列的唯一真相源）
docs/.vitepress/theme/
  index.ts                自动注册 components/ 下所有 .vue
  reading-order.ts        侧边栏 + 连播队列，同一份数据
  useSpeech.ts            SpeechSynthesis + MediaSession 引擎
  extract.ts              按 DOM 顺序抓正文，跳过图表
  style.css               品牌 token 与全站版式
  components/             34 个图表 / 交互组件（ca- 前缀）+ ListenBar / BrandMark / HeroLattice
docs/public/              logo.svg / logo-dark.svg / favicon.svg / grid-fish.svg
.qoder/                   调研产物、事实库、组件契约、正文契约
```

## 听书引擎的几个坑（改这里之前先读）

- **9 秒 resume 心跳**：Chrome 在约 15 秒静音后强行掐断长句朗读，引擎靠周期性 `speechSynthesis.resume()` 续命。别把它当冗余代码删掉。
- **图表必须 `data-listen="skip"`**：`extract.ts` 靠它跳过 SVG。代价是听的人读不到图里的数字，所以每张图的结论必须写进 `.ca-cap`，正文里还要以完整句子再出现一次。
- **依赖 DOM / localStorage 的组件要等挂载**：播放条用 `mounted` ref + `nextTick` 只在客户端渲染。SSR 阶段扫不到正文，首帧必然与客户端不一致，全站每页报 hydration mismatch。
- **`themeConfig.footer.message` 会被塞进 `<p>`**：里面只能放行内元素。放 `<div>` 会被浏览器自动断段，同样炸全站 hydration。品牌块用 `span` + `display:flex`。
- **连播队列 = `reading-order.ts`**：新增页面必须同时出现在这份表里，否则连播会静默停在上一页。
- **组件里的几何必须确定性**：`Math.random` / `Date.now` / `window` 一进 `setup`，SSR 与客户端就会画出两张不同的图，hydration 报错会铺满全站。要"随机"就用写死种子的 LCG。
- **42 条路由的 `.md` 必须都在**：VitePress 的死链检查会把构建直接判失败，所以正文没写完时也要留占位页。占位页的 `title` 里有半角双引号（`为什么"快"要先问规模`），YAML 必须用单引号包，否则 frontmatter 解析炸在 `parseMatter`。
- **preview 进程会认旧 dist**：重新构建后 `vitepress preview` 可能继续对 `assets/*.css`、`assets/*.js` 返回 404，页面退化成裸 HTML——看着像样式表写坏了，其实只是服务器要重启。先按 PID 重启 preview，再怀疑站点。

## 内容纪律

正文里的每个数字都要能在 `.qoder/factbase.md` 指路的四个分片里找到出处，分级是 **A 可核 / B 需限定 / C 流行但证据弱**；C 级只能作为"流传说法"被辟谣，标了「拒绝给数」的条目一律不印具体数字。没有出处又确实要画的形状，图上必须写「示意 / 假设 / 举例 / 待核」。红线见 `.qoder/content-brief.md` 第六节：不承诺学习与职业收益、不荐课不荐 App 不带货、不教规避风控与验证码、不预测 AI 对就业的冲击、不把论文结果说成已落地、不把厂商自报写成客观事实。

### 交稿前自查（四个脚本，只读，不改文件）

```bash
node .qoder/build-factbase.mjs      # 重新生成事实库入口（页面 → 行号路由 + 分片地图）
node .qoder/audit.mjs               # 结构、frontmatter、死链、黑话、承诺句式、字数
node .qoder/numcheck.mjs            # 正文每个数字能否回溯到事实库分片
node .qoder/component-numcheck.mjs  # 组件里事实库没有的数字，必须自带「示意/假设/待核」标注
```

内容仅为算法与信息技术的科普介绍，不构成医疗、金融或法律建议。
