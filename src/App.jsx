import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useContext, useEffect, Suspense, lazy } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';

// Lazy load route components for better code splitting
const Reg = lazy(() => import('./Reg.jsx'));
const Login = lazy(() => import('./login.jsx'));
const Home = lazy(() => import('./home.jsx'));
const Product = lazy(() => import('./Product.jsx'));
const SellerProduct = lazy(() => import('./SellerProduct.jsx'));
const ProductDetail = lazy(() => import('./productDetail.jsx'));
const UserProfile = lazy(() => import('./userProfile.jsx'));
const SellerProfile = lazy(() => import('./sellerProfile.jsx'));
const Sellerlisting = lazy(() => import('./Sellerlisting.jsx'));
const CreateProduct = lazy(() => import('./createProduct.jsx'));
const ForgotPassword = lazy(() => import('./forgotPassword.jsx'));
const ResetPassword = lazy(() => import('./resetPassword.jsx'));

// Loading spinner component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      <div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div>
    </div>
  );
}

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

function RegRoute() {
  return <Reg />;
}

// Root route - always redirect to products
function RootRoute() {
  const { loading } = useContext(AuthContext);
  if (loading) return null;
  return <Navigate to="/products" replace />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <AuthListener />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Default route -> Home (public landing page) or Products (if logged in) */}
          <Route path="/" element={<RootRoute />} />

          {/* Registration route */}
          <Route path="/register" element={<RegRoute />} />

          {/* Login route */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Forgot Password route */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Reset Password route */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Products page - public (auth-gated actions handled inside Product.jsx) */}
          <Route path="/products" element={<Product />} />

          {/* Seller storefront from vendor cards */}
          <Route path="/seller-products" element={<SellerProduct />} />
          <Route path="/seller-product" element={<SellerProduct />} />

          {/* Product Detail page - protected behind login */}
          <Route
            path="/products/:id"
            element={
              <PrivateRoute>
                <ProductDetail />
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

          {/* Create Product - protected behind login */}
          <Route
            path="/upload-product"
            element={
              <PrivateRoute>
                <CreateProduct />
              </PrivateRoute>
            }
          />

          {/* Seller Listings - protected behind login */}
          <Route
            path="/seller-listing"
            element={
              <PrivateRoute>
                <Sellerlisting />
              </PrivateRoute>
            }
          />

          {/* Fallback unknown routes -> home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
