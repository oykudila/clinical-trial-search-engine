import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { FavoritesState } from './favorites-state';
import { TrialsApi } from './trials-api';
import { Trial } from './models/trial.model';
import { ApiError } from './models/app-error.model';

const mockTrial: Trial = {
  nctId: 'NCT00000001',
  briefTitle: 'Test Trial',
  overallStatus: 'RECRUITING',
  conditions: [],
  phases: [],
  interventions: [],
};

describe('FavoritesState', () => {
  let service: FavoritesState;
  let addFavoriteSpy: ReturnType<typeof vi.fn>;
  let removeFavoriteSpy: ReturnType<typeof vi.fn>;

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TrialsApi,
          useValue: {
            getFavorites: vi.fn().mockReturnValue(of([])),
            addFavorite: addFavoriteSpy,
            removeFavorite: removeFavoriteSpy,
          },
        },
      ],
    });
    service = TestBed.inject(FavoritesState);
  }

  it('should be created', () => {
    addFavoriteSpy = vi.fn();
    removeFavoriteSpy = vi.fn();
    setup();
    expect(service).toBeTruthy();
  });

  it('adds the trial to favorites immediately, before the request resolves (optimistic UI update)', () => {
    const action$ = new Subject<void>();
    addFavoriteSpy = vi.fn().mockReturnValue(action$);
    removeFavoriteSpy = vi.fn();
    setup();

    service.toggleFavorite(mockTrial);

    // still pending
    expect(service.favoriteIds().has(mockTrial.nctId)).toBe(true);
  });

  it('rolls back the optimistic update and sets an error if the request fails', () => {
    const apiError: ApiError = {
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Cannot reach the server.',
    };
    addFavoriteSpy = vi.fn().mockReturnValue(throwError(() => apiError));
    removeFavoriteSpy = vi.fn();
    setup();

    service.toggleFavorite(mockTrial);

    expect(service.favoriteIds().has(mockTrial.nctId)).toBe(false);
    expect(service.error()).toEqual(apiError);
  });

  it('removes an already-favorited trial optimistically, and restores it on failure', () => {
    addFavoriteSpy = vi.fn();
    removeFavoriteSpy = vi
      .fn()
      .mockReturnValue(
        throwError(() => ({ code: 'UPSTREAM_UNAVAILABLE', message: 'fail' }) as ApiError),
      );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TrialsApi,
          useValue: {
            getFavorites: vi.fn().mockReturnValue(of([mockTrial])),
            addFavorite: addFavoriteSpy,
            removeFavorite: removeFavoriteSpy,
          },
        },
      ],
    });
    service = TestBed.inject(FavoritesState);
    expect(service.favoriteIds().has(mockTrial.nctId)).toBe(true);

    service.toggleFavorite(mockTrial);
    // optimistic removal, then rolled back after failure
    expect(service.favoriteIds().has(mockTrial.nctId)).toBe(true);
  });
});
