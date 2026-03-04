import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["New Arrivals", "Collections", "Visual Search"];

const NEW_ARRIVALS = [
  { name: "The Midnight Satchel", sub: "Italian Leather", material: "Midnight Blue", price: "$2,450", tag: "New", tagColor: "#135bec", accent: "#3b82f6", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8" },
  { name: "Ivory Essential Tote", sub: "Vegan Leather", material: "Ivory White", price: "$1,800", tag: "Eco", tagColor: "#059669", accent: "#10b981", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { name: "Azure Mini Crossbody", sub: "Napa Leather", material: "Azure Blue", price: "$1,250", tag: "Limited", tagColor: "#7c3aed", accent: "#a78bfa", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { name: "Onyx Evening Clutch", sub: "Polished Suede", material: "Onyx Black", price: "$3,100", tag: "Exclusive", tagColor: "#b45309", accent: "#fbbf24", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
];

const HERO_SLIDES = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4I73hqMmV64iEPGtSEJ3mNAbQtvPBqQQ22x1JA6F2E-E4U0-SmUat1vO0Z0c7l1142DjBBzcn-afis9xsHhMBa7rnrhdTWhV7aq8FUXyZDIlxADoYFJcdrsprs-bYJQOcAqih5olePRiw0nJPBPNpLCL32-aAsv9zAtqbGV6bFBMK5ypVAi4i0E2wq4chZKL5jOOJyPh6HoEXvJKPkNeXbHs-Kqqip9Cgq3VAIn0gqtoVtmGQwzvnFhaifm9ecmgYdWkGPqlRExE",
    badge: "Premium Craftsmanship",
    title: "Discover",
    subtitle: "Timeless Elegance",
    desc: "Experience the pinnacle of luxury with our curated collection of bags, powered by intuitive visual discovery.",
    accent: "#135bec",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
    badge: "New Collection",
    title: "Midnight",
    subtitle: "Luxury Satchels",
    desc: "Italian-crafted masterpieces in breathtaking midnight blue. Each piece tells a story of uncompromising quality.",
    accent: "#3b82f6",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
    badge: "Exclusive Edition",
    title: "Onyx",
    subtitle: "Evening Clutches",
    desc: "Polished suede evening clutches for those who demand nothing short of perfection on every occasion.",
    accent: "#fbbf24",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks",
    badge: "New Trend",
    title: "Emerald",
    subtitle: "Suede Collection",
    desc: "The season's most coveted emerald suede clutches. Where avant-garde design meets timeless sophistication.",
    accent: "#10b981",
  },
];

const CATEGORIES = [
  { name: "Totes", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB_04xZTrV_Axg5yh0aNoGtHkizuTQo3SF-rYUV5xHrdz2QAfuc_E3QpohCkJx72_wJmx5kKMARTx7yZj9T7XbopFKU2jb3nT3E_R8V82Qpjy5F1P7K2BNrsFZn3NUfOgqiv4ZvNpZZZBugimt03IllFL_K3-44e7EOI8D1uHvxCvrF5H9KS0PrnpfRu-4vlaZCcQoUs039FLRLoqMQx7oLUHbcJE8ZI4XGodOfLN38iAbfbL08bY4b88JCWrknI_h37H8Ub7GL9M" },
  { name: "Clutches", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRKbAqBYrOUO3jIvjP1j08WGuBx56oYQaLKAutycdNOyAtQnkNixGe5TfDJNsstxy2JXEi5uB0tPnzgN8BA7rNsSMUzu96BO_K7Mph6mrR-nU01QTgb6J0N_oFLuFM8H2quw9WHwR_ecgfA26VFn7jyb9mFtVB7UpAnSrLXvVRnwNLo9Kz8wrRlZYfaXrtGA-jVPJhFvFvnbG6ME8qCcDyRZgf5Tt75mXh6Wsh4YEzYnu1-c3qNjGgFFKmq9iHdB51CwJyxzPlqFE" },
  { name: "Backpacks", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTJ4J6N-ArK8lzcROZ_oL1YMMjkKvimYUMaZqKi-Rgdsh7h58Hi1kp8kq1vbsAqt4IhQ_Hq2u6SI6pHK2y6150BqxGMgw0CEXtITU8TTc5A9mMeSoirH7eSIsrHF0g07ScCFcwit_kundXpdrKnZR7aF3WPbeXMUtXz-MJfilgYtDnITqsgadWQtq9CFhIVkmkg3I_ispNHccqZo1jfjTrLrvlmgl_z0XwtM90T2yECR1G_6F07j7O4pZ5ELaWo3EP0uYxCwVzjwg" },
];

const TRENDING = [
  { name: "Crimson Structured Bag", label: "Popular Choice", price: "$3,200", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8" },
  { name: "Minimalist Sand Tote", label: "Editor's Pick", price: "$1,950", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_sKNiKX7NJOoRuxirNhqYW2CVrSgjx_0rJlgl3Xgtd91hKF7Al_wJ5OcwAsQIoSjiNyJH4zyPL7xJu9ggym4aGrZJU-PpyBDYb8bURs1qfYfAJy2fK4zkBJDV24R6XOCHKVAq9BLsgcTb-NRNTTgiNb5lp0QftxV3I0Ra86dQ1lfhnbt-4bsxZFh1_0DOBjY_hudNpjkjfW6SnC5bbsWRyT1tAjx5pqimCUzaGwdNf7r6dcOKx6rDKjvnabQan2CQfRkkURf7VLY" },
  { name: "Emerald Suede Clutch", label: "New Trend", price: "$2,100", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks" },
  { name: "Urban Heritage Pack", label: "Best Seller", price: "$1,600", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhRkGSg7Va0LHjp_dhl_1nOfsT69AcfKsT87IGMf4WFKySlhwVu2YbM24F5LEXYXeQBi910qpL7m28onkj1Ukw53DQt0ks4kIQDe7u2XhHh9t45Cw2n7rfXt7GEO2Ul4cyPv1NtKePCqQpbg_tJvMtGLm4gnLgyDIc5efzDZA4edimRL8upoZdtbsG9nn1R5J0GH70OTXUXJu3iZgne1KYmDSGHSi8use1KRPU6wE0OfE5HnQRIFnufOyMqHZ8ZFsXNLydzWxthDg" },
];

const LogoIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 48 48">
    <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Icon = ({ name, size = 22 }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal", fontSize: size, lineHeight: 1, display: "inline-block", textTransform: "none", letterSpacing: "normal", wordWrap: "normal", whiteSpace: "nowrap", direction: "ltr" }}>{name}</span>
);

const arrowBtn = {
  width: 40, height: 40, borderRadius: "50%", background: "transparent",
  border: "1px solid #2a2a3a", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", color: "#888",
  transition: "all 0.25s", flexShrink: 0,
};

/* ─── LUXURY LOADER ─── */
function LuxuryLoader({ onDone }) {
  const [phase, setPhase] = useState(0); // 0=intro, 1=filling, 2=exit
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase 0: brief pause then start filling
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
      background: "#06060d",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: phase === 2 ? "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" : "none",
      opacity: phase === 2 ? 0 : 1,
      transform: phase === 2 ? "translateY(-4%)" : "none",
      pointerEvents: phase === 2 ? "none" : "all",
    }}>
      {/* Ambient radial */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: "70vw", height: "70vw", maxWidth: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(19,91,236,0.12) 0%, transparent 65%)",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        animation: "loaderPulse 2.4s ease-in-out infinite",
      }} />

      {/* Spinning ring */}
      <div style={{ position: "relative", width: 110, height: 110, marginBottom: 40 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: "absolute", inset: 0, animation: "spinRing 2.5s linear infinite" }}>
          <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(19,91,236,0.12)" strokeWidth="1" />
          <circle cx="55" cy="55" r="48" fill="none" stroke="#135bec" strokeWidth="1.5"
            strokeDasharray={`${2 * Math.PI * 48 * progress / 100} ${2 * Math.PI * 48 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.1s ease", transformOrigin: "55px 55px" }}
          />
        </svg>
        {/* Inner diamond logo */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#135bec",
          animation: phase === 1 ? "logoBreathe 1.8s ease-in-out infinite" : "none",
        }}>
          <LogoIcon />
        </div>
      </div>

      {/* Brand name */}
      <div style={{
        overflow: "hidden", marginBottom: 8,
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.3s",
      }}>
        <div style={{
          fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "#fff",
          fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.08em",
          animation: phase >= 1 ? "slideUpText 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both" : "none",
        }}>
          Bag<span style={{ color: "#135bec" }}>.NG</span>
        </div>
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)", marginBottom: 44, fontWeight: 600,
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.7s",
      }}>
        Luxury Redefined
      </p>

      {/* Progress bar */}
      <div style={{
        width: "min(260px, 65vw)", height: 1,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 1, overflow: "hidden",
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.4s ease 0.5s",
      }}>
        <div style={{
          height: "100%", background: "linear-gradient(90deg, #135bec, #6366f1)",
          width: `${progress}%`, transition: "width 0.1s ease",
          borderRadius: 1,
          boxShadow: "0 0 8px rgba(19,91,236,0.6)",
        }} />
      </div>

      {/* Progress number */}
      <div style={{
        fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)",
        marginTop: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.4s ease 0.5s",
      }}>
        {Math.round(progress)}%
      </div>

      <style>{`
        @keyframes loaderPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.6} 50%{transform:translate(-50%,-50%) scale(1.15);opacity:1} }
        @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes logoBreathe { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.12);opacity:1} }
        @keyframes slideUpText { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ─── TYPEWRITER H1 ─── */
function TypewriterH1({ title, subtitle, accentColor, id }) {
  const [titleText, setTitleText] = useState("");
  const [subtitleText, setSubtitleText] = useState("");
  const [phase, setPhase] = useState("title");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setTitleText("");
    setSubtitleText("");
    setPhase("title");
    setShowCursor(true);
  }, [id]);

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
    } else {
      setPhase("done");
    }
  }, [phase, subtitleText, subtitle]);

  useEffect(() => {
    const t = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  const cursor = (visible) => (
    <span style={{
      display: "inline-block", width: 3, height: "0.82em",
      background: accentColor, marginLeft: 5, verticalAlign: "middle",
      borderRadius: 2, transition: "opacity 0.12s",
      opacity: visible ? 1 : 0,
      boxShadow: `0 0 10px ${accentColor}bb`,
    }} />
  );

  return (
    <h1 style={{
      fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 300, color: "white",
      lineHeight: 1.15, maxWidth: 640, marginBottom: 24,
      fontFamily: "'Clash Grotesk', sans-serif",
    }}>
      <span style={{ display: "block", minHeight: "1.15em" }}>
        {titleText}{phase === "title" && cursor(showCursor)}
      </span>
      <em style={{
        display: "block", fontWeight: 800, fontStyle: "italic", color: "#fff",
        minHeight: "1.15em",
        opacity: phase === "title" && subtitleText.length === 0 ? 0 : 1,
        transition: "opacity 0.15s",
      }}>
        {subtitleText}
        {phase === "subtitle" && cursor(showCursor)}
        {phase === "done" && cursor(showCursor)}
      </em>
    </h1>
  );
}

/* ─── HERO CAROUSEL ─── */
function HeroCarousel({ navigate }) {
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

      {/* BG Images */}
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

      {/* Ken Burns effect overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "transparent", animation: "kenBurns 5.5s ease-in-out infinite alternate" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto", padding: "120px 24px 100px", display: "flex", flexDirection: "column", minHeight: "88vh", justifyContent: "center" }}>

        <span key={`badge-${textKey}`} style={{
          display: "inline-block", padding: "6px 18px", marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
          borderRadius: 9999, border: `1px solid ${slide.accent}60`,
          color: slide.accent, width: "fit-content",
          animation: "heroTextIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
          transition: "color 0.5s, border-color 0.5s",
        }}>{slide.badge}</span>

        <TypewriterH1
          key={`tw-${textKey}`}
          title={slide.title}
          subtitle={slide.subtitle}
          accentColor={slide.accent}
          id={textKey}
        />

        <p key={`desc-${textKey}`} style={{
          fontSize: "clamp(1rem,1.8vw,1.15rem)", color: "#cbd5e1", maxWidth: 440,
          fontWeight: 300, lineHeight: 1.7, marginBottom: 44,
          animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both",
        }}>{slide.desc}</p>

        <div key={`btns-${textKey}`} style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56, animation: "heroTextIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both" }}>
          <button onClick={() => navigate("/register")} style={{
            padding: "15px 28px", background: slide.accent, color: "white", fontWeight: 700,
            borderRadius: 10, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontSize: 15,
            boxShadow: `0 8px 24px ${slide.accent}44`, transition: "background 0.5s, box-shadow 0.5s",
          }}><Icon name="camera" size={20} /> Try Visual Search</button>
          <button onClick={() => navigate("/register")} style={{
            padding: "15px 28px", color: "white", fontWeight: 700, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)", cursor: "pointer", fontSize: 15,
          }}>Browse Collections</button>
        </div>

        {/* Carousel controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Prev / Next */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { back(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
              <Icon name="arrow_back" size={18} />
            </button>
            <button onClick={() => { next(); resetAuto(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: slide.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "background 0.5s", boxShadow: `0 4px 16px ${slide.accent}55` }}>
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {HERO_SLIDES.map((s, i) => (
              <button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{
                width: active === i ? 32 : 6, height: 6, borderRadius: 3,
                background: active === i ? slide.accent : "rgba(255,255,255,0.3)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: active === i ? `0 0 8px ${slide.accent}88` : "none",
              }} />
            ))}
          </div>

          {/* Slide counter */}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", fontWeight: 700, marginLeft: "auto" }}>
            {String(active + 1).padStart(2, "0")} <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span> {String(HERO_SLIDES.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress bar auto-advance */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)" }}>
          <div key={`prog-${active}`} style={{
            height: "100%", background: slide.accent,
            animation: "heroProgress 5.5s linear forwards",
            boxShadow: `0 0 6px ${slide.accent}`,
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
function NewArrivalsSection({ navigate }) {
  const [active, setActive] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [dir, setDir] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const autoRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const goTo = useCallback((idx) => {
    if (animating || idx === active) return;
    setDir(idx > active ? 1 : -1);
    setPrevIdx(active);
    setAnimating(true);
    setActive(idx);
    setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 650);
  }, [active, animating]);

  const next = useCallback(() => goTo((active + 1) % NEW_ARRIVALS.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + NEW_ARRIVALS.length) % NEW_ARRIVALS.length), [active, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 4800);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const resetAuto = () => { clearInterval(autoRef.current); autoRef.current = setInterval(next, 4800); };

  const item = NEW_ARRIVALS[active];
  const prevItem = prevIdx !== null ? NEW_ARRIVALS[prevIdx] : null;

  return (
    <section ref={ref} style={{ background: "#06060d", position: "relative", overflow: "hidden", padding: "72px 0 60px" }}>
      <div style={{ position: "absolute", top: "40%", left: "30%", width: "60vw", height: "60vw", maxWidth: 700, borderRadius: "50%", background: `radial-gradient(circle, ${item.accent}1a 0%, transparent 65%)`, transition: "background 1.2s ease", pointerEvents: "none", transform: "translate(-50%,-50%)" }} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 2, background: item.accent, transition: "background 0.6s", borderRadius: 2 }} />
              <span style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: item.accent, fontWeight: 700, transition: "color 0.6s" }}>Just Landed</span>
            </div>
            <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>New Arrivals</h2>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); navigate("/register"); }} style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #222", paddingBottom: 4, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#555"}>
            All Pieces <Icon name="north_east" size={13} />
          </a>
        </div>
        <div className="arrivals-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 6, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px)", transition: "opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s" }}>
          <div className="arrivals-img" style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "16px 0 0 16px", cursor: "pointer" }} onClick={() => navigate("/register")}>
            {prevItem && (<img src={prevItem.src} alt={prevItem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: `exitImg${dir > 0 ? "L" : "R"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` }} />)}
            <img key={`img-${active}`} src={item.src} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: animating ? `enterImg${dir > 0 ? "R" : "L"} 0.65s cubic-bezier(0.77,0,0.175,1) forwards` : "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)" }} />
            <div style={{ position: "absolute", top: 18, left: 18, background: item.tagColor, color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 3, transition: "background 0.5s" }}>{item.tag}</div>
            <button onClick={e => { e.stopPropagation(); setLiked(s => { const n = new Set(s); n.has(active) ? n.delete(active) : n.add(active); return n; }); }} style={{ position: "absolute", top: 14, right: 14, width: 40, height: 40, borderRadius: "50%", background: liked.has(active) ? item.accent : "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", color: "white", transform: liked.has(active) ? "scale(1.15)" : "scale(1)" }}>
              <Icon name={liked.has(active) ? "favorite" : "favorite_border"} size={17} />
            </button>
            <div style={{ position: "absolute", bottom: 16, left: 18, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.1em" }}>{String(active + 1).padStart(2, "0")} / {String(NEW_ARRIVALS.length).padStart(2, "0")}</div>
          </div>
          <div className="arrivals-panel" style={{ background: "#0d0d1a", borderRadius: "0 16px 16px 0", padding: "40px 36px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${item.accent} 0%, transparent 100%)`, transition: "background 0.6s" }} />
            <div style={{ position: "absolute", bottom: -10, right: 8, fontSize: "clamp(5rem,12vw,9rem)", fontWeight: 900, lineHeight: 1, color: "rgba(255,255,255,0.025)", fontFamily: "'Cormorant Garamond', serif", pointerEvents: "none", userSelect: "none" }}>0{active + 1}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                {[item.sub, item.material].map(c => (<span key={c} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: item.accent, border: `1px solid ${item.accent}40`, padding: "4px 11px", borderRadius: 3, background: `${item.accent}0d`, transition: "all 0.5s" }}>{c}</span>))}
              </div>
              <div style={{ overflow: "hidden", marginBottom: 14 }}>
                <h3 key={`n-${active}`} style={{ fontSize: "clamp(1.5rem,2.8vw,2.2rem)", fontWeight: 800, color: "#fff", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em", lineHeight: 1.15, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both" }}>{item.name}</h3>
              </div>
              <div style={{ overflow: "hidden", marginBottom: 30 }}>
                <p key={`d-${active}`} style={{ color: "#555", fontSize: 13, lineHeight: 1.65, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.06s both" }}>Crafted from premium {item.sub.toLowerCase()} in a breathtaking {item.material.toLowerCase()} finish. A statement piece for the discerning eye.</p>
              </div>
              <div key={`p-${active}`} style={{ marginBottom: 32, animation: "slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both" }}>
                <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#444", display: "block", marginBottom: 5 }}>Price</span>
                <span style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", fontFamily: "'Cormorant Garamond', serif" }}>{item.price}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
                <button onClick={() => navigate("/register")} style={{ flex: 1, minWidth: 110, padding: "13px 18px", background: item.accent, color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.3s", boxShadow: `0 6px 24px ${item.accent}44` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>Add to Bag</button>
                <button onClick={() => navigate("/register")} style={{ padding: "13px 18px", background: "transparent", color: "#666", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid #1e1e2e", borderRadius: 8, cursor: "pointer", transition: "all 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.color = "#666"; }}>View</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {NEW_ARRIVALS.map((_, i) => (<button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ width: active === i ? 26 : 6, height: 6, borderRadius: 3, background: active === i ? item.accent : "#1e1e2e", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }} />))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { back(); resetAuto(); }} style={arrowBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.color = "#888"; }}><Icon name="arrow_back" size={17} /></button>
                  <button onClick={() => { next(); resetAuto(); }} style={{ ...arrowBtn, background: item.accent, borderColor: item.accent, color: "white", transition: "background 0.4s, border-color 0.4s" }}><Icon name="arrow_forward" size={17} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 2, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s" }}>
          {NEW_ARRIVALS.map((a, i) => (
            <div key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ flexShrink: 0, width: active === i ? 108 : 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)", outline: active === i ? `2.5px solid ${a.accent}` : "2.5px solid transparent", outlineOffset: 2 }}>
              <img src={a.src} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active === i ? "brightness(1)" : "brightness(0.35) saturate(0.4)", transition: "filter 0.4s" }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes exitImgL { from { transform:translateX(0) scale(1); opacity:1; } to { transform:translateX(-7%) scale(0.97); opacity:0; } }
        @keyframes exitImgR { from { transform:translateX(0) scale(1); opacity:1; } to { transform:translateX(7%) scale(0.97); opacity:0; } }
        @keyframes enterImgR { from { transform:translateX(5%) scale(0.97); opacity:0; } to { transform:translateX(0) scale(1); opacity:1; } }
        @keyframes enterImgL { from { transform:translateX(-5%) scale(0.97); opacity:0; } to { transform:translateX(0) scale(1); opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 680px) {
          .arrivals-grid { grid-template-columns: 1fr !important; }
          .arrivals-img { border-radius: 16px 16px 0 0 !important; aspect-ratio: 3/2 !important; }
          .arrivals-panel { border-radius: 0 0 16px 16px !important; padding: 28px 20px !important; }
        }
      `}</style>
    </section>
  );
}

/* ─── MAIN ─── */
export default function LuxeBag() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLoadDone = useCallback(() => setLoading(false), []);

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }); },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scroll-reveal,.scroll-reveal-left,.scroll-reveal-right,.scroll-reveal-scale").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f8", fontFamily: "'Manrope', sans-serif", color: "#0f172a" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Manrope',sans-serif;}
        .hide-scrollbar::-webkit-scrollbar{display:none;}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        .card-img{transition:transform 0.5s ease;}
        .product-card:hover .card-img{transform:scale(1.08);}
        .nav-link:hover{color:#135bec;}
        .icon-btn:hover{background:#f1f5f9!important;}
        .sidebar-link:hover{background:#f8fafc;}
        .logout-btn:hover{background:#fef2f2!important;}
        .hero-subtitle{opacity:0;transform:translateY(12px);animation:fadeUp 0.6s ease 3.6s forwards;}
        .hero-buttons{opacity:0;transform:translateY(12px);animation:fadeUp 0.6s ease 4s forwards;}
        .hero-badge{opacity:0;animation:fadeIn 0.5s ease 0.1s forwards;}
        @keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{to{opacity:1}}
        .scroll-reveal{opacity:0;transform:translateY(40px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal.visible{opacity:1;transform:translateY(0);}
        .scroll-reveal-left{opacity:0;transform:translateX(-40px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-left.visible{opacity:1;transform:translateX(0);}
        .scroll-reveal-right{opacity:0;transform:translateX(40px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-right.visible{opacity:1;transform:translateX(0);}
        .scroll-reveal-scale{opacity:0;transform:scale(0.92);transition:opacity 0.7s ease,transform 0.7s ease;}
        .scroll-reveal-scale.visible{opacity:1;transform:scale(1);}
        .delay-1{transition-delay:0.1s}.delay-2{transition-delay:0.2s}.delay-3{transition-delay:0.3s}.delay-4{transition-delay:0.4s}
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}.desktop-icons{display:none!important}
          .hero-title{font-size:2.5rem!important}.cta-panel{max-width:100%!important}.visual-right-img{display:none!important}
          .category-grid{grid-template-columns:1fr!important}.trending-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}.footer-brand{grid-column:span 2!important}
        }
      `}</style>

      {/* LOADER */}
      <LuxuryLoader onDone={handleLoadDone} />

      {/* PAGE — fades in after loader */}
      <div style={{
        opacity: loading ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: loading ? "none" : "all",
      }}>
        {/* HEADER */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#135bec" }}>
              <LogoIcon /><span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Bag.NG</span>
            </div>
            <nav className="desktop-nav" style={{ display: "flex", gap: 40 }}>
              {NAV_LINKS.map(link => (
                <a key={link} onClick={() => navigate("/register")} className="nav-link" style={{ fontSize: 14, fontWeight: 600, textDecoration: "none", color: "#0f172a", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s", cursor: "pointer" }}>
                  {link}{link === "Visual Search" && <span style={{ fontSize: 10, background: "rgba(19,91,236,0.1)", color: "#135bec", padding: "2px 7px", borderRadius: 9999, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI</span>}
                </a>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {["search", "shopping_bag", "person"].map(ic => (
                <button key={ic} className="icon-btn desktop-icons" style={{ padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }} onClick={() => navigate("/register")}><Icon name={ic} /></button>
              ))}
              <button className="mobile-menu-btn icon-btn" onClick={() => setSidebarOpen(true)} style={{ display: "none", padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", alignItems: "center" }}><Icon name="menu" /></button>
            </div>
          </div>
        </header>

        <main>
          {/* HERO CAROUSEL */}
          <HeroCarousel navigate={navigate} />

          {/* NEW ARRIVALS */}
          <NewArrivalsSection navigate={navigate} />

          {/* SHOP BY CATEGORY */}
          <section style={{ padding: "64px 24px", background: "white" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <h2 className="scroll-reveal" style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>Shop by Category</h2>
              <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
                {CATEGORIES.map((cat, i) => (
                  <div key={cat.name} className={`product-card scroll-reveal-scale delay-${i + 1}`} style={{ position: "relative", height: 380, borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
                    <img src={cat.src} alt={cat.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.82) 0%, transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: 28, left: 28 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 10 }}>{cat.name}</h3>
                      <span style={{ fontSize: 11, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, borderBottom: "2px solid #135bec", paddingBottom: 3 }}>Explore</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VISUAL SEARCH CTA */}
          <section style={{ padding: "96px 24px", maxWidth: 1280, margin: "0 auto" }}>
            <div className="scroll-reveal-scale" style={{ background: "#135bec", borderRadius: 24, overflow: "hidden", position: "relative", minHeight: 380, display: "flex", alignItems: "center" }}>
              <div className="visual-right-img" style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%" }}>
                <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80" alt="Visual Search" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
              </div>
              <div className="cta-panel scroll-reveal-left" style={{ padding: "52px 48px", position: "relative", zIndex: 1, color: "white", maxWidth: "55%" }}>
                <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>Find exactly what you're looking for.</h2>
                <p style={{ fontSize: 16, color: "rgba(219,234,254,1)", marginBottom: 32, lineHeight: 1.7 }}>Our AI-powered visual search allows you to upload any image and find the closest matches in our luxury catalog instantly.</p>
                <button onClick={() => navigate("/register?force=true")} style={{ padding: "15px 28px", background: "white", color: "#135bec", fontWeight: 800, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}><Icon name="add_a_photo" size={20} /> Launch AI Search</button>
              </div>
            </div>
          </section>

          {/* TRENDING */}
          <section style={{ padding: "0 24px 96px", maxWidth: 1280, margin: "0 auto" }}>
            <h2 className="scroll-reveal" style={{ fontSize: 28, fontWeight: 800, marginBottom: 40 }}>Trending Now</h2>
            <div className="trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
              {TRENDING.map((item, i) => (
                <div key={item.name} className={`product-card scroll-reveal delay-${i + 1}`} style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", marginBottom: 14, background: "#e8edf2" }}>
                    <img src={item.src} alt={item.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div><h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.name}</h4><p style={{ fontSize: 11, color: "#64748b" }}>{item.label}</p></div>
                    <span style={{ color: "#135bec", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ background: "white", borderTop: "1px solid #e2e8f0", padding: "72px 24px 40px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="footer-grid scroll-reveal" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
              <div className="footer-brand">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, color: "#135bec" }}><LogoIcon /><span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>LuxeBag</span></div>
                <p style={{ color: "#64748b", lineHeight: 1.7, maxWidth: 280, marginBottom: 28, fontSize: 14 }}>Redefining luxury craftsmanship for the modern era. Quality materials meet intelligent discovery.</p>
                <div style={{ display: "flex", gap: 10 }}>{["public", "share", "mail"].map(ic => (<a key={ic} href="#" style={{ padding: 8, background: "#f1f5f9", borderRadius: "50%", display: "flex", color: "#0f172a", textDecoration: "none" }}><Icon name={ic} size={18} /></a>))}</div>
              </div>
              {[{ title: "Shop", links: ["New Arrivals", "Best Sellers", "Tote Bags", "Crossbody"] }, { title: "Help", links: ["Shipping", "Returns", "Contact Us", "Size Guide"] }, { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] }].map(col => (
                <div key={col.title}>
                  <h5 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 22 }}>{col.title}</h5>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                    {col.links.map(link => (<li key={link}><a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{link}</a></li>))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 28, borderTop: "1px solid #e2e8f0" }}><p style={{ fontSize: 13, color: "#94a3b8" }}>© 2024 LuxeBag International. All rights reserved.</p></div>
          </div>
        </footer>

        {/* SIDEBAR OVERLAY */}
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 60, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "all" : "none", transition: "opacity 0.3s ease" }} />

        {/* SIDEBAR */}
        <aside style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 300, background: "white", zIndex: 70, display: "flex", flexDirection: "column", boxShadow: "8px 0 40px rgba(0,0,0,0.14)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto" }}>
          <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#135bec" }}><LogoIcon /><span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>LuxeBag</span></div>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: 8, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer" }}><Icon name="close" size={20} /></button>
          </div>
          <div style={{ padding: "0 16px", flex: 1 }}>
            {NAV_LINKS.map(link => (
              <a key={link} onClick={() => { setSidebarOpen(false); navigate("/register"); }} className="sidebar-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 12px", borderRadius: 10, marginBottom: 4, fontWeight: 700, fontSize: 15, textDecoration: "none", color: link === "Visual Search" ? "#135bec" : "#0f172a", background: link === "Visual Search" ? "rgba(19,91,236,0.06)" : "transparent", transition: "background 0.15s", cursor: "pointer" }}>
                {link}<Icon name={link === "Visual Search" ? "camera_enhance" : "chevron_right"} size={18} />
              </a>
            ))}
            <div style={{ height: 1, background: "#e2e8f0", margin: "18px 0" }} />
            {[{ icon: "shopping_bag", label: "Cart (0)" }, { icon: "favorite", label: "Wishlist" }].map(({ icon, label }) => (
              <a key={label} onClick={() => { setSidebarOpen(false); navigate("/register"); }} className="sidebar-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 10, marginBottom: 4, fontWeight: 600, fontSize: 15, textDecoration: "none", color: "#0f172a", transition: "background 0.15s", cursor: "pointer" }}>
                <Icon name={icon} size={20} /> {label}
              </a>
            ))}
            <div style={{ height: 1, background: "#e2e8f0", margin: "18px 0" }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8", padding: "0 12px", marginBottom: 12 }}>Account</p>
            <a onClick={() => { setSidebarOpen(false); navigate("/register"); }} className="sidebar-link" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 10, marginBottom: 6, textDecoration: "none", color: "#0f172a", transition: "background 0.15s", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #135bec, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}><Icon name="person" size={18} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>My Profile</div><div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>View & edit profile</div></div>
            </a>
            <button onClick={() => { setSidebarOpen(false); navigate("/register"); }} className="logout-btn" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 10, marginBottom: 6, border: "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.15s" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 18, color: "#ef4444", lineHeight: 1 }}>logout</span></div>
              <div><div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>Log Out</div><div style={{ fontSize: 11, color: "#fca5a5", marginTop: 1 }}>Sign out of your account</div></div>
            </button>
          </div>
          <div style={{ padding: "24px 24px 28px" }}>
            <button onClick={() => { setSidebarOpen(false); navigate("/register"); }} style={{ width: "100%", padding: "14px 0", background: "#135bec", color: "white", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, marginBottom: 12 }}>Sign In</button>
            <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Luxury Redefined</p>
          </div>
        </aside>
      </div>
    </div>
  );
}