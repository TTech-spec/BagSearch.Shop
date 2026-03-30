import { supabase } from './api';

// Get notifications for a seller
export const getSellerNotifications = async (sellerId, options = {}) => {
  const { 
    limit = 50, 
    offset = 0, 
    unreadOnly = false,
    type = null 
  } = options;

  let query = supabase
    .from('notifications')
    .select(`
      *,
      products:product_id (
        id,
        name,
        images,
        price
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  return data;
};

// Mark all notifications as read for a seller
export const markAllNotificationsAsRead = async (sellerId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('seller_id', sellerId)
    .eq('is_read', false)
    .select();

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }

  return data;
};

// Get unread notification count
export const getUnreadNotificationCount = async (sellerId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }

  return count || 0;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }

  return true;
};

// Subscribe to real-time notifications for a seller
export const subscribeToNotifications = (sellerId, callback) => {
  const subscription = supabase
    .channel(`notifications:${sellerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `seller_id=eq.${sellerId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

// Format notification message based on type
export const formatNotificationMessage = (notification) => {
  switch (notification.type) {
    case 'product_view':
      return {
        title: notification.title || 'Product Viewed',
        message: notification.message || `${notification.buyer_name || 'Someone'} viewed your product`,
        icon: 'visibility',
        color: '#3b82f6'
      };
    case 'product_inquiry':
      return {
        title: notification.title || 'Product Inquiry',
        message: notification.message || `${notification.buyer_name || 'Someone'} inquired about your product`,
        icon: 'chat',
        color: '#10b981'
      };
    case 'sale':
      return {
        title: notification.title || 'Sale Completed',
        message: notification.message || `Your product was sold`,
        icon: 'shopping_bag',
        color: '#22c55e'
      };
    default:
      return {
        title: notification.title || 'Notification',
        message: notification.message || 'You have a new notification',
        icon: 'notifications',
        color: '#6b7280'
      };
  }
};

// Format relative time
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
};
