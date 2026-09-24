// src/components/photo/PhotoSearch.jsx
// Photo search flow: choose a photo (sheet on phones, drag-and-drop dialog on
// desktop) -> adjust the crop box -> hand the cropped File to onSearch.
// PhotoScanOverlay is the "finding similar bags" screen shown while searching.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const S = {
  ink: '#1E1A17',
  muted: '#6F6761',
  faint: '#8A827C',
  pill: '#F4F1EF',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  accent: '#C84B11',
  night: '#141110',
  danger: '#B42318',
  font: "'Poppins', system-ui, sans-serif",
};
const RECENT_KEY = 'bs_recent_photo_searches';
const MAX_BYTES = 10 * 1024 * 1024;
const TIPS = [
  { n: '1', text: 'Fill the frame with the bag', bg: '#A6DFAE' },
  { n: '2', text: 'Use daylight and avoid heavy shadows', bg: '#F8C9A5' },
  { n: '3', text: 'One bag per photo works best', bg: '#9ADFE1' },
];
const sheetSpring = { type: 'spring', stiffness: 300, damping: 32 };
const spring = { type: 'spring', stiffness: 100, damping: 20 };

const Svg = ({ size = 18, sw = 1.8, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const CameraIcon = ({ size = 20 }) => <Svg size={size}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
const GalleryIcon = ({ size = 20 }) => <Svg size={size}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 9" /></Svg>;
const CloseIcon = () => <Svg size={14} sw={2.2}><path d="M18 6 6 18M6 6l12 12" /></Svg>;

// ── Recent photo searches (small thumbnails kept on this device only) ──
function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function writeRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage full or blocked */ }
}
async function dataUrlToFile(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], 'recent-photo.jpg', { type: blob.type || 'image/jpeg' });
}

// Crop the image (fractions of its natural size) and return { file, thumb }
function cropImage(img, rect) {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const sx = rect.x * nw, sy = rect.y * nh, sw = rect.w * nw, sh = rect.h * nh;
  const scale = Math.min(1, 1024 / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const tScale = Math.min(1, 360 / Math.max(canvas.width, canvas.height));
  const t = document.createElement('canvas');
  t.width = Math.round(canvas.width * tScale);
  t.height = Math.round(canvas.height * tScale);
  t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height);
  const thumb = t.toDataURL('image/jpeg', 0.72);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve({ file: new File([blob], 'photo-search.jpg', { type: 'image/jpeg' }), thumb }), 'image/jpeg', 0.9);
  });
}

// ── Crop editor: drag the box, or its corners, around the bag ──
const MIN = 0.12;
function CropEditor({ src, rect, setRect, imgRef, dark = true }) {
  const wrap = useRef(null);
  const drag = useRef(null);

  // One handler for the box and its corners; the drag mode comes from data-mode
  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const mode = e.currentTarget.dataset.mode;
    const box = wrap.current.getBoundingClientRect();
    drag.current = { mode, startX: e.clientX, startY: e.clientY, start: rect, box };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.box.width;
    const dy = (e.clientY - d.startY) / d.box.height;
    let { x, y, w, h } = d.start;
    if (d.mode === 'move') {
      x = Math.min(Math.max(0, x + dx), 1 - w);
      y = Math.min(Math.max(0, y + dy), 1 - h);
    } else {
      if (d.mode.includes('l')) { const nx = Math.min(Math.max(0, x + dx), x + w - MIN); w += x - nx; x = nx; }
      if (d.mode.includes('r')) { w = Math.min(Math.max(MIN, w + dx), 1 - x); }
      if (d.mode.includes('t')) { const ny = Math.min(Math.max(0, y + dy), y + h - MIN); h += y - ny; y = ny; }
      if (d.mode.includes('b')) { h = Math.min(Math.max(MIN, h + dy), 1 - y); }
    }
    setRect({ x, y, w, h });
  };
  const onUp = () => { drag.current = null; };

  const corner = (pos, mode) => (
    <span
      key={mode}
      data-mode={mode}
      onPointerDown={onDown}
      aria-hidden="true"
      style={{
        position: 'absolute', width: 34, height: 34, ...pos, touchAction: 'none', cursor: mode === 'tl' || mode === 'br' ? 'nwse-resize' : 'nesw-resize',
        display: 'flex', alignItems: mode.includes('t') ? 'flex-start' : 'flex-end', justifyContent: mode.includes('l') ? 'flex-start' : 'flex-end',
      }}
    >
      <span style={{
        width: 24, height: 24,
        borderTop: mode.includes('t') ? '4px solid #fff' : 'none', borderBottom: mode.includes('b') ? '4px solid #fff' : 'none',
        borderLeft: mode.includes('l') ? '4px solid #fff' : 'none', borderRight: mode.includes('r') ? '4px solid #fff' : 'none',
        borderRadius: mode === 'tl' ? '10px 0 0 0' : mode === 'tr' ? '0 10px 0 0' : mode === 'bl' ? '0 0 0 10px' : '0 0 10px 0',
      }} />
    </span>
  );

  return (
    <div
      ref={wrap}
      onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ position: 'relative', display: 'inline-block', lineHeight: 0, borderRadius: 20, overflow: 'hidden', touchAction: 'none', userSelect: 'none', background: dark ? '#000' : S.pill }}
    >
      <img ref={imgRef} src={src} alt="Your photo" draggable="false" style={{ display: 'block', maxWidth: '100%', maxHeight: 'min(56vh, 520px)', objectFit: 'contain' }} />
      <motion.div
        data-mode="move"
        onPointerDown={onDown}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring}
        style={{
          position: 'absolute', left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%`,
          boxShadow: '0 0 0 9999px rgba(20,17,16,.58)', borderRadius: 12, cursor: 'move', touchAction: 'none',
          outline: '1px solid rgba(255,255,255,.55)',
        }}
      >
        {/* rule-of-thirds guides */}
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)', backgroundSize: '33.34% 33.34%', backgroundPosition: '-1px -1px', pointerEvents: 'none', borderRadius: 12 }} />
        {corner({ left: -6, top: -6 }, 'tl')}
        {corner({ right: -6, top: -6 }, 'tr')}
        {corner({ left: -6, bottom: -6 }, 'bl')}
        {corner({ right: -6, bottom: -6 }, 'br')}
      </motion.div>
    </div>
  );
}

function ChoiceTile({ index, bg, icon, onClick, children }) {
  return (
    <motion.button type="button" onClick={onClick} className="ps-tile"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 + index * 0.06 }}
      style={{ position: 'relative', height: 150, border: 'none', borderRadius: 22, background: bg, cursor: 'pointer', textAlign: 'left', padding: 16, fontFamily: S.font, color: S.ink, overflow: 'hidden' }}>
      <motion.span aria-hidden="true" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 4, repeat: Infinity, delay: index }}
        style={{ position: 'absolute', right: -24, bottom: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.26)' }} />
      <span style={{ width: 44, height: 44, borderRadius: 14, background: S.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ position: 'absolute', left: 16, bottom: 16, fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{children}</span>
    </motion.button>
  );
}

function Tips({ compact }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.faint }}>For a better match</p>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: compact ? 10 : 12 }}>
        {TIPS.map((t, i) => (
          <motion.div key={t.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.12 + i * 0.07 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{t.n}</span>
            {t.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Recent({ items, onPick, grid }) {
  if (!items.length) return null;
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.faint }}>Your recent photo searches</p>
      <div style={{ marginTop: 10, display: grid ? 'grid' : 'flex', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {items.map((r, i) => (
          <motion.button key={r.at} type="button" onClick={() => onPick(r)} aria-label="Search this photo again"
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.2 + i * 0.06 }}
            whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}
            style={{ width: grid ? '100%' : 64, aspectRatio: '1', padding: 0, border: 'none', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: S.pill }}>
            <img src={r.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function PhotoSearchSheet({ open, onClose, onSearch, isMobile }) {
  const [stage, setStage] = useState('choose'); // choose | crop
  const [src, setSrc] = useState(null);
  const [rect, setRect] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const imgRef = useRef(null);
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);

  const reset = useCallback(() => {
    setStage('choose'); setError(''); setBusy(false); setDragging(false);
    setSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, []);
  const close = () => { reset(); onClose(); };

  const takeFile = useCallback((file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) { setError('That file is not an image. Try a JPG, PNG or WEBP photo.'); return; }
    if (file.size > MAX_BYTES) { setError('That photo is over 10 MB. Try a smaller one.'); return; }
    setError('');
    setSrc(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setStage('crop');
  }, []);

  // Desktop: paste a screenshot with Ctrl/Cmd+V while the dialog is open
  useEffect(() => {
    if (!open || stage !== 'choose') return undefined;
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      if (item) takeFile(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, stage, takeFile]);

  // Esc closes
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') { reset(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, reset]);

  const runSearch = async () => {
    if (!imgRef.current) return;
    setBusy(true);
    try {
      const { file, thumb } = await cropImage(imgRef.current, rect);
      const next = [{ thumb, at: Date.now() }, ...readRecent()].slice(0, 3);
      writeRecent(next);
      setRecent(next);
      reset();
      onClose();
      onSearch(file);
    } catch {
      setBusy(false);
      setError('Could not read that photo. Try another one.');
    }
  };

  const pickRecent = async (r) => {
    const file = await dataUrlToFile(r.thumb);
    reset();
    onClose();
    onSearch(file);
  };

  const openCamera = () => cameraInput.current?.click();
  const openGallery = () => galleryInput.current?.click();
  const onDrop = e => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0]); };

  const fileInputs = (
    <>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={e => { takeFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={galleryInput} type="file" accept="image/*" hidden onChange={e => { takeFile(e.target.files?.[0]); e.target.value = ''; }} />
    </>
  );

  const errorLine = (
    <AnimatePresence>
      {error && (
        <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ margin: '12px 0 0', padding: '8px 12px', borderRadius: 10, background: '#FDEBEC', color: S.danger, fontSize: 12.5 }}>{error}</motion.p>
      )}
    </AnimatePresence>
  );

  const cropPanel = src && (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ marginBottom: 14, height: 32, padding: '0 12px', borderRadius: 999, background: 'rgba(255,255,255,.92)', color: S.ink, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
        <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B8E4F' }} />
        Drag the box or its corners around the bag
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring} style={{ maxWidth: '100%', textAlign: 'center' }}>
        <CropEditor src={src} rect={rect} setRect={setRect} imgRef={imgRef} />
      </motion.div>
      {errorLine}
    </div>
  );

  const cropActions = (
    <div style={{ display: 'flex', gap: 10, width: '100%' }}>
      <button type="button" onClick={() => { setStage('choose'); setError(''); }} className="ps-outline-light"
        style={{ height: 52, padding: '0 20px', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 999, background: 'transparent', color: '#fff', fontFamily: S.font, fontSize: 13.5, cursor: 'pointer' }}>Retake</button>
      <motion.button type="button" onClick={runSearch} disabled={busy} whileTap={{ scale: 0.97 }}
        style={{ flex: 1, height: 52, border: 'none', borderRadius: 999, background: '#fff', color: S.ink, fontFamily: S.font, fontSize: 14, fontWeight: 600, cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {busy ? 'Preparing…' : <>Find similar bags <Svg size={16} sw={2}><path d="M5 12h14M13 6l6 6-6 6" /></Svg></>}
      </motion.button>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, fontFamily: S.font, color: S.ink }}>
          <style>{`.ps-tile{transition:transform .25s cubic-bezier(.16,1,.3,1)}.ps-tile:active{transform:scale(.97)}.ps-drop{transition:background .2s}.ps-outline-light:hover{background:rgba(255,255,255,.08)}`}</style>
          {fileInputs}
          <motion.div key="scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(17,12,9,.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />

          {isMobile ? (
            <AnimatePresence mode="wait" initial={false}>
              {stage === 'choose' ? (
                <motion.div
                  key="sheet" role="dialog" aria-label="Search by photo"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={sheetSpring}
                  drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
                  onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) close(); }}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92dvh', overflowY: 'auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '10px 20px calc(28px + env(safe-area-inset-bottom))' }}
                >
                  <div style={{ width: 36, height: 4, borderRadius: 4, background: '#E6E0DC', margin: '0 auto' }} />
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Search by photo</h2>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: S.muted }}>Find bags that look like one you have seen.</p>
                    </div>
                    <button type="button" onClick={close} aria-label="Close" style={{ width: 36, height: 36, border: 'none', borderRadius: 12, background: S.pill, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.ink }}><CloseIcon /></button>
                  </div>
                  <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <ChoiceTile index={0} bg={S.yellow} icon={<CameraIcon />} onClick={openCamera}>Take a<br />photo</ChoiceTile>
                    <ChoiceTile index={1} bg={S.green} icon={<GalleryIcon />} onClick={openGallery}>Upload from<br />gallery</ChoiceTile>
                  </div>
                  {errorLine}
                  <div style={{ marginTop: 22 }}><Tips compact /></div>
                  {recent.length > 0 && <div style={{ marginTop: 22 }}><Recent items={recent} onPick={pickRecent} /></div>}
                </motion.div>
              ) : (
                <motion.div
                  key="crop" role="dialog" aria-label="Adjust photo"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, background: S.night, color: '#fff', display: 'flex', flexDirection: 'column', padding: '0 16px calc(24px + env(safe-area-inset-bottom))' }}
                >
                  <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setStage('choose')} aria-label="Back" style={{ width: 44, height: 44, border: 'none', borderRadius: 14, background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Svg size={18} sw={2}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>Adjust photo</span>
                    <button type="button" onClick={close} aria-label="Close" style={{ width: 44, height: 44, border: 'none', borderRadius: 14, background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon /></button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cropPanel}</div>
                  <div style={{ paddingTop: 16 }}>{cropActions}</div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
            <motion.div
              key="dialog" role="dialog" aria-label="Search by photo"
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={sheetSpring}
              style={{ position: 'relative', pointerEvents: 'auto', width: 'min(900px, 94vw)', maxHeight: '92vh', overflowY: 'auto', background: stage === 'crop' ? S.night : '#fff', borderRadius: 30, display: 'flex', transition: 'background .3s' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {stage === 'choose' ? (
                  <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }}>
                    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', minHeight: 500 }}>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Search by photo</h2>
                      <p style={{ margin: '6px 0 0', fontSize: 13.5, color: S.muted }}>Drop a photo of any bag and we show the closest matches from real sellers.</p>
                      <label
                        className="ps-drop"
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        style={{ position: 'relative', marginTop: 22, flex: 1, borderRadius: 22, background: dragging ? '#FFF1C9' : '#FFFBF0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 20, textAlign: 'center' }}
                      >
                        <input type="file" accept="image/*" hidden onChange={e => { takeFile(e.target.files?.[0]); e.target.value = ''; }} />
                        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          <motion.rect x="1.5" y="1.5" rx="21" fill="none" stroke={dragging ? S.accent : '#E0A92B'} strokeWidth="2" strokeDasharray="10 14"
                            animate={{ strokeDashoffset: [0, -48] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 'calc(100% - 3px)', height: 'calc(100% - 3px)' }} />
                        </svg>
                        <motion.div animate={dragging ? { scale: 1.12, y: -6 } : { y: [0, -8, 0] }} transition={dragging ? spring : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ width: 84, height: 84, borderRadius: 26, background: S.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.ink }}>
                          <Svg size={34} sw={1.7}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></Svg>
                        </motion.div>
                        <p style={{ margin: '18px 0 0', fontSize: 16, fontWeight: 600 }}>{dragging ? 'Drop it here' : 'Drag a photo here'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: S.muted }}>or <span style={{ color: S.accent, fontWeight: 500, textDecoration: 'underline' }}>browse your files</span></p>
                        <p style={{ margin: '14px 0 0', fontSize: 11.5, color: S.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
                          You can also paste a screenshot with <kbd className="ps-kbd">Ctrl</kbd>+<kbd className="ps-kbd">V</kbd>
                        </p>
                        <p style={{ margin: '10px 0 0', fontSize: 11, color: '#A69E98' }}>JPG, PNG or WEBP, up to 10 MB</p>
                      </label>
                      {errorLine}
                    </div>
                    <div style={{ position: 'relative', background: '#F7F4F1', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                      <button type="button" onClick={close} aria-label="Close" style={{ position: 'absolute', right: 18, top: 18, width: 38, height: 38, border: 'none', borderRadius: 12, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.ink }}><CloseIcon /></button>
                      <Tips />
                      <Recent items={recent} onPick={pickRecent} grid />
                      <p style={{ marginTop: 'auto', marginBottom: 0, fontSize: 11.5, lineHeight: 1.6, color: S.faint }}>Your photo is only used to find matches. It is not shown to sellers.</p>
                    </div>
                    <style>{`.ps-kbd{font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 6px;border:1px solid #E6E0DC;border-radius:5px;background:#fff}`}</style>
                  </motion.div>
                ) : (
                  <motion.div key="crop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ width: '100%', padding: 28, color: '#fff', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 18, fontWeight: 500 }}>Adjust photo</span>
                      <button type="button" onClick={close} aria-label="Close" style={{ width: 38, height: 38, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon /></button>
                    </div>
                    {cropPanel}
                    <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>{cropActions}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

const SCAN_STEPS = ['Reading the shape and handles', 'Matching colour and texture', 'Comparing with bags from sellers'];

export function PhotoScanOverlay({ open, image, onCancel }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const t1 = setTimeout(() => setStep(1), 1100);
    const t2 = setTimeout(() => setStep(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); setStep(0); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status" aria-live="polite" aria-label="Finding similar bags"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: S.night, color: '#fff', fontFamily: S.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
            style={{ position: 'relative', width: 'min(260px, 70vw)', aspectRatio: '5 / 6', borderRadius: 26, overflow: 'hidden', background: '#000' }}>
            {image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.45 }} />
            <motion.span aria-hidden="true"
              animate={{ top: ['0%', '97%'] }} transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: [0.45, 0, 0.55, 1] }}
              style={{ position: 'absolute', left: 0, right: 0, height: 3, background: S.yellow, boxShadow: '0 0 18px 6px rgba(243,180,30,.55)' }} />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
            style={{ margin: '30px 0 0', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em' }}>Finding similar bags</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ margin: '6px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,.65)' }}>This usually takes a few seconds</motion.p>

          <div style={{ marginTop: 26, width: 'min(320px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SCAN_STEPS.map((label, i) => {
              const done = i < step, active = i === step;
              return (
                <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.2 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5, color: done || active ? '#fff' : 'rgba(255,255,255,.5)' }}>
                  <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AnimatePresence mode="wait" initial={false}>
                      {done ? (
                        <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: '#3B8E4F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Svg size={12} sw={3}><polyline points="20 6 9 17 4 12" /></Svg>
                        </motion.span>
                      ) : active ? (
                        <motion.span key="spin" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.2)', borderTopColor: S.yellow }} />
                      ) : (
                        <motion.span key="todo" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.6)' }} />
                      )}
                    </AnimatePresence>
                  </span>
                  {label}
                </motion.div>
              );
            })}
          </div>

          <div style={{ marginTop: 30, width: 'min(320px, 100%)', height: 4, borderRadius: 4, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 0.92 }} transition={{ duration: 5, ease: [0.3, 0, 0.2, 1] }}
              style={{ height: '100%', background: S.yellow, borderRadius: 4, transformOrigin: 'left center' }} />
          </div>
          <button type="button" onClick={onCancel}
            style={{ marginTop: 26, height: 44, padding: '0 22px', border: 'none', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#fff', fontFamily: S.font, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
