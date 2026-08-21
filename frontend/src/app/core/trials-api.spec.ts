import { TestBed } from '@angular/core/testing';
import { TrialsApi } from './trials-api';

describe('TrialsApi', () => {
  let service: TrialsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrialsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
