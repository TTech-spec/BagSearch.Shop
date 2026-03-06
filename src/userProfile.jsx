import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, History, AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { supabase } from './services/api';

// ─── Color Palette (warm orange/peach inspired by Criibb) ────────────────────
const C = {
  primary:      '#c84b11',
  primaryLight: '#f97316',
  primaryBg:    '#fde8d8',
  primaryPale:  '#fdf4ee',
  primaryBorder:'#f9c4a0',
  accent:       '#ea580c',
  success:      '#16a34a',
  successBg:    '#dcfce7',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  surface:      '#ffffff',
  surfaceDim:   '#fdf8f5',
  border:       '#f0d9cc',
  borderLight:  '#f7ece4',
  text:         '#1a0a00',
  textMid:      '#5c3317',
  textMuted:    '#9a6348',
  textFaint:    '#c4957a',
};

// ─── Icon Component ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 22 }) => (
  <span style={{
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: "normal", fontStyle: "normal", fontSize: size,
    lineHeight: 1, display: "inline-block", textTransform: "none",
    letterSpacing: "normal", wordWrap: "normal", whiteSpace: "nowrap", direction: "ltr",
  }}>{name}</span>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
function fmtShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1200, delay = 0 }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target == null || started.current) return;
    const t = setTimeout(() => {
      started.current = true;
      const steps = 40;
      const stepTime = duration / steps;
      let current = 0;
      const timer = setInterval(() => {
        current++;
        setCount(Math.round((target / steps) * current));
        if (current >= steps) { setCount(target); clearInterval(timer); }
      }, stepTime);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return <>{count}</>;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ style = {} }) {
  return (
    <div aria-hidden="true" style={{
      background: `linear-gradient(90deg, ${C.primaryBg} 25%, ${C.surfaceDim} 50%, ${C.primaryBg} 75%)`,
      backgroundSize: "400px 100%",
      animation: "skeletonShimmer 1.6s ease infinite",
      borderRadius: 8,
      ...style,
    }} />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function UserProfile() {
  const navigate = useNavigate();
  const [profile,       setProfile]       = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // Page entrance states
  const [headerIn,  setHeaderIn]  = useState(false);
  const [heroIn,    setHeroIn]    = useState(false);
  const [cardsIn,   setCardsIn]   = useState(false);
  const [statsIn,   setStatsIn]   = useState(false);

  useEffect(() => {
    setTimeout(() => setHeaderIn(true),  80);
    setTimeout(() => setHeroIn(true),    240);
    setTimeout(() => setCardsIn(true),   420);
    setTimeout(() => setStatsIn(true),   580);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true); setError(null);
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!user)   throw new Error('Not authenticated. Please sign in.');
        const userId = user.id;

        const { data: profileData } = await supabase
          .from('users')
          .select('user_id, full_name, email, phone, role, created_at')
          .eq('user_id', userId)
          .maybeSingle();

        const profile = profileData || {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'buyer',
          created_at: user.created_at,
        };
        setProfile(profile);

        const { data: historyData, error: historyErr } = await supabase
          .from('search_history')
          .select('query, created_at, type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (historyErr) { console.warn('Search history not available:', historyErr.message); setSearchHistory([]); }
        else setSearchHistory(historyData ?? []);

        const total  = historyData?.length ?? 0;
        const images = historyData?.filter(h => h.type === 'image').length ?? 0;

        const [ordersResult, savedResult] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        setStats({
          totalSearches: total,
          imageSearches: images,
          orders: ordersResult.error ? 0 : (ordersResult.count ?? 0),
          savedItems: savedResult.error ? 0 : (savedResult.count ?? 0),
        });
      } catch (err) {
        console.error('Profile load error:', err);
        setError(err.message ?? 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const isSeller = profile?.role === 'seller';

  // ── Error state ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${C.primaryPale} 0%, ${C.surfaceDim} 25%, white 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <AlertCircle size={32} color={C.danger} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Unable to load profile</h2>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={primaryBtnStyle}>Try Again</button>
        </div>
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${C.primaryPale} 0%, ${C.surfaceDim} 25%, white 100%)`, fontFamily: "'Manrope', sans-serif", color: C.text, position: "relative", overflow: "hidden" }}>

      {/* ── Global styles + keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes skeletonShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes avatarRing {
          0%, 100% { box-shadow: 0 0 0 3px ${C.primary}, 0 0 32px rgba(200,75,17,0.35); }
          50%       { box-shadow: 0 0 0 4px ${C.primaryLight}, 0 0 44px rgba(249,115,22,0.5); }
        }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50%       { opacity: 0.07; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scanLine {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
        @keyframes historyIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.surfaceDim}; }
        ::-webkit-scrollbar-thumb { background: ${C.primaryBorder}; borderRadius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.primary}; }
      `}</style>

      {/* ── Background: light grid + subtle glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(200,75,17,0.12) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />
        <div style={{ position: "absolute", top: -100, left: -100, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, rgba(200,75,17,0.08) 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", bottom: -120, right: -80, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)` }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${C.borderLight}`,
        boxShadow: `0 1px 0 ${C.primaryBorder}`,
        opacity: headerIn ? 1 : 0,
        transform: headerIn ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 14, height: 68 }}>

          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceDim, cursor: "pointer", color: C.textMuted, fontSize: 13, fontWeight: 600, transition: "all 0.2s", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.borderColor = C.primaryBorder; e.currentTarget.style.color = C.primary; e.currentTarget.style.transform = "translateX(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surfaceDim; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.transform = "none"; }}
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            Back
          </button>

          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", flex: 1, fontFamily: "'Manrope', sans-serif" }}>
            My Profile
          </span>

          {!loading && isSeller && (
            <button
              onClick={() => navigate('/upload-product')}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", fontFamily: "inherit", transition: "all 0.2s", boxShadow: `0 4px 16px rgba(200,75,17,0.3)` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(200,75,17,0.45)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(200,75,17,0.3)`; }}
            >
              <Upload size={15} strokeWidth={2.2} />
              Upload Product
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* ── HERO CARD ── */}
        <div style={{
          position: "relative", marginBottom: 28, borderRadius: 24, overflow: "hidden",
          border: `1px solid ${C.borderLight}`,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
          boxShadow: `0 4px 40px rgba(200,75,17,0.08)`,
          opacity: heroIn ? 1 : 0,
          transform: heroIn ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${C.primaryBg} 0%, ${C.primaryPale} 40%, ${C.primaryBg} 100%)`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(200,75,17,0.2) 0%, rgba(249,115,22,0.15) 50%, rgba(200,75,17,0.1) 100%)`, backgroundSize: "300% 300%" }} />
            {[15, 35, 55, 75].map(p => (
              <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(0,0,0,0.04)" }} />
            ))}
          </div>

          <div style={{ padding: "0 36px 36px" }}>
            <div style={{ marginTop: -52, marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                {loading ? (
                  <Skeleton style={{ width: 88, height: 88, borderRadius: "50%" }} />
                ) : (
                  <>
                    <div style={{
                      width: 88, height: 88, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 900, color: "white",
                      fontFamily: "'Manrope', sans-serif",
                      animation: "avatarRing 3s ease-in-out infinite",
                      border: "3px solid #fff",
                      position: "relative", zIndex: 1,
                    }}>
                      {initials}
                    </div>
                    <div style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff", zIndex: 2, animation: "floatDot 2s ease-in-out infinite" }} />
                  </>
                )}
              </div>

              {!loading && isSeller && (
                <button
                  onClick={() => navigate('/upload-product')}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.primaryBorder}`, background: C.primaryBg, cursor: "pointer", color: C.primary, fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.primaryBg; }}
                >
                  <Upload size={14} /> Upload Product
                </button>
              )}
            </div>

            {loading ? (
              <div>
                <Skeleton style={{ height: 32, width: 200, marginBottom: 10 }} />
                <Skeleton style={{ height: 16, width: 160, marginBottom: 14 }} />
                <div style={{ display: "flex", gap: 8 }}><Skeleton style={{ height: 26, width: 70, borderRadius: 20 }} /><Skeleton style={{ height: 26, width: 90, borderRadius: 20 }} /></div>
              </div>
            ) : (
              <div>
                <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", marginBottom: 6, fontFamily: "'Manrope', sans-serif", lineHeight: 1 }}>
                  {profile?.full_name ?? '—'}
                </h1>
                <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} color={C.primary} /> Member since {fmt(profile?.created_at)}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile?.role && (
                    <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: isSeller ? C.primaryBg : C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}` }}>
                      {profile.role}
                    </span>
                  )}
                  <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.04)", color: C.textMuted, border: `1px solid ${C.borderLight}` }}>
                    {stats?.totalSearches ?? 0}+ Searches
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GRID: Contact + History ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20,
          opacity: cardsIn ? 1 : 0,
          transform: cardsIn ? "none" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}>

          {/* Contact Info */}
          <div style={lightCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={16} color={C.primary} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em" }}>Contact Info</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ContactRow icon={<Mail size={15} color={C.primary} />} iconBg={C.primaryBg} iconBorder={C.primaryBorder} label="Email" loading={loading} value={profile?.email} />
              <ContactRow icon={<Phone size={15} color={C.success} />} iconBg={C.successBg} iconBorder={C.primaryBorder} label="Phone" loading={loading} value={profile?.phone} />
              <ContactRow icon={<Calendar size={15} color={C.accent} />} iconBg={C.primaryBg} iconBorder={C.primaryBorder} label="Member Since" loading={loading} value={fmt(profile?.created_at)} />
            </div>
          </div>

          {/* Search History */}
          <div style={lightCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <History size={16} color={C.primary} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em" }}>Recent Searches</h2>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : searchHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ color: C.textFaint, fontSize: 13 }}>No search history yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {searchHistory.map((item, index) => (
                  <HistoryRow key={index} item={item} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{
          ...lightCard,
          opacity: statsIn ? 1 : 0,
          transform: statsIn ? "none" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.successBg, border: `1px solid ${C.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em" }}>Activity Stats</h2>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 100, borderRadius: 14 }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              <StatBox value={stats?.totalSearches} label="Total Searches" icon="search"        color={C.primary} glow={C.primaryBg}   delay={0}   />
              <StatBox value={stats?.orders}        label="Orders Placed"  icon="shopping_bag"  color={C.success} glow={C.successBg} delay={120} />
              <StatBox value={stats?.imageSearches} label="Image Searches" icon="photo_camera"  color={C.accent} glow={C.primaryBg}  delay={240} />
              <StatBox value={stats?.savedItems}    label="Saved Items"    icon="bookmark"      color={C.accent} glow={C.primaryBg}  delay={360} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared light card style ─────────────────────────────────────────────────
const lightCard = {
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(16px)",
  border: `1px solid ${C.borderLight}`,
  borderRadius: 20,
  padding: "28px 28px",
  boxShadow: `0 4px 32px rgba(200,75,17,0.05)`,
};

// ─── Primary btn style ───────────────────────────────────────────────────────
const primaryBtnStyle = {
  padding: "11px 28px", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
  color: "white", border: "none", borderRadius: 10, cursor: "pointer",
  fontSize: 14, fontWeight: 700, fontFamily: "inherit",
};

// ─── Contact row ─────────────────────────────────────────────────────────────
function ContactRow({ icon, iconBg, iconBorder, label, loading, value }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 14px", borderRadius: 12,
        background: hovered ? C.surfaceDim : "transparent",
        border: `1px solid ${hovered ? C.border : 'transparent'}`,
        transition: "all 0.2s ease", cursor: "default",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.2s", transform: hovered ? "scale(1.08)" : "scale(1)" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textFaint, marginBottom: 3 }}>{label}</p>
        {loading
          ? <Skeleton style={{ height: 14, width: 140 }} />
          : <p style={{ fontSize: 13, fontWeight: 600, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value ?? '—'}</p>
        }
      </div>
    </div>
  );
}

// ─── History row ─────────────────────────────────────────────────────────────
function HistoryRow({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const isImage = item.type === 'image';
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", borderRadius: 10,
        background: hovered ? C.surfaceDim : C.primaryPale,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        transition: "all 0.2s ease", cursor: "default",
        animation: `historyIn 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 50}ms both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: isImage ? C.accent : C.primary, flexShrink: 0, boxShadow: `0 0 6px ${isImage ? C.accent : C.primary}` }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.query}</p>
          <p style={{ fontSize: 10, color: C.textFaint, marginTop: 1 }}>{fmtShort(item.created_at)}</p>
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20, background: isImage ? C.primaryBg : C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}`, flexShrink: 0, marginLeft: 8 }}>
        {item.type}
      </span>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ value, label, icon, color, glow, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "22px 20px", borderRadius: 14, textAlign: "center",
        background: hovered ? glow : C.surfaceDim,
        border: `1px solid ${hovered ? color + "44" : C.borderLight}`,
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 28px ${glow}` : "none",
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <Icon name={icon} size={22} />
      </div>
      <p style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6, fontFamily: "'Manrope', sans-serif" }}>
        {value != null ? <AnimatedNumber target={value} duration={1000} delay={delay} /> : 0}
      </p>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
    </div>
  );
}

export default UserProfile;

