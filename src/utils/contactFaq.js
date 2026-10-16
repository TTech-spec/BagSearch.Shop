/**
 * FAQ shown on /contact. Also the source of that page's FAQPage structured
 * data, both in the app and in the prerendered HTML (scripts/prerender.mjs),
 * so the markup always matches the visible questions.
 */

export const CONTACT_FAQ = [
  { q:'How do I list my bag for sale?', a:'Register as a Seller → tap 👤 profile icon → Seller Dashboard → "Upload Product" → add photos, price, details → tap "Upload". Your bag goes live instantly!' },
  { q:'How do buyers contact me?', a:'Buyers tap the green 💬 WhatsApp button on your product card. It opens a pre-filled message with the product name and price. Make sure your WhatsApp number is correct in your seller profile.' },
  { q:'Is BagSearch free to use?', a:'Yes — browsing, buying and listing are free, and BagSearch takes no commission on sales. Sellers can optionally upgrade to a Pro (₦1,000/month) or Premium (₦5,000/month) plan to boost their listings in search.' },
  { q:'How does visual search work?', a:'Tap the 📷 camera icon in the search bar → upload a photo of any bag → our AI analyzes color, shape & pattern → shows you visually similar bags from sellers across Nigeria.' },
  { q:'How do I reset my password?', a:'Go to Login page → tap "Forgot Password" → enter your email → check inbox for reset link → click link → set new password. Check spam if you don\'t see the email.' },
  { q:'How do I delete a listing?', a:'Go to Seller Dashboard → "My Listings" → tap the ⋮ three-dot menu on the listing → select "Delete" → confirm. The listing is removed permanently.' },
];

export function faqSchema() {
  return {
    '@type': 'FAQPage',
    mainEntity: CONTACT_FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
