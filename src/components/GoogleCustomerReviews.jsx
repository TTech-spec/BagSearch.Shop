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
 * Shows the Google badge on the site for trust signals.
 */
export function GoogleReviewsBadge() {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.gapi?.surveyoptin) return;
    // Badge renders automatically when platform.js loads with the merchant_id
  }, []);

  return (
    <div
      ref={ref}
      className="g-customer-reviews"
      data-merchant-id={MERCHANT_ID}
      data-position="BOTTOM_RIGHT"
    />
  );
}
