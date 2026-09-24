// src/components/tour/tourState.js
// Remembers (per device) that the first-visit tour has been seen.
const TOUR_DONE_KEY = 'bs_tour_done';

export const tourAlreadyDone = () => {
  try { return localStorage.getItem(TOUR_DONE_KEY) === '1'; } catch { return true; }
};

export const markTourDone = () => {
  try { localStorage.setItem(TOUR_DONE_KEY, '1'); } catch { /* storage blocked */ }
};
