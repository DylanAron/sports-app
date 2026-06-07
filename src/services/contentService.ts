import api from '../utils/request';

export interface ContentResult {
  content: string;
}

export const contentApi = {
  getHelp: () => api.get<ContentResult>('/api/content/help', { needAuth: false }),
  getAbout: () => api.get<ContentResult>('/api/content/about', { needAuth: false }),
};

export const aiApi = {
  getEssay: () => api.get<{ content: string }>('/api/ai/essay', { needAuth: true }),
};
