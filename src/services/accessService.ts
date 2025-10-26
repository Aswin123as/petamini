const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface TrackUserData {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  pageUrl?: string;
}

export interface AccessStats {
  totalAccesses: number;
  uniqueUsers: number;
  last24Hours: number;
  timestamp: string;
}

export interface DailyStat {
  date: string;
  count: number;
  uniqueUsers: number;
}

export interface DailyStatsResponse {
  dailyStats: DailyStat[];
  period: number;
  startDate: string;
  endDate: string;
}

export interface PageAccess {
  id: string;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  pageUrl: string;
  userAgent: string;
  ipAddress: string;
  timestamp: string;
  createdAt: string;
}

class AccessService {
  /**
   * Track user page access
   */
  async trackPageAccess(userData: TrackUserData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.userId,
          username: userData.username,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          pageUrl: userData.pageUrl || window.location.href,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to track page access');
      }

      // Silent success - no console logs
    } catch (error) {
      // Silent error - tracking failures shouldn't break the app or show errors
      // Optionally log to error tracking service in production
    }
  }

  /**
   * Get page access statistics
   */
  async getAccessStats(): Promise<AccessStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/stats`);

      if (!response.ok) {
        throw new Error('Failed to get access stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting access stats:', error);
      throw error;
    }
  }

  /**
   * Get daily access statistics
   * @param days - Number of days to fetch (default: 30)
   */
  async getDailyAccessStats(days: number = 30): Promise<DailyStatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/daily?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to get daily access stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting daily access stats:', error);
      throw error;
    }
  }

  /**
   * Get user access history
   */
  async getUserAccessHistory(userId: number): Promise<PageAccess[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/history/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to get user access history');
      }

      const data = await response.json();
      return data.accesses || [];
    } catch (error) {
      console.error('Error getting user access history:', error);
      throw error;
    }
  }
}

export const accessService = new AccessService();
