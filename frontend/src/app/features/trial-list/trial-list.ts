import { Component, inject, signal } from '@angular/core';

import { TrialsState } from '../../core/trials-state';
import { OVERALL_STATUSES, OverallStatus, Phase, PHASES } from '../../core/models/trial.model';

@Component({
  imports: [],
  selector: 'app-trial-list',
  styleUrl: './trial-list.css',
  templateUrl: './trial-list.html',
})
export class TrialList {
  protected state = inject(TrialsState);

  protected searchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.setSearch(value);
  }

  protected condition = signal<string | undefined>(undefined);
  protected status = signal<OverallStatus | undefined>(undefined);
  protected phase = signal<Phase | undefined>(undefined);

  protected readonly statuses = OVERALL_STATUSES;
  protected readonly phases = PHASES;

  private updatedFilters(): void {
    this.state.setFilters({
      condition: this.condition(),
      status: this.status(),
      phase: this.phase(),
    });
  }

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
}
