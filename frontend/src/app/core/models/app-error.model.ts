type ErrorCodes = 'UPSTREAM_UNAVAILABLE' | 'UPSTREAM_DATA_ERROR' | 'TRIAL_NOT_FOUND' | 'VALIDATION_ERROR';

export interface ApiError {
  code: ErrorCodes;
  message: string;
}