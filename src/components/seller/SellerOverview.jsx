import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { T, FONT_SERIF, EASE_OUT, naira, nairaShort } from '../../theme/luxe';
import CountUp from '../ui/CountUp.jsx';
import ViewsChart from './ViewsChart.jsx';
import { useSellerAnalytics } from './useSellerAnalytics';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

const RANGES = [7, 30, 90];

const card = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16 };
const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const CSS = `
  .so-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .so-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .so-span2 { grid-column: span 2; }
  .so-check { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .so-table { display: table; }
  .so-list { display: none; }
  .so-tr:hover td { background: ${T.bg}; }
  @keyframes soShimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  .so-skel { background: linear-gradient(90deg, ${T.sand} 0px, #F8F2EB 160px, ${T.sand} 320px); background-size: 800px 100%; animation: soShimmer 1.3s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .so-skel { animation: none; } }
  @media (max-width: 1100px) {
    .so-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .so-row { grid-template-columns: 1fr; }
    .so-span2 { grid-column: auto; }
    .so-check { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .so-kpis { gap: 12px; }
    .so-check { grid-template-columns: 1fr; }
    .so-table { display: none; }
    .so-list { display: block; }
    .so-kpi-value { font-size: 24px !important; }
    .so-kpi-spark { display: none; }
  }
`;

const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

function Sparkline({ values, color = T.accent }) {
  if (!values.length || values.every(v => v === 0)) return <span style={{ width: 120, height: 36 }} />;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${i ? 'L' : 'M'}${(i / (values.length - 1)) * 120} ${32 - ((v - min) / (max - min || 1)) * 28}`).join(' ');
  return (
    <svg className="so-kpi-spark" width="120" height="36" viewBox="0 0 120 36" aria-hidden="true">
      <motion.path d={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT }} />
    </svg>
  );
}

function Delta({ change, unit = '%', suffix = 'vs previous period' }) {
  if (change == null) return <div style={{ fontSize: 12, color: T.muted }}>No earlier data to compare</div>;
  const up = change > 0, flat = Math.abs(change) < 0.005;
  const text = unit === '%' ? `${Math.abs(change).toFixed(Math.abs(change) < 10 ? 1 : 0)}%`
    : unit === 'pts' ? `${Math.abs(change).toFixed(2)} pts` : `${Math.abs(Math.round(change))}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.ink2, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontWeight: 800, background: up && !flat ? T.greenSoft : T.sand, color: up && !flat ? T.green : T.ink2 }}>
        {!flat && (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: up ? 'none' : 'rotate(180deg)' }}><path d="M5 1l4 6H1z" fill="currentColor" /></svg>
        )}
        {flat ? 'No change' : `${up ? 'Up' : 'Down'} ${text}`}
      </span>
      <span>{suffix}</span>
    </div>
  );
}

function Kpi({ label, value, format, change, unit, spark, sparkColor, unavailable }) {
  return (
    <motion.div variants={rise} whileHover={{ y: -4, boxShadow: '0 14px 34px rgba(28,20,16,0.08)' }}
      style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div className="so-kpi-value" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {unavailable ? '—' : <CountUp value={value} format={format} />}
        </div>
        {!unavailable && <Sparkline values={spark} color={sparkColor} />}
      </div>
      {unavailable ? <div style={{ fontSize: 12, color: T.muted }}>Order data isn't available yet</div> : <Delta change={change} unit={unit} />}
    </motion.div>
  );
}

function CheckItem({ done, pending, title, sub, action, index }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.08, duration: 0.4, ease: EASE_OUT }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, minWidth: 0 }}>
      {done ? (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35 + index * 0.08, type: 'spring', stiffness: 500, damping: 18 }}
          style={{ width: 24, height: 24, borderRadius: 999, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 + index * 0.08, duration: 0.3 }} />
          </svg>
        </motion.span>
      ) : (
        <span style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, boxSizing: 'border-box', background: pending ? T.amberSoft : 'transparent', border: pending ? `1.5px solid ${T.amberLine}` : `1.5px dashed ${T.accent}` }} />
      )}
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: done ? T.ink2 : T.ink, textDecoration: done ? 'line-through' : 'none' }}>{title}</div>
        {sub && !done && <div style={{ fontSize: 12, fontWeight: pending ? 700 : 500, color: pending ? T.amberInk : T.ink2 }}>{sub}</div>}
      </div>
      {action && !done && (
        <motion.button type="button" onClick={action.onClick} whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
          style={{ height: 36, padding: '0 12px', borderRadius: 9, border: 'none', background: T.ink, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

function RangeSwitch({ value, onChange }) {
  return (
    <div role="group" aria-label="Date range" style={{ display: 'flex', padding: 4, borderRadius: 12, background: T.sand }}>
      {RANGES.map(r => (
        <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)}
          style={{ position: 'relative', height: 36, padding: '0 14px', borderRadius: 9, border: 'none', background: 'transparent', color: value === r ? T.ink : T.ink2, fontSize: 13, fontWeight: value === r ? 800 : 700, cursor: 'pointer' }}>
          {value === r && (
            <motion.span layoutId="so-range-pill" transition={{ type: 'spring', stiffness: 450, damping: 34 }}
              style={{ position: 'absolute', inset: 0, borderRadius: 9, background: T.surface, boxShadow: '0 1px 3px rgba(28,20,16,0.12)' }} />
          )}
          <span style={{ position: 'relative' }}>{r} days</span>
        </button>
      ))}
    </div>
  );
}

export default function SellerOverview({ userId, seller, hasBankDetails, navigate, onEditProfile }) {
  const [range, setRange] = useState(30);
  const a = useSellerAnalytics(userId, range);

  const scrollToVerify = () => document.getElementById('seller-verify')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const verificationSub = { pending: 'Under review', rejected: 'Not approved — upload again', none: 'Upload your NIN' }[a.verification];
  const steps = [
    { title: 'Shop profile', sub: 'Add your brand name and story', done: !!(seller?.brand_name || seller?.brand_story), action: { label: 'Edit', onClick: onEditProfile } },
    { title: 'First listing', sub: 'Upload a bag to start selling', done: a.productCount > 0, action: { label: 'Upload', onClick: () => navigate('/upload-product') } },
    { title: 'Verify your ID', sub: verificationSub, done: a.verification === 'approved', pending: a.verification === 'pending', action: a.verification === 'pending' ? null : { label: 'Verify', onClick: scrollToVerify } },
    { title: 'Add bank details', sub: 'Needed for payouts', done: hasBankDetails, action: { label: 'Add', onClick: () => navigate('/bank-details') } },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const k = a.kpis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{CSS}</style>

      {!a.loading && doneCount < steps.length && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}
          aria-label="Finish setting up" style={{ ...card, padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.ink }}>Finish setting up</h2>
            <div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>{doneCount} of {steps.length} done</div>
            <div style={{ height: 6, borderRadius: 999, background: T.sand, marginTop: 10, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(doneCount / steps.length) * 100}%` }} transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT }}
                style={{ height: 6, borderRadius: 999, background: T.green }} />
            </div>
          </div>
          <div className="so-check" style={{ flex: 1, minWidth: 260 }}>
            {steps.map((s, i) => <CheckItem key={s.title} index={i} {...s} />)}
          </div>
        </motion.section>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        <h2 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 600, color: T.ink }}>Performance</h2>
        <RangeSwitch value={range} onChange={setRange} />
      </div>

      {a.loading ? (
        <div className="so-kpis" role="status" aria-label="Loading performance">
          {[0, 1, 2, 3].map(i => <div key={i} className="so-skel" style={{ height: 132, borderRadius: 16 }} />)}
        </div>
      ) : a.productCount === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE_OUT }}
          style={{ ...card, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <motion.svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </motion.svg>
          <h3 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 600, color: T.ink }}>List your first bag</h3>
          <p style={{ margin: 0, fontSize: 15, color: T.ink2, maxWidth: 420 }}>Once buyers start viewing and ordering, your sales, views and top listings will show up here.</p>
          <motion.button type="button" onClick={() => navigate('/upload-product')} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            style={{ marginTop: 8, height: 48, padding: '0 24px', borderRadius: 12, border: 'none', background: T.accent, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            Upload a bag
          </motion.button>
        </motion.div>
      ) : (
        <>
          <motion.div key={`kpis-${range}`} className="so-kpis" variants={stagger} initial="hidden" animate="show">
            <Kpi label="Revenue" value={k.revenue.value} format={nairaShort} change={k.revenue.change} spark={k.revenue.spark} unavailable={!a.ordersAvailable} />
            <Kpi label="Orders" value={k.orders.value} change={k.orders.change} unit="count" spark={k.orders.spark} unavailable={!a.ordersAvailable} />
            <Kpi label="Product views" value={k.views.value} change={k.views.change} spark={k.views.spark} />
            <Kpi label="Views that became orders" value={k.conversion.value} format={(v) => `${v.toFixed(2)}%`} change={k.conversion.change} unit="pts" spark={[]} unavailable={!a.ordersAvailable} />
          </motion.div>

          <motion.div className="so-row" variants={stagger} initial="hidden" animate="show">
            <motion.section variants={rise} className="so-span2" aria-labelledby="so-chart-h" style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 id="so-chart-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.ink }}>Views and orders</h2>
                  <div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>Daily, last {range} days · hover or tap for details</div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600, color: T.ink2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: T.ink2 }} />Views</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: T.accent }} />Orders</span>
                </div>
              </div>
              <ViewsChart daily={a.daily} rangeKey={range} />
            </motion.section>

            <motion.section variants={rise} aria-labelledby="so-src-h" style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
              <div>
                <h2 id="so-src-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.ink }}>How buyers find you</h2>
                <div style={{ fontSize: 13, color: T.ink2, marginTop: 2 }}>Share of {a.totalViews.toLocaleString()} views</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {a.sources.map((s, i) => (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: T.ink }}>{s.label}</span>
                      <span style={{ fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{Math.round(s.share * 100)}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: T.sand, overflow: 'hidden' }}>
                      <motion.div key={`${range}-${s.key}`} initial={{ width: 0 }} animate={{ width: `${s.share * 100}%` }} transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: EASE_OUT }}
                        style={{ height: 10, borderRadius: 999, background: T.accent }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', padding: 14, borderRadius: 12, background: T.bg, fontSize: 13, lineHeight: 1.5, color: T.ink2 }}>
                <strong style={{ color: T.ink }}>Tip:</strong> clear photos from several angles help your bags show up in photo search.
              </div>
            </motion.section>
          </motion.div>

          <motion.div className="so-row" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
            <motion.section variants={rise} className="so-span2" aria-labelledby="so-top-h" style={{ ...card, padding: '24px 24px 8px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 id="so-top-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.ink }}>Top listings</h2>
                <a href="/seller-listing" onClick={(e) => { e.preventDefault(); navigate('/seller-listing'); }} style={{ fontSize: 13, fontWeight: 700, color: T.accentInk, textDecoration: 'none' }}>All listings →</a>
              </div>
              <table className="so-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: 12, color: T.muted }}>
                    <th style={{ padding: '10px 0', fontWeight: 700 }}>Product</th>
                    <th style={{ padding: '10px 0', fontWeight: 700, textAlign: 'right' }}>Views</th>
                    <th style={{ padding: '10px 0', fontWeight: 700, textAlign: 'right' }}>Orders</th>
                    <th style={{ padding: '10px 0', fontWeight: 700, textAlign: 'right' }}>Revenue</th>
                    <th style={{ padding: '10px 0 10px 24px', fontWeight: 700 }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {a.topListings.map((p, i) => (
                    <motion.tr key={p.id} className="so-tr" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_OUT }}
                      style={{ borderTop: `1px solid ${T.lineSoft}` }}>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={getOptimizedImageUrl(p.images?.[0], 96, 96)} alt="" width="44" height="44" loading="lazy" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: T.photo, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>{[p.category, naira(p.discounted_price || p.price)].filter(Boolean).join(' · ')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.views}</td>
                      <td style={{ textAlign: 'right' }}>{a.ordersAvailable ? p.orders : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: p.revenue ? 700 : 400, color: p.revenue ? T.ink : T.muted }}>{p.revenue ? naira(p.revenue) : '—'}</td>
                      <td style={{ paddingLeft: 24 }}><StockTag qty={p.quantity} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="so-list">
                {a.topListings.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? `1px solid ${T.lineSoft}` : 'none' }}>
                    <img src={getOptimizedImageUrl(p.images?.[0], 96, 96)} alt="" width="48" height="48" loading="lazy" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: T.photo, flexShrink: 0 }} />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: T.ink2 }}>{p.views} views{a.ordersAvailable ? ` · ${p.orders} order${p.orders === 1 ? '' : 's'}` : ''}</div>
                    </div>
                    <StockTag qty={p.quantity} />
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={rise} aria-labelledby="so-att-h" style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <h2 id="so-att-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.ink }}>Needs your attention</h2>
              <AnimatePresence>
                {a.awaitingDelivery.map((o, i) => (
                  <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                    style={{ padding: 14, borderRadius: 12, border: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 999, background: T.greenSoft, color: T.green, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>PAID · DELIVER IT</span>
                      <span style={{ fontSize: 12, color: T.muted }}>{timeAgo(o.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: T.ink }}><strong>{o.product_name || 'Order'}</strong>{o.quantity > 1 ? ` × ${o.quantity}` : ''}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: T.ink }}>{naira(o.total_price)}</span>
                      <span style={{ fontSize: 12, color: T.ink2 }}>Paid out when the buyer confirms</span>
                    </div>
                  </motion.div>
                ))}
                {a.soldOut.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: 14, borderRadius: 12, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.redInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                    <div style={{ flexGrow: 1, fontSize: 13, color: T.ink, minWidth: 0 }}><strong>{p.name}</strong> is sold out{p.views ? ` · ${p.views} views` : ''}</div>
                    <a href="/seller-listing" onClick={(e) => { e.preventDefault(); navigate('/seller-listing'); }} style={{ fontSize: 13, fontWeight: 700, color: T.accentInk, textDecoration: 'none', flexShrink: 0 }}>Restock</a>
                  </motion.div>
                ))}
              </AnimatePresence>
              {a.awaitingDelivery.length === 0 && a.soldOut.length === 0 && (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', textAlign: 'center' }}>
                  <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                    style={{ width: 44, height: 44, borderRadius: 999, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </motion.span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>You're all caught up</div>
                  <div style={{ fontSize: 13, color: T.ink2 }}>New paid orders and sold-out bags will show here.</div>
                </div>
              )}
            </motion.section>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StockTag({ qty }) {
  if (qty == null) return <span style={{ fontSize: 13, color: T.ink2 }}>—</span>;
  const n = Number(qty);
  if (n === 0) return <span style={{ padding: '4px 10px', borderRadius: 999, background: T.redSoft, color: T.redInk, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>Sold out</span>;
  if (n <= 3) return <span style={{ padding: '4px 10px', borderRadius: 999, background: T.amberSoft, color: T.amberInk, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{n} left</span>;
  return <span style={{ fontSize: 13, color: T.ink2, whiteSpace: 'nowrap' }}>{n} in stock</span>;
}
