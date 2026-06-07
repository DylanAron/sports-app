import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { colors, fonts } from '../theme';

type CustomerServiceModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({ visible, onClose }) => {
  const [message, setMessage] = React.useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      // 可以连接真实的客服 API，这里仅作展示
      setMessage('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>客服中心</Text>
            <Text style={styles.headerSub}>CUSTOMER SERVICE</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 客服信息卡片 */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>联系我们</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📧 邮箱</Text>
              <Text style={styles.infoValue}>support@sportsapp.com</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📞 电话</Text>
              <Text style={styles.infoValue}>400-888-8888</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🕐 工作时间</Text>
              <Text style={styles.infoValue}>每天 9:00 - 21:00</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL('tel:4008888888')}>
              <Text style={styles.callBtnText}>拨打客服电话</Text>
            </TouchableOpacity>
          </View>

          {/* 快捷问题 */}
          <Text style={styles.quickTitle}>常见问题</Text>
          <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
            {[
              '如何查看比分直播？',
              '如何投诉不良内容？',
              '如何联系客服？',
              '忘记密码怎么办？',
              '如何获取更多赛事信息？',
            ].map((q, idx) => (
              <TouchableOpacity key={idx} style={styles.faqItem}>
                <Text style={styles.faqText}>{q}</Text>
                <Text style={styles.faqArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 留言输入 */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="输入您的问题..."
              placeholderTextColor={colors.textDim}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!message.trim()}>
              <Text style={styles.sendBtnText}>发送</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.primaryDim,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    position: 'relative',
  },
  headerTitle: {
    fontSize: fonts.xlarge,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: fonts.small,
    color: colors.textDim,
    letterSpacing: 4,
    marginTop: 2,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  infoTitle: {
    fontSize: fonts.medium,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: fonts.regular,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fonts.regular,
    color: colors.text,
    fontWeight: '500',
  },
  callBtn: {
    marginTop: 12,
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callBtnText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  quickTitle: {
    fontSize: fonts.medium,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  faqList: {
    marginHorizontal: 16,
    maxHeight: 160,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  faqText: {
    fontSize: fonts.regular,
    color: colors.textSecondary,
  },
  faqArrow: {
    fontSize: 20,
    color: colors.textDim,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fonts.regular,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default CustomerServiceModal;
