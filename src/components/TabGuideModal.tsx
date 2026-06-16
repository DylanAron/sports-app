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
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
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
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: env.API_BASE_URL + imageUrl }}
                style={{ width: imageW, height: imageH }}
                resizeMode="contain"
                onLoadEnd={() => setImageLoaded(true)}
              />
              {imageLoaded && (
                <>
                  <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                    <Text style={styles.closeIconText}>✕</Text>
                  </TouchableOpacity>
                  <View style={styles.contactBtnOuter}>
                    <TouchableOpacity style={styles.contactBtn} onPress={handleContact} activeOpacity={0.8}>
                      <Text style={styles.contactText}>联系客服</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
          {!imageLoaded && (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>加载中...</Text>
            </View>
          )}
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
    position: 'absolute', top: -18, right: -18, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIconText: { fontSize: 16, color: '#fff', fontWeight: '600', lineHeight: 18 },
  contactBtnOuter: {
    marginTop: 16,
    alignSelf: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
    borderRadius: 22,
  },
  contactBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  placeholder: { alignItems: 'center', justifyContent: 'center', height: 50 },
  placeholderText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});

export default TabGuideModal;
