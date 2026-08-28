// 第二轮细分：否定句式三分＋顿号三连样本抽取＋破折号密度（每千字）
import fs from 'fs';
import path from 'path';
const dir = 'D:/文库/论文/社会主义论/社会主义论';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
const subs = {
  '不是A，而是B（AI味形态）': /不是[^，。；：\n]{1,20}，而是[^，。；：\n]{1,20}/g,
  '不是A，是B（硬撞形态）': /不是[^，。；：\n]{1,20}，是[^，。；：\n]{1,20}/g,
  '不是A而是B（无逗号）': /不是[^，。；：\n]{1,20}而是[^，。；：\n]{1,20}/g,
};
const totals = {};
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const chars = c.replace(/\s/g, '').length;
  const line = [];
  for (const [name, re] of Object.entries(subs)) {
    re.lastIndex = 0;
    const m = c.match(re);
    const n = m ? m.length : 0;
    if (n > 0) { line.push(`${name}=${n}`); totals[name] = (totals[name] || 0) + n; }
  }
  const dash = (c.match(/——/g) || []).length;
  const density = (dash / chars * 1000).toFixed(1);
  console.log(`${f}: 字数≈${chars} 破折号${dash}(每千字${density}) ${line.length ? line.join(' ') : '否定式零'}`);
}
console.log('\n=== 否定句式细分总计 ===');
for (const [k, v] of Object.entries(totals)) console.log(`${k}: ${v}`);
console.log('\n=== 顿号三连样本（每文件最多3例） ===');
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const re = /[^，。；：\n]{2,12}、[^，。；：\n]{2,12}、[^，。；：\n]{2,12}、?/g;
  const samples = [];
  let m;
  while ((m = re.exec(c)) !== null && samples.length < 3) samples.push(m[0]);
  if (samples.length) console.log(`${f}: ${samples.join(' | ')}`);
}
