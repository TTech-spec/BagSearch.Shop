// src/components/FeedbackSheet.jsx
// Minimal feedback sheet: 1–5 rating, optional topic tags, a note, and a
// drawn-check confirmation. Bottom sheet on phones (swipe down to close),
// centred card on desktop. Writes to the same `feedback` table as before.
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../services/api';

const F = {
  ink: '#111111',
  text: '#2F3437',
  muted: '#787774',
  line: '#EAEAEA',
  paper: '#FBFBFA',
  sans: "'Poppins', system-ui, sans-serif",
  serif: "'Instrument Serif', 'Newsreader', Georgia, serif",
  mono: "'Geist Mono', 'SF Mono', ui-monospace, monospace",
};

const SCALE = [
  { v: 1, label: 'Poor' },
  { v: 2, label: 'Meh' },
  { v: 3, label: 'Okay' },
  { v: 4, label: 'Good' },
  { v: 5, label: 'Great' },
];

// Muted pastels, one per topic
const TOPICS = [
  { id: 'finding', label: 'Finding bags', bg: '#E1F3FE', fg: '#1F6C9F' },
  { id: 'prices', label: 'Prices', bg: '#FBF3DB', fg: '#956400' },
  { id: 'sellers', label: 'Sellers', bg: '#EDF3EC', fg: '#346538' },
  { id: 'photo', label: 'Photo search', bg: '#F3EEFB', fg: '#6B4FA0' },
  { id: 'speed', label: 'Speed', bg: '#FDEBEC', fg: '#9F2F2D' },
];

const MAX_NOTE = 300;
const sheet = { type: 'spring', stiffness: 320, damping: 32 };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };

export default function FeedbackSheet({ onClose, user, isMobile }) {
  const [open, setOpen] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [topics, setTopics] = useState([]);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const noteRef = useRef(null);

  const close = () => setOpen(false);
  const canSend = (rating > 0 || note.trim().length > 0) && status !== 'sending';
  const shown = hover || rating;

  const toggleTopic = id => setTopics(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]));

  const send = async () => {
    if (!canSend) return;
    setStatus('sending');
    const topicText = topics.length ? `[${topics.map(id => TOPICS.find(t => t.id === id)?.label).join(', ')}] ` : '';
    try {
      const { error } = await supabase.from('feedback').insert([{
        rating,
        comment: (topicText + note.trim()).trim(),
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Anonymous',
        page: window.location.pathname,
        user_agent: navigator.userAgent,
      }]);
      if (error) throw error;
      setStatus('sent');
    } catch (err) {
      console.error('Feedback submit error:', err);
      setStatus('error');
    }
  };

  // Close a moment after the thank-you plays
  useEffect(() => {
    if (status !== 'sent') return undefined;
    const t = setTimeout(close, 2600);
    return () => clearTimeout(t);
  }, [status]);

  // Esc closes; Ctrl/Cmd+Enter sends
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') close();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const panelMotion = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.98 } };

  return (
    <AnimatePresence onExitComplete={onClose}>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', fontFamily: F.sans }}>
          <motion.div
            key="scrim"
            onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.32)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />

          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fb-title"
            {...panelMotion}
            transition={sheet}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) close(); }}
            style={{
              position: 'relative', width: isMobile ? '100%' : 'min(480px, 94vw)', maxHeight: '92dvh', overflowY: 'auto',
              background: F.paper, color: F.text,
              border: `1px solid ${F.line}`,
              borderRadius: isMobile ? '12px 12px 0 0' : 12,
              boxShadow: '0 30px 80px -30px rgba(17,17,17,0.25)',
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
            }}
          >
            {/* Soft warm light in the corner, so the paper isn't flat */}
            <div aria-hidden="true" style={{ position: 'absolute', top: -120, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,17,0.07), transparent 70%)', pointerEvents: 'none' }} />

            {isMobile && <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 4, background: '#DADAD7', margin: '10px auto 0' }} />}

            <AnimatePresence mode="wait" initial={false}>
              {status !== 'sent' ? (
                <motion.div key="form" variants={list} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  style={{ position: 'relative', padding: isMobile ? '18px 22px 22px' : '28px 32px 28px' }}>

                  <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: F.muted }}>Feedback</span>
                    <button type="button" onClick={close} aria-label="Close feedback" className="fb-ghost" style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', color: F.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </motion.div>

                  <motion.h2 id="fb-title" variants={item} style={{ margin: '10px 0 0', fontFamily: F.serif, fontWeight: 400, fontSize: isMobile ? 32 : 38, lineHeight: 1.08, letterSpacing: '-0.02em', color: F.ink }}>
                    How was BagSearch today?
                  </motion.h2>
                  <motion.p variants={item} style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: F.muted }}>
                    Two taps is enough. A note helps us fix things faster.
                  </motion.p>

                  {/* Rating: a 1–5 scale with one sliding marker */}
                  <motion.div variants={item} style={{ marginTop: 24 }}>
                    <div role="radiogroup" aria-label="Rate your visit" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', border: `1px solid ${F.line}`, borderRadius: 8, background: '#FFFFFF', overflow: 'hidden' }}
                      onMouseLeave={() => setHover(0)}>
                      {SCALE.map((s, i) => {
                        const on = rating === s.v;
                        return (
                          <button
                            key={s.v} type="button" role="radio" aria-checked={on} aria-label={`${s.v}, ${s.label}`}
                            onClick={() => setRating(s.v)} onMouseEnter={() => setHover(s.v)}
                            className="fb-scale"
                            style={{ position: 'relative', height: 58, border: 'none', borderLeft: i ? `1px solid ${F.line}` : 'none', background: 'transparent', cursor: 'pointer', fontFamily: F.sans, color: on ? '#fff' : F.text }}
                          >
                            {on && <motion.span layoutId="fb-rating" transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ position: 'absolute', inset: 0, background: F.ink }} />}
                            <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <span style={{ fontSize: 17, fontWeight: 500 }}>{s.v}</span>
                              <span style={{ fontSize: 10, letterSpacing: '0.04em', color: on ? 'rgba(255,255,255,0.7)' : F.muted }}>{s.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ height: 20, marginTop: 8, fontSize: 12, color: F.muted }}>
                      <AnimatePresence mode="wait">
                        <motion.span key={shown} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} style={{ display: 'inline-block' }}>
                          {shown ? ['', 'Sorry to hear that. What went wrong?', 'Thanks. What should we fix first?', 'Noted. What would make it better?', 'Glad it worked. Anything missing?', 'Lovely. What did you like most?'][shown] : 'Pick a number from 1 to 5.'}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Topics */}
                  <motion.div variants={item} style={{ marginTop: 18 }}>
                    <p style={{ margin: 0, fontFamily: F.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: F.muted }}>About</p>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {TOPICS.map(t => {
                        const on = topics.includes(t.id);
                        return (
                          <motion.button
                            key={t.id} type="button" aria-pressed={on} onClick={() => toggleTopic(t.id)}
                            whileTap={{ scale: 0.95 }}
                            style={{ height: 30, padding: '0 12px', borderRadius: 9999, border: `1px solid ${on ? t.fg : 'transparent'}`, background: t.bg, color: t.fg, fontFamily: F.sans, fontSize: 11.5, fontWeight: 500, letterSpacing: '0.02em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'border-color .2s' }}
                          >
                            <AnimatePresence initial={false}>
                              {on && (
                                <motion.svg key="tick" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                  initial={{ width: 0, opacity: 0 }} animate={{ width: 11, opacity: 1 }} exit={{ width: 0, opacity: 0 }} aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </motion.svg>
                              )}
                            </AnimatePresence>
                            {t.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Note */}
                  <motion.div variants={item} style={{ marginTop: 18 }}>
                    <label htmlFor="fb-note" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: F.muted }}>Note <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <textarea
                        id="fb-note" ref={noteRef}
                        value={note} maxLength={MAX_NOTE}
                        onChange={e => setNote(e.target.value)}
                        placeholder="What did you love? What got in the way?"
                        rows={3}
                        className="fb-note"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 26px', border: `1px solid ${F.line}`, borderRadius: 8, background: '#FFFFFF', fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, color: F.text, resize: 'none', outline: 'none', transition: 'border-color .2s' }}
                      />
                      <span style={{ position: 'absolute', right: 12, bottom: 10, fontFamily: F.mono, fontSize: 10.5, color: note.length > MAX_NOTE - 30 ? '#9F2F2D' : '#B4B3AF' }}>{note.length}/{MAX_NOTE}</span>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ margin: '12px 0 0', padding: '8px 12px', borderRadius: 6, background: '#FDEBEC', color: '#9F2F2D', fontSize: 12.5 }}>
                        That did not go through. Check your connection and try again.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <motion.div variants={item} style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${F.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {!isMobile
                      ? <span style={{ fontSize: 11.5, color: F.muted, display: 'flex', alignItems: 'center', gap: 4 }}><kbd className="fb-kbd">Ctrl</kbd>+<kbd className="fb-kbd">Enter</kbd> to send</span>
                      : <span />}
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      <button type="button" onClick={close} className="fb-ghost" style={{ height: 42, padding: '0 16px', borderRadius: 6, border: 'none', background: 'transparent', color: F.text, fontFamily: F.sans, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                      <button type="button" onClick={send} disabled={!canSend} className="fb-primary"
                        style={{ height: 42, minWidth: 132, padding: '0 18px', borderRadius: 6, border: 'none', background: F.ink, color: '#fff', fontFamily: F.sans, fontSize: 13, fontWeight: 500, cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.35, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity .2s, background .2s, transform .15s' }}>
                        {status === 'sending'
                          ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block' }} />Sending</>
                          : 'Send feedback'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="thanks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                  style={{ position: 'relative', padding: isMobile ? '36px 22px 40px' : '48px 32px', textAlign: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
                    <motion.circle cx="32" cy="32" r="29" fill="none" stroke={F.ink} strokeWidth="1.5"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
                    <motion.path d="M20 33 l8 8 l16 -18" fill="none" stroke={F.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }} />
                  </svg>
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ margin: '18px 0 0', fontFamily: F.serif, fontWeight: 400, fontSize: 34, letterSpacing: '-0.02em', color: F.ink }}>
                    Thank you.
                  </motion.h2>
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ margin: '8px auto 0', maxWidth: 300, fontSize: 13.5, lineHeight: 1.6, color: F.muted }}>
                    Every note is read by the team building BagSearch.
                  </motion.p>
                  <div aria-hidden="true" style={{ margin: '26px auto 0', width: 120, height: 2, background: F.line, borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.6, ease: 'linear' }} style={{ height: '100%', background: F.ink, transformOrigin: 'left center' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <style>{`
              .fb-ghost:hover{background:#F1F1EF}
              .fb-primary:not(:disabled):hover{background:#333333}
              .fb-primary:not(:disabled):active{transform:scale(0.98)}
              .fb-scale{transition:background .15s}
              .fb-scale:hover{background:#F7F6F3}
              .fb-scale[aria-checked="true"]:hover{background:transparent}
              .fb-note:focus{border-color:#111111}
              .fb-note::placeholder{color:#B4B3AF}
              .fb-kbd{font-family:${F.mono};font-size:10.5px;padding:2px 6px;border:1px solid ${F.line};border-radius:4px;background:#F7F6F3;color:${F.text}}
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
