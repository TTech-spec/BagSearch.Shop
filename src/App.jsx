import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import Reg from './Reg.jsx';
import Login from './login.jsx';
import Home from './home.jsx';

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  // Only allow access if logged in
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Default route -> Registration first */}
        <Route path="/" element={<Navigate to="/register" replace />} />

        {/* Registration route */}
        <Route path="/register" element={<Reg />} />

        {/* Login route: only accessible after registration if you want to enforce a flow.
            If you store a flag after registration, you can gate this route similarly. */}
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />

        {/* Home protected behind login */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
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
