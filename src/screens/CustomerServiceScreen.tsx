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
} from 'react-native';
import { colors, fonts } from '../theme';
import {
  getUserId,
  fetchHistory,
  createWebSocketConnection,
  type ChatMessage,
  type WsConnection,
} from '../services/chatService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

/** 判断两个时间戳是否跨5分钟 */
function isOver5Min(t1?: string, t2?: string): boolean {
  if (!t1 || !t2) return true;
  return Math.abs(new Date(t1).getTime() - new Date(t2).getTime()) >= 5 * 60 * 1000;
}

/** 格式化时间 HH:mm */
function formatTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const CustomerServiceScreen: React.FC<Props> = ({ navigation }) => {
  const userId = getUserId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [agentAssigned, setAgentAssigned] = useState(false);
  const [noAgent, setNoAgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WsConnection | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const historyLoadedRef = useRef(false);
  const pendingRef = useRef<ChatMessage[]>([]);
  const agentIdRef = useRef<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    setLoading(true);
    setConnected(false);
    setAgentAssigned(false);
    setNoAgent(false);
    setMessages([]);
    setCurrentAgentId(null);
    historyLoadedRef.current = false;
    pendingRef.current = [];
    agentIdRef.current = null;

    // 建立 WebSocket 连接，等分配客服后再按 agentId 过滤历史
    const ws = createWebSocketConnection(userId, {
      onOpen: () => setConnected(true),
      onMessage: (msg) => {
        if (msg.type === 'system' && msg.agent_assigned) {
          const assignedAgentId = msg.agent_assigned;
          agentIdRef.current = assignedAgentId;
          setCurrentAgentId(assignedAgentId);
          setAgentAssigned(true);
          setNoAgent(false);

          // 分配成功后，按 agentId 加载历史消息，避免串到其他客服的聊天记录
          fetchHistory(userId, assignedAgentId).then((history) => {
            setMessages([...history, ...pendingRef.current]);
            pendingRef.current = [];
            historyLoadedRef.current = true;
            setLoading(false);
            scrollToBottom();
          });
        } else if (msg.type === 'system' && msg.no_agent) {
          setNoAgent(true);
          historyLoadedRef.current = true;
          setLoading(false);
        } else if (msg.type === 'agent_message') {
          const newMsg: ChatMessage = {
            content: msg.content || '',
            msgType: (msg.msgType as 'text' | 'image' | 'file') || 'text',
            direction: (msg.direction as 'user' | 'agent') || 'agent',
            fileUrl: msg.fileUrl,
            timestamp: msg.timestamp,
            agentId: msg.agentId,
            _local: false,
          };
          if (!historyLoadedRef.current) {
            pendingRef.current.push(newMsg);
          } else {
            setMessages((prev) => {
              if (msg.timestamp && prev.find((m) => m.timestamp === msg.timestamp)) return prev;
              return [...prev, newMsg];
            });
          }
          scrollToBottom();
        } else if (msg.type === 'welcome_message') {
          const welcomeMsg: ChatMessage = {
            content: msg.content || '',
            msgType: 'text',
            direction: 'agent',
            _welcome: true,
          } as ChatMessage;
          if (!historyLoadedRef.current) {
            pendingRef.current.push(welcomeMsg);
          } else {
            setMessages((prev) => [...prev, welcomeMsg]);
          }
          scrollToBottom();
        }
      },
      onClose: () => setConnected(false),
    });
    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [userId, scrollToBottom]);

  // 新消息时滚动到底部
  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !wsRef.current) return;

    const localMsg: ChatMessage = {
      content: text,
      msgType: 'text',
      direction: 'user',
      timestamp: new Date().toISOString(),
      _local: true,
    };
    setMessages((prev) => [...prev, localMsg]);
    scrollToBottom();

    wsRef.current.send(
      JSON.stringify({
        type: 'user_message',
        content: text,
        msgType: 'text',
        channelCode: 'app',
      }),
    );

    setInputText('');
    inputRef.current?.focus();
  };

  // 渲染消息气泡
  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showTime = !prev || isOver5Min(prev.timestamp || prev.createdAt, item.timestamp || item.createdAt);
    const isUser = item.direction === 'user';

    return (
      <View>
        {showTime && (
          <View style={styles.timeDivider}>
            <Text style={styles.timeText}>{formatTime(item.timestamp || item.createdAt)}</Text>
          </View>
        )}

        {/* 客服消息 → 左对齐 */}
        {!isUser && (
          <View style={styles.agentRow}>
            <View style={styles.agentAvatar}>
              <Text style={styles.agentAvatarText}>
                {item.agentId ? `客${item.agentId}` : '客'}
              </Text>
            </View>
            <View style={styles.agentBubble}>
              {item.msgType === 'image' && item.fileUrl ? (
                <Text style={styles.msgText}>{item.content}</Text>
              ) : item.msgType === 'file' && item.fileUrl ? (
                <Text style={styles.msgText}>📎 {item.content}</Text>
              ) : (
                <Text style={styles.msgText}>{item.content}</Text>
              )}
            </View>
          </View>
        )}

        {/* 用户消息 → 右对齐 */}
        {isUser && (
          <View style={styles.userRow}>
            <View style={styles.userBubble}>
              <Text style={styles.userMsgText}>{item.content}</Text>
            </View>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>我</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>在线客服</Text>
          <Text style={styles.headerSub}>
            {connected ? (agentAssigned ? '在线' : noAgent ? '暂无客服在线' : '等待分配...') : '连接中...'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* 消息列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>您好！欢迎来到在线客服</Text>
          <Text style={styles.emptySub}>
            {noAgent
              ? '当前没有在线客服，您可留言，我们会尽快回复您'
              : '请描述您的问题，我们会尽快为您解答'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* 输入区 */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="请输入您的问题..."
          placeholderTextColor={colors.textDim}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}>
          <Text style={styles.sendBtnText}>发送</Text>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
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
    color: colors.primary,
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
  headerSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
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

  /* Messages */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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

  /* Agent bubble (left) */
  agentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginRight: 48,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  agentAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    maxWidth: '80%',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },

  /* User bubble (right) */
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginLeft: 48,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  userBubble: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    borderTopRightRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  userMsgText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
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
    backgroundColor: '#4A90D9',
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
});

export default CustomerServiceScreen;
