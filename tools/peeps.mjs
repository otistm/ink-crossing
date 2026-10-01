// Builds play/js/peep-parts.js from the Open Peeps "Separate Atoms" folder (CC0, by Pablo Stanley).
// Only the parts a look in the game asks for are copied in, so the page stays small.
//   node tools/peeps.mjs [atoms folder]            write play/js/peep-parts.js
//   node tools/peeps.mjs [atoms folder] --sheet     also write tools/peeps-sheet.html, every part on one page, for picking looks
// The folder defaults to PEEPS_DIR, then ~/Downloads/Flat Assets/Flat Assets/Separate Atoms.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--')) || process.env.PEEPS_DIR ||
  path.join(os.homedir(), 'Downloads', 'Flat Assets', 'Flat Assets', 'Separate Atoms');
// layer -> folder in the atoms set
const FOLDERS = { body: 'body', head: 'head', face: 'face', beard: 'facial-hair', acc: 'accessories', pose: 'pose/standing' };

// whole units are a fifth of a pixel at bust size; also drop spaces the path syntax doesn't need
const round = s => s.replace(/-?\d*\.\d+/g, n => String(Math.round(parseFloat(n))))
  .replace(/\s*([A-Za-z])\s*/g, '$1').replace(/,/g, ' ').replace(/ -/g, '-').trim();
function atom(file) {
  const src = fs.readFileSync(file, 'utf8');
  const open = src.indexOf('<g id=');
  const start = src.indexOf('>', open) + 1, end = src.lastIndexOf('</g>');
  return src.slice(start, end)
    .replace(/\s+id="[^"]*"/g, '')
    .replace(/fill="#(221E1F|231F20|4F66AF)"/gi, 'fill="#000000"')
    .replace(/#000000/g, '#000').replace(/#FFFFFF/gi, '#fff')
    .replace(/d="([^"]*)"/g, (m, d) => `d="${round(d)}"`)
    .replace(/transform="([^"]*)"/g, (m, t) => `transform="${round(t)}"`)
    .replace(/>\s+</g, '><').trim();
}
const all = {};
for (const [layer, folder] of Object.entries(FOLDERS)) {
  all[layer] = {};
  for (const f of fs.readdirSync(path.join(dir, folder)).filter(f => f.endsWith('.svg')).sort())
    all[layer][f.replace(/\.svg$/, '')] = atom(path.join(dir, folder, f));
}

// every look in the game: body:'…', head:'…', face:'…', beard:'…', acc:'…'
const used = { body: new Set(), head: new Set(), face: new Set(), beard: new Set(), acc: new Set(), pose: new Set() };
for (const f of fs.readdirSync(path.join(root, 'play/js')).filter(f => f.endsWith('.js') && f !== 'peep-parts.js')) {
  const src = fs.readFileSync(path.join(root, 'play/js', f), 'utf8');
  for (const m of src.matchAll(/\b(body|head|face|beard|acc|pose):'([^']+)'/g))
    if (all[m[1]] && all[m[1]][m[2]] !== undefined) used[m[1]].add(m[2]);
}
used.body.add('Tee 1'); used.head.add('Short 1'); used.face.add('Calm'); used.pose.add('resting-1');   // PEEP_BASE and PEEP_POSE in peeps.js

const out = {};
for (const layer of Object.keys(FOLDERS)) {
  out[layer] = {};
  for (const k of [...used[layer]].sort()) out[layer][k] = all[layer][k];
}
const body = Object.entries(out).map(([layer, parts]) =>
  `  ${layer}:{\n${Object.entries(parts).map(([k, v]) => `    ${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',\n')}}`).join(',\n');
fs.writeFileSync(path.join(root, 'play/js/peep-parts.js'),
  `/* Ink Crossing: crew and people parts, copied from Open Peeps (CC0, by Pablo Stanley) by tools/peeps.mjs. Don't edit by hand:\n   add a part to a look in world.js, people.js or coach.js and run npm run peeps. */\n"use strict";\nconst PEEP_PARTS={\n${body}};\n`);
const n = Object.values(out).reduce((a, p) => a + Object.keys(p).length, 0);
console.log(`ok: ${n} parts, ${Math.round(fs.statSync(path.join(root, 'play/js/peep-parts.js')).size / 1024)} KB`);

if (args.includes('--sheet')) {
  const OFF = { body: [147, 639], head: [372, 180], face: [531, 366], beard: [495, 518], acc: [419, 421] };
  const VB = { body: '0 0 818 733', head: '0 0 473 567', face: '0 0 289 293', beard: '0 0 280 230', acc: '0 0 392 138', pose: '0 0 1645 2500' };
  const html = Object.entries(all).map(([layer, parts]) => `<h2>${layer}</h2><div class="g">${Object.entries(parts).map(([k, v]) =>
    `<figure><svg viewBox="${VB[layer]}">${v}</svg><figcaption>${k}</figcaption></figure>`).join('')}</div>`).join('');
  fs.writeFileSync(path.join(root, 'tools/peeps-sheet.html'), `<!doctype html><meta charset="utf-8"><style>body{font:12px sans-serif}.g{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}figure{margin:0;border:1px solid #ccc}svg{width:100%;height:110px}</style>${html}`);
  console.log('sheet: tools/peeps-sheet.html');
}
