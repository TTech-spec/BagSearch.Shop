// Tells <LoginSuccess/> (mounted in App) to show the "Welcome back" moment.
export const LOGIN_SUCCESS_EVENT = 'bs:login-success';
// Same key WelcomeCard uses — the user was just greeted, so it stays quiet this visit
const WELCOME_SHOWN_KEY = 'bs_welcome_card_shown';

export function announceLoginSuccess({ role, user }) {
  const meta = user?.user_metadata || {};
  const fullName = (meta.full_name || meta.name || '').trim();
  const firstName = fullName.split(/\s+/)[0] || '';
  try { sessionStorage.setItem(WELCOME_SHOWN_KEY, '1'); } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent(LOGIN_SUCCESS_EVENT, { detail: { role: role === 'seller' ? 'seller' : 'buyer', firstName } }));
}
