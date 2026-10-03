/* Ink Crossing: Ships, traits (ship and enemy abilities), enemies, seas, landmarks (charts), the cartographer's story and events. */
"use strict";
/* ---------- ships ---------- */
const SHIPS={
  sloop:{n:'The Wren',type:'Sloop',theme:'Speed, haste and crits.',hp:110,trait:'swift',start:[{k:'jib',t:0},{k:'rapier',t:0},{k:'swordcane',t:0}],crew:['fencer','bosun'],berths:3},
  galleon:{n:'The Bulwark',type:'Galleon',theme:'Shields, health and heavy hits.',hp:110,trait:'bulwark',start:[{k:'shieldbash',t:0},{k:'bulkhead',t:0}],crew:['marines','quartermaster'],berths:4,lock:'Beat a sea boss to unlock.',ok:a=>a.bosses>0},
  privateer:{n:'The Ember',type:'Privateer',theme:'Cannons, powder and burn.',hp:100,trait:'kindle',start:[{k:'swivel',t:0},{k:'flare',t:0}],crew:['guncrew','monkey'],berths:3,lock:'Beat 3 elites to unlock.',ok:a=>a.elites>=3},
  junk:{n:'The Lotus',type:'Junk',theme:'Healing, poison and calm.',hp:105,trait:'lotus',start:[{k:'fugu',t:0},{k:'teapot',t:0}],crew:['apothecary','cormorant'],berths:3,lock:'Finish a voyage to unlock.',ok:a=>a.wins>0}
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

/* ---------- fittings: parts of the ship itself, each a station a crew member mans. One per spot, bought from the shipwright or won
   from elites. A fitting works only while a hand is posted at it (c.post in G.crew); its downside (dn) goes when that hand has the
   fitting's craft. shape (a hold slot, a berth) holds whoever is aboard; always:1 means the downside does too, unless the right
   hand is posted. hp changes your health in fights (gains need a hand, losses are the downside). Effects are read by name where
   they apply, through fitOn(k) and fitDown(k) (battle.js, port.js, state.js, chart.js). d is the full text, built below. ---------- */
const SPOTS={hull:'Hull',sails:'Sails',guns:'Guns',head:'Figurehead'};
const FITTINGS={
  planks:{n:'Double Planking',spot:'hull',p:10,hp:60,craft:'carp',shape:'Boards up one hold slot, leaving 8.',up:'+60 health in fights.',dn:'Your cargo charges 5% slower.',g:'<path class="w" d="M3 7h24v7H3zM3 16h24v7H3z"/><circle class="k" cx="7" cy="10.5" r="1.1"/><circle class="k" cx="23" cy="10.5" r="1.1"/><circle class="k" cx="7" cy="19.5" r="1.1"/><circle class="k" cx="23" cy="19.5" r="1.1"/>'},
  copper:{n:'Copper Sheathing',spot:'hull',p:10,hp:-20,craft:'carp',up:'Burn and poison put on you are halved.',dn:'−20 health in fights.',g:'<path class="w" d="M3 9h24c-2 10-7 15-12 17C10 24 5 19 3 9z"/><path d="M7 14h16M10 19h10" stroke-width="1.4"/>'},
  ram:{n:'Iron Ram',spot:'hull',p:10,craft:'steel',up:'Every fight opens with a ram: 10 damage, +5 per sea.',dn:'You take 3.',g:'<path class="w" d="M3 11h15l9 4-9 4H3z"/><path d="M18 11v8M8 11v8" stroke-width="1.4"/>'},
  ballast:{n:'Crew Quarters',spot:'hull',p:10,hp:-15,berth:1,craft:'med',shape:'+1 crew berth.',dn:'−15 health in fights.',always:1,g:'<path d="M3 8v6M27 8v6"/><path class="w" d="M3 10c5 8 19 8 24 0z"/><circle class="w" cx="15" cy="8" r="3"/>'},
  lateen:{n:'Lateen Rig',spot:'sails',p:10,craft:'sea',up:'Your leftmost item starts every fight charged.',dn:'Your rightmost starts slowed for 3s.',g:'<path d="M15 3v24"/><path class="w" d="M5 23L25 4l-2 19z"/>'},
  stormsail:{n:'Storm Canvas',spot:'sails',p:9,craft:'sea',up:'The storm hurts you half as much.',dn:'It arrives 5s sooner.',g:'<path d="M8 3v24"/><path class="w" d="M9 5h14l-3 16H9z"/><path d="M17 8l-4 5h4l-3 5" stroke-width="1.4"/>'},
  topsail:{n:'Topgallants',spot:'sails',p:11,craft:'sea',up:'Your rightmost item charges twice as fast.',dn:'Your leftmost charges half as fast.',g:'<path d="M15 2v26"/><path class="w" d="M9 5h12v6H9zM6 13h18v9H6z"/>'},
  studding:{n:'Studding Sails',spot:'sails',p:9,craft:'sea',up:'See 1 more row through the fog.',dn:'Your cargo starts every fight slowed for 1s.',g:'<path d="M15 3v24"/><path class="w" d="M10 6h10v15H10zM3 8h7v11H3zM20 8h7v11h-7z"/>'},
  magazine:{n:'Powder Magazine',spot:'guns',p:11,craft:'fire',up:'The first cannon you fire each fight fires twice.',dn:'Burn put on you is 1 higher.',g:'<path class="w" d="M8 5h14c2 7 2 13 0 20H8c-2-7-2-13 0-20z"/><path d="M6 11h18M6 19h18" stroke-width="1.4"/>'},
  chase:{n:'Chase Guns',spot:'guns',p:10,craft:'gun',up:'Your cannons start every fight half charged.',dn:'Your weapons start slowed for 2s.',g:'<path class="w" d="M3 12h16l7-2v9l-7-2H3z"/><circle class="w" cx="9" cy="22" r="4"/>'},
  swivel:{n:'Swivel Mounts',spot:'guns',p:10,craft:'gun',up:'Weapons in your leftmost and rightmost slots ignore shield.',dn:'Your cannons charge 10% slower.',g:'<path d="M15 15v12M10 27h10"/><path class="w" d="M4 9h15l6-2v8l-6-2H4z"/>'},
  grapeshot:{n:'Grapeshot',spot:'guns',p:10,craft:'fire',up:'Your cannons also burn for 1.',dn:'They deal 2 less damage.',g:'<circle class="k" cx="10" cy="10" r="3.2"/><circle class="k" cx="20" cy="10" r="3.2"/><circle class="k" cx="15" cy="17" r="3.2"/><circle class="k" cx="8" cy="22" r="2.6"/><circle class="k" cx="22" cy="22" r="2.6"/>'},
  gull:{n:'Gull',spot:'head',p:12,hp:-10,craft:'steel',up:'Your first crit each fight hastes all your cargo for 2s.',dn:'−10 health in fights.',g:'<path d="M3 13c4-5 8-5 12 2 4-7 8-7 12-2"/><path class="w" d="M12 15c1 4 5 4 6 0"/>'},
  mermaid:{n:'Mermaid',spot:'head',p:12,craft:'med',up:'Below half health, heal 2% of your health every second.',dn:'Your healing items heal 2 less.',g:'<path class="w" d="M15 3c4 0 5 5 3 9l-2 6c3 1 7 3 8 8-4-1-6-1-9-3-3 2-5 2-9 3 1-5 5-7 8-8l-2-6c-2-4-1-9 3-9z"/>'},
  kraken:{n:'Kraken',spot:'head',p:12,craft:'alch',up:'Enemy cargo starts every fight slowed for 3s.',dn:'Enemies have 10% more health.',g:'<path d="M5 27c0-9 7-11 11-15s3-9-2-9-4 6 1 6" stroke-width="2.4"/><path d="M13 27c2-6 9-7 12-10M20 27c1-3 4-4 6-5"/>'},
  lion:{n:'Golden Lion',spot:'head',p:12,craft:'alch',up:'+4 gold for every fight you win.',dn:'Rerolls cost 1 more.',g:'<circle class="w" cx="15" cy="15" r="11"/><circle class="w" cx="15" cy="16" r="6"/><circle class="k" cx="13" cy="15" r="1"/><circle class="k" cx="17" cy="15" r="1"/><path d="M14 19h2" stroke-width="1.4"/>'}
};
/* ---------- crew: hired at a port tavern, they live on deck and let your cargo use their crafts.
   Rank grows with fights won and opens new rules in their crafts (RANKS). Wages are paid at every new port. ---------- */
const CREW={
  bosun:{n:'Bosun',crafts:['sea'],fee:6,wage:1,look:{body:'Sweater',head:'Shaved 3',face:'Serious',beard:'Full'},say:"Ropes, sails and a lazy crew, I keep all three moving. Give me your rigging and I'll trim any sail you fit."},
  deckhand:{n:'Deckhand',crafts:['sea'],fee:5,wage:1,look:{body:'Striped Tee',head:'Short 5',face:'Smile Big'},say:"I'll haul, I'll heave, and I'll mind whatever sail you rig. Cheap, too."},
  rigger:{n:'Rigger',crafts:['sea'],fee:5,wage:1,look:{body:'Gym Shirt',head:'Mohawk',face:'Cheeky',beard:'Chin'},say:"Put me up the mast. Topgallants, a lateen, studding sails: I fly the lot without a hitch."},
  sailmaker:{n:'Sailmaker',crafts:['carp','sea'],fee:9,wage:2,look:{body:'Button Shirt 1',head:'No Hair 3',face:'Calm',beard:'Moustache 2',acc:'Glasses 2'},say:"I patch canvas and plank alike. Put me on your sails or your hull and neither gives you trouble."},
  fencer:{n:'Fencing Master',crafts:['steel'],fee:7,wage:2,look:{body:'Blazer Black Tee',head:'Pomp',face:'Suspicious',beard:'Moustache 4'},say:"Steel is a conversation, captain. Fit a ram and I'll do the talking up front."},
  parrot:{n:'Parrot',crafts:['steel','sea'],fee:9,wage:2,look:{body:'Fur Jacket',head:'hat-hip',face:'Smile LOL',beard:'Full 3',acc:'Eyepatch'},say:"Squawk! Sharp beak, sharp blades! Perch me by the gull, I speak its language!"},
  marines:{n:'Marines',crafts:['steel','carp'],fee:10,wage:2,look:{body:'Tee Arms Crossed',head:'Flat Top',face:'Driven',beard:'Moustache 6'},say:"We fight in pairs and we don't break. Give us the ram or the planking and we'll hold it."},
  steadfast:{n:'Steadfast Hand',crafts:['carp','med'],fee:9,wage:2,look:{body:'Shirt and Coat',head:'No Hair 1',face:'Old',beard:'Full 2'},say:"I've kept worse ships afloat. I'll mind the hull or the crew quarters, whichever's leaking."},
  quartermaster:{n:'Quartermaster',crafts:['carp'],fee:6,wage:1,look:{body:'Button Shirt 2',head:'Short 3',face:'Serious',beard:'Moustache 7',acc:'Glasses 4'},say:"Every board in its place. Plank her twice or sheathe her in copper, I'll keep it sound."},
  stoic:{n:'Stoic Helmsman',crafts:['carp','sea'],fee:9,wage:2,look:{body:'Turtleneck',head:'Shaved 2',face:'Eyes Closed',beard:'Goatee 2'},say:"Storms don't trouble me. Put me on the storm canvas and she rides it out."},
  guncrew:{n:'Gun Crew',crafts:['gun'],fee:6,wage:1,look:{body:'Sporty Tee',head:'Twists',face:'Explaining',beard:'Chin'},say:"Point us at the enemy and give us the chase guns or the swivels. We'll do the rest."},
  gunner:{n:'Master Gunner',crafts:['gun','steel'],fee:10,wage:2,look:{body:'Tee 2',head:'Shaved 1',face:'Rage',beard:'Moustache 3',acc:'Eyepatch'},say:"Twenty years behind a cannon. Put me on your swivels and I hit what I aim at. Mostly."},
  cannoneers:{n:'Cannon Crew',crafts:['gun','fire'],fee:10,wage:2,look:{body:'Thunder T-Shirt',head:'Short 2',face:'Hectic'},say:"Hot shot, loud guns, short fights. Give us the powder magazine and a barrel of grapeshot."},
  monkey:{n:'Powder Monkey',crafts:['fire'],fee:5,wage:1,look:{body:'Striped Pocket Tee',head:'Short 4',face:'Cute'},say:"I'm small, I'm quick, and I keep the powder magazine from blowing. I've only set myself on fire twice."},
  fireeater:{n:'Fire-eater',crafts:['fire','med'],fee:9,wage:2,look:{body:'Pointing Up',head:'Mohawk 2',face:'Smile Teeth Gap',beard:'Goatee 1'},say:"Fire? I eat it for breakfast. I'll load your grapeshot, then patch up whoever it touched."},
  herbalist:{n:'Herbalist',crafts:['med'],fee:6,wage:1,look:{body:'Sweater Dots',head:'Long Curly',face:'Smile'},say:"Roots, leaves and a kind word. Sit me by the mermaid and she'll mend us gently."},
  monk:{n:'Tide Monk',crafts:['med','carp'],fee:9,wage:2,look:{body:'Hoodie',head:'Turban',face:'Eyes Closed'},say:"The tide teaches patience. I heal, I hold the line, and I keep the crew quarters quiet."},
  cormorant:{n:'Cormorant',crafts:['steel','med'],fee:8,wage:2,look:{body:'Coffee',head:'Afro',face:'Calm',beard:'Moustache 5'},say:"The bird dives, fishes and bites. Set it on the mermaid and it decides who it likes. It likes you."},
  witch:{n:'Sea Witch',crafts:['alch'],fee:7,wage:2,look:{body:'Polka Dot Jacket',head:'Long',face:'Contempt'},say:"The sea tells me which fish are poison. Carve me a kraken and I'll whisper to it."},
  apothecary:{n:'Apothecary',crafts:['alch','med'],fee:10,wage:2,look:{body:'Paper',head:'Gray Bun',face:'Concerned',acc:'Glasses 5'},say:"One bottle heals, the next one kills. Give me the mermaid or the kraken. I never mix them up."},
  chemist:{n:'Powder Chemist',crafts:['alch','fire'],fee:10,wage:2,look:{body:'Explaining',head:'Flat Top Long',face:'Awe',acc:'Glasses 3'},say:"Powder and venom, carefully measured. I'll gild your lion or stock your magazine. Mostly carefully."}
};
/* what rank 2 and rank 3 open in each craft. The best-ranked crew member with a craft sets its rank. */
const RANKS={
  steel:['The first weapon to fire each fight always crits.','Weapon crits ignore shield.'],
  gun:['Cannons get 10% crit chance.','Cannon hits ignore shield.'],
  fire:['Burn on the enemy fades half as fast.','Burning enemies can\'t gain shield.'],
  alch:['Poisoned enemies can\'t heal.','While the enemy has 8 or more poison, its cargo charges 20% slower.'],
  med:['Healing past full health turns into shield.','Once a fight, a blow that would sink you leaves you on 1 health.'],
  carp:['Your shield also blocks poison.','A hit that breaks your shield stops there.'],
  sea:['Your cargo starts every fight 15% charged.','Slows on your cargo last half as long.']
};
const RANKXP=[0,3,7];   // fights won to reach rank 1, 2 and 3

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
  wright:{n:'Shipwright\'s Friend',d:'Repairs cost 1 gold a point, and the shipwright stocks 3 fittings.'},
  haggler:{n:'Haggler',d:'Market cargo costs 1 less.'},
  prize:{n:'Prize Court',d:'Spoils offer 4 pieces of cargo instead of 3.'}
};
const STAR='<svg viewBox="0 0 30 30" class="gl" aria-hidden="true"><path class="w" d="M15 3l3.6 7.4 8.1 1.1-5.9 5.7 1.4 8L15 21.4l-7.2 3.8 1.4-8-5.9-5.7 8.1-1.1z"/></svg>';
Object.values(FITTINGS).forEach(F=>F.d=[F.shape,F.up,F.dn].filter(Boolean).join(' '));
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
