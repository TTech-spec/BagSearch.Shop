import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { supabase } from './services/api';
import Reg from './Reg.jsx';
import Login from './login.jsx';
import Home from './home.jsx';
import UserProfile from './userProfile.jsx';
import ForgotPassword from './forgotPassword.jsx';
import ResetPassword from './resetPassword.jsx';

function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
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
  const { user } = useContext(AuthContext);
  // Only allow access if logged in
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <AuthListener />
      <Routes>
        {/* Default route -> Registration first */}
        <Route path="/" element={<Navigate to="/register" replace />} />

        {/* Registration route */}
        <Route path="/register" element={<Reg />} />

        {/* Login route: only accessible after registration if you want to enforce a flow.
            If you store a flag after registration, you can gate this route similarly. */}
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />

        {/* Forgot Password route */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Reset Password route */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Home protected behind login */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* User Profile protected behind login */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />

        {/* Fallback unknown routes -> registration */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
