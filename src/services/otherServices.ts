import api from '../utils/request';
import type { CornerItem } from './cornerService';

export interface IntelligenceItem {
  id: number;
  intelDate: string;
  content: string;
  createTime?: string;
}

export const goalApi = {
  list: (params?: { page?: number; pageSize?: number; isTodayData?: number }) =>
    api.get<{total: number; page: number; pageSize: number; list: CornerItem[]}>('/api/goal/list', { params, needAuth: false }),
};

export const halfFullApi = {
  list: (params?: { page?: number; pageSize?: number; isTodayData?: number }) =>
    api.get<{total: number; page: number; pageSize: number; list: CornerItem[]}>('/api/half-full/list', { params, needAuth: false }),
};

export const scoreApi = {
  list: (params?: { page?: number; pageSize?: number; isTodayData?: number }) =>
    api.get<{total: number; page: number; pageSize: number; list: CornerItem[]}>('/api/score/list', { params, needAuth: false }),
};

export const winLoseApi = {
  list: (params?: { page?: number; pageSize?: number; isTodayData?: number }) =>
    api.get<{total: number; page: number; pageSize: number; list: CornerItem[]}>('/api/win-lose/list', { params, needAuth: false }),
};

export const intelligenceApi = {
  recent: () =>
    api.get<IntelligenceItem[]>('/api/intelligence/recent', { needAuth: false }),
};
