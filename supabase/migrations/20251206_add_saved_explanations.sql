-- Create saved_explanations table for storing AI-generated explanations
CREATE TABLE IF NOT EXISTS public.saved_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  selected_text TEXT NOT NULL,
  explanation TEXT NOT NULL,
  explanation_type TEXT,
  subject subject_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_explanations_user_id ON public.saved_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_explanations_content_id ON public.saved_explanations(content_id);
CREATE INDEX IF NOT EXISTS idx_saved_explanations_subject ON public.saved_explanations(subject);
CREATE INDEX IF NOT EXISTS idx_saved_explanations_created_at ON public.saved_explanations(created_at);

-- Enable RLS on saved_explanations table
ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_explanations (users can manage their own)
CREATE POLICY "Users can view their own saved explanations"
ON public.saved_explanations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved explanations"
ON public.saved_explanations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved explanations"
ON public.saved_explanations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved explanations"
ON public.saved_explanations
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved explanations"
ON public.saved_explanations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_explanations_updated_at
BEFORE UPDATE ON public.saved_explanations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

