-- Sales Reports RPCs for Admins

-- 1. Sales by date range (grouped by day)
create or replace function get_sales_report(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status_filter text default null,
  category_filter uuid default null
)
returns table (
  report_date date,
  revenue numeric,
  orders_count bigint
) as $$
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    date_trunc('day', o.created_at)::date as report_date,
    coalesce(sum(o.total_amount), 0) as revenue,
    count(o.id) as orders_count
  from orders o
  left join order_items oi on o.id = oi.order_id
  left join products p on oi.product_id = p.id
  where o.created_at >= start_date 
    and o.created_at <= end_date
    and (status_filter is null or o.status = status_filter)
    and (category_filter is null or p.category_id = category_filter)
  group by 1
  order by 1;
end;
$$ language plpgsql security definer;

-- 2. Best-selling products
create or replace function get_best_selling_products(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  limit_count int default 10,
  status_filter text default null,
  category_filter uuid default null
)
returns table (
  product_id uuid,
  product_name text,
  total_quantity bigint,
  total_revenue numeric
) as $$
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    oi.product_id,
    oi.product_name,
    sum(oi.quantity) as total_quantity,
    sum(oi.quantity * oi.price) as total_revenue
  from order_items oi
  join orders o on oi.order_id = o.id
  join products p on oi.product_id = p.id
  where o.created_at >= start_date 
    and o.created_at <= end_date
    and (status_filter is null or o.status = status_filter)
    and (category_filter is null or p.category_id = category_filter)
  group by oi.product_id, oi.product_name
  order by total_revenue desc
  limit limit_count;
end;
$$ language plpgsql security definer;

-- 3. Best categories
create or replace function get_best_categories(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status_filter text default null
)
returns table (
  category_id uuid,
  category_name text,
  total_quantity bigint,
  total_revenue numeric
) as $$
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    c.id as category_id,
    c.name as category_name,
    sum(oi.quantity) as total_quantity,
    sum(oi.quantity * oi.price) as total_revenue
  from order_items oi
  join orders o on oi.order_id = o.id
  join products p on oi.product_id = p.id
  join categories c on p.category_id = c.id
  where o.created_at >= start_date 
    and o.created_at <= end_date
    and (status_filter is null or o.status = status_filter)
  group by c.id, c.name
  order by total_revenue desc;
end;
$$ language plpgsql security definer;

-- 4. Orders summary
create or replace function get_orders_summary(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  category_filter uuid default null
)
returns table (
  total_revenue numeric,
  order_count bigint,
  avg_order_value numeric,
  status_breakdown jsonb
) as $$
declare
  stat_breakdown jsonb;
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  select jsonb_object_agg(status, count)
  into stat_breakdown
  from (
    select o.status, count(*) as count
    from orders o
    left join order_items oi on o.id = oi.order_id
    left join products p on oi.product_id = p.id
    where o.created_at >= start_date 
      and o.created_at <= end_date
      and (category_filter is null or p.category_id = category_filter)
    group by o.status
  ) s;

  return query
  select 
    coalesce(sum(o.total_amount), 0) as total_revenue,
    count(distinct o.id) as order_count,
    coalesce(avg(o.total_amount), 0) as avg_order_value,
    coalesce(stat_breakdown, '{}'::jsonb) as status_breakdown
  from orders o
  left join order_items oi on o.id = oi.order_id
  left join products p on oi.product_id = p.id
  where o.created_at >= start_date 
    and o.created_at <= end_date
    and (category_filter is null or p.category_id = category_filter);
end;
$$ language plpgsql security definer;

-- 5. Top customers
create or replace function get_top_customers(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  limit_count int default 10,
  status_filter text default null
)
returns table (
  user_id uuid,
  customer_name text,
  email text,
  order_count bigint,
  total_spend numeric
) as $$
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    o.user_id,
    p.full_name as customer_name,
    p.email,
    count(o.id) as order_count,
    sum(o.total_amount) as total_spend
  from orders o
  join profiles p on o.user_id = p.id
  where o.created_at >= start_date 
    and o.created_at <= end_date
    and (status_filter is null or o.status = status_filter)
  group by o.user_id, p.full_name, p.email
  order by total_spend desc
  limit limit_count;
end;
$$ language plpgsql security definer;
