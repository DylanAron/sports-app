import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { contentApi } from '../services';

const HelpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    contentApi.getHelp().then(res => {
      const styled = `
        <html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; color: #1e293b; background: #fff; font-size: 15px; line-height: 1.8; }
          h2 { color: #2563eb; font-size: 22px; margin-bottom: 16px; }
          h3 { color: #1e293b; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          p { color: #475569; margin-bottom: 12px; }
        </style>
        </head><body>${res.content}</body></html>`;
      setHtml(styled);
    }).catch(() => setError(true));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>帮助与反馈</Text>
        <View style={styles.placeholder} />
      </View>
      {html ? (
        <WebView source={{ html }} style={styles.webview} />
      ) : (
        <View style={styles.loading}>
          {error ? (
            <Text style={styles.errorText}>加载失败，请稍后重试</Text>
          ) : (
            <ActivityIndicator size="large" color="#2563eb" />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8, elevation: 3,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { fontSize: 28, color: '#222', fontWeight: '500', lineHeight: 30 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, color: '#222', fontWeight: '600' },
  placeholder: { width: 36 },
  webview: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: '#999' },
});

export default HelpScreen;
