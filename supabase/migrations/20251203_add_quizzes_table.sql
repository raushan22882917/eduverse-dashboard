-- Create quizzes table for storing teacher-created quiz templates
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject subject_type NOT NULL,
  description TEXT,
  quiz_data JSONB NOT NULL DEFAULT '{}',
  duration_minutes INTEGER,
  total_marks INTEGER,
  class_grade INTEGER,
  topic_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_quizzes_teacher_id ON public.quizzes(teacher_id);
CREATE INDEX idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX idx_quizzes_class_grade ON public.quizzes(class_grade);
CREATE INDEX idx_quizzes_is_active ON public.quizzes(is_active);
CREATE INDEX idx_quizzes_created_at ON public.quizzes(created_at);

-- Enable RLS on quizzes table
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
-- Teachers can view their own quizzes
CREATE POLICY "Teachers can view their own quizzes"
ON public.quizzes
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can insert their own quizzes
CREATE POLICY "Teachers can insert their own quizzes"
ON public.quizzes
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own quizzes
CREATE POLICY "Teachers can update their own quizzes"
ON public.quizzes
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their own quizzes
CREATE POLICY "Teachers can delete their own quizzes"
ON public.quizzes
FOR DELETE
USING (auth.uid() = teacher_id);

-- Admins can view all quizzes
CREATE POLICY "Admins can view all quizzes"
ON public.quizzes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Students can view active quizzes from their school's teachers
CREATE POLICY "Students can view active quizzes from their school's teachers"
ON public.quizzes
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    JOIN public.student_profiles sp ON tp.school_id = sp.school_id
    WHERE tp.user_id = quizzes.teacher_id
    AND sp.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

