/* ═══════════════════════════════════════════════════════════════
   places.js — chapters are pages; places are pins.

   Most places hold a single page. A chapter marked `samePlace: true`
   in chapters.js joins the one before it instead of claiming its own
   pin — so UCSD is one point on the map that turns two pages, rather
   than two pins a few hundred metres apart that the camera can't
   meaningfully tell apart.

   Nothing here is content. To add or move a memory, edit chapters.js;
   the only thing that ever needs touching in this file is SPANS, if a
   place should be framed tighter or wider.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';

export const PLACES = (() => {
  const out = [];
  CHAPTERS.forEach((ch, i) => {
    if (ch.samePlace && out.length) {
      out[out.length - 1].pages.push(i);
    } else {
      out.push({ id: ch.id, lat: ch.lat, lon: ch.lon, act: ch.act, pages: [i] });
    }
  });
  return out;
})();

/* How wide a view each place gets, in world units.
   1 unit ≈ 0.9 km near San Diego, so 20 ≈ an 18 km city view. */
const SPANS = {
  'price-center':   14,     // UCSD — the theatre and the dorm together
  'catania':        15,
  'vegas':         620,
  'thrifting':      22,
  'six-flags':     330,
  'del-mar':        16,
  'love-letter':    13,
  'irvine-odyssey': 240,    // the last stop before she flies
  'palermo':       760,
  'landing':       900,
  'bay-area':      300,
};

export const placeSpan = (i) => SPANS[PLACES[i].id] ?? 60;

/* Which place a given chapter page belongs to. */
export const placeOfChapter = (ci) => PLACES.findIndex(p => p.pages.includes(ci));

/* The crossing: the last place before she flies, by id rather than a
   hard-coded number, so reordering chapters can't silently break it. */
export const FLIGHT_AT = PLACES.findIndex(p => p.id === 'irvine-odyssey');
