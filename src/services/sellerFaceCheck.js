import { supabase } from './api';

// Seller face check: the selfie taken at sign-up is kept on the device for a
// moment (the new account may not be signed in yet), then uploaded to a
// private bucket as soon as the seller has a session. An admin reviews it in
// the Supabase dashboard (table: seller_face_checks, bucket: seller-selfies).
const KEY = 'bs-pending-seller-selfie';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v?.dataUrl || Date.now() - (v.at || 0) > MAX_AGE_MS) { localStorage.removeItem(KEY); return null; }
    return v;
  } catch { return null; }
};

export function hasPendingSelfie() {
  return !!read();
}

/** Keep the selfie until it can be uploaded. `email` ties it to the account being created (null for Google sign-up). */
export function savePendingSelfie(dataUrl, email) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ dataUrl, email: email ? email.trim().toLowerCase() : null, at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearPendingSelfie() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Upload the waiting selfie for this signed-in seller. Safe to call on every
 * login: it does nothing when there is no selfie waiting, the user is not a
 * seller, or the selfie belongs to a different email.
 */
export async function uploadPendingSelfie(user) {
  const pending = read();
  if (!pending || !user?.id) return { uploaded: false };
  if (user.user_metadata?.role !== 'seller') return { uploaded: false };
  if (pending.email && user.email && pending.email !== user.email.toLowerCase()) return { uploaded: false };

  try {
    const blob = await (await fetch(pending.dataUrl)).blob();
    const path = `${user.id}/selfie-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('seller-selfies').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;

    const { error: rowErr } = await supabase.from('seller_face_checks').upsert({
      seller_id: user.id,
      selfie_path: path,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      rejection_reason: null,
    }, { onConflict: 'seller_id' });
    if (rowErr) throw rowErr;

    clearPendingSelfie();
    return { uploaded: true };
  } catch (e) {
    // Keep it for the next login rather than losing it.
    console.warn('[sellerFaceCheck] upload failed, will retry on next login:', e?.message);
    return { uploaded: false, error: e };
  }
}
