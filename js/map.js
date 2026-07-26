/* ═══════════════════════════════════════════════════════════════
   map.js — projection, camera, pins.

   The map is real geography drawn in Web Mercator. Chapters carry
   lat/lon and are projected here, so a pin always lands where the
   place actually is. These three constants MUST match the ones the
   artwork was generated with (see README → "Rebuilding the map").
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';

const NS = 'http://www.w3.org/2000/svg';

/* ── projection ── */
const K = 100;          // world units per degree of longitude
const LON0 = -170;      // longitude at x = 0
const LAT_TOP = 72;     // latitude at y = 0

const mercY = (lat) => {
  const l = Math.max(-85, Math.min(85, lat));
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360));
};
const MERCY0 = mercY(LAT_TOP);

export const project = (lon, lat) => ({
  x: (lon - LON0) * K,
  y: (MERCY0 - mercY(lat)) * K,
});

export const worldXY = (ch) => project(ch.lon, ch.lat);

/* How wide a view each chapter gets, in world units.
   1 unit ≈ 0.9 km near San Diego, so 20 ≈ an 18 km city view.
   Consecutive chapters are deliberately different so the camera
   visibly moves even between neighbours. */
const SPAN = [
  11,    //  1 Price Center — UCSD
  6.5,   //  2 the dorm, steak night (right next door, so go closer)
  15,    //  3 Catania, La Jolla
  620,   //  4 Vegas
  9,     //  5 Sixth College
  22,    //  6 thrifting in La Mesa
  330,   //  7 Six Flags
  16,    //  8 Del Mar fair
  11,    //  9 the love letter
  240,   // 10 Irvine — the Odyssey  [flight departs]
  760,   // 11 Palermo
  900,   // 12 landing back in California
  300,   // 13 the Bay Area
];

const PIN_ART = 30;      // design height of the pin artwork
const PIN_PX = 38;       // desired on-screen pin height
const PIN_MAX_FRAC = 0.055;  // …but never taller than this much of the view

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

let svg, world, pinsG;
const vb = { x: 0, y: 0, w: 1000, h: 700 };
const view = { w: 0, h: 0, s: 1, w0: 1000, h0: 700 };
/* cam.span is the visible width in world units — the camera's unit of
   zoom. Everything else (scale, pin size) is derived from it. */
const cam = { cx: 0, cy: 0, span: 1000 };
const pinEls = [];

export function initMap(onPinTap) {
  svg = document.getElementById('map');
  world = document.getElementById('world');
  pinsG = document.getElementById('pins');

  const [vx, vy, vw, vh] = svg.getAttribute('viewBox').trim().split(/\s+/).map(Number);
  vb.x = vx; vb.y = vy; vb.w = vw; vb.h = vh;

  measure();
  cam.cx = vb.x + vb.w / 2;
  cam.cy = vb.y + vb.h / 2;
  cam.span = view.w0;
  addEventListener('resize', () => { measure(); writeCamera(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishTween();     // rAF is about to stop
  });
  buildPins(onPinTap);
  writeCamera();
}

function measure() {
  const r = svg.getBoundingClientRect();
  view.w = r.width || 390;
  view.h = r.height || 844;
  // preserveAspectRatio="slice" → the viewBox is covered, so scale is the max
  view.s = Math.max(view.w / vb.w, view.h / vb.h);
  view.w0 = view.w / view.s;   // world units across at zoom 1
  view.h0 = view.h / view.s;
}

export const viewScale = () => ({ z: view.w0 / cam.span, s: view.s });

/* ═══════════════════════════════════════════════════════════════
   The camera move.

   Two places are often thousands of map units and hundreds of zoom
   levels apart. Interpolating scale straight from A to B looks
   violent — it covers most of the distance in the first few frames
   and it forces the browser to re-rasterise a very large SVG at
   wildly changing scales.

   So the camera follows the van Wijk & Nuij "smooth and efficient
   zooming and panning" curve instead: it pulls back far enough to
   hold both places, travels across, and settles into the new one.
   Nearby chapters barely bow; far ones arc right out. Same maths
   d3.interpolateZoom uses.
   ═══════════════════════════════════════════════════════════════ */

const RHO = 1.55;        // how hard it pulls back. √2 is the classic value
const RHO2 = RHO * RHO;
const RHO4 = RHO2 * RHO2;

function planFly(a, b) {
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  const w0 = a.span, w1 = b.span;

  // Straight zoom, no travel — interpolate scale logarithmically.
  if (d < 1e-6) {
    const S = Math.abs(Math.log(w1 / w0)) / RHO;
    return {
      S: S || 1e-6,
      at: (s) => ({
        cx: b.cx, cy: b.cy,
        span: w0 * Math.exp((w1 > w0 ? 1 : -1) * RHO * s),
      }),
    };
  }

  const b0 = (w1 * w1 - w0 * w0 + RHO4 * d * d) / (2 * w0 * RHO2 * d);
  const b1 = (w1 * w1 - w0 * w0 - RHO4 * d * d) / (2 * w1 * RHO2 * d);
  const r0 = Math.log(-b0 + Math.sqrt(b0 * b0 + 1));
  const r1 = Math.log(-b1 + Math.sqrt(b1 * b1 + 1));
  const S = (r1 - r0) / RHO;

  if (!isFinite(S) || S <= 0) {                    // degenerate — just cut
    return { S: 1e-6, at: () => ({ cx: b.cx, cy: b.cy, span: w1 }) };
  }

  const coshr0 = Math.cosh(r0), sinhr0 = Math.sinh(r0);
  return {
    S,
    at(s) {
      const t = RHO * s + r0;
      const u = (w0 / RHO2) * (coshr0 * Math.tanh(t) - sinhr0);
      const k = u / d;
      return { cx: a.cx + dx * k, cy: a.cy + dy * k, span: w0 * coshr0 / Math.cosh(t) };
    },
  };
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let tween = null;

function writeCamera() {
  const z = view.w0 / cam.span;
  const ox = vb.x + vb.w / 2, oy = vb.y + vb.h / 2;
  world.style.transform =
    `translate(${ox}px, ${oy}px) scale(${z}) translate(${-cam.cx}px, ${-cam.cy}px)`;

  /* Pins hold a constant pixel size, but are capped as a fraction of
     the visible span so a far zoom-out doesn't drop a marker the size
     of Sicily onto Sicily. */
  const k = Math.min(PIN_PX / (PIN_ART * z * view.s),
                     (PIN_MAX_FRAC * cam.span) / PIN_ART);
  for (const el of pinEls) {
    el.style.transform =
      `translate(${el._wx}px, ${el._wy}px) scale(${k * el._weight})`;
  }
}

function jumpTo(target) {
  cam.cx = target.cx; cam.cy = target.cy; cam.span = target.span;
  writeCamera();
}

/* Land the current move immediately at its destination and release
   whoever is awaiting it. Used on arrival, and as the escape hatch
   whenever the tab is backgrounded — requestAnimationFrame stops
   there, and a camera that never arrives would wedge navigation with
   the controls disabled. */
function finishTween() {
  if (!tween) return;
  const done = tween;
  tween = null;
  jumpTo(done.target);
  world.style.willChange = '';
  clearTimeout(done.guard);
  if (!done.widestFired) done.onWidest?.();
  done.resolve();
}

/* Drives the current tween. Called from main.js's single rAF loop. */
export function tickCamera(now) {
  if (!tween) return;
  const t = Math.min(1, (now - tween.start) / tween.dur);
  if (t >= 1) { finishTween(); return; }

  const p = tween.plan.at(easeInOut(t) * tween.plan.S);
  cam.cx = p.cx; cam.cy = p.cy; cam.span = p.span;
  writeCamera();

  // Tell the caller the moment we're widest, so the route can draw
  // while both ends are on screen.
  if (!tween.widestFired) {
    if (p.span < tween.maxSpan - 1e-9 || t >= 0.45) {
      tween.widestFired = true;
      tween.onWidest?.();
    } else {
      tween.maxSpan = Math.max(tween.maxSpan, p.span);
    }
  }
}

/* Fly to a framing. Resolves on arrival. */
function flyTo(target, { dur, onWidest } = {}) {
  finishTween();                       // never queue two moves

  if (REDUCED || document.hidden) {
    jumpTo(target);
    onWidest?.();
    return Promise.resolve();
  }

  const from = { cx: cam.cx, cy: cam.cy, span: cam.span };
  const plan = planFly(from, target);

  // Duration follows how much ground is covered in zoom-space, so a
  // hop across campus stays snappy and an ocean crossing gets room.
  const ms = dur ?? Math.max(750, Math.min(2400, 620 * plan.S));

  world.style.willChange = 'transform';
  world.style.transition = 'none';
  for (const el of pinEls) el.style.transition = 'none';

  return new Promise((resolve) => {
    tween = { plan, target, start: performance.now(), dur: ms, resolve,
              onWidest, widestFired: false, maxSpan: from.span,
              // belt and braces: if frames stop coming, land anyway
              guard: setTimeout(finishTween, ms + 400) };
  });
}

export const cameraSpan = () => cam.span;

/* Frame a chapter: pin sits above centre so the card never covers it. */
export function setChapterCamera(i, { dur, onWidest } = {}) {
  const { x, y } = worldXY(CHAPTERS[i]);
  const span = SPAN[i];
  return flyTo({
    cx: x + (i % 2 ? -1 : 1) * 0.05 * span,
    cy: y + 0.17 * span * (view.h0 / view.w0),
    span,
  }, { dur, onWidest });
}

export function fitBounds(b, { pad = 0.18, dur, yBias = 0, onWidest } = {}) {
  const bw = Math.max(1e-6, b.maxX - b.minX);
  const bh = Math.max(1e-6, b.maxY - b.minY);
  // widen to whichever axis needs more room, in world units
  const span = Math.max(bw * (1 + pad * 2),
                        bh * (1 + pad * 2) * (view.w0 / view.h0));
  return flyTo({
    cx: (b.minX + b.maxX) / 2,
    cy: (b.minY + b.maxY) / 2 + yBias * span * (view.h0 / view.w0),
    span,
  }, { dur, onWidest });
}

export function allPinsBounds() {
  const pts = CHAPTERS.map(worldXY);
  return {
    minX: Math.min(...pts.map(p => p.x)), maxX: Math.max(...pts.map(p => p.x)),
    minY: Math.min(...pts.map(p => p.y)), maxY: Math.max(...pts.map(p => p.y)),
  };
}

export function setAct(n) { svg.dataset.act = n; }
export function lightSicily(on = true) { svg.classList.toggle('sicily-lit', on); }

/* ── pins ── */

function pinMarkup(ch, isFinale) {
  const rays = ch.status === 'present' ? `
      <g class="rays">
        <line x1="0" y1="-32" x2="0" y2="-38"/><line x1="12.7" y1="-26.7" x2="17" y2="-31"/>
        <line x1="18" y1="-14" x2="24" y2="-14"/><line x1="12.7" y1="-1.3" x2="17" y2="3"/>
        <line x1="-12.7" y1="-26.7" x2="-17" y2="-31"/><line x1="-18" y1="-14" x2="-24" y2="-14"/>
        <line x1="-12.7" y1="-1.3" x2="-17" y2="3"/>
      </g>` : '';
  const inner = isFinale
    ? `<path class="heart" d="M 0 -11.5 C -1.8 -15.5 -6.6 -15.7 -6.6 -19.5 C -6.6 -22 -4.6 -23.4 -2.9 -23.4 C -1.5 -23.4 -0.5 -22.6 0 -21.6 C 0.5 -22.6 1.5 -23.4 2.9 -23.4 C 4.6 -23.4 6.6 -22 6.6 -19.5 C 6.6 -15.7 1.8 -15.5 0 -11.5 Z"/>`
    : `<circle class="dot" cy="-17" r="4.4"/>`;
  return `
    <circle class="seed" cy="-4" r="5"/>
    <g class="marker">
      <g class="pulse">
        <circle class="halo" cy="-15" r="15"/>
        ${rays}
        <path class="body" d="M 0 0 C -7 -8 -11.5 -13 -11.5 -17.5 A 11.5 11.5 0 1 1 11.5 -17.5 C 11.5 -13 7 -8 0 0 Z"/>
        ${inner}
      </g>
    </g>
    <circle class="hit" cy="-10" r="24"/>`;
}

function buildPins(onTap) {
  CHAPTERS.forEach((ch, i) => {
    const g = document.createElementNS(NS, 'g');
    const isFinale = i === CHAPTERS.length - 1;
    g.setAttribute('class', `pin pin-${ch.status}${isFinale ? ' pin-finale' : ''} locked`);
    const { x, y } = worldXY(ch);
    g._wx = x; g._wy = y;
    g._weight = ch.status === 'present' ? 1.18 : isFinale ? 1.35 : 1;
    g.innerHTML = pinMarkup(ch, isFinale);
    g.addEventListener('click', () => onTap(i));
    pinsG.appendChild(g);
    pinEls.push(g);
  });
}

export function dropPin(i, { instant = false } = {}) {
  const el = pinEls[i];
  el.classList.remove('locked');
  el.classList.add('dropped');
  if (!instant && !REDUCED) {
    el.classList.add('just-dropped');
    setTimeout(() => el.classList.remove('just-dropped'), 700);
  }
}

export function undropPin(i) {
  pinEls[i].classList.remove('dropped', 'just-dropped');
  pinEls[i].classList.add('locked');
}

export function setPinStates(current, maxReached) {
  pinEls.forEach((el, i) => {
    el.classList.toggle('current', i === current);
    el.classList.toggle('locked', i > maxReached);
  });
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));
