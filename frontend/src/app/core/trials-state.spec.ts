import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrialsState } from './trials-state';
import { TrialsApi } from './trials-api';

describe('TrialsState', () => {
  let service: TrialsState;
  let getTrialsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    getTrialsSpy = vi.fn().mockReturnValue(of({ trials: [], nextCursor: null, totalCount: 0 }));

    TestBed.configureTestingModule({
      providers: [{ provide: TrialsApi, useValue: { getTrials: getTrialsSpy } }],
    });
    service = TestBed.inject(TrialsState);

    vi.advanceTimersByTime(300);
    getTrialsSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid search changes into a single request for the latest term', () => {
    service.setSearch('a');
    service.setSearch('ab');
    service.setSearch('abc');

    vi.advanceTimersByTime(300);

    expect(getTrialsSpy).toHaveBeenCalledTimes(1);
    expect(getTrialsSpy).toHaveBeenCalledWith('abc', {}, null, 40);
  });
});
