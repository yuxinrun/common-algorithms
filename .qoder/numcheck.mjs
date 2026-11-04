// 数字来源核查：把正文里"带单位的硬数字"抽出来，逐条回 factbase 分片找。
// 找不到就列进"需要人工确认"清单。只读，不改文件。
// 用法：node .qoder/numcheck.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'D:/yuxinrun/common-algorithms'
const DOCS = join(ROOT, 'docs')
const fact = ['facts-intl.md', 'facts-cn.md', 'facts-books.md', 'facts-path.md', 'component-spec.md']
  .map((f) => {
    try {
      return readFileSync(join(ROOT, '.qoder', f), 'utf8')
    } catch {
      return ''
    }
  })
  .join('\n')

// 组件里的示意数字也算"站内的"，一起收进白名单底稿
const compDir = join(DOCS, '.vitepress/theme/components')
const compText = readdirSync(compDir)
  .filter((f) => f.endsWith('.vue'))
  .map((f) => readFileSync(join(compDir, f), 'utf8'))
  .join('\n')

const HAY = fact.replace(/,/g, '') + '\n' + compText.replace(/,/g, '')

const files = []
const walk = (dir) => {
  for (const n of readdirSync(dir)) {
    if (n === '.vitepress' || n === 'public' || n === 'node_modules') continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p)
    else if (n.endsWith('.md')) files.push(p)
  }
}
walk(DOCS)

// 只抓"像事实的数字"：百分比、金额与数量、倍数、小数、三位以上整数
const PATTERNS = [
  /[\d.,]+\s*%/g,
  /约?\s*[\d.,]+\s*[万亿]\s*(?:元|户|家|人|辆|次|台)?/g,
  /[\d.,]+\s*倍/g,
  /\d+\.\d+/g,
  /(?<![\w.,])\d{3,}(?![\w.])/g
]
// 章节号、法条号、纯小整数不回查
const SKIP = /^\d{1,2}$/

const norm = (s) => s.replace(/,/g, '').replace(/\s/g, '').replace(/^约/, '')
const core = (s) => norm(s).replace(/[%万倍亿元户家人辆次台]/g, '')

const suspects = new Map()
for (const file of files) {
  const rel = file.slice(DOCS.length + 1).replace(/\\/g, '/')
  const body = readFileSync(file, 'utf8').replace(/^---[\s\S]*?---\n/, '')
  for (const re of PATTERNS) {
    for (const m of body.matchAll(re)) {
      const num = core(m[0])
      if (!num || SKIP.test(num)) continue
      // 允许"去掉尾零"的写法命中：574.50 → 574.5
      const variants = [num, num.replace(/\.0+$/, '')]
      if (!variants.some((v) => HAY.includes(v))) {
        if (!suspects.has(rel)) suspects.set(rel, new Set())
        suspects.get(rel).add(norm(m[0]))
      }
    }
  }
}

let total = 0
const lines = []
for (const [rel, set] of suspects) {
  lines.push(`### ${rel}\n  ${[...set].join(' · ')}`)
  total += set.size
}
console.log(`未直接命中底稿的数字表达：${total} 项（命中=该数字串出现在 factbase 四分片或组件源码里）\n`)
console.log(lines.join('\n') || '（全部命中）')
