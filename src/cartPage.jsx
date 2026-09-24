/**
 * Cart Page — full standalone page at /cart
 * Items are grouped by seller (each seller is paid and notified separately).
 */
import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { supabase } from './services/api';
import { payForProduct, getSellerSubaccountId } from './components/FlutterwavePayment';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';
import { productPath } from './utils/slugify';

const K = {
  ink: '#1E1A17',
  muted: '#6F6761',
  faint: '#A69E98',
  line: '#EFE9E5',
  pill: '#F4F1EF',
  paper: '#F7F4F1',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  accent: '#C84B11',
  price: '#C2361F',
  safeBg: '#E7F4EA',
  safeFg: '#2F6B3E',
  waBg: '#E7F7EE',
  waFg: '#0F7B53',
  font: "'Poppins', system-ui, sans-serif",
};
const PASTELS = ['#A6DFAE', '#9ADFE1', '#E6D3F5', '#F8C9A5'];
const SELLER_TONES = ['#3F4656', '#D2553F', '#7E6A93', '#5B8A8C', '#C9A36B'];
const spring = { type: 'spring', stiffness: 100, damping: 20 };
const snappy = { type: 'spring', stiffness: 380, damping: 30 };

function formatCurrency(n) { return `₦${Number(n || 0).toLocaleString()}`; }
// What the buyer actually pays per unit — the sale price when there is one
const unitPrice = item => Number(item.discountedPrice || item.price || 0);
const initialsOf = name => (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'S';

function getOptimizedImageUrl(url, w, h) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('supabase.co') && url.includes('/storage/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}width=${w}&height=${h}&resize=cover&quality=75`;
  }
  return url;
}

const Svg = ({ size = 16, sw = 1.9, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const WaIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35z" />
    <path d="M12 0C5.37 0 0 5.37 0 12c0 2.03.51 3.94 1.4 5.61L.05 23.34a.75.75 0 0 0 .92.92l5.72-1.35A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.75a9.71 9.71 0 0 1-5.27-1.55.75.75 0 0 0-.57-.1l-3.5.82.82-3.5a.75.75 0 0 0-.1-.57A9.71 9.71 0 0 1 2.25 12c0-5.39 4.37-9.75 9.75-9.75s9.75 4.36 9.75 9.75-4.36 9.75-9.75 9.75z" />
  </svg>
);

function Spinner({ light }) {
  return <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${light ? 'rgba(255,255,255,.3)' : 'rgba(30,26,23,.2)'}`, borderTopColor: light ? '#fff' : K.ink, display: 'inline-block' }} />;
}

function QtyStepper({ qty, onDec, onInc, name }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 999, background: K.pill, padding: 3 }}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={onDec} aria-label={`Fewer ${name}`}
        style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 16, color: K.ink, fontFamily: K.font }}>−</motion.button>
      <span style={{ width: 32, textAlign: 'center', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', height: 20, position: 'relative' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={qty} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={snappy} style={{ display: 'block' }}>{qty}</motion.span>
        </AnimatePresence>
      </span>
      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={onInc} aria-label={`More ${name}`}
        style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: K.ink, color: '#fff', cursor: 'pointer', fontSize: 16, fontFamily: K.font }}>+</motion.button>
    </div>
  );
}

function CartItemRow({ item, index, onUpdateQty, onRemove, onOpen }) {
  const unit = unitPrice(item);
  const colour = (item.colors || [])[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.28 } }}
      transition={spring}
      className="ck-item"
      style={{ padding: 14, display: 'flex', gap: 14, borderBottom: `1px solid #F4EFEB`, overflow: 'hidden' }}
    >
      <button type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.name}`}
        style={{ width: 92, height: 92, border: 'none', borderRadius: 20, background: PASTELS[index % PASTELS.length], padding: 7, boxSizing: 'border-box', flexShrink: 0, cursor: 'pointer' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
          <img src={getOptimizedImageUrl(item.src, 180, 180)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </button>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <p style={{ margin: 0, flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
          <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`} className="ck-bin"
            style={{ width: 32, height: 32, margin: '-5px -6px 0 0', border: 'none', borderRadius: 10, background: 'none', color: K.faint, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Svg size={16}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>
          </motion.button>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: K.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          {colour && <span style={{ width: 9, height: 9, borderRadius: '50%', background: colour.hex || colour, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />}
          {formatCurrency(unit)} each
          {item.discountedPrice && <span style={{ textDecoration: 'line-through', color: K.faint }}>{formatCurrency(item.price)}</span>}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <motion.span key={unit * item.qty} initial={{ scale: 0.92, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={snappy}
            style={{ fontSize: 15, fontWeight: 600, color: K.price }}>{formatCurrency(unit * item.qty)}</motion.span>
          <QtyStepper
            qty={item.qty} name={item.name}
            onDec={() => (item.qty > 1 ? onUpdateQty(item.id, item.qty - 1) : onRemove(item.id))}
            onInc={() => onUpdateQty(item.id, item.qty + 1)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function SellerGroup({ group, index, onUpdateQty, onRemove, onOpen, onChat }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ ...spring, delay: index * 0.06 }}
      style={{ border: `1px solid ${K.line}`, borderRadius: 24, overflow: 'hidden', background: '#fff' }}
    >
      <div style={{ minHeight: 60, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${K.line}` }}>
        <span style={{ width: 36, height: 36, borderRadius: '50%', background: SELLER_TONES[index % SELLER_TONES.length], color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initialsOf(group.seller)}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.seller}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: K.muted }}>{group.count} {group.count === 1 ? 'item' : 'items'}</span>
        </span>
        {group.whatsapp && (
          <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onChat(group)} aria-label={`Order from ${group.seller} on WhatsApp`}
            style={{ height: 36, padding: '0 12px', border: 'none', borderRadius: 999, background: K.waBg, color: K.waFg, fontFamily: K.font, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <WaIcon size={13} /> WhatsApp
          </motion.button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {group.items.map((item, i) => (
          <CartItemRow key={item.id} item={item} index={index * 2 + i} onUpdateQty={onUpdateQty} onRemove={onRemove} onOpen={onOpen} />
        ))}
      </AnimatePresence>
      <div style={{ height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: K.muted, background: '#FBFAF9' }}>
        <span>From {group.seller}</span>
        <motion.span key={group.subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} style={{ fontWeight: 600, color: K.ink }}>{formatCurrency(group.subtotal)}</motion.span>
      </div>
    </motion.section>
  );
}

function SafeNote({ compact }) {
  return (
    <div style={{ padding: compact ? '0 14px' : 14, minHeight: compact ? 44 : 'auto', borderRadius: compact ? 14 : 18, background: K.safeBg, color: K.safeFg, fontSize: 12.5, lineHeight: 1.5, display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: 10 }}>
      <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'flex', flexShrink: 0 }}>
        <Svg size={17} sw={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></Svg>
      </motion.span>
      {compact ? 'Your payment is held until you confirm delivery' : 'Your money is held safely and only released to the seller after you confirm the bag arrived.'}
    </div>
  );
}

function PayButton({ total, paying, onPay, big }) {
  return (
    <motion.button type="button" onClick={onPay} disabled={paying} whileTap={{ scale: 0.98 }} className="ck-pay"
      style={{ width: '100%', height: big ? 56 : 54, border: 'none', borderRadius: 999, background: K.ink, color: '#fff', fontFamily: K.font, fontSize: 15, fontWeight: 500, cursor: paying ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}>
      {paying ? <><Spinner light /> Opening secure checkout…</> : <>
        <Svg size={17} sw={2}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
        Pay {formatCurrency(total)} securely
        <span aria-hidden="true" className="ck-shine" />
      </>}
    </motion.button>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cartItems, updateQty, removeFromCart, addToCart } = useCart();
  const [paying, setPaying] = useState(false);
  const [chattedSeller, setChattedSeller] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isWide, setIsWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 960);

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 960);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const total = cartItems.reduce((a, i) => a + unitPrice(i) * i.qty, 0);
  const itemCount = cartItems.reduce((a, i) => a + i.qty, 0);

  const groups = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => {
      const key = item.sellerId || item.seller || 'seller';
      if (!map.has(key)) map.set(key, { key, seller: item.seller || 'Seller', whatsapp: item.whatsapp || '', items: [] });
      const g = map.get(key);
      g.items.push(item);
      if (!g.whatsapp && item.whatsapp) g.whatsapp = item.whatsapp;
    });
    return [...map.values()].map(g => ({
      ...g,
      count: g.items.reduce((a, i) => a + i.qty, 0),
      subtotal: g.items.reduce((a, i) => a + unitPrice(i) * i.qty, 0),
    }));
  }, [cartItems]);

  // A few other bags to suggest (not already in the cart)
  const cartIds = cartItems.map(i => i.id).join(',');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id,name,price,discounted_price,images,seller_name,user_id,seller_id,whatsapp')
        .order('created_at', { ascending: false })
        .limit(16);
      if (cancelled || !data) return;
      const inCart = new Set(cartIds.split(','));
      setSuggestions(data.filter(p => !inCart.has(String(p.id))).slice(0, 8).map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        discountedPrice: p.discounted_price ? parseFloat(p.discounted_price) : null,
        src: p.images?.[0] || '',
        seller: p.seller_name || 'Seller',
        sellerId: p.seller_id || p.user_id || null,
        whatsapp: p.whatsapp || '',
      })));
    })();
    return () => { cancelled = true; };
  }, [cartIds]);

  const openProduct = item => navigate(productPath(item.name, item.id));

  const handlePayNow = async () => {
    if (!cartItems.length) return;
    if (!user) { navigate('/login'); return; }
    setPaying(true);
    try {
      const firstItem = cartItems[0];
      const productNames = cartItems.map(i => i.name).join(', ');
      const sellerIds = [...new Set(cartItems.map(i => i.sellerId).filter(Boolean))];
      const sellerId = sellerIds[0] || null;
      // Look up seller's subaccount ID for direct payout
      const sellerSubaccountId = await getSellerSubaccountId(sellerId);
      await payForProduct({
        amount: total,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || 'Customer',
        productName: productNames.length > 60 ? productNames.slice(0, 57) + '...' : productNames,
        productId: firstItem.id,
        sellerName: firstItem.seller || 'Seller',
        sellerId,
        sellerSubaccountId,
        onSuccess: async (response) => {
          // Create order records for each seller so we can track delivery & payout
          try {
            const orderItems = cartItems.map(item => ({
              buyer_id: user.id,
              seller_id: item.sellerId || null,
              product_id: item.id,
              product_name: item.name,
              product_image: item.src || '',
              seller_name: item.seller || 'Seller',
              quantity: item.qty,
              unit_price: unitPrice(item),
              total_price: unitPrice(item) * item.qty,
              status: 'paid',
              flutterwave_tx_ref: response.tx_ref || response.txRef || '',
              flutterwave_tx_id: response.transaction_id?.toString() || '',
            }));
            await supabase.from('orders').insert(orderItems);
            // Notify each seller
            for (const sid of sellerIds) {
              const sellerItems = cartItems.filter(i => i.sellerId === sid);
              const sellerTotal = sellerItems.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
              supabase.from('notifications').insert([{
                seller_id: sid,
                type: 'new_order',
                title: 'New order received!',
                message: `${user.user_metadata?.full_name || 'A buyer'} ordered ${sellerItems.length} item(s) for ₦${sellerTotal.toLocaleString()}. Payment is held until delivery is confirmed.`,
                is_read: false,
              }]).catch(() => {});
            }
          } catch (err) { console.warn('Order record failed:', err); }
          setPaying(false);
          navigate('/orders');
        },
        onClose: () => { setPaying(false); },
      });
    } catch (err) { console.error('Cart payment error:', err); setPaying(false); }
  };

  const handleChatSeller = group => {
    const number = normalizeWhatsAppNumber(group.whatsapp || '');
    if (!number) return;
    const itemLines = group.items.map(i => `• ${i.qty}x *${i.name}* — ₦${(unitPrice(i) * i.qty).toLocaleString()}`).join('\n');
    const msg = `Hi ${group.seller}!\n\nI'd like to order:\n\n${itemLines}\n\n*Subtotal: ₦${group.subtotal.toLocaleString()}*\n\nPlease confirm availability. Thank you!`;
    window.open(buildWhatsAppUrl(number, msg), '_blank', 'noopener,noreferrer');
    setChattedSeller(group.key);
    setTimeout(() => setChattedSeller(null), 2400);
  };

  const empty = cartItems.length === 0;

  const summary = (
    <motion.aside
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}
      style={{ borderRadius: isWide ? 28 : 24, background: K.paper, padding: isWide ? 26 : 18, position: isWide ? 'sticky' : 'static', top: 24 }}
    >
      {isWide && <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 600 }}>Order summary</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: K.muted }}>
        {isWide
          ? groups.map(g => (
            <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.seller} · {g.count} {g.count === 1 ? 'item' : 'items'}</span>
              <span style={{ color: K.ink, flexShrink: 0 }}>{formatCurrency(g.subtotal)}</span>
            </div>
          ))
          : <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'items'}</span><span style={{ color: K.ink }}>{formatCurrency(total)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span style={{ color: K.ink }}>Agreed with seller</span></div>
      </div>
      <div style={{ height: 1, background: '#E6E0DC', margin: '16px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
        <motion.span key={total} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={snappy}
          style={{ fontSize: isWide ? 32 : 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{formatCurrency(total)}</motion.span>
      </div>
      {isWide && <>
        <div style={{ marginTop: 20 }}><PayButton total={total} paying={paying} onPay={handlePayNow} big /></div>
        <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 11.5, color: K.faint }}>Card, bank transfer or USSD · Powered by Flutterwave</p>
        <div style={{ marginTop: 18 }}><SafeNote /></div>
      </>}
    </motion.aside>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: K.font, color: K.ink }}>
      <style>{`
        .ck-item{transition:background .2s}
        .ck-item:hover{background:#FCFAF8}
        .ck-bin:hover{color:${K.price};background:#FDEBEC}
        .ck-pay:not(:disabled):hover{background:#000}
        .ck-shine{position:absolute;top:0;bottom:0;width:36%;left:-50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.22),transparent);animation:ckShine 3.4s ease-in-out 1.2s infinite}
        @keyframes ckShine{0%{left:-50%}45%,100%{left:130%}}
        .ck-hscroll{scrollbar-width:none}.ck-hscroll::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{ maxWidth: isWide ? 1440 : 640, margin: '0 auto', padding: isWide ? '0 clamp(24px,5vw,72px)' : '0 16px' }}>
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={spring}
          style={{ minHeight: isWide ? 110 : 76, display: 'flex', alignItems: 'center', gap: 14 }}>
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)} aria-label="Back"
            style={{ width: 44, height: 44, border: 'none', borderRadius: 14, background: K.pill, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: K.ink, flexShrink: 0 }}>
            <Svg size={18} sw={2}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: isWide ? 34 : 21, fontWeight: 600, letterSpacing: '-0.02em' }}>Your cart</h1>
            <p style={{ margin: 0, fontSize: isWide ? 14 : 12, color: K.muted }}>
              {empty ? 'No bags yet' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}${groups.length > 1 ? ` from ${groups.length} sellers` : ''}`}
            </p>
          </div>
          {isWide && !empty && <button type="button" onClick={() => navigate('/products')} style={{ border: 'none', background: 'none', fontFamily: K.font, fontSize: 13, color: K.accent, cursor: 'pointer' }}>← Keep shopping</button>}
        </motion.header>

        <AnimatePresence mode="wait" initial={false}>
          {empty ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}
              style={{ padding: isWide ? '40px 0 100px' : '40px 12px 140px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
                <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: K.yellow }} />
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
                  style={{ position: 'absolute', right: -6, bottom: 6, width: 64, height: 64, borderRadius: '50%', background: K.green }} />
                <motion.img src="/logo.webp" alt="" width="140" height="140"
                  animate={{ y: [0, -10, 0], rotate: [-4, 3, -4] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', left: 20, top: 16, width: 140, height: 140, objectFit: 'contain' }} />
              </div>
              <h2 style={{ margin: '26px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Your cart is empty</h2>
              <p style={{ margin: '8px auto 0', maxWidth: 300, fontSize: 13.5, lineHeight: 1.6, color: K.muted }}>Bags you add will wait for you here. Start with what is trending, or search with a photo.</p>
              <div style={{ margin: '24px auto 0', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => navigate('/products')} className="ck-pay"
                  style={{ height: 52, border: 'none', borderRadius: 999, background: K.ink, color: '#fff', fontFamily: K.font, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Browse bags
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => navigate('/products', { state: { openPhotoSearch: true } })}
                  style={{ height: 52, border: `1.5px solid ${K.ink}`, borderRadius: 999, background: '#fff', color: K.ink, fontFamily: K.font, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Svg size={16} sw={1.8}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>
                  Search by photo
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: isWide ? 'grid' : 'block', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 32, alignItems: 'start', paddingBottom: isWide ? 80 : 190 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isWide ? 20 : 16 }}>
                {!isWide && <SafeNote compact />}
                <AnimatePresence initial={false}>
                  {groups.map((g, i) => (
                    <div key={g.key} style={{ position: 'relative' }}>
                      <SellerGroup group={g} index={i} onUpdateQty={updateQty} onRemove={removeFromCart} onOpen={openProduct} onChat={handleChatSeller} />
                      <AnimatePresence>
                        {chattedSeller === g.key && (
                          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', right: 12, top: -14, height: 26, padding: '0 10px', borderRadius: 999, background: K.ink, color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center' }}>
                            WhatsApp opened
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </AnimatePresence>
                {!isWide && summary}

                {suggestions.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring} style={{ marginTop: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Pairs well with</h2>
                    <div className="ck-hscroll" style={{ marginTop: 12, display: 'flex', gap: 12, overflowX: 'auto', margin: isWide ? '12px 0 0' : '12px -16px 0', padding: isWide ? '0 0 6px' : '0 16px 6px', scrollSnapType: 'x mandatory' }}>
                      {suggestions.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: i * 0.05 }}
                          style={{ width: 150, flexShrink: 0, scrollSnapAlign: 'start' }}>
                          <button type="button" onClick={() => openProduct(p)} aria-label={`Open ${p.name}`}
                            style={{ position: 'relative', width: '100%', height: 130, border: 'none', borderRadius: 20, background: PASTELS[i % PASTELS.length], padding: 8, boxSizing: 'border-box', cursor: 'pointer' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: 13, overflow: 'hidden', background: '#fff' }}>
                              <img src={getOptimizedImageUrl(p.src, 280, 240)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          </button>
                          <p style={{ margin: '8px 0 0', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: K.price }}>{formatCurrency(unitPrice(p))}</span>
                            <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}
                              style={{ width: 30, height: 30, border: 'none', borderRadius: 10, background: K.ink, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Svg size={14} sw={2.2}><path d="M12 5v14M5 12h14" /></Svg>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>
              {isWide && summary}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phone: sticky checkout bar above the bottom nav */}
      <AnimatePresence>
        {!empty && !isWide && (
          <motion.div
            initial={{ y: 140 }} animate={{ y: 0 }} exit={{ y: 160 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 40, padding: '0 12px' }}
          >
            <div style={{ maxWidth: 616, margin: '0 auto', padding: 10, borderRadius: 28, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 18px 40px -16px rgba(30,26,23,.35), 0 0 0 1px rgba(30,26,23,.05)' }}>
              <PayButton total={total} paying={paying} onPay={handlePayNow} />
              <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: 10.5, color: K.faint }}>Card, bank transfer or USSD · Powered by Flutterwave</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
