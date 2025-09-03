-- Update Exams table to use integer ID instead of UUID
-- First drop foreign key constraints
ALTER TABLE "Results" DROP CONSTRAINT IF EXISTS "Results_examId_fkey";
ALTER TABLE "ProctoringSessions" DROP CONSTRAINT IF EXISTS "ProctoringSessions_examId_fkey";
ALTER TABLE "ReAttemptRequests" DROP CONSTRAINT IF EXISTS "ReAttemptRequests_examId_fkey";
ALTER TABLE "Exams" DROP CONSTRAINT IF EXISTS "Exams_createdBy_fkey";

-- Drop primary key and update Exams table
ALTER TABLE "Exams" DROP CONSTRAINT "Exams_pkey";
ALTER TABLE "Exams" ADD COLUMN new_id SERIAL;
ALTER TABLE "Exams" DROP COLUMN id;
ALTER TABLE "Exams" RENAME COLUMN new_id TO id;
ALTER TABLE "Exams" ADD PRIMARY KEY (id);

-- Update foreign key columns to integer
ALTER TABLE "Results" ALTER COLUMN "examId" TYPE INTEGER USING "examId"::text::integer;
ALTER TABLE "ProctoringSessions" ALTER COLUMN "examId" TYPE INTEGER USING "examId"::text::integer;
ALTER TABLE "ReAttemptRequests" ALTER COLUMN "examId" TYPE INTEGER USING "examId"::text::integer;

-- Recreate foreign key constraints
ALTER TABLE "Results" ADD CONSTRAINT "Results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exams"(id);
ALTER TABLE "ProctoringSessions" ADD CONSTRAINT "ProctoringSessions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exams"(id);
ALTER TABLE "ReAttemptRequests" ADD CONSTRAINT "ReAttemptRequests_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exams"(id);

-- Update createdBy to integer
ALTER TABLE "Exams" ALTER COLUMN "createdBy" TYPE INTEGER USING "createdBy"::text::integer;

-- Recreate createdBy foreign key constraint
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"(id);