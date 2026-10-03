/* Ink Crossing: Fights: setup, effects engine (applyFx, emit), the step loop, HP bars and results, next sea and endings. */
"use strict";
/* ---------- battle ---------- */
function mkSide(name,max,list,traits,sea,cr){const b=sideOf(list,cr);
  return{name,max:max+b.hp,hp:max+b.hp,shield:0,burn:0,poison:0,list,regen:b.regen,gold:b.gold,sea,lowDone:false,risen:false,traits:traits.map(k=>({k,t:0})),
    items:list.map((it,i)=>({k:it.k,t:it.t,s:statsOf(list,i,cr),c:0,h:0,sl:0,g:{},lt:{},el:null,rec:{dmg:0,shield:0,heal:0,burn:0,poison:0,haste:0,charge:0,slow:0,uses:0,crits:0,to:{},slowTo:{}}}))}}
/* the item whose effect is being applied right now, so hits can be credited to it in the fight recap */
let recIt=null;
const hasT=(S,k)=>S.traits.some(x=>x.k===k);
/* fittings in a fight: fOn is a manned station doing its job, fDn its downside (set once in setupFight). postFx marks the station
   as having worked (its hand learns more from a win) and makes that hand's face jump on your ship's card. Returns true. */
const fOn=k=>B.fon.has(k),fDn=k=>B.fdn.has(k);
function postFx(k){const s=FITTINGS[k].spot,now=B.t;B.posts[s]=(B.posts[s]||0)+1;
  if(!B.quiet&&B.P&&B.P.fel&&!B.intro&&!((B.postT||{})[s]>now-.8)){B.postT=Object.assign({},B.postT,{[s]:now});const el=B.P.fel.querySelector(`.post[data-post="${s}"]`);if(el){el.classList.remove('fire');void el.offsetWidth;el.classList.add('fire')}}
  return true}
function fighterHTML(S,k,c){return`<div class="fighter ${k} ${c||''}" id="${k}f" ${k==='e'?'role="button" tabindex="0"':''}><div class="who"><span class="name">${S.name}</span><span class="num" id="${k}hp"></span></div><div class="hpwrap"><div class="hpbar"><div class="lag" id="${k}lag"></div><div class="hp" id="${k}hpf"></div><div class="inc burnseg" id="${k}bs"></div><div class="inc poiseg" id="${k}ps"></div><div class="sh" id="${k}shf"></div></div><div class="chips" id="${k}st" aria-live="off"></div></div><div class="fline"><p class="traits">${S.traits.map(t=>TRAITS[t.k].n).join(', ')}${k==='e'?' <span>Tap to read.</span>':''}</p>${k==='p'?deckHTML():''}</div></div>`}
/* your crew on deck, on your ship's card: a hand at a fitted station wears its badge and jumps when it works (postFx) */
function deckHTML(){const cs=(G&&G.crew)||[];if(!cs.length)return'';
  return`<div class="fdeck" aria-label="Crew">${cs.map(c=>{const k=c.post&&fitIn(c.post);
    return`<span class="dk${k?' post':''}"${k?` data-post="${c.post}" title="${CREW[c.k].n} at the ${FITTINGS[k].n}"`:` title="${CREW[c.k].n}"`}><span class="dkf">${crewFace(c.k)}</span>${k?`<span class="dkb">${fitGlyph(k)}</span>`:''}</span>`}).join('')}</div>`}
/* Builds the fight (B) without touching the screen. fight() uses it, and so does tools/sim.mjs, so the balance numbers match the game. */
function setupFight(n,f,board){
  const depth=f.depth,sh=SHIPS[G.ship];
  const pMax=shipHP(depth),on=new Set(Object.keys(FITTINGS).filter(fitOn)),dn=new Set(Object.keys(FITTINGS).filter(fitDown));
  B={fon:on,fdn:dn,posts:{},dot:{p:{burn:0,poison:0,storm:0},e:{burn:0,poison:0,storm:0}},t:0,wait:.9,speed:window._spd||1,over:false,quiet:false,bt:0,pt:0,st:0,storm:0,node:n,bell:BELL+(hasC('calm')?6:0)-(dn.has('stormsail')?5:0),ram:on.has('ram'),cr:craftRanks(),orders:ordersAboard(),
     P:mkSide(sh.n,pMax,board.map(x=>({...x})),[sh.trait],G.sea,crewCrafts()),E:mkSide('The '+f.e.n,f.hp,f.list,f.e.traits,G.sea)};
  const P=B.P,E=B.E;
  for(const S of [P,E])S.items.forEach(it=>{if(it.s.cd)it.c=it.s.cd*it.s.pre});
  if(hasT(P,'bulwark'))P.shield+=15;if(hasC('light'))P.shield+=20;
  P.items.forEach(it=>{if(!it.s.cd)return;if(hasC('whale'))it.s.cd=Math.round(it.s.cd*9)/10;if(hasC('current'))it.c=Math.max(it.c,it.s.cd*.25)});
  if(hasT(E,'smoke'))P.items.forEach(it=>it.sl=3);
  if(hasT(E,'rush'))E.items.forEach(it=>it.h=Math.max(it.h,4));
  if(hasT(E,'fire')){if(fOn('copper'))postFx('copper');P.burn+=fOn('copper')?Math.ceil(TRAITS.fire.x(G.sea)/2):TRAITS.fire.x(G.sea)}
  if(hasT(E,'whirl'))B.bell-=8;
  // fittings at the start of a fight
  // fittings at the start of a fight: the good half needs a hand at the station, the downside goes with the right hand there
  if(fDn('kraken'))E.max=E.hp=Math.round(E.max*1.1);
  if(fOn('kraken')){E.items.forEach(it=>it.sl=Math.max(it.sl,3));postFx('kraken')}
  const pc=P.items.filter(it=>it.s.cd);
  if(fOn('lateen')&&pc.length){pc[0].c=pc[0].s.cd*.98;postFx('lateen')}if(fDn('lateen')&&pc.length>1)pc[pc.length-1].sl=Math.max(pc[pc.length-1].sl,3);
  if(fOn('chase')&&P.items.some(it=>it.s.cd&&DEFS[it.k].tags.includes('C')))postFx('chase');
  P.items.forEach(it=>{const t=DEFS[it.k].tags;if(!it.s.cd)return;if(fOn('chase')&&t.includes('C'))it.c=Math.max(it.c,it.s.cd*.5);if(fDn('chase')&&t.includes('W'))it.sl=Math.max(it.sl,2)});
  if(fDn('studding'))P.items.forEach(it=>it.sl=Math.max(it.sl,1));
  if(fOn('planks'))postFx('planks');if(fOn('topsail')&&pc.length>1)postFx('topsail');
  // renown perks at the start of a fight
  if((B.cr.sea||0)>=2)P.items.forEach(it=>{if(it.s.cd)it.c=Math.max(it.c,it.s.cd*.15)});
  // your end slots, for fittings that care where cargo sits
  B.leftIt=pc[0]||null;B.rightIt=pc.length>1?pc[pc.length-1]:null;B.ends=[P.items[0],P.items[P.items.length-1]].filter(Boolean);
  return B;
}
function fight(n){
  app.style.paddingBottom='';
  const f=enemyOf(n);
  A.met[n.enemy]=1;saveA();G.fightAt=n.id;save();
  setupFight(n,f,G.board);const P=B.P,E=B.E;
  app.innerHTML=`${barHTML()}<section class="battle">
    ${fighterHTML(E,'e','k-'+(n.type==='boss'||n.type==='elite'?n.type:'threat'))}${boardHTML(E.list,'e')}
    <div class="mid"><span class="clock" id="clock"></span><div class="speed">${[1,2,4].map(v=>`<button data-sp="${v}" aria-pressed="${B.speed===v}">${v}×</button>`).join('')}<button id="skip">Skip</button></div></div>
    ${boardHTML(P.list,'p',null,holdCap())}${fighterHTML(P,'p','ship-'+(SHIPDRAW[G.ship]?G.ship:'sloop'))}
    <p class="tip">Tap any item to see what it does.</p></section>`;
  bindBar();
  for(const[S,k]of[[P,'p'],[E,'e']]){
    const els=app.querySelectorAll(`.board[data-side="${k}"] .item`);
    S.items.forEach((it,i)=>{it.el=els[i];els[i].onclick=()=>itemSheet(S.list,i,'view',()=>{})});
    S.fel=document.getElementById(k+'f');
    S.ui={lag:document.getElementById(k+'lag'),bs:document.getElementById(k+'bs'),ps:document.getElementById(k+'ps'),hp:document.getElementById(k+'hp'),hpf:document.getElementById(k+'hpf'),shf:document.getElementById(k+'shf'),st:document.getElementById(k+'st')};
  }
  B.wait=.9;startFx();
  // the opening: both sides sail into place, their cargo drops in tile by tile, the screen jolts and "Fight!" stamps down.
  // The clock holds until it's done; a tap anywhere starts the fight at once.
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&!G.tut){const bt=app.querySelector('.battle');B.intro=true;bt.classList.add('intro');
    bt.querySelectorAll('.board').forEach(b=>b.querySelectorAll('.item').forEach((el,i)=>el.style.setProperty('--i',i)));
    const call=document.createElement('div');call.className='fightcall';call.setAttribute('aria-hidden','true');call.innerHTML='<span>Fight!</span>';document.body.appendChild(call);const mr=bt.querySelector('.mid').getBoundingClientRect();call.style.top=(mr.top+mr.height/2)+'px';   // between the two sides
    const end=()=>{if(!B||!B.intro)return;B.intro=false;setTimeout(postFlash,250);setTimeout(()=>{bt.classList.remove('intro');call.remove()},500);bt.removeEventListener('pointerdown',end,true)};
    setTimeout(end,1650);bt.addEventListener('pointerdown',end,true)}else setTimeout(postFlash,300);
  E.fel.onclick=()=>{const ov=overlay(`<h2>${E.name}</h2>${traitsHTML(f.e,G.sea)}<button class="primary" data-a="c">Close</button>`);ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()})};
  app.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{B.speed=window._spd=+b.dataset.sp;app.querySelectorAll('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  document.getElementById('skip').onclick=()=>{if(B.over)return;B.intro=false;B.quiet=true;let k=0;while(!B.over&&k++<30000)step(.05);draw()};
  draw();last=performance.now();raf=requestAnimationFrame(loop);scrollTo(0,0);coach('fight');
}
/* the stations that went to work as the fight began (Planking, a Lateen Rig, Chase Guns...) jump once the fight is on screen */
function postFlash(){if(!B||B.over||B.quiet||!B.P.fel)return;B.P.fel.querySelectorAll('.post').forEach(el=>{if(B.posts[el.dataset.post]){el.classList.remove('fire');void el.offsetWidth;el.classList.add('fire')}})}
/* "when a fight starts" effects, both sides */
function startFx(){for(const[S,F]of[[B.P,B.E],[B.E,B.P]])S.items.forEach((it,i)=>{if(it.s.start)applyFx(S,F,it,i,it.s.start,1)})}
function loop(now){if(!B)return;let dt=Math.min(.1,(now-last)/1000)*B.speed;last=now;if(B.coachHold||PAUSE.on||B.intro)dt=0;
  while(dt>1e-6&&!B.over){const s=Math.min(.05,dt);step(s);dt-=s}draw();if(!B.over)raf=requestAnimationFrame(loop)}
function hit(T,d,type,src,o){o=o||{};
  if(o.weapon&&hasT(T,'thick'))d*=.75;d=Math.round(d);if(d<=0)return;
  if(T===B.P&&B.braceT>B.t){pop(T.fel,'Braced','shield');return}
  const pierce=o.pierce||(src&&hasT(src,'pierce'));let a=pierce?0:Math.min(T.shield,d);if(T===B.P&&a>0&&a<d&&(B.cr.carp||0)>=3)a=d;T.shield=Math.max(0,T.shield-a);T.hp-=d-a;if(recIt&&recIt.rec&&(type==='dmg'||type==='crit'))recIt.rec.dmg+=d;
  pop(T.fel,(type==='crit'?'Crit! ':'')+'−'+d,type==='burn'||type==='storm'?'soft':type);
  if(type==='dmg'||type==='crit'){squish(T.fel,'hit');if(o.weapon&&src)emit(T,src,'hurt',null,(o.depth||0))}
  if(!T.lowDone&&T.hp>0&&T.hp<T.max/2){T.lowDone=true;emit(T,src||(T===B.P?B.E:B.P),'lowhp',null,0)}
}
const rnd=(arr,n)=>{const p=arr.filter(x=>x.s.cd),o=[];for(let k=0;k<n&&p.length;k++)o.push(p.splice(R(p.length),1)[0]);return o};
function targets(S,i,tgt){const L=S.items;
  if(tgt==='adj')return[L[i-1],L[i+1]].filter(Boolean);
  if(tgt==='left')return L[i-1]?[L[i-1]]:[];if(tgt==='right')return L[i+1]?[L[i+1]]:[];
  if(tgt==='self')return[L[i]];if(tgt==='all')return L.slice();
  if(tgt==='rand1')return rnd(L.filter((x,j)=>j!==i),1);if(tgt==='rand2')return rnd(L.filter((x,j)=>j!==i),2);
  if(tgt.startsWith('tag:')){const t=tgt.slice(4);return L.filter((x,j)=>j!==i&&DEFS[x.k].tags.includes(t))}
  return[]}
function xVal(S,F,x){if(!x)return 0;const[from,r]=x;
  if(from==='shield')return S.shield*r;if(from==='enemyBurn')return F.burn*r;if(from==='enemyPoison')return F.poison*r;
  if(from==='missing')return(S.max-S.hp)*r;if(from==='empty')return((S===B.P?holdCap():HOLD)-used(S.list))*r;
  if(from.startsWith('tag:'))return S.list.filter(o=>DEFS[o.k].tags.includes(from.slice(4))).length*r;return 0}
function applyFx(S,F,it,i,f,depth){
  const g=it.g,el=it.el,prevRec=recIt;recIt=it;
  if(f.dmg!=null||f.dmgX){const W=DEFS[it.k].tags.includes('W'),C=DEFS[it.k].tags.includes('C'),me=S===B.P;
    let base=(f.dmg||0)+(g.dmg||0)+xVal(S,F,f.dmgX);
    if(me&&C&&fDn('grapeshot'))base=Math.max(1,base-2);
    const cr=me?B.cr:{},cc=(f.crit||0)+(me&&C&&(cr.gun||0)>=2?.1:0);
    for(let k=0;k<(f.multi||1);k++){let d=base;let c=cc&&Math.random()<cc;if(me&&W&&!C&&(cr.steel||0)>=2&&!B.firstCrit){B.firstCrit=true;c=true}if(c){d*=2;if(it.rec)it.rec.crits++}
      if(c&&me&&fOn('gull')&&!B.gullDone){B.gullDone=true;postFx('gull');S.items.forEach(x=>{if(x.s.cd)x.h=Math.max(x.h,2)});pop(S.fel,'The gull cries!','haste')}
      const pr=f.pierce||(me&&C&&(cr.gun||0)>=3)||(me&&c&&W&&!C&&(cr.steel||0)>=3)||(me&&W&&fOn('swivel')&&B.ends.includes(it)&&postFx('swivel'));
      hit(F,d,c?'crit':'dmg',S,{pierce:pr,weapon:W,depth});
      if(f.burnPerHit)burnOn(S,F,f.burnPerHit,it,depth);if(me&&C&&fOn('grapeshot')){postFx('grapeshot');burnOn(S,F,1,it,depth)}if(f.poisonPerHit)poisonOn(S,F,f.poisonPerHit,it,depth);
      if(hasT(S,'coil')&&W)F.poison+=1;if(c)emit(S,F,'crit',it,depth)}}
  const sh=(f.shield||0)+(g.shield||0)+Math.round(xVal(S,F,f.shieldX));
  const noSh=S===B.E&&S.burn>0&&(B.cr.fire||0)>=3;
  if((f.shield!=null||f.shieldX)&&sh>0&&!noSh){S.shield+=sh;if(it.rec)it.rec.shield+=sh;pop(el||S.fel,'+'+sh+' shield','shield');emit(S,F,'shield',it,depth)}
  const hl=(f.heal||0)+(g.heal||0)+Math.round(xVal(S,F,f.healX))-(S===B.P&&fDn('mermaid')?2:0);
  const noHl=S===B.E&&S.poison>0&&(B.cr.alch||0)>=2;
  if((f.heal!=null||f.healX)&&hl>0&&!noHl){if(S===B.P&&(B.cr.med||0)>=2&&S.hp+hl>S.max)S.shield+=Math.round(S.hp+hl-S.max);{const h0=S.hp;S.hp=Math.min(S.max,S.hp+hl);if(it.rec)it.rec.heal+=S.hp-h0}if(S.burn)S.burn--;if(hasT(S,'lotus'))S.shield+=Math.round(hl/3);pop(el||S.fel,'+'+hl,'heal');emit(S,F,'heal',it,depth)}
  if(f.cleanse)S.poison=0;
  if(f.douse){S.burn=Math.max(0,S.burn-f.douse);S.poison=Math.max(0,S.poison-Math.ceil(f.douse/2))}
  if(f.burn)burnOn(S,F,f.burn+(g.burn||0),it,depth);
  if(f.poison)poisonOn(S,F,f.poison+(g.poison||0),it,depth);
  if(f.slow){const sd=F===B.P&&(B.cr.sea||0)>=3?f.slow[1]/2:f.slow[1];rnd(F.items,f.slow[0]).forEach(x=>{x.sl=Math.max(x.sl,sd);if(it.rec){it.rec.slow++;const j=F.items.indexOf(x),t=it.rec.slowTo[j]=it.rec.slowTo[j]||{n:0,s:0};t.n++;t.s+=sd}if(x.el&&!B.quiet)squish(x.el,'hit')});pop(el||S.fel,'Slow','shield')}
  if(f.haste){const ts=targets(S,i,f.haste[0]).filter(x=>x.s.cd),hd=f.haste[1];ts.forEach(x=>{x.h=Math.max(x.h,hd);if(it.rec&&x!==it){const j=S.items.indexOf(x),t=it.rec.to[j]=it.rec.to[j]||{haste:0,hasteS:0,charge:0,chargeS:0};t.haste++;t.hasteS+=hd}});if(it.rec)it.rec.haste+=ts.length;if(ts.length){pop(el||S.fel,'Haste','haste');emit(S,F,'haste',it,depth)}}
  if(f.charge){targets(S,i,f.charge[0]).filter(x=>x.s.cd).forEach(x=>{const c0=x.c;x.c=Math.min(x.s.cd,x.c+f.charge[1]);if(it.rec&&x!==it){it.rec.charge++;const j=S.items.indexOf(x),t=it.rec.to[j]=it.rec.to[j]||{haste:0,hasteS:0,charge:0,chargeS:0};t.charge++;t.chargeS+=x.c-c0}if(x.el&&!B.quiet)squish(x.el,'proc')})}
  if(f.selfDmg){S.hp-=f.selfDmg;pop(S.fel,'−'+f.selfDmg,'soft')}
  if(f.grow)for(const k in f.grow)g[k]=(g[k]||0)+f.grow[k];
  recIt=prevRec;
}
function burnOn(S,F,n,it,depth){let b=n+(hasT(S,'kindle')?1:0);if(F===B.P){if(fDn('magazine'))b++;if(fOn('copper')){b=Math.ceil(b/2);postFx('copper')}}F.burn+=b;if(it&&it.rec)it.rec.burn+=b;pop(it&&it.el||S.fel,'Burn '+b);emit(S,F,'burn',it,depth)}
function poisonOn(S,F,n,it,depth){if(F===B.P&&fOn('copper')){n=Math.ceil(n/2);postFx('copper')}F.poison+=n;if(it&&it.rec)it.rec.poison+=n;pop(it&&it.el||S.fel,'Poison '+n);emit(S,F,'poison',it,depth)}
/* reactions: items listening for things that happen on their own side */
function emit(S,F,ev,src,depth){
  if(depth>3||!S.items)return;
  S.items.forEach((x,j)=>{if(!x.s.on.length)return;x.s.on.forEach(h=>{
    if(h.ev!==ev)return;
    if(ev==='use'&&(x===src||!src||(h.tag&&!DEFS[src.k].tags.includes(h.tag))))return;
    if(ev==='adjUse'&&(!src||Math.abs(S.items.indexOf(src)-j)!==1))return;
    const key=ev+(h.tag||''),icd=h.icd!=null?h.icd:.3;
    if(ev!=='lowhp'&&x.lt[key]!=null&&B.t-x.lt[key]<icd)return;x.lt[key]=B.t;
    if(x.el&&!B.quiet)squish(x.el,'proc');
    applyFx(S,F,x,j,h,depth+1)})})}
function act(k,S,F){const T=TRAITS[k],x=T.x?T.x(S.sea):0;
  if(k==='peck')hit(F,x,'dmg',S);
  if(k==='volley'){pop(S.fel,'Broadside!');hit(F,x,'dmg',S)}
  if(k==='haunt'&&!(S===B.E&&S.poison>0&&(B.cr.alch||0)>=2))S.hp=Math.min(S.max,S.hp+S.max*.01);
  if(k==='armor'&&!(S===B.E&&S.burn>0&&(B.cr.fire||0)>=3)){S.shield+=x;pop(S.fel,'+'+x+' shield','shield')}
  if(k==='song'){rnd(F.items,2).forEach(i=>i.sl=Math.max(i.sl,2));pop(S.fel,'Siren song','shield')}
  if(k==='flock')rnd(S.items,1).forEach(i=>i.h=Math.max(i.h,2));
  if(k==='captain'){rnd(S.items,2).forEach(i=>i.h=Math.max(i.h,2));pop(S.fel,"Captain's orders",'haste')}
  if(k==='constrict'){rnd(F.items,3).forEach(i=>i.sl=Math.max(i.sl,2));pop(S.fel,'Constrict','shield')}
  if(k==='tentacles'){pop(S.fel,'Tentacles!');hit(F,x,'dmg',S);rnd(F.items,2).forEach(i=>i.sl=Math.max(i.sl,2))}
}
function fire(S,F,it,i){
  squish(it.el,'fire');it.rec.uses++;
  applyFx(S,F,it,i,it.s.fx,0);
  if(S===B.P&&fOn('magazine')&&!B.magDone&&DEFS[it.k].tags.includes('C')){B.magDone=true;postFx('magazine');pop(it.el||S.fel,'Again!','haste');applyFx(S,F,it,i,it.s.fx,0)}
  emit(S,F,'use',it,0);emit(S,F,'adjUse',it,0);
}
function step(dt){
  if(B.wait>0){B.wait-=dt;return}
  checkOrders();
  if(B.ram){B.ram=false;pop(B.P.fel,'Ram!','haste');if(!B.quiet)toast(`Iron Ram: ${10+G.sea*5} damage`);hit(B.E,10+G.sea*5,'dmg',B.P);postFx('ram');if(fDn('ram')){B.P.hp-=3;pop(B.P.fel,'−3','soft')}}
  B.t+=dt;
  for(const[S,F]of[[B.P,B.E],[B.E,B.P]]){
    S.items.forEach((it,i)=>{if(!it.s.cd)return;let r=1;
      if(it.h>0){r*=2;it.h-=dt}if(it.sl>0){r*=.5;it.sl-=dt}
      if(hasT(S,'swift'))r*=1.15;if(S===B.E&&S.poison>=8&&(B.cr.alch||0)>=3)r*=.8;if(hasT(S,'frenzy')&&S.hp<S.max/2)r*=1.5;
      if(S===B.P){if(it===B.rightIt&&fOn('topsail'))r*=2;else if(it===B.leftIt&&fDn('topsail'))r*=.5;if(fDn('swivel')&&DEFS[it.k].tags.includes('C'))r*=.9}
      it.c+=dt*r;if(it.c>=it.s.cd){it.c-=it.s.cd;fire(S,F,it,i)}});
    S.traits.forEach(tr=>{const T=TRAITS[tr.k];if(!T.every)return;tr.t+=dt;if(tr.t>=T.every){tr.t-=T.every;act(tr.k,S,F)}});
  }
  B.bt+=dt;if(B.bt>=.5){B.bt-=.5;B.bodd=!B.bodd;for(const S of[B.P,B.E])if(S.burn>0){B.dot[S===B.P?'p':'e'].burn+=S.burn;hit(S,S.burn,'burn');if(!(S===B.E&&(B.cr.fire||0)>=2&&B.bodd))S.burn--;tick(S,'bu')}}
  B.pt+=dt;if(B.pt>=1){B.pt-=1;for(const S of[B.P,B.E]){if(S.poison>0&&!(S===B.P&&B.braceT>B.t)){let p=S.poison;if(S===B.P&&(B.cr.carp||0)>=2&&S.shield>0){const a=Math.min(S.shield,p);S.shield-=a;p-=a}S.hp-=p;B.dot[S===B.P?'p':'e'].poison+=p;if(p)pop(S.fel,'−'+p,'soft');tick(S,'po')}if(S.regen&&S.hp>0){S.hp=Math.min(S.max,S.hp+S.regen)}}
    if(fOn('mermaid')&&B.P.hp>0&&B.P.hp<B.P.max/2){postFx('mermaid');const h=Math.max(1,Math.round(B.P.max*.02));B.P.hp=Math.min(B.P.max,B.P.hp+h);pop(B.P.fel,'+'+h,'heal')}}
  if(B.t>=B.bell){B.st+=dt;if(B.st>=.5){B.st-=.5;B.storm++;const ps=Math.max(0,(fOn('stormsail')?(postFx('stormsail'),Math.ceil(B.storm/2)):B.storm));B.dot.p.storm+=ps;B.dot.e.storm+=B.storm;hit(B.P,ps,'storm');hit(B.E,B.storm,'storm')}}
  for(const S of[B.P,B.E])if(S.hp<=0&&hasT(S,'undying')&&!S.risen){S.risen=true;S.hp=S.max*.3;S.burn=0;S.poison=0;pop(S.fel,'It rises!')}
  if(B.P.hp<=0&&(B.cr.med||0)>=3&&!B.saved&&B.E.hp>0){B.saved=true;B.P.hp=1;pop(B.P.fel,'The surgeon saves you!','heal')}
  if(B.P.hp<=0||B.E.hp<=0)end(B.E.hp<=0&&B.P.hp>0);
}
function draw(){
  for(const S of[B.P,B.E]){const hp=Math.max(0,S.hp),pc=v=>Math.max(0,Math.min(100,v/S.max*100))+'%';
    S.ui.hpf.style.width=pc(hp);S.ui.shf.style.width=pc(S.shield);
    if(S.lagv==null||hp>=S.lagv){S.ui.lag.classList.add('snap');S.lagv=hp;S.ui.lag.style.width=pc(hp);void S.ui.lag.offsetWidth;S.ui.lag.classList.remove('snap')}
    else if(hp<S.lagv){S.lagv=hp;S.ui.lag.style.width=pc(hp)}
    const bw=Math.min(hp,S.burn*(S.burn+1)/2),pw=Math.min(hp-bw,S.poison*3);
    S.ui.bs.style.left=pc(hp-bw);S.ui.bs.style.width=pc(bw);S.ui.ps.style.left=pc(hp-bw-pw);S.ui.ps.style.width=pc(pw);
    S.ui.hp.textContent=`${Math.ceil(hp)} / ${S.max}`;
    chips(S);
    S.items.forEach(it=>{if(!it.el||!it.s.cd)return;it.el.querySelector('.fill').style.height=Math.min(100,it.c/it.s.cd*100)+'%';it.el.classList.toggle('hasted',it.h>0);it.el.classList.toggle('slowed',it.sl>0)})}
  const c=document.getElementById('clock');
  if(B.wait>0){c.textContent='Setting sail…';c.className='clock'}
  else if(B.t<B.bell){c.textContent=`Storm in ${Math.ceil(B.bell-B.t)}s`;c.className='clock'}
  else{c.textContent=`Storm: ${B.storm} damage`;c.className='clock bell'}
}
const CHIPI={
  sh:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h10v5c0 4-3 6-5 7-2-1-5-3-5-7z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  bu:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15c-3 0-5-2-5-5 0-3 3-4 3-8 2 1 3 3 3 5 1-1 1-2 1-3 2 2 3 4 3 6 0 3-2 5-5 5z" fill="#000"/></svg>',
  po:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5c-3 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-2-5-5-9z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="10.5" r="1.8" fill="#000"/></svg>'};
const CHIPN={sh:'Shield',bu:'Burn',po:'Poison'};
function tick(S,c){if(B.quiet||!S.ui)return;const el=S.ui.st.querySelector(`[data-c="${c}"]`);if(el)squish(el,'tick')}
function chips(S){
  const want=[['sh',Math.round(S.shield)],['bu',S.burn],['po',S.poison]].filter(x=>x[1]>0),sig=want.map(x=>x[0]).join();
  if(sig!==S.chipSig){const had=S.chipSig||'';S.chipSig=sig;
    S.ui.st.innerHTML=want.map(([c,v])=>`<span class="chip ${had.includes(c)?'':'new'}" data-c="${c}" title="${CHIPN[c]}" aria-label="${CHIPN[c]} ${v}">${CHIPI[c]}<b>${v}</b></span>`).join('')}
  want.forEach(([c,v])=>{const el=S.ui.st.querySelector(`[data-c="${c}"]`),b=el.querySelector('b'),prev=+b.textContent;
    if(prev!==v){b.textContent=v;el.setAttribute('aria-label',CHIPN[c]+' '+v);if(v>prev)squish(el,'bump')}});
}
function end(win){
  B.over=true;cancelAnimationFrame(raf);
  const n=B.node,e=ENEMIES[n.enemy],k=e.kind,depth=depthOf(n),foe=e.n;
  B.quiet=false;squish((win?B.E:B.P).fel,'ko');G.fightAt=null;
  let head,lines=[],btn,next;
  if(win){
    A.beat[n.enemy]=1;if(k==='e')A.elites++;if(k==='b')A.bosses++;saveA();
    const gold=(k==='b'?15+G.sea*10:k==='e'?10+depth:5+Math.floor(depth/2))+B.P.gold+(hasC('trade')?3:0)+(fOn('lion')?(postFx('lion'),4):0);
    G.gold+=gold;bump='gold';logL(`Beat the ${foe}. +${gold} gold.`);
    head=`You beat the ${foe}.`;lines.push(`+${gold} gold.`);
    if(k==='t'){btn='Take the spoils';next=()=>lootPick(n,chart)}
    else if(k==='e'){btn='Take the spoils';next=()=>lootPick(n,()=>chartPick(RNG(G.seed,'elite',n.id),`The ${foe} was carrying a chart and spare parts.`,chart,eliteFit(n)))}
    else if(G.sea<2){lines.push(`The way into ${SEAS[G.sea+1]} is open.`);btn=`Sail into ${SEAS[G.sea+1]}`;next=nextSea}
    else{btn='Sight land';next=()=>ending(true)}
  }else{
    const loss=lossOf(k);G.hull-=loss;bump='hull';
    logL(`Driven back by the ${foe}. Lost ${loss} hull.`);
    head=`The ${foe} beat you.`;lines.push(`−${loss} hull, ${Math.max(0,G.hull)} left.`);
    if(G.hull>0){const lf=loseFit(n);if(lf)lines.push(`They tore away your ${FITTINGS[lf].n}.`)}
    if(G.hull<=0){btn='Abandon ship';next=sink}
    else if(k==='b'){while(G.path.length>1&&G.path[G.path.length-1]===n.id)G.path.pop();G.at=G.path[G.path.length-1];delete G.shops[G.at];G.shopVisit=(G.shopVisit||0)+1;updateReveal();
      const left=sideRoute(G.at);lines.push(`You limp back to ${node(G.at).name} to refit.${left===false?' No side route is left: only the boss lies ahead.':` A side route opens off the port: a bounty to fight and a fishing ground.${left?'':' It is the last one.'}`}`);btn=`Return to ${node(G.at).name}`;next=()=>port(G.at)}
    else{lines.push('You slip past and sail on, empty-handed.');btn='Back to the chart';next=chart}
  }
  // every win teaches the crew; a hand whose station did its job this fight learns twice as much
  if(win&&G.crew){G.crew.forEach(c=>{const was=crewRank(c);c.xp+=1+(c.post&&B.posts[c.post]?1:0);const now=crewRank(c);
    if(now>was){const C=CREW[c.k];lines.push(`${C.n} is now rank ${now}: ${C.crafts.map(x=>RANKS[x][now-2]).join(' ')}`);logL(`${C.n} made rank ${now}.`)}})}
  if(win&&!(k==='b'&&G.sea>=2)){const gain=k==='b'?3:k==='e'?2:1,was=renownLvl();G.renown=(G.renown||0)+gain;
    lines.push(`+${gain} renown.${renownLvl()>was?` Renown ${renownLvl()}! Make a captain's pick.`:''}`);
    const nx=next;next=()=>perksOwed()>0?perkPick(nx):nx()}
  save();
  setTimeout(()=>{draw();const ov=win?victoryCard(head,lines,btn):defeatCard(head,lines,btn,G.hull<=0);
    const b=document.getElementById('next');b.focus();b.onclick=()=>{ov.remove();next()};
    b.insertAdjacentHTML('afterend','<button class="linkbtn rcbtn" id="recapbtn">Fight report</button>');document.getElementById('recapbtn').onclick=fightRecap},B.quiet?50:750);
}
/* the fight report: every item in hold order, numbered by position, with what it does, what it did and to whom: damage and
   crits, shield, healing, burn and poison, which of your items it hasted or charged (how often, how long), which of theirs
   it slowed, the items its aura boosted, and who helped it. Then the enemy's three busiest pieces the same way. */
const rnum=x=>Math.round(x*10)/10;
function fightRecap(){if(!B)return;
  const sideRows=(S,F,mine,only)=>{const cr=mine?crewCrafts():null,list=S.list,nm=(L,j)=>`${DEFS[L[j].k].n} <span class="rc-pos">#${j+1}</span>`;
    const val=r=>r.dmg+r.shield+r.heal+(r.burn+r.poison)*3+(r.haste+r.charge+r.slow)*4;
    const top=Math.max(1,...S.items.map(it=>val(it.rec)));
    // auras: who boosts whom, read from each item's stats in this hold
    const boosts=S.items.map(()=>[]),helped=S.items.map(()=>[]);
    S.items.forEach((it,j)=>{statsOf(list,j,cr).boost.forEach(n=>{const ks=list.map((o,k)=>k).filter(k=>k!==j&&DEFS[list[k].k].n===n),src=ks.find(k=>Math.abs(k-j)===1)??ks[0];if(src!=null){boosts[src].push(j);helped[j].push(`${nm(list,src)} boosted it`)}})});
    S.items.forEach((it,i)=>{for(const j in it.rec.to){const t=it.rec.to[j],w=[t.haste&&`hasted ${t.haste}×`,t.charge&&`charged ${rnum(t.chargeS)}s`].filter(Boolean).join(', ');if(w&&helped[j])helped[j].push(`${nm(list,i)} ${w}`)}});
    const order=only?S.items.map((it,i)=>i).sort((a,b)=>val(S.items[b].rec)-val(S.items[a].rec)).slice(0,only):S.items.map((it,i)=>i);
    return order.map(i=>{const it=S.items[i],d=DEFS[it.k],r=it.rec,use=mine?itemUse(it.k,cr):'all',dead=use==='none',L=[];
      if(dead)L.push('Did nothing: nobody aboard can work it.');
      else{
        if(r.dmg)L.push(`Dealt <b>${Math.round(r.dmg)}</b> damage${r.crits?`, ${r.crits} crit${r.crits>1?'s':''}`:''}.`);
        if(r.shield)L.push(`Gave <b>${Math.round(r.shield)}</b> shield.`);
        if(r.heal)L.push(`Healed <b>${Math.round(r.heal)}</b>.`);
        if(r.burn)L.push(`Burned ${mine?'them':'you'} for <b>${r.burn}</b>.`);
        if(r.poison)L.push(`Poisoned ${mine?'them':'you'} for <b>${r.poison}</b>.`);
        for(const j in r.to){const t=r.to[j];if(t.haste)L.push(`Hasted ${nm(list,+j)} <b>${t.haste}×</b>, ${rnum(t.hasteS)}s at double speed.`);if(t.charge)L.push(`Charged ${nm(list,+j)} <b>${t.charge}×</b>, ${rnum(t.chargeS)}s sooner.`)}
        for(const j in r.slowTo){const t=r.slowTo[j];L.push(`Slowed ${mine?'their':'your'} ${nm(F.list,+j)} <b>${t.n}×</b>, ${rnum(t.s)}s at half speed.`)}
        if(boosts[i].length)L.push(`Boosted ${[...new Set(boosts[i])].map(j=>nm(list,j)).join(', ')} all fight.`);
        if(!L.length)L.push(!d.cd?'Passive, and nothing in this hold for it to boost.':r.uses?'Fired, but did nothing this fight.':'Never got to fire.')}
      if(helped[i].length)L.push(`<span class="rc-help">Helped by ${helped[i].join('; ')}.</span>`);
      const what=describe(list,i,cr).L.map(x=>x.replace(/<span class="crt">[\s\S]*?<\/span>/g,'').replace(/<[^>]+>/g,'').trim()).filter(Boolean).join(' ');
      return`<div class="rc-row"><span class="o-icon t${it.t}">${icon(it.k)}</span><div class="rc-txt"><b>${d.n} <span class="rc-pos">#${i+1}</span></b><span class="rc-meta soft">${TIER[it.t]}${d.cd?`, ${statsOf(list,i,cr).cd}s`:', passive'}${r.uses&&!dead?`. Fired ${r.uses}×.`:'.'} ${what}</span>
        <ul class="rc-did">${L.map(x=>`<li>${x}</li>`).join('')}</ul><i class="rc-bar"><i style="width:${Math.round(val(r)/top*100)}%"></i></i></div></div>`}).join('')};
  const sum=S=>S.items.reduce((a,it)=>a+it.rec.dmg,0),dot=k=>{const d=B.dot[k];return[d.burn&&`burn ${d.burn}`,d.poison&&`poison ${d.poison}`,d.storm&&`the storm ${d.storm}`].filter(Boolean).join(', ')};
  const ov=overlay(`<h2>Fight report</h2><p class="soft">${Math.round(B.t)} seconds. Your cargo dealt ${Math.round(sum(B.P))} damage${dot('e')?`, plus ${dot('e')}`:''}. Theirs dealt ${Math.round(sum(B.E))}${dot('p')?`, plus ${dot('p')}`:''}. Numbers are positions in each hold, left to right.</p>
    <h3 class="rc-h">${B.P.name}</h3><div class="rc-list">${sideRows(B.P,B.E,true)}</div>
    <h3 class="rc-h">${B.E.name}, busiest cargo</h3><div class="rc-list">${sideRows(B.E,B.P,false,3)}</div>
    <button class="primary" data-a="close">Close</button>`,false,'recap');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()})}
/* the victory card: a "Victory!" banner stamps down in a burst of ink, stars pop around it, the gold counts up, and each line
   (renown, rank-ups, the way on) drops in after it before the button arrives */
function victoryCard(head,lines,btn){const g=lines[0].match(/^\+(\d+) gold\.$/),rest=g?lines.slice(1):lines;
  const ov=overlay(`<div class="vic-top"><svg class="vic-burst" viewBox="-100 -60 200 120" aria-hidden="true">${Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2,r1=i%2?56:50,r2=i%2?78:92;return`<path d="M${(Math.cos(a)*r1).toFixed(1)} ${(Math.sin(a)*r1*.42).toFixed(1)}L${(Math.cos(a)*r2).toFixed(1)} ${(Math.sin(a)*r2*.42).toFixed(1)}"/>`}).join('')}</svg>
      ${[[-78,-30,0],[82,-26,1],[-64,30,2],[70,34,3],[0,-52,4]].map(([x,y,i])=>`<svg class="vic-star" style="--x:${x}px;--y:${y}px;--i:${i}" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-9l2.6 5.6 6.2.7-4.6 4.2 1.3 6.1L0 4.5l-5.5 3.1 1.3-6.1-4.6-4.2 6.2-.7z"/></svg>`).join('')}
      <h2 class="vic-head">Victory!</h2></div>
    <p class="vic-sub">${head}</p>
    ${g?`<p class="vic-gold">${sicon('gold')}<b>+<span id="vicgold">0</span></b> gold</p>`:''}
    <div class="lines">${rest.map((l,i)=>`<p style="--i:${i}">${l}</p>`).join('')}</div>
    <button class="primary" id="next" style="--i:${rest.length}">${btn}</button>`,true,'result win');
  if(g){const to=+g[1],el=ov.querySelector('#vicgold'),still=matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(still)el.textContent=to;else{const t0=performance.now()+650,T=Math.min(900,300+to*40);
      const tick=now=>{const k=Math.max(0,Math.min(1,(now-t0)/T)),v=Math.round(to*(1-Math.pow(1-k,3)));if(el.textContent!==String(v)){el.textContent=v;squish(el.parentElement,'bump')}if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}}
  return ov}
/* the defeat card: a "Defeat" sign falls in and swings from one nail before settling crooked, a crack inks across it and rain
   falls behind; if the ship went down it reads "Sunk" and bubbles rise instead. The lines and button follow it in. */
function defeatCard(head,lines,btn,sunk){
  const drops=Array.from({length:sunk?9:14},(_,i)=>`<i style="--x:${(i*37+11)%100}%;--d:${((i*53)%17)/10}s;--s:${.9+((i*29)%7)/10}s"></i>`).join('');
  return overlay(`<div class="def-top${sunk?' sunk':''}"><div class="def-fx" aria-hidden="true">${drops}</div>
      <div class="def-sign"><span class="def-nail"></span><h2>${sunk?'Sunk':'Defeat'}</h2><svg class="def-crack" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path d="M70 0l-6 12 8 6-10 9 5 13"/></svg></div></div>
    <p class="def-sub">${head}</p>
    <div class="lines">${lines.map((l,i)=>`<p style="--i:${i}">${l}</p>`).join('')}</div>
    <button class="primary" id="next" style="--i:${lines.length}">${btn}</button>`,true,'result lose')}
/* Back on the chart (or in port, after a boss) after a lost fight: a card shows the hull you lost. Planks crack off one by one while the number counts down, then it fades. */
function hullLoss(before,after){
  document.querySelectorAll('.hullcard').forEach(c=>c.remove());
  const n=Math.min(before,40),lost=Math.min(n,before-Math.max(0,after));
  const c=document.createElement('div');c.className='hullcard';c.setAttribute('role','status');
  c.innerHTML=`<svg class="hc-ship" viewBox="-2 -2 28 28" aria-hidden="true"><g stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></svg>
    <div><p class="hc-head">Hull damaged</p><p class="hc-num"><b>${before}</b> hull left <span class="hc-loss">−${before-after}</span></p>
    <div class="planks" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i${i>=n-lost?` class="go" style="--d:${(n-1-i)*140}ms"`:''}></i>`).join('')}</div></div>`;
  c.setAttribute('aria-label',`Hull damaged. Lost ${before-after}, ${Math.max(0,after)} left.`);
  document.body.appendChild(c);
  const b=c.querySelector('.hc-num b');
  for(let k=1;k<=before-after;k++)setTimeout(()=>{b.textContent=before-k;squish(b,'bump')},700+(k-1)*140);
  setTimeout(()=>c.classList.add('out'),2900);setTimeout(()=>c.remove(),3300);
}
/* losing a fight costs one of your fittings, picked by the voyage code so every captain on this voyage loses the same one */
function loseFit(n){const have=Object.keys(SPOTS).filter(s=>fitIn(s));if(!have.length)return null;
  const spot=have[ri(RNG(G.seed,'lostfit',n.id,G.day),have.length)],k=G.fit[spot];G.fit[spot]=null;
  if(k==='studding')updateReveal();logL(`Lost my ${FITTINGS[k].n} in the fight.`);return k}
/* a renown level: pick 1 of 3 captain's picks, offered by the voyage code. Orders then ask when the crew should carry them out. */
function perkPick(done){
  const taken=G.perks||[],pool=Object.keys(PERKS).filter(k=>!taken.includes(k)&&!(G.tut&&PERKS[k].order)),   // the trial offers rules only, no orders to time
    r=RNG(G.seed,'perk',taken.length),opts=[];
  while(opts.length<3&&pool.length)opts.push(pool.splice(ri(r,pool.length),1)[0]);
  if(!opts.length)return done();
  const lvl=taken.length+1,sh=SHIPS[G.ship];
  // the level-up: a star medal spins in with the new level on it, little stars burst off it, and the three picks are dealt in
  const ov=overlay(`<div class="rn-up" aria-hidden="true"><span class="rn-bits">${Array.from({length:10},(_,i)=>`<i style="--a:${i*36}deg;--d:${(i%3)*50}ms"><svg viewBox="-6 -6 12 12"><path d="M0-5l1.5 3.2 3.5.4-2.6 2.4.7 3.5L0 3.6l-3.1 1.9.7-3.5L-5-.4l3.5-.4z"/></svg></i>`).join('')}</span>
      <svg class="rn-medal" viewBox="0 0 100 100"><path d="M50 4l13 27 29 4-21 20 5 29-26-14-26 14 5-29L8 35l29-4z"/><text x="50" y="66" text-anchor="middle">${lvl}</text></svg></div>
    <p class="rn-ribbon">Renown up!</p>
    <h2 class="rn-title">Renown ${lvl}</h2><p class="soft rn-sub">Word of ${sh.n} spreads along the coast. Make a captain's pick for the rest of the voyage.</p>
    <div class="picks">${opts.map((k,i)=>`<button class="pick" data-pk="${k}" style="--i:${i}"><span class="pi plain">${STAR}</span><div><b>${PERKS[k].n}${PERKS[k].order?' <span class="soft">order</span>':''}</b><span class="d">${PERKS[k].d}${PERKS[k].order?' Once a fight.':''}</span></div></button>`).join('')}</div>`,true,'perkpick');
  coach('renown');
  const fin=k=>{coach('perkDone');G.perks=taken.concat(k);logL(`Renown ${lvl}: ${PERKS[k].n}${PERKS[k].order?`, ${WHEN[orderWhen(k)]}`:''}.`);save();if(perksOwed()>0)perkPick(done);else done()};
  // choosing: the pick you tap jumps forward and gets stamped, the others drop away, then the voyage carries on
  let chosen=false;
  ov.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{if(chosen)return;chosen=true;const k=b.dataset.pk,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
    ov.querySelectorAll('.pick').forEach(x=>x.classList.add(x===b?'chosen':'dropped'));
    setTimeout(()=>{
    if(!PERKS[k].order){ov.remove();toast(PERKS[k].n);return fin(k)}
    ov.querySelector('.sheet').innerHTML=`<h2>${PERKS[k].n}</h2><p class="soft">${PERKS[k].d} When should the crew do it? You can change this on your ship card.</p>
      <div class="picks">${Object.entries(WHEN).map(([w,t])=>`<button class="opt" data-w="${w}"><b>${t[0].toUpperCase()+t.slice(1)}</b>${w===PERKS[k].when?'<span>Suggested</span>':''}</button>`).join('')}</div>`;
    ov.querySelectorAll('[data-w]').forEach(x=>x.onclick=()=>{G.orders=Object.assign({},G.orders,{[k]:x.dataset.w});ov.remove();toast(`${PERKS[k].n} ${WHEN[x.dataset.w]}`);fin(k)});
    ov.querySelector('[data-w]').focus()},still?0:650)});
  ov.querySelector('.pick').focus();
}
/* ---------- captain's orders: picked with renown, each fires once a fight on the trigger you chose ---------- */
const WHEN={start:'when the fight starts',half:'when you drop below half health',storm:'when the storm hits',ehalf:'when the enemy drops below half health'};
function ordersAboard(){return((G&&G.perks)||[]).filter(k=>PERKS[k]&&PERKS[k].order).map(k=>({k,when:(G.orders&&G.orders[k])||PERKS[k].when,done:false}))}
function checkOrders(){const P=B.P,E=B.E;(B.orders||[]).forEach(o=>{if(o.done)return;
  const go=o.when==='start'||(o.when==='half'&&P.hp<P.max/2)||(o.when==='storm'&&B.t>=B.bell)||(o.when==='ehalf'&&E.hp<E.max/2);if(!go)return;o.done=true;
  pop(P.fel,PERKS[o.k].n,'crit');if(!B.quiet)toast(`Order: ${PERKS[o.k].n}`);
  if(o.k==='brace')B.braceT=B.t+2;
  if(o.k==='allhands')P.items.forEach(x=>{if(x.s.cd)x.h=Math.max(x.h,2)});
  if(o.k==='fire')P.items.forEach(x=>{const t=DEFS[x.k].tags;if(x.s.cd&&(t.includes('W')||t.includes('C')))x.c=Math.min(x.s.cd,x.c+x.s.cd*.5)});
  if(o.k==='douse'){P.burn=0;P.poison=0}
  if(o.k==='rigging')E.items.forEach(x=>x.sl=Math.max(x.sl,3));
  if(o.k==='patch'){const h=Math.round(P.max*.15);P.hp=Math.min(P.max,P.hp+h);pop(P.fel,'+'+h,'heal')}})}
/* the fitting an elite carries: seeded, and never one you already have */
function eliteFit(n){const r=RNG(G.seed,'elitefit',n.id),pool=Object.keys(FITTINGS).filter(k=>!hasF(k));return pool.length?pool[ri(r,pool.length)]:null}
function nextSea(){
  G.sea++;G.map=genMap(G.seed,G.sea);G.at=G.map.start;G.path=[G.at];G.full=false;G.extra=0;updateReveal();
  lore(LORE[G.sea]);save();
  seaCrossing(G.sea,()=>{port(G.at);
    const ov=overlay(`<h2>${SEAS[G.sea]}</h2><p class="log">${LORE[G.sea]}</p><button class="primary">Open the market</button>`,true);
    const b=ov.querySelector('button');b.onclick=()=>ov.remove();b.focus()});
}
/* crossing into a new sea, told like a film: black bars close in, your ship drives through heavy swell under slanting rain
   (fog banks rolling over it into the Fog Sea, lightning splitting the sky into the Deep), the sea's name slams onto the
   screen, and the bars close to black before you make port. A tap skips it; reduced motion shows just the title. */
function seaCrossing(sea,then){
  const fx=document.createElement('div'),still=matchMedia('(prefers-reduced-motion:reduce)').matches,deep=sea>=2;
  const wave=(y,amp,len)=>{let d=`M${-len*2} ${y}`;for(let x=-len*2;x<1200;x+=len)d+=`q${len/4} ${-amp} ${len/2} 0t${len/2} 0`;return`<path class="w" d="${d}V400H${-len*2}z"/>`};
  const rain=Array.from({length:deep?60:40},(_,i)=>`<i style="--x:${(i*53)%100}%;--d:${((i*37)%20)/20}s;--s:${.45+((i*29)%10)/40}s"></i>`).join('');
  const fog=sea===1?`<div class="sx-fog">${Array.from({length:5},(_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>`:'';
  fx.className='seacross'+(deep?' deep':'')+(still?' still':'');
  fx.innerHTML=`<div class="sx-rain">${rain}</div>
    <svg class="sx-sea" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      ${deep?'<path class="sx-bolt" d="M286 0l-18 52 14 4-26 58 10 3-30 70 44-80-12-4 26-50-14-4 18-49z"/>':''}
      <path class="sx-horizon" d="M-20 150H420"/>
      <g class="sx-w1">${wave(170,8,80)}</g>
      <g class="sx-ship"><g transform="translate(140 98) scale(1.05)"><g class="shipdraw ship-${SHIPDRAW[G.ship]?G.ship:'sloop'}" stroke="#000" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">${SHIPDRAW[G.ship]||SHIPDRAW.sloop}</g></g></g>
      <g class="sx-w2">${wave(206,deep?22:14,deep?120:100)}</g>
      <g class="sx-w3">${wave(240,deep?30:18,deep?150:120)}</g>
    </svg>${fog}
    <div class="sx-title"><p class="sx-kicker">Sea ${sea+1} of 3</p><h2 class="sx-name">${SEAS[sea]}</h2></div>
    <div class="sx-bar top"></div><div class="sx-bar bot"></div>`;
  document.body.appendChild(fx);
  let gone=false;
  const end=()=>{if(gone)return;gone=true;clearTimeout(t1);then();fx.classList.add('out');setTimeout(()=>fx.remove(),500)};
  const t1=setTimeout(()=>{fx.classList.add('close');setTimeout(end,550)},still?1600:4600);
  setTimeout(()=>fx.addEventListener('click',end),still?0:400);
}
function sink(){ending(false)}
function ending(win){
  cancelAnimationFrame(raf);
  lore(win?LORE.end:LORE.sink);
  const reached=win?3:G.sea+1,score=win?100+G.hull:G.sea*10+Math.round(node(G.at).row*6/mapRows());
  if(win)A.wins++;A.best=Math.max(A.best,reached);
  if(G.seed.startsWith('D')){const txt=win?`reached the Far Shore with ${G.hull} hull`:`sank in ${SEAS[G.sea]}`;const prev=A.daily[G.seed+'#s']||-1;if(score>prev){A.daily[G.seed+'#s']=score;A.daily[G.seed]=txt}}
  saveA();const done=G;clearSave();
  const ov=overlay(`<h2>${win?'You reached the Far Shore.':'Your ship went down.'}</h2><p class="log">${win?LORE.end:LORE.sink}</p>
    <div class="lines"><p>${win?`Three seas charted in ${G.day} days, with ${G.hull} hull to spare.`:`You made it into ${SEAS[G.sea]} on day ${G.day}.`}</p><p class="seed">Voyage: ${codeOf(G.seed)}</p></div>
    <div class="sh-actions"><button class="ghost" data-a="log">Read your log</button><button class="primary" data-a="home">Back to the harbour</button></div>`,true,'result');
  ov.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='log'){journal(done)}else{ov.remove();title()}});
}
