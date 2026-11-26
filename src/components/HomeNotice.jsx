import { useLocation } from 'react-router-dom';
import { LOGIN_PAUSED } from '../config/loginPause';
import PausedNotice from './PausedNotice.jsx';

// Card at the top of the home page while logins are paused.
// Controlled by src/config/loginPause.js — set LOGIN_PAUSED to false to remove it.
const HOME_PATHS = ['/', '/products'];

export default function HomeNotice() {
  const { pathname } = useLocation();
  if (!LOGIN_PAUSED || !HOME_PATHS.includes(pathname)) return null;
  return <PausedNotice variant="home" />;
}
