import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginatedTrials, Trial } from './models/trial.model';
import { Filters } from './models/filters.model';
import { environment } from '../../environments/environment';

@Service()
export class TrialsApi {
    private http = inject(HttpClient)

    getTrials(
        search: string | null,
        filters: Filters,
        cursor: string | null,
        limit: number
    ): Observable<PaginatedTrials> {
        let params = new HttpParams().set('limit', limit);

        if (search) params = params.set('search', search);
        if (filters.condition) params = params.set('condition', filters.condition);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.phase) params = params.set('phase', filters.phase);
        if (cursor) params = params.set('cursor', cursor);

        return this.http.get<PaginatedTrials>(`${environment.apiBaseUrl}/trials`, { params });
    }


    getFavorites(): Observable<Trial[]> {
        return this.http.get<Trial[]>(`${environment.apiBaseUrl}/favorites`);
    }
    addFavorite(nctId: string): Observable<void> {
        return this.http.post<void>(`${environment.apiBaseUrl}/favorites`, { nctId });
    }
    removeFavorite(nctId: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiBaseUrl}/favorites/${nctId}`);
    }
}
