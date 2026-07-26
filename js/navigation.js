/* ═══════════════════════════════════════════════════════════════
   navigation.js — the state machine. One chapter at a time, in
   order, each advance a scripted beat:
   map move → route draw → pin drop → card rise.
   Persists progress to localStorage so she can resume.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';
import * as map from './map.js';
import * as route from './route.js';
import * as ui from './ui.js';
import { flyToPalermo } from './flight.js';

const KEY = 'a-map-of-us-progress-v1';
const FLIGHT_AT = 9;           // index of the last stop before she flies (Irvine)
const LAST = CHAPTERS.length - 1;
const CLOSING = CHAPTERS.length; // saved index meaning "reached the end"

let index = -1;
let maxReached = 0;
let flightPlayed = false;
let phase = 'title';
let busy = false;

const wait = (ms) => new Promise(res => setTimeout(res, ms));

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ i: index, m: maxReached, f: flightPlayed })); }
  catch { /* private mode — she just starts over */ }
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

function primaryLabel(i) {
  if (i === FLIGHT_AT) return flightPlayed ? 'Fly again ✈' : 'Board the plane ✈';
  if (i === LAST) return 'One last thing ♡';
  return 'Next';
}

function presentChapter(i) {
  ui.setDots(i, maxReached);
  map.setPinStates(i, maxReached);
  ui.showCard(i, { label: primaryLabel(i), showChev: i !== FLIGHT_AT && i !== LAST });
  ui.prefetch(i + 1);
}

/* ── the advance beat ── */
async function advance(i) {
  setBusy(true);
  const isNew = i > maxReached;
  if (isNew) maxReached = i;
  index = i;
  save();

  ui.hideCard();
  map.setAct(CHAPTERS[i].act);

  /* The camera arcs out, travels, and settles. The route segment is
     drawn at the top of that arc — the one moment both the place she
     is leaving and the place she is going are on screen together. */
  await map.setChapterCamera(i, {
    onWidest: () => { if (isNew && i > 0) route.drawSegment(i - 1); },
  });

  if (!droppedSet.has(i)) { droppedSet.add(i); map.dropPin(i); }
  await wait(map.REDUCED ? 0 : 380);
  presentChapter(i);
  setBusy(false);
}

const droppedSet = new Set();

/* revisit — everything already drawn, just reframe + card */
async function revisit(i) {
  setBusy(true);
  index = i;
  save();
  ui.hideCard();
  map.setAct(CHAPTERS[i].act);
  await map.setChapterCamera(i);
  presentChapter(i);
  setBusy(false);
}

/* ── the flight ── */
async function runFlight() {
  setBusy(true);
  ui.hideCard();

  if (map.REDUCED) {
    // no flight: route drawn, pin placed, stamp already stamped
    route.setFlightProgress(1);
    map.lightSicily(true);
    map.dropPin(FLIGHT_AT + 1, { instant: true });
    ui.showStamp({ autohide: true });
  } else {
    if (flightPlayed) {         // replaying: rewind the theater first
      route.resetFlightSegment();
      map.undropPin(FLIGHT_AT + 1);
      map.lightSicily(false);
      await wait(350);
    }
    await flyToPalermo({ showStamp: () => ui.showStamp({ autohide: true }) });
  }

  flightPlayed = true;
  droppedSet.add(FLIGHT_AT + 1);
  index = FLIGHT_AT + 1;
  maxReached = Math.max(maxReached, index);
  save();

  // settle into Palermo's own framing, then the card rises normally
  map.setAct(3);
  await map.setChapterCamera(index);
  presentChapter(index);
  setBusy(false);
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

export function next() {
  if (busy || phase !== 'chapters') return;
  if (index === FLIGHT_AT) { runFlight(); return; }
  if (index >= LAST) { finish(); return; }
  if (index + 1 <= maxReached) revisit(index + 1);
  else advance(index + 1);
}

export function back() {
  if (busy || phase !== 'chapters') return;
  if (index > 0) revisit(index - 1);
}

export function goTo(i) {
  if (busy || phase !== 'chapters') return;
  if (i < 0 || i > maxReached || i === index) return;   // no jumping ahead
  revisit(i);
}

async function begin() {
  setPhase('chapters');
  ui.hideTitle();
  await advance(0);
}

/* resume: rebuild every already-visited state instantly, then frame
   the saved chapter */
async function resume(saved) {
  setPhase('chapters');
  ui.hideTitle();
  maxReached = Math.min(saved.m ?? 0, LAST);
  flightPlayed = !!saved.f || maxReached > FLIGHT_AT;
  for (let s = 0; s < maxReached; s++) route.drawSegment(s, { instant: true });
  for (let p = 0; p <= maxReached; p++) { map.dropPin(p, { instant: true }); droppedSet.add(p); }
  if (maxReached > FLIGHT_AT) map.lightSicily(true);

  const target = Math.min(saved.i ?? 0, CLOSING);
  if (target >= CLOSING) { index = LAST; finish(); return; }
  setBusy(true);
  index = target;
  map.setAct(CHAPTERS[index].act);
  await map.setChapterCamera(index, { dur: 1800 });
  presentChapter(index);
  setBusy(false);
}

export function closeClosing() {   // "back to the map" from the end screen
  ui.hideClosing();
  setPhase('chapters');
  index = LAST;
  revisit(LAST);
}

export function walkAgain() {      // from the closing screen: start at 1, all pins stay lit
  ui.hideClosing();
  setPhase('chapters');
  revisit(0);
}

export function initNavigation() {
  const saved = load();
  const hasProgress = saved && (saved.i ?? 0) > 0;

  ui.initUI({
    onNext: next,
    onBack: back,
    onBegin: () => { try { localStorage.removeItem(KEY); } catch {} begin(); },
    onContinue: () => resume(saved),
    onRestart: () => { try { localStorage.removeItem(KEY); } catch {} ui.showTitle({ resume: false }); },
    onClosingBack: closeClosing,
    onWalkAgain: walkAgain,
  });

  map.setAct(3);
  ui.showTitle({ resume: hasProgress });
}
