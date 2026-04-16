import { supabase } from './api';

const buildNotificationMessage = (buyerName, type) => {
  if (type === 'product_view') {
    return `${buyerName || 'Someone'} viewed your product`;
  }
  if (type === 'review') {
    return `${buyerName || 'Someone'} posted a review on your profile`;
  }
  return 'You have a new notification';
};

const mapProductViewToNotification = (view) => {
  const buyerName =
    view.buyer_name ||
    view.users?.full_name ||
    view.users?.email ||
    view.buyer_email ||
    'Someone';

  const buyerPhone = view.users?.phone || view.metadata?.buyer_phone || null;

  return {
    id: `product-view-${view.id}`,
    seller_id: view.seller_id,
    product_id: view.product_id,
    buyer_id: view.buyer_id,
    buyer_name: buyerName,
    buyer_email: view.buyer_email || view.users?.email || null,
    buyer_phone: buyerPhone,
    type: 'product_view',
    title: 'Product Viewed',
    message: buildNotificationMessage(buyerName, 'product_view'),
    is_read: false,
    created_at: view.viewed_at || view.created_at,
    metadata: {
      source: view.source,
      viewed_at: view.viewed_at || view.created_at,
      fallback: true,
      buyer_phone: buyerPhone,
    },
    products: view.products || null,
  };
};

const getSellerProductIds = async (sellerId) => {
  // #region agent log
  fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H3-H4',location:'src/services/notifications.js:getSellerProductIds:start',message:'Start resolving seller product ids',data:{sellerId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const byUser = await supabase
    .from('products')
    .select('id')
    .eq('user_id', sellerId);

  let rows = byUser.data || [];
  let error = byUser.error;

  if (error || rows.length === 0) {
    const bySeller = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);

    if (!bySeller.error) {
      rows = [...rows, ...(bySeller.data || [])];
      error = null;
    } else if (!error) {
      error = bySeller.error;
    }
  }

  if (error) {
    console.error('Error fetching seller products:', error);
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H3-H4',location:'src/services/notifications.js:getSellerProductIds:error',message:'Failed to resolve seller product ids',data:{sellerId,error:{message:error.message,code:error.code,details:error.details}},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return [];
  }

  const uniqueIds = [...new Set(rows.map((row) => row.id).filter(Boolean))];
  // #region agent log
  fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H3-H4',location:'src/services/notifications.js:getSellerProductIds:result',message:'Resolved seller product ids',data:{sellerId,byUserCount:(byUser.data||[]).length,bySellerCount:rows.length,uniqueCount:uniqueIds.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return uniqueIds;
};

const hydrateViewsWithBuyerProfiles = async (views) => {
  const buyerIds = [...new Set((views || []).map((view) => view.buyer_id).filter(Boolean))];

  if (!buyerIds.length) return views || [];

  const { data, error } = await supabase
    .from('users')
    .select('user_id,full_name,email,phone')
    .in('user_id', buyerIds);

  if (error) {
    console.error('Error fetching buyer profiles for notifications:', error);
    return views || [];
  }

  const profileMap = new Map((data || []).map((row) => [row.user_id, row]));

  return (views || []).map((view) => ({
    ...view,
    users: profileMap.get(view.buyer_id) || null,
  }));
};

const getFallbackProductViewNotifications = async (sellerId, limit = 50) => {
  const productIds = await getSellerProductIds(sellerId);

  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from('product_views')
    .select(`
      id,
      product_id,
      buyer_id,
      buyer_name,
      buyer_email,
      source,
      viewed_at,
      products:product_id (
        id,
        name,
        images,
        price
      )
    `)
    .in('product_id', productIds)
    .order('viewed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching fallback product view notifications:', error);
    return [];
  }

  const hydratedViews = await hydrateViewsWithBuyerProfiles(data || []);

  return hydratedViews.map((view) =>
    mapProductViewToNotification({ ...view, seller_id: sellerId })
  );
};

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
  // #region agent log
  fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H3',location:'src/services/notifications.js:getSellerNotifications:query',message:'Queried notifications table',data:{sellerId,unreadOnly:!!unreadOnly,type:type||null,limit,offset,rows:(data||[]).length,error:error?{message:error.message,code:error.code,details:error.details}:null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return getFallbackProductViewNotifications(sellerId, limit);
  }

  if (!data?.length) {
    return getFallbackProductViewNotifications(sellerId, limit);
  }

  return data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  if (String(notificationId).startsWith('product-view-')) {
    return { id: notificationId, is_read: true, fallback: true };
  }

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
    return [];
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
  // #region agent log
  fetch('http://127.0.0.1:7528/ingest/c73351d5-2de0-4b35-8a7b-a781b1fe77c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'25b601'},body:JSON.stringify({sessionId:'25b601',runId:'initial',hypothesisId:'H3-H5',location:'src/services/notifications.js:getUnreadNotificationCount:query',message:'Queried unread notifications count',data:{sellerId,count:count||0,error:error?{message:error.message,code:error.code,details:error.details}:null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error) {
    console.error('Error getting unread notification count:', error);
    const fallbackNotifications = await getFallbackProductViewNotifications(sellerId, 100);
    return fallbackNotifications.length;
  }

  if ((count || 0) === 0) {
    const fallbackNotifications = await getFallbackProductViewNotifications(sellerId, 100);
    return fallbackNotifications.length;
  }

  return count || 0;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  // Handle fallback notifications (from product_views table)
  if (String(notificationId).startsWith('product-view-')) {
    console.log('Cannot delete fallback notification:', notificationId);
    return { success: false, message: 'Cannot delete fallback notifications' };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }

  return { success: true };
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
    case 'seller_review':
    case 'review':
      return {
        title: notification.title || 'New Review',
        message: notification.message || `${notification.buyer_name || 'Someone'} left you a review`,
        icon: 'star',
        color: '#f59e0b'
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
