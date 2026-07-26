/* ═══════════════════════════════════════════════════════════════
   ui.js — card sheets, buttons, progress dots, title & closing
   screens, the passport stamp, clocks & countdown.
   ═══════════════════════════════════════════════════════════════ */

import { CHAPTERS } from './chapters.js';
import { CONFIG } from './config.js';
import { REDUCED } from './map.js';

const $ = (id) => document.getElementById(id);

let els = {};
let handlers = {};
let closingVisible = false;
let lastClockUpdate = 0;
let cardHeight = 0;

export function initUI(h) {
  handlers = h;
  els = {
    card: $('card'), grip: $('card-grip'), scroll: $('card-scroll'),
    img: $('card-img'), caption: $('card-caption'),
    place: $('card-place'), date: $('card-date'),
    title: $('card-title'), body: $('card-body'),
    btnBack: $('btn-back'), btnNext: $('btn-next'), btnNextLabel: $('btn-next-label'),
    chev: document.querySelector('#btn-next .chev'),
    progress: $('progress'), stamp: $('stamp'),
    titleScreen: $('title-screen'), titleName: $('title-name'), titleLine: $('title-line'),
    btnBegin: $('btn-begin'), resumeBox: $('resume-box'),
    btnContinue: $('btn-continue'), btnRestart: $('btn-restart'),
    closing: $('closing'),
  };

  // static text from CONFIG
  els.titleName.textContent = CONFIG.herName;
  els.titleLine.textContent = CONFIG.openingLine;
  $('closing-title').textContent = CONFIG.closingTitle;
  $('closing-message').textContent = CONFIG.closingMessage;
  $('countdown-label').textContent = CONFIG.countdownLabel;
  $('clock-her-city').textContent = CONFIG.herCity;
  $('clock-my-city').textContent = CONFIG.myCity;
  els.stamp.querySelector('.stamp-date').textContent = CONFIG.palermoArrivalText;
  const reply = $('btn-reply');
  reply.textContent = CONFIG.replyButton;
  reply.href = `sms:${CONFIG.replyPhone}&body=${encodeURIComponent(CONFIG.replyBody)}`;

  // progress dots
  CHAPTERS.forEach(() => {
    const d = document.createElement('span');
    d.className = 'dot';
    els.progress.appendChild(d);
  });

  // buttons
  els.btnNext.addEventListener('click', () => handlers.onNext());
  els.btnBack.addEventListener('click', () => handlers.onBack());
  els.btnBegin.addEventListener('click', () => handlers.onBegin());
  els.btnContinue.addEventListener('click', () => handlers.onContinue());
  els.btnRestart.addEventListener('click', () => handlers.onRestart());
  $('btn-closing-back').addEventListener('click', () => handlers.onClosingBack());
  $('btn-again').addEventListener('click', () => handlers.onWalkAgain());

  initCardDrag();
  // warm up chapter 1's photo while she reads the title screen
  prefetch(0);
}

/* ── title screen ── */
export function showTitle({ resume }) {
  els.titleScreen.classList.remove('leaving');
  els.btnBegin.classList.toggle('hidden', resume);
  els.resumeBox.classList.toggle('hidden', !resume);
}
export function hideTitle() {
  els.titleScreen.classList.add('leaving');
}

/* ── progress dots ── */
export function setDots(current, maxReached) {
  [...els.progress.children].forEach((d, i) => {
    d.classList.toggle('now', i === current);
    d.classList.toggle('done', i !== current && i <= maxReached);
  });
}

/* ── memory card ── */
export function showCard(i, { label = 'Next', showChev = true } = {}) {
  const ch = CHAPTERS[i];
  els.img.classList.remove('loaded');
  els.img.alt = ch.title;
  els.img.src = ch.photo;
  if (els.img.complete && els.img.naturalWidth) reveal(els.img);
  else els.img.onload = () => reveal(els.img);

  els.caption.textContent = ch.caption || '';
  els.place.textContent = ch.place;
  els.date.textContent = ch.date;
  els.title.textContent = ch.title;
  els.body.textContent = ch.body;
  els.btnNextLabel.textContent = label;
  els.chev.style.display = showChev ? '' : 'none';
  els.btnBack.classList.toggle('gone', i === 0);

  els.scroll.scrollTop = 0;
  els.card.classList.remove('card-hidden', 'peek');
  els.card.style.transform = '';
}
function reveal(img) {
  setTimeout(() => img.classList.add('loaded'), 60);
}
export function hideCard() {
  els.card.classList.add('card-hidden');
  els.card.classList.remove('peek');
  els.card.style.transform = '';
}

/* ── the in-between ──
   Fades a full-screen photo of the next chapter over everything, holds
   while the map is repositioned behind it, then clears. Tapping during
   the hold cuts it short. */
export function showInterstitial(i) {
  const ch = CHAPTERS[i];
  const el = $('interstitial');
  const img = $('inter-img');
  img.src = ch.photo;
  img.alt = ch.title;
  $('inter-place').textContent = ch.place;
  $('inter-date').textContent = ch.date;
  $('inter-title').textContent = ch.title;
  $('inter-caption').textContent = ch.caption || '';

  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('in-between');
  void el.offsetWidth;                  // flush, so the fade actually runs
  el.classList.add('showing');

  if (REDUCED) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.removeEventListener('pointerdown', finish);
      resolve();
    };
    const timer = setTimeout(finish, 1500);   // fade-in + a beat to look
    el.addEventListener('pointerdown', finish);
  });
}

export function hideInterstitial() {
  const el = $('interstitial');
  el.classList.remove('showing');
  el.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('in-between');
  setTimeout(() => {
    if (!el.classList.contains('showing')) el.classList.add('hidden');
  }, 700);
}

/* prefetch the next chapter's photo so its card never appears empty */
const prefetched = new Set();
export function prefetch(i) {
  const ch = CHAPTERS[i];
  if (!ch || prefetched.has(i)) return;
  prefetched.add(i);
  const im = new Image();
  im.decoding = 'async';
  im.src = ch.photo;
}

/* ── card sheet drag: follows the finger, snaps on velocity ──
   The sheet's height is measured once per gesture, at pointerdown.
   A single read at gesture start is cheap and — unlike a cached
   value — can never be stale when the card's content changes height. */
function initCardDrag() {
  const card = els.card;
  let startY = 0, curY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false, fromPeek = false;

  const peekOffset = () => Math.max(0, cardHeight - 92);

  els.grip.addEventListener('pointerdown', (e) => {
    if (card.classList.contains('card-hidden')) return;
    cardHeight = card.offsetHeight;          // untransformed layout height
    dragging = true;
    fromPeek = card.classList.contains('peek');
    startY = e.clientY;
    curY = fromPeek ? peekOffset() : 0;
    lastY = e.clientY; lastT = e.timeStamp; vel = 0;
    card.classList.add('dragging');
    card.classList.remove('peek');
    try { els.grip.setPointerCapture(e.pointerId); } catch {}
  });

  els.grip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dt = e.timeStamp - lastT;
    if (dt > 0) vel = (e.clientY - lastY) / dt;
    lastY = e.clientY; lastT = e.timeStamp;
    const base = fromPeek ? peekOffset() : 0;
    curY = Math.min(peekOffset(), Math.max(0, base + (e.clientY - startY)));
    card.style.transform = `translateY(${curY}px)`;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    const shouldPeek = vel > 0.45 || (vel > -0.45 && curY > peekOffset() * 0.45);
    card.style.transform = '';
    card.classList.toggle('peek', shouldPeek);
    card.style.transform = shouldPeek ? `translateY(${peekOffset()}px)` : '';
  };
  els.grip.addEventListener('pointerup', release);
  els.grip.addEventListener('pointercancel', release);

  // a plain tap on the grip toggles peek/open
  els.grip.addEventListener('click', () => {
    if (Math.abs(vel) > 0.05) return;
    const toPeek = !card.classList.contains('peek');
    card.classList.toggle('peek', toPeek);
    card.style.transform = toPeek ? `translateY(${peekOffset()}px)` : '';
  });
}

/* ── passport stamp ── */
export function showStamp({ autohide = true } = {}) {
  els.stamp.classList.remove('hidden', 'fading');
  els.stamp.classList.add('stamped');
  if (autohide) {
    setTimeout(() => els.stamp.classList.add('fading'), REDUCED ? 2400 : 3000);
    setTimeout(() => {
      els.stamp.classList.add('hidden');
      els.stamp.classList.remove('stamped', 'fading');
    }, REDUCED ? 3600 : 4200);
  }
}

/* ── closing screen: countdown + two real clocks ── */
const timeFmt = (tz) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });

/* Real abbreviations (PDT, CEST) rather than "GMT+2" — no single locale
   spells both, so take the first that gives letters instead of an offset.
   Always derived from the live date, so it follows daylight saving. */
function tzAbbrev(tz) {
  let fallback = '';
  for (const locale of ['en-US', 'en-GB']) {
    try {
      const v = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? '';
      if (v && !/^(GMT|UTC)/.test(v)) return v;
      fallback = fallback || v;
    } catch { /* keep trying */ }
  }
  return fallback;
}

export function showClosing() {
  els.closing.classList.remove('hidden');
  void els.closing.offsetWidth;      // flush, so the fade-in transition runs
  els.closing.classList.add('showing');
  $('clock-her-tz').textContent = tzAbbrev(CONFIG.herTimeZone);
  $('clock-my-tz').textContent = tzAbbrev(CONFIG.myTimeZone);
  closingVisible = true;
  lastClockUpdate = 0;
  updateClocks();                    // fill in now, don't wait for a frame
}
export function hideClosing() {
  els.closing.classList.remove('showing');
  closingVisible = false;
  setTimeout(() => els.closing.classList.add('hidden'), 600);
}

/* called from main.js's single rAF loop */
export function tick(now) {
  if (!closingVisible || now - lastClockUpdate < 500) return;
  lastClockUpdate = now;
  updateClocks();
}

function updateClocks() {
  const target = new Date(CONFIG.returnISO).getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    $('countdown-label').textContent = CONFIG.countdownDoneText;
    $('cd-d').textContent = '0'; $('cd-h').textContent = '0';
    $('cd-m').textContent = '0'; $('cd-s').textContent = '0';
  } else {
    const s = Math.floor(diff / 1000);
    $('cd-d').textContent = String(Math.floor(s / 86400));
    $('cd-h').textContent = String(Math.floor(s / 3600) % 24);
    $('cd-m').textContent = String(Math.floor(s / 60) % 60);
    $('cd-s').textContent = String(s % 60);
  }
  const nowDate = new Date();
  $('clock-her-time').textContent = timeFmt(CONFIG.herTimeZone).format(nowDate);
  $('clock-my-time').textContent = timeFmt(CONFIG.myTimeZone).format(nowDate);
}
