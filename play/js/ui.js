/* Ink Crossing: UI helpers, boards, item sheets, the hold and locker dock, drag and drop. */
"use strict";
/* ---------- ui helpers ---------- */
const app=document.getElementById('app');
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);const c=document.getElementById('coach');if(c){const r=c.getBoundingClientRect();if(r.top<innerHeight/2)t.style.top=(r.bottom+10)+'px'}setTimeout(()=>t.remove(),2200)}
function pop(el,txt,cls){if(!el||(B&&B.quiet))return;const r=el.getBoundingClientRect();const p=document.createElement('div');p.className='pop '+(cls||'');p.textContent=txt;p.style.left=(r.left+r.width/2+(Math.random()*18-9))+'px';p.style.top=(r.top+r.height*.45)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1000)}
function squish(el,cls){if(!el||(B&&B.quiet))return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)}
function overlay(html,center,cls){const ov=document.createElement('div');ov.className='overlay'+(center?' center':'');ov.innerHTML=`<div class="sheet ${cls||''}" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(ov);return ov}
/* the hull the top bar last showed. When a screen draws with less, the hull card plays, so every loss shows: fights, events, people. */
let hullSeen=null;
function noteHull(){if(!G)return;if(hullSeen!=null&&G.hull<hullSeen&&G.hull>0){const a=hullSeen,b=G.hull;setTimeout(()=>hullLoss(a,b),80)}hullSeen=G.hull}
/* the top strip: day, gold, hull and catch as chips with small ink icons, then the log and pause */
const SI={hp:'<path class="w" d="M8 13.6C3.4 10.4 1.6 8.2 1.6 5.8a3.2 3.2 0 0 1 6.4-.9 3.2 3.2 0 0 1 6.4.9c0 2.4-1.8 4.6-6.4 7.8z"/>',gold:'<circle class="w" cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="3.4"/>',fish:'<path class="w" d="M1.5 8c3-4 8-4 10.5 0-2.5 4-7.5 4-10.5 0z"/><path class="w" d="M12 8l3-2.5v5z"/><circle class="k" cx="5" cy="7.4" r=".8"/>',
  log:'<path class="w" d="M1.5 3.5c2.2-1 4.4-.9 6.5.6v9.4c-2.1-1.5-4.3-1.6-6.5-.6zM14.5 3.5c-2.2-1-4.4-.9-6.5.6v9.4c2.1-1.5 4.3-1.6 6.5-.6z"/>'};
const sicon=(k,inner)=>`<svg class="sic" viewBox="0 0 ${inner?12:16} ${inner?12:16}" aria-hidden="true">${inner||SI[k]}</svg>`;
function barHTML(){noteHull();const b=k=>bump===k?' bump':'',hp=Math.max(0,Math.min(1,G.hull/HULL_MAX));
  const h=`<header class="bar"><div class="stats">
    <span class="stat day">Day <b>${G.day}</b></span>
    <span class="stat${b('gold')}" id="goldst" aria-label="${G.gold} gold">${sicon('gold')}<b>${G.gold}</b><small>gold</small></span>
    <button class="stat hullst${b('hull')}" id="shipbtn" aria-label="Your ship: ${G.hull} hull">${sicon(0,EMB[G.ship])}<b>${G.hull}</b><small>hull</small><span class="hmeter" aria-hidden="true"><i style="width:${Math.round(hp*100)}%"></i></span></button>
    <span class="stat hpst" aria-label="${nextHP()} health in fights">${sicon('hp')}<b>${nextHP()}</b><small>health</small></span>
    ${G.creel&&G.creel.length?`<button class="stat" id="creelbtn" aria-label="${G.creel.length} fish">${sicon('fish')}<b>${G.creel.length}</b><small>fish</small></button>`:''}
  </div><div class="acts"><button class="logbtn" id="logbtn" aria-label="Cartographer's log">${sicon('log')}<span>Log</span></button><button class="pausebtn" id="pausebtn" type="button" aria-label="Pause"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="9" y="8" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="18" y="8" width="5" height="16" rx="1.5" fill="currentColor"/></svg></button></div></header>`;bump=null;return h}
function bindBar(){const l=document.getElementById('logbtn');if(l)l.onclick=()=>journal();const pb=document.getElementById('pausebtn');if(pb)pb.onclick=showPause;const sb=document.getElementById('shipbtn');if(sb)sb.onclick=shipSheet;const c=document.getElementById('creelbtn');if(c)c.onclick=creelSheet}
/* an item's kind for its colour wash: its first tag in this order */
const kindOf=k=>{const t=DEFS[k].tags;for(const c of'XCWVFARTK')if(t.includes(c))return c;return'T'};
function boardHTML(list,side,ups,cap){cap=cap||(side==='p'&&list===G.board?holdCap():HOLD);const cr=list.enemy||side==='e'?null:crewCrafts();
  let h=`<div class="board${side==='l'?' locker':''}" data-side="${side}">`;
  list.forEach((it,i)=>{const d=DEFS[it.k],s=statsOf(list,i,cr),use=itemUse(it.k,cr),sel=side==='p'&&!B&&G.moving&&G.sel===i,up=ups&&ups.has(i);
    h+=`<button class="item t${it.t} c-${kindOf(it.k)}${isPassive(it.k)?' passive':''}${sel?' sel':''}${use==='all'?'':' use-'+use}" style="grid-column:span ${d.s}" data-i="${i}" aria-label="${TIER[it.t]} ${d.n}${up?', can be upgraded here':''}${use==='none'?', needs crew':use==='some'?', partly needs crew':''}"><span class="fill"></span>${emb(it.k)}<span class="ico">${icon(it.k)}</span><span class="nm">${d.n}</span>${up?CHEV:''}<span class="cdt">${isPassive(it.k)?'···':s.cd+'s'}</span></button>`});
  for(let k=used(list);k<cap;k++)h+=`<button class="slot" aria-label="Empty slot"></button>`;
  if(side==='p'&&cap<HOLD)for(let k=cap;k<HOLD;k++)h+=`<span class="slot boarded" title="Boarded up by Double Planking" aria-hidden="true"></span>`;
  return h+'</div>';
}
/* which other items in the same list an item works on, and how: the ones it hastes or charges, the ones its aura boosts */
function affectMap(list,i){const d=DEFS[list[i].k],out=new Map(),add=(j,l)=>{if(j>=0&&j<list.length&&j!==i&&!out.has(j))out.set(j,l)};
  const tgt=(t,l)=>{if(typeof t!=='string')return;if(t==='adj'){add(i-1,l);add(i+1,l)}else if(t==='left')add(i-1,l);else if(t==='right')add(i+1,l);
    else if(t==='all'||t==='rand1'||t==='rand2')list.forEach((x,j)=>add(j,l));else if(t.startsWith('tag:'))list.forEach((x,j)=>{if(DEFS[x.k].tags.includes(t.slice(4)))add(j,l)})};
  const scan=f=>{if(!f)return;if(Array.isArray(f.haste))tgt(f.haste[0],`Haste ${f.haste[1]}s`);if(Array.isArray(f.charge))tgt(f.charge[0],`Charge +${f.charge[1]}s`)};
  scan(d);scan(d.start);(d.on||[]).forEach(scan);
  const cr=list.enemy?null:crewCrafts();list.forEach((x,j)=>{if(j!==i&&statsOf(list,j,cr).boost.includes(d.n))add(j,'Boosted')});
  return out}
const affects=(list,i)=>new Set(affectMap(list,i).keys());
/* what a piece of cargo you don't own yet would do to your hold: anything matching its tag-wide or hold-wide effects, and the
   item it would upgrade. Where it would sit isn't known yet, so neighbour effects aren't shown. */
function affectsFrom(it,list){const d=DEFS[it.k],out=new Map(),m=findMatch(it);
  if(m&&m.list===list)out.set(m.i,`Upgrade to ${TIER[Math.max(list[m.i].t+1,it.t)]}`);
  const tgt=(t,l)=>{if(typeof t!=='string')return;if(t==='all')list.forEach((x,j)=>{if(!out.has(j))out.set(j,l)});else if(t.startsWith('tag:'))list.forEach((x,j)=>{if(!out.has(j)&&DEFS[x.k].tags.includes(t.slice(4)))out.set(j,l)})};
  const scan=f=>{if(!f)return;if(Array.isArray(f.haste))tgt(f.haste[0],`Haste ${f.haste[1]}s`);if(Array.isArray(f.charge))tgt(f.charge[0],`Charge +${f.charge[1]}s`)};
  scan(d);scan(d.start);(d.on||[]).forEach(scan);
  for(const key in d)if(/^tag[A-Z]/.test(key)&&Array.isArray(d[key]))tgt('tag:'+d[key][0],'Boosted');
  return out}
/* a mark's label, shortened to fit a narrow (phone) tile */
function affTag(t,l){const b=document.createElement('span'),bd=t.parentNode;b.className='afflbl';
  b.textContent=t.offsetWidth>=60?l:l.startsWith('Upgrade to ')?l.slice(11):l==='Boosted'?'Boost':l.startsWith('Haste')?'Haste':l.startsWith('Charge ')?l.slice(7):l;
  // the label sits on the board just above its tile, so it can be wider than a phone-sized tile
  b.style.left=(t.offsetLeft+t.offsetWidth/2)+'px';b.style.top=(t.offsetTop-9)+'px';bd.appendChild(b)}
/* mark tiles in the docked hold: the source, and each affected tile glowing with its label */
function markHold(map,srcEl){clearMarks();if(srcEl)srcEl.classList.add('src');const tiles=[...document.querySelectorAll('.dock .board[data-side="p"] .item, .battle .board[data-side="p"] .item')];
  map.forEach((l,j)=>{const t=tiles[j];if(!t)return;t.classList.add('aff');affTag(t,l)})}
function clearMarks(){document.querySelectorAll('.item.src,.item.aff').forEach(x=>x.classList.remove('src','aff'));document.querySelectorAll('.afflbl').forEach(x=>x.remove())}
/* the list a tile on screen belongs to */
function listOf(el){const bd=el.closest('.board');if(!bd)return null;const sd=bd.dataset.side;
  if(B&&bd.closest('.battle'))return sd==='e'?B.E.list:B.P.list;return sd==='l'?G&&G.locker:sd==='p'?G&&G.board:null}
/* desktop: hovering a tile shows its card beside it and marks the items it works on; phones keep tap for the full sheet */
const HOVERS=matchMedia('(hover:hover) and (pointer:fine)');
let tipEl=null,tipSrc=null;
new MutationObserver(()=>{if(tipEl&&!(tipSrc&&tipSrc.isConnected))hideItemTip()}).observe(document.getElementById('app'),{childList:true});
function hideItemTip(){if(tipEl){tipEl.remove();tipEl=null}clearMarks();if(typeof restoreFocusMarks==='function')restoreFocusMarks()}
function showItemTip(el){hideItemTip();tipSrc=el;if(!G||document.querySelector('.dragging'))return;const list=listOf(el),i=[...el.parentNode.querySelectorAll('.item')].indexOf(el);if(!list||!list[i])return;
  const it=list[i],d=DEFS[it.k],{s,L,tags}=describe(list,i),tiles=[...el.parentNode.querySelectorAll('.item')],aff=affectMap(list,i);
  clearMarks();el.classList.add('src');aff.forEach((l,j)=>{const t=tiles[j];if(!t)return;t.classList.add('aff');affTag(t,l)});
  tipEl=document.createElement('div');tipEl.className='itip';tipEl.setAttribute('role','tooltip');
  tipEl.innerHTML=`<b>${d.n}</b><p class="soft"><span class="tierword">${TIER[it.t]}</span>, size ${d.s}${s.cd?`, ${s.cd}s`:', passive'}${tags.length?`. ${tags.join(', ')}`:''}</p><ul>${L.map(l=>`<li>${l}</li>`).join('')}</ul>${aff.size?`<p class="itip-aff">Works on ${aff.size} of your other items.</p>`:''}`;
  document.body.appendChild(tipEl);const r=el.getBoundingClientRect(),t=tipEl.getBoundingClientRect();
  let x=Math.min(innerWidth-t.width-8,Math.max(8,r.left+r.width/2-t.width/2)),y=r.top-t.height-10;if(y<8)y=r.bottom+10;
  tipEl.style.left=x+'px';tipEl.style.top=y+'px'}
document.addEventListener('pointerover',e=>{if(!HOVERS.matches||e.pointerType!=='mouse')return;const el=e.target.closest&&e.target.closest('.board .item');if(el)showItemTip(el)});
document.addEventListener('pointerout',e=>{const el=e.target.closest&&e.target.closest('.board .item');if(el&&!(e.relatedTarget&&el.contains(e.relatedTarget)))hideItemTip()});
document.addEventListener('pointerdown',hideItemTip,true);
let pickT=null;
document.addEventListener('pointerover',e=>{if(!HOVERS.matches||e.pointerType!=='mouse'||e.buttons||document.querySelector('.dragging'))return;
  const el=e.target.closest&&e.target.closest('#stall .good:not(.sel):not(.gone),#barroom .patron:not(.sel)');clearTimeout(pickT);
  if(el)pickT=setTimeout(()=>{if(el.isConnected&&!document.querySelector('.dragging'))el.dispatchEvent(new MouseEvent('click',{bubbles:true}))},140)});
/* on a computer, a speech bubble shows only while the mouse is on someone or something that talks (a good, a fitting, a
   fish, a face, a hand at the bar, the seller) or on the bubble itself; it hides a moment after you move away. #app keeps
   the state across redraws, so hovering a new good (which redraws the stall) keeps the bubble up. The maiden voyage
   keeps bubbles showing, so its steps can point at their buttons. */
const TALKSRC='#stall .good,#stall [data-w],#stall [data-df],#stall [data-ds],#stall .seller,#barroom .patron,.talk:not(.quiet)';
let talkT=null;
function talkOn(on){clearTimeout(talkT);if(on){app.classList.add('talkon');return}talkT=setTimeout(()=>app.classList.remove('talkon'),320)}
const hoverTalk=()=>HOVERS.matches&&!(G&&G.tut);
document.addEventListener('pointerover',e=>{if(!hoverTalk())return;talkOn(!!(e.target.closest&&e.target.closest(TALKSRC)))});
document.addEventListener('pointerout',e=>{if(!e.relatedTarget&&hoverTalk())talkOn(false)});
document.addEventListener('focusin',e=>{if(hoverTalk()&&e.target.closest&&e.target.closest(TALKSRC))talkOn(true)});
function itemSheet(list,i,mode,after){
  const it=list[i],d=DEFS[it.k],{s,L,g,tags}=describe(list,i),inL=list===G.locker,other=inL?G.board:G.locker,ocap=inL?holdCap():LOCK;
  const canSwap=G.locker&&mode!=='view'&&(G.locker===list||G.board===list),swapOk=canSwap&&used(other)+d.s<=ocap;
  const ov=overlay(`<div class="sh-top"><span class="big t${it.t}">${icon(it.k)}</span><div><h2>${d.n}</h2><p class="soft" style="margin-top:4px"><span class="tierword">${TIER[it.t]}</span>, size ${d.s}${s.cd?`, ${s.cd}s cooldown`:', passive'}${tags.length?`. ${tags.join(', ')}`:''}${d.ship!=='any'?`. ${SHIPS[d.ship].n}'s cargo`:''}</p></div></div>
    ${inL?'<p class="gloss">In your locker. Locker cargo stays out of fights.</p>':''}
    <ul>${L.map(l=>`<li>${l}</li>`).join('')}</ul>
    ${g.length?`<div class="gloss">${g.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    ${(()=>{const a=[...affects(list,i)].map(j=>DEFS[list[j].k].n);return a.length?`<p class="gloss">Works on: ${[...new Set(a)].join(', ')}.</p>`:''})()}
    ${!list.enemy&&itemUse(it.k,crewCrafts())!=='all'?'<p class="gloss">Crew cargo needs a hand who masters it. Hire one at a port tavern. Ship cargo works on its own.</p>':''}
    ${mode!=='view'&&it.t<3?`<p class="gloss">Get another ${d.n}, ${TIER[it.t]} or better, to upgrade it to ${TIER[it.t+1]}.</p>`:''}
    <div class="sh-actions">${mode!=='view'&&!inL?`<button class="ghost" data-a="move">Move</button>`:''}${canSwap?`<button class="ghost" data-a="swap" ${swapOk?'':'disabled'}>${inL?'Move to hold':'Stow in locker'}</button>`:''}${mode==='port'||mode==='spoils'?`<button class="ghost" data-a="sell">Sell for ${sellP(it.k,it.t)} gold</button>`:''}<button class="primary" data-a="close">Close</button></div>`);
  ov.addEventListener('click',e=>{
    if(e.target===ov){ov.remove();return}
    const a=e.target.closest('[data-a]');if(!a||a.disabled)return;ov.remove();
    if(a.dataset.a==='sell'){const r=a.getBoundingClientRect(),g=sellP(it.k,it.t);G.gold+=g;list.splice(i,1);save();toast(`Sold ${d.n}`);after();sellFx(r.left+r.width/2,r.top+r.height/2,g)}
    if(a.dataset.a==='move'){G.moving=true;G.sel=i;after()}
    if(a.dataset.a==='swap'){list.splice(i,1);other.push(it);save();toast(inL?`Moved the ${d.n} to your hold`:`Stowed the ${d.n} in your locker`);after()}
  });
  ov.querySelector('[data-a="close"]').focus();
}
/* something just came aboard: it drops into its slot with an ink burst and a label rising off it ("New", or the tier it went up to) */
function holdFlash(){if(!flash)return;const f=flash;flash=null;
  for(const [side,list] of [['p',G.board],['l',G.locker||[]]]){const i=list.indexOf(f.ref);if(i<0)continue;
    const el=app.querySelector(`.dock .board[data-side="${side}"] .item[data-i="${i}"]`);if(!el)return;
    el.classList.add(f.kind==='up'?'upgain':'gain');
    if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,up=f.kind==='up';
    const burst=document.createElement('div');burst.className='inkburst'+(up?' big':'');burst.style.left=cx+'px';burst.style.top=cy+'px';
    burst.innerHTML=`<svg viewBox="-50 -50 100 100" aria-hidden="true">${Array.from({length:up?12:8},(_,k)=>{const a=k/(up?12:8)*Math.PI*2;return`<path d="M${Math.cos(a)*24} ${Math.sin(a)*24}L${Math.cos(a)*(k%2?36:44)} ${Math.sin(a)*(k%2?36:44)}"/>`}).join('')}${up?'<path class="star" d="M0-46l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>':''}</svg>`;
    const tag=document.createElement('div');tag.className='floatlbl'+(up?' up':'');tag.textContent=up?`${TIER[f.ref.t]}!`:f.kind==='ready'?'Ready!':'New';tag.style.left=cx+'px';tag.style.top=r.top+'px';
    document.body.append(burst,tag);const hw=tag.offsetWidth/2+6;tag.style.left=Math.max(hw,Math.min(innerWidth-hw,cx))+'px';   // keep the label on screen
    setTimeout(()=>{burst.remove();tag.remove()},1300);return}}
function bindHold(mode,rerender,ext){
  dragHold(mode,rerender,ext);holdFlash();const cb=document.getElementById('crewbar');if(cb)cb.onclick=shipSheet;
  app.querySelectorAll('.dock .board[data-side="p"] .item').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.i;
    if(G.moving){if(i!==G.sel){const[it]=G.board.splice(G.sel,1);G.board.splice(i,0,it)}G.moving=false;G.sel=null;save();rerender();coach('moved')}
    else itemSheet(G.board,i,mode,rerender)});
  app.querySelectorAll('.dock .board[data-side="p"] .slot').forEach(b=>b.onclick=()=>{if(!G.moving)return;const[it]=G.board.splice(G.sel,1);G.board.push(it);G.moving=false;G.sel=null;save();rerender()});
  app.querySelectorAll('.dock .board[data-side="l"] .item').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;if(G.moving){G.moving=false;G.sel=null;return rerender()}itemSheet(G.locker,+b.dataset.i,mode,rerender)});
}
/* ---------- crafts and crew ---------- */
const CRAFTG={steel:'<path d="M3 13L12 4"/><path d="M10 3h3v3"/><path d="M4 10l2 2"/>',gun:'<circle class="k" cx="7.5" cy="9" r="4.2"/><path d="M10.5 5.5L13 3"/>',
  fire:'<path class="w" d="M8 14c-3 0-4.5-2-4.5-4.5C3.5 6.5 7 5.5 7 2c3 2 5.5 4.5 5.5 7.5S11 14 8 14z"/>',alch:'<path class="w" d="M6 2h4M7 2v4l-4 7.5h10L9 6V2"/>',
  med:'<path class="w" d="M6 2.5h4v3.5h3.5v4H10v3.5H6V10H2.5V6H6z"/>',carp:'<path class="w" d="M5 2.5h8v4H5z"/><path d="M7.5 6.5L3 14"/>',
  sea:'<circle cx="8" cy="3.5" r="1.6"/><path d="M8 5v9M5 8h6M3 10.5c1 2.5 3 3.5 5 3.5s4-1 5-3.5"/>'};
/* the item classes' icons, for crew chips and item cards */
Object.assign(CRAFTG,{cw:CRAFTG.steel,sw:CRAFTG.gun,cs:'<path class="w" d="M8 1.8l5.2 2v4.3c0 3-2.2 5-5.2 6.1-3-1.1-5.2-3.1-5.2-6.1V3.8z"/>',
  ss:'<path class="w" d="M8 1.8l5.2 2v4.3c0 3-2.2 5-5.2 6.1-3-1.1-5.2-3.1-5.2-6.1V3.8z"/><path d="M3.4 8h9.2"/>',ch:CRAFTG.med,
  sh:'<path class="w" d="M2 9.5h12l-2 4H4z"/><path class="w" d="M6.5 2.5h3v2h2v3h-2v1h-3v-1h-2v-3h2z"/>',
  cx:'<path class="w" d="M9.5 1.5L4 9h3.6l-1.1 5.5L12 7H8.4z"/>',sx:'<path d="M5 1.5v13"/><path class="w" d="M6 2.5c4.5 1.5 6.5 5 6.5 9.5H6z"/>'});
const craftIcon=c=>`<svg class="cri" viewBox="0 0 16 16" aria-hidden="true">${CRAFTG[c]}</svg>`;
const crewCrafts1=k=>CREW[k].crafts.map(c=>`<span class="chipc">${craftIcon(c)}${CRAFTS[c]}</span>`).join('');
const pips=(n,max,cls)=>`<span class="${cls}" aria-label="${n} of ${max}">${Array.from({length:max},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
function crewRows(edit){const cs=G.crew||[];
  return cs.map((c,i)=>{const C=CREW[c.k],rk=crewRank(c),nx=rankXP()[rk];
    return`<div class="crewrow"><span class="o-icon crewic">${crewFace(c.k)}</span><div><b>${C.n}</b>${crewCrafts1(c.k)}${postLine(c)}
      <span class="soft">Level ${rk}${nx!=null?`, ${nx-c.xp} more win${nx-c.xp===1?'':'s'} to level ${rk+1}`:''}. Wage ${wageOf(c.k)}. Morale ${pips(c.m,3,'mor')}</span></div>
      ${edit?`<button class="linkbtn" data-dis="${i}">Dismiss</button>`:''}</div>`}).join('')+
    Array.from({length:Math.max(0,berths()-cs.length)},()=>`<div class="crewrow empty"><span class="fitnone"></span><div><b>Empty berth</b><span class="soft">Hire crew at a port tavern.</span></div></div>`).join('')}
/* a crew member's role line: their perk, and an upgrade they haven't spent yet */
function postLine(c){const C=CREW[c.k],P=CREWPERK[C.perk];return`<span class="atpost"><b>${P.n}.</b> ${P.d}</span>${c.up?`<button class="linkbtn upbtn" data-up="${G.crew.indexOf(c)}">Upgrade an item (${c.up})</button>`:''}`}
/* ---------- your ship: trait and fittings ---------- */
function fitRows(){return Object.keys(SPOTS).map(s=>{const k=fitIn(s);
  return`<div class="fitrow${k?'':' empty'}">${k?fitGlyph(k):'<span class="fitnone" aria-hidden="true"></span>'}<div><span class="soft">${SPOTS[s]}</span><b>${k?FITTINGS[k].n:'Empty'}</b>${k?`<span class="d">${fitDesc(k)}</span>`:''}</div></div>`}).join('')}
/* a fitting's text, its downside in red */
function fitDesc(k){const F=FITTINGS[k],part=(t,cls)=>t?`<span class="${cls}">${t}</span> `:'';return(part(F.shape,'fsh')+part(F.up,'fup')+part(F.dn,'fdn')).trim()}
function renownHTML(){const n=G.renown||0,lv=renownLvl(),nx=renownNext(),prev=lv?RENOWN[lv-1]:0,pc=nx?Math.round((n-prev)/(nx-prev)*100):100;
  return`<div class="renown"><div class="rn-head"><b>Renown ${lv}</b><span class="soft">${nx?`${n} of ${nx} to the next level`:`${n}, the top level`}</span></div>
    <div class="rn-bar" aria-hidden="true"><span style="width:${pc}%"></span></div>
    ${(G.perks||[]).length?`<ul class="perks">${G.perks.map(k=>`<li><b>${PERKS[k].n}</b> ${PERKS[k].d}${PERKS[k].order?` <label class="when">Fires <select data-ord="${k}">${Object.entries(WHEN).map(([w,t])=>`<option value="${w}"${orderWhen(k)===w?' selected':''}>${t}</option>`).join('')}</select></label>`:''}</li>`).join('')}</ul>`:'<p class="soft" style="font-size:13px">Win fights to earn renown. Each level lets you make a captain\'s pick for this voyage: an order your crew carry out in fights, or a way of running the ship.</p>'}</div>`}
const orderWhen=k=>(G.orders&&G.orders[k])||PERKS[k].when;
function shipSheet(){const sh=SHIPS[G.ship],tr=TRAITS[sh.trait];
  if(matchMedia(SHIPWIDE).matches)return shipCard();
  const ov=overlay(`<div class="sh-top shipsheet-top">${shipArt(G.ship)}<div><h2>${sh.n}</h2><p class="soft" style="margin-top:4px">${sh.type}. ${G.hull} hull. Hold of ${holdCap()} slots.</p></div></div>
    <p class="gloss" style="font-size:14px;color:var(--ink)"><span><b>${tr.n}.</b> ${tr.d()}</span></p>
    <h3 class="shead">Crew <span class="soft">${(G.crew||[]).length}/${berths()} berths</span></h3>
    <div class="crewlist">${crewRows(!!(app.querySelector('#leave')||app.querySelector('.map')))}</div>
    ${renownHTML()}
    <h3 class="shead">Fittings</h3>
    <div class="fitlist">${fitRows()}</div>
    <p class="gloss">${G.fit&&Object.values(G.fit).some(Boolean)?'Fitting a new part in a spot sells the old one for half. Losing a fight tears one away.':'The shipwright in any port sells fittings, and elites sometimes carry one.'}</p>
    <button class="primary" data-a="c">Close</button>`);
  shipBind(ov)}
/* big screens: the ship card is built for the space. The ship itself is the hero, drawn large on the water with its four fittings
   pinned to the parts they belong to; its numbers sit along the top and the crew are mustered along the bottom. */
const SHIPWIDE='(min-width:900px) and (min-height:620px)';
// where each fitting spot sits on each ship's drawing (in its 120 by 110 frame)
const SHIPSPOTS={sloop:{sails:[62,36],guns:[72,89],hull:[44,95],head:[12,77]},galleon:{sails:[60,40],guns:[46,88],hull:[66,98],head:[10,76]},
  privateer:{sails:[34,40],guns:[46,89],hull:[64,96],head:[6,71]},junk:{sails:[64,40],guns:[76,88],hull:[44,99],head:[8,72]}};
function shipCard(){const sh=SHIPS[G.ship],tr=TRAITS[sh.trait],cs=G.crew||[],edit=!!(app.querySelector('#leave')||app.querySelector('.map'));
  const n=G.renown||0,lv=renownLvl(),nx=renownNext(),prev=lv?RENOWN[lv-1]:0,pc=nx?Math.round((n-prev)/(nx-prev)*100):100;
  const bar=p=>`<span class="sc-bar" aria-hidden="true"><i style="width:${p}%"></i></span>`;
  const stat=(lbl,big,small,extra)=>`<div class="sc-stat"><span class="sc-lbl">${lbl}</span><b>${big}</b>${small?`<span class="soft">${small}</span>`:''}${extra||''}</div>`;
  const callout=s=>{const k=fitIn(s),F=k&&FITTINGS[k];
    return`<div class="sc-fit${k?'':' empty'}" data-spot="${s}"><span class="sc-lbl">${SPOTS[s]}</span>
      <div class="sc-fithead">${k?fitGlyph(k):'<span class="fitnone" aria-hidden="true"></span>'}<b>${F?F.n:'Empty'}</b></div>
      <p>${F?fitDesc(k):`Any port's shipwright can fit ${SPOTS[s].toLowerCase()==='figurehead'?'a figurehead':SPOTS[s].toLowerCase()==='guns'?'guns':`a ${SPOTS[s].toLowerCase()} fitting`}.`}</p></div>`};
  const crew=cs.map((c,i)=>{const C=CREW[c.k],rk=crewRank(c),nx2=rankXP()[rk];
      return`<div class="sc-hand"><span class="sc-face">${crewFace(c.k)}</span><div class="sc-who"><b>${C.n}</b><span class="sc-crafts">${crewCrafts1(c.k)}</span>${postLine(c)}
        <span class="soft">Level ${rk}${nx2!=null?`, ${nx2-c.xp} more win${nx2-c.xp===1?'':'s'} to level ${rk+1}`:''}</span>
        <span class="soft">Wage ${wageOf(c.k)}. Morale ${pips(c.m,3,'mor')}</span></div>${edit?`<button class="linkbtn" data-dis="${i}">Dismiss</button>`:''}</div>`}).join('')
    +Array.from({length:Math.max(0,berths()-cs.length)},()=>`<div class="sc-hand empty"><span class="sc-face"></span><div class="sc-who"><b>Empty berth</b><span class="soft">Hire crew at a port tavern.</span></div></div>`).join('');
  const picks=(G.perks||[]).length?`<ul class="perks">${G.perks.map(k=>`<li><b>${PERKS[k].n}</b> ${PERKS[k].d}${PERKS[k].order?` <label class="when">Fires <select data-ord="${k}">${Object.entries(WHEN).map(([w,t])=>`<option value="${w}"${orderWhen(k)===w?' selected':''}>${t}</option>`).join('')}</select></label>`:''}</li>`).join('')}</ul>`
    :'<p class="soft">Win fights to earn renown. Each level lets you make a captain\'s pick for this voyage.</p>';
  const ov=overlay(`<button class="sc-x" data-a="c" aria-label="Close">${'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>'}</button>
    <header class="sc-head"><div class="sc-title"><h2>${sh.n}</h2><p class="soft">${sh.type}, voyage ${codeOf(G.seed)}</p><p class="sc-trait"><b>${tr.n}.</b> ${tr.d()}</p></div>
      <div class="sc-stats">${stat('Hull',`${G.hull}<small>/${HULL_MAX}</small>`,'',bar(Math.round(G.hull/HULL_MAX*100)))}${stat('Hold',holdCap(),'slots')}${stat('Crew',`${cs.length}<small>/${berths()}</small>`,'berths')}${stat('Renown',lv,nx?`${n} of ${nx}`:'top level',bar(pc))}</div></header>
    <div class="sc-hero" id="schero">
      <div class="sc-fits left">${callout('head')}${callout('hull')}</div>
      <div class="sc-ship">${shipArt(G.ship,'sc-art')}<svg class="sc-waves" viewBox="0 0 240 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8q10-7 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"/><path d="M0 16q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" opacity=".45"/></svg></div>
      <div class="sc-fits right">${callout('sails')}${callout('guns')}</div>
      <svg class="sc-lines" aria-hidden="true"></svg>
    </div>
    <p class="sc-note soft">${G.fit&&Object.values(G.fit).some(Boolean)?'Fitting a new part in a spot sells the old one for half. Losing a fight tears one away.':'The shipwright in any port sells fittings, and elites sometimes carry one.'}</p>
    <div class="sc-foot"><section class="sc-crew"><h3 class="shead">Crew</h3><div class="sc-hands">${crew}</div></section>
      <section class="sc-picks"><h3 class="shead">Captain's picks</h3>${picks}</section></div>`,true,'shipview');
  // leader lines from each fitting to its part of the ship, drawn once the card is laid out (and again if the window changes)
  const lay=()=>{const hero=ov.querySelector('#schero');if(!hero)return;const svg=hero.querySelector('.sc-lines'),art=hero.querySelector('.sc-art'),H=hero.getBoundingClientRect(),A=art.getBoundingClientRect(),P=SHIPSPOTS[G.ship]||SHIPSPOTS.sloop;
    svg.setAttribute('viewBox',`0 0 ${H.width} ${H.height}`);
    svg.innerHTML=[...hero.querySelectorAll('.sc-fit')].map(el=>{const r=el.getBoundingClientRect(),[ax,ay]=P[el.dataset.spot],x=A.left-H.left+ax/120*A.width,y=A.top-H.top+ay/110*A.height,
      left=el.parentElement.classList.contains('left'),sx=(left?r.right:r.left)-H.left,sy=r.top-H.top+22,mx=sx+(left?28:-28);
      return`<path d="M${sx} ${sy}H${mx}L${x} ${y}"${el.classList.contains('empty')?' stroke-dasharray="4 4"':''}/><circle cx="${x}" cy="${y}" r="4.5"/>`}).join('');
};
  requestAnimationFrame(lay);addEventListener('resize',lay);
  shipBind(ov)}
/* the ship card's buttons: order triggers, dismissing crew, closing */
function shipBind(ov){
  ov.querySelectorAll('[data-ord]').forEach(s=>s.onchange=()=>{G.orders=Object.assign({},G.orders,{[s.dataset.ord]:s.value});save();toast(`${PERKS[s.dataset.ord].n} fires ${WHEN[s.value]}`)});
  ov.addEventListener('click',e=>{const u=e.target.closest('[data-up]');
    if(u){ov.remove();crewUpPick(G.crew[+u.dataset.up],()=>{if(app.querySelector('#leave'))port(G.at);else if(app.querySelector('.map'))chart();shipSheet()});return}
    const d=e.target.closest('[data-dis]');if(d){const c=G.crew[+d.dataset.dis];
      if(d.dataset.sure){G.crew.splice(+d.dataset.dis,1);logL(`Let ${CREW[c.k].n} go.`);save();ov.remove();toast(`${CREW[c.k].n} leaves the ship`);if(app.querySelector('#leave'))port(G.at);else chart();return}
      d.dataset.sure=1;d.textContent='Tap again to dismiss';return}
    if(e.target===ov||e.target.closest('[data-a]'))ov.remove()});ov.querySelector('[data-a]').focus()}
/* a sale: the cargo goes up in a puff of ink, and coins spring out of it and fly up into your purse in the top bar,
   which counts up as each one lands */
function sellFx(x,y,gold){const el=document.getElementById('goldst'),b=el&&el.querySelector('b');if(!b)return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){squish(el,'bump');return}
  const to=el.querySelector('.sic').getBoundingClientRect(),tx=to.left+to.width/2,ty=to.top+to.height/2,start=G.gold-gold,n=Math.max(3,Math.min(10,Math.round(gold/2)+2));
  b.textContent=start;
  const puff=document.createElement('div');puff.className='sellpuff';puff.style.left=x+'px';puff.style.top=y+'px';
  puff.innerHTML=Array.from({length:6},(_,i)=>`<i style="--a:${i*60}deg"></i>`).join('');document.body.appendChild(puff);setTimeout(()=>puff.remove(),700);
  let landed=0;
  for(let i=0;i<n;i++){const c=document.createElement('div');c.className='flycoin';c.innerHTML=sicon('gold');c.style.left=x+'px';c.style.top=y+'px';document.body.appendChild(c);
    const a=Math.random()*Math.PI*2,r=24+Math.random()*30,mx=Math.cos(a)*r,my=Math.sin(a)*r-30;
    c.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:`translate(calc(-50% + ${mx}px),calc(-50% + ${my}px)) scale(1.2)`,opacity:1,offset:.3},{transform:`translate(calc(-50% + ${tx-x}px),calc(-50% + ${ty-y}px)) scale(.8)`,opacity:1}],
      {duration:700+i*45,delay:i*35,easing:'cubic-bezier(.5,0,.5,1)',fill:'both'}).onfinish=()=>{c.remove();landed++;
      b.textContent=landed>=n?G.gold:Math.round(start+gold*landed/n);squish(el,'bump')}}}
/* ---------- drag and drop: hold and locker ---------- */
let dragJustEnded=false;
/* ext (the spoils screen): from, things outside the hold that can be dragged in, each {el,it,drop(tgt,dst)};
   back, {el,ok(it),put(it)}, a spot an item can be dragged back out to */
function dragHold(mode,rerender,ext){
  const conts=[['p',G.board,holdCap()],['l',G.locker,LOCK]].map(([side,list,cap])=>({side,list,cap,el:app.querySelector(`.dock .board[data-side="${side}"]`)})).filter(c=>c.el&&c.list);
  const sellId=mode==='port'?'leave':mode==='spoils'?'sailon':null;
  conts.forEach(src=>src.el.querySelectorAll('.item').forEach(el=>{const si=+el.dataset.i;arm(el,src.list[si],src,si,null)}));
  if(ext&&ext.from)ext.from.forEach(f=>arm(f.el,f.it,null,-1,f));
  function arm(el,it,src,si,xin){
    el.addEventListener('pointerdown',e=>{
      if(e.button>0||G.moving)return;
      const sx=e.clientX,sy=e.clientY;let drag=null;
      const move=ev=>{if(!drag){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;drag=start(ev)}ev.preventDefault();follow(ev)};
      const up=ev=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(drag)finish(ev.type==='pointercancel')};
      window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
      function start(ev){
        const r=el.getBoundingClientRect();let ghost,w=r.width,h=r.height,ox=ev.clientX-r.left,oy=ev.clientY-r.top;
        if(xin){const t=tileSize(DEFS[it.k].s);w=t.w;h=t.h;ox=w/2;oy=h/2;ghost=document.createElement('div');ghost.className=`item t${it.t}${isPassive(it.k)?' passive':''}`;
          ghost.innerHTML=`<span class="fill"></span>${emb(it.k)}<span class="ico">${icon(it.k)}</span><span class="nm">${DEFS[it.k].n}</span><span class="cdt">${isPassive(it.k)?'···':DEFS[it.k].cd+'s'}</span>`}
        else ghost=el.cloneNode(true);
        ghost.classList.remove('aff','src');ghost.querySelectorAll('.afflbl').forEach(x=>x.remove());ghost.classList.add('ghost');ghost.style.width=w+'px';ghost.style.height=h+'px';
        document.body.appendChild(ghost);el.classList.add('dragging');
        const marks=conts.map(c=>{const m=document.createElement('div');m.className='dropmark';c.el.appendChild(m);return m});
        conts.forEach(c=>c.el.classList.add('droppable'));
        let sell=null,back=null;
        if(!xin&&sellId){const b=document.getElementById(sellId);if(b){sell=b;sell.dataset.label=sell.textContent;sell.classList.add('sellzone');sell.textContent=`Drop here to sell for ${sellP(it.k,it.t)} gold`}}
        if(!xin&&ext&&ext.back&&ext.back.ok(it)){back=ext.back.el;back.classList.add('backzone')}
        return{ghost,marks,sell,back,it,ox,oy,lx:ev.clientX,tilt:0,tgt:null,dst:null,full:false,overSell:false,overBack:false};
      }
      function follow(ev){
        const d=drag,vx=ev.clientX-d.lx;d.lx=ev.clientX;d.ly=ev.clientY;
        d.tilt=Math.max(-14,Math.min(14,d.tilt*.7+vx*.9));
        d.ghost.style.transform=`translate(${ev.clientX-d.ox}px,${ev.clientY-d.oy}px) rotate(${d.tilt}deg) scale(1.14)`;
        const over=(b,m)=>{if(!b)return false;const r=b.getBoundingClientRect();return ev.clientY>=r.top-m&&ev.clientY<=r.bottom+m&&ev.clientX>=r.left&&ev.clientX<=r.right};
        d.overSell=over(d.sell,8);if(d.sell)d.sell.classList.toggle('hot',d.overSell);
        d.overBack=over(d.back,0);if(d.back)d.back.classList.toggle('hot',d.overBack);
        let tgt=null,best=1e9;
        if(!d.overSell&&!d.overBack)conts.forEach(c=>{const r=c.el.getBoundingClientRect();if(ev.clientY>=r.top-26&&ev.clientY<=r.bottom+26){const dd=Math.abs(ev.clientY-(r.top+r.bottom)/2);if(dd<best){best=dd;tgt=c}}});
        conts.forEach((c,k)=>{c.el.classList.toggle('over',c===tgt);if(c!==tgt)d.marks[k].style.display='none'});
        d.tgt=tgt;if(!tgt){d.dst=null;return}
        const mark=d.marks[conts.indexOf(tgt)],br=tgt.el.getBoundingClientRect();
        d.full=tgt!==src&&!(xin&&findMatch(it))&&used(tgt.list)+DEFS[d.it.k].s>tgt.cap;
        tgt.el.classList.toggle('full',d.full);
        const items=[...tgt.el.querySelectorAll('.item:not(.ghost)')].filter(x=>!(tgt===src&&+x.dataset.i===si));
        let dst=tgt.list.length,x=null;
        for(const it of items){const r=it.getBoundingClientRect();if(ev.clientX<r.left+r.width/2){dst=+it.dataset.i;x=r.left-br.left-3;break}}
        if(x==null){const last=items[items.length-1];x=last?last.getBoundingClientRect().right-br.left+1:6}
        d.dst=dst;mark.style.display='block';mark.classList.toggle('no',d.full);
        if(mark.dataset.x!==String(Math.round(x))){mark.dataset.x=Math.round(x);mark.style.left=x+'px';mark.classList.remove('pop');void mark.offsetWidth;mark.classList.add('pop')}
      }
      function finish(cancel){
        const d=drag;dragJustEnded=true;setTimeout(()=>dragJustEnded=false,60);
        d.ghost.remove();d.marks.forEach(m=>m.remove());el.classList.remove('dragging');conts.forEach(c=>c.el.classList.remove('droppable','over','full'));
        if(d.sell){d.sell.textContent=d.sell.dataset.label;d.sell.classList.remove('sellzone','hot')}
        if(d.back)d.back.classList.remove('backzone','hot');
        if(cancel)return;
        if(d.overSell){const g=sellP(d.it.k,d.it.t),x=d.lx,y=d.ly;G.gold+=g;src.list.splice(si,1);save();toast(`Sold ${DEFS[d.it.k].n}`);rerender();sellFx(x,y,g);return}
        if(d.overBack){ext.back.put(d.it);rerender();return}
        const tgt=d.tgt;if(!tgt||d.dst==null)return;
        if(d.full)return toast(tgt.side==='l'?'No room in the locker.':'No room in the hold.');
        let dst=d.dst;
        if(xin){const at=xin.drop(tgt,dst);rerender();if(at!=null){const m=app.querySelectorAll(`.dock .board[data-side="${tgt.side}"] .item`)[at];if(m)squish(m,'land')}return}
        if(tgt===src){if(dst>si)dst--;if(dst===si)return;src.list.splice(si,1);src.list.splice(dst,0,d.it)}
        else{src.list.splice(si,1);tgt.list.splice(dst,0,d.it)}
        save();rerender();
        const moved=app.querySelectorAll(`.dock .board[data-side="${tgt.side}"] .item`)[dst];if(moved)squish(moved,'land');coach('moved');
      }
    });
  }
}
/* the size of an item tile in the docked hold, for an item of size s */
function tileSize(s){const b=app.querySelector('.dock .board[data-side="p"]');if(!b)return{w:40*s,h:66};
  const cs=getComputedStyle(b),gap=parseFloat(cs.columnGap)||4,cell=(b.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(HOLD-1)*gap)/HOLD,c=b.firstElementChild;
  return{w:cell*s+gap*(s-1),h:c?c.getBoundingClientRect().height:66}}
function holdDock(extra,ups,lups,hint){
  hint=G.moving?'Tap an item to put it there, or an empty slot to send it to the end.':hint||`Drag to ${G.locker?'move between hold and locker':'rearrange'}${G.inPort?', or onto Set sail to sell':''}. Tap to inspect.`;
  return`<footer class="cta dock"><div class="inner">
    <div class="stall-head"><h2>Your hold</h2><span class="soft">${used(G.board)}/${holdCap()} slots</span></div>
    <p class="hint${G.moving?' on':''}">${hint}</p>
    ${boardHTML(G.board,'p',ups)}
    ${G.locker?`<div class="stall-head locker-head"><h3>Locker <span class="soft">stays out of fights</span></h3><span class="soft">${used(G.locker)}/${LOCK}</span></div>${boardHTML(G.locker,'l',lups,LOCK)}`:''}
    ${G.crew?`<button class="crewbar" id="crewbar" type="button" aria-label="Your crew"><span class="cb-l">Crew</span>${G.crew.map(c=>`<span class="cb-c" title="${CREW[c.k].n}">${crewFace(c.k)}</span>`).join('')}${Array.from({length:Math.max(0,berths()-G.crew.length)},()=>'<span class="cb-c empty"></span>').join('')}<span class="cb-cr">${[...crewCrafts()].map(craftIcon).join('')}</span></button>`:''}
    ${extra}</div></footer>`;
}
function fitDock(){const d=app.querySelector('.dock');if(d){app.style.paddingBottom=(d.offsetHeight+18)+'px';document.documentElement.style.setProperty('--dock',d.offsetHeight+'px')}}
addEventListener('resize',fitDock);
/* desktop keys: Esc closes the top pop-up (like tapping outside it) or a tip, and otherwise pauses. P pauses and resumes. 1, 2 and 4 set fight speed */
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||(e.target.closest&&e.target.closest('input,textarea')))return;
  const ovs=document.querySelectorAll('.overlay'),top=ovs[ovs.length-1];
  if(e.key==='p'||e.key==='P'){if(PAUSE.on)resumePause();else if(!top)showPause();return}
  if(e.key==='Escape'){if(top)top.dispatchEvent(new MouseEvent('click',{bubbles:true}));else{const x=document.querySelector('#coach .cnext');if(x)x.click();else showPause()}return}
  if(B&&!B.over&&!top){const b=app.querySelector(`[data-sp="${e.key}"]`);if(b)b.click()}
});
/* ---------- pause (like Ink Nine and Ink Rally) ----------
   Freezes fights and fishing: both read the clock through pauseClock(), which stops while paused. */
const PAUSE={on:false,since:0,total:0,ov:null};
const pauseClock=()=>(performance.now()-PAUSE.total-(PAUSE.on?performance.now()-PAUSE.since:0))/1000;
function showPause(){
  if(PAUSE.on||!G||!app.querySelector(':scope>.bar,:scope>.charthead>.bar'))return;
  PAUSE.on=true;PAUSE.since=performance.now();
  const fighting=B&&!B.over,fishing=!!app.querySelector('#pond');
  const note=G.tut?'The maiden voyage is not saved, so leaving starts it over next time.'
    :`Your voyage is saved. Pick it up from the title screen whenever you like.${fighting?' If you leave now, this fight starts over when you come back.':fishing?' If you leave now, the casts you have left are lost.':''}`;
  const ov=PAUSE.ov=overlay(`<h2>Paused</h2><p class="soft">${G.tut?'The maiden voyage':`${SEAS[G.sea]}, day ${G.day}. Voyage ${codeOf(G.seed)}`}</p><p>${note}</p>
    <button class="primary" data-p="go">Keep sailing</button><button class="ghost" data-p="home">${G.tut?'Leave the maiden voyage':'Save and go to the title'}</button>
    <p class="ver">Version ${VERSION}.${feedbackLink('fbPause')}</p>`,true,'pausecard');
  ov.addEventListener('click',e=>{if(e.target===ov)return resumePause();const b=e.target.closest('[data-p]');if(!b)return;
    if(b.dataset.p==='go')resumePause();else leaveToTitle()});
  const fb=ov.querySelector('#fbPause');if(fb)fb.onclick=()=>{resumePause();showFeedback()};
  ov.querySelector('[data-p="go"]').focus();
}
function resumePause(){if(!PAUSE.on)return;PAUSE.total+=performance.now()-PAUSE.since;PAUSE.on=false;if(PAUSE.ov)PAUSE.ov.remove();PAUSE.ov=null}
function leaveToTitle(){
  resumePause();cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;hideCoach();
  document.querySelectorAll('.overlay,.hullcard').forEach(o=>o.remove());
  if(G&&!G.tut)save();G=null;title();
}
/* switching away mid-fight or mid-cast pauses the game, like Ink Rally */
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&((B&&!B.over)||app.querySelector('#pond')))showPause()});
