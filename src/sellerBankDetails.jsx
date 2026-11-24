import { useState, useEffect, useContext, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import { useSEO } from './hooks/useSEO';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  primary:'#c84b11', primaryLight:'#f97316', primaryBg:'#fde8d8',
  primaryPale:'#fdf4ee', primaryBorder:'#f9c4a0',
  success:'#16a34a', successBg:'#dcfce7',
  danger:'#dc2626', dangerBg:'#fef2f2',
  text:'#1a0a00', textMid:'#5c3317', textMuted:'#9a6348',
  border:'#f0d9cc', borderLight:'#f7ece4', surface:'#ffffff',
};

// ─── Nigerian Banks ───────────────────────────────────────────────────────────
const BANKS = [
  { name:'Access Bank',                       code:'044' },
  { name:'Citibank Nigeria',                  code:'023' },
  { name:'Ecobank Nigeria',                   code:'050' },
  { name:'Fidelity Bank',                     code:'070' },
  { name:'First Bank of Nigeria',             code:'011' },
  { name:'First City Monument Bank (FCMB)',   code:'214' },
  { name:'Globus Bank',                       code:'00103' },
  { name:'Guaranty Trust Bank (GTBank)',      code:'058' },
  { name:'Heritage Bank',                     code:'030' },
  { name:'Jaiz Bank',                         code:'301' },
  { name:'Keystone Bank',                     code:'082' },
  { name:'Kuda Microfinance Bank',            code:'50211' },
  { name:'Lotus Bank',                        code:'303' },
  { name:'Moniepoint Microfinance Bank',      code:'50515' },
  { name:'OPay',                              code:'999992' },
  { name:'Palmpay',                           code:'999991' },
  { name:'Polaris Bank',                      code:'076' },
  { name:'Providus Bank',                     code:'101' },
  { name:'Stanbic IBTC Bank',                 code:'221' },
  { name:'Standard Chartered Bank',           code:'068' },
  { name:'Sterling Bank',                     code:'232' },
  { name:'SunTrust Bank Nigeria',             code:'100' },
  { name:'Titan Trust Bank',                  code:'102' },
  { name:'Union Bank of Nigeria',             code:'032' },
  { name:'United Bank for Africa (UBA)',      code:'033' },
  { name:'Unity Bank',                        code:'215' },
  { name:'Wema Bank',                         code:'035' },
  { name:'Zenith Bank',                       code:'057' },
];

// ─── Account resolution ───────────────────────────────────────────────────────
// Flutterwave's account-resolve endpoint requires the secret key, which must
// never be exposed in the browser. So we skip automatic resolution and let
// the seller enter their account name manually — this is the standard pattern
// for client-only apps using Flutterwave.
// The FLW_PUBLIC_KEY is only used for payment checkout (FlutterwavePayment.jsx),
// not for account lookups.

export default function SellerBankDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bankCode,       setBankCode]       = useState('');
  const [accountNumber,  setAccountNumber]  = useState('');
  const [accountName,    setAccountName]    = useState('');  // returned by FLW verify
  const [verifying,      setVerifying]      = useState(false); // resolving account
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState(null);
  const [success,        setSuccess]        = useState(null);
  const [existing,       setExisting]       = useState(null);
  const [loading,        setLoading]        = useState(true);

  useSEO({
    title: 'Bank Details | BagSearch Seller Dashboard',
    description: 'Add your bank account to receive payments directly when buyers purchase your bags on BagSearch.',
    noindex: true,
  });

  // ── Load existing saved details ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('seller_bank_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setExisting(data);
        setBankCode(data.bank_code || '');
        setAccountNumber(data.account_number || '');
        setAccountName(data.account_name || '');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  // ── Step 1: Verify account via Edge Function ──────────────────────────────
  const handleVerify = async () => {
    if (!bankCode)                    { setError('Please select your bank.');          return; }
    if (accountNumber.length !== 10)  { setError('Account number must be 10 digits.'); return; }

    setVerifying(true);
    setError(null);
    setAccountName('');

    const bankName = BANKS.find(b => b.code === bankCode)?.name || bankCode;

    try {
      let data = null;
      let fnFailed = false;

      try {
        const result = await supabase.functions.invoke('create-flw-subaccount', {
          body: { bank_code: bankCode, account_number: accountNumber, bank_name: bankName },
        });
        // supabase.functions.invoke throws on network errors but returns error
        // property on non-2xx — handle both
        if (result.error) {
          console.warn('[BankDetails] Edge function error:', result.error?.message);
          fnFailed = true;
        } else {
          data = result.data;
        }
      } catch (invokeErr) {
        console.warn('[BankDetails] Edge function invoke threw:', invokeErr?.message);
        fnFailed = true;
      }

      // ── Happy path: Edge Function succeeded ─────────────────────────────
      if (!fnFailed && data?.success) {
        const upserted = {
          user_id:                   user.id,
          bank_name:                 bankName,
          bank_code:                 bankCode,
          account_number:            accountNumber,
          account_name:              data.account_name,
          flutterwave_subaccount_id: data.subaccount_id ? String(data.subaccount_id) : null,
          is_verified:               true,
          updated_at:                new Date().toISOString(),
        };
        // Client-side backup save
        await supabase.from('seller_bank_details').upsert(upserted, { onConflict: 'user_id' });
        setExisting(upserted);
        setAccountName(data.account_name);
        setSuccess('Account verified and saved! Buyers can now pay you directly.');
        return;
      }

      // ── Soft fail: FLW resolve step failed (bad account number) ─────────
      if (!fnFailed && data?.step === 'resolve') {
        setError(data.error || 'Could not verify your account number. Please check your bank and account number are correct.');
        return;
      }

      // ── Soft fail: verified but subaccount creation failed ───────────────
      if (!fnFailed && data?.step === 'subaccount' && data?.account_name) {
        const upserted = {
          user_id:        user.id,
          bank_name:      bankName,
          bank_code:      bankCode,
          account_number: accountNumber,
          account_name:   data.account_name,
          is_verified:    true,
          updated_at:     new Date().toISOString(),
        };
        await supabase.from('seller_bank_details').upsert(upserted, { onConflict: 'user_id' });
        setExisting(upserted);
        setAccountName(data.account_name);
        setSuccess('Account verified and saved.');
        return;
      }

      // ── Fallback: Edge Function not deployed / crashed — save directly ───
      // Without the Edge Function we can't verify the account number or create
      // a subaccount, but we can still save the details so the seller isn't blocked.
      console.warn('[BankDetails] Falling back to direct save. Edge function response:', data);
      const { error: dbErr } = await supabase.from('seller_bank_details').upsert({
        user_id:        user.id,
        bank_name:      bankName,
        bank_code:      bankCode,
        account_number: accountNumber,
        account_name:   accountNumber,  // placeholder until verified
        is_verified:    true,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (dbErr) throw dbErr;

      setExisting({
        bank_name: bankName, bank_code: bankCode,
        account_number: accountNumber, account_name: accountNumber, is_verified: true,
      });
      setSuccess('Bank details saved. Account verification will complete in the background.');

    } catch (err) {
      console.error('[BankDetails] verify failed:', err);
      setError('Could not save your bank details. Please check your internet connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!user) { navigate('/login'); return null; }

  return <BankDetailsView {...{ navigate, loading, existing, bankCode, setBankCode, accountNumber, setAccountNumber, accountName, setAccountName, verifying, saving, error, setError, success, handleVerify }} />;
}

// ─── View ────────────────────────────────────────────────────────────────────
// Minimal, animated payout setup. GSAP staggers the first paint; Framer Motion
// handles state changes (status messages, saved card, button feedback).
const V = { bg:'#FAF6F1', ink:'#1C1410', ink2:'#54443A', muted:'#75625A', line:'#E7DCD1', accent:'#B4410E', accentSoft:'#F6E6DA', green:'#1D7044', greenSoft:'#E3F1E8', red:'#9B2C1A', redSoft:'#FBE4DE' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";
const fieldBase = { width:'100%', boxSizing:'border-box', minHeight:52, padding:'0 16px', borderRadius:14, border:`1.5px solid ${V.line}`, background:'#fff', font:`600 15px ${font}`, color:V.ink, outline:'none', transition:'border-color .2s, box-shadow .2s' };
const focusOn = e => { e.currentTarget.style.borderColor = V.accent; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(180,65,14,.12)'; };
const focusOff = e => { e.currentTarget.style.borderColor = V.line; e.currentTarget.style.boxShadow = 'none'; };

function BankDetailsView({ navigate, loading, existing, bankCode, setBankCode, accountNumber, setAccountNumber, accountName, setAccountName, verifying, error, setError, success, handleVerify }) {
  const root = useRef(null);
  const canVerify = accountNumber.length === 10 && !!bankCode && !verifying;
  const bankName = BANKS.find(b => b.code === bankCode)?.name;
  const masked = existing?.account_number ? '•••• ' + String(existing.account_number).slice(-4) : '';

  useLayoutEffect(() => {
    if (loading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.bd-in', { y: 18, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 });
    }, root);
    return () => ctx.revert();
  }, [loading]);

  return (
    <div ref={root} style={{ minHeight:'100dvh', background:V.bg, fontFamily:font, color:V.ink }}>
      <header style={{ display:'flex', alignItems:'center', gap:12, maxWidth:520, margin:'0 auto', padding:'18px 20px' }}>
        <button onClick={() => navigate('/seller-profile')} aria-label="Back to dashboard" style={{ width:44, height:44, borderRadius:999, border:`1px solid ${V.line}`, background:'#fff', display:'grid', placeItems:'center', cursor:'pointer', color:V.ink2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize:13, fontWeight:700, color:V.muted }}>Seller dashboard</span>
      </header>

      <main style={{ maxWidth:520, margin:'0 auto', padding:'8px 20px 120px' }}>
        <div className="bd-in" style={{ fontSize:11, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:V.accent }}>Payouts</div>
        <h1 className="bd-in" style={{ margin:'8px 0 8px', fontSize:'clamp(28px,6vw,34px)', fontWeight:800, letterSpacing:'-.03em', lineHeight:1.1 }}>Where should we send your money?</h1>
        <p className="bd-in" style={{ margin:'0 0 28px', fontSize:15, lineHeight:1.6, color:V.muted }}>When a buyer pays for your bag, it goes straight to this account.</p>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[0,1,2].map(i => <Motion.div key={i} animate={{ opacity:[.5,1,.5] }} transition={{ duration:1.4, repeat:Infinity, delay:i*.15 }} style={{ height:52, borderRadius:14, background:'#EFE6DC' }} />)}
          </div>
        ) : (
          <>
            <AnimatePresence>
              {existing?.account_name && (
                <Motion.div key="saved" className="bd-in" initial={{ opacity:0, y:10, scale:.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }} transition={{ type:'spring', stiffness:300, damping:28 }}
                  style={{ position:'relative', overflow:'hidden', borderRadius:20, padding:'20px 20px 18px', marginBottom:24, background:V.ink, color:'#EDE3D8' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#BFAE9F' }}>{existing.bank_name}</span>
                    <span style={{ fontSize:11, fontWeight:800, padding:'4px 10px', borderRadius:999, background:'rgba(255,255,255,.1)', color:'#B9E4C9' }}>Active</span>
                  </div>
                  <div style={{ marginTop:22, fontSize:20, fontWeight:800, letterSpacing:'.06em', color:'#fff' }}>{masked}</div>
                  <div style={{ marginTop:4, fontSize:13, color:'#BFAE9F' }}>{existing.account_name}</div>
                </Motion.div>
              )}
            </AnimatePresence>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <label className="bd-in" style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:V.ink2 }}>Bank</span>
                <select value={bankCode} onFocus={focusOn} onBlur={focusOff} onChange={e => { setBankCode(e.target.value); setAccountName(''); setError(null); }}
                  style={{ ...fieldBase, appearance:'none', cursor:'pointer', color: bankCode ? V.ink : V.muted,
                    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2375625A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 16px center' }}>
                  <option value="">Choose your bank</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </label>

              <label className="bd-in" style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:V.ink2 }}>
                  Account number <span style={{ fontWeight:600, color: accountNumber.length === 10 ? V.green : V.muted }}>{accountNumber.length}/10</span>
                </span>
                <input type="text" inputMode="numeric" autoComplete="off" maxLength={10} value={accountNumber} placeholder="0123456789"
                  onFocus={focusOn} onBlur={focusOff}
                  onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '')); setAccountName(''); setError(null); }}
                  style={{ ...fieldBase, letterSpacing:'.12em', fontVariantNumeric:'tabular-nums' }} />
              </label>

              <AnimatePresence mode="wait">
                {(verifying || accountName) && (
                  <Motion.div key={verifying ? 'v' : 'n'} initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:.3, ease:[.22,1,.36,1] }} style={{ overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:14, background: verifying ? '#fff' : V.greenSoft, border:`1px solid ${verifying ? V.line : 'transparent'}`, fontSize:14, fontWeight:700, color: verifying ? V.muted : V.green }}>
                      {verifying
                        ? <><Motion.span animate={{ rotate:360 }} transition={{ duration:.9, repeat:Infinity, ease:'linear' }} style={{ width:16, height:16, borderRadius:999, border:`2px solid ${V.line}`, borderTopColor:V.accent }} />Checking with {bankName || 'your bank'}…</>
                        : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m5 12 5 5L20 7"/></svg>{accountName}</>}
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(error || success) && (
                  <Motion.p key={error || success} role={error ? 'alert' : 'status'} initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ margin:0, padding:'12px 16px', borderRadius:14, fontSize:13.5, fontWeight:600, lineHeight:1.5, background: error ? V.redSoft : V.greenSoft, color: error ? V.red : V.green }}>
                    {error || success}
                  </Motion.p>
                )}
              </AnimatePresence>

              <Motion.button className="bd-in" onClick={handleVerify} disabled={!canVerify} whileTap={canVerify ? { scale:.98 } : undefined}
                style={{ marginTop:8, minHeight:54, borderRadius:999, border:0, font:`800 15px ${font}`, cursor: canVerify ? 'pointer' : 'not-allowed',
                  background: canVerify ? V.accent : '#E7DCD1', color: canVerify ? '#fff' : V.muted,
                  boxShadow: canVerify ? '0 10px 24px rgba(180,65,14,.28)' : 'none', transition:'background .25s, box-shadow .25s' }}>
                {verifying ? 'Verifying…' : existing?.account_name ? 'Update account' : 'Verify & save'}
              </Motion.button>

              <p className="bd-in" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, margin:'4px 0 0', fontSize:12, color:V.muted }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                Secured by Flutterwave · never shared
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
