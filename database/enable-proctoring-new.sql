-- Check available tables and their schemas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check Exams table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'Exams' AND table_schema = 'public';

-- Check if assessment_proctoring_settings table exists and its structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'assessment_proctoring_settings' AND table_schema = 'public';

-- Check existing exam records
SELECT id, title FROM "Exams" LIMIT 5;