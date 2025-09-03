-- Enable proctoring for all exams
UPDATE "Exams" SET "proctoringEnabled" = true;

-- Or enable for specific exam ID (replace 1 with actual exam ID)
-- UPDATE "Exams" SET "proctoringEnabled" = true WHERE id = 1;