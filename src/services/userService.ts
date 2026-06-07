import api from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

export const userApi = {
  login: (data: LoginParams) => api.post<LoginResult>('/api/user/login', data, { needAuth: false }),
  register: (data: RegisterParams) => api.post<LoginResult>('/api/user/register', data, { needAuth: false }),
  getInfo: () => api.get<UserInfo>('/api/user/info', { needAuth: true }),
  updateProfile: (data: { nickname?: string; avatar?: string; bio?: string }) =>
    api.put<UserInfo>('/api/user/profile', data, { needAuth: true }),
};
