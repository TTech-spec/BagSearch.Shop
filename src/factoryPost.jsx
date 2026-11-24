import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { useSEO } from './hooks/useSEO';

// Factory side of Factory Direct: a 3-step "post a bag" flow.
// Inserts into factory_products as 'pending'; BagSearch approves before it shows.
const V = { bg:'#FAF6F1', ink:'#1C1410', ink2:'#54443A', muted:'#75625A', line:'#E7DCD1', lineStrong:'#D9CBBB', accent:'#B4410E', accentSoft:'#F6E6DA', green:'#1D7044', greenSoft:'#E3F1E8', red:'#9B2C1A', redSoft:'#FBE4DE' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";
const CATS = ['Handbags', 'Totes', 'Backpacks', 'Travel', 'Wholesale'];
const field = { width:'100%', boxSizing:'border-box', minHeight:50, padding:'0 14px', borderRadius:14, border:`1.5px solid ${V.line}`, background:'#fff', font:`600 15px ${font}`, color:V.ink, outline:'none' };
const lab = { display:'flex', flexDirection:'column', gap:8, fontSize:12, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:V.muted };

export default function FactoryPost() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [f, setF] = useState({ name:'', category:'Handbags', price:'', moq:'10', lead:'', custom_logo:true, samples:true, single_pieces:false });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));

  useSEO({ title: 'Post a bag | Factory Direct', description: 'Post a bag to BagSearch Factory Direct.', noindex: true });

  if (!user) { navigate('/login'); return null; }
  if (user.user_metadata?.role !== 'factory') {
    return (
      <Shell>
        <h1 style={{ fontSize:24, fontWeight:800, margin:'40px 0 8px' }}>Factory accounts only</h1>
        <p style={{ color:V.muted, lineHeight:1.6 }}>Posting in Factory Direct is for verified bag factories. Contact BagSearch to get your factory verified.</p>
        <button onClick={() => navigate('/contact')} style={{ ...btn(true), marginTop:16 }}>Contact us</button>
      </Shell>
    );
  }

  const valid = step === 1 ? f.name.trim().length > 2 : step === 2 ? Number(f.price) > 0 && Number(f.moq) > 0 : true;
  const go = (d) => { setError(null); setDir(d); setStep(s => s + d); };

  const publish = async () => {
    setBusy(true); setError(null);
    try {
      let image_url = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '')}`;
        const { error: upErr } = await supabase.storage.from('factory-images').upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        image_url = supabase.storage.from('factory-images').getPublicUrl(path).data.publicUrl;
      }
      const meta = user.user_metadata || {};
      const { error: insErr } = await supabase.from('factory_products').insert({
        factory_id: user.id, factory_name: meta.business_name || meta.full_name || 'Factory', factory_city: meta.city || null,
        name: f.name.trim(), category: f.category, image_url, price_usd: Number(f.price), moq: Number(f.moq),
        lead_time_days: f.lead ? Number(f.lead) : null, custom_logo: f.custom_logo, samples: f.samples, single_pieces: f.single_pieces,
      });
      if (insErr) throw insErr;
      setDir(1); setStep(4);
    } catch (e) {
      console.error('[FactoryPost]', e);
      setError('Could not post this bag. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  const slide = { initial: (d) => ({ x: d * 40, opacity: 0 }), animate: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -40, opacity: 0 }) };

  return (
    <Shell>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'8px 0 14px' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:V.muted }}>Factory Direct</div>
          <h1 style={{ margin:'2px 0 0', fontSize:24, fontWeight:800, letterSpacing:'-.03em' }}>Post a new bag</h1>
        </div>
        {step < 4 && <span style={{ fontSize:12, fontWeight:800, color:V.ink2 }}>Step {step} of 3</span>}
      </header>
      <div style={{ height:6, borderRadius:999, background:V.line, overflow:'hidden', marginBottom:22 }}>
        <Motion.div animate={{ width: `${Math.min(step, 3) / 3 * 100}%` }} transition={{ type:'spring', stiffness:200, damping:30 }} style={{ height:'100%', borderRadius:999, background: step === 4 ? V.green : V.accent }} />
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <Motion.div key={step} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration:.28, ease:[.22,1,.36,1] }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {step === 1 && <>
            <label style={{ ...lab, cursor:'pointer' }}>
              Photo
              <span style={{ height:200, borderRadius:18, border:`2px dashed ${V.lineStrong}`, background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, overflow:'hidden', textTransform:'none', letterSpacing:0 }}>
                {file ? <img src={URL.createObjectURL(file)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={V.ink2} strokeWidth="1.6"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span style={{ fontSize:14, fontWeight:800, color:V.ink }}>Add a photo</span>
                  <span style={{ fontSize:12, fontWeight:600, color:V.muted }}>JPG or PNG</span>
                </>}
              </span>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ position:'absolute', width:1, height:1, opacity:0 }} />
            </label>
            <label style={lab}>Bag name<input style={field} value={f.name} onChange={set('name')} placeholder="e.g. Structured leather tote" /></label>
            <label style={lab}>Category<select style={field} value={f.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
          </>}

          {step === 2 && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 }}>
              <label style={lab}>Factory price (USD)<input style={field} inputMode="decimal" value={f.price} onChange={e => set('price')(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" /></label>
              <label style={lab}>Min. order<input style={field} inputMode="numeric" value={f.moq} onChange={e => set('moq')(e.target.value.replace(/\D/g, ''))} /></label>
            </div>
            <label style={lab}>Lead time (days)<input style={field} inputMode="numeric" value={f.lead} onChange={e => set('lead')(e.target.value.replace(/\D/g, ''))} placeholder="Optional" /></label>
          </>}

          {step === 3 && [['custom_logo', 'Custom logo / branding', 'Buyers can request their own logo'], ['samples', 'Send samples', 'Ship one piece before a bulk order'], ['single_pieces', 'Sell single pieces', 'Let shoppers buy just one bag']].map(([k, t, h]) => (
            <button key={k} role="switch" aria-checked={f[k]} onClick={() => setF(s => ({ ...s, [k]: !s[k] }))}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, minHeight:66, padding:'12px 16px', borderRadius:16, cursor:'pointer', textAlign:'left', font:`600 13px ${font}`, color:V.ink, background: f[k] ? V.accentSoft : '#fff', border:`1.5px solid ${f[k] ? V.accent : V.line}`, transition:'background .2s, border-color .2s' }}>
              <span style={{ display:'flex', flexDirection:'column', gap:2 }}><b style={{ fontSize:15 }}>{t}</b><span style={{ color:V.muted }}>{h}</span></span>
              <span style={{ flex:'none', width:44, height:26, borderRadius:999, padding:3, boxSizing:'border-box', background: f[k] ? V.accent : V.lineStrong, display:'flex', justifyContent: f[k] ? 'flex-end' : 'flex-start' }}>
                <Motion.span layout transition={{ type:'spring', stiffness:600, damping:34 }} style={{ width:20, height:20, borderRadius:999, background:'#fff' }} />
              </span>
            </button>
          ))}

          {step === 4 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <Motion.div initial={{ scale:.4, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:260, damping:16 }}
                style={{ width:88, height:88, margin:'0 auto', borderRadius:999, background:V.greenSoft, color:V.green, display:'grid', placeItems:'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><Motion.path d="m5 12 5 5L20 7" initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ delay:.2, duration:.4 }} /></svg>
              </Motion.div>
              <h2 style={{ margin:'18px 0 6px', fontSize:22, fontWeight:800 }}>Sent for review</h2>
              <p style={{ margin:'0 auto', maxWidth:300, color:V.muted, lineHeight:1.6 }}>BagSearch checks new posts before buyers see them in Factory Direct.</p>
              <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:22, flexWrap:'wrap' }}>
                <button onClick={() => { setF(s => ({ ...s, name:'', price:'' })); setFile(null); setStep(1); }} style={btn(false)}>Post another</button>
                <button onClick={() => navigate('/factory')} style={btn(true)}>View Factory Direct</button>
              </div>
            </div>
          )}
        </Motion.div>
      </AnimatePresence>

      <AnimatePresence>{error && <Motion.p role="alert" initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ margin:'16px 0 0', padding:'12px 16px', borderRadius:14, background:V.redSoft, color:V.red, fontSize:13.5, fontWeight:600 }}>{error}</Motion.p>}</AnimatePresence>

      {step < 4 && (
        <div style={{ display:'flex', gap:10, marginTop:26 }}>
          {step > 1 && <Motion.button whileTap={{ scale:.97 }} onClick={() => go(-1)} style={{ ...btn(false), minWidth:100 }}>Back</Motion.button>}
          <Motion.button whileTap={valid && !busy ? { scale:.98 } : undefined} disabled={!valid || busy} onClick={step === 3 ? publish : () => go(1)} style={{ ...btn(true), flex:1, ...(valid && !busy ? {} : { background:V.line, color:V.muted, boxShadow:'none', cursor:'not-allowed' }) }}>
            {busy ? 'Posting…' : step === 3 ? 'Publish bag' : 'Continue'}
          </Motion.button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return <div style={{ minHeight:'100dvh', background:V.bg, color:V.ink, fontFamily:font }}><main style={{ maxWidth:520, margin:'0 auto', padding:'16px 20px 130px' }}>{children}</main></div>;
}

function btn(primary) {
  return { minHeight:50, padding:'0 22px', borderRadius:999, font:`800 14px ${font}`, cursor:'pointer',
    border: primary ? 0 : `1px solid ${V.line}`, background: primary ? V.accent : '#fff', color: primary ? '#fff' : V.ink,
    boxShadow: primary ? '0 8px 22px rgba(180,65,14,.26)' : 'none', opacity: 1 };
}
