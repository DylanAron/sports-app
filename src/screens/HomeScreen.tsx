import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import CornerListScreen from './corner/CornerListScreen';
import CornerDetailScreen from './corner/CornerDetailScreen';
import AiListScreen from './corner/AiListScreen';
import IntelligenceScreen from './corner/IntelligenceScreen';
import type { CornerItem } from '../services/cornerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ApiModule = 'corner' | 'goal' | 'half_full' | 'score' | 'win_lose';

const AI_ITEMS = [
  { key: 'corner', name: 'AI 角球', img: require('../assets/ai/ai_corner.png') },
  { key: 'goal', name: 'AI 进球', img: require('../assets/ai/ai_goal.png') },
  { key: 'half_full', name: 'AI 半全场', img: require('../assets/ai/ai_half_full.png') },
  { key: 'qingbao', name: 'AI 情报', img: require('../assets/ai/ai_qingbao.png') },
  { key: 'score', name: 'AI 比分', img: require('../assets/ai/ai_score.png') },
  { key: 'win_lose', name: 'AI 胜负', img: require('../assets/ai/ai_win_lose.png') },
];

const BANNER_IMAGES = [
  require('../assets/carousel1.png'),
  require('../assets/carousel2.png'),
  require('../assets/carousel3.png'),
  require('../assets/carousel4.png'),
];
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const AUTO_PLAY_INTERVAL = 3000;

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
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 自动轮播
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const next = (bannerIndex + 1) % BANNER_IMAGES.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setBannerIndex(next);
    }, AUTO_PLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [bannerIndex]);

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
          <FlatList
            ref={bannerRef}
            data={BANNER_IMAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={onBannerScrollEnd}
            renderItem={({ item }) => (
              <Image source={item} style={styles.bannerImg} resizeMode="cover" />
            )}
            keyExtractor={(_, idx) => String(idx)}
          />
          <View style={styles.bannerDots}>
            {BANNER_IMAGES.map((_, idx) => (
              <View key={idx} style={[styles.bannerDot, idx === bannerIndex && styles.bannerDotActive]} />
            ))}
          </View>
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
