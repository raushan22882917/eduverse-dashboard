-- Fix potential policy recursion issues with schools table
-- This ensures policies don't cause infinite recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view their own school" ON public.schools;
DROP POLICY IF EXISTS "Students can view their own school" ON public.schools;

-- Recreate with better checks to avoid recursion
CREATE POLICY "Teachers can view their own school"
ON public.schools FOR SELECT
USING (
  -- Check if user is a teacher
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'teacher'
  )
  AND
  -- Check if teacher has this school_id
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
    AND tp.school_id = schools.id
    AND tp.school_id IS NOT NULL
  )
);

CREATE POLICY "Students can view their own school"
ON public.schools FOR SELECT
USING (
  -- Check if user is a student
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'student'
  )
  AND
  -- Check if student has this school_id
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = auth.uid()
    AND sp.school_id = schools.id
    AND sp.school_id IS NOT NULL
  )
);

-- Also ensure admins can view all schools
DROP POLICY IF EXISTS "Admins can view all schools" ON public.schools;
CREATE POLICY "Admins can view all schools"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

