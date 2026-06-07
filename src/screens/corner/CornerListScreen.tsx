import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, RefreshControl, Image } from 'react-native';
import { cornerApi } from '../../services';
import type { CornerItem } from '../../services/cornerService';

interface Props {
  onBack: () => void;
  onDetail: (id: number) => void;
}

const DEFAULT_LEAGUE = require('../../assets/ai/default_league.png');
const DEFAULT_HOME = require('../../assets/ai/default_home_logo.png');
const DEFAULT_AWAY = require('../../assets/ai/default_away_logo.png');

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

const CornerListScreen: React.FC<Props> = ({ onBack, onDetail }) => {
  const [data, setData] = React.useState<CornerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await cornerApi.list({ page: 1, pageSize: 20 });
      setData(res.list);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const renderItem = ({ item }: { item: CornerItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onDetail(item.id)}>
      {/* 联赛名称 */}
      <View style={styles.leagueRow}>
        <LogoSafe uri={item.leagueLogo} defaultImg={DEFAULT_LEAGUE} size={52} />
        <Text style={styles.leagueName}>{item.leagueName}</Text>
      </View>

      {/* 对阵 */}
      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <LogoSafe uri={item.homeLogo} defaultImg={DEFAULT_HOME} size={52} />
          <Text style={styles.teamName} numberOfLines={1}>{item.homeName}</Text>
        </View>
        <View style={styles.vsCol}>
          <Text style={styles.vsText}>VS</Text>
          {item.isHit !== -1 && (
            <Text style={[styles.hitBadge, item.isHit === 1 ? styles.hitYes : styles.hitNo]}>
              {item.isHit === 1 ? '✓ 命中' : '✗ 未中'}
            </Text>
          )}
        </View>
        <View style={styles.teamSide}>
          <LogoSafe uri={item.awayLogo} defaultImg={DEFAULT_AWAY} size={52} />
          <Text style={styles.teamName} numberOfLines={1}>{item.awayName}</Text>
        </View>
      </View>

      {/* 推荐 */}
      {item.recommendContent ? (
        <View style={styles.recommendRow}>
          <Text style={styles.recommendIcon}>📌</Text>
          <Text style={styles.recommendText}>{item.recommendContent}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

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
      {/* 头部 */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>角球预测</Text>
        <View style={styles.headerBack} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>暂无角球数据</Text></View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#eef1f5',
  },
  headerBack: { width: 50, alignItems: 'center' },
  backArrow: { fontSize: 32, color: '#1e293b', lineHeight: 34 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  leagueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leagueName: { fontSize: 12, color: '#64748b', marginLeft: 6, fontWeight: '500' },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamSide: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginTop: 6 },
  vsCol: { alignItems: 'center', paddingHorizontal: 16 },
  vsText: { fontSize: 14, color: '#94a3b8', fontWeight: '800', marginBottom: 4 },
  hitBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  hitYes: { backgroundColor: '#dcfce7', color: '#16a34a' },
  hitNo: { backgroundColor: '#fee2e2', color: '#dc2626' },
  recommendRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
    backgroundColor: '#f8fafc', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
  },
  recommendIcon: { fontSize: 12, marginRight: 6 },
  recommendText: { fontSize: 12, color: '#2563eb', fontWeight: '500', flex: 1 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});

export default CornerListScreen;
