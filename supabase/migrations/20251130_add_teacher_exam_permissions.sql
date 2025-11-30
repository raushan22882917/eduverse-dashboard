-- Add teacher permissions for exam management
-- Teachers can create, view, update, and delete PYQs (exam questions)
-- Teachers can view test sessions of students in their school

-- RLS Policies for pyqs - Allow teachers to manage PYQs
CREATE POLICY "Teachers can insert pyqs"
ON public.pyqs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update pyqs"
ON public.pyqs
FOR UPDATE
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete pyqs"
ON public.pyqs
FOR DELETE
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for test_sessions - Allow teachers to view test sessions of their students
CREATE POLICY "Teachers can view test sessions of their students"
ON public.test_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = auth.uid()
    AND sp.user_id = test_sessions.user_id
  )
);

-- RLS Policies for hots_questions - Allow teachers to manage HOTS questions
CREATE POLICY "Teachers can insert hots_questions"
ON public.hots_questions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update hots_questions"
ON public.hots_questions
FOR UPDATE
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete hots_questions"
ON public.hots_questions
FOR DELETE
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for content - Allow teachers to manage content
CREATE POLICY "Teachers can insert content"
ON public.content
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update content"
ON public.content
FOR UPDATE
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete content"
ON public.content
FOR DELETE
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for topics - Allow teachers to manage topics
CREATE POLICY "Teachers can insert topics"
ON public.topics
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update topics"
ON public.topics
FOR UPDATE
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete topics"
ON public.topics
FOR DELETE
USING (public.has_role(auth.uid(), 'teacher'));

