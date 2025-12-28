export interface VirtualLab {
  id: string;
  title: string;
  description: string; // NOT NULL in your schema
  subject: 'mathematics' | 'physics' | 'chemistry' | 'biology'; // Constrained values
  class_grade: number; // 1-12
  topic: string; // NOT NULL in your schema
  html_content: string;
  css_content?: string;
  js_content?: string;
  thumbnail_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // 5-300 minutes
  learning_objectives: string[]; // JSONB array
  prerequisites: string[]; // JSONB array
  tags: string[]; // JSONB array
  is_active: boolean;
  created_by: string; // NOT NULL - UUID of creator
  created_at: string;
  updated_at: string;
}

export interface VirtualLabSession {
  id: string;
  user_id: string;
  lab_id: string;
  session_name?: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  interactions_count: number;
  gesture_commands_used: number;
  ai_assistance_requests: number;
  performance_score?: number;
  completion_status: 'in_progress' | 'completed' | 'abandoned';
  session_data?: any;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface VirtualLabInteraction {
  id: string;
  session_id: string;
  interaction_type: string;
  interaction_data: any;
  timestamp: string;
  element_id?: string;
  gesture_type?: string;
  ai_response?: string;
  performance_impact?: number;
}

export interface VirtualLabAIAssistance {
  id: string;
  session_id: string;
  user_query: string;
  ai_response: string;
  context_data?: any;
  response_type: 'explanation' | 'hint' | 'correction' | 'guidance';
  helpfulness_rating?: number;
  created_at: string;
}

export interface GestureCommand {
  type: 'swipe' | 'pinch' | 'rotate' | 'point' | 'grab' | 'release';
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity?: number;
  target_element?: string;
  coordinates?: { x: number; y: number };
}

export interface LabPerformanceMetrics {
  accuracy: number;
  speed: number;
  efficiency: number;
  creativity: number;
  problem_solving: number;
  overall_score: number;
}

export interface AILabAssistant {
  context: {
    current_lab: VirtualLab;
    session_progress: number;
    recent_interactions: VirtualLabInteraction[];
    performance_metrics: LabPerformanceMetrics;
  };
  capabilities: {
    explain_concepts: boolean;
    provide_hints: boolean;
    correct_mistakes: boolean;
    suggest_improvements: boolean;
    answer_questions: boolean;
  };
}