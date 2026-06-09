import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import {
  getUserId,
  fetchHistory,
  createWebSocketConnection,
  uploadFile,
  getFullFileUrl,
  type ChatMessage,
  type WsConnection,
} from '../services/chatService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';

const MAX_IMG_W = 220;
const MAX_IMG_H = 300;
const MIN_IMG_DIM = 80;

/** 自适应宽高的图片组件 */
const ImageMsg = ({ url, isUser }: { url: string; isUser: boolean }) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    Image.getSize(url, (w, h) => {
      let scaledW = w, scaledH = h;
      if (w > MAX_IMG_W) { scaledW = MAX_IMG_W; scaledH = (h / w) * MAX_IMG_W; }
      if (scaledH > MAX_IMG_H) { scaledH = MAX_IMG_H; scaledW = (scaledW / scaledH) * MAX_IMG_H; }
      setSize({ w: Math.round(scaledW), h: Math.round(scaledH) });
    }, () => setSize({ w: 200, h: 200 }));
  }, [url]);

  const imgStyle = size
    ? { width: size.w, height: size.h, borderRadius: 8 }
    : { width: 200, height: 200, borderRadius: 8 };

  // 用户图片：白底气泡容器
  if (isUser) {
    return (
      <View style={{ borderRadius: 8, padding: 2, marginTop: 6 }}>
        <Image source={{ uri: url }} style={imgStyle} resizeMode="contain" />
      </View>
    );
  }

  // 客服图片：保持白底气泡
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 2, marginTop: 6 }}>
      <Image source={{ uri: url }} style={imgStyle} resizeMode="contain" />
    </View>
  );
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

/** 判断两个时间戳是否跨5分钟 */
function isOver5Min(t1?: string, t2?: string): boolean {
  if (!t1 || !t2) return true;
  return Math.abs(new Date(t1).getTime() - new Date(t2).getTime()) >= 5 * 60 * 1000;
}

/** 判断字符串是否包含 HTML 标签 */
function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/** 渲染 HTML 内容（用于欢迎语等富文本） */
const HtmlBubble = ({ html }: { html: string }) => {
  const [h, setH] = useState(0);
  const source = useMemo(() => ({
    html: `<!DOCTYPE html><html>
<head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;padding:8px 12px;font-size:14px;line-height:1.5;color:#222;word-wrap:break-word;overflow-wrap:break-word}img{max-width:100%!important;height:auto}</style>
</head><body>
${html}
</body></html>`,
  }), [html]);

  const availWidth = Dimensions.get('window').width - 68 - 48 - 32;

  const js = `
(function(){
  var i = setInterval(function(){
    var h = document.body.scrollHeight;
    if(h > 0){ clearInterval(i); window.ReactNativeWebView.postMessage(''+h); }
  }, 50);
  setTimeout(function(){ clearInterval(i); }, 3000);
})();
`;

  return (
    <View style={[styles.agentBubble, { padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }]}>
      <WebView
        source={source}
        style={{ backgroundColor: '#fff', width: availWidth, height: h || 50 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        injectedJavaScript={js}
        onMessage={(e) => { const v = Number(e.nativeEvent.data); if (v > 0) setH(v); }}
      />
    </View>
  );
};

/** 文件消息气泡 */
const FileMsg = ({ url, name, isUser }: { url: string; name: string; isUser: boolean }) => {
  const fullUrl = getFullFileUrl(url) || url;
  const handlePress = () => {
    Linking.openURL(fullUrl).catch(() =>
      Alert.alert('提示', '无法打开文件链接'),
    );
  };
  const containerStyle = isUser ? styles.userBubble : styles.agentBubble;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={containerStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginRight: 8, color: isUser ? '#fff' : '#2563eb' }}>📎</Text>
        <Text
          style={{
            fontSize: 14,
            color: isUser ? '#fff' : '#222',
            flex: 1,
            textDecorationLine: 'underline',
          }}
          numberOfLines={2}
          ellipsizeMode="middle">
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

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
  const [uploading, setUploading] = useState(false);
  const imgSizesRef = useRef<Map<string, { w: number; h: number }>>(new Map());
  const insets = useSafeAreaInsets();

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

  // ── 上传并发送文件/图片 ──
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

      // 本地先行显示
      setMessages((prev) => [...prev, {
        content: file.name,
        msgType,
        direction: 'user',
        fileUrl: result.url,
        timestamp: new Date().toISOString(),
        _local: true,
      }]);
      scrollToBottom();

      wsRef.current.send(
        JSON.stringify({
          type: 'user_message',
          content: file.name,
          msgType,
          fileUrl: result.url,
          channelCode: 'app',
        }),
      );
    } catch (e) {
      console.error('uploadAndSend error:', e);
      Alert.alert('上传失败', '图片上传异常，请重试');
    } finally {
      setUploading(false);
    }
  };

  // ── 选择图片 ──
  const pickImage = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      if (asset.uri) {
        uploadAndSend({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        });
      }
    } catch (e) {
      console.warn('pickImage error:', e);
    }
  };

  // ── 点击图片按钮 ──
  const handleAttachmentPress = () => pickImage();

  // ── 渲染消息气泡 ──
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

        {!isUser ? (
          /* 客服消息 → 左对齐 */
          <View style={styles.agentRow}>
            <View style={styles.agentAvatarCol}>
              <View style={styles.agentAvatarBorder}>
                <Image source={require('../assets/customer_service_avatar.webp')} style={styles.agentAvatar} />
              </View>
            </View>
            <View style={styles.agentContent}>
              <View style={styles.agentWrap}>
                <View style={styles.agentTail} />
                {item.msgType === 'image' && item.fileUrl ? (
                  <ImageMsg url={getFullFileUrl(item.fileUrl)!} isUser={false} />
                ) : item.msgType === 'file' && item.fileUrl ? (
                  <FileMsg url={item.fileUrl} name={item.content} isUser={false} />
                ) : isHtmlContent(item.content) ? (
                  <HtmlBubble html={item.content} />
                ) : (
                  <View style={styles.agentBubble}>
                    <Text style={styles.msgText}>{item.content}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* 用户消息 → 右对齐 */
          <View style={styles.userRow}>
            <View style={styles.userContent}>
              <View style={styles.userWrap}>
                {item.msgType === 'image' && item.fileUrl ? (
                  <View style={styles.userBubbleImage}>
                    <ImageMsg url={getFullFileUrl(item.fileUrl)!} isUser={true} />
                  </View>
                ) : item.msgType === 'file' && item.fileUrl ? (
                  <FileMsg url={item.fileUrl} name={item.content} isUser={true} />
                ) : (
                  <View style={styles.userBubble}>
                    <Text style={styles.userMsgText}>{item.content}</Text>
                  </View>
                )}
                <View style={styles.userTail} />
              </View>
            </View>
            <View style={styles.userAvatarCol}>
              <View style={styles.userAvatarBorder}>
                <Image source={require('../assets/user_avatar.webp')} style={styles.userAvatar} />
              </View>
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
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 输入区 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={handleAttachmentPress} disabled={uploading}>
          <Text style={styles.attachBtnText}>+</Text>
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="请输入您的问题..."
          placeholderTextColor={colors.textDim}
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
            disabled={!inputText.trim()}>
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
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  agentBubbleImage: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 2,
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

  /* User bubble (right) */
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
  userMsgText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  userAvatarCol: {
    width: 60,
    marginLeft: 8,
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 0,
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

  /* Attach button */
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

  /* Uploading */
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
