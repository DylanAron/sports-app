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
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { reportActivation, setPrivacyAgreed, getDeviceInfo, initSdk } from '../device/appTrack';
import { ensureDeviceId } from '../device/deviceId';
import { activationApi, PACKAGE_ID } from '../services';
import env from '../config/env';

const AGREEMENT_KEY = '@privacy_agreed';
const SDK_INIT_KEY = '@sdk_initialized';
/** 激活防重标记，上报成功后写入 */
const ACTIVATION_REPORTED_KEY = '@activation_reported';
// 百度 oCPX SDK 配置（同意隐私后初始化）
const BD_APP_ID = 22870;
const APP_SECRET = '0ce63b2c2dee0b50c6664c6d7b7e166c';

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
    const checkPrivacy = async () => {
      // 1. 先检查原生层（SplashActivity 写入的 SharedPreferences）
      let nativeAgreed = false;
      if (NativeModules.PrivacyModule) {
        try {
          nativeAgreed = await NativeModules.PrivacyModule.hasUserAgreed();
        } catch {
          // 原生模块异常，降级到 AsyncStorage
        }
      }

      if (nativeAgreed) {
        // 原生层已弹出过隐私弹窗且用户同意了
        // JS 侧不需要再次弹窗，但必须静默初始化 SDK
        await initExistingSession();
        setChecking(false);
        return;
      }

      // 2. 降级：检查旧的 JS 层 AsyncStorage（版本升级兼容）
      let legacyAgreed = false;
      try {
        legacyAgreed = (await AsyncStorage.getItem(AGREEMENT_KEY)) === 'true';
      } catch {
        // AsyncStorage 异常
      }

      if (legacyAgreed) {
        // 旧版本已同意过，静默初始化 SDK（不弹窗）
        await initExistingSession();
        setChecking(false);
        return;
      }

      // 3. 从未同意过，显示弹窗
      setVisible(true);
      setChecking(false);
    };

    checkPrivacy();
  }, []);

  /** 非首次启动：用户已同意过，静默初始化 SDK */
  const initExistingSession = async () => {
    await initSdk(BD_APP_ID, APP_SECRET);
    setPrivacyAgreed(true);
    // 尝试上报激活（防重标记控制，已上报过则跳过）
    await tryReportActivation();
  };

  /**
   * 尝试上报激活事件，防重标记 `@activation_reported` 确保只上报一次。
   * - 已上报过 → 跳过
   * - 上报失败 → 不写标记，下次启动自动重试
   */
  const tryReportActivation = async () => {
    try {
      const alreadyReported = await AsyncStorage.getItem(ACTIVATION_REPORTED_KEY);
      if (alreadyReported === 'true') {
        console.log('[Activation] 已上报过，跳过');
        return;
      }

      // 1. 百度归因激活上报
      try {
        await reportActivation();
        console.log('[Activation] 百度归因上报成功');
      } catch (e) {
        // debug 模式下 SDK 主动跳过初始化，预期会失败，不打印错误
        if (!__DEV__) {
          console.error('[Activation] 百度归因上报失败:', e);
        }
      }

      // 2. 自有业务激活上报
      try {
        const deviceId = await ensureDeviceId();
        await activationApi.report({
          deviceId,
          marketId: 1,
          packageId: PACKAGE_ID,
        });
        console.log('[Activation] 自有业务上报成功');

        // 全部成功后写防重标记
        await AsyncStorage.setItem(ACTIVATION_REPORTED_KEY, 'true');
      } catch (e) {
        console.error('[Activation] 自有业务激活上报失败:', e);
      }
    } catch (e) {
      console.error('[Activation] 激活上报异常:', e);
    }
  };

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

    // 1. 初始化百度 oCPX SDK（测试包自动跳过，等待初始化完成）
    try {
      await initSdk(BD_APP_ID, APP_SECRET);
    } catch {
      // SDK 初始化失败不影响后续
    }

    // 2. 通知 SDK 用户已同意隐私协议
    setPrivacyAgreed(true);

    // 3. 上报激活事件（百度归因 + 自有业务）
    await tryReportActivation();

    // 4. 归因调试弹窗：环境变量 SHOW_ATTRIBUTION_DEBUG 控制
    if (env.SHOW_ATTRIBUTION_DEBUG) {
      try {
        const deviceInfo = await getDeviceInfo();
        const androidId = await ensureDeviceId();
        const text =
          `SDK: oCPX v2.7.3\n` +
          `Android: ${deviceInfo?.sdkInt || ''} (${deviceInfo?.brand || ''} ${deviceInfo?.model || ''})\n` +
          `OAID: ${deviceInfo?.oaid || 'null'}\n` +
          `ANDROID_ID: ${androidId || 'null'}\n` +
          `GUID: ${deviceInfo?.guid || ''}`;
        setDeviceInfoText(text);
        setShowDeviceInfo(true);
      } catch {}
    }
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
