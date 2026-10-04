/* Ink Crossing: online services through Supabase (feedback now, PvP ghosts later). Does nothing when config.js has no keys. */
"use strict";
const ONLINE=!!(SUPABASE_URL&&SUPABASE_ANON_KEY);
const NET={sb:null,uid:null,err:'',ready:Promise.resolve()};
function initOnline(){
  if(!ONLINE){NET.err='online play is not set up';return}
  NET.ready=new Promise(res=>{
    const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=async()=>{try{NET.sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
        const{data:{session}}=await NET.sb.auth.getSession();
        if(session)NET.uid=session.user.id;else{const{data,error}=await NET.sb.auth.signInAnonymously();if(error)throw error;NET.uid=data.user.id}
      }catch(e){NET.err=e.message||String(e)}res()};
    s.onerror=()=>{NET.err='could not reach the online service';res()};
    document.head.appendChild(s)});
}
/* ---------- feedback: testers send notes straight into the Supabase "crossing_feedback" table ---------- */
const FB_KINDS=['Bug','Idea','Too hard','Too easy','Other'];
function feedbackContext(){const n=G&&G.map?node(G.at):null;
  return{version:VERSION,seed:G?G.seed:'',ship:G?G.ship:'',sea:G?G.sea+1:null,day:G?G.day:null,stop:n?n.type:'',hull:G?G.hull:null,gold:G?G.gold:null,
    hold:G?G.board.map(b=>`${b.k}:${b.t}`).join(' '):'',screen:`${innerWidth}x${innerHeight}`,device:navigator.userAgent.slice(0,160),
    standalone:!!(matchMedia('(display-mode: standalone)').matches||navigator.standalone)}}
function feedbackLink(id){return ONLINE?` <button class="linkbtn" id="${id}">Send feedback</button>`:''}
function showFeedback(){
  let kind=FB_KINDS[0];
  const ov=overlay(`<h2>Send feedback</h2><p>Tell Otis what happened or what you'd change. Your version, ship and where you are on the chart get attached automatically.</p>
    <div class="fbk" role="radiogroup" aria-label="Kind of feedback">${FB_KINDS.map((k,i)=>`<button type="button" role="radio" class="fbc${i?'':' on'}" aria-checked="${!i}">${k}</button>`).join('')}</div>
    <textarea id="fbNote" maxlength="1000" rows="5" placeholder="What happened? Where on the chart? What did you expect?"></textarea>
    <p class="fbmsg" id="fbMsg"></p><div class="sh-actions"><button class="ghost" data-a="back">Back</button><button class="primary" id="fbSend">Send</button></div>`,true);
  setTimeout(()=>ov.querySelector('#fbNote').focus(),120);
  ov.querySelectorAll('.fbc').forEach(b=>b.onclick=()=>{ov.querySelectorAll('.fbc').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false')});b.classList.add('on');b.setAttribute('aria-checked','true');kind=b.textContent});
  ov.querySelector('[data-a=back]').onclick=()=>ov.remove();
  ov.querySelector('#fbSend').onclick=async()=>{
    const note=ov.querySelector('#fbNote').value.trim(),msg=ov.querySelector('#fbMsg'),btn=ov.querySelector('#fbSend');
    if(!note){msg.textContent='Write a quick note first.';return}
    btn.disabled=true;msg.textContent='Sending…';await NET.ready;let ok=false,why='';
    if(NET.sb&&NET.uid){try{const{error}=await NET.sb.from('crossing_feedback').insert({player_id:NET.uid,version:VERSION,kind,note,context:feedbackContext()});ok=!error;if(error)why=error.message||error.code}catch(e){why=e.message||String(e)}}
    else why=NET.err||'online play is not connected';
    if(ok){ov.querySelector('.sheet').innerHTML=`<h2>Thank you</h2><p>Your note is on its way.</p><button class="primary" data-a="ok">Back</button>`;ov.querySelector('[data-a=ok]').onclick=()=>ov.remove()}
    else{btn.disabled=false;msg.textContent=`Couldn't send (${why}). Your note is still here, so you can try again or copy it.`}};
}
/* ---------- landmarks: the last captain to claim each one (their ghost), and posting your own claim ---------- */
const slow=ms=>new Promise(r=>setTimeout(()=>r({data:null,error:'slow'}),ms));
async function lmFetch(key){await NET.ready;if(!NET.sb)return null;
  try{const{data,error}=await Promise.race([NET.sb.from('crossing_landmarks').select('player_id,captain,ship,ghost').eq('landmark',key).order('created_at',{ascending:false}).limit(1),slow(4000)]);
    return error||!data||!data[0]?null:data[0]}catch(e){return null}}
async function lmPost(key,ghost){await NET.ready;if(!NET.sb||!NET.uid)return false;
  try{const{error}=await NET.sb.from('crossing_landmarks').insert({player_id:NET.uid,landmark:key,captain:ghost.captain,ship:ghost.ship,sea:G.sea+1,ghost,version:VERSION});return!error}catch(e){return false}}
initOnline();
