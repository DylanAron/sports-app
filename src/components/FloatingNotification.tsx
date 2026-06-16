import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChatUnread } from '../contexts/ChatUnreadContext';

export default function FloatingNotification() {
  const { unreadCount, latestAgentId, latestAgentName } = useChatUnread();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      // 脉冲放大缩小
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.35, duration: 800, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(bounceAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [unreadCount, scaleAnim, opacityAnim, bounceAnim]);

  if (unreadCount === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('CustomerService', {
            filterAgentId: latestAgentId,
            filterAgentName: latestAgentName,
          });
        }}>
        {/* 脉冲光圈 */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
        {/* 图标主体 */}
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: bounceAnim }] }]}>
          <Text style={styles.iconText}>📬</Text>
        </Animated.View>
        {/* 未读计数 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    right: 16,
    zIndex: 9999,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  iconText: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
});
