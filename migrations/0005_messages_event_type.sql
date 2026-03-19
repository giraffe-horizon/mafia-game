-- Add event_type column to distinguish system events from GM messages
-- event_type: NULL = GM message, 'night_result' = night outcome, 'vote_result' = vote outcome
ALTER TABLE messages ADD COLUMN event_type TEXT DEFAULT NULL;

-- Add round column to allow grouping events by round in game log
ALTER TABLE messages ADD COLUMN round INTEGER DEFAULT NULL;
