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
  TextInput,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportActivation, setPrivacyAgreed, getDeviceInfo, initSdk } from '../device/appTrack';
import { ensureDeviceId } from '../device/deviceId';
import { fetchAppConfig } from '../config/appConfig';

const AGREEMENT_KEY = '@privacy_agreed';

const PrivacyAgreementModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hiddenByNav, setHiddenByNav] = useState(false);
  const [deviceInfoText, setDeviceInfoText] = useState('');
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    AsyncStorage.getItem(AGREEMENT_KEY)
      .then((value) => {
        if (value !== 'true') {
          setVisible(true);
        }
        setChecking(false);
      })
      .catch(() => {
        setVisible(true);
        setChecking(false);
      });
  }, []);

  // 监听导航状态：从协议页面返回时重新显示弹窗
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      if (hiddenByNav) {
        const routes = navigation.getState()?.routes || [];
        const currentRoute = routes[routes.length - 1]?.name;
        // 回到首页或 MainTabs 说明从协议页面返回了
        if (currentRoute === 'MainTabs') {
          setHiddenByNav(false);
          setVisible(true);
        }
      }
    });
    return unsubscribe;
  }, [navigation, hiddenByNav]);

  const handleCopy = () => {
    Clipboard.setString(deviceInfoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgree = async () => {
    await AsyncStorage.setItem(AGREEMENT_KEY, 'true');
    setVisible(false);

    // 1. 从服务端获取配置（BD_APP_ID 和 APP_SECRET）
    const config = await fetchAppConfig();

    // 2. 用服务端密钥初始化百度 oCPX SDK
    initSdk(config.bdAppId, config.appSecret || '');

    // 3. 通知百度 oCPX SDK 用户已同意隐私协议
    setPrivacyAgreed(true);

    // 4. release 模式上报激活事件
    reportActivation();

    // 5. 调试：显示可复制的设备信息弹窗
    try {
      const deviceInfo = await getDeviceInfo();
      const androidId = await ensureDeviceId();
      const text =
        `SDK: oCPX v2.4\n` +
        `OAID: ${deviceInfo?.oaid || 'null'}\n` +
        `ANDROID_ID: ${androidId || 'null'}\n` +
        `OAID支持: ${deviceInfo?.supported === true ? '是' : '否'}\n` +
        `GUID: ${deviceInfo?.guid || ''}`;
      setDeviceInfoText(text);
      setShowDeviceInfo(true);
    } catch {}
  };

  const handleDisagree = () => {
    BackHandler.exitApp();
  };

  const openUserAgreement = () => {
    setVisible(false);
    setHiddenByNav(true);
    navigation.navigate('UserAgreement');
  };

  const openPrivacy = () => {
    setVisible(false);
    setHiddenByNav(true);
    navigation.navigate('Privacy');
  };

  if (checking) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>同意隐私协议</Text>
            <Text style={styles.welcome}>欢迎使用火箭体育</Text>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <Text style={styles.bodyText}>
                为保障您的合法权益，给您提供更优质的服务体验，我们诚挚地告知：在您使用本APP各项功能服务前，请认真阅读
                <Text style={styles.link} onPress={openUserAgreement}>《用户服务协议》</Text>
                及
                <Text style={styles.link} onPress={openPrivacy}>《隐私政策》</Text>。
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
          </View>
        </View>
      </Modal>

      {/* 可复制的设备信息弹窗 */}
      <Modal visible={showDeviceInfo} transparent animationType="fade" statusBarTranslucent>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
        <View style={styles.overlay}>
          <View style={styles.devInfoContainer}>
            <Text style={styles.devInfoTitle}>设备标识</Text>
            <TextInput
              ref={inputRef}
              style={styles.devInfoText}
              value={deviceInfoText}
              multiline
              editable={false}
              selectTextOnFocus
            />
            <View style={styles.devInfoButtonRow}>
              <TouchableOpacity style={styles.devInfoButton} onPress={handleCopy}>
                <Text style={styles.devInfoButtonText}>{copied ? '已复制' : '复制'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devInfoButtonClose} onPress={() => setShowDeviceInfo(false)}>
                <Text style={styles.devInfoButtonCloseText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  devInfoContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  devInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  devInfoText: {
    fontSize: 13,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    textAlignVertical: 'top',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  devInfoButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  devInfoButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  devInfoButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  devInfoButtonClose: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
  },
  devInfoButtonCloseText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
});

export default PrivacyAgreementModal;
