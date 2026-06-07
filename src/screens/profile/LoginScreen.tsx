import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { colors, fonts } from '../../theme';
import { userApi } from '../../services';
import { setToken } from '../../utils/request';

type Mode = 'login' | 'register';

interface Props {
  onLoginSuccess: () => void;
  onClose: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess, onClose }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) { Alert.alert('提示', '请输入用户名'); return; }
    if (!password.trim()) { Alert.alert('提示', '请输入密码'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await userApi.login({ username, password });
        setToken(res.token);
        Alert.alert('成功', '登录成功');
      } else {
        const res = await userApi.register({ username, password, nickname: nickname || undefined });
        setToken(res.token);
        Alert.alert('成功', '注册成功');
      }
      onLoginSuccess();
    } catch (e: any) {
      Alert.alert('失败', e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{mode === 'login' ? '欢迎回来' : '创建账号'}</Text>
        <Text style={styles.subtitle}>SPORTS WORLD</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>用户名</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入用户名"
            placeholderTextColor={colors.textDim}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入密码"
            placeholderTextColor={colors.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {mode === 'register' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>昵称（选填）</Text>
            <TextInput
              style={styles.input}
              placeholder="给自己取个名字"
              placeholderTextColor={colors.textDim}
              value={nickname}
              onChangeText={setNickname}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{mode === 'login' ? '登录' : '注册'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.toggleText}>
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  closeText: { fontSize: 18, color: colors.textDim },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: fonts.title, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textDim, letterSpacing: 6, marginTop: 6 },
  form: { paddingHorizontal: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: fonts.regular, color: colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: fonts.medium, color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: fonts.large, fontWeight: '700', color: '#fff' },
  toggleText: { textAlign: 'center', marginTop: 20, fontSize: fonts.regular, color: colors.primary },
});

export default LoginScreen;
