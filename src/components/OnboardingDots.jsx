import { motion } from 'framer-motion';

/**
 * Horizontal onboarding pagination indicator.
 * Active slide renders as a pill-shaped dash; inactive slides render as small dots.
 */
export default function OnboardingDots({ count, activeIndex, accent = '#A855F7' }) {
  return (
    <div
      role="tablist"
      aria-label="Onboarding progress"
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <motion.span
            key={i}
            role="tab"
            aria-selected={isActive}
            aria-label={`Slide ${i + 1} of ${count}`}
            initial={false}
            animate={{
              width: isActive ? 22 : 6,
              backgroundColor: isActive ? accent : 'rgba(255,255,255,0.4)',
            }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 6,
              borderRadius: 999,
              display: 'inline-block',
            }}
          />
        );
      })}
    </div>
  );
}
