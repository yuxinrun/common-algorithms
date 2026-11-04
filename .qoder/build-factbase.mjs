// 生成 .qoder/factbase.md —— 全站唯一的「数字入口」文件。
// 它本身不装数字，只做三件事：定规矩、给路由（页面 → 行号）、指路（分片章节行号地图）。
// 数字住在 facts-intl.md / facts-cn.md / facts-books.md / facts-path.md 四个分片里。
import { readFileSync, writeFileSync } from 'node:fs'

const here = (f) => new URL(f, import.meta.url)
const text = (f) => readFileSync(here(f), 'utf8')

const SHARDS = ['facts-intl.md', 'facts-cn.md', 'facts-books.md', 'facts-path.md']
const present = SHARDS.filter((f) => {
  try {
    readFileSync(here(f))
    return true
  } catch {
    return false
  }
})

// —— 路由表：页面 → 命中的行号 ——
const ORDER = text('../docs/.vitepress/theme/reading-order.ts')
const PAGES = [...ORDER.matchAll(/link:\s*'([^']+)'/g)].map((m) => m[1].replace(/^\//, '')).filter(Boolean)

const TAG = { 'facts-intl.md': '国际', 'facts-cn.md': '国内', 'facts-books.md': '图书', 'facts-path.md': '生活' }
const byPage = new Map()
const shardStats = []

for (const file of present) {
  const lines = text(file).split(/\r?\n/)
  let rows = 0
  const ids = { A: 0, B: 0, C: 0 }
  const sections = []
  lines.forEach((l, i) => {
    if (/^#{2,3} /.test(l)) sections.push({ at: i + 1, title: l.replace(/^#+ /, '') })
    const idMatch = l.match(/^\|\s*([A-Z]{1,2}-\d+)\s*\|/)
    if (!idMatch) return
    rows++
    const cells = l.split('|').map((c) => c.trim())
    const grade = (cells[4] || '').replace(/[（(].*$/, '').trim()
    if (/^A/.test(grade)) ids.A++
    else if (/^B/.test(grade)) ids.B++
    else if (/^C/.test(grade)) ids.C++
    const hits = PAGES.filter((p) =>
      new RegExp(`(?<![\\w./-])/${p.replace(/[/]/g, '\\/')}(?![\\w/-])`).test(l)
    )
    for (const p of hits) {
      if (!byPage.has(p)) byPage.set(p, [])
      byPage.get(p).push({ id: idMatch[1], tag: TAG[file], grade })
    }
  })
  shardStats.push({ file, lines: lines.length, rows, ...ids, sections })
}

const routeRows = PAGES.map((p) => {
  const list = byPage.get(p)
  if (!list || !list.length) {
    return `| \`/${p}\` | 0 | 只用第二节的冲突对照、第三节的拒印清单与第四节的红线 |`
  }
  return `| \`/${p}\` | ${list.length} | ${list.map((r) => `${r.id}(${r.tag}·${r.grade})`).join(' ')} |`
})

const mapRows = shardStats
  .map(
    (s) =>
      `| \`${s.file}\` | ${s.lines} 行 | ${s.rows} 条 | A ${s.A} / B ${s.B} / C ${s.C} | ` +
      s.sections.slice(0, 6).map((x) => `${x.at}·${x.title}`).join('；') +
      ' |'
  )
  .join('\n')

const missing = SHARDS.filter((f) => !present.includes(f))

const out = `# 事实库入口（先读这份，再动笔）

> 这份文件**不装数字**。它只干三件事：告诉你取数的三步流程、给你「页面 → 行号」的路由、指出每个数字住在哪个分片的哪一节。
> 总纪律只有一句：**分片里没有的数字，不许写进正文，也不许画进图表。**
${missing.length ? `\n> ⚠️ 还没到稿的分片：${missing.map((m) => `\`${m}\``).join('、')}。到稿前不要写这些页面。\n` : ''}
## 〇、怎么取数（三步，别跳）

1. **在分片里 grep 你的路由。** 例如写 \`/family/graph\`，就在四个分片里搜 \`family/graph\`，拿到行号清单（见第三节）。
2. **用行号回到分片读整行。** 只看「事实」列会漏掉限定语；限定语是这一行的第二半，必须一起抄进正文。
3. **按等级决定怎么写。** A 可核 → 直接写；B 需限定 → 必须把限定语写进句子；C 流行但证据弱 → 只能出现在辟谣语境，且写成「流传说法」；「拒绝给数」→ 改成定性表述，一个具体数字都不许印。

## 一、五条硬禁令（先于一切）

1. **不承诺收益。** 学习收益、职业收益、投资回报、健康收益都不承诺。「照这么做就能进大厂/翻盘/治好」是禁止句式。
2. **不荐股、不荐课、不荐 App、不荐模型、不荐平台、不带货。** 出现公司或产品名只能是「举例说明某类做法」，不评价好坏，不给价格。
3. **不给规避算法的操作指引。** 不教绕过风控、验证码、人脸/指纹、青少年模式、实名、抢票机制；不写养号、提权、破解推荐的方法。
4. **不预测 AI 对社会与就业的冲击，不给「几年内取代 X%」这类数字。**
5. **不把论文结果说成已落地，不把厂商自报写成客观事实。** 自报数字必须带「企业自报，未经独立评估」。

## 二、分级与冲突处理

- **A 可核**：有一手出处（论文、官方统计、标准文本、原始公告），可直抓 URL。
- **B 需限定**：数字成立但依赖口径/队列/年份/自报，限定语必须印在正文里。
- **C 流行但证据弱**：网上流传、查不到一手出处。只能进辟谣语境。
- **两套口径分开摆，绝不平均成一个数。** 同一指标有两个来源打架时，两个都写，并写明「站内不取平均」。
- **「不知道」是允许的答案。** 查不到就写查不到，不许补一个看起来合理的数。

## 三、页面 → 行号路由（共 ${PAGES.length} 页）

| 页面 | 专属行数 | 行号（编号·分片·等级） |
| --- | --- | --- |
${routeRows.join('\n')}

## 四、分片章节地图

| 分片 | 规模 | 事实条数 | A/B/C | 章节（行号·标题） |
| --- | --- | --- | --- | --- |
${mapRows}

## 五、交付前自检（每页都过一遍）

- [ ] 每个数字都能在第 三 节列出的行号里找到，等级 B 的把限定语写进了句子
- [ ] 「拒绝给数」清单里的条目没印出具体数字
- [ ] 图里出现但事实库没有的数字，图上写了「示意 / 假设 / 举例 / 待核」
- [ ] 医疗、金融、法律、用工段落有 \`::: warning\` 且给了出口（医生 / 说明书 / 客服 / 执业律师）
- [ ] 没有承诺、没有规避指引、没有带货、没有「几年内取代 X%」
`

writeFileSync(here('factbase.md'), out)
console.log(
  `factbase.md 已生成：${PAGES.length} 个页面，${shardStats.reduce((n, s) => n + s.rows, 0)} 条事实（` +
    shardStats.map((s) => `${s.file.replace('facts-', '').replace('.md', '')} ${s.rows}`).join(' / ') +
    `），零引用页面 ${PAGES.filter((p) => !byPage.has(p)).length}`
)
