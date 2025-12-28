/**
 * Optimized API client - modular approach
 */
export { APIError, fetchAPI } from './base';
export { microplanAPI } from './microplan';
export { progressAPI } from './progress';

// Lazy load other API modules only when needed
export const ragAPI = {
  async query(query: string, userId: string, subject?: string) {
    const { ragAPI: ragModule } = await import('./rag');
    return ragModule.query(query, userId, subject);
  }
};

export const virtualLabsAPI = {
  async startSession(data: any) {
    const { virtualLabsAPI: labModule } = await import('./virtualLabs');
    return labModule.startSession(data);
  },
  async endSession(sessionId: string) {
    const { virtualLabsAPI: labModule } = await import('./virtualLabs');
    return labModule.endSession(sessionId);
  }
};

// Main API object for backward compatibility
export const api = {
  microplan: microplanAPI,
  progress: progressAPI,
  rag: ragAPI,
  virtualLabs: virtualLabsAPI
};