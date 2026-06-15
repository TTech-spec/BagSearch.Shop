import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, MapPin, Eye, Heart, Star, MoreVertical,
  TrendingUp, Home, CheckCircle, Clock, XCircle, Edit3,
  Trash2, BarChart2, ChevronDown, Search, SlidersHorizontal,
  Zap, Award, RefreshCw, X, Save, Camera, Tag, DollarSign,
  Package, AlignLeft, Check, AlertCircle, Loader
} from "lucide-react";
import { supabase } from "./services/api";

// ―― Palette ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
const C = {
  hero:         "#f5c5a8",
  heroDark:     "#f0b090",
  brand:        "#c84b11",
  brandLight:   "#e8571a",
  brandGlow:    "#f97316",
  accent:       "#f97316",
  accentWarm:   "#fb923c",
  bg:           "#fdf7f3",
  surface:      "#ffffff",
  surfaceWarm:  "#fef4ec",
  surfacePeach: "#fde8d8",
  cardBorder:   "#f5ddd0",
  borderLight:  "#faeae0",
  success:      "#16a34a",
  successBg:    "#f0fdf4",
  successBorder:"#bbf7d0",
  pending:      "#d97706",
  pendingBg:    "#fffbeb",
  pendingBorder:"#fde68a",
  inactive:     "#6b7280",
  inactiveBg:   "#f9fafb",
  text:         "#1a0800",
  textDark:     "#2d1200",
  textMid:      "#6b3520",
  textMuted:    "#a0522d",
  textFaint:    "#c4826a",
  white:        "#ffffff",
  overlay:      "rgba(26,8,0,0.55)",
};

// ―― Helpers ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
const fmt = (n) => n != null ? Number(n).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_CONFIG = {
  active:   { label: "Active",   color: C.success,  bg: C.successBg,  border: C.successBorder, Icon: CheckCircle },
  pending:  { label: "Pending",  color: C.pending,  bg: C.pendingBg,  border: C.pendingBorder, Icon: Clock       },
  inactive: { label: "Inactive", color: C.inactive, bg: C.inactiveBg, border: "#e5e7eb",       Icon: XCircle     },
};

const BRANDS = ['Chanel','Hermès','Louis Vuitton','Gucci','Prada','Dior','Balenciaga','Fendi','Celine','Bottega Veneta','Other'];
const CATEGORIES = ['Handbags','Shoulder Bags','Clutches','Totes','Backpacks','Crossbody','Evening Bags','Mini Bags','Satchels'];
const CONDITIONS = ['Pristine (Like New)','Excellent (Minor Wear)','Very Good (Gentle Use)','Fair (Visible Wear)'];

const BAG_COLOR_MAP = {
  black:'#1A1A1A',white:'#F5F5F0',beige:'#D4B896',camel:'#C19A6B',tan:'#A67C52',
  brown:'#6B3F2A',burgundy:'#722F37',red:'#CC2200',pink:'#E8A0A0',blush:'#F2C4B8',
  orange:'#E8762B',yellow:'#E8C84A',olive:'#808000',green:'#2D6A3F',mint:'#98D8C8',
  teal:'#2A7A7A',navy:'#1A2E5A',blue:'#2255CC',cobalt:'#0047AB',purple:'#6A2D8F',
  lavender:'#B8A0D8',grey:'#888888',silver:'#C0C0C0',gold:'#CFB53B',
  multicolor: 'linear-gradient(135deg,#C94B2C,#E8856A,#F9DDD0,#2255CC,#2D6A3F)',
};

const BAG_COLORS_LIST = [
  {id:'black',label:'Black'},{id:'white',label:'White'},{id:'beige',label:'Beige'},
  {id:'camel',label:'Camel'},{id:'tan',label:'Tan'},{id:'brown',label:'Brown'},
  {id:'burgundy',label:'Burgundy'},{id:'red',label:'Red'},{id:'pink',label:'Pink'},
  {id:'blush',label:'Blush'},{id:'orange',label:'Orange'},{id:'yellow',label:'Yellow'},
  {id:'olive',label:'Olive'},{id:'green',label:'Green'},{id:'mint',label:'Mint'},
  {id:'teal',label:'Teal'},{id:'navy',label:'Navy'},{id:'blue',label:'Blue'},
  {id:'cobalt',label:'Cobalt'},{id:'purple',label:'Purple'},{id:'lavender',label:'Lavender'},
  {id:'grey',label:'Grey'},{id:'silver',label:'Silver'},{id:'gold',label:'Gold'},
  {id:'multicolor',label:'Multi'},
];

const DEFAULT_PRODUCT_IMAGE = "https://via.placeholder.com/640x420?text=Product";

function prettyLocation(raw) {
  if (!raw) return "Unknown location";
  return String(raw).replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getMissingColumn(err) {
  const msg = String(err?.message || "");
  const code = String(err?.code || "").toUpperCase();
  if (code === "42703" || code === "PGRST204") {
    const match = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?/i);
    return match ? match[1] : null;
  }
  const lower = msg.toLowerCase();
  if (lower.includes("column") && (lower.includes("does not exist") || lower.includes("could not find"))) {
    const match = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?/i);
    return match ? match[1] : null;
  }
  return null;
}

function isMissingColumnError(err) {
  return Boolean(getMissingColumn(err));
}

function getImageList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { return value ? [value] : []; }
  }
  return [];
}

function mapProductToListing(row) {
  const images = getImageList(row?.images);
  const normalizedStatus = ["active", "pending", "inactive"].includes(row?.status) ? row.status : "active";
  
  const rawColors = Array.isArray(row?.colors) ? row.colors : (typeof row?.colors === 'string' ? JSON.parse(row.colors || '[]') : []);
  const mappedColors = rawColors.map(id => ({ id, hex: BAG_COLOR_MAP[String(id).toLowerCase()] || id }));

  return {
    id: row?.id,
    title: row?.name || "Untitled Product",
    location: prettyLocation(row?.location),
    locationRaw: row?.location || "",
    price: Number(row?.price ?? 0),
    status: normalizedStatus,
    views: Number(row?.views_count ?? row?.views ?? 0),
    saves: Number(row?.saves_count ?? row?.saves ?? 0),
    rating: row?.rating != null ? Number(row.rating) : null,
    reviews: Number(row?.review_count ?? row?.reviews ?? 0),
    image: images[0] || row?.image || DEFAULT_PRODUCT_IMAGE,
    images: images,
    created_at: row?.created_at || null,
    type: row?.category || "",
    subType: row?.condition || "",
    brand: row?.brand || "",
    description: row?.description || "",
    whatsapp: row?.whatsapp || "",
    quantity: Number(row?.quantity ?? 1),
    colors: mappedColors,
  };
}

// ―― Skeleton ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
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

// ―― Stat pill ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function StatPill({ icon: Icon, value, label, color, delay = 0, visible }) {
  return (
    <div style={{
      flex: "1 1 calc(50% - 7px)", minWidth: 140,
      background: C.surface, border: `1.5px solid ${C.cardBorder}`,
      borderRadius: 18, padding: "16px 16px",
      boxShadow: `0 4px 20px rgba(200,75,17,0.06)`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: C.surfacePeach, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <p style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
        {value}
      </p>
    </div>
  );
}

// ―― Status badge ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px", borderRadius: 20,
      fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <cfg.Icon size={8} /> {cfg.label}
    </span>
  );
}

// ―― Filter tab ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function FilterTab({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10,
      border: `1.5px solid ${active ? C.brand : C.cardBorder}`,
      background: active ? C.brand : C.surface,
      color: active ? "#fff" : C.textMid,
      fontSize: 11, fontWeight: 700, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.2s ease", whiteSpace: "nowrap",
    }}>
      {label}
      {count != null && (
        <span style={{
          fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 16,
          background: active ? "rgba(255,255,255,0.25)" : C.surfacePeach,
          color: active ? "#fff" : C.brand,
        }}>{count}</span>
      )}
    </button>
  );
}

// ―― Edit Drawer ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function EditDrawer({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: listing.title,
    brand: listing.brand,
    category: listing.type,
    condition: listing.subType,
    price: String(listing.price),
    location: listing.locationRaw,
    whatsapp: listing.whatsapp,
    description: listing.description,
    status: listing.status,
    quantity: listing.quantity,
  });
  const [selectedColors, setSelectedColors] = useState(
    Array.isArray(listing.colors) ? listing.colors.map(c => (typeof c === 'string' ? c : c.id)) : []
  );
  const toggleColor = (id) => setSelectedColors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [error,  setError]    = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [drawerIn, setDrawerIn] = useState(false);
  const [qtyKey, setQtyKey]   = useState(0);

  useEffect(() => { requestAnimationFrame(() => setDrawerIn(true)); }, []);

  const handleClose = () => {
    setDrawerIn(false);
    setTimeout(onClose, 380);
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const changeQty = (delta) => {
    setQtyKey(k => k + 1);
    setForm(prev => ({ ...prev, quantity: Math.min(99, Math.max(1, Number(prev.quantity) + delta)) }));
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const rawPrice = String(form.price).replace(/,/g, "");
      const baseUpdates = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        condition: form.condition,
        price: rawPrice,
        location: form.location,
        whatsapp: form.whatsapp,
        description: form.description,
      };
      const optionalUpdates = {
        quantity: Number(form.quantity),
        colors: selectedColors,
        status: form.status,
      };

      const performUpdate = async (skipKeys = []) => {
        const payload = { ...baseUpdates };
        Object.entries(optionalUpdates).forEach(([key, value]) => {
          if (!skipKeys.includes(key)) payload[key] = value;
        });
        const { error } = await supabase.from("products").update(payload).eq("id", listing.id);
        return { payload, error };
      };

      let updateError = null;
      let payloadResult = null;
      const triedSkips = new Set();
      const orderedKeys = Object.keys(optionalUpdates);
      for (let attempt = 0; attempt <= orderedKeys.length; attempt++) {
        const skipKeys = Array.from(triedSkips);
        const result = await performUpdate(skipKeys);
        updateError = result.error;
        payloadResult = result.payload;
        if (!updateError) break;
        if (!isMissingColumnError(updateError)) break;
        const missingCol = getMissingColumn(updateError);
        if (missingCol && orderedKeys.includes(missingCol) && !triedSkips.has(missingCol)) {
          triedSkips.add(missingCol);
          continue;
        }
        if (attempt < orderedKeys.length) {
          triedSkips.add(orderedKeys[attempt]);
          continue;
        }
        break;
      }

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => {
        onSaved({
          ...listing,
          title: form.name,
          brand: form.brand,
          type: form.category,
          subType: form.condition,
          price: Number(rawPrice),
          locationRaw: form.location,
          location: prettyLocation(form.location),
          whatsapp: form.whatsapp,
          description: form.description,
          status: payloadResult.status ?? listing.status,
          quantity: payloadResult.quantity ?? listing.quantity,
        });
        handleClose();
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${C.cardBorder}`, borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    color: C.text, background: C.surface, outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 800, color: C.textMid,
    textTransform: "uppercase", letterSpacing: "0.1em",
    display: "block", marginBottom: 6,
  };

  const TABS = [
    { id: "details", label: "Details", icon: Tag },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "colors",  label: "Colors",  icon: RefreshCw },
    { id: "desc",    label: "Description", icon: AlignLeft },
    { id: "status",  label: "Status", icon: CheckCircle },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(26,8,0,0.45)", backdropFilter: "blur(4px)",
          opacity: drawerIn ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(520px, 100vw)",
        background: C.bg,
        boxShadow: "-8px 0 60px rgba(200,75,17,0.18)",
        display: "flex", flexDirection: "column",
        transform: drawerIn ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
        borderLeft: `2px solid ${C.cardBorder}`,
      }}>

        {/* Drawer header */}
        <div style={{
          padding: "20px 24px 0",
          background: `linear-gradient(135deg, ${C.hero} 0%, ${C.heroDark} 100%)`,
          position: "relative", overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
          <div style={{ position: "absolute", top: 10, right: 20, width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(255,255,255,0.6)", flexShrink: 0 }}>
                  <img src={listing.image} alt={listing.title || 'Product listing'} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.brand, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>Editing</p>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: C.textDark, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em", lineHeight: 1.2, maxWidth: 220 }}>{listing.title}</h3>
                </div>
              </div>
              <button onClick={handleClose} style={{
                width: 32, height: 32, borderRadius: 10, border: `1px solid rgba(200,75,17,0.2)`,
                background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.transform = "scale(1)"; }}>
                <X size={14} color={C.brand} />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 0, scrollbarWidth: "none" }}>
              {TABS.map(({ id, label, icon: Ic }) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "8px 12px 10px",
                  border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, color: activeTab === id ? C.brand : C.textMid,
                  fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                  borderBottom: `2.5px solid ${activeTab === id ? C.brand : "transparent"}`,
                  transition: "color 0.2s, border-color 0.2s",
                }}>
                  <Ic size={11} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>

          {/* ── TAB: DETAILS ── */}
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "tabIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
              <FieldRow label="Bag Name" icon={Tag}>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  style={inputStyle} placeholder="e.g., Chanel Classic Flap"
                  onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                  onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }} />
              </FieldRow>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FieldRow label="Brand" icon={Award}>
                  <div style={{ position: "relative" }}>
                    <select value={form.brand} onChange={e => set("brand", e.target.value)}
                      style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
                      onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                      onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }}>
                      <option value="">Select</option>
                      {BRANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={14} color={C.textFaint} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </FieldRow>

                <FieldRow label="Category" icon={Package}>
                  <div style={{ position: "relative" }}>
                    <select value={form.category} onChange={e => set("category", e.target.value)}
                      style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
                      onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                      onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }}>
                      <option value="">Select</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} color={C.textFaint} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </FieldRow>
              </div>

              <FieldRow label="Condition" icon={Star}>
                <div style={{ position: "relative" }}>
                  <select value={form.condition} onChange={e => set("condition", e.target.value)}
                    style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
                    onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} color={C.textFaint} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </FieldRow>

              <FieldRow label="Location" icon={MapPin}>
                <input value={form.location} onChange={e => set("location", e.target.value)}
                  style={inputStyle} placeholder="e.g., lekki"
                  onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                  onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }} />
              </FieldRow>

              <FieldRow label="WhatsApp Number" icon={Zap}>
                <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)}
                  style={inputStyle} placeholder="+2348012345678" type="tel"
                  onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                  onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }} />
              </FieldRow>
            </div>
          )}

          {/* ── TAB: PRICING ── */}
          {activeTab === "pricing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "tabIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
              <FieldRow label="Price (₦)" icon={DollarSign}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 800, color: form.price ? C.brand : C.textFaint }}>₦</span>
                  <input
                    value={form.price ? Number(String(form.price).replace(/,/g,"")).toLocaleString("en-NG") : ""}
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (/^\d*$/.test(raw)) set("price", raw);
                    }}
                    style={{ ...inputStyle, paddingLeft: 30 }} placeholder="2,500,000"
                    onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = "none"; }} />
                </div>
                {form.price && (
                  <p style={{ fontSize: 11, color: C.brand, fontWeight: 700, marginTop: 5 }}>
                    ≈ ${(parseInt(form.price) / 1600).toFixed(0)} USD
                  </p>
                )}
              </FieldRow>

              {/* Quantity stepper */}
              <FieldRow label="Quantity Available" icon={Package}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{
                    display: "flex", alignItems: "stretch",
                    border: `1.5px solid ${Number(form.quantity) > 1 ? C.heroDark : C.cardBorder}`,
                    borderRadius: 14, overflow: "hidden", background: "white",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: Number(form.quantity) > 1 ? `0 0 0 3px rgba(200,75,17,0.10)` : "none",
                  }}>
                    <button type="button" onClick={() => changeQty(-1)} disabled={Number(form.quantity) <= 1}
                      style={{
                        width: 46, height: 48, border: "none",
                        borderRight: `1px solid ${C.borderLight}`,
                        background: Number(form.quantity) <= 1 ? C.inactiveBg : C.surfacePeach,
                        color: Number(form.quantity) <= 1 ? C.textFaint : C.brand,
                        fontSize: 20, cursor: Number(form.quantity) <= 1 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0,
                      }}>−</button>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "white" }}>
                      <span key={qtyKey} style={{
                        fontSize: 26, fontWeight: 900, color: Number(form.quantity) > 1 ? C.brand : C.text,
                        letterSpacing: "-0.04em", lineHeight: 1,
                        animation: "qtyPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
                      }}>{form.quantity}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {Number(form.quantity) === 1 ? "bag" : "bags"}
                      </span>
                    </div>
                    <button type="button" onClick={() => changeQty(1)} disabled={Number(form.quantity) >= 99}
                      style={{
                        width: 46, height: 48, border: "none",
                        borderLeft: `1px solid ${C.borderLight}`,
                        background: Number(form.quantity) >= 99 ? C.inactiveBg : C.surfacePeach,
                        color: Number(form.quantity) >= 99 ? C.textFaint : C.brand,
                        fontSize: 20, cursor: Number(form.quantity) >= 99 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0,
                      }}>+</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[1,2,3,5,10].map(n => {
                      const active = Number(form.quantity) === n || (n === 10 && Number(form.quantity) >= 10);
                      return (
                        <button key={n} type="button"
                          onClick={() => { setQtyKey(k => k+1); set("quantity", n); }}
                          style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            border: `1.5px solid ${active ? C.brand : C.cardBorder}`,
                            background: active ? C.brand : "white",
                            color: active ? "white" : C.textMid,
                            cursor: "pointer", transform: active ? "scale(1.06)" : "scale(1)",
                            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                            boxShadow: active ? `0 2px 8px ${C.brand}40` : "none",
                          }}>
                          {n === 10 ? "10+" : n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FieldRow>
            </div>
          )}

          {/* ── TAB: COLORS ── */}
          {activeTab === "colors" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "tabIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
              <p style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>Select all colors this bag is available in</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {BAG_COLORS_LIST.map(color => {
                  const isSelected = selectedColors.includes(color.id);
                  const hex = BAG_COLOR_MAP[color.id];
                  return (
                    <div key={color.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => toggleColor(color.id)}
                        style={{
                          width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: hex || color.id,
                          boxShadow: isSelected
                            ? `0 0 0 2px white, 0 0 0 4px ${C.brand}, 0 3px 10px rgba(0,0,0,0.15)`
                            : `0 0 0 1.5px rgba(0,0,0,0.12)`,
                          transform: isSelected ? "scale(1.18)" : "scale(1)",
                          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                          position: "relative",
                        }}
                      >
                        {isSelected && (
                          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.6)", borderRadius: "50%" }}>✓</span>
                        )}
                      </button>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: isSelected ? C.brand : C.textFaint }}>{color.label}</span>
                    </div>
                  );
                })}
              </div>
              {selectedColors.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 14px", background: "#FFF5F2", borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.textMid, width: "100%", marginBottom: 4 }}>Selected: {selectedColors.length} color{selectedColors.length > 1 ? 's' : ''}</span>
                  {selectedColors.map(id => (
                    <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 6px", borderRadius: 20, background: "white", border: `1.5px solid ${C.cardBorder}`, fontSize: 11, fontWeight: 700, color: C.textMid }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: BAG_COLOR_MAP[id] || id, display: "inline-block", border: "1px solid rgba(0,0,0,0.1)" }} />
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: DESCRIPTION ── */}
          {activeTab === "desc" && (
            <div style={{ animation: "tabIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
              <FieldRow label="Description" icon={AlignLeft}>
                <div style={{
                  border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, overflow: "hidden",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(200,75,17,0.1)`; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 10px", background: C.surfacePeach, borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint }}>{form.description.length}/1000</span>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    maxLength={1000}
                    rows={9}
                    style={{
                      width: "100%", padding: "14px 16px", border: "none", outline: "none",
                      resize: "vertical", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      color: C.text, lineHeight: 1.7, background: "white",
                    }}
                    placeholder="Describe wear, material, history, authentication details…"
                  />
                </div>
              </FieldRow>
            </div>
          )}

          {/* ── TAB: STATUS ── */}
          {activeTab === "status" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tabIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
              <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Choose the visibility of your listing.</p>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const active = form.status === key;
                return (
                  <button key={key} type="button"
                    onClick={() => set("status", key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 16, border: `2px solid ${active ? cfg.color : C.cardBorder}`,
                      background: active ? cfg.bg : C.surface,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      transform: active ? "scale(1.02)" : "scale(1)",
                      boxShadow: active ? `0 4px 16px ${cfg.color}30` : "none",
                    }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: active ? cfg.color : C.surfacePeach,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.3s",
                    }}>
                      <cfg.Icon size={16} color={active ? "white" : cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: active ? cfg.color : C.text, marginBottom: 2 }}>{cfg.label}</p>
                      <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>
                        {key === "active" ? "Visible to all buyers" : key === "pending" ? "Under review" : "Hidden from search"}
                      </p>
                    </div>
                    {active && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ height: 140 }} />
        </div>

        {/* Sticky footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${C.borderLight}`,
          background: "rgba(253,247,243,0.97)", backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column", gap: 10,
          flexShrink: 0,
        }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
              borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", fontSize: 12, fontWeight: 600,
              animation: "tabIn 0.25s ease",
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleClose} style={{
              flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
              border: `1.5px solid ${C.cardBorder}`, background: "white",
              fontSize: 13, fontWeight: 700, color: C.textMid,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.color = C.brand; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.textMid; }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                flex: 2, padding: "12px", borderRadius: 12, cursor: saving || saved ? "not-allowed" : "pointer",
                border: "none",
                background: saved
                  ? `linear-gradient(135deg, ${C.success}, #22c55e)`
                  : `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`,
                color: "white", fontSize: 13, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: saved ? "0 4px 16px rgba(22,163,74,0.35)" : `0 4px 16px rgba(200,75,17,0.3)`,
                transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                transform: saved ? "scale(1.02)" : "scale(1)",
              }}>
              {saving ? (
                <><Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</>
              ) : saved ? (
                <><Check size={15} strokeWidth={3} /> Saved!</>
              ) : (
                <><Save size={15} /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ―― Field row helper inside drawer ――――――――――――――――――――――――――――――――――――――――
function FieldRow({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{
        fontSize: 10, fontWeight: 800, color: C.textMid,
        textTransform: "uppercase", letterSpacing: "0.1em",
        display: "flex", alignItems: "center", gap: 5, marginBottom: 7,
      }}>
        {Icon && <Icon size={10} color={C.brand} />} {label}
      </label>
      {children}
    </div>
  );
}

// ―― Listing card ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function ListingCard({ listing, index, visible, onDelete, onEdit }) {
  const [hovered,   setHovered]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const delay = 100 + index * 80;

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => onDelete(listing.id), 320);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        background: C.surface,
        border: `1.5px solid ${hovered ? C.heroDark : C.cardBorder}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: hovered ? `0 10px 30px rgba(200,75,17,0.15)` : `0 4px 12px rgba(200,75,17,0.05)`,
        transform: deleting ? "scale(0.92) opacity(0)" : hovered ? "translateY(-3px)" : "translateY(0)",
        opacity: visible && !deleting ? 1 : 0,
        transition: `
          opacity ${deleting ? "0.3s" : `0.55s ease ${delay}ms`},
          transform 0.3s ease,
          box-shadow 0.3s ease,
          border-color 0.25s ease
        `,
        position: "relative", cursor: "default",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: C.surfacePeach }}>
        {!imgLoaded && <div style={{ position: "absolute", inset: 0 }}><Skel w="100%" h="100%" r={0} /></div>}
        <img src={listing.image} alt={listing.title} onLoad={() => setImgLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.4s ease, opacity 0.4s ease" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(26,8,0,0.55) 0%, transparent 55%)`, opacity: hovered ? 1 : 0.6, transition: "opacity 0.3s ease" }} />

        {/* Top row */}
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <StatusBadge status={listing.status} />
          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(255,255,255,0.92)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(8px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <MoreVertical size={13} color={C.text} />
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", top: 34, right: 0, zIndex: 50,
                background: C.surface, border: `1.5px solid ${C.cardBorder}`,
                borderRadius: 12, padding: "4px", minWidth: 130,
                boxShadow: "0 8px 24px rgba(200,75,17,0.15)",
                animation: "menuIn 0.2s cubic-bezier(0.22,1,0.36,1)",
              }}>
                {[
                  { icon: Edit3,   label: "Edit",   action: () => { onEdit(listing); setMenuOpen(false); }, color: C.brand },
                  { icon: BarChart2, label: "Stats",action: () => setMenuOpen(false), color: C.accent },
                  { icon: Trash2,  label: "Delete", action: () => { handleDelete(); setMenuOpen(false); }, color: "#dc2626" },
                ].map(({ icon: Ic, label, action, color }) => (
                  <button key={label} onClick={action} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "8px 10px", borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 11, fontWeight: 600, color,
                    fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s ease",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfacePeach}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Ic size={12} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div style={{ position: "absolute", bottom: 8, left: 10 }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", fontFamily: "'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {fmt(listing.price)}
          </p>
        </div>
        {/* Type pill */}
        <div style={{ position: "absolute", bottom: 8, right: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", padding: "3px 8px", borderRadius: 16, letterSpacing: "0.08em", display: "inline-block", maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {listing.type}{listing.subType ? ` · ${listing.subType}` : ""}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 14px 16px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 4, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {listing.title}
        </h3>
        <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <MapPin size={10} color={C.brand} /> {listing.location}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {listing.colors && listing.colors.length > 0 && (
            <div style={{ display: "flex", gap: 3, width: "100%", marginBottom: 4 }}>
              {listing.colors.slice(0, 6).map((c, i) => (
                <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex || c, border: "1px solid white", outline: `0.5px solid ${C.cardBorder}` }} title={c.id || ''} />
              ))}
              {listing.colors.length > 6 && <span style={{ fontSize: 8, color: C.textFaint, fontWeight: 700 }}>+{listing.colors.length - 6}</span>}
            </div>
          )}
          {[
            { icon: Eye,   val: listing.views, label: "views" },
            { icon: Heart, val: listing.saves, label: "saves" },
            { icon: Package, val: `×${listing.quantity}`, label: "qty" },
          ].map(({ icon: Ic, val, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: C.surfacePeach, flex: "1 0 auto" }}>
              <Ic size={10} color={C.brand} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{val}</span>
            </div>
          ))}
          {listing.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: "#fffbeb", flex: "1 0 auto" }}>
              <Star size={9} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{listing.rating}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
          <span style={{ fontSize: 9, color: C.textFaint, fontWeight: 500 }}>{fmtDate(listing.created_at)}</span>

          {/* Edit button — primary CTA on card */}
          <button onClick={() => onEdit(listing)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
            borderRadius: 9, border: "none",
            background: `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`,
            color: "white", fontSize: 10, fontWeight: 800, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: `0 3px 10px rgba(200,75,17,0.3)`,
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = `0 5px 16px rgba(200,75,17,0.4)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 3px 10px rgba(200,75,17,0.3)`; }}>
            <Edit3 size={10} /> Edit Listing
          </button>
        </div>
      </div>
    </div>
  );
}

// ―― Main page ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export default function SellerListings() {
  const navigate   = useNavigate();
  const [listings, setListings]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [filter,   setFilter]       = useState("all");
  const [search,   setSearch]       = useState("");
  const [sort,     setSort]         = useState("newest");
  const [visible,  setVisible]      = useState(false);
  const [headerIn, setHeaderIn]     = useState(false);
  const [heroIn,   setHeroIn]       = useState(false);
  const [editTarget, setEditTarget] = useState(null); // listing being edited

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
        const byUser = await supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        let rows = byUser.data || [];
        let queryError = byUser.error;
        if (rows.length === 0 || (queryError && isMissingColumnError(queryError))) {
          const bySeller = await supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
          if (!bySeller.error) { rows = bySeller.data || []; queryError = null; }
          else if (!queryError || isMissingColumnError(queryError)) queryError = bySeller.error;
        }
        if (queryError && rows.length === 0 && !isMissingColumnError(queryError)) throw queryError;
        setListings(rows.map(mapProductToListing));
      } catch (err) {
        console.error("Failed to load seller listings:", err);
        setListings([]);
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

  const totalViews = listings.reduce((s, l) => s + (l.views ?? 0), 0);
  const totalSaves = listings.reduce((s, l) => s + (l.saves ?? 0), 0);
  const avgRating  = listings.filter(l => l.rating).reduce((s, l, _, a) => s + l.rating / a.length, 0);

  const handleDelete = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product. Please try again.');
    }
  }, []);
  const handleEdit   = useCallback((listing) => setEditTarget(listing), []);
  const handleSaved  = useCallback((updated) => {
    setListings(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text, position: "relative", width: "100%", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes menuIn { from{opacity:0;transform:translateY(-8px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes floatOrb { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.02)} }
        @keyframes tabIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes qtyPop { 0%{transform:scale(0.6) translateY(8px);opacity:0} 60%{transform:scale(1.2) translateY(-2px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.hero}; border-radius: 2px; }
        input, select, button, textarea { font-family: inherit; }
      `}</style>

      {/* Bg decorations */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", opacity: 0.6 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(200,75,17,0.08) 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", top: -100, right: -80, width: 320, height: 320, background: `radial-gradient(circle, ${C.hero}40 0%, transparent 65%)`, animation: "floatOrb 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -120, left: -80, width: 400, height: 400, background: `radial-gradient(circle, ${C.surfacePeach}70 0%, transparent 65%)`, animation: "floatOrb 11s ease-in-out infinite reverse" }} />
      </div>

      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(253,247,243,0.95)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.borderLight}`,
        boxShadow: `0 1px 0 ${C.hero}`,
        opacity: headerIn ? 1 : 0,
        transform: headerIn ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.45s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 60, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <button onClick={() => navigate(-1)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8,
              border: `1px solid ${C.cardBorder}`, background: C.surface, cursor: "pointer",
              color: C.textMid, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
            }}>
              <ArrowLeft size={12} /> Back
            </button>
            <div style={{ width: 1, height: 24, background: C.borderLight }} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", fontFamily: "'Playfair Display', serif", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                My Listings
              </h1>
              <p style={{ fontSize: 9, color: C.textFaint, fontWeight: 500 }}>{counts.all} total · {counts.active} active</p>
            </div>
          </div>
          <button onClick={() => navigate("/upload-product")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`,
            color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 4px 12px rgba(200,75,17,0.3)`, whiteSpace: "nowrap",
          }}>
            <Plus size={14} strokeWidth={2.5} /> Add Listing
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>

        {/* HERO BANNER */}
        <div style={{
          borderRadius: 20, overflow: "hidden", marginBottom: 24,
          background: `linear-gradient(135deg, ${C.hero} 0%, ${C.heroDark} 50%, #f0a882 100%)`,
          position: "relative", padding: "24px 20px",
          opacity: heroIn ? 1 : 0,
          transform: heroIn ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: `0 8px 40px rgba(200,75,17,0.12)`,
        }}>
          <div style={{ position: "absolute", top: -40, right: 200, width: 200, height: 200, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)" }} />
          <div style={{ position: "absolute", bottom: -60, right: 80, width: 280, height: 280, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 16, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", marginBottom: 10 }}>
              <Zap size={10} color={C.brand} fill={C.brand} />
              <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, letterSpacing: "0.1em", textTransform: "uppercase" }}>Seller Dashboard</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 900, color: C.textDark, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
              Your <span style={{ color: C.brand }}>Listings</span>
            </h2>
            <p style={{ fontSize: 12, color: C.textMid, fontWeight: 500, lineHeight: 1.5, maxWidth: 280 }}>
              Manage, edit and monitor your bag listings
            </p>
          </div>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            {[
              { icon: Eye,   val: totalViews.toLocaleString(), label: "Views" },
              { icon: Heart, val: totalSaves.toLocaleString(), label: "Saves" },
              { icon: Award, val: avgRating ? avgRating.toFixed(1) + " ★" : "—", label: "Rating" },
            ].map(({ icon: Ic, val, label }) => (
              <div key={label} style={{
                flex: "1 0 auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                borderRadius: 12, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.6)", minWidth: 100,
              }}>
                <Ic size={12} color={C.brand} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 900, color: C.text, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{val}</p>
                  <p style={{ fontSize: 8, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <StatPill icon={Home}        value={counts.all}                   label="Total"   color={C.brand}   delay={0}   visible={visible} />
          <StatPill icon={CheckCircle} value={counts.active}                label="Active"  color={C.success} delay={80}  visible={visible} />
          <StatPill icon={Clock}       value={counts.pending}               label="Pending" color={C.pending} delay={160} visible={visible} />
          <StatPill icon={TrendingUp}  value={totalViews.toLocaleString()}  label="Views"   color={C.accent}  delay={240} visible={visible} />
        </div>

        {/* CONTROLS */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 12, marginBottom: 20,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
          transition: "opacity 0.5s ease 300ms, transform 0.5s ease 300ms",
        }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {[
              { key: "all", label: "All" }, { key: "active", label: "Active" },
              { key: "pending", label: "Pending" }, { key: "inactive", label: "Inactive" },
            ].map(t => (
              <FilterTab key={t.key} label={t.label} count={counts[t.key]} active={filter === t.key} onClick={() => setFilter(t.key)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={13} color={C.textFaint} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…"
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 10, border: `1.5px solid ${C.cardBorder}`, background: C.surface, fontSize: 11, fontWeight: 500, color: C.text, outline: "none" }} />
            </div>
            <div style={{ position: "relative", minWidth: 100 }}>
              <SlidersHorizontal size={12} color={C.textFaint} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
              <ChevronDown size={10} color={C.textFaint} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: "100%", padding: "8px 22px 8px 28px", borderRadius: 10, border: `1.5px solid ${C.cardBorder}`, background: C.surface, fontSize: 11, fontWeight: 600, color: C.textMid, outline: "none", cursor: "pointer", appearance: "none" }}>
                <option value="newest">Newest</option>
                <option value="price_hi">Price ↑</option>
                <option value="price_lo">Price ↓</option>
                <option value="views">Views</option>
              </select>
            </div>
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ borderRadius: 18, overflow: "hidden", border: `1.5px solid ${C.cardBorder}`, background: C.surface }}>
                <Skel w="100%" h={160} r={0} />
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skel w="80%" h={14} /><Skel w="55%" h={10} />
                  <div style={{ display: "flex", gap: 6 }}><Skel w={60} h={22} r={6} /><Skel w={50} h={22} r={6} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 16px", animation: "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.surfacePeach, border: `2px dashed ${C.heroDark}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Home size={28} color={C.brand} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>No listings found</h3>
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 20 }}>
              {search ? `No results for "${search}"` : "Upload your first bag to get started"}
            </p>
            <button onClick={() => navigate("/upload-product")} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.brand}, ${C.brandLight})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px rgba(200,75,17,0.3)` }}>
              + Upload Product
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} visible={visible} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 32, textAlign: "center", opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 800ms" }}>
            <button onClick={() => navigate("/upload-product")} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px",
              borderRadius: 14, border: `2px dashed ${C.heroDark}`, background: "transparent",
              cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.brand,
            }}>
              <Plus size={16} /> Upload Another Listing
            </button>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editTarget && (
        <EditDrawer
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
