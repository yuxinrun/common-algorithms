import { defineConfig } from 'vitepress'
import { ORDER } from './theme/reading-order'

// 仓库名部署（https://<user>.github.io/common-algorithms/）时构建用 BASE=/common-algorithms/
// 绑定自定义域名时保持 BASE=/
const base = process.env.BASE ?? '/'

const siteTitle = '算法这件事'

const sidebar = ORDER.map((g) => ({
  text: g.group,
  collapsed: false,
  items: g.items.map((i) => ({ text: i.text, link: i.link }))
}))

const nav = [
  { text: '基础', link: '/basics/what-is-algorithm', activeMatch: '/basics/' },
  { text: '生活', link: '/life/phone', activeMatch: '/life/' },
  { text: '族谱', link: '/family/search', activeMatch: '/family/' },
  { text: '国内', link: '/cn/routing', activeMatch: '/cn/' },
  { text: '辟谣', link: '/myths/list', activeMatch: '/myths/' },
  {
    text: '更多',
    items: [
      { text: '算法画像自评', link: '/quiz' },
      { text: '数字速查表', link: '/evidence/numbers' },
      { text: '算法书单', link: '/books/shelf' },
      { text: '听书怎么用', link: '/listen' },
      { text: '关于本站', link: '/about' },
      {
        text: '姊妹站：创业这件事 ↗',
        link: 'https://yuxinrun.github.io/start-a-business/',
        target: '_blank',
        rel: 'noopener'
      },
      {
        text: '姊妹站：养大一个人 ↗',
        link: 'https://yuxinrun.github.io/child-rearing/',
        target: '_blank',
        rel: 'noopener'
      },
      {
        text: '姊妹站：MCP Patterns ↗',
        link: 'https://yuxinrun.github.io/mcp-patterns/',
        target: '_blank',
        rel: 'noopener'
      }
    ]
  }
]

export default defineConfig({
  title: siteTitle,
  // 首页在 index.md 里用 titleTemplate: false 关掉模板，否则站名会出现两遍
  titleTemplate: `:title · ${siteTitle}`,
  description:
    '把生活里的算法讲成人话：导航怎么找路、照片为什么能变小、风控凭什么说你可疑、扫地机怎么把地扫完。每个数字带出处和等级，全站可以听完。',
  base,
  lang: 'zh-CN',
  appearance: true,
  lastUpdated: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#f6f4ee', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#06100e', media: '(prefers-color-scheme: dark)' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
  ],
  markdown: {
    theme: { light: 'github-dark', dark: 'github-dark' },
    lineNumbers: false,
    image: { lazyLoading: true }
  },
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
    siteTitle,
    nav,
    sidebar,
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一节（也是连播的上一节）', next: '下一节' },
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    footer: {
      // 注意：这里的内容会被塞进 <p class="message">，只能放行内元素，放 div 会引发全站 hydration mismatch
      message: `<span class="mp-footer-brand"><img src="${base}grid-fish.svg" alt="戴眼镜拿直尺在方格纸上画最短路径的青色小鱼" width="40" height="40" /><span>鱼心快跑，也算得清</span></span>`,
      copyright: '© 2026 鱼心快跑 · 算法这件事｜内容为算法与信息技术的科普介绍，不构成医疗、金融或法律建议'
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: '搜索手册', buttonAriaLabel: '搜索手册' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc'
            }
          }
        }
      }
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    langMenuLabel: '切换语言',
    notFound: {
      title: '这一页还没算出来',
      quote: '这条链接指向的页面不存在。回首页从"手机里的一天"开始，或者直接把这本手册听完。',
      linkText: '返回首页'
    }
  },
  transformHead({ pageData }) {
    const fallback = '算法这件事｜把生活里到处都在跑的那些算法讲成人话'
    const t = pageData.frontmatter.title
    const title = t ? `${t} · ${siteTitle}` : fallback
    const fmDesc = pageData.frontmatter.description
    const description =
      typeof fmDesc === 'string' && fmDesc
        ? fmDesc
        : '复杂度到底在说什么、导航怎么找路、照片为什么能变小、风控凭什么说你可疑、扫地机怎么把地扫完，以及那些听起来很科学的算法数字哪些经不起追问。全站支持自动连播，通勤路上正好听完两页。'
    return [
      ['meta', { name: 'author', content: '鱼心快跑' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    ]
  }
})
