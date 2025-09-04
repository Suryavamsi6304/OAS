-- Update proctoring_sessions table to support mentor requests
ALTER TABLE proctoring_sessions 
ADD COLUMN IF NOT EXISTS mentor_request JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Update existing sessions to have default values
UPDATE proctoring_sessions 
SET status = 'active' 
WHERE status IS NULL;

UPDATE proctoring_sessions 
SET total_violations = 0 
WHERE total_violations IS NULL;

UPDATE proctoring_sessions 
SET risk_score = 0 
WHERE risk_score IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_status ON proctoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_mentor_request ON proctoring_sessions USING GIN(mentor_request);

-- Add comments for documentation
COMMENT ON COLUMN proctoring_sessions.mentor_request IS 'JSON object containing mentor request details when student is blocked';
COMMENT ON COLUMN proctoring_sessions.status IS 'Session status: active, blocked, completed, terminated';
COMMENT ON COLUMN proctoring_sessions.total_violations IS 'Total number of violations in this session';
COMMENT ON COLUMN proctoring_sessions.risk_score IS 'Calculated risk score based on violations';