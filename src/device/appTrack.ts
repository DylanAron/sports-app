import { NativeModules, Platform } from 'react-native';

const { AppTrackModule } = NativeModules;

/**
 * 从服务端获取密钥后初始化百度 oCPX SDK
 * 必须在 reportActivation 之前调用
 */
export function initSdk(bdAppId: number, appSecret: string): void {
  if (Platform.OS !== 'android') return;
  if (!AppTrackModule) return;
  try {
    AppTrackModule.initSdk(bdAppId, appSecret);
  } catch (e) {
    console.warn('[AppTrack] Failed to init SDK:', e);
  }
}

/**
 * 上报激活事件到百度移动统计（AppTrack 归因）
 * 在用户同意隐私协议后的应用首次启动时调用
 */
export function reportActivation(): void {
  if (Platform.OS !== 'android') return;
  if (!AppTrackModule) {
    console.warn('[AppTrack] Native module not available');
    return;
  }
  try {
    AppTrackModule.reportActivation();
  } catch (e) {
    console.warn('[AppTrack] Failed to report activation:', e);
  }
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
 */
export function logAction(actionType: string, actionParam?: Record<string, any>): void {
  if (Platform.OS !== 'android') return;
  if (!AppTrackModule) return;
  try {
    AppTrackModule.logAction(actionType, actionParam ? JSON.stringify(actionParam) : '');
  } catch (e) {
    console.warn('[AppTrack] Failed to log action:', e);
  }
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
