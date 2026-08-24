type ErrorCodes =
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_DATA_ERROR'
  | 'TRIAL_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UPSTREAM_RATE_LIMITED';

export interface ApiError {
  code: ErrorCodes;
  message: string;
}
