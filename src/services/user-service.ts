import apiClient, { buildPaginationParams } from './api-client';
import type { 
  User, 
  PaginatedResponse, 
  PaginationParams,
  Skill,
  TimeSlot 
} from '@/types';

// User update types
export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  timezone?: string;
  bio?: string;
  hourlyRate?: number;
  skills?: string[];
  languages?: string[];
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyDigest?: boolean;
}

export interface UserSearchParams extends PaginationParams {
  query?: string;
  role?: string;
  skills?: string[];
  timezone?: string;
  minReliabilityScore?: number;
  available?: boolean;
}

export interface WorkerProfileResponse extends User {
  skills: Skill[];
  availability: TimeSlot[];
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
}

export interface ClientProfileResponse extends User {
  companyName?: string;
  industry?: string;
  postedJobs: number;
  activeJobs: number;
  totalSpent: number;
}

// User service
export const userService = {
  /**
   * Get user by ID
   */
  getUser: (userId: string) =>
    apiClient.get<User>(`/users/${userId}`),

  /**
   * Get worker profile with extended details
   */
  getWorkerProfile: (userId: string) =>
    apiClient.get<WorkerProfileResponse>(`/users/${userId}/worker-profile`),

  /**
   * Get client profile with extended details
   */
  getClientProfile: (userId: string) =>
    apiClient.get<ClientProfileResponse>(`/users/${userId}/client-profile`),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateUserRequest) =>
    apiClient.patch<User>('/users/me', data),

  /**
   * Update user preferences
   */
  updatePreferences: (data: UpdatePreferencesRequest) =>
    apiClient.patch<User>('/users/me/preferences', data),

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('/api/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }
    
    return response.json() as Promise<{ avatarUrl: string }>;
  },

  /**
   * Search users (for matching, team building)
   */
  searchUsers: (params: UserSearchParams) =>
    apiClient.get<PaginatedResponse<User>>('/users/search', {
      params: {
        ...buildPaginationParams(params),
        q: params.query,
        role: params.role,
        skills: params.skills?.join(','),
        timezone: params.timezone,
        min_reliability: params.minReliabilityScore,
        available: params.available,
      },
    }),

  /**
   * Get recommended workers for a job
   */
  getRecommendedWorkers: (jobId: string, limit = 10) =>
    apiClient.get<User[]>(`/users/recommended`, {
      params: { job_id: jobId, limit },
    }),

  /**
   * Get user's skills
   */
  getUserSkills: (userId: string) =>
    apiClient.get<Skill[]>(`/users/${userId}/skills`),

  /**
   * Add skill to user
   */
  addSkill: (skillId: string) =>
    apiClient.post<Skill>('/users/me/skills', { skillId }),

  /**
   * Remove skill from user
   */
  removeSkill: (skillId: string) =>
    apiClient.delete<void>(`/users/me/skills/${skillId}`),

  /**
   * Update skill proficiency
   */
  updateSkillProficiency: (skillId: string, proficiencyLevel: number) =>
    apiClient.patch<Skill>(`/users/me/skills/${skillId}`, { proficiencyLevel }),

  /**
   * Get user's availability
   */
  getAvailability: (userId: string) =>
    apiClient.get<TimeSlot[]>(`/users/${userId}/availability`),

  /**
   * Update availability
   */
  updateAvailability: (slots: Omit<TimeSlot, 'id'>[]) =>
    apiClient.put<TimeSlot[]>('/users/me/availability', { slots }),

  /**
   * Delete account
   */
  deleteAccount: (password: string, reason?: string) =>
    apiClient.post<void>('/users/me/delete', { password, reason }),

  /**
   * Export user data (GDPR)
   */
  exportData: () =>
    apiClient.post<{ downloadUrl: string }>('/users/me/export'),
};

export default userService;
