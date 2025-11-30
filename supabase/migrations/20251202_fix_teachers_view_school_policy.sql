-- Drop and recreate the policy to ensure it's correct
-- This handles cases where school_id might be NULL
DROP POLICY IF EXISTS "Teachers can view their own school" ON public.schools;

CREATE POLICY "Teachers can view their own school"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.school_id = schools.id
    AND tp.school_id IS NOT NULL
  )
);

-- Also ensure the students policy handles NULL properly
DROP POLICY IF EXISTS "Students can view their own school" ON public.schools;

CREATE POLICY "Students can view their own school"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = auth.uid()
    AND sp.school_id = schools.id
    AND sp.school_id IS NOT NULL
  )
);

-- Diagnostic: Check if teacher profile exists and has school_id
-- Run this query in SQL Editor to debug:
-- SELECT tp.user_id, tp.school_id, s.name as school_name
-- FROM teacher_profiles tp
-- LEFT JOIN schools s ON tp.school_id = s.id
-- WHERE tp.user_id = '77c03c35-ac31-4432-836e-d009a194fa07';

