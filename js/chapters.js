/* ═══════════════════════════════════════════════════════════════
   chapters.js — THE STORY. All ten chapters, in the order she
   walks them. Edit this file and js/config.js only.

   Each chapter:
     id       unique string, used for pins & saving progress —
              don't reuse one, otherwise anything goes
     title    heading on the memory card
     date     shown exactly as written ("October 2024" is fine)
     place    small label above the title
     act      which map framing this chapter uses:
                1 = San Diego up close
                2 = Southern California
                3 = the world / Sicily
                4 = the return, up the coast
     status   "past" | "present" | "future"
              (present = her Palermo pin, future = dashed route)
     x, y     WHERE THE PIN SITS, as percentages of the map
              (x: 0 = far left, 100 = far right; y: 0 = top).
              Nudge by ±0.5 to fine-tune a pin's spot.
     photo    RELATIVE path to the image. Drop your real photos in
              ./images/ as .webp (~1600px long edge) and change the
              path here — nothing else needs to change.
     caption  small handwritten line on the photo (can be "")
     body     the memory itself, a few sentences

   Chapter 7 (the airport) is special: its button says "Board the
   plane" and tapping it plays the flight. That's wired to its
   position (7th entry) — keep the airport 7th and Palermo 8th.
   ═══════════════════════════════════════════════════════════════ */

export const CHAPTERS = [

  { // ── 1 ────────────────────────────────────────────────
    id: "ucsd",
    title: "Where it started",
    date: "October 12, 2024",
    place: "UC San Diego",
    act: 1, status: "past",
    x: 14.0, y: 73.6,
    photo: "./images/ch01.svg",
    caption: "the eighth floor of Geisel",
    body: "You were arguing with your laptop in the library and I pretended I needed the outlet next to you. I did not need the outlet. I have never once needed an outlet that badly. Best fake charging emergency of my life.",
  },

  { // ── 2 ────────────────────────────────────────────────
    id: "sunset-cliffs",
    title: "The first real date",
    date: "November 3, 2024",
    place: "Sunset Cliffs",
    act: 1, status: "past",
    x: 12.8, y: 82.3,
    photo: "./images/ch02.svg",
    caption: "you said the ocean was showing off",
    body: "We sat on the edge until the sun went down and then kept sitting there in the dark because neither of us wanted to say the night was over. You stole my jacket. It's still yours.",
  },

  { // ── 3 ────────────────────────────────────────────────
    id: "balboa-park",
    title: "Valentine's at the park",
    date: "February 14, 2025",
    place: "Balboa Park",
    act: 1, status: "past",
    x: 16.8, y: 78.9,
    photo: "./images/ch03.svg",
    caption: "churros count as lunch",
    body: "The botanical building, the koi pond, the guy with the parrot who would not leave us alone. You made me take a photo with the parrot. I framed the photo of you laughing at me instead.",
  },

  { // ── 4 ────────────────────────────────────────────────
    id: "coronado",
    title: "The beach day",
    date: "May 24, 2025",
    place: "Coronado",
    act: 1, status: "past",
    x: 14.9, y: 84.3,
    photo: "./images/ch04.svg",
    caption: "gold sand, red roofs",
    body: "You buried my phone in the sand \"so I'd be present.\" I was present. I was extremely present for the forty-five minutes it took to find my phone.",
  },

  { // ── 5 ────────────────────────────────────────────────
    id: "six-flags",
    title: "The rollercoaster negotiation",
    date: "July 19, 2025",
    place: "Six Flags Magic Mountain",
    act: 2, status: "past",
    x: 10.3, y: 57.4,
    photo: "./images/ch05.svg",
    caption: "you screamed first. it's on record.",
    body: "Two hours north, one hour in line, ninety seconds of you gripping my arm hard enough to leave a mark. You said \"again\" before we'd even stopped moving. We rode it four times.",
  },

  { // ── 6 ────────────────────────────────────────────────
    id: "irvine",
    title: "The accidental day trip",
    date: "March 8, 2026",
    place: "Irvine",
    act: 2, status: "past",
    x: 13.5, y: 68.9,
    photo: "./images/ch06.svg",
    caption: "boba pilgrimage",
    body: "We drove up \"for one specific bakery\" and came home six hours later with three kinds of boba, a plant, and a plan to move somewhere with more trees. The plant's name is Gerald. Gerald is thriving.",
  },

  { // ── 7 ── THE FLIGHT TRIGGER ──────────────────────────
    id: "airport",
    title: "The hardest goodbye",
    date: "July 17, 2026",
    place: "San Diego International",
    act: 1, status: "past",
    x: 14.7, y: 80.6,
    photo: "./images/ch07.svg",
    caption: "gate 47, too early in the morning",
    body: "I watched you walk through security backwards so you could keep waving. You almost took out a stanchion. Then you were gone, and the whole airport felt like a room with the lights off. Okay. Deep breath. Go have your adventure —",
  },

  { // ── 8 ── WHERE SHE IS NOW ────────────────────────────
    id: "palermo",
    title: "You are here",
    date: "right now",
    place: "Palermo, Sicily",
    act: 3, status: "present",
    x: 88.0, y: 62.0,
    photo: "./images/ch08.svg",
    caption: "somewhere near the good arancine",
    body: "Six thousand miles away, eating better than I ever will, sending me photos of doors. Beautiful doors, to be fair. I hope Palermo is being as good to you as you are to everyone. The boat offshore is me, metaphorically. Waiting. Bobbing.",
  },

  { // ── 9 ────────────────────────────────────────────────
    id: "landing",
    title: "When you land",
    date: "August 12, 2026",
    place: "San Diego, again",
    act: 4, status: "future",
    x: 15.4, y: 81.4,
    photo: "./images/ch09.svg",
    caption: "I'll be the one with the sign",
    body: "The route home is dashed because it hasn't been drawn yet — but I already know how it goes. I'm at arrivals, embarrassingly early, holding a sign with an inside joke on it. You know the one.",
  },

  { // ── 10 ── THE FINAL BEAT ─────────────────────────────
    id: "bay-area",
    title: "The drive north",
    date: "late August, 2026",
    place: "The Bay Area",
    act: 4, status: "future",
    x: 8.8, y: 36.0,
    photo: "./images/ch10.svg",
    caption: "everyone's going to love you",
    body: "One week after you're back: the coast road, a playlist we'll fight over, and at the end of it — my family, who already ask about you by name. This is the pin I've been waiting to place the longest. Come home and let's go draw it in.",
  },
];
