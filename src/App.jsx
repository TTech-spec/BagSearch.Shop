import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';
import Reg from './Reg.jsx';
import Login from './login.jsx';
import Home from './home.jsx';
import Product from './Product.jsx';
import UserProfile from './userProfile.jsx';
import SellerProfile from './sellerProfile.jsx';
import ForgotPassword from './forgotPassword.jsx';
import ResetPassword from './resetPassword.jsx';

function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRecoveryLink = async () => {
      // Try to get params from hash (desktop/standard browsers)
      let hashParams = new URLSearchParams(window.location.hash.substring(1));
      let accessToken = hashParams.get('access_token');
      let refreshToken = hashParams.get('refresh_token');
      let type = hashParams.get('type');

      // Fallback: try to get params from query string (mobile email clients)
      if (!accessToken || !type) {
        const queryParams = new URLSearchParams(window.location.search);
        accessToken = accessToken || queryParams.get('access_token');
        refreshToken = refreshToken || queryParams.get('refresh_token');
        type = type || queryParams.get('type');
      }

      // Check if this is a password recovery link
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session from the URL tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error) {
            // Clear the URL to clean up the UI
            window.history.replaceState(null, '', window.location.pathname);
            // Navigate to reset password page
            navigate('/reset-password', { replace: true });
          } else {
            console.error('Failed to set session from recovery link:', error);
          }
        } catch (err) {
          console.error('Error handling recovery link:', err);
        }
      } else if ((window.location.hash && window.location.hash.includes('type=recovery')) || (window.location.search && window.location.search.includes('type=recovery'))) {
        // Fallback: if hash or query exists but tokens are missing, try to navigate
        navigate('/reset-password', { replace: true });
      }
    };

    // Handle recovery link on initial load
    handleRecoveryLink();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  // Only allow access if logged in and not loading
  if (loading) {
    return null; // Or a loading spinner
  }
  return user ? children : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const force = searchParams.get('force') === 'true';
  
  // If user is logged in and force parameter is not set, redirect to products
  if (user && !force) {
    return <Navigate to="/products" replace />;
  }
  
  return <Login />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <AuthListener />
      <Routes>
        {/* Default route -> Home (public landing page) */}
        <Route path="/" element={<Home />} />

        {/* Registration route */}
        <Route path="/register" element={<Reg />} />

        {/* Login route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Forgot Password route */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Reset Password route */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Products page - protected behind login */}
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Product />
            </PrivateRoute>
          }
        />

        {/* User Profile - protected behind login */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />

        {/* Seller Profile - protected behind login */}
        <Route
          path="/seller-profile"
          element={
            <PrivateRoute>
              <SellerProfile />
            </PrivateRoute>
          }
        />

        {/* Fallback unknown routes -> home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
