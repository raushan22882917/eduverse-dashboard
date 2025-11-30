-- Create quiz_sessions table for quiz attempts
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  microplan_id UUID REFERENCES public.microplans(id) ON DELETE CASCADE,
  quiz_data JSONB NOT NULL DEFAULT '{}',
  subject subject_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_marks INTEGER,
  score DECIMAL(5, 2),
  answers JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_microplan_id ON public.quiz_sessions(microplan_id);
CREATE INDEX idx_quiz_sessions_subject ON public.quiz_sessions(subject);
CREATE INDEX idx_quiz_sessions_is_completed ON public.quiz_sessions(is_completed);

-- Enable RLS on quiz_sessions table
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_sessions (users can manage their own)
CREATE POLICY "Users can view their own quiz sessions"
ON public.quiz_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions"
ON public.quiz_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions"
ON public.quiz_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz sessions"
ON public.quiz_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_sessions_updated_at
BEFORE UPDATE ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



