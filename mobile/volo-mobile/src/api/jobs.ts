import { apiGet, apiPost } from '@/api/client';
import { Booking, JobListResponse } from '@volo/shared-types';

/** Get available / pending jobs for the worker. */
export const getAvailableJobs = (): Promise<JobListResponse> =>
  apiGet('/api/worker/jobs');

/** Get the worker's current active job. */
export const getCurrentJob = (): Promise<{ job: Booking | null }> =>
  apiGet('/api/worker/jobs?status=active');

/** Get a specific job by ID. */
export const getJobById = (id: string): Promise<{ job: Booking }> =>
  apiGet(`/api/worker/jobs/${id}`);

/** Accept a job offer. */
export const acceptJob = (id: string): Promise<{ success: boolean }> =>
  apiPost(`/api/worker/jobs/${id}/accept`);

/** Reject a job offer. */
export const rejectJob = (id: string, reason?: string): Promise<{ success: boolean }> =>
  apiPost(`/api/worker/jobs/${id}/reject`, { reason });

/** Mark job as started (worker arrived + OTP verified). */
export const startJob = (id: string, otp: string): Promise<{ success: boolean }> =>
  apiPost(`/api/worker/jobs/${id}/start`, { otp });

/** Mark job as completed. */
export const completeJob = (id: string): Promise<{ success: boolean }> =>
  apiPost(`/api/worker/jobs/${id}/complete`);

/** Get worker dashboard data. */
export const getWorkerDashboard = (): Promise<any> =>
  apiGet('/api/worker/dashboard');
