// COPY THIS CONTENT and REPLACE the BASE_URL line in your sellerProfile.jsx file
// Find line 274 and replace:
// OLD: const BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/seller/` : 'https://bagsearch.ng/seller/';
// NEW: const BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/vendor/` : 'https://bagsearch.ng/vendor/';

// The fix changes URL from /seller/ to /vendor/ to match the route in App.jsx
// This will make profile URLs work correctly and take users to vendor details page

// Instructions:
// 1. Open sellerProfile.jsx
// 2. Find line 274 (around line 274)
// 3. Replace the BASE_URL line with the new version above
// 4. Save the file
// 5. Test the profile URLs

// After fix:
// - Profile URLs will be: https://bagsearch.ng/vendor/john-doe
// - Will correctly route to vendor details page
// - Will show seller profile and their products
