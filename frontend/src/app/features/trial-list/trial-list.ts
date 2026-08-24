import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';

import { TrialsState } from '../../core/trials-state';
import { OVERALL_STATUSES, OverallStatus, Phase, PHASES } from '../../core/models/trial.model';

@Component({
  imports: [],
  selector: 'app-trial-list',
  styleUrl: './trial-list.css',
  templateUrl: './trial-list.html',
})
export class TrialList implements OnDestroy {
  protected state = inject(TrialsState);

  // --- search ---
  protected searchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.setSearch(value);
  }

  // --- filters ---
  protected readonly statuses = OVERALL_STATUSES;
  protected readonly phases = PHASES;

  protected condition = signal<string | undefined>(undefined);
  protected status = signal<OverallStatus | undefined>(undefined);
  protected phase = signal<Phase | undefined>(undefined);

  protected conditionInput(event: Event): void {
    this.condition.set((event.target as HTMLInputElement).value || undefined);
    this.updatedFilters();
  }
  protected statusChange(event: Event): void {
    const statusValue = (event.target as HTMLSelectElement).value;
    this.status.set(statusValue === '' ? undefined : (statusValue as OverallStatus));
    this.updatedFilters();
  }
  protected phaseChange(event: Event): void {
    const phaseValue = (event.target as HTMLSelectElement).value;
    this.phase.set(phaseValue === '' ? undefined : (phaseValue as Phase));
    this.updatedFilters();
  }

  private updatedFilters(): void {
    this.state.setFilters({
      condition: this.condition(),
      status: this.status(),
      phase: this.phase(),
    });
  }

  // --- infinite scroll ---
  protected sentinel = viewChild<ElementRef<HTMLDivElement>>('scrollSentinel');
  private observer?: IntersectionObserver;
  constructor() {
    effect(() => {
      const element = this.sentinel();
      this.state.trials();
      if (!element) return;

      this.observer?.disconnect();
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.state.loadMore();
        }
      });
      this.observer.observe(element.nativeElement);
    });
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
