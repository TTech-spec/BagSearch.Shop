import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── CRIIBB PALETTE ──
// Peach bg: #F9DDD0 / #F5C4A8
// Burnt orange: #C94B2C / #B33A1E
// Dark text: #1A0A00
// White: #FFFFFF

const NAV_LINKS = ["New Arrivals", "Collections", "Visual Search"];

const NEW_ARRIVALS = [
  { name: "The Midnight Satchel", sub: "Italian Leather", material: "Midnight Blue", price: "$2,450", tag: "New", tagColor: "#C94B2C", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8" },
  { name: "Ivory Essential Tote", sub: "Vegan Leather", material: "Ivory White", price: "$1,800", tag: "Eco", tagColor: "#8B4513", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { name: "Azure Mini Crossbody", sub: "Napa Leather", material: "Azure Blue", price: "$1,250", tag: "Limited", tagColor: "#7A2E0E", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { name: "Onyx Evening Clutch", sub: "Polished Suede", material: "Onyx Black", price: "$3,100", tag: "Exclusive", tagColor: "#C94B2C", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
];

const HERO_SLIDES = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4I73hqMmV64iEPGtSEJ3mNAbQtvPBqQQ22x1JA6F2E-E4U0-SmUat1vO0Z0c7l1142DjBBzcn-afis9xsHhMBa7rnrhdTWhV7aq8FUXyZDIlxADoYFJcdrsprs-bYJQOcAqih5olePRiw0nJPBPNpLCL32-aAsv9zAtqbGV6bFBMK5ypVAi4i0E2wq4chZKL5jOOJyPh6HoEXvJKPkNeXbHs-Kqqip9Cgq3VAIn0gqtoVtmGQwzvnFhaifm9ecmgYdWkGPqlRExE",
    badge: "Shop Bags with Your Camera.",
    title: "Shop Bags",
    subtitle: "with Your Camera.",
    desc: "Point, shoot, discover.",
    accent: "#C94B2C",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
    badge: "Snap. Shop. Buy in Seconds.",
    title: "Snap. Shop.",
    subtitle: "Buy in Seconds.",
    desc: "Snap, chat, checkout.",
    accent: "#C94B2C",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
    badge: "Find Any Bag. Upload a Photo.",
    title: "Find Any Bag.",
    subtitle: "Upload a Photo.",
    desc: "AI matches in seconds.",
    accent: "#E06040",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks",
    badge: "New Season",
    title: "Emerald",
    subtitle: "Suede Collection",
    desc: "Avant-garde meets timeless.",
    accent: "#C94B2C",
  },
];

const CATEGORIES = [
  { name: "Totes", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB_04xZTrV_Axg5yh0aNoGtHkizuTQo3SF-rYUV5xHrdz2QAfuc_E3QpohCkJx72_wJmx5kKMARTx7yZj9T7XbopFKU2jb3nT3E_R8V82Qpjy5F1P7K2BNrsFZn3NUfOgqiv4ZvNpZZZBugimt03IllFL_K3-44e7EOI8D1uHvxCvrF5H9KS0PrnpfRu-4vlaZCcQoUs039FLRLoqMQx7oLUHbcJE8ZI4XGodOfLN38iAbfbL08bY4b88JCWrknI_h37H8Ub7GL9M" },
  { name: "Clutches", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRKbAqBYrOUO3jIvjP1j08WGuBx56oYQaLKAutycdNOyAtQnkNixGe5TfDJNsstxy2JXEi5uB0tPnzgN8BA7rNsSMUzu96BO_K7Mph6mrR-nU01QTgb6J0N_oFLuFM8H2quw9WHwR_ecgfA26VFn7jyb9mFtVB7UpAnSrLXvVRnwNLo9Kz8wrRlZYfaXrtGA-jVPJhFvFvnbG6ME8qCcDyRZgf5Tt75mXh6Wsh4YEzYnu1-c3qNjGgFFKmq9iHdB51CwJyxzPlqFE" },
  { name: "Backpacks", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTJ4J6N-ArK8lzcROZ_oL1YMMjkKvimYUMaZqKi-Rgdsh7h58Hi1kp8kq1vbsAqt4IhQ_Hq2u6SI6pHK2y6150BqxGMgw0CEXtITU8TTc5A9mMeSoirH7eSIsrHF0g07ScCFcwit_kundXpdrKnZR7aF3WPbeXMUtXz-MJfilgYtDnITqsgadWQtq9CFhIVkmkg3I_ispNHccqZo1jfjTrLrvlmgl_z0XwtM90T2yECR1G_6F07j7O4pZ5ELaWo3EP0uYxCwVzjwg" },
];

const TRENDING = [
  { name: "Crimson Structured Bag", label: "Popular Choice", price: "$3,200", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8" },
  { name: "Minimalist Sand Tote", label: "Editor's Pick", price: "$1,950", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_sKNiKX7NJOoRuxirNhqYW2CVrSgjx_0rJlgl3Xgtd91hKF7Al_wJ5OcwAsQIoSjiNyJH4zyPL7xJu9ggym4aGrZJU-PpyBDYb8bURs1qfYfAJy2fK4zkBJDV24R6XOCHKVAq9BLsgcTb-NRNTTgiNb5lp0QftxV3I0Ra86dQ1lfhnbt-4bsxZFh1_0DOBjY_hudNpjkjfW6SnC5bbsWRyT1tAjx5pqimCUzaGawdNf7r6dcOKx6rDKjvnabQan2CQfRkkURf7VLY" },
  { name: "Emerald Suede Clutch", label: "New Trend", price: "$2,100", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks" },
  { name: "Urban Heritage Pack", label: "Best Seller", price: "$1,600", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhRkGSg7Va0LHjp_dhl_1nOfsT69AcfKsT87IGMf4WFKySlhwVu2YbM24F5LEXYXeQBi910qpL7m28onkj1Ukw53DQt0ks4kIQDe7u2XhHh9t45Cw2n7rfXt7GEO2Ul4cyPv1NtKePCqQpbg_tJvMtGLm4gnLgyDIc5efzDZA4edimRL8upoZdtbsG9nn1R5J0GH70OTXUXJu3iZgne1KYmDSGHSi8use1KRPU6wE0OfE5HnQRIFnufOyMqHZ8ZFsXNLydzWxthDg" },
];

const LogoIcon = () => (
  <svg width="26" height="26" fill="none" viewBox="0 0 48 48">
    <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Icon = ({ name, size = 22 }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", wordWrap: "normal", whiteSpace: "nowrap", direction: "ltr" }}>{name}</span>
);

/* ─── AUTH GATE MODAL ─── */
function AuthGateModal({ open, onClose, navigate }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (open) {
      setPhase(1);
      const t = setTimeout(() => setPhase(2), 20);
      return () => clearTimeout(t);
    } else {
      setPhase(3);
      const t = setTimeout(() => setPhase(0), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (phase === 0) return null;
  const visible = phase === 2;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,10,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", opacity: visible ? 1 : 0, transition: "opacity 0.35s ease" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
        background: "#FFFFFF",
        border: "1px solid rgba(201,75,44,0.15)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(26,10,0,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.95)",
        transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Peach top accent */}
        <div style={{ height: 6, background: "linear-gradient(90deg, #C94B2C, #E8856A, #C94B2C)" }} />

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1px solid #E8D5CC", background: "#FFF5F2", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; e.currentTarget.style.color = "#C94B2C"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; e.currentTarget.style.color = "#999"; }}>
          <Icon name="close" size={15} />
        </button>

        <div style={{ padding: "36px 36px 32px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F9DDD0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#C94B2C", animation: visible ? "authFloat 3s ease-in-out infinite" : "none" }}>
            <Icon name="lock" size={28} />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A0A00", letterSpacing: "-0.04em", marginBottom: 8, fontFamily: "'Cormorant Garamond', serif" }}>Members Only</h2>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>Sign in to unlock visual search, wishlists & more.</p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {[{ icon: "image_search", label: "Visual Search" }, { icon: "favorite", label: "Wishlist" }, { icon: "notifications", label: "Alerts" }].map(({ icon, label }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: "#F9DDD0", fontSize: 10, fontWeight: 700, color: "#C94B2C", letterSpacing: "0.06em" }}>
                <Icon name={icon} size={12} /> {label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { onClose(); navigate("/register"); }} style={{ width: "100%", padding: "13px 0", background: "#C94B2C", color: "white", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: "0 6px 20px rgba(201,75,44,0.35)", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(201,75,44,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,75,44,0.35)"; }}>
              Create Free Account
            </button>
            <button onClick={() => { onClose(); navigate("/login"); }} style={{ width: "100%", padding: "12px 0", background: "#FFF5F2", color: "#C94B2C", fontWeight: 700, fontSize: 13, border: "1px solid #F0C8BB", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; }}>
              Already a member? Sign In
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 36px", borderTop: "1px solid #F5EAE5", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#FDFAFA" }}>
          <div style={{ color: "#C94B2C" }}><LogoIcon /></div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#1A0A00", letterSpacing: "-0.02em" }}>Bag<span style={{ color: "#C94B2C" }}>.NG</span></span>
        </div>
      </div>
      <style>{`
        @keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );
}

/* ─── LUXURY LOADER ─── */
function LuxuryLoader({ onDone }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 1) return;
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 4 + 1.5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setPhase(2), 600);
        setTimeout(() => onDone(), 1400);
      } else {
        setProgress(Math.min(p, 100));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [phase, onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#F9DDD0",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: phase === 2 ? "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" : "none",
      opacity: phase === 2 ? 0 : 1,
      transform: phase === 2 ? "translateY(-4%)" : "none",
      pointerEvents: phase === 2 ? "none" : "all",
    }}>
      {/* Warm radial glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "70vw", height: "70vw", maxWidth: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,75,44,0.18) 0%, transparent 65%)", transform: "translate(-50%,-50%)", pointerEvents: "none", animation: "loaderPulse 2.4s ease-in-out infinite" }} />

      <div style={{ position: "relative", width: 100, height: 100, marginBottom: 36 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, animation: "spinRing 2.5s linear infinite" }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(201,75,44,0.15)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#C94B2C" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 44 * progress / 100} ${2 * Math.PI * 44 * (1 - progress / 100)}`}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 0.1s ease", transformOrigin: "50px 50px" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#C94B2C", animation: phase === 1 ? "logoBreathe 1.8s ease-in-out infinite" : "none" }}>
          <LogoIcon />
        </div>
      </div>

      <div style={{ fontSize: "clamp(2rem,5vw,2.8rem)", fontWeight: 900, color: "#1A0A00", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.06em", marginBottom: 6, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.3s", animation: phase >= 1 ? "slideUpText 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both" : "none" }}>
        Bag<span style={{ color: "#C94B2C" }}>.NG</span>
      </div>
      <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(26,10,0,0.35)", marginBottom: 40, fontWeight: 700, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}>
        Luxury Redefined
      </p>

      <div style={{ width: "min(220px,60vw)", height: 2, background: "rgba(26,10,0,0.08)", borderRadius: 2, overflow: "hidden", opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.4s ease 0.5s" }}>
        <div style={{ height: "100%", background: "#C94B2C", width: `${progress}%`, transition: "width 0.1s ease", borderRadius: 2, boxShadow: "0 0 8px rgba(201,75,44,0.5)" }} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(26,10,0,0.3)", marginTop: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums", opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.4s ease 0.5s" }}>
        {Math.round(progress)}%
      </div>
      <style>{`
        @keyframes loaderPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:1} }
        @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes logoBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes slideUpText { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ─── TYPEWRITER H1 ─── */
function TypewriterH1({ title, subtitle, accentColor = "#C94B2C", id }) {
  const [titleText, setTitleText] = useState("");
  const [subtitleText, setSubtitleText] = useState("");
  const [phase, setPhase] = useState("title");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => { setTitleText(""); setSubtitleText(""); setPhase("title"); setShowCursor(true); }, [id]);

  useEffect(() => {
    if (phase !== "title") return;
    if (titleText.length < title.length) {
      const t = setTimeout(() => setTitleText(title.slice(0, titleText.length + 1)), 55);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("subtitle"), 180);
      return () => clearTimeout(t);
    }
  }, [phase, titleText, title]);

  useEffect(() => {
    if (phase !== "subtitle") return;
    if (subtitleText.length < subtitle.length) {
      const t = setTimeout(() => setSubtitleText(subtitle.slice(0, subtitleText.length + 1)), 62);
      return () => clearTimeout(t);
    } else { setPhase("done"); }
  }, [phase, subtitleText, subtitle]);

  useEffect(() => { const t = setInterval(() => setShowCursor(c => !c), 530); return () => clearInterval(t); }, []);

  const cursor = (v) => <span style={{ display: "inline-block", width: 3, height: "0.75em", background: accentColor, marginLeft: 4, verticalAlign: "middle", borderRadius: 2, opacity: v ? 1 : 0, transition: "opacity 0.12s", boxShadow: `0 0 8px ${accentColor}99` }} />;

  return (
    <h1 style={{ fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 300, color: "white", lineHeight: 1.15, maxWidth: 640, marginBottom: 24, fontFamily: "'Cormorant Garamond', serif" }}>
      <span style={{ display: "block", minHeight: "1.12em" }}>{titleText}{phase === "title" && cursor(showCursor)}</span>
      <em style={{ display: "block", fontWeight: 800, fontStyle: "italic", color: accentColor, minHeight: "1.12em", opacity: phase === "title" && subtitleText.length === 0 ? 0 : 1, transition: "opacity 0.15s, color 0.5s" }}>
        {subtitleText}
        {(phase === "subtitle" || phase === "done") && cursor(showCursor)}
      </em>
    </h1>
  );
}

/* ─── HERO CAROUSEL ─── */
function HeroCarousel({ navigate, newArrivalsRef, onAuthGate }) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState(1);
  const autoRef = useRef(null);
  const [textKey, setTextKey] = useState(0);

  const goTo = useCallback((idx) => {
    if (animating || idx === active) return;
    setDir(idx > active ? 1 : -1);
    setPrev(active);
    setAnimating(true);
    setActive(idx);
    setTextKey(k => k + 1);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 900);
  }, [active, animating]);

  const next = useCallback(() => goTo((active + 1) % HERO_SLIDES.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [active, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 5500);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const resetAuto = () => { clearInterval(autoRef.current); autoRef.current = setInterval(next, 5500); };

  const slide = HERO_SLIDES[active];
  const prevSlide = prev !== null ? HERO_SLIDES[prev] : null;

  return (
    <section style={{ position: "relative", minHeight: "88vh", overflow: "hidden" }}>
      {prevSlide && (
        <div key={`prev-bg-${prev}`} style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 100%), url('${prevSlide.image}')`,
          backgroundSize: "cover", backgroundPosition: "center",
          animation: `heroBgExit${dir > 0 ? "L" : "R"} 0.9s cubic-bezier(0.77,0,0.175,1) forwards`,
          zIndex: 1,
        }} />
      )}
      <div key={`bg-${active}`} style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 100%), url('${slide.image}')`,
        backgroundSize: "cover", backgroundPosition: "center",
        animation: animating ? `heroBgEnter${dir > 0 ? "R" : "L"} 0.9s cubic-bezier(0.77,0,0.175,1) forwards` : "none",
        zIndex: 2,
      }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "transparent", animation: "kenBurns 5.5s ease-in-out infinite alternate" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto", padding: "120px 24px 100px", display: "flex", flexDirection: "column", minHeight: "88vh", justifyContent: "center" }}>

        <span key={`badge-${textKey}`} style={{
          display: "inline-block", padding: "6px 18px", marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
          borderRadius: 9999, border: `1px solid ${slide.accent}80`,
          color: slide.accent, width: "fit-content",
          animation: "heroTextIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}>{slide.badge}</span>

        <TypewriterH1 key={`tw-${textKey}`} title={slide.title} subtitle={slide.subtitle} accentColor={slide.accent} id={textKey} />

        <p key={`desc-${textKey}`} style={{
          fontSize: "clamp(1rem,1.8vw,1.15rem)", color: "#F9DDD0", maxWidth: 440,
          fontWeight: 300, lineHeight: 1.7, marginBottom: 44,
          animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both",
          opacity: 0.85,
        }}>{slide.desc}</p>

        <div key={`btns-${textKey}`} style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56, animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both" }}>
          <button onClick={() => onAuthGate()} style={{
            padding: "15px 28px", background: slide.accent, color: "white", fontWeight: 700,
            borderRadius: 10, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontSize: 15,
            boxShadow: `0 8px 24px ${slide.accent}55`, transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(0.88)"; e.currentTarget.style.boxShadow = `0 14px 36px ${slide.accent}66`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; e.currentTarget.style.boxShadow = `0 8px 24px ${slide.accent}55`; }}>
            <Icon name="camera" size={20} /> Try Visual Search
          </button>
          <button onClick={() => navigate("/login")} style={{
            padding: "15px 28px", color: "white", fontWeight: 700, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)", cursor: "pointer", fontSize: 15, transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}>
            Sign In
          </button>
        </div>

        {/* Carousel controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { back(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
              <Icon name="arrow_back" size={18} />
            </button>
            <button onClick={() => { next(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: slide.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 4px 16px ${slide.accent}66`, transition: "background 0.4s, box-shadow 0.4s, transform 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.88)"; e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}>
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {HERO_SLIDES.map((s, i) => (
              <button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{
                width: active === i ? 32 : 6, height: 6, borderRadius: 3,
                background: active === i ? slide.accent : "rgba(255,255,255,0.3)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: active === i ? `0 0 8px ${slide.accent}99` : "none",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", fontWeight: 700, marginLeft: "auto" }}>
            {String(active + 1).padStart(2, "0")} <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span> {String(HERO_SLIDES.length).padStart(2, "0")}
          </span>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)" }}>
          <div key={`prog-${active}`} style={{
            height: "100%", background: slide.accent,
            animation: "heroProgress 5.5s linear forwards",
            boxShadow: `0 0 6px ${slide.accent}cc`,
          }} />
        </div>
      </div>

      <style>{`
        @keyframes heroBgExitL { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(-6%) scale(0.98);opacity:0} }
        @keyframes heroBgExitR { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(6%) scale(0.98);opacity:0} }
        @keyframes heroBgEnterR { from{transform:translateX(5%) scale(0.98);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes heroBgEnterL { from{transform:translateX(-5%) scale(0.98);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes heroTextIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroProgress { from{width:0%} to{width:100%} }
        @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.04)} }
      `}</style>
    </section>
  );
}

/* ─── NEW ARRIVALS ─── */
function NewArrivalsSection({ navigate, sectionRef }) {
  const [active, setActive] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [dir, setDir] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const autoRef = useRef(null);

  const setRefs = useCallback((node) => {
    ref.current = node;
    if (sectionRef) sectionRef.current = node;
  }, [sectionRef]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const goTo = useCallback((idx) => {
    if (animating || idx === active) return;
    setDir(idx > active ? 1 : -1); setPrevIdx(active); setAnimating(true); setActive(idx);
    setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 650);
  }, [active, animating]);

  const next = useCallback(() => goTo((active + 1) % NEW_ARRIVALS.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + NEW_ARRIVALS.length) % NEW_ARRIVALS.length), [active, goTo]);

  useEffect(() => { autoRef.current = setInterval(next, 4800); return () => clearInterval(autoRef.current); }, [next]);
  const resetAuto = () => { clearInterval(autoRef.current); autoRef.current = setInterval(next, 4800); };

  const item = NEW_ARRIVALS[active];
  const prevItem = prevIdx !== null ? NEW_ARRIVALS[prevIdx] : null;

  return (
    <section ref={setRefs} style={{ background: "#FFFFFF", position: "relative", overflow: "hidden", padding: "72px 0 60px" }}>
      {/* Subtle peach orb */}
      <div style={{ position: "absolute", top: "50%", right: "-5%", width: "40vw", height: "40vw", maxWidth: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,221,208,0.5) 0%, transparent 70%)", transform: "translateY(-50%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 44, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 20, height: 3, background: "#C94B2C", borderRadius: 2 }} />
              <span style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 800 }}>Just Landed</span>
            </div>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>New Arrivals</h2>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); navigate("/products"); }} style={{ color: "#C94B2C", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: "1.5px solid #C94B2C", paddingBottom: 3 }}>
            All Pieces <Icon name="north_east" size={13} />
          </a>
        </div>

        <div className="arrivals-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 6, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px)", transition: "opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s" }}>
          {/* Image */}
          <div className="arrivals-img" style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "16px 0 0 16px", cursor: "pointer" }} onClick={() => navigate("/register")}>
            {prevItem && <img src={prevItem.src} alt={prevItem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: `exitImg${dir > 0 ? "L" : "R"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` }} />}
            <img key={`img-${active}`} src={item.src} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: animating ? `enterImg${dir > 0 ? "R" : "L"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` : "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.45) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, background: "#C94B2C", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>{item.tag}</div>
            <button onClick={e => { e.stopPropagation(); setLiked(s => { const n = new Set(s); n.has(active) ? n.delete(active) : n.add(active); return n; }); }} style={{ position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: "50%", background: liked.has(active) ? "#C94B2C" : "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", color: liked.has(active) ? "white" : "#C94B2C" }}>
              <Icon name={liked.has(active) ? "favorite" : "favorite_border"} size={17} />
            </button>
          </div>

          {/* Panel */}
          <div className="arrivals-panel" style={{ background: "#F9DDD0", borderRadius: "0 16px 16px 0", padding: "40px 36px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C94B2C" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
                {[item.sub, item.material].map(c => (<span key={c} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C94B2C", border: "1px solid rgba(201,75,44,0.3)", padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,0.5)" }}>{c}</span>))}
              </div>
              <div style={{ overflow: "hidden", marginBottom: 12 }}>
                <h3 key={`n-${active}`} style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#1A0A00", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em", lineHeight: 1.15, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both" }}>{item.name}</h3>
              </div>
              <div style={{ overflow: "hidden", marginBottom: 28 }}>
                <p key={`d-${active}`} style={{ color: "#7A4030", fontSize: 13, lineHeight: 1.6, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.06s both" }}>Premium {item.sub.toLowerCase()}. {item.material} finish.</p>
              </div>
              <div key={`p-${active}`} style={{ marginBottom: 28, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both" }}>
                <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "#B07060", display: "block", marginBottom: 4 }}>Price</span>
                <span style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.03em", fontFamily: "'Cormorant Garamond', serif" }}>{item.price}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
                <button onClick={() => navigate("/register")} style={{ flex: 1, minWidth: 100, padding: "12px 16px", background: "#C94B2C", color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", borderRadius: 50, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 6px 20px rgba(201,75,44,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>Add to Bag</button>
                <button onClick={() => navigate("/register")} style={{ padding: "12px 16px", background: "white", color: "#C94B2C", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "1.5px solid #C94B2C", borderRadius: 50, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#FFF5F2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; }}>View</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {NEW_ARRIVALS.map((_, i) => (<button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ width: active === i ? 24 : 6, height: 6, borderRadius: 3, background: active === i ? "#C94B2C" : "rgba(201,75,44,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }} />))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { back(); resetAuto(); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "white", border: "1.5px solid rgba(201,75,44,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#C94B2C", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F9DDD0"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}>
                    <Icon name="arrow_back" size={15} />
                  </button>
                  <button onClick={() => { next(); resetAuto(); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "#C94B2C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 14px rgba(201,75,44,0.4)", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                    <Icon name="arrow_forward" size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 2, opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
          {NEW_ARRIVALS.map((a, i) => (
            <div key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ flexShrink: 0, width: active === i ? 104 : 60, height: 60, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)", outline: active === i ? "2.5px solid #C94B2C" : "2.5px solid transparent", outlineOffset: 2 }}>
              <img src={a.src} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active === i ? "brightness(1)" : "brightness(0.5) saturate(0.3)", transition: "filter 0.4s" }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes exitImgL { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(-7%) scale(0.97);opacity:0} }
        @keyframes exitImgR { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(7%) scale(0.97);opacity:0} }
        @keyframes enterImgR { from{transform:translateX(5%) scale(0.97);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes enterImgL { from{transform:translateX(-5%) scale(0.97);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:680px){
          .arrivals-grid{grid-template-columns:1fr!important}
          .arrivals-img{border-radius:16px 16px 0 0!important;aspect-ratio:3/2!important}
          .arrivals-panel{border-radius:0 0 16px 16px!important;padding:24px 20px!important}
        }
      `}</style>
    </section>
  );
}

/* ─── MAIN ─── */
export default function LuxeBag() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const navigate = useNavigate();
  const newArrivalsRef = useRef(null);
  const handleLoadDone = useCallback(() => setLoading(false), []);

  const handleNavClick = (link) => {
    if (link === "New Arrivals") {
      if (newArrivalsRef.current) newArrivalsRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (link === "Collections") {
      navigate("/products");
    } else {
      setAuthGateOpen(true);
    }
  };

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }); }, { threshold: 0.12 });
    document.querySelectorAll(".scroll-reveal,.scroll-reveal-scale,.scroll-reveal-left").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EE", fontFamily: "'Manrope', sans-serif", color: "#1A0A00" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .card-img{transition:transform 0.5s ease;}
        .product-card:hover .card-img{transform:scale(1.06);}
        .nav-link:hover{color:#C94B2C!important;}
        .icon-btn:hover{background:#F9DDD0!important;}
        .sidebar-link:hover{background:rgba(201,75,44,0.06)!important;}
        
        /* Responsive styles for visual search section */
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}.desktop-icons{display:none!important}
          .hero-right-circles{display:none!important}
          .category-grid{grid-template-columns:1fr!important}
          .trending-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}.footer-brand{grid-column:span 2!important}
          .hero-content-wrap{max-width:100%!important;padding:80px 24px 80px!important}
        }

        /* Enhanced mobile styles for visual search CTA */
        @media (max-width: 640px) {
          .visual-search-container {
            min-height: 400px !important;
            padding: 40px 20px !important;
          }
          
          .visual-search-content {
            max-width: 100% !important;
            padding: 32px 20px !important;
            text-align: center !important;
          }
          
          .visual-search-image {
            position: absolute !important;
            right: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0.2 !important;
          }
          
          .visual-search-title {
            font-size: 28px !important;
            margin-bottom: 12px !important;
          }
          
          .visual-search-description {
            font-size: 14px !important;
            margin-bottom: 24px !important;
          }
          
          .visual-search-button {
            width: 100% !important;
            justify-content: center !important;
            padding: 16px !important;
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .visual-search-container {
            padding: 30px 16px !important;
          }
          
          .visual-search-content {
            padding: 24px 16px !important;
          }
          
          .visual-search-badge {
            font-size: 10px !important;
            padding: 6px 12px !important;
          }
          
          .visual-search-title {
            font-size: 24px !important;
          }
        }

        .scroll-reveal{opacity:0;transform:translateY(32px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal.visible{opacity:1;transform:translateY(0);}
        .scroll-reveal-scale{opacity:0;transform:scale(0.93);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-scale.visible{opacity:1;transform:scale(1);}
        .scroll-reveal-left{opacity:0;transform:translateX(-32px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-left.visible{opacity:1;transform:translateX(0);}
        .delay-1{transition-delay:0.08s}.delay-2{transition-delay:0.16s}.delay-3{transition-delay:0.24s}
      `}</style>

      <LuxuryLoader onDone={handleLoadDone} />

      <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.6s ease", pointerEvents: loading ? "none" : "all" }}>

        {/* HEADER */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,75,44,0.12)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C94B2C" }}>
              <LogoIcon />
              <span style={{ fontSize: 20, fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>.NG</span></span>
            </div>
            <nav className="desktop-nav" style={{ display: "flex", gap: 36 }}>
              {NAV_LINKS.map(link => (
                <a key={link} onClick={() => handleNavClick(link)} className="nav-link" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none", color: "#1A0A00", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s", cursor: "pointer", letterSpacing: "-0.01em" }}>
                  {link}
                  {link === "Visual Search" && <span style={{ fontSize: 9, background: "#C94B2C", color: "white", padding: "2px 7px", borderRadius: 9999, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI</span>}
                </a>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {["search", "shopping_bag", "person"].map(ic => (
                <button key={ic} className="icon-btn desktop-icons" style={{ padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "#1A0A00", transition: "background 0.2s" }}
                  onClick={() => ic === "person" ? navigate("/login") : ic === "search" ? navigate("/products") : setAuthGateOpen(true)}>
                  <Icon name={ic} />
                </button>
              ))}
              <button className="mobile-menu-btn icon-btn" onClick={() => setSidebarOpen(true)} style={{ display: "none", padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", alignItems: "center", color: "#1A0A00" }}>
                <Icon name="menu" />
              </button>
            </div>
          </div>
        </header>

        <main>
          <HeroCarousel navigate={navigate} newArrivalsRef={newArrivalsRef} onAuthGate={() => setAuthGateOpen(true)} />
          <NewArrivalsSection navigate={navigate} sectionRef={newArrivalsRef} />

          {/* SHOP BY CATEGORY */}
          <section style={{ padding: "72px 24px", background: "#F9DDD0" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ marginBottom: 48, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <h2 className="scroll-reveal" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", fontFamily: "'Cormorant Garamond', serif" }}>Shop by Category</h2>
                <div style={{ width: 40, height: 3, background: "#C94B2C", borderRadius: 2 }} />
              </div>
              <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {CATEGORIES.map((cat, i) => (
                  <div key={cat.name} className={`product-card scroll-reveal-scale delay-${i + 1}`} style={{ position: "relative", height: 360, borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
                    <img src={cat.src} alt={cat.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.75) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 24, left: 24 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: "-0.02em" }}>{cat.name}</h3>
                      <span style={{ fontSize: 10, color: "#F9DDD0", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, borderBottom: "2px solid #C94B2C", paddingBottom: 2 }}>Explore</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VISUAL SEARCH CTA - FULLY RESPONSIVE */}
          <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
            <div className="scroll-reveal-scale visual-search-container" style={{ 
              background: "#C94B2C", 
              borderRadius: 20, 
              overflow: "hidden", 
              position: "relative", 
              minHeight: 340, 
              display: "flex", 
              alignItems: "center" 
            }}>
              <div className="visual-search-image" style={{ 
                position: "absolute", 
                right: 0, 
                top: 0, 
                width: "48%", 
                height: "100%" 
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80" 
                  alt="Visual Search" 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover", 
                    opacity: 0.85 
                  }} 
                />
                {/* Gradient overlay for better text readability on mobile */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, rgba(201,75,44,0.8) 0%, rgba(201,75,44,0.4) 50%, transparent 80%)",
                  pointerEvents: "none"
                }} />
              </div>
              
              {/* Peach circles decorative */}
              <div style={{ position: "absolute", right: "48%", top: "-40px", width: 200, height: 200, borderRadius: "50%", background: "rgba(249,221,208,0.1)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: "38%", bottom: "-60px", width: 280, height: 280, borderRadius: "50%", background: "rgba(249,221,208,0.07)", pointerEvents: "none" }} />
              
              <div className="scroll-reveal-left visual-search-content" style={{ 
                padding: "52px 52px", 
                position: "relative", 
                zIndex: 2, 
                color: "white", 
                maxWidth: "52%",
                width: "100%"
              }}>
                <div className="visual-search-badge" style={{ 
                  display: "inline-block", 
                  background: "rgba(255,255,255,0.15)", 
                  borderRadius: 9999, 
                  padding: "4px 14px", 
                  fontSize: 9, 
                  fontWeight: 800, 
                  letterSpacing: "0.2em", 
                  textTransform: "uppercase", 
                  marginBottom: 20 
                }}>
                  AI POWERED
                </div>
                
                <h2 className="visual-search-title" style={{ 
                  fontSize: "clamp(1.6rem,2.8vw,2.2rem)", 
                  fontWeight: 900, 
                  marginBottom: 16, 
                  lineHeight: 1.2, 
                  letterSpacing: "-0.04em", 
                  fontFamily: "'Cormorant Garamond', serif" 
                }}>
                  Find it. Instantly.
                </h2>
                
                <p className="visual-search-description" style={{ 
                  fontSize: 14, 
                  color: "rgba(255,245,242,0.95)", 
                  marginBottom: 32, 
                  lineHeight: 1.65,
                  maxWidth: 320
                }}>
                  Upload any photo. Our AI matches it to the closest luxury pieces in seconds.
                </p>
                
                <button 
                  onClick={() => navigate("/register?force=true")} 
                  className="visual-search-button"
                  style={{ 
                    padding: "13px 26px", 
                    background: "white", 
                    color: "#C94B2C", 
                    fontWeight: 900, 
                    borderRadius: 50, 
                    border: "none", 
                    cursor: "pointer", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 8, 
                    fontSize: 14, 
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)", 
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = "translateY(-2px)"; 
                    e.currentTarget.style.boxShadow = "0 14px 36px rgba(0,0,0,0.25)"; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = "none"; 
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; 
                  }}>
                  <Icon name="add_a_photo" size={18} /> Launch AI Search
                </button>
              </div>
            </div>
          </section>

          {/* TRENDING */}
          <section style={{ padding: "0 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
              <h2 className="scroll-reveal" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", fontFamily: "'Cormorant Garamond', serif" }}>Trending Now</h2>
              <div style={{ width: 40, height: 3, background: "#C94B2C", borderRadius: 2 }} />
            </div>
            <div className="trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              {TRENDING.map((item, i) => (
                <div key={item.name} className={`product-card scroll-reveal delay-${i + 1}`} style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", marginBottom: 14, background: "#F9DDD0" }}>
                    <img src={item.src} alt={item.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: "#1A0A00", letterSpacing: "-0.02em" }}>{item.name}</h4>
                      <p style={{ fontSize: 11, color: "#C94B2C", fontWeight: 700, letterSpacing: "0.05em" }}>{item.label}</p>
                    </div>
                    <span style={{ color: "#1A0A00", fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif" }}>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ background: "#1A0A00", padding: "64px 24px 36px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="footer-grid scroll-reveal" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
              <div className="footer-brand">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#C94B2C" }}>
                  <LogoIcon />
                  <span style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>.NG</span></span>
                </div>
                <p style={{ color: "rgba(249,221,208,0.5)", lineHeight: 1.65, maxWidth: 260, marginBottom: 24, fontSize: 13 }}>Luxury craftsmanship. Intelligent discovery.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {["public", "share", "mail"].map(ic => (
                    <a key={ic} href="#" style={{ padding: 8, background: "rgba(201,75,44,0.15)", borderRadius: "50%", display: "flex", color: "#C94B2C", textDecoration: "none", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(201,75,44,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(201,75,44,0.15)"}>
                      <Icon name={ic} size={18} />
                    </a>
                  ))}
                </div>
              </div>
              {[{ title: "Shop", links: ["New Arrivals", "Best Sellers", "Tote Bags", "Crossbody"] }, { title: "Help", links: ["Shipping", "Returns", "Contact Us", "Size Guide"] }, { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookies"] }].map(col => (
                <div key={col.title}>
                  <h5 style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20, color: "#C94B2C" }}>{col.title}</h5>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                    {col.links.map(link => (<li key={link}><a href="#" style={{ fontSize: 13, color: "rgba(249,221,208,0.45)", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F9DDD0"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(249,221,208,0.45)"}>{link}</a></li>))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 24, borderTop: "1px solid rgba(201,75,44,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: "rgba(249,221,208,0.2)" }}>© 2024 Bag.NG International.</p>
              <div style={{ width: 24, height: 2, background: "#C94B2C", borderRadius: 2 }} />
            </div>
          </div>
        </footer>

        {/* SIDEBAR OVERLAY */}
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,10,0,0.4)", zIndex: 60, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "all" : "none", transition: "opacity 0.3s ease" }} />

        {/* SIDEBAR */}
        <aside style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 290, background: "white", zIndex: 70, display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(26,10,0,0.12)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", borderRight: "1px solid rgba(201,75,44,0.1)" }}>
          <div style={{ height: 4, background: "linear-gradient(90deg, #C94B2C, #E8856A)" }} />
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C94B2C" }}>
              <LogoIcon />
              <span style={{ fontWeight: 900, fontSize: 18, color: "#1A0A00", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>.NG</span></span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: 7, borderRadius: "50%", border: "1px solid rgba(201,75,44,0.15)", background: "#FFF5F2", cursor: "pointer", display: "flex", color: "#C94B2C", transition: "all 0.2s" }}>
              <Icon name="close" size={18} />
            </button>
          </div>

          <div style={{ padding: "0 14px", flex: 1 }}>
            {NAV_LINKS.map((link, i) => (
              <a key={link} onClick={() => {
                setSidebarOpen(false);
                if (link === "New Arrivals") {
                  setTimeout(() => newArrivalsRef.current?.scrollIntoView({ behavior: "smooth" }), 350);
                } else if (link === "Collections") {
                  setTimeout(() => navigate("/products"), 150);
                } else {
                  setTimeout(() => setAuthGateOpen(true), 150);
                }
              }} className="sidebar-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 12px", borderRadius: 10, marginBottom: 2, fontWeight: 700, fontSize: 14, textDecoration: "none", color: link === "Visual Search" ? "#C94B2C" : "#1A0A00", background: link === "Visual Search" ? "#FFF5F2" : "transparent", cursor: "pointer", transition: "background 0.2s", letterSpacing: "-0.01em" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={link === "Visual Search" ? "camera_enhance" : link === "Collections" ? "grid_view" : "new_releases"} size={17} />
                  {link}
                </span>
                {link === "Visual Search"
                  ? <span style={{ fontSize: 9, background: "#C94B2C", color: "white", padding: "2px 8px", borderRadius: 9999, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>AI</span>
                  : <Icon name="chevron_right" size={16} />}
              </a>
            ))}

            <div style={{ height: 1, background: "rgba(201,75,44,0.1)", margin: "16px 0" }} />

            {[{ icon: "shopping_bag", label: "Cart (0)" }, { icon: "favorite", label: "Wishlist" }].map(({ icon, label }) => (
              <a key={label} onClick={() => { setSidebarOpen(false); setTimeout(() => setAuthGateOpen(true), 150); }} className="sidebar-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, marginBottom: 2, fontWeight: 600, fontSize: 14, textDecoration: "none", color: "#555", cursor: "pointer", transition: "background 0.2s, color 0.2s" }}>
                <Icon name={icon} size={18} /> {label}
              </a>
            ))}
          </div>

          <div style={{ padding: "20px 20px 24px" }}>
            <button onClick={() => { setSidebarOpen(false); navigate("/login"); }} style={{ width: "100%", padding: "13px 0", background: "#C94B2C", color: "white", fontWeight: 900, borderRadius: 50, border: "none", cursor: "pointer", fontSize: 14, marginBottom: 10, boxShadow: "0 6px 20px rgba(201,75,44,0.35)", transition: "all 0.25s", letterSpacing: "-0.01em" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(201,75,44,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,75,44,0.35)"; }}>
              Sign In
            </button>
            <p style={{ textAlign: "center", fontSize: 9, color: "rgba(26,10,0,0.2)", fontStyle: "italic", letterSpacing: "0.15em", textTransform: "uppercase" }}>Luxury Redefined</p>
          </div>
        </aside>

        <AuthGateModal open={authGateOpen} onClose={() => setAuthGateOpen(false)} navigate={navigate} />
      </div>
    </div>
  );
}
