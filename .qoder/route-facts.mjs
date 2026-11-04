// 把四份事实底稿按「页面 slug」反查成路由表，供 factbase.md 使用。
// 页面清单不写死：直接从 theme/reading-order.ts 里抓，保证和侧边栏、连播队列一致。
// 只读，输出 markdown 到 stdout。
import { readFileSync } from 'node:fs'

const ORDER = readFileSync(new URL('../docs/.vitepress/theme/reading-order.ts', import.meta.url), 'utf8')
const PAGES = [...ORDER.matchAll(/link:\s*'([^']+)'/g)]
  .map((m) => m[1].replace(/^\//, ''))
  .filter((p) => p !== '')

const PARTS = [
  { file: 'facts-intl.md', tag: '国际' },
  { file: 'facts-cn.md', tag: '国内' },
  { file: 'facts-books.md', tag: '图书' },
  { file: 'facts-path.md', tag: '生活' }
]

const byPage = new Map()
let matchedRows = 0
let seenIds = 0

for (const { file, tag } of PARTS) {
  let lines
  try {
    lines = readFileSync(new URL(file, import.meta.url), 'utf8').split(/\r?\n/)
  } catch {
    console.error(`! 缺少 ${file}，跳过`)
    continue
  }
  for (const l of lines) {
    const idMatch = l.match(/^\|\s*([A-Z]{1,2}-\d+)\s*\|/)
    if (!idMatch) continue
    matchedRows++
    const id = idMatch[1]
    const cells = l.split('|').map((c) => c.trim())
    const grade = (cells[4] || '—').replace(/[（(].*$/, '').trim()
    const topic = (cells[2] || '').slice(0, 26)
    // 只认页面 slug：必须整段命中白名单，避免把 URL 里的路径当成页面
    const hits = PAGES.filter((p) =>
      new RegExp(`(?<![\\w./-])/${p.replace(/[/]/g, '\\/')}(?![\\w/-])`).test(l)
    )
    if (hits.length) seenIds++
    for (const p of hits) {
      if (!byPage.has(p)) byPage.set(p, [])
      byPage.get(p).push({ id, tag, grade, topic })
    }
  }
}

const rows = []
for (const p of PAGES) {
  const list = byPage.get(p)
  if (!list || !list.length) {
    rows.push(`| \`/${p}\` | 0 | 本页不引专属行号，只用第二节的冲突对照、第三节的拒印清单与第四节的红线 |`)
    continue
  }
  const cell = list.map((r) => `${r.id}(${r.tag}·${r.grade})`).join(' ')
  rows.push(`| \`/${p}\` | ${list.length} | ${cell} |`)
}
console.log(rows.join('\n'))
console.log('\n<!-- 诊断：命中行 ' + matchedRows + '，带页面引用的行 ' + seenIds +
  '，引用总数 ' + [...byPage.values()].reduce((n, v) => n + v.length, 0) +
  '，零引用页面 ' + PAGES.filter((p) => !byPage.has(p)).length + ' / ' + PAGES.length + ' -->')
