import api from '../utils/request';

export interface BannerItem {
  id: number;
  title: string;
  imageUrl: string;
  sortOrder: number;
  jumpType: number;
  jumpContent: string;
}

export const bannerApi = {
  getList: () => api.get<BannerItem[]>('/content/banners', { needAuth: false }),
};
