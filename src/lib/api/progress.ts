/**
 * Progress tracking API endpoints
 */
import { fetchAPI } from './base';

export interface ProgressSummary {
  lessonsCompleted: number;
  timeSpent: string;
  overallScore: number;
  mathProgress: number;
  scienceProgress: number;
  streak: number;
  totalPoints: number;
  rank: number;
}

export const progressAPI = {
  async getSummary(userId: string): Promise<ProgressSummary | null> {
    try {
      return await fetchAPI<ProgressSummary>(`/progress/summary/${userId}`);
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      // Return default values instead of null to prevent UI issues
      return {
        lessonsCompleted: 0,
        timeSpent: "0h",
        overallScore: 0,
        mathProgress: 0,
        scienceProgress: 0,
        streak: 0,
        totalPoints: 0,
        rank: 0
      };
    }
  },

  async updateProgress(userId: string, data: Partial<ProgressSummary>): Promise<void> {
    return fetchAPI('/progress/update', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, ...data })
    });
  }
};