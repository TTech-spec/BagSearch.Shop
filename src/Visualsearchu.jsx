// ─── VISUAL SEARCH OVERLAY — replace the existing `visualSearching` block ────
// Find this in your Product() component's JSX, inside the products tab section:
//
//   <div style={{position:'relative',minHeight:visualSearching?'300px':'auto'}}>
//     {visualSearching&&( ... old spinner ... )}
//     ...
//   </div>
//
// Replace the ENTIRE <div style={{position:'relative',...}}> block with the one below.
// Everything else in your file stays exactly the same.
// ─────────────────────────────────────────────────────────────────────────────

// Also add this NEW state variable near your other useState declarations
// (around line where you have: const[visualSearching,setVisualSearching]=useState(false);)
//
//   const [visualSearchSuccess, setVisualSearchSuccess] = useState(false);
//   const [visualSearchCount, setVisualSearchCount] = useState(0);
//
// And update handleImageUpload to set these:
//   In the try block, after setDisplayedProducts(results):
//     setVisualSearchSuccess(true);
//     setVisualSearchCount(results.length);
//     setTimeout(() => setVisualSearchSuccess(false), 3500); // auto-dismiss
//   In the else block: setVisualSearchSuccess(false); setVisualSearchCount(0);
//   In finally: (remove nothing, just keep setVisualSearching(false))
//
// Also in handleClearSearch, add:
//   setVisualSearchSuccess(false); setVisualSearchCount(0);
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. NEW CSS — add inside your existing <style> block ─────────────────────
/*
@keyframes vsSpin{to{transform:rotate(360deg)}}
@keyframes vsSpinR{to{transform:rotate(-360deg)}}
@keyframes vsScan{0%{top:0%;opacity:1}70%{opacity:.5}100%{top:100%;opacity:0}}
@keyframes vsDot{0%,100%{background:#f0d9cc;transform:scale(1)}50%{background:#c84b11;transform:scale(1.5)}}
@keyframes vsSuccessPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes vsRipple{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.22);opacity:0}}
@keyframes vsRipple2{0%{transform:scale(1);opacity:.4}100%{transform:scale(1.38);opacity:0}}
@keyframes vsCheckPop{0%{transform:scale(0) rotate(-45deg)}60%{transform:scale(1.25) rotate(5deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes vsFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes vsTagIn{from{opacity:0;transform:translateY(8px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vsCountIn{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}
*/

// ─── 2. UPDATED JSX BLOCK ────────────────────────────────────────────────────
// Replace the old spinner+results block:

{/* Visual Search Overlay — Analyzing */}
{visualSearching && (
  <div style={{
    position:'fixed', inset:0, zIndex:200,
    background:'rgba(26,10,0,0.6)',
    backdropFilter:'blur(10px)',
    WebkitBackdropFilter:'blur(10px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    animation:'fadeIn 0.35s ease both',
  }}>
    <div style={{
      background:'white', borderRadius:28, padding:'44px 36px 40px',
      maxWidth:360, width:'90vw', textAlign:'center',
      boxShadow:'0 32px 80px rgba(200,75,17,0.22)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Gradient top strip */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:4,
        background:'linear-gradient(90deg,#c84b11,#f97316,#ea580c,#c84b11)',
        backgroundSize:'200% 100%',
        animation:'shimFeedback 2.5s linear infinite',
      }}/>

      {/* Ring + image */}
      <div style={{ position:'relative', width:180, height:180, margin:'0 auto 28px' }}>
        {/* Outer spinning ring */}
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:'3.5px solid transparent',
          borderTopColor:'#c84b11', borderRightColor:'#f97316',
          animation:'vsSpin 1.1s linear infinite',
        }}/>
        {/* Mid counter-spin ring */}
        <div style={{
          position:'absolute', inset:10, borderRadius:'50%',
          border:'2.5px solid transparent',
          borderTopColor:'#f9c4a0', borderLeftColor:'#f97316',
          animation:'vsSpinR .85s linear infinite',
        }}/>
        {/* Inner dashed ring */}
        <div style={{
          position:'absolute', inset:18, borderRadius:'50%',
          border:'1.5px dashed rgba(200,75,17,0.2)',
          animation:'vsSpinR 3s linear infinite',
        }}/>
        {/* Image circle */}
        <div style={{
          position:'absolute', inset:22, borderRadius:'50%',
          overflow:'hidden', background:'#fdf4ee',
          boxShadow:'0 8px 24px rgba(200,75,17,0.18)',
        }}>
          {uploadedImage
            ? <img src={uploadedImage} alt="" loading="eager" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#fde8d8,#fdf4ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>👜</div>
          }
          {/* Scan line */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', pointerEvents:'none' }}>
            <div style={{
              position:'absolute', top:0, left:0, right:0, height:2,
              background:'linear-gradient(90deg,transparent 0%,rgba(200,75,17,0.9) 50%,transparent 100%)',
              animation:'vsScan 1.6s ease-in-out infinite',
            }}/>
          </div>
        </div>
        {/* Corner dots */}
        {[{t:-6,l:'50%',ml:-3},{t:'50%',mt:-3,r:-6},{b:-6,l:'50%',ml:-3},{t:'50%',mt:-3,l:-6}].map((s,i)=>(
          <div key={i} style={{
            position:'absolute', width:8, height:8, borderRadius:'50%',
            background:i%2===0?'#c84b11':'#f97316',
            boxShadow:`0 0 0 2px white`,
            animation:`vsSpin ${1.1}s linear infinite`,
            ...s,
          }}/>
        ))}
      </div>

      {/* Animated dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:7, marginBottom:18 }}>
        {[0,200,400].map((d,i)=>(
          <div key={i} style={{
            width:9, height:9, borderRadius:'50%',
            animation:`vsDot .9s ease-in-out ${d}ms infinite`,
          }}/>
        ))}
      </div>

      <h3 style={{ fontSize:20, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.03em', marginBottom:8 }}>
        Finding similar bags...
      </h3>
      <p style={{ fontSize:13, color:'#9a6348', fontWeight:500, lineHeight:1.65, marginBottom:20 }}>
        Scanning thousands of listings across Nigeria for your perfect match
      </p>

      {/* Animated tags */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center' }}>
        {[
          {l:'Matching colors', d:100},
          {l:'Comparing shape', d:250},
          {l:'Checking style', d:400},
          {l:'Finding sellers', d:550},
        ].map(({l,d})=>(
          <span key={l} style={{
            fontSize:11, fontWeight:700,
            background:'#fdf4ee', color:'#c84b11',
            border:'1px solid #f9c4a0',
            padding:'4px 11px', borderRadius:20,
            animation:`vsTagIn .5s cubic-bezier(.34,1.56,.64,1) ${d}ms both`,
          }}>{l}</span>
        ))}
      </div>
    </div>
  </div>
)}

{/* Visual Search Success Overlay */}
{visualSearchSuccess && !visualSearching && (
  <div style={{
    position:'fixed', inset:0, zIndex:200,
    background:'rgba(26,10,0,0.55)',
    backdropFilter:'blur(10px)',
    WebkitBackdropFilter:'blur(10px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    animation:'fadeIn 0.35s ease both',
  }}
  onClick={() => setVisualSearchSuccess(false)}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background:'white', borderRadius:28, padding:'44px 36px 40px',
        maxWidth:360, width:'90vw', textAlign:'center',
        boxShadow:'0 32px 80px rgba(22,163,74,0.2)',
        position:'relative', overflow:'hidden',
      }}
    >
      {/* Green top strip */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#15803d,#22c55e,#15803d)' }}/>

      {/* Ring + image */}
      <div style={{ position:'relative', width:180, height:180, margin:'0 auto 28px' }}>
        {/* Outer ripples */}
        <div style={{
          position:'absolute', inset:-12, borderRadius:'50%',
          border:'1.5px solid #dcfce7',
          animation:'vsRipple2 2s ease-out .5s infinite',
        }}/>
        <div style={{
          position:'absolute', inset:-4, borderRadius:'50%',
          border:'2px solid #a7f3d0',
          animation:'vsRipple 2s ease-out .2s infinite',
        }}/>
        {/* Success ring */}
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:'3.5px solid #16a34a',
          animation:'vsSuccessPop .6s cubic-bezier(.34,1.56,.64,1) both',
        }}/>
        {/* Image circle */}
        <div style={{
          position:'absolute', inset:8, borderRadius:'50%', overflow:'hidden',
          background:'#f0fdf4', boxShadow:'0 8px 24px rgba(22,163,74,0.15)',
        }}>
          {uploadedImage
            ? <img src={uploadedImage} alt="" loading="eager" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#dcfce7,#f0fdf4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>👜</div>
          }
        </div>
        {/* Checkmark badge */}
        <div style={{
          position:'absolute', bottom:6, right:6,
          width:42, height:42, borderRadius:'50%',
          background:'linear-gradient(135deg,#15803d,#22c55e)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 14px rgba(22,163,74,0.5)',
          border:'3px solid white',
          animation:'vsCheckPop .55s cubic-bezier(.34,1.56,.64,1) .4s both',
          transform:'scale(0)',
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
        </div>
      </div>

      {/* Count badge */}
      <div style={{
        display:'inline-block',
        background:'#dcfce7', color:'#15803d',
        border:'1px solid #a7f3d0',
        fontSize:13, fontWeight:800,
        padding:'6px 18px', borderRadius:20, marginBottom:14,
        animation:'vsCountIn .5s cubic-bezier(.34,1.56,.64,1) .3s both',
        opacity:0,
      }}>
        {visualSearchCount} similar bag{visualSearchCount !== 1 ? 's' : ''} found!
      </div>

      <h3 style={{
        fontSize:22, fontWeight:900, color:'#1a0a00',
        letterSpacing:'-0.03em', marginBottom:8,
        animation:'vsFadeUp .45s ease .25s both', opacity:0,
      }}>
        We found your match! 🎉
      </h3>
      <p style={{
        fontSize:13, color:'#9a6348', fontWeight:500, lineHeight:1.65, marginBottom:24,
        animation:'vsFadeUp .45s ease .38s both', opacity:0,
      }}>
        Showing bags that look just like yours from trusted sellers across Nigeria
      </p>

      <div style={{ display:'flex', gap:10, justifyContent:'center', animation:'vsFadeUp .45s ease .5s both', opacity:0 }}>
        <button
          onClick={() => setVisualSearchSuccess(false)}
          style={{
            flex:1, maxWidth:200, padding:'13px 0',
            background:'linear-gradient(135deg,#15803d,#22c55e)',
            color:'white', border:'none', borderRadius:14,
            fontWeight:900, fontSize:14, cursor:'pointer',
            boxShadow:'0 6px 20px rgba(22,163,74,0.4)',
            transition:'all 0.25s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          Browse Results →
        </button>
        <button
          onClick={() => { setVisualSearchSuccess(false); handleClearSearch(); }}
          style={{
            padding:'13px 16px', background:'#fdf4ee',
            color:'#c84b11', border:'1.5px solid #f9c4a0',
            borderRadius:14, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='#fde8d8'}
          onMouseLeave={e => e.currentTarget.style.background='#fdf4ee'}
        >
          Clear
        </button>
      </div>
    </div>
  </div>
)}

{/* Results grid — unchanged */}
<div style={{position:'relative', minHeight:'auto'}}>
  {displayedProducts.length > 0
    ? <ProductGridWithAds
        products={displayedProducts}
        navigate={navigate}
        onAddToCart={handleAddToCart}
        isAuthed={!!user}
        onRequireAuth={() => setAuthGateOpen(true)}
        resultsKey={resultsKey}
      />
    : !visualSearching && (
      <div style={{textAlign:'center',padding:'80px 20px',animation:'bounceIn 0.6s ease both'}}>
        <div style={{fontSize:56,marginBottom:16}}>🔍</div>
        <h3 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>No bags found</h3>
        <p style={{color:C.textMuted,marginBottom:24,fontSize:14}}>Try adjusting your search or browse all bags</p>
        <button onClick={handleClearSearch} style={{padding:'11px 24px',background:'linear-gradient(135deg,#c84b11,#f97316)',color:'white',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14}}>View All Bags</button>
      </div>
    )
  }
</div>