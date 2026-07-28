/* ═══════════════════════════════════════════════════════════════
   main.js — entry point. Wires the modules together, owns the
   single rAF loop, swipe navigation, and the compass easter egg.
   ═══════════════════════════════════════════════════════════════ */

import { initMap, viewScale, tickCamera, enablePan } from './map.js';
import { initRoute, tick as routeTick } from './route.js';
import { initFog, tickFog } from './fog.js';
import { initNavigation, onPinTap } from './navigation.js';
import { tick as uiTick } from './ui.js';

const stage = document.getElementById('stage');

initMap((i) => onPinTap(i));   // the map is navigated by tapping pins
initRoute();
initFog();

/* Free roam. Returns a probe telling us whether the last gesture was a
   drag, so dragging the map never counts as choosing a pin. */
const wasDragging = enablePan(
  stage,
  () => document.body.classList.contains('busy') ||
        document.body.classList.contains('reading') ||
        !document.body.classList.contains('phase-chapters')
);

initNavigation(wasDragging);

/* ── the one rAF loop for everything continuous ── */
let running = true;
let lastFrame = performance.now();
function loop(now) {
  if (running) {
    tickCamera(now);          // camera first — route dashes read its scale
    tickFog(now - lastFrame); lastFrame = now;
    routeTick(now, viewScale());
    uiTick(now);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => { running = !document.hidden; });

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
