import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TrialsApi } from './trials-api';
import { environment } from '../../environments/environment';

describe('TrialsApi', () => {
  let service: TrialsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrialsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends search, filters, and cursor as query params when provided', () => {
    service
      .getTrials('cancer', { condition: 'lung', status: 'RECRUITING', phase: 'PHASE2' }, 'abc123', 40)
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiBaseUrl}/trials`);
    expect(req.request.params.get('search')).toBe('cancer');
    expect(req.request.params.get('condition')).toBe('lung');
    expect(req.request.params.get('status')).toBe('RECRUITING');
    expect(req.request.params.get('phase')).toBe('PHASE2');
    expect(req.request.params.get('cursor')).toBe('abc123');
    expect(req.request.params.get('limit')).toBe('40');

    req.flush({ trials: [], nextCursor: null, totalCount: 0 });
  });

  it('omits search, filters, and cursor params when not provided', () => {
    service.getTrials(null, {}, null, 40).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiBaseUrl}/trials`);
    expect(req.request.params.has('search')).toBe(false);
    expect(req.request.params.has('condition')).toBe(false);
    expect(req.request.params.has('status')).toBe(false);
    expect(req.request.params.has('phase')).toBe(false);
    expect(req.request.params.has('cursor')).toBe(false);
    expect(req.request.params.get('limit')).toBe('40');

    req.flush({ trials: [], nextCursor: null, totalCount: 0 });
  });
});
