/* Ink Crossing: the captain's desk, a side panel shown only on big screens during a voyage (ship, landmarks, catch, log). */
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
  const marks=G.charts.length?`<div class="marks">${G.charts.map(c=>`<div class="mark">${glyph(c.k)}<p><b>${CHARTS[c.k].n}.</b> ${CHARTS[c.k].d}</p></div>`).join('')}</div>`
    :`<p class="soft">None yet. Uncharted isles and elites give you landmarks that help for the whole voyage.</p>`;
  const fish={};G.creel.forEach(f=>fish[f]=(fish[f]||0)+1);
  const catchH=G.creel.length?`<section><h3>Catch <span class="soft">${G.creel.length} fish</span></h3><div class="catchlist">${Object.entries(fish).map(([f,k])=>`<div class="fishline">${fishSVG(f)}<span>${FISH[f].n}${k>1?` ×${k}`:''}</span></div>`).join('')}</div></section>`:'';
  const log=G.log.slice().reverse().map(e=>e.lore?`<p class="log entry">${e.t}</p>`:`<p class="entry"><b>Day ${e.d}.</b> ${e.t}</p>`).join('');
  deskEl.innerHTML=`<section class="desk-ship">${shipArt(G.ship)}<div><b>${sh.n}</b><span class="soft">${sh.type}. ${G.tut?'The maiden voyage':`Voyage ${codeOf(G.seed)}`}</span></div></section>
    <p class="desk-trait"><b>${tr.n}.</b> ${tr.d()}</p>
    <div class="desk-stats" id="deskstats"></div>
    <section><h3>Crew <span class="soft">${(G.crew||[]).length}/${berths()}</span></h3><div class="marks">${(G.crew||[]).map(c=>`<div class="mark crewmark"><span class="crewic">${crewFace(c.k)}</span><p><b>${CREW[c.k].n}</b>, rank ${crewRank(c)}. ${CREW[c.k].crafts.map(x=>CRAFTS[x]).join(' and ')}.</p></div>`).join('')||'<p class="soft">No crew. Your cargo needs hands.</p>'}</div></section>
    <section><h3>Renown ${renownLvl()} <span class="soft">${renownNext()?`${G.renown||0} of ${renownNext()}`:'top level'}</span></h3>${(G.perks||[]).length?`<div class="marks">${G.perks.map(k=>`<div class="mark">${STAR}<p><b>${PERKS[k].n}</b> ${PERKS[k].d}${PERKS[k].order?` Fires ${WHEN[orderWhen(k)]}.`:''}</p></div>`).join('')}</div>`:'<p class="soft">Win fights to earn renown and make captain\'s picks.</p>'}</section>
    <section><h3>Fittings</h3>${G.fit&&Object.values(G.fit).some(Boolean)?`<div class="marks">${Object.keys(SPOTS).filter(s=>fitIn(s)).map(s=>{const k=fitIn(s);return`<div class="mark">${fitGlyph(k)}<p><b>${FITTINGS[k].n}.</b> ${fitDesc(k,s)} <span class="soft">${handAt(s)?`${CREW[handAt(s).k].n} mans it.`:'Nobody mans it.'}</span></p></div>`}).join('')}</div>`:'<p class="soft">None yet. The shipwright in any port sells them.</p>'}</section>
    <section><h3>Landmarks</h3>${marks}</section>
    ${catchH}
    <section class="desk-log"><h3>Cartographer's log</h3><div class="entries">${log||'<p class="soft">Nothing written yet.</p>'}</div></section>`;
  if(live)document.getElementById('deskstats').appendChild(live);
}
new MutationObserver(()=>requestAnimationFrame(renderDesk)).observe(app,{childList:true});
DESK.addEventListener('change',()=>{renderDesk();fitDock()});
