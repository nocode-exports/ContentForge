
-- Add index on user_id for content_history table
CREATE INDEX IF NOT EXISTS content_history_user_id_idx ON public.content_history (user_id);
