import env from '../config/env';

/** 消息方向 */
export type MessageDirection = 'user' | 'agent';

/** 消息类型 */
export type MessageType = 'text' | 'image' | 'file';

/** 聊天消息 */
export interface ChatMessage {
  id?: number;
  userId?: string;
  agentId?: number;
  content: string;
  msgType: MessageType;
  direction: MessageDirection;
  fileUrl?: string;
  channelCode?: string;
  isRead?: number;
  /** 后端返回的时间戳 */
  timestamp?: string;
  createdAt?: string;
  /** 本地先行显示标记 */
  _local?: boolean;
  /** 欢迎语标记（不存 DB） */
  _welcome?: boolean;
}

/** WebSocket 消息（通信层格式） */
interface WsMessage {
  type: string;
  content?: string;
  msgType?: MessageType;
  fileUrl?: string;
  channelCode?: string;
  userId?: string;
  agentId?: number;
  direction?: MessageDirection;
  timestamp?: string;
  agent_assigned?: string;
  no_agent?: string;
}

/** WebSocket 连接回调 */
export interface WsHandlers {
  onOpen?: () => void;
  onMessage?: (msg: WsMessage) => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

/** WebSocket 连接控制对象 */
export interface WsConnection {
  send: (data: string) => void;
  close: () => void;
}

// ────────────────────────── userId 管理 ──────────────────────────

const USER_ID_KEY = '__CS_USER_ID__';

/**
 * 获取当前会话的用户标识。
 * 基于项目已有模式（globalThis），每次 App 启动生成一次。
 */
export function getUserId(): string {
  const existing = (globalThis as any)[USER_ID_KEY] as string | undefined;
  if (existing) return existing;
  const uid = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  (globalThis as any)[USER_ID_KEY] = uid;
  return uid;
}

// ────────────────────────── REST API ──────────────────────────

/**
 * 获取消息历史（支持按客服ID过滤）
 */
export async function fetchHistory(userId: string, agentId?: string): Promise<ChatMessage[]> {
  try {
    let url = `${env.CS_API_BASE_URL}/api/message/history/${userId}`;
    if (agentId) {
      url += `?agentId=${agentId}`;
    }
    const response = await fetch(url);
    if (!response.ok) return [];
    const result = await response.json();
    return result ?? [];
  } catch {
    return [];
  }
}

// ────────────────────────── WebSocket ──────────────────────────

/**
 * 创建 WebSocket 连接
 */
export function createWebSocketConnection(
  userId: string,
  handlers: WsHandlers,
): WsConnection {
  const url = `${env.WS_BASE_URL}/ws/user/${userId}`;
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    ws = new WebSocket(url);

    ws.onopen = () => handlers.onOpen?.();

    ws.onmessage = (event: WebSocketMessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        handlers.onMessage?.(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      handlers.onClose?.();
      if (!closed) {
        // 3 秒后自动重连
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (err: Event) => {
      handlers.onError?.(err);
    };
  }

  connect();

  return {
    send(data: string) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    },
    close() {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
