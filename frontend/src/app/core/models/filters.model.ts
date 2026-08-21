import { OverallStatus, Phase } from './trial.model'

export interface Filters {
    condition?: string;
    status?: OverallStatus;
    phase?: Phase
}
