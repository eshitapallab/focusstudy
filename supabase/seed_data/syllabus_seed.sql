-- Sample Syllabus Data for Major Indian Exams
-- This demonstrates the canonical syllabus structure

-- ============================================================================
-- UPSC Civil Services (Preliminary) - General Studies Paper 1
-- ============================================================================

-- History (30-35 questions, ~25% weight)
INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-001', 'Ancient India - Indus Valley Civilization', 'History', 6, 2.5, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-002', 'Ancient India - Vedic Period', 'History', 5, 1.8, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-003', 'Ancient India - Mauryan Empire', 'History', 7, 2.2, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-004', 'Medieval India - Delhi Sultanate', 'History', 6, 2.0, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-005', 'Medieval India - Mughal Empire', 'History', 8, 3.5, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-006', 'Modern India - British Rule & Company Raj', 'History', 7, 2.8, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-007', 'Modern India - 1857 Revolt', 'History', 6, 1.5, 2.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-008', 'Modern India - Freedom Movement (1885-1947)', 'History', 9, 4.2, 6),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-009', 'Art & Architecture - Ancient Temples', 'History', 5, 1.8, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'HIST-010', 'Art & Architecture - Medieval Forts & Palaces', 'History', 5, 1.5, 2.5);

-- Geography (25-30 questions, ~20% weight)
INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-001', 'Physical Geography - Earth & Universe', 'Geography', 5, 1.5, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-002', 'Physical Geography - Landforms', 'Geography', 6, 2.0, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-003', 'Physical Geography - Climate & Weather', 'Geography', 7, 2.8, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-004', 'Physical Geography - Ocean Currents', 'Geography', 6, 1.8, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-005', 'Indian Geography - Mountains & Rivers', 'Geography', 8, 3.2, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-006', 'Indian Geography - Agriculture & Crops', 'Geography', 7, 2.5, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-007', 'Indian Geography - Minerals & Resources', 'Geography', 7, 2.2, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-008', 'Environment - Biodiversity & Conservation', 'Geography', 8, 3.5, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-009', 'Environment - Climate Change & Global Warming', 'Geography', 9, 4.0, 5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'GEO-010', 'Disaster Management', 'Geography', 6, 1.8, 2.5);

-- Polity (35-40 questions, ~30% weight)
INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-001', 'Constitution - Preamble & Basic Structure', 'Polity', 9, 3.8, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-002', 'Fundamental Rights (Articles 12-35)', 'Polity', 10, 5.2, 5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-003', 'Directive Principles (Articles 36-51)', 'Polity', 7, 2.5, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-004', 'Fundamental Duties', 'Polity', 4, 0.8, 1.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-005', 'Parliament - Powers & Procedures', 'Polity', 9, 4.5, 5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-006', 'Parliament - Committees', 'Polity', 8, 3.2, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-007', 'Executive - President & Governors', 'Polity', 8, 3.0, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-008', 'Executive - Prime Minister & Cabinet', 'Polity', 7, 2.8, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-009', 'Judiciary - Supreme Court & High Courts', 'Polity', 9, 4.0, 4.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-010', 'Local Government - Panchayati Raj', 'Polity', 7, 2.2, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-011', 'Constitutional Amendments (Important)', 'Polity', 8, 3.5, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'POL-012', 'Constitutional Bodies (CAG, EC, UPSC)', 'Polity', 8, 3.8, 4);

-- Economics (20-25 questions, ~18% weight)
INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-001', 'Indian Economy - Planning & Development', 'Economics', 7, 2.5, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-002', 'Indian Economy - National Income', 'Economics', 6, 1.8, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-003', 'Indian Economy - Budget & Taxation', 'Economics', 8, 3.2, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-004', 'Banking & Monetary Policy', 'Economics', 8, 3.5, 4),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-005', 'Economic Reforms (1991 onwards)', 'Economics', 7, 2.8, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-006', 'Government Schemes (Current)', 'Economics', 9, 4.5, 5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'ECO-007', 'International Economics & Trade', 'Economics', 6, 1.5, 2.5);

-- Science & Technology (15-20 questions, ~12% weight)
INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-001', 'Basic Physics - Mechanics & Energy', 'Science & Tech', 5, 1.5, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-002', 'Basic Chemistry - Elements & Compounds', 'Science & Tech', 5, 1.2, 2.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-003', 'Basic Biology - Human Body Systems', 'Science & Tech', 6, 2.0, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-004', 'Space Technology - ISRO Missions', 'Science & Tech', 7, 2.5, 3),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-005', 'Information Technology - AI & Blockchain', 'Science & Tech', 8, 3.0, 3.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-006', 'Biotechnology & Genetics', 'Science & Tech', 6, 1.8, 2.5),
((SELECT id FROM syllabus_templates WHERE exam_name = 'UPSC CSE Prelims' LIMIT 1), 'SCI-007', 'Defence Technology', 'Science & Tech', 5, 1.2, 2);

-- ============================================================================
-- JEE Main - Physics Sample
-- ============================================================================

INSERT INTO syllabus_topics (template_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours) VALUES
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-001', 'Mechanics - Kinematics', 'Physics', 9, 3.5, 8),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-002', 'Mechanics - Laws of Motion', 'Physics', 10, 4.2, 10),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-003', 'Mechanics - Work, Energy, Power', 'Physics', 9, 3.8, 8),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-004', 'Mechanics - Rotational Motion', 'Physics', 8, 3.0, 7),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-005', 'Mechanics - Gravitation', 'Physics', 7, 2.5, 6),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-006', 'Electrostatics', 'Physics', 10, 4.5, 10),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-007', 'Current Electricity', 'Physics', 9, 4.0, 9),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-008', 'Magnetic Effects of Current', 'Physics', 8, 3.2, 7),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-009', 'Electromagnetic Induction', 'Physics', 9, 3.8, 8),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-010', 'Optics - Ray & Wave', 'Physics', 8, 3.5, 7),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-011', 'Modern Physics - Dual Nature', 'Physics', 7, 2.8, 6),
((SELECT id FROM syllabus_templates WHERE exam_name = 'JEE Main' LIMIT 1), 'PHY-012', 'Modern Physics - Atoms & Nuclei', 'Physics', 7, 2.5, 6);

-- ============================================================================
-- INSTRUCTIONS FOR USE
-- ============================================================================

-- 1. First create syllabus templates:
--    INSERT INTO syllabus_templates (exam_name, total_subjects, total_topics, created_by) 
--    VALUES ('UPSC CSE Prelims', 6, 50, 'system');

-- 2. Then run this seed file to populate topics

-- 3. Exam weight scoring (1-10):
--    10 = Critical (appears every year, high marks)
--    8-9 = Very Important (frequent, substantial marks)
--    6-7 = Important (regular appearance)
--    4-5 = Moderate (occasional)
--    1-3 = Low priority (rare)

-- 4. Estimated hours:
--    Based on average student time to move from "untouched" to "strong"
--    Includes reading, note-making, practice, revision

-- 5. Avg questions per year:
--    Historical data from past 5-10 years
--    Used for priority scoring and ROI calculation

-- Note: This is a STARTER set. A production syllabus would have:
-- - UPSC: ~150-200 topics across all subjects
-- - JEE Main: ~200-250 topics (Physics + Chemistry + Math)
-- - NEET: ~180-220 topics (Physics + Chemistry + Biology)
-- - GATE: ~120-150 topics per stream
