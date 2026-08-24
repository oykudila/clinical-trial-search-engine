import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './models/app-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let normalized: ApiError;

      if (err.error?.code && err.error?.message) {
        normalized = { code: err.error.code, message: err.error.message };
      } else if (Array.isArray(err.error?.detail)) {
        normalized = { code: 'VALIDATION_ERROR', message: 'Invalid request.' };
      } else {
        normalized = {
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'cannot reach the server, please refresh the page.',
        };
      }

      return throwError(() => normalized);
    }),
  );
};
