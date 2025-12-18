-- Create classroom_mcq table for auto-generated MCQ questions and user responses
CREATE TABLE IF NOT EXISTS public.classroom_mcq (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject public.subject_type NOT NULL,
    chapter TEXT NOT NULL,
    content_title TEXT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INTEGER NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 5,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completion_percentage REAL NULL DEFAULT 0,
    time_taken_seconds INTEGER NULL,
    session_data JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT classroom_mcq_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classroom_mcq_user_id ON public.classroom_mcq USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classroom_mcq_subject ON public.classroom_mcq USING btree (subject) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classroom_mcq_chapter ON public.classroom_mcq USING btree (chapter) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classroom_mcq_completed ON public.classroom_mcq USING btree (is_completed) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classroom_mcq_created_at ON public.classroom_mcq USING btree (created_at) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE classroom_mcq ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own MCQ sessions" ON classroom_mcq
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MCQ sessions" ON classroom_mcq
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCQ sessions" ON classroom_mcq
    FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraint (optional, depends on your auth setup)
-- ALTER TABLE classroom_mcq ADD CONSTRAINT fk_classroom_mcq_user 
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;