import { Component, inject } from '@angular/core';

import { FavoritesState } from '../../core/favorites-state';

@Component({
  imports: [],
  selector: 'app-favorites',
  styleUrl: './favorites.css',
  templateUrl: './favorites.html',
})
export class Favorites {
  protected state = inject(FavoritesState);
}
