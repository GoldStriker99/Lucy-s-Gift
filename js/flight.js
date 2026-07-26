/* ═══════════════════════════════════════════════════════════════
   flight.js — the centerpiece. The camera pulls out to the whole
   world, a little plane departs San Diego and draws the route
   behind it as it crosses the Atlantic, a contrail fades in its
   wake, Sicily warms up, and a passport stamp thunks in.
   Tap anywhere to skip. Fully replayable, never auto-replayed.
   ═══════════════════════════════════════════════════════════════ */

import * as map from './map.js';
import * as route from './route.js';

const FLIGHT_MS = 5200;
const ZOOM_MS = 2100;

/* Frame the crossing from the arc itself, so this keeps working if the
   departure or arrival chapter ever moves. */
function flightBounds() {
  const b = route.flightSegBBox();
  const padX = (b.maxX - b.minX) * 0.04;
  const padY = (b.maxY - b.minY) * 0.10;
  return { minX: b.minX - padX, maxX: b.maxX + padX,
           minY: b.minY - padY, maxY: b.maxY + padY };
}

const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

const supportsOffsetPath = (() => {
  try { return CSS.supports('offset-path', 'path("M 0 0 L 10 10")'); }
  catch { return false; }
})();

/* Runs the whole sequence. Resolves once the stamp has landed.
   `showStamp` is provided by ui.js. */
export function flyToPalermo({ showStamp }) {
  return new Promise((resolve) => {
    const stage = document.getElementById('stage');
    const plane = document.getElementById('plane');
    const planeInner = plane.querySelector('.plane-inner');
    const fxG = document.getElementById('fx');
    const pathEl = route.flightSegEl();
    const L = route.flightSegLen();

    let rafId = 0;
    let waapi = null;
    let timers = [];
    let finished = false;

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    function finalize(skipped) {
      if (finished) return;
      finished = true;
      stage.removeEventListener('pointerdown', onSkip, true);
      document.removeEventListener('visibilitychange', onHide);
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
      if (waapi) waapi.cancel();
      // end state, idempotent:
      route.setFlightProgress(1);
      plane.classList.add('plane-hidden');
      plane.style.offsetPath = '';
      plane.style.offsetDistance = '';
      plane.style.transform = '';
      map.lightSicily(true);
      map.dropPin(route.FLIGHT_SEG + 1, { instant: skipped });   // the arrival chapter
      for (const d of fxG.querySelectorAll('.contrail-dot')) d.remove();
      showStamp();
      later(() => {
        document.body.classList.remove('phase-flight');
        resolve();
      }, skipped ? 500 : 1300);
      // resolve's timer must survive the clearTimeout above — re-track:
      timers = [];
    }

    function onSkip() { finalize(true); }

    /* Backgrounding the tab (app switch, screen lock) halts rAF, which
       would otherwise freeze the sequence mid-air and leave the UI
       locked. Treat it exactly like a skip so she always comes back to
       a finished, interactive Palermo. */
    function onHide() { if (document.hidden) finalize(true); }

    // 1 · dim the chrome, lock input, pull the camera out to the world
    document.body.classList.add('phase-flight');
    stage.addEventListener('pointerdown', onSkip, true);
    document.addEventListener('visibilitychange', onHide);

    // Already backgrounded when she tapped? Don't start a sequence that
    // can't animate — go straight to the end state.
    if (document.hidden) { finalize(true); return; }
    map.setAct(3);
    map.fitBounds(flightBounds(), { pad: 0.05, dur: ZOOM_MS });

    later(() => {
      if (finished) return;

      // 2 · ready the plane at the runway, sized for this zoom
      const { z, s } = map.viewScale();
      const k = 34 / (26 * z * s);
      planeInner.style.transform = `scale(${k})`;
      route.setFlightProgress(0);
      plane.classList.remove('plane-hidden');

      const start = performance.now();
      let lastDot = 0;

      if (supportsOffsetPath) {
        plane.style.offsetPath = `path("${route.FLIGHT_D}")`;
        plane.style.offsetRotate = 'auto';
        waapi = plane.animate(
          [{ offsetDistance: '0%' }, { offsetDistance: '100%' }],
          { duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' }
        );
      }

      // one rAF drives: route drawing behind the plane, the contrail,
      // and (when offset-path is unsupported) the plane itself
      function frame(now) {
        if (finished) return;
        const t = Math.min(1, (now - start) / FLIGHT_MS);
        const p = easeInOutSine(t);
        route.setFlightProgress(p);

        const pt = pathEl.getPointAtLength(L * p);
        if (!supportsOffsetPath) {
          const ahead = pathEl.getPointAtLength(Math.min(L, L * p + 2));
          const ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
          plane.style.transform = `translate(${pt.x}px, ${pt.y}px) rotate(${ang}deg)`;
        }
        if (now - lastDot > 80 && t > 0.02 && t < 0.97) {
          lastDot = now;
          const back = pathEl.getPointAtLength(Math.max(0, L * p - 24 / (s * z)));
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('class', 'contrail-dot');
          dot.setAttribute('cx', back.x);
          dot.setAttribute('cy', back.y);
          dot.setAttribute('r', 4.5 / (s * z));
          fxG.appendChild(dot);
          later(() => dot.remove(), 1700);
        }
        if (t < 1) { rafId = requestAnimationFrame(frame); }
        else {
          // 3 · arrival: plane fades, Sicily lights up, pin drops, stamp
          plane.classList.add('plane-hidden');
          later(() => finalize(false), 350);
        }
      }
      rafId = requestAnimationFrame(frame);
    }, ZOOM_MS + 120);
  });
}
