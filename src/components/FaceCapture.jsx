import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

// Live selfie step for seller sign-up.
// Opens the front camera (no gallery uploads), checks on the device that one
// face is centred and close enough, then takes the photo automatically.
// The check only confirms "a face is clearly in frame" — it does not identify
// the person. The photo is reviewed by a BagSearch admin afterwards.
const V = { bg: '#FAF6F1', ink: '#1C1410', ink2: '#54443A', muted: '#75625A', line: '#E7DCD1', accent: '#B4410E', green: '#1D7044', greenSoft: '#E3F1E8', red: '#9B2C1A', redSoft: '#FBE4DE' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";
// Served by our own site (copied into the build by scripts/copy-face-wasm.mjs).
const WASM_URL = import.meta.env.DEV ? '/node_modules/@mediapipe/tasks-vision/wasm' : '/face/wasm';
const MODEL_URL = '/face/blaze_face_short_range.tflite';
const HOLD_MS = 1400;        // keep the face steady this long before the photo is taken
const CHECK_EVERY_MS = 160;

const HINTS = {
  loading: 'Getting the camera ready…',
  none: 'Put your face inside the oval',
  many: 'Only one person in the photo, please',
  far: 'Move a little closer',
  close: 'Move a little further back',
  offcentre: 'Centre your face in the oval',
  hold: 'Perfect. Hold still…',
  manual: 'Line up your face, then tap the button',
};

/** Decide what to tell the person from the detector's result. */
function judge(detections, vw, vh) {
  if (!detections.length) return 'none';
  if (detections.length > 1) return 'many';
  const b = detections[0].boundingBox;
  const size = b.width / vw;
  const cx = (b.originX + b.width / 2) / vw;
  const cy = (b.originY + b.height / 2) / vh;
  if (size < 0.3) return 'far';
  if (size > 0.8) return 'close';
  if (Math.abs(cx - 0.5) > 0.16 || Math.abs(cy - 0.46) > 0.18) return 'offcentre';
  return 'hold';
}

export default function FaceCapture({ open, onCancel, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const holdStart = useRef(0);
  const [camError, setCamError] = useState('');
  const [hint, setHint] = useState('loading');
  const [manual, setManual] = useState(false);   // automatic check unavailable → tap to take
  const [progress, setProgress] = useState(0);   // 0..1 while holding still
  const [shot, setShot] = useState(null);        // { blob, url, dataUrl }
  const [attempt, setAttempt] = useState(0);     // bump to restart the camera

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    // Crop to a 3:4 portrait from the centre, at most 720px wide.
    const vw = video.videoWidth, vh = video.videoHeight;
    let cw = vw, ch = Math.round(vw * 4 / 3);
    if (ch > vh) { ch = vh; cw = Math.round(vh * 3 / 4); }
    const scale = Math.min(1, 720 / cw);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cw * scale); canvas.height = Math.round(ch * scale);
    canvas.getContext('2d').drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setShot({ blob, url: URL.createObjectURL(blob), dataUrl: canvas.toDataURL('image/jpeg', 0.82) });
    }, 'image/jpeg', 0.85);
  }, []);

  // Camera + face detector lifecycle
  useEffect(() => {
    if (!open || shot) return undefined;
    let alive = true;
    let timer = null;
    holdStart.current = 0;

    (async () => {
      await Promise.resolve();
      if (!alive) return;
      setCamError(''); setHint('loading'); setProgress(0);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});
      } catch (e) {
        if (!alive) return;
        setCamError(e?.name === 'NotAllowedError' ? 'denied' : e?.name === 'NotFoundError' ? 'nocamera' : 'failed');
        return;
      }

      // Load the on-device face check. If it can't load (old phone, no
      // connection to the CDN), fall back to a manual shutter button.
      try {
        if (!detectorRef.current) {
          const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
          const files = await FilesetResolver.forVisionTasks(WASM_URL);
          detectorRef.current = await FaceDetector.createFromOptions(files, {
            baseOptions: { modelAssetPath: MODEL_URL },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.6,
          });
        }
      } catch (e) {
        console.warn('[FaceCapture] automatic face check unavailable:', e?.message);
        if (alive) { setManual(true); setHint('manual'); }
        return;
      }
      if (!alive) return;
      setManual(false); setHint('none');

      timer = setInterval(() => {
        const video = videoRef.current;
        if (!video?.videoWidth || video.readyState < 2) return;
        let verdict = 'none';
        try {
          const res = detectorRef.current.detectForVideo(video, performance.now());
          verdict = judge(res.detections || [], video.videoWidth, video.videoHeight);
        } catch { return; }
        setHint(verdict);
        if (verdict !== 'hold') { holdStart.current = 0; setProgress(0); return; }
        if (!holdStart.current) holdStart.current = performance.now();
        const p = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS);
        setProgress(p);
        if (p >= 1) { clearInterval(timer); takePhoto(); }
      }, CHECK_EVERY_MS);
    })();

    return () => { alive = false; clearInterval(timer); stopCamera(); };
  }, [open, shot, attempt, stopCamera, takePhoto]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const retake = () => { if (shot?.url) URL.revokeObjectURL(shot.url); setShot(null); };
  const confirm = () => { const s = shot; setShot(null); onCapture?.(s.blob, s.dataUrl); };
  const cancel = () => { retake(); onCancel?.(); };

  const good = hint === 'hold';
  const ringColor = shot || good ? V.green : '#fff';

  return (
    <AnimatePresence>
      {open && (
        <Motion.div key="face" role="dialog" aria-modal="true" aria-labelledby="face-title"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: V.bg, fontFamily: font, color: V.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 460, boxSizing: 'border-box', padding: 'max(16px, env(safe-area-inset-top)) 20px max(22px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: V.accent }}>Seller verification</span>
              <button type="button" onClick={cancel} aria-label="Close" style={{ width: 44, height: 44, borderRadius: 999, border: `1px solid ${V.line}`, background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', color: V.ink2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <h1 id="face-title" style={{ margin: '6px 0 6px', fontSize: 26, fontWeight: 800, letterSpacing: '-.03em' }}>{shot ? 'Happy with this photo?' : 'Take a quick selfie'}</h1>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: V.muted }}>
              {shot ? 'Make sure your whole face is clear and well lit.' : 'We check that every seller is a real person. Find good light and take off sunglasses or a face mask.'}
            </p>

            {camError ? (
              <div role="alert" style={{ padding: 18, borderRadius: 18, background: V.redSoft, color: V.red, fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>
                {camError === 'denied' && <>BagSearch isn't allowed to use your camera. Tap the lock icon next to the web address, set <b>Camera</b> to <b>Allow</b>, then try again.</>}
                {camError === 'nocamera' && <>We couldn't find a camera on this device. Please sign up on a phone or a computer with a camera.</>}
                {camError === 'failed' && <>We couldn't start the camera. Close other apps that are using it, then try again.</>}
                <button type="button" onClick={() => { setCamError(''); setAttempt(a => a + 1); }} style={{ display: 'block', marginTop: 14, minHeight: 46, padding: '0 20px', borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 14px ${font}`, cursor: 'pointer' }}>Try again</button>
              </div>
            ) : (
              <>
                {/* Camera view with oval guide */}
                <div style={{ position: 'relative', width: 'min(100%, calc(54dvh * 0.75))', aspectRatio: '3 / 4', margin: '0 auto', borderRadius: 28, overflow: 'hidden', background: '#EFE6DC', flex: 'none' }}>
                  <video ref={videoRef} playsInline muted aria-label="Camera preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: shot ? 'none' : 'block' }} />
                  {shot && <img src={shot.url} alt="Your selfie" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}

                  {!shot && (
                    <svg aria-hidden="true" viewBox="0 0 100 133.33" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                      <defs>
                        <mask id="face-oval-mask">
                          <rect width="100" height="133.33" fill="#fff" />
                          <ellipse cx="50" cy="61" rx="31" ry="41" fill="#000" />
                        </mask>
                      </defs>
                      <rect width="100" height="133.33" fill="rgba(250,246,241,.72)" mask="url(#face-oval-mask)" />
                      <ellipse cx="50" cy="61" rx="31" ry="41" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="0.9" />
                      <Motion.ellipse cx="50" cy="61" rx="31" ry="41" fill="none" stroke={ringColor} strokeWidth="1.6" strokeLinecap="round"
                        pathLength="1" strokeDasharray="1" animate={{ strokeDashoffset: 1 - progress }} transition={{ duration: 0.18, ease: 'linear' }} />
                    </svg>
                  )}
                </div>

                {/* Live hint */}
                {!shot && (
                  <div aria-live="polite" style={{ display: 'flex', justifyContent: 'center', marginTop: 14, minHeight: 40 }}>
                    <AnimatePresence mode="wait">
                      <Motion.span key={hint} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999, fontSize: 14, fontWeight: 800, background: good ? V.greenSoft : '#fff', color: good ? V.green : V.ink, border: `1px solid ${good ? 'transparent' : V.line}` }}>
                        {good && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="m5 12 5 5L20 7" /></svg>}
                        {HINTS[hint]}
                      </Motion.span>
                    </AnimatePresence>
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  {shot ? (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Motion.button type="button" whileTap={{ scale: 0.97 }} onClick={retake} style={{ flex: 1, minHeight: 54, borderRadius: 999, border: `1.5px solid ${V.line}`, background: '#fff', color: V.ink, font: `800 15px ${font}`, cursor: 'pointer' }}>Retake</Motion.button>
                      <Motion.button type="button" whileTap={{ scale: 0.97 }} onClick={confirm} style={{ flex: 1.4, minHeight: 54, borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 15px ${font}`, cursor: 'pointer', boxShadow: '0 10px 24px rgba(180,65,14,.28)' }}>Use this photo</Motion.button>
                    </div>
                  ) : manual ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Motion.button type="button" whileTap={{ scale: 0.92 }} onClick={takePhoto} aria-label="Take photo"
                        style={{ width: 72, height: 72, borderRadius: 999, border: `4px solid ${V.accent}`, background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <span style={{ width: 52, height: 52, borderRadius: 999, background: V.accent }} />
                      </Motion.button>
                    </div>
                  ) : null}
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '14px 0 0', fontSize: 12, color: V.muted, textAlign: 'center', lineHeight: 1.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none' }}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                    Stored privately. Only BagSearch staff see it, to verify you.
                  </p>
                </div>
              </>
            )}
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
