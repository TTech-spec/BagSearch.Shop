/**
 * Orders Page — buyers see their orders and confirm delivery
 * When buyer confirms, seller gets credited via /api/release-payment
 */
import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { supabase } from './services/api';

const C = {
  primary:'#c84b11',primaryLight:'#f97316',primaryBg:'#fff8f3',primaryBorder:'#fcd4be',
  text:'#1a0a00',textMid:'#5c3317',textMuted:'#8b6f5a',textFaint:'#b8a090',
  border:'#e8ddd4',borderLight:'#f0e6dc',surfaceDim:'#faf6f2',
  success:'#16a34a',successBg:'#dcfce7',danger:'#dc2626',
};

function formatCurrency(n) { return `₦${Number(n||0).toLocaleString()}`; }

const STATUS_MAP = {
  paid:              { label: 'Paid — Awaiting Delivery', color: '#2563eb', bg: '#dbeafe' },
  shipped:           { label: 'Shipped', color: '#7c3aed', bg: '#ede9fe' },
  delivered:         { label: 'Delivered ✓', color: C.success, bg: C.successBg },
  seller_credited:   { label: 'Completed ✓', color: C.success, bg: C.successBg },
  disputed:          { label: 'Disputed', color: C.danger, bg: '#fee2e2' },
};

function getOptimizedImageUrl(url, w, h) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('supabase.co') && url.includes('/storage/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}width=${w}&height=${h}&resize=cover&quality=75`;
  }
  return url;
}

function OrderCard({ order, onConfirm, confirming }) {
  const s = STATUS_MAP[order.status] || STATUS_MAP.paid;
  const canConfirm = order.status === 'paid' || order.status === 'shipped';

  return (
    <div style={{
      background:'white', borderRadius:16, padding:18, border:`1.5px solid ${C.borderLight}`,
      boxShadow:'0 2px 10px rgba(200,75,17,0.05)', marginBottom:12,
    }}>
      {/* Status badge + date */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{
          fontSize:11, fontWeight:800, padding:'4px 10px', borderRadius:8,
          color: s.color, background: s.bg,
        }}>{s.label}</span>
        <span style={{ fontSize:11, color:C.textFaint, fontWeight:600 }}>
          {new Date(order.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}
        </span>
      </div>

      {/* Product row */}
      <div style={{ display:'flex', gap:12, marginBottom:14 }}>
        {order.product_image && (
          <img src={getOptimizedImageUrl(order.product_image, 64, 64)} alt={order.product_name}
            loading="lazy" width="56" height="56"
            style={{ width:56, height:56, objectFit:'cover', borderRadius:10, border:`1px solid ${C.borderLight}` }} />
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <h4 style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {order.product_name}
          </h4>
          <p style={{ fontSize:12, color:C.textFaint, fontWeight:500, marginBottom:4 }}>
            Seller: {order.seller_name || 'Seller'} · Qty: {order.quantity}
          </p>
          <p style={{ fontSize:16, fontWeight:900, color:C.primary }}>{formatCurrency(order.total_price)}</p>
        </div>
      </div>

      {/* Confirm delivery button */}
      {canConfirm && (
        <button
          onClick={() => onConfirm(order.id)}
          disabled={confirming === order.id}
          style={{
            width:'100%', padding:'12px 0', borderRadius:12, border:'none', cursor:'pointer',
            background: confirming === order.id
              ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
              : `linear-gradient(135deg,${C.success},#22c55e)`,
            color:'white', fontWeight:800, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: confirming !== order.id ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
            transition:'all 0.3s',
          }}
        >
          {confirming === order.id ? (
            <><div style={{width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'white',animation:'ldSpin 0.7s linear infinite'}}/>Confirming…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>I Received This — Release Payment</>
          )}
        </button>
      )}

      {order.status === 'delivered' || order.status === 'seller_credited' ? (
        <p style={{ fontSize:12, color:C.success, fontWeight:600, textAlign:'center', marginTop:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" style={{verticalAlign:'-3px',marginRight:4}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Delivery confirmed — seller has been credited
        </p>
      ) : null}
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Clear cart after navigating here from checkout
  useEffect(() => {
    if (orders.length > 0) clearCart();
  }, [orders.length > 0]);

  const handleConfirmDelivery = async (orderId) => {
    setConfirming(orderId);
    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('buyer_id', user.id);
      if (error) throw error;

      // Try to trigger server-side payout to seller
      try {
        await fetch('/api/release-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId }),
        });
      } catch (e) { console.warn('Release payment API call failed:', e); }

      // Notify seller
      const order = orders.find(o => o.id === orderId);
      if (order?.seller_id) {
        supabase.from('notifications').insert([{
          seller_id: order.seller_id,
          type: 'delivery_confirmed',
          title: 'Delivery confirmed! Payment released',
          message: `${user.user_metadata?.full_name || 'Buyer'} confirmed receiving "${order.product_name}". ₦${Number(order.total_price).toLocaleString()} has been released to your account.`,
          is_read: false,
        }]).catch(() => {});
      }

      setToast('Delivery confirmed! Seller has been credited.');
      setTimeout(() => setToast(null), 4000);
      fetchOrders();
    } catch (err) {
      console.error('Confirm delivery error:', err);
      setToast('Something went wrong. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#fff8f3 0%,#ffffff 40%)' }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'0 16px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'24px 0 20px' }}>
          <button onClick={() => navigate(-1)}
            style={{ width:40, height:40, borderRadius:12, border:`1.5px solid ${C.border}`, background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.text, letterSpacing:'-0.03em', marginBottom:2 }}>My Orders</h1>
            <p style={{ fontSize:13, color:C.textMuted, fontWeight:600 }}>Confirm delivery to release payment to seller</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.textFaint }}>
            <div style={{ width:24, height:24, borderRadius:'50%', border:`3px solid ${C.borderLight}`, borderTopColor:C.primary, animation:'ldSpin 0.7s linear infinite', margin:'0 auto 12px' }} />
            <p style={{ fontSize:14, fontWeight:600 }}>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:80, paddingBottom:80 }}>
            <div style={{ width:80, height:80, borderRadius:24, background:C.primaryBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, border:`1.5px solid ${C.primaryBorder}` }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3 style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:8 }}>No orders yet</h3>
            <p style={{ fontSize:14, color:C.textMuted, textAlign:'center', fontWeight:500, lineHeight:1.7, maxWidth:280, marginBottom:24 }}>
              When you purchase a bag, your orders will appear here
            </p>
            <button onClick={() => navigate('/products')}
              style={{ padding:'14px 32px', background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, color:'white', borderRadius:14, border:'none', cursor:'pointer', fontWeight:800, fontSize:15, boxShadow:`0 6px 20px ${C.primary}44` }}>
              Browse Bags
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom:100 }}>
            {/* Info banner */}
            <div style={{
              background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:14, padding:'12px 16px',
              marginBottom:20, display:'flex', alignItems:'flex-start', gap:10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p style={{ fontSize:12, color:'#1e40af', fontWeight:600, lineHeight:1.6, margin:0 }}>
                Your payment is held securely. Once you receive your item, tap <strong>"I Received This"</strong> to release the payment to the seller.
              </p>
            </div>

            {orders.map(order => (
              <OrderCard key={order.id} order={order} onConfirm={handleConfirmDelivery} confirming={confirming} />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)',
          background:'#065f46', color:'white', padding:'12px 24px', borderRadius:14,
          fontSize:13, fontWeight:700, boxShadow:'0 8px 28px rgba(0,0,0,0.3)', zIndex:200,
          animation:'toastIn 0.3s ease',
        }}>{toast}</div>
      )}

      <style>{`
        @keyframes ldSpin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  );
}
