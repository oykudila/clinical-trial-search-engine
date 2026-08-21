import { inject, Service, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';

import { TrialsApi } from './trials-api';
import { ApiError } from './models/app-error.model';
import { toSignal } from '@angular/core/rxjs-interop';


@Service()
export class TrialsState {
    private api = inject(TrialsApi)

    private isLoadingSignal = signal(true);
    private errorSignal = signal<ApiError | null>(null);

    private trials$ = this.api.getTrials(null, {}, null, 10).pipe(
        tap(() => {
            this.isLoadingSignal.set(false);
        }),
        map(response => response.trials),
        catchError((err: ApiError) => {
            this.isLoadingSignal.set(false);
            this.errorSignal.set(err);

            return of([])
        })
    );

    trials = toSignal(this.trials$, { initialValue: [] })
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();
}
