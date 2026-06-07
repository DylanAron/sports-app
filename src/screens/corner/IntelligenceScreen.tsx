import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { intelligenceApi } from '../../services';
import type { IntelligenceItem } from '../../services/otherServices';

interface Props {
  onBack: () => void;
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const wd = weekDays[d.getDay()];
  return { monthDay: `${month}月${day}日`, weekDay: `周${wd}` };
};

const IntelligenceScreen: React.FC<Props> = ({ onBack }) => {
  const [data, setData] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const list = await intelligenceApi.recent();
      setData(list);
      if (list.length > 0) setSelectedId(list[0].id);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const selected = data.find(item => item.id === selectedId);

  const renderItem = ({ item }: { item: IntelligenceItem }) => {
    const { monthDay, weekDay } = formatDate(item.intelDate);
    const isActive = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[styles.dateItem, isActive && styles.dateItemActive]}
        onPress={() => setSelectedId(item.id)}>
        <Text style={[styles.dateMonthDay, isActive && styles.dateTextActive]}>{monthDay}</Text>
        <Text style={[styles.dateWeekDay, isActive && styles.dateTextActive]}>{weekDay}</Text>
        {isActive && <View style={styles.dateDot} />}
      </TouchableOpacity>
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* 头部 */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 情报</Text>
        <View style={styles.headerBack} />
      </View>

      {/* 日期横向滚动 */}
      <View style={styles.dateSection}>
        <FlatList
          horizontal
          data={data}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
      </View>

      {/* 情报内容 */}
      {selected ? (
        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentDate}>{selected.intelDate}</Text>
            <View style={styles.tagBg}>
              <Text style={styles.tagText}>AI 情报分析</Text>
            </View>
          </View>
          <Text style={styles.contentText}>{selected.content}</Text>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无情报数据</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 4,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef1f5',
  },
  headerBack: { width: 50, alignItems: 'center' },
  backArrow: { fontSize: 32, color: '#1e293b', lineHeight: 34 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  dateSection: {
    backgroundColor: '#ffffff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef1f5',
  },
  dateList: { paddingHorizontal: 16, gap: 8 },
  dateItem: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#f5f7fa', marginRight: 8,
    minWidth: 64,
  },
  dateItemActive: { backgroundColor: '#2563eb' },
  dateMonthDay: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  dateWeekDay: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  dateTextActive: { color: '#ffffff' },
  dateDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffff', marginTop: 4 },
  contentCard: {
    margin: 16, backgroundColor: '#ffffff', borderRadius: 14, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,

  flex: 1
  },
  contentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  contentDate: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  tagBg: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#2563eb', fontWeight: '600' },
  contentText: { fontSize: 14, color: '#1e293b', lineHeight: 24 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});

export default IntelligenceScreen;
