import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import PushNotificationToggle from './PushNotificationToggle';
import { 
  getSellerNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  formatNotificationMessage,
  formatRelativeTime,
  subscribeToNotifications,
  deleteNotification
} from '../services/notifications';

const C = {
  primary: '#c84b11',
  primaryLight: '#f97316',
  primaryBg: '#fde8d8',
  primaryPale: '#fdf4ee',
  primaryBorder: '#f9c4a0',
  accent: '#ea580c',
  surface: '#ffffff',
  surfaceDim: '#fdf8f5',
  border: '#f0d9cc',
  borderLight: '#f7ece4',
  text: '#1a0a00',
  textMid: '#5c3317',
  textMuted: '#9a6348',
  textFaint: '#c4957a',
  danger: '#dc2626',
  success: '#16a34a',
};

// Icon component
const Icon = ({ name, size = 20, style = {} }) => (
  <span style={{
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: "normal",
    fontStyle: "normal",
    fontSize: size,
    lineHeight: 1,
    display: "inline-block",
    textTransform: "none",
    letterSpacing: "normal",
    whiteSpace: "nowrap",
    direction: "ltr",
    fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
    ...style
  }}>
    {name}
  </span>
);

export default function NotificationsDropdown() {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    if (!user?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H5',location:'src/components/NotificationsDropdown.jsx:fetchNotifications:no-user',message:'Skipped notification fetch because user is missing',data:{hasUser:!!user,userId:user?.id||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }
    
    try {
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H5',location:'src/components/NotificationsDropdown.jsx:fetchNotifications:start',message:'Fetching seller notifications',data:{userId:user.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const [notificationsData, unreadData] = await Promise.all([
        getSellerNotifications(user.id, { limit: 20 }),
        getUnreadNotificationCount(user.id)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const subscription = subscribeToNotifications(user.id, (payload) => {
      console.log('Real-time notification:', payload);
      fetchNotifications(); // Refresh notifications when there's a change
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
        // Update unread count if the notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        console.log(result.message);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    // You can add navigation logic here if needed
    // For example, navigate to product detail page
    if (notification.products?.id) {
      // Navigate to product detail
      window.location.href = `/products/${notification.products.id}`;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceDim}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Icon 
          name="notifications" 
          size={24} 
          style={{ color: C.textMid }} 
        />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: C.danger,
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notif-dropdown" style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          width: 'min(380px, calc(100vw - 24px))',
          maxHeight: 'min(480px, calc(100vh - 120px))',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.surfaceDim,
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: C.text,
            }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.primary,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.primaryBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Mark all as read
              </button>
            )}
          </div>

          <PushNotificationToggle />

          {/* Notifications List */}
          <div style={{
            maxHeight: '360px',
            overflowY: 'auto',
          }}>
            {loading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: C.textMuted,
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${C.border}`,
                  borderTopColor: C.primary,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: C.textMuted,
              }}>
                <Icon name="notifications_off" size={48} style={{ color: C.textFaint, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const formatted = formatNotificationMessage(notification);
                const isUnread = !notification.is_read;
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: `1px solid ${C.borderLight}`,
                      cursor: 'pointer',
                      background: isUnread ? C.primaryPale : C.surface,
                      transition: 'background-color 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? C.primaryBg : C.surfaceDim;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? C.primaryPale : C.surface;
                    }}
                  >
                    {/* Unread indicator */}
                    {isUnread && (
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: C.primary,
                      }} />
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: `${formatted.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon name={formatted.icon} size={20} style={{ color: formatted.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                          gap: '8px',
                        }}>
                          <h4 style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: '600',
                            color: C.text,
                            lineHeight: 1.3,
                          }}>
                            {formatted.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px',
                              color: C.textMuted,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}>
                              {formatRelativeTime(notification.created_at)}
                            </span>
                            {/* Delete button - only for real notifications, not fallback */}
                            {!notification.id?.startsWith('product-view-') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: C.textMuted,
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = C.danger;
                                  e.currentTarget.style.backgroundColor = `${C.danger}15`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = C.textMuted;
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Delete notification"
                              >
                                <Icon name="close" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: C.textMid,
                          lineHeight: 1.4,
                        }}>
                          {formatted.message}
                        </p>

                        {/* Buyer contact details */}
                        {notification.buyer_name && (
                          <div style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: C.textMuted,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: '600' }}>Buyer:</span>
                              <span>{notification.buyer_name}</span>
                            </div>
                            {notification.buyer_email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span style={{ fontWeight: '600' }}>Email:</span>
                                <span>{notification.buyer_email}</span>
                              </div>
                            )}
                            {notification.buyer_phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span style={{ fontWeight: '600' }}>Phone:</span>
                                <span>{notification.buyer_phone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Product info if available */}
                        {notification.products && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: C.surface,
                            borderRadius: '6px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}>
                            {notification.products.images?.[0] && (
                              <img
                                src={notification.products.images[0]}
                                alt={notification.products.name}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: '600',
                                color: C.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {notification.products.name}
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '11px',
                                color: C.textMuted,
                              }}>
                                {notification.products.price}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 520px) {
          .notif-dropdown {
            position: fixed !important;
            top: 76px !important;
            left: 12px !important;
            right: 12px !important;
            margin-top: 0 !important;
            width: auto !important;
            max-height: calc(100vh - 100px) !important;
          }
        }
      `}</style>
    </div>
  );
}
