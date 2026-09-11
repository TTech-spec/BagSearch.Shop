/**
 * GoogleCustomerReviews — Renders the Google Customer Reviews opt-in survey
 * after a buyer contacts a seller via WhatsApp.
 *
 * Since BagSearch transactions happen on WhatsApp (no checkout page),
 * we trigger the survey in a modal after the WhatsApp window opens.
 */
import { useEffect, useRef, useState } from 'react';

const MERCHANT_ID = 5837997601;

/**
 * Trigger the Google Customer Reviews opt-in survey.
 *
 * @param {Object} opts
 * @param {string} opts.email        – buyer email (from auth)
 * @param {string} opts.productName  – product name for reference
 * @param {string} opts.productId    – product ID used as order_id
 */
export function triggerGoogleReviewSurvey({ email, productName, productId }) {
  if (!window.gapi?.surveyoptin?.render) return;

  // Estimated delivery: 7 days from now (standard for Nigerian logistics)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const estDelivery = deliveryDate.toISOString().split('T')[0];

  // Generate a unique order reference
  const orderId = `BS-${productId}-${Date.now()}`;

  try {
    window.gapi.surveyoptin.render({
      merchant_id: MERCHANT_ID,
      order_id: orderId,
      email: email || '',
      delivery_country: 'NG',
      estimated_delivery_date: estDelivery,
    });
  } catch (err) {
    console.warn('Google Customer Reviews opt-in failed:', err);
  }
}

/**
 * Google Customer Reviews badge component.
 * Loads the official merchant widget script and renders the seller rating badge.
 */
export function GoogleReviewsBadge() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // Load the merchant widget script
    const script = document.createElement('script');
    script.id = 'merchantWidgetScript';
    script.src = 'https://www.gstatic.com/shopping/merchant/merchantwidget.js';
    script.defer = true;
    script.addEventListener('load', () => {
      try {
        window.merchantwidget?.start({
          merchant_id: MERCHANT_ID,
          position: 'BOTTOM_RIGHT',
          region: 'NG',
        });
      } catch (err) {
        console.warn('Google merchant widget failed:', err);
      }
    });
    document.body.appendChild(script);
  }, []);

  return null;
}
