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
  'How do I find Hot Deals?',
];

const KNOWLEDGE_BASE = [
  // Registration & Account
  { keys:['register','sign up','create account','join','new account'], a:`<strong>How to create a BagSearch account:</strong>
<ol>
<li>Tap <strong>Sign Up</strong> at the bottom of the homepage (or go to <em>bagsearch.shop/register</em>)</li>
<li>Fill in your <strong>Full Name</strong>, <strong>Email</strong>, and choose a <strong>Password</strong></li>
<li>Select your role — <strong>🛍️ Buyer</strong> or <strong>🏪 Seller</strong></li>
<li>Tap the orange <strong>"Register"</strong> button</li>
<li>You'll be redirected to the <strong>Login</strong> page — sign in with your new credentials</li>
</ol>
<em>💡 Tip: You can also sign up with Google by tapping the Google button on the register page.</em>` },

  { keys:['login','sign in','log in','password'], a:`<strong>How to log in:</strong>
<ol>
<li>Tap <strong>"Login"</strong> in the top-right corner of any page</li>
<li>Enter your <strong>Email</strong> and <strong>Password</strong></li>
<li>Tap the orange <strong>"Login"</strong> button</li>
</ol>
<em>💡 Forgot your password? Tap "Forgot Password" below the login form to get a reset link via email.</em>` },

  { keys:['forgot password','reset password','change password'], a:`<strong>How to reset your password:</strong>
<ol>
<li>Go to the <strong>Login</strong> page</li>
<li>Tap <strong>"Forgot Password"</strong> below the password field</li>
<li>Enter your <strong>email address</strong> and tap <strong>"Send Reset Link"</strong></li>
<li>Check your email inbox (and spam folder) for the reset link</li>
<li>Click the link → you'll land on the <strong>Reset Password</strong> page</li>
<li>Enter your <strong>new password</strong> twice and tap <strong>"Reset Password"</strong></li>
</ol>
<em>⚠️ The reset link expires after 1 hour. If it doesn't work, request a new one.</em>` },

  { keys:['delete account','remove account'], a:`<strong>How to delete your account:</strong>
<ol>
<li>Log in and tap the <strong>👤 profile icon</strong> (top-right corner)</li>
<li>Go to <strong>Seller Dashboard</strong></li>
<li>Open the <strong>sidebar menu</strong> (☰ hamburger icon, top-left)</li>
<li>Scroll down and tap <strong>"Delete Account"</strong></li>
<li>Type <strong>DELETE</strong> in the confirmation box</li>
<li>Tap <strong>"Confirm Delete"</strong></li>
</ol>
<em>⚠️ This is permanent — all your listings, reviews, and profile data will be removed.</em>` },

  // Buying
  { keys:['buy','purchase','order','how to buy','buying'], a:`<strong>How to buy a bag on BagSearch:</strong>
<ol>
<li>Go to the <strong>Products</strong> page (tap 🏠 Home in the bottom nav)</li>
<li>Browse bags or use the <strong>🔍 search bar</strong> to find what you want</li>
<li>Tap any bag to open its <strong>product detail page</strong></li>
<li>Review the photos, price, description, and seller info</li>
<li>Tap the green <strong>💬 WhatsApp button</strong> to message the seller</li>
<li>Discuss payment and delivery directly with the seller</li>
</ol>
<em>💡 Tip: Use the camera icon 📷 in the search bar to find bags by uploading a photo!</em>` },

  { keys:['cart','add to cart','basket'], a:`<strong>How to use the cart:</strong>
<ol>
<li>On any product card, tap the <strong>"Add to Cart"</strong> button</li>
<li>Tap the <strong>🛒 cart icon</strong> in the top-right corner to view your cart</li>
<li>Review the items in your cart</li>
<li>Tap <strong>"Message All Sellers"</strong> to send a WhatsApp message to each seller at once</li>
</ol>
<em>💡 The cart lets you save bags you're interested in and contact multiple sellers in one go.</em>` },

  { keys:['whatsapp','contact seller','message seller','chat seller'], a:`<strong>How to contact a seller via WhatsApp:</strong>
<ol>
<li>Open any <strong>product card</strong> or <strong>product detail page</strong></li>
<li>Tap the green <strong>💬 WhatsApp icon</strong></li>
<li>WhatsApp opens with a <strong>pre-filled message</strong> containing the product name, price, and link</li>
<li>Send the message and chat directly with the seller</li>
</ol>
<em>💡 You can also visit a seller's profile page and tap the WhatsApp button there.</em>` },

  { keys:['price','cost','how much','naira','payment'], a:`<strong>About pricing & payment:</strong>
<ul>
<li>All prices are shown in <strong>Nigerian Naira (₦)</strong> on each product card</li>
<li>Payment is arranged <strong>directly between you and the seller</strong> via WhatsApp</li>
<li>BagSearch does <strong>not</strong> process payments — we connect you with the seller</li>
<li>Common payment methods: bank transfer, POS, or cash on delivery (varies by seller)</li>
</ul>
<em>💡 Always confirm the final price with the seller before paying.</em>` },

  { keys:['delivery','shipping','dispatch'], a:`<strong>About delivery:</strong>
<ul>
<li>Delivery is arranged <strong>directly with the seller</strong> via WhatsApp</li>
<li>Ask the seller about their delivery options, costs, and timeline</li>
<li>Some sellers offer free delivery within their city</li>
</ul>
<em>💡 When messaging a seller, ask about delivery upfront so there are no surprises.</em>` },

  { keys:['return','refund','exchange'], a:`<strong>About returns & refunds:</strong>
<ul>
<li>Returns and refunds are handled <strong>directly between you and the seller</strong></li>
<li>Always discuss the return policy with the seller <strong>before purchasing</strong></li>
<li>If you have a dispute, contact BagSearch support and we'll help mediate</li>
</ul>
<em>📞 Need help? WhatsApp us at +234 8138734530</em>` },

  // Selling
  { keys:['sell','list','upload product','add product','listing','how to sell'], a:`<strong>How to list a bag for sale:</strong>
<ol>
<li>Register as a <strong>🏪 Seller</strong> (or log in to your seller account)</li>
<li>Tap the <strong>👤 profile icon</strong> in the top-right corner</li>
<li>Go to your <strong>Seller Dashboard</strong></li>
<li>Tap the orange <strong>"+ Upload Product"</strong> button</li>
<li>Upload up to <strong>5 photos</strong> of your bag</li>
<li>Fill in: <strong>Product Name</strong>, <strong>Price (₦)</strong>, <strong>Category</strong>, <strong>Condition</strong></li>
<li>Add your <strong>WhatsApp number</strong> and <strong>Location</strong></li>
<li>Tap <strong>"Upload"</strong> — your listing goes live instantly! 🎉</li>
</ol>
<em>💡 Tip: Clear, well-lit photos get 3x more buyer inquiries.</em>` },

  { keys:['seller dashboard','dashboard'], a:`<strong>How to access your Seller Dashboard:</strong>
<ol>
<li>Log in to your seller account</li>
<li>Tap the <strong>👤 profile icon</strong> in the top-right corner</li>
<li>Select <strong>"Seller Dashboard"</strong> from the menu</li>
</ol>
<strong>Your dashboard shows:</strong>
<ul>
<li>📦 <strong>My Listings</strong> — all your active products</li>
<li>👁️ <strong>Total Views</strong> — how many buyers viewed your products</li>
<li>💬 <strong>Buyer Inquiries</strong> — messages from interested buyers</li>
<li>✏️ <strong>Edit Profile</strong> — update your brand name, story, and contact info</li>
</ul>` },

  { keys:['edit listing','update product','change price','edit product'], a:`<strong>How to edit a listing:</strong>
<ol>
<li>Go to your <strong>Seller Dashboard</strong> (👤 → Seller Dashboard)</li>
<li>Find the listing under <strong>"My Listings"</strong></li>
<li>Tap the <strong>⋮ three-dot menu</strong> on the product card</li>
<li>Select <strong>"Edit"</strong></li>
<li>Update the name, price, photos, or description</li>
<li>Tap <strong>"Save Changes"</strong></li>
</ol>` },

  { keys:['delete listing','remove listing','delete product'], a:`<strong>How to delete a listing:</strong>
<ol>
<li>Go to your <strong>Seller Dashboard</strong> (👤 → Seller Dashboard)</li>
<li>Find the listing under <strong>"My Listings"</strong></li>
<li>Tap the <strong>⋮ three-dot menu</strong> on the product card</li>
<li>Select <strong>"Delete"</strong></li>
<li>Confirm the deletion</li>
</ol>
<em>⚠️ Deleted listings are removed permanently and cannot be recovered.</em>` },

  { keys:['seller profile','brand name','brand story','shop name'], a:`<strong>How to set up your seller profile:</strong>
<ol>
<li>Go to your <strong>Seller Dashboard</strong> (👤 → Seller Dashboard)</li>
<li>Tap the <strong>"Edit Profile"</strong> tab</li>
<li>Fill in your <strong>Brand Name</strong> (your shop name that buyers see)</li>
<li>Write a <strong>Brand Story</strong> (tell buyers about your business)</li>
<li>Select your <strong>Bag Categories</strong> (luxury, everyday, vintage, etc.)</li>
<li>Add your <strong>Phone</strong> and <strong>Email</strong></li>
<li>Tap <strong>"Save"</strong></li>
</ol>
<em>💡 Tap the ✨ AI button next to Brand Name or Brand Story for smart suggestions!</em>` },

  { keys:['views','who viewed','buyer views','product views'], a:`<strong>How to see who viewed your products:</strong>
<ol>
<li>Go to your <strong>Seller Dashboard</strong> (👤 → Seller Dashboard)</li>
<li>Scroll to the <strong>"Buyers that Viewed Product"</strong> section</li>
</ol>
<strong>The table shows:</strong>
<ul>
<li>👤 <strong>Buyer name</strong></li>
<li>🔍 <strong>Source</strong> — whether they found you via direct search or visual search</li>
<li>🕐 <strong>Time</strong> — when they viewed your product</li>
</ul>` },

  { keys:['notification','bell','alert'], a:`<strong>How notifications work:</strong>
<ol>
<li>Look for the <strong>🔔 bell icon</strong> in your Seller Dashboard header</li>
<li>A red dot appears when you have <strong>new notifications</strong></li>
<li>Tap the bell to see:</li>
</ol>
<ul>
<li>👁️ When a buyer views your product</li>
<li>⭐ When someone leaves a review on your profile</li>
<li>💬 New buyer inquiries</li>
</ul>` },

  // Visual Search
  { keys:['visual search','image search','photo search','search by image','upload image','similar bag'], a:`<strong>How to use Visual Search (find a bag by photo):</strong>
<ol>
<li>Go to the <strong>Products</strong> page</li>
<li>Tap the <strong>📷 camera icon</strong> inside the search bar</li>
<li>Upload a photo of any bag (from your gallery or take a new photo)</li>
<li>Our AI analyzes the <strong>color, shape, and pattern</strong></li>
<li>You'll see <strong>visually similar bags</strong> from sellers across Nigeria</li>
</ol>
<em>💡 Tip: Clear, well-lit photos of the bag give the best results. Try to capture the full bag in the frame.</em>` },

  // Vendors / Sellers
  { keys:['vendor','vendors page','seller page','seller profile link','share profile'], a:`<strong>How to browse sellers:</strong>
<ol>
<li>Go to the <strong>Products</strong> page</li>
<li>Tap the <strong>"Vendors"</strong> tab at the top</li>
<li>Browse all registered sellers with their brand names and ratings</li>
<li>Tap any vendor card to see their <strong>full profile</strong>, products, and reviews</li>
</ol>
<em>💡 Sellers can share their profile link from Seller Dashboard → sidebar → "Share Profile".</em>` },

  { keys:['review','rating','leave review','post review'], a:`<strong>How to leave a review for a seller:</strong>
<ol>
<li>Visit the seller's <strong>profile page</strong> (tap their name on any product)</li>
<li>Scroll down to the <strong>"Reviews"</strong> section</li>
<li>Tap the <strong>⭐ stars</strong> to select your rating (1–5)</li>
<li>Write your review in the text box</li>
<li>Tap <strong>"Post Review"</strong></li>
</ol>
<em>Your review appears immediately and helps other buyers make decisions!</em>` },

  // Search & Filters
  { keys:['search','find bag','filter','category','location'], a:`<strong>How to search & filter bags:</strong>
<ol>
<li>Go to the <strong>Products</strong> page</li>
<li>Use the <strong>🔍 search bar</strong> at the top to search by name or brand</li>
<li>Swipe through the <strong>category pills</strong> below the search bar (Tote, Clutch, Crossbody, Shoulder, etc.)</li>
<li>Tap the <strong>📍 location selector</strong> in the navbar to filter by Nigerian city</li>
</ol>
<em>💡 Combine search + category + location for the most specific results.</em>` },

  { keys:['location','city','lagos','abuja','port harcourt'], a:`<strong>How to filter by location:</strong>
<ol>
<li>Tap the <strong>📍 location selector</strong> in the top navbar</li>
<li>Choose from cities like <strong>Lagos Island, Lekki, Victoria Island, Abuja, Port Harcourt</strong>, and more</li>
<li>Products from sellers in that city will appear first</li>
</ol>
<em>💡 Clear the location filter to see bags from all of Nigeria.</em>` },

  // Hot Deals
  { keys:['hot deal','deals','discount','sale','offer'], a:`<strong>How to find Hot Deals:</strong>
<ol>
<li>Tap <strong>"Hot Deals"</strong> in the bottom navigation bar (🔥 icon)</li>
<li>Browse bags with <strong>special prices and limited-time offers</strong></li>
<li>Tap any deal to view details and contact the seller</li>
</ol>
<em>💡 Hot Deals are updated regularly — check back often!</em>` },

  // General
  { keys:['free','cost','fee','charge','commission'], a:`<strong>BagSearch is 100% free!</strong>
<ul>
<li>✅ <strong>Free</strong> to register as a buyer or seller</li>
<li>✅ <strong>Free</strong> to list products (no listing fees)</li>
<li>✅ <strong>Free</strong> to browse and search bags</li>
<li>✅ <strong>Free</strong> to contact sellers</li>
<li>✅ <strong>No commissions</strong> on sales</li>
</ul>` },

  { keys:['contact','support','help','email','whatsapp support'], a:`<strong>How to reach BagSearch support:</strong>
<ul>
<li>📧 <strong>Email:</strong> info@bagsearch.shop (reply within 24 hours)</li>
<li>💬 <strong>WhatsApp:</strong> +234 8138734530 (Mon–Sat, 8AM–8PM)</li>
<li>📱 Use the <strong>contact form</strong> on this page</li>
</ul>
<em>We typically respond within a few hours during business hours.</em>` },

  { keys:['bagsearch','what is bagsearch','about'], a:`<strong>What is BagSearch?</strong>
<p>BagSearch is Nigeria's marketplace for buying and selling bags — from luxury designer pieces to everyday totes.</p>
<ul>
<li>🛍️ <strong>Buyers</strong> discover bags via search, categories, or visual AI</li>
<li>🏪 <strong>Sellers</strong> list their bags for free and connect with buyers via WhatsApp</li>
<li>📷 <strong>Visual Search</strong> lets you find any bag by uploading a photo</li>
<li>🌍 Connecting buyers and sellers <strong>across Nigeria</strong></li>
</ul>` },

  { keys:['report','report seller','fraud','scam','fake'], a:`<strong>How to report a seller:</strong>
<ol>
<li>Go to the seller's <strong>profile page</strong></li>
<li>Tap the <strong>⚠️ Report</strong> button (or the flag icon)</li>
<li>Select the reason for reporting</li>
<li>Submit your report — our team will review it within 24 hours</li>
</ol>
<em>You can also WhatsApp us directly at +234 8138734530 to report urgent issues.</em>` },
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
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap\');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:768px){.contact-cards{grid-template-columns:1fr!important}.faq-grid{grid-template-columns:1fr!important}}.kb-answer ol,.kb-answer ul{margin:8px 0 8px 20px;padding:0}.kb-answer li{margin-bottom:4px}.kb-answer strong{color:#1a0a00}.kb-answer em{display:block;margin-top:10px;font-style:normal;padding:8px 12px;background:#fff8f4;border-left:3px solid #f97316;border-radius:0 8px 8px 0;font-size:12.5px;color:#5c3317}.kb-answer p{margin:6px 0}'}</style>

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
              <div style={{ fontSize:13.5, lineHeight:1.7, color:C.text }} className="kb-answer" dangerouslySetInnerHTML={{ __html: answer }} />
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
            { q:'How do I list my bag for sale?', a:'Register as a Seller → tap 👤 profile icon → Seller Dashboard → "Upload Product" → add photos, price, details → tap "Upload". Your bag goes live instantly!' },
            { q:'How do buyers contact me?', a:'Buyers tap the green 💬 WhatsApp button on your product card. It opens a pre-filled message with the product name and price. Make sure your WhatsApp number is correct in your seller profile.' },
            { q:'Is BagSearch free to use?', a:'Yes! 100% free — no listing fees, no commissions, no hidden charges for buyers or sellers.' },
            { q:'How does visual search work?', a:'Tap the 📷 camera icon in the search bar → upload a photo of any bag → our AI analyzes color, shape & pattern → shows you visually similar bags from sellers across Nigeria.' },
            { q:'How do I reset my password?', a:'Go to Login page → tap "Forgot Password" → enter your email → check inbox for reset link → click link → set new password. Check spam if you don\'t see the email.' },
            { q:'How do I delete a listing?', a:'Go to Seller Dashboard → "My Listings" → tap the ⋮ three-dot menu on the listing → select "Delete" → confirm. The listing is removed permanently.' },
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
