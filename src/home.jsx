import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import LogoIcon from "./components/Logo.jsx";

// ── CRIIBB PALETTE ──
const NAV_LINKS = ["New Arrivals", "Collections", "Visual Search", "Contact Us"];

const NEW_ARRIVALS = [
  { name: "The Midnight Satchel", sub: "Italian Leather", material: "Midnight Blue", price: "$2,450", tag: "New", tagColor: "#C94B2C", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8" },
  { name: "Ivory Essential Tote", sub: "Vegan Leather", material: "Ivory White", price: "$1,800", tag: "Eco", tagColor: "#8B4513", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { name: "Azure Mini Crossbody", sub: "Napa Leather", material: "Azure Blue", price: "$1,250", tag: "Limited", tagColor: "#7A2E0E", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { name: "Onyx Evening Clutch", sub: "Polished Suede", material: "Onyx Black", price: "$3,100", tag: "Exclusive", tagColor: "#C94B2C", accent: "#C94B2C", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
];

const HERO_SLIDES = [
  { image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4I73hqMmV64iEPGtSEJ3mNAbQtvPBqQQ22x1JA6F2E-E4U0-SmUat1vO0Z0c7l1142DjBBzcn-afis9xsHhMBa7rnrhdTWhV7aq8FUXyZDIlxADoYFJcdrsprs-bYJQOcAqih5olePRiw0nJPBPNpLCL32-aAsv9zAtqbGV6bFBMK5ypVAi4i0E2wq4chZKL5jOOJyPh6HoEXvJKPkNeXbHs-Kqqip9Cgq3VAIn0gqtoVtmGQwzvnFhaifm9ecmgYdWkGPqlRExE", badge: "Shop Bags with Your Camera.", title: "Shop Bags", subtitle: "with Your Camera.", desc: "Point, shoot, discover.", accent: "#C94B2C" },
  { image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8", badge: "Snap. Shop. Buy in Seconds.", title: "Snap. Shop.", subtitle: "Buy in Seconds.", desc: "Snap, chat, checkout.", accent: "#C94B2C" },
  { image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E", badge: "Find Any Bag. Upload a Photo.", title: "Find Any Bag.", subtitle: "Upload a Photo.", desc: "AI matches in seconds.", accent: "#E06040" },
  { image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks", badge: "New Season", title: "See It.", subtitle: "Message It. Get It.", desc: "Avant-garde meets timeless.", accent: "#C94B2C" },
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

const BLOG_FALLBACK = [
  { id: "1", title: "The Rise of AI in Luxury Fashion Discovery", desc: "How computer vision is transforming the way we shop for luxury goods — from virtual try-ons to instant bag identification.", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80", source: "BagSearch Editorial", date: "2024-12-01", cat: "Technology" },
  { id: "2", title: "Lagos to London: The African Luxury Wave", desc: "Nigerian designers and platforms are reshaping global luxury. How BagSearch is at the forefront of Africa's fashion renaissance.", img: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&auto=format&fit=crop&q=80", source: "BagSearch Style", date: "2024-11-28", cat: "Lifestyle" },
  { id: "3", title: "The Anatomy of a Perfect Designer Tote", desc: "From Bottega Veneta's weave to Celine's minimalist lines — what makes a luxury tote worth its price tag?", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80", source: "BagSearch Fashion", date: "2024-11-20", cat: "Fashion" },
  { id: "4", title: "Investing in Handbags: The New Asset Class", desc: "Hermès Birkins outperforming gold. How the luxury resale market is creating a new generation of collectors.", img: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&auto=format&fit=crop&q=80", source: "BagSearch Finance", date: "2024-11-15", cat: "Business" },
  { id: "5", title: "Sustainable Luxury: Vegan Leather's Moment", desc: "From Stella McCartney to emerging Nigerian brands — the movement toward cruelty-free luxury is gaining serious momentum.", img: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&auto=format&fit=crop&q=80", source: "BagSearch Eco", date: "2024-11-10", cat: "Sustainability" },
  { id: "6", title: "Visual Search: The Future of Shopping", desc: "You see a bag on Instagram. You want it. Visual AI makes that journey from desire to checkout a matter of seconds.", img: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop&q=80", source: "BagSearch Tech", date: "2024-11-05", cat: "Technology" },
];

// Using shared LogoIcon from components/Logo.jsx

const Icon = ({ name, size = 22 }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", wordWrap: "normal", whiteSpace: "nowrap", direction: "ltr" }}>{name}</span>
);

/* ─── AUTH GATE MODAL ─── */
function AuthGateModal({ open, onClose, navigate }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (open) { setPhase(1); const t = setTimeout(() => setPhase(2), 20); return () => clearTimeout(t); }
    else { setPhase(3); const t = setTimeout(() => setPhase(0), 400); return () => clearTimeout(t); }
  }, [open]);
  if (phase === 0) return null;
  const visible = phase === 2;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,10,0,0.55)", backdropFilter: "blur(8px)", opacity: visible ? 1 : 0, transition: "opacity 0.35s ease" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, background: "#FFFFFF", border: "1px solid rgba(201,75,44,0.15)", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(26,10,0,0.18)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.95)", transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ height: 6, background: "linear-gradient(90deg, #C94B2C, #E8856A, #C94B2C)" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1px solid #E8D5CC", background: "#FFF5F2", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; e.currentTarget.style.color = "#C94B2C"; }} onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; e.currentTarget.style.color = "#999"; }}><Icon name="close" size={15} /></button>
        <div style={{ padding: "36px 36px 32px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F9DDD0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#C94B2C", animation: visible ? "authFloat 3s ease-in-out infinite" : "none" }}><Icon name="lock" size={28} /></div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A0A00", letterSpacing: "-0.04em", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Members Only</h2>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>Sign in to unlock visual search, wishlists & more.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {[{ icon: "image_search", label: "Visual Search" }, { icon: "favorite", label: "Wishlist" }, { icon: "notifications", label: "Alerts" }].map(({ icon, label }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: "#F9DDD0", fontSize: 10, fontWeight: 700, color: "#C94B2C" }}><Icon name={icon} size={12} /> {label}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { onClose(); navigate("/register"); }} style={{ width: "100%", padding: "13px 0", background: "#C94B2C", color: "white", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: "0 6px 20px rgba(201,75,44,0.35)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>Create Free Account</button>
            <button onClick={() => { onClose(); navigate("/login?force=true"); }} style={{ width: "100%", padding: "12px 0", background: "#FFF5F2", color: "#C94B2C", fontWeight: 700, fontSize: 13, border: "1px solid #F0C8BB", borderRadius: 10, cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; }} onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; }}>Already a member? Sign In</button>
          </div>
        </div>
        <div style={{ padding: "12px 36px", borderTop: "1px solid #F5EAE5", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#FDFAFA" }}>
          <LogoIcon /><span style={{ fontSize: 12, fontWeight: 800, color: "#1A0A00" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></span>
        </div>
      </div>
      <style>{`@keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

/* ─── LUXURY LOADER ─── */
function LuxuryLoader({ onDone }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPhase(1), 400); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (phase !== 1) return;
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 4 + 1.5;
      if (p >= 100) { p = 100; clearInterval(interval); setProgress(100); setTimeout(() => setPhase(2), 600); setTimeout(() => onDone(), 1400); }
      else setProgress(Math.min(p, 100));
    }, 40);
    return () => clearInterval(interval);
  }, [phase, onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#F9DDD0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: phase === 2 ? "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" : "none", opacity: phase === 2 ? 0 : 1, transform: phase === 2 ? "translateY(-4%)" : "none", pointerEvents: phase === 2 ? "none" : "all" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "70vw", height: "70vw", maxWidth: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,75,44,0.18) 0%, transparent 65%)", transform: "translate(-50%,-50%)", animation: "loaderPulse 2.4s ease-in-out infinite" }} />
      <div style={{ position: "relative", width: 100, height: 100, marginBottom: 36 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, animation: "spinRing 2.5s linear infinite" }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(201,75,44,0.15)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#C94B2C" strokeWidth="2" strokeDasharray={`${2 * Math.PI * 44 * progress / 100} ${2 * Math.PI * 44 * (1 - progress / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.1s ease", transformOrigin: "50px 50px" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: phase === 1 ? "logoBreathe 1.8s ease-in-out infinite" : "none" }}><LogoIcon /></div>
      </div>
      <div style={{ fontSize: "clamp(2rem,5vw,2.8rem)", fontWeight: 900, color: "#1A0A00", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.04em", marginBottom: 6, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></div>
      <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(26,10,0,0.35)", marginBottom: 40, fontWeight: 700, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}>Luxury Redefined</p>
      <div style={{ width: "min(220px,60vw)", height: 2, background: "rgba(26,10,0,0.08)", borderRadius: 2, overflow: "hidden", opacity: phase >= 1 ? 1 : 0 }}>
        <div style={{ height: "100%", background: "#C94B2C", width: `${progress}%`, transition: "width 0.1s ease", borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(26,10,0,0.3)", marginTop: 10, fontWeight: 700, opacity: phase >= 1 ? 1 : 0 }}>{Math.round(progress)}%</div>
      <style>{`
        @keyframes loaderPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:1} }
        @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes logoBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
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
  useEffect(() => { setTitleText(""); setSubtitleText(""); setPhase("title"); }, [id]);
  useEffect(() => {
    if (phase !== "title") return;
    if (titleText.length < title.length) { const t = setTimeout(() => setTitleText(title.slice(0, titleText.length + 1)), 55); return () => clearTimeout(t); }
    else { const t = setTimeout(() => setPhase("subtitle"), 180); return () => clearTimeout(t); }
  }, [phase, titleText, title]);
  useEffect(() => {
    if (phase !== "subtitle") return;
    if (subtitleText.length < subtitle.length) { const t = setTimeout(() => setSubtitleText(subtitle.slice(0, subtitleText.length + 1)), 62); return () => clearTimeout(t); }
    else setPhase("done");
  }, [phase, subtitleText, subtitle]);
  useEffect(() => { const t = setInterval(() => setShowCursor(c => !c), 530); return () => clearInterval(t); }, []);
  const cursor = (v) => <span style={{ display: "inline-block", width: 3, height: "0.75em", background: accentColor, marginLeft: 4, verticalAlign: "middle", borderRadius: 2, opacity: v ? 1 : 0, transition: "opacity 0.12s" }} />;
  return (
    <h1 style={{ fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 300, color: "white", lineHeight: 1.15, maxWidth: 640, marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>
      <span style={{ display: "block", minHeight: "1.12em" }}>{titleText}{phase === "title" && cursor(showCursor)}</span>
      <em style={{ display: "block", fontWeight: 800, fontStyle: "italic", color: accentColor, minHeight: "1.12em", opacity: phase === "title" && subtitleText.length === 0 ? 0 : 1, transition: "opacity 0.15s, color 0.5s" }}>
        {subtitleText}{(phase === "subtitle" || phase === "done") && cursor(showCursor)}
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
    setDir(idx > active ? 1 : -1); setPrev(active); setAnimating(true); setActive(idx); setTextKey(k => k + 1);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 900);
  }, [active, animating]);
  const next = useCallback(() => goTo((active + 1) % HERO_SLIDES.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [active, goTo]);
  useEffect(() => { autoRef.current = setInterval(next, 5500); return () => clearInterval(autoRef.current); }, [next]);
  const resetAuto = () => { clearInterval(autoRef.current); autoRef.current = setInterval(next, 5500); };
  const slide = HERO_SLIDES[active];
  const prevSlide = prev !== null ? HERO_SLIDES[prev] : null;
  return (
    <section style={{ position: "relative", minHeight: "88vh", overflow: "hidden" }}>
      {prevSlide && <div key={`prev-bg-${prev}`} style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 100%), url('${prevSlide.image}')`, backgroundSize: "cover", backgroundPosition: "center", animation: `heroBgExit${dir > 0 ? "L" : "R"} 0.9s cubic-bezier(0.77,0,0.175,1) forwards`, zIndex: 1 }} />}
      <div key={`bg-${active}`} style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 100%), url('${slide.image}')`, backgroundSize: "cover", backgroundPosition: "center", animation: animating ? `heroBgEnter${dir > 0 ? "R" : "L"} 0.9s cubic-bezier(0.77,0,0.175,1) forwards` : "none", zIndex: 2 }} />
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto", padding: "120px 24px 100px", display: "flex", flexDirection: "column", minHeight: "88vh", justifyContent: "center" }}>
        <span key={`badge-${textKey}`} style={{ display: "inline-block", padding: "6px 18px", marginBottom: 28, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 9999, border: `1px solid ${slide.accent}80`, color: slide.accent, width: "fit-content", animation: "heroTextIn 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>{slide.badge}</span>
        <TypewriterH1 key={`tw-${textKey}`} title={slide.title} subtitle={slide.subtitle} accentColor={slide.accent} id={textKey} />
        <p key={`desc-${textKey}`} style={{ fontSize: "clamp(1rem,1.8vw,1.15rem)", color: "#F9DDD0", maxWidth: 440, fontWeight: 300, lineHeight: 1.7, marginBottom: 44, animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both", opacity: 0.85 }}>{slide.desc}</p>
        <div key={`btns-${textKey}`} style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56, animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both" }}>
          <button onClick={() => onAuthGate()} style={{ padding: "15px 28px", background: slide.accent, color: "white", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15, boxShadow: `0 8px 24px ${slide.accent}55`, transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(0.88)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}><Icon name="camera" size={20} /> Try Visual Search</button>
          <button onClick={() => navigate("/login?force=true")} style={{ padding: "15px 28px", color: "white", fontWeight: 700, borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", cursor: "pointer", fontSize: 15 }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>Sign In</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { back(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}><Icon name="arrow_back" size={18} /></button>
            <button onClick={() => { next(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: slide.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 4px 16px ${slide.accent}66` }} onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.88)"; e.currentTarget.style.transform = "scale(1.08)"; }} onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}><Icon name="arrow_forward" size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {HERO_SLIDES.map((s, i) => (<button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ width: active === i ? 32 : 6, height: 6, borderRadius: 3, background: active === i ? slide.accent : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }} />))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", fontWeight: 700, marginLeft: "auto" }}>{String(active + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)" }}>
          <div key={`prog-${active}`} style={{ height: "100%", background: slide.accent, animation: "heroProgress 5.5s linear forwards" }} />
        </div>
      </div>
      <style>{`
        @keyframes heroBgExitL { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(-6%) scale(0.98);opacity:0} }
        @keyframes heroBgExitR { from{transform:translateX(0) scale(1);opacity:1} to{transform:translateX(6%) scale(0.98);opacity:0} }
        @keyframes heroBgEnterR { from{transform:translateX(5%) scale(0.98);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes heroBgEnterL { from{transform:translateX(-5%) scale(0.98);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes heroTextIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroProgress { from{width:0%} to{width:100%} }
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
  const setRefs = useCallback((node) => { ref.current = node; if (sectionRef) sectionRef.current = node; }, [sectionRef]);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
  const goTo = useCallback((idx) => { if (animating || idx === active) return; setDir(idx > active ? 1 : -1); setPrevIdx(active); setAnimating(true); setActive(idx); setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 650); }, [active, animating]);
  const next = useCallback(() => goTo((active + 1) % NEW_ARRIVALS.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + NEW_ARRIVALS.length) % NEW_ARRIVALS.length), [active, goTo]);
  useEffect(() => { autoRef.current = setInterval(next, 4800); return () => clearInterval(autoRef.current); }, [next]);
  const resetAuto = () => { clearInterval(autoRef.current); autoRef.current = setInterval(next, 4800); };
  const item = NEW_ARRIVALS[active];
  const prevItem = prevIdx !== null ? NEW_ARRIVALS[prevIdx] : null;
  return (
    <section ref={setRefs} style={{ background: "#FFFFFF", position: "relative", overflow: "hidden", padding: "72px 0 60px" }}>
      <div style={{ position: "absolute", top: "50%", right: "-5%", width: "40vw", height: "40vw", maxWidth: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,221,208,0.5) 0%, transparent 70%)", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 44, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><div style={{ width: 20, height: 3, background: "#C94B2C", borderRadius: 2 }} /><span style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 800 }}>Just Landed</span></div>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>New Arrivals</h2>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); navigate("/products"); }} style={{ color: "#C94B2C", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: "1.5px solid #C94B2C", paddingBottom: 3 }}>All Pieces <Icon name="north_east" size={13} /></a>
        </div>
        <div className="arrivals-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 6, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px)", transition: "opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s" }}>
          <div className="arrivals-img" style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "16px 0 0 16px", cursor: "pointer" }} onClick={() => navigate("/register")}>
            {prevItem && <img src={prevItem.src} alt={prevItem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: `exitImg${dir > 0 ? "L" : "R"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` }} />}
            <img key={`img-${active}`} src={item.src} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: animating ? `enterImg${dir > 0 ? "R" : "L"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` : "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.45) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, background: "#C94B2C", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>{item.tag}</div>
            <button onClick={e => { e.stopPropagation(); setLiked(s => { const n = new Set(s); n.has(active) ? n.delete(active) : n.add(active); return n; }); }} style={{ position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: "50%", background: liked.has(active) ? "#C94B2C" : "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", color: liked.has(active) ? "white" : "#C94B2C" }}><Icon name={liked.has(active) ? "favorite" : "favorite_border"} size={17} /></button>
          </div>
          <div className="arrivals-panel" style={{ background: "#F9DDD0", borderRadius: "0 16px 16px 0", padding: "40px 36px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C94B2C" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>{[item.sub, item.material].map(c => (<span key={c} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C94B2C", border: "1px solid rgba(201,75,44,0.3)", padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,0.5)" }}>{c}</span>))}</div>
              <div style={{ overflow: "hidden", marginBottom: 12 }}><h3 key={`n-${active}`} style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#1A0A00", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.15, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both" }}>{item.name}</h3></div>
              <div style={{ overflow: "hidden", marginBottom: 28 }}><p key={`d-${active}`} style={{ color: "#7A4030", fontSize: 13, lineHeight: 1.6, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.06s both" }}>Premium {item.sub.toLowerCase()}. {item.material} finish.</p></div>
              <div key={`p-${active}`} style={{ marginBottom: 28, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both" }}>
                <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "#B07060", display: "block", marginBottom: 4 }}>Price</span>
                <span style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.03em", fontFamily: "'Outfit', sans-serif" }}>{item.price}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
                <button onClick={() => navigate("/register")} style={{ flex: 1, minWidth: 100, padding: "12px 16px", background: "#C94B2C", color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", borderRadius: 50, cursor: "pointer", boxShadow: "0 6px 20px rgba(201,75,44,0.35)" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>Add to Bag</button>
                <button onClick={() => navigate("/register")} style={{ padding: "12px 16px", background: "white", color: "#C94B2C", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "1.5px solid #C94B2C", borderRadius: 50, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#FFF5F2"} onMouseLeave={e => e.currentTarget.style.background = "white"}>View</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6 }}>{NEW_ARRIVALS.map((_, i) => (<button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ width: active === i ? 24 : 6, height: 6, borderRadius: 3, background: active === i ? "#C94B2C" : "rgba(201,75,44,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s" }} />))}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { back(); resetAuto(); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "white", border: "1.5px solid rgba(201,75,44,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#C94B2C" }} onMouseEnter={e => e.currentTarget.style.background = "#F9DDD0"} onMouseLeave={e => e.currentTarget.style.background = "white"}><Icon name="arrow_back" size={15} /></button>
                  <button onClick={() => { next(); resetAuto(); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "#C94B2C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 14px rgba(201,75,44,0.4)" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}><Icon name="arrow_forward" size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 2, opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
          {NEW_ARRIVALS.map((a, i) => (<div key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ flexShrink: 0, width: active === i ? 104 : 60, height: 60, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)", outline: active === i ? "2.5px solid #C94B2C" : "2.5px solid transparent", outlineOffset: 2 }}><img src={a.src} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active === i ? "brightness(1)" : "brightness(0.5) saturate(0.3)", transition: "filter 0.4s" }} /></div>))}
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

/* ─── ABOUT US SECTION ─── */
function AboutUsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [countUp, setCountUp] = useState(false);
  const [counts, setCounts] = useState({ bags: 0, members: 0, countries: 0, years: 0 });
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    let frame;
    const animate = () => { setOrbitAngle(a => (a + 0.4) % 360); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setCountUp(true); setVisible(true); } }, { threshold: 0.1 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!countUp) return;
    const targets = { bags: 12000, members: 48000, countries: 34, years: 6 };
    const durations = { bags: 2200, members: 2400, countries: 1600, years: 1200 };
    Object.keys(targets).forEach(key => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / durations[key], 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounts(c => ({ ...c, [key]: Math.round(targets[key] * eased) }));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, [countUp]);

  const tabs = [
    { label: "Our Story", icon: "auto_stories", content: "Born in Lagos, BagSearch set out to solve a problem every fashion-forward Nigerian knew too well: finding the perfect luxury bag was an exercise in frustration. We built an AI-first discovery platform that understands your style before you do.", highlight: "Lagos-born. Globally loved." },
    { label: "Our Mission", icon: "flag", content: "We believe luxury shouldn't be a treasure hunt. Using computer vision and proprietary AI models, we've made finding your dream bag as easy as taking a photo. Point. Shoot. Discover. That's the BagSearch promise.", highlight: "AI-first luxury discovery." },
    { label: "Our Values", icon: "diamond", content: "Authenticity over everything. Every piece on BagSearch is verified, every seller is vetted, and every transaction is protected. We're not just a marketplace — we're the guardian of your luxury journey.", highlight: "Verified. Trusted. Premium." },
  ];

  const orbitItems = ["👜", "💼", "👝", "🎒", "👛"];

  return (
    <section ref={sectionRef} style={{ position: "relative", overflow: "hidden", background: "#1A0A00", padding: "100px 0" }}>
      <style>{`
        @keyframes morphBlob { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
        @keyframes aboutGlow { 0%,100%{box-shadow:0 0 30px rgba(201,75,44,0.2)} 50%{box-shadow:0 0 60px rgba(201,75,44,0.5)} }
        @keyframes scanLine { from{top:-2px} to{top:100%} }
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes aboutFadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .about-tab:hover { background:rgba(201,75,44,0.1)!important; color:#F9DDD0!important; }
        .about-stat:hover { transform:translateY(-6px)!important; box-shadow:0 20px 40px rgba(201,75,44,0.2)!important; }
        @media(max-width:768px){
          .about-main-grid{grid-template-columns:1fr!important}
          .about-orbit{display:none!important}
          .about-stats{grid-template-columns:repeat(2,1fr)!important}
          .about-tabs-row{flex-wrap:wrap!important}
        }
        @media(max-width:480px){
          .about-stats{grid-template-columns:repeat(2,1fr)!important}
          .about-inner{padding:32px 20px!important}
        }
      `}</style>

      {/* Animated grid bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,75,44,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,75,44,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Scan line */}
      <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(201,75,44,0.25), transparent)", animation: "scanLine 5s linear infinite", zIndex: 1 }} />
      {/* Blob */}
      <div style={{ position: "absolute", top: "10%", right: "5%", width: 380, height: 380, background: "radial-gradient(circle, rgba(201,75,44,0.12) 0%, transparent 70%)", animation: "morphBlob 9s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(201,75,44,0.1)", border: "1px solid rgba(201,75,44,0.25)", borderRadius: 9999, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C94B2C", display: "block", animation: "aboutGlow 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 800 }}>Est. 2018 · Lagos, Nigeria</span>
          </div>
          <h2 style={{ fontSize: "clamp(3rem,7vw,5.5rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.05em", fontFamily: "'Outfit', sans-serif", marginBottom: 16, background: "linear-gradient(135deg, #FFFFFF 30%, #F9DDD0 60%, #C94B2C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            We Are<br /><span style={{ fontWeight: 200, letterSpacing: "-0.03em" }}>BagSearch</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(249,221,208,0.85)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>Africa's first AI-powered luxury bag discovery platform. Where culture meets couture.</p>
        </div>

        {/* Main grid */}
        <div className="about-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }}>
          {/* Left */}
          <div className="about-inner" style={{ padding: "0 4px" }}>
            {/* Tabs */}
            <div className="about-tabs-row" style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {tabs.map((tab, i) => (
                <button key={i} className="about-tab" onClick={() => setActiveTab(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: "1px solid", letterSpacing: "0.05em", transition: "all 0.3s", background: activeTab === i ? "rgba(201,75,44,0.12)" : "transparent", color: activeTab === i ? "#F9DDD0" : "rgba(249,221,208,0.35)", borderColor: activeTab === i ? "rgba(201,75,44,0.45)" : "rgba(201,75,44,0.15)" }}>
                  <Icon name={tab.icon} size={13} /> {tab.label}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div key={activeTab} style={{ animation: "aboutFadeUp 0.4s ease both", marginBottom: 28 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(201,75,44,0.12)", borderRadius: 4, marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#C94B2C", letterSpacing: "0.15em", textTransform: "uppercase" }}>{tabs[activeTab].highlight}</span>
              </div>
              <p style={{ fontSize: 15, color: "rgba(249,221,208,0.88)", lineHeight: 1.8, fontWeight: 300 }}>{tabs[activeTab].content}</p>
            </div>
            {/* Terminal */}
            <div style={{ background: "rgba(201,75,44,0.05)", border: "1px solid rgba(201,75,44,0.12)", borderRadius: 12, padding: "18px 20px", fontFamily: "monospace" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "block" }} />)}
                <span style={{ fontSize: 10, color: "rgba(249,221,208,0.15)", marginLeft: 6 }}>bagsearch/config</span>
              </div>
              {[{ k: "founded", v: '"Lagos, Nigeria — 2018"' }, { k: "tech", v: '"Vision AI + React"' }, { k: "verified", v: "true" }, { k: "ai_search", v: '"enabled"' }].map(({ k, v }, i) => (
                <div key={k} style={{ display: "flex", gap: 8, marginBottom: 3, animation: `aboutFadeUp 0.4s ease ${i * 0.07}s both` }}>
                  <span style={{ color: "#C94B2C", fontSize: 11 }}>{k}:</span>
                  <span style={{ color: "rgba(249,221,208,0.75)", fontSize: 11 }}>{v},</span>
                </div>
              ))}
              <span style={{ color: "rgba(249,221,208,0.15)", fontSize: 11 }}>{"}"}</span>
              <span style={{ display: "inline-block", width: 2, height: 12, background: "#C94B2C", marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
            </div>
          </div>

          {/* Right: orbit visual */}
          <div className="about-orbit" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
            <div style={{ position: "relative", width: 260, height: 260 }}>
              <div style={{ position: "absolute", inset: -20, border: "1px solid rgba(201,75,44,0.08)", borderRadius: "50%", animation: "spinSlow 22s linear infinite" }} />
              <div style={{ position: "absolute", inset: 0, border: "1px dashed rgba(201,75,44,0.15)", borderRadius: "50%", animation: "spinSlow 16s linear infinite reverse" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, rgba(201,75,44,0.25) 0%, rgba(201,75,44,0.05) 100%)", border: "1px solid rgba(201,75,44,0.35)", display: "flex", alignItems: "center", justifyContent: "center", animation: "aboutGlow 3s ease-in-out infinite" }}>
                <span style={{ fontSize: 28, fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: "#C94B2C" }}>B</span>
              </div>
              {orbitItems.map((item, i) => {
                const angle = (orbitAngle + i * 72) * (Math.PI / 180);
                const radius = 110;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, width: 40, height: 40, borderRadius: "50%", background: "rgba(249,221,208,0.06)", border: "1px solid rgba(201,75,44,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{item}</div>
                );
              })}
              {[{ label: "AI-Powered", icon: "auto_awesome", top: "2%", right: "-35%" }, { label: "Verified", icon: "verified", bottom: "8%", left: "-28%" }, { label: "24/7", icon: "support_agent", top: "42%", right: "-32%" }].map(({ label, icon, ...pos }) => (
                <div key={label} style={{ position: "absolute", ...pos, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(26,10,0,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(201,75,44,0.2)", borderRadius: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                  <span style={{ color: "#C94B2C" }}><Icon name={icon} size={11} /></span>
                  <span style={{ color: "#F9DDD0", fontSize: 10, fontWeight: 700 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="about-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s" }}>
          {[{ val: counts.bags.toLocaleString(), label: "Luxury Bags", suffix: "+", icon: "shopping_bag" }, { val: counts.members.toLocaleString(), label: "Members", suffix: "+", icon: "group" }, { val: counts.countries, label: "Countries", suffix: "", icon: "public" }, { val: counts.years, label: "Years", suffix: "+", icon: "workspace_premium" }].map((s, i) => (
            <div key={i} className="about-stat" style={{ padding: "22px 18px", background: "rgba(201,75,44,0.05)", border: "1px solid rgba(201,75,44,0.1)", borderRadius: 14, textAlign: "center", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #C94B2C, transparent)", opacity: 0.4 }} />
              <div style={{ color: "#C94B2C", marginBottom: 8, opacity: 0.6 }}><Icon name={s.icon} size={20} /></div>
              <div style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 900, color: "#F9DDD0", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}{s.suffix}</div>
              <div style={{ fontSize: 10, color: "rgba(249,221,208,0.55)", marginTop: 5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Marquee */}
        <div style={{ overflow: "hidden", padding: "16px 0", borderTop: "1px solid rgba(201,75,44,0.08)", borderBottom: "1px solid rgba(201,75,44,0.08)", marginBottom: 48 }}>
          <div style={{ display: "flex", animation: "marqueeScroll 20s linear infinite", width: "max-content" }}>
            {["Luxury Redefined", "AI-Powered", "Lagos Born", "Global Luxury", "Verified Authentic", "Fashion Forward", "Luxury Redefined", "AI-Powered", "Lagos Born", "Global Luxury", "Verified Authentic", "Fashion Forward"].map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16, fontSize: 11, fontWeight: 700, color: i % 2 === 0 ? "rgba(249,221,208,0.15)" : "rgba(201,75,44,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginRight: 32, whiteSpace: "nowrap" }}>
                {t} <span style={{ width: 3, height: 3, background: "#C94B2C", borderRadius: "50%", opacity: 0.4 }} />
              </span>
            ))}
          </div>
        </div>

        {/* CTA Row */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div>
            <h3 style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)", fontWeight: 800, color: "#F9DDD0", letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Built by fashion lovers, for fashion lovers.</h3>
            <p style={{ fontSize: 13, color: "rgba(249,221,208,0.6)" }}>A team of 40+ designers, engineers & AI researchers in Lagos & London.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={{ padding: "11px 22px", background: "#C94B2C", color: "white", fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: 9999, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 6px 20px rgba(201,75,44,0.35)", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}><Icon name="work" size={13} /> Join Our Team</button>
            <button style={{ padding: "11px 22px", background: "transparent", color: "rgba(249,221,208,0.5)", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(249,221,208,0.12)", borderRadius: 9999, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(249,221,208,0.3)"; e.currentTarget.style.color = "#F9DDD0"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(249,221,208,0.12)"; e.currentTarget.style.color = "rgba(249,221,208,0.5)"; }}>Press & Media</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── BLOG SECTION ─── */
function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const NEWSDATA_KEY = "253cbe2827b44031a3e551bb6c1c4ea3";
  const categories = ["All", "Fashion", "Luxury", "Style", "Tech"];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const q = filter === "All" ? "luxury fashion bags" : filter === "Fashion" ? "fashion bags style" : filter === "Luxury" ? "luxury designer handbags" : filter === "Style" ? "fashion style trends" : "AI fashion technology";
        const res = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(q)}&language=en&category=entertainment,lifestyle&image=1`);
        const data = await res.json();
        if (data.status === "success" && data.results) {
          const valid = data.results.filter(a => a.image_url && a.title && a.description).slice(0, 6);
          setPosts(valid.length >= 3 ? valid : BLOG_FALLBACK);
        } else throw new Error("no results");
      } catch { setPosts(BLOG_FALLBACK); }
      finally { setLoading(false); }
    };
    fetchNews();
  }, [filter]);

  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };
  const readTime = (desc) => Math.max(2, Math.ceil((desc?.split(" ")?.length || 80) / 200)) + " min";

  return (
    <section ref={sectionRef} style={{ background: "#FFFFFF", position: "relative", overflow: "hidden", padding: "96px 0 80px" }}>
      <style>{`
        @keyframes blogIn { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }
        .blog-card { transition:transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; cursor:pointer; }
        .blog-card:hover { transform:translateY(-8px)!important; box-shadow:0 24px 48px rgba(201,75,44,0.1)!important; }
        .blog-img { transition:transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .blog-card:hover .blog-img { transform:scale(1.07)!important; }
        .blog-filter { transition:all 0.25s ease; }
        .blog-filter:hover { background:rgba(201,75,44,0.08)!important; color:#C94B2C!important; }
        @media(max-width:768px){
          .blog-featured{grid-template-columns:1fr!important}
          .blog-featured-img{height:240px!important}
          .blog-grid{grid-template-columns:1fr!important}
          .blog-filters-row{overflow-x:auto!important}
        }
        @media(max-width:640px){
          .blog-newsletter{flex-direction:column!important;gap:20px!important}
          .blog-newsletter-input{flex-direction:column!important}
          .blog-newsletter-input input{border-right:1.5px solid rgba(201,75,44,0.2)!important;border-bottom:none!important;border-radius:9999px!important}
          .blog-newsletter-input button{border-radius:9999px!important}
        }
      `}</style>

      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,221,208,0.7) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,221,208,0.4) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ width: 20, height: 3, background: "#C94B2C", borderRadius: 2 }} /><span style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 800 }}>Editorial</span></div>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.05em", lineHeight: 0.95, fontFamily: "'Outfit', sans-serif" }}>The BagSearch<br /><span style={{ fontWeight: 200, letterSpacing: "-0.03em" }}>Journal</span></h2>
          </div>
          <a href="#" style={{ color: "#C94B2C", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: "1.5px solid #C94B2C", paddingBottom: 3 }}>All Stories <Icon name="north_east" size={13} /></a>
        </div>

        {/* Filters */}
        <div className="blog-filters-row" style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap", opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}>
          {categories.map(cat => (
            <button key={cat} className="blog-filter" onClick={() => setFilter(cat)} style={{ padding: "8px 18px", borderRadius: 9999, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", border: "none", background: filter === cat ? "#C94B2C" : "rgba(26,10,0,0.06)", color: filter === cat ? "white" : "rgba(26,10,0,0.4)", boxShadow: filter === cat ? "0 6px 20px rgba(201,75,44,0.3)" : "none", transition: "all 0.25s ease" }}>{cat}</button>
          ))}
          {loading && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px" }}>{[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#C94B2C", display: "block", animation: `dotBounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div>}
        </div>

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(26,10,0,0.06)" }}>
                <div style={{ height: 200, background: "linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite" }} />
                <div style={{ padding: 18 }}>{[80,100,60].map((w,j) => <div key={j} style={{ height: j===0?9:12, width:`${w}%`, background: "linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite", borderRadius: 4, marginBottom: 10 }} />)}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            {/* Featured post */}
            <div className="blog-featured" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", borderRadius: 20, overflow: "hidden", marginBottom: 20, boxShadow: "0 8px 32px rgba(26,10,0,0.07)", opacity: visible ? 1 : 0, animation: visible ? "blogIn 0.7s ease both" : "none", cursor: "pointer" }} onMouseEnter={() => setHoveredCard("featured")} onMouseLeave={() => setHoveredCard(null)}>
              <div className="blog-featured-img" style={{ position: "relative", height: 400, overflow: "hidden" }}>
                <img src={posts[0].image_url || posts[0].img || BLOG_FALLBACK[0].img} alt={posts[0].title} className="blog-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.src = BLOG_FALLBACK[0].img; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, rgba(26,10,0,0.25))" }} />
                <div style={{ position: "absolute", top: 18, left: 18, background: "#C94B2C", color: "white", fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>{posts[0].category?.[0] || posts[0].cat || "Featured"}</div>
              </div>
              <div style={{ background: "#1A0A00", padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#C94B2C", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>Editor's Pick</span>
                <h3 style={{ fontSize: "clamp(1.1rem,1.6vw,1.4rem)", fontWeight: 800, color: "#F9DDD0", lineHeight: 1.3, letterSpacing: "-0.03em", marginBottom: 14, fontFamily: "'Outfit', sans-serif" }}>{(posts[0].title || "").slice(0, 80)}{(posts[0].title || "").length > 80 ? "…" : ""}</h3>
                <p style={{ fontSize: 13, color: "rgba(249,221,208,0.45)", lineHeight: 1.7, marginBottom: 22, fontWeight: 300 }}>{((posts[0].description || posts[0].desc) || "").slice(0, 130)}…</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(249,221,208,0.25)" }}>{posts[0].source_id || posts[0].source} · {readTime(posts[0].description || posts[0].desc)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#C94B2C", fontSize: 12, fontWeight: 700 }}>Read <Icon name="arrow_forward" size={13} /></div>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
              {posts.slice(1).map((post, i) => (
                <article key={post.article_id || post.id || i} className="blog-card" onMouseEnter={() => setHoveredCard(i)} onMouseLeave={() => setHoveredCard(null)} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(26,10,0,0.07)", background: "#FFFFFF", opacity: visible ? 1 : 0, animation: visible ? `blogIn 0.6s ease ${0.1 + i * 0.08}s both` : "none" }}>
                  <div style={{ position: "relative", height: 196, overflow: "hidden" }}>
                    <img src={post.image_url || post.img || BLOG_FALLBACK[i + 1]?.img} alt={post.title} className="blog-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.src = BLOG_FALLBACK[Math.min(i + 1, BLOG_FALLBACK.length - 1)].img; }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.45) 0%, transparent 55%)" }} />
                    <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(26,10,0,0.65)", backdropFilter: "blur(4px)", color: "#F9DDD0", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 4 }}>{post.category?.[0] || post.cat || "Editorial"}</span>
                  </div>
                  <div style={{ padding: "18px" }}>
                    <h3 style={{ fontSize: "clamp(0.85rem,1.3vw,0.95rem)", fontWeight: 800, color: "#1A0A00", lineHeight: 1.4, marginBottom: 8, letterSpacing: "-0.02em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
                    <p style={{ fontSize: 12, color: "rgba(26,10,0,0.42)", lineHeight: 1.65, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.description || post.desc}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(26,10,0,0.05)" }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#1A0A00" }}>{(post.source_id || post.source || "Editorial").slice(0, 18)}</div>
                        <div style={{ fontSize: 9, color: "rgba(26,10,0,0.28)", marginTop: 1 }}>{fmtDate(post.pubDate || post.date)} · {readTime(post.description || post.desc)}</div>
                      </div>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: hoveredCard === i ? "#C94B2C" : "rgba(201,75,44,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: hoveredCard === i ? "white" : "#C94B2C", transition: "all 0.3s", flexShrink: 0 }}><Icon name="arrow_forward" size={13} /></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Newsletter */}
        <div className="blog-newsletter" style={{ marginTop: 60, padding: "44px 48px", background: "linear-gradient(135deg, #F9DDD0 0%, #F5C4A8 100%)", borderRadius: 20, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s" }}>
          <div>
            <span style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 800, display: "block", marginBottom: 8 }}>Newsletter</span>
            <h3 style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>Style drops, delivered weekly.</h3>
            <p style={{ fontSize: 13, color: "rgba(26,10,0,0.45)", maxWidth: 300 }}>Curated luxury news, new arrivals, and AI insights — straight to your inbox.</p>
          </div>
          <div className="blog-newsletter-input" style={{ display: "flex", gap: 0, width: "min(400px,100%)" }}>
            <input placeholder="your@email.com" style={{ flex: 1, padding: "13px 18px", border: "1.5px solid rgba(201,75,44,0.2)", borderRight: "none", borderRadius: "9999px 0 0 9999px", fontSize: 13, color: "#1A0A00", background: "rgba(255,255,255,0.7)", outline: "none", fontFamily: "inherit" }} />
            <button style={{ padding: "13px 22px", background: "#C94B2C", color: "white", fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "0 9999px 9999px 0", cursor: "pointer", whiteSpace: "nowrap" }}>Subscribe</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function LuxeBag() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const navigate = useNavigate();
  const newArrivalsRef = useRef(null);
  const handleLoadDone = useCallback(() => setLoading(false), []);

  const handleNavClick = (link) => {
    if (link === "New Arrivals") { if (newArrivalsRef.current) newArrivalsRef.current.scrollIntoView({ behavior: "smooth" }); }
    else if (link === "Collections") navigate("/products");
    else setAuthGateOpen(true);
  };

  const handleProfileClick = () => {
    if (!user) { setAuthGateOpen(true); return; }
    navigate("/products");
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
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .card-img{transition:transform 0.5s ease;}
        .product-card:hover .card-img{transform:scale(1.06);}
        .nav-link:hover{color:#C94B2C!important;}
        .icon-btn:hover{background:#F9DDD0!important;}
        .sidebar-link:hover{background:rgba(201,75,44,0.06)!important;}
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}.desktop-icons{display:none!important}
          .category-grid{grid-template-columns:1fr!important}
          .trending-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}.footer-brand{grid-column:span 2!important}
        }
        @media(max-width:640px){
          .visual-search-container{min-height:400px!important}
          .visual-search-content{max-width:100%!important;padding:32px 20px!important;text-align:center!important}
          .visual-search-image{width:100%!important;opacity:0.2!important}
          .visual-search-button{width:100%!important;justify-content:center!important}
        }
        @media(max-width:480px){
          .visual-search-title{font-size:24px!important}
          .footer-grid{grid-template-columns:1fr!important}.footer-brand{grid-column:span 1!important}
        }
        .scroll-reveal{opacity:0;transform:translateY(32px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal.visible{opacity:1;transform:translateY(0);}
        .scroll-reveal-scale{opacity:0;transform:scale(0.93);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-scale.visible{opacity:1;transform:scale(1);}
        .scroll-reveal-left{opacity:0;transform:translateX(-32px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-left.visible{opacity:1;transform:translateX(0);}
        .delay-1{transition-delay:0.08s}.delay-2{transition-delay:0.16s}.delay-3{transition-delay:0.24s}
        .footer-link:hover{color:#F9DDD0!important;}
      `}</style>

      <LuxuryLoader onDone={handleLoadDone} />

      <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.6s ease", pointerEvents: loading ? "none" : "all" }}>

        {/* HEADER */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,75,44,0.12)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LogoIcon size={34} />
              <span style={{ fontSize: 20, fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></span>
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
              {["search"].map(ic => (
                <button key={ic} className="icon-btn desktop-icons" style={{ padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "#1A0A00", transition: "background 0.2s" }} onClick={() => ic === "search" ? navigate("/products") : null}><Icon name={ic} /></button>
              ))}
              <button className="mobile-menu-btn icon-btn" onClick={() => setSidebarOpen(true)} style={{ display: "none", padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", alignItems: "center", color: "#1A0A00" }}><Icon name="menu" /></button>
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
                <h2 className="scroll-reveal" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", fontFamily: "'Outfit', sans-serif" }}>Shop by Category</h2>
                <div style={{ width: 40, height: 3, background: "#C94B2C", borderRadius: 2 }} />
              </div>
              <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {CATEGORIES.map((cat, i) => (
                  <div key={cat.name} className={`product-card scroll-reveal-scale delay-${i + 1}`} style={{ position: "relative", height: 360, borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
                    <img src={cat.src} alt={cat.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.75) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 24, left: 24 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 8 }}>{cat.name}</h3>
                      <span style={{ fontSize: 10, color: "#F9DDD0", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, borderBottom: "2px solid #C94B2C", paddingBottom: 2 }}>Explore</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VISUAL SEARCH CTA */}
          <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
            <div className="scroll-reveal-scale visual-search-container" style={{ background: "#C94B2C", borderRadius: 20, overflow: "hidden", position: "relative", minHeight: 340, display: "flex", alignItems: "center" }}>
              <div className="visual-search-image" style={{ position: "absolute", right: 0, top: 0, width: "48%", height: "100%" }}>
                <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80" alt="Visual Search" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(201,75,44,0.8) 0%, rgba(201,75,44,0.4) 50%, transparent 80%)" }} />
              </div>
              <div style={{ position: "absolute", right: "48%", top: "-40px", width: 200, height: 200, borderRadius: "50%", background: "rgba(249,221,208,0.1)" }} />
              <div style={{ position: "absolute", right: "38%", bottom: "-60px", width: 280, height: 280, borderRadius: "50%", background: "rgba(249,221,208,0.07)" }} />
              <div className="scroll-reveal-left visual-search-content" style={{ padding: "52px 52px", position: "relative", zIndex: 2, color: "white", maxWidth: "52%", width: "100%" }}>
                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 9999, padding: "4px 14px", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>AI POWERED</div>
                <h2 className="visual-search-title" style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 900, marginBottom: 16, lineHeight: 1.2, letterSpacing: "-0.04em", fontFamily: "'Outfit', sans-serif" }}>Find it. Instantly.</h2>
                <p style={{ fontSize: 14, color: "rgba(255,245,242,0.95)", marginBottom: 32, lineHeight: 1.65, maxWidth: 320 }}>Upload any photo. Our AI matches it to the closest luxury pieces in seconds.</p>
                <button onClick={() => navigate("/register?force=true")} className="visual-search-button" style={{ padding: "13px 26px", background: "white", color: "#C94B2C", fontWeight: 900, borderRadius: 50, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(0,0,0,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}>
                  <Icon name="add_a_photo" size={18} /> Launch AI Search
                </button>
              </div>
            </div>
          </section>

          {/* TRENDING */}
          <section style={{ padding: "0 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
              <h2 className="scroll-reveal" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, color: "#1A0A00", letterSpacing: "-0.04em", fontFamily: "'Outfit', sans-serif" }}>Trending Now</h2>
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
                      <h4 style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: "#1A0A00" }}>{item.name}</h4>
                      <p style={{ fontSize: 11, color: "#C94B2C", fontWeight: 700 }}>{item.label}</p>
                    </div>
                    <span style={{ color: "#1A0A00", fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", fontFamily: "'Outfit', sans-serif" }}>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── ABOUT US ─── */}
          <AboutUsSection />

          {/* ─── BLOG / JOURNAL ─── */}
          <BlogSection />
        </main>

        {/* FOOTER */}
        <footer style={{ background: "#1A0A00", padding: "64px 24px 36px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="footer-grid scroll-reveal" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
              <div className="footer-brand">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <LogoIcon />
                  <span style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></span>
                </div>
                <p style={{ color: "rgba(249,221,208,0.65)", lineHeight: 1.7, maxWidth: 260, marginBottom: 24, fontSize: 13 }}>Luxury craftsmanship. Intelligent discovery. Africa's first AI-powered luxury bag marketplace.</p>
        <div style={{ display: "flex", gap: 10 }}>
          {["shopping_bag", "person"].map(ic => (
            <button key={ic} style={{ padding: 9, borderRadius: "50%", border: "none", background: "rgba(201,75,44,0.15)", color: "#F9DDD0", cursor: "pointer", transition: "background 0.2s" }} onClick={() => { ic === "person" ? handleProfileClick() : setAuthGateOpen(true); }} onMouseEnter={e => e.currentTarget.style.background = "rgba(201,75,44,0.3)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(201,75,44,0.15)"}><Icon name={ic} size={18} /></button>
          ))}
        </div>
              </div>
              {[
                { title: "Shop", links: ["New Arrivals", "Best Sellers", "Tote Bags", "Crossbody", "Visual Search"] },
                { title: "Company", links: ["About Us", "Blog", "Careers", "Press", "Partnerships"] },
                { title: "Support", links: ["Shipping", "Returns", "Contact Us", "Size Guide", "Privacy Policy"] }
              ].map(col => (
                <div key={col.title}>
                  <h5 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20, color: "#C94B2C" }}>{col.title}</h5>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="footer-link" style={{ fontSize: 13, color: "rgba(249,221,208,0.6)", textDecoration: "none", transition: "color 0.2s", fontWeight: 500 }}>{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 24, borderTop: "1px solid rgba(201,75,44,0.18)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <p style={{ fontSize: 12, color: "rgba(249,221,208,0.45)", fontWeight: 500 }}>© 2024 BagSearch International. All rights reserved.</p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {["Terms", "Privacy", "Cookies"].map(l => (
                  <a key={l} href="#" style={{ fontSize: 11, color: "rgba(249,221,208,0.3)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(249,221,208,0.65)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(249,221,208,0.3)"}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        {/* SIDEBAR OVERLAY */}
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,10,0,0.4)", zIndex: 60, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "all" : "none", transition: "opacity 0.3s ease" }} />

        {/* SIDEBAR */}
        <aside style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 290, background: "white", zIndex: 70, display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(26,10,0,0.12)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", borderRight: "1px solid rgba(201,75,44,0.1)" }}>
          <div style={{ height: 4, background: "linear-gradient(90deg, #C94B2C, #E8856A)" }} />
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><LogoIcon /><span style={{ fontWeight: 900, fontSize: 18, color: "#1A0A00", letterSpacing: "-0.04em" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></span></div>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: 7, borderRadius: "50%", border: "1px solid rgba(201,75,44,0.15)", background: "#FFF5F2", cursor: "pointer", display: "flex", color: "#C94B2C" }}><Icon name="close" size={18} /></button>
          </div>
          <div style={{ padding: "0 14px", flex: 1 }}>
            {NAV_LINKS.map((link) => (
              <a key={link} onClick={() => { setSidebarOpen(false); if (link === "New Arrivals") setTimeout(() => newArrivalsRef.current?.scrollIntoView({ behavior: "smooth" }), 350); else if (link === "Collections") setTimeout(() => navigate("/products"), 150); else setTimeout(() => setAuthGateOpen(true), 150); }} className="sidebar-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 12px", borderRadius: 10, marginBottom: 2, fontWeight: 700, fontSize: 14, textDecoration: "none", color: link === "Visual Search" ? "#C94B2C" : "#1A0A00", background: link === "Visual Search" ? "#FFF5F2" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name={link === "Visual Search" ? "camera_enhance" : link === "Collections" ? "grid_view" : "new_releases"} size={17} />{link}</span>
                {link === "Visual Search" ? <span style={{ fontSize: 9, background: "#C94B2C", color: "white", padding: "2px 8px", borderRadius: 9999, fontWeight: 800 }}>AI</span> : <Icon name="chevron_right" size={16} />}
              </a>
            ))}
            <div style={{ height: 1, background: "rgba(201,75,44,0.1)", margin: "16px 0" }} />
            {[{ icon: "shopping_bag", label: "Cart (0)" }, { icon: "favorite", label: "Wishlist" }].map(({ icon, label }) => (
              <a key={label} onClick={() => { setSidebarOpen(false); setTimeout(() => setAuthGateOpen(true), 150); }} className="sidebar-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, marginBottom: 2, fontWeight: 600, fontSize: 14, textDecoration: "none", color: "#555", cursor: "pointer" }}><Icon name={icon} size={18} /> {label}</a>
            ))}
          </div>
          <div style={{ padding: "20px 20px 24px" }}>
            <button onClick={() => { setSidebarOpen(false); navigate("/login?force=true"); }} style={{ width: "100%", padding: "13px 0", background: "#C94B2C", color: "white", fontWeight: 900, borderRadius: 50, border: "none", cursor: "pointer", fontSize: 14, marginBottom: 10, boxShadow: "0 6px 20px rgba(201,75,44,0.35)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>Sign In</button>
            <p style={{ textAlign: "center", fontSize: 9, color: "rgba(26,10,0,0.2)", fontStyle: "italic", letterSpacing: "0.15em", textTransform: "uppercase" }}>Luxury Redefined</p>
          </div>
        </aside>

        <AuthGateModal open={authGateOpen} onClose={() => setAuthGateOpen(false)} navigate={navigate} />
      </div>
    </div>
  );
}