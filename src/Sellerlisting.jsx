import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, MapPin, Eye, Heart, Star, MoreVertical,
  TrendingUp, Home, CheckCircle, Clock, XCircle, Edit3,
  Trash2, BarChart2, ChevronDown, Search, SlidersHorizontal,
  Zap, Award, RefreshCw
} from "lucide-react";
import { supabase } from "./services/api";

// ── Criibb palette extracted from screenshot ──────────────────────────────────
const C = {
  // Core brand
  hero:         "#f5c5a8",   // warm peach hero bg
  heroDark:     "#f0b090",   // deeper peach
  brand:        "#c84b11",   // deep orange-red (logo, primary CTA)
  brandLight:   "#e8571a",   // lighter orange-red
  brandGlow:    "#f97316",   // bright glow orange
  accent:       "#f97316",   // orange accent
  accentWarm:   "#fb923c",   // soft orange

  // Surfaces
  bg:           "#fdf7f3",   // warm off-white page bg
  surface:      "#ffffff",
  surfaceWarm:  "#fef4ec",
  surfacePeach: "#fde8d8",
  cardBorder:   "#f5ddd0",
  borderLight:  "#faeae0",

  // Status
  success:      "#16a34a",
  successBg:    "#f0fdf4",
  successBorder:"#bbf7d0",
  pending:      "#d97706",
  pendingBg:    "#fffbeb",
  pendingBorder:"#fde68a",
  inactive:     "#6b7280",
  inactiveBg:   "#f9fafb",

  // Text
  text:         "#1a0800",
  textDark:     "#2d1200",
  textMid:      "#6b3520",
  textMuted:    "#a0522d",
  textFaint:    "#c4826a",
  white:        "#ffffff",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => n != null ? Number(n).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_CONFIG = {
  active:   { label: "Active",   color: C.success,  bg: C.successBg,  border: C.successBorder, Icon: CheckCircle },
  pending:  { label: "Pending",  color: C.pending,  bg: C.pendingBg,  border: C.pendingBorder, Icon: Clock       },
  inactive: { label: "Inactive", color: C.inactive, bg: C.inactiveBg, border: "#e5e7eb",       Icon: XCircle     },
};

// ── Mock data (replace with Supabase query) ───────────────────────────────────
const MOCK_LISTINGS = [
  { id: "1", title: "Luxury 3-Bed Shortlet, Lekki Phase 1", location: "Lekki Phase 1, Lagos", price: 85000, status: "active",  views: 342, saves: 28, rating: 4.8, reviews: 14, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", created_at: "2025-11-10", type: "Apartment", bedrooms: 3 },
  { id: "2", title: "Modern Studio, Victoria Island",         location: "Victoria Island, Lagos",  price: 45000, status: "active",  views: 198, saves: 19, rating: 4.6, reviews: 8,  image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80", created_at: "2025-12-02", type: "Studio",    bedrooms: 1 },
  { id: "3", title: "Cozy 2-Bed, Ikoyi",                     location: "Ikoyi, Lagos",            price: 65000, status: "pending", views: 87,  saves: 6,  rating: null, reviews: 0,  image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80", created_at: "2026-01-15", type: "Apartment", bedrooms: 2 },
  { id: "4", title: "Penthouse Suite, Eko Atlantic",         location: "Eko Atlantic, Lagos",     price: 150000,status: "active",  views: 531, saves: 47, rating: 4.9, reviews: 22, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80", created_at: "2025-10-05", type: "Penthouse", bedrooms: 4 },
  { id: "5", title: "Serviced 1-Bed, Ikeja GRA",             location: "Ikeja GRA, Lagos",        price: 35000, status: "inactive",views: 54,  saves: 3,  rating: 4.2, reviews: 5,  image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", created_at: "2025-09-20", type: "Apartment", bedrooms: 1 },
  { id: "6", title: "Duplex Short Stay, Ajah",               location: "Ajah, Lagos",             price: 55000, status: "pending", views: 29,  saves: 4,  rating: null, reviews: 0,  image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80", created_at: "2026-02-01", type: "Duplex",    bedrooms: 3 },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 16, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg, ${C.surfacePeach} 25%, ${C.heroDark}33 50%, ${C.surfacePeach} 75%)`,
      backgroundSize: "400px 100%",
      animation: "shimmer 1.6s ease infinite",
      flexShrink: 0,
    }} />
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, color, delay = 0, visible }) {
  return (
    <div style={{
      flex: 1, minWidth: 130,
      background: C.surface,
      border: `1.5px solid ${C.cardBorder}`,
      borderRadius: 18, padding: "18px 20px",
      boxShadow: `0 4px 20px rgba(200,75,17,0.06)`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.surfacePeach, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <p style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
        {value}
      </p>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 20,
      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <cfg.Icon size={9} /> {cfg.label}
    </span>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, index, visible, onDelete, onEdit }) {
  const [hovered,     setHovered]     = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [imgLoaded,   setImgLoaded]   = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const delay = 100 + index * 80;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        background: C.surface,
        border: `1.5px solid ${hovered ? C.heroDark : C.cardBorder}`,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: hovered
          ? `0 20px 60px rgba(200,75,17,0.15), 0 4px 20px rgba(200,75,17,0.08)`
          : `0 4px 20px rgba(200,75,17,0.05)`,
        transform: hovered ? "translateY(-6px) scale(1.005)" : "translateY(0) scale(1)",
        opacity: visible ? 1 : 0,
        transition: `
          opacity 0.55s ease ${delay}ms,
          transform 0.45s cubic-bezier(0.22,1,0.36,1),
          box-shadow 0.35s ease,
          border-color 0.25s ease
        `,
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 200, overflow: "hidden", background: C.surfacePeach }}>
        {!imgLoaded && (
          <div style={{ position: "absolute", inset: 0 }}>
            <Skel w="100%" h="100%" r={0} />
          </div>
        )}
        <img
          src={listing.image}
          alt={listing.title}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: imgLoaded ? 1 : 0,
            transform: hovered ? "scale(1.07)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease",
          }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to top, rgba(26,8,0,0.55) 0%, transparent 55%)`,
          opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.3s ease",
        }} />
        {/* Top badges */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <StatusBadge status={listing.status} />
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: "rgba(255,255,255,0.92)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", backdropFilter: "blur(8px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                opacity: hovered ? 1 : 0,
                transform: hovered ? "scale(1)" : "scale(0.7)",
                transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <MoreVertical size={14} color={C.text} />
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", top: 38, right: 0, zIndex: 50,
                background: C.surface, border: `1.5px solid ${C.cardBorder}`,
                borderRadius: 14, padding: "6px", minWidth: 150,
                boxShadow: "0 12px 40px rgba(200,75,17,0.15)",
                animation: "menuIn 0.2s cubic-bezier(0.22,1,0.36,1)",
              }}>
                {[
                  { icon: Edit3,   label: "Edit Listing",  action: () => { onEdit(listing); setMenuOpen(false); }, color: C.brand },
                  { icon: BarChart2, label: "View Stats",  action: () => setMenuOpen(false), color: C.accent },
                  { icon: Trash2,  label: "Delete",        action: () => { onDelete(listing.id); setMenuOpen(false); }, color: "#dc2626" },
                ].map(({ icon: Ic, label, action, color }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%",
                      padding: "9px 12px", borderRadius: 9, border: "none",
                      background: "transparent", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, color: color,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfacePeach}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Ic size={13} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Bottom price */}
        <div style={{ position: "absolute", bottom: 12, left: 14 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", fontFamily: "'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {fmt(listing.price)}<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>/night</span>
          </p>
        </div>
        {/* Type pill */}
        <div style={{ position: "absolute", bottom: 12, right: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", padding: "3px 9px", borderRadius: 20, letterSpacing: "0.08em" }}>
            {listing.type} · {listing.bedrooms} bed
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px 20px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 6, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
          {listing.title}
        </h3>
        <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} color={C.brand} /> {listing.location}
        </p>

        {/* Metrics row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {[
            { icon: Eye,   val: listing.views, label: "views" },
            { icon: Heart, val: listing.saves, label: "saves" },
          ].map(({ icon: Ic, val, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: C.surfacePeach }}>
              <Ic size={12} color={C.brand} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{val}</span>
              <span style={{ fontSize: 10, color: C.textFaint }}>{label}</span>
            </div>
          ))}
          {listing.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#fffbeb" }}>
              <Star size={11} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{listing.rating}</span>
              <span style={{ fontSize: 10, color: C.textFaint }}>({listing.reviews})</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.borderLight}` }}>
          <span style={{ fontSize: 10, color: C.textFaint, fontWeight: 500 }}>Listed {fmtDate(listing.created_at)}</span>
          <button
            onClick={() => onEdit(listing)}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
              borderRadius: 9, border: `1.5px solid ${C.brand}`,
              background: hovered ? C.brand : "transparent",
              color: hovered ? "#fff" : C.brand,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.25s ease",
            }}
          >
            <Edit3 size={11} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter tab ────────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 12,
        border: `1.5px solid ${active ? C.brand : C.cardBorder}`,
        background: active ? C.brand : C.surface,
        color: active ? "#fff" : C.textMid,
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: active ? `0 4px 16px rgba(200,75,17,0.3)` : "none",
        transform: active ? "scale(1.02)" : "scale(1)",
      }}
    >
      {label}
      {count != null && (
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 20,
          background: active ? "rgba(255,255,255,0.25)" : C.surfacePeach,
          color: active ? "#fff" : C.brand,
        }}>{count}</span>
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerListings() {
  const navigate   = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState("newest");
  const [visible,  setVisible]  = useState(false);
  const [headerIn, setHeaderIn] = useState(false);
  const [heroIn,   setHeroIn]   = useState(false);

  useEffect(() => {
    setTimeout(() => setHeaderIn(true), 60);
    setTimeout(() => setHeroIn(true),   200);
    setTimeout(() => setVisible(true),  340);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setListings(data?.length ? data : MOCK_LISTINGS);
      } catch {
        setListings(MOCK_LISTINGS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = {
    all:      listings.length,
    active:   listings.filter(l => l.status === "active").length,
    pending:  listings.filter(l => l.status === "pending").length,
    inactive: listings.filter(l => l.status === "inactive").length,
  };

  const filtered = listings
    .filter(l => filter === "all" || l.status === filter)
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "newest")   return new Date(b.created_at) - new Date(a.created_at);
      if (sort === "price_hi") return b.price - a.price;
      if (sort === "price_lo") return a.price - b.price;
      if (sort === "views")    return b.views - a.views;
      return 0;
    });

  const totalViews  = listings.reduce((s, l) => s + (l.views ?? 0), 0);
  const totalSaves  = listings.reduce((s, l) => s + (l.saves ?? 0), 0);
  const avgRating   = listings.filter(l => l.rating).reduce((s, l, _, a) => s + l.rating / a.length, 0);

  const handleDelete = (id) => setListings(prev => prev.filter(l => l.id !== id));
  const handleEdit   = (listing) => navigate(`/edit-listing/${listing.id}`);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes menuIn { from { opacity:0; transform:translateY(-8px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes floatOrb { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-18px) scale(1.04); } }
        @keyframes spin360 { to { transform:rotate(360deg); } }
        @keyframes blobMorph {
          0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; }
          50% { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; }
        }
        @keyframes pulseRing {
          0% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(200,75,17,0.4); }
          70% { transform:scale(1); box-shadow:0 0 0 10px rgba(200,75,17,0); }
          100% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(200,75,17,0); }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.hero}; border-radius: 3px; }
      `}</style>

      {/* ── Background decorations ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(200,75,17,0.1) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        {/* Warm blobs */}
        <div style={{ position: "absolute", top: -160, right: -100, width: 520, height: 520, background: `radial-gradient(circle, ${C.hero}55 0%, transparent 65%)`, animation: "floatOrb 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -200, left: -120, width: 600, height: 600, background: `radial-gradient(circle, ${C.surfacePeach}88 0%, transparent 65%)`, animation: "floatOrb 11s ease-in-out infinite reverse" }} />
        {/* Animated blob */}
        <div style={{ position: "absolute", top: "35%", right: "8%", width: 180, height: 180, background: `linear-gradient(135deg, ${C.hero}66, ${C.surfacePeach}44)`, animation: "blobMorph 10s ease-in-out infinite, floatOrb 7s ease-in-out infinite", opacity: 0.6, zIndex: 0 }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(253,247,243,0.93)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.borderLight}`,
        boxShadow: `0 1px 0 ${C.hero}`,
        opacity: headerIn ? 1 : 0,
        transform: headerIn ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.45s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", height: 70, gap: 16 }}>
          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.surface, cursor: "pointer", color: C.textMid, fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surfacePeach; e.currentTarget.style.borderColor = C.heroDark; e.currentTarget.style.transform = "translateX(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = "none"; }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ width: 1, height: 28, background: C.borderLight }} />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>My Listings</h1>
              <p style={{ fontSize: 10, color: C.textFaint, fontWeight: 500 }}>{counts.all} total · {counts.active} active</p>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Add listing CTA */}
          <button
            onClick={() => navigate("/new-listing")}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
              borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`,
              color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 20px rgba(200,75,17,0.35)`,
              transition: "all 0.25s ease",
              animation: "pulseRing 2.5s ease-in-out infinite",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 32px rgba(200,75,17,0.5)`; e.currentTarget.style.animation = "none"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(200,75,17,0.35)`; e.currentTarget.style.animation = "pulseRing 2.5s ease-in-out infinite"; }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Listing
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 28px 80px", position: "relative", zIndex: 1 }}>

        {/* ── HERO BANNER ── */}
        <div style={{
          borderRadius: 28, overflow: "hidden", marginBottom: 32,
          background: `linear-gradient(135deg, ${C.hero} 0%, ${C.heroDark} 50%, #f0a882 100%)`,
          position: "relative", padding: "40px 44px",
          opacity: heroIn ? 1 : 0,
          transform: heroIn ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: `0 12px 60px rgba(200,75,17,0.15)`,
        }}>
          {/* Vertical stripe decorations */}
          {[12, 28, 44, 62].map(p => (
            <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(255,255,255,0.12)" }} />
          ))}
          {/* Circles */}
          <div style={{ position: "absolute", top: -40, right: 200, width: 200, height: 200, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)" }} />
          <div style={{ position: "absolute", bottom: -60, right: 80, width: 280, height: 280, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />

          <div style={{ position: "relative", zIndex: 2, maxWidth: 480 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", marginBottom: 14 }}>
              <Zap size={11} color={C.brand} fill={C.brand} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: "0.12em", textTransform: "uppercase" }}>Seller Dashboard</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: C.textDark, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 10, fontFamily: "'Playfair Display', serif" }}>
              Your <span style={{ color: C.brand }}>Spaces</span>,<br />Your Earnings.
            </h2>
            <p style={{ fontSize: 14, color: C.textMid, fontWeight: 500, lineHeight: 1.6 }}>
              Manage, monitor and maximise every shortlet<br />you have listed on Criibb.
            </p>
          </div>

          {/* Floating stat chips on right */}
          <div style={{ position: "absolute", right: 44, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 12, zIndex: 2 }}>
            {[
              { icon: Eye,       val: totalViews.toLocaleString(), label: "Total Views",  delay: 0 },
              { icon: Heart,     val: totalSaves.toLocaleString(), label: "Total Saves",  delay: 120 },
              { icon: Award,     val: avgRating ? avgRating.toFixed(1) + " ★" : "—",     label: "Avg Rating", delay: 240 },
            ].map(({ icon: Ic, val, label, delay }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                borderRadius: 14, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 4px 20px rgba(200,75,17,0.1)",
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "translateX(0)" : "translateX(30px)",
                transition: `opacity 0.5s ease ${400 + delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${400 + delay}ms`,
              }}>
                <Ic size={14} color={C.brand} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{val}</p>
                  <p style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
          <StatPill icon={Home}       value={counts.all}            label="Total Listed"  color={C.brand}    delay={0}   visible={visible} />
          <StatPill icon={CheckCircle}value={counts.active}         label="Active"        color={C.success}  delay={80}  visible={visible} />
          <StatPill icon={Clock}      value={counts.pending}        label="Pending"       color={C.pending}  delay={160} visible={visible} />
          <StatPill icon={TrendingUp} value={totalViews.toLocaleString()} label="Total Views" color={C.accent} delay={240} visible={visible} />
        </div>

        {/* ── CONTROLS ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(12px)",
          transition: "opacity 0.5s ease 300ms, transform 0.5s ease 300ms",
        }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "all",      label: "All"      },
              { key: "active",   label: "Active"   },
              { key: "pending",  label: "Pending"  },
              { key: "inactive", label: "Inactive" },
            ].map(t => (
              <FilterTab key={t.key} label={t.label} count={counts[t.key]} active={filter === t.key} onClick={() => setFilter(t.key)} />
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} color={C.textFaint} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your listings…"
                style={{
                  width: "100%", padding: "9px 14px 9px 36px", borderRadius: 12,
                  border: `1.5px solid ${C.cardBorder}`, background: C.surface,
                  fontSize: 12, fontWeight: 500, color: C.text, outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.surfacePeach}`; }}
                onBlur={e  => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Sort */}
          <div style={{ position: "relative" }}>
            <SlidersHorizontal size={13} color={C.textFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <ChevronDown size={12} color={C.textFaint} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: "9px 30px 9px 34px", borderRadius: 12,
                border: `1.5px solid ${C.cardBorder}`, background: C.surface,
                fontSize: 12, fontWeight: 600, color: C.textMid, outline: "none",
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer", appearance: "none",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="price_hi">Price: High → Low</option>
              <option value="price_lo">Price: Low → High</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* ── GRID ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 22 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: 22, overflow: "hidden", border: `1.5px solid ${C.cardBorder}`, background: C.surface }}>
                <Skel w="100%" h={200} r={0} />
                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Skel w="80%" h={16} />
                  <Skel w="55%" h={12} />
                  <div style={{ display: "flex", gap: 8 }}><Skel w={70} h={26} r={8} /><Skel w={60} h={26} r={8} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            animation: "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.surfacePeach, border: `2px dashed ${C.heroDark}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "floatOrb 3s ease-in-out infinite" }}>
              <Home size={32} color={C.brand} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>No listings found</h3>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 24 }}>
              {search ? `No results for "${search}"` : "You don't have any listings in this category yet."}
            </p>
            <button onClick={() => navigate("/new-listing")} style={{ padding: "11px 26px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 6px 20px rgba(200,75,17,0.35)` }}>
              + Add Your First Listing
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 22 }}>
            {filtered.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={i}
                visible={visible}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: 48, textAlign: "center",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 800ms",
          }}>
            <button onClick={() => navigate("/new-listing")} style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 36px",
              borderRadius: 16, border: `2px dashed ${C.heroDark}`,
              background: "transparent", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: C.brand,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surfacePeach; e.currentTarget.style.borderStyle = "solid"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderStyle = "dashed"; }}
            >
              <Plus size={18} /> List Another Space
            </button>
          </div>
        )}
      </div>
    </div>
  );
}