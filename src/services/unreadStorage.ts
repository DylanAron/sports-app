import AsyncStorage from '@react-native-async-storage/async-storage';

const UNREAD_KEY = '@cs_unread_state';

export interface PersistedUnreadState {
  /** 最近一条被用户看到的消息 ID（用于增量查询） */
  lastReadMsgId: number;
  /** 最后更新的时间戳 */
  lastUpdated: string;
}

export async function saveUnreadState(state: PersistedUnreadState): Promise<void> {
  try {
    await AsyncStorage.setItem(UNREAD_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveUnreadState error:', e);
  }
}

export async function loadUnreadState(): Promise<PersistedUnreadState | null> {
  try {
    const raw = await AsyncStorage.getItem(UNREAD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedUnreadState;
  } catch (e) {
    console.error('loadUnreadState error:', e);
    return null;
  }
}

export async function clearUnreadState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(UNREAD_KEY);
  } catch (e) {
    console.error('clearUnreadState error:', e);
  }
}
