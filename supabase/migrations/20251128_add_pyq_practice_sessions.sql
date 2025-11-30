-- Create pyq_practice_sessions table for tracking PYQ practice attempts
CREATE TABLE IF NOT EXISTS public.pyq_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  marks_obtained DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,
  explanation TEXT,
  pyq_year INTEGER,
  difficulty difficulty_level,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pyq_practice_sessions_user_id ON public.pyq_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_practice_sessions_subject ON public.pyq_practice_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_pyq_practice_sessions_topic_id ON public.pyq_practice_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_pyq_practice_sessions_created_at ON public.pyq_practice_sessions(created_at);

-- Enable RLS on pyq_practice_sessions table
ALTER TABLE public.pyq_practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pyq_practice_sessions (users can manage their own)
CREATE POLICY "Users can view their own PYQ practice sessions"
ON public.pyq_practice_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PYQ practice sessions"
ON public.pyq_practice_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PYQ practice sessions"
ON public.pyq_practice_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all PYQ practice sessions"
ON public.pyq_practice_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pyq_practice_sessions_updated_at
BEFORE UPDATE ON public.pyq_practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

