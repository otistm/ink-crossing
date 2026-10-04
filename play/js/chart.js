/* Ink Crossing: The voyage chart (map), previews and sailing to a stop. */
"use strict";
/* ---------- the chart (map) ---------- */
const NG={
  port:'<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v13M8 9.5h8M5 15c1 3.5 3.5 5 7 5s6-1.5 7-5"/>',
  threat:'<path d="M5 4l13 13M19 4L6 17M4 15l5 5M20 15l-5 5"/>',
  elite:'<path class="gw" d="M5 11a7 7 0 0 1 14 0c0 3-1.5 4-2 5v3H7v-3c-.5-1-2-2-2-5z"/><circle class="gk" cx="9.5" cy="11" r="1.6"/><circle class="gk" cx="14.5" cy="11" r="1.6"/><path d="M10 19v-2M14 19v-2"/>',
  event:'<path d="M8.5 8.5c0-4.5 7-4.5 7 0 0 3-3.5 3-3.5 6"/><circle class="gk" cx="12" cy="18.5" r="1.4"/>',
  npc:'<circle class="gw" cx="12" cy="8" r="4"/><path class="gw" d="M4 21c1-6 4-8 8-8s7 2 8 8z"/>',
  fish:'<path class="gw" d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0z"/><path class="gw" d="M17 12l4-3v6z"/><circle class="gk" cx="7" cy="11.3" r="1"/>',
  isle:'<path d="M3 19c4-3 14-3 18 0"/><path d="M12 18c0-4 .5-8 2-10"/><path d="M14 8c-3-2-6-1-7 1M14 8c2-3 5-3 6-1M14 8c1 2 1 4 0 6"/>',
  boss:'<path d="M4 21c-1-7 2-12 6-12s5 5 2 6-3-3-1-3"/><path d="M20 21c1-6-1-11-5-12"/><path d="M12 9c0-3 1-5 3-6"/>'
};
/* The map is laid out 340 wide. fit (big screens only) redraws it at the size of the space it has: stops spread sideways, rows spread down. */
function mapSVG(fit){
  const R=mapRows(),W=fit?fit.W:340,RH=fit?fit.RH:R>6?88:84,X=n=>n.x*W/340;
  const m=G.map,H=R*RH+84,y=row=>H-40-row*RH,cur=node(G.at),reach=new Set(reachable()),rev=G.reveal;
  const trav=new Set();for(let i=1;i<G.path.length;i++)trav.add(G.path[i-1]+'>'+G.path[i]);
  const vis=n=>n.row<=rev||n.type==='boss'||G.path.includes(n.id);
  let g=chartWater(m,X,y,W,H,RH,vis,rev);
  if(rev<R-1)g+=chartFog(W,y(rev)-RH/2);
  m.edges.forEach(([a,b])=>{const A2=node(a),B2=node(b);if(!(trav.has(a+'>'+b)||(A2.row<=rev&&(B2.row<=rev||B2.type==='boss'))))return;
    const ya=y(A2.row),yb=y(B2.row),mx=(X(A2)+X(B2))/2+((a*7+b*3)%9-4),my=(ya+yb)/2,down=B2.row<A2.row;   // a side stop's way back runs down the chart
    const t=trav.has(a+'>'+b),r=a===G.at;
    g+=`<path data-e="${a}>${b}" d="M${X(A2)} ${ya+(down?18:-18)}Q${mx+(down?14:0)} ${my} ${X(B2)} ${yb+(down?-18:B2.type==='boss'?25:18)}" fill="none" stroke="#000" stroke-linecap="round" ${t?'stroke-width="2.8"':r?'stroke-width="2" stroke-dasharray="1 6"':'stroke-width="1.4" stroke-dasharray="1 6" opacity=".45"'}/>`});
  m.nodes.forEach(n=>{if(!vis(n))return;
    const big=n.type==='boss',rr=big?24:18,known=n.row<=rev||G.path.includes(n.id),isR=reach.has(n.id),v=G.path.includes(n.id)&&n.id!==G.at;
    const gl=known?NG[n.type]:NG.event;
    g+=`<g class="node${isR?' reach':''}${v?' visited':''}${!isR&&!v&&n.id!==G.at?' dim':''}" data-id="${n.id}" ${isR?`tabindex="0" role="button" aria-label="Sail to ${nodeTitle(n)}"`:''} transform="translate(${X(n)} ${y(n.row)})">
      ${isR?`<circle class="ring" r="${rr+4}" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="3 4"/>`:''}
      <g class="body"><circle r="${rr}" fill="#fff" stroke="#000" stroke-width="${big?3:2.2}"/><g class="glyph" transform="translate(${big?-13:-10} ${big?-13:-10}) scale(${big?1.08:.83})" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${gl}</g></g>
      ${big?`<text class="maplabel" y="-32" text-anchor="middle">${known?ENEMIES[n.enemy].n:'Something waits'}</text>`:''}</g>`});
  G.charts.forEach((c,i)=>{if(c.sea!==G.sea)return;const n=node(c.at);if(!n)return;const side=n.x>170?-1:1;
    g+=`<g transform="translate(${X(n)+side*30-11} ${y(n.row)-11}) scale(.733)" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${CHARTS[c.k].g}</g>`});
  g+=`<g id="boat" transform="translate(${X(cur)-12} ${y(cur.row)-(cur.type==='boss'?54:46)})"><g class="boatbob" stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#FBF5E8"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z" fill="#5E7487"/></g></g>`;
  return`<svg viewBox="-6 0 ${W+12} ${H}" aria-label="Chart of ${SEAS[G.sea]}"><defs><clipPath id="chartclip"><rect x="-6" y="0" width="${W+12}" height="${H}"/></clipPath><pattern id="fog" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#000" opacity=".28"/><circle cx="6.5" cy="6.5" r=".9" fill="#000" opacity=".18"/></pattern></defs>${g}</svg>`;
}
/* the water under the chart: little wave marks bobbing on open sea, and islands under the ports and isles with ripples lapping
   their shores. Placed from the voyage seed, so a chart always looks the same; nothing is drawn in the fog. */
function chartWater(m,X,y,W,H,RH,vis,rev){const r=RNG(G.seed,'water',G.sea),top=rev<mapRows()-1?y(rev)-RH/2:0;let g='',shore='',edge='',land='';
  const pts=m.nodes.filter(vis).map(n=>[X(n),y(n.row)]);
  // islands: a wobbly blob with a dashed shoreline around it, under each port and uncharted isle
  m.nodes.forEach(n=>{if(!vis(n))return;
    // stops out on the water float on a ripple; ports and isles stand on land
    if(n.type!=='port'&&n.type!=='isle'){const rr=n.type==='boss'?24:18;g+=`<path class="ripple" d="M${X(n)-rr-10} ${y(n.row)+rr-3}q${rr/2+5} 7 ${rr+10} 0t${rr+10} 0"/>`;return}
    const R=n.type==='port'?36:30,k=10,cx=X(n),cy=y(n.row)+10;
    const pt=Array.from({length:k},(_,i)=>{const a=i/k*Math.PI*2,rr=R*(.82+r()*.3);return[cx+Math.cos(a)*rr*1.25,cy+Math.sin(a)*rr*.8]});
    const blob=s=>'M'+pt.map((p,i)=>{const q=pt[(i+1)%k],sx=cx+(p[0]-cx)*s,sy=cy+(p[1]-cy)*s,ex=cx+((p[0]+q[0])/2-cx)*s,ey=cy+((p[1]+q[1])/2-cy)*s;return`${i?'':`${ex} ${ey}`}Q${cx+(q[0]-cx)*s} ${cy+(q[1]-cy)*s} ${cx+(((q[0]+pt[(i+2)%k][0])/2)-cx)*s} ${cy+(((q[1]+pt[(i+2)%k][1])/2)-cy)*s}`}).join('')+'Z';
    // drawn in layers (shores, then outlines, then land) so neighbouring islands merge into one coastline
    shore+=`<path class="shore" d="${blob(1.22)}"/>`;edge+=`<path d="${blob(1)}"/>`;land+=`<path d="${blob(1)}"/>`+
      Array.from({length:4},(_,i)=>{const a=-.4+i*.35+r()*.2,x0=cx+Math.cos(Math.PI+a)*R*.9,y0=cy+Math.sin(a)*R*.45+R*.25;return`<path class="hatch" d="M${x0} ${y0}l5 -2"/>`}).join('')});
  g+=`<g class="isles">${shore}<g class="edge">${edge}</g><g class="land">${land}</g></g>`;
  // wave marks on the open water, kept clear of the stops and the fog
  let n=0;for(let t=0;t<220&&n<Math.round(W*H/9500);t++){const x=12+r()*(W-24),yy=top+18+r()*(H-top-36);
    if(pts.some(([px,py])=>Math.hypot(px-x,(py-yy)*1.2)<46))continue;
    const w=8+r()*6;g+=`<g transform="translate(${x.toFixed(1)} ${yy.toFixed(1)})"><path class="wv" style="animation-delay:${(-r()*6).toFixed(2)}s" d="M${-w} 0q${w/4} -4 ${w/2} 0t${w/2} 0t${w/2} 0t${w/2} 0"/></g>`;n++}
  return g}
/* the fog over unknown water: a bank of cloud with a billowing lower edge, faint stipple inside, and wisps drifting across it.
   When you sail on and the fog lifts, the bank rolls back up to its new edge (fogLift). */
let fogSeen=null;
function chartFog(W,bot){const r=RNG(G.seed,'fog',G.sea);
  // a billowing edge: arcs bulging down along the bottom of the bank, and a fainter second row of billows just above it
  const edge=(base,lo,hi)=>{let d=`M-20 -300V${base.toFixed(1)}`,x=-20;while(x<W+24){const w=lo+r()*(hi-lo);d+=`a${(w*.55).toFixed(1)} ${(w*.5).toFixed(1)} 0 0 0 ${w.toFixed(1)} 0`;x+=w}return d+`V-300Z`};
  let wisps='';
  for(let yy=bot-56;yy>40;yy-=54+r()*24){const x=16+r()*(W-110),w=26+r()*30;
    wisps+=`<g transform="translate(${x.toFixed(1)} ${yy.toFixed(1)})"><path class="wisp" style="animation-delay:${(-r()*14).toFixed(1)}s" d="M0 0q-6 -6 0 -8q5 0 4 5q${w*.25} 4 ${w*.5} 0t${w*.5} 0q5 -3 3 -7"/></g>`}
  const lift=fogSeen&&fogSeen.sea===G.sea&&fogSeen.seed===G.seed&&fogSeen.bot>bot+1?Math.round(fogSeen.bot-bot):0;
  return`<g clip-path="url(#chartclip)"><g class="fog"${lift?` data-lift="${lift}"`:''} data-bot="${bot.toFixed(1)}"><path class="billow back" d="${edge(bot-6,30,46)}"/><path class="billow" d="${edge(bot-18,22,38)}"/>
    <rect x="-6" y="-300" width="${W+12}" height="${(bot+280).toFixed(1)}" fill="url(#fog)"/>${wisps}<text class="fogtxt" x="${W-8}" y="${(bot-26).toFixed(1)}" text-anchor="end">here be monsters</text></g></g>`}
/* after the chart is drawn: roll the fog back if it just lifted, and remember where its edge is now */
function fogLift(){const f=app.querySelector('.map .fog'),m=app.querySelector('.map svg');
  const bot=f?+f.dataset.bot:-1;
  if(f&&f.dataset.lift&&!matchMedia('(prefers-reduced-motion:reduce)').matches)f.animate([{transform:`translateY(${f.dataset.lift}px)`},{transform:'none'}],{duration:1600,easing:'cubic-bezier(.2,.7,.2,1)'});
  if(m)fogSeen={sea:G.sea,seed:G.seed,bot:bot<0?1e9:bot}}
function nodeTitle(n){if(n.type==='port')return n.name;if(n.type==='npc')return NPCS[n.npc].n;if(n.type==='fish')return'Fishing grounds';if(n.type==='event')return'Unknown waters';if(n.type==='isle')return'An uncharted isle';return'the '+ENEMIES[n.enemy].n}
function chart(){
  cancelAnimationFrame(raf);B=null;G.inPort=false;PV.id=null;
  if(G.sel==null)G.moving=false;
  // the bar and the sea's name stay pinned to the top while the chart scrolls under them
  app.innerHTML=`<div class="charthead">${barHTML()}<div class="seahead"><h2>${G.tut?'The maiden voyage':SEAS[G.sea]}</h2><span>${G.tut?'Guild trial':`Sea ${G.sea+1} of 3`}</span></div></div>
    <div class="map">${mapSVG()}</div><p class="tapnote">Tap a marked spot to see what's there.</p>
    ${holdDock('')}`;
  bindBar();bindHold('hold',chart);fitDock();
  bindNodes();fitMap();fogLift();
  if(G.unrolled!==G.sea||unrollNext){G.unrolled=G.sea;unrollNext=false;unroll()}
  const cur=app.querySelector('.boatbob');if(cur){const r=cur.getBoundingClientRect();window.scrollTo({top:Math.max(0,r.top+scrollY-innerHeight*.35),behavior:'instant'})}
  stuckHead();save();coach('chart');
}
/* the pinned header gets an ink rule along its bottom once the chart is scrolling under it */
function stuckHead(){const h=app.querySelector('.charthead');if(h)h.classList.toggle('stuck',scrollY>4)}
addEventListener('scroll',stuckHead,{passive:true});
function nodeTip(el){const n=node(+el.dataset.id);if(!n||!G)return;hideItemTip();tipSrc=el;
  const known=n.row<=G.reveal||G.path.includes(n.id)||n.type==='boss';
  const{head,body}=known?nodeInfo(n,true):{head:'Uncharted water',body:'<p class="soft">Sail closer to see what waits here.</p>'};
  tipEl=document.createElement('div');tipEl.className='itip ntip';tipEl.setAttribute('role','tooltip');tipEl.innerHTML=`<b>${head}</b>${body}${el.classList.contains('reach')?'<p class="itip-aff">Click to sail here.</p>':''}`;
  document.body.appendChild(tipEl);const r=el.getBoundingClientRect(),t=tipEl.getBoundingClientRect();
  let x=r.right+12,y=r.top+r.height/2-t.height/2;if(x+t.width>innerWidth-8)x=r.left-t.width-12;
  tipEl.style.left=Math.max(8,x)+'px';tipEl.style.top=Math.max(8,Math.min(innerHeight-t.height-8,y))+'px'}
document.addEventListener('pointerover',e=>{if(!HOVERS.matches||e.pointerType!=='mouse'||sailing)return;const el=e.target.closest&&e.target.closest('.map .node');if(el)nodeTip(el)});
document.addEventListener('pointerout',e=>{const el=e.target.closest&&e.target.closest('.map .node');if(el&&!(e.relatedTarget&&el.contains(e.relatedTarget)))hideItemTip()});
function bindNodes(){app.querySelectorAll('.node.reach').forEach(el=>{const go=()=>{if(!sailing)preview(node(+el.dataset.id))};el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
/* big screens: redraw the chart to fill the stage above the hold */
function fitMap(){
  const m=app.querySelector('.map');if(!m||!G)return;
  const on=document.body.classList.contains('desk');if(!on&&!m.dataset.fit)return;
  let fit=null;
  if(on){const cs=getComputedStyle(m),r=m.getBoundingClientRect(),d=app.querySelector('.dock');
    const w=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),h=innerHeight-r.top-(d?d.offsetHeight:0)-24-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    fit={W:Math.max(340,Math.min(1400,Math.round(w-12))),RH:Math.max(mapRows()>6?150:62,Math.min(120,Math.round((h-84)/mapRows())))}}   // long seas keep their rows roomy and scroll rather than squeeze
  m.dataset.fit=on?'1':'';m.innerHTML=mapSVG(fit);bindNodes();
  if(m.classList.contains('unroll'))addRoll(m);
}
/* The chart unrolls like a scroll: the paper is revealed from the top while the rolled-up part travels down, overshoots a touch, and flattens away. */
let unrollNext=false;
const UNROLL_MS=1500;
function unroll(){const m=app.querySelector('.map');if(!m)return;
  m.dataset.u0=performance.now();m.classList.add('unroll');addRoll(m);
  setTimeout(()=>{if(!m.isConnected)return;m.classList.remove('unroll');const r=m.querySelector('.roll');if(r)r.remove()},UNROLL_MS+450)}
function addRoll(m){const r=document.createElement('div');r.className='roll';r.setAttribute('aria-hidden','true');
  const d=-(performance.now()-(+m.dataset.u0||performance.now()));r.style.setProperty('--ud',d+'ms');m.appendChild(r)}
addEventListener('resize',()=>{if(app.querySelector('.map'))fitMap()});
function traitsHTML(e,sea){return`<div class="traitlist">${e.traits.map(k=>`<p><b>${TRAITS[k].n}.</b> ${TRAITS[k].d(sea)}</p>`).join('')}</div>`}
/* what a stop is: its title and a few lines, for the Sail here card and (on a computer) the hover card. hover skips the
   enemy's cargo board and doesn't mark the enemy as met */
function nodeInfo(n,hover){
  let body='',head=nodeTitle(n);head=head[0].toUpperCase()+head.slice(1);
  if(n.type==='port')body=`<p>A port market, a tavern and a shipwright. Buy and sell cargo, hire crew and repair your hull.</p>`;
  if(n.type==='event')body=`<p>Something is out there. It could help or hurt.</p>`;
  if(n.type==='isle')body=`<p>${cap(lmName(lmKey(n)))}. A landmark guarded by the ghost of the last captain to claim it, or by its keeper. Win to carve your name on it and take a prize.</p>`;
  if(n.type==='npc'){const N=NPCS[n.npc];body=`<div class="npc">${portrait(N.look)}<div><p><b>${N.role}.</b> Someone to talk to. They may trade, help, or ask for something.</p></div></div>`}
  if(n.type==='fish')body=`<p>The water boils with fish. ${3+G.tip} casts. Sell what you catch at port.</p>`;
  if(n.type==='port'&&n.visitor)body+=`<p class="soft">Someone is waiting on the dock.</p>`;
  if(n.enemy){const f=enemyOf(n),e=f.e,k=e.kind;if(!hover){A.met[n.enemy]=1;saveA()}
    // the health they start the fight with: their own cargo adds to it (sideOf), and the Kraken fitting swells it (setupFight)
    let hp=f.hp+sideOf(f.list).hp;
    body=`<p class="soft">${k==='b'?'The guardian of this sea. Beat it to sail on.':k==='e'?'Elite. Tougher, with better spoils.':'A threat on the route.'} ${hp} health.</p>${traitsHTML(e,G.sea)}
      ${hasC('sound')&&!hover?`<div class="mini-board"><p class="label" style="margin:6px 0">Their cargo</p>${boardHTML(f.list,'e')}</div>`:''}
      <p class="soft">Win: ${k==='b'?`${15+G.sea*10} gold and passage to the next sea`:k==='e'?`${10+f.depth} gold, a pick of cargo and a landmark`:`${5+Math.floor(f.depth/2)} gold and a pick of cargo`}. Lose: ${lossOf(k)} hull${k==='b'?' and fall back to port':''}.</p>`}
  return{head,body}}
function preview(n){const{head,body}=nodeInfo(n);
  const ov=overlay(`<h2>${head}</h2>${body}<div class="sh-actions"><button class="ghost" data-a="close">Not yet</button><button class="primary" data-a="go">Sail here</button></div>`);
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')go(n.id)});
  ov.querySelector('[data-a="go"]').focus();
}
const lossOf=k=>k==='b'?4+G.sea*2:k==='e'?3+G.sea:2+G.sea;
/* sail the boat along the route to the next stop, drawing its wake behind it, then carry on. Skipped with reduced motion. */
let sailing=false;
function sailAnim(from,to,done){const svg=app.querySelector('.map svg'),boat=svg&&svg.querySelector('#boat'),route=svg&&svg.querySelector(`[data-e="${from}>${to}"]`);
  if(!boat||!route||matchMedia('(prefers-reduced-motion:reduce)').matches)return done();
  sailing=true;const L=route.getTotalLength(),wake=route.cloneNode();
  wake.removeAttribute('stroke-dasharray');wake.removeAttribute('opacity');wake.setAttribute('stroke-width','2.8');wake.style.strokeDasharray=L;wake.style.strokeDashoffset=L;route.after(wake);
  // the route ends under the stop; the boat finishes perched above it, where the chart draws it
  const boss=node(to).type==='boss',pe=route.getPointAtLength(L),ny=pe.y-(boss?25:18),fy=ny-(boss?54:46);
  const T=Math.min(1500,700+L*2.4),t0=performance.now(),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const step=now=>{const k=Math.min(1,(now-t0)/T),e=ease(k),q=route.getPointAtLength(e*L),a=route.getPointAtLength(Math.min(L,e*L+2));
    let x=q.x-12,y=q.y-22;if(k>.82){const m=(k-.82)/.18;x=pe.x-12;y=(pe.y-22)*(1-m)+fy*m}
    boat.setAttribute('transform',`translate(${x} ${y})${a.x<q.x-.01?' translate(24 0) scale(-1 1)':''}`);
    wake.style.strokeDashoffset=L*(1-e);
    if(k<1)requestAnimationFrame(step);else setTimeout(()=>{sailing=false;done()},120)};
  requestAnimationFrame(step)}
function go(id){
  if(sailing||G.at===id||!reachable().includes(id))return;   // only ever to a stop you can reach from where you are
  const from=G.at;
  if(G.map.edges.some(([a,b])=>a===from&&b===id))return sailAnim(from,id,()=>goNow(id));
  goNow(id)}
function goNow(id){
  if(G.at===id)return;   // already there: a second tap on Sail here must never sail the same leg twice
  coach('sail');
  G.at=id;G.path.push(id);G.day++;G.moving=false;G.sel=null;updateReveal();save();
  const n=node(id);
  if(n.type==='port')port(id);
  else if(n.enemy)fight(n);
  else if(n.type==='event')eventAt(n);
  else if(n.type==='isle')landmarkAt(n);
  else if(n.type==='npc'){chart();talk(n.npc,n.id,chart)}
  else if(n.type==='fish'){const c=3+G.tip;G.tip=0;fishing(n.id,c,chart)}
}
