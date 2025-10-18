-- Enhanced Event Payment System with Custom Amounts and Priority Seating
-- This migration adds support for custom payment amounts and priority seating logic

BEGIN;

-- Add custom_amount field to tickets table if not exists
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS custom_amount DECIMAL(10,2);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seating_priority INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seating_assignment TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS admission_status TEXT DEFAULT 'pending' CHECK (admission_status IN ('pending', 'admitted', 'denied'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS admitted_by UUID REFERENCES auth.users(id);

-- Add custom_amount field to events table for minimum payment
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_custom_amount DECIMAL(10,2) DEFAULT 20000;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_custom_amount BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Create event_payments table for tracking all payments
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  custom_amount BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT 'paystack' CHECK (payment_method IN ('paystack', 'coins', 'free')),
  paystack_reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_payments_user ON event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_event ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_status ON event_payments(status);
CREATE INDEX IF NOT EXISTS idx_event_payments_reference ON event_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_tickets_seating_priority ON tickets(event_id, seating_priority DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_admission_status ON tickets(event_id, admission_status);

-- Enable RLS on event_payments
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_payments
CREATE POLICY "Users can view own event payments" ON event_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event payments" ON event_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all event payments" ON event_payments
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

CREATE POLICY "Admin can manage all event payments" ON event_payments
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

-- Function to calculate seating priority based on payment amount
CREATE OR REPLACE FUNCTION calculate_seating_priority(
  p_event_id UUID,
  p_ticket_id UUID,
  p_amount DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_priority INTEGER;
  v_rank INTEGER;
BEGIN
  -- Count how many tickets for this event have higher or equal payment
  SELECT COUNT(*) + 1 INTO v_rank
  FROM tickets t
  WHERE t.event_id = p_event_id
    AND t.id != p_ticket_id
    AND COALESCE(t.custom_amount, t.price_paid_naira, 0) >= p_amount
    AND t.status != 'cancelled';
  
  -- Priority is inverse of rank (higher payment = higher priority)
  v_priority := 1000 - v_rank;
  
  RETURN v_priority;
END;
$$ LANGUAGE plpgsql;

-- Function to assign seating based on priority
CREATE OR REPLACE FUNCTION assign_seating(p_ticket_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_priority INTEGER;
  v_seating TEXT;
  v_event_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Get ticket details
  SELECT event_id, COALESCE(custom_amount, price_paid_naira, 0), seating_priority
  INTO v_event_id, v_amount, v_priority
  FROM tickets
  WHERE id = p_ticket_id;
  
  -- Assign seating based on priority
  IF v_priority >= 900 THEN
    v_seating := 'Front Row VIP';
  ELSIF v_priority >= 800 THEN
    v_seating := 'Second Row Premium';
  ELSIF v_priority >= 700 THEN
    v_seating := 'Third Row Premium';
  ELSIF v_priority >= 600 THEN
    v_seating := 'Fourth Row Standard';
  ELSIF v_priority >= 500 THEN
    v_seating := 'Fifth Row Standard';
  ELSE
    v_seating := 'General Admission';
  END IF;
  
  -- Update ticket with seating assignment
  UPDATE tickets
  SET seating_assignment = v_seating
  WHERE id = p_ticket_id;
  
  RETURN v_seating;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate seating priority when ticket is created or updated
CREATE OR REPLACE FUNCTION trigger_calculate_seating()
RETURNS TRIGGER AS $$
DECLARE
  v_amount DECIMAL;
  v_priority INTEGER;
BEGIN
  -- Get the payment amount
  v_amount := COALESCE(NEW.custom_amount, NEW.price_paid_naira, 0);
  
  -- Calculate priority
  v_priority := calculate_seating_priority(NEW.event_id, NEW.id, v_amount);
  
  -- Update priority
  NEW.seating_priority := v_priority;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic seating priority calculation
DROP TRIGGER IF EXISTS trigger_ticket_seating_priority ON tickets;
CREATE TRIGGER trigger_ticket_seating_priority
  BEFORE INSERT OR UPDATE OF custom_amount, price_paid_naira ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_seating();

-- Function to update admission status when QR is scanned
CREATE OR REPLACE FUNCTION admit_ticket(
  p_ticket_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_result JSONB;
BEGIN
  -- Get ticket details
  SELECT * INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ticket not found'
    );
  END IF;
  
  -- Check if already admitted
  IF v_ticket.admission_status = 'admitted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ticket already admitted',
      'admitted_at', v_ticket.admitted_at
    );
  END IF;
  
  -- Check if ticket is valid
  IF v_ticket.status != 'valid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ticket is not valid',
      'status', v_ticket.status
    );
  END IF;
  
  -- Update ticket to admitted
  UPDATE tickets
  SET 
    admission_status = 'admitted',
    admitted_at = NOW(),
    admitted_by = p_admin_id,
    status = 'used',
    used_at = NOW(),
    checked_in_by = p_admin_id
  WHERE id = p_ticket_id;
  
  -- Return success with ticket details
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', p_ticket_id,
    'admitted_at', NOW(),
    'seating', v_ticket.seating_assignment
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON event_payments TO authenticated;
GRANT INSERT ON event_payments TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_seating_priority(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_seating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admit_ticket(UUID, UUID) TO authenticated;

-- Update existing tickets to calculate their seating priority
UPDATE tickets
SET seating_priority = calculate_seating_priority(
  event_id,
  id,
  COALESCE(custom_amount, price_paid_naira, 0)
)
WHERE seating_priority = 0;

-- Assign seating for existing tickets
DO $$
DECLARE
  ticket_record RECORD;
BEGIN
  FOR ticket_record IN SELECT id FROM tickets WHERE seating_assignment IS NULL
  LOOP
    PERFORM assign_seating(ticket_record.id);
  END LOOP;
END $$;

COMMIT;
