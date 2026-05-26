create or replace function public.create_new_product_broadcast_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seller_user_id uuid;
  product_image text;
begin
  seller_user_id := coalesce(new.user_id, new.seller_id);

  if seller_user_id is null then
    return new;
  end if;

  product_image := case
    when new.images is not null and jsonb_typeof(to_jsonb(new.images)) = 'array' and jsonb_array_length(to_jsonb(new.images)) > 0
      then new.images[1]
    else null
  end;

  insert into public.notifications (
    seller_id,
    product_id,
    buyer_id,
    buyer_name,
    type,
    title,
    message,
    metadata
  )
  select
    ps.user_id as seller_id,
    new.id as product_id,
    seller_user_id as buyer_id,
    coalesce(new.seller_name, 'A seller') as buyer_name,
    'product_upload' as type,
    'New Product Uploaded' as title,
    coalesce(new.seller_name, 'A seller') || ' just uploaded "' || coalesce(new.name, 'a new product') || '"' as message,
    jsonb_build_object(
      'product_name', new.name,
      'seller_name', coalesce(new.seller_name, 'A seller'),
      'price', new.price,
      'image', product_image,
      'broadcast', true
    ) as metadata
  from (
    select distinct user_id
    from public.push_subscriptions
    where is_active = true
  ) ps
  where ps.user_id <> seller_user_id;

  return new;
end;
$$;

drop trigger if exists on_product_create_broadcast_notification on public.products;
create trigger on_product_create_broadcast_notification
after insert on public.products
for each row
execute function public.create_new_product_broadcast_notifications();
