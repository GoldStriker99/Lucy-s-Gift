/* ═══════════════════════════════════════════════════════════════
   route.js — the route line. Solid hand-drawn curve through the
   past, a flight arc over the Atlantic, and a dashed, slowly
   drifting line into the future.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';
import { worldXY, viewScale, isCameraMoving, viewRect, REDUCED } from './map.js';

const NS = 'http://www.w3.org/2000/svg';
const DRAW_MS = 1000;

export const FLIGHT_SEG = 9;   // segment Irvine → Palermo

let routesG, fxG, glowEl;
const segs = [];               // { el, len, dashed, flight, drawn }
let glowTween = null;
let marchOffset = 0;
let lastTick = 0;

/* A gently bowed curve between two points — hand-drawn, not ruler-drawn. */
function curveD(a, b, bow) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  return `M ${a.x} ${a.y} Q ${(mx + px * bow * len).toFixed(1)} ${(my + py * bow * len).toFixed(1)} ${b.x} ${b.y}`;
}

/* The flight arc: bows north like a great-circle route.
   Offsets are a fraction of the crossing so the bow keeps its shape
   whatever the real distance between the two chapters turns out to be.
   Also used as the plane's motion path. */
export const FLIGHT_D = (() => {
  const a = worldXY(CHAPTERS[FLIGHT_SEG]);
  const b = worldXY(CHAPTERS[FLIGHT_SEG + 1]);
  const dx = b.x - a.x;
  const bow = Math.abs(dx) * 0.23;          // how far north it swings
  return `M ${a.x} ${a.y} C ${a.x + dx * 0.28} ${a.y - bow}, ` +
         `${b.x - dx * 0.30} ${b.y - bow * 0.92}, ${b.x} ${b.y}`;
})();

export function initRoute() {
  routesG = document.getElementById('routes');
  fxG = document.getElementById('fx');

  for (let i = 0; i < CHAPTERS.length - 1; i++) {
    const a = worldXY(CHAPTERS[i]);
    const b = worldXY(CHAPTERS[i + 1]);
    const dashed = i >= FLIGHT_SEG + 1;
    const flight = i === FLIGHT_SEG;
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('class', `route-seg${dashed ? ' dashed' : ''}${flight ? ' flight' : ''}`);
    el.setAttribute('d', flight ? FLIGHT_D : curveD(a, b, dashed ? 0.1 : (i % 2 ? -0.14 : 0.14)));
    routesG.appendChild(el);
    const len = el.getTotalLength();
    if (!dashed) el.style.visibility = 'hidden';   // until drawn
    const bb = el.getBBox();                       // world-space extent, fixed
    segs.push({ el, len, dashed, flight, drawn: false, culled: false,
                bb: { minX: bb.x, minY: bb.y, maxX: bb.x + bb.width, maxY: bb.y + bb.height } });
  }

  glowEl = document.createElementNS(NS, 'circle');
  glowEl.id = 'route-glow';
  glowEl.setAttribute('r', '6');
  fxG.appendChild(glowEl);
}

/* NOTE on units: with vector-effect: non-scaling-stroke the stroke —
   dashes included — is computed in SCREEN pixels, so every dash value
   below is in px, converted from world length via viewScale(). Solid
   segments get their dasharray cleared once drawn so later camera
   zooms can't reintroduce a pattern. */

const screenLen = (seg) => {
  const { z, s } = viewScale();
  return seg.len * z * s;
};

/* Draw segment i (connects chapter i → i+1). Returns a promise. */
export function drawSegment(i, { instant = false } = {}) {
  const seg = segs[i];
  if (!seg || seg.drawn) return Promise.resolve();
  seg.drawn = true;
  const el = seg.el;

  if (seg.dashed) {                       // the future fades in, already dashed
    el.classList.add('revealed');
    return wait(instant || REDUCED ? 0 : 900);
  }
  el.style.visibility = '';
  if (instant || REDUCED) {
    el.classList.add('revealed');
    return Promise.resolve();
  }
  const L = screenLen(seg);
  el.classList.add('revealed');
  el.style.transition = 'none';
  el.style.strokeDasharray = `${L}`;
  el.style.strokeDashoffset = `${L}`;
  el.getBoundingClientRect();             // flush so the transition takes
  el.style.transition = `stroke-dashoffset ${DRAW_MS}ms var(--ease-sail)`;
  el.style.strokeDashoffset = '0';
  glowTween = { el, len: seg.len, start: performance.now(), dur: DRAW_MS };
  setTimeout(() => {                      // solid forever after
    el.style.transition = 'none';
    el.style.strokeDasharray = 'none';
    el.style.strokeDashoffset = '0';
  }, DRAW_MS + 40);
  return wait(DRAW_MS);
}

/* flight.js drives the flight segment frame-by-frame (the plane is
   the pen); these expose just enough control. */
export function flightSegEl() { return segs[FLIGHT_SEG].el; }
export function flightSegLen() { return segs[FLIGHT_SEG].len; }
/* Measured once at init and cached: when the flight starts the camera
   is still zoomed in on Irvine, so this segment is culled, and getBBox
   on a display:none element reports zeros. */
export function flightSegBBox() { return segs[FLIGHT_SEG].bb; }
export function setFlightProgress(p) {
  const seg = segs[FLIGHT_SEG];
  seg.el.style.visibility = '';
  seg.el.classList.add('revealed');
  if (p >= 1) {
    seg.el.style.strokeDasharray = 'none';
    seg.el.style.strokeDashoffset = '0';
    seg.drawn = true;
  } else {
    const L = screenLen(seg);
    seg.el.style.strokeDasharray = `${L}`;
    seg.el.style.strokeDashoffset = `${L * (1 - p)}`;
  }
}
export function resetFlightSegment() {
  const seg = segs[FLIGHT_SEG];
  seg.drawn = false;
  seg.el.classList.remove('revealed');
  seg.el.style.visibility = 'hidden';
}

/* Hide segments that are nowhere near the screen.

   The route spans an ocean, so at San Diego zoom the Atlantic crossing
   is a few hundred thousand pixels long — and with non-scaling-stroke
   the browser still walks it every frame. Toggling display only when a
   segment actually crosses in or out of view keeps this near-free. */
function cull() {
  const v = viewRect();
  const padX = (v.maxX - v.minX) * 0.5;
  const padY = (v.maxY - v.minY) * 0.5;
  for (const seg of segs) {
    const b = seg.bb;
    const off = b.maxX < v.minX - padX || b.minX > v.maxX + padX ||
                b.maxY < v.minY - padY || b.minY > v.maxY + padY;
    if (off !== seg.culled) {
      seg.culled = off;
      seg.el.style.display = off ? 'none' : '';
    }
  }
}

/* One shared tick, called from main.js's single rAF loop. */
export function tick(now, scale) {
  cull();

  // traveling glow at the head of a drawing segment
  if (glowTween) {
    const t = Math.min(1, (now - glowTween.start) / glowTween.dur);
    const eased = -(Math.cos(Math.PI * t) - 1) / 2;
    const pt = glowTween.el.getPointAtLength(glowTween.len * eased);
    glowEl.setAttribute('cx', pt.x);
    glowEl.setAttribute('cy', pt.y);
    glowEl.setAttribute('r', 7 / (scale.s * scale.z));
    glowEl.style.opacity = t < 1 ? '0.85' : '0';
    if (t >= 1) glowTween = null;
  }

  if (REDUCED) return;

  /* Marching ants on the dashed future. Held still while the camera is
     moving or while the card covers the map — rewriting a dash offset
     forces the stroke to be rebuilt, and it is invisible either way. */
  if (isCameraMoving() || document.body.classList.contains('reading')) {
    lastTick = 0;
    return;
  }

  const dt = lastTick ? Math.min(100, now - lastTick) : 16;
  lastTick = now;
  marchOffset -= 14 * dt / 1000;          // ~14 px/s drift
  for (const seg of segs) {
    if (!seg.dashed || !seg.el.classList.contains('revealed')) continue;
    seg.el.style.strokeDashoffset = `${marchOffset}`;
  }
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));
