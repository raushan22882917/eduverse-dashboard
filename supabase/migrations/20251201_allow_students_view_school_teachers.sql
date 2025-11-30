-- Allow students to view teacher profiles from their school
CREATE POLICY "Students can view teachers from their school"
ON public.teacher_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = auth.uid()
    AND sp.school_id = teacher_profiles.school_id
  )
);

-- Allow teachers to view other teachers from their school
CREATE POLICY "Teachers can view teachers from their school"
ON public.teacher_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.school_id = teacher_profiles.school_id
  )
);

