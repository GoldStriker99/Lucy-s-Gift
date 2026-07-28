/* ═══════════════════════════════════════════════════════════════
   navigation.js — exploration, not a slideshow.

   The map is hers to roam. Everything starts under cloud with a single
   red pin at UCSD; every other pin is grey and inert. Opening a memory
   parts the cloud over the next place and widens the view to take it
   in, turning that pin red. Anything she has already opened stays
   tappable, so she can wander back.

   Progress is still strictly in order — there is only ever one red pin,
   so she never has to wonder what to do next.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';
import { PLACES, FLIGHT_AT } from './places.js';
import * as map from './map.js';
import * as route from './route.js';
import * as fog from './fog.js';
import * as ui from './ui.js';
import { flyToPalermo } from './flight.js';

const KEY = 'a-map-of-us-progress-v3';
const LAST = PLACES.length - 1;

let unlocked = 0;               // furthest place the cloud has parted over
const opened = new Set();       // places she has actually read
let phase = 'title';
let busy = false;
let openPlace = -1;             // the place whose card is on screen
let page = 0;                   // …and which of its pages
let wasDragging = () => false;

const wait = (ms) => new Promise(res => setTimeout(res, ms));

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ u: unlocked, o: [...opened] }));
  } catch { /* private mode — she just starts over */ }
}
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch { return null; }
}

function setBusy(b) {
  busy = b;
  document.body.classList.toggle('busy', b);
}
function setPhase(p) {
  document.body.classList.remove(`phase-${phase}`);
  phase = p;
  document.body.classList.add(`phase-${phase}`);
}

function refreshPins() {
  map.setPinStates({ unlocked, opened });
  ui.setProgress(opened.size, PLACES.length);
}

/* ── opening a place ── */
async function open(i) {
  if (busy || phase !== 'chapters') return;
  if (i > unlocked) return;                 // still under cloud
  setBusy(true);
  opened.add(i);
  openPlace = i;
  page = 0;
  save();
  refreshPins();
  showPage(i, 0);
  setBusy(false);
}

/* A place can hold more than one page — UCSD is the theatre and then
   the steak. The button turns the page until the last one, and only
   then closes and opens up the next stretch of map. */
function showPage(placeIdx, p) {
  const pages = PLACES[placeIdx].pages;
  const last = p === pages.length - 1;
  ui.showCard(pages[p], {
    label: !last ? 'Next page' : (placeIdx === LAST ? 'One last thing ♡' : 'Close'),
    showChev: !last,
  });
}

/* ── closing it, which opens up the next stretch of map ── */
async function closeCard() {
  if (busy || phase !== 'chapters') return;

  const here = openPlace;
  if (here < 0) return;
  const pages = PLACES[here].pages;
  if (page < pages.length - 1) {      // still more to read here
    page += 1;
    showPage(here, page);
    return;
  }

  setBusy(true);
  ui.hideCard();
  openPlace = -1;
  await wait(map.REDUCED ? 0 : 620);

  /* Only closing the furthest place opens up new map. Wandering back
     to somewhere she has already been just puts the card away. */
  if (here === unlocked && unlocked < LAST) {
    await reveal(unlocked + 1);
  }
  setBusy(false);

  if (opened.size === PLACES.length && unlocked === LAST) finish();
}

/* ── the reveal ── */
async function reveal(i) {
  map.setAct(PLACES[i].act);

  // the crossing gets its own sequence rather than a simple cloud-part
  if (i === FLIGHT_AT + 1 && !map.REDUCED) {
    await flyToPalermo({ showStamp: () => ui.showStamp({ autohide: true }) });
  } else if (i === FLIGHT_AT + 1) {
    route.setFlightProgress(1);
    map.lightSicily(true);
    ui.showStamp({ autohide: true });
  }

  fog.clearFog(i);
  if (i > 0) route.drawSegment(i - 1);
  if (i > FLIGHT_AT) map.lightSicily(true);

  const b = map.boundsThrough(i);
  map.setPanBounds(b);
  await map.fitBounds(b, { pad: 0.22, yBias: -0.04 });

  /* The cloud draws back onto a grey pin first — somewhere out there,
     not yet hers — and only then does it warm to red. */
  map.dropPin(i);
  await wait(map.REDUCED ? 0 : 700);
  unlocked = i;
  save();
  refreshPins();
  await wait(map.REDUCED ? 0 : 400);
}

/* ── the closing ── */
async function finish() {
  setBusy(true);
  ui.hideCard();
  setPhase('closing');
  save();
  map.setAct(3);
  await map.fitBounds(map.allPinsBounds(), { pad: 0.16, dur: 2900, yBias: -0.06 });
  ui.showClosing();
  setBusy(false);
}

/* ── public API ── */

export function onPinTap(i) {
  if (wasDragging()) return;      // she was moving the map, not choosing
  if (i > unlocked) return;
  open(i);
}

async function begin() {
  setPhase('chapters');
  ui.hideTitle();
  unlocked = 0;
  opened.clear();
  save();

  fog.clearFog(0);
  const b = map.boundsThrough(0);
  map.setPanBounds(b);
  // wider than the clearing, so she can see cloud waiting at the edges
  map.fitBounds(b, { pad: 0.32, yBias: -0.04, instant: true });
  refreshPins();
  await wait(map.REDUCED ? 0 : 500);
  map.dropPin(0);
}

async function resume(saved) {
  setPhase('chapters');
  ui.hideTitle();
  unlocked = Math.min(saved.u ?? 0, LAST);
  for (const i of saved.o ?? []) opened.add(i);

  for (let i = 0; i <= unlocked; i++) fog.clearFog(i, { instant: true });
  for (let s = 0; s < unlocked; s++) route.drawSegment(s, { instant: true });
  if (unlocked > FLIGHT_AT) map.lightSicily(true);

  map.setAct(PLACES[unlocked].act);
  const b = map.boundsThrough(unlocked);
  map.setPanBounds(b);
  map.fitBounds(b, { pad: 0.22, yBias: -0.04, instant: true });
  refreshPins();
}

export function closeClosing() {
  ui.hideClosing();
  setPhase('chapters');
  const b = map.boundsThrough(LAST);
  map.setPanBounds(b);
  map.fitBounds(b, { pad: 0.18 });
}

export function walkAgain() {
  ui.hideClosing();
  setPhase('chapters');
  open(0);
}

export function initNavigation(dragProbe) {
  wasDragging = dragProbe;
  const saved = load();
  const hasProgress = saved && ((saved.u ?? 0) > 0 || (saved.o ?? []).length > 0);

  ui.initUI({
    onNext: closeCard,
    onBack: () => {},
    onBegin: () => { try { localStorage.removeItem(KEY); } catch {} begin(); },
    onContinue: () => resume(saved),
    onRestart: () => { try { localStorage.removeItem(KEY); } catch {} ui.showTitle({ resume: false }); },
    onClosingBack: closeClosing,
    onWalkAgain: walkAgain,
  });

  map.setAct(1);
  ui.showTitle({ resume: hasProgress });
}
