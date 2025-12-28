-- Virtual Labs System Migration
-- Creates tables for managing virtual lab experiments with HTML content

-- Virtual Labs table
CREATE TABLE IF NOT EXISTS virtual_labs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_grade INTEGER NOT NULL CHECK (class_grade >= 1 AND class_grade <= 12),
    topic VARCHAR(255),
    html_content TEXT NOT NULL, -- Store the HTML content
    css_content TEXT, -- Optional CSS
    js_content TEXT, -- Optional JavaScript
    thumbnail_url TEXT, -- Preview image
    difficulty_level VARCHAR(50) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER DEFAULT 30, -- in minutes
    learning_objectives TEXT[], -- Array of learning objectives
    prerequisites TEXT[], -- Array of prerequisites
    tags TEXT[], -- Array of tags for filtering
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual Lab Sessions table (track student interactions)
CREATE TABLE IF NOT EXISTS virtual_lab_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lab_id UUID REFERENCES virtual_labs(id) NOT NULL,
    session_name VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    interactions_count INTEGER DEFAULT 0,
    gesture_commands_used INTEGER DEFAULT 0,
    ai_assistance_requests INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2), -- 0-100 score
    completion_status VARCHAR(50) DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
    session_data JSONB, -- Store interaction data, gestures used, etc.
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual Lab Interactions table (detailed tracking)
CREATE TABLE IF NOT EXISTS virtual_lab_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES virtual_lab_sessions(id) NOT NULL,
    interaction_type VARCHAR(100) NOT NULL, -- 'gesture', 'click', 'ai_query', 'measurement', etc.
    interaction_data JSONB NOT NULL, -- Store specific interaction details
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    element_id VARCHAR(255), -- HTML element interacted with
    gesture_type VARCHAR(100), -- 'swipe', 'pinch', 'rotate', 'point', etc.
    ai_response TEXT, -- If AI was involved
    performance_impact DECIMAL(3,2) -- Impact on performance score
);

-- Virtual Lab AI Assistance table
CREATE TABLE IF NOT EXISTS virtual_lab_ai_assistance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES virtual_lab_sessions(id) NOT NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context_data JSONB, -- Lab state when query was made
    response_type VARCHAR(100), -- 'explanation', 'hint', 'correction', 'guidance'
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_labs_subject_grade ON virtual_labs(subject, class_grade);
CREATE INDEX IF NOT EXISTS idx_virtual_labs_active ON virtual_labs(is_active);
CREATE INDEX IF NOT EXISTS idx_virtual_lab_sessions_user ON virtual_lab_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_lab_sessions_lab ON virtual_lab_sessions(lab_id);
CREATE INDEX IF NOT EXISTS idx_virtual_lab_interactions_session ON virtual_lab_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_virtual_lab_interactions_type ON virtual_lab_interactions(interaction_type);

-- RLS Policies
ALTER TABLE virtual_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_lab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_lab_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_lab_ai_assistance ENABLE ROW LEVEL SECURITY;

-- Virtual Labs policies
CREATE POLICY "Anyone can view active virtual labs" ON virtual_labs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and teachers can manage virtual labs" ON virtual_labs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin' OR 
                auth.users.raw_user_meta_data->>'role' = 'teacher'
            )
        )
    );

-- Virtual Lab Sessions policies
CREATE POLICY "Users can view their own lab sessions" ON virtual_lab_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lab sessions" ON virtual_lab_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lab sessions" ON virtual_lab_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Virtual Lab Interactions policies
CREATE POLICY "Users can view interactions from their sessions" ON virtual_lab_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM virtual_lab_sessions 
            WHERE virtual_lab_sessions.id = virtual_lab_interactions.session_id 
            AND virtual_lab_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create interactions for their sessions" ON virtual_lab_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM virtual_lab_sessions 
            WHERE virtual_lab_sessions.id = virtual_lab_interactions.session_id 
            AND virtual_lab_sessions.user_id = auth.uid()
        )
    );

-- Virtual Lab AI Assistance policies
CREATE POLICY "Users can view AI assistance from their sessions" ON virtual_lab_ai_assistance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM virtual_lab_sessions 
            WHERE virtual_lab_sessions.id = virtual_lab_ai_assistance.session_id 
            AND virtual_lab_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create AI assistance for their sessions" ON virtual_lab_ai_assistance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM virtual_lab_sessions 
            WHERE virtual_lab_sessions.id = virtual_lab_ai_assistance.session_id 
            AND virtual_lab_sessions.user_id = auth.uid()
        )
    );

-- Update trigger for virtual_labs
CREATE OR REPLACE FUNCTION update_virtual_labs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_virtual_labs_updated_at
    BEFORE UPDATE ON virtual_labs
    FOR EACH ROW
    EXECUTE FUNCTION update_virtual_labs_updated_at();

-- Update trigger for virtual_lab_sessions
CREATE OR REPLACE FUNCTION update_virtual_lab_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_virtual_lab_sessions_updated_at
    BEFORE UPDATE ON virtual_lab_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_virtual_lab_sessions_updated_at();