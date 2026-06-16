import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermissionState,
  getPushSupportMessage,
  hasStoredPushSubscription,
  isPushSupported,
} from '../services/pushNotifications';

const C = {
  primary: '#c84b11',
  primaryBg: '#fde8d8',
  primaryBorder: '#f9c4a0',
  success: '#16a34a',
  successBg: '#dcfce7',
  successBorder: '#86efac',
  text: '#1a0a00',
  textMuted: '#9a6348',
  surface: '#ffffff',
};

export default function PushNotificationToggle() {
  const { user } = useContext(AuthContext);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmingEnable, setConfirmingEnable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      setLoading(true);
      const support = isPushSupported();

      if (!cancelled) {
        setSupported(support);
        setMessage(getPushSupportMessage());
      }

      if (!support || !user?.id) {
        if (!cancelled) {
          setEnabled(false);
          setLoading(false);
        }
        return;
      }

      try {
        const [permission, stored] = await Promise.all([
          getPushPermissionState(),
          hasStoredPushSubscription(user.id),
        ]);

        if (!cancelled) {
          setEnabled(permission === 'granted' && stored);
          if (!stored && permission === 'denied') {
            setMessage('Notifications are blocked in this browser. Re-enable them from browser settings.');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || 'Unable to load notification settings.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadState();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleEnable = async () => {
    if (!user?.id) return;
    setBusy(true);
    setMessage('');
    setConfirmingEnable(false);
    try {
      await enablePushNotifications(user.id);
      setEnabled(true);
      setMessage('Mobile alerts are active for this device.');
    } catch (error) {
      setEnabled(false);
      setMessage(error.message || 'Unable to enable mobile alerts.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!user?.id) return;
    setBusy(true);
    setMessage('');
    setConfirmingEnable(false);
    try {
      await disablePushNotifications(user.id);
      setEnabled(false);
      setMessage('Mobile alerts were turned off for this device.');
    } catch (error) {
      setMessage(error.message || 'Unable to disable mobile alerts.');
    } finally {
      setBusy(false);
    }
  };

  if (!user?.id) return null;

  const handleToggleClick = () => {
    if (enabled) {
      handleDisable();
      return;
    }

    setMessage('');
    setConfirmingEnable(true);
  };

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '14px',
      borderRadius: '12px',
      border: `1px solid ${enabled ? C.successBorder : C.primaryBorder}`,
      background: enabled ? C.successBg : C.primaryBg,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: C.text }}>
            Mobile Screen Alerts
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.textMuted, lineHeight: 1.4 }}>
            {enabled
              ? 'New activity can appear on this phone even when the app is closed.'
              : 'Turn on push notifications so new activity appears on the phone screen.'}
          </p>
        </div>
        <button
          type="button"
          disabled={loading || busy || !supported}
          onClick={handleToggleClick}
          style={{
            border: `1px solid ${enabled ? C.success : C.primary}`,
            background: C.surface,
            color: enabled ? C.success : C.primary,
            borderRadius: '999px',
            padding: '9px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: loading || busy || !supported ? 'not-allowed' : 'pointer',
            opacity: loading || busy || !supported ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Checking...' : busy ? 'Saving...' : enabled ? 'Turn Off' : 'Enable'}
        </button>
      </div>

      {confirmingEnable && !enabled && !loading && !busy && supported && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '10px',
          background: C.surface,
          border: `1px solid ${C.primaryBorder}`,
        }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: C.text }}>
            Do you want to turn on notifications for this device?
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textMuted, lineHeight: 1.4 }}>
            We will only ask the browser for permission after you confirm.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleEnable}
              style={{
                border: `1px solid ${C.primary}`,
                background: C.primary,
                color: '#fff',
                borderRadius: '999px',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Yes, turn on
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingEnable(false);
                setMessage('Notification setup cancelled.');
              }}
              style={{
                border: `1px solid ${C.primaryBorder}`,
                background: C.surface,
                color: C.textMuted,
                borderRadius: '999px',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {message && (
        <p style={{ margin: '10px 0 0', fontSize: '11px', color: C.textMuted, lineHeight: 1.4 }}>
          {message}
        </p>
      )}
    </div>
  );
}
