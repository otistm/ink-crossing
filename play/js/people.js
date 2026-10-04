/* Ink Crossing: People you meet: portraits, NPCs and quests (Hock, Wet Jack, the lost cartographers), dialogue, the creel sheet. */
"use strict";
/* ---------- people you meet ---------- */
/* a person's round portrait, built from Open Peeps like the crew (peeps.js). A ghost gets a dashed ring. */
function portrait(L){L=L||{};return peep(L,PEEP_HEAD,'portrait'+(L.ghost?' ghost':''))}
const NPCS={
  angler:{n:'Old Marrow',role:'Angler',look:{body:'Sweater',head:'Gray Short',face:'Old',beard:'Full'},sea:-1,x:"You fish? Not with that twig you don't.",o:[
    {l:'Buy a better rod',d:'12 gold. Your catch zone gets wider.',need:()=>G.gold>=12&&G.rod<3,f:()=>{G.gold-=12;G.rod++;return'Bought a better rod from Old Marrow.'}},
    {l:'Ask for a tip',d:'One extra cast at your next fishing spot.',f:()=>{G.tip++;return'Old Marrow told me where the fish hide. One extra cast next time.'}},
    {l:'Fish with him',d:'Two casts, right here.',f:()=>({fish:2,msg:'Went fishing with Old Marrow.'})}]},
  nell:{n:'Nell',role:'Fishwife',look:{body:'Dress',head:'Bun',face:'Smile Big'},sea:-1,x:"Fish, fish, who's got fish? I pay better than any dock.",o:[
    {l:'Sell her your catch',d:'She pays 1.5 times the price for everything.',need:hasFish,f:()=>`Sold my whole catch to Nell for ${sellAll(1.5)} gold.`},
    {l:'Trade a fish for supper',d:'Your cheapest fish for a Salt Pork.',need:hasFish,f:r=>{takeCheapFish();return addOrGold({k:'pork',t:rollTier(D()+2,r)},'Nell traded me')}},
    {l:'Nothing today',d:'She shrugs.',f:()=>'Waved to Nell and moved on.'}]},
  tobin:{n:'Tobin',role:'Hungry deckhand',look:{body:'Tee 1',head:'Short 1',face:'Tired'},sea:-1,x:"Captain, the crew hasn't eaten proper in days. Spare a fish?",o:[
    {l:'Give a fish',d:'Your cheapest fish. Repair 3 hull.',need:hasFish,f:()=>{takeCheapFish();G.hull+=3;return'Fed the crew a fish. They patched the hull with a will. +3 hull.'}},
    {l:'Pay the crew extra',d:'5 gold. Repair 2 hull.',need:()=>G.gold>=5,f:()=>{G.gold-=5;G.hull+=2;return'Paid the crew extra. +2 hull.'}},
    {l:'Tell him to wait',d:'Nothing happens.',f:()=>'Told Tobin to wait for port.'}]},
  quill:{n:'Quill',role:'Smuggler',look:{body:'Turtleneck',head:'hat-hip',face:'Suspicious',acc:'Sunglasses'},sea:-1,x:"Psst. Contraband. No questions, no receipts.",o:[
    {l:'Buy contraband',d:'12 gold for an item a tier above normal.',need:()=>G.gold>=12,f:r=>{G.gold-=12;return addOrGold(randItem(r,D()+5),'Bought contraband:')}},
    {l:'Sell him your route',d:'+8 gold.',f:()=>{G.gold+=8;return'Sold Quill a copy of my route. +8 gold.'}}]},
  tide:{n:'Brother Tide',role:'Sea priest',look:{body:'Shirt and Coat',head:'No Hair 2',face:'Solemn',beard:'Full 2'},sea:-1,x:"The sea keeps a ledger, captain. Shall we balance yours?",o:[
    {l:'Make an offering',d:'5 gold. Repair 3 hull.',need:()=>G.gold>=5,f:()=>{G.gold-=5;G.hull+=3;return'Brother Tide blessed the hull. +3 hull.'}},
    {l:'Offer your best fish',d:'Mark your chart.',need:hasFish,f:()=>{takeBestFish();return{chart:1,msg:'Gave Brother Tide my best fish. He showed me a mark for my chart.'}}},
    {l:'Move on',d:'He keeps praying.',f:()=>'Passed Brother Tide at prayer.'}]},
  pip:{n:'Pip',role:'Stowaway',look:{body:'Sweater',head:'Medium Bangs 3',face:'Cute'},sea:-1,x:"Found them curled up in the sail locker. They say they can sew.",o:[
    {l:'Let Pip stay',d:'Pip mends a Spare Sail for you.',f:r=>addOrGold({k:'sail',t:rollTier(D()+2,r)},'Pip joined the crew and sewed')},
    {l:'Put Pip ashore',d:'+3 gold. They leave a coin on the rail.',f:()=>{G.gold+=3;return'Put Pip ashore. They left a coin on the rail.'}}]},
  coral:{n:'Madame Coral',role:'Merchant princess',look:{body:'Fur Jacket',head:'Long Afro',face:'Cheeky',acc:'Sunglasses 2'},sea:-1,x:"I collect rare things. Fish, mostly. Don't ask why.",o:[
    {l:'Sell her your catch',d:'She pays double for everything.',need:hasFish,f:()=>`Madame Coral bought my whole catch for ${sellAll(2)} gold.`},
    {l:'Buy a Treasure Chest',d:'14 gold.',need:()=>G.gold>=14,f:r=>{G.gold-=14;return addOrGold({k:'chest',t:rollTier(D(),r)},'Bought')}},
    {l:'Bow and leave',d:'She bows back.',f:()=>'Bowed to Madame Coral and left.'}]},
  ada:{n:'Ink Ada',role:'Tattooist',look:{body:'Gym Shirt',head:'Bun 2',face:'Driven'},sea:-1,x:"A mapmaker with bare arms? Let me draw something that lasts.",o:[
    {l:'Get a tattoo',d:'8 gold. Mark your chart.',need:()=>G.gold>=8,f:()=>{G.gold-=8;return{chart:1,msg:'Ink Ada tattooed a landmark on my arm.'}}},
    {l:'Just watch',d:'Nothing happens.',f:()=>'Watched Ink Ada work.'}]},
  cookie:{n:'Cookie',role:"Ship's cook",look:{body:'Polo and Sweater',head:'Bear',face:'Eating Happy',beard:'Moustache 9'},sea:-1,x:"Give me a fish and I'll give you a meal that fights back.",o:[
    {l:'Cook your best fish',d:'It becomes food cargo. Rarer fish, better tier.',need:hasFish,f:r=>{const f=takeBestFish();return addOrGold({k:pick(r,['pork','lime']),t:Math.min(3,FISH[f].rar+(G.sea>0?1:0))},`Cookie cooked the ${FISH[f].n} into`)}},
    {l:'No thanks',d:'Cookie sulks.',f:()=>'Declined a meal from Cookie.'}]},
  bram:{n:'Bram',role:'Rival mapmaker',look:{body:'Blazer Black Tee',head:'Short 5',face:'Contempt',beard:'Goatee 1',acc:'Glasses'},sea:-1,x:"Another cartographer? The Guild must be desperate. Show me yours and I'll show you mine.",o:[
    {l:'Compare charts',d:'See one row further through the fog for the rest of the voyage.',f:()=>{G.far++;updateReveal();return'Compared charts with Bram. I can see further now.'}},
    {l:'Sell him a copy',d:'+12 gold.',f:()=>{G.gold+=12;return'Sold Bram a copy of my chart for 12 gold.'}}]},
  ansel:{n:'Ansel',role:'Lighthouse keeper',look:{body:'Sweater',head:'hat-beanie',face:'Smile',beard:'Full 3'},sea:0,x:"Forty years I've watched ships pass this light. Three had mapmakers aboard. None came back.",o:[
    {l:'Ask about them',d:'Hear about the first cartographer.',f:()=>{lore("Ansel remembers the first cartographer. She carved a circle with a line through it on every dock she passed. It means: I was here, keep going.");return'Heard about the first cartographer from Ansel.'}},
    {l:'Buy lamp oil',d:'6 gold for a Signal Flare.',need:()=>G.gold>=6,f:r=>{G.gold-=6;return addOrGold({k:'flare',t:rollTier(D()+2,r)},'Bought')}}]},
  hale:{n:'Lieutenant Hale',role:'Navy officer',look:{body:'Button Shirt 2',head:'Flat Top',face:'Serious',beard:'Moustache 1'},sea:1,x:"These waters belong to the Crown. So does a toll.",o:[
    {l:'Pay the toll',d:'6 gold.',need:()=>G.gold>=6,f:()=>{G.gold-=6;return"Paid Lieutenant Hale's toll."}},
    {l:'Refuse',d:'He fires a warning shot. Lose 3 hull.',f:()=>{G.hull-=3;return'Refused the Navy toll and took a warning shot. Lost 3 hull.'}},
    {l:'Bribe him with fish',d:'Your best fish. He waves you through with a gift.',need:hasFish,f:r=>{takeBestFish();return addOrGold({k:'chain',t:rollTier(D()+2,r)},'Hale took the fish and handed me')}}]},
  second:{n:'The Second Cartographer',role:'Lost in the fog',look:{body:'Shirt and Coat',head:'Medium Straight',face:'Concerned Fear',ghost:1},sea:1,lore:1,x:"You're drawing the fog? I tried. It kept moving. Take something, and don't trust the Queen's compass.",o:[
    {l:'Take her last page',d:'Clear the fog from this whole sea.',f:()=>{G.full=true;updateReveal();lore('The second cartographer is a ghost in the fog. Her last page fits my chart exactly.');return'The second cartographer gave me her last page. The fog is charted.'}},
    {l:'Take her compass',d:'A Brass Compass, a tier above normal.',f:r=>{lore('The second cartographer is a ghost in the fog. She pressed her compass into my hand.');return addOrGold({k:'compass',t:rollTier(D()+4,r)},'The second cartographer gave me')}}]},
  jack:{n:'Wet Jack',role:'Drowned sailor',look:{body:'Striped Tee',head:'Medium 1',face:'Blank',beard:'Chin',ghost:1},sea:2,x:"Deliver a letter for me? My girl's at the next port. She thinks I'm late, not dead.",o:[
    {l:'Take the letter',d:'Deliver it at your next port for a reward.',need:()=>!G.quest,f:()=>{G.quest='letter';return'Took a letter from Wet Jack to deliver at the next port.'}},
    {l:'Refuse',d:'He sinks back down.',f:()=>"Couldn't take a dead man's letter."}]},
  third:{n:'The Third Cartographer',role:'Alive, somehow',look:{body:'Paper',head:'Medium Bangs',face:'Tired'},sea:2,lore:1,x:"The Queen took my ship, not me. I've been rowing toward the Kraken for a year. You'll get there first. Draw it well.",o:[
    {l:'Take her notes',d:'Mark your chart.',f:()=>{lore('The third cartographer is alive, rowing toward the Kraken in a dinghy. She gave me her notes.');return{chart:1,msg:'The third cartographer gave me her notes on the Deep.'}}},
    {l:'Give her a fish',d:'Your best fish, for her harpoon.',need:hasFish,f:r=>{takeBestFish();lore('The third cartographer is alive. I fed her, and she gave me her harpoon.');return addOrGold({k:'harpoon',t:rollTier(D()+4,r)},'The third cartographer traded me')}}]}
};
function unlockLocker(){G.hock='done';G.locker=[];lore('Hock built a locker below the waterline. Six slots for spare cargo. It smells of fresh pine and fish.')}
NPCS.hock={n:'Hock',role:'Shipwright',look:{body:'Polo and Sweater',head:'Short 3',face:'Cheeky',beard:'Full'},sea:0,quest:1,x:"That hold of yours is a shoebox. Bring me three fish, any kind, and I'll build you a locker below deck for spare cargo. Find me on any dock.",o:[
  {l:'Take the job',d:'Bring Hock 3 fish at any port. Reward: a 6-slot locker for extra cargo.',need:()=>!G.hock,f:()=>{G.hock='active';return'Hock the shipwright will build me a locker for three fish.'}},
  {l:'Hand over 3 fish now',d:'Your three cheapest fish. He starts building today.',need:()=>!G.hock&&G.creel.length>=3,f:()=>{takeCheapFish();takeCheapFish();takeCheapFish();unlockLocker();return'Gave Hock three fish on the spot. He built me a locker below deck.'}},
  {l:'Not now',d:"He'll be around the docks.",f:()=>{G.hock='active';return"Told Hock I'd think about it. He said he'd wait on the docks."}}]};
NPCS.hock2={n:'Hock',role:'Shipwright',look:{body:'Polo and Sweater',head:'Short 3',face:'Cheeky',beard:'Full'},sea:0,quest:1,hidden:1,x:"Well? Three fish and I'll have that locker built by the tide.",o:[
  {l:'Hand over 3 fish',d:'Your three cheapest fish. Unlock a 6-slot locker.',need:()=>G.creel.length>=3,f:()=>{takeCheapFish();takeCheapFish();takeCheapFish();unlockLocker();return'Gave Hock three fish. He built me a locker below deck.'}},
  {l:'Pay him 20 gold instead',d:'Unlock the locker without fish.',need:()=>G.gold>=20,f:()=>{G.gold-=20;unlockLocker();return'Paid Hock 20 gold. He built me a locker below deck.'}},
  {l:'Not yet',d:G_fishHint(),f:()=>"Told Hock I'd be back with fish."}]};
function G_fishHint(){return'Catch fish at fishing grounds, events, or with Old Marrow.'}
/* ---------- the market's sellers ----------
   A small cast who keep the market stalls. Marta is always at home in Gullhaven; the rest travel, and each port's stall is kept
   by one of them, picked by voyage and port so two captains on one voyage code meet the same seller. lean is the cargo they tend
   to stock (half the counter). say holds one pitch per kind of cargo, in their voice; up, broke and out cover the rest. */
const SELLERS={
  marta:{short:'Marta',n:'Marta Brine',look:{body:'Sweater',head:'Gray Medium',face:'Smile',acc:'Glasses 2'},lean:['F','T'],
    out:"That's me cleaned out, love. Fair winds.",up:"You've one of these already. Put them together and it comes up a grade.",broke:"Come back when your purse is heavier, love.",
    say:{F:"Fresh this morning. You'll fight better on a full stomach.",T:'Good honest tool. My late husband swore by these.',A:"Keeps the splinters out. I'd want one, out there.",
      W:'Sharp end goes toward them, love. Mind your fingers.',C:'Heavy as sin and loud as thunder. Your crew will love it.',X:"Keep it away from the sails, that's all I ask.",
      V:"Nasty stuff. Don't let me catch you using it on my gulls.",R:'Good canvas and good rope. Makes a ship sing.','*':"A bit of everything at Marta's."}},
  gully:{short:'Gully',n:'Gully Fenn',look:{body:'Polo and Sweater',head:'Cornrows',face:'Smile Big',beard:'Moustache 8'},lean:['C','X'],
    out:'Sold out! Come back with more gold and fewer questions.',up:'Ha! Bolt it onto the one you have. Twice the bang.',broke:"No gold, no boom. That's the rule.",
    say:{C:"Hear that? That's the sound of their hull giving up.",X:'Light it, throw it, run. In that order.',W:"Bit quiet for my taste, but it'll do the job.",
      A:'Armour is for people who expect to get hit. Fair enough.',F:'Eat something. Hungry gunners miss.',V:'Poison is slow. I like things that go bang. Still, it works.',
      R:'Faster ship, more broadsides. Simple sums.',T:'Useful. Not loud, but useful.','*':'Everything here goes bang, or helps something go bang.'}},
  vane:{short:'Sister Vane',n:'Sister Vane',refuse:'Without a surgeon aboard these would do more harm than good. Bring me one and we will talk.',look:{body:'Turtleneck',head:'Long Bangs',face:'Serious'},lean:['V'],
    out:'The shelf is bare. The sea will provide again.',up:'A twin to the one you carry. Together they grow stronger.',broke:'Patience. Gold comes to those who survive.',
    say:{V:'A drop is a kindness. Two drops is a lesson.',F:"Food heals. Most of it. I'd check.",X:'Fire is quick. I prefer things that take their time.',
      W:'A blade is honest. I admire that.',C:"Loud. Crude. Effective, I'm told.",A:'Protection. Wise. Not everyone out there is as gentle as me.',
      R:'The wind serves those who ask it nicely.',T:'A tool for careful hands.','*':'Everything on this counter has a purpose.'}},
  odo:{short:'Odo',n:'Odo Crane',refuse:"No Master-at-Arms aboard? Then nobody on your deck knows which end to hold. I don't sell steel to amateurs.",look:{body:'Killer',head:'Medium 2',face:'Cheeky',beard:'Goatee 2'},lean:['W'],
    out:"Cleaned out. You didn't see me, I didn't sell you nothing.",up:'Matches the one in your hold. Funny, that. Must be fate.',broke:"Credit? Captain, I'm a fence, not a priest.",
    say:{W:'Fell off a navy ship. Into my hands. Very careful fall.',C:"Don't ask where the rest of the battery went.",X:"Smells of smoke because it's honest, not because it's stolen.",
      V:'Never touched it myself. Gloves, every time.',F:'Even crooks eat. Fresh, mostly.',A:"Last owner won't be needing it. Don't ask why.",
      R:'Off a racing sloop. The owner was racing me at the time.',T:'Tools. Legit. Mostly.','*':"Everything's for sale. Some of it is even mine."}},
  pell:{short:'Pell',n:'Pell Rigby',refuse:"Charms sleep until a witch wakes them. No witch aboard, no sale. Sorry, rules of the trade.",look:{body:'Button Shirt 1',head:'Twists 2',face:'Driven',acc:'Glasses 3'},lean:['R','T'],
    out:'Shelves empty! Stock: none. Joy: also none.',up:'Oh, that pairs with yours. Snug fit. Lovely.',broke:'Short on coin? Tides turn. So will your luck.',
    say:{R:"Rig this right and she'll fly. I tied the knots myself.",T:"Precision made. Well. Made. It's made.",W:"Balanced at the third rivet. You'll feel it.",
      C:'Mind the recoil. Brace your rigging first.',X:'Fire near the rigging? Bold. I respect bold.',V:'Measured doses only. I wrote the label.',
      F:'Ship biscuit. Breaks teeth, saves lives.',A:'Riveted, pegged and tested. Twice.','*':'Good gear makes a fast ship. Have a look.'}},
  bruna:{short:'Bruna',n:'Bruna Hask',look:{body:'Fur Jacket',head:'Buns',face:'Serious'},lean:['A'],
    out:'Nothing left. Go on, then.',up:'Same as the one you have. Stack them. Stronger.',broke:"Can't pay, can't have. Simple.",
    say:{A:'Took a cannonball for me once. Still here. So am I.',W:'Heavy. Good. Light weapons are for show.',C:'Big gun. Brace your feet.',
      X:'Fire is fine. Burns are not. Wear something.',V:"Coward's weapon. Works, though.",F:'Eat. Then fight.',
      R:'Sails and ropes. Not my trade, but it is sound.',T:'Good iron in that.','*':'Built to last. Like me.'}}};
/* who keeps this port's stall: Marta at home (and in the tutorial), otherwise one of the travellers */
function sellerOf(id){const S=G.shops[id];if(S&&S.seller)return S.seller;
  const trav=Object.keys(SELLERS).filter(k=>k!=='marta'&&!SELLERS[k].refuse);   // the stall keepers (refuse) keep their own stalls
  const k=G.tut||(G.sea===0&&id===G.map.start)?'marta':trav[ri(RNG(G.seed,'seller',id),trav.length)];
  if(S)S.seller=k;return k}
/* the seller's line for an item: their pitch for its kind of cargo, the kind they care about first */
function pitch(sk,o){const P=SELLERS[sk],t=DEFS[o.k].tags,order=P.lean.concat(['C','X','V','F','A','R','T','W']);
  const tag=order.find(x=>t.includes(x));return P.say[tag]||P.say['*']}
/* ---------- the market's stalls: the shipyard sells ship cargo to anyone; the armory, apothecary and charm seller sell crew cargo,
   and only to a captain with a hand aboard who masters it (need). sk is the keeper; the shipyard's is sellerOf(). ---------- */
const STALLS={yard:{n:'Shipyard',ok:k=>!isCrewItem(k)},armory:{n:'Armory',ok:k=>['cw','cs'].includes(clsOf(k).cls),need:'atarms',sk:'odo'},
  apoth:{n:'Apothecary',ok:k=>clsOf(k).cls==='ch',need:'surgeon',sk:'vane'},charms:{n:'Charms',ok:k=>clsOf(k).cls==='cx',need:'witch',sk:'pell'}};
const stallOpen=st=>!STALLS[st].need||!!(G.crew&&G.crew.some(c=>c.k===STALLS[st].need));
const stallKeeper=(st,id)=>STALLS[st].sk||sellerOf(id);
/* stock for a stall: your ship's pool and the shared cargo first, then any ship's when that runs thin */
function stockFor(r,depth,st){const ok=STALLS[st].ok;for(let n=0;n<40;n++){const it=randItem(r,depth);if(ok(it.k)&&it.k!=='chest')return it}
  const pool=KEYS.filter(k=>!isCrewKey(k)&&!RETIRED.has(k)&&k!=='chest'&&ok(k));return{k:pool[ri(r,pool.length)],t:rollTier(depth,r)}}
/* every stall's goods for this visit (the shipyard's are S.offers, the rest S.stalls), seeded by voyage, port and visit */
function mkStalls(id,depth){const o={};for(const st of ['armory','apoth','charms']){const r=RNG(G.seed,'stall',id,st,G.shopVisit||0);o[st]=Array.from({length:4},()=>stockFor(r,depth,st))}return o}
/* stock for a stall: half of it leans to what the seller deals in */
function stallItem(r,depth,sk,i){if(i<2){for(let n=0;n<14;n++){const it=randItem(r,depth);if(DEFS[it.k].tags.some(x=>SELLERS[sk].lean.includes(x)))return it}}
  return randItem(r,depth)}
/* ---------- the shipwrights ----------
   Like the sellers: Hock keeps the yard at Gullhaven, and three more travel, one per port, picked by voyage and port. spot is the
   part of the ship they're best at (the first fitting on their bench is one for it, when there is one). say has a line per
   fitting spot; repair, full, broke, out and slot cover the rest. */
const WRIGHTS={
  hock:{short:'Hock',n:'Hock',look:NPCS.hock.look,spot:'hull',
    say:{hull:"Good timber, tight seams. She'll take a beating and ask for more.",sails:"Better canvas than you've got. Not hard, mind.",
      guns:"Bolt this on and they'll hear you coming. That's the point.",head:'Every ship needs a face. Yours could use a better one.'},
    repair:"Bring her round. I'll have those holes plugged by the tide.",full:'Hull is sound. Nothing for me to patch.',broke:'Wood costs money, captain. So do I.',
    out:"That's all I had. Come back when the yard's restocked.",slot:'That boards up a slot in your hold. Sell something first, then come back.'},
  nan:{short:'Nan',n:'Nan Keel',look:{body:'Sweater',head:'Medium Bangs 2',face:'Smile Teeth Gap'},spot:'sails',
    say:{hull:'Sound as a bell. Knock on it. Go on.',sails:"Cut it myself. She'll fly like a gull with a grudge.",
      guns:"Heavy, but she'll carry it. Most ships do, eventually.",head:'Carved her from a single log. Took all winter.'},
    repair:"Holes? I love holes. Pay me and they're gone.",full:'Not a scratch on her. Lucky you.',broke:'Short a few coins? Sail careful, then.',
    out:"Yard's empty. Everything's out on the water.",slot:'No room in your hold to board one up. Make a space first.'},
  brann:{short:'Tor',n:'Tor Brann',look:{body:'Gym Shirt',head:'Cornrows 2',face:'Driven',beard:'Full 2'},spot:'guns',
    say:{hull:'Thick hull, thick skin. Both help.',sails:'Sails. Fine. Faster to the fight.',
      guns:"Now that's a fitting. Mind your ears.",head:"Pretty. Does it shoot? No. Sailors like them anyway."},
    repair:'Patch the holes, then go and make some in someone else.',full:"She's whole. Go put holes in somebody else.",broke:'No coin, no iron.',
    out:"Sold the lot. Should've come sooner.",slot:'Needs a free hold slot to board up. Clear one.'},
  ishbel:{short:'Ishbel',n:'Old Ishbel',look:{body:'Coffee',head:'Bangs 2',face:'Old',acc:'Glasses 4'},spot:'head',
    say:{hull:'The sea respects a sturdy keel. So do I.',sails:'Good wind lives in good canvas.',
      guns:"Loud things. The sea doesn't like loud things. Still.",head:'Carved for luck. The sea notices these things.'},
    repair:"Every hole's a story. Let me close a few.",full:"She's whole. The sea has been kind to you.",broke:'Gold first, luck after.',
    out:'Nothing left on my slip, dear.',slot:"There's no room in your hold for the boards, dear."}};
/* who keeps this port's yard: Hock at home, otherwise one of the travellers */
function wrightOf(id){const S=G.shops[id];if(S&&S.wright)return S.wright;
  const trav=Object.keys(WRIGHTS).filter(k=>k!=='hock');
  const k=G.sea===0&&id===G.map.start?'hock':trav[ri(RNG(G.seed,'wrightwho',id),trav.length)];
  if(S)S.wright=k;return k}
/* ---------- the fishmongers ----------
   Whoever buys fish on the dock: Salt Sal at Gullhaven, and two who travel, one per port. A line per fish rarity in say, and
   demand (the fish they pay double for), empty (no fish), thanks (just after you sell to them) and all (selling the whole creel). */
const MONGERS={
  sal:{short:'Sal',n:'Salt Sal',look:{body:'Polo and Sweater',head:'Medium 3',face:'Cheeky'},
    say:["A tiddler, but it'll fry.","Now that's a proper fish. Fair price for it.","Oh my. Where did you catch this one?"],
    demand:"That's the one I'm after today. Double, as promised.",thanks:'Pleasure doing business, love. Come back with more.',empty:"No fish? Go and catch some, love. The sea's full of them.",all:"I'll take the whole creel off your hands."},
  dora:{short:'Dora',n:'Big Dora',look:{body:'Fur Jacket',head:'Bantu Knots',face:'Smile LOL'},
    say:['Small fry. Still pays.',"Good weight on that one. I'll give you a fair price.","Ha! A beauty! You've made my week."],
    demand:"That's the one! Double, like I said.",thanks:'Ha! Good haul. My scales thank you.',empty:'Empty creel? Then what are you doing on my dock?',all:'Tip the lot on my scales.'},
  gill:{short:'Gill',n:'Wendel Gill',look:{body:'Turtleneck',head:'Gray Short',face:'Suspicious',beard:'Moustache 1',acc:'Glasses 5'},
    say:['Common as gulls. Still, coin is coin.',"Hm. Decent. I've seen worse.","I'll admit, that's rare. Don't tell the others."],
    demand:'Ah. That one. Double, as posted.',thanks:'Adequate fish. Adequate price. Good day.',empty:'Nothing to sell? Nothing to buy, then.',all:"I'll weigh the whole creel."}};
/* who buys fish at this port's dock: Sal at home, otherwise one of the travellers */
function mongerOf(id){const S=G.shops[id];if(S&&S.monger)return S.monger;
  const trav=Object.keys(MONGERS).filter(k=>k!=='sal');
  const k=G.tut||(G.sea===0&&id===G.map.start)?'sal':trav[ri(RNG(G.seed,'monger',id),trav.length)];
  if(S)S.monger=k;return k}
const NPC_POOL=Object.keys(NPCS).filter(k=>!NPCS[k].lore&&!NPCS[k].quest);
function talk(k,key,done,after){
  const N=NPCS[k];A.people=A.people||{};A.people[k]=1;saveA();
  const ov=overlay(`<div class="npc">${portrait(N.look)}<div><h2>${N.n}</h2><p class="soft">${N.role}</p></div></div><p class="log">“${N.x}”</p>
    <div class="picks">${N.o.map((o,i)=>{const ok=!o.need||o.need();return`<button class="opt" data-o="${i}" ${ok?'':'disabled'}><b>${o.l}</b>${o.d?`<span>${o.d}</span>`:''}</button>`}).join('')}</div>`,true);
  ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{if(b.disabled)return;ov.remove();
    const res=N.o[+b.dataset.o].f(RNG(G.seed,'npc',key,b.dataset.o));
    if(after)after();
    if(res&&res.chart){logL(res.msg);chartPick(RNG(G.seed,'npcchart',key),res.msg,fin);return}
    if(res&&res.fish){logL(res.msg);save();fishing(key+'f',res.fish,fin);return}
    logL(res);toast(res);fin()});
  function fin(){if(G.hull<=0)return sink();save();done()}
  (ov.querySelector('[data-o]:not([disabled])')||ov.querySelector('button')).focus();
}
function creelSheet(){
  const tot=G.creel.reduce((a,f)=>a+FISH[f].v,0);
  const ov=overlay(`<h2>Your creel</h2><p class="soft">${G.creel.length} of ${CREEL} fish, worth about ${tot} gold. Sell them at any port's fish market.</p>
    <div class="fishlist">${G.creel.map((f,i)=>`<div class="fishrow">${fishSVG(f)}<div><b>${FISH[f].n}</b><span class="soft">${RAR[FISH[f].rar]}, ${FISH[f].v} gold</span></div><button class="ghost" data-r="${i}">Release</button></div>`).join('')||'<p class="soft">Empty.</p>'}</div>
    <button class="primary" data-a="c">Close</button>`);
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]')){ov.remove();return}const r=e.target.closest('[data-r]');if(r){const[f]=G.creel.splice(+r.dataset.r,1);save();ov.remove();toast(`Released the ${FISH[f].n}`);creelSheet()}});
}
