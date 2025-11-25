-- Migration for AI features: focus sessions, lesson plans, parent messages, and user settings

-- Create focus_sessions table for time-boxing and focus tracking
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  actual_duration_minutes DECIMAL(5, 2),
  subject subject_type,
  goal TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'interrupted')),
  distractions_blocked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_plans table for teacher lesson planning
CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  class_grade INTEGER NOT NULL CHECK (class_grade >= 6 AND class_grade <= 12),
  learning_objectives TEXT[],
  lesson_plan_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create formative_assessments table
CREATE TABLE IF NOT EXISTS public.formative_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  question_count INTEGER NOT NULL CHECK (question_count > 0),
  assessment_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parent_messages table for teacher-parent communication
CREATE TABLE IF NOT EXISTS public.parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('progress_update', 'concern', 'achievement', 'general')),
  subject subject_type,
  message_data JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_settings table for user preferences and settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setting_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, setting_type)
);

-- Create ai_feedback table for storing AI-generated feedback
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject subject_type NOT NULL,
  content TEXT NOT NULL,
  feedback_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_plans table for AI-generated study plans
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject subject_type NOT NULL,
  plan_duration_days INTEGER NOT NULL,
  hours_per_day DECIMAL(4, 2) NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON public.focus_sessions(status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON public.focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_id ON public.lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON public.lesson_plans(subject);
CREATE INDEX IF NOT EXISTS idx_formative_assessments_teacher_id ON public.formative_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_formative_assessments_subject ON public.formative_assessments(subject);
CREATE INDEX IF NOT EXISTS idx_parent_messages_teacher_id ON public.parent_messages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_student_id ON public.parent_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON public.study_plans(user_id);

-- Enable RLS on new tables
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formative_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for focus_sessions
CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions"
ON public.focus_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for lesson_plans
CREATE POLICY "Teachers can view their own lesson plans"
ON public.lesson_plans
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own lesson plans"
ON public.lesson_plans
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own lesson plans"
ON public.lesson_plans
FOR UPDATE
USING (auth.uid() = teacher_id);

-- RLS Policies for formative_assessments
CREATE POLICY "Teachers can view their own assessments"
ON public.formative_assessments
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own assessments"
ON public.formative_assessments
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own assessments"
ON public.formative_assessments
FOR UPDATE
USING (auth.uid() = teacher_id);

-- RLS Policies for parent_messages
CREATE POLICY "Teachers can view their own parent messages"
ON public.parent_messages
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own parent messages"
ON public.parent_messages
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own parent messages"
ON public.parent_messages
FOR UPDATE
USING (auth.uid() = teacher_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for ai_feedback
CREATE POLICY "Users can view their own feedback"
ON public.ai_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.ai_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_plans
CREATE POLICY "Users can view their own study plans"
ON public.study_plans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plans"
ON public.study_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans"
ON public.study_plans
FOR UPDATE
USING (auth.uid() = user_id);


