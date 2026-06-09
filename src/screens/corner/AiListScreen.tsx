import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, Image } from 'react-native';
import { cornerApi, goalApi, scoreApi, halfFullApi, winLoseApi } from '../../services';
import type { CornerItem } from '../../services/cornerService';

const DEFAULT_LEAGUE = require('../../assets/ai/default_league_logo.webp');
const DEFAULT_HOME = require('../../assets/ai/default_home_logo.webp');
const DEFAULT_AWAY = require('../../assets/ai/default_away_logo.webp');

type ApiModule = 'corner' | 'goal' | 'half_full' | 'score' | 'win_lose';

const MODULE_LABELS: Record<ApiModule, string> = {
  corner: '角球预测',
  goal: '进球预测',
  half_full: '半全场预测',
  score: '比分预测',
  win_lose: '胜负预测',
};

const APIS: Record<ApiModule, any> = {
  corner: cornerApi,
  goal: goalApi,
  half_full: halfFullApi,
  score: scoreApi,
  win_lose: winLoseApi,
};

const LogoSafe = ({ uri, defaultImg, size }: { uri: string | null; defaultImg: any; size: number }) => {
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) {
    return <Image source={defaultImg} style={{ width: size, height: size, borderRadius: size / 2 ,resizeMode: 'contain'}} />;
  }
  return (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 ,resizeMode: 'contain'}} onError={() => setFailed(true)} />
  );
};

interface Props {
  module: ApiModule;
  onBack: () => void;
}

const AiListScreen: React.FC<Props> = ({ module, onBack }) => {
  const [todayData, setTodayData] = useState<CornerItem[]>([]);
  const [historyData, setHistoryData] = useState<CornerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  const loadData = async () => {
    try {
      const apiFn = APIS[module];
      const [todayRes, historyRes] = await Promise.all([
        apiFn.list({ page: 1, pageSize: 50, isTodayData: 1 }),
        apiFn.list({ page: 1, pageSize: 50, isTodayData: 0 }),
      ]);
      setTodayData(todayRes.list || []);
      setHistoryData(historyRes.list || []);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [module]);

  const renderItem = ({ item }: { item: CornerItem }) => {
    const detail = item as any;
    return (
      <View style={styles.card}>
        <View style={styles.leagueRow}>
          <LogoSafe uri={item.leagueLogo} defaultImg={DEFAULT_LEAGUE} size={52} />
          <Text style={styles.leagueName}>{item.leagueName}</Text>
          <Text style={styles.matchDate}>{item.matchDate?.substring(5, 10) || ''}</Text>
        </View>

        <View style={styles.matchRow}>
          <View style={styles.teamSide}>
            <LogoSafe uri={item.homeLogo} defaultImg={DEFAULT_HOME} size={52} />
            <Text style={styles.teamName} numberOfLines={1}>{item.homeName}</Text>
          </View>
          <View style={styles.vsCol}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.teamSide}>
            <LogoSafe uri={item.awayLogo} defaultImg={DEFAULT_AWAY} size={52} />
            <Text style={styles.teamName} numberOfLines={1}>{item.awayName}</Text>
          </View>
        </View>

        {/* 半全场比分 */}
        {module === 'half_full' && detail.halfScore && (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>半场 {detail.halfScore}  全场 {detail.fullScore}</Text>
          </View>
        )}

        {/* 命中/未中标记 - 历史战绩 */}
        {activeTab === 'history' && item.isHit !== -1 && (
          <View style={styles.hitRow}>
            <Text style={[styles.hitBadge, item.isHit === 1 ? styles.hitYes : styles.hitNo]}>
              {item.isHit === 1 ? '✓ 命中' : '✗ 未中'}
            </Text>
          </View>
        )}

        {/* 推荐内容 */}
        <View style={styles.recommendRow}>
          <Text style={styles.recommendIcon}>📌</Text>
          <Text style={styles.recommendText} numberOfLines={2}>{item.recommendContent || '暂无推荐'}</Text>
        </View>
      </View>
    );
  };

  const currentData = activeTab === 'today' ? todayData : historyData;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{MODULE_LABELS[module]}</Text>
        <View style={styles.headerBack} />
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}>
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            今日赛事预测
          </Text>
          {todayData.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'today' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'today' && styles.tabBadgeTextActive]}>{todayData.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            历史战绩
          </Text>
          {historyData.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'history' && styles.tabBadgeTextActive]}>{historyData.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>暂无数据</Text></View>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 4, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef1f5' },
  headerBack: { width: 50, alignItems: 'center' },
  backArrow: { fontSize: 32, color: '#1e293b', lineHeight: 34 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  // Tab
  tabBar: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f5f7fa', marginRight: 10 },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  tabBadge: { marginLeft: 6, backgroundColor: '#eef1f5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  tabBadgeTextActive: { color: '#ffffff' },
  // List
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  leagueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leagueName: { fontSize: 12, color: '#64748b', marginLeft: 6, fontWeight: '500', flex: 1 },
  matchDate: { fontSize: 11, color: '#94a3b8' },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamSide: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  vsCol: { alignItems: 'center', paddingHorizontal: 16 },
  vsText: { fontSize: 14, color: '#94a3b8', fontWeight: '800' },
  scoreRow: { alignItems: 'center', marginTop: 8, paddingVertical: 4, backgroundColor: '#f8fafc', borderRadius: 6 },
  scoreText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  hitRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  hitBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  hitYes: { backgroundColor: '#dcfce7', color: '#16a34a' },
  hitNo: { backgroundColor: '#fee2e2', color: '#dc2626' },
  recommendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  recommendIcon: { fontSize: 12, marginRight: 6 },
  recommendText: { fontSize: 12, color: '#2563eb', fontWeight: '500', flex: 1 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});

export default AiListScreen;
