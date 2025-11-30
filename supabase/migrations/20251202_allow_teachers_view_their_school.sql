-- Allow teachers to view their own school
-- This is needed for queries that join teacher_profiles with schools
CREATE POLICY "Teachers can view their own school"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.school_id = schools.id
  )
);

-- Allow students to view their own school
-- This is needed for queries that join student_profiles with schools
CREATE POLICY "Students can view their own school"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = auth.uid()
    AND sp.school_id = schools.id
  )
);

