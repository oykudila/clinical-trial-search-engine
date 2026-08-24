import { computed, inject, signal, Service } from '@angular/core';
import { catchError, of } from 'rxjs';

import { TrialsApi } from './trials-api';
import { Trial } from './models/trial.model';
import { ApiError } from './models/app-error.model';

@Service()
export class FavoritesState {
  private api = inject(TrialsApi);

  private errorSignal = signal<ApiError | null>(null);
  error = this.errorSignal.asReadonly();

  private favoritesSignal = signal<Trial[]>([]);
  favorites = this.favoritesSignal.asReadonly();
  favoriteIds = computed(() => new Set(this.favoritesSignal().map((t) => t.nctId)));

  constructor() {
    this.api
      .getFavorites()
      .pipe(
        catchError((err: ApiError) => {
          this.errorSignal.set(err);
          return of([] as Trial[]);
        }),
      )
      .subscribe((favorites) => this.favoritesSignal.set(favorites));
  }

  toggleFavorite(trial: Trial): void {
    const isFavorited = this.favoriteIds().has(trial.nctId);

    // for optimistic ui
    this.favoritesSignal.update((favorites) =>
      isFavorited ? favorites.filter((f) => f.nctId !== trial.nctId) : [...favorites, trial],
    );

    const action$ = isFavorited
      ? this.api.removeFavorite(trial.nctId)
      : this.api.addFavorite(trial.nctId);

    action$.subscribe({
      next: () => this.errorSignal.set(null),
      error: (err: ApiError) => {
        this.errorSignal.set(err);
        // undo the optimistic ui upate
        this.favoritesSignal.update((favorites) =>
          isFavorited ? [...favorites, trial] : favorites.filter((f) => f.nctId !== trial.nctId),
        );
      },
    });
  }
}
