import axios from '@/lib/axios';
import { Poll, PollResponse, PollVoteRequest, PollVoteResponse } from '@/types/poll';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const POLL_CACHE_KEY = 'poll-votes';

interface PollCache {
  poll: Poll;
  timestamp: number;
}

let pollCache: PollCache | null = null;

const generateDeviceHash = async (): Promise<string> => {
  // Combine user agent, screen resolution, and timestamp for a simple device fingerprint
  const userAgent = navigator.userAgent;
  const resolution = `${window.screen.width}x${window.screen.height}`;
  const timestamp = Date.now().toString();
  
  // Use SubtleCrypto if available for better security
  if (window.crypto && window.crypto.subtle) {
    const text = `${userAgent}-${resolution}-${timestamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback to simple hash
  return btoa(`${userAgent}-${resolution}-${timestamp}`).slice(0, 32);
};

// Função auxiliar para salvar voto no localStorage
const saveVoteToLocalStorage = (pollId: string, optionId: string) => {
  try {
    const votes = localStorage.getItem(POLL_CACHE_KEY);
    const votesData = votes ? JSON.parse(votes) : {};
    
    votesData[pollId] = {
      optionId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    localStorage.setItem(POLL_CACHE_KEY, JSON.stringify(votesData));
  } catch (error) {
    console.warn('Error saving vote to localStorage:', error);
  }
};

export const pollService = {
  async getActivePoll(): Promise<Poll> {
    // Check cache first
    if (pollCache && Date.now() - pollCache.timestamp < CACHE_DURATION) {
      return pollCache.poll;
    }

    try {
      const response = await axios.get<PollResponse>(`${BASE_URL}/polls/active`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to fetch poll');
      }

      // Update cache
      pollCache = {
        poll: response.data.data,
        timestamp: Date.now()
      };

      return response.data.data;
    } catch (error) {
      console.error('Error fetching active poll:', error);
      throw error;
    }
  },

  async vote(pollId: string, optionId: string): Promise<PollVoteResponse> {
    try {
      const deviceHash = await generateDeviceHash();
      
      const payload: PollVoteRequest = {
        optionId,
        deviceHash
      };

      const response = await axios.post<PollVoteResponse>(
        `${BASE_URL}/polls/${pollId}/vote`,
        payload
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Vote failed');
      }

      // Invalidate cache after successful vote
      pollCache = null;

      // Save vote to local storage
      saveVoteToLocalStorage(pollId, optionId);

      return response.data;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  },

  clearCache() {
    pollCache = null;
  },

  hasVoted(pollId: string): boolean {
    try {
      const votes = localStorage.getItem(POLL_CACHE_KEY);
      if (!votes) return false;
      
      const votesData = JSON.parse(votes);
      return !!votesData[pollId];
    } catch {
      return false;
    }
  },

  getVotedOption(pollId: string): string | null {
    try {
      const votes = localStorage.getItem(POLL_CACHE_KEY);
      if (!votes) return null;
      
      const votesData = JSON.parse(votes);
      return votesData[pollId]?.optionId || null;
    } catch {
      return null;
    }
  }
};

export default pollService; 