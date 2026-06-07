import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing } from '../theme';

const mockNews = [
  {
    id: '1',
    category: 'NBA',
    title: '湖人队季后赛表现分析：詹姆斯状态火热',
    time: '2小时前',
    hot: true,
  },
  {
    id: '2',
    category: '英超',
    title: '曼城豪取联赛十连胜，冠军悬念再起',
    time: '3小时前',
    hot: true,
  },
  {
    id: '3',
    category: '西甲',
    title: '巴萨新星闪耀，未来十年核心已定',
    time: '5小时前',
    hot: false,
  },
  {
    id: '4',
    category: 'NBA',
    title: '交易截止日临近，多队酝酿大交易',
    time: '6小时前',
    hot: false,
  },
  {
    id: '5',
    category: '欧冠',
    title: '欧冠八强抽签揭晓，死亡半区诞生',
    time: '8小时前',
    hot: true,
  },
  {
    id: '6',
    category: '综合',
    title: '2026世界杯预选赛最新积分榜出炉',
    time: '10小时前',
    hot: false,
  },
];

const categories = ['全部', 'NBA', '英超', '西甲', '欧冠', '中超', '综合'];

const NewsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState('全部');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>体育资讯</Text>
        <Text style={styles.headerSubtitle}>SPORTS NEWS</Text>
      </View>

      {/* 分类导航 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}>
        {categories.map((cat) => (
          <View
            key={cat}
            style={[
              styles.categoryItem,
              activeCategory === cat && styles.categoryItemActive,
            ]}>
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat && styles.categoryTextActive,
              ]}
              onPress={() => setActiveCategory(cat)}>
              {cat}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 资讯列表 */}
      <ScrollView contentContainerStyle={styles.newsList}>
        {mockNews.map((news) => (
          <View key={news.id} style={styles.newsCard}>
            <View style={styles.newsTag}>
              <Text style={styles.newsTagText}>{news.category}</Text>
              {news.hot && (
                <View style={styles.hotTag}>
                  <Text style={styles.hotTagText}>HOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.newsTitle}>{news.title}</Text>
            <View style={styles.newsFooter}>
              <Text style={styles.newsTime}>{news.time}</Text>
              <Text style={styles.newsRead}>阅读全文 →</Text>
            </View>
            <View style={styles.newsBorder} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: fonts.small,
    color: colors.textDim,
    letterSpacing: 6,
    marginTop: 4,
  },
  categoryScroll: { maxHeight: 44, marginVertical: 12 },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  categoryItem: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryItemActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: fonts.regular,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  newsList: { paddingHorizontal: 16, paddingBottom: 20 },
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  newsTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  newsTagText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotTag: {
    marginLeft: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  newsTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTime: {
    fontSize: fonts.small,
    color: colors.textDim,
  },
  newsRead: {
    fontSize: fonts.small,
    color: colors.primary,
  },
  newsBorder: {
    marginTop: 12,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
});

export default NewsScreen;
