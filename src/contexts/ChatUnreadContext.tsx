import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Vibration, Platform, AppState, AppStateStatus } from 'react-native';
import {
  getUserId,
  createPushWebSocketConnection,
  fetchUnreadInfo,
  type WsConnection,
  type WsMessage,
} from '../services/chatService';
import { saveUnreadState, loadUnreadState, type PersistedUnreadState } from '../services/unreadStorage';

interface ChatUnreadContextValue {
  /** 未读消息数量 */
  unreadCount: number;
  /** 最近发消息的客服 ID */
  latestAgentId: number | null;
  /** 最近发消息的客服昵称 */
  latestAgentName: string | null;
  /** 推送 WS 收到 agent_message 且不在聊天页时调用 */
  incrementUnread: (agentId: number, agentName?: string) => void;
  /** 用户查看消息后清零 */
  resetUnread: () => void;
  /** 标记最后已读消息 ID 并持久化 */
  markLastRead: (msgId: number) => void;
  /** 获取最后已读消息 ID */
  lastReadMsgId: number;
  /** 用户正在聊天页面（阻止推送 WS 计数） */
  isChatFocused: boolean;
  /** 设置聊天页面焦点状态 */
  setChatFocused: (focused: boolean) => void;
}

const ChatUnreadContext = createContext<ChatUnreadContextValue>({
  unreadCount: 0,
  latestAgentId: null,
  latestAgentName: null,
  incrementUnread: () => {},
  resetUnread: () => {},
  markLastRead: () => {},
  lastReadMsgId: 0,
  isChatFocused: false,
  setChatFocused: () => {},
});

export const useChatUnread = () => useContext(ChatUnreadContext);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAgentId, setLatestAgentId] = useState<number | null>(null);
  const [latestAgentName, setLatestAgentName] = useState<string | null>(null);
  const isChatFocusedRef = useRef(false);

  const setChatFocused = useCallback((focused: boolean) => {
    isChatFocusedRef.current = focused;
  }, []);

  const unreadRef = useRef(0);
  const agentIdRef = useRef<number | null>(null);
  const agentNameRef = useRef<string | null>(null);
  const lastReadIdRef = useRef(0);
  const pushWsRef = useRef<WsConnection | null>(null);
  const connectingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // ── 振动 ──
  const vibrate = useCallback(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(100);
    } else {
      Vibration.vibrate([0, 100]);
    }
  }, []);

  // ── 持久化 ──
  const persist = useCallback(async () => {
    const state: PersistedUnreadState = {
      lastReadMsgId: lastReadIdRef.current,
      lastUpdated: new Date().toISOString(),
    };
    await saveUnreadState(state);
  }, []);

  const updateUnread = useCallback((count: number, agentId?: number | null, agentName?: string | null) => {
    unreadRef.current = count;
    if (agentId !== undefined) agentIdRef.current = agentId;
    if (agentName !== undefined) agentNameRef.current = agentName;
    setUnreadCount(count);
    setLatestAgentId(agentIdRef.current);
    setLatestAgentName(agentNameRef.current);
  }, []);

  // ── 来自推送 WS 的增量 ──
  const incrementUnread = useCallback((agentId: number, agentName?: string) => {
    if (isChatFocusedRef.current) return;
    const newCount = unreadRef.current + 1;
    updateUnread(newCount, agentId, agentName || agentNameRef.current || `客服${agentId}`);
    vibrate();
    persist();
  }, [updateUnread, vibrate, persist]);

  const resetUnread = useCallback(() => {
    updateUnread(0);
    persist();
  }, [updateUnread, persist]);

  const markLastRead = useCallback((msgId: number) => {
    if (msgId > lastReadIdRef.current) {
      lastReadIdRef.current = msgId;
      persist();
    }
  }, [persist]);

  // ── 推送 WS 连接管理（防并发保护）──
  const connectPushWs = useCallback(async () => {
    if (connectingRef.current) return; // 防并发
    connectingRef.current = true;

    try {
      // 关闭旧连接
      if (pushWsRef.current) {
        pushWsRef.current.close();
        pushWsRef.current = null;
      }

      const userId = await getUserId();
      userIdRef.current = userId;

      // 恢复持久化数据
      const persisted = await loadUnreadState();
      if (persisted) {
        lastReadIdRef.current = persisted.lastReadMsgId;
      }

      // 先用 REST 权威同步未读数（仅在成功时覆盖，防止网络异常清零）
      const afterId = lastReadIdRef.current;
      const info = await fetchUnreadInfo(userId, afterId);
      if (info) {
        // REST 是权威数据源，直接覆盖
        updateUnread(info.count, info.latestAgentId || null, info.latestAgentName || null);
        if (info.count > 0) {
          vibrate();
        }
      }

      // 连推送 WS
      pushWsRef.current = createPushWebSocketConnection(userId, {
        onOpen: () => {
          console.log('[PushWS] connected');
        },
        onMessage: (msg: WsMessage) => {
          if (msg.type === 'agent_message' || msg.type === 'AGENT_MESSAGE') {
            const agentId = msg.agentId || 0;
            incrementUnread(agentId);
          } else if (msg.type === 'unread_info') {
            // 服务端发来的初始未读快照，是权威数据
            const count = (msg as any).count || 0;
            if (count !== unreadRef.current) {
              const laId = (msg as any).latestAgentId;
              const laName = (msg as any).latestAgentName;
              updateUnread(count, laId || null, laName || null);
            }
          }
        },
        onClose: () => {
          console.log('[PushWS] disconnected');
        },
      });
    } finally {
      connectingRef.current = false;
    }
  }, [incrementUnread, updateUnread, vibrate]);

  // ── App 前后台切换 ──
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // 回到前台，重新连推送 WS 并同步
        connectPushWs();
      } else if (nextState === 'background') {
        // 进入后台，断开推送 WS
        if (pushWsRef.current) {
          pushWsRef.current.close();
          pushWsRef.current = null;
        }
      }
    };

    // 首次挂载建立连接
    connectPushWs();

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      if (pushWsRef.current) {
        pushWsRef.current.close();
        pushWsRef.current = null;
      }
    };
  }, [connectPushWs]);

  const value: ChatUnreadContextValue = {
    unreadCount,
    latestAgentId,
    latestAgentName,
    incrementUnread,
    resetUnread,
    markLastRead,
    lastReadMsgId: lastReadIdRef.current,
    isChatFocused: isChatFocusedRef.current,
    setChatFocused,
  };

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}
