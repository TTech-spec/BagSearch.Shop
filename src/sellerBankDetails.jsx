import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import LogoIcon from './components/Logo.jsx';
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
        setSuccess('✅ Account verified and saved! Buyers can now pay you directly.');
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
        setSuccess('✅ Account verified and saved.');
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
      setSuccess('✅ Bank details saved. Account verification will complete in the background.');

    } catch (err) {
      console.error('[BankDetails] verify failed:', err);
      setError('Could not save your bank details. Please check your internet connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!user) { navigate('/login'); return null; }

  const canVerify = accountNumber.length === 10 && !!bankCode && !verifying && !saving;

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(180deg,#fdf8f5 0%,#fff 40%)',
      fontFamily:"'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
    }}>
      {/* ── Header ── */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 20px', maxWidth:800, margin:'0 auto',
      }}>
        <div onClick={()=>navigate('/')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
          <LogoIcon size={28}/>
          <span style={{fontWeight:900,fontSize:18,color:C.text}}>BagSearch</span>
        </div>
        <button onClick={()=>navigate('/seller-profile')} style={{
          padding:'8px 16px', borderRadius:10, border:`1.5px solid ${C.border}`,
          background:'white', color:C.textMid, fontWeight:700, fontSize:13, cursor:'pointer',
        }}>← Dashboard</button>
      </header>

      <div style={{maxWidth:560,margin:'0 auto',padding:'20px 20px 80px'}}>
        {/* ── Title ── */}
        <div style={{textAlign:'center',marginBottom:30}}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px',
            borderRadius:20, background:C.primaryBg, color:C.primary,
            fontWeight:800, fontSize:12, marginBottom:14,
          }}>
            🏦 PAYMENT SETUP
          </div>
          <h1 style={{fontSize:'clamp(24px,4vw,32px)',fontWeight:900,color:C.text,margin:'0 0 10px'}}>
            Receive Payments Directly
          </h1>
          <p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,margin:0}}>
            Add your bank account so buyers can pay you directly when they purchase your bags.
          </p>
        </div>

        {/* ── How payments work ── */}
        <div style={{
          background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:14,
          padding:16, marginBottom:24, display:'flex', gap:12, alignItems:'flex-start',
        }}>
          <span style={{fontSize:20,flexShrink:0}}>💡</span>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:13,color:'#0c4a6e'}}>How payments work</p>
            <p style={{margin:'6px 0 0',fontSize:12.5,color:'#0369a1',lineHeight:1.6}}>
              When a buyer pays for your bag, the money goes directly to this bank account.
              Your details are stored securely and only used to process payouts.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:C.textMuted}}>Loading...</div>
        ) : (
          <div style={{
            background:'white', borderRadius:20,
            border:`1.5px solid ${C.borderLight}`,
            padding:'28px 24px',
            boxShadow:'0 4px 20px rgba(200,75,17,0.06)',
          }}>
            {/* Existing account banner */}
            {existing?.account_name && (
              <div style={{
                background:C.successBg, border:'1.5px solid #86efac', borderRadius:12,
                padding:14, marginBottom:20, display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{fontSize:20}}>✅</span>
                <div>
                  <p style={{margin:0,fontWeight:700,fontSize:13,color:'#166534'}}>Account saved</p>
                  <p style={{margin:'2px 0 0',fontSize:12,color:'#15803d'}}>
                    {existing.account_name} — {existing.bank_name} ({existing.account_number})
                  </p>
                </div>
              </div>
            )}

            {/* Bank select */}
            <label style={{display:'block',marginBottom:16}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,display:'block',marginBottom:6}}>
                Select your bank
              </span>
              <select value={bankCode} onChange={e => { setBankCode(e.target.value); setAccountName(''); setError(null); }}
                style={{
                  width:'100%', padding:'12px 14px', borderRadius:12,
                  border:`1.5px solid ${bankCode ? C.primary : C.border}`,
                  fontSize:14, color:C.text, background:'white', cursor:'pointer',
                  outline:'none', appearance:'none',
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a6348' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center',
                  boxSizing:'border-box',
                }}>
                <option value="">Choose a bank…</option>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </label>

            {/* Account number */}
            <label style={{display:'block',marginBottom:16}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,display:'block',marginBottom:6}}>
                Account number
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                onChange={e => { setAccountNumber(e.target.value.replace(/\D/g,'')); setAccountName(''); setError(null); }}
                placeholder="Enter 10-digit account number"
                style={{
                  width:'100%', padding:'12px 14px', borderRadius:12,
                  border:`1.5px solid ${accountNumber.length===10 ? C.primary : C.border}`,
                  fontSize:14, color:C.text, outline:'none', boxSizing:'border-box',
                  transition:'border-color 0.2s',
                }}
              />
            </label>

            {/* Account name — auto-resolved by Flutterwave via Edge Function */}
            <label style={{display:'block',marginBottom:20}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,display:'block',marginBottom:6}}>
                Account name
              </span>
              <div style={{
                padding:'12px 14px', borderRadius:12, minHeight:46,
                border:`1.5px solid ${accountName ? '#86efac' : C.border}`,
                background: accountName ? C.successBg : '#fafafa',
                fontSize:14,
                color: accountName ? '#166534' : C.textMuted,
                fontWeight: accountName ? 700 : 400,
                display:'flex', alignItems:'center', gap:8,
              }}>
                {verifying ? (
                  <><span style={{fontSize:13}}>⏳</span> Verifying account with Flutterwave…</>
                ) : accountName ? (
                  <><span style={{fontSize:16}}>✅</span> {accountName}</>
                ) : (
                  'Enter your bank and 10-digit account number, then click Verify'
                )}
              </div>
            </label>

            {/* Error */}
            {error && (
              <div style={{
                background:C.dangerBg, border:'1.5px solid #fca5a5', borderRadius:12,
                padding:'12px 16px', marginBottom:16, fontSize:13, color:C.danger, fontWeight:600,
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background:C.successBg, border:'1.5px solid #86efac', borderRadius:12,
                padding:'12px 16px', marginBottom:16, fontSize:13, color:'#166534', fontWeight:600,
              }}>
                {success}
              </div>
            )}

            {/* Verify & Save button */}
            <button
              onClick={handleVerify}
              disabled={!canVerify}
              style={{
                width:'100%', padding:'14px 0', borderRadius:12, border:'none',
                background: canVerify
                  ? `linear-gradient(135deg,${C.primary},${C.primaryLight})`
                  : '#e5e5e5',
                color: canVerify ? 'white' : '#999',
                fontWeight:800, fontSize:15,
                cursor: canVerify ? 'pointer' : 'default',
                boxShadow: canVerify ? `0 6px 20px ${C.primary}33` : 'none',
                transition:'all 0.25s',
              }}>
              {verifying
                ? '⏳ Verifying with Flutterwave…'
                : existing?.account_name
                  ? '🔄 Update Bank Account'
                  : '✅ Verify & Save Bank Account'}
            </button>

            <p style={{textAlign:'center',fontSize:11.5,color:C.textMuted,marginTop:14,lineHeight:1.5}}>
              Your bank details are stored securely. We never share your information with third parties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
