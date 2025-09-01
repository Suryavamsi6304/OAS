-- Enable proctoring for assessment ID 1
INSERT INTO assessment_proctoring_settings (assessment_id, proctoring_enabled) 
VALUES (1, true) 
ON CONFLICT (assessment_id) 
DO UPDATE SET proctoring_enabled = true;