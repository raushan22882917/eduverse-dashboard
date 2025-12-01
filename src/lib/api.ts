/**
 * Comprehensive API client for backend services
 */

// Determine API base URL:
// 1. Use VITE_API_BASE_URL if explicitly set
// 2. In development (localhost), use local backend
// 3. In production, use relative path /api (proxied through Vercel)
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're in development (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api';
  }
  
  // Production: use relative path (proxied through Vercel)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

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
    let errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
    
    // Provide more helpful error messages for common issues
    if (response.status === 404) {
      errorMessage = `Endpoint not found: ${endpoint}`;
    } else if (response.status === 500) {
      // Check for specific backend errors
      const detailStr = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || {});
      const errorMsg = errorData.error?.message || errorMessage || '';
      const fullErrorText = errorMsg + ' ' + detailStr;
      
      // Handle structured error responses
      // Check for Supabase configuration errors first (configuration issues)
      if (fullErrorText.includes('supabase_url is required') ||
          fullErrorText.includes('supabase_url') ||
          fullErrorText.includes('SUPABASE_URL')) {
        errorMessage = "Backend configuration error: The backend is missing the Supabase URL environment variable (SUPABASE_URL). This is a backend configuration issue that needs to be fixed by the development team.";
      } else if (fullErrorText.includes('Invalid API key') || 
          fullErrorText.includes('Supabase') ||
          fullErrorText.includes('anon') ||
          fullErrorText.includes('service_role') ||
          (fullErrorText.includes('API key') && fullErrorText.includes('authentication'))) {
        errorMessage = "Backend authentication error: The backend is using an invalid Supabase API key. This is a backend configuration issue that needs to be fixed by the development team.";
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (fullErrorText.includes('unindent') || fullErrorText.includes('indentation') || fullErrorText.includes('IndentationError')) {
        // Python indentation error
        const fileMatch = fullErrorText.match(/\(([^)]+\.py),\s*line\s*(\d+)\)/);
        if (fileMatch) {
          errorMessage = `Backend code error: Python indentation issue in ${fileMatch[1]} at line ${fileMatch[2]}. Please contact support.`;
        } else {
          errorMessage = "Backend code error: Python indentation issue. Please contact support.";
        }
      } else if (fullErrorText.includes('f-string') || fullErrorText.includes('backslash') || fullErrorText.includes('SyntaxError')) {
        // Python syntax error
        const fileMatch = fullErrorText.match(/\(([^)]+\.py),\s*line\s*(\d+)\)/);
        if (fileMatch) {
          errorMessage = `Backend code error: Python syntax issue in ${fileMatch[1]} at line ${fileMatch[2]}. Please contact support.`;
        } else {
          errorMessage = "Backend code error: Python syntax issue. Please contact support.";
        }
      } else if (fullErrorText.includes('logging') || fullErrorText.includes('cannot access local variable')) {
        errorMessage = "Service error: Backend configuration issue";
      } else if (fullErrorText.includes('JSON could not be generated')) {
        errorMessage = "Service error: Database connection issue";
      } else {
        errorMessage = "Service error: Internal server error";
      }
    } else if (response.status === 503) {
      // Check for structured error response with retryable flag
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else {
        errorMessage = "Service temporarily unavailable - please try again later";
      }
    }
    
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
      }).catch(async (error) => {
        // Fallback to direct Gemini if RAG fails (500 or 503 errors)
        if (error.status === 500 || error.status === 503) {
          console.log("RAG query failed, falling back to direct Gemini...");
          try {
            return await fetchAPI<any>('/rag/query-direct', {
              method: 'POST',
              body: JSON.stringify(data),
            });
          } catch (fallbackError: any) {
            console.error("Direct Gemini fallback also failed:", fallbackError);
            throw fallbackError;
          }
        }
        throw error;
      }),
    queryDirect: (data: {
      query: string;
      subject?: string;
    }) =>
      fetchAPI<any>('/rag/query-direct', {
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
    wolframChat: (params: {
      query: string;
      include_steps?: boolean;
    }) => {
      const queryParams = new URLSearchParams({ query: params.query });
      if (params.include_steps !== undefined) {
        queryParams.append('include_steps', params.include_steps.toString());
      }
      
      return fetchAPI<any>(`/doubt/wolfram/chat?${queryParams}`, {
        method: 'POST',
      });
    },
  },

  // Homework endpoints
  homework: {
    start: (data: {
      user_id: string;
      question: string;
      subject?: string;
      question_id?: string;
      correct_answer?: string;
      metadata?: Record<string, any>;
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
    getSessions: (params?: {
      user_id?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.user_id) queryParams.append('user_id', params.user_id);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/homework/sessions${query ? `?${query}` : ''}`);
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
    getMicroplan: (microplanId: string) => {
      return fetchAPI<any>(`/microplan/${microplanId}`);
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

  // Quiz endpoints
  quiz: {
    startSession: (data: {
      user_id: string;
      microplan_id?: string;
      quiz_data: any;
      subject: string;
      duration_minutes?: number;
      total_marks?: number;
    }) =>
      fetchAPI<any>('/quiz/start', {
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
      
      return fetchAPI<any>(`/quiz/answer?${queryParams}`, {
        method: 'PUT',
        body: JSON.stringify(params.answer),
      });
    },
    submitQuiz: (params: {
      session_id: string;
      user_id: string;
    }) => {
      const queryParams = new URLSearchParams({
        session_id: params.session_id,
        user_id: params.user_id,
      });
      
      return fetchAPI<any>(`/quiz/submit?${queryParams}`, {
        method: 'POST',
      });
    },
    getSession: (sessionId: string, userId: string) => {
      const queryParams = new URLSearchParams({
        user_id: userId,
      });
      
      return fetchAPI<any>(`/quiz/session/${sessionId}?${queryParams}`);
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
    searchYouTube: (params: {
      query: string;
      max_results?: number;
    }) => {
      const queryParams = new URLSearchParams({ query: params.query });
      if (params.max_results) queryParams.append('max_results', params.max_results.toString());
      return fetchAPI<any[]>(`/videos/search/youtube?${queryParams}`);
    },
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
    getContentStatus: (content_id: string) =>
      fetchAPI<{
        content_id: string;
        processing_status: string;
        indexing_progress: number;
        embedding_id?: string;
        processing_started_at?: string;
        processing_completed_at?: string;
      }>(`/content/status/${content_id}`),
    uploadContentFile: (params: {
      file: File;
      subject: string;
      chapter?: string;
      topic_ids?: string[];
      class_grade?: number;
      difficulty?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      // Note: subject, chapter, topic_ids, class_grade, and difficulty should be query parameters, not form data
      const queryParams = new URLSearchParams();
      queryParams.append('subject', params.subject);
      if (params.chapter) {
        queryParams.append('chapter', params.chapter);
      }
      if (params.topic_ids && params.topic_ids.length > 0) {
        // Backend expects single topic_id, not array
        queryParams.append('topic_id', params.topic_ids[0]);
      }
      if (params.class_grade) {
        queryParams.append('class_grade', params.class_grade.toString());
      }
      if (params.difficulty && params.difficulty !== "none") {
        queryParams.append('difficulty', params.difficulty);
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
    openContent: (params: {
      content_id: string;
      user_id: string;
      trigger_processing?: boolean;
    }) => {
      const queryParams = new URLSearchParams({
        user_id: params.user_id,
      });
      if (params.trigger_processing !== undefined) {
        queryParams.append('trigger_processing', params.trigger_processing.toString());
      }
      return fetchAPI<any>(`/content/open/${params.content_id}?${queryParams}`);
    },
    getContentFolders: (params?: {
      class_grade?: number;
      subject?: string;
      parent_folder_id?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.class_grade) queryParams.append('class_grade', params.class_grade.toString());
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.parent_folder_id) queryParams.append('parent_folder_id', params.parent_folder_id);
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/content/folders${query ? `?${query}` : ''}`);
    },
    getContentByFolder: (params?: {
      folder_path?: string;
      class_grade?: number;
      subject?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.folder_path) queryParams.append('folder_path', params.folder_path);
      if (params?.class_grade) queryParams.append('class_grade', params.class_grade.toString());
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      const query = queryParams.toString();
      return fetchAPI<any>(`/content/by-folder${query ? `?${query}` : ''}`);
    },
    listAllContent: (params?: {
      subject?: string;
      content_type?: string;
      processing_status?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.content_type) queryParams.append('content_type', params.content_type);
      if (params?.processing_status) queryParams.append('processing_status', params.processing_status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/content/list${query ? `?${query}` : ''}`);
    },
    updateContent: (params: {
      content_id: string;
      title?: string;
      chapter?: string;
      difficulty?: string;
      class_grade?: number;
      chapter_number?: number;
      metadata?: Record<string, any>;
    }) => {
      return fetchAPI<any>(`/content/${params.content_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: params.title,
          chapter: params.chapter,
          difficulty: params.difficulty,
          class_grade: params.class_grade,
          chapter_number: params.chapter_number,
          metadata: params.metadata,
        }),
      });
    },
    deleteContent: (contentId: string) => {
      return fetchAPI<any>(`/content/${contentId}`, {
        method: 'DELETE',
      });
    },
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
    // School Management
    createSchool: (data: {
      name: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      phone?: string;
      email?: string;
      principal_name?: string;
    }) =>
      fetchAPI<any>('/admin/schools', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSchools: (params?: {
      city?: string;
      state?: string;
      is_active?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.city) queryParams.append('city', params.city);
      if (params?.state) queryParams.append('state', params.state);
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/admin/schools${query ? `?${query}` : ''}`);
    },
    getSchool: (schoolId: string) =>
      fetchAPI<any>(`/admin/schools/${schoolId}`),
    updateSchool: (schoolId: string, data: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      phone?: string;
      email?: string;
      principal_name?: string;
      is_active?: boolean;
    }) => {
      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      return fetchAPI<any>(`/admin/schools/${schoolId}`, {
        method: 'PUT',
        body: JSON.stringify(cleanData),
      });
    },
    deleteSchool: (schoolId: string) =>
      fetchAPI<any>(`/admin/schools/${schoolId}`, {
        method: 'DELETE',
      }),
    assignTeacherToSchool: (schoolId: string, teacherId: string) =>
      fetchAPI<any>(`/admin/schools/${schoolId}/teachers/${teacherId}`, {
        method: 'POST',
      }),
    removeTeacherFromSchool: (schoolId: string, teacherId: string) =>
      fetchAPI<any>(`/admin/schools/${schoolId}/teachers/${teacherId}`, {
        method: 'DELETE',
      }),
    getSchoolTeachers: (schoolId: string) =>
      fetchAPI<any[]>(`/admin/schools/${schoolId}/teachers`),
    getSchoolStudents: (schoolId: string, params?: {
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      const query = queryParams.toString();
      return fetchAPI<any[]>(`/admin/schools/${schoolId}/students${query ? `?${query}` : ''}`);
    },
    assignStudentToSchool: (schoolId: string, studentId: string) =>
      fetchAPI<any>(`/admin/schools/${schoolId}/students/${studentId}`, {
        method: 'POST',
      }),
    getAllTeachers: () =>
      fetchAPI<any[]>(`/admin/teachers`),
    getAllUsers: () =>
      fetchAPI<any[]>(`/admin/users`),
    createUser: (data: {
      email: string;
      password: string;
      full_name: string;
      role: "student" | "teacher";
      class_grade?: number;
      phone?: string;
      subject_specializations?: string[];
    }) =>
      fetchAPI<any>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    // Enhanced AI Tutor - Conversational Interface
    createSession: (data: {
      user_id: string;
      session_name?: string;
      subject?: string;
    }) =>
      fetchAPI<any>('/ai-tutoring/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSessions: (params: {
      user_id: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      return fetchAPI<any>(`/ai-tutoring/sessions?${queryParams.toString()}`);
    },
    getSessionMessages: (sessionId: string, limit?: number) => {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());
      return fetchAPI<any>(`/ai-tutoring/sessions/${sessionId}/messages?${queryParams.toString()}`);
    },
    sendMessage: (data: {
      session_id: string;
      user_id: string;
      content: string;
      subject?: string;
      message_type?: string;
    }) =>
      fetchAPI<any>('/ai-tutoring/sessions/message', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateLessonPlan: (data: {
      user_id: string;
      subject: string;
      days: number;
      hours_per_day: number;
    }) =>
      fetchAPI<any>('/ai-tutoring/lesson-plans/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getLessonPlans: (params: {
      user_id: string;
      subject?: string;
      is_active?: boolean;
    }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      return fetchAPI<any>(`/ai-tutoring/lesson-plans?${queryParams.toString()}`);
    },
    // Teacher endpoints
    getTeacherStudentSessions: (params: {
      teacher_id: string;
      student_id?: string;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('teacher_id', params.teacher_id);
      if (params.student_id) queryParams.append('student_id', params.student_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      return fetchAPI<any>(`/ai-tutoring/teacher/student-sessions?${queryParams.toString()}`);
    },
  },

  // Teacher Tools endpoints
  teacher: {
    getDashboard: (teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any>(`/teacher/dashboard?${queryParams.toString()}`);
    },
    getStudents: (teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any[]>(`/teacher/students?${queryParams.toString()}`);
    },
    getStudentPerformance: (studentId: string, teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any>(`/teacher/students/${studentId}/performance?${queryParams.toString()}`);
    },
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
    createQuiz: (data: {
      teacher_id: string;
      title: string;
      subject: string;
      description?: string;
      quiz_data: any;
      duration_minutes?: number;
      total_marks?: number;
      class_grade?: number;
      topic_ids?: string[];
      metadata?: Record<string, any>;
    }) =>
      fetchAPI<any>('/teacher/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getQuizzes: (teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any[]>(`/teacher/quizzes?${queryParams.toString()}`);
    },
    getQuiz: (quizId: string, teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any>(`/teacher/quizzes/${quizId}?${queryParams.toString()}`);
    },
    getQuizSessions: (teacherId: string) => {
      const queryParams = new URLSearchParams({ teacher_id: teacherId });
      return fetchAPI<any[]>(`/teacher/quiz-sessions?${queryParams.toString()}`);
    },
  },

  // Messages endpoints
  messages: {
    getConversations: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any[]>(`/messages/conversations?${queryParams}`);
    },
    getMessages: (params: {
      conversation_id: string;
      user_id: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams({
        conversation_id: params.conversation_id,
        user_id: params.user_id,
      });
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      return fetchAPI<any[]>(`/messages/conversations/${params.conversation_id}/messages?${queryParams}`);
    },
    createConversation: (params: {
      participant1_id: string;
      participant2_id: string;
    }) =>
      fetchAPI<any>('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    sendMessage: (data: {
      conversation_id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      metadata?: Record<string, any>;
    }) =>
      fetchAPI<any>('/messages/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    improveMessage: (data: {
      text: string;
      tone?: string;
      context?: string;
    }) =>
      fetchAPI<any>('/messages/improve', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSuggestions: (params: {
      context: string;
      recipient_role?: string;
    }) =>
      fetchAPI<string[]>('/messages/suggestions', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    markAsRead: (messageId: string, userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/messages/messages/${messageId}/read?${queryParams}`, {
        method: 'PUT',
      });
    },
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

  // Notification endpoints
  notifications: {
    getAll: (params: {
      user_id: string;
      is_read?: boolean;
      notification_type?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams({ user_id: params.user_id });
      if (params.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());
      if (params.notification_type) queryParams.append('notification_type', params.notification_type);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      return fetchAPI<any>(`/notifications?${queryParams}`);
    },
    getTeacherNotifications: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any[]>(`/notifications/teacher?${queryParams}`);
    },
    getAdminNotifications: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any[]>(`/notifications/admin?${queryParams}`);
    },
    markAsRead: (notificationId: string, userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/notifications/${notificationId}/read?${queryParams}`, {
        method: 'PUT',
      });
    },
    markAllAsRead: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/notifications/read-all?${queryParams}`, {
        method: 'PUT',
      });
    },
    getUnreadCount: (userId: string) => {
      const queryParams = new URLSearchParams({ user_id: userId });
      return fetchAPI<any>(`/notifications/unread-count?${queryParams}`);
    },
    create: (data: {
      user_id: string;
      title: string;
      message: string;
      type?: string;
      priority?: string;
      action_url?: string;
      created_by?: string;
    }) =>
      fetchAPI<any>('/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
