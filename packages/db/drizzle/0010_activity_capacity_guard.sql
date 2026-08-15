-- Custom SQL migration file, put your code below! --

-- Plan 10-03 (D-07/D-08, Erfolgskriterium 2): capacity is enforced INSIDE the
-- database, not by a check-then-insert in the service. `SELECT ... FOR UPDATE`
-- locks the PARENT activity row before counting: a second concurrent join
-- blocks here until the first commits, and then counts the seat the first
-- one already wrote. Under READ COMMITTED without this lock, two concurrent
-- transactions would both read the same pre-insert count and both pass.
CREATE OR REPLACE FUNCTION activity_capacity_guard() RETURNS trigger AS $$
DECLARE
  cap integer;
  taken integer;
BEGIN
  SELECT a.capacity INTO cap FROM activity a WHERE a.id = NEW.activity_id FOR UPDATE;

  -- No matching activity: the foreign key rejects this row on its own, the
  -- trigger does not need to make that call.
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- A `BEFORE INSERT` trigger fires BEFORE `ON CONFLICT DO NOTHING` resolves
  -- its conflict. Without this branch, a visitor re-joining an activity they
  -- are already a participant of would be refused "full" on every repeat
  -- call to a full activity, even though they are already in — the capacity
  -- guard would eat the idempotency of joining.
  IF EXISTS (
    SELECT 1 FROM activity_participant p
    WHERE p.activity_id = NEW.activity_id AND p.visitor_id = NEW.visitor_id
  ) THEN
    RETURN NEW;
  END IF;

  -- D-08: no capacity means unbegrenzt.
  IF cap IS NULL THEN
    RETURN NEW;
  END IF;

  -- The count includes the creator (D-07: capacity is the total seat count,
  -- creator included).
  SELECT count(*) INTO taken FROM activity_participant p WHERE p.activity_id = NEW.activity_id;

  IF taken >= cap THEN
    RAISE EXCEPTION 'activity % is full (capacity %)', NEW.activity_id, cap
      USING ERRCODE = 'check_violation', CONSTRAINT = 'activity_capacity_full_chk';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER activity_participant_capacity_trg BEFORE INSERT ON activity_participant
FOR EACH ROW EXECUTE FUNCTION activity_capacity_guard();
