import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import ListenBar from './components/ListenBar.vue'
import BrandMark from './components/BrandMark.vue'
import HeroLattice from './components/HeroLattice.vue'
import './style.css'

// components/ 里的 .vue 全部自动注册：markdown 直接写 <ComponentName /> 就能用，
// 新增图表组件不需要再来改这个文件。
const modules = import.meta.glob<{ default: unknown }>('./components/*.vue', { eager: true })

const GLOBAL_ONLY = new Set(['ListenBar', 'BrandMark', 'HeroLattice'])

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroLattice),
      'home-hero-info-before': () => h(BrandMark, { variant: 'pill' }),
      'layout-bottom': () => h(ListenBar)
    })
  },
  enhanceApp({ app }) {
    app.component('BrandMark', BrandMark)
    for (const [path, mod] of Object.entries(modules)) {
      const name = path.split('/').pop()!.replace(/\.vue$/, '')
      if (GLOBAL_ONLY.has(name)) continue
      const comp = (mod as { default?: unknown }).default
      if (comp) app.component(name, comp)
    }
  }
}
