/* ═══════════════════════════════════════════════════════════════
   config.js — EVERYTHING PERSONAL THAT ISN'T A CHAPTER.
   Edit this file and js/chapters.js only. No logic lives here.
   ═══════════════════════════════════════════════════════════════ */

export const CONFIG = {

  /* Her name, shown big on the title screen. */
  herName: "Lucy",

  /* One short line from you, under her name on the title screen. */
  openingLine: "Thirteen places. One map. Walk it with me?",

  /* The date the passport stamp shows when the plane lands in Palermo.
     Shown exactly as written. */
  palermoArrivalText: "18 · JUL · 2026",

  /* When she lands back in San Diego — the countdown counts to this.
     Keep the format: YYYY-MM-DDTHH:MM:SS-07:00
     (the -07:00 pins it to San Diego summer time, so the countdown is
     correct no matter where she opens it). */
  returnISO: "2026-08-12T15:05:00-07:00",

  /* The two clocks on the closing screen. Real IANA timezone names —
     daylight saving is handled automatically. */
  herCity: "Palermo",
  herTimeZone: "Europe/Rome",
  myCity: "San Diego",
  myTimeZone: "America/Los_Angeles",

  /* Closing screen. */
  closingTitle: "And that's the map so far.",
  closingMessage:
    "Every one of those pins is a day I'd live again. " +
    "The dashed part is my favorite, though — because it hasn't " +
    "happened yet, and it happens with you. Hurry home. Slowly. " +
    "Eat everything in Palermo first.",
  countdownLabel: "until you're back",
  countdownDoneText: "You're home. Come here.",

  /* The reply button — opens Messages with this prefilled.
     Use your full number with country code. */
  replyPhone: "+16195550123",
  replyBody: "I just walked the whole map. ",
  replyButton: "Send me a message ♥",
};
