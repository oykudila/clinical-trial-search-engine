import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TrialsState } from './trials-state';
import { TrialsApi } from './trials-api';
import { Trial, PaginatedTrials } from './models/trial.model';

const trialA: Trial = {
  nctId: 'NCT00000001',
  briefTitle: 'Trial A',
  overallStatus: 'RECRUITING',
  conditions: [],
  phases: [],
  interventions: [],
};
const trialB: Trial = {
  nctId: 'NCT00000002',
  briefTitle: 'Trial B',
  overallStatus: 'RECRUITING',
  conditions: [],
  phases: [],
  interventions: [],
};

describe('TrialsState', () => {
  let service: TrialsState;
  let getTrialsSpy: ReturnType<typeof vi.fn>;

  function setup(initialResponse: PaginatedTrials = { trials: [], nextCursor: null, totalCount: 0 }): void {
    vi.useFakeTimers();
    getTrialsSpy = vi.fn().mockReturnValue(of(initialResponse));

    TestBed.configureTestingModule({
      providers: [{ provide: TrialsApi, useValue: { getTrials: getTrialsSpy } }],
    });
    service = TestBed.inject(TrialsState);

    vi.advanceTimersByTime(300);
    getTrialsSpy.mockClear();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid search changes into a single request for the latest term', () => {
    setup();

    service.setSearch('a');
    service.setSearch('ab');
    service.setSearch('abc');

    vi.advanceTimersByTime(300);

    expect(getTrialsSpy).toHaveBeenCalledTimes(1);
    expect(getTrialsSpy).toHaveBeenCalledWith('abc', {}, null, 40);
  });

  it('replaces the list on a reset event rather than appending', () => {
    setup();

    getTrialsSpy.mockReturnValueOnce(of({ trials: [trialA], nextCursor: 'c1', totalCount: 2 }));
    service.setSearch('first');
    vi.advanceTimersByTime(300);
    expect(service.trials()).toEqual([trialA]);

    getTrialsSpy.mockReturnValueOnce(of({ trials: [trialB], nextCursor: null, totalCount: 1 }));
    service.setSearch('second');
    vi.advanceTimersByTime(300);

    expect(service.trials()).toEqual([trialB]);
  });

  it('appends to the list on a successful loadMore', () => {
    setup({ trials: [trialA], nextCursor: 'c1', totalCount: 2 });

    getTrialsSpy.mockReturnValueOnce(of({ trials: [trialB], nextCursor: null, totalCount: 2 }));
    service.loadMore();

    expect(service.trials()).toEqual([trialA, trialB]);
  });

  it('ignores a loadMore call while a request is already in flight', () => {
    setup({ trials: [trialA], nextCursor: 'c1', totalCount: 2 });

    const pending = new Subject<PaginatedTrials>();
    getTrialsSpy.mockReturnValueOnce(pending);

    service.loadMore(); // starts the still-pending request
    service.loadMore(); // should be ignored — busy gate

    expect(getTrialsSpy).toHaveBeenCalledTimes(1);

    pending.next({ trials: [trialB], nextCursor: null, totalCount: 2 });
    pending.complete();
  });

  it('does not call loadMore again once there is no next page', () => {
    setup({ trials: [trialA], nextCursor: null, totalCount: 1 });

    service.loadMore();

    expect(getTrialsSpy).not.toHaveBeenCalled();
  });
});
