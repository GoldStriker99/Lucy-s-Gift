/* ═══════════════════════════════════════════════════════════════
   chapters.js — THE STORY. Thirteen chapters, in the order she
   walks them. Edit this file and js/config.js only.

   Each chapter:
     id       unique string — don't reuse one; anything else goes
     title    heading on the memory card
     date     shown exactly as written ("summer 2025" is fine)
     place    small label above the title
     act      which map framing this chapter uses:
                1 = San Diego, up close
                2 = Southern California + Nevada
                3 = the world (Sicily)
                4 = California, coast to coast
     status   "past" | "present" | "future"
              (present = her Palermo pin, future = dashed route)
     lat/lon  REAL COORDINATES. The map is real geography, so a pin
              lands exactly here. To move one: open Google Maps,
              right-click the exact spot, and the lat/lon appears at
              the top of the menu — paste those two numbers in.
     photo    RELATIVE path. Drop real photos in ./images/ as .webp
              (~1600px long edge) and change the path — nothing else.
     caption  small handwritten line on the photo (may be "")
     body     the memory itself

   THE FLIGHT is wired to position, not to id: chapter 10 (Irvine)
   is the last stop before she leaves, so its button says "Board the
   plane", and chapter 11 (Palermo) is where it lands. If you
   reorder these two, update FLIGHT_AT in js/navigation.js and
   FLIGHT_SEG in js/route.js to match.
   ═══════════════════════════════════════════════════════════════ */

export const CHAPTERS = [

  { // ── 1 ────────────────────────────────────────────────
    id: "price-center",
    title: "Where it started",
    date: "the night of the show",
    place: "Price Center Theater, UCSD",
    act: 1, status: "past",
    lat: 32.880320, lon: -117.235720,
    photo: "./images/ch01.svg",
    caption: "a live dating show, of all things",
    body: "Of all the ways two people can meet, we picked the one with an audience. I still think about how calm you looked up there and how completely not-calm I was. Whatever the show was actually for, this is the part I kept.",
  },

  { // ── 2 ────────────────────────────────────────────────
    id: "dorm-steak",
    title: "The steak",
    date: "a few days later",
    place: "Justice Lane, Earl Warren",
    act: 1, status: "past",
    lat: 32.882280, lon: -117.232240,
    photo: "./images/ch02.svg",
    caption: "cooked in a dorm, somehow",
    body: "First time seeing you off-camera, and I decided the move was to cook. In a dorm. With one pan. It worked — and you looked genuinely surprised, which I'm choosing to remember as being impressed.",
  },

  { // ── 3 ────────────────────────────────────────────────
    id: "catania",
    title: "Our first date",
    date: "the first real one",
    place: "Catania, La Jolla",
    act: 1, status: "past",
    lat: 32.846520, lon: -117.274200,
    photo: "./images/ch03.svg",
    caption: "Girard Ave, above the water",
    body: "An Italian place on Girard, which is funny to think about now that you're actually in Sicily eating the real thing. Everything after this was easier. We ran out of restaurant before we ran out of things to say.",
  },

  { // ── 4 ────────────────────────────────────────────────
    id: "vegas",
    title: "Vegas formal",
    date: "our first trip",
    place: "Las Vegas",
    act: 2, status: "past",
    lat: 36.082060, lon: -115.172770,
    photo: "./images/ch04.svg",
    caption: "the sign, obviously",
    body: "First trip together, which is a real test, and we passed. Four hours of desert each way and you were still talking to me at the end of it. That's when I stopped thinking of this as a new thing.",
  },

  { // ── 5 ────────────────────────────────────────────────
    id: "sixth-college",
    title: "End of the year",
    date: "end of the school year",
    place: "Sixth College, UCSD",
    act: 1, status: "past",
    lat: 32.880350, lon: -117.242170,
    photo: "./images/ch05.svg",
    caption: "the year, finished",
    body: "Everyone spilling out of the res halls, the year finally over, that specific summer-is-starting feeling. Mostly I remember looking around a crowded room and being glad about exactly one person in it.",
  },

  { // ── 6 ────────────────────────────────────────────────
    id: "thrifting",
    title: "Thrifting before the drive",
    date: "before the Bay Area trip",
    place: "La Mesa Boulevard",
    act: 1, status: "past",
    lat: 32.764870, lon: -117.019930,
    photo: "./images/ch06.svg",
    caption: "one more rack, I promise",
    body: "Killing time in a thrift store before the long drive north, trying on things neither of us was going to buy. It shouldn't be a memory worth pinning. It is anyway — that's sort of the point of this map.",
  },

  { // ── 7 ────────────────────────────────────────────────
    id: "six-flags",
    title: "Magic Mountain",
    date: "the rollercoaster day",
    place: "Six Flags, Valencia",
    act: 2, status: "past",
    lat: 34.424940, lon: -118.595740,
    photo: "./images/ch07.svg",
    caption: "you screamed first. it's on record.",
    body: "Two hours north, an hour in line, ninety seconds of you gripping my arm hard enough to leave a mark. You said \"again\" before the ride had fully stopped moving.",
  },

  { // ── 8 ────────────────────────────────────────────────
    id: "del-mar",
    title: "The fair",
    date: "fair season",
    place: "Del Mar Fairgrounds",
    act: 1, status: "past",
    lat: 32.972070, lon: -117.259790,
    photo: "./images/ch08.svg",
    caption: "fried everything, ferris wheel, salt air",
    body: "The fair by the racetrack, that stretch where the lagoon meets the ocean. Too much fried food and a ferris wheel at exactly the right time of evening. You won something small and carried it around all night like a trophy.",
  },

  { // ── 9 ────────────────────────────────────────────────
    id: "love-letter",
    title: "The letter",
    date: "the one I wrote down",
    place: "Fortune Lane, La Mesa",
    act: 1, status: "past",
    lat: 32.766970, lon: -116.995150,
    photo: "./images/ch09.svg",
    caption: "handed over in person",
    body: "Some things you can't say out loud without ruining them, so I wrote it down instead and handed it to you here. I meant all of it. I still do — that's the short version, and you already have the long one.",
  },

  { // ── 10 ── THE FLIGHT DEPARTS FROM HERE ───────────────
    id: "irvine-odyssey",
    title: "The Odyssey, in 70mm",
    date: "right before you left",
    place: "Regal Irvine Spectrum",
    act: 2, status: "past",
    lat: 33.650100, lon: -117.743040,
    photo: "./images/ch10.svg",
    caption: "70mm IMAX, worth the drive",
    body: "We drove to Orange County to watch a three-hour film about a man trying to get home across the sea, and then, almost immediately, you got on a plane and crossed one. I didn't plan that. I'm taking credit for it anyway.",
  },

  { // ── 11 ── WHERE SHE IS NOW ───────────────────────────
    id: "palermo",
    title: "You are here",
    date: "right now",
    place: "Palermo, Sicily",
    act: 3, status: "present",
    lat: 38.111230, lon: 13.352440,
    photo: "./images/ch11.svg",
    caption: "somewhere near the good arancine",
    body: "Six thousand miles away, eating better than I ever will, sending me photos of doors. Beautiful doors, to be fair. The little boat off the coast is me, metaphorically. Waiting. Bobbing.",
  },

  { // ── 12 ────────────────────────────────────────────────
    id: "landing",
    title: "When you land",
    date: "the day you're back",
    place: "San Diego, again",
    act: 4, status: "future",
    lat: 32.733360, lon: -117.192250,
    photo: "./images/ch12.svg",
    caption: "I'll be the one at arrivals",
    body: "The route home is dashed because it hasn't happened yet — but I already know how it goes. I'm at arrivals embarrassingly early, and the drive back is the shortest twenty minutes of the whole year.",
  },

  { // ── 13 ── THE FINAL BEAT ─────────────────────────────
    id: "bay-area",
    title: "The drive north",
    date: "after you're home",
    place: "The Bay Area",
    act: 4, status: "future",
    lat: 37.258150, lon: -121.943040,
    photo: "./images/ch13.svg",
    caption: "everyone's going to love you",
    body: "Then the coast road, a playlist we'll argue about, and at the end of it my family — who already ask about you by name. This is the pin I've been waiting to place the longest. Come home and let's go draw it in.",
  },
];
