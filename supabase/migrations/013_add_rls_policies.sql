-- Migration 013: Add RLS policies for new tables
-- Enable Row Level Security and create policies for calendar_events, event_participants, event_recurrence, reservations

-- ============================================
-- CALENDAR_EVENTS RLS
-- ============================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view events in their organization" ON calendar_events;
DROP POLICY IF EXISTS "Staff can insert events" ON calendar_events;
DROP POLICY IF EXISTS "Staff can update events" ON calendar_events;
DROP POLICY IF EXISTS "Staff can delete events" ON calendar_events;

-- SELECT: Users can view events in organizations they belong to
CREATE POLICY "Users can view events in their organization" ON calendar_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- INSERT: Staff, admin, owner can create events
CREATE POLICY "Staff can insert events" ON calendar_events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'staff')
    )
  );

-- UPDATE: Staff, admin, owner can update events
CREATE POLICY "Staff can update events" ON calendar_events
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'staff')
    )
  );

-- DELETE: Only admin and owner can delete events
CREATE POLICY "Admin can delete events" ON calendar_events
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- EVENT_PARTICIPANTS RLS
-- ============================================
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants in their org events" ON event_participants;
DROP POLICY IF EXISTS "Staff can manage participants" ON event_participants;

-- SELECT: Users can view participants of events in their organization
CREATE POLICY "Users can view participants in their org events" ON event_participants
  FOR SELECT USING (
    event_id IN (
      SELECT ce.id FROM calendar_events ce
      INNER JOIN organization_users ou ON ce.organization_id = ou.organization_id
      WHERE ou.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Staff can manage participants
CREATE POLICY "Staff can manage participants" ON event_participants
  FOR ALL USING (
    event_id IN (
      SELECT ce.id FROM calendar_events ce
      INNER JOIN organization_users ou ON ce.organization_id = ou.organization_id
      WHERE ou.user_id = auth.uid() AND ou.role IN ('owner', 'admin', 'staff')
    )
  );

-- ============================================
-- EVENT_RECURRENCE RLS
-- ============================================
ALTER TABLE event_recurrence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view recurrence in their org" ON event_recurrence;
DROP POLICY IF EXISTS "Staff can manage recurrence" ON event_recurrence;

-- SELECT: Users can view recurrence patterns of events in their organization
CREATE POLICY "Users can view recurrence in their org" ON event_recurrence
  FOR SELECT USING (
    event_id IN (
      SELECT ce.id FROM calendar_events ce
      INNER JOIN organization_users ou ON ce.organization_id = ou.organization_id
      WHERE ou.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Staff can manage recurrence
CREATE POLICY "Staff can manage recurrence" ON event_recurrence
  FOR ALL USING (
    event_id IN (
      SELECT ce.id FROM calendar_events ce
      INNER JOIN organization_users ou ON ce.organization_id = ou.organization_id
      WHERE ou.user_id = auth.uid() AND ou.role IN ('owner', 'admin', 'staff')
    )
  );

-- ============================================
-- RESERVATIONS RLS
-- ============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reservations in their org" ON reservations;
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;
DROP POLICY IF EXISTS "Clients can view own reservations" ON reservations;

-- SELECT: Staff can view all reservations in their organization
CREATE POLICY "Users can view reservations in their org" ON reservations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- INSERT: Staff can create reservations
CREATE POLICY "Staff can insert reservations" ON reservations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'staff')
    )
  );

-- UPDATE: Staff can update reservations
CREATE POLICY "Staff can update reservations" ON reservations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'staff')
    )
  );

-- DELETE: Only admin/owner can delete reservations
CREATE POLICY "Admin can delete reservations" ON reservations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
