/* Ink Crossing: Events, spoils and landmark picks. */
"use strict";
/* ---------- events, loot, landmarks ---------- */
function eventAt(n){
  if(n.ev==='bandits')return bandits(n,()=>{if(G.hull<=0)return sink();save();chart()});
  chart();const ev=EVENTS[n.ev];
  const ov=overlay(`<h2>${ev.t}</h2><p class="log">${ev.x}</p><div class="picks">${ev.o.map((o,i)=>{const ok=!o.need||o.need();return`<button class="opt" data-o="${i}" ${ok?'':'disabled'}><b>${o.l}</b><span>${typeof o.d==='function'?o.d():o.d}</span></button>`}).join('')}</div>`,true);
  ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{if(b.disabled)return;ov.remove();
    const res=ev.o[+b.dataset.o].f(RNG(G.seed,'ev',n.id,b.dataset.o));
    if(res&&res.chart){logL(res.msg);chartPick(RNG(G.seed,'cache',n.id),res.msg,after);return}
    if(res&&res.fish){logL(res.msg);save();fishing(n.id+'e',res.fish,after);return}
    logL(res);toast(res);after()});
  function after(){if(G.hull<=0)return sink();save();chart()}
  (ov.querySelector('[data-o]:not([disabled])')||ov.querySelector('button')).focus();
}
function chartPick(r,lead,done,fk){
  const taken=G.charts.map(c=>c.k),pool=Object.keys(CHARTS).filter(k=>!taken.includes(k)),opts=[];
  while(opts.length<2&&pool.length)opts.push(pool.splice(ri(r,pool.length),1)[0]);
  if(fk&&(hasF(fk)||!FITTINGS[fk]))fk=null;
  if(!opts.length&&!fk){toast('Every landmark is already on your chart.');return done()}
  const f=fk&&FITTINGS[fk],old=f&&fitIn(f.spot);
  const ov=overlay(`<h2>${fk?'Take your pick':'Draw a landmark'}</h2><p class="soft">${lead} ${fk?'Pick a landmark for your chart, or a fitting for your ship. Either lasts the whole voyage.':'Pick one to add to your chart. It lasts the whole voyage.'}</p><div class="picks">${opts.map(k=>`<button class="pick" data-k="${k}"><span class="pi plain">${glyph(k)}</span><div><b>${CHARTS[k].n}</b><span class="d">${CHARTS[k].d}</span></div></button>`).join('')}${fk?`<button class="pick fitpick" data-fk="${fk}" ${canEquip(fk)?'':'disabled'}><span class="pi plain">${fitGlyph(fk)}</span><div><b>${f.n} <span class="soft">${SPOTS[f.spot].toLowerCase()} fitting</span></b><span class="d">${fitDesc(fk)}${old?` Replaces your ${FITTINGS[old].n}, which sells for ${Math.floor(FITTINGS[old].p/2)}.`:''}${canEquip(fk)?'':' Needs a free hold slot.'}</span>${fitCraftLine(fk)}</div></button>`:''}</div>`,true);
  const fb=ov.querySelector('[data-fk]');if(fb)fb.onclick=()=>{if(fb.disabled)return;ov.remove();const back=equip(fk);toast(`Fitted ${f.n}${back?`. Sold the old one for ${back} gold`:''}`);save();coach('landmark');done()};
  ov.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;ov.remove();
    G.charts.push({k,sea:G.sea,at:G.at});A.charts[k]=1;saveA();
    if(k==='harbour')G.hull+=5;if(k==='pearl')G.gold+=10;if(k==='buoy')updateReveal();
    let msg=`Charted ${CHARTS[k].n}.`;
    if(k==='wreck')msg+=' '+addOrGold(randItem(r,depthOf(node(G.at))+4),'Salvaged');
    logL(msg);toast(msg);save();coach('landmark');done()});
  ov.querySelector('.pick').focus();coach('landmarkOpen');
}
/* why a spoil doesn't fit yet, and how many slots selling would need to free */
function roomNote(o){const sz=DEFS[o.k].s,need=Math.min(sz-(holdCap()-used(G.board)),G.locker?sz-(LOCK-used(G.locker)):99);
  return`Size ${sz}. Free ${need} more slot${need===1?'':'s'}${G.locker?' in your hold or locker':''} to take it.`}
/* Spoils: a screen like the market, with your hold docked below. Drag a spoil into the hold (or tap Take), drag it back onto its card
   to change your mind, and drag your own cargo onto Sail on to sell it and make room. One pick, or gold if you take nothing. */
/* ---------- the spoils chest ----------
   Winning a fight is worth a show: a chest drops in, squashes, rattles with anticipation, then bursts open with a shower of
   coins and jewels, and the spoils fly out of it to their places. Tap anywhere to hurry it. Skipped with reduced motion. */
const CHEST=`<svg class="chest" viewBox="0 0 160 140" aria-hidden="true"><g stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
  <g class="ch-body"><path fill="#fff" d="M14 64h132v62q0 6-6 6H20q-6 0-6-6z"/><path fill="none" d="M14 84h132M40 64v68M120 64v68"/>
    <path fill="#000" d="M70 74h20v22q0 6-10 10q-10-4-10-10z"/><circle cx="80" cy="84" r="3.5" fill="#fff" stroke="none"/></g>
  <g class="ch-lid"><path fill="#fff" d="M14 64V48q0-30 66-30t66 30v16z"/><path fill="none" d="M40 64V24M120 64V24M14 52h132"/><path fill="#000" d="M70 54h20v10H70z"/></g></g></svg>`;
function chestReveal(cards,done){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||!cards.length){cards.forEach(c=>c.classList.add('in'));return done()}
  const fx=document.createElement('div');fx.className='chestfx';
  fx.innerHTML=`<canvas></canvas><div class="ch-rays"></div><div class="ch-wrap">${CHEST}</div><p class="ch-skip">Tap to open</p>`;
  document.body.appendChild(fx);cards.forEach(c=>{c.style.opacity='0';c.classList.add('flying')});
  const cv=fx.querySelector('canvas'),cx=cv.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);
  const size=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;cx.setTransform(dpr,0,0,dpr,0,0)};size();
  const wrap=fx.querySelector('.ch-wrap'),lid=fx.querySelector('.ch-lid'),parts=[];let timers=[],raf2=0,over=false,opened=false;
  const at=(ms,f)=>timers.push(setTimeout(f,ms));
  // coins and jewels: drawn in ink, tossed up out of the chest's mouth, tumbling down under gravity
  const burst=()=>{const r=wrap.getBoundingClientRect(),ox=r.left+r.width/2,oy=r.top+r.height*.42;
    for(let i=0;i<46;i++){const a=-Math.PI/2+(Math.random()-.5)*2.1,v=7+Math.random()*9;
      parts.push({x:ox+(Math.random()-.5)*50,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,r:Math.random()*6.3,vr:(Math.random()-.5)*.4,kind:i%3===0?'gem':'coin',s:7+Math.random()*6,solid:Math.random()<.4})}};
  const draw=()=>{cx.clearRect(0,0,innerWidth,innerHeight);cx.lineWidth=2.2;cx.strokeStyle='#000';
    for(const p of parts){p.vy+=.42;p.x+=p.vx;p.y+=p.vy;p.vx*=.995;p.r+=p.vr;
      cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);
      if(p.kind==='coin'){const w=Math.abs(Math.cos(p.r*1.7))*p.s+1.5;cx.beginPath();cx.ellipse(0,0,w,p.s,0,0,Math.PI*2);cx.fillStyle='#fff';cx.fill();cx.stroke();
        if(w>4){cx.beginPath();cx.ellipse(0,0,w*.55,p.s*.55,0,0,Math.PI*2);cx.stroke()}}
      else{cx.beginPath();cx.moveTo(0,-p.s);cx.lineTo(p.s*.8,-p.s*.25);cx.lineTo(0,p.s);cx.lineTo(-p.s*.8,-p.s*.25);cx.closePath();cx.fillStyle=p.solid?'#000':'#fff';cx.fill();cx.stroke();
        if(!p.solid){cx.beginPath();cx.moveTo(-p.s*.8,-p.s*.25);cx.lineTo(p.s*.8,-p.s*.25);cx.stroke()}}
      cx.restore()}
    for(let i=parts.length-1;i>=0;i--)if(parts[i].y>innerHeight+40)parts.splice(i,1);
    if(!over||parts.length)raf2=requestAnimationFrame(draw)};
  // the spoils leap out of the chest and land in their places
  const flyOut=()=>{const r=wrap.getBoundingClientRect(),ox=r.left+r.width/2,oy=r.top+r.height*.45;
    cards.forEach((c,i)=>{const b=c.getBoundingClientRect(),dx=ox-(b.left+b.width/2),dy=oy-(b.top+b.height/2);c.style.opacity='';
      c.animate([{transform:`translate(${dx}px,${dy}px) scale(.15) rotate(${i%2?-20:20}deg)`,opacity:0},{transform:`translate(${dx*.4}px,${dy*.55-60}px) scale(.8) rotate(${i%2?8:-8}deg)`,opacity:1,offset:.55},{transform:'scale(1.05,.95)',offset:.85},{transform:'none',opacity:1}],
        {duration:720,delay:i*130,easing:'cubic-bezier(.34,1.3,.64,1)',fill:'backwards'})})};
  const open=()=>{if(opened)return;opened=true;fx.classList.add('open');burst();fx.querySelector('.ch-skip').textContent='';
    at(260,flyOut);at(260+cards.length*130+900,finish)};
  const finish=()=>{if(over)return;over=true;timers.forEach(clearTimeout);cards.forEach(c=>{c.style.opacity='';setTimeout(()=>c.classList.remove('flying'),500)});
    fx.classList.add('gone');setTimeout(()=>{cancelAnimationFrame(raf2);fx.remove();removeEventListener('resize',size)},500);done()};
  addEventListener('resize',size);raf2=requestAnimationFrame(draw);
  // drop in, settle, rattle, then burst open; a tap opens it at once, a second tap skips to the end
  at(1250,open);
  fx.addEventListener('click',()=>{if(!opened){timers.forEach(clearTimeout);timers=[];open()}else finish()});
}
function lootPick(n,done){
  const r=RNG(G.seed,'loot',n.id),depth=depthOf(n)+2,opts=[randItem(r,depth),randItem(r,depth),randItem(r,depth)],gold=4+G.sea*2;if(hasP('prize'))opts.push(randItem(r,depth));
  cancelAnimationFrame(raf);B=null;G.inPort=false;G.moving=false;G.sel=null;
  let taken=null,ref=null,kind=null,first=true;   // which spoil, the item object it became, and 'add', 'locker' or 'up'
  const aboard=()=>ref&&(G.board.includes(ref)||(G.locker||[]).includes(ref));
  const canBack=()=>taken!=null&&kind!=='up'&&aboard();
  const take=(i,tgt,dst)=>{const o=opts[i];
    if(findMatch(o)){addItem(o);kind='up';ref=null}
    else if(tgt){ref={k:o.k,t:o.t};tgt.list.splice(dst,0,ref);seen(o.k);flash={ref,kind:'add'};kind=tgt.side==='l'?'locker':'add'}
    else{kind=addItem(o);if(!kind)return toast(`No room for size ${DEFS[o.k].s}. Sell something first.`);ref=kind==='up'?null:(kind==='locker'?G.locker:G.board).slice(-1)[0]}
    taken=i;save();return tgt&&kind!=='up'?dst:null};
  const putBack=()=>{for(const l of [G.board,G.locker||[]]){const k=l.indexOf(ref);if(k>=0)l.splice(k,1)}taken=ref=kind=null;save()};
  const render=()=>{
    const ups=new Set();let lups=new Set();
    if(taken==null){opts.forEach(o=>{const j=matchIdx(o);if(j>=0)ups.add(j)});lups=lockerUps(opts)}
    app.innerHTML=`${barHTML()}<div class="seahead"><h2>Spoils</h2><span>${taken==null?'Take one piece of their cargo':'One piece taken'}</span></div>
      <div class="offers spoils">${opts.map((o,i)=>{const d=DEFS[o.k],up=!!findMatch(o),can=fits(o);
        const top=`<button class="o-top" data-v="${i}" style="background:none;border:0;padding:0;text-align:left"><span class="o-icon t${o.t} c-${kindOf(o.k)}">${emb(o.k)}${icon(o.k)}${up&&taken==null?CHEV:''}</span><div><h3>${d.n}</h3><p class="o-meta"><span class="tierword">${TIER[o.t]}</span>, size ${d.s}${d.cd?`, ${d.cd}s`:''}</p></div></button>`;
        if(taken===i)return`<div class="offer spoil taken" data-sp="${i}">${top}<p class="o-desc">${kind==='up'?'Upgraded yours.':canBack()?'In your hold. Drag it back here to change your mind.':'Taken.'}</p>${canBack()?`<button class="buy up" data-back>Put back</button>`:''}</div>`;
        if(taken!=null)return`<div class="offer spoil left" data-sp="${i}">${top}<p class="o-desc">You can only take one.</p></div>`;
        return`<div class="offer spoil${first?' in':''}" data-sp="${i}" style="animation-delay:${i*70}ms">${top}${up&&upgradeHTML(o)?`<div class="o-desc">${upgradeHTML(o)}</div>`:`<p class="o-desc">${describe([o],0).L.join(' ')}</p>`}<button class="buy${up?' up':''}" data-take="${i}" ${can?'':'aria-disabled="true"'}>${up?'Take and upgrade':'Take'}</button></div>`}).join('')}</div>
      ${holdDock(`<button class="primary" id="sailon">${taken==null?`Take ${gold} gold and sail on`:'Sail on'}</button>`,ups,lups,
        taken==null?'Drag a spoil into your hold. Drag your own cargo onto the button below to sell it.':'Drag your cargo to rearrange, or onto Sail on to sell.')}`;
    first=false;
    bindBar();fitDock();
    const cards=[...app.querySelectorAll('.spoil')];
    bindHold('spoils',render,{
      from:taken==null?cards.map((el,i)=>({el,it:opts[i],drop:(tgt,dst)=>take(i,tgt,dst)})):[],
      back:canBack()?{el:cards[taken],ok:it=>it===ref,put:putBack}:null});
    app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{if(!dragJustEnded)itemSheet([opts[+b.dataset.v]],0,'view',()=>{})});
    app.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.take;
      if(!fits(opts[i]))return toast(roomNote(opts[i]));take(i);render()});
    const pb=app.querySelector('[data-back]');if(pb)pb.onclick=()=>{putBack();render()};
    document.getElementById('sailon').onclick=()=>{
      if(taken==null){G.gold+=gold;bump='gold';logL(`Took ${gold} gold as spoils.`)}
      else{const o=opts[taken];logL(`Took a ${TIER[o.t]} ${DEFS[o.k].n} as spoils.`)}
      save();coach('spoilsTaken');done()};
  };
  // the first look at the spoils comes out of a chest; the cards draw without their usual pop so the chest can throw them
  first=false;render();scrollTo(0,0);chestReveal([...app.querySelectorAll('.spoil')],()=>coach('spoils'));
}
