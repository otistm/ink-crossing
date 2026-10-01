/* Ink Crossing: every character's portrait, built from Open Peeps (CC0, by Pablo Stanley) the way the set is meant to be used:
   a body, a head (hair or hat), a face, facial hair and an accessory, stacked at fixed spots. The parts themselves live in
   peep-parts.js, copied from the atoms by tools/peeps.mjs. A look ({body,head,face,beard,acc}) names one part per layer. */
"use strict";
// where each layer sits in the Open Peeps bust (1136 by 1533), and the scale down to our 240 by 324 bust
const PEEP_ORDER=['body','head','face','beard','acc'];
const PEEP_AT={body:[147,639],head:[372,180],face:[531,366],beard:[495,518],acc:[419,421]},PEEP_SCALE=240/1136;
const PEEP_BASE={body:'Tee 1',head:'Short 1',face:'Calm'};
const PEEP_BUST='0 0 240 324',PEEP_HEAD='62 30 132 132';   // the whole bust, and a crop to head and shoulders for round portraits
/* a portrait's layers from a look (body, head and face fall back to the base); drawn in the 240 by 324 frame */
function peepLayers(look){const L=Object.assign({},PEEP_BASE,look||{});
  return`<g transform="scale(${PEEP_SCALE.toFixed(5)})" fill="none" stroke="none" fill-rule="evenodd">${PEEP_ORDER.map(s=>{const p=L[s]&&PEEP_PARTS[s][L[s]];
    return p?`<g transform="translate(${PEEP_AT[s][0]} ${PEEP_AT[s][1]})">${p}</g>`:''}).join('')}</g>`}
function peep(look,view,cls){return`<svg class="${cls||'peep'}" viewBox="${view||PEEP_BUST}" aria-hidden="true">${peepLayers(look)}</svg>`}
/* standing, head to toe: a pose from the set (look.pose, else PEEP_POSE) with the look's head, face, beard and accessory,
   placed as in Open Peeps' standing figure (1179 by 3291, feet at the bottom). Used on the pier in the harbour. */
const PEEP_STAND_AT={pose:[-121,634],head:[404,180],face:[563,366],beard:[527,518],acc:[451,421]},PEEP_POSE='resting-1',PEEP_FEET=3134;
function peepStanding(look){const L=Object.assign({},PEEP_BASE,{pose:PEEP_POSE},look||{});
  return`<g fill="none" stroke="none" fill-rule="evenodd">${['pose','head','face','beard','acc'].map(s=>{const p=L[s]&&PEEP_PARTS[s]&&PEEP_PARTS[s][L[s]];
    return p?`<g transform="translate(${PEEP_STAND_AT[s][0]} ${PEEP_STAND_AT[s][1]})">${p}</g>`:''}).join('')}</g>`}
/* a crew member's face for the round portraits in the tavern, the crew strip, the ship card and the desk */
const crewFace=k=>peep(CREW[k]&&CREW[k].look,PEEP_HEAD);
