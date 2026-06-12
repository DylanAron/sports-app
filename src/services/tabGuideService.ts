import api from '../utils/request';

export interface TabGuideItem {
  tabKey: string;
  imageUrl: string;
  isGlobalEnabled?: number;
}

/** 存储已弹过的 tab，session 级别去重 */
const shownTabs = new Set<string>();

export const tabGuideApi = {
  getList: () => api.get<TabGuideItem[]>('/content/tab-guides', { needAuth: false }),
};

export function hasShownGuide(tabKey: string): boolean {
  return shownTabs.has(tabKey);
}

export function markGuideShown(tabKey: string) {
  shownTabs.add(tabKey);
}
