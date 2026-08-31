#!/usr/bin/env node
// strip-md.mjs — 发布稿纯文本化（猫灯2026-08-30定：md 文件名，内容不用 md 格式标记）
// 用法：node 校验脚本/strip-md.mjs [--check] [目标目录]
// 默认目标：发布/（递归，排除 github备份/）；--check 只预览不写入；.txt 文件重命名为 .md

import { readFileSync, writeFileSync, renameSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const 脚本目录 = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const root = args.filter((a) => !a.startsWith('--'))[0] ?? join(脚本目录, '..', '发布')

const 排除目录 = new Set(['github备份'])

const 遍历 = (dir, 收集 = []) => {
  for (const name of readdirSync(dir)) {
    if (排除目录.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) 遍历(p, 收集)
    else if (/\.(md|txt)$/.test(name)) 收集.push(p)
  }
  return 收集
}

const 统计 = { 标题符: 0, 引用符: 0, 分隔线: 0, 表格行: 0, 加粗: 0, 行内代码: 0, 链接: 0 }

const strip = (text) => {
  const out = []
  for (const raw of text.split('\n')) {
    if (/^\s*\|[\s\-:|]+\|\s*$/.test(raw)) { 统计.表格行++; continue }      // 表格分隔行
    if (/^\s*\|.*\|\s*$/.test(raw)) {                                        // 表格内容行转制表符
      统计.表格行++
      const 格 = raw.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      out.push(格.join('\t'))
      continue
    }
    let l = raw.replace(/^#{1,6}\s+/, (m) => (统计.标题符++, ''))            // 标题符
    l = l.replace(/^>\s?/, (m) => (统计.引用符++, ''))                       // 引用符
    if (/^\s*(---+|\*{3,}|_{3,})\s*$/.test(l)) { 统计.分隔线++; out.push(''); continue }  // 分隔线
    l = l.replace(/\*\*([^*\n]+)\*\*/g, (m, s) => (统计.加粗++, s))          // 加粗
    l = l.replace(/`([^`\n]+)`/g, (m, s) => (统计.行内代码++, s))            // 行内代码
    l = l.replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, (m, s) => (统计.链接++, s))  // 链接
    out.push(l)
  }
  return out.join('\n')
}

const 文件 = 遍历(root)
for (const f of 文件) {
  统计.标题符 = 统计.引用符 = 统计.分隔线 = 统计.表格行 = 统计.加粗 = 统计.行内代码 = 统计.链接 = 0
  const 原名 = relative(root, f)
  const 新名 = f.endsWith('.txt') ? f.replace(/\.txt$/, '.md') : f
  const 正文 = strip(readFileSync(f, 'utf8'))
  const 动作 = f !== 新名 ? `重命名 .txt→.md` : '原地改写'
  const 详情 = [统计.标题符, 统计.引用符, 统计.分隔线, 统计.表格行, 统计.加粗, 统计.行内代码, 统计.链接]
    .map((n, i) => n ? ['标题符', '引用符', '分隔线', '表格行', '加粗', '行内代码', '链接'][i] + n : null)
    .filter(Boolean).join('、') || '无 md 标记'
  console.log(`${checkOnly ? '[预览] ' : ''}${原名} → ${动作}（${详情}）`)
  if (!checkOnly) {
    if (f !== 新名) renameSync(f, 新名)
    writeFileSync(新名, 正文, 'utf8')
  }
}
console.log(`\n共 ${文件.length} 个文件${checkOnly ? '（预览模式，未写入）' : '，已处理完毕'}，排除目录：github备份/`)
