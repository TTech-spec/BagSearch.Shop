/**
 * useUploadLimit — Check if the current seller can upload (product or video)
 * based on their subscription plan.
 */
import { useState, useEffect, useContext } from 'react';
import { supabase } from '../services/api';
import { AuthContext } from '../context/AuthContext';

/**
 * @param {'product' | 'video'} uploadType
 * @returns {{ canUpload: boolean, plan: string, used: number, limit: number, loading: boolean, refresh: Function }}
 */
export function useUploadLimit(uploadType) {
  const { user } = useContext(AuthContext);
  const [state, setState] = useState({ canUpload: true, plan: 'free', used: 0, limit: -1, loading: true });

  const check = async () => {
    if (!user?.id) { setState(s => ({ ...s, loading: false })); return; }
    try {
      const { data, error } = await supabase.rpc('can_upload_today', {
        p_user_id: user.id,
        p_type: uploadType,
      });
      if (!error && data) {
        setState({
          canUpload: data.allowed,
          plan: data.plan,
          used: data.used,
          limit: data.limit,
          loading: false,
        });
      } else {
        // If function doesn't exist yet, allow uploads (graceful fallback)
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => { check(); }, [user?.id, uploadType]);

  return { ...state, refresh: check };
}

/**
 * Record an upload after successful creation.
 */
export async function recordUpload(userId, uploadType) {
  try {
    await supabase.from('daily_uploads').insert({
      user_id: userId,
      upload_type: uploadType,
      upload_date: new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    console.warn('Failed to record upload:', err);
  }
}
