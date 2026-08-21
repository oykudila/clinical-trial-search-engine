export type OverallStatus =
    | 'ACTIVE_NOT_RECRUITING'
    | 'COMPLETED'
    | 'ENROLLING_BY_INVITATION'
    | 'NOT_YET_RECRUITING'
    | 'RECRUITING'
    | 'SUSPENDED'
    | 'TERMINATED'
    | 'WITHDRAWN'
    | 'AVAILABLE'
    | 'NO_LONGER_AVAILABLE'
    | 'TEMPORARILY_NOT_AVAILABLE'
    | 'APPROVED_FOR_MARKETING'
    | 'WITHHELD'
    | 'UNKNOWN';

export type Phase =
    | 'NA'
    | 'EARLY_PHASE1'
    | 'PHASE1'
    | 'PHASE2'
    | 'PHASE3'
    | 'PHASE4';

export interface Trial {
    nctId: string;
    briefTitle: string;
    overallStatus: OverallStatus;
    conditions: string[];
    phases: Phase[]
    interventions: string[];
}

export interface PaginatedTrials {
    trials: Trial[];
    nextCursor: string | null;
    totalCount: number | null;
}
