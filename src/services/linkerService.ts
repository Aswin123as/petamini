// API Service for Linkers
// Use relative URL in production (proxied by nginx), absolute in development
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api');

export interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

export interface Linker {
  id: string;
  userId: number;
  username: string;
  content: string;
  links: string[];
  tags: string[];
  promotions: number;
  promotedBy: number[];
  timestamp: string;
  createdAt: string;
  preview?: LinkPreview;
  previewLoading?: boolean;
}

export interface CreateLinkerRequest {
  userId: number;
  username: string;
  content: string;
  tags: string[];
}

class LinkerService {
  // Get all linkers with optional sorting
  async getAllLinkers(
    sortBy: 'recent' | 'popular' = 'recent'
  ): Promise<Linker[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/linkers?sort=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch linkers');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching linkers:', error);
      throw error;
    }
  }

  // Create a new linker
  async createLinker(data: CreateLinkerRequest): Promise<Linker> {
    try {
      const response = await fetch(`${API_BASE_URL}/linkers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create linker');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating linker:', error);
      throw error;
    }
  }

  // Promote or unpromote a linker
  async promoteLinker(linkerId: string, userId: number): Promise<Linker> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linkers/${linkerId}/promote?userId=${userId}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to promote linker');
      }

      return await response.json();
    } catch (error) {
      console.error('Error promoting linker:', error);
      throw error;
    }
  }

  // Check if a URL has already been posted
  async checkDuplicateLink(url: string): Promise<{
    exists: boolean;
    linker?: Linker;
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linkers/check-duplicate?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        throw new Error('Failed to check duplicate link');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking duplicate link:', error);
      throw error;
    }
  }

  // Delete a linker
  async deleteLinker(linkerId: string, userId: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linkers/${linkerId}?userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete linker');
      }
    } catch (error) {
      console.error('Error deleting linker:', error);
      throw error;
    }
  }

  // Update a linker (edit content and tags)
  async updateLinker(
    linkerId: string,
    userId: number,
    content: string,
    tags: string[]
  ): Promise<Linker> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linkers/${linkerId}?userId=${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, tags }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update linker');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating linker:', error);
      throw error;
    }
  }

  // Get linkers by tag
  async getLinkersByTag(tag: string): Promise<Linker[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linkers/tag/${encodeURIComponent(tag)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch linkers by tag');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching linkers by tag:', error);
      throw error;
    }
  }

  // Fetch link preview using microlink.io
  async fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    try {
      const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          title: data.data.title || null,
          description: data.data.description || null,
          image: data.data.image?.url || null,
          logo: data.data.logo?.url || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching link preview:', error);
      return null;
    }
  }
}

export const linkerService = new LinkerService();
