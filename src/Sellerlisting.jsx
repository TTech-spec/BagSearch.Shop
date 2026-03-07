import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

function isMissingColumnError(err) {
  const msg = String(err?.message || '').toLowerCase();
  const code = String(err?.code || '').toUpperCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    (msg.includes('could not find') && msg.includes('column') && msg.includes('schema cache'))
  );
}

function toCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value || '0';
  return n.toLocaleString();
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id ?? '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Sellerlisting() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        setError(null);

        if (!user?.id) {
          setRows([]);
          return;
        }

        const baseSelect = 'id,name,brand,price,category,condition,location,images,created_at,user_id,seller_id,seller_name';
        const results = [];

        const byUserId = await supabase
          .from('products')
          .select(baseSelect)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!byUserId.error && Array.isArray(byUserId.data)) {
          results.push(...byUserId.data);
        } else if (byUserId.error && !isMissingColumnError(byUserId.error)) {
          throw byUserId.error;
        }

        const bySellerId = await supabase
          .from('products')
          .select(baseSelect)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (!bySellerId.error && Array.isArray(bySellerId.data)) {
          results.push(...bySellerId.data);
        } else if (bySellerId.error && !isMissingColumnError(bySellerId.error)) {
          throw bySellerId.error;
        }

        const sellerName = user.user_metadata?.full_name;
        if (sellerName) {
          const bySellerName = await supabase
            .from('products')
            .select(baseSelect)
            .eq('seller_name', sellerName)
            .order('created_at', { ascending: false });

          if (!bySellerName.error && Array.isArray(bySellerName.data)) {
            results.push(...bySellerName.data);
          } else if (bySellerName.error && !isMissingColumnError(bySellerName.error)) {
            throw bySellerName.error;
          }
        }

        const merged = uniqueById(results).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setRows(merged);
      } catch (err) {
        setError(err?.message || 'Failed to load your listings.');
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, [user?.id, user?.user_metadata?.full_name]);

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div style={{ minHeight: '100vh', background: '#fffaf5', padding: '32px 20px', fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/seller-profile')}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #f0d9cc', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/upload-product')}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#c84b11', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Add New Listing
          </button>
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: 4, color: '#1a0a00' }}>My Listings</h1>
        <p style={{ color: '#9a6348', fontSize: 14, marginBottom: 20 }}>{total} product{total === 1 ? '' : 's'} found</p>

        {loading && <p style={{ color: '#9a6348' }}>Loading your listings...</p>}

        {!loading && error && (
          <div style={{ background: '#fff', border: '1px solid #f0d9cc', borderRadius: 12, padding: 14, color: '#b91c1c', marginBottom: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #f0d9cc', borderRadius: 12, padding: 18 }}>
            <p style={{ color: '#9a6348', marginBottom: 10 }}>No listings found for this account yet.</p>
            <button
              onClick={() => navigate('/upload-product')}
              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#c84b11', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
            >
              Create your first listing
            </button>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {rows.map((p) => {
              const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/120';
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '92px 1fr auto', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid #f0d9cc', borderRadius: 12, padding: 10 }}>
                  <img src={image} alt={p.name || 'Product'} style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 10, border: '1px solid #f7ece4' }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 800, color: '#1a0a00', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || 'Untitled Product'}</p>
                    <p style={{ fontSize: 13, color: '#9a6348', marginBottom: 4 }}>{p.brand || 'No brand'} • {p.category || 'No category'}</p>
                    <p style={{ fontSize: 13, color: '#5c3317' }}>₦{toCurrency(p.price)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/products/${p.id}`)}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #f0d9cc', background: '#fffaf5', cursor: 'pointer', fontWeight: 700, color: '#c84b11' }}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
