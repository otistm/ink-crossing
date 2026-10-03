/* Ink Crossing: the tutorial (a short guided first voyage with Ansel as coach) and one-time tips for everything else. */
"use strict";
/* The maiden voyage: the Guild's trial run, six stops that each teach one part of the game by playing it.
   Gullhaven: ship cargo, then crew cargo and the hand who wields it. The training hulk: a fight, then renown and a captain's pick.
   The uncharted isle: a landmark. Saltmere: a fitting at the shipwright. The examiner: everything working together.
   The Guild hall: done.
   Steps. when: the event that shows the step (none = right after the previous one).
   until: the event that moves on ('next' shows a Next button, 'finish' a Finish button). pause: holds the fight while it's shown. */
const TUT=[
  // Gullhaven: items, the crew who work them, and why order matters
  {when:'port',until:'next',text:"Welcome, cartographer. This trial voyage teaches the game one stop at a time."},
  {until:'bought',target:'#stall',text:"Ship cargo works on its own. Buy the Jib Sail at the Shipyard."},
  {until:'armory',target:'[data-st="armory"]',pos:'bottom',text:"Crew cargo needs a hand to wield it. Look in the Armory."},
  {when:'armory',until:'tavern',target:'[data-bld="tavern"]',pos:'bottom',text:"No Master-at-Arms aboard, no sale. Open the Tavern."},
  {when:'tavern',until:'hired',target:'.talk .buy',text:"The Master-at-Arms wields crew weapons and shields. Sign them on."},
  {when:'hired',until:'market',target:'[data-bld="market"]',pos:'bottom',text:"Hands level up as you win. Now back to the Market."},
  {when:'market',until:'bought',target:'#stall',text:"The Armory will sell to you now. Buy the Rapier."},
  {until:'moved',target:'.dock .board',text:"Order matters. Drag the Jib Sail to the left of the Rapier."},
  {until:'chart',target:'#leave',text:"Now tap Set sail."},
  // the training hulk: fighting, then renown
  {when:'chart',until:'fight',target:'.node.reach',text:"Tap the training hulk, then Sail here."},
  {when:'fight',until:'next',pause:1,target:'.board[data-side="p"]',pos:'bottom',text:"Your cargo charges up and fires on its own."},
  {until:'next',pause:1,target:'.speed',pos:'bottom',text:"A storm hits both ships at 30 seconds. Tap 2× or 4× to speed up."},
  {when:'renown',until:'perkDone',text:"Wins earn renown. Make a captain's pick: a rule for the whole voyage."},
  {when:'spoils',until:'spoilsTaken',target:'.offers',text:"Take one piece of their cargo, then Sail on."},
  // the isle: landmarks
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail to the uncharted isle."},
  {when:'landmarkOpen',until:'landmark',text:"Landmarks help for the whole voyage. Pick one."},
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail on to Saltmere."},
  // Saltmere: upgrades, selling, fittings
  {when:'port',until:'bought',target:'.stallsec',text:"Open the Armory and buy the Rapier. A matching item upgrades yours."},
  {until:'next',target:'.dock .board',text:"Upgraded! To sell cargo, drag it onto Set sail."},
  {until:'wright',target:'[data-bld="wright"]',pos:'bottom',text:"Fittings change how your ship fights. Open the Shipwright."},
  {when:'wright',until:'fitted',target:'#stall',text:"Tap a fitting, then fit it. Each one has a trade-off."},
  {when:'fitted',until:'next',target:'#shipbtn',pos:'bottom',text:"Tap your hull any time to see your ship."},
  {until:'chart',target:'#leave',text:"One test left. Set sail."},
  // the examiner: everything together
  {when:'chart',until:'fight',target:'.node.reach',text:"Sail at the Guild's examiner."},
  {when:'fight',until:'next',pause:1,target:'#pf',pos:'bottom',text:"Cargo, crew, fitting and landmark all work together now."},
  {when:'spoils',until:'spoilsTaken',target:'.offers',text:"Take your spoils, then Sail on."},
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail in to the Guild hall."},
  {when:'port',until:'finish',text:"Trial passed! Out there, crew take wages each port and shipwrights mend your hull."}
];
const ANSEL=NPCS.ansel.look;
function startTutorial(){
  // open: the places that are open at each port of the trial
  const map={sea:0,start:900,boss:null,rows:5,nodes:[
    {id:900,row:0,col:1.5,x:170,type:'port',name:'Gullhaven',open:['market','tavern']},
    {id:901,row:1,col:1.5,x:170,type:'threat',enemy:'gulls',fixed:{hp:60,list:[{k:'pins',t:0}]}},
    {id:902,row:2,col:1.5,x:170,type:'isle'},
    {id:903,row:3,col:1.5,x:170,type:'port',name:'Saltmere',open:['market','wright']},
    {id:904,row:4,col:1.5,x:170,type:'threat',enemy:'sharks',fixed:{hp:110,list:[{k:'dagger',t:0},{k:'fenders',t:0},{k:'pins',t:0}]}},
    {id:905,row:5,col:1.5,x:170,type:'port',name:'The Guild hall',open:['market']}],
    edges:[[900,901],[901,902],[902,903],[903,904],[904,905]]};
  G=Object.assign({},VOYAGE_DEFAULTS,{seed:'TUTORIAL',ship:'sloop',sea:0,map,at:900,path:[900],day:1,gold:25,hull:20,renown:RENOWN[0]-1,
    board:[],charts:[],log:[],creel:[],hock:'tutorial',tut:{i:0,on:false},crew:[],
    shops:{900:{offers:[{k:'jib',t:0},{k:'sail',t:0},{k:'fenders',t:0},{k:'tar',t:0}],stalls:{armory:[{k:'rapier',t:0},{k:'swordcane',t:0},{k:'dagger',t:0},{k:'pins',t:0}],
        apoth:[{k:'pork',t:0},{k:'grog',t:0},{k:'lime',t:0},{k:'teapot',t:0}],charms:[{k:'spyglass',t:0},{k:'hook',t:0},{k:'net',t:0},{k:'tailwind',t:0}]},tavern:['atarms','bosun','surgeon'],reroll:1,demand:'mackerel'},
      903:{offers:[{k:'fenders',t:0},{k:'plating',t:0},{k:'compass',t:0},{k:'tar',t:0}],stalls:{armory:[{k:'rapier',t:0},{k:'pistols',t:0},{k:'duelglove',t:0},{k:'dagger',t:0}],
        apoth:[{k:'pork',t:0},{k:'lime',t:0},{k:'kelp',t:0},{k:'teapot',t:0}],charms:[{k:'spyglass',t:0},{k:'hook',t:0},{k:'net',t:0},{k:'rum',t:0}]},fits:['ram','studding'],reroll:1,demand:'mackerel'}}});
  updateReveal();lore(LORE.start);port(900);
}
/* is a place open? Everywhere in a real voyage; in the trial, only where that stop's lesson is */
const tutOpen=view=>!G||!G.tut||((node(G.at)||{}).open||[]).includes(view);
function finishTutorial(){
  hideCoach();A.tutDone=true;saveA();
  cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;G=null;
  document.querySelectorAll('.overlay').forEach(o=>o.remove());title();
  toast("Trial passed. Pick a voyage when you're ready.");
}
/* the coach bubble */
function hideCoach(){const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}const dm=document.getElementById('coachdim');if(dm)dm.remove();document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));if(B)B.coachHold=false}
/* How long a tip stays up before its ring resolves into the close button: longer tips get more reading time. */
/* The coach bubble. A ring in the corner fills while you read, then pops into an x that closes the tip.
   The bubble itself lets taps through, so it never blocks the screen underneath; only its buttons take taps. */
function bubble(text,o){o=o||{};
  hideCoach();
  const c=document.createElement('div');c.id='coach';c.className='coach '+(o.pos||'top');c.setAttribute('role','status');c.setAttribute('aria-live','polite');
  c.innerHTML=`${portrait(ANSEL)}<div class="coach-body">${o.label?`<small>${o.label}</small>`:''}<p>${text}</p><div class="coach-btns">${o.btn===null?'':`<button class="cnext" data-c="next">${o.btn||'Next'}</button>`}${o.links||''}</div></div>`;
  document.body.appendChild(c);dimFor(c,o.target);
  coachPos(c,o.pos||'top');
  highlight(o.target);
  const nb=c.querySelector('.cnext');if(nb)nb.onclick=()=>{if(o.onClose)o.onClose();else hideCoach()};
  return c;
}
/* the dimmer behind the coach bubble. It takes no taps, so you can still do what Ansel asks. It keeps a clear window over
   what he's pointing at (or the open pop-up), following it as the screen scrolls or redraws. */
function coachPos(c,pos){c.classList.remove('top','bottom');c.classList.add(pos);
  if(pos==='bottom'){const d=document.querySelector('.dock');c.style.bottom=`calc(${d?d.offsetHeight+10:14}px + env(safe-area-inset-bottom,0px))`}else c.style.bottom=''}
function dimFor(c,target){let d=document.getElementById('coachdim');if(!d){d=document.createElement('div');d.id='coachdim';d.className='coachdim';d.setAttribute('aria-hidden','true');document.body.appendChild(d)}
  d.dataset.t=target||'';const hole=document.createElement('i');d.innerHTML='';d.appendChild(hole);
  const place=()=>{if(!c.isConnected||!d.isConnected)return;const t=d.dataset.t;let el=t&&document.querySelector(t);
    if(!el){const ovs=[...document.querySelectorAll('.overlay .sheet')];el=ovs[ovs.length-1]||null}
    if(el){const r=el.getBoundingClientRect(),p=8;if(r.width&&r.height){
      // keep whichever end of the screen covers less of what's being pointed at (checked again if the target changes)
      if(t&&c._for!==t){c._for=t;const cover=()=>{const q=c.getBoundingClientRect();return Math.max(0,Math.min(q.right,r.right)-Math.max(q.left,r.left))*Math.max(0,Math.min(q.bottom,r.bottom)-Math.max(q.top,r.top))};
        const was=c.classList.contains('bottom')?'bottom':'top',a=cover();if(a>0){coachPos(c,was==='top'?'bottom':'top');if(cover()>=a)coachPos(c,was)}}
     hole.style.cssText=`left:${r.left-p}px;top:${r.top-p}px;width:${r.width+p*2}px;height:${r.height+p*2}px`;requestAnimationFrame(place);return}}
    hole.style.cssText='left:50%;top:50%;width:0;height:0';requestAnimationFrame(place)};
  place()}
function highlight(target){
  const dm=document.getElementById('coachdim');if(dm)dm.dataset.t=target||'';
  document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));
  if(!target)return;const el=document.querySelector(target);if(!el)return;el.classList.add('coach-hi');
  if(!el.closest('.dock')&&!el.closest('#coach')){const r=el.getBoundingClientRect();if(r.top<150||r.bottom>innerHeight-220)el.scrollIntoView({block:'center',behavior:'smooth'})}
}
function showStep(ev){
  const T=G.tut,st=TUT[T.i];T.on=true;T.due=false;
  const text=st.textFor?st.textFor[ev]:st.text,u=[].concat(st.until);
  // closing a step: explanations move on, the last one finishes, and action steps just tuck the tip away until you do the thing
  const onClose=u.includes('finish')?finishTutorial:(u.includes('next')||st.skip)?()=>advance():()=>{const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}};
  const c=bubble(text,{btn:u.includes('finish')?'Finish':(u.includes('next')||st.skip)?'Next':null,pos:st.pos,target:st.target,label:`Maiden voyage, stop ${Math.min(G.path.length,G.map.nodes.length)} of ${G.map.nodes.length}`,links:`<button class="linkbtn" data-c="skip">Skip tutorial</button>`,onClose});
  if(st.pause&&B)B.coachHold=true;
  c.querySelector('[data-c=skip]').onclick=finishTutorial;
}
function advance(ev){const T=G.tut;hideCoach();T.i++;while(TUT[T.i]&&TUT[T.i].skipIf&&TUT[T.i].skipIf())T.i++;T.on=false;T.due=false;const nx=TUT[T.i];
  if(nx&&(!nx.when||(ev&&[].concat(nx.when).includes(ev)))){T.due=true;setTimeout(()=>{if(G&&G.tut&&!G.tut.on&&TUT[G.tut.i]===nx)showStep(ev)},320)}}
/* the game reports what just happened */
function coach(ev){
  if(!G||!G.tut)return;const T=G.tut,st=TUT[T.i];if(!st)return;
  if(T.on){
    if([].concat(st.until).includes(ev))return advance(ev);
    if(st.target)setTimeout(()=>highlight(st.target),30);   // screen redrew: put the highlight back
    return}
  // the step is due but its bubble hasn't shown yet, and the player already did what it asks (a quick tap): move on
  if(T.due&&[].concat(st.until).includes(ev))return advance(ev);
  const w=st.when?[].concat(st.when):null;
  if(!w||w.includes(ev)){T.due=true;setTimeout(()=>{if(G&&G.tut&&!G.tut.on&&TUT[G.tut.i]===st)showStep(ev)},st.when?260:0)}
}
/* Ansel only speaks during the maiden voyage: real voyages have no tips. (A.tips and A.tipsOff stay in old saves, unused.) */
