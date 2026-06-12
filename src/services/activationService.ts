import api from '../utils/request';

/** 渠道包ID（16位随机字母数字，每版本固定） */
export const PACKAGE_ID = 'A3fR9kL2mN7pQ5xW';

export interface ActivationReportParams {
  deviceId: string;
  marketId?: number;
  packageId: string;
}

export const activationApi = {
  report: (data: ActivationReportParams) =>
    api.post<void>('/activation/report', data, { needAuth: false }),
};
