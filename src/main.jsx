import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ErrorBoundary } from './utils/errorHandler.js'

// After a new deploy, a tab left open from before the deploy can try to
// dynamically import() a lazy route chunk whose hashed filename no longer
// exists on the server. Vite fires this event for exactly that case — recover
// with a single automatic reload instead of letting it fall through to the
// error boundary as a dead end.
window.addEventListener('vite:preloadError', () => {
  const key = 'bagsearch_reloaded_after_preload_error';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
