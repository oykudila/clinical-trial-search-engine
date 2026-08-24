import { TestBed } from '@angular/core/testing';
import { FavoritesState } from './favorites-state';

describe('FavoritesState', () => {
  let service: FavoritesState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
