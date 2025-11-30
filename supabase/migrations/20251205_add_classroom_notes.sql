-- Create classroom_notes table for user notes
CREATE TABLE IF NOT EXISTS public.classroom_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  subject subject_type,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classroom_notes_user_id ON public.classroom_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_notes_content_id ON public.classroom_notes(content_id);
CREATE INDEX IF NOT EXISTS idx_classroom_notes_subject ON public.classroom_notes(subject);
CREATE INDEX IF NOT EXISTS idx_classroom_notes_created_at ON public.classroom_notes(created_at);

-- Enable RLS on classroom_notes table
ALTER TABLE public.classroom_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classroom_notes (users can manage their own)
CREATE POLICY "Users can view their own classroom notes"
ON public.classroom_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classroom notes"
ON public.classroom_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classroom notes"
ON public.classroom_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classroom notes"
ON public.classroom_notes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all classroom notes"
ON public.classroom_notes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_classroom_notes_updated_at
BEFORE UPDATE ON public.classroom_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

