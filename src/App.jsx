import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useContext, useEffect, useState, Suspense, lazy } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';
import CookieConsent from './components/CookieConsent.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import VideoLoader from './components/VideoLoader.jsx';
import WelcomeCard from './components/WelcomeCard.jsx';
import { GoogleReviewsBadge } from './components/GoogleCustomerReviews';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { hasSeenOnboarding } from './utils/onboardingState';
import { CartProvider } from './context/CartContext';

// Lazy load route components for better code splitting
// const Home = lazy(() => import('./home.jsx')); // home.jsx preserved but no longer the landing page
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
const Reels = lazy(() => import('./reels.jsx'));
const Contact = lazy(() => import('./contact.jsx'));
const About = lazy(() => import('./about.jsx'));
const HotDeals = lazy(() => import('./hotDeals.jsx'));
const Policy = lazy(() => import('./policy.jsx'));
const PrivacyPolicy = lazy(() => import('./policy.jsx'));
const TermsOfService = lazy(() => import('./TermsOfService.jsx'));
const AuthCallback = lazy(() => import('./AuthCallback.jsx'));
const Onboarding = lazy(() => import('./Onboarding.jsx'));
const Pricing = lazy(() => import('./pricing.jsx'));
const SellerBankDetails = lazy(() => import('./sellerBankDetails.jsx'));
const Cart = lazy(() => import('./cartPage.jsx'));
const Orders = lazy(() => import('./ordersPage.jsx'));

// Loading screen (auth check + lazy route chunks) — plays the brand video
function LoadingSpinner() {
  // Fixed to the viewport so #root's max-width/padding (App.css) can't box it in on wide screens
  return <VideoLoader />;
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
  
  if (user && !force) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
}

function RegRoute() {
  return <Reg />;
}

// Root route — Product.jsx is always the landing page.
// First-time mobile guests (logged out, never seen the welcome slides) see the
// onboarding tour rendered as a full-screen overlay ON TOP of Product, so the
// URL stays at "/" and Product's useSEO (index, follow) remains active.
// This prevents crawlers and social bots from ever seeing the noindex onboarding page.
function RootRoute() {
  const { user, loading } = useContext(AuthContext);
  const isMobile = useIsMobileViewport();
  const [showOnboarding, setShowOnboarding] = useState(
    () => isMobile && !hasSeenOnboarding()
  );

  if (loading) return <LoadingSpinner />;

  // Once auth loads, hide onboarding if the user is already logged in
  if (showOnboarding && user) setShowOnboarding(false);

  return (
    <>
      <Product />
      {showOnboarding && !user && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <Onboarding onDone={() => setShowOnboarding(false)} />
        </div>
      )}
    </>
  );
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <CartProvider>
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

          {/* Mobile-only first-run onboarding flow (buyer/seller intro) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Forgot Password route */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Reset Password route */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Products page - public (auth-gated actions handled inside Product.jsx) */}
          <Route path="/products" element={<Product />} />
          <Route path="/vendors" element={<Product />} />

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

          {/* Cart page */}
          <Route path="/cart" element={<Cart />} />

          {/* Orders page — buyer confirms delivery to release payment */}
          <Route path="/orders" element={
            <PrivateRoute><Orders /></PrivateRoute>
          } />

          {/* Seller Pricing page - public */}
          <Route path="/pricing" element={<Pricing />} />

          {/* Seller Bank Details - protected */}
          <Route path="/bank-details" element={
            <PrivateRoute><SellerBankDetails /></PrivateRoute>
          } />

          {/* Vendor Details - public */}
          <Route path="/vendor/:id" element={<VendorDetails />} />
          <Route path="/seller/:slug" element={<VendorDetails />} />

          {/* Reels — short bag videos from sellers */}
          <Route path="/reels" element={<Reels />} />

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
      <MobileBottomNav />
      <WelcomeCard />
      <GoogleReviewsBadge />
    </Router>
    </CartProvider>
  );
}

export default App;
