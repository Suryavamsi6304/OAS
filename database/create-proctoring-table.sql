-- Create assessment_proctoring_settings table with integer ID
CREATE TABLE IF NOT EXISTS assessment_proctoring_settings (
    assessment_id INTEGER PRIMARY KEY,
    proctoring_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);