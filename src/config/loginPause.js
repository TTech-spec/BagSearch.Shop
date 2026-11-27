// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAUSE SWITCH
//
// While LOGIN_PAUSED is true:
//   • nobody can log in (email or Google) — they see the error notice instead
//   • the home page shows the error notice in a card at the top
// People who are already logged in stay logged in.
//
// TO REMOVE IT: change `true` to `false` on the line below and save. That's all.
// ─────────────────────────────────────────────────────────────────────────────
export const LOGIN_PAUSED = false;

// The words shown. Change them here; nothing else needs editing.
export const LOGIN_PAUSED_TITLE = 'Database error';
export const LOGIN_PAUSED_HOME_TEXT = "We're having trouble signing people in right now. Please try again later.";
export const LOGIN_PAUSED_LOGIN_TEXT = "We couldn't log you in. Please try again later.";

// Used internally to mark the login error as "the paused one".
export const LOGIN_PAUSED_MESSAGE = `${LOGIN_PAUSED_TITLE}. Please try again later.`;
