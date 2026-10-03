/* Ink Crossing: Ports: market, fish market, dock visitors. */
"use strict";
/* ---------- port ---------- */
/* which part of the port you're looking at: the drawn harbour, or one of its buildings. Kept while you stay in the same port. */
let PV={id:null,view:'harbour'};
addEventListener('resize',()=>{if(document.getElementById('barroom'))layBar();if(document.getElementById('stall'))layStall()});
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
  if(view==null)view=PV.id===id?PV.view:(G.tut?'market':'harbour');PV={id,view,hx:PV.id===id?PV.hx:null,scroll:PV.id===id?PV.scroll:null,tsel:PV.id===id?PV.tsel:null,msel:PV.id===id?PV.msel:null,mbought:PV.id===id?PV.mbought:false,wsel:PV.id===id?PV.wsel:null,dsel:PV.id===id?PV.dsel:null,dsold:PV.id===id?PV.dsold:false};
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
  const rr=S.reroll+(fitDown('lion')?1:0);
  // the tavern's hires for this visit, seeded like the market
  if(!G.tut&&!S.tavern){const r=RNG(G.seed,'tavern',id,G.shopVisit||0),pool=Object.keys(CREW).filter(k=>!(G.crew||[]).some(c=>c.k===k));S.tavern=[];
    while(S.tavern.length<(hasP('recruiter')?4:3)&&pool.length)S.tavern.push(pool.splice(ri(r,pool.length),1)[0])}
  const marketH=stallHTML(S,id,anim);
  const info=harbourInfo(S,vis);
  const page=view==='harbour'?`${harbourScene(info)}<p class="tapnote">Tap a place to go in. Swipe or use the arrows to walk along the quay.</p>`
    :`<nav class="bldnav" aria-label="Port">${Object.entries(BLD).map(([k,t])=>`<button class="bldtab${k===view?' on':''}" data-bld="${k}"${k===view?' aria-current="page"':''}>${t}${info[k].badge?`<span class="bdg">${info[k].badge}</span>`:''}</button>`).join('')}<button class="bldtab home" data-bld="harbour"><svg class="hic" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>Harbour</button></nav>
      ${view==='market'?marketH:view==='tavern'?(tutOpen('tavern')?tavernHTML(S):'<p class="soft">The tavern is closed for the trial.</p>'):view==='wright'?(tutOpen('wright')?wrightHTML(S,id,anim):'<p class="soft">The shipwright is closed for the trial.</p>'):docksHTML(S,id,vis,anim)}`;
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${n.name}</h2><button class="scope" id="scope" aria-label="Look at the chart"><svg viewBox="0 0 24 16" aria-hidden="true"><path d="M2 9.5l13-5 1.6 4.2-13 5z"/><path d="M16.4 4l4.2-1.6 1.6 4.2-4.2 1.6"/><path d="M8 12.5l-2 3M10 11.7l2 3.8"/></svg>Chart</button><span>${SEAS[G.sea]}</span></div>
  ${page}
  ${holdDock(`<button class="primary" id="leave">Set sail</button>`,ups,lockerUps(S.offers),view==='market'?'Drag goods off the table into your hold to buy.':undefined)}`;
  // the market's goods drag straight off the table into the hold or locker, paying as they land
  const buyInto=(i,tgt,dst)=>{const o=S.offers[i],p=buyP(o);if(G.gold<p){toast(`Need ${p-G.gold} more gold`);return null}
    let at=null;if(findMatch(o)){const m=findMatch(o);addItem(o);toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`)}else{const b={k:o.k,t:o.t};tgt.list.splice(dst,0,b);seen(o.k);flash={ref:b,kind:'add'};at=dst}
    G.gold-=p;S.offers[i]=null;PV.msel=null;PV.mbought=true;bump='gold';save();setTimeout(()=>coach('bought'));return at};
  bindBar();bindHold('port',()=>port(id,view),view==='market'?{from:[...app.querySelectorAll('.good[data-g]')].map(el=>({el,it:S.offers[+el.dataset.g],drop:(tgt,dst)=>buyInto(+el.dataset.g,tgt,dst)}))}:null);fitDock();
  const rb=document.getElementById('reroll');if(rb)rb.onclick=()=>{
    if(hasC('route')&&G.freeRoll){G.freeRoll=false}
    else{if(G.gold<rr)return toast(`Need ${rr-G.gold} more gold`);G.gold-=rr;S.reroll++;bump='gold'}
    S.offers=Array.from({length:4},(_,i)=>stallItem(Math.random,depthOf(n),sellerOf(id),i));PV.msel=null;save();
    // the seller sweeps the old goods off the table and ducks under it, then thumps the new ones down one by one
    const st=app.querySelector('#stall');if(!st||matchMedia('(prefers-reduced-motion:reduce)').matches){fresh=true;return port(id,view)}
    rb.disabled=true;st.classList.add('sweeping');setTimeout(()=>{restock=true;port(id,view)},520)};
  app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>itemSheet([S.offers[+b.dataset.v]],0,'view',()=>{}));
  app.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const i=+b.dataset.b,o=S.offers[i],p=buyP(o);
    if(G.gold<p)return toast(`Need ${p-G.gold} more gold`);
    const m=findMatch(o),r=addItem(o);if(!r)return toast(`No room for size ${DEFS[o.k].s}${G.locker?' in your hold or locker':''}. Sell something first.`);
    if(r==='up')toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`);
    if(r==='locker')toast(`Hold full. Stowed the ${DEFS[o.k].n} in your locker.`);
    G.gold-=p;S.offers[i]=null;PV.msel=null;PV.mbought=true;bump='gold';save();port(id,view);coach('bought')});
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.g;if(b.classList.contains('sel'))return;PV.msel=i;PV.mbought=false;port(id,view)});
  document.getElementById('leave').onclick=()=>{G.moving=false;G.sel=null;if(G.tut&&G.tut.i>=TUT.length-1)return finishTutorial();
    const bare=!G.tut&&(!G.board.length||!(G.crew||[]).length);if(!bare)return chart();
    const ov=overlay(`<h2>Sail like this?</h2><p>${!G.board.length&&!(G.crew||[]).length?'Your hold is empty and nobody is aboard.':!G.board.length?'Your hold is empty. Nothing will fire in a fight.':'Nobody is aboard to work your cargo, so none of it will fire in a fight.'}</p>
      <div class="sh-actions"><button class="ghost" data-a="stay">Stay in port</button><button class="primary" data-a="go">Set sail</button></div>`,true);
    ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')chart()})};
  const vb=document.getElementById('visitor');if(vb)vb.onclick=()=>talk(vis,id+'v',()=>port(id,view),()=>{S.talked=true});
  const hb=document.getElementById('hockin');if(hb)hb.onclick=()=>talk('hock2',id+'h',()=>port(id,view));
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const i=+b.dataset.f,f=G.creel[i],g=fishVal(f,f===S.demand?2:1),r=(app.querySelector(`[data-df="${i}"] .o-icon`)||b).getBoundingClientRect();G.creel.splice(i,1);G.gold+=g;PV.dsold=true;logL(`Sold ${an(FISH[f].n)} for ${g} gold.`);save();port(id,view);fishSaleFx([f],[r],g)});
  const sa=document.getElementById('sellall');if(sa)sa.onclick=()=>{const g=G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0),fs=G.creel.slice(),rs=fs.map((f,i)=>{const e=app.querySelector(`[data-df="${i}"] .o-icon`);return e&&e.getBoundingClientRect()});G.creel=[];G.gold+=g;PV.dsold=true;logL(`Sold my catch at ${n.name} for ${g} gold.`);save();port(id,view);fishSaleFx(fs,rs,g)};
  app.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.fit,k=S.fits[i],f=FITTINGS[k];
    if(G.gold<f.p)return toast(`Need ${f.p-G.gold} more gold`);
    if(!canEquip(k))return toast('Double Planking boards up a slot. Sell something to make room first.');
    const from=(app.querySelector(`.fitgood[data-w="${i}"] .o-icon`)||b).getBoundingClientRect(),old=fitIn(f.spot);
    G.gold-=f.p;const back=equip(k);S.fits[i]=null;PV.wsel=null;bump='gold';save();{const h=handAt(f.spot);toast(`Fitted ${f.n}${back?`. Sold the old one for ${back} gold`:''}. ${h?`${CREW[h.k].n} mans it`:'Post a hand at it on your ship card'}`)}port(id,view);fitFly(k,from,old);setTimeout(()=>coach('fitted'),G.tut?2600:0)});
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const n=b.dataset.r==='all'?repairable():1;
    if(n<1||G.gold<n*repairCost())return toast(G.hull>=HULL_MAX?'The hull is already sound.':`Need ${n*repairCost()-G.gold} more gold`);
    const was=G.hull;G.gold-=n*repairCost();G.hull+=n;bump='hull';logL(`Paid the shipwright ${n*repairCost()} gold to repair ${n} hull.`);save();port(id,view);repairFx(was,G.hull)});
  const sc=document.getElementById('scope');if(sc)sc.onclick=chartPeek;
  const yb=document.getElementById('yourship');if(yb)yb.onclick=shipSheet;const yc=document.getElementById('yourcrew');if(yc)yc.onclick=shipSheet;
  app.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const i=+b.dataset.hire,k=S.tavern[i],C=CREW[k];
    if((G.crew||[]).length>=berths())return toast('Your deck is full. Dismiss someone on the ship card first.');
    if(G.gold<feeOf(k))return toast(`Need ${feeOf(k)-G.gold} more gold`);
    const from=(app.querySelector('.patron.sel .bust')||b).getBoundingClientRect();
    const was=G.board.map(b=>itemUse(b.k,crewCrafts()));
    G.gold-=feeOf(k);hire(k);S.tavern[i]=null;{const j=G.board.findIndex((b,n)=>was[n]!=='all'&&itemUse(b.k,crewCrafts())==='all');if(j>=0)flash={ref:G.board[j],kind:'ready'}}bump='gold';save();toast(`${C.n} joins the crew`);port(id,view);hireFly(k,from);coach('hired')});
  document.body.classList.toggle('hovtalk',hoverTalk());if(view==='harbour'||view==='tavern'&&!app.querySelector('#barroom .patron'))app.classList.remove('talkon');
  if(view==='harbour')bindHarbour();
  if(view==='tavern'){layBar();requestAnimationFrame(layBar);const rk=app.querySelector('#talk .ranks');if(rk)rk.addEventListener('toggle',layBar)}
  if(view==='market'||view==='wright'||view==='docks'){layStall();requestAnimationFrame(layStall)}
  restoreFocusMarks();
  if(restock){restock=false;const sl=app.querySelector('#stall .seller');if(sl)sl.classList.add('popup')}
  app.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>{PV.dsel=b.dataset.ds;port(id,view)});
  app.querySelectorAll('[data-df]').forEach(b=>b.onclick=()=>{PV.dsel=+b.dataset.df;port(id,view)});
  app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const v=b.dataset.w;PV.wsel=v==='r'?'r':+v;port(id,view)});
  app.querySelectorAll('[data-sel]').forEach(b=>{const go=()=>{PV.tsel=+b.dataset.sel;port(id,view)};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  app.querySelectorAll('[data-bld]').forEach(b=>{const go=()=>port(id,b.dataset.bld);b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  if(view!=='harbour'&&PV.scroll!==view){PV.scroll=view;scrollTo(0,0)}
  save();coach('port');coach(view);
}
/* the market: a seller's stall. The seller stands behind the table with their speech bubble beside them, and the day's goods sit
   out on the table below; tap one and it lifts while the seller tells you about it, with the Buy button. */
/* the market just restocked (Show me more): the new goods thump down onto the table instead of popping in */
let restock=false;
function stallHTML(S,id,anim){const sk=sellerOf(id),P=SELLERS[sk],rr=S.reroll+(fitDown('lion')?1:0);
  let sel=PV.msel;if(sel==null||!S.offers[sel])sel=PV.mbought?-1:S.offers.findIndex(Boolean);
  const o=sel>=0?S.offers[sel]:null;
  const goods=S.offers.map((g,i)=>{if(!g)return`<span class="good gone" aria-label="Sold"><span class="o-icon"></span><span class="ptag">sold</span></span>`;
    const d=DEFS[g.k],up=!!findMatch(g);
    return`<button class="good${i===sel?' sel':''}${restock?' thump':anim?' in':''}" data-g="${i}" style="animation-delay:${restock?120+i*130:i*70}ms" aria-label="${d.n}, ${TIER[g.t]}, ${buyP(g)} gold${i===sel?', selected':''}"><span class="o-icon t${g.t} c-${kindOf(g.k)}">${emb(g.k)}${icon(g.k)}${up?CHEV:''}</span><span class="ptag">${sicon('gold')}${buyP(g)}</span></button>`}).join('');
  let talk;
  if(o){const d=DEFS[o.k],p=buyP(o),up=!!findMatch(o),poor=G.gold<p;
    talk=`<div class="talk" id="talk"><p class="say">“${poor?P.broke:up?P.up:pitch(sk,o)}”</p>
      <p class="who"><b>${d.n}</b><span class="chipc">${TIER[o.t]}</span><span class="chipc">size ${d.s}</span>${d.cd?`<span class="chipc">${d.cd}s</span>`:''}</p>
      ${up&&upgradeHTML(o)||`<p class="desc">${describe([o],0).L.join(' ')}</p>`}
      <button class="buy${up?' up':''}" data-b="${sel}" ${poor?'aria-disabled="true"':''}>${up?'Upgrade':'Buy'} for ${p} gold</button></div>`}
  else if(PV.mbought&&S.offers.some(Boolean))talk=`<div class="talk" id="talk"><p class="say">“Pleasure doing business.”</p><p class="desc">Tap anything on the table to hear about it.</p></div>`;
  else talk=`<p class="talk quiet" id="talk">“${P.out}”</p>`;
  // the back wall: two shelves of crates, sacks, jars and barrels, drawn as tiles so it fills any width
  const shelf=`<pattern id="stock" width="132" height="58" patternUnits="userSpaceOnUse"><g fill="#FBF5E8" stroke="#000" stroke-width="2" stroke-linejoin="round">
      <rect x="6" y="22" width="30" height="32" fill="#D7BA8E"/><path d="M6 32h30M6 44h30" fill="none"/>
      <path d="M44 54q-6-14 2-26q6-6 12 0q8 12 2 26z" fill="#E9CF8E"/><path d="M47 30q5 3 10 0" fill="none"/>
      <rect x="70" y="34" width="14" height="20" rx="3" fill="#B4C6CE"/><rect x="73" y="28" width="8" height="6" fill="#B98E64"/>
      <path d="M92 54q-3-14 0-28h22q3 14 0 28z" fill="#B98E64"/><path d="M103 26h11q3 14 0 28h-11z" fill="#9A7350" stroke="none"/><path d="M92 54q-3-14 0-28h22q3 14 0 28z" fill="none"/><path d="M91 34h24M91 46h24" fill="none"/></g></pattern>`;
  return`<section class="stallsec">
    <div class="stall" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs>${shelf}<pattern id="awn" width="44" height="34" patternUnits="userSpaceOnUse"><path d="M0 0h22v22q-11 12-22 0z" fill="#B5533C" stroke="#000" stroke-width="2"/><path d="M22 0h22v22q-11 12-22 0z" fill="#FBF5E8" stroke="#000" stroke-width="2"/></pattern></defs>
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
  else talk=`<div class="talk" id="talk"><p class="say">“${PV.dsold?M.thanks:M.empty}”</p>${S.demand?`<p class="desc">Paying double for ${FISH[S.demand].n} today.</p>`:''}</div>`;
  const face=(k,look,lbl,on)=>`<button class="pchip${on?' on':''}" data-ds="${k}" aria-label="${lbl}">${peep(look,PEEP_HEAD,'peep')}</button>`;
  const speaker=who?N.look:M.look;
  return`<section class="stallsec docksec">
    <div class="stall pier" id="stall">
      <svg class="stallwall" aria-hidden="true"><defs><pattern id="swell" width="60" height="16" patternUnits="userSpaceOnUse"><path d="M0 8q15-8 30 0t30 0" fill="none" stroke="#000" stroke-width="1.6"/></pattern></defs>
        <rect x="0" y="96" width="100%" height="400" fill="#B4C6CE"/><path d="M0 96H4000" stroke="#000" stroke-width="2.4"/><rect x="0" y="104" width="100%" height="100" fill="url(#swell)" opacity=".5"/>
        <g fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"><path d="M60 92l14-30v30zM74 62l10 30H74"/><path d="M52 92h40l-6 6H58z"/></g>
        <path d="M150 50q6-5 12 0q6-5 12 0M210 38q5-4 10 0q5-4 10 0" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>
      <h2 class="stallsign">${M.short}'s fish</h2>
      <div class="pchips">${face('m',M.look,`${M.n}, the fishmonger`,!who)}${people.map(p=>face(p.k,NPCS[p.npc].look,`${NPCS[p.npc].n}, on the dock`,p===who)).join('')}</div>
      <div class="stalltop"><div class="seller" aria-label="${who?N.n:M.n}">${peep(speaker,'40 22 172 150')}</div>${talk}</div>
      <div class="table crates"><div class="goods" id="goods">${goods}</div></div>
    </div>
  </section>`}
/* a fish sale: each fish flops off the crate and arcs into the fishmonger's arms (they bob as they catch it), then the
   coins fly from them up into your purse */
function fishSaleFx(fs,rs,gold){const sl=app.querySelector('#stall .seller'),S=sl&&sl.getBoundingClientRect();
  if(!S||matchMedia('(prefers-reduced-motion:reduce)').matches){const el=document.getElementById('goldst');if(el)squish(el,'bump');return}
  const tx=S.left+S.width/2,ty=S.top+S.height*.7,b=document.querySelector('#goldst b');if(b)b.textContent=G.gold-gold;
  let k=0,left=0;
  fs.forEach((f,i)=>{const r=rs[i];if(!r||r.right<0||r.left>innerWidth)return;left++;
    const el=document.createElement('div');el.className='flyfish';el.innerHTML=fishSVG(f);el.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px`;document.body.appendChild(el);
    const dx=tx-(r.left+r.width/2),dy=ty-(r.top+r.height/2);
    el.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${dx*.45}px),calc(-50% + ${dy*.45-70}px)) scale(1.15) rotate(${i%2?-200:200}deg)`,offset:.5},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.45) rotate(${i%2?-360:360}deg)`,opacity:.9}],
      {duration:620,delay:k++*120,easing:'cubic-bezier(.45,0,.5,1)',fill:'both'}).onfinish=()=>{el.remove();squish(sl,'catchit');
      if(--left===0)setTimeout(()=>sellFx(tx,S.top+S.height*.35,gold),120)}});
  if(!left)sellFx(tx,S.top+S.height*.35,gold)}
/* hull repairs: a card like the one for hull damage, run backwards. The ship steadies while a mallet knocks each new plank
   into place with an ink spark, and the number counts up with it. Tap to dismiss. */
function repairFx(before,after){document.querySelectorAll('.hullcard').forEach(c=>c.remove());
  const n=Math.min(after,40),add=after-before,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const c=document.createElement('div');c.className='hullcard repair';c.setAttribute('role','status');c.setAttribute('aria-label',`Hull repaired. +${add}, ${after} now.`);
  c.innerHTML=`<svg class="hc-ship" viewBox="-2 -2 28 28" aria-hidden="true"><g stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></svg>
    <div><p class="hc-head">Hull repaired</p><p class="hc-num"><b>${still?after:before}</b> hull <span class="hc-loss">+${add}</span></p>
    <div class="planks" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i${i>=n-add?` class="come" style="--d:${(i-(n-add))*160}ms"`:''}></i>`).join('')}</div></div>
    <svg class="hc-mallet" viewBox="0 0 30 30" aria-hidden="true"><path class="w" d="M15 4h10v6H15z"/><path d="M20 10l-8 14" stroke-width="2.6"/></svg>`;
  document.body.appendChild(c);c.addEventListener('click',()=>c.classList.add('out'));
  const b=c.querySelector('.hc-num b');
  if(!still)for(let k=1;k<=add;k++)setTimeout(()=>{if(!c.isConnected)return;b.textContent=before+k;squish(b,'bump');squish(c.querySelector('.hc-mallet'),'knock')},550+(k-1)*160);
  const t=still?1600:900+add*160+900;setTimeout(()=>c.classList.add('out'),t);setTimeout(()=>c.remove(),t+400)}
/* a fitting goes on: your ship appears big, the fitting flies off the bench onto its part of the ship (knocking the old one
   off if there was one), three hammer blows ring out in ink sparks, and "Fitted!" rises. Tap to hurry it. */
function fitFly(k,from,old){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const F=FITTINGS[k],fx=document.createElement('div');fx.className='fitfx';
  fx.innerHTML=`<div class="ff-ship">${shipArt(G.ship,'ff-art')}</div><p class="ff-cap"><b>${F.n}</b> fitted to the ${SPOTS[F.spot].toLowerCase()}${handAt(F.spot)?`<br>${CREW[handAt(F.spot).k].n} mans it`:''}</p>`;
  document.body.appendChild(fx);
  const close=()=>{if(!fx.isConnected)return;fx.classList.add('gone');setTimeout(()=>fx.remove(),450)};
  fx.addEventListener('click',close);
  // once the ship has settled in, measure where the fitting goes and send it
  setTimeout(()=>{if(!fx.isConnected)return;
  const art=fx.querySelector('.ff-art'),A=art.getBoundingClientRect(),P=(SHIPSPOTS[G.ship]||SHIPSPOTS.sloop)[F.spot],px=A.left+P[0]/120*A.width,py=A.top+P[1]/110*A.height;
  const glyph=(key,x,y,sz)=>{const g=document.createElement('div');g.className='ff-glyph';g.innerHTML=fitGlyph(key);g.style.cssText=`left:${x-sz/2}px;top:${y-sz/2}px;width:${sz}px;height:${sz}px`;fx.appendChild(g);return g};
  if(old)glyph(old,px,py,46).animate([{transform:'none',opacity:1},{transform:'translate(0,-30px) rotate(-30deg)',opacity:1,offset:.3},{transform:'translate(-40px,160px) rotate(-160deg)',opacity:0}],{duration:800,delay:60,easing:'cubic-bezier(.5,0,.8,.6)',fill:'both'});
  const sz=46,g=glyph(k,from.left+from.width/2,from.top+from.height/2,sz),dx=px-(from.left+from.width/2),dy=py-(from.top+from.height/2);
  g.animate([{transform:'translate(0,0) scale(1.3)',opacity:0},{transform:'translate(0,0) scale(1.3)',opacity:1,offset:.1},{transform:`translate(${dx*.5}px,${dy*.5-120}px) scale(1.5) rotate(200deg)`,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(1) rotate(360deg)`}],
    {duration:900,delay:old?400:60,easing:'cubic-bezier(.45,0,.35,1)',fill:'both'}).onfinish=()=>{
    // three hammer blows: the ship jolts and ink sparks fly off the fitting each time
    [0,170,340].forEach((t,n)=>setTimeout(()=>{if(!fx.isConnected)return;squish(fx.querySelector('.ff-ship'),'jolt');
      const b=document.createElement('div');b.className='inkburst'+(n===2?' big':'');b.style.left=px+'px';b.style.top=py+'px';b.style.zIndex=76;
      b.innerHTML=`<svg viewBox="-50 -50 100 100" aria-hidden="true">${Array.from({length:7},(_,m)=>{const a=-Math.PI/2+(m-3)*.45;return`<path d="M${Math.cos(a)*22} ${Math.sin(a)*22}L${Math.cos(a)*(m%2?34:42)} ${Math.sin(a)*(m%2?34:42)}"/>`}).join('')}</svg>`;
      document.body.appendChild(b);setTimeout(()=>b.remove(),800)},t));
    setTimeout(()=>{if(!fx.isConnected)return;const l=document.createElement('div');l.className='floatlbl up';l.style.zIndex=77;l.textContent='Fitted!';l.style.left=px+'px';l.style.top=(py-26)+'px';document.body.appendChild(l);setTimeout(()=>l.remove(),1300);fx.classList.add('done')},420);
    setTimeout(close,1600)}},480)}
/* a new hand joins: they leap off their bar stool and fly down into their berth in the crew strip, landing with a squash,
   an ink burst and "Aboard!" rising off them */
function hireFly(k,from){const strip=app.querySelectorAll('#crewbar .cb-c:not(.empty)'),to=strip[strip.length-1];
  if(!to||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const T=to.getBoundingClientRect(),size=Math.min(96,Math.max(56,from.width*.55)),sx=from.left+from.width/2,sy=from.top+from.height*.35,tx=T.left+T.width/2,ty=T.top+T.height/2;
  const f=document.createElement('div');f.className='hirefly';f.innerHTML=crewFace(k);f.style.cssText=`width:${size}px;height:${size}px;left:${sx-size/2}px;top:${sy-size/2}px`;
  document.body.appendChild(f);to.style.opacity='0';
  const dx=tx-sx,dy=ty-sy,s=T.width/size;
  f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx*.25}px,${dy*.25-90}px) scale(1.15) rotate(-12deg)`,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(${s}) rotate(8deg)`}],
    {duration:850,easing:'cubic-bezier(.45,0,.4,1)'}).onfinish=()=>{f.remove();to.style.opacity='';squish(to,'land');
    const b=document.createElement('div');b.className='inkburst';b.style.left=tx+'px';b.style.top=ty+'px';
    b.innerHTML=`<svg viewBox="-50 -50 100 100" aria-hidden="true">${Array.from({length:8},(_,n)=>{const a=n/8*Math.PI*2;return`<path d="M${Math.cos(a)*24} ${Math.sin(a)*24}L${Math.cos(a)*(n%2?36:44)} ${Math.sin(a)*(n%2?36:44)}"/>`}).join('')}</svg>`;
    const l=document.createElement('div');l.className='floatlbl up';l.textContent='Aboard!';l.style.left=tx+'px';l.style.top=T.top+'px';
    document.body.append(b,l);const hw=l.offsetWidth/2+6;l.style.left=Math.max(hw,Math.min(innerWidth-hw,tx))+'px';
    const cr=app.querySelector('#crewbar .cb-cr');if(cr)squish(cr,'bump');setTimeout(()=>{b.remove();l.remove()},1300)}}
/* the tavern: everyone looking for work sits at the bar. Tap one to have a word; they make their pitch below. */
/* the tavern: the bar scene fills the room. Everyone looking for work sits at the counter; tap one and a speech bubble
   floats over the scene just under them, pointing up, with their pitch and a Hire button. layBar() fits it all to the space. */
function tavernHTML(S){const full=(G.crew||[]).length>=berths(),n=S.tavern.length;
  let sel=PV.tsel;if(sel==null||!S.tavern[sel])sel=S.tavern.findIndex(Boolean);
  // the hands sit in 0..PW; the room runs on far past them on every side, so the scene can fill any shape
  const PW=n*240+40,L=-1600,R=PW+1600,B=1600;
  let wall='';for(let x=L+6;x<R-20;x+=34){const a=Math.abs(x),h=18+(a*7)%16,w=9+(a*3)%6;wall+=`<path class="${a%3?'t-glass':'t-glass2'}" d="M${x} 92v-${h-6}q0-6 ${w/2}-6t${w/2} 6v${h-6}z" stroke-width="1.6"/><path d="M${x+w/2} ${92-h-4}v-6" stroke-width="2"/>`}
  for(let x=L+20;x<R-20;x+=46){const a=Math.abs(x);wall+=`<path class="t-box" d="M${x} 164v-24h${10+(a*5)%8}v24z" stroke-width="1.6"/><path class="t-jar" d="M${x+20} 164v-14q0-6 8-6t8 6v14z" stroke-width="1.6"/>`}
  for(let x=L+120;x<R;x+=240)wall+=`<g class="hlamp" transform="translate(${x} 0)"><path d="M0 0v20" stroke-width="1.6"/><path class="w" d="M-8 20h16l-3 16h-10z" stroke-width="1.8"/></g>`;
  let floor='';for(let y=400;y<B;y+=26)floor+=`<path d="M${L} ${y}H${R}" stroke-width="1" opacity="${Math.max(.15,.5-(y-400)/1400)}"/>`;
  for(let x=L+60;x<R;x+=150)floor+=`<path d="M${x} 400v${B}" stroke-width="1" opacity=".18"/>`;
  const seats=S.tavern.map((k,i)=>{const x=20+i*240;
    if(!k)return`<g transform="translate(${x} 0)"><text class="hchalk" x="120" y="228" text-anchor="middle">hired</text><g transform="translate(150 262) rotate(-80)"><rect class="w" x="-12" y="-26" width="24" height="26" rx="3"/><path d="M12 -20c8 0 8 12 0 12" stroke-width="2"/></g></g>`;
    return`<g class="patron${i===sel?' sel':''}" data-sel="${i}" role="button" tabindex="0" aria-label="Talk to the ${CREW[k].n}${i===sel?', talking':''}"><rect class="hit" x="${x}" y="0" width="240" height="290"/>
      <g transform="translate(${x} ${i===sel?14:28})"><g class="bust">${peepLayers(CREW[k].look)}</g></g>
      <g transform="translate(${x+168} 262)"><rect class="w" x="-12" y="-28" width="24" height="28" rx="3"/><path d="M12 -22c9 0 9 14 0 14M-12 -20h24" stroke-width="2"/></g></g>`}).join('');
  const k=sel>=0?S.tavern[sel]:null,C=k&&CREW[k];
  return`<section class="tavern"><div class="m-head"><h2 style="font-size:20px">Tavern <span class="soft">deck ${(G.crew||[]).length}/${berths()}</span></h2><button class="ghost" id="yourcrew">Your crew</button></div>
    <div class="barroom" id="barroom" data-pw="${PW}" data-sx="${sel>=0?20+sel*240+120:-1}">
    <svg class="barscene" aria-label="The bar" preserveAspectRatio="xMidYMin slice" viewBox="0 0 ${PW} 330"><defs><filter id="tfade" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".303 .179 .018 0 .492  .053 .429 .018 0 .48  .053 .179 .268 0 .455  0 0 0 1 0"/></filter></defs>
      <path d="M${L} 92H${R}M${L} 164H${R}" stroke-width="3"/>${wall}
      ${seats}
      <rect class="t-floor" x="${L}" y="400" width="${R-L}" height="${B-400}" stroke="none"/>
      <rect class="t-top" x="${L}" y="262" width="${R-L}" height="16" stroke-width="3"/>
      <path class="t-front" d="M${L} 278H${R}V400H${L}z" stroke-width="2.4"/>${Array.from({length:Math.floor((R-L)/40)},(_,i)=>`<path d="M${L+20+i*40} 284v104" stroke-width="1" opacity=".5"/>`).join('')}<path d="M${L} 314H${R}M${L} 388H${R}" stroke-width="2.4"/>
      ${floor}
    </svg>
    ${C?`<div class="talk" id="talk"><p class="say">“${C.say||'Looking for a berth, captain.'}”</p>
      <p class="who"><b>${C.n}</b> ${crewCrafts1(k)}</p>
      <p class="terms">Lets your cargo use ${C.crafts.map(c=>`<b>${CRAFTS[c]}</b>`).join(' and ')}. Wage ${wageOf(k)} gold a port.</p>
      <details class="ranks"><summary>How they grow</summary>${[2,3].map(r=>`<p><b>Rank ${r}</b>, after ${rankXP()[r-1]} wins: ${C.crafts.map(c=>RANKS[c][r-2]).join(' ')}</p>`).join('')}</details>
      <button class="buy" data-hire="${sel}" ${full||G.gold<feeOf(k)?'aria-disabled="true"':''}>${full?'Your deck is full':feeOf(k)?`Hire for ${feeOf(k)} gold`:'Sign on, the Guild pays'}</button></div>`
      :'<p class="talk quiet">Everyone here has signed on. The bar is quiet.</p>'}
    </div>
  </section>`}
/* fit the bar to the room: fill the space down to the hold, keep every seat in view, and float the bubble under whoever's talking */
function layBar(){const room=document.getElementById('barroom');if(!room)return;
  const svg=room.querySelector('svg'),talk=document.getElementById('talk'),dock=app.querySelector('.dock');
  const top=room.getBoundingClientRect().top,dh=dock?dock.offsetHeight:0,cw=room.clientWidth;
  let ch=Math.max(260,Math.round(innerHeight-top-dh-14));
  const PW=+room.dataset.pw,s0=Math.min(cw/(PW+16),ch/330),sx=+room.dataset.sx;
  const live=talk&&!talk.classList.contains('quiet');if(live)talk.classList.remove('side');room.classList.remove('sided');
  let th=live?talk.offsetHeight:0;
  // the bubble never covers a face. Under the hands when it fits; on a wide, short room, beside them; otherwise the scene
  // shrinks a little and, if that's not enough, the room grows taller and the screen scrolls
  if(th&&ch<250*s0+th+22&&cw>=640){talk.classList.add('side');const tw=talk.offsetWidth;th=talk.offsetHeight;
    const s=Math.min((cw-tw-56)/(PW+16),ch/330);
    if(s>=s0*.55){ch=Math.max(ch,th+16);room.style.height=ch+'px';
      const x0=-16/s,y0=-Math.max(0,Math.min((ch-300*s)/2,60*s))/s,hx=16+PW*s;
      svg.setAttribute('viewBox',`${x0} ${y0} ${cw/s} ${ch/s}`);
      const left=Math.max(hx+20,Math.min(cw-tw-12,hx+(cw-hx-tw)/2)),py=(sx>=0?95:120-y0)*s+(sx>=0?-y0*s:0);
      const topY=Math.max(8,Math.min(ch-th-8,py-48));
      talk.style.left=left+'px';talk.style.top=topY+'px';talk.style.setProperty('--ay',(py-topY)+'px');room.classList.add('sided');return}
    talk.classList.remove('side');th=talk.offsetHeight}
  const s=th?Math.max(s0*Math.min(.7,Math.max(.45,120/(260*s0))),Math.min(s0,(ch-th-22)/250)):s0;
  if(th)ch=Math.max(ch,Math.ceil(250*s+th+22));room.style.height=ch+'px';
  const vw=cw/s,vh=ch/s,x0=PW/2-vw/2;
  // spare height goes above the shelves, so the hands and the bubble under them sit together in the middle
  const free=Math.max(0,ch-(250*s+th+18)),y0=-Math.min(free/2,60*s)/s;
  svg.setAttribute('viewBox',`${x0} ${y0} ${vw} ${vh}`);
  if(!th)return;
  const px=(sx-x0)*s,tw=talk.offsetWidth;
  const left=Math.max(8,Math.min(cw-tw-8,px-tw/2)),topY=Math.min(ch-th-10,(250-y0)*s);
  talk.style.left=left+'px';talk.style.top=topY+'px';talk.style.setProperty('--ax',(px-left)+'px')}
const buyP=o=>Math.max(1,price(o.k,o.t)-(hasP('haggler')?1:0));
/* what each building has for you right now: a badge and a few words for screen readers */
/* in the market, the good you've chosen glows what it would touch in your hold */
function restoreFocusMarks(){const S=G&&PV.id!=null&&G.shops[PV.id];if(!S||PV.view!=='market'||!app.querySelector('#stall'))return;
  const i=PV.msel!=null&&S.offers[PV.msel]?PV.msel:PV.mbought?-1:S.offers.findIndex(Boolean),o=i>=0?S.offers[i]:null;if(!o)return clearMarks();
  markHold(affectsFrom(o,G.board),null)}
/* the telescope: the chart from the quay, to look ahead while you shop. Nothing on it can be tapped. */
function chartPeek(){const ov=overlay(`<div class="peekhead"><h2>${G.tut?'The maiden voyage':SEAS[G.sea]}</h2><span class="soft">From ${node(G.at).name}</span></div><div class="peekwrap" id="peekwrap"><div class="map peek">${mapSVG()}</div></div><button class="primary" data-a="close">Back to port</button>`,false,'peekov');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()});
  const cur=ov.querySelector('.boatbob'),sh=ov.querySelector('#peekwrap');if(cur&&sh){const r=cur.getBoundingClientRect(),s=sh.getBoundingClientRect();sh.scrollTop=Math.max(0,r.top-s.top-s.height*.45)}}
function harbourInfo(S,vis){const n=S.offers.filter(Boolean).length,h=(S.tavern||[]).filter(Boolean).length,f=(S.fits||[]).filter(Boolean).length,hurt=G.hull<HULL_MAX,
  who=(vis&&!S.talked)||G.hock==='active';
  return{market:{badge:n||'',say:`${n} for sale`,n},tavern:{badge:!tutOpen('tavern')?'':h||'',say:!tutOpen('tavern')?'closed':`${h} for hire`,h:!tutOpen('tavern')?0:h},
    wright:{badge:!tutOpen('wright')?'':hurt?'!':f||'',say:!tutOpen('wright')?'closed':`${f} fittings${hurt?', hull needs repair':''}`,f:!tutOpen('wright')?0:f},
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
    +`<button class="good fitgood${sel==='r'?' sel':''}${anim?' in':''}" data-w="r" style="animation-delay:${S.fits.length*70}ms" aria-label="Hull repairs${sel==='r'?', selected':''}"><span class="o-icon plain"><svg viewBox="0 0 30 30" class="gl" aria-hidden="true">${REPAIRG}</svg></span>${tag(hurt?`${sicon('gold')}${repairCost()} each`:'hull full')}</button>`;
  let talk;
  if(sel==='r'){
    talk=`<div class="talk" id="talk"><p class="say">“${!hurt?W.full:G.gold<repairCost()?W.broke:W.repair}”</p>
      <p class="who"><b>Hull repairs</b><span class="chipc">hull ${G.hull}/${HULL_MAX}</span></p>
      ${hurt?`<div class="acts"><button class="buy" data-r="${all>1?'all':1}" ${all<1?'aria-disabled="true"':''}>Repair ${Math.max(1,all)} for ${Math.max(1,all)*repairCost()} gold</button>${all>1?`<button class="linkbtn" data-r="1">Just 1</button>`:''}</div>`:''}</div>`}
  else{const k=S.fits[sel],f=FITTINGS[k],old=fitIn(f.spot),ok=canEquip(k),poor=G.gold<f.p;
    talk=`<div class="talk" id="talk"><p class="say">“${!ok?W.slot:poor?W.broke:W.say[f.spot]}”</p>
      <p class="who"><b>${f.n}</b><span class="chipc">${SPOTS[f.spot]}</span>${f.hp?`<span class="chipc">${f.hp>0?'+':'−'}${Math.abs(f.hp)} health</span>`:''}</p>
      <p class="desc">${fitDesc(k)}${old?` <span class="soft">Replaces your ${FITTINGS[old].n}, which sells for ${Math.floor(FITTINGS[old].p/2)}.</span>`:''}${fitCraftLine(k)}</p>
      <button class="buy" data-fit="${sel}" ${poor||!ok?'aria-disabled="true"':''}>Fit for ${f.p} gold</button></div>`}
  // the back wall: a pegboard of saws, mallets, coiled rope and planks, tiled so it fills any width
  const tools=`<pattern id="tools" width="150" height="70" patternUnits="userSpaceOnUse"><g fill="#FBF5E8" stroke="#000" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M10 10h6v46h-6z" fill="#B98E64"/><path d="M8 10h10M13 4v6" fill="none"/>
      <path d="M30 12h26l-4 14H30z" fill="#7F98A7"/><path d="M34 26v6M42 26v6M50 26v4" fill="none"/><path d="M28 12h-6v8h6" fill="none"/>
      <circle cx="80" cy="30" r="15" fill="#D8B05E"/><circle cx="80" cy="30" r="9" fill="#DDE3CC"/><path d="M80 15v-9" fill="none"/>
      <path d="M108 8h14v10h-14z" fill="#5D6E7C"/><path d="M115 18v40" fill="none"/>
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
