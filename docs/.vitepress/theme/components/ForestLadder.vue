<script setup lang="ts">
// 从一棵树到一片森林：四格对照——单棵树怎么问、森林怎么"投票"（bagging）、提升怎么"补课"（boosting）、
// 以及 SVM 这条完全不同的路线站在哪一格。
// 四格都是机制示意图：形状表达流程，不表达任何精度、耗时或误差数值。
// 卡表里的年份、卷期页码来自事实底稿（P-29 / P-30 / P-31 / P-59 / P-116 / I-46）；站内不给算法排先进落后。

const round1 = (v: number) => Math.round(v * 10) / 10

const W = 460
const H = 300
const COL_L = 8
const COL_R = 236
const COL_W = 216

// —— ① 一棵树 ——
const ROOT_X = round1(COL_L + COL_W / 2)
const ROOT = { x: ROOT_X - 33, y: 36, w: 66, h: 18 }
const KIDS = [COL_L + 22, COL_L + 142].map((x) => ({ x, y: 76, w: 56, h: 18 }))
const LEAVES = [COL_L + 26, COL_L + 74, COL_L + 146, COL_L + 194].map((x) => ({ x, y: 122 }))
const TREE_EDGES = [
  [ROOT_X, ROOT.y + ROOT.h, KIDS[0].x + KIDS[0].w / 2, KIDS[0].y],
  [ROOT_X, ROOT.y + ROOT.h, KIDS[1].x + KIDS[1].w / 2, KIDS[1].y],
  [KIDS[0].x + KIDS[0].w / 2, KIDS[0].y + KIDS[0].h, LEAVES[0].x, LEAVES[0].y - 6],
  [KIDS[0].x + KIDS[0].w / 2, KIDS[0].y + KIDS[0].h, LEAVES[1].x, LEAVES[1].y - 6],
  [KIDS[1].x + KIDS[1].w / 2, KIDS[1].y + KIDS[1].h, LEAVES[2].x, LEAVES[2].y - 6],
  [KIDS[1].x + KIDS[1].w / 2, KIDS[1].y + KIDS[1].h, LEAVES[3].x, LEAVES[3].y - 6]
]

// —— ② 森林（bagging）——：五棵树都要落在右侧这一格里，箭头顶进「投票」框
const TREES = [40, 72, 104, 136, 168].map((dx) => COL_R + dx)
const TREE_APEX = 56
const TREE_BASE = 88
const VOTE = { x: COL_R + 30, y: 112, w: 160, h: 18 }

// —— ③ 提升（boosting）——
const BST_Y = 188
const BST = [COL_L + 14, COL_L + 90, COL_L + 166].map((x) => ({ x, y: BST_Y, w: 44, h: 18 }))
const SUM = { x: COL_L + 14, y: 220, w: 196, h: 18 }

// —— ④ SVM：把"缝最宽"那条线找出来 ——
const SVM_X0 = COL_R + 14
const SVM_X1 = COL_R + 204
const LINE_MID = 232
const LINE_UP = 210
const LINE_DN = 250
const PTS_UP = [COL_R + 40, COL_R + 76, COL_R + 118, COL_R + 160].map((x) => ({ x, y: 194 }))
const PTS_DN = [COL_R + 52, COL_R + 94, COL_R + 138, COL_R + 182].map((x) => ({ x, y: 266 }))
const SV = [
  { x: COL_R + 100, y: LINE_UP },
  { x: COL_R + 60, y: LINE_DN },
  { x: COL_R + 150, y: LINE_DN }
]

// —— 三条路线的出处卡（年份与卷期页码逐条对回事实底稿）——
const CARDS = [
  {
    id: 'svm',
    name: 'SVM 支持向量机',
    src: 'Cortes & Vapnik，「Support-Vector Networks」，Machine Learning 20: 273–297，1995 年',
    mech: '找"两条边距离最大"的那条分界线；数据拧成一条线分不开时，用核函数把它搬到高维再分。',
    keep: '「SVM 已被深度学习取代」不准确：小样本、高维、要能解释的场合里它仍是常被拿来对照的基线。站内不把算法排先进落后。'
  },
  {
    id: 'rf',
    name: '随机森林（bagging 这一路）',
    src: 'Breiman 2001，Machine Learning 45: 5–32',
    mech: '很多棵树，每棵各自在"自助抽样的样本＋随机挑的特征子集"上长满，最后投票；靠的是平均降方差。',
    keep: '方差＝换个数据集结果就晃。随机森林治的是这个晃，它不专门治"系统性答错"。'
  },
  {
    id: 'xgb',
    name: 'XGBoost（boosting 这一路）',
    src: 'Chen & Guestrin，「XGBoost: A Scalable Tree Boosting System」，KDD 2016（arXiv:1603.02754）',
    mech: '一棵接一棵，每棵都去拟合前面那些没修好的残差，逐步降偏差；论文自述在十亿级样本上用更少资源实现可扩展训练。',
    keep: '摘要没有给出统一的加速倍数（不同数据集差异极大）；「Kaggle 夺冠神器」是社区口碑，不是论文结论。'
  }
]

const MYTHS = [
  { id: 'm1', wrong: '「随机森林比 XGBoost 先进」', right: '这是把两条不同路线排了名次。一条靠平均降方差，一条靠接力降偏差，优劣取决于数据、特征与调参。' },
  { id: 'm2', wrong: '「深度学习比 SVM 新，所以该用它」', right: '小样本、高维、需要能解释的场景里 SVM 仍是基线；"新"不等于"在这份数据上更好"。' },
  { id: 'm3', wrong: '「比过了就是普适最优」', right: '可引的比较研究（Grinsztajn 等，NeurIPS 2022 的 MLP）是在同一批表格数据集上比出来的：没有单一方法普遍最优。' }
]
</script>

<template>
  <div class="ca-forest-ladder ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Trees, Forests, Boosting · 一棵树到一片森林</span>
      <p class="ca-widget-sub">同样是树：一棵怎么问、一片怎么投票、一串怎么补课，SVM 又站在哪一格。</p>
    </div>

    <figure class="ca-forest-ladder-fig">
      <svg
        class="ca-forest-ladder-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <text class="ca-forest-ladder-tag" :x="W - 12" :y="14">机制示意·不含数值</text>

        <g class="ca-forest-ladder-tree">
          <rect class="is-panel" :x="COL_L" y="30" :width="COL_W" height="126" rx="8" />
          <text class="ca-forest-ladder-ptitle" :x="COL_L + 4" y="24">① 就一棵树</text>
          <rect class="is-node" :x="ROOT.x" :y="ROOT.y" :width="ROOT.w" :height="ROOT.h" rx="6" />
          <text class="ca-forest-ladder-in" :x="ROOT_X" :y="ROOT.y + 13">切哪个特征</text>
          <g v-for="(k, ki) in KIDS" :key="`k-${ki}`">
            <rect class="is-node" :x="k.x" :y="k.y" :width="k.w" :height="k.h" rx="6" />
            <text class="ca-forest-ladder-in" :x="k.x + k.w / 2" :y="k.y + 13">再问一次</text>
          </g>
          <line v-for="(e, ei) in TREE_EDGES" :key="`e-${ei}`" class="is-edge" :x1="e[0]" :y1="e[1]" :x2="e[2]" :y2="e[3]" />
          <circle v-for="(l, li) in LEAVES" :key="`l-${li}`" class="is-leaf" :cx="l.x" :cy="l.y" r="5" />
          <text class="ca-forest-ladder-cap2" :x="ROOT_X" y="146">走到叶子才给答案</text>
        </g>

        <g class="ca-forest-ladder-bag">
          <rect class="is-panel" :x="COL_R" y="30" :width="COL_W" height="126" rx="8" />
          <text class="ca-forest-ladder-ptitle" :x="COL_R + 4" y="24">② 一片森林·bagging</text>
          <g v-for="(t, ti) in TREES" :key="`t-${ti}`">
            <path class="is-tree" :d="`M${t - 11} ${TREE_BASE} L${t} ${TREE_APEX} L${t + 11} ${TREE_BASE} Z`" />
            <line class="is-trunk" :x1="t" :y1="TREE_BASE" :x2="t" :y2="round1(TREE_BASE + 7)" />
            <line class="is-arrow" :x1="t" :y1="round1(TREE_BASE + 9)" :x2="t" :y2="VOTE.y" />
          </g>
          <rect class="is-box" :x="VOTE.x" :y="VOTE.y" :width="VOTE.w" :height="VOTE.h" rx="6" />
          <text class="ca-forest-ladder-in" :x="VOTE.x + VOTE.w / 2" :y="VOTE.y + 13">投票 · 取平均</text>
          <text class="ca-forest-ladder-cap2" :x="COL_R + COL_W / 2" y="146">每棵换一批样本、换一撮特征</text>
        </g>

        <g class="ca-forest-ladder-boost">
          <rect class="is-panel" :x="COL_L" y="174" :width="COL_W" height="118" rx="8" />
          <text class="ca-forest-ladder-ptitle" :x="COL_L + 4" y="168">③ 一串树·boosting</text>
          <g v-for="(b, bi) in BST" :key="`b-${bi}`">
            <rect class="is-node" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="6" />
            <text class="ca-forest-ladder-in" :x="b.x + b.w / 2" :y="b.y + 13">第 {{ bi + 1 }} 棵</text>
          </g>
          <line class="is-arrow" :x1="BST[0].x + BST[0].w" :y1="BST[0].y + 9" :x2="BST[1].x" :y2="BST[1].y + 9" />
          <line class="is-arrow" :x1="BST[1].x + BST[1].w" :y1="BST[1].y + 9" :x2="BST[2].x" :y2="BST[2].y + 9" />
          <text class="ca-forest-ladder-mini" :x="BST[0].x + BST[0].w + 10" :y="BST[0].y + 5">残差</text>
          <text class="ca-forest-ladder-mini" :x="BST[1].x + BST[1].w + 10" :y="BST[1].y + 5">残差</text>
          <rect class="is-box" :x="SUM.x" :y="SUM.y" :width="SUM.w" :height="SUM.h" rx="6" />
          <text class="ca-forest-ladder-in" :x="SUM.x + SUM.w / 2" :y="SUM.y + 13">三棵一起才算一个模型</text>
          <text class="ca-forest-ladder-cap2" :x="ROOT_X" y="262">后一棵专修前一棵答错的</text>
        </g>

        <g class="ca-forest-ladder-svm">
          <rect class="is-panel" :x="COL_R" y="174" :width="COL_W" height="118" rx="8" />
          <text class="ca-forest-ladder-ptitle" :x="COL_R + 4" y="168">④ SVM·另一种活法</text>
          <line class="is-margin" :x1="SVM_X0" :y1="LINE_UP" :x2="SVM_X1" :y2="LINE_UP" />
          <line class="is-margin" :x1="SVM_X0" :y1="LINE_DN" :x2="SVM_X1" :y2="LINE_DN" />
          <line class="is-split" :x1="SVM_X0" :y1="LINE_MID" :x2="SVM_X1" :y2="LINE_MID" />
          <circle v-for="(p, pi) in PTS_UP" :key="`pu-${pi}`" class="is-up" :cx="p.x" :cy="p.y" r="4" />
          <circle v-for="(p, pi) in PTS_DN" :key="`pd-${pi}`" class="is-dn" :cx="p.x" :cy="p.y" r="4" />
          <circle v-for="(s, si) in SV" :key="`sv-${si}`" class="is-sv" :cx="s.x" :cy="s.y" r="5" />
          <text class="ca-forest-ladder-mini is-svlab" :x="SV[0].x + 8" :y="SV[0].y + 3" text-anchor="start">支持向量</text>
          <text class="ca-forest-ladder-mini is-right" :x="SVM_X1" :y="196">要的就是这条缝</text>
          <text class="ca-forest-ladder-cap2 is-left" :x="COL_R + 14" y="284">分不开？换到高维再分</text>
        </g>
      </svg>

      <span class="sr-only">
        四格全是机制示意，没有任何精度、耗时或误差数字。
        第一格：一棵决策树就是一个问题接一个问题——先问切哪个特征，答完往左或往右，再问一次，走到叶子才给答案。
        第二格（bagging，随机森林这一路）：五棵树各长在各自己的样本上——每棵都自助重抽一批样本、再随机挑一撮特征，
        长满之后一起投票或取平均。它治的是"方差"，也就是换一份数据集结果就晃。出处是 Breiman 2001 年，
        Machine Learning 第 45 卷第 5 到 32 页。
        第三格（boosting，XGBoost 这一路）：树是接力的，第一棵答完，第二棵专门去补它没修好的残差，
        三棵加起来才是一个模型。它治的是"偏差"，也就是系统性地答错。出处是 Chen 与 Guestrin 的 KDD 2016 论文。
        第四格：SVM 根本不长树，它在两类点之间找那条把两边的缝撑到最宽的分界线，贴着缝站的那几个点叫支持向量；
        数据实在分不开就用核函数搬到高维再分。出处是 Cortes 与 Vapnik 的 1995 年论文，Machine Learning 第 20 卷
        第 273 到 297 页。
      </span>
    </figure>

    <div class="ca-forest-ladder-cards">
      <div v-for="c in CARDS" :key="c.id" class="ca-forest-ladder-card">
        <p class="ca-forest-ladder-cname">{{ c.name }}</p>
        <p class="ca-forest-ladder-csrc">{{ c.src }}</p>
        <p class="ca-forest-ladder-cmech">{{ c.mech }}</p>
        <p class="ca-forest-ladder-ckeep">{{ c.keep }}</p>
      </div>
    </div>

    <div class="ca-forest-ladder-vb">
      <p class="ca-forest-ladder-head">方差与偏差：两个词各治一种病</p>
      <div class="ca-forest-ladder-two">
        <div class="ca-forest-ladder-vcard is-blue">
          <span class="ca-forest-ladder-vtag">方差 · bagging 治这个</span>
          <p>换一批数据、换一个随机种子，答案就晃。多棵各自独立的树一起投票，把晃动平均掉。</p>
        </div>
        <div class="ca-forest-ladder-vcard is-accent">
          <span class="ca-forest-ladder-vtag">偏差 · boosting 治这个</span>
          <p>系统性地朝一个方向答错。让下一棵接着改，一层层把这份错扣掉。</p>
        </div>
      </div>
      <p class="ca-forest-ladder-both">
        所以这两条路线不是同一根轴上的高低两档：一个在压"晃"，一个在压"错"。拿随机森林和 XGBoost 争谁先进，
        就像拿体温计和血压计争哪个更准——它俩量的不是同一个东西。
      </p>
    </div>

    <div class="ca-forest-ladder-myths">
      <p class="ca-forest-ladder-head">三种常被说歪的话</p>
      <div v-for="m in MYTHS" :key="m.id" class="ca-forest-ladder-myth">
        <span class="ca-forest-ladder-wrong">{{ m.wrong }}</span>
        <span class="ca-forest-ladder-right">{{ m.right }}</span>
      </div>
    </div>

    <p class="ca-cap">
      三格讲三件事：<b>一棵树</b>只是把问题一层层问到底；<b>一片森林</b>（Breiman 2001）是让每棵各拿一批样本、
      各看一撮特征，再投票，把"换数据就晃"的<b>方差</b>平均掉；<b>一串树</b>（XGBoost，KDD 2016）是后一棵专修前一棵
      没答上的<b>残差</b>，把系统性答错的<b>偏差</b>一层层扣掉。第四格的 <b>SVM</b>（1995）根本不长树——它找的是
      把两类之间那条缝撑到最宽的分界线，贴缝那几个点就是支持向量。同一批表格数据上的比较研究
      （Grinsztajn 等，NeurIPS 2022）给的结论是<b>没有单一方法普遍最优</b>，所以这张图不排名，只讲各治哪种病。
    </p>
  </div>
</template>

<style scoped>
.ca-forest-ladder {
  max-width: 560px;
  margin-inline: auto;
}

.ca-forest-ladder-fig {
  margin: 0;
  min-width: 0;
}

.ca-forest-ladder-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-forest-ladder-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
  fill: var(--faint);
  text-anchor: end;
}

.ca-forest-ladder-ptitle {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--ink-2);
  text-anchor: start;
}

.ca-forest-ladder-mini {
  font-family: var(--font-mono);
  font-size: 7.5px;
  fill: var(--muted);
  text-anchor: middle;
}

.ca-forest-ladder-mini.is-svlab {
  fill: var(--accent);
  text-anchor: start;
}

.ca-forest-ladder-mini.is-right {
  text-anchor: end;
}

.ca-forest-ladder-cap2 {
  font-family: var(--font-sans);
  font-size: 8px;
  fill: var(--faint);
  text-anchor: middle;
}

.ca-forest-ladder-cap2.is-left {
  text-anchor: start;
}

.ca-forest-ladder .is-panel {
  fill: var(--panel-2);
  stroke: var(--line);
  stroke-width: 1;
}

.ca-forest-ladder .is-node {
  fill: var(--panel);
  stroke: var(--line-strong);
  stroke-width: 1.1;
}

.ca-forest-ladder .is-box {
  fill: var(--accent-soft);
  stroke: var(--accent);
  stroke-width: 1.3;
}

.ca-forest-ladder-in {
  font-family: var(--font-sans);
  font-size: 8.5px;
  fill: var(--ink-2);
  text-anchor: middle;
}

.ca-forest-ladder .is-edge,
.ca-forest-ladder .is-arrow {
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.ca-forest-ladder-boost .is-arrow {
  stroke: var(--accent);
}

.ca-forest-ladder .is-leaf {
  fill: var(--blue);
  opacity: 0.8;
}

.ca-forest-ladder .is-tree {
  fill: var(--blue);
  opacity: 0.28;
  stroke: var(--blue);
  stroke-width: 1.1;
}

.ca-forest-ladder .is-trunk {
  stroke: var(--blue);
  stroke-width: 1.4;
}

.ca-forest-ladder-bag .is-arrow {
  stroke: var(--accent);
  opacity: 0.7;
}

.ca-forest-ladder-boost .is-node {
  stroke: var(--accent);
}

.ca-forest-ladder-svm .is-split {
  stroke: var(--accent);
  stroke-width: 2;
}

.ca-forest-ladder-svm .is-margin {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  opacity: 0.7;
}

.ca-forest-ladder-svm .is-up {
  fill: var(--blue);
}

.ca-forest-ladder-svm .is-dn {
  fill: var(--ink-2);
  opacity: 0.55;
}

.ca-forest-ladder-svm .is-sv {
  /* 支持向量＝算法真正选中、决定分界线的那几个点 → 用 accent，不用 coral（coral 留给警告/代价/被否决）*/
  fill: var(--accent-soft);
  stroke: var(--accent);
  stroke-width: 2;
}

.ca-forest-ladder-tree,
.ca-forest-ladder-bag,
.ca-forest-ladder-boost,
.ca-forest-ladder-svm {
  animation: ca-forest-ladder-in 1s var(--ease) both;
}

.ca-forest-ladder-bag {
  animation-delay: 0.1s;
}

.ca-forest-ladder-boost {
  animation-delay: 0.2s;
}

.ca-forest-ladder-svm {
  animation-delay: 0.3s;
}

@keyframes ca-forest-ladder-in {
  from {
    opacity: 0;
  }
}

.ca-forest-ladder-cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-forest-ladder-card {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-forest-ladder-cname {
  margin: 0;
  font-size: 12px;
  font-weight: 680;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-csrc {
  margin: 4px 0 0;
  font-family: var(--font-mono);
  font-size: 9.5px;
  line-height: 1.6;
  color: var(--blue);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-cmech {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-ckeep {
  margin: 5px 0 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-vb,
.ca-forest-ladder-myths {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
  min-width: 0;
}

.ca-forest-ladder-head {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-two {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.ca-forest-ladder-vcard {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-2);
  min-width: 0;
}

.ca-forest-ladder-vcard.is-blue {
  border-color: var(--blue);
}

.ca-forest-ladder-vcard.is-accent {
  border-color: var(--accent);
}

.ca-forest-ladder-vtag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.ca-forest-ladder-vcard p {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-both {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-myth {
  display: grid;
  gap: 3px;
  padding: 9px 0;
  border-top: 1px solid var(--line);
  min-width: 0;
}

.ca-forest-ladder-wrong {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--coral);
  overflow-wrap: anywhere;
}

.ca-forest-ladder-right {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

@media (min-width: 620px) {
  .ca-forest-ladder-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-forest-ladder-tree,
  .ca-forest-ladder-bag,
  .ca-forest-ladder-boost,
  .ca-forest-ladder-svm {
    animation: none;
  }
}
</style>
