import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { T, EASE_OUT } from '../../theme/luxe';

const fmtDay = (t, opts = { day: 'numeric', month: 'short' }) => new Date(t).toLocaleDateString('en-GB', opts);

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// Daily views as an area line, with orders as a bar strip on the same time axis.
export default function ViewsChart({ daily, height = 200, rangeKey }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const n = daily.length;
  const maxViews = Math.max(4, ...daily.map(d => d.views));
  const maxOrders = Math.max(1, ...daily.map(d => d.orders));
  const pad = 8;
  const x = (i) => (n > 1 ? (i / (n - 1)) * width : width / 2);
  const y = (v) => height - pad - (v / (maxViews * 1.1)) * (height - pad * 2);

  const line = daily.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.views).toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const barW = Math.max(3, Math.min(14, (width / n) * 0.5));
  const labelIdx = n <= 7 ? daily.map((_, i) => i) : [0, Math.round((n - 1) * 0.25), Math.round((n - 1) * 0.5), Math.round((n - 1) * 0.75), n - 1];
  const gridVals = [0.33, 0.66, 1].map(f => Math.round(maxViews * f));

  const pick = (clientX, el) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const total = daily.reduce((a, d) => a + d.views, 0);
  const summary = `Product views per day. ${total} views in total, highest ${Math.max(...daily.map(d => d.views))} in a day.`;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {width > 0 && (
        <>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}
            onMouseMove={(e) => pick(e.clientX, e.currentTarget)} onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget)} onTouchMove={(e) => pick(e.touches[0].clientX, e.currentTarget)}
            style={{ display: 'block', touchAction: 'pan-y', cursor: 'crosshair' }}>
            {gridVals.map(v => (
              <g key={v}>
                <line x1="0" x2={width} y1={y(v)} y2={y(v)} stroke={T.lineSoft} strokeDasharray="3 4" />
                <text x="0" y={y(v) - 5} fontSize="11" fill={T.muted}>{v}</text>
              </g>
            ))}
            <motion.path key={`a-${rangeKey}`} d={area} fill={T.ink2} initial={{ opacity: 0 }} animate={{ opacity: 0.08 }} transition={{ duration: 0.8, delay: 0.3 }} />
            <motion.path key={`l-${rangeKey}`} d={line} fill="none" stroke={T.ink2} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE_OUT }} />
            {hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1="0" y2={height} stroke={T.ink} strokeWidth="1" />
                <circle cx={x(hover)} cy={y(daily[hover].views)} r="5" fill={T.surface} stroke={T.ink} strokeWidth="2" />
              </g>
            )}
          </svg>

          <svg width={width} height="30" viewBox={`0 0 ${width} 30`} aria-label="Orders per day" role="img" style={{ display: 'block', marginTop: 8 }}>
            <line x1="0" x2={width} y1="29.5" y2="29.5" stroke={T.line} />
            {daily.map((d, i) => d.orders > 0 && (
              <motion.rect key={`${rangeKey}-${i}`} x={x(i) - barW / 2} width={barW} rx="2" fill={T.accent}
                initial={{ height: 0, y: 29 }} animate={{ height: (d.orders / maxOrders) * 26, y: 29 - (d.orders / maxOrders) * 26 }}
                transition={{ delay: 0.6 + (i / n) * 0.6, duration: 0.4, ease: EASE_OUT }} />
            ))}
          </svg>

          <div style={{ position: 'relative', height: 18, marginTop: 8, fontSize: 12, color: T.muted }}>
            {labelIdx.map((i, k) => (
              <span key={i} style={{ position: 'absolute', left: x(i), transform: k === 0 ? 'none' : k === labelIdx.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                {fmtDay(daily[i].date)}
              </span>
            ))}
          </div>

          <AnimatePresence>
            {hover != null && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                style={{ position: 'absolute', top: 4, left: Math.min(Math.max(0, x(hover) + 12), width - 150), pointerEvents: 'none', padding: '8px 12px', borderRadius: 10, background: T.ink, color: T.bg, fontSize: 12, lineHeight: 1.5, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(28,20,16,0.2)' }}>
                <div style={{ fontWeight: 800 }}>{fmtDay(daily[hover].date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div>{daily[hover].views} view{daily[hover].views === 1 ? '' : 's'} · {daily[hover].orders} order{daily[hover].orders === 1 ? '' : 's'}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
