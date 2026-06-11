import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Image, ActivityIndicator, Dimensions, TouchableOpacity, Animated, Platform, ScrollView,
} from 'react-native';
import { colors, fonts } from '../theme';
import { analysisApi } from '../services/analysisService';
import type { AnalysisItem } from '../services/analysisService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_GAP = 0;
const SNAP_WIDTH = CARD_WIDTH + CARD_GAP;
const SIDE_OFFSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const CARD_HEIGHT = SCREEN_HEIGHT - 200;

const DEFAULT_HOME = require('../assets/ai/default_home_logo.webp');
const DEFAULT_AWAY = require('../assets/ai/default_away_logo.webp');

const LogoSafe = React.memo(({ uri, defaultImg, size }: { uri: string | null; defaultImg: any; size: number }) => {
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) return <Image source={defaultImg} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailed(true)} />;
});

const stripHtml = (html: string | null): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const AnalysisScreen: React.FC = () => {
  const [data, setData] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<Animated.FlatList<AnalysisItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const raw = await analysisApi.recent();
      // 预清洗 HTML 标签，避免渲染时反复正则
      setData(raw.map((item) => ({ ...item, _contentPlain: stripHtml(item.content) })));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      flatRef.current?.scrollToOffset({ offset: (currentIndex - 1) * SNAP_WIDTH, animated: true });
    }
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < data.length - 1) {
      flatRef.current?.scrollToOffset({ offset: (currentIndex + 1) * SNAP_WIDTH, animated: true });
    }
  }, [currentIndex, data.length]);

  const onScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SNAP_WIDTH);
    setCurrentIndex(Math.max(0, Math.min(index, data.length - 1)));
  };

  const renderItem = useCallback(({ item, index }: { item: AnalysisItem; index: number }) => {
    const inputRange = [
      (index - 1) * SNAP_WIDTH - 10,
      index * SNAP_WIDTH,
      (index + 1) * SNAP_WIDTH + 10,
    ];

    // 全部跑在原生线程，无 JS 线程开销
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1.0, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1.0, 0.5],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: 'clamp',
    });

    const plainContent = item._contentPlain || stripHtml(item.content);
    const isActive = index === currentIndex;

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          isActive ? styles.cardActive : styles.cardInactive,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}>
        <View style={styles.cardInner}>
          <View style={styles.leagueRow}>
            <Image source={item.leagueLogo ? { uri: item.leagueLogo } : DEFAULT_HOME} style={styles.leagueLogo} />
            <Text style={styles.leagueName}>{item.leagueName}</Text>
            <Text style={styles.matchDate}>{item.matchTime?.slice(0, 10) || ''}</Text>
          </View>

          <View style={styles.matchRow}>
            <View style={styles.teamCol}>
              <LogoSafe uri={item.homeLogo} defaultImg={DEFAULT_HOME} size={48} />
              <Text style={styles.teamName} numberOfLines={1}>{item.homeName}</Text>
            </View>
            <View style={styles.vsCol}>
              <Text style={styles.vsText}>VS</Text>
              {item.scoreResult && <Text style={styles.scoreResultText}>{item.scoreResult}</Text>}
            </View>
            <View style={styles.teamCol}>
              <LogoSafe uri={item.awayLogo} defaultImg={DEFAULT_AWAY} size={48} />
              <Text style={styles.teamName} numberOfLines={1}>{item.awayName}</Text>
            </View>
          </View>

          {(item.content || item._contentPlain) && (
            <View style={styles.contentBox}>
              <ScrollView
                style={styles.contentScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}>
                <Text style={styles.contentText}>{plainContent}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
    );
  }, [scrollX, currentIndex]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>赛事分析</Text>
        <Text style={styles.headerSubtitle}>MATCH ANALYSIS</Text>
      </View>

      <View style={styles.carouselArea}>
        <Animated.FlatList
          ref={flatRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingStart: SIDE_OFFSET,
            paddingEnd: SIDE_OFFSET - CARD_GAP,
            paddingTop: 30,
            paddingBottom: 50,
          }}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          snapToInterval={SNAP_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无分析数据</Text>
            </View>
          }
        />

        {/* 左右箭头 + 分页点，贴在卡片底部 */}
        <View style={styles.paginationRow}>
          <TouchableOpacity onPress={goPrev} disabled={currentIndex === 0} style={styles.arrowHit}>
            <Text style={[styles.arrowText, currentIndex === 0 && styles.arrowDisabled]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.pagination}>
            {data.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity onPress={goNext} disabled={currentIndex === data.length - 1} style={styles.arrowHit}>
            <Text style={[styles.arrowText, currentIndex === data.length - 1 && styles.arrowDisabled]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: fonts.title, fontWeight: '800', color: colors.secondary, letterSpacing: 4 },
  headerSubtitle: { fontSize: fonts.small, color: colors.textDim, letterSpacing: 6, marginTop: 4 },
  carouselArea: { flex: 1 },

  cardWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  cardInactive: {
    borderColor: '#eef1f5',
  },
  cardActive: {
    borderColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardInner: { flex: 1 },

  leagueRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  leagueLogo: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  leagueName: { fontSize: 13, fontWeight: '600', color: '#475569', flex: 1 },
  matchDate: { fontSize: 12, color: '#94a3b8' },

  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  teamCol: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginTop: 4 },
  vsCol: { alignItems: 'center', paddingHorizontal: 16 },
  vsText: { fontSize: 16, color: '#94a3b8', fontWeight: '800' },
  scoreResultText: { fontSize: 12, color: '#dc2626', fontWeight: '700', marginTop: 2 },

  contentBox: { paddingHorizontal: 16, paddingBottom: 16, flex: 1, minHeight: 120 },
  contentScroll: { flex: 1 },
  contentText: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  paginationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'absolute', bottom: 10, left: 0, right: 0,
  },
  arrowHit: { paddingHorizontal: 20, paddingVertical: 10 },
  arrowText: { fontSize: 28, color: '#2563eb', fontWeight: '600' },
  arrowDisabled: { color: '#cbd5e1' },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 5, marginHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d0d8e0' },
  dotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: '#2563eb' },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});

export default AnalysisScreen;
