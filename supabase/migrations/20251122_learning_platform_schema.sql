-- Create subject enum
CREATE TYPE public.subject_type AS ENUM ('mathematics', 'physics', 'chemistry', 'biology');

-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('ncert', 'pyq', 'hots', 'video');

-- Create difficulty enum
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject subject_type NOT NULL,
  chapter TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (subject, chapter, order_index)
);

-- Create content table for NCERT, PYQ, HOTS content
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type content_type NOT NULL,
  subject subject_type NOT NULL,
  chapter TEXT,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  difficulty difficulty_level,
  title TEXT,
  content_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pyqs table
CREATE TABLE public.pyqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject subject_type NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  question TEXT NOT NULL,
  solution TEXT NOT NULL,
  marks INTEGER NOT NULL CHECK (marks > 0),
  topic_ids UUID[] DEFAULT '{}',
  difficulty difficulty_level,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hots_questions table
CREATE TABLE public.hots_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject subject_type NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  solution TEXT NOT NULL,
  difficulty difficulty_level DEFAULT 'hard',
  question_type TEXT DEFAULT 'case_based',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_sessions table for exam tracking
CREATE TABLE public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exam_set_id UUID,
  subject subject_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_marks INTEGER,
  score DECIMAL(5, 2),
  answers JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  transcript TEXT,
  timestamps JSONB DEFAULT '[]',
  topic_ids UUID[] DEFAULT '{}',
  subject subject_type,
  duration_seconds INTEGER,
  channel_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress table for mastery scores and streaks
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  mastery_score DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0,
  last_streak_date DATE,
  achievements JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

-- Create microplans table for daily learning plans
CREATE TABLE public.microplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  subject subject_type NOT NULL,
  concept_summary_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  pyq_ids UUID[] DEFAULT '{}',
  hots_question_id UUID REFERENCES public.hots_questions(id) ON DELETE SET NULL,
  quiz_data JSONB DEFAULT '{}',
  estimated_minutes INTEGER DEFAULT 15,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date, subject)
);

-- Create indexes for better query performance
CREATE INDEX idx_topics_subject ON public.topics(subject);
CREATE INDEX idx_topics_chapter ON public.topics(chapter);
CREATE INDEX idx_content_type ON public.content(type);
CREATE INDEX idx_content_subject ON public.content(subject);
CREATE INDEX idx_content_topic_id ON public.content(topic_id);
CREATE INDEX idx_content_embedding_id ON public.content(embedding_id);
CREATE INDEX idx_pyqs_subject ON public.pyqs(subject);
CREATE INDEX idx_pyqs_year ON public.pyqs(year);
CREATE INDEX idx_hots_questions_subject ON public.hots_questions(subject);
CREATE INDEX idx_hots_questions_topic_id ON public.hots_questions(topic_id);
CREATE INDEX idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_subject ON public.test_sessions(subject);
CREATE INDEX idx_videos_youtube_id ON public.videos(youtube_id);
CREATE INDEX idx_videos_subject ON public.videos(subject);
CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_progress_topic_id ON public.progress(topic_id);
CREATE INDEX idx_progress_subject ON public.progress(subject);
CREATE INDEX idx_microplans_user_id ON public.microplans(user_id);
CREATE INDEX idx_microplans_plan_date ON public.microplans(plan_date);

-- Enable RLS on all tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hots_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microplans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics (public read, admin write)
CREATE POLICY "Anyone can view topics"
ON public.topics
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert topics"
ON public.topics
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update topics"
ON public.topics
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete topics"
ON public.topics
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content (public read, admin write)
CREATE POLICY "Anyone can view content"
ON public.content
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert content"
ON public.content
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content"
ON public.content
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content"
ON public.content
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pyqs (public read, admin write)
CREATE POLICY "Anyone can view pyqs"
ON public.pyqs
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert pyqs"
ON public.pyqs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pyqs"
ON public.pyqs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pyqs"
ON public.pyqs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for hots_questions (public read, admin write)
CREATE POLICY "Anyone can view hots_questions"
ON public.hots_questions
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hots_questions"
ON public.hots_questions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hots_questions"
ON public.hots_questions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hots_questions"
ON public.hots_questions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_sessions (users can manage their own)
CREATE POLICY "Users can view their own test sessions"
ON public.test_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test sessions"
ON public.test_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions"
ON public.test_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all test sessions"
ON public.test_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for videos (public read, admin write)
CREATE POLICY "Anyone can view videos"
ON public.videos
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert videos"
ON public.videos
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos"
ON public.videos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
ON public.videos
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for progress (users can manage their own)
CREATE POLICY "Users can view their own progress"
ON public.progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON public.progress
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for microplans (users can manage their own)
CREATE POLICY "Users can view their own microplans"
ON public.microplans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own microplans"
ON public.microplans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own microplans"
ON public.microplans
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all microplans"
ON public.microplans
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pyqs_updated_at
BEFORE UPDATE ON public.pyqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hots_questions_updated_at
BEFORE UPDATE ON public.hots_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_sessions_updated_at
BEFORE UPDATE ON public.test_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
BEFORE UPDATE ON public.progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_microplans_updated_at
BEFORE UPDATE ON public.microplans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
