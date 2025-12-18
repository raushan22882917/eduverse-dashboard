-- Create quizzes table for saving generated quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    title TEXT NOT NULL,
    subject public.subject_type NOT NULL,
    description TEXT NULL,
    quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration_minutes INTEGER NULL,
    total_marks INTEGER NULL,
    class_grade INTEGER NULL,
    topic_ids UUID[] NULL DEFAULT '{}'::uuid[],
    is_active BOOLEAN NULL DEFAULT true,
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT quizzes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON public.quizzes USING btree (teacher_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes USING btree (subject) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quizzes_class_grade ON public.quizzes USING btree (class_grade) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON public.quizzes USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes USING btree (created_at) TABLESPACE pg_default;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quizzes" ON quizzes
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Users can insert their own quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Users can update their own quizzes" ON quizzes
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Users can delete their own quizzes" ON quizzes
    FOR DELETE USING (auth.uid() = teacher_id);