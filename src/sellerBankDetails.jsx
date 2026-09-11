import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { supabase } from './services/api';
import LogoIcon from './components/Logo.jsx';
import { useSEO } from './hooks/useSEO';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  primary:'#c84b11', primaryLight:'#f97316', primaryBg:'#fde8d8',
  success:'#16a34a', successBg:'#dcfce7',
  danger:'#dc2626', dangerBg:'#fef2f2',
  text:'#1a0a00', textMid:'#5c3317', textMuted:'#9a6348',
  border:'#f0d9cc', borderLight:'#f7ece4',
};

// ─── Nigerian Banks ──────────────────────────────────────────────────────────
const BANKS = [
  { name:'Access Bank', code:'044' },
  { name:'Citibank Nigeria', code:'023' },
  { name:'Ecobank Nigeria', code:'050' },
  { name:'Fidelity Bank', code:'070' },
  { name:'First Bank of Nigeria', code:'011' },
  { name:'First City Monument Bank (FCMB)', code:'214' },
  { name:'Globus Bank', code:'00103' },
  { name:'Guaranty Trust Bank (GTBank)', code:'058' },
  { name:'Heritage Bank', code:'030' },
  { name:'Jaiz Bank', code:'301' },
  { name:'Keystone Bank', code:'082' },
  { name:'Kuda Microfinance Bank', code:'50211' },
  { name:'Lotus Bank', code:'303' },
  { name:'Moniepoint Microfinance Bank', code:'50515' },
  { name:'OPay', code:'999992' },
  { name:'Palmpay', code:'999991' },
  { name:'Polaris Bank', code:'076' },
  { name:'Providus Bank', code:'101' },
  { name:'Stanbic IBTC Bank', code:'221' },
  { name:'Standard Chartered Bank', code:'068' },
  { name:'Sterling Bank', code:'232' },
  { name:'SunTrust Bank Nigeria', code:'100' },
  { name:'Titan Trust Bank', code:'102' },
  { name:'Union Bank of Nigeria', code:'032' },
  { name:'United Bank for Africa (UBA)', code:'033' },
  { name:'Unity Bank', code:'215' },
  { name:'Wema Bank', code:'035' },
  { name:'Zenith Bank', code:'057' },
];

export default function SellerBankDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Bank Details | BagSearch Seller Dashboard',
    description: 'Add your bank account to receive payments directly when buyers purchase your bags on BagSearch.',
    noindex: true,
  });

  // Load existing bank details
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
        setBankCode(data.bank_code);
        setAccountNumber(data.account_number);
        setAccountName(data.account_name);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  // Resolve account name when account number is 10 digits and bank is selected
  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setAccountName('');
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      setResolving(true);
      setError(null);
      setAccountName('');
      try {
        const res = await fetch('/api/resolve-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
        });
        const data = await res.json();
        if (!cancelled) {
          if (data.success) {
            setAccountName(data.account_name);
          } else {
            setError(data.error || 'Could not verify account. Please check your details.');
          }
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.');
      } finally {
        if (!cancelled) setResolving(false);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [accountNumber, bankCode]);

  const handleSave = async () => {
    if (!accountName) { setError('Please wait for account verification.'); return; }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const bankName = BANKS.find(b => b.code === bankCode)?.name || bankCode;

      // Create Flutterwave subaccount
      const subRes = await fetch('/api/create-subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
          business_name: accountName,
          user_id: user.id,
        }),
      });
      const subData = await subRes.json();

      if (!subData.success) {
        setError(subData.error || 'Failed to set up payment account. Please try again.');
        setSaving(false);
        return;
      }

      // Save to Supabase
      const upsertData = {
        user_id: user.id,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: subData.account_name || accountName,
        flutterwave_subaccount_id: subData.subaccount_id,
        is_verified: true,
        updated_at: new Date().toISOString(),
      };

      const { error: dbErr } = await supabase
        .from('seller_bank_details')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (dbErr) throw dbErr;

      setExisting(upsertData);
      setSuccess('✅ Bank account saved! You will now receive payments directly when buyers purchase your bags.');
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(180deg,#fdf8f5 0%,#fff 40%)',
      fontFamily:"'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 20px',maxWidth:800,margin:'0 auto',
      }}>
        <div onClick={()=>navigate('/')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
          <LogoIcon size={28}/>
          <span style={{fontWeight:900,fontSize:18,color:C.text}}>BagSearch</span>
        </div>
        <button onClick={()=>navigate('/seller-profile')} style={{
          padding:'8px 16px',borderRadius:10,border:`1.5px solid ${C.border}`,
          background:'white',color:C.textMid,fontWeight:700,fontSize:13,cursor:'pointer',
        }}>← Dashboard</button>
      </header>

      <div style={{maxWidth:560,margin:'0 auto',padding:'20px 20px 60px'}}>
        {/* Title */}
        <div style={{textAlign:'center',marginBottom:30}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',
            borderRadius:20,background:C.primaryBg,color:C.primary,
            fontWeight:800,fontSize:12,marginBottom:14,
          }}>
            🏦 PAYMENT SETUP
          </div>
          <h1 style={{fontSize:'clamp(24px,4vw,32px)',fontWeight:900,color:C.text,margin:'0 0 10px'}}>
            Receive Payments Directly
          </h1>
          <p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,margin:0}}>
            Add your bank account so buyers can pay you directly when they purchase your bags. Payments are processed securely by Flutterwave.
          </p>
        </div>

        {/* Flutterwave fees notice */}
        <div style={{
          background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:14,
          padding:16,marginBottom:24,display:'flex',gap:12,alignItems:'flex-start',
        }}>
          <span style={{fontSize:20,flexShrink:0}}>💡</span>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:13,color:'#0c4a6e'}}>
              How payments work
            </p>
            <p style={{margin:'6px 0 0',fontSize:12.5,color:'#0369a1',lineHeight:1.6}}>
              When a buyer pays for your bag, the full amount goes to your bank account.
              Flutterwave deducts a small processing fee:
            </p>
            <ul style={{margin:'8px 0 0',paddingLeft:18,fontSize:12.5,color:'#0369a1',lineHeight:1.8}}>
              <li><strong>Local cards:</strong> 1.4% of transaction (capped at ₦2,000)</li>
              <li><strong>Bank transfer:</strong> Flat ₦10 – ₦25 per transfer</li>
              <li><strong>International cards:</strong> 3.8% of transaction</li>
            </ul>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:C.textMuted}}>Loading...</div>
        ) : (
          <div style={{
            background:'white',borderRadius:20,
            border:`1.5px solid ${C.borderLight}`,
            padding:'28px 24px',
            boxShadow:'0 4px 20px rgba(200,75,17,0.06)',
          }}>
            {/* Existing account banner */}
            {existing?.is_verified && (
              <div style={{
                background:C.successBg,border:`1.5px solid #86efac`,borderRadius:12,
                padding:14,marginBottom:20,display:'flex',alignItems:'center',gap:10,
              }}>
                <span style={{fontSize:20}}>✅</span>
                <div>
                  <p style={{margin:0,fontWeight:700,fontSize:13,color:'#166534'}}>Account verified</p>
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
              <select value={bankCode} onChange={e=>setBankCode(e.target.value)}
                style={{
                  width:'100%',padding:'12px 14px',borderRadius:12,
                  border:`1.5px solid ${C.border}`,fontSize:14,color:C.text,
                  background:'white',cursor:'pointer',outline:'none',
                  appearance:'none',
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a6348' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat:'no-repeat',
                  backgroundPosition:'right 14px center',
                }}>
                <option value="">Choose a bank...</option>
                {BANKS.map(b=>(
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
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
                onChange={e=>setAccountNumber(e.target.value.replace(/\D/g,''))}
                placeholder="Enter 10-digit account number"
                style={{
                  width:'100%',padding:'12px 14px',borderRadius:12,
                  border:`1.5px solid ${C.border}`,fontSize:14,color:C.text,
                  outline:'none',boxSizing:'border-box',
                }}
              />
            </label>

            {/* Account name (resolved) */}
            <label style={{display:'block',marginBottom:20}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,display:'block',marginBottom:6}}>
                Account name
              </span>
              <div style={{
                padding:'12px 14px',borderRadius:12,minHeight:44,
                border:`1.5px solid ${accountName ? '#86efac' : C.border}`,
                background: accountName ? C.successBg : '#fafafa',
                fontSize:14,color: accountName ? '#166534' : C.textMuted,
                fontWeight: accountName ? 700 : 400,
                display:'flex',alignItems:'center',
              }}>
                {resolving ? (
                  <span>Verifying account...</span>
                ) : accountName ? (
                  <span>✅ {accountName}</span>
                ) : (
                  <span>Enter bank and account number above</span>
                )}
              </div>
            </label>

            {/* Error */}
            {error && (
              <div style={{
                background:C.dangerBg,border:'1.5px solid #fca5a5',borderRadius:12,
                padding:'12px 16px',marginBottom:16,fontSize:13,color:C.danger,fontWeight:600,
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background:C.successBg,border:'1.5px solid #86efac',borderRadius:12,
                padding:'12px 16px',marginBottom:16,fontSize:13,color:'#166534',fontWeight:600,
              }}>
                {success}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!accountName || saving || resolving}
              style={{
                width:'100%',padding:'14px 0',borderRadius:12,border:'none',
                background: accountName && !saving
                  ? `linear-gradient(135deg,${C.primary},${C.primaryLight})`
                  : '#e5e5e5',
                color: accountName && !saving ? 'white' : '#999',
                fontWeight:800,fontSize:15,cursor: accountName && !saving ? 'pointer' : 'default',
                boxShadow: accountName && !saving ? `0 6px 20px ${C.primary}33` : 'none',
                transition:'all 0.25s',
              }}>
              {saving ? 'Saving...' : existing?.is_verified ? 'Update Bank Account' : 'Save Bank Account'}
            </button>

            <p style={{textAlign:'center',fontSize:11.5,color:C.textMuted,marginTop:14,lineHeight:1.5}}>
              Your bank details are encrypted and stored securely. We never share your information with third parties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
