import { inject, Service, signal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  scan,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { TrialsApi } from './trials-api';
import { ApiError } from './models/app-error.model';
import { Filters } from './models/filters.model';
import { Trial } from './models/trial.model';

@Service()
export class TrialsState {
  private api = inject(TrialsApi);

  private isLoadingSignal = signal(true);
  private errorSignal = signal<ApiError | null>(null);

  private filters$ = new BehaviorSubject<Filters>({});
  private debouncedFilters$ = this.filters$.pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => JSON.stringify(a) == JSON.stringify(b)),
  );
  setFilters(filters: Filters): void {
    this.filters$.next(filters);
  }

  private searchTerm$ = new BehaviorSubject<string>('');
  private debouncedSearch$ = this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged());
  setSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  private currentTerm = '';
  private currentFilters: Filters = {};
  private nextCursor: string | null = null;

  private resetEvents$ = combineLatest([this.debouncedSearch$, this.debouncedFilters$]).pipe(
    tap(([term, filters]) => {
      this.currentTerm = term;
      this.currentFilters = filters;
      this.nextCursor = null;
    }),
    map(() => ({ type: 'reset' as const })),
  );

  private loadMore$ = new Subject<void>();
  loadMore(): void {
    this.loadMore$.next();
  }
  private loadMoreEvents$ = this.loadMore$.pipe(
    filter(() => !this.isLoadingSignal() && this.nextCursor !== null),
    map(() => ({ type: 'loadMore' as const })),
  );

  private trials$ = merge(this.resetEvents$, this.loadMoreEvents$).pipe(
    tap(() => {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);
    }),
    switchMap((event) => {
      const cursor = event.type === 'reset' ? null : this.nextCursor;
      return this.api.getTrials(this.currentTerm, this.currentFilters, cursor, 10).pipe(
        tap((response) => {
          this.isLoadingSignal.set(false);
          this.nextCursor = response.nextCursor;
        }),
        map((response) => ({ trials: response.trials, isReset: event.type === 'reset' })),
        catchError((err: ApiError) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(err);
          return of({ trials: [] as Trial[], isReset: event.type === 'reset' });
        }),
      );
    }),
    scan((accumulated, result) => {
      if (result.isReset) return result.trials;
      if (result.trials.length === 0) return accumulated;
      return [...accumulated, ...result.trials];
    }, [] as Trial[]),
  );

  trials = toSignal(this.trials$, { initialValue: [] });
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
}
