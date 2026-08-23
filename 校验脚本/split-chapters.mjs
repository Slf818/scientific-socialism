// split-chapters.mjs — 理论本体拆解脚本
// 用法: node split-chapters.mjs <理论本体.md> <输出目录>
// 原则: 纯切分，内容零改动；理论本体仍是唯一修订底稿，修订后重跑本脚本再拆
// 输出: 00-摘要与目录.md / 第1章~第8章.md / 09-参考文献.md
// 验证: 按文件名顺序拼接各文件 == 原文件（字节一致）
import fs from 'fs';
import path from 'path';

const [src, outDir] = process.argv.slice(2);
const text = fs.readFileSync(src, 'utf8');
const lines = text.split('\n');

// 1. 正文起点: 目录区之后第二次出现「第1章 绪论」
let firstIdx = -1, startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '第1章 绪论') {
    if (firstIdx === -1) firstIdx = i; else { startIdx = i; break; }
  }
}
if (startIdx === -1) { console.error('未找到正文起点'); process.exit(1); }

// 2. 参考文献位置（正文起点之后）
let refIdx = -1;
for (let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '参考文献') { refIdx = i; break; }
}
if (refIdx === -1) { console.error('未找到参考文献'); process.exit(1); }

// 3. 切分章节（章标题行: 第X章 ...）
const bodyEnd = refIdx;
const cuts = [startIdx];
for (let i = startIdx + 1; i < bodyEnd; i++) {
  if (/^第[1-8]章 .+$/.test(lines[i].trim())) cuts.push(i);
}
cuts.push(bodyEnd);

const files = [];
// 前置
files.push(['00-摘要与目录.md', lines.slice(0, startIdx).join('\n')]);
// 各章
for (let c = 0; c < cuts.length - 1; c++) {
  const head = lines[cuts[c]].trim();
  const m = head.match(/^第([1-8])章 (.+)$/);
  const name = m ? `第${m[1]}章 ${m[2]}.md` : `第${c + 1}章.md`;
  files.push([name, lines.slice(cuts[c], cuts[c + 1]).join('\n')]);
}
// 参考文献
files.push(['09-参考文献.md', lines.slice(refIdx).join('\n')]);

fs.mkdirSync(outDir, { recursive: true });
for (const [name, content] of files) {
  fs.writeFileSync(path.join(outDir, name), content, 'utf8');
  console.log(`写入 ${name} (${content.length} 字符)`);
}

// 4. 验证: 拼接 == 原文
const joined = files.map(([, c]) => c).join('\n');
console.log(joined === text ? '验证通过: 拼接与原文件一致' : '验证失败: 字节不一致');
