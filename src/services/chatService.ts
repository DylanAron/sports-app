import env from '../config/env';
import { ensureDeviceId } from '../device/deviceId';

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
 * 基于设备唯一 ID（Android ANDROID_ID / iOS identifierForVendor），
 * 重装 app 后保持稳定。格式前缀 "u_" + deviceId。
 */
let userIdPromise: Promise<string> | null = null;

export async function getUserId(): Promise<string> {
  const existing = (globalThis as any)[USER_ID_KEY] as string | undefined;
  if (existing) return existing;

  if (!userIdPromise) {
    userIdPromise = ensureDeviceId().then((deviceId) => {
      const uid = `u_${deviceId}`;
      (globalThis as any)[USER_ID_KEY] = uid;
      return uid;
    });
  }

  return userIdPromise;
}

// ────────────────────────── REST API ──────────────────────────

/**
 * 上传文件/图片到客服系统
 * @returns 上传后的文件 URL（相对路径）和原始文件名
 */
export async function uploadFile(file: {
  uri: string;
  type: string;
  name: string;
}): Promise<{ url: string; fileName: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response = await fetch(`${env.CS_API_BASE_URL}/api/message/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('uploadFile failed:', response.status, text);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error('uploadFile error:', e);
    return null;
  }
}

/**
 * 将后端返回的相对路径补全为完整的图片 URL
 */
export function getFullFileUrl(fileUrl?: string): string | undefined {
  if (!fileUrl) return undefined;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  return `${env.CS_API_BASE_URL}${fileUrl}`;
}

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
  const url = `${env.WS_BASE_URL}/user/${userId}`;
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
