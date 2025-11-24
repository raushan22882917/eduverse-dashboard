-- Create doubt type enum
CREATE TYPE public.doubt_type AS ENUM ('text', 'image', 'voice');

-- Create doubts table for storing doubt history
CREATE TABLE public.doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type doubt_type NOT NULL,
  content TEXT NOT NULL,
  subject subject_type,
  classified_subject subject_type,
  classified_concept TEXT,
  response_data JSONB DEFAULT '{}',
  confidence DECIMAL(5, 4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_doubts_user_id ON public.doubts(user_id);
CREATE INDEX idx_doubts_subject ON public.doubts(subject);
CREATE INDEX idx_doubts_type ON public.doubts(type);
CREATE INDEX idx_doubts_created_at ON public.doubts(created_at);

-- Enable RLS on doubts table
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doubts (users can manage their own)
CREATE POLICY "Users can view their own doubts"
ON public.doubts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doubts"
ON public.doubts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all doubts"
ON public.doubts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doubts_updated_at
BEFORE UPDATE ON public.doubts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
