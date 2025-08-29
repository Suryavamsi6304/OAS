-- Sample data for testing
INSERT INTO question_bank (teacher_id, question_text, question_type, options, correct_answer, tags, difficulty, subject) VALUES
(1, 'What is the capital of France?', 'mcq', '["Paris", "London", "Berlin", "Madrid"]', 'Paris', 'geography', 'easy', 'General Knowledge'),
(1, 'What is 2 + 2?', 'mcq', '["3", "4", "5", "6"]', '4', 'math', 'easy', 'Mathematics'),
(1, 'Who wrote Romeo and Juliet?', 'mcq', '["Shakespeare", "Dickens", "Austen", "Tolkien"]', 'Shakespeare', 'literature', 'medium', 'English'),
(1, 'What is the largest planet?', 'mcq', '["Earth", "Mars", "Jupiter", "Saturn"]', 'Jupiter', 'science', 'medium', 'Science'),
(1, 'What year did World War II end?', 'mcq', '["1944", "1945", "1946", "1947"]', '1945', 'history', 'hard', 'History');

-- Sample assessment
INSERT INTO assessments (title, description, creator_id, time_limit, total_marks, negative_marking, status, course_code) VALUES
('Sample Test', 'A sample test for demonstration', 1, 30, 50, false, 'published', 'DEMO101');

-- Sample questions for the assessment
INSERT INTO questions (assessment_id, question_text, question_type, options, correct_answer, marks, difficulty, order_number) VALUES
(1, 'What is the best time to post on LinkedIn?', 'mcq', '["Mon-Tues", "Sat-sun", "Tues-Thu", "Wed-Fri"]', 'Tues-Thu', 2, 'medium', 1),
(1, 'Which social media platform is best for B2B marketing?', 'mcq', '["Facebook", "Instagram", "LinkedIn", "Twitter"]', 'LinkedIn', 2, 'medium', 2),
(1, 'What does SEO stand for?', 'mcq', '["Search Engine Optimization", "Social Engine Optimization", "Search Engine Operation", "Social Engine Operation"]', 'Search Engine Optimization', 2, 'easy', 3);