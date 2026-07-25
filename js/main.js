/* ═══════════════════════════════════════════════════════════════
   main.js — entry point. Wires the modules together, owns the
   single rAF loop, swipe navigation, and the compass easter egg.
   ═══════════════════════════════════════════════════════════════ */

import { initMap, viewScale } from './map.js';
import { initRoute, tick as routeTick } from './route.js';
import { initNavigation, next, back, goTo } from './navigation.js';
import { tick as uiTick } from './ui.js';

initMap((i) => goTo(i));   // tapping a lit pin revisits its chapter
initRoute();
initNavigation();

/* ── the one rAF loop for everything continuous ── */
let running = true;
function loop(now) {
  if (running) {
    routeTick(now, viewScale());
    uiTick(now);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => { running = !document.hidden; });

/* ── swipe left/right to advance/back ── */
const stage = document.getElementById('stage');
let swipe = null;
stage.addEventListener('pointerdown', (e) => {
  swipe = { x: e.clientX, y: e.clientY, t: e.timeStamp };
}, { passive: true });
stage.addEventListener('pointerup', (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  swipe = null;
  /* Judged on shape, not speed: clearly long and clearly horizontal.
     No duration cap — event timestamps stretch when the main thread is
     busy animating, and a slow deliberate swipe that does nothing feels
     broken. Mid-transition taps are already absorbed by the busy guard. */
  if (Math.abs(dx) < 64 || Math.abs(dx) < 2.2 * Math.abs(dy)) return;
  if (dx < 0) next(); else back();
}, { passive: true });

/* ── keep the stage a stage: no pinch zoom ──
   (double-tap zoom is already disabled by touch-action: manipulation) */
['gesturestart', 'gesturechange'].forEach(ev =>
  document.addEventListener(ev, (e) => e.preventDefault()));

/* ── the compass easter egg: five quick taps ── */
const compass = document.getElementById('compass');
const heartsBox = document.getElementById('hearts');
let taps = 0, lastTap = 0;
compass.addEventListener('click', () => {
  const now = Date.now();
  taps = (now - lastTap < 2000) ? taps + 1 : 1;
  lastTap = now;
  if (taps < 5) return;
  taps = 0;
  compass.classList.remove('spinning');
  void compass.offsetWidth;          // restart the animation
  compass.classList.add('spinning');
  for (let i = 0; i < 7; i++) {
    setTimeout(() => {
      const h = document.createElement('span');
      h.textContent = '♥';
      h.style.left = `${18 + Math.random() * 64}%`;
      h.style.fontSize = `${14 + Math.random() * 14}px`;
      heartsBox.appendChild(h);
      setTimeout(() => h.remove(), 2100);
    }, i * 130);
  }
});
compass.addEventListener('animationend', () => compass.classList.remove('spinning'));
