/**
 * Comprehensive API client for backend services
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : {};
    } catch {
      errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }
    // Handle both old format (detail) and new format (error.message)
    const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new APIError(
      errorMessage,
      response.status,
      errorData
    );
  }

  return response.json();
}

async function fetchFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : {};
    } catch {
      errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }
    // Handle both old format (detail) and new format (error.message)
    const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new APIError(
      errorMessage,
      response.status,
      errorData
    );
  }

  return response.json();
}

export const api = {
  // Health endpoints
  health: {
    check: () => fetchAPI<any>('/health'),
    config: () => fetchAPI<any>('/config'),
  },

  // RAG endpoints
  rag: {
    query: (data: {
      query: string;
      subject?: string;
      top_k?: number;
      confidence_threshold?: number;
      filters?: Record<string, any>;
    }) =>
      fetchAPI<any>('/rag/query', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    embed: (data: { texts: string[]; batch_size?: number; model_name?: string }) =>
      fetchAPI<any>('/rag/embed', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    similar: (data: {
      query_vector: number[];
      top_k?: number;
      subject?: string;
      filters?: Record<string, any>;
    }) =>
      fetchAPI<any[]>('/rag/similar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    stats: () => fetchAPI<any>('/rag/stats'),
    initialize: () =>
      fetchAPI<any>('/rag/initialize', {
        method: 'POST',
      }),
  },

  // Doubt solver endpoints
  doubt: {
    text: (params: {
      user_id: string;
      text: string;
      subject?: string;
    }) => {
      const queryParams = new URLSearchParams({
        user_id: params.user_id,
        text: params.text,
      });
      if (params.subject) queryParams.append('subject', params.subject);
      
      return fetchAPI<any>(`/doubt/text?${queryParams}`, {
        method: 'POST',
      });
    },
    image: (params: {
      user_id: string;
      image: File;
      subject?: string;
    }) => {
      const formData = new FormData();
      formData.append('user_id', params.user_id);
      formData.append('image', params.image);
      if (params.subject) formData.append('subject', params.subject);
      
      return fetchFormData<any>('/doubt/image', formData);
    },
    voice: (params: {
      user_id: string;
      audio: File;
      subject?: string;
    }) => {
      const formData = new FormData();
      formData.append('user_id', params.user_id);
      formData.append('audio', params.audio);
      if (params.subject) formData.append('subject', params.subject);
      
      return fetchFormData<any>('/doubt/voice', formData);
    },
    history: (params: {
      user_id: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      return fetchAPI<any[]>(`/doubt/history?${queryParams}`);
    },
  },

  // Homework endpoints
  homework: {
    start: (data: {
      user_id: string;
      question: string;
      subject?: string;
    }) =>
      fetchAPI<any>('/homework/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    hint: (data: {
      session_id: string;
      hint_level?: number;
    }) =>
      fetchAPI<any>('/homework/hint', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    attempt: (data: {
      session_id: string;
      answer: string;
    }) =>
      fetchAPI<any>('/homework/attempt', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSession: (sessionId: string) =>
      fetchAPI<any>(`/homework/session/${sessionId}`),
    getSessions: (params: {
      user_id: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      return fetchAPI<any[]>(`/homework/sessions?${queryParams}`);
    },
  },

  // Microplan endpoints
  microplan: {
    generate: (params: {
      user_id: string;
      plan_date?: string;
      subject?: string;
    }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      if (params.plan_date) queryParams.append('plan_date', params.plan_date);
      if (params.subject) queryParams.append('subject', params.subject);
      
      return fetchAPI<any>(`/microplan/generate?${queryParams}`, {
        method: 'POST',
      });
    },
    getToday: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/microplan/today?${queryParams}`);
    },
    getByDate: (params: { plan_date: string; user_id: string }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      return fetchAPI<any>(`/microplan/${params.plan_date}?${queryParams}`);
    },
    markComplete: (params: { microplan_id: string; user_id: string }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      return fetchAPI<any>(`/microplan/${params.microplan_id}/complete?${queryParams}`, {
        method: 'POST',
      });
    },
  },

  // Exam endpoints
  exam: {
    getSets: (params?: {
      subject?: string;
      year?: number;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/exam/sets${query ? `?${query}` : ''}`);
    },
    getSet: (examSetId: string) =>
      fetchAPI<any>(`/exam/sets/${examSetId}`),
    createSet: (data: any) =>
      fetchAPI<any>('/exam/sets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    startSession: (data: {
      user_id: string;
      exam_set_id?: string;
      subject: string;
      duration_minutes?: number;
      total_marks?: number;
    }) =>
      fetchAPI<any>('/exam/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    saveAnswer: (params: {
      session_id: string;
      user_id: string;
      answer: {
        question_id: string;
        answer: string;
        timestamp: string;
      };
    }) => {
      const queryParams = new URLSearchParams({
        session_id: params.session_id,
        user_id: params.user_id,
      });
      
      return fetchAPI<any>(`/exam/answer?${queryParams}`, {
        method: 'PUT',
        body: JSON.stringify(params.answer),
      });
    },
    submitTest: (params: { session_id: string; user_id: string }) => {
      const queryParams = new URLSearchParams(params);
      return fetchAPI<any>(`/exam/submit?${queryParams}`, {
        method: 'POST',
      });
    },
    getResults: (sessionId: string, userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/exam/results/${sessionId}?${queryParams}`);
    },
    getHistory: (params: {
      user_id: string;
      subject?: string;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      return fetchAPI<any>(`/exam/history?${queryParams}`);
    },
  },

  // Video endpoints
  videos: {
    curate: (data: {
      youtube_id: string;
      title?: string;
      subject?: string;
      topic_ids?: string[];
      timestamps?: any[];
      duration_seconds?: number;
      channel_name?: string;
      metadata?: Record<string, any>;
    }) =>
      fetchAPI<any>('/videos/curate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByTopic: (topicId: string, limit?: number) => {
      const queryParams = limit ? `?limit=${limit}` : '';
      return fetchAPI<any[]>(`/videos/topic/${topicId}${queryParams}`);
    },
    getBySubject: (subject: string, limit?: number) => {
      const queryParams = limit ? `?limit=${limit}` : '';
      return fetchAPI<any[]>(`/videos/subject/${subject}${queryParams}`);
    },
    getById: (videoId: string) =>
      fetchAPI<any>(`/videos/${videoId}`),
    getByYoutubeId: (youtubeId: string) =>
      fetchAPI<any>(`/videos/youtube/${youtubeId}`),
  },

  // HOTS endpoints
  hots: {
    generate: (data: {
      topic_id: string;
      count?: number;
    }) =>
      fetchAPI<any>('/hots/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByTopic: (topicId: string) =>
      fetchAPI<any[]>(`/hots/topic/${topicId}`),
    submitAttempt: (data: {
      user_id: string;
      question_id: string;
      answer: string;
      time_taken_minutes: number;
    }) =>
      fetchAPI<any>('/hots/attempt', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPerformance: (userId: string) =>
      fetchAPI<any>(`/hots/performance/${userId}`),
  },

  // Admin endpoints
  admin: {
    getDashboard: () =>
      fetchAPI<any>('/admin/dashboard'),
    getStudents: (params?: {
      subject?: string;
      min_mastery?: number;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.min_mastery) queryParams.append('min_mastery', params.min_mastery.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/admin/students${query ? `?${query}` : ''}`);
    },
    getStudentProfile: (studentId: string) =>
      fetchAPI<any>(`/admin/students/${studentId}`),
    uploadContent: (data: {
      content_type: string;
      subject: string;
      topic_ids: string[];
      content: string;
      metadata?: Record<string, any>;
    }) =>
      fetchAPI<any>('/content/upload', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadContentFile: (params: {
      file: File;
      subject: string;
      topic_ids?: string[];
      class_grade?: number;
    }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      // Note: subject, topic_ids, and class_grade should be query parameters, not form data
      const queryParams = new URLSearchParams();
      queryParams.append('subject', params.subject);
      if (params.topic_ids && params.topic_ids.length > 0) {
        // Backend expects single topic_id, not array
        queryParams.append('topic_id', params.topic_ids[0]);
      }
      if (params.class_grade) {
        queryParams.append('class_grade', params.class_grade.toString());
      }
      
      const query = queryParams.toString();
      return fetchFormData<any>(`/content/upload/file?${query}`, formData);
    },
    reindexContent: () =>
      fetchAPI<any>('/content/reindex', {
        method: 'POST',
      }),
    previewContent: (contentId: string) =>
      fetchAPI<any>(`/content/preview/${contentId}`),
    exportStudents: (params?: {
      subject?: string;
      min_mastery?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.min_mastery) queryParams.append('min_mastery', params.min_mastery.toString());
      
      const query = queryParams.toString();
      return fetchAPI<any>(`/admin/export${query ? `?${query}` : ''}`, {
        method: 'GET',
      });
    },
  },

  // Progress endpoints
  progress: {
    getUserProgress: (params: {
      user_id: string;
      subject?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.subject) queryParams.append('subject', params.subject);
      
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/progress/${params.user_id}${query ? `?${query}` : ''}`);
    },
    getSummary: (userId: string) =>
      fetchAPI<any>(`/progress/${userId}/summary`),
    getTopicProgress: (params: { user_id: string; topic_id: string }) =>
      fetchAPI<any>(`/progress/${params.user_id}/topic/${params.topic_id}`),
    updateProgress: (params: {
      user_id: string;
      topic_id: string;
      subject: string;
      correct_answers: number;
      total_questions: number;
      time_spent_minutes: number;
    }) => {
      const queryParams = new URLSearchParams({
        user_id: params.user_id,
        topic_id: params.topic_id,
        subject: params.subject,
        correct_answers: params.correct_answers.toString(),
        total_questions: params.total_questions.toString(),
        time_spent_minutes: params.time_spent_minutes.toString(),
      });
      
      return fetchAPI<any>(`/progress?${queryParams}`, {
        method: 'PUT',
      });
    },
    getAchievements: (userId: string) =>
      fetchAPI<any>(`/progress/${userId}/achievements`),
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () =>
      fetchAPI<any>('/analytics/dashboard'),
    getStudentAnalytics: (studentId: string) =>
      fetchAPI<any>(`/analytics/student/${studentId}`),
    getTrends: (params?: {
      user_id?: string;
      subject?: string;
      days?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.user_id) queryParams.append('user_id', params.user_id);
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.days) queryParams.append('days', params.days.toString());
      
      const query = queryParams.toString();
      return fetchAPI<any>(`/analytics/trends${query ? `?${query}` : ''}`);
    },
    logEvent: (params: {
      user_id: string;
      event_type: string;
      subject?: string;
      topic_id?: string;
    }) => {
      const queryParams = new URLSearchParams({
        user_id: params.user_id,
        event_type: params.event_type,
      });
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.topic_id) queryParams.append('topic_id', params.topic_id);
      
      return fetchAPI<any>(`/analytics/event?${queryParams}`, {
        method: 'POST',
      });
    },
    logTestResult: (params: {
      test_id: string;
      user_id: string;
      subject: string;
      exam_set_id?: string;
      score: number;
      total_marks: number;
      duration_minutes: number;
      questions_attempted: number;
      correct_answers: number;
    }) => {
      const queryParams = new URLSearchParams({
        test_id: params.test_id,
        user_id: params.user_id,
        subject: params.subject,
        score: params.score.toString(),
        total_marks: params.total_marks.toString(),
        duration_minutes: params.duration_minutes.toString(),
        questions_attempted: params.questions_attempted.toString(),
        correct_answers: params.correct_answers.toString(),
      });
      if (params.exam_set_id) queryParams.append('exam_set_id', params.exam_set_id);
      
      return fetchAPI<any>(`/analytics/test-result?${queryParams}`, {
        method: 'POST',
      });
    },
    logProgressSnapshot: (params: {
      user_id: string;
      subject: string;
      topic_id: string;
      mastery_score: number;
      questions_attempted: number;
      correct_answers: number;
      total_time_minutes: number;
      streak_days: number;
    }) => {
      const queryParams = new URLSearchParams({
        user_id: params.user_id,
        subject: params.subject,
        topic_id: params.topic_id,
        mastery_score: params.mastery_score.toString(),
        questions_attempted: params.questions_attempted.toString(),
        correct_answers: params.correct_answers.toString(),
        total_time_minutes: params.total_time_minutes.toString(),
        streak_days: params.streak_days.toString(),
      });
      
      return fetchAPI<any>(`/analytics/progress-snapshot?${queryParams}`, {
        method: 'POST',
      });
    },
  },

  // Translation endpoints
  translation: {
    translate: (data: {
      text: string;
      target_language?: string;
      source_language?: string;
    }) =>
      fetchAPI<any>('/translation/translate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    translateBatch: (data: {
      texts: string[];
      target_language?: string;
      source_language?: string;
    }) =>
      fetchAPI<any>('/translation/translate/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    detectLanguage: (text: string) =>
      fetchAPI<any>('/translation/detect', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    getSupportedLanguages: () =>
      fetchAPI<any>('/translation/languages'),
  },

  // AI Tutoring endpoints
  aiTutoring: {
    getFeedback: (data: {
      user_id: string;
      content: string;
      subject: string;
      performance_data?: Record<string, any>;
    }) =>
      fetchAPI<any>('/ai-tutoring/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateStudyPlan: (data: {
      user_id: string;
      subject: string;
      days?: number;
      hours_per_day?: number;
    }) =>
      fetchAPI<any>('/ai-tutoring/study-plan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    answerQuestion: (data: {
      user_id: string;
      question: string;
      subject: string;
      context?: string;
    }) =>
      fetchAPI<any>('/ai-tutoring/answer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Teacher Tools endpoints
  teacher: {
    generateLessonPlan: (data: {
      teacher_id: string;
      subject: string;
      topic: string;
      duration_minutes?: number;
      class_grade?: number;
      learning_objectives?: string[];
    }) =>
      fetchAPI<any>('/teacher/lesson-plan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createAssessment: (data: {
      teacher_id: string;
      subject: string;
      topic: string;
      question_count?: number;
      difficulty_levels?: string[];
    }) =>
      fetchAPI<any>('/teacher/assessment', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateParentMessage: (data: {
      teacher_id: string;
      student_id: string;
      message_type: 'progress_update' | 'concern' | 'achievement' | 'general';
      subject?: string;
      custom_content?: string;
    }) =>
      fetchAPI<any>('/teacher/parent-message', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Well-being & Focus endpoints
  wellbeing: {
    startFocusSession: (data: {
      user_id: string;
      duration_minutes: number;
      subject?: string;
      goal?: string;
    }) =>
      fetchAPI<any>('/wellbeing/focus/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    endFocusSession: (data: {
      session_id: string;
      user_id: string;
      distractions_count?: number;
      completed?: boolean;
    }) =>
      fetchAPI<any>('/wellbeing/focus/end', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMotivation: (userId: string, context?: string) => {
      const queryParams = new URLSearchParams();
      if (context) queryParams.append('context', context);
      const query = queryParams.toString();
      return fetchAPI<any>(`/wellbeing/motivation/${userId}${query ? `?${query}` : ''}`);
    },
    getDistractionGuardSettings: (userId: string) =>
      fetchAPI<any>(`/wellbeing/distraction-guard/${userId}`),
    updateDistractionGuardSettings: (userId: string, settings: Record<string, any>) =>
      fetchAPI<any>(`/wellbeing/distraction-guard/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
};
