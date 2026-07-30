# Mobile Push Notification Setup

This project now includes the code for browser push notifications that can appear on a user's mobile screen.

## Required environment variables

Frontend `.env`:

```env
VITE_WEB_PUSH_PUBLIC_KEY=your_public_vapid_key
```

Supabase Edge Function secrets:

```bash
supabase secrets set WEB_PUSH_PUBLIC_KEY=your_public_vapid_key
supabase secrets set WEB_PUSH_PRIVATE_KEY=your_private_vapid_key
supabase secrets set WEB_PUSH_VAPID_SUBJECT=mailto:info@bagsearch.shop
supabase secrets set PUSH_TRIGGER_SECRET=your_random_secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

## Deploy steps

1. Run `setup_push_notifications.sql` in Supabase SQL editor.
2. Deploy the Edge Function:

```bash
supabase functions deploy send-push-notification
```

3. Replace placeholders inside `trigger_push_notifications.sql`.
4. Run `trigger_push_notifications.sql` in Supabase SQL editor.

## Mobile behavior

- Android Chrome: users can enable directly.
- iPhone Safari: users should install the PWA to the home screen first, then enable notifications from the installed app.
