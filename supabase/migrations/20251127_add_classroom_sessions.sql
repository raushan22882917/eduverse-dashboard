-- Create classroom_sessions table for tracking study sessions
CREATE TABLE IF NOT EXISTS public.classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  subject subject_type NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  saved_explanations_count INTEGER NOT NULL DEFAULT 0,
  interactions_count INTEGER NOT NULL DEFAULT 0,
  pages_viewed INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_user_id ON public.classroom_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_content_id ON public.classroom_sessions(content_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_subject ON public.classroom_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_started_at ON public.classroom_sessions(started_at);

-- Enable RLS on classroom_sessions table
ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classroom_sessions (users can manage their own)
CREATE POLICY "Users can view their own classroom sessions"
ON public.classroom_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classroom sessions"
ON public.classroom_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classroom sessions"
ON public.classroom_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all classroom sessions"
ON public.classroom_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_classroom_sessions_updated_at
BEFORE UPDATE ON public.classroom_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

