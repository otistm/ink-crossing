/* Ink Crossing: Ships, traits (ship and enemy abilities), enemies, seas, landmarks (charts), the cartographer's story and events. */
"use strict";
/* ---------- ships ---------- */
const SHIPS={
  sloop:{n:'The Wren',type:'Sloop',theme:'Speed, haste and crits.',hp:110,trait:'swift',start:[{k:'jib',t:0},{k:'rapier',t:0},{k:'swordcane',t:0}],crew:['atarms','bosun'],berths:3},
  galleon:{n:'The Bulwark',type:'Galleon',theme:'Shields, health and heavy hits.',hp:110,trait:'bulwark',start:[{k:'shieldbash',t:0},{k:'bulkhead',t:0}],crew:['atarms','quartermaster'],berths:4,lock:'Beat a sea boss to unlock.',ok:a=>a.bosses>0},
  privateer:{n:'The Ember',type:'Privateer',theme:'Cannons, powder and burn.',hp:100,trait:'kindle',start:[{k:'swivel',t:0},{k:'flare',t:0}],crew:['gunner','atarms'],berths:3,lock:'Beat 3 elites to unlock.',ok:a=>a.elites>=3},
  junk:{n:'The Lotus',type:'Junk',theme:'Healing, poison and calm.',hp:105,trait:'lotus',start:[{k:'fugu',t:0},{k:'teapot',t:0}],crew:['surgeon','atarms'],berths:3,lock:'Finish a voyage to unlock.',ok:a=>a.wins>0}
};

/* ---------- traits: enemy abilities and ship abilities ---------- */
const TRAITS={
  frenzy:{n:'Frenzy',d:()=>'Below half health, its cargo charges 50% faster.'},
  smoke:{n:'Smoke Screen',d:()=>'Your cargo starts the fight slowed for 3s.'},
  peck:{n:'Peck',every:2,x:s=>2+s*2,d:s=>`Every 2s, pecks you for ${2+s*2}.`},
  rush:{n:'Head Start',d:()=>'Its cargo starts the fight hasted for 4s.'},
  volley:{n:'Broadside',every:5,x:s=>5+s*5,d:s=>`Every 5s, fires a broadside for ${5+s*5}.`},
  coil:{n:'Venom',d:()=>'Its weapons also poison you for 1.'},
  haunt:{n:'Undying Crew',every:1,d:()=>'Heals 1% of its health every second.'},
  armor:{n:'Ironclad',every:4,x:s=>6+s*6,d:s=>`Every 4s, gains ${6+s*6} shield.`},
  song:{n:'Siren Song',every:6,d:()=>'Every 6s, slows 2 of your items for 2s.'},
  fire:{n:'Firebrand',x:s=>3+s*3,d:s=>`You start the fight burning for ${3+s*3}.`},
  whirl:{n:'Whirlpool',d:()=>'The storm arrives 8s early.'},
  undying:{n:'Drowned',d:()=>'The first time it sinks, it rises again with 30% health.'},
  flock:{n:'Flock',every:3,d:()=>'Every 3s, hastes one of its items for 2s.'},
  pierce:{n:'Harpoon Guns',d:()=>'Its damage ignores your shield.'},
  thick:{n:'Thick Hide',d:()=>'Takes 25% less damage from weapons.'},
  captain:{n:"Captain's Orders",every:5,d:()=>'Every 5s, hastes 2 of its items for 2s.'},
  constrict:{n:'Constrict',every:8,d:()=>'Every 8s, slows 3 of your items for 2s.'},
  tentacles:{n:'Tentacles',every:6,x:s=>8+s*5,d:s=>`Every 6s, slams for ${8+s*5} and slows 2 of your items.`},
  swift:{n:'Light Hull',d:()=>'Your cargo charges 15% faster.'},
  bulwark:{n:'Heavy Hull',d:()=>'+40 health, and you start fights with 15 shield.'},
  kindle:{n:'Powder Hands',d:()=>'Every burn you apply is 1 higher.'},
  lotus:{n:'Calm Crew',d:()=>'Your heals also give a third as much shield.'}
};

/* ---------- enemies: three seas, each with threats, an elite and a boss ---------- */
const ENEMIES={
  sharks:{n:'Reef Sharks',sea:0,kind:'t',sig:['dagger','pins'],traits:['frenzy']},
  sloop:{n:'Smuggler Sloop',sea:0,kind:'t',sig:['flare','fenders'],traits:['smoke']},
  gulls:{n:'Gull Swarm',sea:0,kind:'t',sig:['pins'],traits:['peck']},
  runners:{n:'Rum Runners',sea:0,kind:'t',sig:['sail','cutlass'],traits:['rush']},
  brig:{n:'Pirate Brig',sea:0,kind:'e',sig:['cannon','cutlass'],traits:['volley']},
  serpent:{n:'Sea Serpent',sea:0,kind:'b',sig:['puffer','puffer','anchor'],traits:['coil','constrict']},
  ghost:{n:'Ghost Ship',sea:1,kind:'t',sig:['chain','tar'],traits:['haunt']},
  sirens:{n:'Siren Rocks',sea:1,kind:'t',sig:['net','hook'],traits:['song']},
  junkf:{n:'Fire Junk',sea:1,kind:'t',sig:['firepot','flare'],traits:['fire']},
  cutter:{n:'Navy Cutter',sea:1,kind:'t',sig:['swivel','fenders'],traits:['armor']},
  frigate:{n:'Navy Frigate',sea:1,kind:'e',sig:['cannon','plating','guncrew'],traits:['armor','volley']},
  queen:{n:'Pirate Queen',sea:1,kind:'b',sig:['cutlass','harpoon','keg','crows'],traits:['captain','volley']},
  crab:{n:'Maelstrom Crab',sea:2,kind:'t',sig:['anchor','plating'],traits:['whirl']},
  drowned:{n:'Drowned Crew',sea:2,kind:'t',sig:['cutlass','puffer'],traits:['undying']},
  petrels:{n:'Storm Petrels',sea:2,kind:'t',sig:['pins','sail','swivel'],traits:['flock']},
  whaler:{n:'Iron Whaler',sea:2,kind:'t',sig:['harpoon','dagger'],traits:['pierce']},
  leviathan:{n:'Leviathan',sea:2,kind:'e',sig:['anchor','pump'],traits:['thick','frenzy']},
  kraken:{n:'Kraken',sea:2,kind:'b',sig:['anchor','net','puffer'],traits:['tentacles','thick']}
};
const SEAS=['The Shallows','The Fog Sea','The Deep'];
const PORTNAMES=['Saltmere','Cinder Key','Brinehold',"Wrecker's Rest",'Coral Steps','Fogwatch','Widow Reef','Last Light','Stormgate','Kettle Bay','Tallow Point','Myrtle Sound','Bellbuoy','Oyster Row','Greyport','Pike Harbour','Lamplight Quay','Rook Island','Mercy Cove','Driftwood','Hollow Key','Wick Harbour','Gannet Rock','Tidewater'];

/* ---------- charts: landmarks drawn on your map that last the whole voyage ---------- */
const CHARTS={
  trade:{n:'Trade Winds',d:'Earn +3 gold for every fight you win.',g:'<path d="M4 12c5-4 10 4 16 0M4 19c5-4 10 4 16 0M8 26c4-3 8 3 12 0"/>'},
  harbour:{n:'Safe Harbour',d:'Repair 5 hull now.',g:'<circle class="w" cx="15" cy="5" r="2.5"/><path d="M15 8v18M9 12h12M5 20c1 5 5 7 10 7s9-2 10-7"/>'},
  light:{n:'Lighthouse',d:'Start every fight with 20 shield.',g:'<path class="w" d="M10 28l2-18h6l2 18z"/><path d="M9 10h12M11 18h8M15 3v4M5 6l4 2M25 6l-4 2"/>'},
  current:{n:'Fast Current',d:'Your cargo starts every fight a quarter charged.',g:'<path d="M4 10h18l-5-5M26 20H8l5 5"/>'},
  wreck:{n:'Old Wreck',d:'Salvage a free item a tier above normal now.',g:'<path class="w" d="M3 21h24l-5 6H8z"/><path d="M13 21l5-16M18 5l5 4"/>'},
  coral:{n:'Coral Garden',d:'+25 health in every fight.',g:'<path d="M15 28V13M15 18l-6-6V6M15 15l6-6V4M9 11l-4-2M21 9l4-1"/>'},
  calm:{n:'Calm Waters',d:'The storm reaches you 6 seconds later.',g:'<path d="M4 9h22M4 15h22M4 21h22"/>'},
  route:{n:'Merchant Route',d:'Your first reroll at every port is free.',g:'<circle class="w" cx="15" cy="15" r="10"/><circle cx="15" cy="15" r="6" stroke-width="1.2"/><path d="M15 11v8"/>'},
  cove:{n:"Smugglers' Cove",d:'Sell cargo for its full price.',g:'<path class="w" d="M3 27c0-14 6-21 12-21s12 7 12 21z"/><path class="k" d="M10 27c0-6 2-10 5-10s5 4 5 10z"/>'},
  whale:{n:'Whale Road',d:'Your cargo charges 10% faster.',g:'<path class="w" d="M15 27c0-8-2-13-10-17 5 0 8 2 10 5 2-3 5-5 10-5-8 4-10 9-10 17z"/>'},
  pearl:{n:'Pearl Bank',d:'Gain 10 gold now.',g:'<path class="w" d="M4 16c0-8 22-8 22 0-3 8-19 8-22 0z"/><circle class="w" cx="15" cy="15" r="3.5"/>'},
  buoy:{n:'Bell Buoy',d:'See one row further through the fog.',g:'<path class="w" d="M9 26l3-14h6l3 14z"/><path d="M15 12V6M11 6h8M5 27h20"/><circle class="k" cx="15" cy="20" r="2"/>'},
  sound:{n:'Sounding Line',d:"Scout enemies: see their cargo before you sail.",g:'<path d="M15 3v18"/><path class="w" d="M11 21h8l-4 7z"/><path d="M8 8h14M9 13h12" stroke-width="1.2"/>'}
};
const glyph=(k,cls)=>`<svg viewBox="0 0 30 30" class="${cls||'gl'}" aria-hidden="true">${CHARTS[k].g}</svg>`;

/* ---------- fittings: rare parts of the ship that each change one rule of the game, with no trade-off. One per spot. Only the
   shipwrights at a sea's later ports build them, and only for a captain with WRIGHTWINS wins (wrightBuilds() in port.js).
   Effects are read by name where they apply: fOn(key) in battle.js, hasF(key) elsewhere. d is the text. ---------- */
const SPOTS={hull:'Hull',sails:'Sails',guns:'Guns',head:'Figurehead'};
const FITTINGS={
  secondwind:{n:'Second Wind',spot:'hull',p:24,d:'The first time you would sink in a fight, you stay afloat with half your health.',g:'<path class="w" d="M15 26C7 20 4 16 4 11.5a5.3 5.3 0 0 1 11-2 5.3 5.3 0 0 1 11 2C26 16 23 20 15 26z"/><path d="M15 10v9M10.5 14.5h9"/>'},
  smuggle:{n:"Smuggler's Hold",spot:'hull',p:20,d:'Bandits who board you can only ever take one piece of cargo.',g:'<path class="w" d="M4 10h22v15H4z"/><path class="w" d="M4 10l4-5h14l4 5"/><path d="M11 15h8v6h-8z"/>'},
  stormproof:{n:'Storm Canvas',spot:'sails',p:22,d:'The storm never hurts you. It still hits the enemy.',g:'<path d="M8 3v24"/><path class="w" d="M9 5h14l-3 16H9z"/><path d="M17 8l-4 5h4l-3 5" stroke-width="1.4"/>'},
  crowseye:{n:"Crow's Eye Topmast",spot:'sails',p:20,d:'No fog hides the chart from you. See every stop in the sea.',g:'<path d="M15 12v16"/><path class="w" d="M4 9c5-6.5 17-6.5 22 0-5 6.5-17 6.5-22 0z"/><circle class="k" cx="15" cy="9" r="2.6"/>'},
  boarding:{n:'Boarding Planks',spot:'guns',p:24,d:"For the first 5s of every fight, the enemy's leftmost item fights for you.",g:'<path class="w" d="M2 19l26-7v4.5L2 23.5z"/><path d="M7 18v4.5M13 16.5v4.5M19 15v4.5M24.5 13.5v4.5"/>'},
  monkeys:{n:'Powder Monkeys',spot:'guns',p:20,d:'Nothing can slow your cargo.',g:'<path class="w" d="M8 5h14c2 7 2 13 0 20H8c-2-7-2-13 0-20z"/><path d="M6 11h18M6 19h18" stroke-width="1.4"/>'},
  idol:{n:'Sea Idol',spot:'head',p:22,d:"Burn and poison can't touch you.",g:'<path class="w" d="M10 26V12a5 5 0 0 1 10 0v14z"/><circle class="k" cx="13" cy="13" r="1.2"/><circle class="k" cx="17" cy="13" r="1.2"/><path d="M12.5 19h5M7 26h16"/>'},
  siren:{n:'Siren',spot:'head',p:24,d:"Her song turns the enemy around: their hold is reversed at the start of every fight, scrambling what sits next to what.",g:'<path class="w" d="M15 3c4 0 5 5 3 9l-2 6c3 1 7 3 8 8-4-1-6-1-9-3-3 2-5 2-9 3 1-5 5-7 8-8l-2-6c-2-4-1-9 3-9z"/>'}
};
/* fittings from before 0.41, refunded in full when an old save loads (migrateVoyage) */
const OLDFITP={planks:10,copper:10,ram:10,ballast:10,lateen:10,stormsail:9,topsail:11,studding:9,magazine:11,chase:10,swivel:10,grapeshot:10,gull:12,mermaid:12,kraken:12,lion:12};
const WRIGHTWINS=3;
/* ---------- crew: hired at a port tavern, one of each role. Each role masters item classes (crafts: the CLSN codes in items.js).
   A crew item only works if a hand aboard masters its class; ship items work on their own. Each role also has a passive
   perk (CREWPERK). Hands gain a level from wins (RANKXP), and every level lets you raise one item of their classes a tier.
   Wages are paid at every new port. ---------- */
const CREW={
  atarms:{n:'Master-at-Arms',crafts:['cw','cs'],perk:'board',fee:7,wage:2,look:{body:'Blazer Black Tee',head:'Pomp',face:'Suspicious',beard:'Moustache 4'},say:"Blades, pistols, bucklers. I'll drill your hands until they hold them right way round."},
  gunner:{n:'Master Gunner',crafts:['sw'],perk:'powder',fee:7,wage:2,look:{body:'Tee 2',head:'Shaved 1',face:'Rage',beard:'Moustache 3',acc:'Eyepatch'},say:'Twenty years behind a cannon. I still hit what I aim at. Mostly.'},
  bosun:{n:'Boatswain',crafts:['sx'],perk:'batten',fee:6,wage:1,look:{body:'Sweater',head:'Shaved 3',face:'Serious',beard:'Full'},say:"Ropes, sails and a lazy crew, I keep all three moving. She'll fly faster with me aboard."},
  quartermaster:{n:'Quartermaster',crafts:['ss','sh'],perk:'smuggle',fee:6,wage:1,look:{body:'Button Shirt 2',head:'Short 3',face:'Serious',beard:'Moustache 7',acc:'Glasses 4'},say:'Every plank counted, every pump primed. And I know a man in every market.'},
  surgeon:{n:"Ship's Surgeon",crafts:['ch'],perk:'triage',fee:8,wage:2,look:{body:'Shirt and Coat',head:'No Hair 1',face:'Old',beard:'Full 2'},say:"Bandages, grog and a steady hand. I've kept worse crews breathing."},
  witch:{n:'Sea Witch',crafts:['cx'],perk:'tidings',fee:8,wage:2,look:{body:'Polka Dot Jacket',head:'Long',face:'Contempt'},say:"Charms, tonics and a wind that owes me favours. The sea listens when I speak."}
};
/* each role's passive perk, read by name with crewHas() */
const CREWPERK={
  board:{n:'Boarding Party',d:'The weapon in the leftmost slot of your hold deals +2 damage.'},
  powder:{n:'Powder Rations',d:'Your ship weapons get +5% crit chance.'},
  batten:{n:'Batten Down',d:'Start every fight with 15 shield.'},
  smuggle:{n:"Smuggler's Charm",d:'Your first reroll at a stall each day costs 1 gold less.'},
  triage:{n:'Triage',d:'+20 max health for the rest of the voyage, the first time a surgeon signs on.'},
  tidings:{n:'Dark Tidings',d:'The first item you use each fight fires twice.'}
};
/* who masters a class */
const masterOf=cls=>Object.keys(CREW).find(k=>CREW[k].crafts.includes(cls));
/* old saves' crew, by the role that took over their work */
const OLDCREW={fencer:'atarms',marines:'atarms',parrot:'atarms',cormorant:'atarms',gunner:'gunner',guncrew:'gunner',cannoneers:'gunner',monkey:'gunner',
  bosun:'bosun',deckhand:'bosun',rigger:'bosun',sailmaker:'bosun',stoic:'bosun',quartermaster:'quartermaster',steadfast:'quartermaster',
  herbalist:'surgeon',monk:'surgeon',fireeater:'surgeon',apothecary:'surgeon',witch:'witch',chemist:'witch'};
/* the rules old crew ranks opened. Nothing reads them since crew roles came in; kept so old text and saves stay readable. */
const RANKS={};
const RANKXP=[0,2,5,9,14];   // wins to reach level 1 to 5

/* ---------- renown: the captain's picks. Every ship draws from the same list. Orders fire once a fight on a trigger you choose
   (WHEN in battle.js, default in when). The rest change how you run the ship and are read by name with hasP(). ---------- */
const PERKS={
  brace:{n:'Brace!',order:1,when:'half',d:'Block all damage for 2s.'},
  allhands:{n:'All hands!',order:1,when:'start',d:'Haste all your cargo for 2s.'},
  fire:{n:'Fire at will!',order:1,when:'ehalf',d:'Charge every weapon and cannon you carry halfway.'},
  douse:{n:'Douse the fires!',order:1,when:'half',d:'Remove all your burn and poison.'},
  rigging:{n:'Cut their rigging!',order:1,when:'start',d:'Slow all enemy cargo for 3s.'},
  patch:{n:'Patch the hull!',order:1,when:'half',d:'Heal 15% of your health.'},
  berth:{n:'Extra Berth',d:'+1 crew berth.'},
  recruiter:{n:'Recruiter',d:'Hires cost 3 less, and taverns have 4 people for hire.'},
  drill:{n:'Drillmaster',d:'Your crew rank up 1 win sooner.'},
  paymaster:{n:'Paymaster',d:'Each crew member\'s wage is 1 less.'},
  loyal:{n:'Loyal Crew',d:'Unpaid crew grumble but never quit.'},
  wright:{n:'Shipwright\'s Friend',d:'Repairs cost 1 gold a point, and shipwrights who build fittings put 2 on the bench.'},
  haggler:{n:'Haggler',d:'Market cargo costs 1 less.'},
  prize:{n:'Prize Court',d:'Spoils offer 4 pieces of cargo instead of 3.'}
};
const STAR='<svg viewBox="0 0 30 30" class="gl" aria-hidden="true"><path class="w" d="M15 3l3.6 7.4 8.1 1.1-5.9 5.7 1.4 8L15 21.4l-7.2 3.8 1.4-8-5.9-5.7 8.1-1.1z"/></svg>';
const fitGlyph=(k,cls)=>`<svg viewBox="0 0 30 30" class="${cls||'gl'}" aria-hidden="true">${FITTINGS[k].g}</svg>`;

/* ---------- the cartographer's story ---------- */
const LORE={
  start:"The Guild pays well for a map to the Far Shore. Three cartographers sailed before me. None came back. The Guild gave me a bare ship, a blank chart and 30 gold to outfit her. The tavern is full of hands looking for a berth, and the market smells of tar and powder.",
  1:"The serpent sank back into the Shallows. Past here the charts I carry go blank and the fog begins. The second cartographer's last page ends somewhere in this fog.",
  2:"The Queen had the third cartographer's compass. It doesn't point north. It points into the Deep, at something huge.",
  end:"No one has drawn this coast before. Now someone has. I'm sailing home with the only map there is.",
  sink:"The chart goes down with the ship. Someone else will have to try."
};

/* ---------- events ---------- */
const D=()=>depthOf(node(G.at));
const EVENTS={
  bottle:{t:'Message in a bottle',x:'A bottle bobs past. There is a scrap of chart inside.',o:[
    {l:'Read the chart',d:'Clear the fog from this whole sea.',f:()=>{G.full=true;updateReveal();return'Found a scrap of chart in a bottle. The whole sea is clear now.'}},
    {l:'Sell the bottle',d:'+6 gold.',f:()=>{G.gold+=6;return'Sold a message in a bottle for 6 gold.'}}]},
  wreck:{t:'Drifting wreck',x:'A hull floats keel-up. Something knocks inside.',o:[
    {l:'Search it',d:'Maybe cargo. Maybe trouble.',f:r=>{if(r()<.6)return addOrGold(randItem(r,D()+3),'Salvaged');G.hull-=3;return'Searched a wreck and it rolled on us. Lost 3 hull.'}},
    {l:'Leave it',d:'Nothing happens.',f:()=>'Left a drifting wreck alone.'}]},
  trader:{t:'Passing trader',x:'A merchant ship signals to trade.',o:[
    {l:'Upgrade your first item',d:'10 gold. Raises the leftmost item in your hold one tier.',need:()=>G.gold>=10&&G.board.length&&G.board[0].t<3,f:()=>{G.gold-=10;G.board[0].t++;return`Paid a trader to upgrade the ${DEFS[G.board[0].k].n}.`}},
    {l:'Buy a mystery crate',d:'7 gold for a random item.',need:()=>G.gold>=7,f:r=>{G.gold-=7;return addOrGold(randItem(r,D()+2),'Opened a mystery crate and found')}},
    {l:'Wave them off',d:'Nothing happens.',f:()=>'Waved off a passing trader.'}]},
  shrine:{t:'Sea shrine',x:'A stone idol stands on a rock with coins at its feet.',o:[
    {l:'Leave an offering',d:'6 gold. Repair 4 hull.',need:()=>G.gold>=6,f:()=>{G.gold-=6;G.hull+=4;return'Left an offering at a sea shrine. Repaired 4 hull.'}},
    {l:'Take the coins',d:'+12 gold, lose 2 hull.',f:()=>{G.gold+=12;G.hull-=2;return'Took the shrine coins. A wave hit us after. Lost 2 hull.'}}]},
  castaway:{t:'Castaway',x:'A sailor waves from a sandbar.',o:[
    {l:'Take them aboard',d:'They bring supplies.',f:r=>addOrGold({k:pick(r,['pork','lime','tar','pump']),t:rollTier(D()+3,r)},'A castaway joined us with')},
    {l:'Ask for directions',d:'See two rows further through the fog.',f:()=>{G.extra+=2;updateReveal();return'A castaway pointed out the way ahead.'}}]},
  whirl:{t:'Whirlpool',x:'The water turns in a slow circle.',o:[
    {l:'Ride the edge',d:'+15 gold, lose 3 hull.',f:()=>{G.gold+=15;G.hull-=3;return"Rode a whirlpool's edge. Found 15 gold in the churn, lost 3 hull."}},
    {l:'Go around',d:'Nothing happens.',f:()=>'Sailed around a whirlpool.'}]},
  cache:{t:"Cartographer's cache",x:"A tin box under a cairn, stamped with the first cartographer's mark: a circle with a line through it.",o:[
    {l:'Take her notes',d:'Draw a landmark on your chart.',f:()=>({chart:1,msg:"Found the first cartographer's notes."})},
    {l:'Take her coins',d:'+12 gold.',f:()=>{G.gold+=12;return"Took the first cartographer's coins."}}]},
  storm:{t:'Storm front',x:'Black clouds, and no way around them.',o:[
    {l:'Ride it out',d:'Lose 3 hull.',f:()=>{G.hull-=3;return'Rode out a storm front. Lost 3 hull.'}},
    {l:'Jettison cargo',d:'Lose your cheapest item.',need:()=>G.board.length>0,f:()=>{let j=0;G.board.forEach((b,i)=>{if(price(b.k,b.t)<price(G.board[j].k,G.board[j].t))j=i});const[b]=G.board.splice(j,1);return`Threw the ${DEFS[b.k].n} overboard in a storm.`}}]},
  mermaid:{t:"Mermaid's bargain",x:'She offers to bless your cargo, for a piece of your hull.',o:[
    {l:'Give 4 hull',d:'Upgrade two random items.',need:()=>G.board.some(b=>b.t<3),f:r=>{G.hull-=4;const n=[];for(let k=0;k<2;k++){const c=G.board.filter(b=>b.t<3);if(!c.length)break;const b=pick(r,c);b.t++;n.push(DEFS[b.k].n)}return`Gave a mermaid 4 hull. She blessed the ${n.join(' and the ')}.`}},
    {l:'Refuse',d:'Nothing happens.',f:()=>"Refused a mermaid's bargain."}]},
  fishing:{t:'Fishing grounds',x:'The water boils with fish.',o:[
    {l:'Patch the hull',d:'Repair 3 hull.',f:()=>{G.hull+=3;return'Stopped at fishing grounds and patched the hull.'}},
    {l:'Cast a line',d:'Two casts, right here.',f:()=>({fish:2,msg:'Stopped to fish the boiling water.'})},
    {l:'Net a Pufferfish',d:'Add a Pufferfish to your hold.',f:r=>addOrGold({k:'puffer',t:rollTier(D()+2,r)},'Netted')}]},
  fog:{t:'Fog bank',x:"You can't see the bow.",o:[
    {l:'Sail blind',d:'Could go either way.',f:r=>{if(r()<.5){G.gold+=10;return'Sailed blind through fog and slipped past a toll ship. +10 gold.'}G.hull-=2;return'Sailed blind through fog and scraped a reef. Lost 2 hull.'}},
    {l:'Wait it out',d:'Nothing happens.',f:()=>'Waited out a fog bank.'}]},
  gunsmith:{t:"Gunsmith's island",x:'A forge smokes on the beach.',o:[
    {l:'Buy a Swivel Gun',d:'5 gold.',need:()=>G.gold>=5,f:r=>{G.gold-=5;return addOrGold({k:'swivel',t:rollTier(D(),r)},'Bought')}},
    {l:'Upgrade a cannon',d:'8 gold. Upgrades a random cannon.',need:()=>G.gold>=8&&G.board.some(b=>DEFS[b.k].tags.includes('C')&&b.t<3),f:r=>{G.gold-=8;const b=pick(r,G.board.filter(b=>DEFS[b.k].tags.includes('C')&&b.t<3));b.t++;return`The gunsmith upgraded the ${DEFS[b.k].n}.`}},
    {l:'Move on',d:'Nothing happens.',f:()=>"Passed a gunsmith's island."}]},
  // ways to lose money on the longer road: every choice costs something
  toll:{t:'Navy toll ship',x:'A navy cutter runs alongside, guns run out. "Toll for these waters, captain."',o:[
    {l:'Pay the toll',d:()=>`Lose ${tollOf()} gold, or all you have.`,f:()=>{const t=Math.min(G.gold,tollOf());G.gold-=t;return`Paid a navy toll of ${t} gold.`}},
    {l:'Run for it',d:'Half the time you get away. Otherwise lose 4 hull and the toll.',f:r=>{if(r()<.5)return'Outran a navy toll ship.';const t=Math.min(G.gold,tollOf());G.gold-=t;G.hull-=4;return`The navy caught us. Lost 4 hull and ${t} gold.`}}]},
  pickpocket:{t:'Light fingers',x:"The new deckhand nobody remembers hiring is gone, and so is part of your purse.",o:[
    {l:'Chase him down',d:'Keep your gold, lose 3 hull in the scuffle.',f:()=>{G.hull-=3;return'Chased down a pickpocket. Lost 3 hull in the scuffle.'}},
    {l:'Let him go',d:'Lose a third of your gold.',f:()=>{const t=Math.ceil(G.gold/3);G.gold-=t;return`A pickpocket made off with ${t} gold.`}}]},
  rogue:{t:'Rogue wave',x:'A wall of grey water rises off the bow.',o:[
    {l:'Hold course',d:'A random piece of cargo washes overboard.',need:()=>G.board.length>0,f:r=>{const[b]=G.board.splice(ri(r,G.board.length),1);return`A rogue wave took the ${DEFS[b.k].n} overboard.`}},
    {l:'Turn into it',d:'Lose 5 hull.',f:()=>{G.hull-=5;return'Turned into a rogue wave. Lost 5 hull.'}}]},
  swindler:{t:'Smooth-talking trader',x:'"Lovely piece, that. I\'ll swap you for something even finer." It is not finer.',o:[
    {l:'Take his swap',d:'Your most valuable item becomes a cheaper one of the same size.',need:()=>G.board.length>0,f:r=>{let j=0;G.board.forEach((b,i)=>{if(price(b.k,b.t)>price(G.board[j].k,G.board[j].t))j=i});
      const old=G.board[j],s=DEFS[old.k].s;let it=null;for(let n=0;n<40&&!it;n++){const c=randItem(r,Math.max(0,D()-4));if(DEFS[c.k].s===s&&c.k!==old.k)it=c}
      G.board[j]=it?{k:it.k,t:Math.max(0,Math.min(old.t-1,it.t))}:{k:old.k,t:Math.max(0,old.t-1)};seen(G.board[j].k);return`Swapped the ${DEFS[old.k].n} for a ${TIER[G.board[j].t]} ${DEFS[G.board[j].k].n}. Swindled.`}},
    {l:'Pay him to leave',d:'Lose 10 gold.',need:()=>G.gold>=10,f:()=>{G.gold-=10;return'Paid a swindler 10 gold to go away.'}},
    {l:'Show him the door',d:'Nothing to swap and nothing to pay.',need:()=>!G.board.length&&G.gold<10,f:()=>'Sent a swindler packing with nothing.'}]},
  // the bandits play out on their own screen (bandits.js); one stretch of unknown water per sea hides them
  bandits:{t:'Bandits!',x:'',o:[]}
};
const tollOf=()=>8+G.sea*6;
