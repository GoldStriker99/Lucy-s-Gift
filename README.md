# A Map of Us

A guided storybook-map journey through thirteen places, built as a plain
static site — no build step, no frameworks, no external services. Made to
be viewed on an iPhone.

Live at: **https://goldstriker99.github.io/Lucy-s-Gift/**

## Run it locally

ES modules need a real server (opening `index.html` via `file://` fails on CORS):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To try it on your phone on the same wifi,
use your Mac's local IP (System Settings → Wi-Fi → Details), e.g.
`http://192.168.1.20:8000`.

If an edit to a `js/` file doesn't seem to take effect, it's the browser
caching the module — hard-reload (⌘⇧R).

## Edit the content

**You only ever touch two files:**

- **`js/config.js`** — her name, the opening line, the arrival/return dates,
  the closing message, your phone number for the reply button.
- **`js/chapters.js`** — the thirteen chapters: titles, dates, text, photo
  paths, and real coordinates. Heavily commented.

Drop real photos into `./images/` as `.webp` (~1600px long edge, ~200–300KB
each is plenty), then change each chapter's `photo:` path. Keep paths
**relative** (`./images/foo.webp`) — root-absolute paths break on GitHub Pages.

### Moving a pin

The map is real geography, so pins are placed by latitude and longitude,
not by guesswork. To move one: open Google Maps, right-click the exact
spot, and the lat/lon appears at the top of the menu. Paste those two
numbers into that chapter's `lat:` and `lon:`. That's the whole job — the
pin, the route line through it, and the camera framing all follow.

### How close the camera gets

`SPAN` in `js/map.js` sets how wide each chapter's view is, in map units
(1 unit ≈ 0.9 km near San Diego, so `20` ≈ an 18 km city view). One entry
per chapter, in order. Neighbouring chapters use deliberately different
values so the camera visibly moves even between two places a block apart.

### The flight

Chapter 10 (Irvine) is the last stop before she leaves, so its button says
"Board the plane" and the flight lands on chapter 11 (Palermo). That's
wired to position, not to id — if you reorder those two, update `FLIGHT_AT`
in `js/navigation.js` and `FLIGHT_SEG` in `js/route.js` to match.

## Rebuilding the map artwork

You almost certainly never need this — the artwork is already baked into
`index.html` as inline SVG and can be hand-edited there. It was generated
from real geographic data:

- **Coastline, San Diego** — OpenStreetMap (`natural=coastline`, via Overpass)
- **Land and state borders** — Natural Earth 10m and 50m

Each outline was simplified hard (Douglas–Peucker) and then re-smoothed
into cubic béziers, which is what makes accurate geography read as
hand-drawn rather than angular.

The projection is Web Mercator with these constants, which are duplicated
at the top of `js/map.js` and **must match** the artwork:

```
x = (lon − (−170)) × 100
y = (mercY(72) − mercY(lat)) × 100
```

## Deploy to GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
The `.nojekyll` file is already in place, which is what stops Jekyll from
eating the `js/` folder. Every push from GitHub Desktop redeploys.

### Before you send the link

- Set `replyPhone` in `js/config.js` to your real number — it is still a
  placeholder, so the reply button currently goes nowhere.
- Walk the whole thing yourself once on your own phone.
- The Open Graph tags in `index.html` are absolute URLs pointing at the
  address above. If you rename the repo or account, update `og:url` and
  `og:image` too — relative URLs there are ignored by the iMessage and
  WhatsApp link scrapers, so they must stay absolute.

## Credits

Map data © OpenStreetMap contributors, available under the
[Open Database License](https://www.openstreetmap.org/copyright).
Country and state outlines from [Natural Earth](https://www.naturalearthdata.com/)
(public domain). The credit line on the closing screen is there because
OpenStreetMap's licence requires it — please leave it in.

## Notes

- Progress is saved in her browser (localStorage), so she resumes where she
  left off. To test from scratch, use a private tab or tap "Start from the
  beginning".
- Tap the compass five times. That's for her to find.
