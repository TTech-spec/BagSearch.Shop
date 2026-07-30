# Troubleshooting Seller Notifications

## 🚨 Issue: Not seeing buyer views in seller dashboard

If you're not seeing notifications when buyers view your products, follow these steps to diagnose and fix the issue.

## 🔍 **Step 1: Verify Database Setup**

### Run the Debug Script
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `debug_notifications.sql`
4. Click **Run**

### What to Look For:
- ✅ `notifications` table exists
- ✅ `product_views` table exists  
- ✅ Trigger `on_product_view_create_notification` exists
- ✅ Function `create_product_view_notification` exists
- ✅ Recent product_views are being logged
- ✅ Recent notifications are being created

## 🔧 **Step 2: Common Issues & Fixes**

### Issue 1: Database Not Set Up
**Symptoms**: Tables don't exist, no notifications being created
**Fix**: 
```sql
-- Run the complete setup script
-- Copy contents of setup_notifications.sql and run in Supabase SQL Editor
```

### Issue 2: Trigger Not Working
**Symptoms**: product_views exist but no notifications
**Fix**: Recreate the trigger
```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_product_view_create_notification ON public.product_views;
-- Then run setup_notifications.sql again
```

### Issue 3: RLS Policies Blocking Access
**Symptoms**: Notifications exist but can't be accessed
**Fix**: Check RLS policies
```sql
-- Verify policies allow sellers to see their notifications
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Issue 4: Product View Tracking Not Working
**Symptoms**: No product_views being created
**Check**: Verify productDetail.jsx is tracking views
- Look for the `useEffect` that logs product views
- Check browser console for errors

## 🧪 **Step 3: Manual Testing**

### Test Product View Tracking:
1. **Open your app in incognito window** (to act as a buyer)
2. **Navigate to a product page** you own as a seller
3. **Check browser console** for any errors
4. **Wait 5-10 seconds** for notification to appear
5. **Check seller dashboard** for the notification

### Test Database Directly:
1. **Get a product ID**:
   ```sql
   SELECT id, name FROM products LIMIT 1;
   ```
2. **Manually insert a view**:
   ```sql
   INSERT INTO product_views (product_id, buyer_name, source) 
   VALUES ('YOUR_PRODUCT_ID', 'Test Buyer', 'manual_test');
   ```
3. **Check for notification**:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
   ```

## 🔧 **Step 4: Frontend Debugging**

### Check Browser Console:
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for any JavaScript errors
4. Check for Supabase connection errors

### Verify Notification Component:
1. **Check if NotificationsDropdown is rendering**
2. **Verify API calls are being made**:
   - Open Network tab
   - Look for requests to `/rest/v1/notifications`
3. **Check real-time subscription**:
   - Look for WebSocket connections to Supabase

## 📋 **Step 5: Environment Configuration**

### Check Environment Variables:
Make sure your `.env` file has the correct Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Verify Supabase Realtime:
1. Go to **Supabase Dashboard**
2. Navigate to **Settings > API**
3. Ensure **Realtime** is enabled
4. Check your **API keys** are correct

## 🚀 **Step 6: Quick Fix Script**

If nothing else works, run this complete reset:

```sql
-- Complete reset and recreation
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP FUNCTION IF EXISTS public.create_product_view_notification() CASCADE;
DROP TRIGGER IF EXISTS public.on_product_view_create_notification ON public.product_views;

-- Then run setup_notifications.sql completely
```

## 📞 **Still Having Issues?**

### Check These Specific Areas:

1. **Product Detail Page**:
   - Is the `useEffect` for view logging running?
   - Are there any JavaScript errors?
   - Is the `supabase.from('product_views').insert()` call working?

2. **Seller Dashboard**:
   - Is the NotificationsDropdown component rendering?
   - Are API calls to fetch notifications working?
   - Is the real-time subscription connecting?

3. **Database**:
   - Are product_views being created?
   - Is the trigger firing?
   - Are notifications being created?

4. **Permissions**:
   - Does the seller have permission to view notifications?
   - Are RLS policies correctly configured?

## 🎯 **Expected Behavior**

When working correctly:
1. **Buyer views product** → `product_views` row created
2. **Trigger fires** → `notifications` row created  
3. **Seller dashboard** shows notification icon with badge
4. **Click notification** → navigates to product page
5. **Real-time updates** → notification appears instantly

Run the debug script first, then let me know what you find!
