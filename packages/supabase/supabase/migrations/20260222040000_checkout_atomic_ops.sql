-- Atomic Inventory Deduction
create or replace function deduct_inventory(
  p_product_id uuid,
  p_size text,
  p_quantity integer
) returns boolean as $$
declare
  v_available integer;
begin
  -- Use select for update to lock the row
  select quantity_available into v_available
  from inventory
  where product_id = p_product_id and size = p_size
  for update;

  if v_available >= p_quantity then
    update inventory
    set quantity_available = quantity_available - p_quantity,
        updated_at = now()
    where product_id = p_product_id and size = p_size;
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;

-- Atomic Coupon Increment
create or replace function increment_coupon_usage(
  p_coupon_id uuid
) returns void as $$
begin
  update coupons
  set times_used = times_used + 1
  where id = p_coupon_id;
end;
$$ language plpgsql security definer;

-- Allow guest addresses by making user_id optional or using a separate table
-- However, for this task, we will simply allow null user_id on addresses table 
-- OR better: update orders to include shipping_address as JSONB for a snapshot.
alter table orders add column if not exists shipping_address jsonb;

-- Add indices for performance
create index if not exists idx_inventory_product_size on inventory(product_id, size);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_cart_items_cart_id on cart_items(cart_id);
