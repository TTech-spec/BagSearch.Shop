import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion as Motion } from 'framer-motion';
import gsap from 'gsap';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { useSEO } from './hooks/useSEO';

// Factory Direct — bag makers post, buyers & resellers browse.
// Data: supabase table `factory_products` (see supabase/migrations/20261124_factory_direct.sql).
const V = { bg:'#FAF6F1', ink:'#1C1410', ink2:'#54443A', muted:'#75625A', line:'#E7DCD1', accent:'#B4410E', accentSoft:'#F6E6DA', green:'#1D7044', greenSoft:'#E3F1E8', dark:'#1C1410' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";
const FACTORY_CATEGORIES = ['Handbags', 'Totes', 'Backpacks', 'Travel', 'Wholesale'];
const TONES = ['#EFE6DC', '#F2E3D3', '#E6E1DA', '#F6E6DA'];

const BagGlyph = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={V.ink2} strokeWidth="1.4" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
);

export default function FactoryDirect() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isFactory = user?.user_metadata?.role === 'factory';
  const [cat, setCat] = useState('All');
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const hero = useRef(null);

  useSEO({ title: 'Factory Direct — buy from bag factories | BagSearch', description: 'Buy bags straight from verified bag factories at factory prices, in bulk or single pieces.' });

  useEffect(() => {
    let alive = true;
    supabase.from('factory_products').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(60)
      .then(({ data, error }) => { if (!alive) return; if (error) setFailed(true); setItems(data || []); });
    return () => { alive = false; };
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.fd-hero', { y: 24, opacity: 0, scale: 0.98, duration: 0.7 })
        .from('.fd-hero > *', { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.4');
    }, hero);
    return () => ctx.revert();
  }, []);

  const shown = (items || []).filter(i => cat === 'All' || i.category === cat);

  return (
    <div ref={hero} style={{ minHeight: '100dvh', background: V.bg, color: V.ink, fontFamily: font }}>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 130px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: V.muted }}>BagSearch</div>
            <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: '-.03em' }}>Factory Direct</h1>
          </div>
          {isFactory && (
            <Motion.button whileTap={{ scale: .97 }} onClick={() => navigate('/factory/post')}
              style={{ minHeight: 44, padding: '0 18px', borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 13px ${font}`, cursor: 'pointer' }}>+ Post a bag</Motion.button>
          )}
        </header>

        <section className="fd-hero" style={{ borderRadius: 22, padding: '20px 20px 22px', background: V.dark, color: '#EDE3D8', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <span style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', padding: '4px 10px', borderRadius: 999, background: V.accent, color: '#fff' }}>FROM THE MAKER</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: 420 }}>Buy straight from verified bag factories</span>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: '#BFAE9F', maxWidth: 440 }}>Factory prices, in bulk or single pieces. Every factory is checked by BagSearch before it can post.</span>
        </section>

        <LayoutGroup>
          <div role="tablist" aria-label="Categories" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
            {['All', ...FACTORY_CATEGORIES].map(c => (
              <button key={c} role="tab" aria-selected={c === cat} onClick={() => setCat(c)}
                style={{ position: 'relative', flex: 'none', minHeight: 38, padding: '0 16px', borderRadius: 999, border: `1px solid ${c === cat ? V.ink : V.line}`, background: '#fff', color: c === cat ? '#fff' : V.ink2, font: `700 13px ${font}`, cursor: 'pointer', transition: 'color .2s' }}>
                {c === cat && <Motion.span layoutId="fdChip" transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ position: 'absolute', inset: -1, borderRadius: 999, background: V.ink }} />}
                <span style={{ position: 'relative' }}>{c}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        {items === null ? (
          <Grid>{Array.from({ length: 6 }).map((_, i) => (
            <Motion.div key={i} animate={{ opacity: [.5, 1, .5] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * .1 }} style={{ height: 230, borderRadius: 18, background: '#EFE6DC' }} />
          ))}</Grid>
        ) : shown.length === 0 ? (
          <Motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '56px 20px', borderRadius: 20, border: `1px dashed ${V.line}`, background: '#fff' }}>
            <Motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block' }}><BagGlyph size={52} /></Motion.div>
            <h2 style={{ margin: '12px 0 6px', fontSize: 18, fontWeight: 800 }}>{failed ? 'Factory Direct is opening soon' : 'No factory bags here yet'}</h2>
            <p style={{ margin: 0, fontSize: 14, color: V.muted, lineHeight: 1.6 }}>We're onboarding verified factories. Check back shortly.</p>
          </Motion.div>
        ) : (
          <Grid>
            <AnimatePresence mode="popLayout">
              {shown.map((it, n) => <Card key={it.id} it={it} n={n} />)}
            </AnimatePresence>
          </Grid>
        )}
      </main>
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 45%), 1fr))', gap: 12 }}>{children}</div>;
}

function Card({ it, n }) {
  return (
    <Motion.article layout initial={{ opacity: 0, y: 16, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: Math.min(n, 8) * .04 }}
      whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(28,20,16,.12)' }}
      style={{ background: '#fff', border: `1px solid ${V.line}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '1', background: TONES[n % 4], display: 'grid', placeItems: 'center' }}>
        {it.image_url ? <img src={it.image_url} alt={it.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BagGlyph />}
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.94)', color: V.green }}>✓ VERIFIED</span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{it.name}</span>
        <span style={{ fontSize: 12, color: V.muted }}>{it.factory_name}{it.factory_city ? ` · ${it.factory_city}` : ''}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: V.accent }}>${Number(it.price_usd).toFixed(2)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: V.ink2 }}>MOQ {it.moq}</span>
        </div>
      </div>
    </Motion.article>
  );
}
