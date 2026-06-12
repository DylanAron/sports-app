import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar, FlatList, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { colors, fonts } from '../theme';
import { bannerApi } from '../services';
import type { BannerItem } from '../services/bannerService';
import env from '../config/env';
import CornerListScreen from './corner/CornerListScreen';
import CornerDetailScreen from './corner/CornerDetailScreen';
import AiListScreen from './corner/AiListScreen';
import IntelligenceScreen from './corner/IntelligenceScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const AUTO_PLAY_INTERVAL = 3000;

type ApiModule = 'corner' | 'goal' | 'half_full' | 'score' | 'win_lose';

const AI_ITEMS = [
  { key: 'corner', name: 'AI 角球', img: require('../assets/ai/ai_corner.webp') },
  { key: 'goal', name: 'AI 进球', img: require('../assets/ai/ai_goal.webp') },
  { key: 'half_full', name: 'AI 半全场', img: require('../assets/ai/ai_half_full.webp') },
  { key: 'qingbao', name: 'AI 情报', img: require('../assets/ai/ai_qingbao.webp') },
  { key: 'score', name: 'AI 比分', img: require('../assets/ai/ai_score.webp') },
  { key: 'win_lose', name: 'AI 胜负', img: require('../assets/ai/ai_win_lose.webp') },
];

const CARD_W = (SCREEN_WIDTH - 74) / 2;

type PageState =
  | { type: 'home' }
  | { type: 'corner_list' }
  | { type: 'corner_detail'; id: number }
  | { type: 'ai_list'; module: ApiModule }
  | { type: 'intelligence' };

// 模拟环形漂移动画：6张卡每隔几秒轮流替换位置
const ringSteps = [
  [0, 1, 2, 3, 4, 5],
  [1, 2, 3, 4, 5, 0],
  [2, 3, 4, 5, 0, 1],
  [3, 4, 5, 0, 1, 2],
  [4, 5, 0, 1, 2, 3],
  [5, 0, 1, 2, 3, 4],
];

const HomeScreen: React.FC = () => {
  const [page, setPage] = useState<PageState>({ type: 'home' });
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [bannerHtmlContent, setBannerHtmlContent] = useState('');
  const bannerRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigation = useNavigation<any>();

  // 从接口获取轮播图
  useEffect(() => {
    bannerApi.getList()
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  // 自动轮播
  useEffect(() => {
    if (banners.length === 0) return;
    timerRef.current = setInterval(() => {
      const next = (bannerIndex + 1) % banners.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setBannerIndex(next);
    }, AUTO_PLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [bannerIndex, banners.length]);

  const onBannerScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / BANNER_WIDTH);
    setBannerIndex(index);
  };

  useFocusEffect(
    useCallback(() => {
      setPage({ type: 'home' });
    }, [])
  );

  if (page.type === 'corner_list') {
    return (
      <CornerListScreen
        onBack={() => setPage({ type: 'home' })}
        onDetail={(id) => setPage({ type: 'corner_detail', id })}
      />
    );
  }

  if (page.type === 'corner_detail') {
    return (
      <CornerDetailScreen
        id={page.id}
        onBack={() => setPage({ type: 'corner_list' })}
      />
    );
  }

  if (page.type === 'ai_list') {
    return (
      <AiListScreen
        module={page.module}
        onBack={() => setPage({ type: 'home' })}
      />
    );
  }

  if (page.type === 'intelligence') {
    return (
      <IntelligenceScreen onBack={() => setPage({ type: 'home' })} />
    );
  }

  const handleBannerPress = (banner: BannerItem) => {
    if (banner.jumpType === 2) {
      navigation.navigate('CustomerService');
    } else {
      // jumpType === 1 弹窗HTML
      // 修复 HTML 中的图片地址：将 localhost 或相对路径统一替换为真实 API 地址
      let html = banner.jumpContent || '';
      const baseUrl = env.API_BASE_URL;
      // 替换 localhost 开头的图片地址
      html = html.replace(/src=["']https?:\/\/localhost[^"']*?\/(profile\/[^"']*)["']/gi, (m, p1) => `src="${baseUrl}/${p1}"`);
      html = html.replace(/src=["']https?:\/\/127\.0\.0\.1[^"']*?\/(profile\/[^"']*)["']/gi, (m, p1) => `src="${baseUrl}/${p1}"`);
      // 替换相对路径开头（/profile/...），确保 baseUrl 生效
      html = html.replace(/src=["']\/(profile\/[^"']*)["']/gi, (m, p1) => `src="${baseUrl}/${p1}"`);
      setBannerHtmlContent(html);
      setBannerModalVisible(true);
    }
  };

  const handlePress = (key: string) => {
    if (key === 'qingbao') {
      setPage({ type: 'intelligence' });
    } else {
      setPage({ type: 'ai_list', module: key as ApiModule });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />

        <View style={styles.headerArea}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>AI 智能预测</Text>
            <Text style={styles.subtitle}>AI SPORTS PREDICTION</Text>
          </View>
        </View>

        {/* 轮播图 */}
        <View style={styles.bannerSection}>
          {banners.length > 0 && (
            <>
              <FlatList
                ref={bannerRef}
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={BANNER_WIDTH}
                decelerationRate="fast"
                onMomentumScrollEnd={onBannerScrollEnd}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handleBannerPress(item)}>
                    <Image source={{ uri: env.API_BASE_URL + item.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => String(item.id)}
              />
              <View style={styles.bannerDots}>
                {banners.map((_, idx) => (
                  <View key={idx} style={[styles.bannerDot, idx === bannerIndex && styles.bannerDotActive]} />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.gridContainer}>
          {AI_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.card, { width: CARD_W, height: CARD_W }]}
              activeOpacity={0.8}
              onPress={() => handlePress(item.key)}>
              <Image source={item.img} style={styles.cardImg} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </View>

        {/* HTML弹窗 */}
        <Modal visible={bannerModalVisible} transparent animationType="fade" statusBarTranslucent>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View style={{ width: '100%', height: '60%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20, position: 'relative' }}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setBannerModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <WebView
                originWhitelist={['*']}
                source={{ html: bannerHtmlContent, baseUrl: env.API_BASE_URL }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                javaScriptEnabled={false}
                domStorageEnabled={true}
                showsVerticalScrollIndicator={false}
                onMessage={() => {}}
              />
            </View>
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  headerArea: { paddingTop: 50, paddingBottom: 6, justifyContent: 'center', alignItems: 'center' },
  titleArea: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#2563eb', letterSpacing: 3 },
  subtitle: { fontSize: 11, color: '#94a3b8', letterSpacing: 5, marginTop: 3 },
  bannerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  bannerImg: { width: BANNER_WIDTH, height: 100, borderRadius: 14, resizeMode: 'contain' },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 6, gap: 6 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d0d8e0' },
  bannerDotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#2563eb' },
  modalCloseBtn: { position: 'absolute', top: 10, right: 14, zIndex: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 16, color: '#666', fontWeight: '700' },
  gridContainer: {
    paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, minHeight: 400,
  },
  card: {
    borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8edf2',
    padding: 4, alignItems: 'center',
    shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
    elevation: 6,
  },
  cardImg: { flex: 1, width: '100%', borderRadius: 8 },
  cardLabel: { marginTop: 8, fontSize: fonts.regular, fontWeight: '600', color: colors.text },
});

export default HomeScreen;
