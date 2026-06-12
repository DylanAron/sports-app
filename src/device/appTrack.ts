import { NativeModules, Platform } from 'react-native';

const { AppTrackModule } = NativeModules;

/**
 * SDK 初始化已在 MainApplication.onCreate 中完成（release 构建）。
 * 以下接口只需在用户同意隐私协议后调用即可。
 */

/**
 * 上报激活事件到百度移动统计（AppTrack 归因）
 * 在用户同意隐私协议后的应用首次启动时调用
 */
export function reportActivation(): Promise<string> {
  if (Platform.OS !== 'android') return Promise.reject('非 Android 平台');
  if (!AppTrackModule) return Promise.reject('Native 模块不可用');
  return AppTrackModule.reportActivation();
}

/**
 * 设置用户隐私授权状态（文档要求必须调用）
 * 在用户同意或拒绝隐私协议时调用
 */
export function setPrivacyAgreed(agreed: boolean): void {
  if (Platform.OS !== 'android') return;
  if (!AppTrackModule) return;
  try {
    AppTrackModule.setPrivacyAgreed(agreed);
  } catch (e) {
    console.warn('[AppTrack] Failed to set privacy status:', e);
  }
}

/**
 * 上报自定义转化事件
 * @param actionType - 转化类型（REGISTER, PURCHASE 等）
 * @param actionParam - 扩展参数对象（可选）
 * @returns Promise，resolve 表示上报成功，reject 为失败原因
 */
export function logAction(actionType: string, actionParam?: Record<string, any>): Promise<string> {
  if (Platform.OS !== 'android') return Promise.reject('非 Android 平台');
  if (!AppTrackModule) return Promise.reject('Native 模块不可用');
  return AppTrackModule.logAction(actionType, actionParam ? JSON.stringify(actionParam) : '');
}

/**
 * 获取设备标识信息（调试用）
 */
export async function getDeviceInfo(): Promise<{androidId: string}> {
  if (Platform.OS !== 'android') return { androidId: '' };
  if (!AppTrackModule) return { androidId: '' };
  try {
    return await AppTrackModule.getDeviceInfo();
  } catch {
    return { androidId: '' };
  }
}
