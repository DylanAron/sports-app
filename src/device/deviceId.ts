import { NativeModules, Platform } from 'react-native';

const { DeviceIdModule } = NativeModules;

/**
 * 获取设备唯一标识。
 * Android: ANDROID_ID (Settings.Secure)
 * iOS: identifierForVendor (UDID)
 *
 * 重装 app / 系统重置前始终保持不变。
 */
export async function getDeviceId(): Promise<string> {
  if (!DeviceIdModule) {
    // 降级：开发环境 / 原生模块未注册时使用内存 ID
    if (!(globalThis as any).__FALLBACK_DEVICE_ID__) {
      (globalThis as any).__FALLBACK_DEVICE_ID__ =
        `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    return (globalThis as any).__FALLBACK_DEVICE_ID__;
  }

  return await DeviceIdModule.getDeviceId();
}

/** 缓存 deviceId */
let cachedDeviceId: string | null = null;

/**
 * 获取已缓存的设备 ID（首次调用后持久化到内存）。
 */
export async function ensureDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = await getDeviceId();
  return cachedDeviceId;
}
