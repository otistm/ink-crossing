// A bot plays full voyages in headless Chromium. Fails on any page error.
import { gameUrl as url, launch } from './browser.mjs';
const runs = +(process.argv[2] || 3);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e) + ' at ' + (e.stack || '').split('\n').slice(1, 5).map(l => l.trim()).join(' < ')));
const q = s => page.$(s);
// press elements directly rather than clicking a screen position: on desktop the port is taller than the window, and a click on a
// button scrolled behind the fixed hold bar would land on cargo instead, opening its card again and again
const press = el => el.evaluate(e => e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
const click = async s => { const el = await q(s); if (el) { await press(el).catch(() => {}); return true; } return false; };
for (let run = 0; run < runs; run++) {
  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url);
  await click(run ? '#new' : '#daily'); await page.waitForTimeout(150);
  await click('.shipcard:not([disabled])'); await page.waitForTimeout(150);
  let result = 'timeout', steps = 0;
  const trail = [];   // the last few screens, printed if the bot gets stuck
  for (; steps < 2000; steps++) {
    const sig = await page.evaluate(() => G ? `${(document.querySelector('.overlay h2') || document.querySelector('.seahead h2') || {}).textContent || (document.querySelector('.battle') ? 'fight' : '?')} @${node(G.at).row}${node(G.at).type}` : 'title').catch(() => '');
    if (trail[trail.length - 1] !== sig) { trail.push(sig); if (trail.length > 14) trail.shift(); }
    if (await q('#coach .cnext')) await click('#coach .cnext');
    if (await q('.overlay')) {
      if (await q('[data-a=home]')) { result = await page.innerText('.overlay h2'); break; }
      for (const s of ['#next', '.pick:not([disabled])', '[data-l=gold]', '.opt:not([disabled])', '[data-a=go]', '.overlay .primary', '.overlay button']) if (await click(s)) break;
    } else if (await q('#bplay')) { for (let i = 0; i < 5; i++) await click(`.bcard:nth-child(${i + 1}):not(.on)`); await click('#bplay:not([disabled])'); await page.waitForTimeout(900); }
    else if (await q('#fstop')) await click('#fstop');
    else if (await q('#skip')) await click('#skip');
    else if (await q('#sailon')) { await click('.spoil .buy:not([aria-disabled])'); await page.waitForTimeout(20); await click('#sailon'); }
    else if (await q('#leave')) {
      // walk round the harbour: market, tavern and shipwright, buying what we can in each
      for (const bld of ['market', 'tavern', 'wright']) { if (await q('.overlay')) break; if (await click(`[data-bld="${bld}"]`)) await page.waitForTimeout(20);
      for (const w of ['0', '1', '2']) if (await click(`[data-w="${w}"]`)) { await page.waitForTimeout(20); await click('.talk .buy:not([aria-disabled])'); await page.waitForTimeout(20); }
      if (await click('[data-w="r"]')) { await page.waitForTimeout(20); await click('.talk .buy:not([aria-disabled])'); await page.waitForTimeout(20); }
      for (const st of bld === 'market' ? ['yard', 'armory', 'apoth', 'charms'] : ['']) { if (st && !(await click(`.sttab[data-st="${st}"]:not(.shut)`))) continue; await page.waitForTimeout(20);
      for (let g = 0; g < 4; g++) if (await click(`[data-g="${g}"]`)) { await page.waitForTimeout(20); await click('.talk .buy:not([aria-disabled])'); await page.waitForTimeout(20); } }
      for (const b of await page.$$('.buy:not([aria-disabled]):not([data-bld])')) { await press(b).catch(() => {}); await page.waitForTimeout(20); if (await q('.overlay')) break; } }
      if (!(await q('.overlay'))) await click('#leave');
    } else {
      const nodes = await page.$$('.node.reach');
      if (nodes.length) await press(nodes[Math.floor(Math.random() * nodes.length)]).catch(() => {});
    }
    await page.waitForTimeout(40);
  }
  if (result === 'timeout') result += ` on ${await page.evaluate(() => (document.querySelector('.seahead h2') || document.querySelector('h2') || {}).textContent + ' / ' + (G ? `sea ${G.sea + 1}, row ${node(G.at).row}, path ${G.path.slice(-3).map(i => node(i).row + node(i).type).join('>')}, hull ${G.hull}, overlays ${document.querySelectorAll('.overlay,.seacross,.chestfx,.fitfx').length}, reach ${document.querySelectorAll('.node.reach').length}, buttons ${[...document.querySelectorAll('button')].map(b => b.id || b.textContent.trim().slice(0, 12)).slice(0, 12).join('|')}` : 'title'))}`;
  console.log(`voyage ${run + 1}: ${result} (${steps} steps)`);
  if (result.startsWith('timeout')) console.log('  last screens: ' + trail.join(' -> '));
}
await browser.close();
if (errors.length) { console.error('Page errors:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }
console.log('ok: no page errors');
