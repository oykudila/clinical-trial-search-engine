import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';

import { TrialsState } from '../../core/trials-state';
import { OVERALL_STATUSES, OverallStatus, Phase, PHASES } from '../../core/models/trial.model';
import { FavoritesState } from '../../core/favorites-state';

@Component({
  imports: [],
  selector: 'app-trial-list',
  styleUrl: './trial-list.css',
  templateUrl: './trial-list.html',
})
export class TrialList implements OnDestroy {
  protected state = inject(TrialsState);

  // --- favorites ---
  protected favoritesState = inject(FavoritesState);
  protected isFavorited(nctId: string): boolean {
    return this.favoritesState.favoriteIds().has(nctId);
  }
  // --- search ---
  protected searchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.setSearch(value);
  }

  // --- filters ---
  protected readonly statuses = OVERALL_STATUSES;
  protected readonly phases = PHASES;
  protected conditionError = signal<string | null>(null);
  private readonly maxConditionLength = 100;

  protected condition = signal<string | undefined>(undefined);
  protected status = signal<OverallStatus | undefined>(undefined);
  protected phase = signal<Phase | undefined>(undefined);

  protected conditionInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value.length > this.maxConditionLength) {
      this.conditionError.set(`Condition must be ${this.maxConditionLength} characters or fewer.`);
      return;
    }
    if (!this.isBalanced(value)) {
      this.conditionError.set('Condition has unbalanced parentheses.');
      return;
    }
    this.conditionError.set(null);
    this.condition.set(value || undefined);
    this.updatedFilters();
  }

  private isBalanced(value: string): boolean {
    let depth = 0;
    for (const char of value) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
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
