/**
 * Microplan API endpoints
 */
import { fetchAPI } from './base';

export interface MicroplanData {
  id: string;
  user_id: string;
  date: string;
  subjects: Array<{
    subject: string;
    topics: string[];
    duration: number;
    difficulty: string;
  }>;
  total_duration: number;
  created_at: string;
}

export const microplanAPI = {
  async getToday(userId: string): Promise<MicroplanData | null> {
    try {
      return await fetchAPI<MicroplanData>(`/microplan/today/${userId}`);
    } catch (error) {
      console.error('Error fetching today\'s microplan:', error);
      return null;
    }
  },

  async generate(userId: string, preferences?: any): Promise<MicroplanData> {
    return fetchAPI<MicroplanData>('/microplan/generate', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, preferences })
    });
  },

  async getHistory(userId: string, limit = 10): Promise<MicroplanData[]> {
    return fetchAPI<MicroplanData[]>(`/microplan/history/${userId}?limit=${limit}`);
  }
};