-- Run this in Supabase SQL editor.
-- Stores CLIP embeddings used for "same-looking item" visual search.

create table if not exists public.product_image_embeddings (
  product_id uuid primary key references public.products(id) on delete cascade,
  image_url text not null,
  embedding jsonb not null,
  model text not null default 'Xenova/clip-vit-base-patch32',
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_product_image_embeddings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_image_embeddings_updated_at on public.product_image_embeddings;
create trigger trg_product_image_embeddings_updated_at
before update on public.product_image_embeddings
for each row execute function public.set_updated_at_product_image_embeddings();

alter table public.product_image_embeddings enable row level security;

-- Allow authenticated and anon users to read embeddings for product search.
drop policy if exists "read product image embeddings" on public.product_image_embeddings;
create policy "read product image embeddings"
on public.product_image_embeddings
for select
to authenticated, anon
using (true);

-- Allow authenticated users to insert/update.
drop policy if exists "write product image embeddings" on public.product_image_embeddings;
create policy "write product image embeddings"
on public.product_image_embeddings
for all
to authenticated
using (true)
with check (true);

