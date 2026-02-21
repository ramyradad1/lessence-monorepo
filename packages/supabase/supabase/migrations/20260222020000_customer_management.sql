-- Add phone column to profiles
alter table profiles add column if not exists phone text;

-- Create admin_notes table
create table if not exists admin_notes (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users on delete cascade not null,
  admin_id uuid references auth.users on delete set null not null,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on admin_notes
alter table admin_notes enable row level security;

-- Admin-only access to admin_notes
create policy "Admins can manage admin notes" on admin_notes for all using (public.is_admin());

-- Create customer_aggregates view
create or replace view customer_aggregates as
select
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.role,
  p.phone,
  p.created_at,
  coalesce(agg.total_orders, 0)::int as total_orders,
  coalesce(agg.total_spend, 0)::numeric(10,2) as total_spend,
  agg.last_order_date
from profiles p
left join lateral (
  select
    count(*)::int as total_orders,
    sum(o.total_amount)::numeric(10,2) as total_spend,
    max(o.created_at) as last_order_date
  from orders o
  where o.user_id = p.id
    and o.status not in ('cancelled', 'refunded')
) agg on true;
