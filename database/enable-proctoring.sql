-- Enable proctoring for a specific test
UPDATE "Exams" 
SET "proctoringEnabled" = true 
WHERE id = ?; -- Replace ? with the specific exam ID

-- Enable proctoring for multiple tests by title pattern
UPDATE "Exams" 
SET "proctoringEnabled" = true 
WHERE title LIKE '%Final%'; -- Example: enable for all final exams

-- Enable proctoring for all tests
UPDATE "Exams" 
SET "proctoringEnabled" = true;