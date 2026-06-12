import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { cornerApi } from '../../services';
import type { CornerItem } from '../../services/cornerService';

interface Props {
  id: number;
  onBack: () => void;
}

const DEFAULT_LEAGUE = require('../../assets/ai/default_league.webp');
const DEFAULT_HOME = require('../../assets/ai/default_home_logo.webp');
const DEFAULT_AWAY = require('../../assets/ai/default_away_logo.webp');
const HIT_IMG = require('../../assets/ishit.webp');
const UNHIT_IMG = require('../../assets/unhit.webp');

const LogoSafe = ({ uri, defaultImg, size }: { uri: string | null; defaultImg: any; size: number }) => {
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) {
    return <Image source={defaultImg} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setFailed(true)}
    />
  );
};

const CornerDetailScreen: React.FC<Props> = ({ id, onBack }) => {
  const [data, setData] = useState<CornerItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cornerApi.detail(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#94a3b8' }}>数据不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      {/* 返回按钮 - 浮在顶部 */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ====== 上半部分：title + 描述 ====== */}
        <View style={styles.topSection}>
          {/* 联赛信息 */}
          <View style={styles.leagueInfo}>
            <LogoSafe uri={data.leagueLogo} defaultImg={DEFAULT_LEAGUE} size={52} />
            <Text style={styles.topLeagueName}>{data.leagueName || '未知联赛'}</Text>
            <Text style={styles.topMatchDate}>{data.matchDate?.substring(0, 10) || ''}</Text>
          </View>

          {/* 球队对阵 */}
          <View style={styles.topMatch}>
            <View style={styles.topTeamBox}>
              <LogoSafe uri={data.homeLogo} defaultImg={DEFAULT_HOME} size={52} />
              <Text style={styles.topTeamName}>{data.homeName}</Text>
            </View>
            <View style={styles.topVsBox}>
              {(data as any).result ? <Text style={styles.topScoreText}>{(data as any).result}</Text> : null}
              <Text style={styles.topVsText}>VS</Text>
              {data.isHit !== -1 && (
                <Image
                  source={data.isHit === 1 ? HIT_IMG : UNHIT_IMG}
                  style={styles.topHitCorner}
                />
              )}
            </View>
            <View style={styles.topTeamBox}>
              <LogoSafe uri={data.awayLogo} defaultImg={DEFAULT_AWAY} size={52} />
              <Text style={styles.topTeamName}>{data.awayName}</Text>
            </View>
          </View>

          {/* 预测描述 */}
          <View style={styles.predictionDesc}>
            <Text style={styles.predictionLabel}>赛事预测</Text>
            <Text style={styles.predictionText}>
              {data.recommendContent || '暂无推荐分析内容'}
            </Text>
          </View>
        </View>

        {/* ====== 下半部分：今日预测 + 历史战绩 ====== */}
        <View style={styles.bottomSection}>

          {/* 今日预测 */}
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.dotLine} />
              <Text style={styles.bottomCardTitle}>今日预测</Text>
            </View>
            <Text style={styles.bottomPrediction}>
              {data.leagueName} {data.homeName} vs {data.awayName}
            </Text>
            <Text style={styles.bottomPredictionDesc}>
              推荐内容：{data.recommendContent || '暂无'}
            </Text>
          </View>

          {/* 历史战绩 - 模拟数据 */}
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.dotLine} />
              <Text style={styles.bottomCardTitle}>历史战绩</Text>
            </View>
            <View style={styles.historyRow}>
              <Text style={styles.historyLabel}>近10场胜率</Text>
              <View style={styles.historyBar}>
                <View style={[styles.historyFill, { width: '60%', backgroundColor: '#2563eb' }]} />
              </View>
              <Text style={styles.historyValue}>{data.homeName} 60%</Text>
            </View>
            <View style={styles.historyRow}>
              <Text style={styles.historyLabel}>近10场胜率</Text>
              <View style={styles.historyBar}>
                <View style={[styles.historyFill, { width: '40%', backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.historyValue}>{data.awayName} 40%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { paddingBottom: 30 },

  /* 返回按钮 */
  backBtn: {
    position: 'absolute', top: 50, left: 12, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  backText: { fontSize: 15, color: '#ffffff', fontWeight: '600' },

  /* ===== 上半部分 ===== */
  topSection: {
    backgroundColor: '#1e3a5f',
    paddingTop: 90,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  leagueInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  topLeagueName: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginLeft: 8, fontWeight: '500' },
  topMatchDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 12 },

  topMatch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  topTeamBox: { alignItems: 'center', flex: 1 },
  topTeamName: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginTop: 8 },
  topVsBox: { alignItems: 'center', paddingHorizontal: 24 },
  topVsText: { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  topScoreText: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  topHitCorner: { width: 65, height: 65, marginTop: 8 },

  predictionDesc: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  predictionLabel: { fontSize: 13, fontWeight: '700', color: '#93c5fd', marginBottom: 6 },
  predictionText: { fontSize: 14, color: '#ffffff', lineHeight: 22 },

  /* ===== 下半部分 ===== */
  bottomSection: { paddingHorizontal: 16, paddingTop: 20 },
  bottomCard: {
    backgroundColor: '#ffffff', borderRadius: 14,
    paddingVertical: 18, paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  bottomCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dotLine: { width: 4, height: 18, backgroundColor: '#2563eb', borderRadius: 2, marginRight: 10 },
  bottomCardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  bottomPrediction: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginBottom: 6 },
  bottomPredictionDesc: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  historyLabel: { fontSize: 12, color: '#64748b', width: 80 },
  historyBar: { flex: 1, height: 8, backgroundColor: '#eef1f5', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  historyFill: { height: '100%', borderRadius: 4 },
  historyValue: { fontSize: 12, color: '#64748b', width: 90, textAlign: 'right' },
});

export default CornerDetailScreen;
