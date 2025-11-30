-- Fix teacher permissions for quiz_sessions
-- The existing policy might not work correctly with .in() queries
-- Let's drop and recreate it with a better approach

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Teachers can view quiz sessions of their students" ON public.quiz_sessions;

-- Create a better policy that checks if the quiz session belongs to a student
-- in the same school as the teacher
CREATE POLICY "Teachers can view quiz sessions of their students"
ON public.quiz_sessions
FOR SELECT
USING (
  -- Check if the current user is a teacher
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'teacher'
  )
  AND
  -- Check if the quiz session belongs to a student in the teacher's school
  EXISTS (
    SELECT 1 
    FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = auth.uid()
    AND sp.user_id = quiz_sessions.user_id
    AND tp.school_id IS NOT NULL
    AND sp.school_id IS NOT NULL
  )
);

-- Also ensure teachers can view student_profiles (should already exist, but let's make sure)
-- Check if policy exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'student_profiles' 
    AND policyname = 'Teachers can view all student profiles'
  ) THEN
    CREATE POLICY "Teachers can view all student profiles"
    ON public.student_profiles
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

