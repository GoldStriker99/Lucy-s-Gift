/* ═══════════════════════════════════════════════════════════════
   map.js — SVG map rendering, act framing, camera transitions,
   pin generation. The camera is a CSS transform on #world; pins
   counter-scale so they stay a constant size on screen.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';

const NS = 'http://www.w3.org/2000/svg';
const VB_W = 1000, VB_H = 700;
const PIN_ART_UNITS = 30;   // design height of the pin artwork
const PIN_PX = 38;          // desired on-screen pin height

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Per-chapter zoom. Consecutive chapters always differ so every
   advance visibly moves the camera, even within one act. */
const ZOOM = [4.6, 5.1, 4.4, 4.9, 2.35, 2.9, 5.3, 1.55, 3.2, 2.25];

let svg, world, pinsG;
const view = { w: 0, h: 0, s: 1, w0: VB_W, h0: VB_H };
const cam = { cx: 500, cy: 400, z: 0.9 };
const pinEls = [];
let worldIdleTimer = 0;

export const worldXY = (ch) => ({ x: ch.x * 10, y: ch.y * 7 });

export function initMap(onPinTap) {
  svg = document.getElementById('map');
  world = document.getElementById('world');
  pinsG = document.getElementById('pins');
  measure();
  addEventListener('resize', () => { measure(); applyCamera(false); });
  buildPins(onPinTap);
  applyCamera(false);
}

function measure() {
  const r = svg.getBoundingClientRect();
  view.w = r.width || 390;
  view.h = r.height || 844;
  view.s = Math.max(view.w / VB_W, view.h / VB_H);
  view.w0 = view.w / view.s;   // world units visible at zoom 1
  view.h0 = view.h / view.s;
}

/* current zoom*screen-scale — route.js needs it for px-true dashes */
export const viewScale = () => ({ z: cam.z, s: view.s });

function setTransition(el, animate, dur) {
  if (animate && !REDUCED) {
    el.style.transition = `transform ${dur}ms var(--ease-glide)`;
  } else {
    el.style.transition = 'none';
  }
}

function applyCamera(animate, dur = 1200) {
  setTransition(world, animate, dur);
  world.style.willChange = animate ? 'transform' : '';
  world.style.transform =
    `translate(${VB_W / 2}px, ${VB_H / 2}px) scale(${cam.z}) translate(${-cam.cx}px, ${-cam.cy}px)`;

  /* constant on-screen size, but capped so far zooms shrink pins
     like a real map instead of piling giant markers on a tiny coast */
  const k = Math.min(PIN_PX / (PIN_ART_UNITS * cam.z * view.s), 0.62);
  for (const el of pinEls) {
    setTransition(el, animate, dur);
    el.style.transform =
      `translate(${el._wx}px, ${el._wy}px) scale(${k * el._weight})`;
  }
  clearTimeout(worldIdleTimer);
  worldIdleTimer = setTimeout(() => { world.style.willChange = ''; }, dur + 100);
}

function moveTo(cx, cy, z, animate = true, dur = 1200) {
  cam.cx = cx; cam.cy = cy; cam.z = z;
  applyCamera(animate, dur);
  return wait(animate && !REDUCED ? dur : 0);
}

/* Frame a chapter: pin sits ~1/3 from the top so the card below
   never covers it. Alternating sideways nudge adds variety. */
export function setChapterCamera(i, { animate = true, dur = 1200 } = {}) {
  const { x, y } = worldXY(CHAPTERS[i]);
  const z = ZOOM[i];
  const cx = x + (i % 2 ? -1 : 1) * 0.04 * (view.w0 / z);
  const cy = y + 0.17 * (view.h0 / z);
  return moveTo(cx, cy, z, animate, dur);
}

export function fitBounds(b, { pad = 0.18, animate = true, dur = 1400, yBias = 0 } = {}) {
  const bw = b.maxX - b.minX, bh = b.maxY - b.minY;
  const z = Math.min(view.w0 / (bw * (1 + pad * 2)), view.h0 / (bh * (1 + pad * 2)));
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2 + yBias * (view.h0 / z);
  return moveTo(cx, cy, Math.max(0.2, Math.min(z, 6)), animate, dur);
}

export function allPinsBounds() {
  const xs = CHAPTERS.map(c => c.x * 10), ys = CHAPTERS.map(c => c.y * 7);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

export function setAct(n) { svg.dataset.act = n; }
export function lightSicily(on = true) { svg.classList.toggle('sicily-lit', on); }
export const isSicilyLit = () => svg.classList.contains('sicily-lit');

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

/* Drop a pin in (with bounce, unless instant/reduced-motion). */
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

/* visited pins are lit + tappable, future pins dimmed + inert */
export function setPinStates(current, maxReached) {
  pinEls.forEach((el, i) => {
    el.classList.toggle('current', i === current);
    el.classList.toggle('locked', i > maxReached);
  });
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));
