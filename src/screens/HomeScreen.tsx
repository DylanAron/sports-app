import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import env from '../config/env';
import CornerListScreen from './corner/CornerListScreen';
import CornerDetailScreen from './corner/CornerDetailScreen';
import AiListScreen from './corner/AiListScreen';
import IntelligenceScreen from './corner/IntelligenceScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const bgSource = require('../assets/bg.png');
const CARD_W = (SCREEN_WIDTH - 60) / 2;

// ai_ 图片
const aiImages: Record<string, any> = {
  corner: require('../assets/ai/ai_corner.webp'),
  goal: require('../assets/ai/ai_goal.webp'),
  half_full: require('../assets/ai/ai_half_full.webp'),
  qingbao: require('../assets/ai/ai_qingbao.webp'),
  score: require('../assets/ai/ai_score.webp'),
  win_lose: require('../assets/ai/ai_win_lose.webp'),
};

type ApiModule = 'corner' | 'goal' | 'half_full' | 'score' | 'win_lose';

interface AiModel {
  key: string;
  name: string;
  imageKey: string;
  corner?: ApiModule;
}

const AI_MODELS: AiModel[] = [
  { key: 'corner', name: '角球预测', imageKey: 'corner', corner: 'corner' },
  { key: 'goal', name: '进球数预测', imageKey: 'goal', corner: 'goal' },
  { key: 'half_full', name: '半全场狙击', imageKey: 'half_full', corner: 'half_full' },
  { key: 'qingbao', name: '绝密赛事情报', imageKey: 'qingbao' },
  { key: 'score', name: '比分预测', imageKey: 'score', corner: 'score' },
  { key: 'win_lose', name: '胜负预测', imageKey: 'win_lose', corner: 'win_lose' },
];

type PageState =
  | { type: 'home' }
  | { type: 'corner_list' }
  | { type: 'corner_detail'; id: number }
  | { type: 'ai_list'; module: ApiModule }
  | { type: 'intelligence' };

const HomeScreen: React.FC = () => {
  const [page, setPage] = useState<PageState>({ type: 'home' });
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [bannerHtmlContent, setBannerHtmlContent] = useState('');
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const hasCalledReady = useRef(false);

  useEffect(() => {
    // 首页渲染完成，通知引导弹窗
    if (!hasCalledReady.current) {
      hasCalledReady.current = true;
      route.params?.onPageReady?.();
    }
  }, [route.params?.onPageReady]);

  useFocusEffect(
    useCallback(() => { setPage({ type: 'home' }); }, [])
  );

  if (page.type === 'corner_list') return <CornerListScreen onBack={() => setPage({ type: 'home' })} onDetail={(id) => setPage({ type: 'corner_detail', id })} />;
  if (page.type === 'corner_detail') return <CornerDetailScreen id={page.id} onBack={() => setPage({ type: 'corner_list' })} />;
  if (page.type === 'ai_list') return <AiListScreen module={page.module} onBack={() => setPage({ type: 'home' })} />;
  if (page.type === 'intelligence') return <IntelligenceScreen onBack={() => setPage({ type: 'home' })} />;

  const handleModelPress = (model: AiModel) => {
    if (model.key === 'qingbao') { setPage({ type: 'intelligence' }); return; }
    if (model.corner) setPage({ type: 'ai_list', module: model.corner });
    else setPage({ type: 'ai_list', module: 'corner' as ApiModule });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f0fe" />

      {/* 全局背景图 */}
      <Image source={bgSource} style={styles.bgImage} resizeMode="cover" />

      {/* 顶部留白 */}
      <View style={styles.header} />

      {/* 模型卡片网格 - 每行2个，共3行，撑满剩余空间 */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {AI_MODELS.map((model) => (
            <TouchableOpacity key={model.key} style={styles.card} activeOpacity={0.85} onPress={() => handleModelPress(model)}>
              <Image source={aiImages[model.imageKey]} style={styles.cardImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* HTML弹窗 */}
      <Modal visible={bannerModalVisible} transparent animationType="fade" statusBarTranslucent>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', height: '60%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20, position: 'relative' }}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setBannerModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <WebView originWhitelist={['*']} source={{ html: bannerHtmlContent, baseUrl: env.API_BASE_URL }} style={{ flex: 1, backgroundColor: 'transparent' }} javaScriptEnabled={false} domStorageEnabled={true} showsVerticalScrollIndicator={false} onMessage={() => {}} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f0fe' },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: SCREEN_WIDTH, height: '100%' },
  header: { paddingTop: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    width: CARD_W,
    height: CARD_W,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#fff',
  },
  cardImage: { width: '100%', height: '100%', borderRadius: 16 },
  modalCloseBtn: { position: 'absolute', top: 10, right: 14, zIndex: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 16, color: '#666', fontWeight: '700' },
});

export default HomeScreen;
