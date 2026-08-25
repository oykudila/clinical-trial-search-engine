import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrialList } from './trial-list';
import { TrialsState } from '../../core/trials-state';
import { FavoritesState } from '../../core/favorites-state';
import { Trial } from '../../core/models/trial.model';

class MockIntersectionObserver {
  observe() {
    // for tests
  }
  unobserve() {
    // for tests
  }
  disconnect() {
    // for tests
  }
}

beforeAll(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
});

const mockTrial: Trial = {
  nctId: 'NCT00000001',
  briefTitle: 'Test Trial',
  overallStatus: 'RECRUITING',
  conditions: [],
  phases: [],
  interventions: [],
};

describe('TrialList', () => {
  let component: TrialList;
  let fixture: ComponentFixture<TrialList>;
  let setFiltersSpy: ReturnType<typeof vi.fn>;
  let toggleFavoriteSpy: ReturnType<typeof vi.fn>;
  let favoriteIdsSignal: ReturnType<typeof signal<Set<string>>>;

  beforeEach(async () => {
    setFiltersSpy = vi.fn();
    favoriteIdsSignal = signal(new Set<string>());
    toggleFavoriteSpy = vi.fn((trial: Trial) => {
      favoriteIdsSignal.update((ids) => {
        const next = new Set(ids);
        if (next.has(trial.nctId)) {
          next.delete(trial.nctId);
        } else {
          next.add(trial.nctId);
        }
        return next;
      });
    });

    await TestBed.configureTestingModule({
      imports: [TrialList],
      providers: [
        {
          provide: TrialsState,
          useValue: {
            trials: signal([mockTrial]),
            isLoading: signal(false),
            error: signal(null),
            setSearch: vi.fn(),
            setFilters: setFiltersSpy,
            loadMore: vi.fn(),
          },
        },
        {
          provide: FavoritesState,
          useValue: {
            favoriteIds: favoriteIdsSignal,
            error: signal(null),
            toggleFavorite: toggleFavoriteSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects a condition filter with unbalanced parentheses and does not apply it', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Filter by condition"]',
    );

    input.value = '(head OR neck';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(setFiltersSpy).not.toHaveBeenCalled();
    const error: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(error.textContent).toContain('unbalanced parentheses');
  });

  it('applies a well-formed condition filter', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Filter by condition"]',
    );

    input.value = '(head OR neck) AND pain';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(setFiltersSpy).toHaveBeenCalledWith({
      condition: '(head OR neck) AND pain',
      status: undefined,
      phase: undefined,
    });
  });

  it('toggles the favorite button and reflects aria-pressed after a click', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.favorite-button');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(toggleFavoriteSpy).toHaveBeenCalledWith(mockTrial);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
