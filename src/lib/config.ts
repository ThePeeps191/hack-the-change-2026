// Change the product name here only.
export const APP_NAME = "Amble";
export const APP_TAGLINE = "twenty minutes, someone new, somewhere outside";

// System 1 quests are short by design.
export const QUEST_MINUTES = 20;

// How often the client polls match and run status.
export const POLL_MS = 3000;

// Where the demo happens: roughly the middle of UCalgary main campus.
export const CAMPUS_CENTER = { lat: 51.0781, lng: -114.1309 };

// Shows "· 350 m away" beside each quest's time, measured from where you are.
// Only appears once location is already allowed, so it never asks for it.
// Set to false to switch it off everywhere; nothing else depends on it.
export const SHOW_QUEST_DISTANCE = true;
