// 全书AI味扫描（2026-08-26猫灯命检查全书内容）
// 模式清单来自写作规范高频表达自查表＋DeepSeek口癖表＋否定句式纪律
import fs from 'fs';
import path from 'path';
const dir = 'D:/文库/论文/社会主义论/社会主义论';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
const patterns = {
  '不是X而是Y/不是X是Y': /不是[^，。；：\n]{1,20}(?:，而?)?是[^，。；：\n]{1,20}/g,
  '你以为': /你以为/g,
  '当A还在B时C已经': /当[^，。；：\n]{1,15}还在[^，。；：\n]{1,15}时[^，。；：\n]{0,15}已经/g,
  '值得注意的是/不难发现': /值得注意的是|不难[发现看出]/g,
  '值得一提/值得深思': /值得一提|值得深思|值得思考/g,
  '综上所述/总的来说/总而言之': /综上所述|总的来说|总而言之/g,
  '某种意义上/某种程度上': /某种(?:程?度|意义)上/g,
  '仿佛/宛如/似乎': /仿佛|宛如|似乎/g,
  '顿时/瞬间': /顿时|瞬间/g,
  '愈发/愈发地': /愈发/g,
  '毫无疑问/不容置疑': /毫无疑问|不容置疑/g,
  '恰恰/恰恰是': /恰恰/g,
  '一丝/眸光/眼底/唇角': /一丝|眸光|眼底|唇角/g,
  '苦笑/似笑非笑/攥紧/倒吸': /苦笑|似笑非笑|攥紧|倒吸/g,
  '双刃剑/灯塔/画卷/石子/涟漪': /双刃剑|灯塔|画卷|石子|涟漪/g,
  '接住': /接住/g,
  '与此同时/换言之/换句话说': /与此同时|换言之|换句话说/g,
  '关键在于/核心在于': /关键在于|核心在于/g,
  '正是/正因如此': /正是|正因如此/g,
  '——破折号': /——/g,
  '顿号三连排比': /[、，][^，。；：\n]{2,12}、[^，。；：\n]{2,12}、[^，。；：\n]{2,12}[、。，；：]/g,
};
const totals = {};
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const line = [];
  for (const [name, re] of Object.entries(patterns)) {
    re.lastIndex = 0;
    const m = c.match(re);
    const n = m ? m.length : 0;
    if (n > 0) { line.push(`${name}=${n}`); totals[name] = (totals[name] || 0) + n; }
  }
  console.log(`${f}: ${line.length ? line.join(' ') : '(零命中)'}`);
}
console.log('\n=== 全书总计 ===');
for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) {
  console.log(`${k}: ${v}`);
}
