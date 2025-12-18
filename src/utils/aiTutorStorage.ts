/**
 * Utility functions for AI Tutor local storage management
 */

export interface LocalSession {
  id: string;
  user_id: string;
  session_name: string;
  subject: string;
  is_active: boolean;
  started_at: string;
  last_message_at: string;
  created_at: string;
}

export interface LocalMessage {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  created_at: string;
  message_type?: string;
  subject?: string;
  metadata?: any;
  sources?: any[];
}

export const aiTutorStorage = {
  // Session management
  getSessions: (userId: string): LocalSession[] => {
    const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
    return sessions.filter((session: LocalSession) => session.user_id === userId);
  },

  saveSessions: (sessions: LocalSession[]): void => {
    localStorage.setItem('ai-tutor-sessions', JSON.stringify(sessions));
  },

  addSession: (session: LocalSession): void => {
    const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
    sessions.unshift(session);
    localStorage.setItem('ai-tutor-sessions', JSON.stringify(sessions));
  },

  updateSession: (sessionId: string, updates: Partial<LocalSession>): void => {
    const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
    const sessionIndex = sessions.findIndex((s: LocalSession) => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      localStorage.setItem('ai-tutor-sessions', JSON.stringify(sessions));
    }
  },

  deleteSession: (sessionId: string): void => {
    const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
    const filteredSessions = sessions.filter((s: LocalSession) => s.id !== sessionId);
    localStorage.setItem('ai-tutor-sessions', JSON.stringify(filteredSessions));
    // Also delete messages for this session
    localStorage.removeItem(`ai-tutor-messages-${sessionId}`);
  },

  // Message management
  getMessages: (sessionId: string): LocalMessage[] => {
    return JSON.parse(localStorage.getItem(`ai-tutor-messages-${sessionId}`) || '[]');
  },

  saveMessages: (sessionId: string, messages: LocalMessage[]): void => {
    localStorage.setItem(`ai-tutor-messages-${sessionId}`, JSON.stringify(messages));
  },

  addMessage: (sessionId: string, message: LocalMessage): void => {
    const messages = JSON.parse(localStorage.getItem(`ai-tutor-messages-${sessionId}`) || '[]');
    messages.push(message);
    localStorage.setItem(`ai-tutor-messages-${sessionId}`, JSON.stringify(messages));
  },

  // Utility functions
  clearAllData: (): void => {
    // Get all keys that start with 'ai-tutor-'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-tutor-')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all AI tutor related data
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  exportData: (): { sessions: LocalSession[]; messages: Record<string, LocalMessage[]> } => {
    const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
    const messages: Record<string, LocalMessage[]> = {};
    
    sessions.forEach((session: LocalSession) => {
      messages[session.id] = JSON.parse(localStorage.getItem(`ai-tutor-messages-${session.id}`) || '[]');
    });
    
    return { sessions, messages };
  },

  importData: (data: { sessions: LocalSession[]; messages: Record<string, LocalMessage[]> }): void => {
    localStorage.setItem('ai-tutor-sessions', JSON.stringify(data.sessions));
    
    Object.entries(data.messages).forEach(([sessionId, sessionMessages]) => {
      localStorage.setItem(`ai-tutor-messages-${sessionId}`, JSON.stringify(sessionMessages));
    });
  }
};