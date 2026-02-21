-- Add gift options to orders table (Idempotent)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_wrap boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message text;

COMMENT ON COLUMN orders.is_gift IS 'Indicates if the order is intended as a gift';
COMMENT ON COLUMN orders.gift_wrap IS 'Indicates if the user requested gift wrapping for this order';
COMMENT ON COLUMN orders.gift_message IS 'Optional gift message, typically up to 250 characters';
