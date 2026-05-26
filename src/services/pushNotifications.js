import { supabase } from './api';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function getDeviceLabel() {
  const ua = navigator.userAgent || 'unknown-agent';
  const platform = navigator.platform || 'unknown-platform';
  return `${platform} | ${ua}`.slice(0, 255);
}

export function isPushSupported() {
  return Boolean(
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushSupportMessage() {
  if (!isPushSupported()) {
    return 'This browser does not support mobile push notifications.';
  }

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIos && !window.matchMedia('(display-mode: standalone)').matches) {
    return 'On iPhone, add this app to the home screen in Safari before enabling notifications.';
  }

  return '';
}

export async function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function upsertPushSubscription(userId, subscription) {
  const subscriptionJson = subscription.toJSON();
  const { endpoint, keys = {} } = subscriptionJson;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      device_label: getDeviceLabel(),
      user_agent: navigator.userAgent || null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    }, {
      onConflict: 'endpoint',
    });

  if (error) {
    throw error;
  }
}

export async function enablePushNotifications(userId) {
  if (!userId) {
    throw new Error('You must be signed in to enable notifications.');
  }

  if (!isPushSupported()) {
    throw new Error(getPushSupportMessage() || 'Push notifications are not supported on this device.');
  }

  if (!PUBLIC_VAPID_KEY) {
    throw new Error('Missing VITE_WEB_PUSH_PUBLIC_KEY in your environment.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
  });

  await upsertPushSubscription(userId, subscription);
  return subscription;
}

export async function disablePushNotifications(userId) {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    if (userId && endpoint) {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        throw error;
      }
    }
  }
}

export async function hasStoredPushSubscription(userId) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data?.length);
}
