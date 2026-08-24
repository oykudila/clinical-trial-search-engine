import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { errorInterceptor } from './error-interceptor';

describe('errorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('passes through the backend ApiError shape unchanged', async () => {
    const backendError = new HttpErrorResponse({
      status: 502,
      error: { code: 'UPSTREAM_UNAVAILABLE', message: 'cannot reach the server.' },
    });
    const next = () => throwError(() => backendError);

    await expect(firstValueFrom(interceptor({} as never, next))).rejects.toEqual({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'cannot reach the server.',
    });
  });

  it('maps FastAPI validation errors (detail array) to VALIDATION_ERROR', async () => {
    const validationError = new HttpErrorResponse({
      status: 422,
      error: { detail: [{ loc: ['query', 'phase'], msg: 'invalid', type: 'value_error' }] },
    });
    const next = () => throwError(() => validationError);

    await expect(firstValueFrom(interceptor({} as never, next))).rejects.toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request.',
    });
  });

  it('falls back to UPSTREAM_UNAVAILABLE when there is no structured body', async () => {
    const networkError = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });
    const next = () => throwError(() => networkError);

    await expect(firstValueFrom(interceptor({} as never, next))).rejects.toEqual({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'cannot reach the server, please refresh the page.',
    });
  });
});
