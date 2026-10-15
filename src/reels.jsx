import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';
import { useSEO } from './hooks/useSEO';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { sanitizeInput } from './utils/securityUtils';
import { uploadLimiter } from './utils/rateLimiter';
import { useUploadLimit, recordUpload } from './hooks/useUploadLimit';

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = { primary: '#c84b11', primaryLight: '#f97316', primaryBg: '#fde8d8', primaryPale: '#fdf4ee' };

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'products';

// ─── Video upload to Cloudinary ──────────────────────────────────────────────
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

function validateVideoFile(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Only MP4, WebM, and MOV videos are allowed');
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error('Video must be under 25 MB. Try trimming or compressing your video before uploading.');
  }
  return true;
}

async function uploadVideoToCloudinary(file, userId, onProgress) {
  validateVideoFile(file);
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Video upload service is not configured. Please contact support.');
  }
  const payload = new FormData();
  payload.append('file', file);
  payload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  payload.append('folder', `${CLOUDINARY_FOLDER}/reels/${userId}`);
  payload.append('resource_type', 'video');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.secure_url) {
          // Build a thumbnail URL from the video URL
          const thumbUrl = data.secure_url
            .replace('/video/upload/', '/video/upload/so_0,w_400,h_711,c_fill,f_jpg/')
            .replace(/\.\w+$/, '.jpg');
          resolve({ videoUrl: data.secure_url, thumbnailUrl: thumbUrl, duration: data.duration });
        } else {
          reject(new Error('Upload succeeded but no URL returned'));
        }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText)?.error?.message || 'Upload failed')); }
        catch { reject(new Error('Video upload failed')); }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.send(payload);
  });
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function IconHeart({ size = 26, color = 'white', filled = false }) {
  return filled
    ? <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21s-6.7-4.35-9.3-8.2C.9 9.9 1.7 6.4 4.8 5.1c2.2-.9 4.4 0 5.7 1.8l1.5 2 1.5-2c1.3-1.8 3.5-2.7 5.7-1.8 3.1 1.3 3.9 4.8 2.1 7.7C18.7 16.65 12 21 12 21z" /></svg>
    : <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6.7-4.35-9.3-8.2C.9 9.9 1.7 6.4 4.8 5.1c2.2-.9 4.4 0 5.7 1.8l1.5 2 1.5-2c1.3-1.8 3.5-2.7 5.7-1.8 3.1 1.3 3.9 4.8 2.1 7.7C18.7 16.65 12 21 12 21z" /></svg>;
}
function IconComment({ size = 26, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function IconBookmark({ size = 24, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
}
function IconShare({ size = 24, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconPlay({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.28)" />
      <polygon points="10,8 17,12 10,16" />
    </svg>
  );
}
function IconPause({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.28)" />
      <rect x="9" y="8" width="2.5" height="8" rx="0.5" />
      <rect x="13" y="8" width="2.5" height="8" rx="0.5" />
    </svg>
  );
}
function IconArrowLeft({ size = 18, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconPlus({ size = 22, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconX({ size = 14, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconChevron({ size = 20, color = 'white', dir = 'up' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'down' ? 'rotate(180deg)' : 'none' }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function IconVolume({ size = 20, color = 'white', muted = false }) {
  return muted
    ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
    : <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>;
}

// ─── Tab row ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'foryou', label: 'For You' },
  { id: 'following', label: 'Following' },
];

function TabRow({ tab, onSelect, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: size, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? 'white' : 'rgba(255,255,255,0.55)' }}>{t.label}</span>
          {tab === t.id && <span style={{ width: 18, height: 2, borderRadius: 2, background: 'white' }} />}
        </button>
      ))}
    </div>
  );
}

// ─── Relative time ───────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// ─── Upload Modal ────────────────────────────────────────────────────────────
function UploadReelModal({ open, onClose, user, onUploaded }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const fileRef = useRef(null);
  const { canUpload: canUploadVideo, plan: sellerPlan, used: videosUsed, limit: videoLimit } = useUploadLimit('video');

  // Load seller's products to optionally link
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setProducts(data || []);
    })();
  }, [open, user]);

  const reset = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setUploading(false);
    setProgress(0);
    setError(null);
    setSelectedProduct(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateVideoFile(file);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;
    if (!canUploadVideo) {
      setError(`You've reached your daily video limit (${videoLimit} video/day on ${sellerPlan === 'free' ? 'Free' : sellerPlan} plan). Upgrade at /pricing for unlimited uploads.`);
      return;
    }
    if (!uploadLimiter.isAllowed(user.id)) {
      setError('Too many uploads. Please wait a minute.');
      return;
    }
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const { videoUrl, thumbnailUrl } = await uploadVideoToCloudinary(videoFile, user.id, setProgress);

      const insertData = {
        user_id: user.id,
        seller_name: user.user_metadata?.full_name || 'Seller',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        caption: sanitizeInput(caption),
      };

      if (selectedProduct) {
        insertData.product_id = selectedProduct.id;
        insertData.product_name = selectedProduct.name;
        insertData.product_price = selectedProduct.price;
      }

      const { error: dbErr } = await supabase.from('reels').insert([insertData]);
      if (dbErr) throw dbErr;

      // Record upload for plan limit tracking
      await recordUpload(user.id, 'video');

      handleClose();
      onUploaded();
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <motion.div onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 101,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px', pointerEvents: 'none',
        }}>
        <div style={{
          width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto',
          background: '#1a1410', borderRadius: 24, border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)', color: 'white', fontFamily: "'Manrope',sans-serif",
          pointerEvents: 'auto',
        }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🎬 Upload Reel</h2>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 22px 24px' }}>
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Video picker */}
          {!videoFile ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 16, padding: '40px 20px',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                background: 'rgba(255,255,255,0.04)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primaryLight}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" style={{ display: 'none' }} onChange={handleFileChange} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>📹</div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Tap to select a video</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>MP4, WebM, or MOV · up to 25 MB</p>
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: '#000' }}>
              <video src={videoPreview} controls playsInline
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }} />
              <button onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={12} />
              </button>
              <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700 }}>
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          )}

          {/* Caption */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Caption</label>
            <textarea
              value={caption} onChange={e => setCaption(e.target.value)} maxLength={500}
              placeholder="Describe your bag, share styling tips, or highlight features…"
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, fontWeight: 500,
                fontFamily: "'Manrope',sans-serif", outline: 'none', resize: 'vertical',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{caption.length}/500</div>
          </div>

          {/* Link to product */}
          {products.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Link a Product <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {products.slice(0, 10).map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  const img = Array.isArray(p.images) ? p.images[0] : null;
                  return (
                    <button key={p.id} onClick={() => setSelectedProduct(isSelected ? null : p)}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        borderRadius: 12, border: `1.5px solid ${isSelected ? C.primaryLight : 'rgba(255,255,255,0.12)'}`,
                        background: isSelected ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                        color: 'white', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                      }}>
                      {img && <img src={img} alt="" loading="lazy" width="32" height="32" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        {p.price && <div style={{ fontSize: 11, color: C.primaryLight, fontWeight: 700 }}>₦{Number(p.price).toLocaleString()}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 999 }}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.primaryLight, marginTop: 8 }}>
                Uploading… {progress}%
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={!videoFile || uploading}
            style={{
              width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 14, border: 'none',
              background: !videoFile || uploading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              color: 'white', fontSize: 15, fontWeight: 800, cursor: !videoFile || uploading ? 'default' : 'pointer',
              fontFamily: "'Manrope',sans-serif",
              boxShadow: videoFile && !uploading ? '0 8px 24px rgba(200,75,17,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>
            {uploading ? '⏳ Uploading…' : '🚀 Post Reel'}
          </button>
        </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Comments panel ──────────────────────────────────────────────────────────
function CommentsPanel({ open, onClose, variant, reel, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open || !reel?.id) return;
    setLoading(true);
    supabase
      .from('reel_comments')
      .select('*')
      .eq('reel_id', reel.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setComments(data || []); setLoading(false); });
  }, [open, reel?.id]);

  const post = async () => {
    if (!draft.trim() || !user || !reel?.id || posting) return;
    setPosting(true);
    const text = sanitizeInput(draft.trim());
    const { data, error } = await supabase.from('reel_comments').insert([{
      reel_id: reel.id,
      user_id: user.id,
      author_name: user.user_metadata?.full_name || 'User',
      text,
    }]).select();
    if (!error && data?.[0]) {
      setComments(prev => [data[0], ...prev]);
      // Increment comment count
      supabase.rpc('increment_reel_comments', { reel_uuid: reel.id }).catch(() => {});
      // Send notification to reel owner
      if (reel.user_id && reel.user_id !== user.id) {
        const commenterName = user.user_metadata?.full_name || 'Someone';
        supabase.from('notifications').insert([{
          seller_id: reel.user_id,
          type: 'reel_comment',
          title: `${commenterName} commented on your reel`,
          message: text.length > 80 ? text.slice(0, 80) + '…' : text,
          is_read: false,
        }]).catch(() => {});
      }
    }
    setDraft('');
    setPosting(false);
  };

  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>{reel?.comments_count || comments.length} Comments</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconX size={13} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 20 }}>Loading…</div>}
        {!loading && comments.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 40 }}>
            No comments yet. Be the first! 💬
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
              {(c.author_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800 }}>{c.author_name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{timeAgo(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, wordBreak: 'break-word' }}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
            {(user.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') post(); }} placeholder="Add a comment…"
            style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '9px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: "'Manrope',sans-serif" }} />
          <button onClick={post} disabled={!draft.trim() || posting} style={{ background: 'none', border: 'none', cursor: draft.trim() ? 'pointer' : 'default', color: draft.trim() ? C.primaryLight : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>Post</button>
        </div>
      ) : (
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Log in to comment
        </div>
      )}
    </>
  );

  if (variant === 'side') {
    return (
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 340 }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25 }}
            style={{ background: '#161211', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 711, flexShrink: 0 }}>
            <div style={{ width: 340, height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 14, color: 'white', fontFamily: "'Manrope',sans-serif" }}>
              {body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70 }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 71, height: '68vh', background: '#161211', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white', fontFamily: "'Manrope',sans-serif" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '10px auto 4px', flexShrink: 0 }} />
            {body}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Seller upload banner — shown once per session ───────────────────────────
function SellerUploadBanner({ onUpload, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        width: 'min(380px, 90vw)', padding: '14px 18px', borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(200,75,17,0.95), rgba(249,115,22,0.95))',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 40px rgba(200,75,17,0.5), 0 0 0 1px rgba(255,255,255,0.15) inset',
        color: 'white', fontFamily: "'Manrope',sans-serif",
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ fontSize: 28, flexShrink: 0 }}>📹</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Show off your bags!</div>
        <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9, lineHeight: 1.4 }}>Upload a short video to attract more buyers</div>
      </div>
      <button onClick={onUpload}
        style={{ padding: '8px 16px', borderRadius: 12, border: '2px solid white', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'Manrope',sans-serif" }}>
        Upload
      </button>
      <button onClick={onDismiss}
        style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconX size={10} />
      </button>
    </motion.div>
  );
}

// ─── Floating Upload FAB for mobile sellers ──────────────────────────────────
function SellerFAB({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
      style={{
        position: 'fixed', bottom: 100, right: 16, zIndex: 35,
        width: 58, height: 58, borderRadius: '50%', border: 'none',
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
        color: 'white', cursor: 'pointer',
        boxShadow: '0 8px 28px rgba(200,75,17,0.5), 0 0 0 4px rgba(249,115,22,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Manrope',sans-serif",
      }}
    >
      {/* Pulsing ring */}
      <span style={{
        position: 'absolute', inset: -6, borderRadius: '50%',
        border: '2px solid rgba(249,115,22,0.4)',
        animation: 'fabPulse 2s ease-in-out infinite',
      }} />
      <IconPlus size={24} />
      {/* Label */}
      <span style={{
        position: 'absolute', right: 66, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.75)', padding: '6px 12px', borderRadius: 10,
        fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'fabLabelFade 4s ease-in-out',
        animationFillMode: 'forwards',
      }}>
        Upload Reel 📹
      </span>
    </motion.button>
  );
}

// ─── CSS keyframes for FAB ───────────────────────────────────────────────────
function ReelsStyles() {
  return (
    <style>{`
      @keyframes fabPulse {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.4); opacity: 0; }
      }
      @keyframes fabLabelFade {
        0% { opacity: 0; transform: translateY(-50%) translateX(10px); }
        10% { opacity: 1; transform: translateY(-50%) translateX(0); }
        70% { opacity: 1; transform: translateY(-50%) translateX(0); }
        100% { opacity: 0; transform: translateY(-50%) translateX(10px); pointer-events: none; }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 4px 16px rgba(200,75,17,0.4); }
        50% { box-shadow: 0 4px 24px rgba(249,115,22,0.7), 0 0 0 3px rgba(249,115,22,0.15); }
      }
    `}</style>
  );
}

// ─── Empty state when no reels exist yet ─────────────────────────────────────
function EmptyState({ isSeller, onUpload }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'white' }}>No Reels Yet</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 320, marginBottom: 24, lineHeight: 1.6 }}>
        {isSeller
          ? 'Be the first seller to post a reel! Show off your bags with a short video.'
          : 'Check back soon — sellers will be posting bag videos here.'}
      </p>
      {isSeller && (
        <button onClick={onUpload}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(200,75,17,0.4)',
            fontFamily: "'Manrope',sans-serif",
          }}>
          <IconPlus size={18} /> Upload Your First Reel
        </button>
      )}
    </div>
  );
}

// ─── Video Reel Card (mobile — full-screen snap) ─────────────────────────────
function VideoReelCard({ reel, isActive, user, onOpenComments, onToggleLike, isLiked }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showPlayBtn, setShowPlayBtn] = useState(true);

  // Auto-play/pause when card becomes active
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().then(() => { setPlaying(true); setShowPlayBtn(false); }).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => { setPlaying(true); setShowPlayBtn(false); setTimeout(() => setShowPlayBtn(true), 200); }).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
      setShowPlayBtn(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  // Double-tap to like
  const lastTap = useRef(0);
  const [showHeart, setShowHeart] = useState(false);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap — like
      if (!isLiked) onToggleLike(reel.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      // Single tap — toggle play
      setTimeout(() => {
        if (lastTap.current === now) togglePlay();
      }, 300);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', scrollSnapAlign: 'start', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        loop playsInline muted={muted}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        onClick={handleTap}
      />

      {/* Mute button */}
      <button onClick={toggleMute}
        style={{ position: 'absolute', top: 72, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <IconVolume size={16} muted={muted} />
      </button>

      {/* Play/pause indicator */}
      <AnimatePresence>
        {showPlayBtn && !playing && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none' }}>
            <IconPlay size={64} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.2 }} exit={{ opacity: 0, scale: 1.5 }}
            style={{ position: 'absolute', zIndex: 6, pointerEvents: 'none' }}>
            <IconHeart size={80} color="#f97316" filled />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info overlay */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '90px 70px 100px 16px', background: 'linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 100%)', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, pointerEvents: 'auto' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
            {(reel.seller_name || 'S').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>{reel.seller_name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>· {timeAgo(reel.created_at)}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{reel.caption}</p>
        {reel.product_name && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', pointerEvents: 'auto', cursor: 'pointer' }}>
            <span style={{ fontSize: 12 }}>👜</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{reel.product_name}</span>
            {reel.product_price && <span style={{ fontSize: 11, fontWeight: 800, color: C.primaryLight }}>₦{Number(reel.product_price).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {/* Right action rail */}
      <div style={{ position: 'absolute', right: 12, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 5 }}>
        <button onClick={() => onToggleLike(reel.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: 'white' }}>
          <IconHeart color={isLiked ? '#f97316' : 'white'} filled={isLiked} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.likes_count + (isLiked ? 1 : 0)}</span>
        </button>
        <button onClick={() => onOpenComments(reel)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: 'white' }}>
          <IconComment />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.comments_count || 0}</span>
        </button>
        <button onClick={() => { navigator.share?.({ title: reel.caption || 'BagSearch Reel', url: window.location.href }).catch(() => {}); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: 'white' }}>
          <IconShare />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.shares_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Reels component ────────────────────────────────────────────────────
export default function Reels() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isMobile = useIsMobileViewport(768);
  const [tab, setTab] = useState('foryou');
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());

  const isSeller = user?.user_metadata?.role === 'seller';

  useSEO({
    title: 'Reels — Bag Videos | BagSearch',
    description: 'Watch short bag videos from verified sellers across Nigeria: unboxings, styling tips and close-up showcases of designer handbags, totes and clutches.',
    url: '/reels',
  });

  // Fetch reels
  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setReels(data || []);

      // Fetch which reels the current user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('reel_likes')
          .select('reel_id')
          .eq('user_id', user.id);
        if (likes) {
          setLikedReels(new Set(likes.map(l => l.reel_id)));
        }
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  // Toggle like
  const toggleLike = async (reelId) => {
    if (!user) { navigate('/login'); return; }
    const isLiked = likedReels.has(reelId);
    // Optimistic update
    setLikedReels(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(reelId); else next.add(reelId);
      return next;
    });
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, likes_count: r.likes_count + (isLiked ? -1 : 1) } : r));

    if (isLiked) {
      await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', user.id);
      supabase.rpc('decrement_reel_likes', { reel_uuid: reelId }).catch(() => {});
    } else {
      await supabase.from('reel_likes').insert([{ reel_id: reelId, user_id: user.id }]);
      supabase.rpc('increment_reel_likes', { reel_uuid: reelId }).catch(() => {});
      // Send notification to reel owner
      const reel = reels.find(r => r.id === reelId);
      if (reel && reel.user_id !== user.id) {
        const likerName = user.user_metadata?.full_name || 'Someone';
        supabase.from('notifications').insert([{
          seller_id: reel.user_id,
          type: 'reel_like',
          title: `${likerName} liked your reel`,
          message: reel.caption ? `"${reel.caption.slice(0, 60)}${reel.caption.length > 60 ? '…' : ''}"` : 'Your reel got a new like!',
          is_read: false,
        }]).catch(() => {});
      }
    }
  };

  return isMobile
    ? <MobileReels tab={tab} setTab={setTab} reels={reels} loading={loading} navigate={navigate}
        user={user} isSeller={isSeller} uploadOpen={uploadOpen} setUploadOpen={setUploadOpen}
        likedReels={likedReels} toggleLike={toggleLike} fetchReels={fetchReels} />
    : <DesktopReels tab={tab} setTab={setTab} reels={reels} loading={loading} navigate={navigate}
        user={user} isSeller={isSeller} uploadOpen={uploadOpen} setUploadOpen={setUploadOpen}
        likedReels={likedReels} toggleLike={toggleLike} fetchReels={fetchReels} />;
}

// ─── Mobile: full-bleed vertical snap-scroll ─────────────────────────────────
function MobileReels({ tab, setTab, reels, loading, navigate, user, isSeller, uploadOpen, setUploadOpen, likedReels, toggleLike, fetchReels }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentReel, setCommentReel] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const [showBanner, setShowBanner] = useState(() => {
    if (!isSeller) return false;
    try { return !localStorage.getItem('reels_banner_seen'); } catch { return false; }
  });

  // IntersectionObserver to detect which reel is in view
  const observerRef = useRef(null);
  const reelRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.index);
          if (!isNaN(idx)) setActiveIndex(idx);
        }
      });
    }, { threshold: 0.6 });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const obs = observerRef.current;
    if (!obs) return;
    obs.disconnect();
    reelRefs.current.forEach(el => { if (el) obs.observe(el); });
  }, [reels]);

  const openComments = (reel) => { setCommentReel(reel); setCommentsOpen(true); };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Loading Reels…</div>
        </div>
      </div>
    );
  }

  const dismissBanner = () => { setShowBanner(false); try { localStorage.setItem('reels_banner_seen', '1'); } catch {} };
  const handleUpload = () => { dismissBanner(); setUploadOpen(true); };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white', fontFamily: "'Manrope',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <ReelsStyles />
      {/* Page heading for search engines and screen readers; the video feed carries the design. */}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Bag Videos from Nigerian Sellers</h1>

      {/* Top header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 100%)' }}>
        <button onClick={() => navigate('/products')} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconArrowLeft size={16} />
        </button>
        <TabRow tab={tab} onSelect={setTab} />
        <div style={{ width: 34 }} />
      </div>

      {/* Seller banner — shows once per session */}
      <AnimatePresence>
        {showBanner && <SellerUploadBanner onUpload={handleUpload} onDismiss={dismissBanner} />}
      </AnimatePresence>

      {reels.length === 0 ? (
        <EmptyState isSeller={isSeller} onUpload={handleUpload} />
      ) : (
        <div ref={scrollRef} style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y mandatory' }}>
          {reels.map((reel, i) => (
            <div key={reel.id} ref={el => reelRefs.current[i] = el} data-index={i}>
              <VideoReelCard
                reel={reel}
                isActive={i === activeIndex}
                user={user}
                onOpenComments={openComments}
                onToggleLike={toggleLike}
                isLiked={likedReels.has(reel.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* TikTok-style bottom nav with center plus button */}
      {isSeller && !uploadOpen && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 35,
          height: 64, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          <button onClick={handleUpload} style={{
            width: 48, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(200,75,17,0.45)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Side accent bars like TikTok */}
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '8px 0 0 8px', background: '#25F4EE' }} />
            <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 8px 8px 0', background: '#FE2C55' }} />
            <IconPlus size={20} />
          </button>
        </div>
      )}

      <CommentsPanel variant="sheet" open={commentsOpen} onClose={() => setCommentsOpen(false)} reel={commentReel} user={user} />
      <AnimatePresence>
        {uploadOpen && <UploadReelModal open={uploadOpen} onClose={() => setUploadOpen(false)} user={user} onUploaded={fetchReels} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Desktop: theater-style centered panel ───────────────────────────────────
function DesktopReels({ tab, setTab, reels, loading, navigate, user, isSeller, uploadOpen, setUploadOpen, likedReels, toggleLike, fetchReels }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showBanner, setShowBanner] = useState(() => {
    if (!isSeller) return false;
    try { return !localStorage.getItem('reels_banner_seen'); } catch { return false; }
  });

  const reel = reels[activeIndex] || null;
  const isLiked = reel ? likedReels.has(reel.id) : false;

  const goTo = (i) => {
    const idx = ((i % reels.length) + reels.length) % reels.length;
    setActiveIndex(idx);
    setPlaying(false);
  };

  // Auto-play when reel changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !reel) return;
    v.currentTime = 0;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, [activeIndex, reel?.id]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#241a15 0%,#0a0806 60%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Loading Reels…</div>
        </div>
      </div>
    );
  }

  const dismissBanner = () => { setShowBanner(false); try { localStorage.setItem('reels_banner_seen', '1'); } catch {} };
  const handleUpload = () => { dismissBanner(); setUploadOpen(true); };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#241a15 0%,#0a0806 60%)', color: 'white', fontFamily: "'Manrope',sans-serif" }}>
      <ReelsStyles />
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <IconArrowLeft size={14} /> Back to BagSearch
        </button>
        <TabRow tab={tab} onSelect={setTab} size={15} />
        {isSeller ? (
          <button onClick={handleUpload} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 800, animation: 'glowPulse 2s ease-in-out infinite', fontFamily: "'Manrope',sans-serif" }}>
            📹 Upload Reel
          </button>
        ) : (
          <div style={{ width: 100 }} />
        )}
      </header>

      {/* Seller banner — shows once per session on desktop too */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ maxWidth: 700, margin: '20px auto 0', padding: '16px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(200,75,17,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <span style={{ fontSize: 36 }}>📹</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>You're a seller — show off your bags!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Upload a short video reel to attract more buyers. Show unboxings, styling tips, or bag details.</div>
            </div>
            <button onClick={handleUpload}
              style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Manrope',sans-serif", boxShadow: '0 4px 16px rgba(200,75,17,0.4)' }}>
              Upload Now
            </button>
            <button onClick={dismissBanner}
              style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconX size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 60px' }}>
        {reels.length === 0 ? (
          <EmptyState isSeller={isSeller} onUpload={() => setUploadOpen(true)} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Prev/next + progress dots */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <button onClick={() => goTo(activeIndex - 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconChevron dir="up" />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reels.slice(0, 10).map((r, i) => (
                  <span key={r.id} onClick={() => goTo(i)} style={{ width: 6, height: i === activeIndex ? 20 : 6, borderRadius: 4, background: i === activeIndex ? C.primaryLight : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.25s ease' }} />
                ))}
              </div>
              <button onClick={() => goTo(activeIndex + 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconChevron dir="down" />
              </button>
            </div>

            {/* Phone-proportioned reel panel */}
            {reel && (
              <AnimatePresence mode="wait">
                <motion.div key={reel.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
                  style={{ width: 400, height: 711, borderRadius: 28, overflow: 'hidden', position: 'relative', background: '#000', boxShadow: '0 40px 100px rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                  <video
                    ref={videoRef}
                    key={reel.video_url}
                    src={reel.video_url}
                    poster={reel.thumbnail_url || undefined}
                    loop playsInline muted={muted}
                    onClick={togglePlay}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  />

                  {/* Mute button */}
                  <button onClick={toggleMute}
                    style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                    <IconVolume size={15} muted={muted} />
                  </button>

                  {/* Play indicator */}
                  {!playing && (
                    <div onClick={togglePlay} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                      <IconPlay size={64} />
                    </div>
                  )}

                  {/* Bottom overlay */}
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '90px 24px 26px 20px', background: 'linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
                        {(reel.seller_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{reel.seller_name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>· {timeAgo(reel.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{reel.caption}</p>
                    {reel.product_name && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                        <span style={{ fontSize: 12 }}>👜</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{reel.product_name}</span>
                        {reel.product_price && <span style={{ fontSize: 11, fontWeight: 800, color: C.primaryLight }}>₦{Number(reel.product_price).toLocaleString()}</span>}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Action rail */}
            {reel && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
                <button onClick={() => toggleLike(reel.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 48, height: 48, borderRadius: '50%', background: isLiked ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconHeart size={22} color={isLiked ? '#f97316' : 'white'} filled={isLiked} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.likes_count + (isLiked ? 1 : 0)}</span>
                </button>
                <button onClick={() => setCommentsOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 48, height: 48, borderRadius: '50%', background: commentsOpen ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComment size={22} color={commentsOpen ? '#f97316' : 'white'} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.comments_count || 0}</span>
                </button>
                <button onClick={() => { navigator.share?.({ title: reel.caption || 'BagSearch Reel', url: window.location.href }).catch(() => {}); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconShare size={20} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.shares_count || 0}</span>
                </button>
              </div>
            )}

            <CommentsPanel variant="side" open={commentsOpen} onClose={() => setCommentsOpen(false)} reel={reel} user={user} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {uploadOpen && <UploadReelModal open={uploadOpen} onClose={() => setUploadOpen(false)} user={user} onUploaded={fetchReels} />}
      </AnimatePresence>
    </div>
  );
}
