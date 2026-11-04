// 组件数字校对：脚本里出现的"数据型数字"，凡 factbase 分片里查不到的，
// 必须在该组件里被标成示意/假设/举例，否则列出来人工处理。
// 用法：node .qoder/component-numcheck.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'D:/yuxinrun/common-algorithms'
const COMP = join(ROOT, 'docs/.vitepress/theme/components')
const fact = ['facts-intl.md', 'facts-cn.md', 'facts-books.md', 'facts-path.md']
  .map((f) => {
    try {
      return readFileSync(join(ROOT, '.qoder', f), 'utf8')
    } catch {
      return ''
    }
  })
  .join('\n')
  .replace(/,/g, '')

// 几何常量（viewBox、半径、字号、月份序号）不回查
const GEOM_OK = (v) => Number.isInteger(v) && (v <= 40 || [100, 180, 360, 1024, 12, 24, 48, 52, 60, 90].includes(v))
// 会被写进图里的年份（算法史从 1736 起）与法条号
const YEARISH = (v) => v >= 1700 && v <= 2035
// 独立成行的全大写常量（const W = 470 / const TOP = 30）是画布尺寸，不是数据。
// 只认这一种写法：数值后面直接跟行尾或行注释，且名字全大写。超过一万的不算几何。
const GEOM_DECL = /^\s*(?:const|let)\s+([A-Z][A-Z0-9_]*)\s*=\s*(\d+(?:\.\d+)?)(?:\s|\/\/|$)/
// 固定种子伪随机数发生器的三个参数：它们是算法定义，不是数据
const ENGINE = new Set(['1103515245', '12345', '2147483648'])

const rows = []
// 播放条与品牌位是引擎外壳，不是数据图表：里面的数字是倍速与像素，不回查事实库
const CHROME = new Set(['ListenBar.vue', 'BrandMark.vue', 'HeroLattice.vue'])
for (const name of readdirSync(COMP).filter((f) => f.endsWith('.vue') && !CHROME.has(f))) {
  const src = readFileSync(join(COMP, name), 'utf8')
  const script = src.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''
  const labeled = /示意|假设|举例|待核|以当地当年|以官方最新|不是统计|经验线|口径为准/.test(src)

  // 先记下哪些字面量是"行首声明的几何常量"，位置好认：按行扫一遍
  const geomAt = new Set()
  script.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(GEOM_DECL)
    if (m && parseFloat(m[2]) <= 10000) geomAt.add(`${i}:${m[2]}`)
  })

  const unverified = new Set()
  let lineNo = 0
  for (const line of script.split(/\r?\n/)) {
    for (const m of line.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g)) {
      const raw = m[1]
      const v = parseFloat(raw)
      if (geomAt.has(`${lineNo}:${raw}`) || ENGINE.has(raw) || GEOM_OK(v) || YEARISH(v)) continue
      // 小数位数 ≤2 且能在 factbase 找到才算命中（允许 79.6 写成 79.60）
      const trimmed = raw.replace(/\.0+$/, '')
      if (fact.includes(trimmed) || fact.includes(trimmed + '%')) continue
      unverified.add(raw)
    }
    lineNo++
  }
  if (unverified.size) {
    rows.push(`${labeled ? '已标注' : '★未标注'}  ${name.padEnd(24)} ${unverified.size} 个  ${[...unverified].slice(0, 14).join(' ')}`)
  }
}
console.log(rows.join('\n') || '所有组件的数字都能在 factbase 里查到')
