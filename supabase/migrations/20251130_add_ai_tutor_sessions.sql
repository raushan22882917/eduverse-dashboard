-- Create AI tutor sessions table for conversational tutoring
CREATE TABLE IF NOT EXISTS public.ai_tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_name TEXT,
  subject subject_type,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI tutor messages table for conversation history
CREATE TABLE IF NOT EXISTS public.ai_tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'question', 'answer', 'feedback', 'homework_help', 'lesson_plan')),
  subject subject_type,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI tutor lesson plans table
CREATE TABLE IF NOT EXISTS public.ai_tutor_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject subject_type NOT NULL,
  plan_name TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  based_on_performance BOOLEAN DEFAULT true,
  performance_snapshot JSONB,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_user_id ON public.ai_tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_subject ON public.ai_tutor_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_is_active ON public.ai_tutor_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_messages_session_id ON public.ai_tutor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_messages_created_at ON public.ai_tutor_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_lesson_plans_user_id ON public.ai_tutor_lesson_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_lesson_plans_subject ON public.ai_tutor_lesson_plans(subject);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_lesson_plans_is_active ON public.ai_tutor_lesson_plans(is_active);

-- Enable RLS
ALTER TABLE public.ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_lesson_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_tutor_sessions
CREATE POLICY "Students can view their own AI tutor sessions"
ON public.ai_tutor_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can create their own AI tutor sessions"
ON public.ai_tutor_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own AI tutor sessions"
ON public.ai_tutor_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Teachers can view sessions of students in their school
CREATE POLICY "Teachers can view AI tutor sessions of their students"
ON public.ai_tutor_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = auth.uid()
    AND sp.user_id = ai_tutor_sessions.user_id
  )
);

-- Admins can view all sessions
CREATE POLICY "Admins can view all AI tutor sessions"
ON public.ai_tutor_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_tutor_messages
CREATE POLICY "Users can view messages in their sessions"
ON public.ai_tutor_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_tutor_sessions
    WHERE ai_tutor_sessions.id = ai_tutor_messages.session_id
    AND ai_tutor_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their sessions"
ON public.ai_tutor_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_tutor_sessions
    WHERE ai_tutor_sessions.id = ai_tutor_messages.session_id
    AND ai_tutor_sessions.user_id = auth.uid()
  )
);

-- Teachers can view messages of their students
CREATE POLICY "Teachers can view messages of their students"
ON public.ai_tutor_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_tutor_sessions ats
    JOIN public.teacher_profiles tp ON tp.school_id = (
      SELECT school_id FROM public.student_profiles WHERE user_id = ats.user_id
    )
    WHERE ats.id = ai_tutor_messages.session_id
    AND tp.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all AI tutor messages"
ON public.ai_tutor_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_tutor_lesson_plans
CREATE POLICY "Students can view their own lesson plans"
ON public.ai_tutor_lesson_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can create their own lesson plans"
ON public.ai_tutor_lesson_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own lesson plans"
ON public.ai_tutor_lesson_plans FOR UPDATE
USING (auth.uid() = user_id);

-- Teachers can view lesson plans of their students
CREATE POLICY "Teachers can view lesson plans of their students"
ON public.ai_tutor_lesson_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = auth.uid()
    AND sp.user_id = ai_tutor_lesson_plans.user_id
  )
);

-- Admins can view all lesson plans
CREATE POLICY "Admins can view all lesson plans"
ON public.ai_tutor_lesson_plans FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_tutor_sessions_updated_at
BEFORE UPDATE ON public.ai_tutor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tutor_lesson_plans_updated_at
BEFORE UPDATE ON public.ai_tutor_lesson_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

