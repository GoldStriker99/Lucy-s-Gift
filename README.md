# A Map of Us

A guided storybook-map journey, built as a plain static site — no build step,
no frameworks, no external services. Made to be viewed on an iPhone.

## Run it locally

ES modules need a real server (opening `index.html` via `file://` fails on CORS):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To try it on your phone on the same wifi,
use your Mac's local IP (System Settings → Wi-Fi → Details), e.g.
`http://192.168.1.20:8000`.

## Edit the content

**You only ever touch two files:**

- **`js/config.js`** — her name, the opening line, the arrival/return dates,
  the closing message, your phone number for the reply button.
- **`js/chapters.js`** — the ten chapters: titles, dates, text, photo paths,
  and pin positions. Both files are heavily commented.

Drop real photos into `./images/` as `.webp` (~1600px long edge, ~200–300KB
each is plenty), then change each chapter's `photo:` path. Keep paths
**relative** (`./images/foo.webp`) — root-absolute paths break on GitHub Pages.

The map artwork itself is inline SVG in `index.html` if you ever want to
redraw a coastline or add a landmark.

## Deploy to GitHub Pages

```bash
git init && git add -A && git commit -m "a map of us"
```

Push to a GitHub repo, then Settings → Pages → deploy from branch
(`main`, `/ root`). The `.nojekyll` file is already in place.

### Before you send the link

- In `index.html`, change the `og:image` meta tag to the **absolute** URL of
  `images/og.png` (e.g. `https://YOURNAME.github.io/REPO/images/og.png`) so
  the iMessage link preview shows the image. Relative og:image URLs are
  ignored by link scrapers.
- Set `replyPhone` in `js/config.js` to your real number.
- Walk the whole thing yourself once on your own phone.

## Notes

- Progress is saved in her browser (localStorage), so she resumes where she
  left off. To test from scratch, use a private tab or tap "Start from the
  beginning".
- Tap the compass five times. That's for her to find.
