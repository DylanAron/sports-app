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
  /** 预清洗后的纯文本内容（不含 HTML 标签） */
  _contentPlain?: string;
}

export const analysisApi = {
  recent: () =>
    api.get<AnalysisItem[]>('/analysis/recent', { needAuth: false }),
};
