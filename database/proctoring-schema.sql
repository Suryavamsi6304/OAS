-- Proctoring System Database Schema

-- Proctoring Sessions table
CREATE TABLE proctoring_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    assessment_id INTEGER REFERENCES assessments(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    video_recording_path VARCHAR(500),
    audio_recording_path VARCHAR(500),
    total_violations INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proctoring Violations table
CREATE TABLE proctoring_violations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES proctoring_sessions(id),
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    screenshot_path VARCHAR(500),
    metadata JSONB
);

-- Assessment Proctoring Settings table
CREATE TABLE assessment_proctoring_settings (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) UNIQUE,
    proctoring_enabled BOOLEAN DEFAULT false,
    camera_required BOOLEAN DEFAULT true,
    microphone_required BOOLEAN DEFAULT true,
    screen_recording BOOLEAN DEFAULT true,
    face_detection BOOLEAN DEFAULT true,
    multiple_person_detection BOOLEAN DEFAULT true,
    tab_switching_detection BOOLEAN DEFAULT true,
    copy_paste_prevention BOOLEAN DEFAULT true,
    right_click_disabled BOOLEAN DEFAULT true,
    fullscreen_required BOOLEAN DEFAULT true,
    violation_threshold INTEGER DEFAULT 5,
    auto_submit_on_violation BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for proctoring tables
CREATE INDEX idx_proctoring_sessions_student ON proctoring_sessions(student_id);
CREATE INDEX idx_proctoring_sessions_assessment ON proctoring_sessions(assessment_id);
CREATE INDEX idx_proctoring_violations_session ON proctoring_violations(session_id);
CREATE INDEX idx_proctoring_violations_type ON proctoring_violations(violation_type);
CREATE INDEX idx_assessment_proctoring_settings_assessment ON assessment_proctoring_settings(assessment_id);