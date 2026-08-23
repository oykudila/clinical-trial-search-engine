import { inject, Service, signal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { TrialsApi } from './trials-api';
import { ApiError } from './models/app-error.model';
import { Filters } from './models/filters.model';

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

  private trials$ = combineLatest([this.debouncedSearch$, this.debouncedFilters$]).pipe(
    tap(() => {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);
    }),
    switchMap(([term, filters]) =>
      this.api.getTrials(term, filters, null, 10).pipe(
        tap(() => this.isLoadingSignal.set(false)),
        map((response) => response.trials),
        catchError((err: ApiError) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(err);

          return of([]);
        }),
      ),
    ),
  );

  trials = toSignal(this.trials$, { initialValue: [] });
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
}
