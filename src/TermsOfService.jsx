import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from './hooks/useSEO';

const C = {
  primary: '#c84b11',
  primaryLight: '#f97316',
  primaryBg: '#fde8d8',
  text: '#1a0a00',
  textMid: '#5c3317',
  textMuted: '#9a6348',
  border: '#f0d9cc',
};

function TermsOfService() {
  useSEO({
    title: 'Terms of Service | BagSearch',
    description: 'Read the BagSearch Terms of Service covering account use, buyer and seller responsibilities, prohibited activities, payments, and Nigerian governing law.',
    type: 'website',
    url: '/terms-of-service',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #c84b11, #f97316)', padding: '60px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.03em' }}>Terms of Service</h1>
        <p style={{ fontSize: 16, opacity: 0.9, fontWeight: 500 }}>Last updated: June 1, 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', boxShadow: '0 4px 20px rgba(200,75,17,0.08)' }}>
          
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              By accessing or using BagSearch (www.bagsearch.shop), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              By using BagSearch, you also acknowledge that you have read, understood, and agree to our <Link to="/policy" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>, which governs our data collection and use practices, including the use of cookies and advertising technologies.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              2. Description of Service
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch is Nigeria's premier marketplace for authentic luxury designer bags. Our platform connects:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong>Buyers:</strong> Individuals seeking to purchase authentic luxury bags from verified sellers</li>
              <li style={{ marginBottom: 8 }}><strong>Sellers:</strong> Verified vendors and individuals selling authentic luxury designer bags</li>
              <li><strong>Features:</strong> Product listings, visual search, seller verification, secure messaging, and location-based browsing</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              3. User Accounts
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              To use certain features of BagSearch, you must create an account. You agree to:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Provide accurate, complete, and current information during registration</li>
              <li style={{ marginBottom: 8 }}>Maintain and update your account information to keep it accurate</li>
              <li style={{ marginBottom: 8 }}>Keep your password secure and confidential</li>
              <li style={{ marginBottom: 8 }}>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <div style={{ background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>⚠️ Account Security</p>
              <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>
                You are responsible for maintaining the confidentiality of your account credentials. BagSearch cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              4. Seller Requirements
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              Sellers on BagSearch must:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong>Authenticity:</strong> Only sell authentic luxury designer bags. Counterfeit items are strictly prohibited</li>
              <li style={{ marginBottom: 8 }}><strong>Accurate Descriptions:</strong> Provide truthful and complete product descriptions, including condition, brand, and any defects</li>
              <li style={{ marginBottom: 8 }}><strong>Genuine Images:</strong> Use actual photos of the items being sold</li>
              <li style={{ marginBottom: 8 }}><strong>Pricing:</strong> Set fair and accurate prices for listed items</li>
              <li style={{ marginBottom: 8 }}><strong>Communication:</strong> Respond promptly and professionally to buyer inquiries</li>
              <li style={{ marginBottom: 8 }}><strong>Delivery:</strong> Fulfill orders in a timely manner as described in listings</li>
              <li><strong>Verification:</strong> Complete the seller verification process and maintain verified status</li>
            </ul>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginTop: 16 }}>
              Violation of these requirements may result in account suspension or permanent banning from the platform.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              5. Buyer Responsibilities
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              Buyers on BagSearch must:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Make genuine purchase intentions and not abuse the messaging system</li>
              <li style={{ marginBottom: 8 }}><strong>Payment:</strong> Complete payments promptly for committed purchases</li>
              <li style={{ marginBottom: 8 }}><strong>Communication:</strong> Communicate respectfully and professionally with sellers</li>
              <li style={{ marginBottom: 8 }}><strong>Verification:</strong> Verify item authenticity upon delivery and report any issues promptly</li>
              <li><strong>Feedback:</strong> Provide honest and fair feedback after transactions</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              6. Advertising and Third-Party Services
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch does not currently display third-party advertisements. If we introduce an advertising partner
              in the future, we will update this section — and our Privacy Policy — to describe what's shown and what
              data, if any, is shared with that partner before any ads go live.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              7. Cookies and Tracking Technologies
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              By using BagSearch, you consent to the use of cookies and similar tracking technologies as described in our Privacy Policy. These technologies are used for:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Essential site functionality and user authentication</li>
              <li style={{ marginBottom: 8 }}>Analytics and performance monitoring</li>
              <li style={{ marginBottom: 8 }}>Personalized advertising and ad targeting</li>
              <li style={{ marginBottom: 8 }}>Remembering user preferences and settings</li>
              <li>You can manage cookie preferences through your browser settings</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              8. Prohibited Activities
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              Users are strictly prohibited from:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Selling counterfeit, replica, or fake luxury items</li>
              <li style={{ marginBottom: 8 }}>Using false or misleading information in listings or communications</li>
              <li style={{ marginBottom: 8 }}>Engaging in fraudulent activities or scams</li>
              <li style={{ marginBottom: 8 }}>Attempting to gain unauthorized access to our systems or other users' accounts</li>
              <li style={{ marginBottom: 8 }}>Interfering with or disrupting our service or servers</li>
              <li style={{ marginBottom: 8 }}>Using the platform for illegal activities or prohibited transactions</li>
              <li style={{ marginBottom: 8 }}>Harassing, threatening, or abusing other users</li>
              <li><strong>Spam:</strong> Sending unsolicited messages or promotional content</li>
              <li><strong>Ad Abuse:</strong> Clicking on advertisements fraudulently or encouraging others to do so</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              7. Transactions and Payments
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch facilitates connections between buyers and sellers but does not directly process payments or guarantee transactions. Users should:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong>Payment Methods:</strong> Agree on secure payment methods directly with sellers</li>
              <li style={{ marginBottom: 8 }}><strong>Delivery:</strong> Confirm delivery arrangements and shipping details before payment</li>
              <li style={{ marginBottom: 8 }}><strong>Verification:</strong> Inspect items upon delivery before finalizing transactions</li>
              <li style={{ marginBottom: 8 }}><strong>Disputes:</strong> Attempt to resolve disputes directly with the other party first</li>
              <li><strong>Risk:</strong> Understand that BagSearch is not responsible for transaction disputes or payment issues</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              9. Transactions and Payments
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              All transactions between buyers and sellers are conducted directly between the parties. BagSearch acts as a marketplace platform and does not:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Process payments or hold funds on behalf of users</li>
              <li style={{ marginBottom: 8 }}>Guarantee transactions or provide payment protection</li>
              <li style={{ marginBottom: 8 }}>Intervolve in payment disputes between buyers and sellers</li>
              <li style={{ marginBottom: 8 }}>Offer refunds or chargebacks for completed transactions</li>
            </ul>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginTop: 12 }}>
              <strong>For Buyers:</strong> We recommend using secure payment methods and verifying seller reputation before making payments.
            </p>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7 }}>
              <strong>For Sellers:</strong> Clearly state your preferred payment methods and delivery terms in your listings.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              10. Intellectual Property
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              All content on BagSearch, including but not limited to text, graphics, logos, images, and software, is the property of BagSearch or its content suppliers and is protected by intellectual property laws.
            </p>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              Users retain ownership of their listings and uploaded content but grant BagSearch a license to display and distribute such content for the purpose of operating the platform.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              11. Privacy Policy
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              Your use of BagSearch is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information, including data collection for advertising purposes. Please review our Privacy Policy carefully.
            </p>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7 }}>
              <Link to="/policy" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
                View our Privacy Policy →
              </Link>
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              12. Disclaimer of Warranties
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch provides the platform "as is" and "as available" without any warranties, expressed or implied, including but not limited to:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}>Merchantability and fitness for a particular purpose</li>
              <li style={{ marginBottom: 8 }}>Non-infringement of third-party rights</li>
              <li style={{ marginBottom: 8 }}><strong>Authenticity:</strong> While we verify sellers, we cannot guarantee the authenticity of every item listed</li>
              <li style={{ marginBottom: 8 }}><strong>Availability:</strong> We cannot guarantee that items will remain available or that prices will not change</li>
              <li style={{ marginBottom: 8 }}>Accuracy of seller information or product descriptions</li>
              <li>Security of the platform or protection against all possible threats</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              13. Limitation of Liability
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              To the fullest extent permitted by law, BagSearch shall not be liable for:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Any indirect, incidental, special, or consequential damages</li>
              <li style={{ marginBottom: 8 }}>Loss of profits, data, or business opportunities</li>
              <li style={{ marginBottom: 8 }}>Transaction disputes between buyers and sellers</li>
              <li style={{ marginBottom: 8 }}>Issues arising from third-party services (payment processors, shipping providers, etc.)</li>
              <li style={{ marginBottom: 8 }}>Damages resulting from unauthorized access to your account</li>
              <li>Any damages exceeding the amount you paid, if any, to use our service</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              14. Account Termination
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch reserves the right to suspend or terminate your account at any time, with or without cause, with or without notice. Reasons for termination may include:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Violation of these Terms of Service</li>
              <li style={{ marginBottom: 8 }}>Selling counterfeit or prohibited items</li>
              <li style={{ marginBottom: 8 }}>Fraudulent activities or scams</li>
              <li style={{ marginBottom: 8 }}>Harassment or abuse of other users</li>
              <li style={{ marginBottom: 8 }}>Inactivity for an extended period</li>
              <li>Request by the account holder</li>
            </ul>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginTop: 16 }}>
              Upon termination, your right to use the service will immediately cease, and we may delete your account data and content.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              15. Modifications to Terms
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              BagSearch reserves the right to modify these terms at any time. We will notify users of significant changes by:
            </p>
            <ul style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}>Posting the updated terms on this page</li>
              <li style={{ marginBottom: 8 }}>Updating the "Last updated" date</li>
              <li>Sending email notifications to registered users</li>
            </ul>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginTop: 16 }}>
              Your continued use of the platform after modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              16. Governing Law
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7 }}>
              These Terms of Service shall be governed by and construed in accordance with the laws of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the Nigerian courts.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: '-0.02em' }}>
              17. Contact Information
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div style={{ background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
              <p style={{ fontSize: 15, color: C.text, marginBottom: 8 }}><strong>Email:</strong> info@bagsearch.shop</p>
              <p style={{ fontSize: 15, color: C.text, marginBottom: 8 }}><strong>Website:</strong> www.bagsearch.shop</p>
              <p style={{ fontSize: 15, color: C.text }}><strong>Location:</strong> Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default TermsOfService;