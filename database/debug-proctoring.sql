-- Check if proctoringEnabled column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Exams' AND column_name = 'proctoringEnabled';

-- Check current exams and their proctoring status
SELECT id, title, "proctoringEnabled" FROM "Exams";

-- If column doesn't exist, add it
ALTER TABLE "Exams" ADD COLUMN IF NOT EXISTS "proctoringEnabled" BOOLEAN DEFAULT false;

-- Now enable proctoring
UPDATE "Exams" SET "proctoringEnabled" = true;