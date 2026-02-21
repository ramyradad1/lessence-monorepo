-- Abandoned Cart Recovery Migration

-- 1. Notifications Table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Service role can manage all notifications" on public.notifications
  for all using (true); -- usually bounded by service_role key only or admin

-- 2. Cart Activity Table
create type recovery_status_enum as enum ('none', 'reminder_1_sent', 'recovered');

create table public.cart_activity (
  cart_id uuid references public.carts on delete cascade primary key,
  last_interaction_at timestamp with time zone default timezone('utc'::text, now()) not null,
  recovery_status recovery_status_enum default 'none',
  reminder_sent_at timestamp with time zone
);

alter table public.cart_activity enable row level security;
-- Service role handles this mostly, but let users see own cart activity
create policy "Users can view own cart activity" on public.cart_activity
  for select using (
    exists (
      select 1 from public.carts
      where carts.id = cart_activity.cart_id and carts.user_id = auth.uid()
    )
  );
create policy "Service role can manage cart activity" on public.cart_activity
  for all using (true);

-- 3. Trigger to update last_interaction_at
create or replace function public.handle_cart_item_update()
returns trigger as $$
declare
  target_cart_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_cart_id := OLD.cart_id;
  else
    target_cart_id := NEW.cart_id;
  end if;

  -- Upsert cart_activity row
  insert into public.cart_activity (cart_id, last_interaction_at, recovery_status)
  values (
    target_cart_id,
    timezone('utc'::text, now()),
    'none'
  )
  on conflict (cart_id) do update set
    last_interaction_at = timezone('utc'::text, now()),
    recovery_status = 'none',
    reminder_sent_at = null;
    
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Attach trigger to cart_items table
create trigger on_cart_item_change
  after insert or update or delete on public.cart_items
  for each row execute function public.handle_cart_item_update();
