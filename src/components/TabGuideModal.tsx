import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Modal, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import env from '../config/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  onContact: () => void;
}

const TabGuideModal: React.FC<Props> = ({ visible, imageUrl, onClose, onContact }) => {
  const imageW = SCREEN_WIDTH * 0.65;
  const [imageH, setImageH] = useState(imageW);

  useEffect(() => {
    if (imageUrl) {
      Image.getSize(
        env.API_BASE_URL + imageUrl,
        (w, h) => setImageH((h / w) * imageW),
        () => setImageH(imageW),
      );
    }
  }, [imageUrl]);

  const handleContact = () => {
    onContact();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.imageShadow}>
            <TouchableOpacity style={styles.imageWrapper} activeOpacity={0.9} onPress={handleContact}>
              <Image
                source={{ uri: env.API_BASE_URL + imageUrl }}
                style={{ width: imageW, height: imageH }}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <Text style={styles.contactText}>联系客服</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { alignItems: 'center' },
  imageShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 20,
    alignSelf: 'flex-start',
  },
  imageWrapper: {
    overflow: 'visible',
    position: 'relative',
    alignSelf: 'flex-start',
  },
  closeIcon: {
    position: 'absolute', top: -14, right: -14, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIconText: { fontSize: 16, color: '#fff', fontWeight: '600', lineHeight: 18 },
  contactBtn: {
    marginTop: 20, paddingHorizontal: 48, paddingVertical: 14,
    backgroundColor: '#2563eb', borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  contactText: { fontSize: 17, color: '#fff', fontWeight: '700', letterSpacing: 1 },
});

export default TabGuideModal;
