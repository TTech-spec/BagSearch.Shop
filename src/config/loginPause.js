// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAUSE SWITCH
//
// While LOGIN_PAUSED is true:
//   • nobody can log in (email or Google) — they see MESSAGE instead
//   • the home page shows MESSAGE in a strip at the top
// People who are already logged in stay logged in.
//
// TO REMOVE IT: change `true` to `false` on the line below and save. That's all.
// ─────────────────────────────────────────────────────────────────────────────
export const LOGIN_PAUSED = true;

export const LOGIN_PAUSED_MESSAGE = 'Database error. Please try again later.';
