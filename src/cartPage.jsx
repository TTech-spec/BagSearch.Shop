/**
 * Cart Page — full standalone page at /cart
 */
import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { supabase } from './services/api';
import { payForProduct, getSellerSubaccountId } from './components/FlutterwavePayment';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './utils/whatsapp';

const C = {
  primary:'#c84b11',primaryLight:'#f97316',primaryBg:'#fff8f3',primaryBorder:'#fcd4be',primaryPale:'#fffaf7',
  accent:'#ea580c',text:'#1a0a00',textMid:'#5c3317',textMuted:'#8b6f5a',textFaint:'#b8a090',
  border:'#e8ddd4',borderLight:'#f0e6dc',surfaceDim:'#faf6f2',
  success:'#16a34a',successBg:'#dcfce7',danger:'#dc2626',
  whatsapp:'#25d366',whatsappDark:'#128c7e',
};

function formatCurrency(n) { return `₦${Number(n||0).toLocaleString()}`; }

function getOptimizedImageUrl(url, w, h) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('supabase.co') && url.includes('/storage/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}width=${w}&height=${h}&resize=cover&quality=75`;
  }
  return url;
}

function WaIcon({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.506 3.937 1.395 5.613L.05 23.335a.75.75 0 00.916.916l5.722-1.345A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.71 9.71 0 01-5.265-1.547.75.75 0 00-.574-.1l-3.502.823.823-3.502a.75.75 0 00-.1-.574A9.71 9.71 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
    </svg>
  );
}

function CartItemRow({ item, onUpdateQty, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(item.id), 350); };
  const waNumber = normalizeWhatsAppNumber(item.whatsapp || '');
  const waMsg = encodeURIComponent(`Hi! I'd like to order *${item.name}* — ${formatCurrency(item.price)}`);
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waMsg}` : null;

  return (
    <div style={{
      display:'flex',gap:14,background:'white',borderRadius:16,padding:16,
      border:`1.5px solid ${C.borderLight}`,boxShadow:'0 2px 10px rgba(200,75,17,0.05)',
      opacity:removing?0:1,transform:removing?'translateX(60px) scale(0.9)':'translateX(0)',
      transition:'all 0.4s cubic-bezier(0.22,1,0.36,1)',maxHeight:removing?0:200,overflow:'hidden',
    }}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={getOptimizedImageUrl(item.src,96,96)} alt={item.name} loading="lazy"
          style={{width:80,height:80,objectFit:'cover',borderRadius:12,display:'block',border:`1px solid ${C.borderLight}`}}/>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{position:'absolute',bottom:-6,left:-6,width:26,height:26,borderRadius:'50%',background:C.whatsapp,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',boxShadow:'0 3px 10px rgba(37,211,102,0.5)',border:'2.5px solid white',zIndex:2}}>
            <WaIcon size={12} color="white" />
          </a>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <h4 style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</h4>
        <p style={{fontSize:12,color:C.textFaint,fontWeight:500,marginBottom:10}}>{item.seller}</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',background:C.surfaceDim,borderRadius:10,border:`1.5px solid ${C.border}`,overflow:'hidden'}}>
            <button onClick={() => item.qty > 1 ? onUpdateQty(item.id, item.qty - 1) : handleRemove()}
              style={{width:32,height:32,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid}}>−</button>
            <span style={{width:28,textAlign:'center',fontSize:13,fontWeight:800,color:C.text}}>{item.qty}</span>
            <button onClick={() => onUpdateQty(item.id, item.qty + 1)}
              style={{width:32,height:32,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:C.textMid}}>+</button>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:17,fontWeight:900,color:C.primary}}>{formatCurrency(item.price * item.qty)}</div>
            <button onClick={handleRemove} style={{fontSize:10,color:C.danger,fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:'2px 0'}}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cartItems, updateQty, removeFromCart } = useCart();
  const [chatting, setChatting] = useState(false);
  const [chatted, setChatted] = useState(false);
  const [paying, setPaying] = useState(false);

  const total = cartItems.reduce((a, i) => a + i.price * i.qty, 0);
  const itemCount = cartItems.reduce((a, i) => a + i.qty, 0);

  const handlePayNow = async () => {
    if (!cartItems.length || !user) return;
    setPaying(true);
    try {
      const firstItem = cartItems[0];
      const productNames = cartItems.map(i => i.name).join(', ');
      const sellerIds = [...new Set(cartItems.map(i => i.sellerId).filter(Boolean))];
      let sellerId = sellerIds[0] || null;
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
              unit_price: item.price,
              total_price: item.price * item.qty,
              status: 'paid',
              flutterwave_tx_ref: response.tx_ref || response.txRef || '',
              flutterwave_tx_id: response.transaction_id?.toString() || '',
            }));
            await supabase.from('orders').insert(orderItems);
            // Notify each seller
            const uniqueSellers = [...new Set(cartItems.map(i => i.sellerId).filter(Boolean))];
            for (const sid of uniqueSellers) {
              const sellerItems = cartItems.filter(i => i.sellerId === sid);
              const sellerTotal = sellerItems.reduce((s, i) => s + i.price * i.qty, 0);
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

  const handleChatSellers = () => {
    if (!cartItems.length) return;
    setChatting(true);
    const bySellerMap = cartItems.reduce((acc, item) => {
      const key = item.seller || 'Seller';
      if (!acc[key]) acc[key] = { whatsapp: item.whatsapp || '', items: [] };
      acc[key].items.push(item);
      return acc;
    }, {});
    Object.entries(bySellerMap).forEach(([sellerName, { whatsapp, items }], idx) => {
      const number = normalizeWhatsAppNumber(whatsapp || '');
      if (!number) return;
      const itemLines = items.map(i => `• ${i.qty}x *${i.name}* — ₦${(i.price * i.qty).toLocaleString()}`).join('\n');
      const sellerTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const msg = encodeURIComponent(`Hi ${sellerName}! 👋\n\nI'd like to order:\n\n${itemLines}\n\n*Subtotal: ₦${sellerTotal.toLocaleString()}*\n\nPlease confirm availability. Thank you! 🛍️`);
      setTimeout(() => { window.open(`https://wa.me/${number}?text=${msg}`, '_blank'); }, idx * 600);
    });
    setTimeout(() => { setChatting(false); setChatted(true); }, 1000);
    setTimeout(() => { setChatted(false); }, 3400);
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#fff8f3 0%,#ffffff 40%)'}}>
      {/* Header */}
      <div style={{maxWidth:720,margin:'0 auto',padding:'0 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,padding:'24px 0 20px'}}>
          <button onClick={() => navigate(-1)}
            style={{width:40,height:40,borderRadius:12,border:`1.5px solid ${C.border}`,background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 style={{fontSize:22,fontWeight:900,color:C.text,letterSpacing:'-0.03em',marginBottom:2}}>Your Cart</h1>
            <p style={{fontSize:13,color:C.textMuted,fontWeight:600}}>{itemCount} {itemCount === 1 ? 'item' : 'items'}{itemCount > 0 ? ` · ${formatCurrency(total)} subtotal` : ''}</p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:80,paddingBottom:80}}>
            <div style={{width:80,height:80,borderRadius:24,background:C.primaryBg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,border:`1.5px solid ${C.primaryBorder}`}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1.4" fill={C.textFaint} stroke="none"/><circle cx="18" cy="20" r="1.4" fill={C.textFaint} stroke="none"/>
                <path d="M2.5 3h2.4l2.13 11.39A2 2 0 009 16h8.4a2 2 0 001.95-1.55L21 6H6"/>
              </svg>
            </div>
            <h3 style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:8}}>Your cart is empty</h3>
            <p style={{fontSize:14,color:C.textMuted,textAlign:'center',fontWeight:500,lineHeight:1.7,maxWidth:280,marginBottom:24}}>Discover beautiful bags and add them to your cart</p>
            <button onClick={() => navigate('/products')}
              style={{padding:'14px 32px',background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:'white',borderRadius:14,border:'none',cursor:'pointer',fontWeight:800,fontSize:15,boxShadow:`0 6px 20px ${C.primary}44`}}>
              Browse Bags
            </button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
              {cartItems.map((item, i) => (
                <CartItemRow key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeFromCart} />
              ))}
            </div>

            {/* Order Summary */}
            <div style={{background:'white',borderRadius:20,padding:'20px 22px',marginBottom:20,border:`1.5px solid ${C.borderLight}`,boxShadow:'0 2px 12px rgba(200,75,17,0.06)'}}>
              <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textFaint,marginBottom:14}}>Order Summary</p>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <span style={{fontSize:14,color:C.textMuted,fontWeight:500}}>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span style={{fontSize:14,fontWeight:700,color:C.text}}>{formatCurrency(total)}</span>
              </div>
              <div style={{height:1,background:C.border,margin:'14px 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:17,fontWeight:900,color:C.text}}>Total</span>
                <span style={{fontSize:28,fontWeight:900,color:C.primary,letterSpacing:'-0.04em'}}>{formatCurrency(total)}</span>
              </div>
              <p style={{fontSize:11,color:C.textFaint,fontWeight:500,marginTop:10,lineHeight:1.5}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="2" style={{verticalAlign:'-2px',marginRight:4}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Payment is held securely until you confirm delivery
              </p>
            </div>

            {/* Checkout buttons */}
            <div style={{paddingBottom:100}}>
              <button onClick={handlePayNow} disabled={paying}
                style={{width:'100%',padding:'16px 0',borderRadius:16,border:'none',cursor:'pointer',
                  background:paying?'linear-gradient(135deg,#9ca3af,#6b7280)':'linear-gradient(135deg,#2563eb,#3b82f6)',
                  color:'white',fontWeight:900,fontSize:16,transition:'all 0.5s',
                  boxShadow:'0 8px 28px rgba(37,99,235,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12}}>
                {paying ? (
                  <><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'white',animation:'ldSpin 0.7s linear infinite'}}/>Processing…</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>Pay Now · {formatCurrency(total)}</>
                )}
              </button>

              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{flex:1,height:1,background:C.border}}/>
                <span style={{fontSize:12,color:C.textFaint,fontWeight:700}}>OR</span>
                <div style={{flex:1,height:1,background:C.border}}/>
              </div>

              <button onClick={handleChatSellers}
                style={{width:'100%',padding:'14px 0',borderRadius:16,border:`1.5px solid ${C.whatsapp}`,cursor:'pointer',
                  background:'white',color:C.whatsapp,fontWeight:800,fontSize:15,transition:'all 0.5s',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                {chatted ? (
                  <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke={C.whatsapp}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Chats Opened!</>
                ) : chatting ? (
                  <><div style={{width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(37,211,102,0.3)',borderTopColor:C.whatsapp,animation:'ldSpin 0.7s linear infinite'}}/>Opening WhatsApp…</>
                ) : (
                  <><WaIcon size={16} color={C.whatsapp} />Chat Sellers on WhatsApp</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes ldSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
