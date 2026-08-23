import { inject, Service, signal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
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

@Service()
export class TrialsState {
  private api = inject(TrialsApi);

  private isLoadingSignal = signal(true);
  private errorSignal = signal<ApiError | null>(null);

  private searchTerm$ = new BehaviorSubject<string>('');
  setSearch(term: string): void {
    this.searchTerm$.next(term);
  }

  private trials$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);
    }),
    switchMap((term) =>
      this.api.getTrials(term, {}, null, 10).pipe(
        tap(() => {
          this.isLoadingSignal.set(false);
        }),
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
