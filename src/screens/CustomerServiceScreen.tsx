import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Alert,
  Dimensions,
  Linking,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import env from '../config/env';
import {
  getUserId,
  fetchHistory,
  createWebSocketConnection,
  uploadFile,
  getFullFileUrl,
  markUserRead,
  type ChatMessage,
  type WsMessage,
} from '../services/chatService';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';
import Clipboard from '@react-native-clipboard/clipboard';

const MAX_IMG_W = 220;
const MAX_IMG_H = 300;
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|cn|net|org|io|app|top|vip|xyz|cc|me|tv|co|info|biz)(?:\/[^\s]*)?)/gi;

/* ───────────── 子组件 ───────────── */

const ImageMsg = ({ url }: { url: string; isUser: boolean }) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    Image.getSize(url, (w, h) => {
      let scaledW = w; let scaledH = h;
      if (w > MAX_IMG_W) { scaledW = MAX_IMG_W; scaledH = (h / w) * MAX_IMG_W; }
      if (scaledH > MAX_IMG_H) { scaledH = MAX_IMG_H; scaledW = (scaledW / scaledH) * MAX_IMG_H; }
      setSize({ w: Math.round(scaledW), h: Math.round(scaledH) });
    }, () => setSize({ w: 200, h: 200 }));
  }, [url]);

  const imgStyle = size
    ? { width: size.w, height: size.h, borderRadius: 8 }
    : { width: 200, height: 200, borderRadius: 8 };

  return (
    <View style={{ borderRadius: 8, padding: 2, marginTop: 6 }}>
      <Image source={{ uri: url }} style={imgStyle} resizeMode="contain" />
    </View>
  );
};

const HtmlBubble = ({ html }: { html: string }) => {
  const [h, setH] = useState(0);
  const source = useRef({
    html: `<!DOCTYPE html><html>
<head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-size:14px;line-height:1.5;color:#222;word-wrap:break-word;overflow-wrap:break-word;padding:8px 12px}img{max-width:100%!important;height:auto}</style>
</head><body>
${html}
</body></html>`,
    baseUrl: env.CS_API_BASE_URL,
  }).current;

  const availWidth = Dimensions.get('window').width - 68 - 48 - 32;
  const js = `(function(){var tid=setInterval(function(){var h=document.body.scrollHeight;if(h>0){clearInterval(tid);window.ReactNativeWebView.postMessage(''+h);}},80);setTimeout(function(){var h=document.body.scrollHeight;if(h>0)window.ReactNativeWebView.postMessage(''+h);clearInterval(tid);},500);})();`;

  return (
    <View style={[styles.agentBubble, { padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }]}>
      <WebView
        source={source}
        style={{ backgroundColor: '#fff', width: availWidth, height: h || 50 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        injectedJavaScript={js}
        onMessage={(e) => { const v = Number(e.nativeEvent.data); if (v > 0) setH(v); }}
        originWhitelist={['*']}
      />
    </View>
  );
};

const FileMsg = ({ url, name, isUser }: { url: string; name: string; isUser: boolean }) => {
  const fullUrl = getFullFileUrl(url) || url;
  const fileName = name || url.replace(/\\/g, '/').split('/').pop()?.split('?')[0] || '文件';
  // 屏幕宽度 - 头像(56) - 头像margin - Row外边距 → 可用宽度取 85%
  const maxBubbleWidth = (Dimensions.get('window').width - 56 - 8 - 48) * 0.85;

  return (
    <Pressable
      onPress={() => Linking.openURL(fullUrl).catch(() => Alert.alert('提示', '无法打开文件链接'))}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', position: 'relative' }}>
        {!isUser && <View style={[styles.agentTail, { left: -8, marginTop: 18 }]} />}
        <View style={[isUser ? styles.userFileBubble : styles.agentBubble, { maxWidth: maxBubbleWidth }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 8, color: '#2563eb' }}>📎</Text>
            <Text
              style={{ fontSize: 14, color: isUser ? '#fff' : '#2563eb', textDecorationLine: 'underline', flexShrink: 1 }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {fileName}
            </Text>
          </View>
        </View>
        {isUser && <View style={[styles.userFileTail, { borderLeftColor: '#2563eb' }]} />}
      </View>
    </Pressable>
  );
};

const LinkedMessageText = ({ text, isUser, deselectKey }: { text: string; isUser: boolean; deselectKey: number }) => {
  const parts: Array<{ text: string; isLink: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isLink: false });
    }
    const link = match[0].replace(/[.,!?;:，。！？；：）)]$/, '');
    parts.push({ text: link, isLink: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isLink: false });
  }
  if (parts.length === 0) {
    parts.push({ text, isLink: false });
  }

  return (
    <Text key={deselectKey} style={isUser ? styles.userMsgText : styles.msgText} selectable>
      {parts.map((part, index) =>
        !part.isLink ? (
          <Text key={index}>{part.text}</Text>
        ) : (
          <Text
            key={index}
            style={isUser ? styles.userLinkText : styles.agentLinkText}
            onPress={() => {
              const url = /^https?:\/\//i.test(part.text) ? part.text : `https://${part.text}`;
              Linking.openURL(url).catch(() => Alert.alert('提示', '无法打开链接'));
            }}
            onLongPress={() => {
              Clipboard.setString(part.text);
            }}
          >
            {part.text}
          </Text>
        )
      )}
    </Text>
  );
};

/* ─────── 辅助函数 ─────── */

function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function formatTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─────── 主组件 ─────── */

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: {
    params?: {
      filterAgentId?: number;
      filterAgentName?: string;
    };
  };
};

const CustomerServiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const wsRef = useRef<ReturnType<typeof createWebSocketConnection> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const uidRef = useRef('');
  const insets = useSafeAreaInsets();

  // 从路由参数中读取筛选信息（直接读取，不再提供 setter —— 无需清除过滤）
  const filterAgentId = route?.params?.filterAgentId ?? undefined;
  const filterAgentName = route?.params?.filterAgentName ?? undefined;

  // 使用全局未读 Context
  const { resetUnread, markLastRead, setChatFocused } = useChatUnread();

  const assignedAgentIdRef = useRef<number | undefined>(undefined);
  const [deselectKey, setDeselectKey] = useState(0);

  const setMessagesSync = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  /* ── 屏幕焦点管理：延迟到聊天 WS 就绪后才标记已聚焦，
      避免 resetUnread() 后 ~ WS 连接前这段间隙收到 push 消息被丢弃 ── */
  useEffect(() => {
    // cleanup 时立刻取消聚焦，保证退出页面后 push WS 能增量计数
    return () => setChatFocused(false);
  }, [setChatFocused]);

  /* ── 初始化 ── */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const uid = await getUserId();
      if (cancelled) return;
      uidRef.current = uid;

      setLoading(true);

      // WS 消息缓冲区：init 完成前暂存所有消息
      const messageBuffer: WsMessage[] = [];
      let initComplete = false;

      // 分配结果 Promise（同步等待 WS 分配结果）
      let resolveAssignment: ((result: {
        agentId?: number;
        agentName?: string;
      }) => void) | null = null;

      const assignmentPromise = new Promise<{
        agentId?: number;
        agentName?: string;
      }>((resolve) => {
        resolveAssignment = resolve;
      });

      // 5秒超时保护
      const timeoutId = setTimeout(() => {
        if (resolveAssignment) {
          resolveAssignment({});
          resolveAssignment = null;
        }
      }, 5000);

      // 判断是否为后端问候语（无 id，内容以 ",很高兴为您服务!" 结尾，前端自己生成不重复显示）
      const isBackendGreeting = (m: WsMessage) =>
        !m.id && !!m.content && m.content.endsWith(',很高兴为您服务!');

      // 处理一条 WS 消息（实时处理或缓冲后回放）
      const handleWsMessage = (msg: WsMessage) => {
        if (msg.type === 'agent_message') {
          // 跳过后端问候语，前端自己生成
          if (isBackendGreeting(msg)) return;

          const fileType = (msg.msgType || 'text') as 'text' | 'image' | 'file';
          let content = msg.content || '';
          let fileUrl = msg.fileUrl;

          if (!fileUrl && msg.content) {
            if (fileType === 'image') {
              fileUrl = msg.content;
              content = '';
            } else if (fileType === 'file' && /^https?:\/\//i.test(msg.content.trim())) {
              fileUrl = msg.content.trim();
            }
          }
          if (fileType === 'text' && !fileUrl && msg.content &&
              /^https?:\/\/[^\s]+\.(webp|png|jpg|jpeg|gif|bmp)(\?|$)/i.test(msg.content.trim())) {
            fileUrl = msg.content.trim();
            content = '';
          }

          setMessagesSync((prev) => [{
            id: msg.id,
            content,
            msgType: fileUrl && fileType === 'text' ? 'image' : fileType,
            direction: 'agent',
            fileUrl,
            timestamp: msg.timestamp || new Date().toISOString(),
          }, ...prev]);

          if (msg.id) {
            markLastRead(msg.id);
            markUserRead(uidRef.current, msg.id, msg.agentId).catch(() => {});
          }
        } else if (msg.type === 'welcome_message') {
          const content = msg.content || '您好，欢迎来到在线客服，请问有什么可以帮助您的？';
          setMessagesSync((prev) => [{
            content,
            msgType: 'text',
            direction: 'agent',
            timestamp: msg.timestamp || new Date().toISOString(),
            _welcome: true,
          }, ...prev]);
        }
      };

      // 建立 WebSocket
      const ws = createWebSocketConnection(uid, {
        onOpen: () => setChatFocused(true),
        onMessage: (msg) => {
          // 截获 system 中的分配/无客服结果，用于 Promise resolve
          if (msg.type === 'system') {
            if (msg.agent_assigned) {
              const agentId = Number(msg.agent_assigned);
              if (!isNaN(agentId)) {
                clearTimeout(timeoutId);
                if (resolveAssignment) {
                  resolveAssignment({
                    agentId,
                    agentName: msg.agent_name || '',
                  });
                  resolveAssignment = null;
                }
              }
            } else if (msg.no_agent) {
              clearTimeout(timeoutId);
              if (resolveAssignment) {
                resolveAssignment({});
                resolveAssignment = null;
              }
            }
          }

          // 缓冲或实时处理
          if (!initComplete) {
            messageBuffer.push(msg);
          } else {
            handleWsMessage(msg);
          }
        },
        onClose: () => {},
      });
      wsRef.current = ws;

      // 1️⃣ 同步等待分配结果
      const assignment = await assignmentPromise;
      if (cancelled) return;

      const assignedAgentId = assignment.agentId;
      const assignedAgentName = assignment.agentName || '';

      if (assignedAgentId) {
        assignedAgentIdRef.current = assignedAgentId;

        // 判断：浮标有未读且分配的客服和未读客服不同？
        const isDiffAgent = !!(filterAgentId && assignedAgentId !== filterAgentId);

        if (isDiffAgent) {
          // 🅲 场景3：不同客服 — 加载未读客服历史 + 离线提示
          const history = await fetchHistory(uid, String(filterAgentId), { size: 50 });
          if (cancelled) return;
          const msgs: ChatMessage[] = Array.isArray(history) ? [...history].reverse() : [];

          let newestWithId: ChatMessage | undefined;
          for (const m of msgs) {
            if (m.id != null) { newestWithId = m; break; }
          }
          if (newestWithId?.id) {
            markLastRead(newestWithId.id);
            await markUserRead(uid, newestWithId.id, filterAgentId);
          }

          resetUnread();

          setMessagesSync(msgs);

          // 回放缓冲（欢迎语等）
          initComplete = true;
          for (const bMsg of messageBuffer) {
            handleWsMessage(bMsg);
          }

          // 追加离线提示（放在 welcome 之后，历史之前）
          const offlineName = filterAgentName || '';
          setMessagesSync((prev) => {
            const filtered = prev.filter((m) => !m._offlineBanner);
            const offlineBanner: ChatMessage = {
              content: offlineName,
              msgType: 'text',
              direction: 'agent',
              timestamp: new Date().toISOString(),
              _offlineBanner: true,
            };
            const welcomeIdx = filtered.findIndex((m) => m._welcome);
            if (welcomeIdx >= 0) {
              return [...filtered.slice(0, welcomeIdx + 1), offlineBanner, ...filtered.slice(welcomeIdx + 1)];
            }
            return [offlineBanner, ...filtered];
          });
        } else {
          // 🅰 🅱 正常逻辑：加载分配客服的历史
          const history = await fetchHistory(uid, String(assignedAgentId), { size: 50 });
          if (cancelled) return;
          const msgs: ChatMessage[] = Array.isArray(history) ? [...history].reverse() : [];

          let newestWithId: ChatMessage | undefined;
          for (const m of msgs) {
            if (m.id != null) { newestWithId = m; break; }
          }
          if (newestWithId?.id) {
            markLastRead(newestWithId.id);
            await markUserRead(uid, newestWithId.id, assignedAgentId);
          }

          resetUnread();

          setMessagesSync(msgs);

          // 回放缓冲（欢迎语等）
          initComplete = true;
          for (const bMsg of messageBuffer) {
            handleWsMessage(bMsg);
          }

          // 插入问候语
          const displayName = assignedAgentName ? `客服${assignedAgentName}` : '客服';
          setMessagesSync((prev) => {
            const filtered = prev.filter((m) => !m._greeting && !m._offlineBanner);
            const welcomeIdx = filtered.findIndex((m) => m._welcome);
            const greetingMsg: ChatMessage = {
              content: `${displayName},很高兴为您服务!`,
              msgType: 'text',
              direction: 'agent',
              timestamp: new Date().toISOString(),
              _greeting: true,
            };
            if (welcomeIdx >= 0) {
              // 在欢迎语之前（更低索引），这样 inverted 列表渲染到 welcome 下方
              return [...filtered.slice(0, welcomeIdx), greetingMsg, ...filtered.slice(welcomeIdx)];
            }
            return [greetingMsg, ...filtered];
          });
        }
      } else {
        // Ⓓ 无客服：如果有关联的未读客服（浮标），加载其历史
        if (filterAgentId) {
          const history = await fetchHistory(uid, String(filterAgentId), { size: 50 });
          if (cancelled) return;
          const msgs: ChatMessage[] = Array.isArray(history) ? [...history].reverse() : [];

          let newestWithId: ChatMessage | undefined;
          for (const m of msgs) {
            if (m.id != null) { newestWithId = m; break; }
          }
          if (newestWithId?.id) {
            markLastRead(newestWithId.id);
            await markUserRead(uid, newestWithId.id, filterAgentId);
          }

          resetUnread();

          setMessagesSync(msgs);

          // 回放缓冲（欢迎语等）
          initComplete = true;
          for (const bMsg of messageBuffer) {
            handleWsMessage(bMsg);
          }

          // 离线提示
          const offlineName = filterAgentName || '';
          setMessagesSync((prev) => {
            const filtered = prev.filter((m) => !m._offlineBanner);
            const offlineBanner: ChatMessage = {
              content: offlineName,
              msgType: 'text',
              direction: 'agent',
              timestamp: new Date().toISOString(),
              _offlineBanner: true,
            };
            const welcomeIdx = filtered.findIndex((m) => m._welcome);
            if (welcomeIdx >= 0) {
              return [...filtered.slice(0, welcomeIdx + 1), offlineBanner, ...filtered.slice(welcomeIdx + 1)];
            }
            return [offlineBanner, ...filtered];
          });
        } else {
          // 联系客服入口：只回放欢迎语
          initComplete = true;
          for (const bMsg of messageBuffer) {
            handleWsMessage(bMsg);
          }
        }
      }

      setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      setChatFocused(false);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [setMessagesSync, filterAgentId, filterAgentName, markLastRead, resetUnread, setChatFocused]);

  /* ── 发送文本 ── */
  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    setMessagesSync((prev) => [{
      content: text,
      msgType: 'text',
      direction: 'user',
      timestamp: new Date().toISOString(),
      _local: true,
    }, ...prev]);

    wsRef.current?.send(JSON.stringify({
      type: 'user_message',
      content: text,
      msgType: 'text',
      channelCode: 'app',
    }));

    setInputText('');
  };

  /* ── 上传文件/图片 ── */
  const uploadAndSend = async (file: { uri: string; type: string; name: string }) => {
    if (!wsRef.current) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      if (!result) {
        Alert.alert('上传失败', '图片上传失败，请重试');
        return;
      }
      const isImage = file.type.startsWith('image/');
      const msgType = isImage ? 'image' : 'file';

      setMessagesSync((prev) => [{
        content: file.name,
        msgType,
        direction: 'user',
        fileUrl: result.url,
        timestamp: new Date().toISOString(),
        _local: true,
      }, ...prev]);

      wsRef.current.send(JSON.stringify({
        type: 'user_message',
        content: file.name,
        msgType,
        fileUrl: result.url,
        channelCode: 'app',
      }));
    } catch {
      Alert.alert('上传失败', '图片上传异常，请重试');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      if (asset.uri) {
        uploadAndSend({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `image_${Date.now()}.jpg` });
      }
    } catch {
      // ignore
    }
  };

  /* ── 渲染气泡 ── */
  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = index > 0 ? messagesRef.current[index - 1] : null;
    const showTime = !prev ||
      Math.abs(new Date(item.timestamp || '').getTime() - new Date(prev.timestamp || '').getTime()) >= 5 * 60 * 1000;
    const isUser = item.direction === 'user';

    // 离线客服提示
    if (item._offlineBanner) {
      return (
        <View style={styles.offlineBannerContainer}>
          <Text style={styles.offlineBannerTitle}>
            当前消息为您与客服{item.content || ''}的离线消息
          </Text>
          <Text style={styles.offlineBannerSub}>
            重新进入可连接其它在线客服为您服务{'\n'}或继续离线消息回复
          </Text>
        </View>
      );
    }

    // 无客服提示
    if (item._noAgent) {
      return (
        <View style={styles.offlineBannerContainer}>
          <Text style={styles.offlineBannerTitle}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View>
        {showTime && (
          <View style={styles.timeDivider}>
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          </View>
        )}

        {!isUser ? (
          <View style={styles.agentRow}>
            <Pressable style={styles.agentAvatarCol} onPress={() => setDeselectKey((k) => k + 1)}>
              <View style={styles.agentAvatarBorder}>
                <Image source={require('../assets/customer_service_avatar.webp')} style={styles.agentAvatar} />
              </View>
            </Pressable>
            <View style={styles.agentContent}>
              {item.msgType === 'file' ? (
                <FileMsg url={item.fileUrl || ''} name={item.content} isUser={false} />
              ) : (
                <View style={styles.agentWrap}>
                  <View style={styles.agentTail} />
                  {item.msgType === 'image' ? (
                    <View style={styles.agentBubble}>
                      <ImageMsg url={getFullFileUrl(item.fileUrl || item.content)!} isUser={false} />
                    </View>
                  ) : isHtmlContent(item.content) ? (
                    <HtmlBubble html={item.content} />
                  ) : (
                    <View style={styles.agentBubble}>
                      <LinkedMessageText text={item.content} isUser={false} deselectKey={deselectKey} />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.userRow}>
            <View style={styles.userContent}>
              <View style={styles.userWrap}>
                {item.msgType === 'file' ? (
                  <FileMsg url={item.fileUrl || ''} name={item.content} isUser />
                ) : (
                  <>
                    {item.msgType === 'image' ? (
                      <View style={styles.userBubbleImage}>
                        <ImageMsg url={getFullFileUrl(item.fileUrl || item.content)!} isUser />
                      </View>
                    ) : (
                      <View style={styles.userBubble}>
                        <LinkedMessageText text={item.content} isUser deselectKey={deselectKey} />
                      </View>
                    )}
                    <View style={[styles.userTail, { borderLeftColor: item.msgType === 'image' ? '#fff' : '#2563eb' }]} />
                  </>
                )}
              </View>
            </View>
            <Pressable style={styles.userAvatarCol} onPress={() => setDeselectKey((k) => k + 1)}>
              <View style={styles.userAvatarBorder}>
                <Image source={require('../assets/user_avatar.webp')} style={styles.userAvatar} />
              </View>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>在线客服</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* 消息列表 */}
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>您好！欢迎来到在线客服</Text>
          <Text style={styles.emptySub}>请描述您的问题，我们会尽快为您解答</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item, index) => {
            if (item.id) return String(item.id);
            if (item.timestamp) return `${item.timestamp}-${item.direction}-${index}`;
            return String(index);
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 输入区 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage} disabled={uploading}>
          <Text style={styles.attachBtnText}>+</Text>
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="请输入您的问题..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!uploading}
        />
        {uploading ? (
          <View style={styles.uploadingBtn}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>发送</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#222',
    fontWeight: '500',
    lineHeight: 30,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  headerRight: {
    width: 36,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Offline Banner */
  offlineBannerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 18,
  },
  offlineBannerTitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 8,
  },
  offlineBannerSub: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* No Agent */

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  timeDivider: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#B8B8B8',
  },

  /* Agent message (left) */
  agentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginRight: 48,
  },
  agentAvatarCol: {
    width: 60,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(37,99,235,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  agentContent: {
    flex: 1,
  },
  agentWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  agentTail: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#fff',
    position: 'absolute',
    left: -8,
    marginTop: 18,
    zIndex: 2,
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
  agentLinkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  /* User message (right) */
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginLeft: 48,
  },
  userContent: {
    alignItems: 'flex-end',
  },
  userWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    zIndex: 1,
  },
  userBubbleImage: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 2,
    marginTop: 6,
    zIndex: 1,
  },
  userMsgText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  userLinkText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  userFileBubble: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  userFileTail: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    right: -8,
    marginTop: 18,
    zIndex: 2,
  },
  userTail: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    position: 'absolute',
    right: -8,
    marginTop: 18,
    zIndex: 2,
  },
  userAvatarCol: {
    width: 60,
    marginLeft: 8,
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
  },
  userAvatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(37,99,235,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  /* Input */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  attachBtnText: {
    fontSize: 22,
    color: '#666',
    lineHeight: 24,
    fontWeight: '600',
  },
  uploadingBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomerServiceScreen;
