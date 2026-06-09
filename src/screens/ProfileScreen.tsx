import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { colors, fonts } from '../theme';
import { userApi, getToken, setToken, aiApi } from '../services';
import type { UserInfo } from '../services/userService';
import LoginScreen from './profile/LoginScreen';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [showLogin, setShowLogin] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [essay, setEssay] = useState('');
  const [showEssay, setShowEssay] = useState(false);

  const loadUser = async () => {
    if (!getToken()) return;
    try {
      const info = await userApi.getInfo();
      setUser(info);
    } catch { }
  };

  useEffect(() => {
    if (loggedIn) loadUser();
  }, [loggedIn]);

  const handleLoginSuccess = () => {
    setLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出', style: 'destructive', onPress: () => {
          setToken(undefined);
          setUser(null);
          setLoggedIn(false);
        },
      },
    ]);
  };

  const handleEdit = () => {
    setEditNickname(user?.nickname || '');
    setEditBio(user?.bio || '');
    setShowEdit(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await userApi.updateProfile({ nickname: editNickname, bio: editBio });
      setUser(updated);
      setShowEdit(false);
      Alert.alert('成功', '个人信息已更新');
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  const handleProfilePress = async () => {
    if (!loggedIn) { setShowLogin(true); return; }
    try {
      const res = await aiApi.getEssay();
      setEssay(res.content);
      setShowEssay(true);
    } catch {
      setEssay('生活如登山，每一步都是向上的力量。坚持梦想，勇往直前。');
      setShowEssay(true);
    }
  };

  const menuItems = loggedIn ? [
    { icon: '👤', label: '个人资料', onPress: handleProfilePress },
    { icon: '🔔', label: '消息通知', onPress: () => setShowEssay(true), badge: '' },
    { icon: '❓', label: '帮助与反馈', onPress: () => navigation.navigate('Help') },
    { icon: 'ℹ️', label: '关于我们', onPress: () => navigation.navigate('About') },
    { icon: '📞', label: '联系客服', onPress: () => navigation.navigate('CustomerService') },
    { icon: '🔒', label: '隐私协议', onPress: () => navigation.navigate('Privacy') },
    { icon: '📄', label: '用户协议', onPress: () => navigation.navigate('UserAgreement') },
  ] : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的</Text>
          <Text style={styles.headerSubtitle}>PROFILE</Text>
        </View>

        {loggedIn && user ? (
          <>
            <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress}>
              <View style={styles.avatar}>
                {user.avatar ? (
                  <Text style={styles.avatarText}>{user.nickname?.charAt(0) || 'U'}</Text>
                ) : (
                  <Text style={styles.avatarText}>{user.nickname?.charAt(0) || 'U'}</Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{user.nickname || '用户'}</Text>
                <Text style={styles.userDesc}>{user.bio || '体育世界 尽在掌握'}</Text>
              </View>
              <TouchableOpacity style={styles.editBadge} onPress={handleEdit}>
                <Text style={styles.editText}>编辑</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.menuCard}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity key={idx} onPress={item.onPress}>
                  <View style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                  </View>
                  {idx < menuItems.length - 1 && <View style={styles.menuDivider} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.profileCard} onPress={() => setShowLogin(true)}>
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={[styles.avatarText, { color: colors.textDim }]}>?</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>点击登录</Text>
                <Text style={styles.userDesc}>登录后享受完整功能</Text>
              </View>
              <Text style={[styles.menuArrow, { fontSize: 24 }]}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuCard}>
              {[
                { icon: '❓', label: '帮助与反馈', onPress: () => navigation.navigate('Help') },
                { icon: 'ℹ️', label: '关于我们', onPress: () => navigation.navigate('About') },
                { icon: '📞', label: '联系客服', onPress: () => navigation.navigate('CustomerService') },
                { icon: '🔒', label: '隐私协议', onPress: () => navigation.navigate('Privacy') },
                { icon: '📄', label: '用户协议', onPress: () => navigation.navigate('UserAgreement') },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} onPress={item.onPress}>
                  <View style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                  </View>
                  {idx < 4 && <View style={styles.menuDivider} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.version}>火箭体育 v1.0.0</Text>
      </ScrollView>

      <Modal visible={showLogin} animationType="slide">
        <LoginScreen onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />
      </Modal>

      <Modal visible={showEdit} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>编辑个人信息</Text>
            <Text style={styles.fieldLabel}>昵称</Text>
            <TextInput
              style={styles.modalInput}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="请输入昵称"
              placeholderTextColor={colors.textDim}
            />
            <Text style={styles.fieldLabel}>个人介绍</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="介绍一下自己"
              placeholderTextColor={colors.textDim}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showEssay} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEssay(false)}>
          <View style={styles.essayBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.essayTitle}>{essay ? '✨ 每日励志' : '📭 消息通知'}</Text>
            {essay ? (
              <Text style={styles.essayContent}>{essay}</Text>
            ) : (
              <View style={styles.emptyMsg}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>暂无消息</Text>
              </View>
            )}
            <TouchableOpacity style={styles.essayBtn} onPress={() => setShowEssay(false)}>
              <Text style={styles.essayBtnText}>{essay ? '收下这份鼓励' : '知道了'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 30 },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: fonts.title, fontWeight: '800', color: colors.secondary, letterSpacing: 4 },
  headerSubtitle: { fontSize: fonts.small, color: colors.textDim, letterSpacing: 6, marginTop: 4 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 16, marginBottom: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight,
    borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarPlaceholder: { borderColor: colors.textDim },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  profileInfo: { marginLeft: 14, flex: 1 },
  username: { fontSize: fonts.large, fontWeight: '700', color: colors.text },
  userDesc: { fontSize: fonts.small, color: colors.textDim, marginTop: 2 },
  editBadge: {
    backgroundColor: colors.surfaceLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
  },
  editText: { fontSize: fonts.small, color: colors.primary },
  menuCard: {
    marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { fontSize: fonts.medium, color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textDim },
  menuDivider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 48 },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontSize: fonts.medium, color: colors.danger, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: fonts.small, color: colors.textDim, marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 32, width: '80%' },
  modalTitle: { fontSize: fonts.large, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' },
  fieldLabel: { fontSize: fonts.small, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  modalInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: fonts.regular,
    color: colors.text, marginBottom: 14,
  },
  modalInputMultiline: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  modalCancelText: { fontSize: fonts.regular, color: colors.textDim },
  modalConfirmBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  modalConfirmText: { fontSize: fonts.regular, color: '#fff', fontWeight: '600' },
  essayBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, marginHorizontal: 32, alignItems: 'center' },
  essayTitle: { fontSize: fonts.large, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  essayContent: { fontSize: fonts.regular, color: colors.text, lineHeight: 26, textAlign: 'center', marginBottom: 20 },
  essayBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  essayBtnText: { fontSize: fonts.medium, color: '#fff', fontWeight: '600' },
  emptyMsg: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: fonts.medium, color: colors.textDim },
});

export default ProfileScreen;
