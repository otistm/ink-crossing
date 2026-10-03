/* Ink Crossing: All cargo: the shared set and each ship's themed set, tier scaling, stats in context (auras), and generated item text. */
"use strict";
/* ---------- cargo: a shared set plus a themed set for each ship ----------
   Fields (Bronze values, scaled by tier): dmg multi crit pierce burnPerHit poisonPerHit dmgX
   shield shieldX heal healX burn poison slow:[n,s] haste:[target,s] charge:[target,s]
   cleanse douse selfDmg grow:{stat:n}. start:{...} fires when a fight begins. on:[{ev,...}] reacts to events.
   Auras: adjDmg adjCd adjCrit adjPre adjShield adjHeal adjBurn adjPoison tagDmg tagCd tagCrit tagHeal
   tagShield tagBurn tagPoison tagPre edgeCd emptyCd hpBonus regen gold.                                  */
const CI=[]; // compact item table: [key, name, size, cooldown (0 = passive), tags, ship, glyph or crew look, fields]
const I=(k,n,s,cd,tags,ship,g,f)=>CI.push([k,n,s,cd,tags,ship,g,f||{}]);
/* shared */
I('dagger','Boarding Knife',1,4,'W','any','dagger',{dmg:8});
I('pins','Belaying Pins',1,3.5,'W','any','pins',{dmg:4,multi:2});
I('cutlass','Cutlass',2,6,'W','any','cutlass',{dmg:22});
I('harpoon','Harpoon',2,5,'W','any','harpoon',{dmg:15,crit:.3});
I('fenders','Fenders',1,5,'A','any','fenders',{shield:14});
I('pork','Salt Pork',1,6,'F','any','pork',{heal:15});
I('tar','Tar Bucket',2,8,'T','any','tar',{heal:26,shield:12});
I('hook','Grappling Hook',1,7,'T','any','hook',{slow:[1,2]});
I('net','Fishing Net',2,6,'T','any','net',{slow:[2,1.5]});
I('compass','Brass Compass',1,0,'T','any','compass',{adjCd:.1});
I('chest','Treasure Chest',1,0,'','any','chest',{gold:2});
I('spyglass','Spyglass',1,0,'T','any','spyglass',{adjPre:.3});
/* THE WREN: speed, haste, charge, crits and light blades */
I('sail','Spare Sail',1,6,'R','sloop','sail',{haste:['adj',2]});
I('rum','Rum Barrel',2,0,'F','sloop','rum',{start:{haste:['all',2]}});
I('crows',"Crow's Nest",2,0,'R','sloop','crows',{tagCrit:['W',.1]});
I('eel','Electric Eel',1,5,'W','sloop','eel',{dmg:6,pierce:1});
I('jib','Jib Sail',1,4,'R','sloop','sail',{haste:['right',1.5]});
I('mainsail','Mainsail',3,8,'R','sloop','sail',{haste:['all',2]});
I('topsail','Topsail',2,5,'R','sloop','sail',{charge:['adj',1]});
I('flyingjib','Flying Jib',1,3.5,'R','sloop','sail',{charge:['right',.8]});
I('spinnaker','Spinnaker',3,10,'R','sloop','kite',{haste:['all',3],shield:10});
I('rapier','Rapier',1,3,'W','sloop','rapier',{dmg:6,crit:.25});
I('stiletto','Stiletto',1,2.5,'W','sloop','dagger',{dmg:4,pierce:1});
I('twinblades','Twin Blades',2,4,'W','sloop','cutlass',{dmg:6,multi:2,crit:.1});
I('swordcane','Sword Cane',1,4,'W','sloop','rapier',{dmg:7,crit:.3});
I('sabre','Sabre',2,5,'W','sloop','cutlass',{dmg:18,crit:.15,on:[{ev:'crit',haste:['self',1]}]});
I('riposte','Riposte Blade',1,4,'W','sloop','rapier',{dmg:8,on:[{ev:'hurt',charge:['self',1],icd:1}]});
I('cutlass2','Boarding Sabre',2,5,'W','sloop','cutlass',{dmg:14,grow:{dmg:3}});
I('boathook','Boathook',1,4,'W','sloop','hook',{dmg:7,slow:[1,1]});
I('monkeyfist','Monkey Fist',1,3,'W','sloop','knot',{dmg:5,slow:[1,.5]});
I('marlinspike','Marlinspike',1,3,'W','sloop','spike',{dmg:5,pierce:1});
I('quickdraw','Quickdraw Pistol',1,5,'W','sloop','pistol',{dmg:14,start:{charge:['self',4]}});
I('flintlock','Flintlock',2,7,'W','sloop','pistol',{dmg:30,crit:.2});
I('pistols','Brace of Pistols',2,6,'W','sloop','pistol',{dmg:12,multi:2,crit:.15});
I('lastword','Last Word',1,9,'W','sloop','dagger',{dmg:30,pierce:1});
I('jollyboat','Jolly Boat',3,7,'T','sloop','boat',{dmg:14,multi:3});
I('windlass','Windlass',2,6,'T','sloop','winch',{charge:['tag:W',1]});
I('tackle','Block and Tackle',2,6,'T','sloop','pulley',{charge:['adj',1.5]});
I('bell','Ship\'s Bell',1,8,'T','sloop','bell',{charge:['all',.5]});
I('sandglass','Sandglass',1,6,'T','sloop','hourglass',{charge:['all',.8]});
I('gale','Gale Horn',2,9,'T','sloop','horn',{haste:['all',2],slow:[1,2]});
I('kite','Signal Kite',2,8,'R','sloop','kite',{slow:[2,2],haste:['adj',2]});
I('slipstream','Slipstream',1,4,'R','sloop','feather',{dmg:5,haste:['right',1]});
I('grog','Grog Keg',2,9,'F','sloop','rum',{heal:18,haste:['adj',2]});
I('oar','Sprint Oar',2,6,'T','sloop','oar',{haste:['left',3]});
I('bosun','Bosun',1,5,'K','sloop',{hat:'cap'},{haste:['rand2',1.5]});
I('parrot','Parrot',1,6,'K','sloop','parrot',{dmg:3,on:[{ev:'crit',charge:['rand1',.5]}]});
I('deckhand','Deckhand',1,5,'K','sloop',{hat:'bandana'},{charge:['right',1.5]});
I('rigger','Rigger',1,5,'K','sloop',{},{haste:['left',1.5]});
I('sailmaker','Sailmaker',1,6,'K','sloop',{hat:'hood',hair:1},{shieldX:['tag:R',4]});
I('fencer','Fencing Master',2,0,'K','sloop',{hat:'plume'},{tagDmg:['W',3]});
I('duelglove',"Duelist's Glove",1,0,'','sloop','glove',{adjCrit:.2});
I('logline','Log Line',1,0,'R','sloop','rope',{tagCd:['R',.1]});
I('figure8','Figure-Eight Knot',1,0,'R','sloop','knot',{adjPre:.4});
I('tailwind','Tailwind Charm',1,0,'','sloop','feather',{start:{haste:['all',1.5]}});
I('windvane','Wind Vane',1,0,'R','sloop','vane',{edgeCd:.2});
I('lightrig','Light Rigging',1,0,'R','sloop','rope',{emptyCd:.03});
I('bowsprit','Bowsprit',2,0,'R','sloop','spar',{tagPre:['W',.25]});
I('pennant','Racing Pennant',1,0,'','sloop','flag',{on:[{ev:'haste',shield:3,icd:.5}]});
/* THE BULWARK: shield, armor, health, slows, shield turned into damage */
I('plating','Iron Plating',2,7,'A','galleon','plating',{shield:36});
I('ballast','Ballast',2,8,'A','galleon','ballast',{shieldX:['empty',5]});
I('anchor','Anchor',3,9,'W','galleon','anchor',{dmg:50,slow:[1,1.5]});
I('figure','Figurehead',1,0,'','galleon','figure',{on:[{ev:'lowhp',shield:30}]});
I('chain','Chain Shot',2,6,'W,C','galleon','chain',{dmg:14,slow:[1,1.5]});
I('bulkhead','Bulkhead',2,6,'A','galleon','plating',{shield:24});
I('ironclad','Iron Cladding',1,5,'A','galleon','plating',{shield:9});
I('breastplate','Breastplate',1,5,'A','galleon','armor',{shield:10,on:[{ev:'hurt',shield:3,icd:1}]});
I('pavise','Pavise',2,8,'A','galleon','shieldkite',{shield:40,slow:[1,1]});
I('chainmail','Chain Mail',1,6,'A','galleon','chainmail',{shield:12,grow:{shield:3}});
I('bastion','Bastion',3,10,'A','galleon','wall',{shield:60,heal:15});
I('tortoise','Tortoise Formation',2,9,'A','galleon','shieldkite',{shield:30,haste:['adj',2]});
I('watertight','Watertight Doors',2,7,'A','galleon','door',{shield:16,douse:2});
I('fortress','Floating Fortress',3,12,'A','galleon','wall',{shield:45,charge:['tag:A',1]});
I('sandbags','Sandbags',1,5,'A','galleon','ballast',{shield:8,shieldX:['empty',2]});
I('ram','Iron Ram',3,9,'W','galleon','ram',{dmg:14,dmgX:['shield',.8]});
I('shieldbash','Shield Bash',2,6,'W,A','galleon','shieldkite',{dmg:12,dmgX:['shield',.45]});
I('gauntlet','Plate Gauntlet',1,4,'W,A','galleon','glove',{dmg:6,dmgX:['shield',.25]});
I('crusher','Hull Crusher',3,11,'W','galleon','ram',{dmg:20,dmgX:['shield',1.2]});
I('carronade','Carronade',3,9,'W,C','galleon','cannon',{dmg:30,dmgX:['shield',.5]});
I('broadaxe','Boarding Axe',2,7,'W','galleon','axe',{dmg:28,slow:[1,1]});
I('halberd','Halberd',3,8,'W','galleon','spear',{dmg:42,pierce:1});
I('maul','Maul',3,10,'W','galleon','maul',{dmg:60,slow:[1,2],grow:{dmg:5}});
I('anchorchain','Anchor Chain',2,7,'W','galleon','chain',{dmg:15,slow:[2,1.5]});
I('grapeshot','Grapeshot',2,6,'W,C','galleon','ball',{dmg:8,multi:3});
I('heavyshot','Heavy Shot',1,6,'W','galleon','ball',{dmg:14,slow:[1,.8]});
I('ballista','Ballista',3,9,'W','galleon','harpoon',{dmg:34,pierce:1,slow:[1,1]});
I('capstan','Capstan',2,8,'T','galleon','winch',{shield:12,slow:[2,2]});
I('mooring','Mooring Line',1,6,'T','galleon','rope',{slow:[1,2.5]});
I('hullpatch','Hull Patch',1,7,'T','galleon','tar',{heal:12});
I('drydock','Dry Dock',2,12,'T','galleon','crate',{heal:35,cleanse:1});
I('resolve','Oaken Resolve',1,8,'T','galleon','crate',{heal:10,healX:['missing',.1]});
I('beacon','Beacon',1,9,'T','galleon','lantern',{shieldX:['tag:A',6]});
I('marines','Marines',2,6,'K,W','galleon',{hat:'tricorn'},{dmg:14,multi:2});
I('steadfast','Steadfast Crew',1,6,'K','galleon',{hat:'cap',beard:1},{shield:8,heal:6});
I('quartermaster','Quartermaster',1,0,'K','galleon',{hat:'tricorn',beard:1},{adjShield:8});
I('stoic','Stoic Helmsman',1,0,'K','galleon',{hat:'cap'},{hpBonus:20,on:[{ev:'hurt',shield:2,icd:.5}]});
I('oak','Oak Timbers',2,0,'','galleon','crate',{hpBonus:40});
I('ironbound','Ironbound Hull',3,0,'A','galleon','keel',{hpBonus:80,start:{shield:20}});
I('keel','Reinforced Keel',2,0,'','galleon','keel',{start:{shield:30},on:[{ev:'lowhp',shield:30}]});
I('lastline','Last Line',2,0,'A','galleon','shieldkite',{on:[{ev:'lowhp',heal:30,shield:30}]});
I('barnacles','Barnacled Hull',2,0,'','galleon','shell',{on:[{ev:'hurt',dmg:4,icd:.5}]});
I('buttress','Buttress',1,0,'A','galleon','wall',{adjShield:6,adjHeal:4});
I('counterweight','Counterweight',1,0,'','galleon','ballast',{adjDmg:6});
I('standard','Ship\'s Standard',1,0,'','galleon','flag',{tagShield:['A',5]});
I('bulwarkwall','Bulwark Wall',2,0,'A','galleon','wall',{on:[{ev:'shield',heal:2,icd:.4}]});
I('dropanchor','Drop Anchor',2,0,'','galleon','anchor',{start:{slow:[3,3]}});
/* THE EMBER: cannons, powder, burn, crits that set things alight */
I('cannon','Deck Cannon',3,10,'W,C,X','privateer','cannon',{dmg:40,burn:4});
I('mortar','Mortar',3,11,'W,C,X','privateer','mortar',{dmg:28,burn:8});
I('swivel','Swivel Gun',1,3,'W,C','privateer','swivel',{dmg:5});
I('keg','Powder Keg',1,0,'X','privateer','keg',{adjDmg:5});
I('guncrew','Gun Crew',1,0,'K','privateer','guncrew',{tagCd:['C',.15]});
I('flare','Signal Flare',1,6,'X','privateer','flare',{burn:3});
I('firepot','Fire Pot',2,5,'X','privateer','firepot',{burn:4});
I('blunderbuss','Blunderbuss',2,5,'W','privateer','blunder',{dmg:5,multi:3,burnPerHit:1});
I('grenado','Grenado',1,6,'X','privateer','bomb',{dmg:10,burn:3});
I('hotshot','Heated Shot',2,7,'W,C,X','privateer','ball',{dmg:18,burn:4});
I('incendiary','Incendiary Round',1,4,'C,X','privateer','ball',{dmg:4,burn:2});
I('broadside','Broadside Battery',3,10,'W,C','privateer','cannon',{dmg:16,multi:3});
I('bombard','Bombard',3,12,'W,C','privateer','mortar',{dmg:60,burn:6});
I('twinswivel','Twin Swivels',2,3.5,'W,C','privateer','swivel',{dmg:5,multi:2});
I('barshot','Bar Shot',2,6,'W,C','privateer','chain',{dmg:12,slow:[2,1]});
I('crossfire','Crossfire',2,7,'C','privateer','cannon',{dmg:14,charge:['adj',1]});
I('rocket','Congreve Rocket',1,8,'C,X','privateer','rocket',{dmg:18,burn:3,crit:.2});
I('burstkeg','Bursting Keg',2,9,'X,C','privateer','keg',{dmg:20,burn:5,selfDmg:4});
I('petard','Petard',1,10,'X','privateer','bomb',{dmg:30,selfDmg:5});
I('pepperbox','Pepperbox',1,4,'W','privateer','pistol',{dmg:3,multi:3});
I('brand','Branding Iron',1,5,'W,X','privateer','iron',{dmg:6,burn:2});
I('scorch','Scorched Planks',2,6,'W','privateer','iron',{dmg:5,dmgX:['enemyBurn',1.5]});
I('firearrows','Fire Arrows',2,5,'W,X','privateer','harpoon',{dmg:7,multi:2,burnPerHit:1});
I('fireworks','Fireworks',1,7,'X','privateer','flare',{dmg:3,multi:3,burnPerHit:1});
I('fuse','Slow Fuse',1,8,'X','privateer','fuse',{burn:6,charge:['adj',1]});
I('greekfire','Greek Fire',2,8,'X','privateer','jar',{burn:7,slow:[1,1]});
I('fireship','Fire Ship',3,12,'X','privateer','shipfire',{burn:16});
I('hellburner','Hellburner',3,14,'X','privateer','shipfire',{dmg:25,burn:12});
I('coalpan','Coal Brazier',2,6,'X','privateer','firepot',{burn:4,grow:{burn:1}});
I('sparks','Flint and Steel',1,3,'X','privateer','flint',{burn:1});
I('smokepot','Smoke Pot',1,7,'T','privateer','firepot',{slow:[2,1.5],burn:1});
I('linstock','Linstock',1,5,'T','privateer','linstock',{charge:['tag:C',1]});
I('cartridges','Paper Cartridges',1,6,'T','privateer','scroll',{charge:['adj',1.5]});
I('gunner','Master Gunner',1,0,'K','privateer',{hat:'tricorn',patch:1},{tagCrit:['C',.15]});
I('monkey','Powder Monkey',1,4,'K','privateer',{hat:'cap',kid:1},{charge:['adj',1]});
I('fireeater','Fire-eater',1,6,'K','privateer',{hat:'bandana',beard:1},{burn:3,heal:4});
I('cannoneers','Cannon Crew',2,0,'K','privateer',{hat:'bandana'},{tagDmg:['C',6]});
I('powderhorn','Powder Horn',1,0,'','privateer','horn',{adjDmg:6,adjBurn:1});
I('ramrod','Ramrod',1,0,'T','privateer','spar',{tagCd:['C',.15]});
I('tinderbox','Tinderbox',1,0,'X','privateer','box',{start:{burn:4}});
I('furnace','Shot Furnace',2,0,'X','privateer','galley',{tagBurn:['X',1]});
I('kindling','Kindling',1,0,'X','privateer','box',{tagCd:['X',.15]});
I('gunwale','Gunwale Rack',2,0,'','privateer','rack',{adjPre:.5});
I('magazine','Powder Magazine',2,0,'X','privateer','keg',{on:[{ev:'crit',burn:2,icd:.3}]});
I('slowmatch','Slow Match',1,0,'X','privateer','fuse',{on:[{ev:'use',tag:'C',burn:1,icd:.2}]});
I('wildfire','Wildfire',2,0,'X','privateer','flame',{on:[{ev:'burn',dmg:2,icd:.4}]});
I('blackflag','Black Flag',1,0,'','privateer','flag',{start:{slow:[2,2],burn:3}});
I('phoenix','Phoenix Figurehead',2,0,'X','privateer','figure',{on:[{ev:'lowhp',heal:30,burn:10}]});
/* THE LOTUS: healing, poison, food and tea, slows and calm */
I('lime','Lime Crate',1,7,'F','junk','lime',{heal:10,cleanse:1});
I('pump','Bilge Pump',2,5,'T','junk','pump',{heal:8,douse:2});
I('puffer','Pufferfish',1,6,'V','junk','puffer',{poison:2});
I('galley','Galley Stove',2,0,'X','junk','galley',{tagHeal:['F',.5]});
I('teapot','Teapot',1,6,'F','junk','teapot',{heal:9,cleanse:1});
I('jasmine','Jasmine Tea',1,4,'F','junk','cup',{heal:5});
I('ginseng','Ginseng Root',1,8,'F','junk','root',{heal:10,grow:{heal:3}});
I('kelp','Kelp Wrap',1,5,'F','junk','kelp',{heal:6,shield:4});
I('ricebowl','Rice Bowl',1,6,'F','junk','bowl',{heal:8,charge:['adj',1]});
I('noodles','Noodle Pot',2,9,'F','junk','bowl',{heal:20});
I('dumplings','Dumplings',1,5,'F','junk','bowl',{heal:7});
I('serpentwine','Serpent Wine',1,6,'F,V','junk','bottle',{heal:5,poison:2});
I('scorpion','Pickled Scorpion',1,6,'F,V','junk','jar',{heal:3,poison:3});
I('fugu','Fugu Knife',1,5,'W,V','junk','dagger',{dmg:4,poison:2});
I('darts','Venom Darts',1,4,'W,V','junk','dart',{dmg:2,multi:2,poisonPerHit:1});
I('blowpipe','Blowpipe',2,6,'W,V','junk','pipe',{poison:4});
I('moray','Moray Eel',1,6,'W,V','junk','eel',{dmg:6,poison:2,pierce:1});
I('seasnake','Sea Snake',1,7,'V','junk','snake',{poison:3,slow:[1,1]});
I('jellyfish','Jellyfish Jar',2,8,'V','junk','jar',{poison:5,slow:[2,1.5]});
I('glowcap','Glowcap',1,7,'V','junk','mushroom',{poison:2,grow:{poison:1}});
I('miasma','Miasma Censer',2,9,'V','junk','incense',{poison:6});
I('toxinsac','Toxin Sac',1,6,'V','junk','jar',{dmg:2,dmgX:['enemyPoison',1]});
I('whisper','Whispering Reed',1,6,'T','junk','reed',{slow:[2,1],poison:1});
I('bamboo','Bamboo Staff',2,4,'W','junk','staff',{dmg:7,slow:[1,.8]});
I('guandao','Guandao',3,8,'W','junk','spear',{dmg:30,slow:[1,1]});
I('chakram','Chakram',1,4,'W','junk','ring',{dmg:5,multi:2});
I('fan','Paper Fan',1,5,'T','junk','fan',{slow:[1,1.5],douse:1});
I('dragonkite','Dragon Kite',2,8,'T','junk','kite',{slow:[3,1.5]});
I('stillwater','Still Water',2,10,'T','junk','bowl',{slow:[4,2],heal:8});
I('pearlpowder','Pearl Powder',1,7,'T','junk','pearl',{heal:6,cleanse:1,douse:2});
I('antidote','Antidote',1,9,'T','junk','bottle',{heal:10,cleanse:1});
I('acupuncture','Acupuncture',1,5,'T','junk','needle',{charge:['adj',1],heal:3});
I('tidebell','Tidecaller Bell',1,8,'T','junk','bell',{healX:['tag:F',4]});
I('lacquer','Lacquer Shield',2,6,'A','junk','shieldkite',{shield:12,on:[{ev:'heal',shield:2,icd:.3}]});
I('clam','Giant Clam',2,8,'A','junk','shell',{shield:18,heal:6});
I('tortoiseshell','Tortoiseshell',1,6,'A','junk','shell',{shield:8,heal:4});
I('herbalist','Herbalist',1,7,'K','junk',{hat:'hood'},{heal:8,charge:['adj',1]});
I('monk','Tide Monk',1,6,'K','junk',{hat:'hood',beard:1},{heal:5,shield:6});
I('cormorant','Cormorant',1,5,'K','junk','bird',{dmg:5,heal:3});
I('lotuslamp','Lotus Lantern',1,0,'','junk','lantern',{tagHeal:['F',.25]});
I('abacus','Abacus',1,0,'','junk','abacus',{tagPoison:['V',1]});
I('incense','Incense',1,0,'','junk','incense',{regen:1});
I('koi','Koi Pond',2,0,'','junk','koi',{regen:2});
I('lanternrow','Lantern String',2,0,'','junk','lantern',{adjHeal:4,adjCd:.1});
I('jade','Jade Talisman',1,0,'','junk','jade',{hpBonus:25,regen:1});
I('nettle','Nettle Poultice',1,0,'','junk','herb',{on:[{ev:'hurt',poison:1,icd:.5}]});
I('lotusflower','Lotus Blossom',1,0,'','junk','lotus',{on:[{ev:'heal',charge:['rand1',.4],icd:.3}]});
I('moongate','Moon Gate',2,0,'','junk','gate',{on:[{ev:'lowhp',heal:40,cleanse:1}]});
/* crew portraits for hires who were never cargo (see CREW in world.js) */
I('witch','Sea Witch',1,0,'K','any',{hat:'hood',hair:1},{});
I('apothecary','Apothecary',1,0,'K','any',{hat:'hood'},{});
I('chemist','Powder Chemist',1,0,'K','any',{hat:'bandana',patch:1},{});

const DEFS={};CI.forEach(([k,n,s,cd,tags,ship,g,f])=>{DEFS[k]=Object.assign({n,s,cd,tags:tags?tags.split(','):[],ship},f,typeof g==='string'?{i:g}:{look:g})});
const KEYS=Object.keys(DEFS);
const SHIPKEYS=['sloop','galleon','privateer','junk'];
const TAGN={W:'Weapon',C:'Cannon',F:'Food',X:'Fire',T:'Tool',A:'Armor',R:'Rigging',V:'Venom',K:'Crew'};
const TIER=['Bronze','Silver','Gold','Diamond'];
const M=[1,2,3,4];
const BELL=30;
/* every hold in the game has 9 slots, yours and every enemy's. Nothing may ever add slots; Double Planking only takes one away. */
const HOLD=9;
const price=(k,t)=>({1:3,2:6,3:9})[DEFS[k].s]*[1,2,4,8][t];
const sellP=(k,t)=>hasC('cove')?price(k,t):Math.max(1,Math.floor(price(k,t)/2));
const used=l=>l.reduce((a,b)=>a+DEFS[b.k].s,0);
const isPassive=k=>!DEFS[k].cd;
function rollTier(depth,r){r=r||Math.random;const x=r();if(depth>=16&&x<.15)return 3;if(depth>=11&&x<.38)return 2;if(depth>=5&&x<.68)return 1;return 0}
const isCrewKey=k=>DEFS[k].tags.includes('K');
/* ---------- item classes: every item belongs to the crew (a hand wields it) or the ship (it works on its own), and is a weapon,
   haste, heal or shield. A crew item only works if someone aboard masters its class (CREW masters). An element (fire, venom,
   blessed) can sit on top. One code per item: c or s, then w, x, h or s, then f, v or b for an element. Items not listed here
   (retired ones in old saves) are worked out by clsGuess(). ---------- */
const ICLS={dagger:'cw',pins:'cw',cutlass:'cw',harpoon:'cw',fenders:'ss',pork:'ch',tar:'sh',hook:'cx',net:'cx',compass:'sx',chest:'s',spyglass:'cx',
  sail:'sx',rum:'cx',crows:'sw',eel:'cw',jib:'sx',mainsail:'sx',topsail:'sx',flyingjib:'sx',spinnaker:'sx',rapier:'cw',stiletto:'cw',twinblades:'cw',swordcane:'cw',
  sabre:'cw',cutlass2:'cw',boathook:'cw',quickdraw:'cw',flintlock:'cw',pistols:'cw',lastword:'cw',jollyboat:'sw',windlass:'sx',sandglass:'sx',kite:'sx',
  slipstream:'sx',grog:'ch',duelglove:'cw',figure8:'sx',tailwind:'cxb',windvane:'sx',bowsprit:'sx',
  plating:'ss',ballast:'ss',anchor:'sw',figure:'ssb',chain:'sw',bulkhead:'ss',breastplate:'cs',pavise:'cs',chainmail:'cs',bastion:'ss',tortoise:'cs',fortress:'ss',
  ram:'sw',shieldbash:'cw',gauntlet:'cw',crusher:'sw',carronade:'sw',broadaxe:'cw',halberd:'cw',maul:'cw',grapeshot:'sw',heavyshot:'sw',capstan:'ss',drydock:'sh',
  oak:'ss',ironbound:'ss',keel:'ss',lastline:'cs',counterweight:'sw',standard:'ssb',
  cannon:'swf',mortar:'swf',swivel:'sw',keg:'swf',flare:'cwf',firepot:'cwf',blunderbuss:'cwf',grenado:'cwf',hotshot:'swf',broadside:'sw',bombard:'swf',twinswivel:'sw',
  crossfire:'sw',rocket:'swf',burstkeg:'swf',petard:'cwf',brand:'cwf',greekfire:'swf',fireship:'swf',hellburner:'swf',coalpan:'swf',linstock:'cx',cartridges:'cx',
  powderhorn:'cwf',ramrod:'cx',tinderbox:'swf',furnace:'swf',kindling:'sxf',gunwale:'sx',magazine:'swf',phoenix:'shf',
  lime:'ch',pump:'sh',puffer:'cwv',galley:'sh',teapot:'ch',ginseng:'ch',kelp:'ch',ricebowl:'ch',noodles:'ch',scorpion:'chv',fugu:'cwv',darts:'cwv',blowpipe:'cwv',
  moray:'cwv',seasnake:'cwv',jellyfish:'cwv',glowcap:'cwv',miasma:'cwv',toxinsac:'cwv',guandao:'cw',chakram:'cw',dragonkite:'cx',stillwater:'chb',lacquer:'cs',
  clam:'ss',abacus:'cwv',koi:'shb',jade:'chb',nettle:'cwv',moongate:'shb'};
const CLSN={cw:'Crew weapon',cs:'Crew shield',ch:'Crew heal',cx:'Crew haste',sw:'Ship weapon',ss:'Ship shield',sh:'Ship heal',sx:'Ship haste',s:'Ship cargo'};
const ELN={f:'Fire',v:'Venom',b:'Blessed'};
/* a best guess for anything not in ICLS: cannons, rigging and hull armour belong to the ship, the rest to the crew */
function clsGuess(d){const t=d.tags,has=k=>d[k]!=null||(d.start&&d.start[k]!=null)||(d.on||[]).some(h=>h[k]!=null);
  const ship=t.includes('C')||t.includes('R')||(t.includes('A')&&!/plate|mail|gauntlet|helm|buckler/i.test(d.n));
  const c=has('dmg')||has('dmgX')||has('burn')||has('poison')||d.adjDmg||d.tagDmg||d.adjCrit||d.tagCrit||d.tagBurn||d.tagPoison?'w':has('heal')||has('healX')||d.regen||d.adjHeal||d.tagHeal?'h':has('shield')||has('shieldX')||d.hpBonus||d.adjShield||d.tagShield?'s':'x';
  const e=t.includes('X')||has('burn')||has('burnPerHit')?'f':t.includes('V')||has('poison')||has('poisonPerHit')?'v':'';
  return(ship?'s':'c')+c+e}
const CLSC={};
/* an item's class: {kind:'crew'|'ship', cls:'cw'..'sx' (or 's' for plain ship cargo), el:'f'|'v'|'b'|''} */
function clsOf(k){if(CLSC[k])return CLSC[k];const d=DEFS[k],code=ICLS[k]||clsGuess(d),cls=code[1]?code.slice(0,2):code;
  return CLSC[k]={kind:code[0]==='c'?'crew':'ship',cls,el:code[2]||''}}
const isCrewItem=k=>clsOf(k).kind==='crew';
/* items retired from the draw: they never turn up in markets, spoils, gifts or enemy holds any more, but they stay defined so
   saved voyages that carry one keep working, and an Atlas that found one still shows it. Each ship keeps about 30 of its own,
   a steady mix of damage, support and defence, so items come back often enough to upgrade and build around. */
const RETIRED=new Set([
  // the Wren: near-duplicate blades, overlapping charge tools, and passives that rarely mattered
  'riposte','monkeyfist','marlinspike','tackle','bell','gale','oar','logline','lightrig','pennant',
  // the Bulwark: weaker copies of its armor and hammers, small heals and niche passives
  'anchorchain','ballista','ironclad','sandbags','watertight','mooring','hullpatch','resolve','beacon','barnacles','buttress','bulwarkwall','dropanchor',
  // the Ember: the tiniest guns and fire pieces, and passives that doubled up
  'incendiary','pepperbox','fireworks','firearrows','barshot','scorch','fuse','sparks','smokepot','slowmatch','wildfire','blackflag',
  // the Lotus: small snacks, doubled cures and calm pieces, and passives that doubled up
  'jasmine','dumplings','serpentwine','bamboo','whisper','fan','pearlpowder','antidote','acupuncture','tidebell','tortoiseshell','lotuslamp','incense','lanternrow','lotusflower'
]);
function poolFor(ship){return KEYS.filter(k=>DEFS[k].ship===ship&&!isCrewKey(k)&&!RETIRED.has(k))}
const NEUTRAL=KEYS.filter(k=>DEFS[k].ship==='any'&&!isCrewKey(k)&&!RETIRED.has(k));
function drawKey(r,ship){ship=ship||(G&&G.ship)||pick(r,SHIPKEYS);return r()<.2?pick(r,NEUTRAL):pick(r,poolFor(ship))}

/* ---------- crafts: every ability belongs to one. On your ship an ability only works if someone on deck has its craft. Enemies need no crew. ---------- */
const CRAFTS={cw:'Crew weapons',cs:'Crew shields',ch:'Crew heals',cx:'Crew haste',sw:'Ship weapons',ss:'Ship shields',sh:'Ship heals',sx:'Ship haste'};
const KEYCRAFT={dmg:'dmg',dmgX:'dmg',multi:'dmg',crit:'dmg',pierce:'dmg',burn:'fire',burnPerHit:'fire',poison:'alch',poisonPerHit:'alch',
  heal:'med',healX:'med',cleanse:'med',douse:'med',shield:'carp',shieldX:'carp',haste:'sea',charge:'sea',slow:'sea'};
const AURACRAFT={adjDmg:'steel',adjCrit:'steel',adjCd:'sea',adjPre:'sea',edgeCd:'sea',emptyCd:'sea',tagCd:'sea',tagPre:'sea',adjShield:'carp',tagShield:'carp',
  adjHeal:'med',tagHeal:'med',adjBurn:'fire',tagBurn:'fire',adjPoison:'alch',tagPoison:'alch',hpBonus:'carp',regen:'med'};
const dmgCraft=d=>d.tags.includes('C')?'gun':'steel';
const keyCraft=(key,d)=>{const c=KEYCRAFT[key];return c==='dmg'?dmgCraft(d):c||null};
const auraCraft=(key,a)=>{if(key==='tagDmg'||key==='tagCrit')return a[key][0]==='C'?'gun':'steel';return AURACRAFT[key]||null};
const GROWCRAFT={dmg:'dmg',shield:'carp',heal:'med',burn:'fire',poison:'alch'};
/* drop the abilities nobody aboard can work. ok(craft) says if a craft is covered. */
function gateFx(f,d,ok){if(!f)return f;const o={};let n=0;
  for(const key in f){if(key==='ev'||key==='tag'||key==='icd'){o[key]=f[key];continue}
    if(key==='grow'){const g={};for(const s in f.grow){const c=GROWCRAFT[s]==='dmg'?dmgCraft(d):GROWCRAFT[s];if(ok(c))g[s]=f.grow[s]}if(Object.keys(g).length){o.grow=g;n++}continue}
    const c=keyCraft(key,d);if(c&&!ok(c))continue;o[key]=f[key];if(FXKEYS.includes(key))n++}
  return n?o:null}
/* every craft an item's abilities use */
function itemCraftsOld(k){const d=DEFS[k],s=new Set(),add=f=>{if(!f)return;for(const key in f){if(key==='grow'){for(const g in f.grow)s.add(GROWCRAFT[g]==='dmg'?dmgCraft(d):GROWCRAFT[g]);continue}const c=keyCraft(key,d);if(c)s.add(c)}};
  add(pickFx(d));add(d.start);(d.on||[]).forEach(add);for(const key in AURACRAFT)if(d[key]!=null)s.add(auraCraft(key,d));if(d.tagDmg)s.add(auraCraft('tagDmg',d));if(d.tagCrit)s.add(auraCraft('tagCrit',d));
  return s}
/* the class a hand must master to wield an item: a crew item's class, or nothing for ship cargo (it works on its own) */
function itemCrafts(k){const c=clsOf(k);return new Set(c.kind==='crew'?[c.cls]:[])}
/* can your crew wield it? cr is crewCrafts(), the classes your hands master (null outside a voyage: everything works) */
const wields=(k,cr)=>!cr||!isCrewItem(k)||cr.has(clsOf(k).cls);
/* how much of an item your crew can use: 'all', 'some' or 'none' */
function itemUse(k,cr){if(!cr)return'all';const c=[...itemCrafts(k)];if(!c.length)return'all';const n=c.filter(x=>cr.has(x)).length;return n===c.length?'all':n?'some':'none'}

/* ---------- scaling by tier ---------- */
const AMT=['dmg','shield','heal','selfDmg','douse'],DOT=['burn','poison','burnPerHit','poisonPerHit'],DM=[1,1.6,2.2,2.8];
function scaleFx(f,t){if(!f)return null;const m=M[t],q=1+.25*t,o={};
  for(const key in f){const v=f[key];
    if(AMT.includes(key))o[key]=Math.round(v*m);
    else if(DOT.includes(key))o[key]=Math.round(v*DM[t]);
    else if(key==='crit')o[key]=v*q;
    else if(key==='slow')o[key]=[v[0],+(v[1]*q).toFixed(1)];
    else if(key==='haste'||key==='charge')o[key]=[v[0],+(v[1]*q).toFixed(1)];
    else if(key==='dmgX'||key==='shieldX'||key==='healX'){const c=v[0].startsWith('tag:')||v[0]==='empty';o[key]=[v[0],c?Math.round(v[1]*m):+(v[1]*q).toFixed(2)]}
    else if(key==='grow'){o.grow={};for(const s in v)o.grow[s]=Math.round(v[s]*(s==='burn'||s==='poison'?DM[t]:m))}
    else o[key]=v}
  return o}
const auraV=(v,t,ratio,dot)=>ratio?+(v*(1+.25*t)).toFixed(3):Math.round(v*(dot?DM[t]:M[t]));

/* item stats in context: its own effect, scaled, plus every aura from the rest of the hold */
function statsOf(list,i,cr){
  const it=list[i],d=DEFS[it.k],t=it.t,tags=d.tags,mine=wields(it.k,cr),ok=()=>mine;
  const fx=gateFx(scaleFx(pickFx(d),t),d,ok)||{},s={cd:d.cd||0,fx,start:gateFx(scaleFx(d.start,t),d,ok),on:(d.on||[]).map(h=>gateFx(Object.assign(scaleFx(h,t),{ev:h.ev,tag:h.tag,icd:h.icd}),d,ok)).filter(Boolean),pre:0,boost:[],W:tags.includes('W')};
  const last=list.length-1,empty=(cr&&typeof holdCap==='function'&&G?holdCap():HOLD)-used(list);
  list.forEach((o,j)=>{if(j===i)return;const a=DEFS[o.k],tj=o.t,adj=Math.abs(j-i)===1,nm=a.n;
    let key0='';const add=(cond,apply)=>{if(cond&&wields(o.k,cr)){apply();if(!s.boost.includes(nm))s.boost.push(nm)}};
    if(adj){
      if(a.adjDmg&&(key0='adjDmg'))add(s.W&&fx.dmg!=null,()=>fx.dmg+=auraV(a.adjDmg,tj));
      if(a.adjCd&&(key0='adjCd'))add(s.cd>0,()=>s.cd*=1-auraV(a.adjCd,tj,1));
      if(a.adjCrit&&(key0='adjCrit'))add(s.W,()=>fx.crit=(fx.crit||0)+auraV(a.adjCrit,tj,1));
      if(a.adjPre&&(key0='adjPre'))add(s.cd>0,()=>s.pre+=auraV(a.adjPre,tj,1));
      if(a.adjShield&&(key0='adjShield'))add(fx.shield!=null,()=>fx.shield+=auraV(a.adjShield,tj));
      if(a.adjHeal&&(key0='adjHeal'))add(fx.heal!=null,()=>fx.heal+=auraV(a.adjHeal,tj));
      if(a.adjBurn&&(key0='adjBurn'))add(fx.burn!=null||fx.burnPerHit!=null,()=>{if(fx.burn!=null)fx.burn+=auraV(a.adjBurn,tj,0,1);else fx.burnPerHit+=auraV(a.adjBurn,tj,0,1)});
      if(a.adjPoison&&(key0='adjPoison'))add(fx.poison!=null,()=>fx.poison+=auraV(a.adjPoison,tj,0,1))}
    const tg=(key,f)=>{const v=a[key];if(v&&tags.includes(v[0])){key0=key;f(v[1])}};
    tg('tagDmg',v=>add(fx.dmg!=null,()=>fx.dmg+=auraV(v,tj)));
    tg('tagCd',v=>add(s.cd>0,()=>s.cd*=1-auraV(v,tj,1)));
    tg('tagCrit',v=>add(fx.dmg!=null,()=>fx.crit=(fx.crit||0)+auraV(v,tj,1)));
    tg('tagHeal',v=>add(fx.heal!=null,()=>fx.heal=Math.round(fx.heal*(1+auraV(v,tj,1)))));
    tg('tagShield',v=>add(fx.shield!=null,()=>fx.shield+=auraV(v,tj)));
    tg('tagBurn',v=>add(fx.burn!=null,()=>fx.burn+=auraV(v,tj,0,1)));
    tg('tagPoison',v=>add(fx.poison!=null,()=>fx.poison+=auraV(v,tj,0,1)));
    tg('tagPre',v=>add(s.cd>0,()=>s.pre+=auraV(v,tj,1)));
    if(a.edgeCd&&(key0='edgeCd'))add(s.cd>0&&(i===0||i===last),()=>s.cd*=1-auraV(a.edgeCd,tj,1));
    if(a.emptyCd&&(key0='emptyCd'))add(s.cd>0&&empty>0,()=>s.cd*=1-Math.min(.5,auraV(a.emptyCd,tj,1)*empty));
  });
  if(fx.dmg==null&&fx.dmgX)fx.dmg=0;
  s.cd=Math.round(s.cd*10)/10;if(fx.crit)fx.crit=Math.min(.9,fx.crit);s.pre=Math.min(.9,s.pre);
  return s;
}
const FXKEYS=['dmg','multi','crit','pierce','burnPerHit','poisonPerHit','dmgX','shield','shieldX','heal','healX','burn','poison','slow','haste','charge','cleanse','douse','selfDmg','grow'];
function pickFx(d){const o={};let any=false;FXKEYS.forEach(k=>{if(d[k]!=null){o[k]=d[k];any=true}});return any?o:null}
function sideOf(list,cr){const o={hp:0,regen:0,gold:0};list.forEach(it=>{const d=DEFS[it.k],ok=()=>wields(it.k,cr);if(d.hpBonus&&ok())o.hp+=auraV(d.hpBonus,it.t);if(d.regen&&ok())o.regen+=auraV(d.regen,it.t);if(d.gold)o.gold+=auraV(d.gold,it.t)});return o}

/* ---------- words for effects ---------- */
const pc=v=>Math.round(v*100)+'%';
const TGT={adj:'adjacent items',left:'the item to its left',right:'the item to its right',all:'all your items',self:'this item',rand1:'a random item of yours',rand2:'2 random items of yours'};
const tgtName=t=>t.startsWith('tag:')?`your ${TAGN[t.slice(4)]} items`:TGT[t];
function xName(x){const[from,r]=x;
  if(from==='shield')return`${pc(r)} of your shield`;if(from==='enemyBurn')return`${pc(r)} of the enemy's burn`;if(from==='enemyPoison')return`${pc(r)} of the enemy's poison`;
  if(from==='missing')return`${pc(r)} of your missing health`;if(from==='empty')return`${r} for each empty hold slot`;return`${r} for each ${TAGN[from.slice(4)]} item you carry`}
/* the words for an effect, as [text, craft] pairs. dc is the item's damage craft (Steel or Gunnery). */
function fxWords(f,dc){const L=[],P=(t,c)=>L.push([t,c]);if(!f)return L;dc=dc||'steel';
  if(f.dmg!=null||f.dmgX){let t=f.dmgX?(f.dmg?`Deal ${f.dmg} damage plus ${xName(f.dmgX)}`:`Deal damage equal to ${xName(f.dmgX)}`):`Deal ${f.dmg} damage`;
    if(f.multi>1)t+=`, ${f.multi} times`;t+='.';if(f.pierce)t+=' Ignores shield.';P(t,dc);
    if(f.burnPerHit)P(`Each hit burns for ${f.burnPerHit}.`,'fire');if(f.poisonPerHit)P(`Each hit poisons for ${f.poisonPerHit}.`,'alch')}
  if(f.crit)P(`${pc(f.crit)} crit chance.`,dc);
  if(f.shield!=null||f.shieldX)P(f.shieldX?(f.shield?`Gain ${f.shield} shield plus ${xName(f.shieldX)}.`:`Gain shield equal to ${xName(f.shieldX)}.`):`Gain ${f.shield} shield.`,'carp');
  if(f.heal!=null||f.healX)P((f.healX?(f.heal?`Heal ${f.heal} plus ${xName(f.healX)}`:`Heal ${xName(f.healX)}`):`Heal ${f.heal}`)+'.','med');
  if(f.burn)P(`Burn the enemy for ${f.burn}.`,'fire');
  if(f.poison)P(`Poison the enemy for ${f.poison}.`,'alch');
  if(f.slow)P(`Slow ${f.slow[0]===1?'an enemy item':f.slow[0]+' enemy items'} for ${f.slow[1]}s.`,'sea');
  if(f.haste)P(`Haste ${tgtName(f.haste[0])} for ${f.haste[1]}s.`,'sea');
  if(f.charge)P(`Charge ${tgtName(f.charge[0])} by ${f.charge[1]}s.`,'sea');
  if(f.cleanse)P('Remove all your poison.','med');
  if(f.douse)P(`Remove ${f.douse} of your burn.`,'med');
  if(f.selfDmg)P(`Costs you ${f.selfDmg} health.`,null);
  if(f.grow)for(const k in f.grow)P(`Gains +${f.grow[k]} ${k==='dmg'?'damage':k} each use this fight.`,GROWCRAFT[k]==='dmg'?dc:GROWCRAFT[k]);
  return L}
const EVN={crit:'When you crit',burn:'When you apply burn',poison:'When you apply poison',shield:'When you gain shield',heal:'When you heal',hurt:'When a weapon hits you',lowhp:'The first time you drop below half health',haste:'When you haste an item',adjUse:'When an adjacent item is used'};
/* the item's text. Enemy lists are marked .enemy and never greyed out; everything else is read against your crew. */
/* an upgrade, previewed: what your matching item says now and after, with changed numbers shown as "6 → 10" */
function upgradeView(it){const m=findMatch(it);if(!m)return null;const b=m.list[m.i],to=Math.max(b.t+1,it.t),copy=m.list.slice();copy[m.i]={k:b.k,t:to};
  const cr=crewCrafts(),A=describe(m.list,m.i,cr).L,Bl=describe(copy,m.i,cr).L,cd0=statsOf(m.list,m.i,cr).cd,cd1=statsOf(copy,m.i,cr).cd;
  const diff=(x,y)=>{const sx=x.split(/(<[^>]+>)/),sy=y.split(/(<[^>]+>)/);if(sx.length!==sy.length)return y;
    return sy.map((seg,k)=>{if(seg.startsWith('<'))return seg;const nx=sx[k].split(/(\d+(?:\.\d+)?%?)/),ny=seg.split(/(\d+(?:\.\d+)?%?)/);if(nx.length!==ny.length)return seg;
      return ny.map((p,q)=>q%2&&p!==nx[q]?`<s class="was">${nx[q]}</s> → <b class="now">${p}</b>`:p).join('')}).join('')};
  return{from:b.t,to,lines:Bl.map((y,k)=>A[k]!=null?diff(A[k],y):y),cd:cd0!==cd1?[cd0,cd1]:null}}
function upgradeHTML(it){const u=upgradeView(it);if(!u)return null;
  return`<p class="upgr">Upgrades your ${DEFS[it.k].n}: ${TIER[u.from]} → <b>${TIER[u.to]}</b></p>${u.cd?`<p class="upgr-cd">Cooldown <s class="was">${u.cd[0]}s</s> → <b class="now">${u.cd[1]}s</b></p>`:''}<p class="desc">${u.lines.join(' ')}</p>`}
function describe(list,i,cr){
  if(cr===undefined)cr=list.enemy?null:crewCrafts();
  const it=list[i],d=DEFS[it.k],t=it.t,s=statsOf(list,i,cr),full=statsOf(list,i),L=[],g=new Set(),dc=dmgCraft(d),C=clsOf(it.k),on=wields(it.k,cr);
  const abl=t=>on?t:`<span class="ab off"><span class="abt">${t}</span></span>`;
  if(C.kind==='crew'&&cr){const m=masterOf(C.cls);L.push(on?`<span class="wield">${craftIcon(C.cls)}Wielded by your ${CREW[m].n}.</span>`:`<span class="wield off">${craftIcon(C.cls)}Needs ${an(CREW[m].n)} aboard to wield.</span>`)}
  const A=(key,f)=>{if(d[key]!=null)L.push(abl(f(d[key])))};
  A('adjDmg',v=>`Adjacent weapons deal +${auraV(v,t)} damage.`);
  A('adjCd',v=>`Adjacent items charge ${pc(auraV(v,t,1))} faster.`);
  A('adjCrit',v=>`Adjacent weapons get +${pc(auraV(v,t,1))} crit chance.`);
  A('adjPre',v=>`Adjacent items start fights ${pc(auraV(v,t,1))} charged.`);
  A('adjShield',v=>`Adjacent shield items give +${auraV(v,t)} shield.`);
  A('adjHeal',v=>`Adjacent healing items heal +${auraV(v,t)}.`);
  A('adjBurn',v=>`Adjacent burn items burn +${auraV(v,t,0,1)} more.`);
  A('adjPoison',v=>`Adjacent poison items poison +${auraV(v,t,0,1)} more.`);
  A('tagDmg',v=>`Your ${TAGN[v[0]]} items deal +${auraV(v[1],t)} damage.`);
  A('tagCd',v=>`Your ${TAGN[v[0]]} items charge ${pc(auraV(v[1],t,1))} faster.`);
  A('tagCrit',v=>`Your ${TAGN[v[0]]} items get +${pc(auraV(v[1],t,1))} crit chance.`);
  A('tagHeal',v=>`Your ${TAGN[v[0]]} items heal ${pc(auraV(v[1],t,1))} more.`);
  A('tagShield',v=>`Your ${TAGN[v[0]]} items give +${auraV(v[1],t)} shield.`);
  A('tagBurn',v=>`Your ${TAGN[v[0]]} items burn +${auraV(v[1],t,0,1)} more.`);
  A('tagPoison',v=>`Your ${TAGN[v[0]]} items poison +${auraV(v[1],t,0,1)} more.`);
  A('tagPre',v=>`Your ${TAGN[v[0]]} items start fights ${pc(auraV(v[1],t,1))} charged.`);
  A('edgeCd',v=>`Your leftmost and rightmost items charge ${pc(auraV(v,t,1))} faster.`);
  A('emptyCd',v=>`Your items charge ${pc(auraV(v,t,1))} faster for each empty hold slot.`);
  A('hpBonus',v=>`+${auraV(v,t)} max health.`);
  A('regen',v=>`Heal ${auraV(v,t)} every second.`);
  A('gold',v=>`Earn +${auraV(v,t)} gold for every fight you win.`);
  const low=([x])=>x[0].toLowerCase()+x.slice(1);
  fxWords(full.fx,dc).forEach(([x])=>L.push(abl(x)));
  if(full.start)L.push(abl('When a fight starts: '+fxWords(full.start,dc).map(low).join(' ')));
  full.on.forEach(h=>L.push(abl(`${h.ev==='use'?`When you use a ${TAGN[h.tag]} item`:EVN[h.ev]}: `+fxWords(h,dc).map(low).join(' '))));
  if(s.pre&&d.cd)L.push(`Starts fights ${pc(s.pre)} charged.`);
  if(s.boost.length)L.push(`Boosted by your ${s.boost.join(', ')}.`);
  const all=[full.fx,full.start,...full.on];
  all.forEach(f=>{if(!f)return;if(f.burn||f.burnPerHit)g.add('Burn hits every half second, then drops by 1.');if(f.poison||f.poisonPerHit)g.add('Poison hits every second and ignores shield.');
    if(f.slow)g.add('Slowed items charge at half speed.');if(f.haste)g.add('Hasted items charge at double speed.');if(f.charge)g.add('Charging moves an item\'s cooldown forward.')});
  return{s,L,g:[...g],tags:[CLSN[C.cls]].concat(C.el?[ELN[C.el]]:[])};
}
