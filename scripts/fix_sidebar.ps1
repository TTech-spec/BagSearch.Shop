$content = Get-Content src/sellerProfile.jsx -Raw
$funcStart = $content.IndexOf("// --- Sidebar contents")
if ($funcStart -eq -1) { $funcStart = $content.IndexOf("// Sidebar contents") }
if ($funcStart -eq -1) { $funcStart = $content.IndexOf("SidebarContents") - 50 }
$before = $content.Substring(0, $funcStart)
$newFunc = @"
// --- Sidebar contents ---
function SidebarContents({ initials, seller, sidebarIn, navigate, activeTab, switchTab, onNav, onDeleteClick, userId }) {
  const extNavItems = [
    { icon:'home',        label:'Home',         key:'home'              },
    { icon:'dashboard',   label:'Dashboard',    key:'dashboard'         },
    { icon:'inventory_2', label:'My Listings',  key:'listings'          },
    { icon:'edit',        label:'Edit Profile', key:'edit', badge:true  },
  ];

  const handleClick = useCallback((item) => {
    if (item.key==='home')                          navigate('/products');
    if (item.key==='dashboard'||item.key==='edit')  switchTab?.(item.key);
    if (item.key==='listings')                      navigate('/seller-listing');
    onNav?.();
  }, [navigate, switchTab, onNav]);

  const handleShare = () => {
    const id = userId || seller?.id || '';
    const url = window.location.origin + '/vendor/' + id;
    if (navigator.share) {
      navigator.share({ title: (seller?.name || 'Seller') + ' on BagSearch', url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Profile link copied!'));
    }
  };

  return (
    <>
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#c84b11,#f97316)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MS name="shopping_bag" size={18} style={{ color:"white" }}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:"#f8fafc", letterSpacing:"-0.02em" }}>BagSearch</div>
            <div style={{ fontSize:10, color:"#9a6348", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Seller</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
        {extNavItems.map((item,i)=>{
          const isActive = item.key===activeTab;
          return (
            <a key={item.key} href="#" onClick={e=>{e.preventDefault();handleClick(item);}}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, textDecoration:"none", background:isActive?"#fde8d8":"transparent", color:isActive?"#c84b11":"#9a6348", transition:"all 0.2s", opacity:sidebarIn?1:0, animation:sidebarIn?"slideRight 0.4s cubic-bezier(0.22,1,0.36,1) " + (i*60) + "ms both":"none" }}
              onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
              onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
              <MS name={item.icon} size={20}/>
              <span style={{ fontSize:13, fontWeight:isActive?700:600, flex:1 }}>{item.label}</span>
              {item.badge && !isActive && <span style={{ width:6, height:6, borderRadius:"50%", background:"#ea580c", animation:"pulse 2s ease-in-out infinite" }}/>}
              {isActive && <div style={{ width:6, height:6, borderRadius:"50%", background:"#c84b11" }}/>}
            </a>
          );
        })}
      </nav>

      <div style={{ padding:"16px 14px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#c84b11,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seller?.name}</div>
            <div style={{ fontSize:9, fontWeight:800, color:"#c84b11", letterSpacing:"0.15em", textTransform:"uppercase" }}>Pro Seller</div>
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="mail" size={13} style={{ color:"#9a6348" }}/><span style={{ fontSize:11, color:"#9a6348", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seller?.email}</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><MS name="phone" size={13} style={{ color:"#9a6348" }}/><span style={{ fontSize:11, color:"#9a6348" }}>{seller?.phone}</span></div>
        </div>

        <button onClick={handleShare}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10, marginBottom:8, border:'1.5px solid #f9c4a0', background:'#fde8d8', color:'#c84b11', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Manrope',sans-serif", transition:'all 0.25s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#c84b11';e.currentTarget.style.color='white';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#fde8d8';e.currentTarget.style.color='#c84b11';}}>
          <MS name="share" size={16} style={{ color:'inherit' }}/>
          <span style={{ flex:1, textAlign:'left' }}>Share Profile</span>
          <MS name="chevron_right" size={14} style={{ color:'inherit', opacity:0.5 }}/>
        </button>

        <button onClick={onDeleteClick}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(220,38,38,0.22)', background:'rgba(220,38,38,0.06)', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Manrope',sans-serif", transition:'all 0.25s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,38,38,0.14)';e.currentTarget.style.transform='translateY(-1px)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(220,38,38,0.06)';e.currentTarget.style.transform='none';}}>
          <MS name="delete_forever" size={16} style={{ color:'#ef4444' }}/>
          <span style={{ flex:1, textAlign:'left' }}>Delete Account</span>
          <MS name="chevron_right" size={14} style={{ color:'rgba(239,68,68,0.5)' }}/>
        </button>
      </div>
    </>
  );
}
"@
$newContent = $before + $newFunc
Set-Content src/sellerProfile.jsx -Value $newContent -NoNewline
Write-Host "Done. Chars: $($newContent.Length)"
