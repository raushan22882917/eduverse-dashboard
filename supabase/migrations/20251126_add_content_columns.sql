-- Migration: Add missing columns to content table for Class, Chapter Name, and Chapter Number
-- This ensures all necessary columns exist for the content management interface

-- Add chapter_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content' 
        AND column_name = 'chapter_number'
    ) THEN
        ALTER TABLE public.content
        ADD COLUMN chapter_number INTEGER CHECK (chapter_number >= 1);
        
        -- Create index for chapter_number
        CREATE INDEX IF NOT EXISTS idx_content_chapter_number ON public.content(chapter_number);
    END IF;
END $$;

-- Ensure class_grade column exists (it should already exist from previous migration, but check anyway)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content' 
        AND column_name = 'class_grade'
    ) THEN
        ALTER TABLE public.content
        ADD COLUMN class_grade INTEGER CHECK (class_grade >= 1 AND class_grade <= 12);
        
        -- Create index for class_grade if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_content_class_grade ON public.content(class_grade);
    END IF;
END $$;

-- Ensure chapter column exists (it should already exist, but check anyway)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content' 
        AND column_name = 'chapter'
    ) THEN
        ALTER TABLE public.content
        ADD COLUMN chapter TEXT;
        
        -- Create index for chapter if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_content_chapter ON public.content(chapter);
    END IF;
END $$;

-- Migrate existing data from metadata to direct columns if needed
-- This helps if data was previously stored only in metadata JSONB
DO $$
DECLARE
    content_record RECORD;
BEGIN
    -- Update class_grade from metadata if column is NULL but metadata has it
    FOR content_record IN 
        SELECT id, metadata 
        FROM public.content 
        WHERE class_grade IS NULL 
        AND metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND metadata ? 'class_grade'
    LOOP
        UPDATE public.content
        SET class_grade = (content_record.metadata->>'class_grade')::INTEGER
        WHERE id = content_record.id
        AND (content_record.metadata->>'class_grade')::INTEGER IS NOT NULL;
    END LOOP;
    
    -- Update chapter_number from metadata if column is NULL but metadata has it
    FOR content_record IN 
        SELECT id, metadata 
        FROM public.content 
        WHERE chapter_number IS NULL 
        AND metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND metadata ? 'chapter_number'
    LOOP
        UPDATE public.content
        SET chapter_number = (content_record.metadata->>'chapter_number')::INTEGER
        WHERE id = content_record.id
        AND (content_record.metadata->>'chapter_number')::INTEGER IS NOT NULL;
    END LOOP;
END $$;

-- Migrate title from metadata to title column if title column is empty/null
DO $$
DECLARE
    content_record RECORD;
BEGIN
    -- Update title column from metadata if title column is NULL/empty but metadata has title
    FOR content_record IN 
        SELECT id, metadata, title
        FROM public.content 
        WHERE (title IS NULL OR title = '')
        AND metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND metadata ? 'title'
        AND (metadata->>'title') IS NOT NULL
        AND (metadata->>'title') != ''
    LOOP
        UPDATE public.content
        SET title = content_record.metadata->>'title',
            metadata = content_record.metadata - 'title'  -- Remove title from metadata
        WHERE id = content_record.id;
    END LOOP;
END $$;

-- Add comment to columns for documentation
COMMENT ON COLUMN public.content.class_grade IS 'Class/Grade level (1-12) for organizing content by educational level';
COMMENT ON COLUMN public.content.chapter IS 'Chapter name for organizing content within subjects';
COMMENT ON COLUMN public.content.chapter_number IS 'Chapter number for sequential ordering of chapters';
COMMENT ON COLUMN public.content.title IS 'Content title - should be stored in title column, not in metadata';

