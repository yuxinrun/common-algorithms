<script setup lang="ts">
// 压缩、纠错、加密是三件不同的事——这张图只回答这一个问题。
// 三条道的长度都按"原文件＝100 单位"这把假设刻度画；长度比例里唯一有出处的是纠错那档（冗余码字占比约 30%，C-18），
// 压缩那条只是把"文本典型 2–3 倍"（I-86）摆成形状，随机数据压不动就没画成条形。
// 加密那条长度不变：AES 的分组是 128 位（I-16），它是换外观，不是变短也不是加冗余。

const W = 440 // 画布宽
const H = 172 // 画布高
const X0 = 118 // 三条道共同的起点
const BAR_H = 22 // 条形高度
const LANE_TOP = 26 // 第一条道的上边
const LANE_STEP = 46 // 道与道之间的间距
const TRACK_W = 150 // 轨道长度＝150 单位的刻度上限

const COMP_OUT = 40 // 压缩后：文本典型 2–3 倍，这里画的是"变短"这个形状（示意）
const ECC_OUT = 143 // 原内容 100 ＋ 冗余码字 43：冗余占比约 30% 时 100÷0.7≈143（按公式算）
const ENC_OUT = 100 // 加密后：长度基本不变（＝原文件那把尺子的 100 刻度）
const RULER_X = X0 + ENC_OUT

const laneY = (idx: number) => LANE_TOP + idx * LANE_STEP

const LANES = [
  {
    id: 'zip',
    name: '压缩',
    sub: '减冗余',
    tone: 'pick',
    w: COMP_OUT,
    text: '×2–3',
    note: '压掉的是重复与可预测的部分'
  },
  {
    id: 'ecc',
    name: '纠错',
    sub: '加冗余',
    tone: 'cost',
    w: ECC_OUT,
    text: '冗余约 30%',
    note: '故意多写一些，坏了才能反推回来'
  },
  {
    id: 'enc',
    name: '加密',
    sub: '换外观',
    tone: 'ref',
    w: ENC_OUT,
    text: '长度不变',
    note: '数据一个比特没少，只是别人读不懂'
  }
]

// 加密那条道里画的小方块：只是"分成 128 位一组"的视觉说法，数量与尺寸都是示意
const BLOCKS = Array.from({ length: 8 }, (_, i) => +(X0 + 6 + i * 12).toFixed(1))

// —— 二维码四档（C-18：ISO/IEC 18004，冗余比例约 7%/15%/25%/30%）——
const QR_MAX = 30
const QR = [
  { id: 'l', name: 'L', val: 7, text: '约 7%', tone: 'pick', note: '省下的格子最多，也最怕脏' },
  { id: 'm', name: 'M', val: 15, text: '约 15%', tone: 'pick', note: '常见默认档' },
  { id: 'q', name: 'Q', val: 25, text: '约 25%', tone: 'cost', note: '工业环境常选' },
  { id: 'h', name: 'H', val: 30, text: '约 30%', tone: 'cost', note: '冗余最多，能存的内容最少' }
]
const qrPct = (v: number) => `${Math.max(4, Math.round((v / QR_MAX) * 100))}%`
</script>

<template>
  <div class="ca-code-garden ca-widget" data-listen="skip">
    <div class="ca-widget-head">
      <span class="ca-widget-title">Three Different Jobs · 压缩、纠错、加密是三件事</span>
      <p class="ca-widget-sub">
        三个词常被混成"给数据加个处理"，但它们在干的活方向正好相反：一个变短、一个变长、一个长度根本不动。
      </p>
    </div>

    <figure class="ca-cg-fig">
      <svg class="ca-cg-svg" :viewBox="`0 0 ${W} ${H}`" role="presentation" aria-hidden="true" focusable="false">
        <g v-for="(l, idx) in LANES" :key="l.id" :class="`ca-cg-lane is-${l.tone}`">
          <text class="ca-cg-name" :x="12" :y="laneY(idx) + 15" text-anchor="start">{{ l.name }}</text>
          <text class="ca-cg-sub" :x="46" :y="laneY(idx) + 15" text-anchor="start">{{ l.sub }}</text>
          <rect class="ca-cg-track" :x="X0" :y="laneY(idx)" :width="TRACK_W" :height="BAR_H" />
          <rect class="ca-cg-body" :x="X0" :y="laneY(idx)" :width="l.w" :height="BAR_H" />
          <rect
            v-if="l.id === 'ecc'"
            class="ca-cg-extra"
            :x="RULER_X"
            :y="laneY(idx)"
            :width="ECC_OUT - ENC_OUT"
            :height="BAR_H"
          />
          <g v-if="l.id === 'enc'">
            <rect
              v-for="(bx, bi) in BLOCKS"
              :key="bi"
              class="ca-cg-block"
              :x="bx"
              :y="laneY(idx) + 5"
              :width="9"
              :height="BAR_H - 10"
            />
          </g>
          <text class="ca-cg-val" :x="X0 + l.w + 8" :y="laneY(idx) + 15" text-anchor="start">{{ l.text }}</text>
        </g>

        <line class="ca-cg-ruler" :x1="RULER_X" :y1="16" :x2="RULER_X" :y2="144" />
        <text class="ca-cg-cap" :x="RULER_X" :y="157" text-anchor="middle">原文件到这里</text>
      </svg>

      <p class="ca-cg-legend">
        <b>压缩</b>把条画短，<b>纠错</b>把条画长——多出来那截珊瑚色是故意加的冗余码字；<b>加密</b>长度不动，
        只是把里面切成一块一块、外人读不懂的样子。蓝色虚线是"原文件到这里"那把尺子。<br />
        <b>这三条道是按假设刻度画的示意</b>，只表达"变短／变长／不变"这三种方向：100 单位是原文件，
        压缩后画成 40 单位、纠错后画成 143 单位，都是形状，不是任何一次实测。
        唯一能落到标准文本上的，是纠错那截的来历——二维码等级 H 的冗余码字占比约 30%（C-18），
        压缩那条对应"文本典型 2–3 倍"（I-86），而<b>随机数据是 1 倍、压不动</b>，所以它不该被画短。
      </p>

      <span class="sr-only">
        三条道用的是同一把假设刻度：原文件等于 100 单位。压缩后画成 40 单位，对应"文本典型压缩 2 到 3 倍"这个经验区间，
        是形状示意；随机数据是 1 倍、压不动，所以这条道不该画短。纠错后画成 143 单位，多出来的 43 单位是冗余码字，
        按"冗余占比约 30%"算出 100 除以 0.7 约等于 143。加密后长度不变，因为 AES 的分组是 128 位，
        它既不删信息也不为抗损坏加冗余。二维码的四个纠错等级 L、M、Q、H 的冗余比例约是 7%、15%、25%、30%，
        同一版本同一掩膜下等级越高、能存的内容越少；"坏三成也能扫"这个说法的前提是最高等级 H，
        而且它说的是码字冗余比例，不是画面坏了多少都能读出来——能不能救回来还取决于污损是散开还是集中在一个码字块里。
        容量表的极端档：版本 40 且等级 L 时，数字型最多 7,089 个字符、字母数字型 4,296、8 位字节 2,953、
        汉字型 1,817；换成等级 H 容量近乎腰斩。"一个二维码能存 3 个 G"是错误的流传说法。
        校验码与签名也不是一回事：CRC 和普通哈希能发现"不小心损坏"，防不住"有人故意改"；
        抗伪造要用密码学哈希与签名，MD5 的碰撞在 2004 年后已被实用化构造，所以"算个哈希当签名"不再安全。
        加密这边可核的时间线是：1997 年公开征集、2000 年选定 Rijndael、2001 年 11 月 26 日 FIPS PUB 197 发布，
        AES 分组 128 位、密钥允许 128、192、256 位三种；评选历时约 5 年、初选 15 个候选算法。
        算术上 AES-128 的密钥空间是 2 的 128 次方，约 3.4 乘 10 的 38 次方，穷举平均试一半约 1.7 乘 10 的 38 次方；
        如果假设每秒试 10 的 9 次方个密钥，约需 5.4 乘 10 的 21 次方年——这个年数完全依赖"假设算力"，换假设就变。
        Grover 量子搜索会把 AES-128 的安全强度砍到 2 的 64 次方，所以 NIST 推荐用 AES-256 抗量子。
        至于分解 RSA-2048 的量子资源估算，论文标题给的是约 2000 万个含噪量子比特、1 微秒纠错周期、约 8 小时，
        三个数必须同框印，且这套要求远超现有设备；后量子标准从 2024 年起分批发布，迁移以年为单位。
      </span>
    </figure>

    <div class="ca-cg-qr">
      <p class="ca-cg-blockhead">
        二维码的四档纠错：多写的那些字节去哪了<span class="ca-cg-hint">A 级：C-18，限定语一起印</span>
      </p>
      <ul class="ca-cg-rows">
        <li v-for="q in QR" :key="q.id" class="ca-cg-row">
          <span class="ca-cg-rname">等级 {{ q.name }}</span>
          <span class="ca-cg-rtrack">
            <span class="ca-cg-rfill" :class="`is-${q.tone}`" :style="{ width: qrPct(q.val) }"></span>
          </span>
          <span class="ca-cg-rval">{{ q.text }}</span>
          <span class="ca-cg-rnote">{{ q.note }}</span>
        </li>
      </ul>
      <p class="ca-cg-note">
        这四个数是<b>纠错码字的冗余比例</b>，不是"画面坏了这么多也能扫"。事实库把话钉死了：能不能救回来还取决于污损
        是散开还是<b>集中在同一个码字块</b>里，两种情况差别很大（C-18／I-139／P-99）。而且"坏三成也能扫"的前提是
        <b>最高等级 H</b>，等级不同差别很大，不许写成"所有二维码都能抗 30%"。
      </p>
      <p class="ca-cg-note">
        顺带辟一条谣：容量表的最极端一档是<b>版本 40 且等级 L</b>——数字型最多 <b>7,089</b> 个字符、字母数字型
        <b>4,296</b>、8 位字节 <b>2,953</b>、汉字型 <b>1,817</b>；换成 H 等级容量近乎腰斩。
        ISO/IEC 18004 一共定义 40 个版本、从 21×21 到 177×177 个模块。"一个二维码能存 3 个 G"是彻底的错误说法（C-19）。
      </p>
    </div>

    <div class="ca-cg-zip">
      <p class="ca-cg-blockhead">压缩：能压多少，取决于原数据有多"可猜"</p>
      <ul class="ca-cg-facttxt">
        <li>
          <b>无损（熵编码）</b>：Huffman 1952 年论文（IRE Proc. 40:1099–1101）按符号频率给变长码，平均码长
          <b>不超过熵 + 1 比特</b>；但它压多少不取决于算法而取决于信源冗余——文本典型 <b>2–3 倍</b>，
          随机数据 <b>1 倍</b>（压不动）。站内不印"ZIP 平均压 5 倍""JPEG 固定压 20 倍"这类脱离数据的倍数（I-86）。
        </li>
        <li>
          <b>有损（先扔再压）</b>：JPEG 在量化那一步就把人眼不敏感的高频系数取整归零，信息不可逆地丢了，
          反复另存会越存越糊；MP3 相对 CD 的约 11 倍也是同一类。有损的倍数不能和无损的倍数放进同一张柱状图比
          （P-15／C-55／I-87）。
        </li>
      </ul>
    </div>

    <div class="ca-cg-enc">
      <p class="ca-cg-blockhead">加密：长度不动，那它到底买了什么</p>
      <ul class="ca-cg-facttxt">
        <li>
          <b>标准本身</b>：AES 是 FIPS PUB 197，2001 年 11 月 26 日发布，采用 Rijndael（Daemen 与 Rijmen），
          分组 128 位、密钥允许 128／192／256 位三种；时间线要分三层——1997 年征集、2000 年选定、2001 年发布，
          "1997 年 AES 发布"是错的（I-16／I-142）。
        </li>
        <li>
          <b>穷举的算法</b>：AES-128 密钥空间 2¹²⁸ ≈ 3.4×10³⁸，平均试一半约 1.7×10³⁸；
          <b>如果假设</b>每秒试 10⁹ 个密钥，约需 5.4×10²¹ 年。这个年数完全依赖那句"假设"，换个假设数字就变（I-71）。
        </li>
        <li>
          <b>量子那半边</b>：Grover 把 AES-128 的安全强度砍到 2⁶⁴，所以 NIST 推荐 AES-256 抗量子；
          但站内不预告"哪天所有密码一夜之间失效"——迁移计划以「年」为单位，NIST 的后量子标准从 2024 年起分批发布。
          可核的资源估算是 Gidney &amp; Ekerå 2021：约 2000 万个含噪量子比特、1 微秒纠错周期、约 8 小时分解 RSA-2048
          ——<b>三个数必须同框</b>，且这套要求远超现有设备（I-69／I-143／P-86）。
        </li>
        <li>
          <b>校验不等于签名</b>：CRC 和普通哈希能发现"不小心损坏"，防不住"有人故意改"；抗伪造得用密码学哈希与签名。
          MD5 的碰撞 2004 年后已被实用化构造，"算个哈希当签名"不再安全；SHA-1 在 2017 年被公布碰撞攻击，
          但<b>碰撞≠第二原像≠原像</b>，"SHA-1 被彻底攻破"这句也不准确（P-122／I-129）。
        </li>
      </ul>
      <p class="ca-cg-note">
        RSA 那条也要带限定：公开发表的论文是 1977 年（CACM 20(9): 344–348），而 Cocks 在 1973 年已在英国情报机构
        内部提出等价方案、1997 年才公开——"三人发明公钥密码"得加"公开发表"四个字（I-15）。
        站内讲这些只到"看懂它防的是什么"为止：<b>不给任何伪造、碰撞构造或绕过的操作步骤</b>。
      </p>
    </div>

    <p class="ca-cap">
      上面三条道是<b>按假设刻度画的示意</b>，能带走的只有方向：压缩让它<b>变短</b>（文本典型 2–3 倍，随机数据 1 倍
      压不动）、纠错让它<b>变长</b>（二维码等级 H 的冗余码字约 <b>30%</b>，L／M／Q 约 7%／15%／25%，
      同一版本同一掩膜下等级越高、能存的内容越少）、加密让它<b>长度不变</b>（AES 分组 128 位、密钥 128／192／256 位）。
      把三件事混成一个词，就会得出"压缩过的数据更安全""能扫出来就说明没被改过"这类错话——
      CRC 与普通哈希只防"不小心坏了"，防"有人故意改"要用密码学哈希与签名。
    </p>
  </div>
</template>

<style scoped>
.ca-code-garden {
  max-width: 640px;
  margin-inline: auto;
}

.ca-cg-fig {
  margin: 0;
  min-width: 0;
}

.ca-cg-svg {
  display: block;
  width: 100%;
  height: auto;
}

.ca-cg-ruler {
  stroke: var(--blue);
  stroke-width: 1.2;
  stroke-dasharray: 3 3;
  opacity: 0.9;
}

.ca-cg-cap {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--faint);
}

.ca-cg-name {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 680;
  fill: var(--ink-2);
}

.ca-cg-sub {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--muted);
}

.ca-cg-track {
  fill: var(--panel-3);
}

.ca-cg-body {
  fill: var(--accent);
  opacity: 0.85;
  animation: ca-cg-grow 0.9s var(--ease) both;
  transform-origin: left;
}

.ca-cg-extra {
  fill: var(--coral);
  opacity: 0.9;
  animation: ca-cg-grow 1.1s var(--ease) both;
  transform-origin: left;
}

.ca-cg-block {
  fill: var(--panel);
  stroke: var(--accent);
  stroke-width: 1;
}

.ca-cg-val {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--ink-2);
}

@keyframes ca-cg-grow {
  from {
    transform: scaleX(0);
  }
}

.ca-cg-legend {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cg-legend b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-cg-qr,
.ca-cg-zip,
.ca-cg-enc {
  min-width: 0;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
}

.ca-cg-blockhead {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.ca-cg-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.ca-cg-rows {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ca-cg-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 64px;
  align-items: center;
  gap: 3px 8px;
  min-width: 0;
}

.ca-cg-rname,
.ca-cg-rval {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  min-width: 0;
}

.ca-cg-rval {
  text-align: right;
  overflow-wrap: anywhere;
}

.ca-cg-rnote {
  grid-column: 1 / -1;
  font-size: 10.5px;
  color: var(--faint);
  min-width: 0;
  overflow-wrap: anywhere;
}

.ca-cg-rtrack {
  min-width: 0;
  height: 5px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.ca-cg-rfill {
  display: block;
  min-width: 0;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ca-cg-grow 0.9s var(--ease) both;
}

.ca-cg-rfill.is-pick {
  background: var(--accent);
}

.ca-cg-rfill.is-cost {
  background: var(--coral);
}

.ca-cg-note {
  margin: 11px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cg-note b {
  color: var(--ink-2);
  font-weight: 680;
}

.ca-cg-facttxt {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.ca-cg-facttxt b {
  color: var(--ink-2);
  font-weight: 680;
}

@media (max-width: 620px) {
  .ca-cg-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 58px;
  }

  .ca-cg-rname {
    font-size: 10.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ca-cg-body,
  .ca-cg-extra,
  .ca-cg-rfill {
    animation: none;
  }
}
</style>
