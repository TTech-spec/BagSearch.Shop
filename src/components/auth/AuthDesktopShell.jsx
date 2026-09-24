// src/components/auth/AuthDesktopShell.jsx
// Desktop (>= 1024px) split layout shared by the login and register pages:
// a tinted photo panel with serif brand copy on the left, and a white
// rounded panel holding the form on the right.
import React from 'react';
import { motion } from 'framer-motion';

const A = {
  ink:     '#2B211C',
  muted:   '#8C7B72',
  faint:   '#B9ABA3',
  line:    '#E7DED8',
  field:   '#FFFFFF',
  accent:  '#C94B2C',
  accentD: '#B33A1E',
  danger:  '#C2362B',
  serif:   "'Cormorant Garamond', 'Times New Roman', serif",
  sans:    "'Outfit', system-ui, sans-serif",
};

const spring = { type: 'spring', stiffness: 100, damping: 20 };

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: spring },
};

export const RevealItem = ({ children, style, className }) => (
  <motion.div variants={item} style={style} className={className}>{children}</motion.div>
);

// Input with a visually hidden label (placeholder-style fields, as in the design)
export const AuthField = ({ id, label, error, hint, trailing, ...inputProps }) => (
  <div className="ads-field">
    <label htmlFor={id} className="ads-sr">{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        className={`ads-input${error ? ' has-error' : ''}`}
        placeholder={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        style={trailing ? { paddingRight: 40 } : undefined}
        {...inputProps}
      />
      {trailing}
    </div>
    {error
      ? <span id={`${id}-err`} className="ads-error">{error}</span>
      : hint && <span id={`${id}-hint`} className="ads-hint">{hint}</span>}
  </div>
);

export const AuthCheck = ({ id, checked, onChange, children, error }) => (
  <div>
    <label htmlFor={id} className="ads-check">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="ads-check-input" />
      <span className="ads-check-box" aria-hidden="true">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
    {error && <span className="ads-error" style={{ paddingLeft: 26 }}>{error}</span>}
  </div>
);

export const PasswordToggle = ({ shown, onToggle }) => (
  <button type="button" className="ads-eye" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'}>
    {shown ? (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export const GoogleMark = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/**
 * @param image          imported photo
 * @param imagePosition  CSS object-position for the photo
 * @param tone           panel color the photo washes into (behind the headline)
 * @param headline       large serif headline on the photo panel
 * @param blurb          short paragraph under the headline
 * @param footer         small text pinned to the bottom of the photo panel
 */
const AuthDesktopShell = ({ image, imagePosition = 'center', tone, headline, blurb, footer, children }) => (
  <div className="ads-root" style={{ '--ads-tone': tone }}>
    <style>{`
      .ads-root {
        position:relative;flex:1;display:grid;
        grid-template-columns:minmax(0,44fr) minmax(0,56fr);
        min-height:100dvh;background:var(--ads-tone);
        font-family:${A.sans};color:${A.ink};overflow:hidden;
      }
      .ads-photo { position:relative;overflow:hidden;margin-right:-48px; }
      .ads-photo img {
        position:absolute;inset:0;width:100%;height:100%;
        object-fit:cover;display:block;
      }
      .ads-photo::after {
        content:'';position:absolute;inset:0;pointer-events:none;
        background:
          linear-gradient(90deg, var(--ads-tone) 0%, color-mix(in srgb, var(--ads-tone) 82%, transparent) 26%, transparent 62%),
          linear-gradient(0deg, color-mix(in srgb, var(--ads-tone) 55%, transparent) 0%, transparent 28%);
      }
      .ads-copy {
        position:relative;z-index:1;height:100%;
        display:flex;flex-direction:column;
        padding:40px 48px 36px 56px;color:#fff;
      }
      .ads-brand { font-family:${A.serif};font-size:24px;font-weight:500;letter-spacing:0.01em; }
      .ads-headline {
        font-family:${A.serif};font-weight:400;
        font-size:clamp(44px,4.6vw,68px);line-height:0.98;letter-spacing:-0.01em;
        margin:clamp(72px,16vh,160px) 0 20px;max-width:9ch;
      }
      .ads-blurb { font-size:13px;line-height:1.6;color:rgba(255,255,255,0.82);max-width:30ch;margin:0; }
      .ads-footer { margin-top:auto;font-size:12px;letter-spacing:0.04em;color:rgba(255,255,255,0.72); }

      .ads-panel {
        position:relative;z-index:2;background:#fff;
        border-radius:44px 0 0 44px;
        box-shadow:-24px 0 60px -28px color-mix(in srgb, var(--ads-tone) 70%, #000);
        display:flex;align-items:center;
        padding:56px clamp(48px,8vw,128px);
      }
      .ads-panel-inner { width:100%;max-width:470px; }

      .ads-title { font-family:${A.serif};font-size:34px;font-weight:500;line-height:1.1;margin:0 0 6px;color:${A.ink}; }
      .ads-sub { font-size:12.5px;color:${A.muted};margin:0; }
      .ads-switch { font-size:12.5px;color:${A.ink};margin:34px 0 22px; }
      .ads-link {
        all:unset;cursor:pointer;color:${A.accent};font-weight:500;
        border-bottom:1px solid transparent;transition:border-color 0.2s;
      }
      .ads-link:hover { border-bottom-color:currentColor; }
      .ads-link:focus-visible { outline:2px solid ${A.accent};outline-offset:2px; }

      .ads-grid { display:grid;grid-template-columns:1fr 1fr;gap:18px 18px; }
      .ads-grid .span-2 { grid-column:1 / -1; }
      .ads-field { display:flex;flex-direction:column;gap:5px;min-width:0; }
      .ads-input {
        width:100%;height:44px;padding:0 14px;
        border:1px solid ${A.line};border-radius:6px;background:${A.field};
        font-family:inherit;font-size:13.5px;color:${A.ink};outline:none;
        transition:border-color 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s cubic-bezier(0.16,1,0.3,1);
      }
      .ads-input::placeholder { color:${A.faint}; }
      .ads-input:hover { border-color:#D9CCC4; }
      .ads-input:focus { border-color:${A.accent};box-shadow:0 0 0 3px rgba(201,75,44,0.12); }
      .ads-input.has-error { border-color:${A.danger}; }
      .ads-input[type=date] { color:${A.ink}; }
      .ads-input[type=date]:invalid { color:${A.faint}; }
      .ads-error { font-size:11.5px;color:${A.danger}; }
      .ads-hint { font-size:11.5px;color:${A.muted}; }
      .ads-sr { position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap; }
      .ads-eye {
        all:unset;cursor:pointer;position:absolute;right:12px;top:50%;transform:translateY(-50%);
        color:${A.faint};display:flex;padding:2px;transition:color 0.2s;
      }
      .ads-eye:hover { color:${A.muted}; }
      .ads-eye:focus-visible { outline:2px solid ${A.accent};outline-offset:2px;border-radius:4px; }

      .ads-check { display:flex;align-items:flex-start;gap:10px;font-size:12px;color:${A.muted};line-height:1.5;cursor:pointer;user-select:none; }
      .ads-check-input { position:absolute;opacity:0;width:1px;height:1px; }
      .ads-check-box {
        width:16px;height:16px;flex-shrink:0;margin-top:1px;
        border:1px solid #D4C6BE;border-radius:3px;background:#fff;
        display:flex;align-items:center;justify-content:center;
        transition:background 0.2s,border-color 0.2s;
      }
      .ads-check-box svg { opacity:0;transform:scale(0.6);transition:opacity 0.2s,transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      .ads-check-input:checked + .ads-check-box { background:${A.accent};border-color:${A.accent}; }
      .ads-check-input:checked + .ads-check-box svg { opacity:1;transform:scale(1); }
      .ads-check-input:focus-visible + .ads-check-box { outline:2px solid ${A.accent};outline-offset:2px; }
      .ads-check a { color:${A.accent};text-decoration:none; }
      .ads-check a:hover { text-decoration:underline; }

      .ads-actions { display:flex;align-items:center;gap:18px;margin-top:30px; }
      .ads-btn {
        min-width:168px;height:44px;padding:0 28px;border:none;border-radius:6px;
        background:${A.accent};color:#fff;font-family:inherit;font-size:14px;font-weight:500;letter-spacing:0.01em;
        cursor:pointer;transition:background 0.25s,transform 0.2s cubic-bezier(0.16,1,0.3,1);
      }
      .ads-btn:hover:not(:disabled) { background:${A.accentD}; }
      .ads-btn:active:not(:disabled) { transform:scale(0.98); }
      .ads-btn:disabled { opacity:0.6;cursor:not-allowed; }
      .ads-btn:focus-visible { outline:2px solid ${A.accent};outline-offset:3px; }
      .ads-ghost {
        display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;
        border:1px solid ${A.line};border-radius:6px;background:#fff;
        font-family:inherit;font-size:13px;color:${A.ink};cursor:pointer;
        transition:border-color 0.2s,background 0.2s,transform 0.2s cubic-bezier(0.16,1,0.3,1);
      }
      .ads-ghost:hover:not(:disabled) { border-color:#D9CCC4;background:#FBF8F6; }
      .ads-ghost:active:not(:disabled) { transform:scale(0.98); }
      .ads-ghost:disabled { opacity:0.6;cursor:not-allowed; }
      .ads-ghost:focus-visible { outline:2px solid ${A.accent};outline-offset:3px; }

      .ads-alert {
        display:flex;gap:10px;align-items:flex-start;
        padding:11px 14px;margin-bottom:20px;border-radius:6px;
        background:#FBEFEC;border:1px solid #F1D2CA;color:${A.danger};font-size:12.5px;line-height:1.5;
      }

      .ads-seg {
        display:inline-grid;grid-template-columns:1fr 1fr;position:relative;
        padding:3px;border-radius:999px;background:#F5F0ED;margin-bottom:22px;
      }
      .ads-seg button {
        all:unset;position:relative;z-index:1;cursor:pointer;text-align:center;
        padding:7px 18px;font-size:12px;font-weight:500;color:${A.muted};transition:color 0.25s;
      }
      .ads-seg button[aria-pressed=true] { color:${A.ink}; }
      .ads-seg button:focus-visible { outline:2px solid ${A.accent};outline-offset:1px;border-radius:999px; }
      .ads-seg-pill { position:absolute;inset:0;border-radius:999px;background:#fff;box-shadow:0 1px 3px rgba(43,33,28,0.12); }

      @media (max-width: 1180px) {
        .ads-copy { padding:36px 32px 32px 40px; }
        .ads-panel { padding:48px 56px; }
      }
    `}</style>

    <div className="ads-photo">
      <motion.img
        src={image}
        alt=""
        style={{ objectPosition: imagePosition }}
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="ads-copy">
        <motion.div className="ads-brand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          BagSearch
        </motion.div>
        <motion.h1
          className="ads-headline"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          {headline}
        </motion.h1>
        <motion.p className="ads-blurb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {blurb}
        </motion.p>
        {footer && <div className="ads-footer">{footer}</div>}
      </div>
    </div>

    <motion.section
      className="ads-panel"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={spring}
    >
      <motion.div className="ads-panel-inner" variants={list} initial="hidden" animate="show">
        {children}
      </motion.div>
    </motion.section>
  </div>
);

export default AuthDesktopShell;
