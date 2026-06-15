import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import LogoIcon from "./components/Logo.jsx";
import { useSEO, SITE_URL } from "./hooks/useSEO";

// ─── PALETTE & DATA ───────────────────────────────────────────────
// Minimal editorial palette: near-black text, off-white surfaces,
// single warm-terracotta accent (#C94B2C), fine hairline rules.
// No colour noise — the bags do the visual work.

const NAV_LINKS = [
  "New Arrivals",
  "Collections",
  "Hot Deals",
  "About Us",
  "Visual Search",
  "Contact Us",
];

const NEW_ARRIVALS = [
  {
    name: "The Midnight Satchel",
    sub: "Italian Leather",
    material: "Midnight Blue",
    price: "$2,450",
    tag: "New",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
  },
  {
    name: "Ivory Essential Tote",
    sub: "Vegan Leather",
    material: "Ivory White",
    price: "$1,800",
    tag: "Eco",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo",
  },
  {
    name: "Azure Mini Crossbody",
    sub: "Napa Leather",
    material: "Azure Blue",
    price: "$1,250",
    tag: "Limited",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk",
  },
  {
    name: "Onyx Evening Clutch",
    sub: "Polished Suede",
    material: "Onyx Black",
    price: "$3,100",
    tag: "Exclusive",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
  },
];

const HERO_SLIDES = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4I73hqMmV64iEPGtSEJ3mNAbQtvPBqQQ22x1JA6F2E-E4U0-SmUat1vO0Z0c7l1142DjBBzcn-afis9xsHhMBa7rnrhdTWhV7aq8FUXyZDIlxADoYFJcdrsprs-bYJQOcAqih5olePRiw0nJPBPNpLCL32-aAsv9zAtqbGV6bFBMK5ypVAi4i0E2wq4chZKL5jOOJyPh6HoEXvJKPkNeXbHs-Kqqip9Cgq3VAIn0gqtoVtmGQwzvnFhaifm9ecmgYdWkGPqlRExE",
    eyebrow: "AI visual search",
    title: "Find any bag",
    subtitle: "from a photo.",
    desc: "Upload any image — screenshot, street snap, wishlist save — and find similar luxury bags in seconds.",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
    eyebrow: "New arrivals",
    title: "Snap it.",
    subtitle: "Shop it instantly.",
    desc: "Thousands of verified luxury pieces. Point your camera, discover your next bag.",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks",
    eyebrow: "New season",
    title: "See it.",
    subtitle: "Own it. Today.",
    desc: "Africa's first AI-powered luxury bag marketplace. Born in Lagos, loved globally.",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
    eyebrow: "Verified authentic",
    title: "Every bag.",
    subtitle: "Verified. Trusted.",
    desc: "Every piece on BagSearch is authenticated before it reaches your door. No exceptions.",
  },
];

const CATEGORIES = [
  {
    name: "Totes",
    count: "240+ pieces",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB_04xZTrV_Axg5yh0aNoGtHkizuTQo3SF-rYUV5xHrdz2QAfuc_E3QpohCkJx72_wJmx5kKMARTx7yZj9T7XbopFKU2jb3nT3E_R8V82Qpjy5F1P7K2BNrsFZn3NUfOgqiv4ZvNpZZZBugimt03IllFL_K3-44e7EOI8D1uHvxCvrF5H9KS0PrnpfRu-4vlaZCcQoUs039FLRLoqMQx7oLUHbcJE8ZI4XGodOfLN38iAbfbL08bY4b88JCWrknI_h37H8Ub7GL9M",
  },
  {
    name: "Clutches",
    count: "180+ pieces",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRKbAqBYrOUO3jIvjP1j08WGuBx56oYQaLKAutycdNOyAtQnkNixGe5TfDJNsstxy2JXEi5uB0tPnzgN8BA7rNsSMUzu96BO_K7Mph6mrR-nU01QTgb6J0N_oFLuFM8H2quw9WHwR_ecgfA26VFn7jyb9mFtVB7UpAnSrLXvVRnwNLo9Kz8wrRlZYfaXrtGA-jVPJhFvFvnbG6ME8qCcDyRZgf5Tt75mXh6Wsh4YEzYnu1-c3qNjGgFFKmq9iHdB51CwJyxzPlqFE",
  },
  {
    name: "Backpacks",
    count: "120+ pieces",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTJ4J6N-ArK8lzcROZ_oL1YMMjkKvimYUMaZqKi-Rgdsh7h58Hi1kp8kq1vbsAqt4IhQ_Hq2u6SI6pHK2y6150BqxGMgw0CEXtITU8TTc5A9mMeSoirH7eSIsrHF0g07ScCFcwit_kundXpdrKnZR7aF3WPbeXMUtXz-MJfilgYtDnITqsgadWQtq9CFhIVkmkg3I_ispNHccqZo1jfjTrLrvlmgl_z0XwtM90T2yECR1G_6F07j7O4pZ5ELaWo3EP0uYxCwVzjwg",
  },
];

const TRENDING = [
  {
    name: "Crimson Structured Bag",
    label: "Popular Choice",
    price: "$3,200",
    brand: "House of Lagos",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8",
  },
  {
    name: "Minimalist Sand Tote",
    label: "Editor's Pick",
    price: "$1,950",
    brand: "Studio Abuja",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_sKNiKX7NJOoRuxirNhqYW2CVrSgjx_0rJlgl3Xgtd91hKF7Al_wJ5OcwAsQIoSjiNyJH4zyPL7xJu9ggym4aGrZJU-PpyBDYb8bURs1qfYfAJy2fK4zkBJDV24R6XOCHKVAq9BLsgcTb-NRNTTgiNb5lp0QftxV3I0Ra86dQ1lfhnbt-4bsxZFh1_0DOBjY_hudNpjkjfW6SnC5bbsWRyT1tAjx5pqimCUzaGawdNf7r6dcOKx6rDKjvnabQan2CQfRkkURf7VLY",
  },
  {
    name: "Emerald Suede Clutch",
    label: "New Trend",
    price: "$2,100",
    brand: "Noir Collective",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcg56F_DA96gyH4Qnn6HhtIQZg7j8Y-X-H26B-1tl1HH3zYd0gbXh6UEFuBAa6fYHGH_-uSFoWDW9L7EmOMDLxqLhto4HyEJ5cb_kLqV6Cz_Xiti8CQBt4vgQxSafQQeDwiHBqMU68IHcKK8ds7wEBEfiAVdBDo7X12rND_v0ld_dvrVGASk3-MRsEoqItztHOJwZ_hfoKbAgY51yYUnLyBiTCOzAJBbnEh_Tts5z4O_7DukjxsT5UHq_Q2PdAVXFYOMk3kiPviks",
  },
  {
    name: "Urban Heritage Pack",
    label: "Best Seller",
    price: "$1,600",
    brand: "Kente & Co.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhRkGSg7Va0LHjp_dhl_1nOfsT69AcfKsT87IGMf4WFKySlhwVu2YbM24F5LEXYXeQBi910qpL7m28onkj1Ukw53DQt0ks4kIQDe7u2XhHh9t45Cw2n7rfXt7GEO2Ul4cyPv1NtKePCqQpbg_tJvMtGLm4gnLgyDIc5efzDZA4edimRL8upoZdtbsG9nn1R5J0GH70OTXUXJu3iZgne1KYmDSGHSi8use1KRPU6wE0OfE5HnQRIFnufOyMqHZ8ZFsXNLydzWxthDg",
  },
];

const BLOG_FALLBACK = [
  { id: "1", title: "The Rise of AI in Luxury Fashion Discovery", desc: "How computer vision is transforming the way we shop for luxury goods — from virtual try-ons to instant bag identification.", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80", source: "BagSearch Editorial", date: "2024-12-01", cat: "Technology" },
  { id: "2", title: "Lagos to London: The African Luxury Wave", desc: "Nigerian designers and platforms are reshaping global luxury. How BagSearch is at the forefront of Africa's fashion renaissance.", img: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&auto=format&fit=crop&q=80", source: "BagSearch Style", date: "2024-11-28", cat: "Lifestyle" },
  { id: "3", title: "The Anatomy of a Perfect Designer Tote", desc: "From Bottega Veneta's weave to Celine's minimalist lines — what makes a luxury tote worth its price tag?", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80", source: "BagSearch Fashion", date: "2024-11-20", cat: "Fashion" },
  { id: "4", title: "Investing in Handbags: The New Asset Class", desc: "Hermès Birkins outperforming gold. How the luxury resale market is creating a new generation of collectors.", img: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&auto=format&fit=crop&q=80", source: "BagSearch Finance", date: "2024-11-15", cat: "Business" },
  { id: "5", title: "Sustainable Luxury: Vegan Leather's Moment", desc: "From Stella McCartney to emerging Nigerian brands — the movement toward cruelty-free luxury is gaining serious momentum.", img: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&auto=format&fit=crop&q=80", source: "BagSearch Eco", date: "2024-11-10", cat: "Sustainability" },
  { id: "6", title: "Visual Search: The Future of Shopping", desc: "You see a bag on Instagram. You want it. Visual AI makes that journey from desire to checkout a matter of seconds.", img: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop&q=80", source: "BagSearch Tech", date: "2024-11-05", cat: "Technology" },
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Scroll reveal */
  .sr { opacity: 0; transform: translateY(28px); transition: opacity 0.75s ease, transform 0.75s ease; }
  .sr.in { opacity: 1; transform: translateY(0); }
  .sr-scale { opacity: 0; transform: scale(0.96); transition: opacity 0.75s ease, transform 0.75s ease; }
  .sr-scale.in { opacity: 1; transform: scale(1); }
  .sr-left { opacity: 0; transform: translateX(-28px); transition: opacity 0.75s ease, transform 0.75s ease; }
  .sr-left.in { opacity: 1; transform: translateX(0); }
  .d1 { transition-delay: 0.08s; }
  .d2 { transition-delay: 0.16s; }
  .d3 { transition-delay: 0.24s; }
  .d4 { transition-delay: 0.32s; }

  /* Hero animations */
  @keyframes heroSlideUp {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroBgIn {
    from { opacity: 0; transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes heroBgOut {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.97); }
  }
  @keyframes heroProgressBar {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes loaderPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
  }
  @keyframes spinRing {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes logoBreathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
  @keyframes marqueeTick {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes countOrbit {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }
  @keyframes blogFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Nav links */
  .nav-lnk { font-size: 13px; font-weight: 500; text-decoration: none; color: #1A0A00; letter-spacing: -0.01em; cursor: pointer; transition: color 0.2s; position: relative; }
  .nav-lnk::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #C94B2C; transition: width 0.25s ease; }
  .nav-lnk:hover { color: #C94B2C; }
  .nav-lnk:hover::after { width: 100%; }

  /* Product card hover */
  .pc { cursor: pointer; }
  .pc:hover .pc-img { transform: scale(1.06); }
  .pc-img { transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1); }

  /* Blog card */
  .blog-card { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
  .blog-card:hover { transform: translateY(-6px); }
  .blog-card:hover .blog-img { transform: scale(1.05); }
  .blog-img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }

  /* Upload zone drag state */
  .upload-zone.drag { border-color: #C94B2C; background: rgba(201,75,44,0.03); }

  /* Footer links */
  .ft-lnk { font-size: 13px; color: rgba(249,221,208,0.55); text-decoration: none; font-weight: 400; transition: color 0.2s; display: block; margin-bottom: 10px; }
  .ft-lnk:hover { color: #F9DDD0; }

  /* Sidebar links */
  .sb-lnk { display: flex; justify-content: space-between; align-items: center; padding: 11px 12px; border-radius: 10px; margin-bottom: 2px; font-weight: 500; font-size: 14px; text-decoration: none; color: #1A0A00; cursor: pointer; transition: background 0.18s; }
  .sb-lnk:hover { background: rgba(201,75,44,0.06); }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    .sr, .sr-scale, .sr-left { opacity: 1 !important; transform: none !important; }
  }

  /* Responsive breakpoints */
  @media (max-width: 900px) {
    .desktop-nav { display: none !important; }
    .mob-menu { display: flex !important; }
    .hero-split { grid-template-columns: 1fr !important; }
    .hero-photowall { display: none !important; }
    .cat-grid { grid-template-columns: 1fr !important; }
    .trend-grid { grid-template-columns: repeat(2,1fr) !important; }
    .arrivals-grid { grid-template-columns: 1fr !important; }
    .arrivals-img { border-radius: 16px 16px 0 0 !important; aspect-ratio: 3/2 !important; }
    .arrivals-panel { border-radius: 0 0 16px 16px !important; }
    .about-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    .ft-grid { grid-template-columns: 1fr 1fr !important; }
    .ft-brand-col { grid-column: span 2 !important; }
    .vs-content { max-width: 100% !important; padding: 36px 24px !important; }
    .vs-img { opacity: 0.18 !important; }
  }
  @media (max-width: 540px) {
    .trend-grid { grid-template-columns: 1fr !important; }
    .ft-grid { grid-template-columns: 1fr !important; }
    .ft-brand-col { grid-column: span 1 !important; }
    .blog-featured-grid { grid-template-columns: 1fr !important; }
    .blog-featured-img { height: 220px !important; }
    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
  }
`;

// ─── LUXURY LOADER ────────────────────────────────────────────────
function LuxuryLoader({ onDone }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 1) return;
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 5 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => setPhase(2), 500);
        setTimeout(() => onDone(), 1200);
      } else {
        setProgress(Math.min(p, 100));
      }
    }, 38);
    return () => clearInterval(iv);
  }, [phase, onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#FAF7F4",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: phase === 2 ? 0 : 1,
        transform: phase === 2 ? "translateY(-3%)" : "none",
        transition: phase === 2 ? "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s" : "none",
        pointerEvents: phase === 2 ? "none" : "all",
      }}
    >
      {/* Ambient orb */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "60vw", height: "60vw", maxWidth: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,75,44,0.12) 0%, transparent 65%)", transform: "translate(-50%,-50%)", animation: "loaderPulse 2.4s ease-in-out infinite" }} />

      {/* Spinner + logo */}
      <div style={{ position: "relative", width: 88, height: 88, marginBottom: 32 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: "absolute", inset: 0, animation: "spinRing 2.6s linear infinite" }}>
          <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(201,75,44,0.1)" strokeWidth="1.5" />
          <circle
            cx="44" cy="44" r="38" fill="none" stroke="#C94B2C" strokeWidth="1.5"
            strokeDasharray={`${2 * Math.PI * 38 * progress / 100} ${2 * Math.PI * 38}`}
            strokeLinecap="round"
            style={{ transformOrigin: "44px 44px", transition: "stroke-dasharray 0.1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: phase === 1 ? "logoBreathe 1.8s ease-in-out infinite" : "none" }}>
          <LogoIcon />
        </div>
      </div>

      {/* Wordmark */}
      <div style={{ fontSize: "clamp(2rem,5vw,2.6rem)", fontWeight: 300, color: "#1A0A00", fontFamily: "'DM Serif Display', serif", letterSpacing: "0.02em", marginBottom: 4, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
        Bag<span style={{ color: "#C94B2C", fontStyle: "italic" }}>Search</span>
      </div>
      <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(26,10,0,0.3)", marginBottom: 36, fontWeight: 500, opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.5s ease 0.5s" }}>
        Luxury Redefined
      </p>

      {/* Progress bar */}
      <div style={{ width: "min(200px,55vw)", height: 1, background: "rgba(26,10,0,0.08)", borderRadius: 1, overflow: "hidden", opacity: phase >= 1 ? 1 : 0 }}>
        <div style={{ height: "100%", background: "#C94B2C", width: `${progress}%`, transition: "width 0.1s ease" }} />
      </div>
    </div>
  );
}

// ─── AUTH GATE MODAL ──────────────────────────────────────────────
function AuthGateModal({ open, onClose, navigate }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (open) {
      setPhase(1);
      const t = setTimeout(() => setPhase(2), 20);
      return () => clearTimeout(t);
    } else {
      setPhase(3);
      const t = setTimeout(() => setPhase(0), 380);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (phase === 0) return null;
  const vis = phase === 2;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,10,0,0.5)", backdropFilter: "blur(10px)", opacity: vis ? 1 : 0, transition: "opacity 0.35s ease" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 400,
        background: "#FFFFFF", borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(201,75,44,0.12)",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
        transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Accent bar */}
        <div style={{ height: 3, background: "#C94B2C" }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(201,75,44,0.15)", background: "#FFF5F2", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; e.currentTarget.style.color = "#C94B2C"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; e.currentTarget.style.color = "#999"; }}
        >✕</button>

        <div style={{ padding: "36px 32px 28px", textAlign: "center" }}>
          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F9DDD0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>🔒</div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 300, color: "#1A0A00", fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>
            Members only
          </h2>
          <p style={{ fontSize: 13, color: "rgba(26,10,0,0.45)", lineHeight: 1.65, marginBottom: 24 }}>
            Sign in to unlock visual search, wishlists, and more.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {["📷 Visual Search", "❤️ Wishlist", "🔔 Alerts"].map(label => (
              <span key={label} style={{ padding: "4px 12px", borderRadius: 9999, background: "#F9DDD0", fontSize: 11, fontWeight: 500, color: "#C94B2C" }}>{label}</span>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => { onClose(); navigate("/register"); }}
              style={{ width: "100%", padding: "13px 0", background: "#C94B2C", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(0.9)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}
            >
              Create free account
            </button>
            <button
              onClick={() => { onClose(); navigate("/login?force=true"); }}
              style={{ width: "100%", padding: "12px 0", background: "#FFF5F2", color: "#C94B2C", fontWeight: 500, fontSize: 13, border: "1px solid rgba(201,75,44,0.2)", borderRadius: 10, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F9DDD0"}
              onMouseLeave={e => e.currentTarget.style.background = "#FFF5F2"}
            >
              Already a member? Sign in
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 32px", borderTop: "1px solid #F5EAE5", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#FDFAFA" }}>
          <LogoIcon />
          <span style={{ fontSize: 12, fontWeight: 300, color: "#1A0A00", fontFamily: "'DM Serif Display', serif" }}>
            Bag<span style={{ color: "#C94B2C", fontStyle: "italic" }}>Search</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────
// Signature element: split hero — editorial upload panel left,
// mosaic lifestyle photo wall right. Typewriter headline with
// a blinking cursor. Slide transitions on the photo wall.
function HeroSection({ navigate, newArrivalsRef, onAuthGate }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const autoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Typewriter state
  const [typed, setTyped] = useState({ title: "", sub: "" });
  const [twPhase, setTwPhase] = useState("title");
  const [cursor, setCursor] = useState(true);

  const slide = HERO_SLIDES[active];

  const goTo = useCallback((idx) => {
    if (animating || idx === active) return;
    setTextVisible(false);
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setTyped({ title: "", sub: "" });
      setTwPhase("title");
      setTextVisible(true);
      setAnimating(false);
    }, 420);
  }, [active, animating]);

  const next = useCallback(() => goTo((active + 1) % HERO_SLIDES.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [active, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 6000);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 6000);
  };

  // Typewriter
  useEffect(() => {
    const title = slide.title;
    const sub = slide.subtitle;
    if (twPhase === "title") {
      if (typed.title.length < title.length) {
        const t = setTimeout(() => setTyped(p => ({ ...p, title: title.slice(0, p.title.length + 1) })), 52);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTwPhase("sub"), 160);
        return () => clearTimeout(t);
      }
    }
    if (twPhase === "sub") {
      if (typed.sub.length < sub.length) {
        const t = setTimeout(() => setTyped(p => ({ ...p, sub: sub.slice(0, p.sub.length + 1) })), 58);
        return () => clearTimeout(t);
      } else {
        setTwPhase("done");
      }
    }
  }, [twPhase, typed, slide]);

  useEffect(() => {
    const iv = setInterval(() => setCursor(c => !c), 520);
    return () => clearInterval(iv);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onAuthGate();
    }
  };

  // Photo wall cells
  const wallCells = [
    { label: "Totes", bg: "#f5f0eb", row: "span 2" },
    { label: "Shoulder", bg: "#eeeaf4" },
    { label: "Clutch", bg: "#e8f0f5" },
    { label: "Mini bag", bg: "#f5ece8" },
    { label: "Crossbody", bg: "#edf5e8" },
  ];

  return (
    <section style={{ position: "relative", overflow: "hidden", background: "#FAF7F4" }}>
      {/* Full-bleed bg image for mobile */}
      <div
        key={`hero-bg-${active}`}
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url('${slide.image}')`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0,
          animation: "heroBgIn 0.55s ease forwards",
          zIndex: 0,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(250,247,244,0.92)", zIndex: 1 }} />

      <div className="hero-split" style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "92vh" }}>

        {/* ── LEFT: Editorial upload panel ── */}
        <div style={{ padding: "80px 48px 60px 48px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "0.5px solid rgba(26,10,0,0.08)" }}>

          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginBottom: 24,
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "none" : "translateY(8px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div style={{ width: 16, height: 1, background: "#C94B2C" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>
              {slide.eyebrow}
            </span>
          </div>

          {/* Typewriter headline */}
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2.6rem,5vw,4.2rem)",
              fontWeight: 400,
              color: "#1A0A00",
              lineHeight: 1.12,
              marginBottom: 18,
              minHeight: "2.4em",
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            <span style={{ display: "block" }}>
              {typed.title}
              {twPhase === "title" && (
                <span style={{ display: "inline-block", width: 2, height: "0.75em", background: "#C94B2C", marginLeft: 3, verticalAlign: "middle", animation: "cursorBlink 0.9s step-end infinite" }} />
              )}
            </span>
            <em style={{ display: "block", color: "#C94B2C", fontStyle: "italic" }}>
              {typed.sub}
              {(twPhase === "sub" || twPhase === "done") && (
                <span style={{ display: "inline-block", width: 2, height: "0.75em", background: "#C94B2C", marginLeft: 3, verticalAlign: "middle", animation: "cursorBlink 0.9s step-end infinite" }} />
              )}
            </em>
          </h1>

          {/* Desc */}
          <p
            style={{
              fontSize: 14, color: "rgba(26,10,0,0.5)", lineHeight: 1.75,
              maxWidth: 360, marginBottom: 36,
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "none" : "translateY(8px)",
              transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
            }}
          >
            {slide.desc}
          </p>

          {/* Upload zone — the hero's main interactive moment */}
          <div
            className={`upload-zone${dragOver ? " drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1px solid ${dragOver ? "#C94B2C" : "rgba(26,10,0,0.12)"}`,
              borderRadius: 14,
              padding: "22px 20px",
              background: dragOver ? "rgba(201,75,44,0.03)" : "rgba(255,255,255,0.7)",
              backdropFilter: "blur(4px)",
              transition: "border-color 0.2s, background 0.2s",
              marginBottom: 28,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={() => onAuthGate()}
            />
            {/* Upload btn */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "12px 16px",
                background: "#1A0A00", color: "white",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#C94B2C"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1A0A00"; }}
            >
              <span>📷</span> Upload a bag photo
            </button>

            {/* Or divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(26,10,0,0.1)" }} />
              <span style={{ fontSize: 11, color: "rgba(26,10,0,0.3)" }}>or paste URL</span>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(26,10,0,0.1)" }} />
            </div>

            {/* URL row */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="https://example.com/bag.jpg"
                style={{
                  flex: 1, border: "0.5px solid rgba(26,10,0,0.12)", borderRadius: 8,
                  padding: "9px 12px", fontSize: 12, color: "#1A0A00",
                  background: "rgba(255,255,255,0.8)", outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => onAuthGate()}
                style={{
                  padding: "9px 16px", background: "#C94B2C", color: "white",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "filter 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.88)"}
                onMouseLeave={e => e.currentTarget.style.filter = "none"}
              >
                Search
              </button>
            </div>

            <p style={{ fontSize: 11, color: "rgba(26,10,0,0.3)", textAlign: "center", marginTop: 10 }}>
              PNG, JPG or WEBP · Up to 10 MB · Free, no account needed
            </p>
          </div>

          {/* Slide controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => { back(); resetAuto(); }}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "0.5px solid rgba(26,10,0,0.15)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#1A0A00", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1A0A00"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A0A00"; }}
              aria-label="Previous slide"
            >←</button>
            <button
              onClick={() => { next(); resetAuto(); }}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#C94B2C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.88)"}
              onMouseLeave={e => e.currentTarget.style.filter = "none"}
              aria-label="Next slide"
            >→</button>

            {/* Dot indicators */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { goTo(i); resetAuto(); }}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: active === i ? 24 : 6, height: 6, borderRadius: 3,
                    background: active === i ? "#C94B2C" : "rgba(26,10,0,0.15)",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              ))}
            </div>

            {/* Counter */}
            <span style={{ fontSize: 11, color: "rgba(26,10,0,0.3)", fontWeight: 500, marginLeft: "auto", letterSpacing: "0.1em" }}>
              {String(active + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: "0.5px", background: "rgba(26,10,0,0.06)", marginTop: 16, borderRadius: 1, overflow: "hidden" }}>
            <div key={`prog-${active}`} style={{ height: "100%", background: "#C94B2C", animation: "heroProgressBar 6s linear forwards" }} />
          </div>
        </div>

        {/* ── RIGHT: Lifestyle photo wall ── */}
        <div
          className="hero-photowall"
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(2,1fr)", gap: 3, background: "rgba(26,10,0,0.06)" }}
        >
          {/* Large hero image — takes 2 rows */}
          <div
            key={`hero-img-${active}`}
            style={{
              gridRow: "span 2",
              position: "relative", overflow: "hidden",
              animation: "heroBgIn 0.55s ease forwards",
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.4) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14 }}>
              <span style={{ fontSize: 10, background: "#C94B2C", color: "white", padding: "3px 9px", borderRadius: 4, fontWeight: 600, letterSpacing: "0.06em" }}>
                {HERO_SLIDES[active].eyebrow.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Remaining 4 bag category cells */}
          {wallCells.slice(1).map((cell, i) => (
            <div
              key={cell.label}
              style={{
                background: cell.bg,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                position: "relative", cursor: "pointer",
                transition: "filter 0.2s",
              }}
              onClick={() => navigate("/products")}
              onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.94)"}
              onMouseLeave={e => e.currentTarget.style.filter = "none"}
            >
              <span style={{ fontSize: 28 }}>
                {["👜", "👝", "💼", "🎒"][i]}
              </span>
              <span style={{ fontSize: 10, color: "rgba(26,10,0,0.45)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {cell.label}
              </span>
              {i === 0 && (
                <span style={{ position: "absolute", bottom: 8, right: 8, fontSize: 9, background: "rgba(26,10,0,0.08)", border: "0.5px solid rgba(26,10,0,0.1)", borderRadius: 20, padding: "2px 8px", color: "rgba(26,10,0,0.4)" }}>
                  Trending
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats ticker */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 0, borderTop: "0.5px solid rgba(26,10,0,0.08)" }}>
        {[
          { num: "500K+", label: "bags indexed" },
          { num: "200+", label: "brands" },
          { num: "98%", label: "match accuracy" },
          { num: "Free", label: "always" },
        ].map((s, i) => (
          <div
            key={s.num}
            style={{
              flex: 1, padding: "18px 24px", textAlign: "center",
              borderRight: i < 3 ? "0.5px solid rgba(26,10,0,0.08)" : "none",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A0A00", fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}>{s.num}</div>
            <div style={{ fontSize: 11, color: "rgba(26,10,0,0.4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── NEW ARRIVALS ─────────────────────────────────────────────────
function NewArrivalsSection({ navigate, sectionRef }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState(1);
  const [liked, setLiked] = useState(new Set());
  const [visible, setVisible] = useState(false);
  const innerRef = useRef(null);
  const autoRef = useRef(null);

  const setRefs = useCallback((node) => {
    innerRef.current = node;
    if (sectionRef) sectionRef.current = node;
  }, [sectionRef]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (innerRef.current) obs.observe(innerRef.current);
    return () => obs.disconnect();
  }, []);

  const goTo = useCallback((idx) => {
    if (animating || idx === active) return;
    setDir(idx > active ? 1 : -1);
    setAnimating(true);
    setActive(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [active, animating]);

  const next = useCallback(() => goTo((active + 1) % NEW_ARRIVALS.length), [active, goTo]);
  const back = useCallback(() => goTo((active - 1 + NEW_ARRIVALS.length) % NEW_ARRIVALS.length), [active, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 4800);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 4800);
  };

  const item = NEW_ARRIVALS[active];

  return (
    <section ref={setRefs} style={{ padding: "88px 0 72px", background: "#FFFFFF", overflow: "hidden" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 16, height: 1, background: "#C94B2C" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>Just landed</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400, color: "#1A0A00", letterSpacing: "-0.02em", lineHeight: 1 }}>
              New Arrivals
            </h2>
          </div>
          <a
            onClick={e => { e.preventDefault(); navigate("/products"); }}
            href="#"
            style={{ fontSize: 11, color: "#C94B2C", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid #C94B2C", paddingBottom: 2, display: "flex", alignItems: "center", gap: 4 }}
          >
            All pieces ↗
          </a>
        </div>

        {/* Main 2-col layout */}
        <div
          className="arrivals-grid"
          style={{
            display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 4,
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)",
            transition: "opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s",
          }}
        >
          {/* Image */}
          <div
            className="arrivals-img"
            style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "14px 0 0 14px", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            <img
              key={`arr-img-${active}`}
              src={item.src}
              alt={item.name}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                animation: `heroBgIn 0.5s ease forwards`,
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, transparent 50%, rgba(26,10,0,0.45))" }} />
            <div style={{ position: "absolute", top: 14, left: 14, background: "#C94B2C", color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 4 }}>{item.tag}</div>
            <button
              onClick={e => {
                e.stopPropagation();
                setLiked(s => { const n = new Set(s); n.has(active) ? n.delete(active) : n.add(active); return n; });
              }}
              style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: "50%", background: liked.has(active) ? "#C94B2C" : "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", fontSize: 14 }}
            >
              {liked.has(active) ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Info panel */}
          <div
            className="arrivals-panel"
            style={{ background: "#FAF7F4", borderRadius: "0 14px 14px 0", padding: "44px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#C94B2C" }} />

            <div>
              {/* Material tags */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                {[item.sub, item.material].map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C94B2C", border: "0.5px solid rgba(201,75,44,0.25)", padding: "3px 9px", borderRadius: 4, background: "rgba(201,75,44,0.04)" }}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Name */}
              <h3
                key={`name-${active}`}
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.4rem,2.2vw,2rem)", fontWeight: 400, color: "#1A0A00", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12, animation: "heroSlideUp 0.5s ease both" }}
              >
                {item.name}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(26,10,0,0.45)", lineHeight: 1.7, marginBottom: 28 }}>
                Premium {item.sub.toLowerCase()}. {item.material} finish. Handcrafted for the discerning collector.
              </p>

              {/* Price */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(26,10,0,0.3)", display: "block", marginBottom: 4 }}>Price</span>
                <span key={`price-${active}`} style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.7rem,3vw,2.4rem)", fontStyle: "italic", color: "#1A0A00", animation: "heroSlideUp 0.5s ease 0.08s both" }}>
                  {item.price}
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => navigate("/register")}
                  style={{ flex: 1, padding: "12px 16px", background: "#1A0A00", color: "white", fontWeight: 500, fontSize: 12, letterSpacing: "0.05em", border: "none", borderRadius: 50, cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#C94B2C"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}
                >
                  Add to bag
                </button>
                <button
                  onClick={() => navigate("/register")}
                  style={{ padding: "12px 18px", background: "white", color: "#1A0A00", fontWeight: 500, fontSize: 12, letterSpacing: "0.05em", border: "0.5px solid rgba(26,10,0,0.2)", borderRadius: 50, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1A0A00"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,10,0,0.2)"; }}
                >
                  View
                </button>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {NEW_ARRIVALS.map((_, i) => (
                  <button key={i} onClick={() => { goTo(i); resetAuto(); }} style={{ width: active === i ? 22 : 6, height: 6, borderRadius: 3, background: active === i ? "#C94B2C" : "rgba(201,75,44,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { back(); resetAuto(); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "white", border: "0.5px solid rgba(26,10,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#1A0A00"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "inherit"; }}>←</button>
                <button onClick={() => { next(); resetAuto(); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#C94B2C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "white", transition: "filter 0.2s" }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.88)"} onMouseLeave={e => e.currentTarget.style.filter = "none"}>→</button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
          {NEW_ARRIVALS.map((a, i) => (
            <div
              key={i}
              onClick={() => { goTo(i); resetAuto(); }}
              style={{ flexShrink: 0, width: active === i ? 96 : 56, height: 56, borderRadius: 8, overflow: "hidden", cursor: "pointer", transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)", outline: active === i ? "2px solid #C94B2C" : "2px solid transparent", outlineOffset: 2 }}
            >
              <img src={a.src} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active === i ? "brightness(1)" : "brightness(0.55) saturate(0.25)", transition: "filter 0.35s" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SHOP BY CATEGORY ─────────────────────────────────────────────
function CategorySection({ navigate }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ padding: "88px 32px", background: "#FAF7F4" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 16, height: 1, background: "#C94B2C" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>Browse</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 400, color: "#1A0A00" }}>
              Shop by category
            </h2>
          </div>
          <div style={{ width: 32, height: 1, background: "rgba(26,10,0,0.12)" }} />
        </div>

        <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              className="pc sr-scale"
              style={{
                position: "relative", height: 340, borderRadius: 14, overflow: "hidden",
                opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.96)",
                transition: `opacity 0.7s ease ${i * 0.1 + 0.1}s, transform 0.7s ease ${i * 0.1 + 0.1}s`,
              }}
              onClick={() => navigate("/products")}
            >
              <img src={cat.src} alt={cat.name} className="pc-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.72) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 22, left: 22 }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: "white", marginBottom: 6 }}>{cat.name}</h3>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, borderBottom: "1px solid #C94B2C", paddingBottom: 2 }}>
                  {cat.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── VISUAL SEARCH CTA ────────────────────────────────────────────
function VisualSearchCTA({ navigate, onAuthGate }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ padding: "0 32px 88px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          background: "#1A0A00", borderRadius: 16, overflow: "hidden",
          position: "relative", minHeight: 320, display: "flex", alignItems: "center",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "scale(0.97)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Right image */}
        <div
          className="vs-img"
          style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "100%" }}
        >
          <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80" alt="Visual Search" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #1A0A00 0%, rgba(26,10,0,0.6) 50%, transparent 80%)" }} />
        </div>

        <div
          className="vs-content"
          style={{ padding: "56px 56px", position: "relative", zIndex: 2, maxWidth: "56%" }}
        >
          <span style={{ fontSize: 9, background: "rgba(201,75,44,0.2)", border: "0.5px solid rgba(201,75,44,0.35)", color: "#C94B2C", borderRadius: 4, padding: "4px 10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-block", marginBottom: 20 }}>AI Powered</span>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 400, color: "white", lineHeight: 1.2, marginBottom: 16 }}>
            Find it.<br /><em style={{ color: "#C94B2C", fontStyle: "italic" }}>Instantly.</em>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 32, maxWidth: 320 }}>
            Upload any photo. Our AI matches it to thousands of luxury pieces in seconds.
          </p>
          <button
            onClick={() => onAuthGate()}
            style={{ padding: "13px 26px", background: "white", color: "#1A0A00", fontWeight: 600, borderRadius: 50, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#C94B2C"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#1A0A00"; }}
          >
            <span>📷</span> Launch AI search
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── TRENDING ─────────────────────────────────────────────────────
function TrendingSection({ navigate }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ padding: "0 32px 88px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 16, height: 1, background: "#C94B2C" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>Right now</span>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 400, color: "#1A0A00" }}>Trending now</h2>
        </div>
        <div style={{ width: 32, height: 1, background: "rgba(26,10,0,0.12)" }} />
      </div>

      <div className="trend-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
        {TRENDING.map((item, i) => (
          <div
            key={item.name}
            className="pc"
            style={{
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: `opacity 0.7s ease ${i * 0.1}s, transform 0.7s ease ${i * 0.1}s`,
            }}
            onClick={() => navigate("/register")}
          >
            <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", marginBottom: 14, background: "#FAF7F4", border: "0.5px solid rgba(26,10,0,0.06)" }}>
              <img src={item.src} alt={item.name} className="pc-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 10px 10px", background: "linear-gradient(to top, rgba(26,10,0,0.5) 0%, transparent)" }}>
                <span style={{ fontSize: 9, background: "white", color: "#1A0A00", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{item.label}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: "#C94B2C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{item.brand}</div>
                <h4 style={{ fontSize: 13, fontWeight: 500, color: "#1A0A00", lineHeight: 1.35 }}>{item.name}</h4>
              </div>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 16, color: "#1A0A00", whiteSpace: "nowrap" }}>{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ABOUT SECTION ────────────────────────────────────────────────
function AboutSection() {
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState({ bags: 0, members: 0, countries: 0, years: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        const targets = { bags: 12000, members: 48000, countries: 34, years: 6 };
        Object.keys(targets).forEach(key => {
          const start = Date.now();
          const dur = key === "years" ? 1200 : key === "countries" ? 1400 : 2000;
          const tick = () => {
            const p = Math.min((Date.now() - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCounts(c => ({ ...c, [key]: Math.round(targets[key] * eased) }));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ background: "#1A0A00", padding: "96px 0", overflow: "hidden", position: "relative" }}>
      {/* Subtle grid bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,75,44,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,75,44,0.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "rgba(201,75,44,0.1)", border: "0.5px solid rgba(201,75,44,0.2)", borderRadius: 4, marginBottom: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C94B2C" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>Est. 2018 · Lagos, Nigeria</span>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(3rem,7vw,5.5rem)", fontWeight: 400, color: "white", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 16 }}>
            We are<br /><em style={{ color: "#C94B2C" }}>BagSearch</em>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(249,221,208,0.55)", maxWidth: 440, margin: "0 auto", lineHeight: 1.75 }}>
            Africa's first AI-powered luxury bag discovery platform. Where culture meets couture.
          </p>
        </div>

        {/* Two-col content */}
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" }}>
          <div>
            <p style={{ fontSize: 15, color: "rgba(249,221,208,0.8)", lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
              Born in Lagos, BagSearch set out to solve a problem every fashion-forward Nigerian knew too well: finding the perfect luxury bag was an exercise in frustration. We built an AI-first discovery platform that understands your style before you do.
            </p>
            <p style={{ fontSize: 15, color: "rgba(249,221,208,0.5)", lineHeight: 1.85, fontWeight: 300 }}>
              Authenticity over everything. Every piece on BagSearch is verified, every seller vetted, and every transaction protected. We're not just a marketplace — we're the guardian of your luxury journey.
            </p>
          </div>
          <div>
            {/* Terminal card */}
            <div style={{ background: "rgba(201,75,44,0.04)", border: "0.5px solid rgba(201,75,44,0.12)", borderRadius: 12, padding: "20px 22px", fontFamily: "monospace" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />)}
                <span style={{ fontSize: 10, color: "rgba(249,221,208,0.15)", marginLeft: 6 }}>bagsearch / about</span>
              </div>
              {[
                { k: "founded", v: '"Lagos, Nigeria — 2018"' },
                { k: "tech", v: '"Vision AI + React"' },
                { k: "verified_sellers", v: "true" },
                { k: "ai_search", v: '"enabled"' },
                { k: "delivery", v: '"Nigeria-wide"' },
              ].map(({ k, v }, i) => (
                <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#C94B2C", fontSize: 11 }}>{k}:</span>
                  <span style={{ color: "rgba(249,221,208,0.65)", fontSize: 11 }}>{v},</span>
                </div>
              ))}
              <span style={{ display: "inline-block", width: 2, height: 11, background: "#C94B2C", marginLeft: 2, verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite" }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s" }}>
          {[
            { val: counts.bags.toLocaleString() + "+", label: "Luxury bags" },
            { val: counts.members.toLocaleString() + "+", label: "Members" },
            { val: counts.countries, label: "Countries" },
            { val: counts.years + "+", label: "Years" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{ padding: "22px 16px", background: "rgba(201,75,44,0.04)", border: "0.5px solid rgba(201,75,44,0.1)", borderRadius: 12, textAlign: "center", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(201,75,44,0.2)" }} />
              <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(1.6rem,2.5vw,2.2rem)", color: "#F9DDD0", lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(249,221,208,0.4)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Marquee */}
        <div style={{ overflow: "hidden", padding: "28px 0 0", borderTop: "0.5px solid rgba(201,75,44,0.08)", marginTop: 48 }}>
          <div style={{ display: "flex", animation: "marqueeTick 22s linear infinite", width: "max-content" }}>
            {["Luxury Redefined", "AI-Powered", "Lagos Born", "Global Luxury", "Verified Authentic", "Fashion Forward", "Luxury Redefined", "AI-Powered", "Lagos Born", "Global Luxury", "Verified Authentic", "Fashion Forward"].map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16, fontSize: 11, fontWeight: 400, color: i % 2 === 0 ? "rgba(249,221,208,0.12)" : "rgba(201,75,44,0.35)", letterSpacing: "0.18em", textTransform: "uppercase", marginRight: 28, whiteSpace: "nowrap" }}>
                {t} <span style={{ width: 3, height: 3, background: "#C94B2C", borderRadius: "50%", opacity: 0.4 }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── BLOG SECTION ─────────────────────────────────────────────────
function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const categories = ["All", "Fashion", "Luxury", "Style", "Tech"];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const q = filter === "All" ? "luxury fashion bags" : filter === "Fashion" ? "fashion bags style" : filter === "Luxury" ? "luxury designer handbags" : filter === "Style" ? "fashion style trends" : "AI fashion technology";
        const res = await fetch(`https://newsdata.io/api/1/news?apikey=253cbe2827b44031a3e551bb6c1c4ea3&q=${encodeURIComponent(q)}&language=en&category=entertainment,lifestyle&image=1`);
        const data = await res.json();
        if (data.status === "success" && data.results) {
          const valid = data.results.filter(a => a.image_url && a.title && a.description).slice(0, 6);
          setPosts(valid.length >= 3 ? valid : BLOG_FALLBACK);
        } else throw new Error("no results");
      } catch {
        setPosts(BLOG_FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [filter]);

  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return ""; } };
  const readTime = (desc) => Math.max(2, Math.ceil((desc?.split(" ")?.length || 80) / 200)) + " min read";

  return (
    <section ref={ref} style={{ background: "#FFFFFF", padding: "96px 32px 80px", overflow: "hidden", position: "relative" }}>
      {/* Ambient orb */}
      <div style={{ position: "absolute", top: -80, right: -60, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,221,208,0.6) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 40, flexWrap: "wrap",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 16, height: 1, background: "#C94B2C" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600 }}>Editorial</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 400, color: "#1A0A00", lineHeight: 0.95 }}>
              The BagSearch<br /><em style={{ fontStyle: "italic", color: "rgba(26,10,0,0.4)" }}>Journal</em>
            </h2>
          </div>
          <a href="#" style={{ fontSize: 11, color: "#C94B2C", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid #C94B2C", paddingBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
            All stories ↗
          </a>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap", opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: "7px 16px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                border: "0.5px solid",
                background: filter === cat ? "#1A0A00" : "transparent",
                color: filter === cat ? "white" : "rgba(26,10,0,0.4)",
                borderColor: filter === cat ? "#1A0A00" : "rgba(26,10,0,0.12)",
                transition: "all 0.2s",
              }}
            >
              {cat}
            </button>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px" }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#C94B2C", display: "block", animation: `countOrbit 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid rgba(26,10,0,0.06)" }}>
                <div style={{ height: 180, background: "linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite" }} />
                <div style={{ padding: 16 }}>
                  {[80, 100, 60].map((w, j) => (
                    <div key={j} style={{ height: j === 0 ? 8 : 11, width: `${w}%`, background: "linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite", borderRadius: 3, marginBottom: 10 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            {/* Featured post */}
            <div
              className="blog-featured-grid"
              style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", borderRadius: 14, overflow: "hidden", marginBottom: 18, border: "0.5px solid rgba(26,10,0,0.07)", animation: visible ? "blogFadeUp 0.7s ease both" : "none", cursor: "pointer" }}
            >
              <div className="blog-featured-img" style={{ position: "relative", height: 360, overflow: "hidden" }}>
                <img src={posts[0].image_url || posts[0].img || BLOG_FALLBACK[0].img} alt={posts[0].title} className="blog-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.src = BLOG_FALLBACK[0].img; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 50%, rgba(26,10,0,0.2))" }} />
                <span style={{ position: "absolute", top: 16, left: 16, background: "#C94B2C", color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 4 }}>
                  {posts[0].category?.[0] || posts[0].cat || "Featured"}
                </span>
              </div>
              <div style={{ background: "#1A0A00", padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#C94B2C", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, display: "block" }}>Editor's pick</span>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.1rem,1.6vw,1.4rem)", fontWeight: 400, color: "#F9DDD0", lineHeight: 1.35, marginBottom: 14 }}>
                  {(posts[0].title || "").slice(0, 80)}{(posts[0].title || "").length > 80 ? "…" : ""}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(249,221,208,0.4)", lineHeight: 1.75, marginBottom: 22, fontWeight: 300 }}>
                  {((posts[0].description || posts[0].desc) || "").slice(0, 130)}…
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(249,221,208,0.22)" }}>{posts[0].source_id || posts[0].source} · {readTime(posts[0].description || posts[0].desc)}</span>
                  <span style={{ color: "#C94B2C", fontSize: 12, fontWeight: 600 }}>Read ↗</span>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {posts.slice(1).map((post, i) => (
                <article
                  key={post.article_id || post.id || i}
                  className="blog-card"
                  style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid rgba(26,10,0,0.07)", background: "#FFFFFF", animation: visible ? `blogFadeUp 0.6s ease ${0.1 + i * 0.08}s both` : "none" }}
                >
                  <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                    <img src={post.image_url || post.img || BLOG_FALLBACK[i + 1]?.img} alt={post.title} className="blog-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.src = BLOG_FALLBACK[Math.min(i + 1, BLOG_FALLBACK.length - 1)].img; }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,10,0,0.4) 0%, transparent 55%)" }} />
                    <span style={{ position: "absolute", bottom: 9, left: 9, background: "rgba(26,10,0,0.6)", backdropFilter: "blur(4px)", color: "rgba(249,221,208,0.9)", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 3 }}>
                      {post.category?.[0] || post.cat || "Editorial"}
                    </span>
                  </div>
                  <div style={{ padding: 18 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, color: "#1A0A00", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
                    <p style={{ fontSize: 12, color: "rgba(26,10,0,0.4)", lineHeight: 1.65, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.description || post.desc}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "0.5px solid rgba(26,10,0,0.06)" }}>
                      <span style={{ fontSize: 11, color: "rgba(26,10,0,0.3)" }}>{fmtDate(post.pubDate || post.date)} · {readTime(post.description || post.desc)}</span>
                      <span style={{ fontSize: 12, color: "#C94B2C" }}>↗</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Newsletter */}
        <div style={{ marginTop: 60, padding: "40px 44px", background: "#FAF7F4", borderRadius: 14, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, border: "0.5px solid rgba(26,10,0,0.06)" }}>
          <div>
            <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C94B2C", fontWeight: 600, display: "block", marginBottom: 8 }}>Newsletter</span>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.2rem,2vw,1.5rem)", fontWeight: 400, color: "#1A0A00", marginBottom: 4 }}>Style drops, delivered weekly.</h3>
            <p style={{ fontSize: 13, color: "rgba(26,10,0,0.4)", maxWidth: 300 }}>Curated luxury news, new arrivals, and AI insights.</p>
          </div>
          <div style={{ display: "flex", gap: 0, width: "min(380px,100%)" }}>
            <input placeholder="your@email.com" style={{ flex: 1, padding: "12px 16px", border: "0.5px solid rgba(26,10,0,0.15)", borderRight: "none", borderRadius: "4px 0 0 4px", fontSize: 13, color: "#1A0A00", background: "white", outline: "none", fontFamily: "inherit" }} />
            <button style={{ padding: "12px 20px", background: "#1A0A00", color: "white", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", border: "none", borderRadius: "0 4px 4px 0", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }} onMouseEnter={e => e.currentTarget.style.background = "#C94B2C"} onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}>Subscribe</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default function Home() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const navigate = useNavigate();
  const newArrivalsRef = useRef(null);
  const handleLoadDone = useCallback(() => setLoading(false), []);

  useSEO({
    title: "BagSearch | Buy & Sell Luxury Designer Bags in Nigeria",
    description: "Buy and sell authentic luxury designer bags in Nigeria. Discover Chanel, Hermès, Louis Vuitton, Gucci, and more from verified sellers on BagSearch.",
    keywords: "luxury bags Nigeria, designer handbags, authentic bags, buy luxury bags online",
    url: "/",
    type: "website",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BagSearch",
      url: SITE_URL,
      description: "Nigeria's premier marketplace for authentic luxury designer bags.",
    },
  });

  // Intersection observer for scroll reveals
  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".sr,.sr-scale,.sr-left").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  const handleNavClick = (link) => {
    if (link === "New Arrivals") newArrivalsRef.current?.scrollIntoView({ behavior: "smooth" });
    else if (link === "Collections") navigate("/products");
    else if (link === "Hot Deals") navigate("/hot-deals");
    else if (link === "About Us") navigate("/about");
    else setAuthGateOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F4", fontFamily: "'Inter', sans-serif", color: "#1A0A00" }}>
      <style>{GLOBAL_CSS}</style>

      <LuxuryLoader onDone={handleLoadDone} />

      <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.6s ease", pointerEvents: loading ? "none" : "all" }}>

        {/* ── HEADER ── */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,247,244,0.92)", backdropFilter: "blur(12px)", borderBottom: "0.5px solid rgba(26,10,0,0.08)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
              <LogoIcon size={30} />
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: "#1A0A00", letterSpacing: "0.01em" }}>
                Bag<em style={{ color: "#C94B2C", fontStyle: "italic" }}>Search</em>
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="desktop-nav" style={{ display: "flex", gap: 32 }}>
              {NAV_LINKS.map(link => (
                <a
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className="nav-lnk"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  {link}
                  {link === "Visual Search" && (
                    <span style={{ fontSize: 8, background: "#C94B2C", color: "white", padding: "2px 6px", borderRadius: 2, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI</span>
                  )}
                </a>
              ))}
            </nav>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => navigate("/products")}
                style={{ padding: "7px 9px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "#1A0A00", fontSize: 18, lineHeight: 1, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#C94B2C"}
                onMouseLeave={e => e.currentTarget.style.color = "#1A0A00"}
                aria-label="Search"
              >
                🔍
              </button>
              {user ? (
                <button onClick={() => navigate("/products")} style={{ padding: "8px 18px", background: "#1A0A00", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#C94B2C"} onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}>
                  My account
                </button>
              ) : (
                <button onClick={() => navigate("/login?force=true")} style={{ padding: "8px 18px", background: "#1A0A00", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#C94B2C"} onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}>
                  Sign in
                </button>
              )}
              {/* Mobile menu */}
              <button className="mob-menu" onClick={() => setSidebarOpen(true)} style={{ display: "none", padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", alignItems: "center", color: "#1A0A00", fontSize: 20 }} aria-label="Open menu">
                ☰
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main>
          <HeroSection navigate={navigate} newArrivalsRef={newArrivalsRef} onAuthGate={() => setAuthGateOpen(true)} />
          <NewArrivalsSection navigate={navigate} sectionRef={newArrivalsRef} />
          <CategorySection navigate={navigate} />
          <VisualSearchCTA navigate={navigate} onAuthGate={() => setAuthGateOpen(true)} />
          <TrendingSection navigate={navigate} />
          <AboutSection />
          <BlogSection />
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ background: "#1A0A00", padding: "72px 32px 36px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="ft-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
              <div className="ft-brand-col">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }} onClick={() => navigate("/")}>
                  <LogoIcon />
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "white" }}>
                    Bag<em style={{ color: "#C94B2C", fontStyle: "italic" }}>Search</em>
                  </span>
                </div>
                <p style={{ color: "rgba(249,221,208,0.45)", lineHeight: 1.8, maxWidth: 250, marginBottom: 24, fontSize: 13, fontWeight: 300 }}>
                  Luxury craftsmanship. Intelligent discovery. Africa's first AI-powered luxury bag marketplace.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {["🛍️", "👤"].map((ic, i) => (
                    <button key={i} onClick={() => setAuthGateOpen(true)} style={{ width: 36, height: 36, borderRadius: "50%", border: "0.5px solid rgba(201,75,44,0.2)", background: "rgba(201,75,44,0.06)", color: "#F9DDD0", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(201,75,44,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(201,75,44,0.06)"}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { title: "Shop", links: ["New Arrivals", "Best Sellers", "Tote Bags", "Crossbody", "Visual Search"] },
                { title: "Company", links: ["About Us", "Blog", "Careers", "Press", "Partnerships"] },
                { title: "Support", links: ["Shipping", "Returns", "Contact Us", "Size Guide", "Privacy Policy"] },
              ].map(col => (
                <div key={col.title}>
                  <h5 style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20, color: "#C94B2C" }}>{col.title}</h5>
                  <ul style={{ listStyle: "none" }}>
                    {col.links.map(link => (
                      <li key={link}><a href="#" className="ft-lnk">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 24, borderTop: "0.5px solid rgba(201,75,44,0.1)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <p style={{ fontSize: 12, color: "rgba(249,221,208,0.3)", fontWeight: 300 }}>© 2024 BagSearch International. All rights reserved.</p>
              <div style={{ display: "flex", gap: 20 }}>
                {["Terms", "Privacy", "Cookies"].map(l => (
                  <a key={l} href="#" style={{ fontSize: 11, color: "rgba(249,221,208,0.25)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(249,221,208,0.6)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(249,221,208,0.25)"}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        {/* ── SIDEBAR OVERLAY ── */}
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,10,0,0.4)", zIndex: 60, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "all" : "none", transition: "opacity 0.3s ease", backdropFilter: sidebarOpen ? "blur(4px)" : "none" }} />

        {/* ── SIDEBAR ── */}
        <aside style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 280, background: "white", zIndex: 70, display: "flex", flexDirection: "column", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", borderRight: "0.5px solid rgba(26,10,0,0.06)" }}>
          <div style={{ height: 2, background: "#C94B2C" }} />
          <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5px solid rgba(26,10,0,0.06)", marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#1A0A00" }}>Bag<em style={{ color: "#C94B2C" }}>Search</em></span>
            <button onClick={() => setSidebarOpen(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "0.5px solid rgba(26,10,0,0.12)", background: "#FAF7F4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✕</button>
          </div>
          <div style={{ padding: "0 12px", flex: 1 }}>
            {NAV_LINKS.map(link => (
              <a
                key={link}
                className="sb-lnk"
                onClick={() => {
                  setSidebarOpen(false);
                  setTimeout(() => handleNavClick(link), 150);
                }}
              >
                <span style={{ color: link === "Visual Search" ? "#C94B2C" : "inherit" }}>{link}</span>
                {link === "Visual Search" ? (
                  <span style={{ fontSize: 8, background: "#C94B2C", color: "white", padding: "2px 6px", borderRadius: 2, fontWeight: 700 }}>AI</span>
                ) : (
                  <span style={{ fontSize: 12, color: "rgba(26,10,0,0.3)" }}>›</span>
                )}
              </a>
            ))}
          </div>
          <div style={{ padding: "16px 20px 24px", borderTop: "0.5px solid rgba(26,10,0,0.06)" }}>
            <button onClick={() => { setSidebarOpen(false); navigate("/login?force=true"); }} style={{ width: "100%", padding: "12px 0", background: "#1A0A00", color: "white", fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, marginBottom: 10, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#C94B2C"} onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}>
              Sign in
            </button>
            <button onClick={() => { setSidebarOpen(false); navigate("/register"); }} style={{ width: "100%", padding: "11px 0", background: "transparent", color: "#1A0A00", fontWeight: 500, borderRadius: 8, border: "0.5px solid rgba(26,10,0,0.15)", cursor: "pointer", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#1A0A00"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A0A00"; }}>
              Create account
            </button>
          </div>
        </aside>

        <AuthGateModal open={authGateOpen} onClose={() => setAuthGateOpen(false)} navigate={navigate} />
      </div>
    </div>
  );
}