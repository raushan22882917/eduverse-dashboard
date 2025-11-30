-- Create practice_question_evaluations table for storing practice question evaluations
CREATE TABLE IF NOT EXISTS public.practice_question_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  chapter TEXT,
  question TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  evaluation JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5, 2),
  time_spent_seconds INTEGER DEFAULT 0,
  session_time_seconds INTEGER DEFAULT 0,
  session_time_minutes INTEGER DEFAULT 0,
  question_index INTEGER NOT NULL DEFAULT 0,
  all_questions JSONB DEFAULT '[]',
  time_per_question JSONB DEFAULT '[]',
  reference_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_evaluations_user_id ON public.practice_question_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_evaluations_subject ON public.practice_question_evaluations(subject);
CREATE INDEX IF NOT EXISTS idx_practice_evaluations_chapter ON public.practice_question_evaluations(chapter);
CREATE INDEX IF NOT EXISTS idx_practice_evaluations_created_at ON public.practice_question_evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_evaluations_score ON public.practice_question_evaluations(score);

-- Enable RLS on practice_question_evaluations table
ALTER TABLE public.practice_question_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_question_evaluations (users can manage their own)
CREATE POLICY "Users can view their own practice question evaluations"
ON public.practice_question_evaluations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice question evaluations"
ON public.practice_question_evaluations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice question evaluations"
ON public.practice_question_evaluations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all practice question evaluations"
ON public.practice_question_evaluations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_practice_evaluations_updated_at
BEFORE UPDATE ON public.practice_question_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

