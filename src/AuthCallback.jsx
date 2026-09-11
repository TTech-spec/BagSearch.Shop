import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import { useSEO } from './hooks/useSEO';

export default function AuthCallback() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useSEO({
    title: 'Signing In | BagSearch',
    description: 'Completing your sign-in to BagSearch. Please wait while we verify your account.',
    type: 'website',
    noindex: true,
  });

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate('/products', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff8f4 0%, #fdf4ee 55%, #ffffff 100%)',
      gap: '14px',
    }}>
      <style>{`
        @keyframes cbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cbPulse {
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
        animation: 'cbSpin 0.9s linear infinite',
        boxShadow: '0 8px 24px rgba(200,75,17,0.12)',
      }} />

      <div style={{
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.03em',
        color: '#1a0a00',
        animation: 'cbPulse 1.4s ease-in-out infinite',
      }}>
        Bag<span style={{ color: '#c84b11' }}>Search</span>
      </div>

      <div style={{
        color: '#9a6348',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Signing you in…
      </div>
    </div>
  );
}
