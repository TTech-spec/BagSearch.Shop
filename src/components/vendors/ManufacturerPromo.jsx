import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/*
 * ManufacturerPromo
 * Kinetic, fast-cut promo (dark navy ↔ light sky scenes, floating 3D phone,
 * two-tone word reveals, floating chips, logo sting) with a synthesized
 * soundtrack: beat + whoosh on every cut + pluck on word reveals.
 * Promotes: vendors buying / ordering bags straight from Chinese manufacturers.
 */

const BEAT = 0.5; // seconds per beat (120 BPM)

const SCENES = [
  { a: "Every", b: "bag deal", theme: "dark", phone: null, beats: 2 },
  { a: "Buy bags", b: "direct from China", theme: "light", phone: "catalog", tilt: -18, beats: 3 },
  { a: "Order from", b: "verified factories", theme: "dark", phone: "order", tilt: 12, beats: 3 },
  { a: "Connect with", b: "manufacturers directly", theme: "light", phone: "chat", tilt: -10, beats: 3 },
  { a: "Wholesale prices,", b: "no middlemen", theme: "dark", phone: "home", tilt: 0, chips: true, beats: 3 },
  { a: "Track your", b: "shipments", theme: "light", phone: "track", tilt: 14, beats: 3 },
  { a: "Very secure", b: "all the way", theme: "dark", phone: "secure", tilt: -14, beats: 3 },
  { a: "No complicated", b: "steps", theme: "light", phone: null, beats: 2 },
  { logo: true, theme: "light", beats: 3 },
  { cta: true, theme: "dark", beats: 6 },
];

const ACCENT = "#22B8E6";
const THEMES = {
  dark: { bg: "radial-gradient(120% 90% at 30% 20%, #0F3550 0%, #071725 55%, #030A12 100%)", fg: "#E8F4FA", accent: ACCENT },
  light: { bg: "radial-gradient(120% 90% at 70% 10%, #FFFFFF 0%, #E3F2F9 55%, #C7E3F0 100%)", fg: "#0B1B2A", accent: "#1F5FD6" },
};

/* ------------------------------ sound engine ------------------------------ */
function createAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  const env = (g, t, a, peak, dec) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  };

  const kick = (t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    env(g, t, 0.004, 0.9, 0.32);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.4);
  };
  const hat = (t, v = 0.12) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7500;
    env(g, t, 0.002, v, 0.05);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.08);
  };
  const clap = (t) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = 0.8;
    env(g, t, 0.003, 0.35, 0.16);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.22);
  };
  const bass = (t, freq) => {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = freq;
    f.type = "lowpass"; f.frequency.value = 420;
    env(g, t, 0.01, 0.22, 0.38);
    o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 0.45);
  };
  const whoosh = (t, dur = 0.45) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "bandpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(300, t - dur * 0.7);
    f.frequency.exponentialRampToValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur * 0.3);
    g.gain.setValueAtTime(0.0001, t - dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.3);
    s.connect(f).connect(g).connect(master); s.start(t - dur * 0.7); s.stop(t + dur * 0.35);
  };
  const pluck = (t, freq) => {
    [1, 2].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i ? "triangle" : "sine"; o.frequency.value = freq * m;
      env(g, t, 0.004, i ? 0.05 : 0.14, 0.35);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.45);
    });
  };
  const chord = (t, freqs, dur) => {
    freqs.forEach((fq) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = fq; o.detune.value = Math.random() * 14 - 7;
      f.type = "lowpass"; f.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
    });
  };
  const impact = (t) => {
    kick(t); clap(t);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1760, t + 0.08);
    env(g, t, 0.005, 0.12, 0.9);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1);
  };

  // Schedule one full loop of the promo starting at time t0.
  const scheduleLoop = (t0) => {
    const totalBeats = SCENES.reduce((s, x) => s + x.beats, 0);
    const prog = [[110, 220, 277.2, 329.6], [87.3, 174.6, 220, 261.6], [130.8, 261.6, 329.6, 392], [98, 196, 246.9, 293.7]];
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * BEAT;
      kick(t);
      hat(t + BEAT / 2, 0.14); hat(t + BEAT * 0.25, 0.06); hat(t + BEAT * 0.75, 0.06);
      if (b % 2 === 1) clap(t);
      const p = prog[Math.floor(b / 4) % 4];
      bass(t, p[0]); bass(t + BEAT / 2, p[0]);
      if (b % 4 === 0) chord(t, p.slice(1), BEAT * 3.6);
    }
    let beat = 0;
    SCENES.forEach((s, i) => {
      const t = t0 + beat * BEAT;
      if (i > 0) whoosh(t);
      if (s.logo || s.cta) impact(t);
      else {
        pluck(t + 0.05, 659.3);
        if (s.b) pluck(t + BEAT * 0.55, 987.8);
      }
      beat += s.beats;
    });
  };
  return { ctx, master, scheduleLoop };
}

/* ------------------------------ phone screens ----------------------------- */
const Row = ({ w = "70%", c = "rgba(255,255,255,.18)", h = 7 }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: c, marginBottom: 6 }} />
);

function Screen({ kind }) {
  const card = { background: "linear-gradient(135deg,#19A6D9,#1565C0)", borderRadius: 12, padding: 10, color: "#fff", marginBottom: 10 };
  const item = { display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,.06)", borderRadius: 10, padding: 8, marginBottom: 7 };
  const thumb = (bg) => <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, flexShrink: 0 }} />;
  const text = (t, s = 9, o = 0.9) => <div style={{ fontSize: s, opacity: o, fontWeight: 600 }}>{t}</div>;

  switch (kind) {
    case "catalog":
      return (<>
        {text("Factory catalog", 11)}
        <div style={{ height: 8 }} />
        {[["Guangzhou Leather Co.", "#C94B2C"], ["Shenzhen Totes Ltd.", "#E0A23A"], ["Baigou Luggage Mfg.", "#3AB0E0"], ["Yiwu Backpack Factory", "#6C5CE7"]].map(([n, c]) => (
          <div key={n} style={item}>{thumb(c)}<div style={{ flex: 1 }}>{text(n)}<Row w="55%" h={5} /></div><div style={{ fontSize: 8, color: ACCENT }}>MOQ 50</div></div>
        ))}
      </>);
    case "order":
      return (<>
        {text("New bulk order", 11)}
        <div style={{ ...card, marginTop: 8 }}>{text("Leather tote · Tan", 9)}<div style={{ fontSize: 18, fontWeight: 800, margin: "4px 0" }}>500 pcs</div>{text("$6.40 / unit · FOB Guangzhou", 8, 0.8)}</div>
        {["Material: PU leather", "Logo: custom print", "Lead time: 18 days"].map((t) => <div key={t} style={item}>{text(t)}</div>)}
        <div style={{ background: ACCENT, borderRadius: 10, padding: 9, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#04202E" }}>Place order</div>
      </>);
    case "chat":
      return (<>
        {text("Shenzhen Totes Ltd. · Online", 10)}
        <div style={{ height: 8 }} />
        {[["Hi! Can you do 300 pcs with my logo?", 1], ["Yes, sample ready in 5 days ✅", 0], ["Great — send me the price list", 1], ["Sent! Best wholesale rates 📦", 0]].map(([m, me], i) => (
          <div key={i} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 7 }}>
            <div style={{ maxWidth: "78%", fontSize: 8.5, padding: "7px 9px", borderRadius: 10, background: me ? "#1E88E5" : "rgba(255,255,255,.1)" }}>{m}</div>
          </div>
        ))}
      </>);
    case "track":
      return (<>
        {text("Shipment #BS-20418", 11)}
        <div style={{ height: 10 }} />
        {["Order confirmed", "In production", "Quality check", "Shipped from China", "Arriving at your store"].map((s, i) => (
          <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: i < 4 ? ACCENT : "rgba(255,255,255,.2)" }} />
            {text(s, 9, i < 4 ? 1 : 0.5)}
          </div>
        ))}
      </>);
    case "secure":
      return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.25 }}
          style={{ width: 64, height: 64, borderRadius: 32, background: "#16A34A", display: "grid", placeItems: "center", fontSize: 30, color: "#fff" }}>✓</motion.div>
        <div style={{ height: 12 }} />{text("Payment protected", 11)}{text("Escrow until delivery", 9, 0.6)}
      </div>);
    default:
      return (<>
        {text("Hi, Vendor 👋", 10)}
        <div style={{ ...card, marginTop: 8 }}>{text("Factory savings this month", 8, 0.8)}<div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>$12,480.00</div></div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>{["Order", "Chat", "Track"].map((t) => <div key={t} style={{ flex: 1, textAlign: "center", fontSize: 8, padding: 7, borderRadius: 8, background: "rgba(255,255,255,.08)" }}>{t}</div>)}</div>
        {[["Totes", "#E0A23A"], ["Backpacks", "#3AB0E0"]].map(([n, c]) => <div key={n} style={item}>{thumb(c)}<div style={{ flex: 1 }}>{text(n)}<Row w="50%" h={5} /></div></div>)}
      </>);
  }
}

function Phone({ kind, tilt = 0 }) {
  return (
    <motion.div
      key={kind}
      initial={{ y: 140, rotateY: tilt * 2.2, rotateZ: tilt * 0.4, opacity: 0, scale: 0.9 }}
      animate={{ y: [140, 0, -8], rotateY: [tilt * 2.2, tilt, tilt * 0.6], rotateZ: tilt * 0.15, opacity: 1, scale: 1 }}
      exit={{ y: -120, opacity: 0, rotateY: -tilt, transition: { duration: 0.25 } }}
      transition={{ duration: 1.3, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1], opacity: { duration: 0.25 }, scale: { duration: 0.5 }, rotateZ: { duration: 0.6 } }}
      style={{ width: 190, height: 390, borderRadius: 34, padding: 9, background: "linear-gradient(145deg,#2FB7D8,#0E5A78 40%,#0A3C52)", boxShadow: "0 40px 80px rgba(0,0,0,.45), inset 0 0 0 1.5px rgba(255,255,255,.25)", transformStyle: "preserve-3d", flexShrink: 0 }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 26, background: "#0B1622", color: "#E8F4FA", padding: "26px 12px 12px", position: "relative", overflow: "hidden", fontFamily: "inherit" }}>
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 60, height: 16, borderRadius: 10, background: "#000" }} />
        <Screen kind={kind} />
      </div>
    </motion.div>
  );
}

const CHIPS = [
  { t: "👜 Handbags", x: -150, y: -150 }, { t: "🎒 Backpacks", x: 140, y: -110 },
  { t: "🧳 Luggage", x: -165, y: 40 }, { t: "🛍️ Totes", x: 150, y: 70 }, { t: "🏭 Factories", x: -120, y: 160 },
];

function Words({ a, b, accent, fg }) {
  return (
    <div style={{ fontSize: "clamp(26px, 4.6vw, 46px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, color: fg }}>
      <motion.span style={{ display: "inline-block" }} initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}>{a}</motion.span>
      {b && <><br /><motion.span style={{ display: "inline-block", color: accent }} initial={{ opacity: 0, x: 30, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, delay: BEAT * 0.55, ease: [0.2, 0.9, 0.2, 1] }}>{b}</motion.span></>}
    </div>
  );
}

export default function ManufacturerPromo() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);
    const loopMs = SCENES.reduce((s, x) => s + x.beats, 0) * BEAT * 1000;

  // Scene sequencer
  useEffect(() => {
    const t = setTimeout(() => setIdx((i) => (i + 1) % SCENES.length), SCENES[idx].beats * BEAT * 1000);
    return () => clearTimeout(t);
  }, [idx]);

  // Restart scheduled audio in sync with the visuals whenever a loop begins.
  useEffect(() => {
    if (!soundOn || idx !== 0) return;
    const a = audioRef.current; if (!a) return;
    a.scheduleLoop(a.ctx.currentTime + 0.02);
  }, [idx, soundOn]);

  useEffect(() => () => { audioRef.current?.ctx.close(); }, []);

  const toggleSound = async () => {
    if (soundOn) {
      audioRef.current?.ctx.close(); audioRef.current = null; setSoundOn(false); return;
    }
    const a = createAudio(); if (!a) return;
    await a.ctx.resume();
    audioRef.current = a;
    setIdx(0); setSoundOn(true);
    if (idx === 0) a.scheduleLoop(a.ctx.currentTime + 0.02);
  };

  const s = SCENES[idx];
  const th = THEMES[s.theme];

  return (
    <section aria-label="Buy bags directly from Chinese manufacturers" style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", minHeight: 420, maxHeight: "88vh", overflow: "hidden", background: "#071725", fontFamily: "'Inter', system-ui, sans-serif", perspective: 1200 }} data-loop-ms={loopMs}>
      <motion.div key={`bg${idx}`} initial={{ opacity: 0.4, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
        style={{ position: "absolute", inset: 0, background: th.bg, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px,5vw,64px)", padding: "0 16px", flexWrap: "nowrap" }}>
        <AnimatePresence mode="wait">
          {s.logo ? (
            <motion.div key="logo" style={{ display: "flex", alignItems: "center", gap: 12 }} exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.2 } }}>
              <motion.div initial={{ x: -120, skewX: -20, opacity: 0 }} animate={{ x: 0, skewX: -12, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
                style={{ width: 54, height: 54, borderRadius: 12, background: "linear-gradient(135deg,#22B8E6,#1F3FD6)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, fontSize: 30 }}>B</motion.div>
              <motion.div initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 800, color: "#0B1B2A", letterSpacing: "-0.03em" }}>BagSearch</motion.div>
            </motion.div>
          ) : s.cta ? (
            <motion.div key="cta" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: "center", color: th.fg, maxWidth: 640 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 12 }}>For vendors</div>
              <div style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Buy & order bags straight from <span style={{ color: ACCENT }}>Chinese manufacturers</span></div>
              <p style={{ opacity: 0.75, fontSize: "clamp(13px,1.6vw,16px)", margin: "14px auto 22px", maxWidth: 520 }}>Connect with verified factories, chat directly, negotiate wholesale prices and track every shipment. Sign up on BagSearch to unlock these features.</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/register")}
                animate={{ boxShadow: ["0 0 0 0 rgba(34,184,230,.6)", "0 0 0 16px rgba(34,184,230,0)"] }} transition={{ boxShadow: { duration: 1.4, repeat: Infinity } }}
                style={{ background: ACCENT, color: "#04202E", border: 0, borderRadius: 999, padding: "14px 30px", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Sign up on BagSearch →
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key={`scene${idx}`} exit={{ opacity: 0, transition: { duration: 0.15 } }} style={{ display: "flex", alignItems: "center", gap: "clamp(20px,5vw,64px)", position: "relative" }}>
              {s.phone && !s.chips && <div className="mp-text-left" style={{ textAlign: "right", minWidth: 0 }}><Words a={s.a} fg={th.fg} accent={th.accent} /></div>}
              {s.phone && (
                <div style={{ position: "relative" }}>
                  <Phone kind={s.phone} tilt={s.tilt} />
                  {s.chips && CHIPS.map((c, i) => (
                    <motion.div key={c.t} initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }} animate={{ opacity: 1, scale: 1, x: c.x, y: c.y }} transition={{ delay: 0.3 + i * 0.09, type: "spring", stiffness: 260, damping: 16 }}
                      style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", whiteSpace: "nowrap", background: "#fff", color: "#0B1B2A", fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>{c.t}</motion.div>
                  ))}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                {s.phone && !s.chips ? <Words a="" b={s.b} fg={th.fg} accent={th.accent} /> : <Words a={s.a} b={s.b} fg={th.fg} accent={th.accent} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={toggleSound} aria-pressed={soundOn}
        style={{ position: "absolute", zIndex: 2, right: 16, bottom: 16, border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(0,0,0,.55)", color: "#fff", backdropFilter: "blur(6px)" }}>
        {soundOn ? "🔊 Sound on" : "🔇 Tap for sound"}
      </button>

      <div style={{ position: "absolute", zIndex: 2, left: 0, bottom: 0, height: 3, width: "100%", background: "rgba(255,255,255,.1)" }}>
        <motion.div key={`p${idx}`} initial={{ width: `${(idx / SCENES.length) * 100}%` }} animate={{ width: `${((idx + 1) / SCENES.length) * 100}%` }} transition={{ duration: s.beats * BEAT, ease: "linear" }} style={{ height: "100%", background: ACCENT }} />
      </div>

      <style>{`@media (max-width:640px){ section[aria-label^="Buy bags"] { aspect-ratio: 9 / 14 !important; } section[aria-label^="Buy bags"] > div > div > div { flex-direction: column; text-align:center } .mp-text-left{ text-align:center !important } }`}</style>
    </section>
  );
}
