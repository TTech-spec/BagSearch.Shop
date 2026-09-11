/**
 * FlutterwavePayment — Inline checkout via Flutterwave
 *
 * Loads Flutterwave's inline.js and provides a `payWithFlutterwave` helper
 * that opens the payment modal. Works for both product purchases (buyers)
 * and subscription payments (sellers).
 */
import { useEffect, useCallback, useRef } from 'react';

const FLW_PUBLIC_KEY = 'FLWPUBK-7e4afdcd444955fea510c96d737a5f37-X';
const SCRIPT_URL = 'https://checkout.flutterwave.com/v3.js';

// ─── Script loader (singleton) ────────────────────────────────────────────────
let scriptLoaded = false;
let scriptLoading = false;
const loadQueue = [];

function loadFlutterwaveScript() {
  return new Promise((resolve) => {
    if (scriptLoaded && window.FlutterwaveCheckout) { resolve(); return; }
    loadQueue.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => { scriptLoaded = true; loadQueue.forEach(fn => fn()); loadQueue.length = 0; };
    s.onerror = () => { scriptLoading = false; loadQueue.forEach(fn => fn()); loadQueue.length = 0; };
    document.head.appendChild(s);
  });
}

/**
 * Pay for a product (buyer checkout).
 *
 * @param {Object} opts
 * @param {number} opts.amount       – price in Naira
 * @param {string} opts.email        – buyer email
 * @param {string} opts.name         – buyer name
 * @param {string} opts.phone        – buyer phone (optional)
 * @param {string} opts.productName  – product title
 * @param {string} opts.productId    – product ID
 * @param {string} opts.sellerName   – seller name
 * @param {Function} opts.onSuccess  – called with Flutterwave response on success
 * @param {Function} opts.onClose    – called when modal is closed without paying
 */
export async function payForProduct({
  amount, email, name, phone = '', productName, productId, sellerName,
  onSuccess, onClose,
}) {
  await loadFlutterwaveScript();
  if (!window.FlutterwaveCheckout) {
    alert('Payment system is loading. Please try again.');
    return;
  }

  const txRef = `BS-${productId}-${Date.now()}`;

  window.FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    payment_options: 'card,banktransfer,ussd,mobilemoney',
    customer: { email, name, phone_number: phone },
    customizations: {
      title: 'BagSearch',
      description: `Payment for ${productName}`,
      logo: 'https://www.bagsearch.shop/logo192.png',
    },
    meta: {
      product_id: productId,
      product_name: productName,
      seller_name: sellerName,
      source: 'bagsearch_checkout',
    },
    callback: (response) => {
      if (response.status === 'successful' || response.status === 'completed') {
        onSuccess?.(response);
      }
    },
    onclose: () => { onClose?.(); },
  });
}

/**
 * Pay for a seller subscription plan.
 *
 * @param {Object} opts
 * @param {string} opts.plan        – 'pro' | 'premium'
 * @param {number} opts.amount      – plan price in Naira
 * @param {string} opts.email       – seller email
 * @param {string} opts.name        – seller name
 * @param {string} opts.userId      – seller user ID
 * @param {Function} opts.onSuccess
 * @param {Function} opts.onClose
 */
export async function payForSubscription({
  plan, amount, email, name, userId,
  onSuccess, onClose,
}) {
  await loadFlutterwaveScript();
  if (!window.FlutterwaveCheckout) {
    alert('Payment system is loading. Please try again.');
    return;
  }

  const txRef = `BS-SUB-${plan}-${userId}-${Date.now()}`;

  window.FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    payment_options: 'card,banktransfer,ussd',
    customer: { email, name },
    customizations: {
      title: 'BagSearch Seller Plan',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — Monthly Subscription`,
      logo: 'https://www.bagsearch.shop/logo192.png',
    },
    meta: {
      plan,
      user_id: userId,
      source: 'bagsearch_subscription',
    },
    callback: (response) => {
      if (response.status === 'successful' || response.status === 'completed') {
        onSuccess?.(response);
      }
    },
    onclose: () => { onClose?.(); },
  });
}

/**
 * Hook to preload the Flutterwave script on mount.
 */
export function useFlutterwavePreload() {
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; loadFlutterwaveScript(); }
  }, []);
}
