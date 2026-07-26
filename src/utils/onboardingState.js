export const ONBOARDING_SEEN_KEY = 'bagsearch_onboarding_seen';

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // localStorage unavailable (private mode) — safe to ignore
  }
}
