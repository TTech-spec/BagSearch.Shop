import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

// Animates a number from 0 (or its previous value) to `value` when it scrolls into view.
export default function CountUp({ value, format = (n) => Math.round(n).toLocaleString(), duration = 1.1 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const target = Number(value) || 0;
    if (reduce) { fromRef.current = target; return; }
    const controls = animate(fromRef.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    fromRef.current = target;
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return <span ref={ref}>{format(reduce ? Number(value) || 0 : display)}</span>;
}
