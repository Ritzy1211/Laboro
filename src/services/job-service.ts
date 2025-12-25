import apiClient, { buildPaginationParams } from './api-client';
import type { 
  Job, 
  Task,
  PaginatedResponse, 
  PaginationParams,
  User
} from '@/types';

// Job types
export interface CreateJobRequest {
  title: string;
  description: string;
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    currency: string;
  };
  skills: string[];
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  visibility?: 'public' | 'private' | 'invite_only';
  timezone?: string;
  workingHours?: {
    start: string;
    end: string;
    days: number[];
  };
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: Job['status'];
}

export interface JobSearchParams extends PaginationParams {
  query?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  status?: Job['status'];
  priority?: string;
  clientId?: string;
  timezone?: string;
}

export interface JobApplicationRequest {
  coverLetter: string;
  proposedRate?: number;
  estimatedDuration?: string;
  availability?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  worker: User;
  coverLetter: string;
  proposedRate?: number;
  estimatedDuration?: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface CreateTaskRequest {
  jobId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  deadline?: string;
  priority?: Task['priority'];
  estimatedHours?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: Task['status'];
  actualHours?: number;
}

// Jobs service
export const jobService = {
  /**
   * Create a new job
   */
  createJob: (data: CreateJobRequest) =>
    apiClient.post<Job>('/jobs', data),

  /**
   * Get job by ID
   */
  getJob: (jobId: string) =>
    apiClient.get<Job>(`/jobs/${jobId}`),

  /**
   * Update job
   */
  updateJob: (jobId: string, data: UpdateJobRequest) =>
    apiClient.patch<Job>(`/jobs/${jobId}`, data),

  /**
   * Delete job
   */
  deleteJob: (jobId: string) =>
    apiClient.delete<void>(`/jobs/${jobId}`),

  /**
   * Search jobs
   */
  searchJobs: (params: JobSearchParams) =>
    apiClient.get<PaginatedResponse<Job>>('/jobs/search', {
      params: {
        ...buildPaginationParams(params),
        q: params.query,
        skills: params.skills?.join(','),
        budget_min: params.budgetMin,
        budget_max: params.budgetMax,
        status: params.status,
        priority: params.priority,
        client_id: params.clientId,
        timezone: params.timezone,
      },
    }),

  /**
   * Get jobs for current user (as client)
   */
  getMyJobs: (params: PaginationParams & { status?: Job['status'] }) =>
    apiClient.get<PaginatedResponse<Job>>('/jobs/mine', {
      params: {
        ...buildPaginationParams(params),
        status: params.status,
      },
    }),

  /**
   * Get jobs assigned to current user (as worker)
   */
  getAssignedJobs: (params: PaginationParams & { status?: Job['status'] }) =>
    apiClient.get<PaginatedResponse<Job>>('/jobs/assigned', {
      params: {
        ...buildPaginationParams(params),
        status: params.status,
      },
    }),

  /**
   * Get recommended jobs for worker
   */
  getRecommendedJobs: (limit = 10) =>
    apiClient.get<Job[]>('/jobs/recommended', { params: { limit } }),

  /**
   * Apply to a job
   */
  applyToJob: (jobId: string, data: JobApplicationRequest) =>
    apiClient.post<JobApplication>(`/jobs/${jobId}/apply`, data),

  /**
   * Get applications for a job (client view)
   */
  getJobApplications: (jobId: string, params: PaginationParams) =>
    apiClient.get<PaginatedResponse<JobApplication>>(`/jobs/${jobId}/applications`, {
      params: buildPaginationParams(params),
    }),

  /**
   * Get my applications (worker view)
   */
  getMyApplications: (params: PaginationParams & { status?: string }) =>
    apiClient.get<PaginatedResponse<JobApplication>>('/jobs/applications/mine', {
      params: {
        ...buildPaginationParams(params),
        status: params.status,
      },
    }),

  /**
   * Update application status (client)
   */
  updateApplicationStatus: (
    jobId: string, 
    applicationId: string, 
    status: JobApplication['status']
  ) =>
    apiClient.patch<JobApplication>(`/jobs/${jobId}/applications/${applicationId}`, { status }),

  /**
   * Hire worker for job
   */
  hireWorker: (jobId: string, workerId: string, terms?: { rate?: number; startDate?: string }) =>
    apiClient.post<Job>(`/jobs/${jobId}/hire`, { workerId, ...terms }),

  /**
   * Complete job
   */
  completeJob: (jobId: string) =>
    apiClient.post<Job>(`/jobs/${jobId}/complete`),

  /**
   * Cancel job
   */
  cancelJob: (jobId: string, reason?: string) =>
    apiClient.post<Job>(`/jobs/${jobId}/cancel`, { reason }),
};

// Tasks service
export const taskService = {
  /**
   * Create a new task
   */
  createTask: (data: CreateTaskRequest) =>
    apiClient.post<Task>('/tasks', data),

  /**
   * Get task by ID
   */
  getTask: (taskId: string) =>
    apiClient.get<Task>(`/tasks/${taskId}`),

  /**
   * Update task
   */
  updateTask: (taskId: string, data: UpdateTaskRequest) =>
    apiClient.patch<Task>(`/tasks/${taskId}`, data),

  /**
   * Delete task
   */
  deleteTask: (taskId: string) =>
    apiClient.delete<void>(`/tasks/${taskId}`),

  /**
   * Get tasks for a job
   */
  getJobTasks: (jobId: string, params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Task>>(`/jobs/${jobId}/tasks`, {
      params: params ? buildPaginationParams(params) : undefined,
    }),

  /**
   * Get tasks assigned to current user
   */
  getMyTasks: (params: PaginationParams & { status?: Task['status']; priority?: string }) =>
    apiClient.get<PaginatedResponse<Task>>('/tasks/mine', {
      params: {
        ...buildPaginationParams(params),
        status: params.status,
        priority: params.priority,
      },
    }),

  /**
   * Update task status
   */
  updateTaskStatus: (taskId: string, status: Task['status']) =>
    apiClient.patch<Task>(`/tasks/${taskId}/status`, { status }),

  /**
   * Assign task to user
   */
  assignTask: (taskId: string, assigneeId: string) =>
    apiClient.patch<Task>(`/tasks/${taskId}/assign`, { assigneeId }),

  /**
   * Log time on task
   */
  logTime: (taskId: string, hours: number, description?: string) =>
    apiClient.post<{ totalHours: number }>(`/tasks/${taskId}/time`, { hours, description }),

  /**
   * Add comment to task
   */
  addComment: (taskId: string, content: string) =>
    apiClient.post<{ id: string; content: string; createdAt: string }>(
      `/tasks/${taskId}/comments`,
      { content }
    ),

  /**
   * Get task comments
   */
  getComments: (taskId: string, params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<{ id: string; content: string; author: User; createdAt: string }>>(
      `/tasks/${taskId}/comments`,
      { params: params ? buildPaginationParams(params) : undefined }
    ),
};

export default { jobService, taskService };
