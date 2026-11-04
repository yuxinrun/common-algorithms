export type ListenItem = { text: string; link: string }
export type ListenGroup = { group: string; items: ListenItem[] }

// 全站唯一的阅读顺序。config.mts 用它生成侧边栏，听书引擎用它生成连播队列。
// 新增页面必须同时出现在这里，否则连播会静默停在上一页。
export const ORDER: ListenGroup[] = [
  {
    group: '开始',
    items: [
      { text: '这本手册怎么用（先花 3 分钟认一认手机里的算法）', link: '/start' },
      { text: '把这本手册当成有声书', link: '/listen' },
      { text: '算法画像：你想搞明白的是哪一类', link: '/quiz' }
    ]
  },
  {
    group: '先搞懂这六件事',
    items: [
      { text: '算法不是玄学：一份能照着做完的菜谱', link: '/basics/what-is-algorithm' },
      { text: '这些算法是哪年冒出来的：一条时间轴', link: '/basics/history' },
      { text: '复杂度：为什么"快"要先问规模', link: '/basics/complexity' },
      { text: '聪明的算法不一定快，快的不一定聪明', link: '/basics/speed-vs-clever' },
      { text: '故意掷骰子：随机算法为什么靠得住', link: '/basics/randomness' },
      { text: '有些事就是算不出来：P、NP 与天花板', link: '/basics/limits' }
    ]
  },
  {
    group: '生活现场',
    items: [
      { text: '从闹钟到人脸解锁：手机里的一天', link: '/life/phone' },
      { text: '导航、外卖与快递：怎么找到那条不那么堵的路', link: '/life/road' },
      { text: '照片为什么能变小：压缩、美颜与夜景', link: '/life/picture' },
      { text: 'MP3、降噪与语音助手：声音是怎么被算出来的', link: '/life/sound' },
      { text: '扫码付款与风控：它凭什么说你可疑', link: '/life/money' },
      { text: '工厂与库存：什么时候备货、什么时候停机', link: '/life/factory' },
      { text: 'CT、心电图与血氧：医院里的算法', link: '/life/health' },
      { text: '游戏匹配与推荐流：为什么对手总跟你差不多', link: '/life/play' },
      { text: '扫地机、恒温器与洗衣机：家里会自己想的东西', link: '/life/home' }
    ]
  },
  {
    group: '算法族谱',
    items: [
      { text: '查找与排序：先找到，再排好', link: '/family/search' },
      { text: '图算法：路、网，以及谁认识谁', link: '/family/graph' },
      { text: '优化：在无数种可能里挑一个不那么差的', link: '/family/optimize' },
      { text: '动态规划与贪心：把大问题切成小问题', link: '/family/dp' },
      { text: '概率与模拟：算不清就用一万次试验', link: '/family/probability' },
      { text: '机器学习：从例子里学出来的规则', link: '/family/learn' },
      { text: '信号与频率：把波动拆开来看', link: '/family/signal' },
      { text: '编码与加密：压缩、纠错、以及只有你能解', link: '/family/crypto' },
      { text: '怎么知道它算对了：测试、计时与可复现', link: '/family/verify' }
    ]
  },
  {
    group: '身边的算法（国内）',
    items: [
      { text: '导航与打车在国内：ETA 与派单', link: '/cn/routing' },
      { text: '外卖与快递：三十分钟是怎么被算出来的', link: '/cn/delivery' },
      { text: '12306 与抢票：为什么你点不到别人能点到', link: '/cn/tickets' },
      { text: '推荐流：以及那个"关闭个性化推荐"的按钮', link: '/cn/recommend' },
      { text: '支付、刷脸与反诈：风控到底在防什么', link: '/cn/risk' },
      { text: '城市与工厂：信号灯、调度与质检', link: '/cn/city' },
      { text: '算法备案与你的权利：法律给了哪几把钥匙', link: '/cn/regulate' }
    ]
  },
  {
    group: '别被唬住',
    items: [
      { text: '20 个常见误解：这些说法经不起追问', link: '/myths/list' },
      { text: '那些听起来很科学的算法数字', link: '/myths/numbers' }
    ]
  },
  {
    group: '证据与出处',
    items: [
      { text: '数字速查表', link: '/evidence/numbers' },
      { text: '来源与分级', link: '/evidence/sources' },
      { text: '我们不写的说法（红线清单）', link: '/evidence/red-lines' }
    ]
  },
  {
    group: '书架',
    items: [
      { text: '算法书单：哪些值得读完，哪些当字典查', link: '/books/shelf' },
      { text: '阅读路线：从"看个热闹"到"能自己写"', link: '/books/roadmap' }
    ]
  },
  {
    group: '关于',
    items: [{ text: '关于本站', link: '/about' }]
  }
]

export const FLAT: ListenItem[] = ORDER.flatMap((g) => g.items)

export const groupOf = (link: string): string | undefined =>
  ORDER.find((g) => g.items.some((i) => normalize(i.link) === normalize(link)))?.group

export const indexOfLink = (link: string): number =>
  FLAT.findIndex((i) => normalize(link) === normalize(i.link))

export function normalize(link: string): string {
  if (!link) return ''
  let l = link.split('#')[0].split('?')[0]
  l = l.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\.md$/, '')
  if (!l.startsWith('/')) l = `/${l}`
  l = l.replace(/\/$/, '')
  return l === '' ? '/' : l
}
