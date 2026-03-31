# Seller Notification System Setup Guide

## Overview
This notification system allows sellers to receive real-time notifications when buyers view their products. Sellers can see these notifications in their dashboard by clicking the notification icon.

## Features
- ✅ Automatic notification creation when buyers view products
- ✅ Real-time notification updates in seller dashboard
- ✅ Unread notification count badge
- ✅ Mark notifications as read/unread
- ✅ Click notifications to navigate to product details
- ✅ Responsive design for mobile and desktop

## Setup Instructions

### 1. Database Setup

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Setup Script**
   - Copy the contents of `setup_notifications.sql`
   - Paste it in the SQL Editor
   - Click "Run" to execute the script

3. **Verify Setup**
   - The script will create the `notifications` table
   - Set up proper RLS policies
   - Create the trigger function for automatic notifications
   - You should see "Notifications table setup complete!" as confirmation

### 2. Frontend Integration

The notification system is already integrated into your application:

- **Notification Service**: `src/services/notifications.js`
- **Notification Component**: `src/components/NotificationsDropdown.jsx`
- **Seller Dashboard**: Already updated in `src/sellerProfile.jsx`
- **Product View Tracking**: Already implemented in `src/productDetail.jsx`

### 3. Testing the System

#### Test Product View Notifications:

1. **Create Test Products**
   - Log in as a seller and upload some products
   - Make sure products have proper images and details

2. **Test as a Buyer**
   - Log out or use a different browser/incognito window
   - Navigate to a seller's product detail page
   - The system will automatically log the view

3. **Check Seller Notifications**
   - Log back in as the seller
   - Go to your seller dashboard (`/seller-profile`)
   - You should see a notification icon with a red badge showing unread count
   - Click the notification icon to see the dropdown

#### Expected Behavior:

- **Immediate Notifications**: Notifications appear in real-time when buyers view products
- **Unread Badge**: Red badge shows count of unread notifications
- **Notification Details**: Shows buyer name, product info, and time
- **Click Navigation**: Clicking a notification takes you to the product page
- **Mark as Read**: Notifications are marked as read when clicked
- **"Mark All as Read"**: Bulk action to clear all notifications

### 4. Troubleshooting

#### Common Issues:

1. **No Notifications Appearing**
   - Verify the database setup was completed successfully
   - Check Supabase logs for any errors
   - Ensure the `product_views` table exists and has data

2. **Permission Errors**
   - Make sure RLS policies are properly configured
   - Check that users are authenticated when accessing notifications

3. **Real-time Updates Not Working**
   - Verify Supabase real-time is enabled for your project
   - Check browser console for WebSocket connection errors

4. **Styling Issues**
   - Ensure Material Symbols font is loaded
   - Check CSS custom properties are properly defined

#### Debug Queries:

```sql
-- Check if notifications are being created
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 10;

-- Check product views
SELECT * FROM public.product_views ORDER BY viewed_at DESC LIMIT 10;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

## Technical Details

### Database Schema

**notifications table:**
- `id`: UUID primary key
- `seller_id`: References the seller who receives the notification
- `product_id`: References the viewed product
- `buyer_id`: References the buyer who viewed (can be null)
- `buyer_name`: Buyer's display name
- `type`: Notification type ('product_view', etc.)
- `title`: Notification title
- `message`: Notification message
- `is_read`: Read status
- `metadata`: Additional data (JSON)
- `created_at`: Timestamp

### Trigger System

The system uses a PostgreSQL trigger that automatically creates notifications when:
- A new row is inserted into `product_views`
- The viewer is not the product owner
- The product exists and has a valid seller

### Frontend Components

1. **NotificationsDropdown**: Main notification UI component
2. **Notification Service**: API layer for Supabase operations
3. **Real-time Subscription**: Live updates using Supabase Realtime

## Future Enhancements

- Email notifications for important events
- Push notifications for mobile users
- Notification preferences and settings
- Bulk notification actions
- Notification history and analytics
- Different notification types (inquiries, purchases, etc.)

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Verify Supabase connection and permissions
3. Review the SQL setup script execution
4. Test with different user roles (seller vs buyer)

The notification system is now ready to use! 🎉
