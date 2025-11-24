/**
 * TypeScript types for exam mode
 */

export type Subject = 'mathematics' | 'physics' | 'chemistry' | 'biology';

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'numerical';

export interface ExamQuestion {
  id: string;
  question: string;
  marks: number;
  question_type: QuestionType;
  options?: string[];
  correct_answer?: string;
  metadata: Record<string, any>;
}

export interface ExamSet {
  id: string;
  subject: Subject;
  year: number;
  duration_minutes: number;
  total_marks: number;
  questions: ExamQuestion[];
  metadata: Record<string, any>;
}

export interface TestSession {
  id: string;
  user_id: string;
  exam_set_id?: string;
  subject: Subject;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_marks?: number;
  score?: number;
  answers: Record<string, { answer: string; timestamp: string }>;
  is_completed: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AnswerSubmission {
  question_id: string;
  answer: string;
  timestamp: string;
}

export interface QuestionResult {
  question_id: string;
  question: string;
  student_answer: string;
  marks_awarded: number;
  max_marks: number;
  is_correct: boolean;
}

export interface ModelAnswer {
  question_id: string;
  question: string;
  model_answer: string;
  marks: number;
}

export interface MarkingRubric {
  total_questions: number;
  correct_answers: number;
  partially_correct: number;
  incorrect: number;
  evaluation_method: string;
}

export interface TestResult {
  session_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_minutes: number;
  correct_answers: number;
  total_questions: number;
  question_results: QuestionResult[];
  model_answers: ModelAnswer[];
  marking_rubric: MarkingRubric;
}

export interface TestSessionSummary {
  session_id: string;
  subject: Subject;
  date: string;
  score: number;
  total_marks: number;
  percentage: number;
}

export interface PerformanceTrend {
  user_id: string;
  subject: Subject;
  test_sessions: TestSessionSummary[];
  average_score: number;
  improvement_rate: number;
  strengths: string[];
  weaknesses: string[];
  metadata: Record<string, any>;
}
