import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from './components/Logo.jsx';
import { useSEO, SITE_URL } from './hooks/useSEO';

const C = {
  primary:'#c84b11', primaryLight:'#f97316', primaryBg:'#fde8d8',
  primaryPale:'#fdf4ee', primaryBorder:'#f9c4a0',
  surface:'#ffffff', surfaceDim:'#fdf8f5', border:'#f0d9cc',
  borderLight:'#f7ece4', text:'#1a0a00', textMid:'#5c3317',
  textMuted:'#9a6348', textFaint:'#c4957a',
};

const QUICK_CHIPS = [
  'How do I list my bag for sale?',
  'How does visual search work?',
  'How do buyers contact me?',
  'Is BagSearch free?',
  'How do I report a seller?',
];

const KNOWLEDGE_BASE = [
  // Registration & Account
  { keys:['register','sign up','create account','join','new account'], a:'Go to the Register page, fill in your name, email, password and choose your role (Buyer or Seller). After registering you\'ll be redirected to the login page.' },
  { keys:['login','sign in','log in','password'], a:'Click Login in the top navbar. Enter your email and password. If you forgot your password, use the "Forgot Password" link to reset it via email.' },
  { keys:['forgot password','reset password','change password'], a:'On the Login page, click "Forgot Password". Enter your email and we\'ll send you a reset link. Check your spam folder if you don\'t see it.' },
  { keys:['delete account','remove account'], a:'Go to your Seller Dashboard → sidebar → "Delete Account". Type DELETE to confirm. This permanently removes all your listings, data, and profile.' },

  // Buying
  { keys:['buy','purchase','order','how to buy','buying'], a:'Browse products on the Products page. Click a bag to see details, then tap the WhatsApp button to contact the seller directly and arrange payment.' },
  { keys:['cart','add to cart','basket'], a:'Click "Add to Cart" on any product card. Open your cart from the top-right icon. From the cart you can message all sellers at once via WhatsApp.' },
  { keys:['whatsapp','contact seller','message seller','chat seller'], a:'Every product card has a WhatsApp icon. Clicking it opens a pre-filled WhatsApp message to the seller with the product name, price, and a link to the product page.' },
  { keys:['price','cost','how much','naira','payment'], a:'Prices are listed in Nigerian Naira (₦) on each product card. Payment is arranged directly between buyer and seller via WhatsApp — BagSearch does not process payments.' },
  { keys:['delivery','shipping','dispatch'], a:'Delivery is arranged directly with the seller via WhatsApp. Ask the seller about their delivery options and costs when you contact them.' },
  { keys:['return','refund','exchange'], a:'Returns and refunds are handled directly between you and the seller. Discuss the return policy with the seller before purchasing.' },

  // Selling
  { keys:['sell','list','upload product','add product','listing','how to sell'], a:'Register as a Seller, then go to your Seller Dashboard and click "Upload Product". Add photos, set your price, choose your location, and add your WhatsApp number. Your listing goes live instantly.' },
  { keys:['seller dashboard','dashboard'], a:'Access your Seller Dashboard from the top-right profile icon (if you\'re a seller). It shows your active listings, total views, buyer inquiries, and lets you edit your profile.' },
  { keys:['edit listing','update product','change price','edit product'], a:'Go to Seller Dashboard → My Listings. Click the three-dot menu on any listing and select "Edit". Update any details and save.' },
  { keys:['delete listing','remove listing','delete product'], a:'Go to Seller Dashboard → My Listings. Click the three-dot menu on the listing and select "Delete". The product is removed from Supabase immediately.' },
  { keys:['seller profile','brand name','brand story','shop name'], a:'Go to Seller Dashboard → Edit Profile tab. You can set your brand name, brand story, bag categories, phone, and email. Use the AI ✨ button for brand name and story suggestions.' },
  { keys:['views','who viewed','buyer views','product views'], a:'Your Seller Dashboard shows a "Buyers that Viewed Product" table with the buyer\'s name, source (direct or visual search), and time of view.' },
  { keys:['notification','bell','alert'], a:'The bell icon in your Seller Dashboard header shows real-time notifications when buyers view your products or leave reviews.' },

  // Visual Search
  { keys:['visual search','image search','photo search','search by image','upload image','similar bag'], a:'On the Products page, click the camera icon in the search bar and upload a photo of any bag. Our AI finds visually similar bags from sellers across Nigeria using color and pattern matching.' },

  // Vendors / Sellers
  { keys:['vendor','vendors page','seller page','seller profile link','share profile'], a:'The Vendors tab on the Products page lists all sellers. Click any vendor card to see their profile, products, reviews, and views. Sellers can share their profile link from the Seller Dashboard sidebar.' },
  { keys:['review','rating','leave review','post review'], a:'Visit a seller\'s vendor page and scroll to the Reviews tab. Select a star rating, write your review, and click "Post Review". Your review appears immediately.' },

  // Search & Filters
  { keys:['search','find bag','filter','category','location'], a:'Use the search bar at the top of the Products page to search by name or brand. Filter by category (Tote, Clutch, Crossbody, etc.) using the category pills. Filter by Nigerian city using the location selector.' },
  { keys:['location','city','lagos','abuja','port harcourt'], a:'Click the location selector in the navbar to filter products by Nigerian city — Lagos Island, Lekki, Victoria Island, Abuja, Port Harcourt, and more.' },

  // General
  { keys:['free','cost','fee','charge','commission'], a:'BagSearch is completely free for buyers and sellers. Listing products, browsing, and contacting sellers costs nothing.' },
  { keys:['contact','support','help','email','whatsapp support'], a:'Email us at info@bagsearch.shop or WhatsApp us at +234 8138734530 (Mon–Sat, 8AM–8PM). You can also use the contact form on this page.' },
  { keys:['bagsearch','what is bagsearch','about'], a:'BagSearch is a Nigerian marketplace for buying and selling bags — from luxury designer pieces to everyday totes. Sellers list their bags, buyers discover them via search or visual AI, and deals are closed via WhatsApp.' },
];

function findAnswer(q) {
  const lower = q.toLowerCase();
  const scored = KNOWLEDGE_BASE.map(item => {
    const hits = item.keys.filter(k => lower.includes(k)).length;
    return { ...item, hits };
  }).filter(i => i.hits > 0).sort((a,b) => b.hits - a.hits);
  return scored[0]?.a || null;
}

export default function Contact() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [answer,  setAnswer]  = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error

  // SEO for contact page
  useSEO({
    title: 'Contact Us | BagSearch Support Nigeria',
    description: 'Need help? Contact BagSearch support via WhatsApp (+234 8138734530) or email (info@bagsearch.shop). Available Mon–Sat 8AM–8PM. Get answers about orders, listings, and accounts.',
    keywords: 'contact BagSearch, BagSearch support, help center, WhatsApp Nigeria, email BagSearch, customer service',
    url: '/contact',
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact BagSearch',
      description: 'Reach BagSearch support via WhatsApp, email, or contact form.',
      mainEntity: {
        '@type': 'Organization',
        name: 'BagSearch',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+2348138734530',
            contactType: 'customer service',
            availableLanguage: ['English'],
            hoursAvailable: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
              opens: '08:00',
              closes: '20:00'
            }
          },
          {
            '@type': 'ContactPoint',
            email: 'info@bagsearch.shop',
            contactType: 'customer service',
            availableLanguage: ['English']
          }
        ]
      }
    }
  });

  const doSearch = (q) => {
    const text = (q || query).trim();
    if (!text) return;
    setQuery(text);
    setStatus('loading');
    setAnswer('');
    setTimeout(() => {
      const result = findAnswer(text);
      if (result) {
        setAnswer(result);
        setStatus('done');
      } else {
        setAnswer('We don\'t have a specific answer for that yet. Please contact us via WhatsApp (+234 8138734530) or email info@bagsearch.shop and we\'ll help you right away.');
        setStatus('done');
      }
    }, 400);
  };

  const iStyle = {
    flex:1, padding:'14px 18px', fontSize:14,
    fontFamily:"'Manrope',sans-serif", border:'none',
    outline:'none', background:'transparent', color:C.text,
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg,${C.primaryPale} 0%,white 40%)`, fontFamily:"'Manrope',sans-serif", color:C.text }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap\');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:768px){.contact-cards{grid-template-columns:1fr!important}.faq-grid{grid-template-columns:1fr!important}}'}</style>

      {/* Header */}
      <header style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.borderLight}`, position:'sticky', top:0, zIndex:50, padding:'0 20px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>navigate('/products')}>
          <LogoIcon size={28}/>
          <span style={{ fontSize:18, fontWeight:900, color:C.text }}>Bag<span style={{ color:C.primary }}>Search</span></span>
        </div>
        <button onClick={()=>navigate('/products')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceDim, cursor:'pointer', color:C.textMid, fontSize:13, fontWeight:700, transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMid;}}>
          ← Back
        </button>
      </header>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'48px 20px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:36, animation:'fadeUp 0.5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:C.primaryBg, color:C.primary, fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, marginBottom:16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Help Centre
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(1.8rem,5vw,2.6rem)', fontWeight:900, letterSpacing:'-0.04em', marginBottom:10, lineHeight:1.15 }}>
            How can we help you?
          </h1>
          <p style={{ fontSize:15, color:C.textMuted, fontWeight:500, maxWidth:440, margin:'0 auto' }}>
            Search anything — bags, orders, sellers, payments, or features you haven't found yet.
          </p>
        </div>

        {/* AI Search */}
        <div style={{ maxWidth:620, margin:'0 auto' }}>
          <div style={{ display:'flex', borderRadius:14, overflow:'hidden', border:`1.5px solid ${C.border}`, background:'white', boxShadow:`0 4px 20px rgba(200,75,17,0.10)` }}>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch()}
              placeholder="e.g. How do I find a specific bag brand?"
              style={iStyle}
            />
            {status==='loading' && (
              <div style={{ display:'flex', alignItems:'center', padding:'0 12px' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2.5px solid rgba(200,75,17,0.25)`, borderTopColor:C.primary, animation:'spin 0.7s linear infinite' }}/>
              </div>
            )}
            <button
              onClick={()=>doSearch()}
              disabled={status==='loading'}
              style={{ padding:'0 22px', background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, color:'white', border:'none', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Manrope',sans-serif", display:'flex', alignItems:'center', gap:6, opacity:status==='loading'?0.6:1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Ask AI
            </button>
          </div>

          {/* AI Answer */}
          {(status==='done'||status==='error') && answer && (
            <div style={{ background:C.primaryPale, border:`1.5px solid ${C.primaryBorder}`, borderRadius:14, padding:'18px 20px', marginTop:16, animation:'fadeUp 0.3s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:800, color:C.primary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                AI Answer
              </div>
              <p style={{ fontSize:13.5, lineHeight:1.7, color:C.text }}>{answer}</p>
            </div>
          )}

          {/* Quick chips */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
            {QUICK_CHIPS.map((chip,i)=>(
              <button key={i} onClick={()=>doSearch(chip)}
                style={{ padding:'6px 14px', background:'white', border:`1.5px solid ${C.border}`, borderRadius:20, fontSize:12, fontWeight:700, color:C.textMid, cursor:'pointer', transition:'all 0.18s', fontFamily:"'Manrope',sans-serif" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;e.currentTarget.style.background=C.primaryBg;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMid;e.currentTarget.style.background='white';}}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop:`1.5px solid ${C.border}`, margin:'40px 0' }}/>

        {/* Contact Cards */}
        <p style={{ fontSize:11, fontWeight:800, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>Get in touch directly</p>
        <div className="contact-cards" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
              label:'Email', value:<a href="mailto:info@bagsearch.shop" style={{color:'inherit',textDecoration:'none'}}><span>info</span><span>&#64;</span><span>bagsearch.shop</span></a>, sub:'Reply within 24 hours',
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
              label:'WhatsApp', value:'+234 8138734530', sub:'Mon–Sat · 8AM – 8PM',
              action: ()=>window.open('https://wa.me/2348138734530','_blank'),
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
              label:'Location', value:'Lagos, Nigeria', sub:'Serving all of Nigeria',
            },
          ].map((item,i)=>(
            <div key={i} onClick={item.action}
              style={{ background:'white', borderRadius:16, padding:'22px 20px', border:`1.5px solid ${C.borderLight}`, transition:'all 0.22s', cursor:item.action?'pointer':'default' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primaryBorder;e.currentTarget.style.boxShadow=`0 8px 24px rgba(200,75,17,0.09)`;e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderLight;e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
              <div style={{ width:46, height:46, borderRadius:13, background:C.primaryBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, border:`1px solid ${C.primaryBorder}` }}>
                {item.icon}
              </div>
              <p style={{ fontSize:11, fontWeight:800, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{item.label}</p>
              <p style={{ fontSize:14, fontWeight:800, marginBottom:3 }}>{item.value}</p>
              <p style={{ fontSize:12, color:C.textMuted, fontWeight:500 }}>{item.sub}</p>
              {item.action && (
                <button onClick={e=>{e.stopPropagation();item.action();}}
                  style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'#25d366', color:'white', fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Manrope',sans-serif" }}>
                  Chat Now
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop:`1.5px solid ${C.border}`, margin:'40px 0' }}/>

        {/* FAQ */}
        <p style={{ fontSize:11, fontWeight:800, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>Frequently asked questions</p>
        <div className="faq-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {[
            { q:'How do I list my bag for sale?', a:'Register as a seller, go to your dashboard and click "Upload Product". Fill in the details and your bag goes live instantly.' },
            { q:'How do buyers contact me?', a:'Buyers tap the WhatsApp button on your product card. Make sure your WhatsApp number is correct in your profile.' },
            { q:'Is BagSearch free to use?', a:'Yes! Listing and browsing are completely free for everyone.' },
            { q:'How does visual search work?', a:'Upload a photo of any bag and our AI finds visually similar bags from sellers across Nigeria.' },
            { q:'How do I reset my password?', a:'On the Login page, click "Forgot Password". Enter your email and we\'ll send you a reset link.' },
            { q:'How do I delete a listing?', a:'Go to Seller Dashboard → My Listings. Click the three-dot menu on the listing and select "Delete".' },
          ].map((item,i)=>(
            <div key={i} style={{ background:'white', borderRadius:14, padding:'18px 20px', border:`1.5px solid ${C.borderLight}` }}>
              <p style={{ fontSize:13.5, fontWeight:800, marginBottom:8 }}>{item.q}</p>
              <p style={{ fontSize:12.5, color:C.textMuted, lineHeight:1.65 }}>{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
