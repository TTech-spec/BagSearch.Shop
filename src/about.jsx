import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from './components/Logo.jsx';
import { useSEO, SITE_URL } from './hooks/useSEO';

/* ── Inline SVG icon components ── */
const IconSearch = ({ size = 15, stroke = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconUser = ({ size = 15, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconArrow = ({ size = 13, stroke = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconBag = ({ size = 22, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const IconFragmented = ({ size = 22, stroke = 'white', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconMegaphone = ({ size = 22, stroke = 'white', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);

const IconCheck = ({ size = 22, stroke = 'white', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconVisual = ({ size = 22, stroke = '#c84b11', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconBagOnly = ({ size = 22, stroke = '#c84b11', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const IconChart = ({ size = 22, stroke = '#c84b11', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconGlobe = ({ size = 22, stroke = '#c84b11', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconShopper = ({ size = 28, stroke = '#c84b11', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconStore = ({ size = 28, stroke = 'white', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconWhatsapp = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#22c55e">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const BagSearchAbout = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    buyers: '10K+',
    sellers: '500+',
    states: '36',
    focus: '100%'
  });

  // SEO for About page
  useSEO({
    title: 'About Us | BagSearch Nigeria',
    description: 'Learn about BagSearch, Africa\'s first AI-powered luxury bag marketplace. Our story, mission, and commitment to authentic bags and verified sellers across Nigeria.',
    keywords: 'about BagSearch, our story, mission vision, luxury marketplace Nigeria, AI shopping, verified sellers',
    url: '/about',
    type: 'AboutPage',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About BagSearch',
      description: 'Africa\'s first AI-powered luxury bag discovery platform. Where culture meets couture.',
      mainEntity: {
        '@type': 'Organization',
        name: 'BagSearch',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        foundingDate: '2018',
        foundingLocation: {
          '@type': 'Place',
          name: 'Lagos, Nigeria'
        },
        description: "Nigeria's premier marketplace for authentic luxury designer bags, powered by AI visual search.",
        numberOfEmployees: {
          '@type': 'QuantitativeValue',
          minValue: 10,
          maxValue: 50
        },
        sameAs: []
      }
    }
  });

  const statsRef = useRef([]);
  const revealsRef = useRef([]);
  const animated = useRef(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('bs-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealsRef.current.forEach(el => { if (el) observer.observe(el); });

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animated.current.has(entry.target)) {
            animated.current.add(entry.target);
            const index = statsRef.current.indexOf(entry.target);
            animateCounter(index);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statsRef.current.forEach(el => { if (el) countObserver.observe(el); });

    return () => { observer.disconnect(); countObserver.disconnect(); };
  }, []);

  const animateCounter = (index) => {
    const targets = [
      { key: 'buyers', final: 10, suffix: 'K+' },
      { key: 'sellers', final: 500, suffix: '+' },
      { key: 'states', final: 36, suffix: '' },
      { key: 'focus', final: 100, suffix: '%' }
    ];
    const target = targets[index];
    const startTime = Date.now();
    const duration = 1400;
    const run = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(ease * target.final);
      setCounts(prev => ({ ...prev, [target.key]: value + target.suffix }));
      if (progress < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  };

  const addReveal = (index) => (el) => { revealsRef.current[index] = el; };

  return (
    <div className="bs-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Manrope:wght@500;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bs-body {
          font-family: 'Manrope', sans-serif;
          background: #ffffff;
          color: #1a0a00;
          overflow-x: hidden;
        }

        /* ── Reveal animations ── */
        .bs-reveal {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .bs-reveal.bs-visible { opacity: 1; transform: translateY(0); }
        .bs-d1 { transition-delay: 0.08s; }
        .bs-d2 { transition-delay: 0.16s; }
        .bs-d3 { transition-delay: 0.24s; }

        @keyframes waPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* ── Nav ── */
        .bs-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 5vw, 60px);
          height: 62px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #f7ece4;
          box-shadow: 0 1px 18px rgba(200,75,17,0.06);
        }
        .bs-nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .bs-nav-logo-text { font-size: 18px; font-weight: 900; color: #1a0a00; letter-spacing: -0.03em; }
        .bs-nav-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 10px;
          font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 800;
          background: linear-gradient(135deg, #c84b11, #f97316);
          color: white; text-decoration: none;
          box-shadow: 0 4px 14px rgba(200,75,17,0.28); white-space: nowrap;
        }

        /* ── Hero ── */
        .bs-hero {
          padding: clamp(52px,10vw,110px) clamp(16px,5vw,60px) clamp(40px,8vw,80px);
          background: linear-gradient(160deg, #fdf4ee 0%, #fdf8f5 50%, #fff 100%);
          text-align: center;
        }
        .bs-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fde8d8; color: #c84b11; border: 1px solid #f9c4a0;
          padding: 5px 14px; border-radius: 20px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; margin-bottom: 22px;
        }
        .bs-hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #c84b11; flex-shrink: 0;
        }
        .bs-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 6vw, 4rem);
          font-weight: 900; line-height: 1.1; color: #1a0a00;
          letter-spacing: -0.02em; margin-bottom: 18px;
        }
        .bs-hero-em {
          color: #c84b11; font-style: italic;
          background: linear-gradient(135deg, #c84b11, #f97316);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bs-hero-sub {
          font-size: clamp(13px, 2vw, 16px); color: #9a6348;
          font-weight: 500; line-height: 1.7;
          max-width: 540px; margin: 0 auto 36px;
        }
        .bs-hero-cta {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        }
        .bs-btn-primary {
          padding: 13px 26px;
          background: linear-gradient(135deg, #c84b11, #f97316);
          color: white; border-radius: 14px;
          font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 800;
          box-shadow: 0 8px 28px rgba(200,75,17,0.36); text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .bs-btn-outline {
          padding: 13px 26px; background: transparent; color: #c84b11;
          border: 2px solid #f9c4a0; border-radius: 14px;
          font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 800;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
        }

        /* ── Stats strip ── */
        .bs-stats-strip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: #f0d9cc;
          border-top: 1px solid #f0d9cc; border-bottom: 1px solid #f0d9cc;
          overflow: hidden;
        }
        .bs-stat-cell { background: white; padding: 26px 16px; text-align: center; }
        .bs-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.7rem, 5vw, 2.5rem); font-weight: 900;
          background: linear-gradient(135deg, #c84b11, #f97316);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; line-height: 1; margin-bottom: 6px;
        }
        .bs-stat-label { font-size: 11px; font-weight: 700; color: #5c3317; letter-spacing: 0.06em; }

        /* ── Sections ── */
        .bs-section { padding: clamp(44px,8vw,90px) clamp(16px,5vw,60px); }
        .bs-section-inner { max-width: 1200px; margin: 0 auto; }
        .bs-section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #c84b11; margin-bottom: 14px;
        }
        .bs-section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.7rem, 4vw, 2.7rem); font-weight: 900;
          color: #1a0a00; letter-spacing: -0.02em; line-height: 1.15;
          margin-bottom: 14px;
        }
        .bs-section-title em { color: #c84b11; font-style: italic; }

        /* ── Why grid ── */
        .bs-why-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 52px; align-items: center; margin-top: 44px;
        }
        .bs-why-text p {
          font-size: 15px; color: #5c3317; line-height: 1.8;
          font-weight: 500; margin-bottom: 18px;
        }
        .bs-why-visual {
          border-radius: 22px; overflow: hidden;
          background: linear-gradient(135deg, #fdf4ee, #fde8d8);
          border: 2px solid #f9c4a0; padding: 30px;
          display: flex; flex-direction: column; gap: 16px;
          box-shadow: 0 16px 48px rgba(200,75,17,0.1);
        }
        .bs-problem-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px; background: white;
          border-radius: 14px; border: 1px solid #f7ece4;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .bs-problem-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #c84b11, #f97316);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bs-problem-item h4 { font-size: 13px; font-weight: 800; color: #1a0a00; margin-bottom: 3px; }
        .bs-problem-item p  { font-size: 12px; color: #9a6348; font-weight: 500; line-height: 1.5; }
        .bs-wa-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #dcfce7; color: #15803d; border: 1px solid #a7f3d0;
          padding: 8px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 700; margin-top: 10px;
        }
        .bs-wa-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
          animation: waPulse 1.5s ease-in-out infinite; flex-shrink: 0;
        }

        /* ── Differentiators ── */
        .bs-diff-section {
          padding: clamp(44px,8vw,90px) clamp(16px,5vw,60px);
          background: linear-gradient(180deg, #fdf4ee 0%, white 100%);
        }
        .bs-diff-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 18px; margin-top: 44px;
        }
        .bs-diff-card {
          background: white; border-radius: 20px; padding: 26px;
          border: 1.5px solid #f7ece4; box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .bs-diff-card:hover {
          box-shadow: 0 8px 32px rgba(200,75,17,0.12);
          transform: translateY(-2px);
        }
        .bs-diff-card-icon {
          width: 50px; height: 50px; border-radius: 14px;
          background: #fde8d8; border: 1.5px solid #f9c4a0;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .bs-diff-card h3 { font-size: 15px; font-weight: 900; color: #1a0a00; margin-bottom: 8px; letter-spacing: -0.02em; }
        .bs-diff-card p  { font-size: 12px; color: #9a6348; line-height: 1.7; font-weight: 500; }

        /* ── Mission & Vision ── */
        .bs-mv-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 22px; margin-top: 44px;
        }
        .bs-mv-mission {
          border-radius: 22px; padding: 34px;
          background: linear-gradient(135deg, #1a0a00 0%, #4a1a06 60%, #c84b11 100%);
          color: white;
        }
        .bs-mv-vision {
          border-radius: 22px; padding: 34px;
          background: linear-gradient(135deg, #fdf4ee, #fde8d8);
          border: 2px solid #f9c4a0;
        }
        .bs-mv-label-mission {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 12px;
          color: rgba(255,255,255,0.5);
        }
        .bs-mv-label-vision {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 12px; color: #c84b11;
        }
        .bs-mv-mission h3 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.2rem, 3vw, 1.7rem); font-weight: 900;
          margin-bottom: 12px; line-height: 1.2; color: white;
        }
        .bs-mv-vision h3 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.2rem, 3vw, 1.7rem); font-weight: 900;
          margin-bottom: 12px; line-height: 1.2; color: #1a0a00;
        }
        .bs-mv-mission p { font-size: 14px; line-height: 1.75; font-weight: 500; color: rgba(255,255,255,0.72); }
        .bs-mv-vision p  { font-size: 14px; line-height: 1.75; font-weight: 500; color: #5c3317; }

        /* ── Join ── */
        .bs-join-section {
          padding: clamp(44px,8vw,90px) clamp(16px,5vw,60px);
          background: #fdf8f5;
        }
        .bs-join-inner { max-width: 800px; margin: 0 auto; text-align: center; }
        .bs-join-p {
          font-size: 15px; color: #9a6348; font-weight: 500; line-height: 1.7;
          max-width: 520px; margin: 0 auto 32px;
        }
        .bs-join-cards {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14px; margin-top: 40px;
        }
        .bs-join-card-shopper {
          padding: 26px; border-radius: 18px; text-align: left;
          border: 2px solid #f9c4a0; background: #fde8d8;
          display: block; text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .bs-join-card-shopper:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(200,75,17,0.15);
        }
        .bs-join-card-seller {
          padding: 26px; border-radius: 18px; text-align: left;
          border: 2px solid #3a1206;
          background: linear-gradient(135deg, #1a0a00, #3a1206);
          display: block; text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .bs-join-card-seller:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(26,10,0,0.3);
        }
        .bs-join-card-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .bs-join-card-icon-shopper {
          background: rgba(200,75,17,0.12); border: 1.5px solid #f9c4a0;
        }
        .bs-join-card-icon-seller {
          background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2);
        }
        .bs-join-card-shopper h4 { font-size: 16px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.02em; color: #1a0a00; }
        .bs-join-card-seller h4  { font-size: 16px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.02em; color: white; }
        .bs-join-card-shopper p  { font-size: 13px; line-height: 1.65; font-weight: 500; color: #9a6348; }
        .bs-join-card-seller p   { font-size: 13px; line-height: 1.65; font-weight: 500; color: rgba(255,255,255,0.6); }
        .bs-cta-shopper {
          margin-top: 16px; display: inline-flex; align-items: center;
          gap: 6px; font-size: 13px; font-weight: 800; color: #c84b11;
        }
        .bs-cta-seller {
          margin-top: 16px; display: inline-flex; align-items: center;
          gap: 6px; font-size: 13px; font-weight: 800; color: #f97316;
        }

        /* ── Footer ── */
        .bs-footer {
          background: #1a0a00; color: rgba(255,255,255,0.5);
          text-align: center; padding: 26px 20px;
          font-size: 12px; font-weight: 500;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .bs-footer b   { color: #f97316; }
        .bs-footer span { color: rgba(255,255,255,0.2); }

        /* ── Heart SVG in footer ── */
        .bs-heart {
          display: inline-block; vertical-align: middle;
          fill: #f97316; width: 12px; height: 12px;
        }

        /* ════════════════════════════
           RESPONSIVE BREAKPOINTS
        ════════════════════════════ */

        @media (max-width: 900px) {
          .bs-why-grid { grid-template-columns: 1fr; gap: 32px; }
          .bs-mv-grid  { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .bs-diff-grid   { grid-template-columns: 1fr; }
          .bs-join-cards  { grid-template-columns: 1fr; }
          .bs-hero-cta    { flex-direction: column; align-items: center; }
          .bs-btn-primary,
          .bs-btn-outline { width: 100%; max-width: 280px; justify-content: center; }
          .bs-mv-mission,
          .bs-mv-vision   { padding: 26px; }
          .bs-why-visual  { padding: 22px; }
        }

        @media (min-width: 641px) {
          .bs-stats-strip { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 360px) {
          .bs-nav-logo-text { font-size: 15px; }
          .bs-nav-btn { padding: 7px 12px; font-size: 11px; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="bs-nav">
        <a href="#" className="bs-nav-logo">
          <LogoIcon size={36} />
          <span className="bs-nav-logo-text">Bag<b>Search</b></span>
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }} className="bs-nav-btn">
          <IconBag size={14} stroke="white" strokeWidth={2.5} />
          Shop Now
        </a>
      </nav>

      {/* Hero */}
      <section className="bs-hero">
        <div className="bs-hero-badge">
          <div className="bs-hero-badge-dot"></div>
          About BagSearch
        </div>
        <h1 className="bs-hero-title">
          Finding the <em className="bs-hero-em">right bag</em><br/>should be simple
        </h1>
        <p className="bs-hero-sub">
          A bag-focused marketplace built to connect shoppers with trusted sellers across Nigeria — fast, visual, and made for real people.
        </p>
        <div className="bs-hero-cta">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }} className="bs-btn-primary">
            <IconSearch size={15} stroke="white" strokeWidth={2.5} />
            Browse Bags
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="bs-btn-outline">
            <IconUser size={15} stroke="#c84b11" strokeWidth={2} />
            Start Selling
          </a>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="bs-stats-strip">
        {[
          { key: 0, val: counts.buyers,  label: 'Active Buyers' },
          { key: 1, val: counts.sellers, label: 'Trusted Sellers' },
          { key: 2, val: counts.states,  label: 'States Covered' },
          { key: 3, val: counts.focus,   label: 'Bag-Focused' },
        ].map(({ key, val, label }) => (
          <div key={key} ref={el => statsRef.current[key] = el} className="bs-stat-cell bs-reveal">
            <div className="bs-stat-num">{val}</div>
            <div className="bs-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Why We Exist */}
      <section className="bs-section">
        <div className="bs-section-inner">
          <div ref={addReveal(0)} className="bs-reveal bs-section-tag">
            <IconBag size={12} stroke="#c84b11" strokeWidth={2.5} />
            Our Story
          </div>
          <h2 ref={addReveal(1)} className="bs-reveal bs-d1 bs-section-title">Why We <em>Exist</em></h2>
          <div className="bs-why-grid">
            <div ref={addReveal(2)} className="bs-reveal bs-why-text">
              <p>In many markets across Africa, buying bags is fragmented and time-consuming. Buyers rely on word of mouth, scattered social media listings, or physically visiting multiple shops.</p>
              <p>Sellers, on the other hand, struggle to reach the right audience consistently — putting great products in front of the wrong people, or no people at all.</p>
              <p>BagSearch was built to solve this. We created a dedicated platform that makes discovery fast, transactions transparent, and growth achievable for every seller — from market traders to luxury boutiques.</p>
              <div className="bs-wa-badge">
                <IconWhatsapp size={14} />
                Available via WhatsApp · Mon–Sat 8AM–8PM
              </div>
            </div>
            <div ref={addReveal(3)} className="bs-reveal bs-d1 bs-why-visual">
              {[
                {
                  IconComp: IconFragmented,
                  title: 'Fragmented Discovery',
                  text: 'Buyers wasting hours across social media and physical shops just to find one bag.'
                },
                {
                  IconComp: IconMegaphone,
                  title: 'Seller Reach Problems',
                  text: 'Vendors with quality products unable to consistently reach the right customers.'
                },
                {
                  IconComp: IconCheck,
                  title: 'BagSearch is the Fix',
                  text: 'One focused platform — visual, fast, and built for how Nigerians actually shop.'
                },
              ].map(({ IconComp, title, text }) => (
                <div key={title} className="bs-problem-item">
                  <div className="bs-problem-icon">
                    <IconComp size={18} stroke="white" strokeWidth={2} />
                  </div>
                  <div><h4>{title}</h4><p>{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="bs-diff-section">
        <div className="bs-section-inner">
          <div ref={addReveal(4)} className="bs-reveal bs-section-tag">
            <IconVisual size={12} stroke="#c84b11" strokeWidth={2.5} />
            Differentiators
          </div>
          <h2 ref={addReveal(5)} className="bs-reveal bs-d1 bs-section-title">What Makes Us <em>Different</em></h2>
          <div className="bs-diff-grid">
            {[
              {
                IconComp: IconVisual,
                title: 'Visual-First Search',
                text: 'Find bags by what you see, not just what you type. Upload a photo and instantly discover visually similar listings from sellers across Nigeria.',
                delay: ''
              },
              {
                IconComp: IconBagOnly,
                title: 'Bags Only — Nothing Else',
                text: 'We specialize in bags exclusively. Better discovery, more relevant options, and a community that truly understands the market.',
                delay: 'bs-d1'
              },
              {
                IconComp: IconChart,
                title: 'Seller Empowerment',
                text: 'Vendors grow through subscriptions and premium listings that boost visibility. Your products reach buyers actively looking for what you sell.',
                delay: 'bs-d2'
              },
              {
                IconComp: IconGlobe,
                title: 'Built for Local Reality',
                text: 'We understand how people buy and sell in emerging markets — from Lagos Island to Kano, from Abuja to Port Harcourt.',
                delay: 'bs-d3'
              },
            ].map(({ IconComp, title, text, delay }, i) => (
              <div key={i} ref={addReveal(6 + i)} className={`bs-reveal ${delay} bs-diff-card`}>
                <div className="bs-diff-card-icon">
                  <IconComp size={22} stroke="#c84b11" strokeWidth={2} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bs-section">
        <div className="bs-section-inner">
          <div ref={addReveal(10)} className="bs-reveal bs-section-tag">
            <IconCheck size={12} stroke="#c84b11" strokeWidth={3} />
            Purpose
          </div>
          <h2 ref={addReveal(11)} className="bs-reveal bs-d1 bs-section-title">Mission & <em>Vision</em></h2>
          <div className="bs-mv-grid">
            <div ref={addReveal(12)} className="bs-reveal bs-d1 bs-mv-mission">
              <div className="bs-mv-label-mission">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Our Mission
              </div>
              <h3>Making buying & selling bags easier, smarter, and more profitable for everyone.</h3>
              <p>We exist to simplify transactions, empower sellers with the tools they need, and give buyers a searching experience that actually feels effortless.</p>
            </div>
            <div ref={addReveal(13)} className="bs-reveal bs-d2 bs-mv-vision">
              <div className="bs-mv-label-vision">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c84b11" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Our Vision
              </div>
              <h3>Africa's leading bag marketplace — and beyond.</h3>
              <p>We're building a growing ecosystem around one product, powered by technology and driven by real market needs — where anyone can find the perfect bag or build a successful bag business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="bs-join-section">
        <div className="bs-section-inner bs-join-inner">
          <div ref={addReveal(14)} className="bs-reveal bs-section-tag" style={{ justifyContent: 'center' }}>
            <IconGlobe size={12} stroke="#c84b11" strokeWidth={2.5} />
            Join the Community
          </div>
          <h2 ref={addReveal(15)} className="bs-reveal bs-d1 bs-section-title">
            BagSearch is<br/><em>your platform</em>
          </h2>
          <p ref={addReveal(16)} className="bs-reveal bs-d2 bs-join-p">
            Whether you're a shopper hunting for the perfect bag or a seller ready to grow your business — you belong here.
          </p>
          <div ref={addReveal(17)} className="bs-reveal bs-d2 bs-join-cards">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }} className="bs-join-card-shopper">
              <div className={`bs-join-card-icon bs-join-card-icon-shopper`}>
                <IconShopper size={24} stroke="#c84b11" strokeWidth={2} />
              </div>
              <h4>I'm a Shopper</h4>
              <p>Browse thousands of bags from trusted sellers, filter by location, style, and price — or search visually with a photo.</p>
              <div className="bs-cta-shopper">
                Start Browsing
                <IconArrow size={13} stroke="#c84b11" strokeWidth={2.5} />
              </div>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="bs-join-card-seller">
              <div className={`bs-join-card-icon bs-join-card-icon-seller`}>
                <IconStore size={24} stroke="white" strokeWidth={2} />
              </div>
              <h4>I'm a Seller</h4>
              <p>List your products, reach 10,000+ active buyers, and grow your bag business with tools built specifically for the Nigerian market.</p>
              <div className="bs-cta-seller">
                Start Selling Free
                <IconArrow size={13} stroke="#f97316" strokeWidth={2.5} />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bs-footer">
        <p>
          © 2025 <b>BagSearch</b> Nigeria. All rights reserved.{' '}
          <span>·</span>{' '}
          Made with{' '}
          <svg className="bs-heart" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>{' '}
          in Nigeria
        </p>
      </footer>
    </div>
  );
};

export default BagSearchAbout;