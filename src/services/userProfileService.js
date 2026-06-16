import { supabase } from './api';

const normalizeText = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const buildUserProfileRecord = ({
  userId,
  fullName,
  email,
  phone,
  role,
}) => ({
  user_id: userId,
  full_name: normalizeText(fullName) || 'User',
  email: normalizeText(email),
  phone: normalizeText(phone),
  role: normalizeText(role) || 'buyer',
});

export const upsertUserProfile = async (profile) => {
  const record = buildUserProfileRecord(profile);
  try {
    const { error } = await supabase
      .from('users')
      .upsert(record, { onConflict: 'user_id' });
    // Non-fatal — the DB trigger handle_new_user may already create the row
    if (error) console.warn('upsertUserProfile:', error.message);
    return { error: null };
  } catch (e) {
    console.warn('upsertUserProfile exception:', e.message);
    return { error: null }; // never block registration
  }
};
