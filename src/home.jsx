import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["New Arrivals", "Collections", "Visual Search"];

const NEW_ARRIVALS = [
  { name: "The Midnight Satchel", sub: "Italian Leather • Midnight Blue", price: "$2,450", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8" },
  { name: "Ivory Essential Tote", sub: "Sustainable Vegan Leather • Ivory", price: "$1,800", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo" },
  { name: "Azure Mini Crossbody", sub: "Napa Leather • Azure Blue", price: "$1,250", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk" },
  { name: "Onyx Evening Clutch", sub: "Polished Suede • Onyx Black", price: "$3,100", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E" },
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
  <svg width="28" height="28" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Icon = ({ name, size = 22 }) => (
  <span style={{
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: "normal",
    fontStyle: "normal",
    fontSize: size,
    lineHeight: 1,
    display: "inline-block",
    textTransform: "none",
    letterSpacing: "normal",
    wordWrap: "normal",
    whiteSpace: "nowrap",
    direction: "ltr",
  }}>{name}</span>
);

export default function LuxeBag() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f8", fontFamily: "'Manrope', sans-serif", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Manrope', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .card-img { transition: transform 0.5s ease; }
        .product-card:hover .card-img { transform: scale(1.08); }
        .nav-link:hover { color: #135bec; }
        .icon-btn:hover { background: #f1f5f9 !important; }
        .sidebar-link:hover { background: #f8fafc; }
        .logout-btn:hover { background: #fef2f2 !important; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .desktop-icons { display: none !important; }
          .hero-title { font-size: 2.5rem !important; }
          .cta-panel { max-width: 100% !important; }
          .visual-right-img { display: none !important; }
          .category-grid { grid-template-columns: 1fr !important; }
          .trending-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-brand { grid-column: span 2 !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#135bec" }}>
            <LogoIcon />
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>LuxeBag</span>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: "flex", gap: 40 }}>
            {NAV_LINKS.map(link => (
              <a key={link} href="#" className="nav-link" style={{ fontSize: 14, fontWeight: 600, textDecoration: "none", color: "#0f172a", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}>
                {link}
                {link === "Visual Search" && (
                  <span style={{ fontSize: 10, background: "rgba(19,91,236,0.1)", color: "#135bec", padding: "2px 7px", borderRadius: 9999, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI</span>
                )}
              </a>
            ))}
          </nav>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {["search", "shopping_bag", "person"].map(ic => (
              <button 
                key={ic} 
                className="icon-btn desktop-icons" 
                style={{ padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
                onClick={() => ic === "person" && navigate("/profile")}
              >
                <Icon name={ic} />
              </button>
            ))}
            {/* Mobile hamburger */}
            <button className="mobile-menu-btn icon-btn" onClick={() => setSidebarOpen(true)}
              style={{ display: "none", padding: 8, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", alignItems: "center" }}>
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section style={{ position: "relative", height: "85vh", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4I73hqMmV64iEPGtSEJ3mNAbQtvPBqQQ22x1JA6F2E-E4U0-SmUat1vO0Z0c7l1142DjBBzcn-afis9xsHhMBa7rnrhdTWhV7aq8FUXyZDIlxADoYFJcdrsprs-bYJQOcAqih5olePRiw0nJPBPNpLCL32-aAsv9zAtqbGV6bFBMK5ypVAi4i0E2wq4chZKL5jOOJyPh6HoEXvJKPkNeXbHs-Kqqip9Cgq3VAIn0gqtoVtmGQwzvnFhaifm9ecmgYdWkGPqlRExE')`,
            backgroundSize: "cover", backgroundPosition: "center"
          }} />
          <div style={{ position: "relative", height: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 18px", marginBottom: 28, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.25)", color: "white", width: "fit-content" }}>
              Premium Craftsmanship
            </span>
            <h1 className="hero-title" style={{ fontSize: "clamp(2.5rem,7vw,4.5rem)", fontWeight: 300, color: "white", lineHeight: 1.1, maxWidth: 580, marginBottom: 24 }}>
              Discover <br /><em style={{ fontWeight: 800, fontStyle: "italic" }}>Timeless Elegance</em>
            </h1>
            <p style={{ fontSize: "clamp(1rem,1.8vw,1.15rem)", color: "#cbd5e1", maxWidth: 440, fontWeight: 300, lineHeight: 1.7, marginBottom: 40 }}>
              Experience the pinnacle of luxury with our curated collection of bags, powered by intuitive visual discovery.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button style={{ padding: "15px 28px", background: "#135bec", color: "white", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15, boxShadow: "0 8px 24px rgba(19,91,236,0.3)" }}>
                <Icon name="camera" size={20} /> Try Visual Search
              </button>
              <button style={{ padding: "15px 28px", color: "white", fontWeight: 700, borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", cursor: "pointer", fontSize: 15 }}>
                Browse Collections
              </button>
            </div>
          </div>
        </section>

        {/* ── NEW ARRIVALS ── */}
        <section style={{ padding: "96px 24px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>New Arrivals</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>The latest additions to our exclusive inventory</p>
            </div>
            <a href="#" style={{ color: "#135bec", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              View All <Icon name="arrow_forward" size={18} />
            </a>
          </div>
          <div className="hide-scrollbar" style={{ display: "flex", overflowX: "auto", gap: 28, paddingBottom: 16 }}>
            {NEW_ARRIVALS.map(item => (
              <div key={item.name} className="product-card" style={{ minWidth: 290, flexShrink: 0 }}>
                <div style={{ position: "relative", aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", marginBottom: 16, background: "#e8edf2" }}>
                  <img src={item.src} alt={item.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button style={{ position: "absolute", top: 12, right: 12, padding: 8, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)", borderRadius: "50%", border: "none", cursor: "pointer" }}>
                    <Icon name="favorite" size={18} />
                  </button>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</h3>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>{item.sub}</p>
                <p style={{ color: "#135bec", fontWeight: 800 }}>{item.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHOP BY CATEGORY ── */}
        <section style={{ padding: "64px 24px", background: "white" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>Shop by Category</h2>
            <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.name} className="product-card" style={{ position: "relative", height: 380, borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
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

        {/* ── VISUAL SEARCH CTA ── */}
        <section style={{ padding: "96px 24px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "#135bec", borderRadius: 24, overflow: "hidden", position: "relative", minHeight: 380, display: "flex", alignItems: "center" }}>
            <div className="visual-right-img" style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%" }}>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBcBAmjswE_vEeq68lo-sOT66oVW0_Oi7ktR0DeVP4vgLqczwkpO1kHAfO7WOis90MJH7IoVX0lXjvBHrULEpy3nwbh6xz282Jdpr8fDkpaWMzAiNTDtJSIarZ0mbGtRRcnzaAuj99FhQjmRvBeBQtAbZ0JGsUkQixkW9WOWKR10AS__W9AaredcnjAVQo7cx_inSY0OlT2RVuyyOA9kOq5DiQ6UTuT4r9gnHKQrsaVy3N1MWZZpFf0QwqmHQ1WSimjadchp7Q7Rc"
                alt="Visual Search" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }} />
            </div>
            <div className="cta-panel" style={{ padding: "52px 48px", position: "relative", zIndex: 1, color: "white", maxWidth: "55%" }}>
              <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>Find exactly what you're looking for.</h2>
              <p style={{ fontSize: 16, color: "rgba(219,234,254,1)", marginBottom: 32, lineHeight: 1.7 }}>
                Our AI-powered visual search allows you to upload any image and find the closest matches in our luxury catalog instantly.
              </p>
              <button style={{ padding: "15px 28px", background: "white", color: "#135bec", fontWeight: 800, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <Icon name="add_a_photo" size={20} /> Launch AI Search
              </button>
            </div>
          </div>
        </section>

        {/* ── TRENDING ── */}
        <section style={{ padding: "0 24px 96px", maxWidth: 1280, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 40 }}>Trending Now</h2>
          <div className="trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
            {TRENDING.map(item => (
              <div key={item.name} className="product-card" style={{ cursor: "pointer" }}>
                <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", marginBottom: 14, background: "#e8edf2" }}>
                  <img src={item.src} alt={item.name} className="card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.name}</h4>
                    <p style={{ fontSize: 11, color: "#64748b" }}>{item.label}</p>
                  </div>
                  <span style={{ color: "#135bec", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: "white", borderTop: "1px solid #e2e8f0", padding: "72px 24px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, color: "#135bec" }}>
                <LogoIcon />
                <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>LuxeBag</span>
              </div>
              <p style={{ color: "#64748b", lineHeight: 1.7, maxWidth: 280, marginBottom: 28, fontSize: 14 }}>
                Redefining luxury craftsmanship for the modern era. Quality materials meet intelligent discovery.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {["public", "share", "mail"].map(ic => (
                  <a key={ic} href="#" style={{ padding: 8, background: "#f1f5f9", borderRadius: "50%", display: "flex", color: "#0f172a", textDecoration: "none" }}>
                    <Icon name={ic} size={18} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Shop", links: ["New Arrivals", "Best Sellers", "Tote Bags", "Crossbody"] },
              { title: "Help", links: ["Shipping", "Returns", "Contact Us", "Size Guide"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h5 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 22 }}>{col.title}</h5>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {col.links.map(link => (
                    <li key={link}><a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 28, borderTop: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>© 2024 LuxeBag International. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <div onClick={() => setSidebarOpen(false)} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 60,
        opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "all" : "none",
        transition: "opacity 0.3s ease",
      }} />

      {/* ── MOBILE SIDEBAR PANEL ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, height: "100%", width: 300,
        background: "white", zIndex: 70, display: "flex", flexDirection: "column",
        boxShadow: "8px 0 40px rgba(0,0,0,0.14)",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
      }}>
        {/* Sidebar top */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#135bec" }}>
            <LogoIcon />
            <span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>LuxeBag</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ padding: 8, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: "0 16px", flex: 1 }}>
          {/* Nav links */}
          {NAV_LINKS.map(link => (
            <a key={link} href="#" className="sidebar-link" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 12px", borderRadius: 10, marginBottom: 4,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
              color: link === "Visual Search" ? "#135bec" : "#0f172a",
              background: link === "Visual Search" ? "rgba(19,91,236,0.06)" : "transparent",
              transition: "background 0.15s",
            }}>
              {link}
              <Icon name={link === "Visual Search" ? "camera_enhance" : "chevron_right"} size={18} />
            </a>
          ))}

          <div style={{ height: 1, background: "#e2e8f0", margin: "18px 0" }} />

          {/* Cart & Wishlist */}
          {[{ icon: "shopping_bag", label: "Cart (0)" }, { icon: "favorite", label: "Wishlist" }].map(({ icon, label }) => (
            <a key={label} href="#" className="sidebar-link" style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
              borderRadius: 10, marginBottom: 4, fontWeight: 600, fontSize: 15,
              textDecoration: "none", color: "#0f172a", transition: "background 0.15s",
            }}>
              <Icon name={icon} size={20} /> {label}
            </a>
          ))}

          <div style={{ height: 1, background: "#e2e8f0", margin: "18px 0" }} />

          {/* Account section */}
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8", padding: "0 12px", marginBottom: 12 }}>Account</p>

          {/* Profile */}
          <a href="/profile" onClick={() => setSidebarOpen(false)} className="sidebar-link" style={{
            display: "flex", alignItems: "center", gap: 14, padding: "10px 12px",
            borderRadius: 10, marginBottom: 6, textDecoration: "none", color: "#0f172a",
            transition: "background 0.15s",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #135bec, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="person" size={18} />
              <style>{`.profile-icon { color: white; }`}</style>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>My Profile</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>View & edit profile</div>
            </div>
          </a>

          {/* Log Out */}
          <button className="logout-btn" style={{
            display: "flex", alignItems: "center", gap: 14, padding: "10px 12px",
            borderRadius: 10, marginBottom: 6, border: "none", background: "transparent",
            cursor: "pointer", width: "100%", textAlign: "left",
            transition: "background 0.15s",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{
                fontFamily: "'Material Symbols Outlined'", fontWeight: "normal", fontStyle: "normal",
                fontSize: 18, color: "#ef4444", lineHeight: 1, display: "inline-block",
              }}>logout</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>Log Out</div>
              <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 1 }}>Sign out of your account</div>
            </div>
          </button>
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: "24px 24px 28px" }}>
          <button style={{ width: "100%", padding: "14px 0", background: "#135bec", color: "white", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, marginBottom: 12 }}>
            Sign In
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Luxury Redefined</p>
        </div>
      </aside>
    </div>
  );
}
