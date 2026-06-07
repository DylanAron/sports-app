import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { colors, fonts } from '../theme';
import CornerListScreen from './corner/CornerListScreen';
import CornerDetailScreen from './corner/CornerDetailScreen';
import AiListScreen from './corner/AiListScreen';
import IntelligenceScreen from './corner/IntelligenceScreen';
import type { CornerItem } from '../services/cornerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ApiModule = 'corner' | 'goal' | 'half_full' | 'score' | 'win_lose';

const AI_ITEMS = [
  { key: 'corner', name: 'AI 角球', img: require('../assets/ai/ai_corner.jpg') },
  { key: 'goal', name: 'AI 进球', img: require('../assets/ai/ai_goal.jpg') },
  { key: 'half_full', name: 'AI 半全场', img: require('../assets/ai/ai_half_full.jpg') },
  { key: 'qingbao', name: 'AI 情报', img: require('../assets/ai/ai_qingbao.jpg') },
  { key: 'score', name: 'AI 比分', img: require('../assets/ai/ai_score.jpg') },
  { key: 'win_lose', name: 'AI 胜负', img: require('../assets/ai/ai_win_lose.jpg') },
];

const CARD_W = (SCREEN_WIDTH - 74) / 2;
const CARD_H = CARD_W * 1.2;

type PageState =
  | { type: 'home' }
  | { type: 'corner_list' }
  | { type: 'corner_detail'; id: number }
  | { type: 'ai_list'; module: ApiModule }
  | { type: 'intelligence' };

const HomeScreen: React.FC = () => {
  const [page, setPage] = useState<PageState>({ type: 'home' });

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

      <View style={styles.bgTop}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>AI 智能预测</Text>
          <Text style={styles.subtitle}>AI SPORTS PREDICTION</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {AI_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, { width: CARD_W, height: CARD_H }]}
            activeOpacity={0.8}
            onPress={() => handlePress(item.key)}>
            <Image source={item.img} style={styles.cardImg} resizeMode="contain" />
            {/* <Text style={styles.cardLabel}>{item.name}</Text> */}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: '100%', flex: 1, backgroundColor: '#f0f4f8', position: 'relative' },
  bgTop: { width: '100%', position: 'absolute', top: 40, left: 0, right: 0, height: '20%', backgroundColor: '#2563eb30', justifyContent: 'center', alignItems: 'center' },
  titleArea: { alignItems: 'center' },
  title: { fontSize: fonts.title, fontWeight: '800', color: colors.secondary, letterSpacing: 4 },
  subtitle: { fontSize: fonts.small, color: colors.textDim, letterSpacing: 6, marginTop: 4 },
  gridContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 20, backgroundColor: '#f0f4f8', borderTopLeftRadius: 30, borderTopRightRadius: 30, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  card: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8edf2',
    padding: 12,
    alignItems: 'center',
    // iOS阴影
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Android阴影
    elevation: 6,
  },
  cardImg: { flex: 1, width: '100%', borderRadius: 8 },
  cardLabel: { marginTop: 8, fontSize: fonts.regular, fontWeight: '600', color: colors.text },
});

export default HomeScreen;
