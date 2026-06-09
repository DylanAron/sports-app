import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Image, FlatList, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import { colors, fonts } from '../theme';
import { analysisApi } from '../services/analysisService';
import type { AnalysisItem } from '../services/analysisService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_GAP = 0;
const SNAP_WIDTH = CARD_WIDTH + CARD_GAP;
const SIDE_OFFSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const DEFAULT_HOME = require('../assets/ai/default_home_logo.webp');
const DEFAULT_AWAY = require('../assets/ai/default_away_logo.webp');

const LogoSafe = ({ uri, defaultImg, size }: { uri: string | null; defaultImg: any; size: number }) => {
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) return <Image source={defaultImg} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailed(true)} />;
};

const AnalysisScreen: React.FC = () => {
  const [data, setData] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await analysisApi.recent()); } catch { setData([]); } finally { setLoading(false); }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const offset = (currentIndex - 1) * SNAP_WIDTH;
      flatRef.current?.scrollToOffset({ offset, animated: true });
    }
  };

  const goNext = () => {
    if (currentIndex < data.length - 1) {
      const offset = (currentIndex + 1) * SNAP_WIDTH;
      flatRef.current?.scrollToOffset({ offset, animated: true });
    }
  };

  const onScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SNAP_WIDTH);
    setCurrentIndex(Math.max(0, Math.min(index, data.length - 1)));
  };

  const renderItem = ({ item, index }: { item: AnalysisItem; index: number }) => {
    const inputRange = [
      (index - 1) * SNAP_WIDTH - 10,
      index * SNAP_WIDTH,
      (index + 1) * SNAP_WIDTH + 10,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.82, 1.05, 0.82],
      extrapolate: 'clamp',
    });

    const cardOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1.0, 0.5],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, -10, 20],
      extrapolate: 'clamp',
    });

    const border = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const borderColor = border.interpolate({
      inputRange: [0, 1],
      outputRange: ['#eef1f5', '#2563eb'],
    });

    const shadowOpacityVal = scrollX.interpolate({
      inputRange,
      outputRange: [0.06, 0.4, 0.06],
      extrapolate: 'clamp',
    });

    const shadowElevation = scrollX.interpolate({
      inputRange,
      outputRange: [3, 12, 3],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            width: CARD_WIDTH,
            marginRight: CARD_GAP,
            transform: [{ scale }, { translateY }],
            opacity: cardOpacity,
            borderColor,
            shadowOpacity: shadowOpacityVal,
            elevation: shadowElevation,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => {
            if (index !== currentIndex) flatRef.current?.scrollToIndex({ index, animated: true });
          }}>
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

            {item.content && (
              <View style={styles.contentBox}>
                <View >
                  <Text style={styles.contentText}>{item.content.replace(/<[^>]*>/g, '')}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        <FlatList
          ref={flatRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingStart: SIDE_OFFSET, paddingEnd: SIDE_OFFSET - CARD_GAP, paddingTop: 50, paddingBottom: 20 }}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          snapToInterval={SNAP_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>暂无分析数据</Text></View>}
        />
      </View>

      {/* 底部箭头 - 无背景色，直接透出 */}
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
  },
  cardInner: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },

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

  contentBox: { paddingHorizontal: 16, paddingBottom: 16 },
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
