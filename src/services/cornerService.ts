import api from '../utils/request';

export interface CornerItem {
  id: number;
  leagueName: string;
  leagueLogo: string | null;
  homeName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  awayName: string;
  recommendContent: string | null;
  isTodayData: number;
  isHit: number;
  matchDate: string;
}

export interface PageData<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}

export const cornerApi = {
  list: (params?: { page?: number; pageSize?: number; isTodayData?: number }) =>
    api.get<PageData<CornerItem>>('/corner/list', { params, needAuth: false }),
  detail: (id: number) =>
    api.get<CornerItem>(`/corner/detail/${id}`, { needAuth: false }),
};
