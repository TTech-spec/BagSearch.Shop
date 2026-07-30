create extension if not exists pg_net;

create or replace function public.send_push_notification_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text := 'https://lpmdbmzvvnpyuukvahiy.supabase.co';
  trigger_secret text := 'a457af34ff48dc2cf78a1e6a91d1001c95752f42ce021c8613c396c44f49d106';
begin
  perform net.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trigger_secret
    ),
    body := jsonb_build_object(
      'sellerId', new.seller_id,
      'notificationId', new.id,
      'title', coalesce(new.title, 'BagSearch'),
      'body', coalesce(new.message, 'You have a new notification.'),
      'url', case
        when new.product_id is not null then '/products/' || new.product_id::text
        else '/seller-profile'
      end,
      'tag', coalesce(new.type, 'bagsearch-notification')
    )
  );

  return new;
end;
$$;

drop trigger if exists notifications_send_push_trigger on public.notifications;
create trigger notifications_send_push_trigger
after insert on public.notifications
for each row
execute function public.send_push_notification_for_notification();
