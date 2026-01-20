-- Migration 014: Create conflict validation functions and triggers
-- Functions to check facility and instructor availability

-- ============================================
-- FACILITY AVAILABILITY CHECK
-- ============================================
CREATE OR REPLACE FUNCTION check_facility_availability(
  p_facility_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_event_id uuid DEFAULT NULL,
  p_exclude_reservation_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  -- Check for conflicts with calendar events
  IF EXISTS (
    SELECT 1 FROM calendar_events
    WHERE facility_id = p_facility_id
    AND status NOT IN ('cancelled')
    AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for conflicts with reservations
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE facility_id = p_facility_id
    AND status NOT IN ('cancelled')
    AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- INSTRUCTOR AVAILABILITY CHECK
-- ============================================
CREATE OR REPLACE FUNCTION check_instructor_availability(
  p_instructor_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_event_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  IF p_instructor_id IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM calendar_events
    WHERE instructor_id = p_instructor_id
    AND status NOT IN ('cancelled')
    AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- GET FACILITY SCHEDULE FOR A DATE RANGE
-- ============================================
CREATE OR REPLACE FUNCTION get_facility_schedule(
  p_facility_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  event_type text,
  event_id uuid,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  status text
) AS $$
BEGIN
  RETURN QUERY
  -- Calendar events
  SELECT 
    'event'::text as event_type,
    ce.id as event_id,
    ce.title,
    ce.start_time,
    ce.end_time,
    ce.status::text
  FROM calendar_events ce
  WHERE ce.facility_id = p_facility_id
  AND ce.start_time >= p_start_date
  AND ce.start_time < (p_end_date + interval '1 day')
  AND ce.status != 'cancelled'
  
  UNION ALL
  
  -- Reservations
  SELECT 
    'reservation'::text as event_type,
    r.id as event_id,
    'Reserva'::text as title,
    r.start_time,
    r.end_time,
    r.status::text
  FROM reservations r
  WHERE r.facility_id = p_facility_id
  AND r.start_time >= p_start_date
  AND r.start_time < (p_end_date + interval '1 day')
  AND r.status != 'cancelled'
  
  ORDER BY start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- GET INSTRUCTOR SCHEDULE FOR A DATE RANGE
-- ============================================
CREATE OR REPLACE FUNCTION get_instructor_schedule(
  p_instructor_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  event_id uuid,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  facility_name text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id as event_id,
    ce.title,
    ce.start_time,
    ce.end_time,
    f.name as facility_name,
    ce.status::text
  FROM calendar_events ce
  LEFT JOIN facilities f ON ce.facility_id = f.id
  WHERE ce.instructor_id = p_instructor_id
  AND ce.start_time >= p_start_date
  AND ce.start_time < (p_end_date + interval '1 day')
  AND ce.status != 'cancelled'
  ORDER BY ce.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PARTICIPANT COUNT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_participant_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE calendar_events 
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE calendar_events 
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If event_id changed, update both old and new events
    IF OLD.event_id != NEW.event_id THEN
      UPDATE calendar_events 
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = OLD.event_id;
      UPDATE calendar_events 
      SET current_participants = current_participants + 1
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for participant count
DROP TRIGGER IF EXISTS tr_update_participant_count ON event_participants;
CREATE TRIGGER tr_update_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_count();

-- ============================================
-- VALIDATE EVENT CONFLICTS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION validate_event_conflicts() RETURNS TRIGGER AS $$
BEGIN
  -- Check facility availability
  IF NEW.facility_id IS NOT NULL THEN
    IF NOT check_facility_availability(NEW.facility_id, NEW.start_time, NEW.end_time, NEW.id, NULL) THEN
      RAISE EXCEPTION 'Facility is not available at the specified time';
    END IF;
  END IF;
  
  -- Check instructor availability
  IF NEW.instructor_id IS NOT NULL THEN
    IF NOT check_instructor_availability(NEW.instructor_id, NEW.start_time, NEW.end_time, NEW.id) THEN
      RAISE EXCEPTION 'Instructor is not available at the specified time';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event conflict validation
DROP TRIGGER IF EXISTS tr_validate_event_conflicts ON calendar_events;
CREATE TRIGGER tr_validate_event_conflicts
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  WHEN (NEW.status != 'cancelled')
  EXECUTE FUNCTION validate_event_conflicts();

-- ============================================
-- VALIDATE RESERVATION CONFLICTS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION validate_reservation_conflicts() RETURNS TRIGGER AS $$
BEGIN
  -- Check facility availability
  IF NOT check_facility_availability(NEW.facility_id, NEW.start_time, NEW.end_time, NULL, NEW.id) THEN
    RAISE EXCEPTION 'Facility is not available at the specified time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reservation conflict validation
DROP TRIGGER IF EXISTS tr_validate_reservation_conflicts ON reservations;
CREATE TRIGGER tr_validate_reservation_conflicts
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  WHEN (NEW.status != 'cancelled')
  EXECUTE FUNCTION validate_reservation_conflicts();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION check_facility_availability IS 'Checks if a facility is available at a given time range';
COMMENT ON FUNCTION check_instructor_availability IS 'Checks if an instructor is available at a given time range';
COMMENT ON FUNCTION get_facility_schedule IS 'Returns all events and reservations for a facility in a date range';
COMMENT ON FUNCTION get_instructor_schedule IS 'Returns all events for an instructor in a date range';
