-- Add teacher permissions for quiz_sessions
-- Teachers can view quiz sessions of students in their school

-- RLS Policy for quiz_sessions - Allow teachers to view quiz sessions of their students
CREATE POLICY "Teachers can view quiz sessions of their students"
ON public.quiz_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = auth.uid()
    AND sp.user_id = quiz_sessions.user_id
  )
);

