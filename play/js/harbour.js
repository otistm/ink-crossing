/* Ink Crossing: the harbour, a side-on ink panorama of the port you scroll along, like a 2D platformer.
   Docks, market, tavern and shipwright stand along one quay. What each place has for you is drawn into the scene:
   goods on the market counter, faces in the tavern windows, a chalk notice at the shipwright, someone waiting on the pier. */
"use strict";
const HW=1280,HH=320;
const HCALM=matchMedia('(prefers-reduced-motion: reduce)').matches;   // no wingbeats for players who asked for less motion                    // the world, in drawing units
const HSTOPS=[['docks','Docks',130],['market','Market',400],['tavern','Tavern',715],['wright','Shipwright',1110]];
/* small ink helpers */
/* a cloud drifting right across the whole sky and round again; dur in seconds, starting where it's drawn */
const hCloud=(x,y,s,dur)=>{dur=dur||150;const lap=HW+260,d=-((x+130)/lap)*dur;
  return`<g class="hcloud" style="animation-duration:${dur}s;animation-delay:${d.toFixed(1)}s"><path class="w" transform="translate(0 ${y}) scale(${s})" d="M0 0c-2-8 8-12 13-7 3-9 17-10 21-1 6-4 14 0 13 7 6 1 6 9-1 9H1c-6 0-7-7-1-8z"/></g>`};
/* a gull flying across the sky: x where it starts, y its height, dur the crossing in seconds, flap the wingbeat */
const hGull=(x,y,dur,flap,s)=>{const lap=HW+120,d=-((x+60)/lap)*dur;
  return`<g transform="translate(0 ${y}) scale(${s||1})"><g class="hgull" style="animation-duration:${dur}s;animation-delay:${d.toFixed(1)}s"><g class="hglide" style="animation-delay:${(d/3).toFixed(1)}s">
    <path d="M-8 0q4-5 8 0q4-5 8 0" stroke-width="1.7">${HCALM?'':`<animate attributeName="d" dur="${flap}s" repeatCount="indefinite" values="M-8 0q4-5 8 0q4-5 8 0;M-8 3q4-2 8-3q4 1 8 3;M-8 0q4-5 8 0q4-5 8 0;M-8 -4q4 1 8 4q4-3 8-4;M-8 0q4-5 8 0q4-5 8 0"/>`}</path></g></g></g>`};
const hPlanks=(x,y,w,h,step)=>{let d='';for(let yy=y+step;yy<y+h-1;yy+=step)d+=`M${x} ${yy}h${w}`;return`<path d="${d}" stroke-width="1" opacity=".55"/>`};
const hGrass=(x0,x1,y)=>{let d='';for(let x=x0;x<x1;x+=11+((x*7)%9)){d+=`M${x} ${y}l-2-6M${x+3} ${y}l1-8M${x+6} ${y}l3-5`}return`<path d="${d}" stroke-width="1.3"/>`};
const hStones=(x0,x1,y0,y1)=>{let s='';const rows=Math.max(2,Math.floor((y1-y0)/12));
  for(let r=0;r<rows;r++){const y=y0+r*12+1;let x=x0+(r%2?9:0),i=r*7;
    while(x<x1-6){const w=12+(i*7)%9;s+=`<rect class="w" x="${x}" y="${y}" width="${Math.min(w,x1-x)}" height="10" rx="4" stroke-width="1.3"/>`;x+=w+2;i++}}
  return`<g opacity=".9">${s}</g>`};
const hBarrel=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><path class="w" d="M-9 0c-2-8-2-16 0-24h18c2 8 2 16 0 24z"/><path d="M-10 -6h20M-10 -18h20" stroke-width="1.3"/><ellipse class="w" cx="0" cy="-24" rx="9" ry="2.5" stroke-width="1.4"/></g>`;
const hCrate=(x,y,w,h)=>`<g><rect class="w" x="${x}" y="${y-h}" width="${w}" height="${h}"/><path d="M${x} ${y-h}l${w} ${h}M${x+w} ${y-h}l${-w} ${h}" stroke-width="1"/></g>`;
const hSign=(x,y,t,w)=>{w=w||t.length*8+18;return`<g class="hsign"><path d="M${x} ${y}v8" stroke-width="1.4"/><rect class="w" x="${x-w/2}" y="${y+8}" width="${w}" height="20" rx="3"/><text x="${x}" y="${y+23}" text-anchor="middle">${t}</text></g>`};
const hBoard=(x,y,lines)=>`<g class="hboard"><path d="M${x+4} ${y+40}l6-40M${x+52} ${y+40}l-6-40" stroke-width="1.6"/><rect class="k" x="${x+4}" y="${y}" width="48" height="${12+lines.length*11}" rx="2"/>${lines.map((l,i)=>`<text x="${x+28}" y="${y+13+i*11}" text-anchor="middle">${l}</text>`).join('')}</g>`;
/* someone standing on the pier, bobbing a little, with a "!" when they want a word */
/* someone on the pier: a peep standing behind a fish crate (which hides where the bust ends), with a "!" over them when
   they're waiting to talk; with nobody waiting, it's the dock's fishmonger minding the crate */
const hFigure=(x,y,look,waiting)=>`<g class="hwho" transform="translate(${x} ${y})"><g class="bob"><g transform="translate(-26 -60) scale(.22)">${peepLayers(look)}</g></g>
  ${hCrate(-16,0,32,16)}<path class="w" d="M-8 -16c5-5 10-5 14 0-4 4-9 4-14 0zM-2 -18l4-6 3 6" stroke-width="1.2"/>
  ${waiting?`<g class="hbubble"><path class="w" d="M12 -74h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-10l-6 6v-6h-2a5 5 0 0 1-5-5v-10a5 5 0 0 1 5-5z"/><text x="21" y="-59" text-anchor="middle">!</text></g>`:''}</g>`;
/* faces at a window, one per hand looking for work */
const hFace=(x,y)=>`<g><circle class="w" cx="${x}" cy="${y}" r="4.5" stroke-width="1.4"/><path d="M${x-6} ${y+9}q6-7 12 0" stroke-width="1.4"/></g>`;

function harbourWorld(I){
  // sky, sea and quay
  let g=`<path class="hsun-rays" d="M90 0l140 150M140 0l130 130M200 0l100 100" stroke-width="10" opacity=".07"/>
    <g class="hrays"><path d="M120 26v-10M120 90v10M88 58H78M152 58h10M97 35l-7-7M143 81l7 7M97 81l-7 7M143 35l7-7" stroke-width="1.8"/></g><circle class="w" cx="120" cy="58" r="22" stroke-width="2.2"/>
    ${hCloud(250,60,1,170)}${hCloud(470,26,1.1,140)}${hCloud(820,74,.9,190)}${hCloud(1040,46,1.2,150)}${hCloud(1210,82,.8,210)}
    <g class="gulls">${hGull(330,84,70,.9)}${hGull(356,96,74,.8,.85)}${hGull(960,64,58,1)}${hGull(1180,112,88,1.1,.8)}${hGull(700,40,64,.95,.9)}</g>
    <path d="M0 168H${HW}" stroke-width="1.4"/>
    <path class="w" d="M250 168c30-14 70-22 120-16s80 6 110 16z" stroke-width="1.3" opacity=".8"/><path d="M290 160l6-3M330 156l8-2M400 156l6 1" stroke-width="1" opacity=".6"/>
    <g opacity=".85"><path class="w" d="M168 168c4-8 34-8 40 0z" stroke-width="1.4"/><path class="w" d="M182 162l2-34h8l2 34z" stroke-width="1.4"/><path d="M183 140h10M183 150h10" stroke-width="1"/><path class="w" d="M181 128h14l-2-6h-10z" stroke-width="1.4"/><path class="hbeam" d="M195 124l26-6M181 124l-26-6" stroke-width="1.2" opacity=".5"/></g>
    <g opacity=".7"><path class="k" d="M470 166h18l-3 3h-12z"/><path d="M479 166v-9l6 7z" class="k"/><path class="k" d="M1150 166h14l-2 3h-10z"/><path d="M1157 166v-8l5 6z" class="k"/></g>
    <path d="M30 186h40M150 196h60M300 182h50M640 190h70M900 184h40M1080 194h60M1220 186h40" stroke-width="1.2" opacity=".35"/>
    <path class="w" d="M238 278V244c4-4 10-6 16-6H${HW}v40z" stroke="none"/>
    <path d="M238 278V246c4-5 10-8 16-8H${HW}" stroke-width="2.2"/>
    ${hStones(244,HW,243,276)}
    ${hGrass(250,HW,239)}`;
  // DOCKS: a pier on stilts, barrels, a rod over the water, a rowboat, and whoever is waiting
  g+=`<g class="hstop" data-bld="docks" role="button" tabindex="0" aria-label="Docks: ${I.docks.say}"><rect class="hit" x="0" y="120" width="250" height="200"/>
    <path d="M30 236V320M85 236V320M140 236V320M195 236V320" stroke-width="3"/>
    <path d="M30 248l55 30M85 248l-55 30M85 248l55 30M140 248l-55 30M140 248l55 30M195 248l-55 30" stroke-width="1.6"/>
    <rect class="w" x="14" y="226" width="226" height="10"/><path d="M34 226v10M58 226v10M82 226v10M106 226v10M130 226v10M154 226v10M178 226v10M202 226v10M226 226v10" stroke-width="1"/>
    ${hBarrel(52,226)}${hBarrel(74,226,.9)}${hCrate(92,226,20,16)}
    <path d="M24 226l-14-28" stroke-width="2"/><path d="M10 198q-6 30-2 78" stroke-width=".9"/><circle class="w" cx="8" cy="279" r="3" stroke-width="1.3"/>
    <path d="M222 226v-12h8v12" class="w" stroke-width="1.6"/><path d="M226 214v-3" stroke-width="2"/>
    <path d="M132 226v-50" stroke-width="2.4"/>${hSign(132,170,'Docks')}<path d="M122 170h20" stroke-width="2"/>
    ${I.docks.fish?`<g>${hCrate(150,226,26,14)}<path d="M154 212c5-5 10-5 14 0-4 4-9 4-14 0zM160 210l4-6 3 6" class="w" stroke-width="1.2"/><text class="hchalk" x="163" y="248" text-anchor="middle">${I.docks.fish} fish</text></g>`:''}
    ${hFigure(198,226,I.docks.look,I.docks.who)}</g>`;
  // MARKET: a warehouse with a striped stall, its counter laid with what's for sale
  const goods=[g=>hCrate(318,212,20,16),g=>`<path class="w" d="M352 212c-6 0-8-14 0-18 8 4 6 18 0 18z"/><path d="M348 197h8" stroke-width="1.2"/>`,
    g=>hBarrel(382,212,.75),g=>`<path class="w" d="M404 212v-12h14v12z"/><path class="w" d="M406 200c0-6 10-6 10 0" />`];
  g+=`<g class="hstop" data-bld="market" role="button" tabindex="0" aria-label="Market: ${I.market.say}"><rect class="hit" x="252" y="90" width="270" height="160"/>
    <path class="w" d="M282 238V150l70-42 70 42v88z"/>${hPlanks(282,150,140,88,9)}
    <path d="M276 152l76-46 76 46" stroke-width="2.6"/><rect class="w" x="338" y="116" width="28" height="22"/><path d="M338 127h28M352 116v22" stroke-width="1.2"/>
    <path class="w" d="M296 238v-26h112v26z"/>${hPlanks(296,212,112,26,8)}
    <path d="M300 212v-50M404 212v-50" stroke-width="2.4"/>
    <path class="w" d="M290 164h124l-10-24H300z"/><path d="M309 140l-5 24M321 140l-3 24M333 140l-1 24M345 140v24M357 140l1 24M369 140l3 24M381 140l5 24M393 140l7 24" stroke-width="1.2"/>
    <path class="w" d="M290 164q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0q7.75 9 15.5 0"/>
    ${I.market.n?goods.slice(0,I.market.n).map(f=>f()).join(''):`<text class="hchalk" x="352" y="206" text-anchor="middle">sold out</text>`}
    <g class="hlamp"><path d="M300 172v8" stroke-width="1.2"/><rect class="w" x="296" y="180" width="8" height="10" rx="2"/></g>
    ${hSign(352,72,'Market')}<path d="M352 72v-4" stroke-width="1.4"/>
    ${hBoard(424,196,I.market.n?[`${I.market.n} for sale`]:['come back','later'])}</g>`;
  // TAVERN: an arched hall with a mast on the roof, faces at the windows for every hand looking for work
  const faces=I.tavern.h;
  g+=`<g class="hstop" data-bld="tavern" role="button" tabindex="0" aria-label="Tavern: ${I.tavern.say}"><rect class="hit" x="532" y="40" width="360" height="210"/>
    <path class="w" d="M548 238V128c0-40 90-40 90 0v110z"/>${hPlanks(548,104,90,134,10)}<path d="M548 128c0-40 90-40 90 0" stroke-width="3"/>
    <rect class="w" x="576" y="92" width="34" height="14" rx="2"/><path d="M584 99h18M596 95l6 4-6 4" stroke-width="1.4"/>
    <path class="w" d="M574 238v-38c0-14 38-14 38 0v38z"/><circle cx="593" cy="214" r="4" stroke-width="1.6"/><path d="M574 222h38" stroke-width="1"/>
    <path class="w" d="M638 238v-96h228v96z"/>${hPlanks(638,142,228,96,10)}<path d="M632 142h240" stroke-width="3"/>
    <path class="w" d="M640 142v-26h224v26z"/><path d="M646 116v26M664 116v26M682 116v26M700 116v26M718 116v26M736 116v26M754 116v26M772 116v26M790 116v26M808 116v26M826 116v26M844 116v26" stroke-width="1" opacity=".6"/>
    <path d="M760 116V36" stroke-width="3"/><path d="M712 56h96" stroke-width="2.6"/><path class="w" d="M716 56c10 14 78 14 88 0z"/><path class="hflag" d="M760 34l18 5-18 5z" fill="#000"/>
    <rect class="w" x="824" y="96" width="12" height="20"/><path class="smoke" d="M830 92c-6-6 4-10-2-16M836 86c6-6-2-10 3-16" stroke-width="1.4"/>
    ${[662,712,762,812].map((x,i)=>`<circle class="w" cx="${x+12}" cy="184" r="12"/>${i<faces?`<circle cx="${x+12}" cy="184" r="8.5" fill="url(#hglow)" stroke="none"/>`:''}<circle class="w" cx="${x+12}" cy="184" r="8.5" stroke-width="1.2"/>${i<faces?hFace(x+12,182):''}`).join('')}
    <g class="hlamp"><path d="M866 152h14M876 152v8" stroke-width="1.6"/><path class="w" d="M871 160h10l-2 12h-6z"/></g>
    <path d="M548 152h-16M536 152v6" stroke-width="2"/><g class="hswing"><rect class="w" x="520" y="158" width="30" height="22" rx="3"/><path class="w" d="M528 163h10v12h-10zM538 166c5 0 5 7 0 7" stroke-width="1.3"/></g>
    ${hBarrel(626,238,.9)}<path d="M556 236c4-6 2-14 8-18M560 226c-5-1-7-4-6-8M563 222c4 0 6-3 6-6" stroke-width="1.2"/>
    <rect class="w" x="842" y="194" width="16" height="20" stroke-width="1.4"/><path d="M845 200h10M845 205h8" stroke-width="1" opacity=".7"/>
    ${hSign(593,40,'Tavern')}<path d="M593 40v-4" stroke-width="1.4"/>
    ${faces?'':`<text class="hchalk" x="752" y="230" text-anchor="middle">no hands for hire</text>`}</g>`;
  // SHIPWRIGHT: a workshop and a slipway with a hull up on stocks; a chalk notice keeps your hull
  g+=`<g class="hstop" data-bld="wright" role="button" tabindex="0" aria-label="Shipwright: ${I.wright.say}"><rect class="hit" x="896" y="60" width="384" height="250"/>
    <path class="w" d="M1110 238v-100h160v100z"/>${hPlanks(1110,138,160,100,10)}
    <path class="w" d="M1100 140c20-30 160-30 180 0z"/><path d="M1116 128c20-14 128-14 148 0" stroke-width="1" opacity=".6"/>
    <rect class="w" x="1140" y="166" width="22" height="30" rx="10"/><path d="M1151 166v30" stroke-width="1"/>
    <path class="w" d="M1196 238v-56h34v56z"/><circle cx="1222" cy="212" r="2" class="k"/>
    <g><path d="M1240 160l16 14M1246 164l-8 10" stroke-width="2"/><path d="M1180 158h24v4h-24z" class="w"/><path d="M1180 162v8M1204 162v8" stroke-width="1"/></g>
    <g transform="translate(-14 0)">    <path d="M900 300l200-58" stroke-width="2.6"/><path d="M930 292v-34M970 280v-34M1010 268v-34M1050 256v-30" stroke-width="1.8"/><path d="M920 258l140-34" stroke-width="1.4"/>
    <path class="w" d="M930 236c26 26 110 22 140-6l6-22H922z"/><path d="M936 222h134M944 232c30 6 80 4 112-6" stroke-width="1.2"/>
    <path d="M990 208V150M990 158l30 18" stroke-width="2"/><path d="M1030 208v-36" stroke-width="1.6"/></g>
    ${Array.from({length:Math.min(3,I.wright.f)},(_,i)=>hCrate(1112+i*26,238,22,16)).join('')}
    ${hSign(1190,96,'Shipwright')}<path d="M1190 96v-4" stroke-width="1.4"/>
    ${hBoard(1052,192,[`hull ${G.hull}/${HULL_MAX}`,I.wright.f?`${I.wright.f} fitting${I.wright.f>1?'s':''}`:'no fittings'])}</g>`;
  // life about the quay: bunting, a lamp post, a cat on a barrel, a coil of rope
  let flags='';for(let i=0;i<7;i++){const t=i/6,x=424+t*124,y=150+Math.sin(t*Math.PI)*22-t*12;flags+=`<path class="${i%2?'k':'w'}" d="M${x-5} ${y}l5 10 5-10z" stroke-width="1.2"/>`}
  g+=`<path d="M422 150q62 34 126 -12" stroke-width="1.1"/>${flags}
    <g><path d="M524 238v-58" stroke-width="2.4"/><path d="M518 238h12" stroke-width="2.4"/><path class="w" d="M517 180h14l-2-12h-10z" stroke-width="1.6"/><path d="M520 168l4-5 4 5" stroke-width="1.4"/></g>
    <g class="hcat"><path class="k" d="M620 214c-2-8 2-13 7-13l2-5 2 4h2l2-4 1 5c3 2 4 7 2 13z"/><path d="M634 212c6 0 8 4 5 8" stroke-width="2"/></g>
    <g><ellipse class="w" cx="888" cy="234" rx="10" ry="4" stroke-width="1.6"/><ellipse cx="888" cy="232" rx="6" ry="2.4" stroke-width="1.2"/><path d="M898 234c6 0 8 3 12 3" stroke-width="1.3"/></g>`;
  // the water in front, and the stilts reflected in it
  g+=`<path class="w" d="M0 278H${HW}v42H0z" stroke="none"/>
    <g class="hwaves"><path d="M-40 278q10-6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke-width="2"/>
      <path d="M-40 292q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke-width="1.2" opacity=".45"/></g>
    <path d="M30 284v30M85 284v30M140 284v30M195 284v30M972 290v14M1012 280v18" stroke-width="2" stroke-dasharray="2 4" opacity=".35"/>
    <g class="hboat"><path class="w" d="M44 284c10 11 56 11 66 0z"/><path d="M58 284v-6M96 284v-6M77 284v-14" stroke-width="1.3"/><path class="w" d="M78 272l14 8H78z" stroke-width="1.3"/></g>`;
  return g;
}
/* the scene: a window onto the world, arrows to walk along it */
function harbourScene(I){
  return`<div class="hscene"><div class="hscroll" id="hscroll"><svg class="hworld" viewBox="0 0 ${HW} ${HH}" aria-label="The harbour"><defs><pattern id="hglow" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#000" stroke-width="1.1" opacity=".45"/></pattern></defs>${harbourWorld(I)}</svg></div>
    <button class="hnav prev" id="hprev" type="button"><span aria-hidden="true">‹</span> <b></b></button><button class="hnav next" id="hnext" type="button"><b></b> <span aria-hidden="true">›</span></button></div>`;
}
/* where along the quay you're looking: remembered while you stay in port */
function bindHarbour(){
  const sc=document.getElementById('hscroll');if(!sc)return;
  const svg=sc.querySelector('svg'),k=()=>svg.getBoundingClientRect().height/HH,center=()=>(sc.scrollLeft+sc.clientWidth/2)/k();
  const near=()=>{const c=center();let best=0;HSTOPS.forEach((s,i)=>{if(Math.abs(s[2]-c)<Math.abs(HSTOPS[best][2]-c))best=i});return best};
  const goTo=(i,smooth)=>{sc.scrollTo({left:Math.max(0,HSTOPS[i][2]*k()-sc.clientWidth/2),behavior:smooth?'smooth':'instant'})};
  const prev=document.getElementById('hprev'),next=document.getElementById('hnext');
  const label=()=>{const i=near(),atL=sc.scrollLeft<4,atR=sc.scrollLeft+sc.clientWidth>sc.scrollWidth-4;
    prev.hidden=atL||i===0;next.hidden=atR||i===HSTOPS.length-1;
    if(!prev.hidden){prev.dataset.i=i-1;prev.querySelector('b').textContent=HSTOPS[i-1][1]}
    if(!next.hidden){next.dataset.i=i+1;next.querySelector('b').textContent=HSTOPS[i+1][1]}
    PV.hx=sc.scrollLeft/k()};
  prev.onclick=()=>goTo(+prev.dataset.i,true);next.onclick=()=>goTo(+next.dataset.i,true);
  sc.addEventListener('scroll',()=>requestAnimationFrame(label),{passive:true});
  if(PV.hx!=null)sc.scrollLeft=PV.hx*k();else goTo(1,false);
  label();
}
