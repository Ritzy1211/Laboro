'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { jobService, taskService } from '@/services/job-service';
import type { Job, Task, PaginationParams } from '@/types';
import type { 
  CreateJobRequest, 
  UpdateJobRequest, 
  JobSearchParams,
  JobApplicationRequest,
  CreateTaskRequest,
  UpdateTaskRequest
} from '@/services/job-service';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobSearchParams) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  myJobs: (filters?: { status?: Job['status'] }) => [...jobKeys.all, 'mine', filters] as const,
  assigned: (filters?: { status?: Job['status'] }) => [...jobKeys.all, 'assigned', filters] as const,
  recommended: () => [...jobKeys.all, 'recommended'] as const,
  applications: (jobId: string) => [...jobKeys.all, 'applications', jobId] as const,
  myApplications: () => [...jobKeys.all, 'my-applications'] as const,
};

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (jobId: string) => [...taskKeys.lists(), jobId] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  myTasks: (filters?: { status?: Task['status'] }) => [...taskKeys.all, 'mine', filters] as const,
};

// Job hooks
/**
 * Search jobs with filters
 */
export function useSearchJobs(params: JobSearchParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobService.searchJobs(params),
  });
}

/**
 * Infinite scroll job search
 */
export function useInfiniteJobs(params: Omit<JobSearchParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: jobKeys.list(params as JobSearchParams),
    queryFn: ({ pageParam = 1 }) => jobService.searchJobs({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Get single job
 */
export function useJob(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => jobService.getJob(jobId),
    enabled: !!jobId,
  });
}

/**
 * Get my jobs (as client)
 */
export function useMyJobs(params: PaginationParams & { status?: Job['status'] }) {
  return useQuery({
    queryKey: jobKeys.myJobs({ status: params.status }),
    queryFn: () => jobService.getMyJobs(params),
  });
}

/**
 * Get assigned jobs (as worker)
 */
export function useAssignedJobs(params: PaginationParams & { status?: Job['status'] }) {
  return useQuery({
    queryKey: jobKeys.assigned({ status: params.status }),
    queryFn: () => jobService.getAssignedJobs(params),
  });
}

/**
 * Get recommended jobs
 */
export function useRecommendedJobs(limit = 10) {
  return useQuery({
    queryKey: jobKeys.recommended(),
    queryFn: () => jobService.getRecommendedJobs(limit),
  });
}

/**
 * Create job mutation
 */
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateJobRequest) => jobService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

/**
 * Update job mutation
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: UpdateJobRequest }) =>
      jobService.updateJob(jobId, data),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

/**
 * Delete job mutation
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.deleteJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

/**
 * Apply to job mutation
 */
export function useApplyToJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: JobApplicationRequest }) =>
      jobService.applyToJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.myApplications() });
    },
  });
}

/**
 * Get job applications (client view)
 */
export function useJobApplications(jobId: string, params: PaginationParams) {
  return useQuery({
    queryKey: jobKeys.applications(jobId),
    queryFn: () => jobService.getJobApplications(jobId, params),
    enabled: !!jobId,
  });
}

/**
 * Get my applications (worker view)
 */
export function useMyApplications(params: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: jobKeys.myApplications(),
    queryFn: () => jobService.getMyApplications(params),
  });
}

/**
 * Hire worker mutation
 */
export function useHireWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, workerId, terms }: { 
      jobId: string; 
      workerId: string; 
      terms?: { rate?: number; startDate?: string } 
    }) => jobService.hireWorker(jobId, workerId, terms),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.applications(job.id) });
    },
  });
}

/**
 * Complete job mutation
 */
export function useCompleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.completeJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
      queryClient.invalidateQueries({ queryKey: jobKeys.assigned() });
    },
  });
}

// Task hooks
/**
 * Get tasks for a job
 */
export function useJobTasks(jobId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: taskKeys.list(jobId),
    queryFn: () => taskService.getJobTasks(jobId, params),
    enabled: !!jobId,
  });
}

/**
 * Get single task
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
  });
}

/**
 * Get my tasks
 */
export function useMyTasks(params: PaginationParams & { status?: Task['status']; priority?: string }) {
  return useQuery({
    queryKey: taskKeys.myTasks({ status: params.status }),
    queryFn: () => taskService.getMyTasks(params),
  });
}

/**
 * Create task mutation
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskService.createTask(data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task.jobId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
    },
  });
}

/**
 * Update task mutation
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      taskService.updateTask(taskId, data),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.list(task.jobId) });
    },
  });
}

/**
 * Update task status mutation
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: Task['status'] }) =>
      taskService.updateTaskStatus(taskId, status),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
    },
  });
}

/**
 * Log time on task mutation
 */
export function useLogTime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, hours, description }: { taskId: string; hours: number; description?: string }) =>
      taskService.logTime(taskId, hours, description),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

/**
 * Add comment to task mutation
 */
export function useAddTaskComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      taskService.addComment(taskId, content),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
    },
  });
}
