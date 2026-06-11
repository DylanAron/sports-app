import api from '../utils/request';

export interface ContentResult {
  content: string;
}

export const contentApi = {
  getHelp: () => api.get<ContentResult>('/content/help', { needAuth: false }),
  getAbout: () => api.get<ContentResult>('/content/about', { needAuth: false }),
};

export const aiApi = {
  getEssay: () => api.get<{ content: string }>('/ai/essay', { needAuth: true }),
};
