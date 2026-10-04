/* Ink Crossing: Voyage state (G), Atlas (A), saving, map generation and seeded enemy boards. */
"use strict";
/* ---------- state ---------- */
let G=null,B=null,raf=0,last=0,bump=null,fresh=false;
/* Saved data lives in localStorage: 'crossing-atlas' (meta progress) and 'crossing-voyage' (the voyage in progress).
   RULES FOR CHANGES: never rename or remove a field; give new fields a default in migrateAtlas / VOYAGE_DEFAULTS;
   if a field's meaning changes, bump the schema number and convert old data in the migrate function. */
const ATLAS_SCHEMA=1,VOYAGE_SCHEMA=1;
const VOYAGE_DEFAULTS={sv:VOYAGE_SCHEMA,charts:[],log:[],shops:{},creel:[],rod:0,tip:0,far:0,extra:0,full:false,freeRoll:true,quest:null,hock:null,locker:null,fightAt:null,boarded:null,unrolled:-1,fit:null,renown:0,perks:null,crew:null,orders:null,posted:0,triage:0,qmDay:null,capGold:0,won:0,lmGhost:null};
function readKey(key){let raw=null;try{raw=localStorage.getItem(key)}catch(e){}if(!raw)return{raw:null,val:null};
  try{return{raw,val:JSON.parse(raw)}}catch(e){try{localStorage.setItem(key+'-unreadable',raw)}catch(_){}return{raw,val:null}}}
function migrateAtlas(m){
  const out=Object.assign({sv:ATLAS_SCHEMA,voyages:0,wins:0,bosses:0,elites:0,met:{},beat:{},items:{},charts:{},fish:{},people:{},tips:{},tipsOff:false,tutDone:false,best:0,daily:{},captain:null,claims:{}},m||{});
  ['met','beat','items','charts','fish','people','tips','daily','claims'].forEach(k=>{if(!out[k]||typeof out[k]!=='object')out[k]={}});
  ['voyages','wins','bosses','elites','best'].forEach(k=>{if(typeof out[k]!=='number'||!isFinite(out[k]))out[k]=0});
  // for the future: if(out.sv<2){ ...convert...; out.sv=2; }
  out.sv=ATLAS_SCHEMA;return out}
function migrateVoyage(v){if(!v||!v.map||!v.board)return null;const out=Object.assign({},VOYAGE_DEFAULTS,v);out.sv=VOYAGE_SCHEMA;if(!out.crew)crewFromOldSave(out);trimHold(out);if(out.perks&&out.perks.some(k=>!PERKS[k]))out.perks=[];mapCrew(out);oldFits(out,v);return out}
/* holds shrank from 10 slots to 9: whatever no longer fits moves to the locker if there's room, otherwise it's sold */
function trimHold(g){const cap=g.fit&&Object.values(g.fit).includes('planks')?HOLD-1:HOLD;
  while(g.board.length&&used(g.board)>cap){const it=g.board.pop(),d=DEFS[it.k];
    if(g.locker&&used(g.locker)+d.s<=LOCK){g.locker.push(it);g.log.push({d:g.day,t:`The hold shrank to ${cap} slots. Stowed the ${d.n} in the locker.`})}
    else{const p=Math.max(1,Math.floor(price(it.k,it.t)/2));g.gold+=p;g.log.push({d:g.day,t:`The hold shrank to ${cap} slots. Sold the ${d.n} for ${p} gold.`})}}}
/* voyages from before crafts: crew items leave the hold for the deck, the ship gets its starting crew, and free berths go to whoever covers the crafts the hold needs most */
function crewFromOldSave(g){
  const b=SHIPS[g.ship].berths||3,crew=[],has=k=>crew.some(c=>c.k===k),addC=k=>{if(!has(k)&&CREW[k]&&crew.length<b)crew.push({k,xp:0,m:3})};
  for(const list of [g.board,g.locker||[]])for(let i=list.length-1;i>=0;i--)if(DEFS[list[i].k]&&DEFS[list[i].k].tags.includes('K')){const k=list.splice(i,1)[0].k;if(CREW[k]&&!has(k)&&crew.length<b)crew.push({k,xp:0,m:3});else g.gold+=price(k,0)}
  (SHIPS[g.ship].crew||[]).forEach(addC);
  const need={};g.board.forEach(it=>itemCrafts(it.k).forEach(c=>need[c]=(need[c]||0)+1));
  while(crew.length<b){const cov=new Set(crew.flatMap(c=>CREW[c.k].crafts));let best=null,bv=0;
    for(const k in CREW){if(has(k))continue;const v=CREW[k].crafts.filter(c=>!cov.has(c)).reduce((a,c)=>a+(need[c]||0),0);if(v>bv){bv=v;best=k}}
    if(!best)break;crew.push({k:best,xp:0,m:3})}
  g.crew=crew;
  for(const id in g.shops||{}){const S=g.shops[id];if(S.offers)S.offers=S.offers.map(o=>o&&DEFS[o.k]&&DEFS[o.k].tags.includes('K')?null:o)}
}
function loadA(){const{raw,val}=readKey('crossing-atlas'),out=migrateAtlas(val);
  if(raw&&val&&val.lastVersion!==VERSION){try{localStorage.setItem('crossing-atlas-backup',raw)}catch(e){}}   // one safety copy per update
  out.lastVersion=VERSION;return out}
let A=loadA();
function saveA(){try{localStorage.setItem('crossing-atlas',JSON.stringify(A))}catch(e){}}
function save(){if(G&&G.tut)return;try{const{sel,moving,...r}=G;localStorage.setItem('crossing-voyage',JSON.stringify(r))}catch(e){}}
function load(){return migrateVoyage(readKey('crossing-voyage').val)}
function clearSave(){try{localStorage.removeItem('crossing-voyage')}catch(e){}}
const hasC=k=>!!(G&&G.charts&&G.charts.some(c=>c.k===k));
/* ---------- crew ---------- */
/* crew roles came in (0.38): old hands become the role that took over their work, one of each; extras are paid off.
   Station posts are cleared, and port taverns are restocked with roles. */
function mapCrew(g){if(!g.crew)return;const seen=new Set();
  g.crew=g.crew.filter(c=>{const k=CREW[c.k]?c.k:OLDCREW[c.k];delete c.post;if(!k||seen.has(k)){g.gold+=5;return false}seen.add(k);c.k=k;return true});
  for(const id in g.shops||{}){const S=g.shops[id];if(S.tavern)S.tavern=S.tavern.map(k=>k&&(CREW[k]?k:OLDCREW[k])||null).map((k,i,a)=>k&&!seen.has(k)&&a.indexOf(k)===i?k:null)}}
/* fittings were redesigned (0.41): any old fitting aboard or on a saved bench is refunded in full. Wins are counted from then;
   an older voyage starts from its renown, which counts wins (elites and bosses count more). */
function oldFits(g,v){if(v.won==null)g.won=g.renown||0;
  if(g.fit)for(const s in g.fit){const k=g.fit[s];if(k&&!FITTINGS[k]){g.fit[s]=null;g.gold+=OLDFITP[k]||10;(g.log=g.log||[]).push({d:g.day,t:`The shipwrights recalled an old fitting and paid back ${OLDFITP[k]||10} gold.`})}}
  for(const id in g.shops||{}){const S=g.shops[id];if(S.fits)S.fits=S.fits.map(k=>k&&FITTINGS[k]?k:null)}}
/* is a hand with this perk aboard? */
const crewHas=perk=>!!(G&&G.crew&&G.crew.some(c=>CREW[c.k]&&CREW[c.k].perk===perk));
const berths=()=>(SHIPS[G.ship].berths||3)+(hasP('berth')?1:0);
const rankXP=()=>hasP('drill')?RANKXP.map(x=>Math.max(0,x-1)):RANKXP;
const crewRank=c=>rankXP().filter(x=>c.xp>=x).length;
const wageOf=k=>Math.max(0,CREW[k].wage-(hasP('paymaster')?1:0));
/* the Guild pays your ship's own hands to sign on at Gullhaven, so a bare ship can always crew the cargo it starts with */
const guildPays=k=>!!(G&&G.sea===0&&G.map&&G.at===G.map.start&&(SHIPS[G.ship].crew||[]).includes(k));
const feeOf=k=>guildPays(k)?0:Math.max(1,CREW[k].fee-(hasP('recruiter')?3:0));
/* the crafts your crew cover, or null (everything works) when there's no voyage */
function crewCrafts(){if(!G||!G.crew)return null;return new Set(G.crew.flatMap(c=>CREW[c.k].crafts))}
/* the rank of each craft aboard: the best crew member with it */
function craftRanks(){const r={};((G&&G.crew)||[]).forEach(c=>CREW[c.k].crafts.forEach(k=>r[k]=Math.max(r[k]||0,crewRank(c))));return r}
function hire(k){G.crew=G.crew||[];G.crew.push({k,xp:0,m:3});if(CREW[k].perk==='triage'&&!G.triage)G.triage=20;logL(feeOf(k)?`Hired ${an(CREW[k].n)} for ${feeOf(k)} gold.`:`Signed on ${an(CREW[k].n)}. The Guild paid.`)}
/* wages at every new port: paid in order while the gold lasts. Unpaid crew lose heart, and leave when it runs out. */
function payWages(){if(!G.crew||!G.crew.length||G.tut||G.path.length<2)return'';   // nothing is owed in the port you set out from
  let paid=0,left=[],sad=[];
  G.crew=G.crew.filter(c=>{const w=wageOf(c.k);if(G.gold>=w){G.gold-=w;paid+=w;c.m=Math.min(3,c.m+1);return true}
    c.m--;if(hasP('loyal'))c.m=Math.max(1,c.m);if(c.m<=0){left.push(CREW[c.k].n);return false}sad.push(CREW[c.k].n);return true});
  if(paid)logL(`Paid ${paid} gold in wages.`);
  if(sad.length)logL(`Couldn't pay ${sad.join(' and ')}. They're grumbling.`);
  if(left.length)logL(`${left.join(' and ')} left the ship over unpaid wages.`);
  return[paid?`Paid ${paid} gold in wages`:'',sad.length?`${sad.join(' and ')} went unpaid`:'',left.length?`${left.join(' and ')} quit`:''].filter(Boolean).join('. ')}
/* fittings: G.fit is {hull,sails,guns,head}, or null until the first one */
const hasF=k=>!!(G&&G.fit&&Object.values(G.fit).includes(k));
const fitIn=spot=>G&&G.fit&&G.fit[spot]||null;
const fitHP=()=>G&&G.fit?Object.values(G.fit).reduce((a,k)=>a+(k&&FITTINGS[k].hp||0),0):0;
/* your hold's size: HOLD slots, one fewer with Double Planking. Never more than HOLD. */
/* your ship's health in a fight at this depth: it grows as the seas get deeper, plus the Bulwark's trait, Coral Reef and fittings */
function shipHP(depth){const sh=SHIPS[G.ship];return sh.hp+depth*10+(sh.trait==='bulwark'?40:0)+(hasC('coral')?25:0)+fitHP()+(G.triage||0)+renownLvl()*CAPHP+(G.tut?120:0)}
/* the health you'd fight with next: in a fight, that fight's; on the way, at the next row's depth */
function nextHP(){if(B&&B.P)return B.P.max;const n=G.map&&node(G.at);if(!n)return shipHP(0);return shipHP(depthOf({row:Math.min(n.row+1,mapRows())}))}
const holdCap=()=>HOLD;
const HULL_MAX=20;   // the shipwright repairs hull up to 20
const repairCost=()=>hasP('wright')?1:2;
/* the captain's level (G.renown holds the points): win fights to earn them (threat 1, elite 2, boss 3). Each level adds CAPHP
   health in fights and lets you make a captain's pick or take gold (G.capGold counts levels taken as gold). Resets every voyage. */
const CAPHP=10,capGoldOf=lvl=>8+lvl*4;
const RENOWN=[3,7,12,18,25];
const renownLvl=()=>RENOWN.filter(x=>(G.renown||0)>=x).length;
const renownNext=()=>RENOWN.find(x=>(G.renown||0)<x);
const perksOwed=()=>renownLvl()-(G.perks||[]).length-(G.capGold||0);   // after the captain's picks came in, old saves re-pick (see migrateVoyage)
/* everything your perks add up to, read by the fight */
const hasP=k=>!!(G&&G.perks&&G.perks.includes(k));
/* fit a part. The one it replaces sells for half. */
function equip(k){const f=FITTINGS[k],old=fitIn(f.spot);G.fit=Object.assign({hull:null,sails:null,guns:null,head:null},G.fit);
  let back=0;if(old){back=Math.floor(FITTINGS[old].p/2);G.gold+=back}
  G.fit[f.spot]=k;if(k==='studding'||old==='studding')updateReveal();
  logL(old?`Fitted ${f.n} in place of ${FITTINGS[old].n}, which sold for ${back} gold.`:`Fitted ${f.n}.`);return back}
/* can this part go on? Double Planking needs a free slot, and taking it off always fits */
/* a fitting's price: the maiden voyage's are cheap, so the trial can afford one */
const fitP=k=>G&&G.tut?8:FITTINGS[k].p;
function canEquip(k){return fitIn(FITTINGS[k].spot)!==k}
const node=id=>G.map.nodes.find(n=>n.id===id);
/* how many rows a sea's chart has before the boss: 9 now (12 for a while, 6 on charts drawn before that, and the tutorial's) */
const ROWS=9,mapRows=()=>(G&&G.map&&G.map.rows)||6;
const depthOf=n=>n.depth!=null?n.depth:G.sea*7+Math.round(n.row*6/mapRows());   // side-route stops carry their own
const reachable=()=>G.map.edges.filter(e=>e[0]===G.at).map(e=>e[1]).filter(id=>{const n=node(id);return!(n&&n.side&&G.path.includes(id))});   // a side stop is sailed once
/* after losing to a boss: two side stops open off the port you limped back to, a bounty to fight and a fishing ground, each
   sailed once and leading back to that port, so a broke captain can earn gold to refit before trying again. Each loss opens a
   fresh pair (seeded by the voyage and the loss) and closes any left from the last one. They sit on the boss's row, on the
   port's side of the chart, at the port's depth. */
const SIDES=2;
function sideRoute(pid){const m=G.map,p=node(pid),k=m.sideN||0;
  m.edges=m.edges.filter(([a,b])=>!(a===pid&&node(b)&&node(b).side));
  if(k>=SIDES)return false;m.sideN=k+1;   // two side routes per boss, then it's the boss or nothing
  const r=RNG(G.seed,'side',G.sea,k),pool=Object.keys(ENEMIES).filter(e=>ENEMIES[e].sea===G.sea&&ENEMIES[e].kind==='t');
  const row=mapRows(),depth=depthOf(p),left=p.x<170;
  [['threat',left?100:240],['fish',left?30:310]].forEach(([type,x])=>{const id=G.sea*100+m.nodes.length;
    const n={id,row,col:x<170?0:3,x,type,side:1,depth};if(type==='threat')n.enemy=pick(r,pool);
    m.nodes.push(n);m.edges.push([pid,id],[id,pid])});return SIDES-k-1}
function logL(t){G.log.push({d:G.day,t})}
function lore(t){G.log.push({lore:1,t})}
function seen(k){if(!A.items[k]){A.items[k]=1;saveA()}}

/* ---------- map generation ---------- */
/* what the open water between ports is made of, per sea: the Shallows lean on fishing and isles, the Fog Sea on strangers and
   unknown waters, the Deep on elites. Each chart also features one kind of stop at half again its share (FEATURE), so two
   charts of the same sea still feel different. */
const SEAMIX=[{threat:34,event:15,npc:11,fish:16,elite:10,isle:14},{threat:31,event:21,npc:16,fish:10,elite:11,isle:11},{threat:31,event:15,npc:11,fish:10,elite:18,isle:15}];
const FEATURE=['event','npc','fish','isle','elite'];
function genMap(seed,sea){
  const r=RNG(seed,'map',sea),nodes=[],edges=new Set(),pos={};
  const add=(row,col)=>{const key=row+'_'+col;if(pos[key]!=null)return pos[key];const id=sea*100+nodes.length;nodes.push({id,row,col});pos[key]=id;return id};
  const start=add(0,1.5),boss=add(ROWS,1.5),HALF=Math.floor(ROWS/2);
  // more routes than columns, so they cross and split: most stops offer a real choice of where to go next
  const paths=5+ri(r,2);
  for(let p=0;p<paths;p++){let c=p%4,prev=start;
    for(let row=1;row<ROWS;row++){if(row>1)c=Math.max(0,Math.min(3,c+ri(r,3)-1));const id=add(row,c);edges.add(prev+'>'+id);prev=id}
    edges.add(prev+'>'+boss)}
  // a stop with only one way on gets a second route to a neighbour on the next row, if that route crosses no other
  const at=(row,col)=>pos[row+'_'+col],cr=(a,b)=>{const[r0,c0]=a,[,c1]=b;const x=at(r0,c1),y=at(r0+1,c0);return x!=null&&y!=null&&edges.has(x+'>'+y)};
  for(let row=1;row<ROWS-2;row++)for(let col=0;col<4;col++){const id=at(row,col);if(id==null)continue;
    const outs=[...edges].filter(e=>e.startsWith(id+'>'));if(outs.length>1)continue;
    const opts=[col-1,col,col+1].filter(c=>at(row+1,c)!=null&&!edges.has(id+'>'+at(row+1,c))&&!cr([row,col],[row+1,c]));
    if(opts.length)edges.add(id+'>'+at(row+1,opts[ri(r,opts.length)]))}
  const E=[...edges].map(e=>e.split('>').map(Number)),byId=id=>nodes.find(n=>n.id===id);
  const parents=n=>E.filter(e=>e[1]===n.id).map(e=>byId(e[0])),kids=n=>E.filter(e=>e[0]===n.id).map(e=>byId(e[1]));
  // ports: where you set out, the row before the boss, and some of the halfway row (so pushing on without resupplying is a choice)
  nodes.forEach(n=>{if(n.row===0||n.row===ROWS-1)n.type='port';else if(n.row===ROWS)n.type='boss';else if(n.row===1)n.type='threat'});
  const mid=nodes.filter(n=>n.row===HALF).sort((a,b)=>a.col-b.col),first=ri(r,2);
  mid.forEach((n,i)=>{if(mid.length===1||i%2===first)n.type='port'});
  // the rest are dealt from a shuffled bag in this sea's proportions, so every chart gets its share of each kind
  const open=nodes.filter(n=>!n.type).sort((a,b)=>a.row-b.row||a.col-b.col);
  const mix=Object.assign({},SEAMIX[sea]),feat=FEATURE[ri(r,FEATURE.length)];mix[feat]=Math.round(mix[feat]*1.5);
  const tot=Object.values(mix).reduce((a,v)=>a+v,0),bag=[];
  Object.entries(mix).forEach(([k,w])=>{const n=w*open.length/tot;for(let i=0;i<Math.floor(n)+(r()<n%1?1:0);i++)bag.push(k)});
  while(bag.length<open.length)bag.push('threat');
  for(let i=bag.length-1;i>0;i--){const j=ri(r,i+1);[bag[i],bag[j]]=[bag[j],bag[i]]}
  // no stop repeats the one before it (two fights in a row are fine, two elites aren't), and a fork offers different kinds
  const ok=(n,t)=>{if(t==='elite'&&n.row<3)return false;
    if(parents(n).some(p=>p.type===t&&t!=='threat'))return false;
    return!parents(n).some(p=>kids(p).some(s=>s!==n&&s.type===t))};
  open.forEach(n=>{let j=bag.findIndex(t=>ok(n,t));
    if(j<0){const alt=Object.keys(mix).filter(t=>ok(n,t));n.type=alt.length?pick(r,alt):'threat';j=bag.indexOf(n.type);if(j>=0)bag.splice(j,1)}
    else n.type=bag.splice(j,1)[0]});
  const pool=Object.keys(ENEMIES).filter(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='t');
  const elite=Object.keys(ENEMIES).find(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='e');
  const bossE=Object.keys(ENEMIES).find(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='b');
  let evs=Object.keys(EVENTS).filter(k=>k!=='bandits');const names=[...PORTNAMES];
  nodes.forEach(n=>{
    n.x=n.col===1.5?170:45+n.col*83+(r()*14-7);
    if(n.type==='threat')n.enemy=pick(r,pool);
    if(n.type==='elite')n.enemy=elite;
    if(n.type==='boss')n.enemy=bossE;
    if(n.type==='event'){if(!evs.length)evs=Object.keys(EVENTS).filter(k=>k!=='bandits');n.ev=evs.splice(ri(r,evs.length),1)[0]}
    if(n.type==='port')n.name=sea===0&&n.row===0?'Gullhaven':names.splice(ri(r,names.length),1)[0];
    if(n.type==='port'&&r()<.6)n.visitor=pick(r,NPC_POOL.filter(k=>NPCS[k].sea===-1));
  });
  let npcs=Object.keys(NPCS).filter(k=>!NPCS[k].lore&&!NPCS[k].quest&&(NPCS[k].sea===-1||NPCS[k].sea===sea));
  nodes.filter(n=>n.type==='npc').forEach(n=>{if(!npcs.length)npcs=NPC_POOL.filter(k=>NPCS[k].sea===-1);n.npc=npcs.splice(ri(r,npcs.length),1)[0]});
  const loreN=Object.keys(NPCS).find(k=>NPCS[k].lore&&NPCS[k].sea===sea);
  if(loreN){const c=nodes.filter(n=>n.row>=2&&n.row<=ROWS-2&&n.type!=='elite'&&n.type!=='port');if(c.length){const n=pick(r,c);n.type='npc';n.npc=loreN;delete n.enemy;delete n.ev}}
  // the bandits lurk in exactly one stretch of unknown water per sea, past the first few rows
  const ev=nodes.filter(n=>n.type==='event'&&n.row>=3),bc=ev.length?ev:nodes.filter(n=>n.row>=3&&n.row<ROWS-1&&(n.type==='threat'||n.type==='fish'));
  if(bc.length){const n=pick(r,bc);n.type='event';n.ev='bandits';delete n.enemy}
  return{sea,start,boss,rows:ROWS,nodes,edges:E};
}
function updateReveal(){const row=node(G.at).row;G.reveal=G.full?99:row+2+G.extra+(G.far||0)+(hasC('buoy')?1:0);if(hasF('crowseye'))G.reveal=99}

/* ---------- enemy boards (seeded: every captain on this sea meets the same crew) ---------- */
/* how tough each sea's enemies are: their health, how much cargo they carry, and the best tier it comes in. The Shallows go
   easy on a bare new ship (less cargo, and all of it bronze, so the Serpent's poison doesn't snowball); the Fog Sea and the
   Deep push back harder, because by then crew ranks, upgraded cargo and fittings have built up. */
// boss: its own numbers where the sea's boss should stand apart from the ordinary fights (the Deep's are a step below the Kraken)
const SEASCALE=[{hp:.95,gear:.75,tier:0},{hp:1.15,gear:1.2,tier:3},{hp:1.18,gear:1.33,tier:3,boss:{hp:1.5,gear:1.6}}];
function enemyOf(n){
  if(n.type==='isle')return lmFoe(n);   // a landmark's guard (rewards.js)
  if(n.fixed){const list=n.fixed.list.map(x=>({...x}));list.enemy=true;return{e:ENEMIES[n.enemy],list,hp:n.fixed.hp,depth:depthOf(n)}}
  const e=ENEMIES[n.enemy],s0=SEASCALE[G.sea]||SEASCALE[2],sc=e.kind==='b'&&s0.boss?Object.assign({},s0,s0.boss):s0,depth=depthOf(n),r=RNG(G.seed,'foe',n.id),mult=e.kind==='e'?1.2:e.kind==='b'?1.3:1;
  let budget=(6+depth*6)*mult*sc.gear;const list=[];
  e.sig.forEach(k=>{const t=Math.min(sc.tier,rollTier(depth,r));if(used(list)+DEFS[k].s<=HOLD){list.push({k,t});budget-=price(k,t)*.5}});
  const theme=pick(r,SHIPKEYS);
  let tries=0;while(tries++<90&&used(list)<HOLD&&budget>2){const k=drawKey(r,theme),d=DEFS[k];if(k==='chest')continue;
    const t=Math.min(sc.tier,rollTier(depth,r)),p=price(k,t);if(used(list)+d.s>HOLD||p>budget)continue;list.splice(ri(r,list.length+1),0,{k,t});budget-=p}
  const hp=Math.round((70+depth*12)*(e.kind==='e'?1.15:e.kind==='b'?1.3:1)*sc.hp);
  list.enemy=true;   // enemy cargo needs no crew
  return{e,list,hp,depth};
}
const randItem=(r,depth,ship)=>{let k;do{k=drawKey(r,ship)}while(k==='chest'&&r()<.5);return{k,t:rollTier(depth,r)}};
/* an item upgrades yours if it's the same item, at the same tier or higher */
const LOCK=6;
function matchIdx(it){let j=-1;G.board.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(j<0||b.t>G.board[j].t))j=i});return j}
function findMatch(it){let best=null;for(const list of [G.board,G.locker||[]])list.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(!best||b.t>best.list[best.i].t))best={list,i}});return best}
function lockerUps(offers){const u=new Set();if(!G.locker)return u;offers.forEach(o=>{if(!o)return;if(matchIdx(o)>=0)return;const m=findMatch(o);if(m&&m.list===G.locker)u.add(m.i)});return u}
/* the item that just came aboard (or was upgraded), so the hold can celebrate it the next time it's drawn (holdFlash in ui.js) */
let flash=null;
function addItem(it){
  const m=findMatch(it);
  if(m){const b=m.list[m.i];b.t=Math.max(b.t+1,it.t);seen(it.k);flash={ref:b,kind:'up'};return'up'}
  if(used(G.board)+DEFS[it.k].s<=holdCap()){const b={k:it.k,t:it.t};G.board.push(b);seen(it.k);flash={ref:b,kind:'add'};return'add'}
  if(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK){const b={k:it.k,t:it.t};G.locker.push(b);seen(it.k);flash={ref:b,kind:'add'};return'locker'}
  return false;
}
const fits=it=>!!findMatch(it)||used(G.board)+DEFS[it.k].s<=holdCap()||!!(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK);
function addOrGold(it,prefix){const r=addItem(it),n=`${TIER[it.t]} ${DEFS[it.k].n}`;
  if(r==='locker')return`${prefix} a ${n}. The hold was full, so it went in the locker.`;
  if(r)return`${prefix} a ${n}.`;const g=Math.max(1,Math.floor(price(it.k,it.t)/2));G.gold+=g;return`${prefix} a ${n}, but there was no room aboard. Sold it for ${g} gold.`}
