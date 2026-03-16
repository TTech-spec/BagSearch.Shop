import { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { fileToBase64, generateImageEmbedding, queryPinecone } from './services/pinecone';
import LogoIcon from './components/Logo.jsx';

// ─── Color Palette (warm orange/peach inspired by BagSearch) ────────────────────
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

// ─── Page Loader ──────────────────────────────────────────────────────────────
const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 5 + 2;
      if (p >= 100) {
        p = 100; clearInterval(iv); setProgress(100);
        setTimeout(() => setPhase(1), 500);
        setTimeout(() => onDone(), 1300);
      } else setProgress(Math.min(p, 100));
    }, 35);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:99999,background:'linear-gradient(135deg,#2d0e00 0%,#4a1a06 50%,#1a0a00 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:phase===1?0:1,transform:phase===1?'scale(1.03)':'scale(1)',transition:'opacity 0.7s ease,transform 0.7s ease',pointerEvents:phase===1?'none':'all' }}>
      <style>{`
        @keyframes ldSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ldPulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.22);opacity:0.15}}
        @keyframes ldBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ldDot{0%,80%,100%{transform:scale(0.55);opacity:0.25}40%{transform:scale(1);opacity:1}}
        @keyframes ldFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ldShimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes ldRing{0%{transform:scale(0.85);opacity:0.7}100%{transform:scale(1.7);opacity:0}}
        @keyframes ldMesh{0%{transform:translate(0,0)}50%{transform:translate(18px,-14px)}100%{transform:translate(0,0)}}
        @keyframes ldGlow{0%,100%{box-shadow:0 8px 28px rgba(200,75,17,0.5)}50%{box-shadow:0 8px 48px rgba(249,115,22,0.9)}}
      `}</style>
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        {[{x:'-10%',y:'-10%',c:'rgba(200,75,17,0.25)'},{x:'65%',y:'55%',c:'rgba(249,115,22,0.18)'},{x:'35%',y:'15%',c:'rgba(234,88,12,0.15)'}].map((b,i)=>(
          <div key={i} style={{position:'absolute',left:b.x,top:b.y,width:350,height:350,borderRadius:'50%',background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,animation:`ldMesh 6s ease-in-out ${i*1.5}s infinite`,filter:'blur(40px)'}}/>
        ))}
      </div>
      {[0,1].map(i=>(<div key={i} style={{position:'absolute',width:130,height:130,borderRadius:'50%',border:'1.5px solid rgba(249,115,22,0.35)',animation:`ldRing 2.2s ease-out ${i*1.1}s infinite`}}/>))}
      <div style={{position:'relative',width:92,height:92,marginBottom:30}}>
        <svg width="92" height="92" viewBox="0 0 92 92" style={{position:'absolute',inset:0,animation:'ldSpin 1.9s linear infinite'}}>
          <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"/>
          <circle cx="46" cy="46" r="40" fill="none" stroke="url(#lg1)" strokeWidth="2.5" strokeDasharray={`${2*Math.PI*40*progress/100} ${2*Math.PI*40}`} strokeLinecap="round" style={{transformOrigin:'46px 46px'}}/>
          <defs><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#c84b11"/></linearGradient></defs>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',animation:'ldBounce 1.7s ease-in-out infinite,ldGlow 1.7s ease-in-out infinite'}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        </div>
      </div>
      <div style={{animation:'ldFadeUp 0.55s ease 0.15s both',textAlign:'center',marginBottom:5}}>
        <span style={{fontSize:30,fontWeight:900,letterSpacing:'-0.03em',color:'#fff',fontFamily:'system-ui,sans-serif'}}>
          Bag<span style={{background:'linear-gradient(135deg,#f97316,#c84b11)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Search</span>
        </span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:38,animation:'ldFadeUp 0.55s ease 0.3s both'}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Loading BagSearch experience</span>
        <span style={{display:'flex',gap:3}}>{[0,1,2].map(i=>(<span key={i} style={{width:4,height:4,borderRadius:'50%',background:'#f97316',display:'inline-block',animation:`ldDot 1.3s ease-in-out ${i*0.18}s infinite`}}/>))}</span>
      </div>
      <div style={{width:'min(260px,60vw)',animation:'ldFadeUp 0.55s ease 0.45s both'}}>
        <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:9999,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:9999,width:`${progress}%`,background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c,#f97316,#c84b11)',backgroundSize:'200% auto',animation:'ldShimmer 1.5s linear infinite',transition:'width 0.08s ease',boxShadow:'0 0 14px rgba(249,115,22,0.7)'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:10,fontWeight:700,letterSpacing:'0.08em'}}>
          <span style={{color:'rgba(255,255,255,0.25)'}}>BagSearch</span>
          <span style={{color:'#f97316'}}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─── Static Data ──────────────────────────────────────────────────────────────
const NIGERIAN_LOCATIONS = [
  {id:'all',name:'All Nigeria',emoji:'🇳🇬',state:''},{id:'lagos-island',name:'Lagos Island',emoji:'🏙️',state:'Lagos'},
  {id:'lagos-mainland',name:'Lagos Mainland',emoji:'🌆',state:'Lagos'},{id:'victoria-island',name:'Victoria Island',emoji:'💎',state:'Lagos'},
  {id:'lekki',name:'Lekki',emoji:'🌴',state:'Lagos'},{id:'ikeja',name:'Ikeja',emoji:'✈️',state:'Lagos'},
  {id:'abuja',name:'Abuja',emoji:'🏛️',state:'FCT'},{id:'wuse',name:'Wuse',emoji:'🏢',state:'FCT'},
  {id:'kano',name:'Kano',emoji:'🌅',state:'Kano'},{id:'ibadan',name:'Ibadan',emoji:'🌇',state:'Oyo'},
  {id:'port-harcourt',name:'Port Harcourt',emoji:'⚓',state:'Rivers'},{id:'enugu',name:'Enugu',emoji:'⛰️',state:'Enugu'},
  {id:'benin-city',name:'Benin City',emoji:'👑',state:'Edo'},{id:'calabar',name:'Calabar',emoji:'🌿',state:'Cross River'},
  {id:'warri',name:'Warri',emoji:'🛢️',state:'Delta'},{id:'aba',name:'Aba',emoji:'👜',state:'Abia'},
  {id:'onitsha',name:'Onitsha',emoji:'🛒',state:'Anambra'},
];

const CATEGORIES = [
  {id:'all',label:'All Bags',icon:'👜',color:C.primary,bg:C.primaryBg,border:C.primaryBorder},
  {id:'tote',label:'Tote Bags',icon:'🛍️',color:'#b45309',bg:'#fef3c7',border:'#fde68a'},
  {id:'clutch',label:'Clutches',icon:'💼',color:'#9a3412',bg:'#ffedd5',border:'#fed7aa'},
  {id:'crossbody',label:'Crossbody',icon:'👝',color:'#c2410c',bg:'#fff7ed',border:'#fed7aa'},
  {id:'backpack',label:'Backpacks',icon:'🎒',color:'#92400e',bg:'#fffbeb',border:'#fde68a'},
  {id:'satchel',label:'Satchels',icon:'🗂️',color:'#c84b11',bg:'#fde8d8',border:'#f9c4a0'},
  {id:'evening',label:'Evening',icon:'✨',color:'#be185d',bg:'#fdf2f8',border:'#fbcfe8'},
  {id:'mini',label:'Mini Bags',icon:'💛',color:'#a16207',bg:'#fefce8',border:'#fef08a'},
];

const mockProducts = [
  {id:1,name:"The Midnight Satchel",seller:"Luxury Bags Co.",sellerId:'vendor-1',sub:"Italian Leather • Midnight Blue",price:2450,quantity:12,lowStock:false,category:'satchel',location:'victoria-island',colors:["#1a1a2e","#16213e","#0f3460"],src:"https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8"},
  {id:2,name:"Ivory Essential Tote",seller:"Eco Style Hub",sellerId:'vendor-2',sub:"Sustainable Vegan Leather • Ivory",price:1800,quantity:3,lowStock:true,category:'tote',location:'lekki',colors:["#f5f0e8","#e8ddd0","#d4c5b0"],src:"https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo"},
  {id:3,name:"Azure Mini Crossbody",seller:"Trendy Fashion Hub",sellerId:'vendor-3',sub:"Napa Leather • Azure Blue",price:1250,quantity:8,lowStock:false,category:'crossbody',location:'ikeja',colors:["#4a90d9","#357abd","#2868a8"],src:"https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk"},
  {id:4,name:"Onyx Evening Clutch",seller:"Elite Accessories",sellerId:'vendor-1',sub:"Polished Suede • Onyx Black",price:3100,quantity:2,lowStock:true,category:'evening',location:'abuja',colors:["#1a1a1a","#333333","#4d4d4d"],src:"https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E"},
  {id:5,name:"Crimson Structured Bag",seller:"Premium Leather Co.",sellerId:'vendor-4',sub:"Premium Leather • Red",price:3200,quantity:6,lowStock:false,category:'clutch',location:'lagos-island',colors:["#c0392b","#e74c3c","#922b21"],src:"https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8"},
];

const mockVendors = [
  {id:'vendor-1',name:'Luxury Bags Co.',avatar:'👜',location:'victoria-island',rating:4.9,reviews:312,views:18420,products:47,joined:'Mar 2021',specialty:'Italian Leather',badge:'Top Rated',description:'Premium Italian leather bags crafted for the discerning buyer. Every piece is hand-stitched and comes with a certificate of authenticity.',tags:['Luxury','Leather','Italian'],colors:['#c84b11','#f97316']},
  {id:'vendor-2',name:'Eco Style Hub',avatar:'🌿',location:'lekki',rating:4.7,reviews:189,views:9870,products:28,joined:'Aug 2022',specialty:'Sustainable Fashion',badge:'',description:'Sustainable and vegan leather alternatives. All products are cruelty-free and eco-conscious.',tags:['Vegan','Eco','Sustainable'],colors:['#92400e','#b45309']},
  {id:'vendor-3',name:'Trendy Fashion Hub',avatar:'✨',location:'ikeja',rating:4.5,reviews:94,views:5630,products:61,joined:'Jan 2023',specialty:'Everyday Fashion',badge:'',description:'Trendy bags for everyday wear. Affordable luxury for the modern Nigerian woman.',tags:['Trendy','Everyday','Affordable'],colors:['#c2410c','#ea580c']},
  {id:'vendor-4',name:'Premium Leather Co.',avatar:'🏆',location:'lagos-island',rating:4.8,reviews:227,views:14200,products:33,joined:'Jun 2020',specialty:'Premium Leather',badge:'Top Rated',description:'Lagos finest leather craftsmen. Premium hides sourced from Europe, tailored by Nigerian artisans.',tags:['Artisan','Premium','Crafted'],colors:['#c84b11','#f97316']},
  {id:'vendor-5',name:'Elite Accessories',avatar:'💎',location:'abuja',rating:4.6,reviews:156,views:7340,products:19,joined:'Oct 2021',specialty:'Evening & Clutches',badge:'Top Rated',description:'Specialising in high-end evening bags and clutches for events, galas and corporate functions in Abuja.',tags:['Evening','Clutch','Formal'],colors:['#9a3412','#c84b11']},
];

const CURRENCY_SYMBOL = '₦';
const FREE_DELIVERY_THRESHOLD = 2000;
const formatCurrency = (value, options = {}) => {
  const normalized = Number(value ?? 0);
  return `${CURRENCY_SYMBOL}${normalized.toLocaleString(undefined, { maximumFractionDigits: 0, ...options })}`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Icon = ({name,size=22}) => <span style={{fontFamily:"'Material Symbols Outlined'",fontWeight:"normal",fontStyle:"normal",fontSize:size,lineHeight:1,display:"inline-block",textTransform:"none",letterSpacing:"normal",wordWrap:"normal",whiteSpace:"nowrap",direction:"ltr"}}>{name}</span>;

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(phrases, { typeSpeed = 80, deleteSpeed = 45, pauseMs = 1800, startDelay = 600 } = {}) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    const current = phrases[phraseIdx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, typeSpeed + Math.random() * 30);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      }, deleteSpeed);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }
  }, [started, charIdx, deleting, phraseIdx, phrases, typeSpeed, deleteSpeed, pauseMs]);

  return displayed;
}

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
            <button onClick={() => { onClose(); navigate("/login?force=true"); }} style={{ width: "100%", padding: "12px 0", background: "#FFF5F2", color: "#C94B2C", fontWeight: 700, fontSize: 13, border: "1px solid #F0C8BB", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F9DDD0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F2"; }}>
              Already a member? Sign In
            </button>
          </div>
        </div>
        <div style={{ padding: "12px 36px", borderTop: "1px solid #F5EAE5", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#FDFAFA" }}>
          <div style={{ color: "#C94B2C" }}><LogoIcon /></div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#1A0A00", letterSpacing: "-0.02em" }}>Bag<span style={{ color: "#C94B2C" }}>Search</span></span>
        </div>
      </div>
      <style>{`@keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

function useScrollReveal(t=0.08){const ref=useRef(null);const[v,setV]=useState(false);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect();}},{threshold:t});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[t]);return[ref,v];}

function AnimatedCount({value}){const[n,setN]=useState(0);const ref=useRef(null);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){let s=0;const timer=setInterval(()=>{s+=Math.ceil(value/55);if(s>=value){setN(value);clearInterval(timer);}else setN(s);},20);o.disconnect();}},{threshold:0.2});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[value]);return <span ref={ref}>{n.toLocaleString()}</span>;}

const StarRating=({rating,size=12})=>(<div style={{display:'flex',gap:1}}>{[1,2,3,4,5].map(i=>(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=Math.floor(rating)?'#f97316':'#f0d9cc'}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>))}</div>);

// ─── Location Modal ───────────────────────────────────────────────────────────
function LocationModal({isOpen,onClose,selectedLocation,onSelect}){
  const[search,setSearch]=useState('');
  if(!isOpen)return null;
  const filtered=NIGERIAN_LOCATIONS.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.state.toLowerCase().includes(search.toLowerCase()));
  const grouped=filtered.reduce((a,loc)=>{const k=loc.state||'All';if(!a[k])a[k]=[];a[k].push(loc);return a;},{});
  return(<><div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.5)',zIndex:200,backdropFilter:'blur(4px)'}}/>
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(480px,92vw)',maxHeight:'75vh',background:'white',borderRadius:24,overflow:'hidden',boxShadow:`0 32px 80px rgba(200,75,17,0.2)`,display:'flex',flexDirection:'column',animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both'}}>
      <div style={{padding:'24px 24px 18px',borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div><h3 style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:3}}>📍 Choose Location</h3><p style={{fontSize:12,color:C.textFaint,fontWeight:500}}>Shop from sellers near you</p></div>
          <button onClick={onClose} style={{width:36,height:36,borderRadius:'50%',border:'none',background:C.primaryBg,cursor:'pointer',fontSize:16,color:C.primary}}>✕</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,background:C.surfaceDim,border:`1.5px solid ${C.border}`,borderRadius:12,padding:'10px 14px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city…" autoFocus style={{flex:1,border:'none',background:'transparent',fontSize:13,color:C.text,fontFamily:'inherit',fontWeight:500,outline:'none'}}/>
        </div>
      </div>
      <div style={{overflowY:'auto',flex:1,padding:'12px 16px 20px'}}>
        {Object.entries(grouped).map(([state,locs])=>(<div key={state} style={{marginBottom:8}}>
          {state!=='All'&&<p style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:C.textFaint,padding:'8px 8px 4px'}}>{state}</p>}
          {locs.map(loc=>{const isSel=selectedLocation.id===loc.id;return(
            <button key={loc.id} onClick={()=>{onSelect(loc);onClose();}} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:'none',background:isSel?C.primaryBg:'transparent',cursor:'pointer',textAlign:'left',transition:'all 0.18s'}}>
              <span style={{fontSize:18}}>{loc.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:isSel?800:600,color:isSel?C.primary:C.text}}>{loc.name}</div>{loc.state&&<div style={{fontSize:11,color:C.textFaint,fontWeight:500}}>{loc.state} State</div>}</div>
              {isSel&&<div style={{width:20,height:20,borderRadius:'50%',background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>}
            </button>);})}
        </div>))}
      </div>
    </div></>);
}

// ─── Category Pill ────────────────────────────────────────────────────────────
function CategoryPill({cat,isActive,onClick,index,count}){
  const[hov,setHov]=useState(false);
  return(<button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:100,border:`1.5px solid ${isActive?cat.color:hov?cat.border:C.border}`,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,background:isActive?cat.color:hov?cat.bg:'white',boxShadow:isActive?`0 6px 18px ${cat.color}44`:hov?`0 4px 14px ${cat.color}22`:'0 1px 4px rgba(0,0,0,0.04)',transform:isActive?'translateY(-2px) scale(1.03)':hov?'translateY(-1px)':'none',transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',animation:`catIn 0.45s cubic-bezier(0.22,1,0.36,1) ${index*50}ms both`,position:'relative',overflow:'hidden'}}>
    {isActive&&<div style={{position:'absolute',inset:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)',animation:'shimCat 2s ease-in-out infinite',pointerEvents:'none'}}/>}
    <span style={{fontSize:16,transform:(isActive||hov)?'scale(1.2) rotate(-5deg)':'scale(1)',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',display:'inline-block'}}>{cat.icon}</span>
    <span style={{fontSize:13,fontWeight:isActive?800:600,color:isActive?'white':hov?cat.color:C.textMid}}>{cat.label}</span>
    {count>0&&<span style={{fontSize:10,fontWeight:800,background:isActive?'rgba(255,255,255,0.25)':cat.bg,color:isActive?'white':cat.color,border:`1px solid ${isActive?'rgba(255,255,255,0.3)':cat.border}`,padding:'1px 6px',borderRadius:20}}>{count}</span>}
  </button>);
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({product,index,navigate,onAddToCart,isAuthed,onRequireAuth}){
  const[ref,vis]=useScrollReveal();
  const[hov,setHov]=useState(false);
  const[added,setAdded]=useState(false);
  const loc=NIGERIAN_LOCATIONS.find(l=>l.id===product.location);
  const handleCart=(e)=>{e.stopPropagation();setAdded(true);onAddToCart(product);setTimeout(()=>setAdded(false),1800);};
  return(
    <div ref={ref} onClick={()=>navigate(`/products/${product.id}`)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'white',borderRadius:18,overflow:'hidden',border:`1.5px solid ${hov?C.primaryBorder:C.borderLight}`,cursor:'pointer',position:'relative',opacity:vis?1:0,transform:vis?'translateY(0) scale(1)':'translateY(28px) scale(0.97)',transition:`opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%4)*80}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%4)*80}ms,box-shadow 0.3s,border-color 0.3s`,boxShadow:hov?`0 20px 50px rgba(200,75,17,0.12),0 4px 16px rgba(0,0,0,0.05)`:'0 2px 10px rgba(0,0,0,0.04)'}}>
      <div style={{position:'relative',overflow:'hidden',aspectRatio:'4/3',background:C.primaryBg}}>
        <img src={product.src} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',transform:hov?'scale(1.07)':'scale(1)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 55%,rgba(26,10,0,0.3) 100%)',opacity:hov?1:0,transition:'opacity 0.4s'}}/>
        {product.lowStock&&<span style={{position:'absolute',top:10,left:10,background:'#dc2626',color:'white',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',padding:'4px 10px',borderRadius:20,boxShadow:'0 2px 8px rgba(220,38,38,0.4)',animation:'pulseBadge 2s ease-in-out infinite'}}>Low Stock</span>}
        {loc&&<span style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(8px)',color:C.textMid,fontSize:10,fontWeight:700,padding:'4px 9px',borderRadius:20,display:'flex',alignItems:'center',gap:4,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>{loc.emoji} {loc.name}</span>}
        <div style={{position:'absolute',bottom:10,left:'50%',transform:hov?'translateX(-50%) translateY(0)':'translateX(-50%) translateY(12px)',opacity:hov?1:0,transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',background:'rgba(26,10,0,0.75)',backdropFilter:'blur(8px)',color:'white',fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',padding:'5px 16px',borderRadius:20,whiteSpace:'nowrap',pointerEvents:'none'}}>Quick View</div>
      </div>
      <div style={{padding:'15px 15px 13px'}}>
        <h3 style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:2,lineHeight:1.3}}>{product.name}</h3>
        <p style={{fontSize:12,color:C.textFaint,marginBottom:12,fontWeight:500}}>{product.seller}</p>
        <div style={{display:'flex',gap:5,marginBottom:12}}>{product.colors.map((col,i)=>(<span key={i} style={{width:16,height:16,borderRadius:'50%',background:col,border:'2px solid white',outline:`1px solid ${C.border}`,display:'inline-block',transition:'transform 0.2s',transform:hov?'scale(1.15)':'scale(1)',transitionDelay:`${i*30}ms`}}/>))}</div>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12}}>
          <div><p style={{fontSize:10,color:C.textFaint,marginBottom:1,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Stock</p><p style={{fontSize:13,fontWeight:700,color:C.textMid}}>{product.quantity} units</p></div>
          <p style={{fontSize:21,fontWeight:900,color:hov?C.primary:C.accent,letterSpacing:'-0.03em',transition:'color 0.2s'}}>{formatCurrency(product.price)}</p>
        </div>
        <div style={{display:'flex',gap:7}}>
          <button onClick={handleCart} style={{flex:1,padding:'10px 0',borderRadius:10,border:'none',cursor:'pointer',fontWeight:800,fontSize:12,background:added?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:added?'0 4px 14px rgba(22,163,74,0.4)':'0 4px 12px rgba(200,75,17,0.35)',transform:added?'scale(0.96)':'scale(1)',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            {added?<><svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Added!</>
            :<><svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>Add to Cart</>}
          </button>
          <a href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={e=>{ if(!isAuthed){ e.preventDefault(); e.stopPropagation(); onRequireAuth && onRequireAuth(); } else { e.stopPropagation(); } }}
            style={{width:40,borderRadius:10,background:C.successBg,color:C.success,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.25s',textDecoration:'none',flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background='#22c55e';e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background=C.successBg;e.currentTarget.style.color=C.success;}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Product Card (for listing sections) ──────────────────────────────
function CompactProductCard({ product, navigate, onAddToCart, isAuthed, onRequireAuth, badge, badgeColor }) {
  const [hov, setHov] = useState(false);
  const [added, setAdded] = useState(false);
  const handleCart = (e) => { e.stopPropagation(); setAdded(true); onAddToCart(product); setTimeout(() => setAdded(false), 1800); };
  return (
    <div onClick={() => navigate(`/products/${product.id}`)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${hov ? C.primaryBorder : C.borderLight}`, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', boxShadow: hov ? `0 16px 40px rgba(200,75,17,0.13)` : '0 2px 8px rgba(0,0,0,0.04)', transform: hov ? 'translateY(-4px)' : 'none', flexShrink: 0, width: 200 }}>
      <div style={{ position: 'relative', overflow: 'hidden', height: 150, background: C.primaryBg }}>
        <img src={product.src} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease', transform: hov ? 'scale(1.08)' : 'scale(1)' }} />
        {badge && <span style={{ position: 'absolute', top: 8, left: 8, background: badgeColor || C.primary, color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 20 }}>{badge}</span>}
      </div>
      <div style={{ padding: '11px 12px' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
        <p style={{ fontSize: 10, color: C.textFaint, marginBottom: 8, fontWeight: 500 }}>{product.seller}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.primary }}>{formatCurrency(product.price)}</span>
          <button onClick={handleCart} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: added ? '#16a34a' : C.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', transform: added ? 'scale(0.9)' : 'scale(1)' }}>
            {added ? <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal Scroll Section ────────────────────────────────────────────────
function HorizontalSection({ title, subtitle, icon, accentColor, accentBg, products, navigate, onAddToCart, isAuthed, onRequireAuth, badge, badgeColor, onSeeAll }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [ref, vis] = useScrollReveal(0.05);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 430, behavior: 'smooth' });
  };

  return (
    <div ref={ref} style={{ marginBottom: 48, opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: `1.5px solid ${accentColor}33` }}>{icon}</div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', marginBottom: 1 }}>{title}</h3>
            <p style={{ fontSize: 12, color: C.textFaint, fontWeight: 500 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[{ dir: -1, can: canLeft }, { dir: 1, can: canRight }].map(({ dir, can }) => (
            <button key={dir} onClick={() => scroll(dir)} style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${can ? accentColor : C.border}`, background: can ? accentBg : 'white', color: can ? accentColor : C.textFaint, cursor: can ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: can ? 1 : 0.4 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={dir === -1 ? 'M15.75 19.5L8.25 12l7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'} /></svg>
            </button>
          ))}
          <button onClick={onSeeAll} style={{ fontSize: 12, fontWeight: 800, color: accentColor, background: accentBg, border: `1.5px solid ${accentColor}33`, padding: '7px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = accentBg; e.currentTarget.style.color = accentColor; }}>
            See All →
          </button>
        </div>
      </div>
      {/* Scroll track */}
      <div ref={scrollRef} onScroll={checkScroll} style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, paddingTop: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="hide-scrollbar">
        {products.map((p, i) => (
          <CompactProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart} isAuthed={isAuthed} onRequireAuth={onRequireAuth} badge={badge} badgeColor={badgeColor} />
        ))}
      </div>
    </div>
  );
}

// ─── Deal of the Day ──────────────────────────────────────────────────────────
function DealOfTheDay({ product, navigate, onAddToCart, isAuthed, onRequireAuth }) {
  const [ref, vis] = useScrollReveal(0.05);
  const [hov, setHov] = useState(false);
  const [added, setAdded] = useState(false);
  // countdown to midnight
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight - now) / 1000));
      setTimeLeft({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, []);
  const pad = n => String(n).padStart(2, '0');
  const handleCart = (e) => { e.stopPropagation(); setAdded(true); onAddToCart(product); setTimeout(() => setAdded(false), 1800); };
  if (!product) return null;
  return (
    <div ref={ref} style={{ marginBottom: 48, opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1.5px solid #fecaca' }}>🔥</div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', marginBottom: 1 }}>Deal of the Day</h3>
          <p style={{ fontSize: 12, color: C.textFaint, fontWeight: 500 }}>Exclusive limited-time offer — don't miss out</p>
        </div>
        {/* Countdown */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: C.danger, fontWeight: 700 }}>Ends in</span>
          {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
            <span key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ background: C.danger, color: 'white', fontWeight: 900, fontSize: 14, borderRadius: 7, padding: '4px 8px', minWidth: 34, textAlign: 'center', letterSpacing: '-0.02em', boxShadow: '0 2px 8px rgba(220,38,38,0.3)', fontVariantNumeric: 'tabular-nums' }}>{pad(v)}</span>
              {i < 2 && <span style={{ fontSize: 14, fontWeight: 900, color: C.danger, margin: '0 2px', lineHeight: 1 }}>:</span>}
            </span>
          ))}
        </div>
      </div>
      {/* Card */}
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: 'linear-gradient(135deg, #fff5f2 0%, #fff 60%)', border: `2px solid ${hov ? C.primary : '#fcd4be'}`, borderRadius: 22, overflow: 'hidden', display: 'flex', gap: 0, boxShadow: hov ? '0 24px 60px rgba(200,75,17,0.14)' : '0 6px 24px rgba(200,75,17,0.08)', transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)', cursor: 'pointer' }}
        onClick={() => navigate(`/products/${product.id}`)}>
        <div style={{ width: '42%', minWidth: 180, position: 'relative', overflow: 'hidden', background: C.primaryBg }}>
          <img src={product.src} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease', transform: hov ? 'scale(1.06)' : 'scale(1)', minHeight: 220 }} />
          <div style={{ position: 'absolute', top: 14, left: 14, background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em', boxShadow: '0 3px 10px rgba(220,38,38,0.4)', animation: 'pulseBadge 2s ease-in-out infinite' }}>🔥 HOT DEAL</div>
        </div>
        <div style={{ flex: 1, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.primary, marginBottom: 8 }}>{product.seller}</p>
          <h4 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>{product.name}</h4>
          <p style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, lineHeight: 1.6, marginBottom: 18 }}>{product.sub}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: C.primary, letterSpacing: '-0.04em' }}>{formatCurrency(product.price)}</span>
            <span style={{ fontSize: 18, color: C.textFaint, textDecoration: 'line-through', fontWeight: 600 }}>{formatCurrency(Math.round(product.price * 1.3))}</span>
            <span style={{ background: '#fef2f2', color: C.danger, fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: '1px solid #fecaca' }}>-23% OFF</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCart} style={{ flex: 1, maxWidth: 200, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, background: added ? 'linear-gradient(135deg,#15803d,#16a34a)' : 'linear-gradient(135deg,#c84b11,#f97316)', color: 'white', transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: added ? '0 4px 16px rgba(22,163,74,0.4)' : '0 6px 20px rgba(200,75,17,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {added ? <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Added!</> : <>🛍️ Grab This Deal</>}
            </button>
            <a href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20interested%20in%20the%20deal%20for%20${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer"
              onClick={e => { if (!isAuthed) { e.preventDefault(); e.stopPropagation(); onRequireAuth && onRequireAuth(); } else { e.stopPropagation(); } }}
              style={{ width: 46, borderRadius: 12, background: C.successBg, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.25s', textDecoration: 'none', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#22c55e'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.successBg; e.currentTarget.style.color = C.success; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </a>
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: C.textFaint, fontWeight: 600 }}>⚡ Only {product.quantity} left · Free delivery over ₦{FREE_DELIVERY_THRESHOLD.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────
function VendorCard({vendor,index,onViewProducts}){
  const[hov,setHov]=useState(false);const[ref,setRef]=useState(null);const[vis,setVis]=useState(false);
  useEffect(()=>{if(!ref)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVis(true);o.disconnect();}},{threshold:0.08});o.observe(ref);return()=>o.disconnect();},[ref]);
  const loc=NIGERIAN_LOCATIONS.find(l=>l.id===vendor.location);
  return(
    <div ref={setRef} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'white',borderRadius:20,overflow:'hidden',position:'relative',border:`1.5px solid ${hov?C.primaryBorder:C.borderLight}`,boxShadow:hov?`0 24px 60px rgba(200,75,17,0.13),0 4px 16px rgba(0,0,0,0.05)`:'0 2px 10px rgba(0,0,0,0.04)',opacity:vis?1:0,transform:vis?'translateY(0) scale(1)':'translateY(28px) scale(0.97)',transition:`opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%3)*100}ms,transform 0.55s cubic-bezier(0.22,1,0.36,1) ${(index%3)*100}ms,box-shadow 0.3s,border-color 0.3s`}}>
      <div style={{height:84,background:`linear-gradient(135deg,${vendor.colors[0]},${vendor.colors[1]})`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.1,backgroundImage:'radial-gradient(circle at 20% 50%,white 1px,transparent 1px)',backgroundSize:'22px 22px'}}/>
        <div style={{position:'absolute',right:-18,top:-18,width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,0.1)',filter:'blur(6px)'}}/>
        {vendor.badge==='Top Rated'&&<div style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.22)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.35)',borderRadius:20,padding:'3px 10px',fontSize:10,fontWeight:800,color:'white',letterSpacing:'0.05em',display:'flex',alignItems:'center',gap:4}}>⭐ Top Rated</div>}
      </div>
      <div style={{position:'absolute',top:50,left:18,width:60,height:60,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 4px 14px rgba(0,0,0,0.1)',border:'3px solid white',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',transform:hov?'scale(1.1)':'scale(1)'}}>{vendor.avatar}</div>
      <div style={{padding:'12px 18px 18px',paddingTop:20}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6,marginTop:16}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:900,color:C.text,letterSpacing:'-0.02em',marginBottom:2}}>{vendor.name}</h3>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:11}}>{loc?.emoji}</span><span style={{fontSize:11,color:C.textFaint,fontWeight:500}}>{loc?.name}</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:C.border,display:'inline-block'}}/>
              <span style={{fontSize:11,color:C.textFaint,fontWeight:500}}>Since {vendor.joined}</span>
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}><StarRating rating={vendor.rating} size={11}/><div style={{fontSize:13,fontWeight:900,color:C.primary,marginTop:3}}>{vendor.rating}</div></div>
        </div>
        <p style={{fontSize:12,color:C.textMuted,lineHeight:1.65,marginBottom:13,fontWeight:500,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{vendor.description}</p>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
          {vendor.tags.map(tag=>(<span key={tag} style={{fontSize:10,fontWeight:700,background:C.primaryBg,color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'3px 9px',borderRadius:20}}>{tag}</span>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:15}}>
          {[{label:'Views',value:vendor.views,icon:'👁️'},{label:'Reviews',value:vendor.reviews,icon:'⭐'},{label:'Products',value:vendor.products,icon:'👜'}].map(s=>(
            <div key={s.label} style={{background:C.surfaceDim,borderRadius:11,padding:'9px 6px',textAlign:'center',border:`1px solid ${C.borderLight}`,transition:'all 0.25s',transform:hov?'translateY(-2px)':'none',boxShadow:hov?`0 4px 10px rgba(200,75,17,0.1)`:'none'}}>
              <div style={{fontSize:14,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:13,fontWeight:900,color:C.text,letterSpacing:'-0.02em',lineHeight:1}}><AnimatedCount value={s.value}/></div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.textFaint,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>onViewProducts(vendor)} style={{width:'100%',padding:'11px 0',borderRadius:12,border:'none',background:hov?`linear-gradient(135deg,${vendor.colors[0]},${vendor.colors[1]})`:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontWeight:800,fontSize:13,cursor:'pointer',transition:'all 0.3s',boxShadow:hov?`0 8px 22px ${vendor.colors[0]}55`:'0 4px 12px rgba(200,75,17,0.3)',transform:hov?'translateY(-1px)':'none'}}>
          View Products →
        </button>
      </div>
    </div>
  );
}

// ─── Cart Item ────────────────────────────────────────────────────────────────
function CartItem({item,onUpdateQty,onRemove,index}){
  const[removing,setRemoving]=useState(false);const[vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),index*70);return()=>clearTimeout(t);},[index]);
  const handleRemove=()=>{setRemoving(true);setTimeout(()=>onRemove(item.id),420);};
  return(
    <div style={{display:'flex',gap:13,background:'white',borderRadius:16,padding:14,border:`1.5px solid ${C.borderLight}`,boxShadow:`0 2px 10px rgba(200,75,17,0.05)`,opacity:removing?0:vis?1:0,transform:removing?'translateX(60px) scale(0.9)':vis?'translateX(0) scale(1)':'translateX(-20px) scale(0.97)',transition:'all 0.4s cubic-bezier(0.22,1,0.36,1)',maxHeight:removing?0:130,overflow:'hidden'}}>
      <img src={item.src} alt={item.name} style={{width:72,height:72,objectFit:'cover',borderRadius:12,flexShrink:0,border:`1px solid ${C.borderLight}`}}/>
      <div style={{flex:1,minWidth:0}}>
        <h4 style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</h4>
        <p style={{fontSize:11,color:C.textFaint,marginBottom:8,fontWeight:500}}>{item.seller}</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',background:C.surfaceDim,borderRadius:10,border:`1.5px solid ${C.border}`,overflow:'hidden'}}>
            <button onClick={()=>item.qty>1?onUpdateQty(item.id,item.qty-1):handleRemove()} style={{width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>−</button>
            <span style={{width:28,textAlign:'center',fontSize:13,fontWeight:800,color:C.text}}>{item.qty}</span>
            <button onClick={()=>onUpdateQty(item.id,item.qty+1)} style={{width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background=C.primaryBg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>+</button>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:16,fontWeight:900,color:C.primary}}>{formatCurrency(item.price*item.qty)}</div>
            <button onClick={handleRemove} style={{fontSize:10,color:C.danger,fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:'2px 0'}}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Badge ───────────────────────────────────────────────────────────────
function CartBadge({count,onClick}){
  const[pop,setPop]=useState(false);const prev=useRef(count);
  useEffect(()=>{if(count>prev.current){setPop(true);setTimeout(()=>setPop(false),600);}prev.current=count;},[count]);
  return(
    <button onClick={onClick} style={{position:'relative',padding:'8px 10px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;}} onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;}}>
      <Icon name="shopping_cart" size={20}/>
      {count>0&&<div style={{position:'absolute',top:-6,right:-6,minWidth:20,height:20,background:'linear-gradient(135deg,#c84b11,#f97316)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'white',border:'2px solid white',boxShadow:'0 2px 8px rgba(200,75,17,0.45)',transform:pop?'scale(1.5)':'scale(1)',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>{count}</div>}
    </button>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({cartItems,onUpdateQty,onRemove,onClose}){
  const[checkingOut,setCheckingOut]=useState(false);const[checked,setChecked]=useState(false);
  const total=cartItems.reduce((a,i)=>a+i.price*i.qty,0);
  const itemCount=cartItems.reduce((a,i)=>a+i.qty,0);
  const delivery=total>=FREE_DELIVERY_THRESHOLD?0:15;const tax=total*0.075;const grand=total+delivery+tax;
  const handleCheckout=()=>{setCheckingOut(true);setTimeout(()=>{setCheckingOut(false);setChecked(true);},1800);setTimeout(()=>{setChecked(false);onClose();},3500);};
  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.55)',zIndex:300,backdropFilter:'blur(6px)',animation:'fadeIn 0.3s ease both'}}/>
      <div style={{position:'fixed',inset:0,zIndex:301,display:'flex',alignItems:'stretch',justifyContent:'flex-end'}}>
        <div style={{width:'min(520px,100vw)',background:`linear-gradient(180deg,${C.primaryPale} 0%,white 30%)`,display:'flex',flexDirection:'column',animation:'slideInRight 0.45s cubic-bezier(0.34,1.2,0.64,1) both',boxShadow:'-24px 0 80px rgba(200,75,17,0.15)',overflowY:'hidden'}}>
          <div style={{height:4,background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c,#f97316,#c84b11)',backgroundSize:'200% auto',animation:'meshFlow 3s ease-in-out infinite',flexShrink:0}}/>
          <div style={{background:C.primaryBg,padding:'26px 26px 22px',borderBottom:`1px solid ${C.primaryBorder}`,position:'relative',overflow:'hidden',flexShrink:0}}>
            <div style={{position:'absolute',right:-30,top:-30,width:160,height:160,borderRadius:'50%',background:'rgba(200,75,17,0.07)',filter:'blur(20px)'}}/>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',marginBottom:itemCount>0?16:0}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:50,height:50,borderRadius:16,background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 20px rgba(200,75,17,0.4)',fontSize:20}}>🛍️</div>
                <div>
                  <h2 style={{fontSize:21,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:2}}>Your Cart</h2>
                  <p style={{fontSize:13,color:C.textMuted,fontWeight:600}}>{itemCount} {itemCount===1?'item':'items'}{itemCount>0?` · ${formatCurrency(total)} subtotal`:''}</p>
                </div>
              </div>
              <button onClick={onClose} style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${C.primaryBorder}`,background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:C.primary,transition:'all 0.2s',flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color=C.primary;}}>✕</button>
            </div>
            {total>0&&total<FREE_DELIVERY_THRESHOLD&&<div style={{background:'white',borderRadius:12,padding:'11px 14px',border:`1px solid ${C.primaryBorder}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,color:C.primary,fontWeight:700}}>🚚 Add {formatCurrency(FREE_DELIVERY_THRESHOLD-total)} more for FREE delivery</span><span style={{fontSize:11,color:C.textFaint,fontWeight:600}}>{Math.round((total/FREE_DELIVERY_THRESHOLD)*100)}%</span></div>
              <div style={{height:7,background:C.primaryBg,borderRadius:99,overflow:'hidden',border:`1px solid ${C.primaryBorder}`}}><div style={{height:'100%',width:`${Math.min((total/FREE_DELIVERY_THRESHOLD)*100,100)}%`,background:'linear-gradient(90deg,#c84b11,#f97316)',borderRadius:99,transition:'width 0.7s ease',boxShadow:'0 0 10px rgba(200,75,17,0.5)'}}/></div>
            </div>}
            {total>=FREE_DELIVERY_THRESHOLD&&<div style={{background:'#dcfce7',borderRadius:12,padding:'10px 14px',border:'1px solid #a7f3d0',display:'flex',alignItems:'center',gap:8}}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#15803d"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span style={{fontSize:12,color:'#15803d',fontWeight:800}}>🎉 FREE delivery unlocked!</span>
            </div>}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
            {cartItems.length===0?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',paddingBottom:60,paddingTop:40}}>
                <div style={{fontSize:72,marginBottom:18,animation:'bagFloat 3s ease-in-out infinite'}}>🛍️</div>
                <h3 style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:8}}>Your cart is empty</h3>
                <p style={{fontSize:13,color:C.textMuted,textAlign:'center',fontWeight:500,lineHeight:1.7,maxWidth:260}}>Discover beautiful bags and add them here</p>
                <button onClick={onClose} style={{marginTop:22,padding:'13px 28px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:14,border:'none',cursor:'pointer',fontWeight:800,fontSize:14,boxShadow:'0 8px 24px rgba(200,75,17,0.35)'}}>Browse Bags</button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {cartItems.map((item,i)=>(<CartItem key={item.id} item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} index={i}/>))}
              </div>
            )}
          </div>
          {cartItems.length>0&&<div style={{padding:'18px 22px 28px',borderTop:`1px solid ${C.borderLight}`,background:'white',flexShrink:0}}>
            <div style={{background:C.surfaceDim,borderRadius:18,padding:'16px 18px',marginBottom:16,border:`1.5px solid ${C.borderLight}`}}>
              <p style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,marginBottom:11}}>Order Summary</p>
              {[{l:'Subtotal',v:formatCurrency(total)},{l:'Delivery',v:delivery===0?'FREE ✨':formatCurrency(delivery),g:delivery===0},{l:'Tax (7.5%)',v:formatCurrency(tax)}].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:13,color:C.textMuted,fontWeight:500}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:r.g?'#15803d':C.text}}>{r.v}</span></div>
              ))}
              <div style={{height:1,background:C.border,margin:'11px 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:16,fontWeight:900,color:C.text}}>Total</span>
                <span style={{fontSize:26,fontWeight:900,color:C.primary,letterSpacing:'-0.04em'}}>{formatCurrency(grand)}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <input placeholder="Promo code…" style={{flex:1,padding:'10px 13px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.surfaceDim,fontSize:13,color:C.text,fontFamily:'inherit',fontWeight:500,outline:'none'}} onFocus={e=>e.currentTarget.style.borderColor=C.primaryBorder} onBlur={e=>e.currentTarget.style.borderColor=C.border}/>
              <button style={{padding:'10px 16px',borderRadius:12,border:`1.5px solid ${C.primaryBorder}`,background:C.primaryBg,color:C.primary,fontWeight:800,fontSize:13,cursor:'pointer',transition:'all 0.2s',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.background=C.primary;e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.color=C.primary;}}>Apply</button>
            </div>
            <button onClick={handleCheckout} style={{width:'100%',padding:'16px 0',borderRadius:16,border:'none',cursor:'pointer',background:checked?'linear-gradient(135deg,#15803d,#16a34a)':checkingOut?'linear-gradient(135deg,#c84b11,#ea580c)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontWeight:900,fontSize:15,letterSpacing:'-0.01em',transition:'all 0.5s cubic-bezier(0.34,1.2,0.64,1)',boxShadow:checked?'0 8px 28px rgba(22,163,74,0.4)':'0 8px 28px rgba(200,75,17,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transform:checkingOut?'scale(0.97)':'scale(1)'}}>
              {checked?<><svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Order Placed! 🎉</>
                :checkingOut?<><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'white',animation:'ldSpin 0.7s linear infinite'}}/>Processing…</>
              :<>Place Order · {formatCurrency(grand)} <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg></>}
            </button>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginTop:14}}>
              {[{i:'🔒',l:'Secure'},{i:'🚚',l:'Fast Delivery'},{i:'↩️',l:'Easy Returns'}].map((b,idx)=>(
                <div key={b.l} style={{display:'flex',alignItems:'center',gap:5,padding:'0 12px',borderRight:idx<2?`1px solid ${C.border}`:'none'}}>
                  <span style={{fontSize:12}}>{b.i}</span><span style={{fontSize:10,color:C.textFaint,fontWeight:700}}>{b.l}</span>
                </div>
              ))}
            </div>
          </div>}
        </div>
      </div>
      <style>{`@keyframes bagFloat{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-14px) rotate(5deg)}} @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Product(){
  const location=useLocation();const navigate=useNavigate();const{user,logout}=useContext(AuthContext);
  const[pageLoading,setPageLoading]=useState(true);const handleLoaderDone=useCallback(()=>setPageLoading(false),[]);
  const fileInputRef=useRef(null);
  const[allProducts,setAllProducts]=useState(mockProducts);const[displayedProducts,setDisplayedProducts]=useState(mockProducts);
  const[isFiltered,setIsFiltered]=useState(false);const[searchQuery,setSearchQuery]=useState('');const[uploadedImage,setUploadedImage]=useState(null);
  const[visualSearching,setVisualSearching]=useState(false);
  const[isSidebarOpen,setIsSidebarOpen]=useState(false);const[searchFocused,setSearchFocused]=useState(false);
  const[headerVisible,setHeaderVisible]=useState(false);const[heroVisible,setHeroVisible]=useState(false);const[searchVisible,setSearchVisible]=useState(false);const[catVisible,setCatVisible]=useState(false);const[resultsKey,setResultsKey]=useState(0);
  const[activeCategory,setActiveCategory]=useState('all');const[selectedLocation,setSelectedLocation]=useState(NIGERIAN_LOCATIONS[0]);const[locationModalOpen,setLocationModalOpen]=useState(false);
  const[activeTab,setActiveTab]=useState('products');const[vendorSearch,setVendorSearch]=useState('');const[vendorSearchFocused,setVendorSearchFocused]=useState(false);const[filteredVendors,setFilteredVendors]=useState(mockVendors);const[selectedVendor,setSelectedVendor]=useState(null);
  const[cartItems,setCartItems]=useState([]);const[cartOpen,setCartOpen]=useState(false);const[floatMsg,setFloatMsg]=useState(null);const[authGateOpen,setAuthGateOpen]=useState(false);
  const cartCount=cartItems.reduce((a,i)=>a+i.qty,0);

  // ─── Typewriter for hero ───
  const HERO_PHRASES = ['Perfect Bag', 'Dream Clutch', 'Ideal Tote', 'Luxury Satchel', 'Everyday Crossbody'];
  const typedWord = useTypewriter(HERO_PHRASES, { typeSpeed: 85, deleteSpeed: 50, pauseMs: 2000, startDelay: 900 });

  useEffect(()=>{setTimeout(()=>setHeaderVisible(true),60);setTimeout(()=>setHeroVisible(true),180);setTimeout(()=>setSearchVisible(true),340);setTimeout(()=>setCatVisible(true),480);},[]);

  const mapCategory = useCallback((dbCat) => {
    if (!dbCat) return 'all';
    const c = dbCat.toLowerCase();
    if (c.includes('tote')) return 'tote';
    if (c.includes('clutch')) return 'clutch';
    if (c.includes('crossbody')) return 'crossbody';
    if (c.includes('backpack')) return 'backpack';
    if (c.includes('satchel')) return 'satchel';
    if (c.includes('evening')) return 'evening';
    if (c.includes('mini')) return 'mini';
    if (c.includes('handbag') || c.includes('shoulder')) return 'satchel';
    return 'all';
  }, []);

  const fetchProducts = useCallback(async (locationId = 'all') => {
    try {
      let query = supabase.from('products').select('*');
      if (locationId && locationId !== 'all') query = query.eq('location', locationId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      const fmt = (data || []).map(p => ({
        id: p.id, name: p.name, seller: p.seller_name || 'Anonymous Seller', sellerId: 'db',
        sub: `${p.brand} • ${p.condition}`, price: parseFloat(p.price), quantity: p.quantity || 0,
        lowStock: (p.quantity || 0) < 5, category: mapCategory(p.category), location: p.location || 'all',
        colors: p.colors || ["#c84b11", "#f97316"],
        src: p.images?.length > 0 ? p.images[0] : 'https://via.placeholder.com/400',
      }));
      return [...fmt, ...mockProducts];
    } catch (err) {
      console.error('Failed to load products', err);
      return [...mockProducts];
    }
  }, [mapCategory]);

  useEffect(() => {
    let isMounted = true;
    fetchProducts().then(combined => {
      if (!isMounted) return;
      setAllProducts(combined);
      setDisplayedProducts(combined);
    });
    return () => { isMounted = false; };
  }, [fetchProducts]);

  const applyFilters=useCallback((q,cat,loc,prods)=>{let r=[...prods];if(q.trim())r=r.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||(p.sub||'').toLowerCase().includes(q.toLowerCase())||(p.seller||'').toLowerCase().includes(q.toLowerCase()));if(cat!=='all')r=r.filter(p=>p.category===cat);if(loc.id!=='all')r=r.filter(p=>p.location===loc.id);return r;},[]);

  const handleSearch=q=>{setSearchQuery(q);setDisplayedProducts(applyFilters(q,activeCategory,selectedLocation,allProducts));setIsFiltered(!!q.trim()||activeCategory!=='all'||selectedLocation.id!=='all');setResultsKey(k=>k+1);};
  const handleCategoryChange=id=>{setActiveCategory(id);setDisplayedProducts(applyFilters(searchQuery,id,selectedLocation,allProducts));setIsFiltered(!!searchQuery.trim()||id!=='all'||selectedLocation.id!=='all');setResultsKey(k=>k+1);};
  const handleLocationChange=async loc=>{setSelectedLocation(loc);setIsFiltered(!!searchQuery.trim()||activeCategory!=='all'||loc.id!=='all');setResultsKey(k=>k+1);const combined=await fetchProducts(loc.id);setAllProducts(combined);setDisplayedProducts(applyFilters(searchQuery,activeCategory,loc,combined));};
  const handleClearSearch=async ()=>{setIsFiltered(false);setSearchQuery('');setUploadedImage(null);setActiveCategory('all');const defaultLocation=NIGERIAN_LOCATIONS[0];setSelectedLocation(defaultLocation);setSelectedVendor(null);setResultsKey(k=>k+1);const combined=await fetchProducts();setAllProducts(combined);setDisplayedProducts(combined);};
  const handleImageUpload=async e=>{
    const f=e.target.files[0];
    if(!f)return;
    setUploadedImage(URL.createObjectURL(f));
    setIsFiltered(true);
    setVisualSearching(true);
    setResultsKey(k=>k+1);
    try {
      const embedding = await generateImageEmbedding(f);
      const vector = await generateImageEmbedding(embedding);
      const matches = await queryPinecone(vector);
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        const filtered = allProducts.filter(p => matchIds.includes(String(p.id)));
        const sorted = matchIds.map(id => {
          const product = filtered.find(p => String(p.id) === id);
          const match = matches.find(m => m.id === id);
          return product ? {...product, score: match?.score || 0} : null;
        }).filter(Boolean).sort((a,b) => b.score - a.score);
        setDisplayedProducts(sorted);
        setFloatMsg({ text: `Found ${sorted.length} similar bags! 🎉`, type: 'success' });
      } else {
        setDisplayedProducts([]);
        setFloatMsg({ text: 'No similar bags found. Try another image!', type: 'info' });
      }
    } catch (err) {
      console.error('Visual search failed:', err);
      setFloatMsg({ text: 'Visual search temporarily unavailable.', type: 'danger' });
      setDisplayedProducts([]);
    } finally {
      setVisualSearching(false);
      e.target.value='';
    }
  };
  const handleVendorSearch=q=>{setVendorSearch(q);setFilteredVendors(mockVendors.filter(v=>v.name.toLowerCase().includes(q.toLowerCase())||v.specialty.toLowerCase().includes(q.toLowerCase())||v.tags.some(t=>t.toLowerCase().includes(q.toLowerCase()))));};
  const handleViewVendorProducts = (vendor) => { navigate('/seller-products', { state: { vendor } }); };
  const handleAddToCart=product=>{setCartItems(prev=>{const ex=prev.find(i=>i.id===product.id);if(ex)return prev.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i);return[...prev,{...product,qty:1}];});setFloatMsg({ text: `${product.name} added!`, type: 'success' });setTimeout(()=>setFloatMsg(null),2200);};
  const handleUpdateQty=(id,qty)=>setCartItems(prev=>prev.map(i=>i.id===id?{...i,qty}:i));
  const handleRemoveFromCart=id=>setCartItems(prev=>prev.filter(i=>i.id!==id));
  const handleProfileClick=()=>{
    if(!user){ setAuthGateOpen(true); return; }
    navigate(user?.user_metadata?.role==='seller'?'/seller-profile':'/profile');
  };
  useEffect(()=>{
    if(location.state?.openCart){
      setCartOpen(true);
      navigate('/products',{replace:true,state:{}});
    }
  },[location.state,navigate]);
  const handleLogout=async()=>{await logout();navigate('/login',{replace:true});};
  const getCategoryCount=id=>id==='all'?allProducts.length:allProducts.filter(p=>p.category===id).length;
  const categoriesWithCounts=CATEGORIES.map(c=>({...c,count:getCategoryCount(c.id)}));

  // Derived listing sections
  const featuredProducts = allProducts.slice(0, 8);
  const newArrivals = [...allProducts].reverse().slice(0, 8);
  const topDeals = allProducts.filter(p => p.price < 2000).slice(0, 8);
  const dealProduct = allProducts.find(p => p.lowStock) || allProducts[0];

  return(
    <div style={{minHeight:'100vh',background:`linear-gradient(180deg,${C.primaryPale} 0%,${C.surfaceDim} 25%,white 100%)`,fontFamily:"'Manrope',sans-serif"}}>
      <PageLoader onDone={handleLoaderDone}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes pulseBadge{0%,100%{box-shadow:0 2px 8px rgba(220,38,38,0.4)}50%{box-shadow:0 2px 18px rgba(220,38,38,0.7)}}
        @keyframes bounceIn{0%{opacity:0;transform:scale(0.7) translateY(20px)}60%{opacity:1;transform:scale(1.06) translateY(-4px)}100%{transform:scale(1) translateY(0)}}
        @keyframes catIn{from{opacity:0;transform:translateY(14px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimCat{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
        @keyframes locPing{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}
        @keyframes ldSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes floatUpMsg{0%{opacity:0;transform:translateX(-50%) translateY(20px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-16px)}}
        @keyframes meshFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes modalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.88)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes slideInPreview{from{opacity:0;transform:translateY(-10px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes twCursor{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes twWordIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .hide-scrollbar::-webkit-scrollbar{height:0;width:0;display:none;}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        .cat-track::-webkit-scrollbar{height:0;}.cat-track{-ms-overflow-style:none;scrollbar-width:none;}
        @media(max-width:768px){.desk-act{display:none!important;}.mob-menu{display:flex!important;}}
      `}</style>

      {floatMsg&&<div style={{position:'fixed',bottom:32,left:'50%',zIndex:9999,background:floatMsg.type==='danger'?'linear-gradient(135deg,#dc2626,#ef4444)':'linear-gradient(135deg,#c84b11,#f97316)',color:'white',padding:'12px 22px',borderRadius:50,fontSize:13,fontWeight:800,whiteSpace:'nowrap',boxShadow:floatMsg.type==='danger'?'0 12px 40px rgba(220,38,38,0.45)':'0 12px 40px rgba(200,75,17,0.45)',animation:'floatUpMsg 2.2s ease both',pointerEvents:'none',display:'flex',alignItems:'center',gap:8}}>
        {floatMsg.type==='danger'?<Icon name="error" size={16}/>:<svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
        {floatMsg.text}
      </div>}

      {cartOpen&&<CartPage cartItems={cartItems} onUpdateQty={handleUpdateQty} onRemove={handleRemoveFromCart} onClose={()=>setCartOpen(false)}/>}
      <AuthGateModal open={authGateOpen} onClose={()=>setAuthGateOpen(false)} navigate={navigate} />

      {/* HEADER */}
      <header style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${C.borderLight}`,opacity:headerVisible?1:0,transform:headerVisible?'translateY(0)':'translateY(-100%)',transition:'opacity 0.45s ease,transform 0.45s cubic-bezier(0.22,1,0.36,1)',boxShadow:`0 1px 20px rgba(200,75,17,0.07)`}}>
        <div style={{height:3,background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c,#f97316,#c84b11)',backgroundSize:'200% auto',animation:'meshFlow 4s ease-in-out infinite'}}/>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,gap:16}}>
          <button className="mob-menu" onClick={()=>setIsSidebarOpen(true)} style={{display:'none',padding:8,borderRadius:10,border:'none',background:'transparent',cursor:'pointer',color:C.textMid}}>
            <svg style={{width:22,height:22}} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
          </button>
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',flexShrink:0,color:C.primary}} onClick={()=>navigate('/')}>
            <LogoIcon size="clamp(34px, 5vw, 50px)" /><span style={{fontSize:20,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>Bag<span style={{color:C.primary}}>Search</span></span>
          </div>
          <button onClick={()=>setLocationModalOpen(true)} style={{flex:1,maxWidth:250,display:'flex',alignItems:'center',gap:8,padding:'7px 13px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',transition:'all 0.25s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.background=C.primaryBg;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surfaceDim;}}>
            <div style={{position:'relative',flexShrink:0,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'absolute',width:10,height:10,borderRadius:'50%',background:C.primary,opacity:0.28,animation:'locPing 1.8s ease-out infinite'}}/>
              <div style={{width:7,height:7,borderRadius:'50%',background:C.primary,position:'relative',zIndex:1}}/>
            </div>
            <div style={{flex:1,textAlign:'left',minWidth:0}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,lineHeight:1.2}}>Shopping from</div>
              <div style={{fontSize:13,fontWeight:800,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedLocation.emoji} {selectedLocation.name}</div>
            </div>
            <svg style={{width:13,height:13,color:C.textFaint,flexShrink:0}} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </button>
          <div className="desk-act" style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={handleProfileClick} style={{padding:'8px 10px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,display:'flex',alignItems:'center',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform='none';}}>
              <Icon name="person" size={20}/>
            </button>
            <CartBadge count={cartCount} onClick={()=>setCartOpen(true)}/>
            {user ? (
              <button onClick={handleLogout} style={{padding:'8px 16px',borderRadius:10,border:'1px solid #fecaca',background:'#fef2f2',cursor:'pointer',color:'#dc2626',fontSize:13,fontWeight:700,transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.transform='none';}}>Logout</button>
            ) : (
              <div style={{display:'flex',gap:8}}>
                <button onClick={() => navigate('/login')} style={{padding:'8px 16px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceDim,cursor:'pointer',color:C.textMid,fontSize:13,fontWeight:700,transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.primaryBg;e.currentTarget.style.borderColor=C.primaryBorder;}} onMouseLeave={e=>{e.currentTarget.style.background=C.surfaceDim;e.currentTarget.style.borderColor=C.border;}}>Login</button>
                <button onClick={() => navigate('/register')} style={{padding:'8px 16px',borderRadius:10,border:'none',background:C.primary,cursor:'pointer',color:'white',fontSize:13,fontWeight:700,transition:'all 0.2s',boxShadow:`0 4px 12px rgba(200,75,17,0.2)`}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 16px rgba(200,75,17,0.3)`;}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 4px 12px rgba(200,75,17,0.2)`;}}>Register</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div onClick={()=>setIsSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(26,10,0,0.45)',zIndex:60,opacity:isSidebarOpen?1:0,pointerEvents:isSidebarOpen?'all':'none',transition:'opacity 0.3s'}}/>
      <aside style={{position:'fixed',top:0,left:0,height:'100%',width:260,background:'white',zIndex:70,transform:isSidebarOpen?'translateX(0)':'translateX(-100%)',transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',boxShadow:`6px 0 32px rgba(200,75,17,0.1)`,display:'flex',flexDirection:'column',padding:'24px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:8,color:C.primary}}><LogoIcon size={32} /><span style={{fontWeight:900,fontSize:17,color:C.text}}>BagSearch</span></div>
          <button onClick={()=>setIsSidebarOpen(false)} style={{padding:8,borderRadius:9,border:'none',background:C.primaryBg,cursor:'pointer',color:C.primary,fontSize:16}}>✕</button>
        </div>
        {(user ? [
          {label:'Profile',icon:'person',action:()=>{handleProfileClick();setIsSidebarOpen(false);}},
          {label:'Cart',icon:'shopping_cart',action:()=>{setCartOpen(true);setIsSidebarOpen(false);}},
          {label:'Logout',icon:'logout',action:()=>{handleLogout();setIsSidebarOpen(false);}}
        ] : [
          {label:'Login',icon:'login',action:()=>{navigate('/login');setIsSidebarOpen(false);}},
          {label:'Register',icon:'person_add',action:()=>{navigate('/register');setIsSidebarOpen(false);}},
          {label:'Cart',icon:'shopping_cart',action:()=>{setCartOpen(true);setIsSidebarOpen(false);}}
        ]).map(({icon,label,action})=>(
          <button key={label} onClick={action} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:'none',background:label==='Logout'?'#fef2f2':'transparent',cursor:'pointer',color:label==='Logout'?C.danger:C.text,fontSize:15,fontWeight:600,marginBottom:4,textAlign:'left',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=label==='Logout'?C.dangerBg:C.primaryBg;e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.color=label==='Logout'?C.danger:C.primary;}} onMouseLeave={e=>{e.currentTarget.style.background=label==='Logout'?'#fef2f2':'transparent';e.currentTarget.style.transform='none';e.currentTarget.style.color=label==='Logout'?C.danger:C.text;}}>
            <Icon name={icon} size={20}/>{label}
          </button>
        ))}
      </aside>

      <LocationModal isOpen={locationModalOpen} onClose={()=>setLocationModalOpen(false)} selectedLocation={selectedLocation} onSelect={handleLocationChange}/>

      {/* MAIN */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'36px 20px 80px',opacity:pageLoading?0:1,transition:'opacity 0.5s ease'}}>

        {/* ── Hero banner with TYPEWRITER ── */}
        <div style={{marginBottom:30,opacity:heroVisible?1:0,transform:heroVisible?'translateY(0)':'translateY(20px)',transition:'opacity 0.55s ease,transform 0.55s cubic-bezier(0.22,1,0.36,1)'}}>
          <div style={{background:C.primaryBg,borderRadius:24,padding:'34px 38px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20,border:`1.5px solid ${C.primaryBorder}`,position:'relative',overflow:'hidden',boxShadow:`0 8px 32px rgba(200,75,17,0.1)`}}>
            <div style={{position:'absolute',right:-40,top:-40,width:200,height:200,borderRadius:'50%',background:'rgba(200,75,17,0.07)',filter:'blur(20px)'}}/>
            <div style={{position:'absolute',right:80,bottom:-30,width:130,height:130,borderRadius:'50%',background:'rgba(249,115,22,0.06)',filter:'blur(14px)'}}/>
            <div style={{position:'relative'}}>
              {/* ── TYPEWRITER H1 ── */}
              <h1 style={{fontSize:'clamp(1.7rem,4vw,2.4rem)',fontWeight:900,color:C.text,letterSpacing:'-0.04em',lineHeight:1.2,marginBottom:10}}>
                Find Your{' '}
                <br style={{display:'none'}} />
                <span style={{color:C.primary,display:'inline-flex',alignItems:'baseline',gap:0,minWidth:'10ch',position:'relative'}}>
                  <span key={typedWord} style={{animation:'twWordIn 0.15s ease both'}}>{typedWord}</span>
                  <span style={{display:'inline-block',width:'2px',height:'1em',background:C.primary,marginLeft:2,verticalAlign:'middle',animation:'twCursor 0.9s step-end infinite',borderRadius:1,flexShrink:0}}/>
                </span>
              </h1>
              <p style={{color:C.textMuted,fontSize:15,fontWeight:500,lineHeight:1.6,maxWidth:380}}>Search bags or browse vendors — discover luxury across Nigeria</p>
              {selectedLocation.id!=='all'&&<span style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:10,fontSize:12,fontWeight:700,background:'white',color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'4px 12px',borderRadius:20,animation:'scaleIn 0.3s ease both'}}>{selectedLocation.emoji} {selectedLocation.name}</span>}
            </div>
            <div style={{display:'flex',gap:12,position:'relative'}}>
              {['👜','👝','🛍️'].map((e,i)=>(<div key={i} style={{width:62,height:62,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:`0 4px 16px rgba(200,75,17,0.15)`,border:`2px solid ${C.primaryBorder}`,transform:`translateY(${i%2===0?0:-8}px)`}}>{e}</div>))}
            </div>
          </div>
        </div>

        {/* Tab + search */}
        <div style={{marginBottom:26,opacity:searchVisible?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{display:'inline-flex',background:'white',border:`1.5px solid ${C.border}`,borderRadius:16,padding:5,gap:4,boxShadow:`0 2px 10px rgba(200,75,17,0.07)`,marginBottom:16}}>
            {[{id:'products',label:'👜 Products',count:allProducts.length},{id:'vendors',label:'🏪 Vendors',count:mockVendors.length}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:'9px 18px',borderRadius:11,border:'none',cursor:'pointer',fontWeight:800,fontSize:13,transition:'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',background:activeTab===tab.id?'linear-gradient(135deg,#c84b11,#f97316)':'transparent',color:activeTab===tab.id?'white':C.textMuted,boxShadow:activeTab===tab.id?'0 4px 16px rgba(200,75,17,0.4)':'none',transform:activeTab===tab.id?'scale(1.02)':'scale(1)',display:'flex',alignItems:'center',gap:7}}>
                {tab.label}<span style={{fontSize:10,fontWeight:800,background:activeTab===tab.id?'rgba(255,255,255,0.25)':C.primaryBg,color:activeTab===tab.id?'white':C.primary,padding:'1px 7px',borderRadius:20,border:activeTab===tab.id?'1px solid rgba(255,255,255,0.3)':`1px solid ${C.primaryBorder}`}}>{tab.count}</span>
              </button>
            ))}
          </div>
          {activeTab==='products'?(
            <div style={{display:'flex',alignItems:'center',background:'white',border:`1.5px solid ${searchFocused?C.primary:C.border}`,borderRadius:16,padding:'12px 16px',gap:10,boxShadow:searchFocused?`0 0 0 4px rgba(200,75,17,0.1),0 4px 18px rgba(0,0,0,0.04)`:`0 2px 10px rgba(0,0,0,0.03)`,transition:'all 0.25s'}}>
              <svg style={{width:20,height:20,color:searchFocused?C.primary:C.textFaint,flexShrink:0,transition:'color 0.25s'}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
              <input type="text" placeholder="Search bags by name, material, or seller…" value={searchQuery} onChange={e=>handleSearch(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,color:C.text,fontFamily:'inherit',fontWeight:500}}/>
              {isFiltered&&<button onClick={handleClearSearch} style={{width:26,height:26,borderRadius:'50%',border:'none',background:C.primaryBg,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:C.primary,flexShrink:0}}>✕</button>}
              <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/>
              <button onClick={()=>fileInputRef.current.click()} style={{width:38,height:38,borderRadius:10,border:'none',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.2s',boxShadow:'0 4px 12px rgba(200,75,17,0.35)'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow='0 6px 18px rgba(200,75,17,0.5)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 12px rgba(200,75,17,0.35)';}}>
                <svg style={{width:16,height:16}} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
              </button>
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',background:'white',border:`1.5px solid ${vendorSearchFocused?C.primary:C.border}`,borderRadius:16,padding:'12px 16px',gap:10,boxShadow:vendorSearchFocused?`0 0 0 4px rgba(200,75,17,0.1),0 4px 18px rgba(0,0,0,0.04)`:`0 2px 10px rgba(0,0,0,0.03)`,transition:'all 0.3s'}}>
              <svg style={{width:20,height:20,color:vendorSearchFocused?C.primary:C.textFaint,flexShrink:0}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>
              <input type="text" placeholder="Search vendors by name, specialty or tag…" value={vendorSearch} onChange={e=>handleVendorSearch(e.target.value)} onFocus={()=>setVendorSearchFocused(true)} onBlur={()=>setVendorSearchFocused(false)} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,color:C.text,fontFamily:'inherit',fontWeight:500}}/>
              {vendorSearch&&<button onClick={()=>handleVendorSearch('')} style={{border:'none',background:'none',cursor:'pointer',fontSize:13,color:C.textFaint}}>✕</button>}
              <div style={{fontSize:12,fontWeight:700,color:C.primary,background:C.primaryBg,border:`1px solid ${C.primaryBorder}`,padding:'5px 12px',borderRadius:20,whiteSpace:'nowrap'}}>{filteredVendors.length} vendors</div>
            </div>
          )}
          {uploadedImage&&activeTab==='products'&&<div style={{marginTop:12,display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:C.primaryBg,border:`1px solid ${C.primaryBorder}`,borderRadius:12,animation:'slideInPreview 0.35s ease both'}}>
            <img src={uploadedImage} alt="" style={{width:48,height:48,objectFit:'cover',borderRadius:8}}/>
            <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:C.primary}}>Image uploaded</p><p style={{fontSize:11,color:C.textMuted}}>Showing visually similar bags</p></div>
            <button onClick={handleClearSearch} style={{fontSize:12,color:C.primary,fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Remove</button>
          </div>}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab==='products'&&<>
          <div style={{marginBottom:26,opacity:catVisible?1:0,transform:catVisible?'translateY(0)':'translateY(18px)',transition:'opacity 0.5s ease,transform 0.5s cubic-bezier(0.22,1,0.36,1)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><div style={{width:18,height:2.5,background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`,borderRadius:2}}/><span style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textFaint}}>Browse by Category</span></div>
            <div className="cat-track" style={{display:'flex',gap:9,overflowX:'auto',paddingBottom:6,paddingTop:4}}>
              {categoriesWithCounts.map((cat,i)=>(<CategoryPill key={cat.id} cat={cat} isActive={activeCategory===cat.id} onClick={()=>handleCategoryChange(cat.id)} index={i} count={cat.count}/>))}
            </div>
            <div style={{marginTop:10,height:2,background:C.borderLight,borderRadius:2,overflow:'hidden',position:'relative'}}>
              {(()=>{const idx=CATEGORIES.findIndex(c=>c.id===activeCategory);const cat=CATEGORIES[idx];return <div style={{position:'absolute',left:`${(idx/CATEGORIES.length)*100}%`,width:`${100/CATEGORIES.length}%`,height:'100%',background:cat?.color||C.primary,borderRadius:2,transition:'left 0.4s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:`0 0 8px ${cat?.color||C.primary}88`}}/>;})()}
            </div>
          </div>

          {/* All Bags grid */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10,opacity:searchVisible?1:0,transition:'opacity 0.5s ease 0.1s'}}>
            <div><h2 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:2,letterSpacing:'-0.02em'}}>{selectedVendor?`${selectedVendor.avatar} ${selectedVendor.name}`:isFiltered?(activeCategory!=='all'?CATEGORIES.find(c=>c.id===activeCategory)?.label:'Search Results'):'All Bags'}</h2><p style={{fontSize:12,color:C.textFaint,fontWeight:500}}>{displayedProducts.length} {displayedProducts.length===1?'item':'items'} found{selectedLocation.id!=='all'&&` in ${selectedLocation.name}`}</p></div>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              {selectedVendor&&<button onClick={()=>{setSelectedVendor(null);handleClearSearch();}} style={{background:C.primaryBg,color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer'}}>🏪 {selectedVendor.name} ✕</button>}
              {activeCategory!=='all'&&(()=>{const cat=CATEGORIES.find(c=>c.id===activeCategory);return <button onClick={()=>handleCategoryChange('all')} style={{background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer'}}>{cat.icon} {cat.label} ✕</button>;})()}
              {selectedLocation.id!=='all'&&<button onClick={()=>handleLocationChange(NIGERIAN_LOCATIONS[0])} style={{background:C.primaryBg,color:C.primary,border:`1px solid ${C.primaryBorder}`,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer'}}>{selectedLocation.emoji} {selectedLocation.name} ✕</button>}
              {isFiltered&&<button onClick={handleClearSearch} style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer'}}>Clear All</button>}
            </div>
          </div>

          <div style={{position:'relative',minHeight:visualSearching?'300px':'auto'}}>
            {visualSearching && (
              <div style={{position:'absolute',inset:0,zIndex:10,background:'rgba(255,255,255,0.7)',backdropFilter:'blur(4px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:20,animation:'fadeIn 0.3s ease both'}}>
                <div style={{width:48,height:48,borderRadius:'50%',border:`3px solid ${C.border}`,borderTopColor:C.primary,animation:'ldSpin 0.8s linear infinite',marginBottom:16}}/>
                <h3 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Searching...</h3>
                <p style={{fontSize:13,color:C.textMuted,fontWeight:500}}>Analyzing your image for matching bags</p>
              </div>
            )}
            {displayedProducts.length>0
              ?<div key={resultsKey} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20}}>{displayedProducts.map((p,i)=>(<ProductCard key={`${p.id}-${resultsKey}`} product={p} index={i} navigate={navigate} onAddToCart={handleAddToCart} isAuthed={!!user} onRequireAuth={()=>setAuthGateOpen(true)} />))}</div>
              :<div style={{textAlign:'center',padding:'80px 20px',animation:'bounceIn 0.6s ease both'}}><div style={{fontSize:56,marginBottom:16}}>🔍</div><h3 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>No bags found</h3><p style={{color:C.textMuted,marginBottom:24,fontSize:14}}>Try adjusting your search or browse all bags</p><button onClick={handleClearSearch} style={{padding:'11px 24px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,boxShadow:'0 6px 20px rgba(200,75,17,0.38)'}}>View All Bags</button></div>}
          </div>

          {/* ── NEW LISTING SECTIONS (only shown when not filtered) ── */}
          {!isFiltered && displayedProducts.length > 0 && (
            <div style={{ marginTop: 60, borderTop: `1px solid ${C.borderLight}`, paddingTop: 52 }}>

              {/* Deal of the Day */}
              <DealOfTheDay
                product={dealProduct}
                navigate={navigate}
                onAddToCart={handleAddToCart}
                isAuthed={!!user}
                onRequireAuth={() => setAuthGateOpen(true)}
              />

              {/* Featured Picks */}
              <HorizontalSection
                title="Featured Picks"
                subtitle="Handpicked by our style team just for you"
                icon="⭐"
                accentColor={C.primary}
                accentBg={C.primaryBg}
                products={featuredProducts}
                navigate={navigate}
                onAddToCart={handleAddToCart}
                isAuthed={!!user}
                onRequireAuth={() => setAuthGateOpen(true)}
                badge="Featured"
                badgeColor={C.primary}
                onSeeAll={() => handleCategoryChange('all')}
              />

              {/* New Arrivals */}
              <HorizontalSection
                title="New Arrivals"
                subtitle="Fresh styles added to our collection"
                icon="✨"
                accentColor="#be185d"
                accentBg="#fdf2f8"
                products={newArrivals}
                navigate={navigate}
                onAddToCart={handleAddToCart}
                isAuthed={!!user}
                onRequireAuth={() => setAuthGateOpen(true)}
                badge="New"
                badgeColor="#be185d"
                onSeeAll={() => handleCategoryChange('all')}
              />

              {/* Under Budget */}
              {topDeals.length > 0 && (
                <HorizontalSection
                  title="Under ₦2,000"
                  subtitle="Amazing bags that won't break the bank"
                  icon="💸"
                  accentColor="#15803d"
                  accentBg="#dcfce7"
                  products={topDeals}
                  navigate={navigate}
                  onAddToCart={handleAddToCart}
                  isAuthed={!!user}
                  onRequireAuth={() => setAuthGateOpen(true)}
                  badge="Budget Pick"
                  badgeColor="#15803d"
                  onSeeAll={() => { handleCategoryChange('all'); }}
                />
              )}

              {/* Mini Promo Banner */}
              <div style={{ borderRadius: 20, background: 'linear-gradient(135deg, #1a0a00 0%, #4a1a06 60%, #c84b11 100%)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 48, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', filter: 'blur(40px)' }} />
                <div style={{ position: 'relative' }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Exclusive Offer</p>
                  <h3 style={{ fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 10 }}>Sell Your Bags on BagSearch<br /><span style={{ color: '#f97316' }}>Reach 10,000+ Buyers</span></h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, maxWidth: 360 }}>Join Nigeria's fastest-growing bag marketplace. Free to list, zero commission on first 30 days.</p>
                </div>
                <button onClick={() => navigate('/register')} style={{ position: 'relative', padding: '14px 28px', background: 'linear-gradient(135deg, #f97316, #c84b11)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 28px rgba(200,75,17,0.5)', transition: 'all 0.3s', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(200,75,17,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,75,17,0.5)'; }}>
                  Start Selling Free →
                </button>
              </div>

            </div>
          )}
        </>}

        {/* VENDORS TAB */}
        {activeTab==='vendors'&&<div>
          <div style={{marginBottom:22}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:18,height:2.5,background:`linear-gradient(90deg,${C.primary},${C.primaryLight})`,borderRadius:2}}/><span style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textFaint}}>Our Sellers</span></div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:4}}>Meet Our Vendors</h2>
            <p style={{fontSize:13,color:C.textMuted,fontWeight:500}}>Trusted sellers with thousands of happy customers across Nigeria</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:28}}>
            {[{l:'Total Vendors',v:47,i:'🏪',c:C.primary,bg:C.primaryBg,b:C.primaryBorder},{l:'Products',v:1240,i:'👜',c:'#92400e',bg:'#fef3c7',b:'#fde68a'},{l:'Happy Buyers',v:8900,i:'😊',c:'#15803d',bg:'#dcfce7',b:'#a7f3d0'},{l:'Reviews',v:5620,i:'⭐',c:'#c2410c',bg:'#ffedd5',b:'#fed7aa'}].map(s=>(
              <div key={s.l} style={{background:'white',borderRadius:16,padding:'14px 16px',border:`1.5px solid ${s.b}`,display:'flex',alignItems:'center',gap:10,boxShadow:`0 4px 14px ${s.c}12`}}>
                <div style={{width:38,height:38,borderRadius:11,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{s.i}</div>
                <div><div style={{fontSize:18,fontWeight:900,color:s.c,letterSpacing:'-0.02em',lineHeight:1}}><AnimatedCount value={s.v}/></div><div style={{fontSize:10,color:C.textFaint,fontWeight:700,marginTop:2}}>{s.l}</div></div>
              </div>
            ))}
          </div>
          {filteredVendors.length>0
            ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>{filteredVendors.map((v,i)=>(<VendorCard key={v.id} vendor={v} index={i} onViewProducts={handleViewVendorProducts}/>))}</div>
            :<div style={{textAlign:'center',padding:'80px 20px',animation:'bounceIn 0.6s ease both'}}><div style={{fontSize:56,marginBottom:16}}>🏪</div><h3 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>No vendors found</h3><button onClick={()=>handleVendorSearch('')} style={{marginTop:8,padding:'11px 24px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14}}>See All Vendors</button></div>}
        </div>}
      </div>
    </div>
  );
}