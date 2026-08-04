-- Daily birthday notifications for sellers who filled in date_of_birth at
-- signup. Inserting into public.notifications automatically triggers a push
-- notification via the existing notifications_send_push_trigger (see
-- trigger_push_notifications.sql) — no new push plumbing needed here.

CREATE OR REPLACE FUNCTION public.send_daily_birthday_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (seller_id, type, title, message, metadata)
  SELECT
    u.user_id,
    'birthday',
    'Happy Birthday! 🎉',
    format('Happy birthday, %s! The whole BagSearch team is wishing you a great one. 🎂',
      COALESCE(NULLIF(TRIM(SPLIT_PART(u.full_name, ' ', 1)), ''), 'friend')),
    jsonb_build_object('celebrated_on', CURRENT_DATE)
  FROM public.users u
  WHERE u.date_of_birth IS NOT NULL
    AND TO_CHAR(u.date_of_birth, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.seller_id = u.user_id
        AND n.type = 'birthday'
        AND n.created_at::date = CURRENT_DATE
    );
END;
$$;

-- Requires the pg_cron extension. If this errors, enable pg_cron first via
-- Supabase Dashboard → Database → Extensions, then re-run just this part.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'send-birthday-notifications',
  '0 8 * * *', -- 08:00 UTC daily
  $$ SELECT public.send_daily_birthday_notifications(); $$
);
