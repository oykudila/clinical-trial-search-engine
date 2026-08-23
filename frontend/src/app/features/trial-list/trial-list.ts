import { Component, inject } from '@angular/core';
import { TrialsState } from '../../core/trials-state';

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
}
