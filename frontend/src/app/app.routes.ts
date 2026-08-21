import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/trial-list/trial-list').then(m => m.TrialList),
    },
    {
        path: 'favorites',
        loadComponent: () => import('./features/favorites/favorites').then(m => m.Favorites),
    },
];
