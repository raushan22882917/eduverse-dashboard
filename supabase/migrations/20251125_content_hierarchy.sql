-- Migration: Add hierarchical content structure and processing status
-- This enables proper folder organization and real-time PDF processing

-- Create content_folders table FIRST (before adding foreign key reference)
-- Create content_folders table for hierarchical organization
CREATE TABLE IF NOT EXISTS public.content_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.content_folders(id) ON DELETE CASCADE,
  folder_path TEXT NOT NULL, -- Full path: "class_12/physics/chapter_1"
  subject subject_type,
  class_grade INTEGER CHECK (class_grade >= 1 AND class_grade <= 12),
  chapter TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (folder_path)
);

-- Create indexes for content_folders table
CREATE INDEX IF NOT EXISTS idx_content_folders_path ON public.content_folders(folder_path);
CREATE INDEX IF NOT EXISTS idx_content_folders_parent ON public.content_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_content_folders_subject ON public.content_folders(subject);

-- NOW add columns to content table for hierarchy (after content_folders table exists)
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES public.content_folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS folder_path TEXT, -- e.g., "class_12/physics/chapter_1"
ADD COLUMN IF NOT EXISTS file_url TEXT, -- URL to stored file (PDF, etc.)
ADD COLUMN IF NOT EXISTS file_type TEXT, -- 'pdf', 'docx', 'txt', etc.
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS class_grade INTEGER CHECK (class_grade >= 1 AND class_grade <= 12);

-- Create indexes for content table columns (AFTER columns are added)
CREATE INDEX IF NOT EXISTS idx_content_folder_path ON public.content(folder_path);
CREATE INDEX IF NOT EXISTS idx_content_processing_status ON public.content(processing_status);
CREATE INDEX IF NOT EXISTS idx_content_class_grade ON public.content(class_grade);

-- Create content_access_log table to track when content is opened
CREATE TABLE IF NOT EXISTS public.content_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'download', 'rag_query'
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processing_triggered BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_content_access_log_content ON public.content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_log_user ON public.content_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_log_accessed ON public.content_access_log(accessed_at);

-- Function to automatically create folder path
CREATE OR REPLACE FUNCTION generate_folder_path(
  p_class_grade INTEGER,
  p_subject TEXT,
  p_chapter TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  IF p_chapter IS NOT NULL THEN
    RETURN format('class_%s/%s/%s', p_class_grade, p_subject, lower(regexp_replace(p_chapter, '[^a-zA-Z0-9]', '_', 'g')));
  ELSE
    RETURN format('class_%s/%s', p_class_grade, p_subject);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure folder exists
CREATE OR REPLACE FUNCTION ensure_content_folder(
  p_folder_path TEXT,
  p_name TEXT,
  p_parent_folder_id UUID DEFAULT NULL,
  p_subject subject_type DEFAULT NULL,
  p_class_grade INTEGER DEFAULT NULL,
  p_chapter TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_folder_id UUID;
BEGIN
  -- Check if folder exists
  SELECT id INTO v_folder_id
  FROM public.content_folders
  WHERE folder_path = p_folder_path;
  
  -- If exists, return it
  IF v_folder_id IS NOT NULL THEN
    RETURN v_folder_id;
  END IF;
  
  -- Otherwise, create it
  INSERT INTO public.content_folders (
    name, parent_folder_id, folder_path, subject, class_grade, chapter, created_by
  ) VALUES (
    p_name, p_parent_folder_id, p_folder_path, p_subject, p_class_grade, p_chapter, p_created_by
  ) RETURNING id INTO v_folder_id;
  
  RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql;

-- Update content table to set folder_path automatically if not provided
CREATE OR REPLACE FUNCTION set_content_folder_path()
RETURNS TRIGGER AS $$
BEGIN
  -- If folder_path is not set but we have class_grade and subject, generate it
  IF NEW.folder_path IS NULL AND NEW.class_grade IS NOT NULL AND NEW.subject IS NOT NULL THEN
    NEW.folder_path := generate_folder_path(NEW.class_grade, NEW.subject::TEXT, NEW.chapter);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_content_folder_path
BEFORE INSERT OR UPDATE ON public.content
FOR EACH ROW
WHEN (NEW.folder_path IS NULL AND NEW.class_grade IS NOT NULL AND NEW.subject IS NOT NULL)
EXECUTE FUNCTION set_content_folder_path();

-- Add RLS policies for content folders
ALTER TABLE public.content_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read folders
CREATE POLICY "Folders are viewable by everyone"
ON public.content_folders FOR SELECT
USING (true);

-- Policy: Only authenticated users can insert folders
CREATE POLICY "Authenticated users can create folders"
ON public.content_folders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only admins can update/delete folders
CREATE POLICY "Admins can update folders"
ON public.content_folders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can delete folders"
ON public.content_folders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add RLS policies for content_access_log
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own access logs
CREATE POLICY "Users can view own access logs"
ON public.content_access_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own access logs
CREATE POLICY "Users can log their own access"
ON public.content_access_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

