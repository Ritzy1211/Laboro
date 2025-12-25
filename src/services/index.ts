// Services barrel export
export { apiClient, APIError, buildPaginationParams } from './api-client';
export { authService } from './auth-service';
export { userService } from './user-service';
export { jobService, taskService } from './job-service';

// Re-export types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  SocialAuthRequest,
} from './auth-service';

export type {
  UpdateUserRequest,
  UpdatePreferencesRequest,
  UserSearchParams,
  WorkerProfileResponse,
  ClientProfileResponse,
} from './user-service';

export type {
  CreateJobRequest,
  UpdateJobRequest,
  JobSearchParams,
  JobApplicationRequest,
  JobApplication,
  CreateTaskRequest,
  UpdateTaskRequest,
} from './job-service';
