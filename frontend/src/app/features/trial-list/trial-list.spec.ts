import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrialList } from './trial-list';

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

describe('TrialList', () => {
  let component: TrialList;
  let fixture: ComponentFixture<TrialList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrialList],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
