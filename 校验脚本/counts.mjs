#!/usr/bin/env node
// 计数脚本（2026-08-30 立，/init 修订配套；本机无 python 一律 node）
// 用法：
//   node 校验脚本/counts.mjs          默认：重生成 CLAUDE.md「计数区」（两个注释标记之间）
//   node 校验脚本/counts.mjs --check  核对：计数区与磁盘不符则 exit 1
// 计数区由本脚本生成勿手改；文件增删后重跑默认模式即可。
// 被 check.mjs 引用为第五检查（核对计数区）。
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLAUDE路径 = join(ROOT, 'CLAUDE.md')
const 开始标记 = '<!-- 计数区:start -->'
const 结束标记 = '<!-- 计数区:end -->'

// ── 取目录条目（[名字, 是否目录]） ──
const 取条目 = (p) => {
  const 全 = join(ROOT, p)
  if (!existsSync(全)) return []
  return readdirSync(全).map((n) => [n, statSync(join(全, n)).isDirectory()])
}
const 根 = (p) => 取条目(p)
const 镜像 = (p) => 取条目(join('发布', 'github备份', p))

const 文件数 = (条目, 扩展) => 条目.filter(([n, d]) => !d && n.endsWith(扩展)).length
const 正文篇 = (条目) => 条目.filter(([n, d]) => !d && n.endsWith('.md') && n !== 'CLAUDE.md')

// ── 规则表：标签 / 条目 / 计法函数（返回 [计数串, 规则备注]） ──
const 规则表 = [
  ['社会主义论成书', () => 根('社会主义论'),
    (e) => {
      const n = 文件数(e, '.md')
      return [`${n} 文件＝${n - 1} 章＋00号`, '社会主义论/*.md（00号不占章）']
    }],
  ['理论存档', () => 根('理论存档'),
    (e) => {
      const md = 文件数(e, '.md')
      const 其他 = e.filter(([n, d]) => !d && !n.endsWith('.md')).length
      return [`${md} 篇${其他 ? ` ${md + 其他} 文件` : ''}`, '理论存档/*（md 计篇，docx 等计其他）']
    }],
  ['理论备份', () => 根('理论备份'),
    (e) => [`${文件数(e, '.md')} 文件`, '理论备份/*.md']],
  ['工作日志', () => 根('工作日志'),
    (e) => [`${e.filter(([, d]) => !d).length} 件`, '工作日志/* 全部文件']],
  ['历史史论正文', () => 根('历史史论'),
    (e) => {
      const 正文 = 正文篇(e)
      const 总史论 = 正文.filter(([n]) => n.includes('总史论')).length
      return [`${正文.length} 篇（总史论 ${总史论}＋分论 ${正文.length - 总史论}）`, '历史史论/*.md 减配套CLAUDE.md']
    }],
  ['计划与方案', () => 根('计划与方案'),
    (e) => {
      const 顶层 = e.filter(([, d]) => !d).length
      const 研究 = 根(join('计划与方案', 'UBIApp经济影响研究')).filter(([, d]) => !d).length
      return [`${顶层} 文件＋UBIApp研究 ${研究} 件`, '顶层全部文件＋UBIApp经济影响研究/*']
    }],
  ['校验脚本', () => 根('校验脚本'),
    (e) => [`${e.filter(([, d]) => !d).length} 件`, '校验脚本/* 全部文件（含本脚本）']],
  ['镜像·社会主义论', () => 镜像('社会主义论'),
    (e) => {
      const n = 文件数(e, '.md')
      return [`${n} 文件＝${n - 1} 章＋00号`, '同社会主义论成书规则']
    }],
  ['镜像·理论存档', () => 镜像('理论存档'),
    (e) => {
      const md = 文件数(e, '.md')
      const 其他 = e.filter(([n, d]) => !d && !n.endsWith('.md')).length
      return [`${md} 篇${其他 ? ` ${md + 其他} 文件` : ''}`, '同理论存档规则']
    }],
  ['镜像·理论备份', () => 镜像('理论备份'),
    (e) => [`${文件数(e, '.md')} 文件`, '同理论备份规则']],
  ['镜像·历史史论', () => 镜像('历史史论'),
    (e) => {
      const 正文 = 正文篇(e)
      const 总史论 = 正文.filter(([n]) => n.includes('总史论')).length
      return [`${正文.length} 篇（总史论 ${总史论}＋分论 ${正文.length - 总史论}）`, '同历史史论规则']
    }],
  ['镜像·计划与方案', () => 镜像('计划与方案'),
    (e) => {
      const 顶层 = e.filter(([, d]) => !d).length
      const 研究 = 镜像(join('计划与方案', 'UBIApp经济影响研究')).filter(([, d]) => !d).length
      return [`${顶层} 文件＋UBIApp研究 ${研究} 件`, '同计划与方案规则']
    }],
  ['镜像·工作日志', () => 镜像('工作日志'),
    (e) => [`${e.filter(([, d]) => !d).length} 件`, '同工作日志规则（.gitignore 排除后）']],
]

// ── 生成计数区 ──
export function 生成计数区() {
  const 行 = ['| 目录 | 计数 | 规则 |', '|---|---|---|']
  for (const [标签, 取, 计] of 规则表) {
    const [计数, 备注] = 计(取())
    行.push(`| ${标签} | ${计数} | ${备注} |`)
  }
  const 生成 = [
    开始标记,
    '### 计数区（脚本生成，勿手改；文件增删后跑 node 校验脚本/counts.mjs 再生成）',
    ...行,
    '<!-- 上表数据以磁盘为准，与正文叙述如不一致以本表为实并修正叙述 -->',
    结束标记,
  ].join('\n')
  return 生成
}

// ── 核对计数区与磁盘 ──
export function 核对计数区() {
  const 原文 = readFileSync(CLAUDE路径, 'utf8')
  const 生成 = 生成计数区()
  const 开头 = 原文.indexOf(开始标记)
  const 结尾 = 原文.indexOf(结束标记)
  if (开头 === -1 && 结尾 === -1)
    return { 过: false, 详情: 'CLAUDE.md 无计数区标记（跑 node 校验脚本/counts.mjs 生成）' }
  if (开头 === -1 || 结尾 === -1)
    return { 过: false, 详情: '计数区标记残缺（start/end 只存其一）' }
  const 现有 = 原文.slice(开头, 结尾 + 结束标记.length)
  if (现有 === 生成)
    return { 过: true, 详情: '计数区与磁盘一致' }
  const 差异 = []
  const 现 = 现有.split('\n'), 应 = 生成.split('\n')
  const n = Math.max(现.length, 应.length)
  for (let i = 0; i < n; i++)
    if (现[i] !== 应[i])
      差异.push(`第${i + 1}行：现「${现[i] ?? '（无）'}」应「${应[i] ?? '（无）'}」`)
  return { 过: false, 详情: `计数区与磁盘不一致（${差异.length} 行）：${差异.slice(0, 3).join('；')}${差异.length > 3 ? '；…' : ''}` }
}

// ── 写入计数区（默认模式） ──
function 写计数区() {
  const 原文 = readFileSync(CLAUDE路径, 'utf8')
  const 生成 = 生成计数区()
  const 开头 = 原文.indexOf(开始标记)
  const 结尾 = 原文.indexOf(结束标记)
  let 新文
  if (开头 === -1 && 结尾 === -1) {
    // 无标记：插入到「## 成果现状」标题之前（该节不存在则追加文末）
    const 锚 = 原文.indexOf('## 成果现状')
    新文 = 锚 === -1 ? 原文 + '\n' + 生成 + '\n' : 原文.slice(0, 锚) + 生成 + '\n\n' + 原文.slice(锚)
  } else if (开头 !== -1 && 结尾 !== -1) {
    新文 = 原文.slice(0, 开头) + 生成 + 原文.slice(结尾 + 结束标记.length)
  } else {
    console.error('计数区标记残缺（start/end 只存其一），请手动修复后再跑')
    process.exit(1)
  }
  writeFileSync(CLAUDE路径, 新文, 'utf8')
}

// ── CLI 入口 ──
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv[2] === '--check') {
    const r = 核对计数区()
    console.log(`${r.过 ? '✓' : '✗'} 计数核对：${r.详情}`)
    process.exit(r.过 ? 0 : 1)
  }
  const 现 = 核对计数区()
  console.log(`现有状态：${现.过 ? '已一致' : 现.详情}`)
  写计数区()
  console.log('计数区已（重新）生成于 CLAUDE.md')
}
