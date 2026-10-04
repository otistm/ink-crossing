/* Ink Crossing: the captain's desk, a side panel shown only on big screens during a voyage (the ship, the captain's level, fittings, catch). */
"use strict";
/* Keep in step with the desk rules at the end of styles.css. */
const DESK=matchMedia('(min-width:1180px) and (min-height:640px)');
const deskEl=document.getElementById('desk');
function renderDesk(){
  const on=DESK.matches&&!!G&&!!app.querySelector(':scope>.bar,:scope>.charthead>.bar');
  const was=document.body.classList.contains('desk');
  document.body.classList.toggle('desk',on);deskEl.hidden=!on;
  if(was!==on)fitMap();
  // the stat pills (day, gold, hull, health, fish) live in the desk under the ship's name; the live element moves, so its
  // taps and animations keep working. Leaving desk mode puts it back in the top bar.
  const live=app.querySelector('.bar .stats')||deskEl.querySelector('.stats');
  // Log and Pause join the title line (place or sea name, Chart button) when the screen has one; otherwise they stay in the bar
  const acts=app.querySelector('.bar .acts')||app.querySelector('.seahead>.acts'),head=app.querySelector('.seahead'),bar0=app.querySelector('.bar');
  if(!on){const bar=bar0;if(live&&bar&&!bar.contains(live))bar.prepend(live);if(acts&&bar&&!bar.contains(acts))bar.appendChild(acts);deskEl.innerHTML='';return}
  if(acts&&head&&!head.contains(acts))head.appendChild(acts);
  const sh=SHIPS[G.ship],tr=TRAITS[sh.trait];
  const fish={};G.creel.forEach(f=>fish[f]=(fish[f]||0)+1);
  const catchH=G.creel.length?`<section><h3>Catch <span class="soft">${G.creel.length} fish</span></h3><div class="catchlist">${Object.entries(fish).map(([f,k])=>`<div class="fishline">${fishSVG(f)}<span>${FISH[f].n}${k>1?` ×${k}`:''}</span></div>`).join('')}</div></section>`:'';
  const lv=renownLvl(),n=G.renown||0,nx=renownNext(),prev=lv?RENOWN[lv-1]:0,pc=nx?Math.round((n-prev)/(nx-prev)*100):100,hp=Math.max(0,Math.min(1,G.hull/HULL_MAX));
  const fits=Object.keys(SPOTS).filter(s=>fitIn(s));
  // the ship module (tap for the ship card), the captain's level (tap for its card), and the fittings (tap one to see it on the ship)
  deskEl.innerHTML=`<button type="button" class="desk-mod desk-ship" id="deskship" aria-label="${sh.n}: open your ship">${shipArt(G.ship)}<div><b>${sh.n}</b><span class="soft">${sh.type}. ${G.tut?'The maiden voyage':`Voyage ${codeOf(G.seed)}`}</span></div>
      <p class="desk-trait"><b>${tr.n}.</b> ${tr.d()}</p>
      <span class="desk-hull"><span class="dh-l">Hull</span><b>${G.hull}<small>/${HULL_MAX}</small></b><span class="hmeter" aria-hidden="true"><i style="width:${Math.round(hp*100)}%"></i></span></span></button>
    <div class="desk-stats" id="deskstats"></div>
    <button type="button" class="desk-mod desk-cap" id="deskcap"><span class="dc-head"><svg class="dc-medal" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l13 27 29 4-21 20 5 29-26-14-26 14 5-29L8 35l29-4z"/><text x="50" y="66" text-anchor="middle">${lv}</text></svg>
      <span><b>Captain's level ${lv}</b><span class="soft">${nx?`${n} of ${nx} to level ${lv+1}`:'The top level'}${lv?`. +${lv*CAPHP} health`:''}</span></span></span>
      <span class="rn-bar" aria-hidden="true"><span style="width:${pc}%"></span></span>
      <span class="soft dc-picks">${(G.perks||[]).length?`${G.perks.length} captain's pick${G.perks.length>1?'s':''}: ${G.perks.map(k=>PERKS[k].n).join(', ')}`:'No captain\'s picks yet. Win fights to level up.'}</span></button>
    <section><h3>Fittings <span class="soft">${fits.length} of ${Object.keys(SPOTS).length}</span></h3>${fits.length?`<div class="marks">${fits.map(s=>{const k=fitIn(s);return`<button type="button" class="mark desk-fit" data-dfit="${s}">${fitGlyph(k)}<p><b>${FITTINGS[k].n}</b><span class="soft">${SPOTS[s]}</span></p></button>`}).join('')}</div>`:'<p class="soft">None yet. The shipwright in any port sells them.</p>'}</section>
    ${catchH}`;
  document.getElementById('deskship').onclick=()=>shipSheet();
  document.getElementById('deskcap').onclick=captainSheet;
  deskEl.querySelectorAll('[data-dfit]').forEach(b=>b.onclick=()=>shipSheet(b.dataset.dfit));
  if(live)document.getElementById('deskstats').appendChild(live);
}
new MutationObserver(()=>requestAnimationFrame(renderDesk)).observe(app,{childList:true});
DESK.addEventListener('change',()=>{renderDesk();fitDock()});
