import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserAgreementHtml } from '../utils/agreementContent';

const AGREEMENT_KEY = '@privacy_agreed';
const PRIVACY_URL = 'https://6hlot.com/privacy/';

type SubView = 'main' | 'privacy' | 'agreement';

const PrivacyAgreementModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [subView, setSubView] = useState<SubView>('main');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(AGREEMENT_KEY).then((value) => {
      if (value !== 'true') {
        setVisible(true);
      }
      setChecking(false);
    });
  }, []);

  const handleAgree = async () => {
    await AsyncStorage.setItem(AGREEMENT_KEY, 'true');
    setVisible(false);
    setSubView('main');
  };

  const handleDisagree = () => {
    BackHandler.exitApp();
  };

  const openSubView = (view: SubView) => {
    setSubView(view);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (checking) return null;

  const renderMainContent = () => (
    <>
      <Text style={styles.title}>同意隐私协议</Text>
      <Text style={styles.welcome}>欢迎使用火箭体育</Text>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <Text style={styles.bodyText}>
          为保障您的合法权益，给您提供更优质的服务体验，我们诚挚地告知：在您使用本APP各项功能服务前，请认真阅读
          <Text style={styles.link} onPress={() => openSubView('agreement')}>《用户服务协议》</Text>
          及
          <Text style={styles.link} onPress={() => openSubView('privacy')}>《隐私政策》</Text>。
          {'\n\n'}
          我们将严格遵循合法、正当、必要的原则，仅收集、使用为保障APP正常运行、实现核心服务所需的必要个人信息，全力保护您的个人信息安全与隐私权益，绝不会非法收集、滥用、泄露您的个人数据。
          {'\n\n'}
          您的确认即代表您已充分阅读、理解并同意上述协议与政策内容。我们将持续保障您的隐私安全，为您提供安全、可靠的使用服务。
        </Text>
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.disagreeBtn} onPress={handleDisagree}>
          <Text style={styles.disagreeBtnText}>不同意</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agreeBtn} onPress={handleAgree}>
          <Text style={styles.agreeBtnText}>同意并继续</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSubView = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.subBackBtn} onPress={() => setSubView('main')}>
          <Text style={styles.subBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>
          {subView === 'privacy' ? '隐私政策' : '用户服务协议'}
        </Text>
        <View style={styles.subPlaceholder} />
      </View>
      <View style={styles.webviewContainer}>
        {subView === 'privacy' ? (
          <WebView
            source={{ uri: PRIVACY_URL }}
            style={styles.webview}
            startInLoadingState
          />
        ) : (
          <WebView
            source={{ html: getUserAgreementHtml() }}
            style={styles.webview}
            startInLoadingState
          />
        )}
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} bounces={false}>
            {subView === 'main' ? renderMainContent() : renderSubView()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  // ── Main ──
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 240,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  disagreeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
  },
  disagreeBtnText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  agreeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  agreeBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  // ── Sub View (协议详情) ──
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBackArrow: {
    fontSize: 28,
    color: '#222',
    fontWeight: '500',
    lineHeight: 30,
  },
  subTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  subPlaceholder: {
    width: 36,
  },
  webviewContainer: {
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PrivacyAgreementModal;
