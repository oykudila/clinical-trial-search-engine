import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrialList } from './trial-list';

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
