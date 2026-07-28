/* ═══════════════════════════════════════════════════════════════
   fog.js — the unexplored map.

   A veil of cloud over the whole screen, with a soft-edged hole
   punched through it at every place she has uncovered. The holes are
   positioned in screen pixels and re-projected each frame, so they
   follow the map as she pans and grow as it zooms out.

   Screen-space on purpose. The obvious approach — scattering cloud
   puffs across the map itself — cannot work here: the journey spans
   from a single campus to an ocean, so a puff sized for San Diego is
   invisible over the Atlantic and a puff sized for the Atlantic covers
   California whole. A fixed-size veil is right at every zoom, and
   costs one screen-sized paint no matter how far out she is.
   ═══════════════════════════════════════════════════════════════ */

import { PLACES } from './places.js';
import { placeXY, chapterSpan, worldToScreen, pxPerUnit } from './map.js';

const NS = 'http://www.w3.org/2000/svg';

/* How much each place uncovers, as a fraction of its own framing. Small
   enough that cloud always sits at the edges of the frame — the world
   should feel bigger than the part of it she has seen. */
const CLEARING = 0.30;
const FEATHER = 1.7;          // hole radius vs. its solid centre
/* …but never smaller than this on screen. A campus really is a speck
   at ocean scale, and without a floor the places she has already found
   shrink to invisible dots the moment the map pulls back for Sicily. */
const MIN_HOLE_PX = 86;

const holes = new Map();      // chapter index → <circle>
let holesG = null;
let veil = null;

export function initFog() {
  holesG = document.getElementById('fog-holes');
  veil = document.getElementById('fogveil');
}

/* Part the clouds over one place. */
export function clearFog(i, { instant = false } = {}) {
  if (holes.has(i)) return;
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('fill', 'url(#fog-hole)');
  c.setAttribute('r', '0');
  c.dataset.grow = instant ? '1' : '0';
  c._t = instant ? 1 : 0;                 // 0 → 1 as the hole opens
  holesG.appendChild(c);
  holes.set(i, c);
  veil?.classList.add('lifting');
}

export const isCleared = (i) => holes.has(i);

/* Re-project the holes. Called from main.js's single rAF loop. */
export function tickFog(dt) {
  if (!holesG) return;
  for (const [i, c] of holes) {
    if (c._t < 1) c._t = Math.min(1, c._t + dt / 1400);
    const { x, y } = placeXY(i);
    const s = worldToScreen(x, y);
    const r = Math.max(chapterSpan(i) * CLEARING * pxPerUnit() * FEATHER, MIN_HOLE_PX);
    // ease the opening so the cloud draws back rather than snapping
    const e = 1 - Math.pow(1 - c._t, 3);
    c.setAttribute('cx', s.x.toFixed(1));
    c.setAttribute('cy', s.y.toFixed(1));
    c.setAttribute('r', Math.max(0, r * e).toFixed(1));
  }
}
