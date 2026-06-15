import { useNavigate } from 'react-router-dom';
import LogoIcon from './components/Logo.jsx';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#fff8f4 0%,#fdf4ee 55%,#ffffff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ marginBottom: 24 }}>
        <LogoIcon size={48} />
      </div>

      <div style={{
        fontSize: 'clamp(5rem, 18vw, 8rem)',
        fontWeight: 900,
        color: '#fde8d8',
        lineHeight: 1,
        marginBottom: 8,
        letterSpacing: '-0.06em',
        userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
        fontWeight: 800,
        color: '#1a0a00',
        marginBottom: 10,
        letterSpacing: '-0.03em',
        textAlign: 'center',
      }}>
        Page not found
      </h1>

      <p style={{
        color: '#9a6348',
        fontSize: 15,
        fontWeight: 500,
        lineHeight: 1.6,
        maxWidth: 360,
        textAlign: 'center',
        marginBottom: 32,
      }}>
        The page you're looking for doesn't exist or may have been moved.
        Try browsing our luxury designer bags instead.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/products')}
          style={{
            padding: '13px 28px',
            background: 'linear-gradient(135deg,#c84b11,#f97316)',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(200,75,17,0.25)',
          }}
        >
          Browse Bags
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '13px 28px',
            background: 'white',
            color: '#c84b11',
            border: '1.5px solid #f9c4a0',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Hot Deals', path: '/hot-deals' },
          { label: 'Contact Us', path: '/contact' },
          { label: 'About', path: '/about' },
        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9a6348',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
