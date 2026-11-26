import { useLocation } from 'react-router-dom';
import { LOGIN_PAUSED, LOGIN_PAUSED_MESSAGE } from '../config/loginPause';

// Strip at the top of the home page while logins are paused.
// Controlled by src/config/loginPause.js — set LOGIN_PAUSED to false to remove it.
const HOME_PATHS = ['/', '/products'];

export default function HomeNotice() {
  const { pathname } = useLocation();
  if (!LOGIN_PAUSED || !HOME_PATHS.includes(pathname)) return null;
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#FBE4DE', color: '#9B2C1A', borderBottom: '1px solid #F2C4B8', font: "700 13.5px 'Manrope',system-ui,sans-serif", textAlign: 'center', lineHeight: 1.4 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
      {LOGIN_PAUSED_MESSAGE}
    </div>
  );
}
