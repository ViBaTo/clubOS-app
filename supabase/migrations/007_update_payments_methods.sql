-- Migration 007: Update payments table with additional payment methods and status

-- Drop existing constraint if it exists
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

-- Add new constraint with additional payment methods (Bizum, PayPal)
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method IN ('card', 'transfer', 'cash', 'direct_debit', 'bizum', 'paypal'));

-- Add status field for payment state tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'completed';

-- Add constraint for status values
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('completed', 'pending', 'failed', 'refunded'));

-- Add verified field for manual verification
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN payments.status IS 'Payment status: completed, pending, failed, refunded';
COMMENT ON COLUMN payments.verified IS 'Whether the payment has been manually verified';
