-- Migration 012: Create reservations table
-- For court/facility reservations made by clients

-- Create reservation_status enum
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status reservation_status DEFAULT 'pending',
  price numeric(10,2),
  payment_status varchar(20) DEFAULT 'pending',
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  notes text,
  booked_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_reservation_time CHECK (end_time > start_time),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('paid', 'pending', 'refunded'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment ON reservations(payment_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS tr_reservations_updated_at ON reservations;
CREATE TRIGGER tr_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE reservations IS 'Court/facility reservations made by clients';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, confirmed, cancelled, completed, no_show';
COMMENT ON COLUMN reservations.payment_status IS 'Payment status: paid, pending, refunded';
COMMENT ON COLUMN reservations.booked_at IS 'When the reservation was made';
COMMENT ON COLUMN reservations.confirmed_at IS 'When the reservation was confirmed';
COMMENT ON COLUMN reservations.cancelled_at IS 'When the reservation was cancelled';
