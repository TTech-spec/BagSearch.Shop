import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useContext, useEffect, Suspense, lazy } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';
import CookieConsent from './components/CookieConsent.jsx';

// Lazy load route components for better code splitting
const Home = lazy(() => import('./home.jsx'));
const NotFound = lazy(() => import('./NotFound.jsx'));
const Reg = lazy(() => import('./Reg.jsx'));
const Login = lazy(() => import('./login.jsx'));
const Product = lazy(() => import('./Product.jsx'));
const SellerProduct = lazy(() => import('./SellerProduct.jsx'));
const ProductDetail = lazy(() => import('./productDetail.jsx'));
const UserProfile = lazy(() => import('./userProfile.jsx'));
const SellerProfile = lazy(() => import('./sellerProfile.jsx'));
const Sellerlisting = lazy(() => import('./Sellerlisting.jsx'));
const CreateProduct = lazy(() => import('./createProduct.jsx'));
const ForgotPassword = lazy(() => import('./forgotPassword.jsx'));
const ResetPassword = lazy(() => import('./resetPassword.jsx'));
const VendorDetails = lazy(() => import('./vendorDetails.jsx'));
const Contact = lazy(() => import('./contact.jsx'));
const About = lazy(() => import('./about.jsx'));
const HotDeals = lazy(() => import('./hotDeals.jsx'));
const Policy = lazy(() => import('./policy.jsx'));
const PrivacyPolicy = lazy(() => import('./policy.jsx'));
const TermsOfService = lazy(() => import('./TermsOfService.jsx'));
const AuthCallback = lazy(() => import('./AuthCallback.jsx'));

// Loading spinner component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff8f4 0%, #fdf4ee 55%, #ffffff 100%)',
      gap: '14px',
      padding: '24px'
    }}>
      <style>{`
        @keyframes appLoaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes appLoaderPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>

      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: '4px solid #fde8d8',
        borderTopColor: '#c84b11',
        borderRightColor: '#f97316',
        animation: 'appLoaderSpin 0.9s linear infinite',
        boxShadow: '0 8px 24px rgba(200,75,17,0.12)'
      }} />

      <div style={{
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.03em',
        color: '#1a0a00',
        animation: 'appLoaderPulse 1.4s ease-in-out infinite'
      }}>
        Bag<span style={{ color: '#c84b11' }}>Search</span>
      </div>

      <div style={{
        color: '#9a6348',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }}>
        Loading
      </div>
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
  if (loading) return <LoadingSpinner />;
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

// Root route - show landing page for guests, redirect to products for logged-in users
function RootRoute() {
  const { loading, user } = useContext(AuthContext);
  if (loading) return <LoadingSpinner />;
  return user ? <Navigate to="/products" replace /> : <Home />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <AuthListener />
      <CookieConsent />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Default route -> Home (public landing page) or Products (if logged in) */}
          <Route path="/" element={<RootRoute />} />

          {/* OAuth callback — shows spinner while Supabase processes the auth hash */}
          <Route path="/auth/callback" element={<AuthCallback />} />

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

          {/* Product Detail page - supports both plain ID and SEO slug (name--shortId) */}
          <Route
            path="/products/:id"
            element={<ProductDetail />}
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

          {/* Contact page - public */}
          <Route path="/contact" element={<Contact />} />

          {/* About page - public */}
          <Route path="/about" element={<About />} />

          {/* Policy page - public */}
          <Route path="/policy" element={<Policy />} />

          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Hot Deals page - public */}
          <Route path="/hot-deals" element={<HotDeals />} />

          {/* Vendor Details - public */}
          <Route path="/vendor/:id" element={<VendorDetails />} />
          <Route path="/seller/:slug" element={<VendorDetails />} />

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

          {/* Custom 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
