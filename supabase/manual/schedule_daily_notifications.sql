-- ============================================================================
-- Daily phone notifications: morning, afternoon, evening (Nigeria time, WAT).
-- Run once in the Supabase SQL editor. Safe to run again (it replaces the jobs).
--
-- BEFORE RUNNING, replace the two placeholders below:
--   YOUR-PROJECT-REF       the code in your Supabase URL (https://<ref>.supabase.co)
--   YOUR-PUSH-TRIGGER-SECRET  the PUSH_TRIGGER_SECRET value saved in Edge Function secrets
-- Don't commit the file with the real secret in it.
--
--   Morning   8:00 am  everyone                    "new bags"
--   Afternoon 1:00 pm  sellers with no bags listed "list your first bag"
--   Evening   8:00 pm  everyone                    "new features / deals"
-- The words rotate daily; edit them in supabase/functions/send-push-notification.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.send_daily_push(p_campaign text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR-PUSH-TRIGGER-SECRET'
    ),
    body    := jsonb_build_object('campaign', p_campaign),
    -- The function can take a while (cold start + sending to every phone).
    timeout_milliseconds := 30000
  );
end;
$$;
revoke all on function public.send_daily_push(text) from public, anon, authenticated;

-- Remove old copies of the jobs, then schedule. Times are UTC (WAT = UTC+1).
select cron.unschedule(jobname) from cron.job where jobname like 'bagsearch-push-%';

select cron.schedule('bagsearch-push-morning',   '0 7 * * *',  $$select public.send_daily_push('morning')$$);
select cron.schedule('bagsearch-push-afternoon', '0 12 * * *', $$select public.send_daily_push('afternoon')$$);
select cron.schedule('bagsearch-push-evening',   '0 19 * * *', $$select public.send_daily_push('evening')$$);

-- See the last replies: select status_code, content, error_msg, timed_out from net._http_response order by id desc limit 3;
-- See the jobs:        select jobname, schedule, active from cron.job;
-- Send one right now:  select public.send_daily_push('morning');
-- Stop them all:       select cron.unschedule(jobname) from cron.job where jobname like 'bagsearch-push-%';
