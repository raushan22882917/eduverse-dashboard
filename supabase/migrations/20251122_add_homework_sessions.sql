-- Create homework sessions table
CREATE TABLE public.homework_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  question TEXT NOT NULL,
  subject subject_type NOT NULL,
  hints_revealed INTEGER DEFAULT 0 CHECK (hints_revealed >= 0 AND hints_revealed <= 3),
  attempts JSONB DEFAULT '[]',
  is_complete BOOLEAN DEFAULT false,
  solution_revealed BOOLEAN DEFAULT false,
  correct_answer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_homework_sessions_user_id ON public.homework_sessions(user_id);
CREATE INDEX idx_homework_sessions_question_id ON public.homework_sessions(question_id);
CREATE INDEX idx_homework_sessions_is_complete ON public.homework_sessions(is_complete);

-- Enable RLS
ALTER TABLE public.homework_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework_sessions (users can manage their own)
CREATE POLICY "Users can view their own homework sessions"
ON public.homework_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own homework sessions"
ON public.homework_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homework sessions"
ON public.homework_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all homework sessions"
ON public.homework_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_homework_sessions_updated_at
BEFORE UPDATE ON public.homework_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
