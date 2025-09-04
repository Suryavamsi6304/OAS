-- Create coding_questions table
CREATE TABLE IF NOT EXISTS coding_questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    "timeLimit" INTEGER DEFAULT 30,
    "memoryLimit" INTEGER DEFAULT 256,
    "testCases" JSON NOT NULL DEFAULT '[]',
    "sampleInput" TEXT,
    "sampleOutput" TEXT,
    constraints TEXT,
    points INTEGER DEFAULT 10,
    "createdBy" INTEGER NOT NULL REFERENCES users(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coding_questions_created_by ON coding_questions("createdBy");
CREATE INDEX IF NOT EXISTS idx_coding_questions_difficulty ON coding_questions(difficulty);