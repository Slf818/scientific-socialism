#!/usr/bin/env node
// 论文校验脚本（固化第四轮验证基线，2026-08-15）
// 用法：在论文目录下运行  node 校验脚本/check.mjs
// 四项检查：字数（摘要/正文/结论）、引用首次出现顺序 1→70、两稿字节一致、目录正文标题对照（40条）
// 全部通过 exit 0，任一失败 exit 1

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const 本体路径 = join(ROOT, '论雇佣劳动的废除与共产主义的制度起点.md')
const 论文稿路径 = join(ROOT, '论雇佣劳动的废除与共产主义的制度起点（论文稿）.md')

const 本体 = readFileSync(本体路径, 'utf8')
const 行 = 本体.split('\n')

// 结构定位（均为行内首次/末次出现）
const idxOf = (re, from = 0) => 行.findIndex((l, i) => i >= from && re.test(l))
const idxOfLast = (re) => 行.length - 1 - [...行].reverse().findIndex((l) => re.test(l))

const 摘要头 = idxOf(/^摘要$/)                    // 摘要标题（正文首行，早于目录中的同名条目）
const 关键词行 = idxOf(/^关键词：/, 摘要头)
const 目录头 = idxOf(/^目 录$/, 关键词行)
const 目录尾 = idxOf(/^（页码于Word排版时补）/, 目录头)
const 正文头 = idxOf(/^第1章 /, 目录尾)            // 正文第一行标题
const 第8章头 = idxOf(/^第8章 /, 正文头)
const 文献头 = idxOfLast(/^参考文献$/)             // 参考文献标题（末次出现，排除目录条目）
const 文末 = 行.length

const 区间 = (a, b) => 行.slice(a, b).join('\n')
const 汉字数 = (s) => (s.match(/[一-鿿]/g) || []).length

const 结果 = []
const 记 = (名, 过, 详情) => 结果.push({ 名, 过, 详情 })

// ── 检查一：字数（对照规范区间，并比对固化基线） ──
const 摘要字数 = 汉字数(区间(摘要头 + 1, 关键词行))
const 正文字数 = 汉字数(区间(正文头, 文献头))          // 第1章至第8章全含
const 结论字数 = 汉字数(区间(第8章头, 文献头))          // 第8章单独计

const 摘要基线 = 632, 正文基线 = 74211, 结论基线 = 1188
const 摘要过 = 摘要字数 >= 300 && 摘要字数 <= 650   // 猫灯2026-08-17授权：摘要可适当加字数（补智能体内容）
const 正文过 = 正文字数 >= 12000
const 结论过 = 结论字数 >= 400 && 结论字数 <= 1200   // 猫灯2026-08-17授权：结论字数无所谓（全球UBI内容补入）
const 基线差 = (实, 基) => (实 === 基 ? '与基线一致' : `与基线(${基})差${实 - 基}`)
记('字数', 摘要过 && 正文过 && 结论过,
  `摘要 ${摘要字数}（300-600）${基线差(摘要字数, 摘要基线)}；正文 ${正文字数}（≥12000）${基线差(正文字数, 正文基线)}；结论 ${结论字数}（400-1000）${基线差(结论字数, 结论基线)}`)

// ── 检查二：引用首次出现顺序 1→70 ──
const 正文 = 区间(正文头, 文献头)
const 引用序列 = []                       // 扁平化的所有引用编号（按出现顺序）
for (const m of 正文.matchAll(/\[(\d+(?:\s*[，,]\s*\d+)*)\]/g))
  引用序列.push(...m[1].split(/[，,]/).map((s) => Number(s.trim())))
const 首次序列 = [...new Set(引用序列)]    // 去重保留首次出现顺序
const 引用过 = 引用序列.length > 0
  && 首次序列.length === 70
  && 首次序列.every((n, i) => n === i + 1)
记('引用顺序', 引用过, `首次出现序列 ${首次序列.join(',') || '（空）'}`)

// ── 检查三：两稿字节一致（论文稿即理论本体的整份复制） ──
const 论文稿字节 = readFileSync(论文稿路径)
const 两稿一致 = Buffer.compare(Buffer.from(本体, 'utf8'), 论文稿字节) === 0
记('两稿同步', 两稿一致, `理论本体 ${Buffer.byteLength(本体, 'utf8')}B / 论文稿 ${论文稿字节.length}B`)

// ── 检查四：目录与正文标题对照（38条） ──
const 标题式 = /^(第\d+章 .+|\d+\.\d+ .+)$/
const 目录条目 = 行.slice(目录头 + 1, 目录尾)
  .map((l) => l.replace(/^[\s　]+/, '').trim())
  .filter((l) => 标题式.test(l))
const 正文标题 = 行.slice(正文头, 文献头)
  .map((l) => l.trim())
  .filter((l) => 标题式.test(l))
const 正文标题集 = new Set(正文标题)
const 缺失 = 目录条目.filter((t) => !正文标题集.has(t))
const 多出 = 正文标题.filter((t) => !目录条目.includes(t))
const 目录过 = 目录条目.length === 40 && 缺失.length === 0 && 多出.length === 0
记('目录对照', 目录过,
  `目录 ${目录条目.length} 条（基线40）；正文缺失 ${缺失.length}${缺失.length ? '：' + 缺失.join('、') : ''}；正文多出 ${多出.length}${多出.length ? '：' + 多出.join('、') : ''}`)

// ── 输出 ──
for (const { 名, 过, 详情 } of 结果)
  console.log(`${过 ? '✓' : '✗'} ${名}：${详情}`)
const 全过 = 结果.every((r) => r.过)
console.log(`\n总判定：${全过 ? '全部通过' : '存在失败项'}`)
process.exit(全过 ? 0 : 1)
