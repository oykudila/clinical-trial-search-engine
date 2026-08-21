import { TestBed } from '@angular/core/testing';
import { TrialsState } from './trials-state';

describe('TrialsState', () => {
  let service: TrialsState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrialsState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
