/* Ink Crossing: the bandits. Hidden in one stretch of unknown water per sea: pirates board you and make you play a hand of
   cards for your freedom. Poker hands score chips times mult, like Balatro: three plays and two discards to beat their score.
   Win and they pay you to leave (bandPurse); lose and they take the most valuable half of your hold (rounded up) and smash your hull to half. */
"use strict";
const BANDIT_LOOK={body:'Killer',head:'hat-hip',face:'Very Angry',beard:'Full 3',acc:'Eyepatch'};
// each hand: [name, chips, mult]
const BHANDS={HC:['High card',5,1],P:['Pair',10,2],TP:['Two pair',20,2],TK:['Three of a kind',30,3],S:['Straight',30,4],F:['Flush',35,4],FH:['Full house',40,4],FK:['Four of a kind',60,7],SF:['Straight flush',100,8]};
const BSUIT={S:'♠',H:'♥',D:'♦',C:'♣'},BRANK={11:'J',12:'Q',13:'K',14:'A'};
const bandTarget=()=>360+G.sea*60;
const bandPurse=()=>15+G.sea*5;   // what they pay a captain who beats them: 15, 20, 25 by sea
const cardChips=c=>c.r===14?11:c.r>10?10:c.r;
/* what a set of cards makes: the hand and the cards in it that score */
function bandEval(cs){if(!cs.length)return null;const n=cs.length,by={};cs.forEach(c=>(by[c.r]=by[c.r]||[]).push(c));
  const g=Object.values(by).sort((a,b)=>b.length-a.length||b[0].r-a[0].r),flush=n===5&&cs.every(c=>c.s===cs[0].s);
  const rs=[...new Set(cs.map(c=>c.r))].sort((a,b)=>a-b),straight=n===5&&rs.length===5&&(rs[4]-rs[0]===4||rs.join()==='2,3,4,5,14');
  const t=straight&&flush?['SF',cs]:g[0].length===4?['FK',g[0]]:g[0].length===3&&g[1]&&g[1].length>=2?['FH',[...g[0],...g[1]]]:flush?['F',cs]:straight?['S',cs]
    :g[0].length===3?['TK',g[0]]:g[0].length===2&&g[1]&&g[1].length===2?['TP',[...g[0],...g[1]]]:g[0].length===2?['P',g[0]]:['HC',[cs.slice().sort((a,b)=>b.r-a.r)[0]]];
  const[,ch,mu]=BHANDS[t[0]],chips=ch+t[1].reduce((a,c)=>a+cardChips(c),0);return{k:t[0],name:BHANDS[t[0]][0],cards:t[1],chips,mult:mu,score:chips*mu}}
/* the boarding: a black-sailed ship runs up alongside yours, grappling hooks fly across and bite, the bandits swing over on
   ropes and land on your deck, and "Boarded!" slams on. A tap skips it; reduced motion goes straight to the cards. */
function boardingFx(then){
  // clear the chart first, so nothing behind the show can be tapped (and no voyage carries on) before the cards are dealt
  cancelAnimationFrame(raf);B=null;app.innerHTML=`${barHTML()}<div class="seahead"><h2>Boarded!</h2><span>Bandits</span></div>`;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return then();
  const fx=document.createElement('div');fx.className='boardfx';
  const wave=(y,amp,len)=>{let d=`M${-len*2} ${y}`;for(let x=-len*2;x<900;x+=len)d+=`q${len/4} ${-amp} ${len/2} 0t${len/2} 0`;return`<path class="w" d="${d}V1400H${-len*2}z"/>`};
  const hooks=[[262,96,148,104],[270,120,150,124],[258,72,132,88]];
  fx.innerHTML=`<svg class="bf-sea" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g class="bf-w1">${wave(178,6,80)}</g>
      <g class="bf-mine"><g transform="translate(30 70)"><g class="shipdraw ship-${SHIPDRAW[G.ship]?G.ship:'sloop'}" stroke="#000" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">${SHIPDRAW[G.ship]||SHIPDRAW.sloop}</g></g></g>
      <g class="bf-pirate"><g transform="translate(372 62) scale(-1 1)"><g stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#000" class="bf-black">${SHIPDRAW.galleon}</g></g></g>
      ${hooks.map(([x1,y1,x2,y2],i)=>`<g class="bf-hook" style="--i:${i}"><path class="bf-rope" d="M${x1} ${y1}Q${(x1+x2)/2} ${Math.min(y1,y2)-26} ${x2} ${y2}"/><path class="bf-claw" d="M${x2} ${y2}m-6 -4q2 8 6 4q4 4 6-4M${x2} ${y2}v-6"/></g>`).join('')}
      ${[0,1,2].map(i=>`<g class="bf-bandit" style="--i:${i}"><g transform="translate(${262+i*14} ${26+i*6}) scale(.17)">${peepLayers(BANDIT_LOOK)}</g></g>`).join('')}
      <g class="bf-w2">${wave(200,12,100)}</g><g class="bf-w3">${wave(226,16,120)}</g>
    </svg>
    <div class="bf-call"><span>Boarded!</span></div>`;
  document.body.appendChild(fx);
  let gone=false;const end=()=>{if(gone)return;gone=true;clearTimeout(t);then();fx.classList.add('out');setTimeout(()=>fx.remove(),400)};
  const t=setTimeout(end,3600);setTimeout(()=>fx.addEventListener('click',end),300)}
function bandits(n,done,resumed){
  if(!resumed&&G.boarded==null){G.boarded=n.id;save();return boardingFx(()=>bandits(n,done,true))}
  cancelAnimationFrame(raf);B=null;G.inPort=false;G.boarded=n.id;save();
  // the deck is shuffled by the voyage code, so every captain on this voyage is dealt the same cards
  const r=RNG(G.seed,'bandits',n.id),deck=[];for(const s of 'SHDC')for(let k=2;k<=14;k++)deck.push({r:k,s,id:s+k});
  for(let i=deck.length-1;i>0;i--){const j=ri(r,i+1);[deck[i],deck[j]]=[deck[j],deck[i]]}
  const T=bandTarget(),still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let hand=deck.splice(0,8),sel=new Set(),score=0,plays=3,discs=2,busy=false,last=null,dealt=new Set(hand.map(c=>c.id));
  const sortHand=()=>hand.sort((a,b)=>b.r-a.r||a.s.localeCompare(b.s));sortHand();
  const card=c=>`<button class="bcard${'HD'.includes(c.s)?' red':''}${sel.has(c.id)?' on':''}${dealt.has(c.id)?' deal':''}" data-c="${c.id}" aria-pressed="${sel.has(c.id)}" aria-label="${BRANK[c.r]||c.r} of ${({S:'spades',H:'hearts',D:'diamonds',C:'clubs'})[c.s]}"><b>${BRANK[c.r]||c.r}</b><i>${BSUIT[c.s]}</i></button>`;
  let finished=false;   // once the hand is decided the table never redraws, so nothing can put it back over the chart
  function render(){if(finished||G.boarded!==n.id)return;const picked=hand.filter(c=>sel.has(c.id)),ev=bandEval(picked);
    app.innerHTML=`${barHTML()}<div class="seahead"><h2>Boarded!</h2><span>Bandits</span></div>
    <section class="bandits">
      <div class="bd-top"><div class="bd-face">${peep(BANDIT_LOOK,'40 22 172 150')}</div>
        <div class="talk bd-talk"><p class="say">“${score>=T?'Fine. You play well. Take your winnings.':plays===3&&discs===2?`Cards, captain. Beat ${T} and we pay you ${bandPurse()} gold. Lose, and we take the best half of your hold.`:score?`${T-score} more, or we take half your hold.`:'Play your cards, captain.'}”</p></div></div>
      <div class="bd-score"><div><span class="sc-lbl">Their score</span><b>${T}</b></div><div class="bd-mine"><span class="sc-lbl">Your score</span><b id="bdscore">${score}</b></div><div><span class="sc-lbl">Plays</span><b>${plays}</b></div><div><span class="sc-lbl">Discards</span><b>${discs}</b></div></div>
      <div class="bd-bar"><i style="width:${Math.min(100,score/T*100)}%"></i></div>
      <p class="bd-now" id="bdnow">${last?`<b>${last.name}</b> (${last.chips} × ${last.mult}) = <b>${last.score}</b>`:ev?`<b>${ev.name}</b>: ${ev.chips} chips × ${ev.mult} mult = ${ev.score}`:'Pick up to 5 cards to play, or to discard.'}</p>
      <div class="bd-felt" id="bdfelt" aria-hidden="true"><span>The table</span></div>
      <div class="bd-hand" id="bdhand">${hand.map(card).join('')}</div>
      <div class="bd-acts"><button class="primary" id="bplay" ${picked.length&&!busy?'':'disabled'}>Play hand</button><button class="ghost" id="bdisc" ${picked.length&&discs&&!busy?'':'disabled'}>Discard (${discs})</button></div>
      <details class="bd-help"><summary>How hands score</summary><div class="bd-table">${Object.values(BHANDS).map(([nm,c,m])=>`<span>${nm}</span><span>${c} × ${m}</span>`).join('')}</div><p class="soft">Each scoring card adds its chips: number cards their number, J, Q and K 10, aces 11.</p></details>
    </section>`;
    bindBar();dealt.clear();
    app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(busy)return;const id=b.dataset.c;if(sel.has(id))sel.delete(id);else if(sel.size<5)sel.add(id);last=null;render()});
    const pb=document.getElementById('bplay'),db=document.getElementById('bdisc');
    pb.onclick=play;db.onclick=discard}
  function draw(k){const nw=deck.splice(0,k);nw.forEach(c=>dealt.add(c.id));hand=hand.concat(nw);sortHand()}
  function discard(){if(finished||!sel.size||!discs||busy)return;discs--;hand=hand.filter(c=>!sel.has(c.id));const k=sel.size;sel.clear();last=null;draw(k);render()}
  /* playing a hand, Balatro style: the cards fly up onto the table, each scoring card pops and adds its chips one by one, the
     mult stamps on, the total slams down and flies into your score, then the cards are swept away and new ones dealt */
  function play(){if(finished||!sel.size||busy)return;const picked=hand.filter(c=>sel.has(c.id)),ev=bandEval(picked);busy=true;
    const from=score;score+=ev.score;plays--;last=ev;
    const scoreEl=document.getElementById('bdscore');
    const countScore=then=>{const t0=performance.now(),D=still?0:600;const tick=t=>{const k=D?Math.min(1,(t-t0)/D):1;scoreEl.textContent=Math.round(from+ev.score*k);if(k<1)requestAnimationFrame(tick);else{squish(scoreEl,'bump');then()}};requestAnimationFrame(tick)};
    if(still){countScore(()=>setTimeout(next,200));return}
    const felt=document.getElementById('bdfelt'),hb=document.getElementById('bdhand'),stage=document.createElement('div');stage.className='bd-stage';felt.appendChild(stage);felt.classList.add('busy');
    // the table: the played cards in a row, and the sum underneath
    stage.innerHTML=`<div class="bds-cards"></div><div class="bds-sum"><b class="bds-name">${ev.name}</b><span class="bds-chips"><b id="bdchips">${ev.chips-ev.cards.reduce((a,c)=>a+cardChips(c),0)}</b><small>chips</small></span><i>×</i><span class="bds-mult"><b>${ev.mult}</b><small>mult</small></span></div>`;
    const row=stage.querySelector('.bds-cards'),els=[...hb.querySelectorAll('.bcard.on')];
    els.forEach((el,k)=>{const c=hand.find(x=>x.id===el.dataset.c),r0=el.getBoundingClientRect(),cl=el.cloneNode(true);cl.classList.remove('on','deal');cl.classList.toggle('scores',ev.cards.some(x=>x.id===c.id));cl.dataset.chips=cardChips(c);
      row.appendChild(cl);const r1=cl.getBoundingClientRect();el.style.visibility='hidden';
      cl.animate([{transform:`translate(${r0.left-r1.left}px,${r0.top-r1.top}px)`},{transform:'none'}],{duration:380,delay:k*50,easing:'cubic-bezier(.3,1.3,.5,1)',fill:'backwards'})});
    // each scoring card in turn: it pops, "+chips" floats off it, and the chips count climbs
    const scoring=[...row.querySelectorAll('.bcard.scores')],chipsEl=stage.querySelector('#bdchips');let chips=+chipsEl.textContent;
    scoring.forEach((cl,k)=>setTimeout(()=>{if(!stage.isConnected)return;squish(cl,'pop');chips+=+cl.dataset.chips;chipsEl.textContent=chips;squish(chipsEl.parentElement,'bump');
      const f=document.createElement('span');f.className='bds-plus';f.textContent='+'+cl.dataset.chips;cl.appendChild(f)},600+k*240));
    const tm=600+scoring.length*240+120;
    setTimeout(()=>{if(!stage.isConnected)return;stage.querySelector('.bds-mult').classList.add('stamp')},tm);
    // the total slams down, then flies up into your score
    setTimeout(()=>{if(!stage.isConnected)return;const tot=document.createElement('div');tot.className='bds-total';tot.textContent=ev.score;stage.appendChild(tot);
      setTimeout(()=>{const a=tot.getBoundingClientRect(),b=scoreEl.getBoundingClientRect();
        tot.animate([{transform:'none',opacity:1},{transform:`translate(${b.left+b.width/2-(a.left+a.width/2)}px,${b.top+b.height/2-(a.top+a.height/2)}px) scale(.45)`,opacity:.9}],{duration:450,easing:'cubic-bezier(.5,0,.6,1)',fill:'forwards'}).onfinish=()=>{tot.remove();
          // sweep the played cards off the table
          row.querySelectorAll('.bcard').forEach((cl,k)=>cl.animate([{transform:'none',opacity:1},{transform:`translate(${160+k*20}px,-40px) rotate(30deg)`,opacity:0}],{duration:380,delay:k*40,easing:'ease-in',fill:'forwards'}));
          countScore(()=>setTimeout(()=>{stage.remove();next()},300))}},520)},tm+380);
    function next(){hand=hand.filter(c=>!sel.has(c.id));const k=sel.size;sel.clear();busy=false;
      if(score>=T)return finish(true);if(!plays)return finish(false);draw(k);render()}}
  function finish(won){if(finished)return;finished=true;G.boarded=null;
    const lost=[],wasHull=G.hull;let msg,gold=0;
    if(won){// they pay up and row away
      gold=bandPurse();G.gold+=gold;bump='gold';msg=`Beat the bandits at cards. They paid ${gold} gold to be rid of us.`}
    else{// they take the most valuable half of the hold, rounded up; the rest stays where it was
      const best=G.board.map((b,i)=>i).sort((a,b)=>price(G.board[b].k,G.board[b].t)-price(G.board[a].k,G.board[a].t)).slice(0,hasF('smuggle')?1:Math.ceil(G.board.length/2));
      lost.push(...best.sort((a,b)=>a-b).map(i=>G.board[i]));G.board=G.board.filter((b,i)=>!best.includes(i));const was=G.hull;G.hull=Math.max(1,Math.floor(G.hull/2));
      msg=`Lost to the bandits at cards. They took the best half of the hold${lost.length?` (${lost.length} piece${lost.length===1?'':'s'} of cargo)`:''} and smashed the hull from ${was} to ${G.hull}.`}
    logL(msg);save();
    // the reckoning: their verdict stamps down, the scores are set side by side, then the cargo they take is snatched away piece
    // by piece; if you lost, the hull number is smashed down while planks crack off. The button arrives last.
    const nl=lost.length,still=matchMedia('(prefers-reduced-motion:reduce)').matches,hullT=.9+nl*.18;
    const ov=overlay(`<div class="bd-end ${won?'won':'lost'}"><div class="bd-face big">${peep(BANDIT_LOOK,'40 22 172 150')}</div>
      <h2 class="bd-verdict">${won?'You keep your ship':'They take half'}</h2>
      <div class="bd-vs"><span><small>You</small><b>${score}</b></span><i>${won?'beats':'against'}</i><span><small>Them</small><b>${T}</b></span></div>
      ${won?`<p class="bd-purse">${sicon('gold')}<b>+${gold} gold</b></p><p class="soft bd-gone" style="--d:1.1s">They pay up and row away.</p>`:nl?`<div class="bd-lost">${lost.map((b,k)=>`<span class="o-icon t${b.t}" style="--i:${k}">${icon(b.k)}</span>`).join('')}</div><p class="soft bd-gone" style="--d:${.9+nl*.18}s">${won?'They took':'Gone'}: ${lost.map(b=>DEFS[b.k].n).join(', ')}.</p>`:`<p class="soft bd-gone" style="--d:.9s">${won?'There was nothing in the hold for them to take.':'There was nothing in the hold to take.'}</p>`}
      ${won?'':`<div class="bd-hull" style="--d:${hullT}s;--hd:${hullT}s"><span>Hull</span><b id="bdhull">${still?G.hull:wasHull}</b><div class="planks" aria-hidden="true">${Array.from({length:Math.min(wasHull,40)},(_,k)=>`<i${k>=G.hull?` class="go" style="--d:${(k-G.hull)*60}ms"`:''}></i>`).join('')}</div></div>`}</div>
      <button class="primary bd-go" id="bdgo" style="--d:${won?1.5:hullT+1}s">Sail on</button>`,true,'bdresult');
    if(!won&&!still){const hb=ov.querySelector('#bdhull'),n=wasHull-G.hull;
      for(let k=1;k<=n;k++)setTimeout(()=>{if(!ov.isConnected)return;hb.textContent=wasHull-k;squish(hb,'bump')},hullT*1000+600+(k-1)*60);
      setTimeout(()=>{if(ov.isConnected)squish(ov.querySelector('.sheet')||ov.firstElementChild,'jolt')},hullT*1000+500)}
    const b=ov.querySelector('#bdgo');b.focus();
    // Sail on always gets you back to the chart: if the usual way fails, draw the chart directly
    let left=false;b.onclick=()=>{if(left)return;left=true;const p=ov.querySelector('.bd-purse'),r=p&&p.getBoundingClientRect();ov.remove();try{done()}catch(e){console.error(e)}
      if(app.querySelector('.bandits')){try{if(G.hull<=0)sink();else chart()}catch(e){console.error(e);app.innerHTML='';resume()}}
      // their purse flies into yours on the chart
      if(gold&&r)setTimeout(()=>sellFx(r.left+r.width/2,r.top+r.height/2,gold),50)}}
  render();
}
