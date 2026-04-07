create or replace function public.create_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer_email_value text;
begin
  if new.seller_id is null then
    return new;
  end if;

  select u.email
  into buyer_email_value
  from public.users u
  where lower(coalesce(u.full_name, '')) = lower(coalesce(new.author_name, ''))
  order by u.created_at desc
  limit 1;

  insert into public.notifications (
    seller_id,
    buyer_name,
    buyer_email,
    type,
    title,
    message,
    metadata
  )
  values (
    new.seller_id,
    coalesce(new.author_name, 'Someone'),
    buyer_email_value,
    'review',
    'New Review',
    format('%s posted a %s-star review on your profile', coalesce(new.author_name, 'Someone'), coalesce(new.rating::text, '0')),
    jsonb_build_object(
      'review_id', new.id,
      'rating', new.rating,
      'text', new.text,
      'created_at', new.created_at
    )
  );

  return new;
end;
$$;

drop trigger if exists on_review_create_notification on public.seller_reviews;

create trigger on_review_create_notification
after insert on public.seller_reviews
for each row
execute function public.create_review_notification();
