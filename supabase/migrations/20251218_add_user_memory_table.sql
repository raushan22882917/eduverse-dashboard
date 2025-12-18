-- Create user_memory table for saving generated content
CREATE TABLE IF NOT EXISTS user_memory (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'video_notes', 'ai_response', 'content', 'explanation')),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
 
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_type ON user_memory(type);
CREATE INDEX IF NOT EXISTS idx_user_memory_subject ON user_memory(subject);
CREATE INDEX IF NOT EXISTS idx_user_memory_created_at ON user_memory(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own memory items" ON user_memory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory items" ON user_memory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory items" ON user_memory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory items" ON user_memory
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_memory_updated_at_trigger
    BEFORE UPDATE ON user_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memory_updated_at();