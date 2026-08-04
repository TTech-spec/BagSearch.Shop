-- Adds date_of_birth to support the seller signup form's new optional field.
-- brand_name already exists (see fix_users_table.sql) and is reused as the
-- compulsory "business name" collected on signup for new sellers — existing
-- users are untouched since this only affects the registration form going
-- forward.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth date;
