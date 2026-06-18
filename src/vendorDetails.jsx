import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { useSEO, SITE_URL } from './hooks/useSEO';
import { getOptimizedImageUrl, IMG_SIZES } from './utils/imageUtils';

const C = {
  primary:'#c84b11', primaryLight:'#f97316', primaryBg:'#fde8d8',
  primaryPale:'#fdf4ee', primaryBorder:'#f9c4a0',
  surface:'#ffffff', surfaceDim:'#fdf8f5', border:'#f0d9cc',
  borderLight:'#f7ece4', text:'#1a0a00', textMid:'#5c3317',
  textMuted:'#9a6348', textFaint:'#c4957a', danger:'#dc2626',
};

const BAG_COLOR_MAP = {
  black:'#1A1A1A',white:'#F5F5F0',beige:'#D4B896',camel:'#C19A6B',
  brown:'#6B3F2A',red:'#CC2200',pink:'#E8A0A0',orange:'#E8762B',
  green:'#2D6A3F',blue:'#2255CC',purple:'#6A2D8F',grey:'#888888',
};

const LOCATIONS = [
  {id:'lagos',name:'Lagos State'},
  {id:'lagos-island',name:'Lagos Island'},
  {id:'lekki',name:'Lekki'},
  {id:'victoria-island',name:'Victoria Island'},
  {id:'abuja',name:'Abuja'},
  {id:'port-harcourt',name:'Port Harcourt'},
  {id:'kano',name:'Kano'},
  {id:'ibadan',name:'Ibadan'},
];

function fmt(v) {
  return '\u20a6' + Number(v||0).toLocaleString(undefined,{maximumFractionDigits:0});
}

/* ─── SVG ICON LIBRARY ────────────────────────────────────────────── */

function IconWhatsapp({size=16, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function IconStar({size=13, filled=true, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f97316' : '#f0d9cc'} style={style}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

function IconStore({size=40, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l1-5h16l1 5"/>
      <path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2"/>
      <path d="M5 20v-9"/>
      <path d="M19 20v-9"/>
      <rect x="9" y="14" width="6" height="6" rx="1"/>
      <path d="M3 20h18"/>
    </svg>
  );
}

function IconBag({size=24, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconEye({size=24, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconStar2({size=24, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f97316" style={style}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

function IconChat({size=24, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconMapPin({size=18, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconBook({size=18, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconPencil({size=18, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconPackage({size=18, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function IconEmail({size=16, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconPhone({size=16, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function IconShopping({size=40, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function IconArrowLeft({size=16, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

function IconLoader({size=14, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 0.7s linear infinite',...style}}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}

function IconSparkle({size=14, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
    </svg>
  );
}

function IconTag({size=16, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}

function IconPercent({size=9, style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={style}>
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  );
}

/* ─── COMPOUND COMPONENTS ─────────────────────────────────────────── */

function Stars({rating, size=13}) {
  return (
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(s => (
        <IconStar key={s} size={size} filled={s<=Math.round(rating)}/>
      ))}
    </div>
  );
}

const iStyle = {
  width:'100%', padding:'12px 14px', borderRadius:12,
  border:'1.5px solid #f0d9cc', background:'#fdf8f5',
  fontSize:13, fontFamily:'inherit', color:'#1a0a00', outline:'none',
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */

export default function VendorDetails() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const sellerParam = id || slug || '';

  const [profile,   setProfile]   = useState(null);
  const [products,  setProducts]  = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [views,     setViews]     = useState([]);
  const [totalViews,setTotalViews]= useState(0);
  const [loading,   setLoading]   = useState(true);
  const [viewsLoad, setViewsLoad] = useState(false);
  const [tab,       setTab]       = useState('products');
  const [newText,   setNewText]   = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hovStar,   setHovStar]   = useState(0);
  const [posting,   setPosting]   = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [editText,  setEditText]  = useState('');
  const [editRating,setEditRating]= useState(5);
  const [updating,  setUpdating]  = useState(false);

  const sellerId = profile?.user_id || id || '';
  const [myName, setMyName] = useState('');
  const me = myName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  // SEO: Build meta dynamically based on loaded profile
  const sellerName = profile?.brand_name || profile?.full_name || 'Seller';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s,r) => s+(r.rating||0), 0) / reviews.length).toFixed(1)
    : null;

  useSEO({
    title: sellerName ? `${sellerName} | Verified Seller | BagSearch` : 'Seller Profile | BagSearch',
    description: sellerName
      ? `Browse ${sellerName}'s authentic bag collection on BagSearch. ${products.length} products, ${avgRating || '4.9'} avg rating. Verified seller delivering across Nigeria.`
      : 'View this verified seller\'s bag collection on BagSearch Nigeria. Authentic products, WhatsApp contact, trusted marketplace.',
    keywords: sellerName ? `${sellerName} seller, verified seller, ${sellerName} bags, authentic bags Nigeria` : 'seller profile, verified seller, BagSearch vendors',
    url: `/seller/${sellerParam}`,
    type: 'ProfilePage',
    schema: profile ? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: sellerName,
      description: profile.brand_story || `Verified seller on BagSearch with ${products.length} products`,
      image: profile.avatar_url || `${SITE_URL}/logo.png`,
      url: `${SITE_URL}/seller/${sellerParam}`,
      sameAs: [],
      aggregateRating: avgRating ? {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1
      } : undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${sellerName}'s Bags`,
        itemListElement: products.slice(0, 10).map((p, idx) => ({
          '@type': 'Offer',
          position: idx + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            image: p.src,
            offers: {
              '@type': 'Offer',
              price: p.discountedPrice || p.price,
              priceCurrency: 'NGN',
              availability: 'https://schema.org/InStock'
            }
          }
        }))
      }
    } : undefined
  });

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('users').select('full_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.full_name) setMyName(data.full_name); });
  }, [user?.id]);

  const loadReviews = useCallback(async () => {
    if (!sellerId) return;
    const { data, error } = await supabase
      .from('seller_reviews')
      .select('id,author_name,rating,text,created_at')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews(data || []);
  }, [sellerId]);

  const loadViews = useCallback(async (pids) => {
    if (!pids?.length) { setTotalViews(0); setViews([]); return; }
    setViewsLoad(true);
    try {
      const { count } = await supabase
        .from('product_views')
        .select('*', { count: 'exact', head: true })
        .in('product_id', pids);
      const { data } = await supabase
        .from('product_views')
        .select('id,viewed_at,buyer_name,buyer_phone,buyer_email,buyer_id,product_id,source,products:product_id(id,name,images)')
        .in('product_id', pids)
        .order('viewed_at', { ascending: false })
        .limit(20);
      setTotalViews(count || 0);
      setViews(data || []);
    } catch(e) { console.error(e); }
    finally { setViewsLoad(false); }
  }, []);

  useEffect(() => {
    if (!sellerParam) {
      setProfile(null); setProducts([]); setReviews([]);
      setViews([]); setTotalViews(0); setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const { data: p, error: pErr } = await supabase
          .from('users')
          .select('user_id,full_name,brand_name,brand_story,bag_categories,avatar_url,phone,email')
          .eq('user_id', id || slug)
          .maybeSingle();
        setProfile(p || null);
        const resolvedSellerId = p?.user_id || id;
        if (!resolvedSellerId) {
          setProducts([]); setReviews([]); setViews([]); setTotalViews(0); return;
        }
        const { data: prods, error: prodsErr } = await supabase
          .from('products').select('*')
          .eq('user_id', resolvedSellerId)
          .order('created_at', { ascending: false });
        const mapped = (prods || []).map(p => ({
          id: p.id, name: p.name,
          price: parseFloat(p.price),
          discountedPrice: p.discounted_price ? parseFloat(p.discounted_price) : null,
          discountLabel: p.discount_label || null,
          src: getOptimizedImageUrl(p.images?.[0] || 'https://via.placeholder.com/400', IMG_SIZES.card.width, IMG_SIZES.card.height),
          colors: (Array.isArray(p.colors) ? p.colors : []).map(c =>
            typeof c === 'string'
              ? { id:c, hex: BAG_COLOR_MAP[c.toLowerCase()] || '#c84b11' }
              : { id: c.id||'', hex: c.hex || '#c84b11' }
          ),
          whatsapp: p.whatsapp || '',
        }));
        setProducts(mapped);
        const { data: reviewRows, error: reviewErr } = await supabase
          .from('seller_reviews')
          .select('id,author_name,rating,text,created_at')
          .eq('seller_id', resolvedSellerId)
          .order('created_at', { ascending: false })
          .limit(20);
        setReviews(reviewRows || []);
        await loadViews(mapped.map(p => p.id));
      } catch(e) { console.error('Load error:', e); }
      finally { setLoading(false); }
    })();
  }, [id, slug, sellerParam, loadViews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase
        .from('seller_reviews')
        .insert({
          seller_id: sellerId || sellerParam,
          author_name: me,
          rating: newRating,
          text: newText.trim(),
        });
      if (error) {
        const tempReview = {
          id: 'temp-' + Date.now(),
          author_name: me,
          rating: newRating,
          text: newText.trim(),
          created_at: new Date().toISOString(),
        };
        setReviews(prev => [tempReview, ...prev]);
      } else {
        await loadReviews();
      }
      setNewText(''); setNewRating(5);
      setTab('reviews');
    } catch(e) {
      console.error('Review post failed:', e);
      alert('Could not post review: ' + (e.message || 'Unknown error'));
    } finally {
      setPosting(false);
    }
  };

  const updateReview = async () => {
    if (!editText.trim() || !editId) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('seller_reviews')
        .update({ rating: editRating, text: editText.trim() })
        .eq('id', editId);
      if (error) throw error;
      setReviews(prev => prev.map(r =>
        r.id === editId ? { ...r, rating: editRating, text: editText.trim() } : r
      ));
      setEditId(null); setEditText(''); setEditRating(5);
    } catch(e) {
      console.error('Review update failed:', e);
      alert('Could not update review: ' + (e.message || 'Unknown error'));
    } finally { setUpdating(false); }
  };

  const deleteReview = async (rid) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('seller_reviews').delete().eq('id', rid);
    await loadReviews();
  };

  const name  = profile?.brand_name || profile?.full_name || 'Seller';
  const story = profile?.brand_story || null;
  const cats  = Array.isArray(profile?.bag_categories) ? profile.bag_categories : [];
  const avg   = reviews.length > 0
    ? (reviews.reduce((s,r) => s+(r.rating||0), 0) / reviews.length).toFixed(1)
    : null;
  const loc = LOCATIONS.find(l => l.id === (profile?.location || ''));

  const TABS = [
    { id:'products', label:'Products (' + products.length + ')' },
    { id:'about',    label:'About' },
    { id:'reviews',  label:'Reviews (' + reviews.length + ')' },
    { id:'views',    label:'Views (' + totalViews + ')' },
  ];

  /* ── Loading state ── */
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.primaryPale,fontFamily:"'Manrope',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:'3px solid #f7ece4',borderTopColor:C.primary,borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 12px'}}/>
        <p style={{color:C.textMuted,fontWeight:600}}>Loading seller…</p>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  );

  /* ── Not found state ── */
  if (!profile) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.primaryPale,fontFamily:"'Manrope',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'2px solid #f9c4a0'}}>
          <IconStore size={30} style={{color:C.primary}}/>
        </div>
        <p style={{color:C.textMuted,fontWeight:600,marginBottom:16}}>Seller not found</p>
        <button onClick={()=>navigate('/products')} style={{padding:'10px 24px',background:C.primary,color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700}}>Back to Products</button>
      </div>
    </div>
  );

  /* ── Stat card data ── */
  const STATS = [
    { Icon: IconBag,  value: products.length,               label: 'products'    },
    { Icon: IconEye,  value: totalViews.toLocaleString(),    label: 'total views' },
    { Icon: IconStar2,value: avg || '—',                     label: 'avg rating'  },
    { Icon: IconChat, value: reviews.length,                 label: 'reviews'     },
  ];

  /* ── About info cards ── */
  const ABOUT_CARDS = [
    { Icon: IconMapPin,  label: 'Location',        value: loc ? loc.name : 'Nigeria'  },
    { Icon: IconPackage, label: 'Total products',  value: products.length              },
    { Icon: IconStar2,   label: 'Avg rating',      value: avg || '—'                  },
    { Icon: IconChat,    label: 'Reviews',          value: reviews.length              },
  ];

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#fdf4ee 0%,white 40%)',fontFamily:"'Manrope',sans-serif",color:C.text}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap\');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}@keyframes ldSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}@media(max-width:640px){.pgrid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}.srow{grid-template-columns:repeat(2,1fr)!important}}'}</style>

      {/* ── Header ── */}
      <header style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #f7ece4',position:'sticky',top:0,zIndex:50,padding:'0 20px',height:60,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>navigate('/products')}
          style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,border:'1px solid #f0d9cc',background:'#fdf8f5',cursor:'pointer',color:C.textMid,fontSize:13,fontWeight:700,transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0d9cc';e.currentTarget.style.color=C.textMid;}}>
          <IconArrowLeft size={14}/> Back to Vendors
        </button>
        <span style={{fontSize:16,fontWeight:900,color:C.text}}>Bag<span style={{color:C.primary}}>Search</span></span>
      </header>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 20px 80px',animation:'fadeIn 0.4s ease'}}>

        {/* ── Hero ── */}
        <div style={{borderRadius:24,overflow:'hidden',marginBottom:20,background:'linear-gradient(135deg,#1a0a00 0%,#4a1a06 55%,#c84b11 100%)',position:'relative'}}>
          <div style={{position:'absolute',inset:0,opacity:0.07,backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'24px 24px',pointerEvents:'none'}}/>
          <div style={{height:4,background:'linear-gradient(90deg,#f97316,#ea580c,#f97316)',backgroundSize:'200%',animation:'shimmer 3s linear infinite'}}/>
          <div style={{padding:'28px 32px 68px',position:'relative'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
              <div style={{width:88,height:88,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'3px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,flexShrink:0,overflow:'hidden'}}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} loading="eager" decoding="async" width="88" height="88" style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name ? `${name} seller profile photo on BagSearch` : 'Seller profile photo on BagSearch'}/>
                  : <IconStore size={40} style={{color:'rgba(255,255,255,0.7)'}}/>}
              </div>
              <div style={{flex:1,minWidth:200}}>
                <h2 style={{fontSize:26,fontWeight:900,color:'white',letterSpacing:'-0.03em',marginBottom:4}}>{name}</h2>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
                  {loc && (
                    <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.6)',fontWeight:500}}>
                      <IconMapPin size={12} style={{color:'rgba(255,255,255,0.5)'}}/>
                      {loc.name}
                    </span>
                  )}
                  {avg && (
                    <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#f97316',fontWeight:800}}>
                      <IconStar size={11} filled/> {avg}
                    </span>
                  )}
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {cats.map(tag => (
                    <span key={tag} style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'rgba(255,255,255,0.14)',color:'rgba(255,255,255,0.85)',border:'1px solid rgba(255,255,255,0.2)'}}>{tag}</span>
                  ))}
                </div>
              </div>
              {profile.phone && (
                <a href={'https://wa.me/' + profile.phone.replace(/\D/g,'') + '?text=Hi%2C%20I%20saw%20your%20store%20on%20BagSearch%21'}
                  target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25d366',color:'white',border:'none',borderRadius:12,padding:'11px 18px',fontWeight:800,fontSize:13,textDecoration:'none',boxShadow:'0 6px 20px rgba(37,211,102,0.4)',transition:'all 0.25s',flexShrink:0}}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  <IconWhatsapp size={16}/> Contact Seller
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="srow" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:-52,marginBottom:28,position:'relative',zIndex:2}}>
          {STATS.map(({ Icon, value, label }) => (
            <div key={label} style={{background:'white',borderRadius:16,border:'1.5px solid #f7ece4',padding:'16px 14px',textAlign:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',border:'1px solid #f9c4a0'}}>
                <Icon size={16} style={{color:C.primary}}/>
              </div>
              <div style={{fontSize:20,fontWeight:900,color:C.text,letterSpacing:'-0.03em',lineHeight:1}}>{value}</div>
              <div style={{fontSize:10,fontWeight:700,color:C.textFaint,marginTop:3,textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{display:'flex',gap:4,background:C.surfaceDim,border:'1.5px solid #f7ece4',borderRadius:16,padding:5,marginBottom:24}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:'10px 8px',borderRadius:11,border:'none',cursor:'pointer',fontSize:13,fontWeight:800,transition:'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',background:tab===t.id?'linear-gradient(135deg,#c84b11,#f97316)':'transparent',color:tab===t.id?'white':C.textMuted,boxShadow:tab===t.id?'0 4px 14px rgba(200,75,17,0.35)':'none',transform:tab===t.id?'scale(1.01)':'scale(1)'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ PRODUCTS TAB ══ */}
        {tab === 'products' && (
          <div>
            {products.length > 0 ? (
              <div className="pgrid">
                {products.map(p => (
                  <div key={p.id} onClick={()=>navigate('/products/'+p.id)}
                    style={{background:'white',borderRadius:16,overflow:'hidden',border:'1.5px solid #f7ece4',cursor:'pointer',transition:'all 0.25s'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(200,75,17,0.1)';e.currentTarget.style.borderColor='#f9c4a0';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#f7ece4';}}>
                    <div style={{height:180,overflow:'hidden',background:'#fde8d8',position:'relative'}}>
                      <img src={p.src} alt={p.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      {p.discountLabel && (
                        <span style={{position:'absolute',top:8,left:8,background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:20,display:'flex',alignItems:'center',gap:3}}>
                          <IconPercent size={8}/> {p.discountLabel}
                        </span>
                      )}
                    </div>
                    <div style={{padding:'12px 14px'}}>
                      <p style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</p>
                      <div style={{display:'flex',gap:3,marginBottom:8}}>
                        {p.colors.slice(0,5).map((c,i)=>(
                          <span key={i} style={{width:12,height:12,borderRadius:'50%',background:c.hex,border:'2px solid white',outline:'1px solid #f0d9cc',display:'inline-block'}}/>
                        ))}
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div>
                          {p.discountedPrice && <p style={{fontSize:10,color:C.textFaint,textDecoration:'line-through'}}>{fmt(p.price)}</p>}
                          <p style={{fontSize:17,fontWeight:900,color:C.primary}}>{fmt(p.discountedPrice||p.price)}</p>
                        </div>
                        {p.whatsapp && (
                          <a href={'https://wa.me/'+p.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Hi! I\'m interested in *'+p.name+'*\n\u{1F517} '+window.location.origin+'/products/'+p.id)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e=>e.stopPropagation()}
                            style={{width:34,height:34,borderRadius:10,background:'#dcfce7',color:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',flexShrink:0,transition:'all 0.2s'}}
                            onMouseEnter={e=>{e.currentTarget.style.background='#25d366';e.currentTarget.style.color='white';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#dcfce7';e.currentTarget.style.color='#16a34a';}}>
                            <IconWhatsapp size={16}/>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'60px 20px'}}>
                <div style={{width:72,height:72,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'2px solid #f9c4a0'}}>
                  <IconShopping size={32} style={{color:C.primary}}/>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:6}}>No products yet</h3>
                <p style={{fontSize:13,color:C.textMuted}}>This seller hasn't listed any products.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ ABOUT TAB ══ */}
        {tab === 'about' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'white',borderRadius:20,border:'1.5px solid #f7ece4',overflow:'hidden'}}>
              <div style={{height:4,background:'linear-gradient(90deg,#c84b11,#f97316)'}}/>
              <div style={{padding:'24px 28px'}}>
                <h4 style={{fontSize:15,fontWeight:900,color:C.text,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:28,height:28,borderRadius:8,background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #f9c4a0'}}>
                    <IconBook size={14} style={{color:C.primary}}/>
                  </span>
                  Brand Story
                </h4>
                {story
                  ? <p style={{fontSize:14,color:C.textMid,lineHeight:1.75}}>{story}</p>
                  : <p style={{fontSize:13,color:C.textFaint,fontStyle:'italic'}}>This seller hasn't added a brand story yet.</p>}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {ABOUT_CARDS.map(({ Icon, label, value }) => (
                <div key={label} style={{background:'white',borderRadius:14,padding:'16px 18px',border:'1.5px solid #f7ece4',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:11,background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid #f9c4a0'}}>
                    <Icon size={18} style={{color:C.primary}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:C.textFaint,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>{label}</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.text}}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
            {cats.length > 0 && (
              <div style={{background:'white',borderRadius:16,padding:'20px 22px',border:'1.5px solid #f7ece4'}}>
                <h4 style={{fontSize:13,fontWeight:800,color:C.textFaint,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                  <IconTag size={13} style={{color:C.textFaint}}/> Categories
                </h4>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {cats.map(cat => (
                    <span key={cat} style={{fontSize:12,fontWeight:700,padding:'6px 14px',borderRadius:20,background:'#fde8d8',color:C.primary,border:'1px solid #f9c4a0'}}>{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ REVIEWS TAB ══ */}
        {tab === 'reviews' && (
          <div>
            {reviews.length > 0 && (
              <div style={{background:'white',borderRadius:20,padding:'22px 26px',border:'1.5px solid #f7ece4',marginBottom:20,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:52,fontWeight:900,color:C.primary,letterSpacing:'-0.05em',lineHeight:1}}>{avg}</div>
                  <div style={{display:'flex',justifyContent:'center',gap:3,margin:'6px 0'}}>
                    <Stars rating={parseFloat(avg)} size={14}/>
                  </div>
                  <div style={{fontSize:11,color:C.textFaint,fontWeight:600}}>{reviews.length} review{reviews.length!==1?'s':''}</div>
                </div>
                <div style={{flex:1,minWidth:180}}>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r=>Math.round(r.rating)===star).length;
                    const pct = reviews.length > 0 ? (count/reviews.length)*100 : 0;
                    return (
                      <div key={star} style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
                        <span style={{fontSize:11,fontWeight:700,color:C.textMuted,width:8}}>{star}</span>
                        <IconStar size={11} filled/>
                        <div style={{flex:1,height:6,background:'#f7ece4',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#f97316,#c84b11)',borderRadius:99,transition:'width 0.6s ease'}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,color:C.textFaint,width:14,textAlign:'right'}}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{background:'#fdf4ee',borderRadius:20,padding:'22px 26px',border:'1.5px solid #f9c4a0',marginBottom:24}}>
              <h4 style={{fontSize:15,fontWeight:900,color:C.text,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:28,height:28,borderRadius:8,background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #f9c4a0'}}>
                  <IconPencil size={14} style={{color:C.primary}}/>
                </span>
                Write a Review
              </h4>
              <form onSubmit={submitReview}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.textMuted,marginRight:4}}>Your rating:</span>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={()=>setNewRating(star)}
                      onMouseEnter={()=>setHovStar(star)} onMouseLeave={()=>setHovStar(0)}
                      style={{background:'none',border:'none',cursor:'pointer',padding:2,transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',transform:(hovStar||newRating)>=star?'scale(1.28) rotate(-5deg)':'scale(1)'}}>
                      <IconStar size={26} filled={(hovStar||newRating)>=star}/>
                    </button>
                  ))}
                </div>
                <textarea value={newText} onChange={e=>setNewText(e.target.value)}
                  placeholder="Share your experience with this seller…"
                  style={{...iStyle,minHeight:96,resize:'vertical',marginBottom:14}}
                  onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow='0 0 0 3px rgba(200,75,17,0.1)';}}
                  onBlur={e=>{e.target.style.borderColor='#f0d9cc';e.target.style.boxShadow='none';}}/>
                <button type="submit" disabled={posting||!newText.trim()}
                  style={{padding:'12px 22px',borderRadius:12,border:'none',background:posting||!newText.trim()?'#fde8d8':'linear-gradient(135deg,#c84b11,#f97316)',color:posting||!newText.trim()?C.primary:'white',fontWeight:900,fontSize:13,cursor:posting||!newText.trim()?'default':'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',gap:8}}>
                  {posting
                    ? <><IconLoader size={14} style={{color:C.primary}}/> Posting…</>
                    : <><IconSparkle size={14}/> Post Review</>}
                </button>
              </form>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {reviews.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',border:'2px solid #f9c4a0'}}>
                    <IconChat size={26} style={{color:C.primary}}/>
                  </div>
                  <p style={{fontSize:14,color:C.textMuted,fontWeight:600}}>No reviews yet — be the first!</p>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} style={{background:'white',borderRadius:16,border:'1.5px solid #f7ece4',overflow:'hidden',transition:'border-color 0.2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#f9c4a0'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#f7ece4'}>
                  {editId === r.id ? (
                    <div style={{padding:'20px 22px',background:'#fdf4ee'}}>
                      <h5 style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}}>Edit your review</h5>
                      <div style={{display:'flex',gap:4,marginBottom:12}}>
                        {[1,2,3,4,5].map(s=>(
                          <button key={s} type="button" onClick={()=>setEditRating(s)} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                            <IconStar size={22} filled={s<=editRating}/>
                          </button>
                        ))}
                      </div>
                      <textarea value={editText} onChange={e=>setEditText(e.target.value)}
                        style={{...iStyle,minHeight:80,resize:'vertical',marginBottom:12}}
                        onFocus={e=>e.target.style.borderColor=C.primary}
                        onBlur={e=>e.target.style.borderColor='#f0d9cc'}/>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={updateReview} disabled={updating}
                          style={{padding:'9px 18px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',fontWeight:800,fontSize:12,cursor:'pointer'}}>
                          {updating?'Saving…':'Save changes'}
                        </button>
                        <button onClick={()=>{setEditId(null);setEditText('');setEditRating(5);}}
                          style={{padding:'9px 18px',borderRadius:10,border:'1.5px solid #f0d9cc',background:'white',color:C.textMid,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{padding:'18px 22px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,gap:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#c84b11,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:'white',flexShrink:0}}>
                            {(r.author_name||'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:800,color:C.text}}>{r.author_name||'Anonymous'}</div>
                            <div style={{fontSize:11,color:C.textFaint,fontWeight:500}}>{r.created_at?new Date(r.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):''}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <Stars rating={r.rating}/>
                          {user && r.author_name === me && (
                            <div style={{display:'flex',gap:6}}>
                              <button onClick={()=>{setEditId(r.id);setEditText(r.text);setEditRating(r.rating);}}
                                style={{background:'#fdf8f5',border:'1px solid #f0d9cc',borderRadius:7,padding:'4px 8px',cursor:'pointer',fontSize:11,color:C.textMid,fontWeight:700}}>Edit</button>
                              <button onClick={()=>deleteReview(r.id)}
                                style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:7,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'#dc2626',fontWeight:700}}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p style={{fontSize:13,color:C.textMid,lineHeight:1.65,margin:0}}>{r.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ VIEWS TAB ══ */}
        {tab === 'views' && (
          <div style={{background:'white',borderRadius:20,border:'1.5px solid #f7ece4',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #f7ece4',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h4 style={{fontSize:15,fontWeight:900,color:C.text,marginBottom:2}}>Recent Product Views</h4>
                <p style={{fontSize:12,color:C.textFaint,fontWeight:500}}>{totalViews>0?Math.min(views.length,20)+' of '+totalViews+' total views':'No views yet'}</p>
              </div>
              <div style={{width:44,height:44,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid #f9c4a0'}}>
                <IconEye size={20} style={{color:C.primary}}/>
              </div>
            </div>

            {viewsLoad ? (
              <div style={{textAlign:'center',padding:'50px 20px'}}>
                <div style={{width:24,height:24,borderRadius:'50%',border:'2.5px solid #f0d9cc',borderTopColor:C.primary,animation:'ldSpin 0.8s linear infinite',margin:'0 auto 12px'}}/>
                <p style={{fontSize:13,color:C.textMuted}}>Loading views…</p>
              </div>
            ) : views.length === 0 ? (
              <div style={{textAlign:'center',padding:'50px 20px'}}>
                <div style={{width:60,height:60,borderRadius:'50%',background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',border:'2px solid #f9c4a0'}}>
                  <IconEye size={26} style={{color:C.primary}}/>
                </div>
                <p style={{fontSize:14,color:C.textMuted}}>No product views yet.</p>
              </div>
            ) : (
              <div>
                {views.map((v,idx) => {
                  const bName  = v.users?.full_name || v.buyer_name  || 'Anonymous Buyer';
                  const bEmail = v.users?.email     || v.buyer_email;
                  const bPhone = v.users?.phone     || v.buyer_phone;
                  const pName  = v.products?.name   || 'Unknown Product';
                  const pImg   = v.products?.images?.[0];
                  return (
                    <div key={v.id} style={{display:'flex',gap:14,alignItems:'center',padding:'16px 24px',borderBottom:idx<views.length-1?'1px solid #f7ece4':'none',transition:'background 0.2s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#fdf4ee'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {pImg
                        ? <img src={pImg} alt={pName} loading="lazy" style={{width:52,height:52,borderRadius:11,objectFit:'cover',flexShrink:0,border:'1px solid #f7ece4'}}/>
                        : <div style={{width:52,height:52,borderRadius:11,background:'#fde8d8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid #f9c4a0'}}>
                            <IconBag size={22} style={{color:C.primary}}/>
                          </div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:800,color:C.text}}>{bName}</span>
                          <span style={{fontSize:10,fontWeight:700,background:'#fde8d8',color:C.primary,border:'1px solid #f9c4a0',padding:'2px 8px',borderRadius:20}}>{v.source||'web'}</span>
                        </div>
                        <div style={{fontSize:12,color:C.textMid,marginBottom:3}}>viewed <strong style={{color:C.text}}>{pName}</strong></div>
                        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontSize:11,color:C.textFaint}}>{new Date(v.viewed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                          {bEmail && (
                            <span style={{fontSize:11,color:C.textFaint,display:'flex',alignItems:'center',gap:3}}>
                              <IconEmail size={11}/> {bEmail}
                            </span>
                          )}
                          {bPhone && (
                            <span style={{fontSize:11,color:C.textFaint,display:'flex',alignItems:'center',gap:3}}>
                              <IconPhone size={11}/> {bPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}