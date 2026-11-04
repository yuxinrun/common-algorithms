// 全站正文审计：结构 / 红线 / 数字来源。只读，不改文件。
// 用法：node .qoder/audit.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'D:/yuxinrun/common-algorithms'
const DOCS = join(ROOT, 'docs')
const FACTS = ['facts-intl.md', 'facts-cn.md', 'facts-books.md', 'facts-path.md']
  .map((f) => {
    try {
      return readFileSync(join(ROOT, '.qoder', f), 'utf8')
    } catch {
      return ''
    }
  })
  .join('\n')

// 42 个路由：从 reading-order.ts 里抓，不写死
const ro = readFileSync(join(DOCS, '.vitepress/theme/reading-order.ts'), 'utf8')
const ROUTES = new Set([...ro.matchAll(/link:\s*'([^']+)'/g)].map((m) => m[1]))

const mdFiles = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === '.vitepress' || name === 'public' || name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.md')) mdFiles.push(p)
  }
}
walk(DOCS)

// 这个站的禁区：AI 黑话、恐慌句、学习承诺。禁的是"空洞搭配"，正常技术用语不许误伤
const FORBIDDEN_PATTERNS = [
  [/赋能|抓手|颠覆性|黑科技|改变世界|降维打击|维度打击|奇点临近|智能觉醒|碾压人类/, 'AI 黑话'],
  [/未来已来|淘汰你的是|第一个被.{0,6}取代|取代人类|让所有人失业/, '失业恐慌句'],
  [/家人们|宝子|打工人|yyds|绝绝子|笑死|离谱他妈/, '网络口癖'],
  [/值得注意的是|总而言之|在当今时代|随着[\u4e00-\u9fa5]{0,8}的发展|随着[\u4e00-\u9fa5]{0,8}的进步|近年来,?随着/, '空转句'],
  [/如下图|如上图|如图所示|见下图|参见下图/, '图指引（听的人看不见）'],
  [/量子计算.{0,12}(明天|即将|马上).{0,8}破解|AI\s*(已经)?能读心/, '神化句']
]
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

const report = []
let problems = 0

for (const file of mdFiles) {
  const rel = file.slice(DOCS.length + 1).replace(/\\/g, '/')
  const src = readFileSync(file, 'utf8')
  const issues = []

  // 占位页只报"还没写"，其余检查等正文落地再说，否则八个人并行时报告全是噪音
  if (src.includes('这一页还在写')) {
    report.push(`\n### ${rel}\n- 占位页，尚未开写`)
    problems++
    continue
  }

  if (src.length < 1500 && rel !== 'index.md') issues.push(`疑似占位（${src.length} 字节）`)

  // frontmatter
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) issues.push('缺 frontmatter')
  else {
    // YAML 里 '...' 与 "..." 都合法，取出来先把外层引号剥掉
    const unq = (s) => (s ? s.replace(/^(['"])([\s\S]*)\1$/, '$2').trim() : s)
    const title = unq(fm[1].match(/^title:\s*(.+)$/m)?.[1])
    const desc = unq(fm[1].match(/^description:\s*(.+)$/m)?.[1])
    if (!title) issues.push('frontmatter 无 title')
    if (!desc) issues.push('frontmatter 无 description')
    else {
      const n = (desc.match(/[\u4e00-\u9fff]/g) || []).length
      if (n < 25 || n > 90) issues.push(`description 汉字数 ${n}（目标 40–70）`)
      if (title && desc.includes(title)) issues.push('description 照抄 title')
    }
    const h1 = src.slice(fm[0].length).match(/^#\s+(.+)$/m)?.[1]
    if (title && h1 && title.trim() !== h1.trim()) issues.push(`title 与首个 # 不一致：「${title}」vs「${h1}」`)
    if (/draft:/.test(fm[1])) issues.push('frontmatter 里还留着 draft')
  }

  const body = src.replace(/^---[\s\S]*?---\n/, '')

  // 内链
  const links = [...body.matchAll(/\]\((\/[^)\s]*|\.\/[^)\s]*)/g)].map((m) => m[1])
  for (const l of links) {
    const clean = l.replace(/\.html$/, '').replace(/\.md$/, '').replace(/#.*$/, '')
    if (/\.md$/.test(l)) issues.push(`内链带 .md 后缀：${l}`)
    if (/\.html$/.test(l)) issues.push(`内链带 .html 后缀：${l}`)
    if (clean.startsWith('./')) continue
    if (!ROUTES.has(clean) && clean !== '/' && clean !== '') issues.push(`死链风险：${l}`)
  }

  for (const [re, label] of FORBIDDEN_PATTERNS) {
    const hit = body.match(re)
    if (hit) issues.push(`${label}：「${hit[0]}」`)
  }
  if (EMOJI.test(body)) issues.push('出现表情符号')
  if (!/:::\s*warning/.test(body) && !/layout:\s*home/.test(src) && !/^(listen|quiz)\.md$|^(books|myths|evidence)\//.test(rel))
    issues.push('无 ::: warning')

  // 承诺句式
  const promises = [...body.matchAll(/(一定能|肯定会|保证.{0,6}(学会|拿到|通过|上岸)|照这么做.{0,10}(学会|见效)|\d+\s*(天|周|月)就能|学完.{0,8}就能|包过|稳赚|百分百)/g)].map((m) => m[1])
  if (promises.length) issues.push(`承诺句式：${promises.join(' / ')}`)

  // 字数
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length
  const limit = /^(evidence|books|myths)\//.test(rel) || rel === 'start.md' || rel === 'listen.md' ? 2200 : rel === 'about.md' ? 1200 : 2000
  if (cjk > limit + 250) issues.push(`正文 ${cjk} 汉字，超上限 ${limit}`)
  if (cjk < 700 && rel !== 'index.md') issues.push(`正文仅 ${cjk} 汉字，偏薄`)

  // 组件标签是否存在
  for (const c of [...body.matchAll(/<([A-Z][A-Za-z]+)([^>]*)>/g)]) {
    const name = c[1]
    if (['BrandMark', 'HeroLattice', 'ListenBar'].includes(name)) continue
    if (!existsSync(join(DOCS, '.vitepress/theme/components', `${name}.vue`))) issues.push(`组件不存在：<${name} />`)
  }

  if (issues.length) { report.push(`\n### ${rel}\n` + issues.map((i) => `- ${i}`).join('\n')); problems += issues.length }
}

console.log(`扫描 ${mdFiles.length} 个页面，路由白名单 ${ROUTES.size} 条，问题 ${problems} 项\n`)
console.log(report.join('\n') || '（无问题）')
