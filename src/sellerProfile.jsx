import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

const inquiries = [
  { id: 1, bag: 'Classic Leather Tote', sku: 'BT-2041', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1M-wNA_bDjdtXcWFW2QQ0Ap7H7fHvxOZkodgM-Y2TJUYl_INGZIeYNItkrfwCultBnZL7YWSxI9aWicu3lYoTQX76ihjq-4JVOVmBqUWC49ml9jbAvu_0oPPBCNMCa5ecigl35vGH3JkFwhsdfuywahciLurV0Qg2EIUIuf7Yef7m3nOUVmQwCdaQ6I9UmF5ubB4pz27Wk-3kyO0aKi293kQpytkSxa89xvgKAdktzshKTqWKcT_hpuxGwsQVRpoIwWLtHOR3sY', buyer: 'Sarah Jenkins', source: 'visual', time: '2 mins ago', replied: false },
  { id: 2, bag: 'Suede Crossbody', sku: 'BC-5592', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9TsB1OZKW1UX2EF8YrcsHRB7QvWhHeVYXdDnyZbtG4RGsbyBnIhSX0DeNHq4vtIpwZYlm0RAXqDR6uVRCZdla9Yuw3IlnxkzqFGDJSM8HNtiF1MlH2bAZyj0RMGTHFUCYuMCyTcbDTkUNxI7RW84cgcw36Y91iTzEC6CDGInerpFD7lmrhPKnvvuX4sjYsbMCxJ2ijCmO-M3G5fya4FGV6cTI0r0oUlqBxB-dYe0N-HEINpbeJFZlMKd8T6SdjBeunheBtOHU5KU', buyer: 'Michael Chen', source: 'direct', time: '15 mins ago', replied: false },
  { id: 3, bag: 'Travel Duffel XL', sku: 'BD-8820', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNPSuErvUQzNWlP1jYgHSy35w8kbHLVCEs-z6BHzB6xA3u31e0J35RsxamS01C-q8pZw-YDAFx8jszYBqBVe-pQuYzqs7m-V-wqkK12hRnyY9E_AWsjN2o_ZiFUNq7wNroeQfCEaO9lFYze1_1qp3f9vTUhZMzUApAquoMX30pEJbLCYvFaTyW68liLQviWg7jTlfXNIoPWod6OhbUw2jFi9H33pu_SpHHJK88W5DT-19YUcVNf5lF3AKjRWwOzmGAMB0frIyFcdk', buyer: 'Elena Rodriguez', source: 'visual', time: '1 hour ago', replied: false },
  { id: 4, bag: 'Mini Evening Clutch', sku: 'BE-1102', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8WJ-IF2cV5qDy3_g9-2gwA_7dQQdyJMhg6iA89yowNnmZfUBdBvev_h1yO7J1hg-VhQvGbABZTQw4bOI_iq5hBkPNLmx8jihUw89dE6SvlLzw78nn0DCRCGYuiWuxhqWgCc_uoocoDIBKuExZkkJsdJqSA2QZSTQO7z1_uW0uz6a7cWBCO-LCXEGCsIRaH-V2SHgWTAdgPlton-ELabuGSECYJ7h_uuDOOUSPducuHRAzN4JCtv0b2GLKkeeTpQ-3Y_jDYwJ3ALw', buyer: 'Julianna Smith', source: 'referral', time: '2 hours ago', replied: true },
];

const stats = [
  { icon: 'payments',        label: 'Total Revenue',      value: '$12,450.00', badge: '+12.5%', accent: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  sub: null },
  { icon: 'shopping_basket', label: 'Active Listings',    value: '84',         badge: '+2%',    accent: '#f97316', glow: 'rgba(249,115,22,0.12)',  sub: null },
  { icon: 'chat',            label: 'WhatsApp Inquiries', value: '12',         badge: 'Urgent', accent: '#22c55e', glow: 'rgba(34,197,94,0.12)',   sub: null },
  { icon: 'visibility',      label: 'Total Views',        value: '3,205',      badge: '+18%',   accent: '#a78bfa', glow: 'rgba(167,139,250,0.12)', sub: '42% from Visual Search' },
];

const navItems = [
  { icon: 'dashboard',     label: 'Dashboard',   active: true },
  { icon: 'inventory_2',   label: 'My Listings', active: false },
  { icon: 'receipt_long',  label: 'Orders',      active: false },
];

const MS = ({ name, size = 22, style: s = {} }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", whiteSpace: "nowrap", direction: "ltr", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", ...s }}>
    {name}
  </span>
);

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function SourceBadge({ source }) {
  const map = {
    visual:  { icon: 'image_search', label: 'Visual Search', bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    direct:  { icon: 'search',       label: 'Direct Search', bg: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
    referral:{ icon: 'link',         label: 'Referral',      bg: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
  };
  const s = map[source] || map.direct;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      <MS name={s.icon} size={13} /> {s.label}
    </span>
  );
}

export default function SellerProfile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Entrance animation states
  const [sidebarIn,  setSidebarIn]  = useState(false);
  const [headerIn,   setHeaderIn]   = useState(false);
  const [headingIn,  setHeadingIn]  = useState(false);
  const [statsIn,    setStatsIn]    = useState(false);
  const [tableIn,    setTableIn]    = useState(false);
  const [bannerIn,   setBannerIn]   = useState(false);

  useEffect(() => {
    setTimeout(() => setSidebarIn(true),  60);
    setTimeout(() => setHeaderIn(true),   120);
    setTimeout(() => setHeadingIn(true),  260);
    setTimeout(() => setStatsIn(true),    380);
    setTimeout(() => setTableIn(true),    520);
    setTimeout(() => setBannerIn(true),   660);
  }, []);

  useEffect(() => {
    async function loadSellerData() {
      try {
        if (!user) { setError('User not authenticated'); setLoading(false); return; }
        const { data: userData, error: userError } = await supabase.from('users').select('full_name, email, phone').eq('user_id', user.id).maybeSingle();
        if (userError) throw userError;
        setSeller({
          name:   userData?.full_name || user.user_metadata?.full_name || 'Seller',
          email:  userData?.email     || user.email                    || 'N/A',
          phone:  userData?.phone     || user.user_metadata?.phone     || 'N/A',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvpoXo7YtW65fZoifh6-OBvboYK04miweSOuj6Xt3MU0lRTW3gROZ-yGC5x-7oo9rZ57jNo4UuErEqgoaDr1TAMdHPFfFP-vatuw0qptaMY1HfYfW5ibMHPKsvKOnRhVyJ_yK70bwtDd2fC8o-w9Wa3OtWchZ6yhFWdsOnEfszjQ_RO_7j5yBbu1XlwzB1smpV05dB47YQX77KfuNTOAVVgE7n1Bs3k07i85QoUJOXc0fFm49DcM7_v0DwmkIyfDF6Bmk3Lvj2ZWs',
        });
      } catch (err) {
        console.error('Error loading seller data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSellerData();
  }, [user]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ textAlign: "center", maxWidth: 360, padding: 32 }}>
        <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 16 }}>Error: {error}</p>
        <button onClick={() => navigate('/products')} style={primaryBtnSm}>Back to Products</button>
      </div>
    </div>
  );

  const initials = seller?.name ? seller.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'S';

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Manrope', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes slideRight { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideDown  { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp     { from { opacity: 0; transform: translateY(22px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn    { from { opacity: 0; transform: scale(0.95);       } to { opacity: 1; transform: scale(1);     } }
        @keyframes rowSlide   { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse      { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes gradShift  { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, background: "#0f172a", borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "fixed", height: "100%", display: "flex", flexDirection: "column", zIndex: 20,
        opacity: sidebarIn ? 1 : 0,
        transform: sidebarIn ? "translateX(0)" : "translateX(-100%)",
        transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* Logo area */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MS name="shopping_bag" size={18} style={{ color: "white" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em" }}>LuxeBag</div>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item, i) => (
            <NavItem key={item.label} item={item} delay={i * 60} ready={sidebarIn} />
          ))}
        </nav>

        {/* Seller card */}
        <div style={{ padding: "16px 14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seller?.name}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", letterSpacing: "0.15em", textTransform: "uppercase" }}>Pro Seller</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MS name="mail" size={13} style={{ color: "#475569" }} />
              <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seller?.email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MS name="phone" size={13} style={{ color: "#475569" }} />
              <span style={{ fontSize: 11, color: "#475569" }}>{seller?.phone}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: 64, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 10,
          opacity: headerIn ? 1 : 0,
          transform: headerIn ? "translateY(0)" : "translateY(-100%)",
          transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 520 }}>

            {/* ── Back arrow → /products ── */}
            <button
              onClick={() => navigate('/products')}
              title="Back to Products"
              style={{ padding: 8, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#3b82f6"; e.currentTarget.style.transform = "translateX(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "none"; }}
            >
              <MS name="arrow_back" size={20} />
            </button>

            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <MS name="search" size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search orders, inquiries, or products..."
                style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, background: "#f1f5f9", border: "1.5px solid transparent", borderRadius: 10, fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", transition: "all 0.2s" }}
                onFocus={e => { e.target.style.borderColor = "#bfdbfe"; e.target.style.background = "white"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "#f1f5f9"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ position: "relative", padding: 8, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <MS name="notifications" size={22} />
              <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid white", animation: "pulse 2s ease-in-out infinite" }} />
            </button>
            <button style={{ padding: 8, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <MS name="help" size={22} />
            </button>
            <div style={{ width: 1, height: 28, background: "#e2e8f0", margin: "0 4px" }} />
            <button
              onClick={() => navigate('/upload-product')}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "none", background: "#3b82f6", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(59,130,246,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)"; }}
            >
              <MS name="add" size={17} /> New Listing
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: "36px 32px 64px", flex: 1 }}>

          {/* Page heading */}
          <div style={{
            marginBottom: 32,
            opacity: headingIn ? 1 : 0,
            transform: headingIn ? "none" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1.1, fontFamily: "'DM Serif Display', serif" }}>
              Seller Dashboard
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 6, fontWeight: 500 }}>Monitor your performance and handle customer inquiries.</p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 32,
            opacity: statsIn ? 1 : 0,
            transform: statsIn ? "none" : "translateY(20px)",
            transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)",
          }}>
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} delay={i * 70} ready={statsIn} />
            ))}
          </div>

          {/* Inquiries section */}
          <div style={{
            opacity: tableIn ? 1 : 0,
            transform: tableIn ? "none" : "translateY(24px)",
            transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)",
          }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Recent Inquiries</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={outlineBtnSm} onMouseEnter={e => hoverOutline(e, true)} onMouseLeave={e => hoverOutline(e, false)}>
                  <MS name="filter_list" size={15} /> Filter
                </button>
                <button style={outlineBtnSm} onMouseEnter={e => hoverOutline(e, true)} onMouseLeave={e => hoverOutline(e, false)}>
                  View All
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
              {/* Table head */}
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1.3fr 1fr 1.4fr", padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                {['Bag Detail', 'Buyer Name', 'Source', 'Received', 'Action'].map((h, i) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: i === 4 ? "right" : "left" }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {inquiries.map((row, i) => (
                <InquiryRow key={row.id} row={row} index={i} ready={tableIn} />
              ))}
            </div>
          </div>

          {/* WhatsApp banner */}
          <div style={{
            marginTop: 24,
            display: "flex", alignItems: "center", gap: 16,
            padding: "18px 24px", background: "white",
            border: "1px solid #e2e8f0", borderRadius: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            opacity: bannerIn ? 1 : 0,
            transform: bannerIn ? "none" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
              <WhatsAppIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d", marginBottom: 3 }}>WhatsApp Business API Active</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                You are currently receiving direct inquiries from your product pages. Response time is averaged at <strong style={{ color: "#0f172a" }}>14 minutes</strong>.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Nav Item ─────────────────────────────────────────────────── */
function NavItem({ item, delay, ready }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10, textDecoration: "none",
        background: item.active ? "rgba(59,130,246,0.12)" : hovered ? "rgba(255,255,255,0.05)" : "transparent",
        color: item.active ? "#60a5fa" : hovered ? "#cbd5e1" : "#64748b",
        transition: "all 0.2s",
        transform: hovered && !item.active ? "translateX(3px)" : "none",
        opacity: ready ? 1 : 0,
        animation: ready ? `slideRight 0.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms both` : "none",
      }}
    >
      <MS name={item.icon} size={20} />
      <span style={{ fontSize: 13, fontWeight: item.active ? 700 : 600 }}>{item.label}</span>
      {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />}
    </a>
  );
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ stat, delay, ready }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: 16,
        padding: "22px 20px",
        /* ── NO border on Revenue card, subtle border on others ── */
        border: "none",
        boxShadow: hovered
          ? `0 8px 32px ${stat.glow}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 10px rgba(0,0,0,0.05)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
        opacity: ready ? 1 : 0,
        animation: ready ? `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both` : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Accent corner */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.accent, opacity: hovered ? 1 : 0, transition: "opacity 0.3s", borderRadius: "16px 16px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.glow, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)" }}>
          <MS name={stat.icon} size={20} style={{ color: stat.accent }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: `${stat.accent}15`, color: stat.accent, letterSpacing: "0.06em" }}>{stat.badge}</span>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>{stat.label}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{stat.value}</p>
      {stat.sub && (
        <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <MS name="image_search" size={12} /> {stat.sub}
        </p>
      )}
    </div>
  );
}

/* ── Inquiry Row ──────────────────────────────────────────────── */
function InquiryRow({ row, index, ready }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1.3fr 1fr 1.4fr",
        padding: "14px 24px", alignItems: "center",
        borderBottom: index < inquiries.length - 1 ? "1px solid #f8fafc" : "none",
        background: hovered ? "#fafbff" : "white",
        transition: "background 0.18s",
        opacity: ready ? 1 : 0,
        animation: ready ? `rowSlide 0.45s cubic-bezier(0.22,1,0.36,1) ${index * 70 + 100}ms both` : "none",
      }}
    >
      {/* Bag */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, backgroundImage: `url('${row.img}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid #f1f5f9", flexShrink: 0, transition: "transform 0.3s", transform: hovered ? "scale(1.06)" : "scale(1)" }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.bag}</p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>SKU: {row.sku}</p>
        </div>
      </div>

      {/* Buyer */}
      <p style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{row.buyer}</p>

      {/* Source */}
      <div><SourceBadge source={row.source} /></div>

      {/* Time */}
      <p style={{ fontSize: 12, color: "#94a3b8" }}>{row.time}</p>

      {/* Action */}
      <div style={{ textAlign: "right" }}>
        {row.replied ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "not-allowed" }}>
            <MS name="check_circle" size={16} /> Replied
          </span>
        ) : (
          <a
            href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20following%20up%20on%20an%20inquiry%20about%20${encodeURIComponent(row.bag)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 5px 16px rgba(59,130,246,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)"; }}
          >
            <MS name="chat" size={15} /> Chat on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ── Shared small styles ───────────────────────────────────────────
const outlineBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "7px 13px", border: "1px solid #e2e8f0", borderRadius: 8,
  background: "white", cursor: "pointer", fontSize: 12, fontWeight: 700,
  color: "#64748b", fontFamily: "'Manrope', sans-serif", transition: "all 0.2s",
};
function hoverOutline(e, on) {
  e.currentTarget.style.background   = on ? "#f8fafc" : "white";
  e.currentTarget.style.borderColor  = on ? "#cbd5e1" : "#e2e8f0";
  e.currentTarget.style.color        = on ? "#0f172a" : "#64748b";
}

const primaryBtnSm = {
  padding: "10px 22px", background: "#3b82f6", color: "white",
  border: "none", borderRadius: 9, cursor: "pointer",
  fontSize: 13, fontWeight: 700, fontFamily: "'Manrope', sans-serif",
};