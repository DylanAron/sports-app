import api from '../utils/request';

export interface AnalysisItem {
  id: number;
  leagueLogo: string | null;
  leagueName: string;
  homeLogo: string | null;
  homeName: string;
  awayLogo: string | null;
  awayName: string;
  matchTime: string;
  scoreResult: string | null;
  content: string | null;
  createTime?: string;
}

export const analysisApi = {
  recent: () =>
    api.get<AnalysisItem[]>('/api/analysis/recent', { needAuth: false }),
};
