import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from './components/Logo.jsx';
import { useSEO, SITE_URL } from './hooks/useSEO';

const IconShield = ({ size = 18, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconLock = ({ size = 18, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V8a5 5 0 0 1 10 0v3" />
  </svg>
);

const IconDatabase = ({ size = 18, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>
);

const IconMessage = ({ size = 18, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3h.5A8 8 0 0 1 21 11v.5z" />
  </svg>
);

const IconEye = ({ size = 18, stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconArrowRight = ({ size = 14, stroke = 'currentColor', strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const summaryCards = [
  {
    icon: <IconShield size={20} stroke="#c84b11" />,
    title: 'Transparency First',
    text: 'We explain what information BagSearch collects, why we collect it, and how it supports shopping and selling on the platform.',
  },
  {
    icon: <IconLock size={20} stroke="#15803d" />,
    title: 'Respect for Privacy',
    text: 'We aim to limit access to personal information and use reasonable safeguards to protect accounts, listings, and communication details.',
  },
  {
    icon: <IconMessage size={20} stroke="#1d4ed8" />,
    title: 'Marketplace Communication',
    text: 'Some seller and buyer details may be shared only when needed to support inquiries, orders, delivery coordination, or support requests.',
  },
];

const policySections = [
  {
    title: 'Information We Collect',
    icon: <IconDatabase size={18} stroke="#c84b11" />,
    points: [
      'Account information such as your name, email address, phone number, and profile role when you register as a buyer or seller.',
      'Listing information such as product names, prices, photos, descriptions, inventory details, and seller contact channels.',
      'Activity information such as searches, saved preferences, product views, seller reviews, and interactions you make on the platform.',
      'Technical information such as device, browser, IP-related usage signals, and general diagnostics used to improve reliability and security.',
      'Cookie and tracking information including browser cookies, web beacons, and similar technologies to collect information about your browsing behavior.',
      'Advertising data including information collected through third-party advertising services like Google AdSense to serve personalized advertisements.',
    ],
  },
  {
    title: 'How We Use Your Information',
    icon: <IconEye size={18} stroke="#c84b11" />,
    points: [
      'To operate BagSearch, display listings, support product discovery, and connect buyers with sellers across Nigeria.',
      'To personalize search results, location-aware browsing, featured recommendations, and marketplace experiences.',
      'To support communication, dispute handling, fraud prevention, service updates, and customer assistance.',
      'To analyze platform performance, fix bugs, improve features, and make the marketplace safer and easier to use.',
      'To serve personalized advertisements through Google AdSense and other advertising partners based on your interests and browsing behavior.',
      'To comply with legal obligations, protect against fraud, and maintain the security and integrity of our platform.',
    ],
  },
  {
    title: 'Sharing and Disclosure',
    icon: <IconMessage size={18} stroke="#c84b11" />,
    points: [
      'Seller-facing contact details may be shown or used where necessary to help buyers inquire about products or complete purchases.',
      'We may share limited information with service providers that help us run the platform, such as hosting, analytics, storage, or support tools.',
      'We may share information with third-party advertising partners, including Google, for the purpose of serving personalized advertisements.',
      'Google may use cookies and web beacons to collect information about your activities on this website and other websites to provide personalized ads.',
      'We may disclose information when required by law, to enforce our terms, or to protect users, BagSearch, or the public from harm.',
      'We do not treat personal information as something to be casually sold or exposed outside legitimate marketplace and advertising operations.',
    ],
  },
  {
    title: 'Google AdSense and Third-Party Advertising',
    icon: <IconEye size={18} stroke="#c84b11" />,
    points: [
      'BagSearch uses Google AdSense to display advertisements on our website.',
      'Google uses cookies and web beacons to collect information about your activities on this website and other websites to provide personalized ads.',
      'You can opt out of personalized advertising by visiting Google\'s Ads Settings or the NAI\'s opt-out page.',
      'Third-party vendors, including Google, use cookies to serve ads based on a user\'s prior visits to your website or other websites.',
      'Users can disable cookies through their browser settings, though this may affect the functionality of our website.',
      'We do not have access to or control over cookies placed by third-party advertisers.',
    ],
  },
  {
    title: 'Cookies and Tracking Technologies',
    icon: <IconShield size={18} stroke="#c84b11" />,
    points: [
      'We use cookies and similar tracking technologies to collect information about your browsing behavior and preferences.',
      'Cookies are small text files stored on your device that help us provide a better user experience and analyze website traffic.',
      'Essential cookies are required for the basic functionality of the website and cannot be disabled.',
      'Performance and analytics cookies help us understand how users interact with our website and improve our services.',
      'Advertising cookies are used to deliver personalized advertisements and measure the effectiveness of ad campaigns.',
      'You can manage your cookie preferences through your browser settings or by using the opt-out options provided by advertising partners.',
    ],
  },
  {
    title: 'Data Retention and Security',
    icon: <IconLock size={18} stroke="#c84b11" />,
    points: [
      'We keep information for as long as it is reasonably needed to run the marketplace, maintain records, resolve disputes, and meet legal obligations.',
      'We use practical administrative and technical safeguards, but no internet-based system can promise absolute security.',
      'Users are responsible for protecting their own login credentials and for using accurate, lawful information on the platform.',
      'If you believe your account or information has been compromised, you should contact support as soon as possible.',
      'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
      'Regular security reviews and updates are conducted to maintain the integrity of our data protection systems.',
    ],
  },
  {
    title: 'Your Rights and Choices',
    icon: <IconShield size={18} stroke="#c84b11" />,
    points: [
      'You have the right to access, update, or delete your personal information stored in our systems.',
      'You can opt out of data collection for personalized advertising by adjusting your browser settings or using third-party opt-out tools.',
      'You may request information about how we handle your personal data and inquire about our data processing practices.',
      'You can withdraw consent for data processing at any time, subject to legal and contractual obligations.',
      'You have the right to lodge a complaint with a supervisory authority if you believe our data processing practices violate applicable data protection laws.',
      'To exercise your rights, please contact us using the information provided in the Contact section of this policy.',
    ],
  },
  {
    title: 'User Responsibilities and Platform Policy',
    icon: <IconShield size={18} stroke="#c84b11" />,
    points: [
      'Sellers must only upload lawful, accurate, and non-misleading product information, prices, and images.',
      'Buyers and sellers must use the platform respectfully and must not abuse messaging, reviews, or discovery tools.',
      'Attempted fraud, impersonation, spam, unauthorized scraping, or misuse of platform content may lead to restriction or removal.',
      'BagSearch may update listings, accounts, or access rules where necessary to protect the quality and safety of the marketplace.',
      'Users must comply with all applicable laws and regulations when using the BagSearch platform.',
      'Any violation of these policies may result in account suspension or termination without prior notice.',
    ],
  },
  {
    title: 'Contact Information',
    icon: <IconMessage size={18} stroke="#c84b11" />,
    points: [
      'If you have questions about this Privacy Policy or our data practices, please contact us at info@bagsearch.shop.',
      'You may also reach us via our contact form available on the BagSearch website.',
      'We will respond to your inquiries within a reasonable timeframe, typically within 30 days.',
      'For privacy-related concerns, please include "Privacy Inquiry" in your email subject line.',
      'If you believe your privacy rights have been violated, you can also contact relevant data protection authorities.',
      'Our business address and additional contact details are available upon request.',
    ],
  },
  {
    title: 'Children\'s Privacy',
    icon: <IconShield size={18} stroke="#c84b11" />,
    points: [
      'BagSearch is not intended for children under the age of 13, and we do not knowingly collect personal information from children.',
      'If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.',
      'Parents and guardians should monitor their children\'s internet use and supervise any interactions on our platform.',
      'If you believe we have collected information from a child under 13, please contact us immediately so we can take appropriate action.',
      'We comply with applicable laws regarding children\'s privacy, including the Children\'s Online Privacy Protection Act (COPPA) where applicable.',
      'We encourage parents and guardians to educate their children about safe online practices.',
    ],
  },
];

export default function Policy() {
  const navigate = useNavigate();
  const effectiveDate = 'May 13, 2026';

  // SEO for policy page
  useSEO({
    title: 'Privacy & Policy | BagSearch Nigeria',
    description: 'Read BagSearch\'s privacy policy, terms of service, and marketplace guidelines. Learn how we handle your data, seller responsibilities, and platform rules.',
    keywords: 'privacy policy, terms of service, BagSearch rules, marketplace policy, data protection, seller guidelines, buyer rights',
    url: '/policy',
    type: 'WebPage',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy & Policy - BagSearch',
      description: 'BagSearch Nigeria policy page covering privacy, data handling, user responsibilities, and marketplace conduct.',
      dateModified: '2026-05-13',
      inLanguage: 'en-NG'
    }
  });

  return (
    <div className="policy-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;0,900;1,800&family=Manrope:wght@500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .policy-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(249,196,160,0.25), transparent 34%),
            linear-gradient(180deg, #fdf4ee 0%, #fff8f4 26%, #ffffff 100%);
          color: #1a0a00;
          font-family: 'Manrope', sans-serif;
        }

        .policy-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          height: 68px;
          padding: 0 clamp(16px, 5vw, 56px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #f7ece4;
          box-shadow: 0 1px 20px rgba(200,75,17,0.06);
        }

        .policy-brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          color: #1a0a00;
        }

        .policy-brand-text {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .policy-brand-text b {
          color: #c84b11;
        }

        .policy-nav-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .policy-btn,
        .policy-btn-outline {
          border: none;
          cursor: pointer;
          border-radius: 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          padding: 10px 16px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .policy-btn {
          color: white;
          background: linear-gradient(135deg, #c84b11, #f97316);
          box-shadow: 0 6px 18px rgba(200,75,17,0.28);
        }

        .policy-btn-outline {
          color: #c84b11;
          background: #fff5ee;
          border: 1.5px solid #f9c4a0;
        }

        .policy-btn:hover,
        .policy-btn-outline:hover {
          transform: translateY(-1px);
        }

        .policy-hero {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(44px, 8vw, 92px) clamp(16px, 5vw, 56px) 34px;
        }

        .policy-hero-card {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          background: linear-gradient(135deg, #fff7f1 0%, #fde8d8 100%);
          border: 1.5px solid #f9c4a0;
          box-shadow: 0 22px 70px rgba(200,75,17,0.1);
          padding: clamp(28px, 5vw, 56px);
        }

        .policy-hero-card::before {
          content: "";
          position: absolute;
          right: -80px;
          top: -60px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: rgba(200,75,17,0.08);
          filter: blur(4px);
        }

        .policy-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 999px;
          background: white;
          border: 1px solid #f9c4a0;
          color: #c84b11;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .policy-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.1rem, 5.8vw, 4.2rem);
          line-height: 1.06;
          letter-spacing: -0.03em;
          margin: 0 0 14px;
          max-width: 760px;
        }

        .policy-title em {
          color: #c84b11;
          font-style: italic;
        }

        .policy-subtitle {
          max-width: 700px;
          font-size: clamp(14px, 2vw, 16px);
          line-height: 1.75;
          color: #7b4b2e;
          font-weight: 500;
          margin-bottom: 22px;
        }

        .policy-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .policy-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #f0d9cc;
          font-size: 12px;
          font-weight: 700;
          color: #5c3317;
        }

        .policy-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 clamp(16px, 5vw, 56px) 80px;
        }

        .policy-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 24px;
          align-items: start;
          margin-bottom: 26px;
        }

        .policy-panel {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #f7ece4;
          box-shadow: 0 10px 32px rgba(26,10,0,0.04);
          padding: clamp(22px, 3vw, 32px);
        }

        .policy-panel h2 {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin: 0 0 10px;
        }

        .policy-panel p {
          color: #7b4b2e;
          font-size: 14px;
          line-height: 1.75;
          font-weight: 500;
          margin: 0;
        }

        .policy-summary-cards {
          display: grid;
          gap: 14px;
        }

        .policy-summary-card {
          border-radius: 18px;
          border: 1.5px solid #f7ece4;
          background: #fffdfa;
          padding: 18px;
        }

        .policy-summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fdf4ee;
          border: 1px solid #f9c4a0;
          margin-bottom: 12px;
        }

        .policy-summary-card h3 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .policy-summary-card p {
          margin: 0;
          color: #8c5a3d;
          font-size: 12px;
          line-height: 1.65;
          font-weight: 500;
        }

        .policy-section-list {
          display: grid;
          gap: 18px;
          margin-top: 26px;
        }

        .policy-section {
          background: white;
          border-radius: 22px;
          border: 1.5px solid #f7ece4;
          box-shadow: 0 8px 24px rgba(26,10,0,0.035);
          padding: clamp(20px, 3vw, 30px);
        }

        .policy-section-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .policy-section-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #fde8d8;
          border: 1px solid #f9c4a0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #c84b11;
        }

        .policy-section h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .policy-points {
          display: grid;
          gap: 10px;
        }

        .policy-point {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #fffaf7;
          border: 1px solid #f7ece4;
        }

        .policy-point-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c84b11, #f97316);
          margin-top: 8px;
          flex-shrink: 0;
        }

        .policy-point p {
          margin: 0;
          color: #6f4328;
          font-size: 13px;
          line-height: 1.7;
          font-weight: 500;
        }

        .policy-cta {
          margin-top: 26px;
          border-radius: 26px;
          padding: clamp(24px, 4vw, 36px);
          background: linear-gradient(135deg, #1a0a00 0%, #4a1a06 56%, #c84b11 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .policy-cta::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: radial-gradient(circle at 20% 40%, white 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .policy-cta h2 {
          position: relative;
          margin: 0 0 8px;
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.7rem, 4vw, 2.5rem);
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .policy-cta p {
          position: relative;
          max-width: 620px;
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          line-height: 1.75;
          font-weight: 500;
          margin: 0 0 20px;
        }

        .policy-cta-actions {
          position: relative;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .policy-footer {
          border-top: 1px solid #f3e4da;
          padding: 22px 16px 30px;
          text-align: center;
          font-size: 12px;
          color: #9a6348;
          font-weight: 600;
        }

        @media (max-width: 920px) {
          .policy-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .policy-nav {
            height: auto;
            padding-top: 12px;
            padding-bottom: 12px;
            gap: 12px;
            flex-direction: column;
            align-items: flex-start;
          }

          .policy-nav-actions {
            width: 100%;
          }

          .policy-btn,
          .policy-btn-outline {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>

      <nav className="policy-nav">
        <a
          href="#"
          className="policy-brand"
          onClick={(event) => {
            event.preventDefault();
            navigate('/products');
          }}
        >
          <LogoIcon size={36} />
          <span className="policy-brand-text">Bag<b>Search</b></span>
        </a>

        <div className="policy-nav-actions">
          <button className="policy-btn-outline" onClick={() => navigate('/contact')}>
            Contact Support
          </button>
          <button className="policy-btn" onClick={() => navigate('/products')}>
            Back to Marketplace
            <IconArrowRight size={13} stroke="white" />
          </button>
        </div>
      </nav>

      <section className="policy-hero">
        <div className="policy-hero-card">
          <div className="policy-kicker">
            <IconShield size={14} stroke="#c84b11" strokeWidth={2.3} />
            Privacy & Policy
          </div>

          <h1 className="policy-title">
            Built on <em>trust</em>, clarity, and responsible marketplace use
          </h1>

          <p className="policy-subtitle">
            This page explains, in straightforward language, how BagSearch handles information,
            supports buyers and sellers, and sets expectations for using the platform responsibly.
            It is meant to guide everyday use of the marketplace and may be updated as the platform grows.
          </p>

          <div className="policy-meta">
            <span className="policy-chip">
              <IconLock size={14} stroke="#15803d" />
              Effective Date: {effectiveDate}
            </span>
            <span className="policy-chip">
              <IconDatabase size={14} stroke="#c84b11" />
              Applies to buyers and sellers
            </span>
            <span className="policy-chip">
              <IconMessage size={14} stroke="#1d4ed8" />
              Questions? Contact BagSearch support
            </span>
          </div>
        </div>
      </section>

      <main className="policy-content">
        <div className="policy-grid">
          <section className="policy-panel">
            <h2>How to read this page</h2>
            <p>
              BagSearch is a product discovery and seller connection platform. Because people use the
              app to browse products, contact vendors, leave reviews, and manage accounts, some
              information has to be processed to keep the marketplace working smoothly. We aim to do
              that in a way that is careful, practical, and easy to understand.
            </p>
          </section>

          <aside className="policy-summary-cards">
            {summaryCards.map((card) => (
              <div key={card.title} className="policy-summary-card">
                <div className="policy-summary-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </aside>
        </div>

        <div className="policy-section-list">
          {policySections.map((section) => (
            <section key={section.title} className="policy-section">
              <div className="policy-section-head">
                <div className="policy-section-icon">{section.icon}</div>
                <h3>{section.title}</h3>
              </div>

              <div className="policy-points">
                {section.points.map((point) => (
                  <div key={point} className="policy-point">
                    <span className="policy-point-dot" />
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="policy-cta">
          <h2>Need help with privacy, listings, or account concerns?</h2>
          <p>
            If you want information corrected, need help understanding a policy, or want to report
            misuse on the platform, reach out to BagSearch support. We can review marketplace issues,
            seller concerns, and account-related questions.
          </p>

          <div className="policy-cta-actions">
            <button className="policy-btn" onClick={() => navigate('/contact')}>
              Contact Support
              <IconArrowRight size={13} stroke="white" />
            </button>
            <button className="policy-btn-outline" onClick={() => navigate('/products')}>
              Continue Shopping
            </button>
          </div>
        </section>
      </main>

      <footer className="policy-footer">
        BagSearch Nigeria Policy Page. This page is a platform guidance document and should not be treated as formal legal advice.
      </footer>
    </div>
  );
}
