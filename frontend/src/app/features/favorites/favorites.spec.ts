import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Favorites } from './favorites';
import { FavoritesState } from '../../core/favorites-state';
import { Trial } from '../../core/models/trial.model';

const mockTrial: Trial = {
  nctId: 'NCT00000001',
  briefTitle: 'Test Trial',
  overallStatus: 'RECRUITING',
  conditions: [],
  phases: [],
  interventions: [],
};

describe('Favorites', () => {
  let component: Favorites;
  let fixture: ComponentFixture<Favorites>;
  let toggleFavoriteSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    toggleFavoriteSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Favorites],
      providers: [
        {
          provide: FavoritesState,
          useValue: {
            favorites: signal([mockTrial]),
            error: signal(null),
            toggleFavorite: toggleFavoriteSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Favorites);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a favorited trial and removes it via the remove button', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector('.trial-card__title');
    expect(title.textContent).toContain('Test Trial');

    const removeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.remove-button');
    expect(removeButton.getAttribute('aria-label')).toBe('Remove Test Trial from favorites');

    removeButton.click();

    expect(toggleFavoriteSpy).toHaveBeenCalledWith(mockTrial);
  });

  it('shows a friendly message when there are no favorites', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Favorites],
      providers: [
        {
          provide: FavoritesState,
          useValue: { favorites: signal([]), error: signal(null), toggleFavorite: vi.fn() },
        },
      ],
    }).compileComponents();

    const emptyFixture = TestBed.createComponent(Favorites);
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    expect(emptyFixture.nativeElement.textContent).toContain(
      'You can view your favorited trials here.',
    );
  });
});
