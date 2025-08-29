-- Assessment Platform Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER REFERENCES users(id),
    time_limit INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    negative_marking BOOLEAN DEFAULT false,
    negative_marks DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    course_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'essay', 'fill_blank')),
    options JSONB, -- For MCQ options
    correct_answer TEXT,
    marks INTEGER NOT NULL,
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Results table
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    assessment_id INTEGER REFERENCES assessments(id),
    answers JSONB NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INTEGER, -- in minutes
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP,
    feedback TEXT
);

-- Question Bank table
CREATE TABLE question_bank (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL,
    options JSONB,
    correct_answer TEXT,
    tags VARCHAR(255),
    difficulty VARCHAR(10),
    subject VARCHAR(100),
    reuse_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Practice Sessions table
CREATE TABLE practice_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    questions_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    session_time INTEGER, -- in minutes
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Assignments table (for assigning tests to specific students)
CREATE TABLE assessment_assignments (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, student_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_assessments_creator ON assessments(creator_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_questions_assessment ON questions(assessment_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_assessment ON results(assessment_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Insert default admin user (password: 'password')
INSERT INTO users (email, password, role, first_name, last_name) 
VALUES ('admin@assessment.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System', 'Administrator');