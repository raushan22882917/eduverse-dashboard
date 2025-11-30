-- Add admin policies for user_roles to allow admins to view and manage all roles
DO $$
BEGIN
  -- Drop existing policy if it exists and recreate
  DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
  
  CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

  -- Allow admins to insert user roles
  DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
  
  CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  -- Allow admins to update user roles
  DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
  
  CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Add admin policies for profiles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  
  CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

  DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
  
  CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
  
  CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Add admin policies for student_profiles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;
  
  CREATE POLICY "Admins can view all student profiles"
  ON public.student_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

  DROP POLICY IF EXISTS "Admins can insert student profiles" ON public.student_profiles;
  
  CREATE POLICY "Admins can insert student profiles"
  ON public.student_profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  DROP POLICY IF EXISTS "Admins can update student profiles" ON public.student_profiles;
  
  CREATE POLICY "Admins can update student profiles"
  ON public.student_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
END $$;

