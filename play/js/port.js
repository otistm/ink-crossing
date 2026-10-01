/* Ink Crossing: Ports: market, fish market, dock visitors. */
"use strict";
/* ---------- port ---------- */
/* which part of the port you're looking at: the drawn harbour, or one of its buildings. Kept while you stay in the same port. */
let PV={id:null,view:'harbour'};
addEventListener('resize',()=>{if(document.getElementById('stall'))layStall()});
const BLD={market:'Market',tavern:'Tavern',wright:'Shipwright',docks:'Docks'};
function port(id,view){
  cancelAnimationFrame(raf);B=null;G.inPort=true;
  const n=node(id);
  if(!G.shops[id]){const r=RNG(G.seed,'shop',id,G.shopVisit||0),sk=sellerOf(id);G.shops[id]={seller:sk,offers:Array.from({length:4},(_,i)=>stallItem(r,depthOf(n),sk,i)),reroll:1};
    // the first port of a voyage stocks your ship's own gear and hands, so a bare ship can always be outfitted for its style
    if(!G.tut&&G.sea===0&&id===G.map.start&&G.path.length===1){const sh=SHIPS[G.ship];sh.start.forEach((x,i)=>G.shops[id].offers[i]={k:x.k,t:x.t});
      const pool=Object.keys(CREW).filter(k=>!(sh.crew||[]).includes(k));G.shops[id].tavern=(sh.crew||[]).concat(pool[ri(r,pool.length)])}
    fresh=true;G.freeRoll=true;logL(`Docked at ${n.name}.`);
    const pool=Object.keys(FISH).filter(k=>FISH[k].sea===G.sea);G.shops[id].demand=pool[ri(r,pool.length)];
    const msg=[];
    if(G.quest==='letter'){G.quest=null;G.gold+=15;bump='gold';logL(`Delivered Wet Jack's letter at ${n.name}. His girl cried, then paid me 15 gold.`);msg.push('Delivered the letter: +15 gold')}
    const wg=payWages();if(wg)msg.push(wg);
    if(msg.length)setTimeout(()=>toast(msg.join('. ')),250)}
  const S=G.shops[id];
  if(view==null)view=PV.id===id?PV.view:(G.tut?'market':'harbour');PV={id,view,hx:PV.id===id?PV.hx:null,scroll:PV.id===id?PV.scroll:null,tsel:PV.id===id?PV.tsel:null,msel:PV.id===id?PV.msel:null,wsel:PV.id===id?PV.wsel:null,dsel:PV.id===id?PV.dsel:null};
  if(G.sel==null)G.moving=false;
  const anim=fresh;fresh=false;
  const vis=!G.hock&&n.row===0&&G.sea<=1?'hock':n.visitor;
  if(G.tut&&id!==900)n.visitor=null;
  const ups=new Set();S.offers.forEach(o=>{if(!o)return;const j=matchIdx(o);if(j>=0)ups.add(j)});
  // the shipwright's two fittings for this visit, seeded like the first market offers
  if(!G.tut&&!S.fits){const r=RNG(G.seed,'wright',id,G.shopVisit||0),pool=Object.keys(FITTINGS).filter(k=>!hasF(k));S.fits=[];
    // the wright's own speciality goes on the bench first
    const mine=pool.filter(k=>FITTINGS[k].spot===WRIGHTS[wrightOf(id)].spot);if(mine.length){const k=mine[ri(r,mine.length)];S.fits.push(k);pool.splice(pool.indexOf(k),1)}
    while(S.fits.length<(hasP('wright')?3:2)&&pool.length)S.fits.push(pool.splice(ri(r,pool.length),1)[0])}
  const rr=S.reroll+(hasF('lion')?1:0);
  // the tavern's hires for this visit, seeded like the market
  if(!G.tut&&!S.tavern){const r=RNG(G.seed,'tavern',id,G.shopVisit||0),pool=Object.keys(CREW).filter(k=>!(G.crew||[]).some(c=>c.k===k));S.tavern=[];
    while(S.tavern.length<(hasP('recruiter')?4:3)&&pool.length)S.tavern.push(pool.splice(ri(r,pool.length),1)[0])}
  const marketH=stallHTML(S,id,anim);
  const info=harbourInfo(S,vis);
  const page=view==='harbour'?`${harbourScene(info)}<p class="tapnote">Tap a place to go in. Swipe or use the arrows to walk along the quay.</p>`
    :`<nav class="bldnav" aria-label="Port">${Object.entries(BLD).map(([k,t])=>`<button class="bldtab${k===view?' on':''}" data-bld="${k}"${k===view?' aria-current="page"':''}>${t}${info[k].badge?`<span class="bdg">${info[k].badge}</span>`:''}</button>`).join('')}<button class="bldtab home" data-bld="harbour"><svg class="hic" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>Harbour</button></nav>
      ${view==='market'?marketH:view==='tavern'?(G.tut?'':tavernHTML(S)):view==='wright'?(G.tut?'':wrightHTML(S,id,anim)):docksHTML(S,id,vis,anim)}`;
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${n.name}</h2><span>${SEAS[G.sea]}</span></div>
  ${page}
  ${holdDock(`<button class="primary" id="leave">Set sail</button>`,ups,lockerUps(S.offers),view==='market'?'Drag goods off the table into your hold to buy.':undefined)}`;
  // the market's goods drag straight off the table into the hold or locker, paying as they land
  const buyInto=(i,tgt,dst)=>{const o=S.offers[i],p=buyP(o);if(G.gold<p){toast(`Need ${p-G.gold} more gold`);return null}
    let at=null;if(findMatch(o)){const m=findMatch(o);addItem(o);toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`)}else{tgt.list.splice(dst,0,{k:o.k,t:o.t});seen(o.k);at=dst}
    G.gold-=p;S.offers[i]=null;PV.msel=null;bump='gold';save();setTimeout(()=>coach('bought'));return at};
  bindBar();bindHold('port',()=>port(id,view),view==='market'?{from:[...app.querySelectorAll('.good[data-g]')].map(el=>({el,it:S.offers[+el.dataset.g],drop:(tgt,dst)=>buyInto(+el.dataset.g,tgt,dst)}))}:null);fitDock();
  const rb=document.getElementById('reroll');if(rb)rb.onclick=()=>{
    if(hasC('route')&&G.freeRoll){G.freeRoll=false}
    else{if(G.gold<rr)return toast(`Need ${rr-G.gold} more gold`);G.gold-=rr;S.reroll++;bump='gold'}
    S.offers=Array.from({length:4},(_,i)=>stallItem(Math.random,depthOf(n),sellerOf(id),i));PV.msel=null;fresh=true;save();port(id,view)};
  app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>itemSheet([S.offers[+b.dataset.v]],0,'view',()=>{}));
  app.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const i=+b.dataset.b,o=S.offers[i],p=buyP(o);
    if(G.gold<p)return toast(`Need ${p-G.gold} more gold`);
    const m=findMatch(o),r=addItem(o);if(!r)return toast(`No room for size ${DEFS[o.k].s}${G.locker?' in your hold or locker':''}. Sell something first.`);
    if(r==='up')toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`);
    if(r==='locker')toast(`Hold full. Stowed the ${DEFS[o.k].n} in your locker.`);
    G.gold-=p;S.offers[i]=null;PV.msel=null;bump='gold';save();port(id,view);coach('bought')});
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.g;if(b.classList.contains('sel'))return itemSheet([S.offers[i]],0,'view',()=>{});PV.msel=i;port(id,view)});
  document.getElementById('leave').onclick=()=>{G.moving=false;G.sel=null;if(G.tut&&G.tut.i>=TUT.length-1)return finishTutorial();
    const bare=!G.tut&&(!G.board.length||!(G.crew||[]).length);if(!bare)return chart();
    const ov=overlay(`<h2>Sail like this?</h2><p>${!G.board.length&&!(G.crew||[]).length?'Your hold is empty and nobody is aboard.':!G.board.length?'Your hold is empty. Nothing will fire in a fight.':'Nobody is aboard to work your cargo, so none of it will fire in a fight.'}</p>
      <div class="sh-actions"><button class="ghost" data-a="stay">Stay in port</button><button class="primary" data-a="go">Set sail</button></div>`,true);
    ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')chart()})};
  const vb=document.getElementById('visitor');if(vb)vb.onclick=()=>talk(vis,id+'v',()=>port(id,view),()=>{S.talked=true});
  const hb=document.getElementById('hockin');if(hb)hb.onclick=()=>talk('hock2',id+'h',()=>port(id,view));
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const i=+b.dataset.f,f=G.creel[i],g=fishVal(f,f===S.demand?2:1);G.creel.splice(i,1);G.gold+=g;bump='gold';logL(`Sold ${an(FISH[f].n)} for ${g} gold.`);save();toast(`Sold ${an(FISH[f].n)} for ${g} gold`);port(id,view)});
  const sa=document.getElementById('sellall');if(sa)sa.onclick=()=>{const g=G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0);G.creel=[];G.gold+=g;bump='gold';logL(`Sold my catch at ${n.name} for ${g} gold.`);save();toast(`Sold your catch for ${g} gold`);port(id,view)};
  app.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.fit,k=S.fits[i],f=FITTINGS[k];
    if(G.gold<f.p)return toast(`Need ${f.p-G.gold} more gold`);
    if(!canEquip(k))return toast('Double Planking boards up a slot. Sell something to make room first.');
    G.gold-=f.p;const back=equip(k);S.fits[i]=null;PV.wsel=null;bump='gold';save();toast(`Fitted ${f.n}${back?`. Sold the old one for ${back} gold`:''}`);port(id,view)});
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const n=b.dataset.r==='all'?repairable():1;
    if(n<1||G.gold<n*repairCost())return toast(G.hull>=HULL_MAX?'The hull is already sound.':`Need ${n*repairCost()-G.gold} more gold`);
    G.gold-=n*repairCost();G.hull+=n;bump='hull';logL(`Paid the shipwright ${n*repairCost()} gold to repair ${n} hull.`);save();toast(`Repaired ${n} hull`);port(id,view)});
  const yb=document.getElementById('yourship');if(yb)yb.onclick=shipSheet;const yc=document.getElementById('yourcrew');if(yc)yc.onclick=shipSheet;
  app.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const i=+b.dataset.hire,k=S.tavern[i],C=CREW[k];
    if((G.crew||[]).length>=berths())return toast('Your deck is full. Dismiss someone on the ship card first.');
    if(G.gold<feeOf(k))return toast(`Need ${feeOf(k)-G.gold} more gold`);
    G.gold-=feeOf(k);hire(k);S.tavern[i]=null;bump='gold';save();toast(`${C.n} joins the crew`);port(id,view)});
  if(view==='harbour')bindHarbour();
  if(view!=='harbour'){layStall();requestAnimationFrame(layStall)}
  app.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>{PV.dsel=b.dataset.ds;port(id,view)});
  app.querySelectorAll('[data-df]').forEach(b=>b.onclick=()=>{PV.dsel=+b.dataset.df;port(id,view)});
  app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const v=b.dataset.w;PV.wsel=v==='r'?'r':+v;port(id,view)});
  app.querySelectorAll('[data-sel]').forEach(b=>{const go=()=>{PV.tsel=+b.dataset.sel;port(id,view)};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  app.querySelectorAll('[data-bld]').forEach(b=>{const go=()=>port(id,b.dataset.bld);b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  if(view!=='harbour'&&PV.scroll!==view){PV.scroll=view;scrollTo(0,0)}
  save();coach('port');tip('port');tip('crew');tip('wright');
}
/* the market: a seller's stall. The seller stands behind the table with their speech bubble beside them, and the day's goods sit
   out on the table below; tap one and it lifts while the seller tells you about it, with the Buy button. Tap it again for its sheet. */
function stallHTML(S,id,anim){const sk=sellerOf(id),P=SELLERS[sk],rr=S.reroll+(hasF('lion')?1:0);
  let sel=PV.msel;if(sel==null||!S.offers[sel])sel=S.offers.findIndex(Boolean);
  const o=sel>=0?S.offers[sel]:null;
  const goods=S.offers.map((g,i)=>{if(!g)return`<span class="good gone" aria-label="Sold"><span class="o-icon"></span><span class="ptag">sold</span></span>`;
    const d=DEFS[g.k],up=!!findMatch(g);
    return`<button class="good${i===sel?' sel':''}${anim?' in':''}" data-g="${i}" style="animation-delay:${i*70}ms" aria-label="${d.n}, ${TIER[g.t]}, ${buyP(g)} gold${i===sel?', selected':''}"><span class="o-icon t${g.t}">${emb(g.k)}${icon(g.k)}${up?CHEV:''}</span><span class="ptag">${sicon('gold')}${buyP(g)}</span></button>`}).join('');
  let talk;
  if(o){const d=DEFS[o.k],p=buyP(o),up=!!findMatch(o),poor=G.gold<p;
    talk=`<div class="talk" id="talk"><p class="say">“${poor?P.broke:up?P.up:pitch(sk,o)}”</p>
      <p class="who"><b>${d.n}</b><span class="chipc">${TIER[o.t]}</span><span class="chipc">size ${d.s}</span>${d.cd?`<span class="chipc">${d.cd}s</span>`:''}</p>
      <p class="desc">${describe([o],0).L.join(' ')}</p>
      <button class="buy${up?' up':''}" data-b="${sel}" ${poor?'aria-disabled="true"':''}>${up?'Upgrade':'Buy'} for ${p} gold</button></div>`}
  else talk=`<p class="talk quiet" id="talk">“${P.out}”</p>`;
  // the back wall: two shelves of crates, sacks, jars and barrels, drawn as tiles so it fills any width
  const shelf=`<pattern id="stock" width="132" height="58" patternUnits="userSpaceOnUse"><g fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round">
      <rect x="6" y="22" width="30" height="32"/><path d="M6 32h30M6 44h30" fill="none"/>
      <path d="M44 54q-6-14 2-26q6-6 12 0q8 12 2 26z"/><path d="M47 30q5 3 10 0" fill="none"/>
      <rect x="70" y="34" width="14" height="20" rx="3"/><rect x="73" y="28" width="8" height="6"/>
      <path d="M92 54q-3-14 0-28h22q3 14 0 28z"/><path d="M91 34h24M91 46h24" fill="none"/></g></pattern>`;
  return`<section class="stallsec">
    <div class="stall" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs>${shelf}<pattern id="awn" width="44" height="34" patternUnits="userSpaceOnUse"><path d="M0 0h22v22q-11 12-22 0z" fill="#000"/><path d="M22 0h22v22q-11 12-22 0z" fill="#fff" stroke="#000" stroke-width="2"/></pattern></defs>
        <rect x="0" y="62" width="100%" height="58" fill="url(#stock)"/><path d="M0 120.5H4000" stroke="#000" stroke-width="3"/>
        <rect x="0" y="138" width="100%" height="58" fill="url(#stock)" transform="translate(-60 0)"/><path d="M0 196.5H4000" stroke="#000" stroke-width="3"/>
        <rect x="0" y="0" width="100%" height="34" fill="url(#awn)"/><path d="M0 1.5H4000" stroke="#000" stroke-width="3"/></svg>
      <h2 class="stallsign">${P.short}'s</h2>
      <button class="ghost more" id="reroll">Show me more<span class="cost">${hasC('route')&&G.freeRoll?'free':`${sicon('gold')}${rr}`}</span></button>
      <div class="stalltop"><div class="seller" aria-label="${P.n}, the seller">${peep(P.look,'40 22 172 150')}</div>${talk}</div>
      <div class="table"><div class="goods" id="goods">${goods}</div></div>
    </div>
  </section>`}
/* fit the stall to the room, down to the hold */
function layStall(){const room=document.getElementById('stall');if(!room)return;
  const dock=app.querySelector('.dock'),top=room.getBoundingClientRect().top,dh=dock?dock.offsetHeight:0;
  room.style.minHeight=Math.max(300,Math.round(innerHeight-top-dh-14))+'px';
  // big screens: the seller fills the space the table leaves above it
  const sel=room.querySelector('.seller');if(!matchMedia('(min-width:900px) and (min-height:560px)').matches){sel.style.cssText='';return}
  const h=Math.round(Math.min(280,Math.max(140,room.clientHeight-room.querySelector('.goods').offsetHeight-44-54)));
  sel.style.height=h+'px';sel.style.width=Math.round(h*172/150)+'px'}
/* the docks: laid out like the market. The fishmonger stands at their crates with a speech bubble beside them; your catch is
   laid out on the crates below. Anyone else on the dock (a visitor, Hock with his quest) waits in the corner: tap them and
   they step up to talk instead. PV.dsel is who's talking ('m' or a person) or which fish you picked. */
function docksHTML(S,id,vis,anim){const mk=mongerOf(id),M=MONGERS[mk],pay=f=>fishVal(f,f===S.demand?2:1),tot=G.creel.reduce((a,f)=>a+pay(f),0);
  const people=[];if(vis&&!S.talked)people.push({k:'vis',npc:vis,btn:'visitor'});if(G.hock==='active')people.push({k:'hock',npc:'hock2',btn:'hockin'});
  let sel=PV.dsel;if(sel==null||(typeof sel==='number'&&!G.creel[sel])||(typeof sel==='string'&&sel!=='m'&&!people.some(p=>p.k===sel)))sel=people.length?people[0].k:G.creel.length?0:'m';
  if(sel==='m'&&G.creel.length)sel=0;
  const who=people.find(p=>p.k===sel),N=who&&NPCS[who.npc];
  const goods=G.creel.length?G.creel.map((f,i)=>`<button class="good fishgood${i===sel?' sel':''}${anim?' in':''}" data-df="${i}" style="animation-delay:${Math.min(i,6)*50}ms" aria-label="${FISH[f].n}, ${pay(f)} gold${f===S.demand?', in demand':''}${i===sel?', selected':''}"><span class="o-icon plain">${fishSVG(f)}${f===S.demand?'<span class="want">2×</span>':''}</span><span class="ptag">${sicon('gold')}${pay(f)}</span></button>`).join('')
    :'<p class="soft cratenote">Your creel is empty. Fish at a fishing ground and sell your catch here.</p>';
  let talk;
  if(who)talk=`<div class="talk" id="talk"><p class="say">“${N.x}”</p><p class="who"><b>${N.n}</b><span class="chipc">${who.k==='hock'?'Quest':N.role}</span></p>
      <button class="buy" id="${who.btn}">Talk to ${N.n.split(' ')[0]==='The'?'them':N.n}</button></div>`;
  else if(typeof sel==='number'){const f=G.creel[sel],F=FISH[f],dem=f===S.demand;
    talk=`<div class="talk" id="talk"><p class="say">“${dem?M.demand:M.say[F.rar]||M.say[0]}”</p><p class="who"><b>${F.n}</b><span class="chipc">${RAR[F.rar]}</span>${dem?'<span class="chipc">in demand</span>':''}</p>
      <div class="acts"><button class="buy" data-f="${sel}">Sell for ${pay(f)} gold</button>${G.creel.length>1?`<button class="linkbtn" id="sellall">Sell all ${G.creel.length} for ${tot}</button>`:''}</div></div>`}
  else talk=`<div class="talk" id="talk"><p class="say">“${M.empty}”</p>${S.demand?`<p class="desc">Paying double for ${FISH[S.demand].n} today.</p>`:''}</div>`;
  const face=(k,look,lbl,on)=>`<button class="pchip${on?' on':''}" data-ds="${k}" aria-label="${lbl}">${peep(look,PEEP_HEAD,'peep')}</button>`;
  const speaker=who?N.look:M.look;
  return`<section class="stallsec docksec">
    <div class="stall pier" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs><pattern id="swell" width="60" height="16" patternUnits="userSpaceOnUse"><path d="M0 8q15-8 30 0t30 0" fill="none" stroke="#000" stroke-width="1.6"/></pattern></defs>
        <path d="M0 96H4000" stroke="#000" stroke-width="2.4"/><rect x="0" y="104" width="100%" height="100" fill="url(#swell)" opacity=".5"/>
        <g fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"><path d="M60 92l14-30v30zM74 62l10 30H74"/><path d="M52 92h40l-6 6H58z"/></g>
        <path d="M150 50q6-5 12 0q6-5 12 0M210 38q5-4 10 0q5-4 10 0" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>
      <h2 class="stallsign">${M.short}'s fish</h2>
      <div class="pchips">${face('m',M.look,`${M.n}, the fishmonger`,!who)}${people.map(p=>face(p.k,NPCS[p.npc].look,`${NPCS[p.npc].n}, on the dock`,p===who)).join('')}</div>
      <div class="stalltop"><div class="seller" aria-label="${who?N.n:M.n}">${peep(speaker,'40 22 172 150')}</div>${talk}</div>
      <div class="table crates"><div class="goods" id="goods">${goods}</div></div>
    </div>
  </section>`}
/* the tavern: laid out like the market. Whoever you're talking to stands at the bar with their speech bubble beside them (their
   pitch, crafts, wage and the Hire button); everyone looking for work sits along the bar below. Tap one and they step up. */
function tavernHTML(S){const full=(G.crew||[]).length>=berths();
  let sel=PV.tsel;if(sel==null||!S.tavern[sel])sel=S.tavern.findIndex(Boolean);
  const k=sel>=0?S.tavern[sel]:null,C=k&&CREW[k];
  const hands=S.tavern.map((h,i)=>{if(!h)return`<span class="good handgood gone" aria-label="Hired"><span class="o-icon"></span><span class="ptag">hired</span></span>`;
    return`<button class="good handgood${i===sel?' sel':''}" data-sel="${i}" aria-label="${CREW[h].n}, ${feeOf(h)} gold${i===sel?', talking':''}"><span class="o-icon plain">${crewFace(h)}</span><span class="ptag">${sicon('gold')}${feeOf(h)}</span></button>`}).join('');
  const talk=C?`<div class="talk" id="talk"><p class="say">“${C.say||'Looking for a berth, captain.'}”</p>
      <p class="who"><b>${C.n}</b> ${crewCrafts1(k)}</p>
      <p class="terms">Lets your cargo use ${C.crafts.map(c=>`<b>${CRAFTS[c]}</b>`).join(' and ')}. Wage ${wageOf(k)} gold a port.</p>
      <button class="buy" data-hire="${sel}" ${full||G.gold<feeOf(k)?'aria-disabled="true"':''}>${full?'Your deck is full':`Hire for ${feeOf(k)} gold`}</button></div>`
    :'<div class="talk" id="talk"><p class="say">“Everyone here has signed on. The bar is quiet.”</p></div>';
  // the back wall: shelves of bottles and mugs, tiled so it fills any width
  const bottles=`<pattern id="bottles" width="102" height="64" patternUnits="userSpaceOnUse"><g fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round">
      <path d="M8 62V40q0-6 5-8V20h6v12q5 2 5 8v22z"/><path d="M32 62V30q0-5 4-6v-8h5v8q4 1 4 6v32z"/>
      <path d="M54 62V46h16v16z"/><path d="M70 50c7 0 7 9 0 9" fill="none"/><path d="M80 62V36q0-6 6-8V18h4v10q6 2 6 8v26z"/></g></pattern>`;
  return`<section class="stallsec tavern">
    <div class="stall inn" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs>${bottles}</defs>
        <rect x="0" y="0" width="100%" height="30" fill="#000"/><path d="M0 9H4000M0 20H4000" stroke="#fff" stroke-width="1.4" stroke-dasharray="40 14"/>
        <rect x="0" y="58" width="100%" height="64" fill="url(#bottles)"/><path d="M0 122.5H4000" stroke="#000" stroke-width="3"/>
        <rect x="0" y="138" width="100%" height="64" fill="url(#bottles)" transform="translate(-50 0)"/><path d="M0 202.5H4000" stroke="#000" stroke-width="3"/></svg>
      <h2 class="stallsign">Tavern <span class="soft">${(G.crew||[]).length}/${berths()}</span></h2>
      <button class="ghost more" id="yourcrew">Your crew</button>
      <div class="stalltop">${C?`<div class="seller" aria-label="${C.n}">${peep(C.look,'40 22 172 150')}</div>`:''}${talk}</div>
      <div class="table bench bartop"><div class="goods" id="goods">${hands}</div></div>
    </div>
  </section>`}
const buyP=o=>Math.max(1,price(o.k,o.t)-(hasP('haggler')?1:0));
/* what each building has for you right now: a badge and a few words for screen readers */
function harbourInfo(S,vis){const n=S.offers.filter(Boolean).length,h=(S.tavern||[]).filter(Boolean).length,f=(S.fits||[]).filter(Boolean).length,hurt=G.hull<HULL_MAX,
  who=(vis&&!S.talked)||G.hock==='active';
  return{market:{badge:n||'',say:`${n} for sale`,n},tavern:{badge:G.tut?'':h||'',say:G.tut?'closed':`${h} for hire`,h:G.tut?0:h},
    wright:{badge:G.tut?'':hurt?'!':f||'',say:G.tut?'closed':`${f} fittings${hurt?', hull needs repair':''}`,f:G.tut?0:f},
    docks:{badge:who?'!':G.creel.length||'',say:`${who?'someone is waiting':'nobody waiting'}${G.creel.length?`, ${G.creel.length} fish to sell`:''}`,who,fish:G.creel.length}}}
/* how much hull you can afford to repair, up to the most the shipwright will fix */
const repairable=()=>Math.max(0,Math.min(HULL_MAX-G.hull,Math.floor(G.gold/repairCost())));
/* the shipwright: a yard laid out like the market stall. The wright stands at their workbench with a speech bubble beside them;
   on the bench are the fittings for sale and a mallet for hull repairs. Tap one and they tell you about it, with the button. */
const REPAIRG='<path class="w" d="M3 19h24v6H3z"/><path d="M7 19v6M15 19v6M23 19v6" stroke-width="1.2"/><path class="w" d="M15 4h10v6H15z"/><path d="M20 10l-7 9" stroke-width="2.4"/>';
function wrightHTML(S,id,anim){const wk=wrightOf(id),W=WRIGHTS[wk],all=repairable(),hurt=G.hull<HULL_MAX;
  let sel=PV.wsel;if(sel==null||(sel!=='r'&&!S.fits[sel]))sel=S.fits.findIndex(Boolean);if(sel<0)sel='r';
  const tag=t=>`<span class="ptag">${t}</span>`;
  const goods=S.fits.map((k,i)=>{if(!k)return`<span class="good gone" aria-label="Fitted"><span class="o-icon"></span>${tag('fitted')}</span>`;
      const f=FITTINGS[k];
      return`<button class="good fitgood${i===sel?' sel':''}${anim?' in':''}" data-w="${i}" style="animation-delay:${i*70}ms" aria-label="${f.n}, ${f.p} gold${i===sel?', selected':''}"><span class="o-icon plain">${fitGlyph(k)}</span>${tag(`${sicon('gold')}${f.p}`)}</button>`}).join('')
    +`<button class="good fitgood${sel==='r'?' sel':''}${anim?' in':''}" data-w="r" style="animation-delay:${S.fits.length*70}ms" aria-label="Hull repairs${sel==='r'?', selected':''}"><span class="o-icon plain"><svg viewBox="0 0 30 30" class="gl" aria-hidden="true">${REPAIRG}</svg></span>${tag(hurt?`${sicon('gold')}${repairCost()} each`:'sound')}</button>`;
  let talk;
  if(sel==='r'){
    talk=`<div class="talk" id="talk"><p class="say">“${!hurt?W.full:G.gold<repairCost()?W.broke:W.repair}”</p>
      <p class="who"><b>Hull repairs</b><span class="chipc">hull ${G.hull}/${HULL_MAX}</span></p>
      ${hurt?`<div class="acts"><button class="buy" data-r="${all>1?'all':1}" ${all<1?'aria-disabled="true"':''}>Repair ${Math.max(1,all)} for ${Math.max(1,all)*repairCost()} gold</button>${all>1?`<button class="linkbtn" data-r="1">Just 1</button>`:''}</div>`:''}</div>`}
  else{const k=S.fits[sel],f=FITTINGS[k],old=fitIn(f.spot),ok=canEquip(k),poor=G.gold<f.p;
    talk=`<div class="talk" id="talk"><p class="say">“${!ok?W.slot:poor?W.broke:W.say[f.spot]}”</p>
      <p class="who"><b>${f.n}</b><span class="chipc">${SPOTS[f.spot]}</span>${f.hp?`<span class="chipc">${f.hp>0?'+':'−'}${Math.abs(f.hp)} health</span>`:''}</p>
      <p class="desc">${f.d}${old?` <span class="soft">Replaces your ${FITTINGS[old].n}, which sells for ${Math.floor(FITTINGS[old].p/2)}.</span>`:''}</p>
      <button class="buy" data-fit="${sel}" ${poor||!ok?'aria-disabled="true"':''}>Fit for ${f.p} gold</button></div>`}
  // the back wall: a pegboard of saws, mallets, coiled rope and planks, tiled so it fills any width
  const tools=`<pattern id="tools" width="150" height="70" patternUnits="userSpaceOnUse"><g fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M10 10h6v46h-6z"/><path d="M8 10h10M13 4v6" fill="none"/>
      <path d="M30 12h26l-4 14H30z"/><path d="M34 26v6M42 26v6M50 26v4" fill="none"/><path d="M28 12h-6v8h6" fill="none"/>
      <circle cx="80" cy="30" r="15"/><circle cx="80" cy="30" r="9"/><path d="M80 15v-9" fill="none"/>
      <path d="M108 8h14v10h-14z"/><path d="M115 18v40" fill="none"/>
      <path d="M134 10l6 50M140 10l6 50" fill="none"/></g></pattern>`;
  return`<section class="stallsec yardsec">
    <div class="stall yard" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs>${tools}</defs>
        <rect x="0" y="0" width="100%" height="30" fill="#000"/><path d="M0 9H4000M0 20H4000" stroke="#fff" stroke-width="1.4" stroke-dasharray="40 14"/>
        <rect x="0" y="54" width="100%" height="70" fill="url(#tools)"/>
        <rect x="0" y="136" width="100%" height="70" fill="url(#tools)" transform="translate(-74 0)"/></svg>
      <h2 class="stallsign">${W.short}'s yard</h2>
      <button class="ghost more" id="yourship">Your ship</button>
      <div class="stalltop"><div class="seller" aria-label="${W.n}, the shipwright">${peep(W.look,'40 22 172 150')}</div>${talk}</div>
      <div class="table bench"><div class="goods" id="goods" style="--n:${S.fits.length+1}">${goods}</div></div>
    </div>
  </section>`}
